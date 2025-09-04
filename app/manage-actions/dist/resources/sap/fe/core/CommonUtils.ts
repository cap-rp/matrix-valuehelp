import type { ActionParameter as EdmActionParameter } from "@sap-ux/vocabularies-types";
import type * as Edm from "@sap-ux/vocabularies-types/Edm";
import type { FilterRestrictionsType } from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type {
	SemanticObjectMappingAbstractTypes,
	SemanticObjectMappingTypeTypes,
	SemanticObjectUnavailableActions
} from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type { SelectionPresentationVariant, SelectionVariantType, TextArrangement } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import uniqueSort from "sap/base/util/array/uniqueSort";
import mergeObjects from "sap/base/util/merge";
import type AppComponent from "sap/fe/core/AppComponent";
import type { ComponentData } from "sap/fe/core/AppComponent";
import type { FEView } from "sap/fe/core/BaseController";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import ConverterContext from "sap/fe/core/converters/ConverterContext";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfType } from "sap/fe/core/helpers/TypeGuards";
import type { IShellServices } from "sap/fe/core/services/ShellServicesFactory";
import type Diagnostics from "sap/fe/core/support/Diagnostics";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type Button from "sap/m/Button";
import type MenuButton from "sap/m/MenuButton";
import type MenuItem from "sap/m/MenuItem";
import type NavContainer from "sap/m/NavContainer";
import type OverflowToolbarButton from "sap/m/OverflowToolbarButton";
import Device from "sap/ui/Device";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { BaseAggregationBindingInfo } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";
import type View from "sap/ui/core/mvc/View";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import type { default as MDCChart } from "sap/ui/mdc/Chart";
import type Table from "sap/ui/mdc/Table";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type MDCTable from "sap/ui/mdc/valuehelp/content/MDCTable";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import type FilterOperator from "sap/ui/model/FilterOperator";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { Link } from "sap/ushell/services/Navigation";
import type ObjectPageDynamicHeaderTitle from "sap/uxap/ObjectPageDynamicHeaderTitle";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type {
	ExpandPathType,
	MetaModelEntityType,
	MetaModelEnum,
	MetaModelNavProperty,
	MetaModelProperty,
	MetaModelType
} from "types/metamodel_types";
import AnyElement from "./controls/AnyElement";
import { getRangeDefinition } from "./converters/helpers/SelectionVariantHelper";
import * as MetaModelFunction from "./helpers/MetaModelFunction";

type MyInboxIntent = {
	semanticObject: string;
	action: string;
};

function normalizeSearchTerm(sSearchTerm: string | undefined): string | undefined {
	if (!sSearchTerm) {
		return undefined;
	}

	// checking for search term "OR" is to allow the SD specific search for SaleOrderType=OR (OR is a hana keyword)
	if (sSearchTerm === "OR") {
		return '"' + sSearchTerm + '"';
	}

	const convertedSearchTerm = sSearchTerm.replace(/["();]/g, " "); // these are the specific characters that fail on both, CAP and RAP: "();
	if (convertedSearchTerm === "" || convertedSearchTerm === " ") {
		return undefined;
	}
	return convertedSearchTerm;
}

async function waitForContextRequested(bindingContext: ODataV4Context): Promise<void> {
	const model = bindingContext.getModel();
	const metaModel = model.getMetaModel();
	const entityPath = metaModel.getMetaPath(bindingContext.getPath());
	const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(entityPath));
	await bindingContext.requestProperty(dataModel.targetEntityType.keys[0]?.name);
}

function fnHasTransientContexts(oListBinding: ODataListBinding): boolean {
	let bHasTransientContexts = false;
	if (oListBinding) {
		oListBinding.getCurrentContexts().forEach(function (oContext: ODataV4Context) {
			if (oContext && oContext.isTransient()) {
				bHasTransientContexts = true;
			}
		});
	}
	return bHasTransientContexts;
}

// there is no navigation in entitySet path and property path

async function _getSOIntents(
	oShellServiceHelper: IShellServices,
	oObjectPageLayout: ObjectPageLayout,
	oSemanticObject: string | undefined,
	oParam: object | undefined
): Promise<Link[][]> {
	return oShellServiceHelper.getLinks([
		{
			semanticObject: oSemanticObject,
			params: oParam
		}
	]);
}

type SOMapping = { LocalProperty: { $PropertyPath: string }; SemanticObjectProperty: unknown };
// TO-DO add this as part of applySemanticObjectmappings logic in IntentBasednavigation controller extension
function _createMappings(oMapping: Record<string, unknown>): SOMapping[] {
	const aSOMappings: SOMapping[] = [];
	const aMappingKeys = Object.keys(oMapping);
	let oSemanticMapping: SOMapping;
	for (const element of aMappingKeys) {
		oSemanticMapping = {
			LocalProperty: {
				$PropertyPath: element
			},
			SemanticObjectProperty: oMapping[element]
		};
		aSOMappings.push(oSemanticMapping);
	}

	return aSOMappings;
}
type SemanticItem = {
	text: string;
	targetSemObject: string;
	targetAction: string;
	targetParams: unknown;
};
/**
 * @param linkGroup
 * @param aExcludedActions
 * @param oTargetParams
 * @param aItems
 * @param aAllowedActions
 */
function _getRelatedAppsMenuItems(
	linkGroup: Link[][],
	aExcludedActions: unknown[],
	oTargetParams: unknown,
	aItems: SemanticItem[],
	aAllowedActions?: unknown[]
): void {
	for (const links of linkGroup) {
		for (const oLink of links) {
			const sIntent = oLink.intent;
			const sAction = sIntent.split("-")[1].split("?")[0];
			if (
				(aAllowedActions && aAllowedActions.includes(sAction)) ||
				(!aAllowedActions && aExcludedActions && !aExcludedActions.includes(sAction))
			) {
				aItems.push({
					text: oLink.text,
					targetSemObject: sIntent.split("#")[1].split("-")[0],
					targetAction: sAction.split("~")[0],
					targetParams: oTargetParams
				});
			}
		}
	}
}

export type SemanticObject = {
	allowedActions?: unknown[];
	unavailableActions?: unknown[];
	semanticObject: string;
	path: string;
	mapping?: Record<string, string>;
};

function _getRelatedIntents(
	oAdditionalSemanticObjects: SemanticObject,
	oBindingContext: Context,
	aManifestSOItems: SemanticItem[],
	aLinks: Link[][]
): void {
	if (aLinks && aLinks.length > 0) {
		const aAllowedActions = oAdditionalSemanticObjects.allowedActions || undefined;
		const aExcludedActions = oAdditionalSemanticObjects.unavailableActions ? oAdditionalSemanticObjects.unavailableActions : [];
		const aSOMappings = oAdditionalSemanticObjects.mapping ? _createMappings(oAdditionalSemanticObjects.mapping) : [];
		const oTargetParams = { navigationContexts: oBindingContext, semanticObjectMapping: aSOMappings };
		_getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aManifestSOItems, aAllowedActions);
	}
}

/**
 * This function fetches the related intents when semantic object and action are passed from feEnvironment.getIntent() only in case of My Inbox integration.
 * @param semanticObjectAndAction This specifies the semantic object and action for fetching the intents
 * @param oBindingContext This sepcifies the binding context for updating related apps
 * @param appComponentSOItems This is a list of semantic items used for updating the related apps button
 * @param aLinks This is an array comprising of related intents
 */

function _getRelatedIntentsWithSemanticObjectsAndAction(
	semanticObjectAndAction: MyInboxIntent,
	oBindingContext: Context,
	appComponentSOItems: SemanticItem[],
	aLinks: Link[][]
): void {
	if (aLinks.length > 0) {
		const actions = [semanticObjectAndAction.action];
		const excludedActions: [] = [];
		const soMappings: [] = [];
		const targetParams = { navigationContexts: oBindingContext, semanticObjectMapping: soMappings };
		_getRelatedAppsMenuItems(aLinks, excludedActions, targetParams, appComponentSOItems, actions);
	}
}

