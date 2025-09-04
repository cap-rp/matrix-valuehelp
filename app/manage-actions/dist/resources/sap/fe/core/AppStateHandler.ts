import Log from "sap/base/Log";
import deepEqual from "sap/base/util/deepEqual";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type { NavigationParameter } from "sap/fe/core/controllerextensions/ViewState";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import toES6Promise from "sap/fe/core/helpers/ToES6Promise";
import type { InnerAppData } from "sap/fe/navigation/NavigationHandler";
import type { SelectionVariant } from "sap/fe/navigation/SelectionVariant";
import library from "sap/fe/navigation/library";
import BaseObject from "sap/ui/base/Object";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import BusyLocker from "./controllerextensions/BusyLocker";
import ModelHelper from "./helpers/ModelHelper";

const NavType = library.NavType;
type AppState = {
	skipMerge?: boolean;
	[key: string]: unknown;
};
export type AppData = {
	oDefaultedSelectionVariant: SelectionVariant;
	oSelectionVariant: SelectionVariant;
	bNavSelVarHasDefaultsOnly: boolean;
	appState: AppState;
	iAppState?: {
		appState: AppState;
	};
};
const SKIP_MERGE_KEY = "skipMerge";
export type IAppState = {
	appState: Record<string, unknown>;
};

export type AppDataInfo = {
	appStateData: { appState: object | undefined };
	appStateKey: string | null;
};

export type CreateAppParameters = {
	replaceHash?: boolean;
	skipMerge?: boolean;
	viewId?: string;
};

export type VersionActivated = {
	versionWasActivated: boolean;
};

const REPLACE_COMPLETE_APPSTATE = "REPLACE_COMPLETE_APPSTATE";

@defineUI5Class("sap.fe.core.AppStateHandler")
class AppStateHandler extends BaseObject {
	public sId: string;

	public oAppComponent: AppComponent;

	public bNoRouteChange: boolean;

	private _mCurrentAppState?: AppState = {};

	simultaneousCreateRequest: Record<string, number>;

	static versionActivationStatus: Record<string, boolean> = {};

	constructor(oAppComponent: AppComponent) {
		super();
		this.oAppComponent = oAppComponent;
		this.sId = `${oAppComponent.getId()}/AppStateHandler`;
		this.simultaneousCreateRequest = {};
		this.bNoRouteChange = false;
		Log.info("APPSTATE : Appstate handler initialized");
	}

	getId(): string {
		return this.sId;
	}

	/**
	 * Get view specific appstate.
	 * @param innerAppState Overall appstate
	 * @param stateIdentifier State identifier. Id of the local view
	 * @returns Inner appstate
	 */
	_getInnerAppStateForView(innerAppState: InnerAppData | undefined, stateIdentifier: string): InnerAppData | undefined {
		if (stateIdentifier === REPLACE_COMPLETE_APPSTATE || !innerAppState) {
			// overall app state needs to be considered.
			return innerAppState;
		}

		// we take the subset of the app state wrt to the local view id.
		return {
			[stateIdentifier]: innerAppState[stateIdentifier as keyof typeof innerAppState] || {}
		};
	}

	/**
	 * Add appstate in hash.
	 * @param appStateKey Appstate key
	 * @param stateIdentifier State identifier. Id of the local view
	 */
	_addAppStateInHash(appStateKey: string, stateIdentifier: string): void {
		const appComponent = this.oAppComponent,
			navigationService = appComponent.getNavigationService(),
			routerProxy = appComponent.getRouterProxy(),
			hash = routerProxy.getHash(),
			isStickyMode = ModelHelper.isStickySessionSupported(appComponent.getMetaModel()),
			newHash = navigationService.replaceInnerAppStateKey(routerProxy.getHash(), appStateKey);

		if (newHash && this.simultaneousCreateRequest[stateIdentifier] === 0 && newHash !== hash) {
			routerProxy.navToHash(newHash, undefined, undefined, undefined, !isStickyMode);
			this.bNoRouteChange = true;
		}
		Log.info("APPSTATE: navToHash");
	}

	/**
	 * Create Appstate Key.
	 * @param appStateData Appstate
	 * @param stateIdentifier State identifier. Id of the local view
	 * @returns Appstate Key
	 */
	async _createAppStateKey(appStateData: InnerAppData, stateIdentifier: string): Promise<string> {
		const appComponent = this.oAppComponent,
			navigationService = appComponent.getNavigationService();

		if (this.simultaneousCreateRequest[stateIdentifier]) {
			// any other value
			this.simultaneousCreateRequest[stateIdentifier]++;
		} else {
			// 0 or undefined
			this.simultaneousCreateRequest[stateIdentifier] = 1;
		}

		const appStateKey = await navigationService.storeInnerAppStateAsync(appStateData, true, true);

		this.simultaneousCreateRequest[stateIdentifier]--;

		Log.info("APPSTATE: Appstate stored");
		return appStateKey;
	}

