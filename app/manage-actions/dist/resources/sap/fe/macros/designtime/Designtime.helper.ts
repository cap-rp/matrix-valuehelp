/*!
 * Reuse functions for designtime adaption
 */

import deepClone from "sap/base/util/deepClone";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type { TemplateType } from "sap/fe/core/converters/ManifestSettings";
import Button from "sap/m/Button";
import CheckBox from "sap/m/CheckBox";
import Dialog from "sap/m/Dialog";
import Input from "sap/m/Input";
import InputListItem from "sap/m/InputListItem";
import List from "sap/m/List";
import MessageStrip from "sap/m/MessageStrip";
import type { MultiInput$TokenUpdateEvent } from "sap/m/MultiInput";
import MultiInput from "sap/m/MultiInput";
import Select from "sap/m/Select";
import Token from "sap/m/Token";
import type Control from "sap/ui/core/Control";
import Item from "sap/ui/core/Item";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";

export type adaptionChange = {
	appComponent: AppComponent;
	selector: AppComponent;
	changeSpecificData: {
		appDescriptorChangeType: "appdescr_fe_changePageConfiguration";
		content: {
			parameters: {
				page: string;
				entityPropertyChange: {
					propertyPath: string;
					operation: string;
					propertyValue: string | string[] | boolean | number | object | undefined;
				};
			};
		};
	};
};

export type DesigntimeSettingEnums = {
	id: string;
	name: string;
	description?: string;
};

export type DesigntimeSetting = {
	id: string;
	path?: string;
	name: string;
	description: string;
	restrictedTo?: TemplateType[];
	value: unknown;
	type?: string;
	enums?: DesigntimeSettingEnums[];
	skipChange?: boolean;
	writeObjectFor?: string;
	writeObject?: { id: string; path?: string }[];
	keyUser?: boolean;
};

export type PropertyValue = Record<string, string | string[] | boolean | number | object | undefined>;

export type SettingsData = {
	label: string;
	tooltip: string;
	control: ControlData[];
	keyUser?: boolean;
};

type ControlData = {
	type: string | undefined;
	enum: DesigntimeSettingEnums[] | undefined;
	value: unknown;
	id: string;
};

type propKeyAndValue = { [key: string]: string | string[] | boolean | number | object | undefined };

/**
 * Identify which settings have changed.
 * @param designtimeSettings
 * @param unchangedData
 * @param propertyValues
 *  @returns The configuration properties where the values have been changed compared to the starting values
 */
export function getChangedPropertyValues(
	designtimeSettings: DesigntimeSetting[],
	unchangedData: PropertyValue,
	propertyValues: PropertyValue
): PropertyValue {
	const propertyChanges: PropertyValue = {};

	designtimeSettings.forEach(function (setting) {
		if (
			(typeof unchangedData[setting.id] !== "object" && unchangedData[setting.id] !== propertyValues[setting.id]) ||
			(typeof unchangedData[setting.id] === "object" &&
				JSON.stringify(unchangedData[setting.id]) !== JSON.stringify(propertyValues[setting.id]))
		) {
			if (setting.writeObject && propertyValues[setting.id] === setting.writeObjectFor) {
				// We write an object for this setting
				const changeObject: PropertyValue = {};
				if (setting.writeObject && setting.writeObject?.length > 0) {
					setting.writeObject.forEach(function (settingsTogether) {
						changeObject[settingsTogether.path ? settingsTogether.path : settingsTogether.id] =
							propertyValues[settingsTogether.id];
					});
				}
				propertyChanges[setting.path ? setting.path : setting.id] = changeObject;
			} else if (!setting.skipChange) {
				propertyChanges[setting.path ? setting.path : setting.id] = propertyValues[setting.id];
			}
		}
	});
	return propertyChanges;
}
/**
 * Convert sap.fe change into a structure required by the flexibility tools.
 * @param appComponent
 * @param page
 * @param propertyPath
 * @param propertyChanges
 * @returns The change structure used by flexibility tools
 */
export function getChangeStructure(
	appComponent: AppComponent,
	page: string,
	propertyPath: string,
	propertyChanges: string | string[] | boolean | number | object | undefined
): adaptionChange {
	return {
		appComponent: appComponent,
		selector: appComponent,
		changeSpecificData: {
			appDescriptorChangeType: "appdescr_fe_changePageConfiguration",
			content: {
				parameters: {
					page: page,
					entityPropertyChange: {
						propertyPath: propertyPath,
						operation: "UPSERT",
						propertyValue: propertyChanges
					}
				}
			}
		}
	};
}