type SemanticObjectConfig = {
	additionalSemanticObjects: Record<string, SemanticObject>;
};
type RelatedAppsConfig = {
	text: string;
	targetSemObject: string;
	targetAction: string;
};
async function updateRelateAppsModel(
	oBindingContext: Context,
	oEntry: Record<string, unknown> | undefined,
	oObjectPageLayout: ObjectPageLayout,
	aSemKeys: { $PropertyPath: string }[],
	oMetaModel: ODataMetaModel,
	oMetaPath: string,
	appComponent: AppComponent
): Promise<RelatedAppsConfig[]> {
	const oShellServiceHelper: IShellServices = appComponent.getShellServices();
	const oParam: Record<string, unknown> = {};
	let sCurrentSemObj = "",
		sCurrentAction = "";
	let oSemanticObjectAnnotations;
	let aRelatedAppsMenuItems: RelatedAppsConfig[] = [];
	let aExcludedActions: unknown[] = [];
	let aManifestSOKeys: string[];

	async function fnGetParseShellHashAndGetLinks(): Promise<Link[][]> {
		const oParsedUrl = oShellServiceHelper.parseShellHash(document.location.hash);
		sCurrentSemObj = oParsedUrl.semanticObject; // Current Semantic Object
		sCurrentAction = oParsedUrl.action;
		return _getSOIntents(oShellServiceHelper, oObjectPageLayout, sCurrentSemObj, oParam);
	}

	try {
		if (oEntry) {
			if (aSemKeys && aSemKeys.length > 0) {
				for (const element of aSemKeys) {
					const sSemKey = element.$PropertyPath;
					if (!oParam[sSemKey]) {
						oParam[sSemKey] = { value: oEntry[sSemKey] };
					}
				}
			} else {
				// fallback to Technical Keys if no Semantic Key is present
				const aTechnicalKeys = oMetaModel.getObject(`${oMetaPath}/$Type/$Key`);
				for (const key in aTechnicalKeys) {
					const sObjKey = aTechnicalKeys[key];
					if (!oParam[sObjKey]) {
						oParam[sObjKey] = { value: oEntry[sObjKey] };
					}
				}
			}
		}
		// Logic to read additional SO from manifest and updated relatedapps model

		const oManifestData = getTargetView(oObjectPageLayout).getViewData() as SemanticObjectConfig;
		const aManifestSOItems: SemanticItem[] = [];
		let semanticObjectIntents;
		if (oManifestData.additionalSemanticObjects) {
			aManifestSOKeys = Object.keys(oManifestData.additionalSemanticObjects);
			for (const element of aManifestSOKeys) {
				semanticObjectIntents = await Promise.resolve(_getSOIntents(oShellServiceHelper, oObjectPageLayout, element, oParam));
				_getRelatedIntents(
					oManifestData.additionalSemanticObjects[element],
					oBindingContext,
					aManifestSOItems,
					semanticObjectIntents
				);
			}
		}

		// appComponentSOItems is updated in case of My Inbox integration when semantic object and action are passed from feEnvironment.getIntent() method
		// In other cases it remains as an empty list
		// We concat this list towards the end with aManifestSOItems

		const appComponentSOItems: SemanticItem[] = [];
		const componentData: ComponentData = appComponent.getComponentData();
		if (componentData.feEnvironment && componentData.feEnvironment.getIntent()) {
			const intent: MyInboxIntent = componentData.feEnvironment.getIntent();
			semanticObjectIntents = await Promise.resolve(
				_getSOIntents(oShellServiceHelper, oObjectPageLayout, intent.semanticObject, oParam)
			);
			_getRelatedIntentsWithSemanticObjectsAndAction(intent, oBindingContext, appComponentSOItems, semanticObjectIntents);
		}

		const internalModelContext = oObjectPageLayout.getBindingContext("internal") as InternalModelContext;
		const aLinks = await fnGetParseShellHashAndGetLinks();
		if (aLinks) {
			if (aLinks.length > 0) {
				let isSemanticObjectHasSameTargetInManifest = false;
				const oTargetParams: {
					navigationContexts?: Context;
					semanticObjectMapping?: MetaModelType<SemanticObjectMappingAbstractTypes>[];
				} = {};
				const aAnnotationsSOItems: SemanticItem[] = [];
				const sEntitySetPath = `${oMetaPath}@`;
				const sEntityTypePath = `${oMetaPath}/@`;
				const oEntitySetAnnotations = oMetaModel.getObject(sEntitySetPath);
				oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntitySetAnnotations, sCurrentSemObj);
				if (!oSemanticObjectAnnotations.bHasEntitySetSO) {
					const oEntityTypeAnnotations = oMetaModel.getObject(sEntityTypePath);
					oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntityTypeAnnotations, sCurrentSemObj);
				}
				aExcludedActions = oSemanticObjectAnnotations.aUnavailableActions;
				//Skip same application from Related Apps
				aExcludedActions.push(sCurrentAction);
				oTargetParams.navigationContexts = oBindingContext;
				oTargetParams.semanticObjectMapping = oSemanticObjectAnnotations.aMappings;
				_getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aAnnotationsSOItems);

				aManifestSOItems.forEach(function ({ targetSemObject }) {
					if (aAnnotationsSOItems[0]?.targetSemObject === targetSemObject) {
						isSemanticObjectHasSameTargetInManifest = true;
					}
				});

				// remove all actions from current hash application if manifest contains empty allowedActions
				if (
					oManifestData.additionalSemanticObjects &&
					aAnnotationsSOItems[0] &&
					oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject] &&
					!!oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject].allowedActions
				) {
					isSemanticObjectHasSameTargetInManifest = true;
				}
				const soItems = aManifestSOItems.concat(appComponentSOItems);
				aRelatedAppsMenuItems = isSemanticObjectHasSameTargetInManifest ? soItems : soItems.concat(aAnnotationsSOItems);
				// If no app in list, related apps button will be hidden
				internalModelContext.setProperty("relatedApps/visibility", aRelatedAppsMenuItems.length > 0);
				internalModelContext.setProperty("relatedApps/items", aRelatedAppsMenuItems);
			} else {
				internalModelContext.setProperty("relatedApps/visibility", false);
			}
		} else {
			internalModelContext.setProperty("relatedApps/visibility", false);
		}
	} catch (error: unknown) {
		Log.error("Cannot read links", error as string);
	}
	return aRelatedAppsMenuItems;
}

function _getSemanticObjectAnnotations(
	oEntityAnnotations: Record<string, unknown>,
	sCurrentSemObj: string
): {
	bHasEntitySetSO: boolean;
	aAllowedActions: string[];
	aUnavailableActions: MetaModelType<SemanticObjectUnavailableActions>[];
	aMappings: MetaModelType<SemanticObjectMappingAbstractTypes>[];
} {
	const oSemanticObjectAnnotations = {
		bHasEntitySetSO: false,
		aAllowedActions: [],
		aUnavailableActions: [] as MetaModelType<SemanticObjectUnavailableActions>[],
		aMappings: [] as MetaModelType<SemanticObjectMappingAbstractTypes>[]
	};
	let sAnnotationMappingTerm, sAnnotationActionTerm;
	let sQualifier;
	for (const key in oEntityAnnotations) {
		if (key.includes(CommonAnnotationTerms.SemanticObject) && oEntityAnnotations[key] === sCurrentSemObj) {
			oSemanticObjectAnnotations.bHasEntitySetSO = true;
			sAnnotationMappingTerm = `@${CommonAnnotationTerms.SemanticObjectMapping}`;
			sAnnotationActionTerm = `@${CommonAnnotationTerms.SemanticObjectUnavailableActions}`;

			if (key.includes("#")) {
				sQualifier = key.split("#")[1];
				sAnnotationMappingTerm = `${sAnnotationMappingTerm}#${sQualifier}`;
				sAnnotationActionTerm = `${sAnnotationActionTerm}#${sQualifier}`;
			}
			if (oEntityAnnotations[sAnnotationMappingTerm]) {
				oSemanticObjectAnnotations.aMappings = oSemanticObjectAnnotations.aMappings.concat(
					oEntityAnnotations[sAnnotationMappingTerm] as MetaModelType<SemanticObjectMappingAbstractTypes>
				);
			}

			if (oEntityAnnotations[sAnnotationActionTerm]) {
				oSemanticObjectAnnotations.aUnavailableActions = oSemanticObjectAnnotations.aUnavailableActions.concat(
					oEntityAnnotations[sAnnotationActionTerm] as MetaModelType<SemanticObjectUnavailableActions>
				);
			}

			break;
		}
	}
	return oSemanticObjectAnnotations;
}

