import type DynamicPage from "sap/f/DynamicPage";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import { getRenameAction, getText, getTextArrangementChangeAction } from "sap/fe/core/designtime/AnnotationBasedChanges";
import type { DesigntimeSetting, PropertyValue, SettingsData, adaptionChange } from "sap/fe/macros/designtime/Designtime.helper";
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
import {
	getDesigntimeSettings,
	getGlobalSettings,
	getGlobalSettingsValue,
	getGlobalSettingsValues,
	getSettings,
	getSettingsGlobal
} from "sap/fe/templates/ListReport/designtime/ListReport.designtime.helper";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/Context";

type propertyValueInConfig = {
	stickyMultiTabHeader: false;
	variantManagement: string;
	initialLoad: string;
	hideFilterBar: false;
	useHiddenFilterBar: false;
	views: {
		showCounts: false;
	};
};

export function getAdaptationProperties(designtimeSettings: DesigntimeSetting[], control: DynamicPage): PropertyValue {
	const propertyValues: PropertyValue = {};
	designtimeSettings.forEach(function (setting) {
		propertyValues[setting.id] = getAdaptationPropertyValue(setting, control);
	});
	return propertyValues;
}
/**
 * Returns the value of one of the settings that have been defined for list report adaptation.
 * @param setting The definition of the setting required for adaptation
 * @param control Reference to list report
 * @returns Setting definition with a value for list report
 */
export function getAdaptationPropertyValue(setting: DesigntimeSetting, control: DynamicPage): boolean | string | number {
	let returnValue: boolean | string | number = "";

	const viewData = (control.getParent() as View)!.getViewData() as propertyValueInConfig;

	switch (setting.id) {
		case "stickyMultiTabHeader":
			returnValue = viewData.stickyMultiTabHeader;
			break;
		case "variantManagement":
			returnValue = viewData.variantManagement;
			break;
		case "initialLoad":
			returnValue = viewData.initialLoad;
			break;
		case "hideFilterBar":
			returnValue = viewData.hideFilterBar;
			break;
		case "useHiddenFilterBar":
			returnValue = viewData.useHiddenFilterBar;
			break;
		case "showCounts":
			returnValue = viewData.views?.showCounts;
			break;
		default:
			returnValue = getGlobalSettingsValue(setting, control);
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
				handler: async function (control: DynamicPage): Promise<unknown> {
					const designtimeSettings = getDesigntimeSettings();
					const globalSettings = getGlobalSettings();
					const propertyValues = getAdaptationProperties(designtimeSettings, control);
					const globalSettingsValues = getGlobalSettingsValues(globalSettings, control);
					const propertyAndGlobalValues = { ...propertyValues, ...globalSettingsValues };
					const unchangedData = { ...globalSettingsValues, ...propertyValues };
					const configContext = control.getBindingContext("internal") as Context;
					if (!isConfigModelPrepared(configContext)) {
						// first time this session
						let items: SettingsData[] = [];
						let itemsGlobal: SettingsData[] = [];
						items = getSettings(propertyValues);
						itemsGlobal = getSettingsGlobal(globalSettingsValues);
						items = items.concat(itemsGlobal);
						// sap-fe-rta-mode=true and then Adapt UI
						items = getSettingsIfKeyUser(CommonUtils.getAppComponent(control), items);
						// use internal model to persist adaptation configuration values
						prepareConfigModel(items, configContext);
					}
					const resourceModel = control.getModel("sap.fe.i18n") as ResourceModel;
					return openAdaptionDialog(
						configContext,
						propertyAndGlobalValues,
						"{sap.fe.i18n>RTA_CONFIGURATION_TITLE_LR}",
						resourceModel
					).then(function (propertyValuesEntered: PropertyValue): adaptionChange[] | [] {
						return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, "", control, globalSettings);
					}, noChanges);
				}
			}
		}
	},
	// We disable dynamic page properties in the property panel of Fiori Tools
	properties: {
		backgroundDesign: { ignore: true },
		blocked: { ignore: true },
		busy: { ignore: true },
		busyIndicatorDelay: { ignore: true },
		busyIndicatorSize: { ignore: true },
		headerExpanded: { ignore: true },
		headerPinned: { ignore: true },
		preserveHeaderStateOnScroll: { ignore: true },
		showFooter: { ignore: true },
		toggleHeaderOnTitleClick: { ignore: true },
		visible: { ignore: true },
		fitContent: { ignore: true }
	},

	aggregations: {},

	// These functions provide the properties used in table adaption to Fiori tools.
	manifestSettings: function (control: DynamicPage): DesigntimeSetting[] {
		const globalSettings = getPropertyNamesAndDescriptions(getGlobalSettings(), control.getModel("sap.fe.i18n") as ResourceModel);
		const settings = getPropertyNamesAndDescriptions(getDesigntimeSettings(), control.getModel("sap.fe.i18n") as ResourceModel);
		return globalSettings.concat(settings);
	},
	// getAdaptionPropertyValue
	manifestSettingsValues: function (designtimeSettings: DesigntimeSetting[], control: DynamicPage): PropertyValue {
		const returnValues: PropertyValue = {};
		designtimeSettings.forEach(function (setting) {
			returnValues[setting.id] = getAdaptationPropertyValue(setting, control);
		});
		return returnValues;
	},
	// get path for control configuration. Pass reference to the control
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	manifestPropertyPath: function (control: DynamicPage): string {
		return "";
	},
	// create change structue. Pass array of manifest setting and new value, the property path and the control
	manifestPropertyChange: function (propertyChanges: PropertyValue, propertyPath: string, control: DynamicPage): adaptionChange[] {
		return separateChanges(propertyChanges, propertyPath, control);
	}
};

export default designTime;