function setLocalText(item: Record<string, unknown>, resourceModel: ResourceModel): void {
	for (const key in item) {
		if (key !== "id" && typeof item[key] === "string") {
			item[key] = resourceModel.getText(item[key] as string);
		}
	}
}

function setLocalTexts(model: JSONModel, resourceModel: ResourceModel): void {
	const settingsData = model.getData() as SettingsData[];
	settingsData.forEach((setting) => {
		setLocalText(setting, resourceModel);
		setting.control.forEach((controlData) => {
			setLocalText(controlData, resourceModel);
			controlData.enum?.forEach((enumData) => {
				setLocalText(enumData, resourceModel);
			});
		});
	});
}

export function createAdaptionDialogContent(
	configContext: Context,
	propertyValues: PropertyValue,
	resourceModel: ResourceModel,
	configPath = "rta/configSettings"
): List {
	const settingsModel = new JSONModel();
	settingsModel.setData(deepClone(configContext.getProperty(configPath)));
	setLocalTexts(settingsModel, resourceModel);
	const list = new List();
	list.setModel(settingsModel);

	const listItem = new InputListItem({
		label: "{label}"
	});

	listItem.bindContent({
		path: "control",
		factory: function (path: string, context: { getProperty(name: string): string } /* sap.ui.model.Context */) {
			const type = context.getProperty("type");
			const id = context.getProperty("id");

			switch (type) {
				case "string":
					if (context.getProperty("enum")) {
						// Create a select list for multiple options to select
						const item = new Item({
							text: "{name}",
							key: "{id}"
						});

						const select = new Select({
							selectedKey: "{value}",
							change: function (event): void {
								propertyValues[(this as Select).data("id") as keyof PropertyValue] = (
									event.getParameter("selectedItem") as Item
								).getKey() as string & boolean;
							}
						}).data("id", id);

						select.bindItems({
							path: "enum",
							template: item
						});
						return select;
					} else {
						// Create an Input for text changes
						return new Input({
							value: "{value}",
							change: function (event): void {
								propertyValues[(this as Input).data("id") as keyof PropertyValue] = event.getParameter("value") as string &
									boolean;
							}
						}).data("id", id);
					}
				case "string[]":
					// Create an multi input field for the navigation properties
					const oMultiInput = new MultiInput({
						width: "70%",
						showValueHelp: false,
						showClearIcon: true,
						tokens: (propertyValues?.navigationProperties as string[]).map((navigationProperty) => {
							return new Token({ text: navigationProperty, key: navigationProperty });
						}),
						tokenUpdate: function (event: MultiInput$TokenUpdateEvent): void {
							const array = propertyValues[(this as MultiInput).data("id")] as string[];
							if ((event.getParameter("addedTokens") as Token[])?.length > 0) {
								array.push((event?.getParameter("addedTokens") as Token[])[0]?.getProperty("key"));
							} else if ((event.getParameter("removedTokens") as Token[])?.length > 0) {
								array.splice(array.indexOf((event?.getParameter("removedTokens") as Token[])[0]?.getProperty("key")), 1);
							}
						}
					}).data("id", id);
					oMultiInput.addValidator(function (args: { text: string }) {
						const text = args.text;
						return new Token({
							key: text,
							text: text
						});
					});
					return oMultiInput;
				case "number":
					// Create an Input for number changes
					return new Input({
						value: "{value}",
						type: "Number",
						change: function (event): void {
							propertyValues[(this as Input).data("id") as keyof PropertyValue] = event.getParameter("value") as string &
								boolean;
						}
					}).data("id", id);
				case "boolean":
					// Create a checkbox for true/false values
					return new CheckBox({
						selected: "{value}",
						select: function (event): void {
							propertyValues[(this as CheckBox).data("id") as keyof PropertyValue] = event.getParameter(
								"selected"
							) as string & boolean;
						}
					}).data("id", id);
				case "booleanOrString":
					// Create a select list for boolean and string options to select
					// This type is at the moment only used for personalization settings which can be undefined, true, false or an object
					// The select list is used to select between true, false and "Own Settings"
					// If "Own Settings" is selected, the personalization object is written, otherwise the boolean is written (undefined cannot be written in a manifest change)
					const item = new Item({
						text: "{name}",
						key: "{id}"
					});

					const select = new Select({
						selectedKey: "{value}",
						change: function (event): void {
							let value = (event.getParameter("selectedItem") as Item).getKey();
							// Convert string to boolean if necessary
							if (value.toLowerCase() === "false" || value.toLowerCase() === "true") {
								value = JSON.parse(value.toLowerCase());
							}
							propertyValues[(this as Select).data("id") as keyof PropertyValue] = value;
						}
					}).data("id", id);

					select.bindItems({
						path: "enum",
						template: item
					});
					return select;
				case "json":
					// Create an input for json object descriptions
					// A text area would have been better but this does not work with the InputListItem
					// we would have needed a CustomListItem instead
					// which would have been too much effort as we would have needed to change the whole structure
					return new Input({
						value: "{value}",
						change: function (event): void {
							propertyValues[(this as Input).data("id") as keyof PropertyValue] = JSON.parse(
								event.getParameter("value")?.toString() as string
							);
						}
					}).data("id", id);
				default:
					break;
			}
		}
	});

	list.bindItems({
		path: "/",
		template: listItem
	});

	return list;
}