async function fnUpdateRelatedAppsDetails(oObjectPageLayout: ObjectPageLayout, appComponent: AppComponent): Promise<unknown> {
	const oMetaModel = (oObjectPageLayout.getModel() as ODataModel).getMetaModel();
	const oBindingContext = oObjectPageLayout.getBindingContext() as ODataV4Context;
	const path = (oBindingContext && oBindingContext.getPath()) || "";
	const oMetaPath = oMetaModel.getMetaPath(path);
	// Semantic Key Vocabulary
	const sSemanticKeyVocabulary = `${oMetaPath}/` + `@com.sap.vocabularies.Common.v1.SemanticKey`;
	//Semantic Keys
	const aSemKeys = oMetaModel.getObject(sSemanticKeyVocabulary);
	// Unavailable Actions
	const oEntry = oBindingContext?.getObject();
	if (!oEntry && oBindingContext) {
		oBindingContext
			.requestObject()
			.then(async function (requestedObject: Record<string, unknown> | undefined) {
				return CommonUtils.updateRelateAppsModel(
					oBindingContext,
					requestedObject,
					oObjectPageLayout,
					aSemKeys,
					oMetaModel,
					oMetaPath,
					appComponent
				);
			})
			.catch(function (oError: unknown) {
				Log.error("Cannot update the related app details", oError as string);
			});
	} else {
		return CommonUtils.updateRelateAppsModel(oBindingContext, oEntry, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent);
	}
}

/**
 * @param oButton
 */
function fnFireButtonPress(oButton?: Control): void {
	if (
		oButton &&
		oButton.isA<Button | OverflowToolbarButton>(["sap.m.Button", "sap.m.OverflowToolbarButton"]) &&
		oButton.getVisible() &&
		oButton.getEnabled()
	) {
		oButton.firePress();
	}
}

function getAppComponent(oControl: Control | Component): AppComponent {
	if (oControl.isA<AppComponent>("sap.fe.core.AppComponent")) {
		return oControl;
	}
	const oOwner = Component.getOwnerComponentFor(oControl);
	if (!oOwner) {
		throw new Error("There should be a sap.fe.core.AppComponent as owner of the control");
	} else {
		return getAppComponent(oOwner);
	}
}

function getCurrentPageView(oAppComponent: AppComponent): FEView {
	const rootViewController = oAppComponent.getRootViewController();
	return rootViewController.isFclEnabled()
		? rootViewController.getRightmostView()
		: CommonUtils.getTargetView((oAppComponent.getRootContainer() as NavContainer).getCurrentPage());
}

function getTargetView(oControl: ManagedObject | null): FEView {
	if (oControl && oControl.isA<ComponentContainer>("sap.ui.core.ComponentContainer")) {
		const oComponent = oControl.getComponentInstance();
		oControl = oComponent && oComponent.getRootControl();
	}
	while (oControl && !oControl.isA<FEView>("sap.ui.core.mvc.View")) {
		oControl = oControl.getParent();
	}
	return oControl!;
}

function _fnCheckIsMatch(oObject: object, oKeysToCheck: Record<string, unknown>): boolean {
	for (const sKey in oKeysToCheck) {
		if (oKeysToCheck[sKey] !== oObject[sKey as keyof typeof oObject]) {
			return false;
		}
	}
	return true;
}

function fnGetContextPathProperties(
	metaModelContext: ODataMetaModel,
	sContextPath: string,
	oFilter?: Record<string, unknown>
): Record<string, MetaModelProperty> | Record<string, MetaModelNavProperty> {
	const oEntityType: MetaModelEntityType = (metaModelContext.getObject(`${sContextPath}/`) || {}) as MetaModelEntityType,
		oProperties: Record<string, MetaModelProperty> | Record<string, MetaModelNavProperty> = {};

	for (const sKey in oEntityType) {
		if (
			oEntityType.hasOwnProperty(sKey) &&
			!/^\$/i.test(sKey) &&
			oEntityType[sKey].$kind &&
			_fnCheckIsMatch(oEntityType[sKey], oFilter || { $kind: "Property" })
		) {
			oProperties[sKey] = oEntityType[sKey];
		}
	}
	return oProperties;
}

function fnGetIBNActions(oControl: Table | ObjectPageDynamicHeaderTitle | ObjectPageSubSection, aIBNActions: UI5Element[]): UI5Element[] {
	const aActions = oControl && oControl.getActions();
	if (aActions) {
		aActions.forEach(function (oAction) {
			if (oAction.isA<ActionToolbarAction>("sap.ui.mdc.actiontoolbar.ActionToolbarAction")) {
				oAction = oAction.getAction();
			}
			if (oAction.isA<MenuButton>("sap.m.MenuButton")) {
				const oMenu = oAction.getMenu();
				const aItems = oMenu.getItems();
				aItems.forEach((oItem) => {
					if (oItem.data("IBNData")) {
						aIBNActions.push(oItem);
					}
				});
			} else if (oAction.data("IBNData")) {
				aIBNActions.push(oAction);
			}
		});
	}
	return aIBNActions;
}

async function fnUpdateDataFieldForIBNButtonsVisibility(aIBNActions: UI5Element[], oView: View): Promise<void> {
	const oParams: Record<string, { value: unknown }> = {};
	const oAppComponent = CommonUtils.getAppComponent(oView);
	const isSticky = ModelHelper.isStickySessionSupported((oView.getModel() as ODataModel).getMetaModel());
	const fnGetLinks = function (oData?: Record<string, unknown> | undefined): void {
		if (oData) {
			const aKeys = Object.keys(oData);
			aKeys.forEach(function (sKey: string) {
				if (sKey.indexOf("_") !== 0 && !sKey.includes("odata.context")) {
					oParams[sKey] = { value: oData[sKey] };
				}
			});
		}
		if (aIBNActions.length) {
			aIBNActions.forEach(function (oIBNAction) {
				const sSemanticObject = oIBNAction.data("IBNData").semanticObject;
				const sAction = oIBNAction.data("IBNData").action;
				oAppComponent
					.getShellServices()
					.getLinks([
						{
							semanticObject: sSemanticObject,
							action: sAction,
							params: oParams
						}
					])
					.then(function (aLink): void {
						if (oIBNAction.isA<Control>("sap.ui.core.Control") || oIBNAction.isA<MenuItem>("sap.m.MenuItem")) {
							oIBNAction.setVisible(
								oIBNAction.getVisible() && aLink && aLink.length === 1 && aLink[0] && aLink[0].length === 1
							);
						}
						if (isSticky) {
							(oIBNAction.getBindingContext("internal") as InternalModelContext).setProperty(
								oIBNAction.getId().split("--")[1],
								{
									shellNavigationNotAvailable: !(aLink && aLink.length === 1 && aLink[0] && aLink[0].length === 1)
								}
							);
						}
						return;
					})
					.catch(function (oError: unknown) {
						Log.error("Cannot retrieve the links from the shell service", oError as string);
					});
			});
		}
	};
	if (oView && oView.getBindingContext()) {
		return (oView.getBindingContext() as ODataV4Context)
			?.requestObject()
			.then(function (oData: Record<string, unknown> | undefined) {
				return fnGetLinks(oData);
			})
			.catch(function (oError: unknown) {
				Log.error("Cannot retrieve the links from the shell service", oError as string);
			});
	} else {
		return fnGetLinks();
	}
}

/**
 * Updates the menu button visibility if all the underlying selection buttons are hidden.
 * @param IBNActions
 */
