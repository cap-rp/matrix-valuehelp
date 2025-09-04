import hash from "sap/base/strings/hash";
import type AppComponent from "sap/fe/core/AppComponent";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { EnvironmentCapabilitiesService } from "sap/fe/core/services/EnvironmentServiceFactory";
import type UIComponent from "sap/ui/core/UIComponent";
import CacheManager from "sap/ui/core/cache/CacheManager";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import jQuery from "sap/ui/thirdparty/jquery";
import type { ServiceContext } from "types/metamodel_types";

async function getMetadataETag(sUrl: string, sETag: string, mUpdatedMetaModelETags: Record<string, string | null>): Promise<boolean> {
	return new Promise<boolean>(function (resolve): void {
		// There is an Url in the FE cache, that's not in the MetaModel yet -> we need to check the ETag
		jQuery
			.ajax(sUrl, { method: "GET" })
			.done(function (oResponse: unknown, sTextStatus: string, jqXHR: jQuery.XHR) {
				// ETag is not the same -> invalid
				// ETag is the same -> valid
				// If ETag is available use it, otherwise use Last-Modified
				mUpdatedMetaModelETags[sUrl] = jqXHR.getResponseHeader("ETag") || jqXHR.getResponseHeader("Last-Modified");
				resolve(sETag === mUpdatedMetaModelETags[sUrl]);
			})
			.fail(function () {
				// Case 2z - Make sure we update the map so that we invalidate the cache
				mUpdatedMetaModelETags[sUrl] = "";
				resolve(false);
			});
	});
}
type CacheHandlerServiceSettings = {
	metaModel: ODataMetaModel;
};

export class CacheHandlerService extends Service<CacheHandlerServiceSettings> {
	initPromise!: Promise<this>;

	oFactory!: CacheHandlerServiceFactory;

	oMetaModel!: ODataMetaModel;

	oAppComponent!: AppComponent;

	oComponent!: UIComponent;

	mCacheNeedsInvalidate!: Record<string, unknown>;

	init(): void {
		const oContext = this.getContext();
		this.oFactory = oContext.factory;
		const mSettings = oContext.settings;
		if (!mSettings.metaModel) {
			throw new Error("a `metaModel` property is expected when instantiating the CacheHandlerService");
		}
		this.oMetaModel = mSettings.metaModel;
		this.oAppComponent = mSettings.appComponent;
		this.oComponent = mSettings.component;
		this.initPromise = this.oMetaModel.fetchEntityContainer().then(() => {
			return this;
		});
		this.mCacheNeedsInvalidate = {};
	}

	exit(): void {
		// Deregister global instance
		this.oFactory.removeGlobalInstance(this.oMetaModel);
	}

	async validateCacheKey(
		sCacheIdentifier: string,
		oComponent: TemplateComponent,
		environmentService: EnvironmentCapabilitiesService
	): Promise<string | null> {
		// Keep track if the cache will anyway need to be updated
		let bCacheNeedUpdate = true;
		let sCacheKey: string | null;

		try {
			const mCacheOutput = await CacheManager.get(sCacheIdentifier);
			// We provide a default key so that an xml view cache is written
			const mMetaModelETags = this.getETags(oComponent, environmentService);
			sCacheKey = JSON.stringify(mMetaModelETags);
			// Case #1a - No cache, so mCacheOuput is empty, cacheKey = current metamodel ETags
			if (mCacheOutput) {
				// Case #2 - Cache entry found, check if it's still valid
				const mUpdatedMetaModelETags: Record<string, string | null> = {};
				const mCachedETags = JSON.parse(mCacheOutput.cachedETags);
				const aValidETags = await Promise.all(
					Object.keys(mCachedETags).map(async function (sUrl: string) {
						// Check validity of every single Url that's in the FE Cache object
						if (mCachedETags[sUrl]) {
							if (mMetaModelETags[sUrl]) {
								// Case #2a - Same number of ETags in the cache and in the metadata
								mUpdatedMetaModelETags[sUrl] = mMetaModelETags[sUrl];
								return mCachedETags[sUrl] === mMetaModelETags[sUrl];
							} else {
								// Case #2b - No ETag in the cache for that URL, cachedETags was enhanced
								return getMetadataETag(sUrl, mCachedETags[sUrl], mUpdatedMetaModelETags);
							}
						} else {
							// Case #2z - Last Templating added an URL without ETag
							mUpdatedMetaModelETags[sUrl] = mMetaModelETags[sUrl];
							return mCachedETags[sUrl] === mMetaModelETags[sUrl];
						}
					})
				);

				bCacheNeedUpdate = aValidETags.includes(false);
				// Case #2a - Same number of ETags and all valid -> we return the viewCacheKey
				// Case #2b - Different number of ETags and still all valid -> we return the viewCacheKey
				// Case #2c - Same number of ETags but different values, main service Etag has changed, use that as cache key
				// Case #2d - Different number of ETags but different value, main service Etag or linked service Etag has changed, new ETags should be used as cacheKey
				// Case #2z - Cache has an invalid Etag - if there is an Etag provided from MetaModel use it as cacheKey
				if (
					Object.keys(mUpdatedMetaModelETags).some(function (sUrl: string) {
						return !mUpdatedMetaModelETags[sUrl];
					})
				) {
					// At least one of the MetaModel URLs doesn't provide an ETag, so no caching
					sCacheKey = null;
				} else {
					sCacheKey = bCacheNeedUpdate ? JSON.stringify(mUpdatedMetaModelETags) : mCacheOutput.viewCacheKey;
					sCacheKey ??= JSON.stringify(mUpdatedMetaModelETags); // Special case where the cache key was not set
				}
			} else if (
				Object.keys(mMetaModelETags).some(function (sUrl: string) {
					return !mMetaModelETags[sUrl];
				})
			) {
				// Check if cache can be used (all the metadata and annotations have to provide at least a ETag or a Last-Modified header)
				// Case #1-b - No Cache, mCacheOuput is empty, but metamodel etags cannot be used, so no caching
				sCacheKey = null;
			}
		} catch (e) {
			// Don't use view cache in case of issues with the LRU cache
			bCacheNeedUpdate = true;
			sCacheKey = null;
		}

		this.mCacheNeedsInvalidate[sCacheIdentifier] = bCacheNeedUpdate;
		return sCacheKey;
	}