	/**
	 * Creates appstate info.
	 * @param innerAppState
	 * @param createAppParameters Parameters for creating new appstate
	 * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
	 * @param createAppParameters.viewId Id of the view for which we need to create the app state. This is to create or update view specific appstate.
	 * @returns A promise resolving the stored data or appstate key
	 */
	async _getAppStateInfo(innerAppState: InnerAppData | undefined, createAppParameters?: CreateAppParameters): Promise<AppDataInfo> {
		const appComponent = this.oAppComponent;
		const { replaceHash = true, viewId: stateIdentifier = REPLACE_COMPLETE_APPSTATE } = createAppParameters ?? {};

		let appStateKey: string | null = null;
		let appStateData = { appState: this._mCurrentAppState };

		const currentStateToUpdate = this._getInnerAppStateForView(this._mCurrentAppState, stateIdentifier);
		if (innerAppState && !deepEqual(currentStateToUpdate, innerAppState)) {
			//
			this._mCurrentAppState = { ...this._mCurrentAppState, ...(innerAppState as Record<string, unknown>) };
			appStateData = { appState: this._mCurrentAppState };
			try {
				appStateKey = await this._createAppStateKey(appStateData, stateIdentifier);
				if (replaceHash === true) {
					this._addAppStateInHash(appStateKey, stateIdentifier);
				}
			} catch (oError: unknown) {
				Log.error(oError as string);
			}
		} else {
			const routerProxy = appComponent.getRouterProxy(),
				hash = routerProxy.getHash();
			appStateKey = routerProxy.findAppStateInHash(hash) as string;
		}
		return {
			appStateData,
			appStateKey
		};
	}

	/**
	 * Creates or updates the appstate.
	 * Replaces the hash with the new appstate based on replaceHash.
	 * @param createAppParameters Parameters for creating new appstate
	 * @param createAppParameters.replaceHash Boolean which determines to replace the hash with the new generated key
	 * @param createAppParameters.skipMerge Boolean which determines to skip the key user shine through
	 * @param createAppParameters.viewId Id of the view for which we need to create the app state. This is to create or update view specific appstate
	 * @returns A promise resolving the stored data or appstate key
	 */
	async createAppState(createAppParameters?: CreateAppParameters): Promise<void | AppDataInfo> {
		const appComponent = this.oAppComponent;
		if (!appComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
			return;
		}
		const { skipMerge = false, viewId: stateIdentifier = REPLACE_COMPLETE_APPSTATE } = createAppParameters ?? {},
			rootController = appComponent.getRootControl().getController();

		if (!rootController.viewState) {
			throw new Error(`viewState controller extension not available for controller: ${rootController.getMetadata().getName()}`);
		}

		// In case, on load of FCL app we have multiple views(LR, OP, sub-OP...) and url has iAppState(1).
		// The LR view loads with applied iAppState(1) and calls createAppState(example: onSearch event in LR) before OP is loaded.
		// This creates iAppState(2) before iAppState(1) is applied to OP.
		// So, we try to wait till the routing is complete.
		await rootController.routingIsComplete();

		// Get appState to update
		let innerAppState = (await rootController.viewState.retrieveViewState()) as InnerAppData | undefined;
		innerAppState = this._getInnerAppStateForView(innerAppState, stateIdentifier);
		if (skipMerge) {
			innerAppState = { ...innerAppState, ...{ skipMerge } };
		}

		return this._getAppStateInfo(innerAppState, createAppParameters);
	}

	_createNavigationParameters(oAppData: AppData, sNavType: string): NavigationParameter {
		return Object.assign({}, oAppData, {
			selectionVariantDefaults: oAppData.oDefaultedSelectionVariant,
			selectionVariant: oAppData.oSelectionVariant,
			requiresStandardVariant: !oAppData.bNavSelVarHasDefaultsOnly,
			navigationType: sNavType
		});
	}

	/**
	 * Sets the RTA (Runtime Adaptation) version activation status for a specific ID.
	 * @param id The unique identifier.
	 * @param value The value indicating whether the RTA version was activated.
	 */
	static setRTAVersionWasActivated(id: string, value: boolean): void {
		this.versionActivationStatus[id] = value;
	}

	/**
	 * Retrieves the RTA (Runtime Adaptation) version activation status for a specific ID.
	 * @param id The unique identifier.
	 * @returns The activation status or undefined if not set.
	 */
	static getRTAVersionWasActivated(id: string): boolean | undefined {
		return this.versionActivationStatus[id];
	}

	_checkIfLastSeenRecord(view?: View): boolean {
		//getting the internal model context in order to fetch the technicalkeys of last seen record and close column flag set in the internalrouting for retaining settings in persistence mode
		const internalModelContext = view && (view.getBindingContext("internal") as InternalModelContext);
		if (internalModelContext && internalModelContext.getProperty("fclColumnClosed") === true) {
			const technicalKeysObject = internalModelContext.getProperty("technicalKeysOfLastSeenRecord");
			const bindingContext = view?.getBindingContext() as Context;
			const path = (bindingContext && bindingContext.getPath()) || "";
			const metaModel = bindingContext?.getModel().getMetaModel();
			const metaPath = metaModel?.getMetaPath(path);
			const technicalKeys = metaModel?.getObject(`${metaPath}/$Type/$Key`);
			if (technicalKeys) {
				for (const element of technicalKeys) {
					const keyValue = bindingContext.getObject()[element];
					if (keyValue !== technicalKeysObject[element]) {
						internalModelContext.setProperty("fclColumnClosed", false);
						return true;
					}
				}
			}
			//the record opened is not the last seen one : no need to persist the changes, reset to default instead
		}
		return false;
	}