function updateMenuButtonVisiblity(IBNActions: UI5Element[]): void {
	const menuButtonWithIBNAction: MenuButton[] = [];
	IBNActions.forEach(function (IBNAction) {
		if (IBNAction.isA<MenuButton>("sap.m.MenuItem")) {
			menuButtonWithIBNAction.push(IBNAction.getParent()?.getParent() as MenuButton);
		}
	});
	menuButtonWithIBNAction.forEach(function (menuAction) {
		const menuItems = menuAction.getMenu().getItems();
		const visibleMenuItems = menuItems.filter(function (menuItem) {
			return menuItem.getVisible();
		});
		if (visibleMenuItems.length === 0) {
			menuAction.setVisible(false);
		}
	});
}

function getActionPath(
	actionContext: Context,
	bReturnOnlyPath: boolean,
	inActionName?: string,
	bCheckStaticValue?: boolean
):
	| string
	| {
			sContextPath: string;
			sProperty: string;
			sBindingParameter: string;
	  } {
	const sActionName: string = !inActionName ? actionContext.getObject(actionContext.getPath()).toString() : inActionName;
	let sContextPath = actionContext.getPath().split("/@")[0];
	const sEntityTypeName = (actionContext.getObject(sContextPath) as MetaModelEntityType).$Type;
	const sEntityName = getEntitySetName(actionContext.getModel() as ODataMetaModel, sEntityTypeName);
	if (sEntityName) {
		sContextPath = `/${sEntityName}`;
	}
	if (bCheckStaticValue) {
		return actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable`);
	}
	if (bReturnOnlyPath) {
		return `${sContextPath}/${sActionName}`;
	} else {
		return {
			sContextPath: sContextPath,
			sProperty: actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable/$Path`),
			sBindingParameter: actionContext.getObject(`${sContextPath}/${sActionName}/@$ui5.overload/0/$Parameter/0/$Name`)
		};
	}
}

function getEntitySetName(oMetaModel: ODataMetaModel, sEntityType: string): string | undefined {
	const oEntityContainer = oMetaModel.getObject("/");
	for (const key in oEntityContainer) {
		if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
			return key;
		}
	}
}

function computeDisplayMode(
	oPropertyAnnotations: Record<string, unknown>,
	oCollectionAnnotations?: Record<string, unknown>
): "Description" | "ValueDescription" | "Value" | "DescriptionValue" {
	const oTextAnnotation = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"],
		oTextArrangementAnnotation = (oTextAnnotation &&
			((oPropertyAnnotations &&
				oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]) ||
				(oCollectionAnnotations &&
					oCollectionAnnotations["@com.sap.vocabularies.UI.v1.TextArrangement"]))) as MetaModelEnum<TextArrangement>;

	if (oTextArrangementAnnotation) {
		if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
			return "Description";
		} else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
			return "ValueDescription";
		} else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate") {
			return "Value";
		}
		//Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
		return "DescriptionValue";
	}
	return oTextAnnotation ? "DescriptionValue" : "Value";
}

function _getEntityType(oContext: ODataV4Context): string | undefined {
	const oMetaModel = oContext.getModel().getMetaModel();
	return oMetaModel.getObject(`${oMetaModel.getMetaPath(oContext.getPath())}/$Type`);
}

async function _requestObject(sAction: string, oSelectedContext: ODataV4Context, sProperty: string): Promise<unknown> {
	let oContext = oSelectedContext;
	const nBracketIndex = sAction.indexOf("(");

	if (nBracketIndex > -1) {
		const sTargetType = sAction.slice(nBracketIndex + 1, -1);
		let sCurrentType = _getEntityType(oContext);

		while (sCurrentType !== sTargetType) {
			// Find parent binding context and retrieve entity type
			oContext = oContext.getBinding().getContext() as ODataV4Context;
			if (oContext) {
				sCurrentType = _getEntityType(oContext);
			} else {
				Log.warning("Cannot determine target type to request property value for bound action invocation");
				return Promise.resolve(undefined);
			}
		}
	}

	return oContext.requestObject(sProperty);
}

export type _RequestedProperty = {
	vPropertyValue: unknown;
	oSelectedContext: Context;
	sAction: string;
	sDynamicActionEnabledPath: string;
};
async function requestProperty(
	oSelectedContext: ODataV4Context,
	sAction: string,
	sProperty: string,
	sDynamicActionEnabledPath: string
): Promise<_RequestedProperty> {
	const oPromise =
		sProperty && sProperty.indexOf("/") === 0
			? requestSingletonProperty(sProperty, oSelectedContext.getModel())
			: _requestObject(sAction, oSelectedContext, sProperty);

	return oPromise.then(function (vPropertyValue: unknown) {
		return {
			vPropertyValue: vPropertyValue,
			oSelectedContext: oSelectedContext,
			sAction: sAction,
			sDynamicActionEnabledPath: sDynamicActionEnabledPath
		};
	});
}

async function setContextsBasedOnOperationAvailable(
	oInternalModelContext: InternalModelContext,
	aRequestPromises: Promise<_RequestedProperty>[],
	forContextMenu = false
): Promise<void> {
	return Promise.all(aRequestPromises)
		.then(function (aResults): void {
			if (aResults.length) {
				const aApplicableContexts: unknown[] = [],
					aNotApplicableContexts: unknown[] = [];
				aResults.forEach(function (aResult) {
					if (aResult) {
						if (aResult.vPropertyValue) {
							oInternalModelContext.getModel().setProperty(aResult.sDynamicActionEnabledPath, true);
							aApplicableContexts.push(aResult.oSelectedContext);
						} else {
							aNotApplicableContexts.push(aResult.oSelectedContext);
						}
					}
				});
				setDynamicActionContexts(
					oInternalModelContext,
					aResults[0].sAction,
					aApplicableContexts,
					aNotApplicableContexts,
					forContextMenu
				);
			}
			return;
		})
		.catch(function (oError: unknown) {
			Log.trace("Cannot retrieve property value from path", oError as string);
		});
}

/**
 * @param internalModelContext
 * @param action
 * @param applicable
 * @param notApplicable
 * @param forContextMenu
 */
function setDynamicActionContexts(
	internalModelContext: InternalModelContext,
	action: string,
	applicable: unknown[],
	notApplicable: unknown[],
	forContextMenu = false
): void {
	const dynamicActionPathPrefix = `${internalModelContext.getPath()}/dynamicActions/${action}`,
		internalModel = internalModelContext.getModel(),
		applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu",
		notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
	internalModel.setProperty(`${dynamicActionPathPrefix}/${applicableProperty}`, applicable);
	internalModel.setProperty(`${dynamicActionPathPrefix}/${notApplicableProperty}`, notApplicable);
}

function getSpecificAllowedExpression(aExpressions: string[]): string {
	const aAllowedExpressionsPriority = CommonUtils.AllowedExpressionsPrio;

	aExpressions.sort(function (a: string, b: string) {
		return aAllowedExpressionsPriority.indexOf(a) - aAllowedExpressionsPriority.indexOf(b);
	});

	return aExpressions[0];
}

/**
 * Method to return allowed operators for type Guid.
 * @returns Allowed operators for type Guid
 */
function getOperatorsForGuidProperty(): string {
	const allowedOperatorsForGuid = ["EQ", "NE"];
	return allowedOperatorsForGuid.toString();
}

