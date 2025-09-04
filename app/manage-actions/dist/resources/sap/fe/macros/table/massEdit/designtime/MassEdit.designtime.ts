import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { adaptionChange } from "sap/fe/macros/designtime/Designtime.helper";
import { extractChanges } from "sap/fe/macros/designtime/Designtime.helper";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type Dialog from "sap/m/Dialog";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Library from "sap/ui/core/Lib";
import type Context from "sap/ui/model/Context";
import { getPropertyPath } from "../../designtime/Table.designtime.helper";
import MassEditDesignDialog from "./MassEditDesignDialog";

const massEditRtaPath = "rta/massEditConfigSettings/visibleFields";
const MassEditDesignTime = {
	actions: {
		rename: (): null => null, // Remove the rename action of the sap.m.dialog
		settings: {
			fe: {
				name: (Library.getResourceBundleFor("sap.fe.macros") as ResourceBundle).getText("C_MASS_EDIT_DESIGN_CONFIGURATION"),
				icon: "sap-icon://developer-settings",
				/**
				 * Handles the changes for the mass edit configuration.
				 * @param dialog The dialog that is opened
				 * @returns The changes
				 */
				handler: async (dialog: Dialog): Promise<adaptionChange[]> => {
					let element: ManagedObject | null = dialog;
					while (element && !element.isA<TableAPI>("sap.fe.macros.table.TableAPI")) {
						element = element.getParent();
					}
					const massEditDialogHelper = element?.getMassEditDialogHelper();

					if (!element || !massEditDialogHelper) {
						return [];
					}
					try {
						const configContext = element.getBindingContext("internal") as Context;
						const rtaSelectedItems = configContext.getProperty(massEditRtaPath) as undefined | string;
						const originalFields =
							rtaSelectedItems ??
							massEditDialogHelper
								.getFieldProperties()
								.map((field) => field.propertyInfo.relativePath)
								.join(",");

						const result = await new MassEditDesignDialog(element).openDialog(dialog, originalFields);
						const isChangeObserved = result !== originalFields;
						const initialIgnoredFields = element.getTableDefinition().control.massEdit.ignoredFields.join(",");
						if (isChangeObserved) {
							configContext.setProperty(massEditRtaPath, result);
						}

						return extractChanges(
							[
								{
									id: "visibleFields",
									name: "visible fields",
									description: "Visible fields for the mass edit dialog",
									type: "string",
									value: originalFields
								},
								{
									id: "ignoredFields",
									name: "ignored fields",
									description: "Ignored fields for the mass edit dialog",
									type: "string",
									value: initialIgnoredFields
								}
							],
							{
								visibleFields: originalFields,
								ignoredFields: initialIgnoredFields
							},
							{
								visibleFields: result,
								ignoredFields: !isChangeObserved ? initialIgnoredFields : ""
							},
							`${getPropertyPath(element)}/enableMassEdit`,
							element.getContent()
						);
					} catch (error: unknown) {
						return [];
					}
				}
			}
		}
	},
	properties: {},
	aggregations: {}
};

export default MassEditDesignTime;
