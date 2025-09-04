import CommonUtils from "sap/fe/core/CommonUtils";
import type { DesigntimeSetting, DesigntimeSettingEnums, PropertyValue, SettingsData } from "sap/fe/macros/designtime/Designtime.helper";
import type Control from "sap/ui/core/Control";
import type View from "sap/ui/core/mvc/View";

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

type globalValue = {
	sideEffectsEventsInteractionType: string;
};

type ControlData = {
	type: string | undefined;
	enum: DesigntimeSettingEnums[] | undefined;
	value: unknown;
	id: string;
};
/**
 * Return the available designtime settings for the List Report.
 * @returns Designtime settings for List Report
 */
export function getDesigntimeSettings(): DesigntimeSetting[] {
	// Properties for the ListReport. Most of these are used by the converter.
	const stickyMultiTabHeader: DesigntimeSetting = {
		id: "stickyMultiTabHeader",
		name: "RTA_CONFIGURATION_LR_MT_NAME",
		description: "RTA_CONFIGURATION_LR_MT_DESC",
		value: false,
		type: "boolean"
	};
	const variantManagement: DesigntimeSetting = {
		id: "variantManagement",
		name: "RTA_CONFIGURATION_LR_VM_NAME",
		description: "RTA_CONFIGURATION_LR_VM_DESC",
		type: "string",
		value: "Page",
		enums: [
			{ id: "Control", name: "RTA_CONFIGURATION_LR_VM_ENUM_CONTROL" },
			{ id: "None", name: "RTA_CONFIGURATION_LR_VM_ENUM_NONE" },
			{ id: "Page", name: "RTA_CONFIGURATION_LR_VM_ENUM_PAGE" }
		],
		keyUser: true
	};
	const initialLoad: DesigntimeSetting = {
		id: "initialLoad",
		name: "RTA_CONFIGURATION_LR_INITIALLOAD_NAME",
		description: "RTA_CONFIGURATION_LR_INITIALLOAD_DESC",
		type: "string",
		value: "enabled",
		enums: [
			{ id: "Auto", name: "RTA_CONFIGURATION_LR_INITIALLOAD_ENUM_AUTO" },
			{ id: "Enabled", name: "RTA_CONFIGURATION_LR_INITIALLOAD_ENUM_ENABLED" },
			{ id: "Disabled", name: "RTA_CONFIGURATION_LR_INITIALLOAD_ENUM_DISABLED" }
		],
		keyUser: true
	};

	const hideFilterBar: DesigntimeSetting = {
		id: "hideFilterBar",
		name: "RTA_CONFIGURATION_LR_HFB_NAME",
		description: "RTA_CONFIGURATION_LR_HFB_DESC",
		type: "boolean",
		value: true
	};

	const useHiddenFilterBar: DesigntimeSetting = {
		id: "useHiddenFilterBar",
		name: "RTA_CONFIGURATION_LR_UHFB_NAME",
		description: "RTA_CONFIGURATION_LR_UHFB_DESC",
		type: "boolean",
		value: false
	};

	// If this property is set when multitabs have not been defined, the app does not load
	const showCounts: DesigntimeSetting = {
		id: "showCounts",
		path: "views/showCounts",
		name: "RTA_CONFIGURATION_LR_SC_NAME",
		description: "RTA_CONFIGURATION_LR_SC_DESC",
		type: "boolean",
		value: false
	};

	return [stickyMultiTabHeader, variantManagement, initialLoad, hideFilterBar, useHiddenFilterBar, showCounts];
}

/**
 * Obtains the global settings that are offered in the adaption dialog for ListReport.
 * @returns The settings with metadata required for the dialog to change properties
 */
export function getGlobalSettings(): DesigntimeSetting[] {
	// Belongs to Global Settings, added here

	const sideEffectsEventsInteractionType: DesigntimeSetting = {
		id: "sideEffectsEventsInteractionType",
		name: "RTA_CONFIGURATION_LR_SE_NAME",
		description: "RTA_CONFIGURATION_LR_SE_DESC",
		type: "string",
		value: "None",
		enums: [
			{ id: "None", name: "RTA_CONFIGURATION_LR_SE_ENUM_NONE" },
			{ id: "Confirmation", name: "RTA_CONFIGURATION_LR_SE_ENUM_CONF" },
			{ id: "Notification", name: "RTA_CONFIGURATION_LR_SE_ENUM_NOTF" }
		]
	};

	return [sideEffectsEventsInteractionType];
}
/**
 * Returns the values of the settings that are defined for list report adaption.
 * @param designtimeSettings Array of the settings for list report
 * @param control Reference to the list report view
 * @returns An object containg the settings with values
 */
