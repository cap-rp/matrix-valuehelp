import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { ObjectPageManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import { getRenameAction, getText, getTextArrangementChangeAction } from "sap/fe/core/designtime/AnnotationBasedChanges";
import type { DesigntimeSetting, SettingsData, adaptionChange } from "sap/fe/macros/designtime/Designtime.helper";
import {
	extractChanges,
	getPropertyNamesAndDescriptions,
	getSettingsIfKeyUser,
	isConfigModelPrepared,
	noChanges,
	openAdaptionDialog,
	prepareConfigModel,
	separateChanges
} from "sap/fe/macros/designtime/Designtime.helper";
import { getDesigntimeSettings, getSettings } from "sap/fe/templates/ObjectPage/designtime/ObjectPage.designtime.helper";
import type Control from "sap/ui/core/Control";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/Context";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type ObjectPageComponent from "../Component";

type PropertyValue = Record<string, string | number | boolean | object | undefined>;

function getAdaptationProperties(designtimeSettings: DesigntimeSetting[], control: ObjectPageLayout): PropertyValue {
	const returnValues: PropertyValue = {};
	designtimeSettings.forEach(function (setting) {
		returnValues[setting.id] = getAdaptationPropertyValue(control, setting);
	});
	return returnValues;
}

/**
 * Returns the value of one of the settings that have been defined for object page adaptation.
 * @param control Reference to the object page
 * @param setting The definition of the setting required for adaptation
 * @returns Setting definition with a value for selected control
 */
function getAdaptationPropertyValue(control: ObjectPageLayout, setting: DesigntimeSetting): boolean | string | number {
	// Here we are retrieving the viewData from the parent view of the control
	// There is no type/class that has all properties from the object page manifest settings
	// That's why we are using two different constants for the same object
	const viewDataSettings = (control.getParent() as View)!.getViewData() as ObjectPageManifestSettings;
	const viewDataComponent = (control.getParent() as View)!.getViewData() as ObjectPageComponent;
	let returnValue: boolean | string | number = "";

	switch (setting.id) {
		case "editableHeaderContent":
			returnValue = viewDataSettings.editableHeaderContent !== undefined ? viewDataSettings.editableHeaderContent : true;
			break;
		case "variantManagement":
			returnValue = viewDataSettings.variantManagement !== undefined ? viewDataSettings.variantManagement : "None";
			break;
		case "sectionLayout":
			returnValue = viewDataSettings.sectionLayout !== undefined ? viewDataSettings.sectionLayout : "Page";
			break;
		case "visible":
			returnValue = viewDataSettings.content?.header?.visible !== undefined ? viewDataSettings.content.header.visible : true;
			break;
		case "showRelatedApps":
			returnValue = viewDataComponent.showRelatedApps !== undefined ? viewDataComponent.showRelatedApps : true;
			break;
		case "openInEditMode":
			returnValue = viewDataComponent.openInEditMode !== undefined ? viewDataComponent.openInEditMode : false;
			break;
		case "additionalSemanticObjects":
			returnValue = JSON.stringify(viewDataComponent.additionalSemanticObjects);
	}
	return returnValue;
}

const designTime = {
	actions: {
		annotation: {
			textArrangement: getTextArrangementChangeAction(),
			rename: getRenameAction()
		},
		settings: {
			fe: {
				name: getText("RTA_CONTEXT_ACTIONMENU_CONFIG"),
				icon: "sap-icon://developer-settings",
				handler: async function (control: ObjectPageLayout): Promise<unknown> {
					const designtimeSettings = getDesigntimeSettings();

					const propertyValues = getAdaptationProperties(designtimeSettings, control);
					const unchangedData = { ...propertyValues };
					const configContext = control.getBindingContext("internal") as Context;
					if (!isConfigModelPrepared(configContext)) {
						// first time this session
						let items: SettingsData[] = [];
						items = getSettings(propertyValues);
						// sap-fe-rta-mode=true and then Adapt UI
						items = getSettingsIfKeyUser(CommonUtils.getAppComponent(control), items);
						// use internal model to persist adaptation configuration values
						prepareConfigModel(items, configContext);
					}
					const resourceModel = control.getModel("sap.fe.i18n") as ResourceModel;
					return openAdaptionDialog(
						configContext,
						propertyValues,
						"{sap.fe.i18n>RTA_CONFIGURATION_TITLE_OP}",
						resourceModel
					).then(function (propertyValuesEntered: PropertyValue): adaptionChange[] | [] {
						return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, "", control);
					}, noChanges);
				}
			}
		}
	},
	// We disable dynamic page properties in the property panel of Fiori Tools
	properties: {
		alwaysShowContentHeader: { ignore: true },
		backgroundDesignAnchorBar: { ignore: true },
		blocked: { ignore: true },
		busy: { ignore: true },
		busyIndicatorDelay: { ignore: true },
		busyIndicatorSize: { ignore: true },
		enableLazyLoading: { ignore: true },
		flexEnabled: { ignore: true },
		headerContentPinnable: { ignore: true },
		headerContentPinned: { ignore: true },
		height: { ignore: true },
		isChildPage: { ignore: true },
		preserveHeaderStateOnScroll: { ignore: true },
		toggleHeaderOnTitleClick: { ignore: true },
		sectionTitleLevel: { ignore: true },
		showAnchorBar: { ignore: true },
		showAnchorBarPopover: { ignore: true },
		showEditHeaderButton: { ignore: true },
		showFooter: { ignore: true },
		showHeaderContent: { ignore: true },
		showOnlyHighImportance: { ignore: true },
		showTitleInHeaderContent: { ignore: true },
		subSectionLayout: { ignore: true },
		upperCaseAnchorBar: { ignore: true },
		useIconTabBar: { ignore: true },
		useTwoColumnsForLargeScreen: { ignore: true },
		visible: { ignore: true }
	},

	aggregations: {
		footer: {
			propagateMetadata: function (elementToPropagate: Control): { isVisible: Function } | undefined {
				if (elementToPropagate.isA("sap.m.IBar")) {
					return {
						isVisible: function (element: Control): boolean | undefined {
							const parent = element.getParent();
							if (parent && parent.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout")) {
								return parent.getShowFooter();
							} else {
								const grandParent = element.getParent()?.getParent();
								return grandParent?.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout") && grandParent.getShowFooter();
							}
						}
					};
				}
			}
		},
		headerTitle: {
			propagateMetadata: function (elementToPropagate: Control): { isVisible: Function } | undefined {
				if (elementToPropagate.isA("sap.uxap.ObjectPageDynamicHeaderTitle")) {
					return {
						// as the header title is always visible, we return true
						isVisible: () => true
					};
				}
			}
		}
	},
	// These functions provide the properties used in object page adaptation to Fiori tools.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	manifestSettings: function (control: ObjectPageLayout): DesigntimeSetting[] {
		return getPropertyNamesAndDescriptions(getDesigntimeSettings(), control.getModel("sap.fe.i18n") as ResourceModel);
	},
	// getAdaptationPropertyValue
	manifestSettingsValues: function (designtimeSettings: DesigntimeSetting[], control: ObjectPageLayout): PropertyValue {
		const returnValues: PropertyValue = {};
		designtimeSettings.forEach(function (setting) {
			returnValues[setting.id] = getAdaptationPropertyValue(control, setting);
		});
		return returnValues;
	},
	// get path for control configuration. Pass reference to the control
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	manifestPropertyPath: function (control: ObjectPageLayout): string {
		return "";
	},
	// create change structue. Pass array of manifest setting and new value, the property path and the control
	manifestPropertyChange: function (propertyChanges: PropertyValue, propertyPath: string, control: ObjectPageLayout): adaptionChange[] {
		return separateChanges(propertyChanges, propertyPath, control);
	}
};

export default designTime;
