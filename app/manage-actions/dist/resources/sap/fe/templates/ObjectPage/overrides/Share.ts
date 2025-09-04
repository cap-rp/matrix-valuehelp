import Log from "sap/base/Log";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type Share from "sap/fe/core/controllerextensions/Share";
import type { ShareMetadata } from "sap/fe/core/controllerextensions/Share";
import { type ManifestAction } from "sap/fe/core/converters/ManifestSettings";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import { Placement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import SemanticKeyHelper from "sap/fe/core/helpers/SemanticKeyHelper";
import { type WrappedCard } from "sap/fe/core/services/CollaborationManagerServiceFactory";
import type ObjectPageController from "sap/fe/templates/ObjectPage/ObjectPageController.controller";
import AdaptiveCardGenerator from "sap/fe/templates/ObjectPage/card/Generator";
import type { CustomActionConfigs } from "sap/fe/templates/ObjectPage/card/actions/HeaderActions";
import type {
	CustomFormElementsConfig,
	CustomHeaderFacetConfigs,
	HeaderFacetConfig
} from "sap/fe/templates/ObjectPage/card/facets/HeaderContent";
import type StashableHBox from "sap/fe/templates/ObjectPage/controls/StashableHBox";
import type Button from "sap/m/Button";
import type HBox from "sap/m/HBox";
import type Label from "sap/m/Label";
import type MenuButton from "sap/m/MenuButton";
import type MenuItem from "sap/m/MenuItem";
import type Control from "sap/ui/core/Control";
import HashChanger from "sap/ui/core/routing/HashChanger";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ObjectPageDynamicHeaderTitle from "sap/uxap/ObjectPageDynamicHeaderTitle";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type { IAdaptiveCard } from "types/adaptiveCard_types";
import type { MetaModelEntitySet } from "../../../../../../../../types/metamodel_types";

const FACET_IDENTIFIER = "facetIdentifier";
const ADAPTIVECARD = "adaptive";
let bGlobalIsStickySupported: boolean;

function createFilterToFetchActiveContext(mKeyValues: Record<string, unknown>, bIsActiveEntityDefined: boolean): Filter {
	const aKeys = Object.keys(mKeyValues);

	const aFilters = aKeys
		.filter(function (sKey: string) {
			const sValue = mKeyValues[sKey];
			return sValue !== undefined;
		})
		.map(function (sKey: string) {
			const sValue = mKeyValues[sKey];
			return new Filter(sKey, FilterOperator.EQ, sValue);
		});

	if (bIsActiveEntityDefined) {
		const oActiveFilter = new Filter({
			filters: [new Filter("SiblingEntity/IsActiveEntity", FilterOperator.EQ, true)],
			and: false
		});

		aFilters.push(oActiveFilter);
	}

	return new Filter(aFilters, true);
}
async function getActiveContextPath(oController: PageController, sPageEntityName: string, oFilter: Filter): Promise<string> {
	const oListBinding = oController
		.getView()
		.getBindingContext()
		.getModel()
		.bindList(`/${sPageEntityName}`, undefined, undefined, oFilter, { $$groupId: "$auto.Heroes" });
	return oListBinding.requestContexts(0, 2).then(function (oContexts) {
		if (oContexts && oContexts.length) {
			return oContexts[0].getPath();
		}
		return "";
	});
}
type PageInfo = { pageEntityName?: string; mKeyValues?: Record<string, unknown>; bIsActiveEntityDefined?: boolean };
function getActiveContextInstances(oContext: Context, oController: PageController, oEntitySet: MetaModelEntitySet): Promise<string>[] {
	const aActiveContextpromises: Promise<string>[] = [];
	const aPages: PageInfo[] = [];
	let sMetaPath = oContext.getModel().getMetaModel().getMetaPath(oContext.getPath());
	if (sMetaPath.indexOf("/") === 0) {
		sMetaPath = sMetaPath.substring(1);
	}
	const aMetaPathArray = sMetaPath.split("/");
	const sCurrentHashNoParams = HashChanger.getInstance().getHash().split("?")[0];
	const aCurrentHashArray = sCurrentHashNoParams.split("/");

	// oPageMap - creating an object that contains map of metapath name and it's technical details
	// which is required to create a filter to fetch the relavant/correct active context
	// Example: {SalesOrderManage:{technicalID:technicalIDValue}, _Item:{technicalID:technicalIDValue}} etc.,
	const oPageMap: Record<string, PageInfo> = {};
	const aPageHashArray: string[] = [];
	aCurrentHashArray.forEach(function (sPageHash: string) {
		const aKeyValues = sPageHash.substring(sPageHash.indexOf("(") + 1, sPageHash.length - 1).split(",");
		const mKeyValues: Record<string, unknown> = {};
		const sPageHashName = sPageHash.split("(")[0];
		oPageMap[sPageHashName] = {};
		aPageHashArray.push(sPageHashName);
		oPageMap[sPageHashName]["bIsActiveEntityDefined"] = ModelHelper.isDraftSupported(
			oContext.getModel().getMetaModel(),
			oContext.getPath()
		)
			? true
			: false;
		for (const sKeyAssignment of aKeyValues) {
			const aParts = sKeyAssignment.split("=");
			let sKeyValue = aParts[1];
			let sKey = aParts[0];
			// In case if only one technical key is defined then the url just contains the technicalIDValue but not the technicalID
			// Example: SalesOrderManage(ID=11111129-aaaa-bbbb-cccc-ddddeeeeffff,IsActiveEntity=false)/_Item(11111129-aaaa-bbbb-cccc-ddddeeeeffff)
			// In above example SalesOrderItem has only one technical key defined, hence technicalID info is not present in the url
			// Hence in such cases we get technical key and use them to fetch active context
			if (!sKeyAssignment.includes("=")) {
				const oMetaModel = oContext.getModel().getMetaModel();
				const aTechnicalKeys = oMetaModel.getObject(`/${aPageHashArray.join("/")}/$Type/$Key`);
				sKeyValue = aParts[0];
				sKey = aTechnicalKeys[0];
				oPageMap[sPageHash.split("(")[0]]["bIsActiveEntityDefined"] = false;
			}

			if (sKey !== "IsActiveEntity") {
				if (sKeyValue.indexOf("'") === 0 && sKeyValue.lastIndexOf("'") === sKeyValue.length - 1) {
					// Remove the quotes from the value and decode special chars
					sKeyValue = decodeURIComponent(sKeyValue.substring(1, sKeyValue.length - 1));
				}
				mKeyValues[sKey] = sKeyValue;
			}
		}
		oPageMap[sPageHashName].mKeyValues = mKeyValues;
	});

	let oPageEntitySet = oEntitySet;
	aMetaPathArray.forEach(function (sNavigationPath: string) {
		const oPageInfo: PageInfo = {};
		const sPageEntitySetName = oPageEntitySet.$NavigationPropertyBinding && oPageEntitySet.$NavigationPropertyBinding[sNavigationPath];
		if (sPageEntitySetName) {
			oPageInfo.pageEntityName = oPageEntitySet.$NavigationPropertyBinding[sNavigationPath];
			oPageEntitySet = oContext.getModel().getMetaModel().getObject(`/${sPageEntitySetName}`) || oEntitySet;
		} else {
			oPageInfo.pageEntityName = sNavigationPath;
		}
		oPageInfo.mKeyValues = oPageMap[sNavigationPath]?.mKeyValues;
		oPageInfo.bIsActiveEntityDefined = oPageMap[sNavigationPath]?.bIsActiveEntityDefined;
		aPages.push(oPageInfo);
	});

	aPages.forEach(function (oPageInfo: PageInfo) {
		const oFilter = createFilterToFetchActiveContext(oPageInfo.mKeyValues!, !!oPageInfo.bIsActiveEntityDefined);
		aActiveContextpromises.push(getActiveContextPath(oController, oPageInfo.pageEntityName!, oFilter));
	});

	return aActiveContextpromises;
}

/**
 * Method to fetch active context path's.
 * @param oContext The Page Context
 * @param oController
 * @returns Promise which is resolved once the active context's are fetched
 */
async function getActiveContextPaths(oContext: Context, oController: PageController): Promise<string[]> {
	const sCurrentHashNoParams = HashChanger.getInstance().getHash().split("?")[0];
	let sRootEntityName = sCurrentHashNoParams && sCurrentHashNoParams.substring(0, sCurrentHashNoParams.indexOf("("));
	if (sRootEntityName.indexOf("/") === 0) {
		sRootEntityName = sRootEntityName.substring(1);
	}
	const oEntitySet = oContext.getModel().getMetaModel().getObject(`/${sRootEntityName}`);
	const oPageContext = oContext;
	const aActiveContextpromises = getActiveContextInstances(oContext, oController, oEntitySet);
	if (aActiveContextpromises.length > 0) {
		return Promise.all(aActiveContextpromises)
			.then(function (aData: string[]) {
				const aActiveContextPaths: string[] = [];
				let oPageEntitySet = oEntitySet;
				if (aData[0]?.indexOf("/") === 0) {
					aActiveContextPaths.push(aData[0].substring(1));
				} else {
					aActiveContextPaths.push(aData[0]);
				}
				// In the active context paths identify and replace the entitySet Name with corresponding navigation property name
				// Required to form the url pointing to active context
				// Example : SalesOrderItem --> _Item, MaterialDetails --> _MaterialDetails etc.,
				for (let i = 1; i < aData.length; i++) {
					let sActiveContextPath = aData[i];
					let sNavigatioProperty = "";
					let sEntitySetName = sActiveContextPath && sActiveContextPath.substring(0, sActiveContextPath.indexOf("("));
					if (sEntitySetName?.indexOf("/") === 0) {
						sEntitySetName = sEntitySetName.substring(1);
					}
					if (sActiveContextPath?.indexOf("/") === 0) {
						sActiveContextPath = sActiveContextPath.substring(1);
					}
					sNavigatioProperty = Object.keys(oPageEntitySet.$NavigationPropertyBinding)[
						Object.values(oPageEntitySet.$NavigationPropertyBinding).indexOf(sEntitySetName)
					];
					if (sNavigatioProperty) {
						aActiveContextPaths.push(sActiveContextPath?.replace(sEntitySetName, sNavigatioProperty));
						oPageEntitySet = oPageContext.getModel().getMetaModel().getObject(`/${sEntitySetName}`) || oEntitySet;
					} else {
						aActiveContextPaths.push(sActiveContextPath);
					}
				}
				return aActiveContextPaths;
			})
			.catch(function (oError: unknown) {
				Log.info("Failed to retrieve one or more active context path's", oError as string);
				return [];
			});
	} else {
		return Promise.resolve([]);
	}
}
async function fetchActiveContextPaths(oContext: Context, oController: PageController): Promise<string[]> {
	let oPromise, aSemanticKeys;
	const sCurrentHashNoParams = HashChanger.getInstance().getHash().split("?")[0];
	if (oContext) {
		const oModel = oContext.getModel();
		const oMetaModel = oModel.getMetaModel();
		bGlobalIsStickySupported = ModelHelper.isStickySessionSupported(oMetaModel);
		let sRootEntityName = sCurrentHashNoParams && sCurrentHashNoParams.substring(0, sCurrentHashNoParams.indexOf("("));
		if (sRootEntityName.indexOf("/") === 0) {
			sRootEntityName = sRootEntityName.substring(1);
		}
		aSemanticKeys = SemanticKeyHelper.getSemanticKeys(oMetaModel, sRootEntityName);
	}
	// Fetch active context details incase of below scenario's(where page is not sticky supported(we do not have draft instance))
	// 1. In case of draft enabled Object page where semantic key based URL is not possible(like semantic keys are not modeled in the entity set)
	// 2. In case of draft enabled Sub Object Pages (where semantic bookmarking is not supported)
	const oViewData = oController.getView().getViewData();
	if (oContext && !bGlobalIsStickySupported && ((oViewData.viewLevel === 1 && !aSemanticKeys) || oViewData.viewLevel >= 2)) {
		oPromise = getActiveContextPaths(oContext, oController);
		return oPromise;
	} else {
		return Promise.resolve([]);
	}
}

// /**
//  * Get share URL.
//  * @param bIsEditable
//  * @param bIsStickySupported
//  * @param aActiveContextPaths
//  * @returns {string} The share URL
//  * @protected
//  * @static
//  */
function getShareUrl(bIsEditable: boolean, bIsStickySupported: boolean, aActiveContextPaths: string[]): string {
	let sShareUrl;
	const sHash = HashChanger.getInstance().getHash();
	const sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash!("") : "";
	if (bIsEditable && !bIsStickySupported && aActiveContextPaths) {
		sShareUrl = sBasePath + aActiveContextPaths.join("/");
	} else {
		sShareUrl = sHash ? sBasePath + sHash : window.location.hash;
	}
	return window.location.origin + window.location.pathname + window.location.search + sShareUrl;
}
async function getShareEmailUrl(): Promise<string> {
	const oUShellContainer = sap.ui.require("sap/ushell/Container");
	if (oUShellContainer) {
		return oUShellContainer
			.getFLPUrlAsync(true)
			.then(function (sFLPUrl: string) {
				return sFLPUrl;
			})
			.catch(function (sError: unknown) {
				Log.error("Could not retrieve cFLP URL for the sharing dialog (dialog will not be opened)", sError as string);
			});
	} else {
		return Promise.resolve(document.URL);
	}
}

function getJamUrl(bIsEditMode: boolean, bIsStickySupported: boolean, aActiveContextPaths: string[]): Promise<string> | undefined {
	let sJamUrl: string;
	const sHash = HashChanger.getInstance().getHash();
	const sBasePath = HashChanger.getInstance().hrefForAppSpecificHash ? HashChanger.getInstance().hrefForAppSpecificHash!("") : "";
	if (bIsEditMode && !bIsStickySupported && aActiveContextPaths) {
		sJamUrl = sBasePath + aActiveContextPaths.join("/");
	} else {
		sJamUrl = sHash ? sBasePath + sHash : window.location.hash;
	}
	// in case we are in cFLP scenario, the application is running
	// inside an iframe, and there for we need to get the cFLP URL
	// and not 'document.URL' that represents the iframe URL
	const ushellContainer = sap.ui.require("sap/ushell/Container");
	if (ushellContainer && ushellContainer.runningInIframe && ushellContainer.runningInIframe()) {
		ushellContainer
			.getFLPUrl(true)
			.then(function (sUrl: string) {
				return sUrl.substring(0, sUrl.indexOf("#")) + sJamUrl;
			})
			.catch(function (sError: unknown) {
				Log.error("Could not retrieve cFLP URL for the sharing dialog (dialog will not be opened)", sError as string);
			});
	} else {
		return Promise.resolve(window.location.origin + window.location.pathname + sJamUrl);
	}
}

/**
 * Get query url formed by context and paths to request.
 * @param context Binding context of the view
 * @param pathsToQuery Paths to request. Add to $select and $expand query of the data URL.
 * @returns Query URL for data to be shown in the card.
 */
function getQueryUrlForCardDefinition(context: Context, pathsToQuery: string[]): string | undefined {
	// NOTE: Below approach uses private implementations from UI5 V4 model and requestor.
	// This would need to change once we get a public API to support this requirement from UI5 V4 model (JIRA: FIORITECHP1-28756).
	const DUMMY_GROUP_ID = "_fe_ms_teams";
	const model = context.getModel();
	const requestor = context.getModel().oRequestor;
	const selectOptions = pathsToQuery.map((path) => path.replace(".", "/"));
	context.requestSideEffects(selectOptions, DUMMY_GROUP_ID);
	// For this scenario, 1st request in the batch is always empty according to model.
	const requests = requestor.mBatchQueue?.[DUMMY_GROUP_ID]?.splice(1);

	// Batch queue contains separate requests from control bindings with different groupIds.
	// We need to merge the all the requests as we need a single data url.
	if (requests && requests.length > 0) {
		// Url for request can be different based on $select/$expand parameters.
		const longUrl = requests.reduce((url, req) => (req.url.length > url.length ? req.url : url), "");
		requests.forEach((req) => {
			delete req.$owner;
			req.url = longUrl;
		});
		const mergedReq = requestor.mergeGetRequests(requests)[0];
		const absoluteServiceURL = getAbsoluteURL(model.getServiceUrl());
		delete requestor.mBatchQueue[DUMMY_GROUP_ID];
		return `${absoluteServiceURL}${mergedReq.url}`;
	}
}

/**
 * Get action controls from object page layout.
 * @param opLayout ObjectPageLayout control.
 * @returns Action buttons and menu items present in OP header.
 */
function getActionControls(opLayout: ObjectPageLayout): (Button | MenuItem)[] {
	const headerTitle = opLayout.getHeaderTitle() as ObjectPageDynamicHeaderTitle;
	const headerActionsInUI = headerTitle.getActions();
	return headerActionsInUI.reduce(
		(controls, actionInUI): (Button | MenuItem)[] => {
			if (actionInUI?.isA?.<Button>("sap.m.Button")) {
				controls.push(actionInUI);
			} else if (actionInUI?.isA?.<MenuButton>("sap.m.MenuButton")) {
				const menu = actionInUI.getMenu();
				const menuItems = menu.getItems();
				controls = [...controls, ...menuItems];
			}
			return controls;
		},
		[] as (Button | MenuItem)[]
	);
}

/**
 * Get absolute service url.
 * @param serviceURL Service URL
 * @returns Absolute service URL.
 */
function getAbsoluteURL(serviceURL: string): string {
	const regex = new RegExp("^(?:[a-z]+:)?//", "i");
	if (regex.test(serviceURL)) {
		return serviceURL;
	}
	return `${window.location.origin}${serviceURL}`;
}

const ShareExtensionOverride = {
	adaptShareMetadata: async function (this: Share, oShareMetadata: ShareMetadata): Promise<unknown> {
		const oContext = this.base.getView().getBindingContext();
		const bIsEditable = CommonUtils.getIsEditable(this.base.getView());

		try {
			const manifest = this.base.getAppComponent().getManifest();
			const appId = manifest?.["sap.app"]?.id;
			const appTitle = manifest?.["sap.app"]?.title;
			const aActiveContextPaths = await fetchActiveContextPaths(oContext, this.base.getView().getController());
			const oPageTitleInfo = (this.base.getView().getController() as ObjectPageController)._getPageTitleInformation();
			const oData = await Promise.all([
				getJamUrl(bIsEditable, bGlobalIsStickySupported, aActiveContextPaths),
				getShareUrl(bIsEditable, bGlobalIsStickySupported, aActiveContextPaths),
				getShareEmailUrl()
			]);

			let sTitle = oPageTitleInfo.title;
			const sObjectSubtitle = oPageTitleInfo.subtitle ? oPageTitleInfo.subtitle.toString() : "";
			if (sObjectSubtitle) {
				sTitle = `${sTitle} - ${sObjectSubtitle}`;
			}
			oShareMetadata.tile = {
				title: oPageTitleInfo.title,
				subtitle: sObjectSubtitle
			};
			oShareMetadata.email.title = sTitle;
			oShareMetadata.title = sTitle;
			oShareMetadata.jam.url = oData[0];
			oShareMetadata.url = oData[1];
			oShareMetadata.email.url = oData[2];
			// MS Teams collaboration does not want to allow further changes to the URL
			// so update colloborationInfo model at LR override to ignore further extension changes at multiple levels
			const shareInfoModel = this.base?.getView()?.getModel("shareInfo") as JSONModel | undefined;
			const teamsUrl = await this.getTeamsUrl(oShareMetadata.url);
			if (shareInfoModel) {
				shareInfoModel.setProperty("/collaborationInfo/url", teamsUrl);
				shareInfoModel.setProperty("/collaborationInfo/appTitle", appTitle);
				shareInfoModel.setProperty("/collaborationInfo/subTitle", sObjectSubtitle);
				shareInfoModel.setProperty("/collaborationInfo/appId", appId);
			}
		} catch (error: unknown) {
			Log.error(error as string);
		}

		return oShareMetadata;
	},

	/**
	 * Get adaptive card definition for object page to  share via MS teams collaboration.
	 * @returns Adaptive card definition.
	 */
	getCardDefinition: async function (this: Share): Promise<IAdaptiveCard | undefined | WrappedCard> {
		let cardDefinition: IAdaptiveCard | undefined | WrappedCard;
		const view = this.base.getView();
		const bindingContext = this.base.getView().getBindingContext();
		const model = bindingContext?.getModel() as ODataModel | undefined;
		const metaModel = model?.getMetaModel();
		const opController = view.getController() as ObjectPageController;
		const appComponent = opController.getAppComponent();
		cardDefinition = (await appComponent.getCollaborationManagerService().getDesignTimeCard(ADAPTIVECARD)) as WrappedCard;
		if (!cardDefinition && model && metaModel && bindingContext) {
			const serviceURI = getAbsoluteURL(model.getServiceUrl());
			const conveterdTypes = convertTypes(metaModel);
			const bindingContextPath = bindingContext.getPath();
			const webUrl = `${serviceURI}${bindingContextPath.substring(1)}`;
			const contextPath = `${metaModel.getMetaPath(bindingContext.getPath())}/`;
			const shellServiceHelper = opController.getAppComponent().getShellServices();
			const contextInfo = {
				contextPath,
				bindingContextPath
			};

			// pass facet as part of cardConfig
			const cardConfig = {
				headerFacets: ShareExtensionOverride.getHeaderFacetsConfig(opController),
				actions: ShareExtensionOverride.getActionsConfig(opController),
				webUrl,
				serviceURI,
				objectTitle: await shellServiceHelper.getTitle(),
				appUrl: this.base.getView().getModel("shareInfo")?.getProperty("/collaborationInfo/url"),
				contextInfo
			};
			const cardGenerator = new AdaptiveCardGenerator(conveterdTypes, cardConfig);
			const pathsToQuery = cardGenerator.getPathsToQuery();
			// TODO:
			// 'getQueryUrlForCardDefinition' uses a private implementation from V4 model to create query url.
			// This workaround was discussed with V4 model for temporary use.
			// We would need to revert this once we have an API or better approach from V4 model.(JIRA: FIORITECHP1-28756)
			const queryUrl = getQueryUrlForCardDefinition(bindingContext, pathsToQuery);
			cardDefinition = cardGenerator.getCardDefinition(queryUrl);
		} else if (!cardDefinition) {
			Log.error("FE V4 : Share Object Page controller extension : Card was not created");
		}
		return cardDefinition;
	},

	/**
	 * Get action configs for card creation.
	 * @param controller View controller.
	 * @returns Action configs
	 */
	getActionsConfig: function (controller: ObjectPageController): CustomActionConfigs {
		// fetch the information about UI from object page layout
		const manifestActionsConfig = controller.getView().getViewData().content?.header?.actions || {};
		const opLayout = controller._getObjectPageLayoutControl();
		const actionControlsInUI = getActionControls(opLayout);
		const actionConfig = actionControlsInUI.reduce((config, actionControl) => {
			const configKey = actionControl.data("annotatedActionIdentifier");
			if (configKey) {
				config[configKey] = {
					title: actionControl.getText()
				};
				if (manifestActionsConfig[configKey]) {
					config[configKey].isVisible = this.getActionVisibilityViaManifest(manifestActionsConfig[configKey]);
				}
			}
			return config;
		}, {} as CustomActionConfigs);
		Object.keys(manifestActionsConfig).forEach((actionKey: string) => {
			if (actionKey.startsWith("DataFieldForAction") && !actionConfig[actionKey]) {
				const actionVisible = this.getActionVisibilityViaManifest(manifestActionsConfig[actionKey]);
				if (actionVisible !== undefined) {
					actionConfig[actionKey] = {
						isVisible: actionVisible
					};
				}
			}
		});
		return actionConfig;
	},

	/**
	 * Returns action visiblity based on manifest configuration.
	 * If the action has have dynamic visibility or enablement from manifest, it is not visible in the card.
	 * @param manifestActionsConfig Manifest Action config
	 * @returns Boolean value to indicate visibility of action
	 */
	getActionVisibilityViaManifest: function (manifestActionsConfig: ManifestAction): boolean | undefined {
		let actionVisible = typeof manifestActionsConfig.visible === "boolean" ? manifestActionsConfig.visible : undefined;
		if (typeof manifestActionsConfig.visible === "string") {
			actionVisible = manifestActionsConfig.visible === "true" ? true : false;
		}

		// Enable is dynamic or statically false.
		if (actionVisible !== false) {
			if (
				manifestActionsConfig.enabled === false ||
				(typeof manifestActionsConfig.enabled === "string" && manifestActionsConfig.enabled !== "true")
			) {
				actionVisible = false;
			}
		}
		return actionVisible;
	},

	/**
	 * Get header facets with title, position and visibility.
	 * @param controller Object page controller
	 * @returns Object of facets
	 */
	getHeaderFacetsConfig: function (controller: ObjectPageController): CustomHeaderFacetConfigs {
		// fetch the information about UI from object page layout
		const dynamicHeaderControls = (controller._getObjectPageLayoutControl().getHeaderContent()[0] as HBox)?.getItems();
		// get visibility, title and manually calculate position from UI changes

		const headerItems: CustomHeaderFacetConfigs = dynamicHeaderControls?.reduce(
			(cummulativeConfigs: CustomHeaderFacetConfigs, currentFacet: Control | StashableHBox) => {
				const facetIdentifer: string | null = currentFacet.data(FACET_IDENTIFIER);
				if (facetIdentifer && currentFacet.isA<StashableHBox>("sap.fe.templates.ObjectPage.controls.StashableHBox")) {
					// Direct StashableHBox is an equivalent of ReferenceFacet.
					const formElementsConfig = ShareExtensionOverride._getFacetLabelsInfo(currentFacet);
					const currentItem: HeaderFacetConfig = {
						// In case of key user changes from FLP, the visible property is not bound(modifier unbinds the control property).

						// If there is a binding then it can come from annotations or manifest.
						// We don't support manifest overrides for visible yet for header content in cards.
						// So, if there is a binding we fall back to annotations(default behaviour of Adaptive Card Generator).

						// If there is no binding, it might mean that there might be key user change or visible by default.
						isVisible: currentFacet.isBound("visible") ? undefined : currentFacet.getVisible(),
						title: currentFacet.getTitle(),
						position: {
							placement: Placement.After,
							anchor: Object.keys(cummulativeConfigs).pop() || ""
						},
						formElementsConfig
					};
					cummulativeConfigs[facetIdentifer] = currentItem;
					return cummulativeConfigs;
				}
				return cummulativeConfigs;
			},
			{}
		);
		return headerItems;
	},

	/**
	 * Get form elements label configurations from facet.
	 * @param facetControl StashableHBox control that represents the reference facet.
	 * @returns Form elements' label text configurations
	 */
	_getFacetLabelsInfo(facetControl: StashableHBox): CustomFormElementsConfig {
		const labelCtrls = facetControl.getFormLabels();

		return labelCtrls.reduce((allConfigs: CustomFormElementsConfig, label: Label) => {
			const labelIdentifier = label.data("labelIdentifier");
			const labelText = label.getText();
			if (labelIdentifier) {
				allConfigs[labelIdentifier] = {
					labelText: labelText.endsWith(":") ? labelText.substring(0, labelText.length - 1) : labelText
				};
			}
			return allConfigs;
		}, {} as CustomFormElementsConfig);
	}
};

export default ShareExtensionOverride;
