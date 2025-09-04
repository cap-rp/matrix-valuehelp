import Log from "sap/base/Log";
import type { AppDataInfo } from "sap/fe/core/AppStateHandler";
import CommonUtils from "sap/fe/core/CommonUtils";
import type Share from "sap/fe/core/controllerextensions/Share";
import type { ShareMetadata } from "sap/fe/core/controllerextensions/Share";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import type FilterBar from "sap/fe/macros/controls/FilterBar";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Controller from "sap/ui/core/mvc/Controller";
import type View from "sap/ui/core/mvc/View";
import HashChanger from "sap/ui/core/routing/HashChanger";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ListReportController from "../ListReportController.controller";

async function getCountUrl(oController: ListReportController): Promise<string> {
	const oTable = oController._getTable?.();
	if (!oTable) {
		return "";
	}
	const tableAPI = oTable.getParent() as TableAPI;
	const downloadUrl = await tableAPI.getDownloadUrlWithFilters();
	const splitUrl = downloadUrl.split("?");
	const baseUrl = `${splitUrl[0]}/$count?`;
	// getDownloadUrl() returns url with $select, $expand which is not supported when /$count is used to get the record count. only $apply, $search, $filter is supported
	// ?$count=true returns count in a format which is not supported by FLP yet.
	// currently supported format for v4 is ../count.. only (where tile preview will still not work)
	const supportedParams: string[] = [];
	if (splitUrl.length > 1) {
		const urlParams = splitUrl[1];
		urlParams.split("&").forEach(function (urlParam: string) {
			const urlParamParts = urlParam.split("=");
			switch (urlParamParts[0]) {
				case "$apply":
				case "$search":
				case "$filter":
					supportedParams.push(urlParam);
			}
		});
	}
	return baseUrl + supportedParams.join("&");
}

async function getShareEmailUrl(): Promise<string> {
	const oUShellContainer = sap.ui.require("sap/ushell/Container");
	if (oUShellContainer) {
		return oUShellContainer
			.getFLPUrlAsync(true)
			.then(function (fLPUrl: string) {
				return fLPUrl;
			})
			.catch(function (sError: unknown) {
				Log.error("Could not retrieve cFLP URL for the sharing dialog (dialog will not be opened)", sError as string);
			});
	} else {
		return Promise.resolve(document.URL);
	}
}

async function getSaveAsTileServiceUrl(controller: Controller): Promise<string> {
	const oFilterBar = (controller as ListReportController)._getFilterBarControl();
	if (oFilterBar) {
		return getCountUrl(controller as ListReportController);
	}
	return "";
}

function getJamUrl(): string | undefined {
	const sHash = HashChanger.getInstance().getHash();
	const sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash?.("") : "";
	const jamUrl = sHash ? sBasePath + sHash : window.location.hash;
	// in case we are in cFLP scenario, the application is running
	// inside an iframe, and there for we need to get the cFLP URL
	// and not 'document.URL' that represents the iframe URL
	const ushellContainer = sap.ui.require("sap/ushell/Container");
	if (ushellContainer && ushellContainer.runningInIframe && ushellContainer.runningInIframe()) {
		ushellContainer
			.getFLPUrl(true)
			.then(function (sUrl: string) {
				return sUrl.substring(0, sUrl.indexOf("#")) + jamUrl;
			})
			.catch(function (sError: unknown) {
				Log.error("Could not retrieve cFLP URL for the sharing dialog (dialog will not be opened)", sError as string);
			});
	} else {
		return window.location.origin + window.location.pathname + jamUrl;
	}
}

/**
 * Get the tile URL for save as tile action.
 * @param view View connected to this controller.
 * @param shareMetadata Object containing the share metadata.
 */