type ParameterInfo = {
	contextPath?: string;
	parameterProperties?: Record<string, MetaModelProperty>;
};
function getParameterInfo(metaModelContext: ODataMetaModel, sContextPath: string): ParameterInfo {
	const sParameterContextPath = sContextPath.substring(0, sContextPath.lastIndexOf("/"));
	const bResultContext = metaModelContext.getObject(`${sParameterContextPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
	const oParameterInfo: ParameterInfo = {};
	if (bResultContext && sParameterContextPath !== sContextPath) {
		oParameterInfo.contextPath = sParameterContextPath;
		oParameterInfo.parameterProperties = CommonUtils.getContextPathProperties(metaModelContext, sParameterContextPath) as Record<
			string,
			MetaModelProperty
		>;
	}
	return oParameterInfo;
}

type ViewData = {
	controlConfiguration?: Record<string, Record<string, unknown>>;
};

function addPageContextToSelectionVariant(oSelectionVariant: SelectionVariant, mPageContext: unknown[], oView: View): SelectionVariant {
	const oAppComponent = CommonUtils.getAppComponent(oView);
	const oNavigationService = oAppComponent.getNavigationService();
	return oNavigationService.mixAttributesAndSelectionVariant(mPageContext, oSelectionVariant.toJSONString());
}

function isStickyEditMode(oControl: Control): boolean {
	const bIsStickyMode = ModelHelper.isStickySessionSupported((oControl.getModel() as ODataModel).getMetaModel());
	const bUIEditable = CommonUtils.getIsEditable(oControl);
	return bIsStickyMode && bUIEditable;
}

export type UserDefaultParameter = EdmActionParameter | Context;

/**
 * Retrieves the user defaults from the startup app state (if available) or the startup parameter and sets them to a model.
 * @param appComponent
 * @param parameters
 * @param model
 * @param isAction
 * @param isCreate
 * @param actionDefaultValues
 */
async function setUserDefaults(
	appComponent: AppComponent,
	parameters: UserDefaultParameter[],
	model: JSONModel | ODataV4Context,
	isAction: boolean,
	isCreate?: boolean,
	actionDefaultValues?: Record<string, unknown>
): Promise<void> {
	const BaseType = (await import("sap/ui/mdc/enums/BaseType")).default;
	const TypeMap = (await import("sap/ui/mdc/odata/v4/TypeMap")).default;

	const componentData = appComponent.getComponentData(),
		startupParameters = (componentData && componentData.startupParameters) || {},
		shellServices = appComponent.getShellServices();
	const startupAppState = await shellServices.getStartupAppState(appComponent);
	const startupAppStateData = startupAppState?.getData() || {},
		extendedParameters = (startupAppStateData.selectionVariant && startupAppStateData.selectionVariant.SelectOptions) || [];
	parameters.forEach(function (oParameter) {
		const sPropertyName = isAction
			? `/${(oParameter as { name: string }).name}`
			: (oParameter as Context).getPath?.().slice((oParameter as Context).getPath().lastIndexOf("/") + 1);
		const sParameterName = isAction ? sPropertyName.slice(1) : sPropertyName;
		if (actionDefaultValues && isCreate) {
			if (actionDefaultValues[sParameterName]) {
				model.setProperty(sPropertyName, actionDefaultValues[sParameterName]);
			}
		} else if (startupParameters[sParameterName]) {
			const parametertType = (
				oParameter as {
					name: string;
					type?: string;
				}
			).type
				? TypeMap.getBaseType(
						(
							oParameter as {
								name: string;
								type: string;
							}
						).type
				  )
				: BaseType.String;
			const typeInstance = TypeMap.getDataTypeInstance(parametertType);
			model.setProperty(sPropertyName, typeInstance.parseValue(startupParameters[sParameterName][0], "string"));
		} else if (extendedParameters.length > 0) {
			for (const oExtendedParameter of extendedParameters) {
				if (oExtendedParameter.PropertyName === sParameterName) {
					const oRange = oExtendedParameter.Ranges.length
						? oExtendedParameter.Ranges[oExtendedParameter.Ranges.length - 1]
						: undefined;
					if (oRange && oRange.Sign === "I" && oRange.Option === "EQ") {
						model.setProperty(sPropertyName, oRange.Low); // high is ignored when Option=EQ
					}
				}
			}
		}
	});
}

export type InboundParameter = {
	useForCreate: boolean;
};
function getAdditionalParamsForCreate(
	oStartupParameters: Record<string, unknown[]>,
	oInboundParameters?: Record<string, InboundParameter>
): unknown {
	const oInbounds = oInboundParameters,
		aCreateParameters =
			oInbounds !== undefined
				? Object.keys(oInbounds).filter(function (sParameter: string) {
						return oInbounds[sParameter].useForCreate;
				  })
				: [];
	let oRet;
	for (const element of aCreateParameters) {
		const sCreateParameter = element;
		const aValues = oStartupParameters && oStartupParameters[sCreateParameter];
		if (aValues && aValues.length === 1) {
			oRet = oRet || Object.create(null);
			oRet[sCreateParameter] = aValues[0];
		}
	}
	return oRet;
}
type OutboundParameter = {
	parameters: Record<string, OutboundParameterValue>;
	semanticObject?: string;
	action?: string;
};
type OutboundParameterValue = {
	value?: {
		value?: string;
		format?: string;
	};
};
function getSemanticObjectMapping(oOutbound: OutboundParameter): MetaModelType<SemanticObjectMappingTypeTypes>[] {
	const aSemanticObjectMapping: MetaModelType<SemanticObjectMappingTypeTypes>[] = [];
	// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
	if (oOutbound.parameters) {
		const aParameters = Object.keys(oOutbound.parameters) || [];
		if (aParameters.length > 0) {
			aParameters.forEach(function (sParam: string) {
				const oMapping = oOutbound.parameters[sParam];
				if (oMapping.value && oMapping.value.value && oMapping.value.format === "binding") {
					// using the format of UI.Mapping
					const oSemanticMapping = {
						LocalProperty: {
							$PropertyPath: oMapping.value.value
						},
						SemanticObjectProperty: sParam
					};

					if (aSemanticObjectMapping.length > 0) {
						// To check if the semanticObject Mapping is done for the same local property more that once then first one will be considered
						for (const element of aSemanticObjectMapping) {
							if (element.LocalProperty?.$PropertyPath !== oSemanticMapping.LocalProperty.$PropertyPath) {
								aSemanticObjectMapping.push(oSemanticMapping);
							}
						}
					} else {
						aSemanticObjectMapping.push(oSemanticMapping);
					}
				}
			});
		}
	}
	return aSemanticObjectMapping;
}

function getHeaderFacetItemConfigForExternalNavigation(
	oViewData: ViewData,
	oCrossNav: Record<string, OutboundParameter>
): Record<
	string,
	{
		semanticObject: string;
		action: string;
		semanticObjectMapping: MetaModelType<SemanticObjectMappingTypeTypes>[];
	}
> {
	const oHeaderFacetItems: Record<
		string,
		{
			semanticObject: string;
			action: string;
			semanticObjectMapping: MetaModelType<SemanticObjectMappingTypeTypes>[];
		}
	> = {};
	let sId;
	const oControlConfig = oViewData.controlConfiguration as Record<
		string,
		{
			navigation?: {
				targetOutbound?: {
					outbound: string;
				};
			};
		}
	>;
	for (const config in oControlConfig) {
		if (config.includes("@com.sap.vocabularies.UI.v1.DataPoint") || config.includes("@com.sap.vocabularies.UI.v1.Chart")) {
			const sOutbound = oControlConfig[config].navigation?.targetOutbound?.outbound;
			if (sOutbound !== undefined) {
				const oOutbound = oCrossNav[sOutbound];
				if (oOutbound.semanticObject && oOutbound.action) {
					if (config.includes("Chart")) {
						sId = generate(["fe", "MicroChartLink", config]);
					} else {
						sId = generate(["fe", "HeaderDPLink", config]);
					}
					const aSemanticObjectMapping = CommonUtils.getSemanticObjectMapping(oOutbound);
					oHeaderFacetItems[sId] = {
						semanticObject: oOutbound.semanticObject,
						action: oOutbound.action,
						semanticObjectMapping: aSemanticObjectMapping
					};
				} else {
					Log.error(`Cross navigation outbound is configured without semantic object and action for ${sOutbound}`);
				}
			}
		}
	}
	return oHeaderFacetItems;
}

function setSemanticObjectMappings(oSelectionVariant: SelectionVariant, vMappings: unknown): SelectionVariant {
	const oMappings = typeof vMappings === "string" ? JSON.parse(vMappings) : vMappings;
	for (const element of oMappings) {
		const sLocalProperty =
			(element["LocalProperty"] && element["LocalProperty"]["$PropertyPath"]) ||
			(element["@com.sap.vocabularies.Common.v1.LocalProperty"] && element["@com.sap.vocabularies.Common.v1.LocalProperty"]["$Path"]);
		const sSemanticObjectProperty =
			element["SemanticObjectProperty"] || element["@com.sap.vocabularies.Common.v1.SemanticObjectProperty"];
		const oSelectOption = oSelectionVariant.getSelectOption(sLocalProperty);
		if (oSelectOption) {
			//Create a new SelectOption with sSemanticObjectProperty as the property Name and remove the older one
			oSelectionVariant.removeSelectOption(sLocalProperty);
			oSelectionVariant.massAddSelectOption(sSemanticObjectProperty, oSelectOption);
		}
	}
	return oSelectionVariant;
}

type SemanticObjectFromPath = {
	semanticObjectPath: string;
	semanticObjectForGetLinks: { semanticObject: string }[];
	semanticObject: {
		semanticObject: { $Path: string };
	};
	unavailableActions: string[];
};
async function fnGetSemanticObjectsFromPath(
	oMetaModel: ODataMetaModel,
	sPath: string,
	sQualifier: string
): Promise<SemanticObjectFromPath> {
	return new Promise<SemanticObjectFromPath>(function (resolve) {
		let sSemanticObject, aSemanticObjectUnavailableActions;
		if (sQualifier === "") {
			sSemanticObject = oMetaModel.getObject(`${sPath}@${CommonAnnotationTerms.SemanticObject}`);
			aSemanticObjectUnavailableActions = oMetaModel.getObject(`${sPath}@${CommonAnnotationTerms.SemanticObjectUnavailableActions}`);
		} else {
			sSemanticObject = oMetaModel.getObject(`${sPath}@${CommonAnnotationTerms.SemanticObject}#${sQualifier}`);
			aSemanticObjectUnavailableActions = oMetaModel.getObject(
				`${sPath}@${CommonAnnotationTerms.SemanticObjectUnavailableActions}#${sQualifier}`
			);
		}

		const aSemanticObjectForGetLinks = [{ semanticObject: sSemanticObject }];
		const oSemanticObject = {
			semanticObject: sSemanticObject
		};
		resolve({
			semanticObjectPath: sPath,
			semanticObjectForGetLinks: aSemanticObjectForGetLinks,
			semanticObject: oSemanticObject,
			unavailableActions: aSemanticObjectUnavailableActions
		});
	});
}

