import type { DataFieldForAction, DataFieldForIntentBasedNavigation } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { type CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { CustomAndAction } from "sap/fe/macros/chart/MdcChartTemplate";
import type { TableBlockProperties } from "sap/fe/macros/table/MdcTableTemplate";
import Table from "sap/fe/macros/table/TableHelper";
import { MenuButtonMode } from "sap/m/library";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

const DefaultActionHandler = {
	/**
	 * The default action group handler that is invoked when adding the menu button handling appropriately.
	 * @param table The current context in which the handler is called
	 * @param metaModel The current metaModel
	 * @param oAction The current action context
	 * @param oDataFieldForDefaultAction The current dataField for the default action
	 * @param defaultActionContextOrEntitySet The current context for the default action
	 * @param mode The optional parameter for the handler mode; default setting is Table
	 * @param collectionContext
	 * @returns The appropriate expression string
	 */
	getDefaultActionHandler: function (
		table: TableBlockProperties | undefined,
		metaModel: ODataMetaModel | undefined,
		oAction: Omit<CustomAction, "defaultAction"> & { defaultAction?: CustomAction },
		oDataFieldForDefaultAction: DataFieldForIntentBasedNavigation | DataFieldForAction | undefined,
		defaultActionContextOrEntitySet: string | object | undefined,
		mode: "Table" | "Form",
		collectionContext: Context
	): CompiledBindingToolkitExpression | undefined {
		if (oAction.defaultAction) {
			try {
				switch (oAction.defaultAction.type) {
					case "ForAction": {
						if (mode === "Table" && table && metaModel) {
							const actionObject =
								typeof defaultActionContextOrEntitySet === "string"
									? metaModel.createBindingContext(defaultActionContextOrEntitySet)?.getObject()
									: defaultActionContextOrEntitySet;

							return Table.pressEventDataFieldForActionButton(
								table,
								oDataFieldForDefaultAction as DataFieldForAction,
								collectionContext.getObject("@sapui.name"),
								table.tableDefinition.operationAvailableMap,
								actionObject,
								oAction.isNavigable,
								oAction.enableAutoScroll,
								oAction.defaultValuesExtensionFunction
							);
						}
						return undefined;
					}
					case "ForNavigation": {
						if (mode === "Table" && table) {
							return CommonHelper.getPressHandlerForDataFieldForIBN(
								oDataFieldForDefaultAction as DataFieldForIntentBasedNavigation,
								"${internal>selectedContexts}",
								!table.tableDefinition.enableAnalytics
							);
						}
						return undefined;
					}
					default: {
						if (oAction.defaultAction.command) {
							return "cmd:" + oAction.defaultAction.command;
						}
						if (oAction.defaultAction.noWrap) {
							return oAction.defaultAction.press;
						} else {
							switch (mode) {
								case "Table": {
									return CommonHelper.buildActionWrapper(oAction.defaultAction, table);
								}
								case "Form": {
									return CommonHelper.buildActionWrapper(oAction.defaultAction, { id: "forTheForm" });
								}
							}
						}
					}
				}
			} catch (ioEx) {
				return "binding for the default action is not working as expected";
			}
		}
		return undefined;
	},

	/**
	 * The function determines during templating whether to use the defaultActionOnly
	 * setting for the sap.m.MenuButton control in case a defaultAction is provided.
	 * @param oAction The current action context
	 * @returns A Boolean value
	 */
	getUseDefaultActionOnly: function (oAction: CustomAndAction): boolean {
		if (oAction.defaultAction) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * The function determines during templating whether to use the 'Split'
	 * or 'Regular' MenuButtonMode for the sap.m.MenuButton control
	 * in case a defaultAction is available.
	 * @param oAction The current action context
	 * @returns The MenuButtonMode
	 */
	getButtonMode: function (oAction: CustomAndAction): MenuButtonMode {
		if (oAction.defaultAction) {
			return MenuButtonMode.Split;
		} else {
			return MenuButtonMode.Regular;
		}
	}
};

export default DefaultActionHandler;