export async function openAdaptionDialog(
	configContext: Context,
	propertyValues: PropertyValue,
	title: string,
	resourceModel: ResourceModel,
	configPath = "rta/configSettings",
	infoText = "{sap.fe.i18n>RTA_CONFIGURATION_INFO_MESSAGE}",
	size?: { width: string; height: string }
): Promise<PropertyValue> {
	const list = createAdaptionDialogContent(configContext, propertyValues, resourceModel, configPath);
	const content: (List | MessageStrip)[] = [];
	const informationMessage = new MessageStrip({
		showIcon: true,
		type: "Information",
		text: infoText
	});
	informationMessage.addStyleClass("sapUiSmallMarginBottom");
	content.push(informationMessage);
	content.push(list);
	const listIndex = content.indexOf(list);
	return new Promise(function (resolve, reject) {
		const dialog = new Dialog({
			title: title,
			contentWidth: size ? size.width : "550px",
			contentHeight: size ? size.height : "300px",
			content: content,
			buttons: [
				new Button({
					text: "{sap.fe.i18n>RTA_CONFIGURATION_APPLY}",
					type: "Emphasized",
					press: function (): void {
						// persist changes done
						updateConfigModel(configContext, dialog.getContent()[listIndex].getModel() as JSONModel, configPath);
						dialog.close();
						resolve(propertyValues);
					}
				}),
				new Button({
					text: "{sap.fe.i18n>RTA_CONFIGURATION_CANCEL}",
					press: function (): void {
						dialog.close();
						reject();
					}
				})
			]
		});
		dialog.setModel(resourceModel, "sap.fe.i18n");
		dialog.addStyleClass("sapUiContentPadding");
		dialog.addStyleClass("sapUiRTABorder");
		dialog.open();
		return;
	});
}

export function processChanges(
	propertyChanges: propKeyAndValue,
	appComponent: AppComponent,
	page: string,
	propertyPath: string
): adaptionChange[] {
	let singleChange: propKeyAndValue = {};
	const changes = [];
	for (const [key, value] of Object.entries(propertyChanges)) {
		singleChange = {};
		singleChange[key] = value;
		changes.push(getChange(singleChange, appComponent, page, propertyPath));
	}
	return changes;
}

/**
 * Format each change made to global settings "sap.fe"
 * The set of changes are put into individual changes to ensure
 * that earlier changes are not lost when these are loaded at runtime.
 * @param propertyChanges
 * @param appComponent
 * @param page
 * @param propertyPath
 * @returns The change structure used by flexibility tools
 */
export function processGlobalChanges(
	propertyChanges: propKeyAndValue,
	appComponent: AppComponent,
	page: string,
	propertyPath: string
): adaptionChange[] {
	let singleChange: propKeyAndValue = {};
	const changes = [];
	for (const [key, value] of Object.entries(propertyChanges)) {
		singleChange = {};
		singleChange[key] = value;
		changes.push(getChange(singleChange, appComponent, page, propertyPath));
	}
	return changes;
}

export function getChange(
	propertyChanges: propKeyAndValue,
	appComponent: AppComponent,
	page: string,
	propertyPath: string
): adaptionChange {
	// Changes for controls have a path starting with controlConfiguration, followed by an annotation path
	// For the list report changes, there is no path because the properties are directly under Settings
	// for the "sap.fe.templates.ListReport" in the manifest.
	if (propertyPath === "") {
		propertyPath = Object.keys(propertyChanges)[0];
	} else {
		propertyPath = propertyPath + "/" + Object.keys(propertyChanges)[0];
	}
	const value = propertyChanges[Object.keys(propertyChanges)[0]];

	return getChangeStructure(appComponent, page, propertyPath, value);
}