async function fnGetSemanticObjectPromise(oMetaModel: ODataMetaModel, sPath: string, sQualifier: string): Promise<SemanticObjectFromPath> {
	return CommonUtils.getSemanticObjectsFromPath(oMetaModel, sPath, sQualifier);
}

function getFilterAllowedExpression(oFilterRestrictionsAnnotation?: MetaModelType<FilterRestrictionsType>): _FilterAllowedExpressions {
	const mAllowedExpressions: _FilterAllowedExpressions = {};
	if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation.FilterExpressionRestrictions !== undefined) {
		oFilterRestrictionsAnnotation.FilterExpressionRestrictions.forEach(function (oProperty) {
			if (oProperty.Property && oProperty.AllowedExpressions !== undefined) {
				//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
				if (mAllowedExpressions[oProperty.Property.$PropertyPath] !== undefined) {
					mAllowedExpressions[oProperty.Property.$PropertyPath].push(oProperty.AllowedExpressions);
				} else {
					mAllowedExpressions[oProperty.Property.$PropertyPath] = [oProperty.AllowedExpressions];
				}
			}
		});
	}
	return mAllowedExpressions;
}
function getFilterRestrictions(
	oFilterRestrictionsAnnotation?: MetaModelType<FilterRestrictionsType>,
	sRestriction?: "RequiredProperties" | "NonFilterableProperties"
): string[] {
	let aProps: string[] = [];
	if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation[sRestriction as keyof MetaModelType<FilterRestrictionsType>]) {
		aProps = (
			oFilterRestrictionsAnnotation[sRestriction as keyof MetaModelType<FilterRestrictionsType>] as ExpandPathType<Edm.PropertyPath>[]
		).map(function (oProperty: ExpandPathType<Edm.PropertyPath>) {
			return oProperty.$PropertyPath;
		});
	}
	return aProps;
}

