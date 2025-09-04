/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/strings/hash", "sap/ui/core/cache/CacheManager", "sap/ui/core/service/Service", "sap/ui/core/service/ServiceFactory", "sap/ui/thirdparty/jquery"], function (hash, CacheManager, Service, ServiceFactory, jQuery) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  async function getMetadataETag(sUrl, sETag, mUpdatedMetaModelETags) {
    return new Promise(function (resolve) {
      // There is an Url in the FE cache, that's not in the MetaModel yet -> we need to check the ETag
      jQuery.ajax(sUrl, {
        method: "GET"
      }).done(function (oResponse, sTextStatus, jqXHR) {
        // ETag is not the same -> invalid
        // ETag is the same -> valid
        // If ETag is available use it, otherwise use Last-Modified
        mUpdatedMetaModelETags[sUrl] = jqXHR.getResponseHeader("ETag") || jqXHR.getResponseHeader("Last-Modified");
        resolve(sETag === mUpdatedMetaModelETags[sUrl]);
      }).fail(function () {
        // Case 2z - Make sure we update the map so that we invalidate the cache
        mUpdatedMetaModelETags[sUrl] = "";
        resolve(false);
      });
    });
  }
  let CacheHandlerService = /*#__PURE__*/function (_Service) {
    function CacheHandlerService() {
      return _Service.apply(this, arguments) || this;
    }
    _exports.CacheHandlerService = CacheHandlerService;
    _inheritsLoose(CacheHandlerService, _Service);
    var _proto = CacheHandlerService.prototype;
    _proto.init = function init() {
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
    };
    _proto.exit = function exit() {
      // Deregister global instance
      this.oFactory.removeGlobalInstance(this.oMetaModel);
    };
    _proto.validateCacheKey = async function validateCacheKey(sCacheIdentifier, oComponent, environmentService) {
      // Keep track if the cache will anyway need to be updated
      let bCacheNeedUpdate = true;
      let sCacheKey;
      try {
        const mCacheOutput = await CacheManager.get(sCacheIdentifier);
        // We provide a default key so that an xml view cache is written
        const mMetaModelETags = this.getETags(oComponent, environmentService);
        sCacheKey = JSON.stringify(mMetaModelETags);
        // Case #1a - No cache, so mCacheOuput is empty, cacheKey = current metamodel ETags
        if (mCacheOutput) {
          // Case #2 - Cache entry found, check if it's still valid
          const mUpdatedMetaModelETags = {};
          const mCachedETags = JSON.parse(mCacheOutput.cachedETags);
          const aValidETags = await Promise.all(Object.keys(mCachedETags).map(async function (sUrl) {
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
          }));
          bCacheNeedUpdate = aValidETags.includes(false);
          // Case #2a - Same number of ETags and all valid -> we return the viewCacheKey
          // Case #2b - Different number of ETags and still all valid -> we return the viewCacheKey
          // Case #2c - Same number of ETags but different values, main service Etag has changed, use that as cache key
          // Case #2d - Different number of ETags but different value, main service Etag or linked service Etag has changed, new ETags should be used as cacheKey
          // Case #2z - Cache has an invalid Etag - if there is an Etag provided from MetaModel use it as cacheKey
          if (Object.keys(mUpdatedMetaModelETags).some(function (sUrl) {
            return !mUpdatedMetaModelETags[sUrl];
          })) {
            // At least one of the MetaModel URLs doesn't provide an ETag, so no caching
            sCacheKey = null;
          } else {
            sCacheKey = bCacheNeedUpdate ? JSON.stringify(mUpdatedMetaModelETags) : mCacheOutput.viewCacheKey;
            sCacheKey ??= JSON.stringify(mUpdatedMetaModelETags); // Special case where the cache key was not set
          }
        } else if (Object.keys(mMetaModelETags).some(function (sUrl) {
          return !mMetaModelETags[sUrl];
        })) {
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
    };
    _proto.invalidateIfNeeded = async function invalidateIfNeeded(sCacheKeys, sCacheIdentifier, oComponent, environmentService) {
      // Check FE cache after XML view is processed completely
      const sDataSourceETags = JSON.stringify(this.getETags(oComponent, environmentService));
      if (this.mCacheNeedsInvalidate[sCacheIdentifier] || sCacheKeys && sCacheKeys !== sDataSourceETags) {
        // Something in the sources and/or its ETags changed -> update the FE cache
        const mCacheKeys = {};
        // New ETags that need to be verified, may differ from the one used to generate the view
        mCacheKeys.cachedETags = sDataSourceETags;
        // Old ETags that are used for the xml view cache as key
        mCacheKeys.viewCacheKey = sCacheKeys;
        return CacheManager.set(sCacheIdentifier, mCacheKeys);
      } else {
        return Promise.resolve();
      }
    };
    _proto.getETags = function getETags(oComponent, environmentService) {
      const mMetaModelETags = this.oMetaModel.getETags();
      // ETags from UI5 are either a Date or a string, let's rationalize that
      Object.keys(mMetaModelETags).forEach(function (sMetaModelKey) {
        const metaModelETag = mMetaModelETags[sMetaModelKey];
        if (metaModelETag !== null && metaModelETag instanceof Date) {
          // MetaModel contains a Last-Modified timestamp for the URL
          mMetaModelETags[sMetaModelKey] = mMetaModelETags[sMetaModelKey].toISOString();
        }
      });

      // add also the manifest hash as UI5 only considers the root component hash
      const oManifestContent = this.oAppComponent.getManifest();
      const sManifestHash = hash(JSON.stringify({
        sapApp: oManifestContent["sap.app"],
        viewData: oComponent.getViewData()
      }));
      mMetaModelETags["manifest"] = sManifestHash;
      const capabilities = environmentService.getCapabilities();
      if (capabilities) {
        mMetaModelETags["toggles"] = hash(JSON.stringify(capabilities));
      }
      return mMetaModelETags;
    };
    _proto.getInterface = function getInterface() {
      return this;
    };
    return CacheHandlerService;
  }(Service);
  _exports.CacheHandlerService = CacheHandlerService;
  let CacheHandlerServiceFactory = /*#__PURE__*/function (_ServiceFactory) {
    function CacheHandlerServiceFactory() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ServiceFactory.call(this, ...args) || this;
      _this._oInstanceRegistry = {};
      return _this;
    }
    _inheritsLoose(CacheHandlerServiceFactory, _ServiceFactory);
    var _proto2 = CacheHandlerServiceFactory.prototype;
    _proto2.createInstance = async function createInstance(oServiceContext) {
      const sMetaModelId = oServiceContext.settings.metaModel.getId();
      let cacheHandlerInstance = this._oInstanceRegistry[sMetaModelId];
      if (!cacheHandlerInstance) {
        this._oInstanceRegistry[sMetaModelId] = cacheHandlerInstance = new CacheHandlerService(Object.assign({
          factory: this,
          scopeObject: null,
          scopeType: "service"
        }, oServiceContext));
      }
      return cacheHandlerInstance.initPromise.then(() => {
        return this._oInstanceRegistry[sMetaModelId];
      }).catch(e => {
        // In case of error delete the global instance;
        this._oInstanceRegistry[sMetaModelId] = null;
        throw e;
      });
    };
    _proto2.getInstance = function getInstance(oMetaModel) {
      return this._oInstanceRegistry[oMetaModel.getId()];
    };
    _proto2.removeGlobalInstance = function removeGlobalInstance(oMetaModel) {
      this._oInstanceRegistry[oMetaModel.getId()] = null;
    };
    return CacheHandlerServiceFactory;
  }(ServiceFactory);
  return CacheHandlerServiceFactory;
}, false);
//# sourceMappingURL=CacheHandlerServiceFactory-dbg.js.map