/**
 * Get the parameters other than the control settings that are needed
 * for the change structure.
 * @param propertyChanges
 * @param propertyPath
 * @param control
 * @returns The changes in a structure used by flexibility tools
 */
export function separateChanges(propertyChanges: PropertyValue, propertyPath: string, control: Control): adaptionChange[] {
	const appComponent = CommonUtils.getAppComponent(control);
	const page = getPage(control.getParent() as Control);
	return processChanges(propertyChanges, appComponent, page, propertyPath);
}

/**
 * Get the parameters other than the global settings that are needed
 * for the change structure.
 * @param propertyChanges
 * @param propertyPath
 * @param control
 * @returns The changes in a structure used by flexibility tools
 */
function separateGlobalChanges(propertyChanges: PropertyValue, propertyPath: string, control: Control): adaptionChange[] {
	const appComponent = CommonUtils.getAppComponent(control);
	const page = "sap.fe";
	return processGlobalChanges(propertyChanges, appComponent, page, propertyPath);
}

function getPage(control: Control): string {
	const viewId = CommonUtils.getTargetView(control).getId().split("::");
	return viewId[viewId.length - 1];
}

export const extractChanges = function (
	designtimeSettings: DesigntimeSetting[],
	unchangedData: PropertyValue,
	propertyValuesEntered: PropertyValue,
	propertyPath: string,
	control: Control,
	globalSettings?: DesigntimeSetting[]
): adaptionChange[] {
	const propertyChanges = getChangedPropertyValues(designtimeSettings, unchangedData, propertyValuesEntered);
	// Put each property into its own change. This ensures that we don't lose previous changes.
	let changes = separateChanges(propertyChanges, propertyPath, control);
	if (globalSettings) {
		const globalChanges = getChangedPropertyValues(globalSettings, unchangedData, propertyValuesEntered);
		const global = separateGlobalChanges(globalChanges, propertyPath, control);
		changes = changes.concat(global);
	}
	if (changes.length > 0) {
		return changes;
	} else {
		return [];
	}
};

export const noChanges = function (): [] {
	return [];
};

export function isFioriToolsRtaMode(appComponent: AppComponent): boolean {
	// Check if rta mode has been specified on url (for local testing)
	let urlParams: Record<string, string[]> = {};
	const shellService = appComponent.getShellServices();
	urlParams = shellService?.parseParameters?.(window.location.search);
	return !!urlParams && urlParams["fiori-tools-rta-mode"]?.[0] === "forAdaptation";
}

export function isRTAMode(appComponent: AppComponent): boolean {
	// Check if rta mode has been specified on url (for local testing)
	let urlParams: Record<string, string[]> = {};
	const shellService = appComponent.getShellServices();
	urlParams = shellService?.parseParameters?.(window.location.search);
	return !!urlParams && urlParams["sap-fe-rta-mode"]?.[0] === "true";
}

export function getSettingsIfKeyUser(appComponent: AppComponent, items: SettingsData[]): SettingsData[] {
	if (!isFioriToolsRtaMode(appComponent)) {
		// not tools => key user
		return items.filter((setting) => {
			return setting.keyUser;
		});
	}
	return items;
}

export function isConfigModelPrepared(configContext: Context, path = "rta/configSettings"): boolean {
	if (configContext.getProperty(path)) {
		return true;
	}
	return false;
}

export function prepareConfigModel(items: SettingsData[], configContext: Context, path = "rta/configSettings"): void {
	if (!configContext.getProperty(path)) {
		configContext.setProperty(path, items);
	}
}

export function getPersonalizationSetting(configContext: Context, path = "rta/configSettings"): boolean | string | undefined {
	const settings = configContext.getObject(path);
	const personalizationSetting = settings.find((setting: SettingsData) => {
		return setting?.control[0]?.id === "personalization";
	});
	if (personalizationSetting) {
		return personalizationSetting.control[0].value;
	}
	return undefined;
}

export function updateConfigModel(configContext: Context, settingsModel: JSONModel, path = "rta/configSettings"): void {
	const updatedSettings = deepClone(settingsModel.getData());
	configContext.setProperty(path, updatedSettings);
}

export function getPropertyNamesAndDescriptions(props: DesigntimeSetting[], resourceModel: ResourceModel): DesigntimeSetting[] {
	props.forEach(function (prop) {
		prop.name = resourceModel.getText(prop.name);
		prop.description = resourceModel.getText(prop.description);
		if (prop.enums) {
			prop.enums.forEach(function (enumm) {
				enumm.name = resourceModel.getText(enumm.name);
			});
		}
	});

	return props;
}