function _fetchPropertiesForNavPath(paths: string[], navPath: string, props: string[]): string[] {
	const navPathPrefix = navPath + "/";
	return paths.reduce((outPaths: string[], pathToCheck: string) => {
		if (pathToCheck.startsWith(navPathPrefix)) {
			const outPath = pathToCheck.replace(navPathPrefix, "");
			if (!outPaths.includes(outPath)) {
				outPaths.push(outPath);
			}
		}
		return outPaths;
	}, props);
}
type _FilterAllowedExpressions = Record<string, string[]>;
export type _FilterRestrictions = {
	RequiredProperties: string[];
	NonFilterableProperties: string[];
	FilterAllowedExpressions: _FilterAllowedExpressions;
};
function getFilterRestrictionsByPath(entityPath: string, oContext: ODataMetaModel): _FilterRestrictions {
	// NOTE: For getting FilterAllowedExpressions please use 'getAllowedFilterExpressionForProperty' from 'sap/fe/core/converters/controls/ListReport/FilterField.ts'.
	const oRet: _FilterRestrictions = {
		RequiredProperties: [],
		NonFilterableProperties: [],
		FilterAllowedExpressions: {}
	};
	let oFilterRestrictions;
	const navigationText = "$NavigationPropertyBinding";
	const frTerm = "@Org.OData.Capabilities.V1.FilterRestrictions";
	const entityTypePathParts = entityPath.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
	const entityTypePath = `/${entityTypePathParts.join("/")}/`;
	const entitySetPath = ModelHelper.getEntitySetPath(entityPath, oContext);
	const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
	const isContainment = oContext.getObject(`${entityTypePath}$ContainsTarget`);
	const containmentNavPath = !!isContainment && entityTypePathParts[entityTypePathParts.length - 1];

	//LEAST PRIORITY - Filter restrictions directly at Entity Set
	//e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
	if (!isContainment) {
		oFilterRestrictions = oContext.getObject(`${entitySetPath}${frTerm}`) as MetaModelType<FilterRestrictionsType> | undefined;
		oRet.RequiredProperties = getFilterRestrictions(oFilterRestrictions, "RequiredProperties") || [];
		const resultContextCheck = oContext.getObject(`${entityTypePath}@com.sap.vocabularies.Common.v1.ResultContext`);
		if (!resultContextCheck) {
			oRet.NonFilterableProperties = getFilterRestrictions(oFilterRestrictions, "NonFilterableProperties") || [];
		}
		//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
		oRet.FilterAllowedExpressions = getFilterAllowedExpression(oFilterRestrictions) || {};
	}

	if (entityTypePathParts.length > 1) {
		const navPath = isContainment ? (containmentNavPath as string) : entitySetPathParts[entitySetPathParts.length - 1];
		// In case of containment we take entitySet provided as parent. And in case of normal we would remove the last navigation from entitySetPath.
		const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(`/${navigationText}/`)}`;
		//THIRD HIGHEST PRIORITY - Reading property path restrictions - Annotation at main entity but directly on navigation property path
		//e.g. Parent Customer with PropertyPath="Set/CityName" ContextPath: Customer/Set
		const oParentRet: _FilterRestrictions = {
			RequiredProperties: [],
			NonFilterableProperties: [],
			FilterAllowedExpressions: {}
		};
		if (!navPath.includes("%2F")) {
			const oParentFR = oContext.getObject(`${parentEntitySetPath}${frTerm}`) as MetaModelType<FilterRestrictionsType> | undefined;
			oRet.RequiredProperties = _fetchPropertiesForNavPath(
				getFilterRestrictions(oParentFR, "RequiredProperties") || [],
				navPath,
				oRet.RequiredProperties || []
			);
			oRet.NonFilterableProperties = _fetchPropertiesForNavPath(
				getFilterRestrictions(oParentFR, "NonFilterableProperties") || [],
				navPath,
				oRet.NonFilterableProperties || []
			);
			//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
			const completeAllowedExps = getFilterAllowedExpression(oParentFR) || {};
			oParentRet.FilterAllowedExpressions = Object.keys(completeAllowedExps).reduce(
				(outProp: Record<string, string[]>, propPath: string) => {
					if (propPath.startsWith(navPath + "/")) {
						const outPropPath = propPath.replace(navPath + "/", "");
						outProp[outPropPath] = completeAllowedExps[propPath];
					}
					return outProp;
				},
				{} as Record<string, string[]>
			);
		}

		//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
		oRet.FilterAllowedExpressions = mergeObjects(
			{},
			oRet.FilterAllowedExpressions || {},
			oParentRet.FilterAllowedExpressions || {}
		) as Record<string, string[]>;

		//SECOND HIGHEST priority - Navigation restrictions
		//e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
		const oNavRestrictions = MetaModelFunction.getNavigationRestrictions(oContext, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
		const oNavFilterRest = oNavRestrictions && (oNavRestrictions["FilterRestrictions"] as MetaModelType<FilterRestrictionsType>);
		const navResReqProps = getFilterRestrictions(oNavFilterRest, "RequiredProperties") || [];
		oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navResReqProps));
		const navNonFilterProps = getFilterRestrictions(oNavFilterRest, "NonFilterableProperties") || [];
		oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navNonFilterProps));
		//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
		oRet.FilterAllowedExpressions = mergeObjects(
			{},
			oRet.FilterAllowedExpressions || {},
			getFilterAllowedExpression(oNavFilterRest) || {}
		) as Record<string, string[]>;

		//HIGHEST priority - Restrictions having target with navigation association entity
		// e.g. FR in "CustomerParameters/Set" ContextPath: "Customer/Set"
		const navAssociationEntityRest = oContext.getObject(
			`/${entityTypePathParts.join("/")}${frTerm}`
		) as MetaModelType<FilterRestrictionsType>;
		const navAssocReqProps = getFilterRestrictions(navAssociationEntityRest, "RequiredProperties") || [];
		oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navAssocReqProps));
		const navAssocNonFilterProps = getFilterRestrictions(navAssociationEntityRest, "NonFilterableProperties") || [];
		oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navAssocNonFilterProps));
		//SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
		oRet.FilterAllowedExpressions = mergeObjects(
			{},
			oRet.FilterAllowedExpressions,
			getFilterAllowedExpression(navAssociationEntityRest) || {}
		) as _FilterAllowedExpressions;
	}
	return oRet;
}

export type PreprocessorSettings = {
	appComponent?: AppComponent;
	bindingContexts: object;
	models: object;
};
export type BaseTreeModifier = {
	templateControlFragment(
		sFragmentName: string,
		mPreprocessorSettings: PreprocessorSettings,
		oView?: View
	): Promise<UI5Element[] | Element[]>;
	targets: string;
	getId(vControl: UI5Element | Element): string;
	getControlType(oControl: UI5Element | Element): string;
	getProperty<T>(oControl: UI5Element | Element, sPropertyName: string): Promise<T>;
	getAggregation(parent: UI5Element | Element, name: string): Promise<UI5Element[] | Element[]>;
	insertAggregation(
		parent: UI5Element | Element,
		name: string,
		control: UI5Element | Element | UI5Element[] | Element[],
		index?: number,
		view?: Element,
		skipAdjustIndex?: boolean
	): Promise<void>;
	setProperty(oControl: UI5Element | Element, sPropertyName: string, vValue: unknown): void;
	bySelector(oSelector: object, oAppComponent?: Component, oView?: Element): ManagedObject | Element;
};

async function templateControlFragment(
	sFragmentName: string | Element | null,
	oPreprocessorSettings: PreprocessorSettings,
	oInOptions?: {
		view?: View;
		isXML?: boolean;
		id?: string;
		controller?: PageController | ExtensionAPI;
		containingView?: View;
		contextPath?: string;
	},
	oModifier?: BaseTreeModifier
): Promise<Element | UI5Element | Element[] | UI5Element[]> {
	const oOptions = oInOptions || {};
	if (oModifier && typeof sFragmentName === "string") {
		return oModifier.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions.view).then(function (oFragment) {
			// This is required as Flex returns an HTMLCollection as templating result in XML time.
			return oModifier.targets === "xmlTree" && oFragment.length > 0 ? oFragment[0] : oFragment;
		});
	} else {
		const fragmentData =
			typeof sFragmentName === "string" ? XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment") : sFragmentName;
		const oFragment = await XMLPreprocessor.process(fragmentData, { name: sFragmentName }, oPreprocessorSettings);
		const oControl = oFragment.firstElementChild;
		if (!!oOptions.isXML && oControl) {
			return oControl;
		}
		let owner: { runAsOwner: <T>(fn: () => T) => T } = oPreprocessorSettings.appComponent ?? { runAsOwner: (fn) => fn() };
		if (oOptions.containingView) {
			const viewOwner = Component.getOwnerComponentFor(oOptions.containingView);
			if (viewOwner) {
				owner = viewOwner;
			}
		}
		let containingView: View | undefined;
		if (oOptions.view && !oOptions.controller) {
			// this is overall stupid, in case we are coming from the delegate with an xml node instead of a fragment we need to pass the containingView in there (done by the oModifier call for instance)
			// But in other runtime case where we are here we need to maintain the controller and thus cannot have a containingView...
			containingView = oOptions.view;
		}
		return owner.runAsOwner(async () => {
			return Fragment.load({
				id: oOptions.id,
				type: "SCOPEDFEFRAGMENT",
				contextPath: oOptions.contextPath,
				definition: oFragment as unknown as string,
				controller: oOptions.controller,
				containingView: containingView
			});
		});
	}
}

function getSingletonPath(path: string, metaModel: ODataMetaModel): string | undefined {
	const parts = path.split("/").filter(Boolean),
		propertyName = parts.pop()!,
		navigationPath = parts.join("/"),
		entitySet = navigationPath && metaModel.getObject(`/${navigationPath}`);
	if (entitySet?.$kind === "Singleton") {
		const singletonName = parts[parts.length - 1];
		return `/${singletonName}/${propertyName}`;
	}
	return undefined;
}

async function requestSingletonProperty(path: string, model: ODataModel): Promise<unknown> {
	if (!path || !model) {
		return Promise.resolve(null);
	}
	const metaModel = model.getMetaModel();
	// Find the underlying entity set from the property path and check whether it is a singleton.
	const resolvedPath = getSingletonPath(path, metaModel);
	if (resolvedPath) {
		const propertyBinding = model.bindProperty(resolvedPath);
		return propertyBinding.requestValue();
	}

	return Promise.resolve(null);
}

// Get the path for action parameters that is needed to read the annotations
function getParameterPath(sPath: string, sParameter: string): string {
	let sContext;
	if (sPath.includes("@$ui5.overload")) {
		sContext = sPath.split("@$ui5.overload")[0];
	} else {
		// For Unbound Actions in Action Parameter Dialogs
		const aAction = sPath.split("/0")[0].split(".");
		sContext = `/${aAction[aAction.length - 1]}/`;
	}
	return sContext + sParameter;
}

/**
 * Get resolved expression binding used for texts at runtime.
 * @param expBinding
 * @param control
 * @returns A string after resolution.
 */
function _fntranslatedTextFromExpBindingString(expBinding: string, control: Control): string {
	// The idea here is to create dummy element with the expresion binding.
	// Adding it as dependent to the view/control would propagate all the models to the dummy element and resolve the binding.
	// We remove the dummy element after that and destroy it.

	const anyResourceText = new AnyElement({ anyText: expBinding });
	control.addDependent(anyResourceText);
	const resultText = anyResourceText.getAnyText();
	control.removeDependent(anyResourceText);
	anyResourceText.destroy();

	return resultText;
}
/**
 * Check if the current device has a small screen.
 * @returns A Boolean.
 */
function isSmallDevice(): boolean {
	return !Device.system.desktop || Device.resize.width <= 320;
}

/**
 * Parses a SelectionVariant or SelectionPresentationVariant annotation and creates the corresponding filters.
 * @param control MDC Chart, MDC Table or MultiView control on which the filters are applied
 * @param annotationPath SelectionVariant or SelectionPresentationVariant annotation
 * @returns Returns an array of filters.
 */
function getFiltersFromAnnotation(control: Control | MDCChart | MDCTable, annotationPath: string): Filter[] {
	const metaModel = CommonUtils.getAppComponent(control as Control).getMetaModel();
	const svContext = metaModel.getMetaContext(`${control.data("entityType")}${annotationPath}`);
	const propertyFilters: Record<string, Filter[]> = {};
	let annotation = MetaModelConverter.getInvolvedDataModelObjects(svContext).targetObject;

	if (isAnnotationOfType<SelectionPresentationVariant>(annotation, UIAnnotationTypes.SelectionPresentationVariantType)) {
		annotation = annotation.SelectionVariant;
	}

	if (!annotation || !isAnnotationOfType<SelectionVariantType>(annotation, UIAnnotationTypes.SelectionVariantType)) {
		return [];
	}

	(annotation.SelectOptions || []).forEach((selectOption) => {
		if (selectOption.PropertyName?.$target && selectOption.Ranges?.length > 0) {
			const propertyType = selectOption.PropertyName.$target.type;
			const propertyPath = selectOption.PropertyName.value;
			for (const j in selectOption.Ranges) {
				const range = getRangeDefinition(selectOption.Ranges[j], propertyType);
				propertyFilters[propertyPath] = (propertyFilters[propertyPath] ?? []).concat(
					new Filter(propertyPath, range.operator as FilterOperator, range.rangeLow, range.rangeHigh)
				);
			}
		}
	});

	const filters = [];
	for (const path in propertyFilters) {
		filters.push(
			new Filter({
				filters: propertyFilters[path],
				and: false
			})
		);
	}
	return filters;
}

function getConverterContextForPath(
	sMetaPath: string,
	oMetaModel: ODataMetaModel,
	sEntitySet: string,
	oDiagnostics: Diagnostics
): ConverterContext<PageContextPathTarget> {
	const oContext = oMetaModel.createBindingContext(sMetaPath) as ODataV4Context;
	return ConverterContext?.createConverterContextForMacro(sEntitySet, oContext || oMetaModel, oDiagnostics, mergeObjects);
}

/**
 * Gets the context of the DraftRoot path.
 * If a view has been created with the draft Root Path, this method returns its bindingContext.
 * Where no view is found a new created context is returned.
 * The new created context request the key of the entity in order to get the Etag of this entity.
 * @param programmingModel
 * @param view
 * @param appComponent
 * @param bindingParameters
 * @returns Returns a Promise
 */
async function createRootContext(
	programmingModel: string,
	view: View,
	appComponent: AppComponent,
	bindingParameters?: BaseAggregationBindingInfo["parameters"]
): Promise<Context | undefined> {
	const context = view.getBindingContext() as ODataV4Context;
	if (context) {
		const rootContextPath =
			programmingModel === "Draft" ? ModelHelper.getDraftRootPath(context) : ModelHelper.getStickyRootPath(context);
		let simpleRootContext: ODataV4Context;
		if (rootContextPath) {
			// Check if a view matches with the draft root path, and had already loaded its context
			const existingBindingContextOnPage = appComponent
				.getRootViewController()
				.getInstancedViews()
				.find(
					(pageView: View) =>
						pageView.getBindingContext()?.getPath() === rootContextPath &&
						pageView.getBindingContext()?.getObject() !== undefined
				)
				?.getBindingContext() as Context;
			if (existingBindingContextOnPage) {
				return existingBindingContextOnPage;
			}
			const internalModel = view.getModel("internal") as JSONModel;
			simpleRootContext = internalModel.getProperty("/simpleRootContext");
			if (simpleRootContext?.getPath() === rootContextPath) {
				return simpleRootContext;
			}
			const model = context.getModel();
			simpleRootContext = model.bindContext(rootContextPath, undefined, bindingParameters).getBoundContext();
			await CommonUtils.waitForContextRequested(simpleRootContext);
			// Store this new created context to use it on the next iterations
			internalModel.setProperty("/simpleRootContext", simpleRootContext);
			return simpleRootContext;
		}
	}
}

/**
 * Helper method to determine if the source is to be display for the editmode or not.
 * @param source
 * @returns If the source is to be displayed in edit mode
 */
function getIsEditable(source: ManagedObject | PageController): boolean {
	const managedObject = source.isA<PageController>("sap.fe.core.PageController") ? source.getView() : source;
	return managedObject.getBindingContext("ui")?.getProperty("/isEditable");
}

const CommonUtils = {
	INLINEEDIT_UPDATEGROUPID: "inline",
	fireButtonPress: fnFireButtonPress,
	getTargetView: getTargetView,
	getCurrentPageView: getCurrentPageView,
	hasTransientContext: fnHasTransientContexts,
	updateRelatedAppsDetails: fnUpdateRelatedAppsDetails,
	getAppComponent: getAppComponent,
	getContextPathProperties: fnGetContextPathProperties,
	getParameterInfo: getParameterInfo,
	updateDataFieldForIBNButtonsVisibility: fnUpdateDataFieldForIBNButtonsVisibility,
	getEntitySetName: getEntitySetName,
	getActionPath: getActionPath,
	computeDisplayMode: computeDisplayMode,
	isStickyEditMode: isStickyEditMode,
	getOperatorsForGuidProperty: getOperatorsForGuidProperty,
	addPageContextToSelectionVariant: addPageContextToSelectionVariant,
	setUserDefaults: setUserDefaults,
	getIBNActions: fnGetIBNActions,
	getHeaderFacetItemConfigForExternalNavigation: getHeaderFacetItemConfigForExternalNavigation,
	getSemanticObjectMapping: getSemanticObjectMapping,
	setSemanticObjectMappings: setSemanticObjectMappings,
	getSemanticObjectPromise: fnGetSemanticObjectPromise,
	getSemanticObjectsFromPath: fnGetSemanticObjectsFromPath,
	waitForContextRequested: waitForContextRequested,
	getFilterRestrictionsByPath: getFilterRestrictionsByPath,
	getSpecificAllowedExpression: getSpecificAllowedExpression,
	getAdditionalParamsForCreate: getAdditionalParamsForCreate,
	requestSingletonProperty: requestSingletonProperty,
	templateControlFragment: templateControlFragment,
	FilterRestrictions: {
		REQUIRED_PROPERTIES: "RequiredProperties",
		NON_FILTERABLE_PROPERTIES: "NonFilterableProperties",
		ALLOWED_EXPRESSIONS: "FilterAllowedExpressions"
	},
	AllowedExpressionsPrio: ["SingleValue", "MultiValue", "SingleRange", "MultiRange", "SearchExpression", "MultiRangeOrSearchExpression"],
	normalizeSearchTerm: normalizeSearchTerm,
	setContextsBasedOnOperationAvailable: setContextsBasedOnOperationAvailable,
	setDynamicActionContexts: setDynamicActionContexts,
	requestProperty: requestProperty,
	getParameterPath: getParameterPath,
	getRelatedAppsMenuItems: _getRelatedAppsMenuItems,
	getTranslatedTextFromExpBindingString: _fntranslatedTextFromExpBindingString,
	updateRelateAppsModel: updateRelateAppsModel,
	getSemanticObjectAnnotations: _getSemanticObjectAnnotations,
	getFiltersFromAnnotation: getFiltersFromAnnotation,
	createRootContext: createRootContext,
	updateMenuButtonVisiblity: updateMenuButtonVisiblity,
	isSmallDevice,
	getConverterContextForPath,
	getIsEditable: getIsEditable
};

export default CommonUtils;