	async invalidateIfNeeded(
		sCacheKeys: string,
		sCacheIdentifier: string,
		oComponent: TemplateComponent,
		environmentService: EnvironmentCapabilitiesService
	): Promise<void> {
		// Check FE cache after XML view is processed completely
		const sDataSourceETags = JSON.stringify(this.getETags(oComponent, environmentService));
		if (this.mCacheNeedsInvalidate[sCacheIdentifier] || (sCacheKeys && sCacheKeys !== sDataSourceETags)) {
			// Something in the sources and/or its ETags changed -> update the FE cache
			const mCacheKeys: Record<string, string> = {};
			// New ETags that need to be verified, may differ from the one used to generate the view
			mCacheKeys.cachedETags = sDataSourceETags;
			// Old ETags that are used for the xml view cache as key
			mCacheKeys.viewCacheKey = sCacheKeys;
			return CacheManager.set(sCacheIdentifier, mCacheKeys);
		} else {
			return Promise.resolve();
		}
	}

	getETags(oComponent: TemplateComponent, environmentService: EnvironmentCapabilitiesService): Record<string, string | null> {
		const mMetaModelETags = this.oMetaModel.getETags();
		// ETags from UI5 are either a Date or a string, let's rationalize that
		Object.keys(mMetaModelETags).forEach(function (sMetaModelKey: string) {
			const metaModelETag: string | null | Object = mMetaModelETags[sMetaModelKey];
			if (metaModelETag !== null && metaModelETag instanceof Date) {
				// MetaModel contains a Last-Modified timestamp for the URL
				mMetaModelETags[sMetaModelKey] = (mMetaModelETags[sMetaModelKey] as unknown as Date).toISOString();
			}
		});

		// add also the manifest hash as UI5 only considers the root component hash
		const oManifestContent = this.oAppComponent.getManifest();
		const sManifestHash = hash(
			JSON.stringify({
				sapApp: oManifestContent["sap.app"],
				viewData: oComponent.getViewData()
			})
		);
		mMetaModelETags["manifest"] = sManifestHash;
		const capabilities = environmentService.getCapabilities();
		if (capabilities) {
			mMetaModelETags["toggles"] = hash(JSON.stringify(capabilities));
		}

		return mMetaModelETags;
	}

	getInterface(): this {
		return this;
	}
}

class CacheHandlerServiceFactory extends ServiceFactory<CacheHandlerServiceSettings> {
	_oInstanceRegistry: Record<string, CacheHandlerService | null> = {};

	async createInstance(oServiceContext: ServiceContext<CacheHandlerServiceSettings>): Promise<CacheHandlerService> {
		const sMetaModelId = oServiceContext.settings.metaModel.getId();
		let cacheHandlerInstance = this._oInstanceRegistry[sMetaModelId];
		if (!cacheHandlerInstance) {
			this._oInstanceRegistry[sMetaModelId] = cacheHandlerInstance = new CacheHandlerService(
				Object.assign(
					{
						factory: this,
						scopeObject: null,
						scopeType: "service"
					},
					oServiceContext
				)
			);
		}

		return cacheHandlerInstance.initPromise
			.then(() => {
				return this._oInstanceRegistry[sMetaModelId] as CacheHandlerService;
			})
			.catch((e: unknown) => {
				// In case of error delete the global instance;
				this._oInstanceRegistry[sMetaModelId] = null;
				throw e;
			});
	}

	getInstance(oMetaModel: ODataMetaModel): CacheHandlerService | null {
		return this._oInstanceRegistry[oMetaModel.getId()];
	}

	removeGlobalInstance(oMetaModel: ODataMetaModel): void {
		this._oInstanceRegistry[oMetaModel.getId()] = null;
	}
}

export default CacheHandlerServiceFactory;