async function getUrlForSaveAsTile(view: View, shareMetadata: ShareMetadata): Promise<void> {
	const appComponent = CommonUtils.getAppComponent(view),
		routerProxy = appComponent.getRouterProxy(),
		hash = routerProxy.getHash(),
		rootViewController = appComponent.getRootViewController(),
		basePath = rootViewController.getAppSpecificHash(),
		saveAsTileAppState: AppDataInfo | void = await appComponent
			.getAppStateHandler()
			.createAppState({ replaceHash: false, skipMerge: true });
	const newKey = saveAsTileAppState?.appStateKey;
	if (newKey && basePath) {
		shareMetadata.tile.url = basePath + routerProxy.setAppStateInHash(hash, newKey);
	}
}

/**
 * Trigger search and listen to dataReceived the event to sync data to the table.
 * @param controller The list report controller
 * @returns The async promise
 */
async function syncTableDataWithGoClick(controller: ListReportController): Promise<void> {
	const filterBar = controller._getFilterBarControl() as FilterBar;
	try {
		// programattically trigger search
		// trigger go only if go is not clicked
		if ((controller.getView().getBindingContext("internal") as InternalModelContext).getProperty("hasPendingFilters")) {
			return await new Promise(function (resolve) {
				const table = controller._getTable?.();
				if (!table) {
					return;
				}
				const binding = table.getRowBinding() || table.getBinding("items");
				binding.attachEventOnce("dataReceived", function () {
					resolve();
				});
				filterBar.triggerSearch();
			});
		}
	} catch (err: unknown) {
		const shareInfoModel = controller.getView()?.getModel("shareInfo") as JSONModel | undefined;
		if (shareInfoModel) {
			shareInfoModel.setProperty("/saveAsTileClicked", false);
		}
		const message = err instanceof Error ? err.message : String(err);
		Log.error(`FE : Save as tile - data sync failed : Share : ${message}`);
	}
}

/**
 * Update the share meta data when save as tile action is clicked.
 * @param view View connected to this controller
 * @param shareMetadata Object containing the share metadata.
 * @returns The async promise
 */
async function getSaveAsTileMetadata(view: View, shareMetadata: ShareMetadata): Promise<void> {
	const shareInfoModel = view.getModel("shareInfo") as JSONModel | undefined;
	if (shareInfoModel && shareInfoModel.getProperty("/saveAsTileClicked")) {
		await syncTableDataWithGoClick(view.getController() as ListReportController);
		await getUrlForSaveAsTile(view, shareMetadata);
		const appComponent = CommonUtils.getAppComponent(view);
		const manifestConfiguration = appComponent.getManifest();
		const uIManifest = manifestConfiguration["sap.ui"];
		const icon = (uIManifest && uIManifest.icons && uIManifest.icons.icon) || "";
		const appManifest = manifestConfiguration["sap.app"];
		const title = (appManifest && appManifest.title) || "";
		shareMetadata.tile.icon = icon;
		shareMetadata.tile.title = title;
		shareMetadata.tile.queryUrl = await getSaveAsTileServiceUrl(view.getController() as ListReportController);
	}
}

const ShareOverride = {
	adaptShareMetadata: async function (this: Share, shareMetadata: ShareMetadata): Promise<ShareMetadata | undefined> {
		try {
			await getSaveAsTileMetadata(this.base.getView(), shareMetadata);
			const jamUrl: string | undefined = getJamUrl();
			// TODO: check if there is any semantic date used before adding serviceURL as BLI:FIORITECHP1-18023
			shareMetadata.title = document.title;
			if (jamUrl) {
				shareMetadata.jam.url = jamUrl;
			}
			// MS Teams collaboration does not want to allow further changes to the URL
			// so update colloborationInfo model at LR override to ignore further extension changes at multiple levels
			const shareInfoModel = this.base?.getView()?.getModel("shareInfo") as JSONModel | undefined;
			const teamsUrl = await this.getTeamsUrl(shareMetadata.url);
			if (shareInfoModel) {
				shareInfoModel.setProperty("/collaborationInfo/url", teamsUrl);
				shareInfoModel.setProperty("/collaborationInfo/appTitle", shareMetadata.title);
			}
			const fLPUrl = await getShareEmailUrl();
			shareMetadata.email.url = fLPUrl;
		} catch (error: unknown) {
			Log.error(error as string);
		}
		return shareMetadata;
	}
};

export default ShareOverride;