export function getAdapationProperties(designtimeSettings: DesigntimeSetting[], control: Control): PropertyValue {
	const propertyValues: PropertyValue = {};

	const viewData = (control.getParent() as View)!.getViewData() as propertyValueInConfig;

	designtimeSettings.forEach(function (setting) {
		switch (setting.id) {
			case "stickyMultiTabHeader":
				propertyValues.stickyMultiTabHeader = viewData.stickyMultiTabHeader;
				break;
			case "variantManagement":
				propertyValues.variantManagement = viewData.variantManagement;
				break;
			case "initialLoad":
				propertyValues.initialLoad = viewData.initialLoad;
				break;
			case "hideFilterBar":
				propertyValues.hideFilterBar = viewData.hideFilterBar;
				break;
			case "useHiddenFilterBar":
				propertyValues.useHiddenFilterBar = viewData.useHiddenFilterBar;
				break;
			case "showCounts":
				propertyValues.showCounts = viewData.views?.showCounts;
				break;
		}
	});

	return propertyValues;
}

/**
 * Reads the values of the global settings from the manifest. These have been added to the
 * settings for list report.
 * @param globalSettings
 * @param control
 * @returns The values added into the metadata struture for each global setting
 */
export function getGlobalSettingsValues(globalSettings: DesigntimeSetting[], control: Control): PropertyValue {
	const propertyValues: PropertyValue = {};

	const appComponent = CommonUtils.getAppComponent(control);

	globalSettings.forEach(function (setting) {
		propertyValues[setting.id] = getGlobalSettingsValue(setting, control);
	});

	return propertyValues;
}

/**
 * Reads the values of a global setting from the manifest.
 * @param globalSetting
 * @param control
 * @returns The value added into the metadata struture for the global setting
 */
export function getGlobalSettingsValue(globalSetting: DesigntimeSetting, control: Control): boolean | string | number {
	let propertyValue: boolean | string | number = "";
	const appComponent = CommonUtils.getAppComponent(control);

	switch (globalSetting.id) {
		case "sideEffectsEventsInteractionType":
			const sideEffectsEventsInteractionType = appComponent.getManifestEntry("sap.fe")?.app?.sideEffectsEventsInteractionType;
			// we only support the global setting right now, not the setting per event
			propertyValue = typeof sideEffectsEventsInteractionType === "string" ? sideEffectsEventsInteractionType : "Notification";
			break;
	}

	return propertyValue;
}

/**
 * Returns the values of the settings that are defined for list report adaption.
 * @param propertyValues List of settings and current values for list report
 * @returns Content in list form to be used in adapation dialog
 */
export function getSettings(propertyValues: PropertyValue): SettingsData[] {
	const items: SettingsData[] = [];

	getDesigntimeSettings().forEach(function (manifestSetting) {
		//Fill model for adaptation settings data
		const settingsData: SettingsData = {
			label: manifestSetting.name,
			tooltip: manifestSetting.description,
			control: [],
			keyUser: manifestSetting.keyUser
		};

		const controlData: ControlData = {
			type: manifestSetting.type,
			enum: manifestSetting.enums,
			value: propertyValues[manifestSetting.id],
			id: manifestSetting.id
		};

		settingsData.control.push(controlData);
		items.push(settingsData);
	});

	return items;
}
/**
 * Prepare list of global settings for the the dialog to
 * change settings for the List Report.
 * @param propertyValues
 * @returns The changes in a structure used by flexibility tools
 */
export function getSettingsGlobal(propertyValues: PropertyValue): SettingsData[] {
	const items: SettingsData[] = [];

	getGlobalSettings().forEach(function (manifestSetting) {
		//Fill model for adaptation settings data
		const settingsData: SettingsData = {
			label: manifestSetting.name,
			tooltip: manifestSetting.description,
			control: [],
			keyUser: manifestSetting.keyUser
		};

		const controlData: ControlData = {
			type: manifestSetting.type,
			enum: manifestSetting.enums,
			value: propertyValues[manifestSetting.id as keyof globalValue],
			id: manifestSetting.id
		};

		settingsData.control.push(controlData);
		items.push(settingsData);
	});

	return items;
}
