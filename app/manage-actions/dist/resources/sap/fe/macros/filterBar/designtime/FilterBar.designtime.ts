/*!
 */

import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import { getRenameAction, getText, getTextArrangementChangeAction } from "sap/fe/core/designtime/AnnotationBasedChanges";
import type { DesigntimeSetting, PropertyValue, adaptionChange } from "sap/fe/macros/designtime/Designtime.helper";
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
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import { getDesigntimeSettings, getPropertyPath, getSettings } from "sap/fe/macros/filterBar/designtime/FilterBar.designtime.helper";
import StateHelper from "sap/fe/macros/mdc/adapter/StateHelper";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type Context from "sap/ui/model/Context";

const configPath = "rta/filterBarConfigSettings";

export function getAdaptationProperties(
	designtimeSettings: DesigntimeSetting[],
	filterBar: FilterBar,
	filterBarAPI: FilterBarAPI
): PropertyValue {
	const propertyValues: PropertyValue = {};
	designtimeSettings.forEach(function (setting) {
		propertyValues[setting.id] = getAdaptationPropertyValue(setting, filterBar, filterBarAPI);
	});
	return propertyValues;
}

/**
 * Returns the value of one of the settings that have been defined for filter bar adaptation.
 * @param setting The definition of the setting required for adaptation
 * @param filterBar Reference of the filter bar control
 * @param filterBarApi Reference of the parent of filter bar control
 * @returns Setting definition with a value for selected control
 */
function getAdaptationPropertyValue(
	setting: DesigntimeSetting,
	filterBar: FilterBar,
	filterBarApi: FilterBarAPI
): boolean | string | number | string[] {
	let returnValue: boolean | string | number | string[] = "";

	const filterBarInfoForConversion = StateHelper._getControlInfoForConversion(filterBar);

	switch (setting.id) {
		case "showClearButton":
			returnValue = filterBarApi.getContent()?.getProperty("showClearButton") || false;
			break;
		case "useSemanticDateRange":
			returnValue =
				filterBarInfoForConversion.useSemanticDateRange ||
				filterBarInfoForConversion.selectionFieldsConfigs?.useSemanticDateRange ||
				false;
			break;
		case "navigationProperties":
			returnValue = filterBarInfoForConversion.selectionFieldsConfigs?.navigationProperties || []; // prevent navigationProperties from being undefined
			break;
	}
	return returnValue;
}

const FilterBarBlockDesignTime = {
	actions: {
		annotation: {
			textArrangement: getTextArrangementChangeAction(),
			rename: getRenameAction()
		},
		settings: {
			fe: {
				name: getText("RTA_CONTEXT_ACTIONMENU_CONFIG"),
				icon: "sap-icon://developer-settings",
				handler: async function (filterBar: FilterBar): Promise<adaptionChange[]> {
					const filterBarApi = filterBar.getParent() as FilterBarAPI;
					const designtimeSettings = getDesigntimeSettings();
					const propertyValues = getAdaptationProperties(designtimeSettings, filterBar, filterBarApi);
					const unchangedData = structuredClone(propertyValues); //deep copy to remember the starting value set, needed for the navigation properties multi inhput field
					const configContext = filterBar.getBindingContext("internal") as Context;
					if (!isConfigModelPrepared(configContext, configPath)) {
						// first time this session
						let items = getSettings(filterBarApi, propertyValues);
						items = getSettingsIfKeyUser(CommonUtils.getAppComponent(filterBar), items);
						// use internal model to persist adaptation configuration values
						prepareConfigModel(items, configContext, configPath);
					}
					const resourceModel = filterBar.getModel("sap.fe.i18n") as ResourceModel;
					return openAdaptionDialog(
						configContext,
						propertyValues,
						"{sap.fe.i18n>RTA_CONFIGURATION_TITLE_FILTERBAR}",
						resourceModel,
						configPath
					).then(function (propertyValuesEntered: PropertyValue): adaptionChange[] | [] {
						const propertyPath = getPropertyPath();
						return extractChanges(designtimeSettings, unchangedData, propertyValuesEntered, propertyPath, filterBar);
					}, noChanges);
				}
			}
		}
	},
	// We disable mdc filter bar properties in the property panel of Fiori Tools
	properties: {
		showClearButton: { ignore: true },
		liveMode: { ignore: true },
		showGoButton: { ignore: true },
		showMessages: { ignore: true },
		visible: { ignore: true },
		blocked: { ignore: true },
		busy: { ignore: true },
		busyIndicatorDelay: { ignore: true },
		busyIndicatorSize: { ignore: true },
		initialLayout: { ignore: true },
		showAdaptFiltersButton: { ignore: true }
	},

	aggregations: {},
	// These functions provide the properties used in filter bar adaption to Fiori tools.
	manifestSettings: function (filterBar: FilterBar): DesigntimeSetting[] {
		return getPropertyNamesAndDescriptions(getDesigntimeSettings(), filterBar.getModel("sap.fe.i18n") as ResourceModel);
	},
	// getAdaptionPropertyValue
	manifestSettingsValues: function (designtimeSettings: DesigntimeSetting[], filterBar: FilterBar): PropertyValue {
		const filterBarApi = filterBar.getParent() as FilterBarAPI;
		const returnValues: PropertyValue = {};
		designtimeSettings.forEach(function (setting) {
			returnValues[setting.id] = getAdaptationPropertyValue(setting, filterBar, filterBarApi);
		});
		return returnValues;
	},
	// get path for control configuration. Pass reference to the control
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	manifestPropertyPath: function (control: FilterBar): string {
		return getPropertyPath();
	},
	// create change structue. Pass array of manifest setting and new value, the property path and the control
	manifestPropertyChange: function (propertyChanges: PropertyValue, propertyPath: string, control: FilterBar): adaptionChange[] {
		return separateChanges(propertyChanges, propertyPath, control);
	}
};

export default FilterBarBlockDesignTime;