	_getAppStateData(oAppData: AppData, viewId?: string, navType?: string): Record<string, unknown> | undefined {
		let key = "",
			i = 0;
		const appStateData = navType === NavType.hybrid ? oAppData.iAppState : oAppData;

		if (appStateData?.appState) {
			for (i; i < Object.keys(appStateData.appState).length; i++) {
				if (Object.keys(appStateData.appState)[i] === viewId) {
					key = Object.keys(appStateData.appState)[i];
					break;
				}
			}
		}
		if (appStateData?.appState) {
			return {
				[Object.keys(appStateData.appState)[i]]: appStateData.appState[key] || {}
			};
		}
	}

	/**
	 * Applies an appstate by fetching appdata and passing it to _applyAppstateToPage.
	 * @param viewId
	 * @param view
	 * @returns A promise for async handling
	 */
	async applyAppState(viewId?: string, view?: View): Promise<void | {}> {
		if (AppStateHandler.getRTAVersionWasActivated(this.oAppComponent.getId())) {
			AppStateHandler.setRTAVersionWasActivated(this.oAppComponent.getId(), false);
			return Promise.resolve();
		}

		if (!this.oAppComponent.getEnvironmentCapabilities().getCapabilities().AppState || BusyLocker.isLocked(this)) {
			return Promise.resolve();
		}

		const checkIfLastSeenRecord = this._checkIfLastSeenRecord(view);
		if (checkIfLastSeenRecord === true) {
			return Promise.resolve();
		}

		BusyLocker.lock(this);
		// Done for busy indicator
		BusyLocker.lock(this.oAppComponent.getRootControl());
		const oNavigationService = this.oAppComponent.getNavigationService();
		// TODO oNavigationService.parseNavigation() should return ES6 promise instead jQuery.promise
		return toES6Promise<unknown[]>(oNavigationService.parseNavigation())
			.catch(function (aErrorData: unknown[]) {
				if (!aErrorData) {
					aErrorData = [];
				}
				Log.warning("APPSTATE: Parse Navigation failed", aErrorData[0] as string);
				return [
					{
						/* app data */
					},
					aErrorData[1],
					aErrorData[2]
				];
			})
			.then(async (aResults: unknown[]) => {
				Log.info("APPSTATE: Parse Navigation done");

				// aResults[1] => oStartupParameters (not evaluated)
				const oAppData = (aResults[0] || {}) as AppData,
					sNavType = (aResults[2] as string) || NavType.initial,
					oRootController = this.oAppComponent.getRootControl().getController();
				// apply the appstate depending upon the view (LR/OP)
				const appStateData = this._getAppStateData(oAppData, viewId, sNavType);
				// fetch the skipMerge flag from appState for save as tile
				const skipMerge: boolean | undefined = oAppData?.appState?.[SKIP_MERGE_KEY];
				this._mCurrentAppState =
					sNavType === NavType.iAppState || sNavType === NavType.hybrid ? { ...this._mCurrentAppState, ...appStateData } : {};
				let shouldApplyState = true;

				if (!oRootController.viewState) {
					throw new Error(`viewState extension required for controller ${oRootController.getMetadata().getName()}`);
				}
				if (oRootController.viewState._isStateEmptyForIAppStateNavType(oAppData, sNavType)) {
					if (!oRootController.viewState._getInitialStateApplied()) {
						oRootController.viewState._setInitialStateApplied();
					}
					shouldApplyState = false;
				}
				const applyViewState = await oRootController.viewState.applyViewState(
					this._mCurrentAppState as Record<string, unknown>,
					this._createNavigationParameters(oAppData, sNavType),
					skipMerge
				);
				if (!shouldApplyState) {
					return {};
				} else {
					return applyViewState;
				}
			})
			.catch(function (oError: unknown) {
				Log.error("appState could not be applied", oError as string);
				throw oError;
			})
			.finally(() => {
				BusyLocker.unlock(this);
				BusyLocker.unlock(this.oAppComponent.getRootControl());
			});
	}

	/**
	 * To check is route is changed by change in the iAPPState.
	 * @returns `true` if the route has chnaged
	 */
	checkIfRouteChangedByIApp(): boolean {
		return this.bNoRouteChange;
	}

	/**
	 * Reset the route changed by iAPPState.
	 */
	resetRouteChangedByIApp(): void {
		if (this.bNoRouteChange) {
			this.bNoRouteChange = false;
		}
	}

	// Reset all activation statuses in AppStateHandler.versionActivationStatus to false
	static resetVersionActivationStatus(): void {
		for (const id in this.versionActivationStatus) {
			if (Object.prototype.hasOwnProperty.call(this.versionActivationStatus, id)) {
				this.versionActivationStatus[id] = false;
			}
		}
	}
}

/**
 * @global
 */
export default AppStateHandler;
