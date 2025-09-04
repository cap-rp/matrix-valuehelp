import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import CommonUtils from "sap/fe/core/CommonUtils";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { $HBoxSettings } from "sap/m/HBox";
import HBox from "sap/m/HBox";
import type Link from "sap/m/Link";
import type ResponsivePopover from "sap/m/ResponsivePopover";
import { default as Util } from "sap/m/table/Util";
import type Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import Filter from "sap/ui/model/Filter";
import Sorter from "sap/ui/model/Sorter";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import FieldRuntimeHelper from "./FieldRuntimeHelper";

/**
 * Static class used by "sap.ui.mdc.Field" during runtime
 * @private
 * @experimental This module is only for internal/experimental use!
 */
const FieldRuntime = {
	uploadPromises: {} as Record<string, { resolve: Function; reject: Function }>,
	creatingInactiveRow: false,

	/**
	 * This is a formatter in disguise.
	 * @param sPropertyPath
	 * @param sSemanticKeyHasDraftIndicator
	 * @param HasDraftEntity
	 * @param IsActiveEntity
	 * @param hideDraftInfo
	 * @returns True if the draft indicator should be displayed.
	 */
	isDraftIndicatorVisible: function (
		sPropertyPath: string,
		sSemanticKeyHasDraftIndicator: string,
		HasDraftEntity?: boolean,
		IsActiveEntity?: boolean,
		hideDraftInfo?: boolean
	): boolean {
		if (IsActiveEntity !== undefined && HasDraftEntity !== undefined && (!IsActiveEntity || HasDraftEntity) && !hideDraftInfo) {
			return sPropertyPath === sSemanticKeyHasDraftIndicator;
		} else {
			return false;
		}
	},

	/**
	 * Handler for the validateFieldGroup event.
	 * @param oEvent The event object passed by the validateFieldGroup event
	 */
	onValidateFieldGroup: function (oEvent: Control$ValidateFieldGroupEvent): void {
		const oSourceField = oEvent.getSource() as ManagedObject;
		const view = CommonUtils.getTargetView(oSourceField),
			controller = view.getController();

		const oFEController = FieldRuntimeHelper.getExtensionController(controller);
		oFEController._sideEffects.handleFieldGroupChange(oEvent);
	},

	_fnFixHashQueryString: function (sCurrentHash: string): string {
		if (sCurrentHash?.includes("?")) {
			// sCurrentHash can contain query string, cut it off!
			sCurrentHash = sCurrentHash.split("?")[0];
		}
		return sCurrentHash;
	},

	/**
	 * Method to retrieve text from the value list for DataField.
	 * This is a formatter in disguise.
	 * @param sPropertyValue The property value of the data field.
	 * @param sPropertyFullPath The full path to the property in the metadata.
	 * @param sDisplayFormat The display format for the data field.
	 * @returns The formatted value based on the display format.
	 */
	retrieveTextFromValueList: async function (sPropertyValue: string, sPropertyFullPath: string, sDisplayFormat: string): Promise<string> {
		let sTextProperty: string;
		let oMetaModel;
		let sPropertyName: string;
		if (sPropertyValue) {
			oMetaModel = CommonHelper.getMetaModel();
			sPropertyName = oMetaModel.getObject(`${sPropertyFullPath}@sapui.name`);
			return oMetaModel
				.requestValueListInfo(sPropertyFullPath, true)
				.then(function (mValueListInfo) {
					// take the "" one if exists, otherwise take the first one in the object TODO: to be discussed
					const oValueListInfo = mValueListInfo[mValueListInfo[""] ? "" : Object.keys(mValueListInfo)[0]];
					const oValueListModel = oValueListInfo.$model;
					const oMetaModelValueList = oValueListModel.getMetaModel();
					const oParamWithKey = oValueListInfo.Parameters.find(function (oParameter: {
						LocalDataProperty?: { $PropertyPath: string };
					}) {
						return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
					});
					if (oParamWithKey && !oParamWithKey.ValueListProperty) {
						throw new Error(`Inconsistent value help annotation for ${sPropertyName}`);
					}
					const oTextAnnotation = oMetaModelValueList.getObject(
						`/${oValueListInfo.CollectionPath}/${oParamWithKey.ValueListProperty}@com.sap.vocabularies.Common.v1.Text`
					);

					if (oTextAnnotation && oTextAnnotation.$Path) {
						sTextProperty = oTextAnnotation.$Path;
						const oFilter = new Filter({
							path: oParamWithKey.ValueListProperty,
							operator: "EQ",
							value1: sPropertyValue
						});
						const oListBinding = oValueListModel.bindList(`/${oValueListInfo.CollectionPath}`, undefined, undefined, oFilter, {
							$select: sTextProperty
						});
						return oListBinding.requestContexts(0, 2);
					} else {
						sDisplayFormat = "Value";
						return sPropertyValue;
					}
				})
				.then(function (aContexts: Context[]) {
					const sDescription = sTextProperty ? aContexts[0]?.getObject()[sTextProperty] : "";
					switch (sDisplayFormat) {
						case "Description":
							return sDescription;
						case "DescriptionValue":
							return Library.getResourceBundleFor("sap.fe.core")!.getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [
								sDescription,
								sPropertyValue
							]);
						case "ValueDescription":
							return Library.getResourceBundleFor("sap.fe.core")!.getText("C_FORMAT_FOR_TEXT_ARRANGEMENT", [
								sPropertyValue,
								sDescription
							]);
						default:
							return sPropertyValue;
					}
				})
				.catch(function (oError: unknown) {
					const errorObj = oError as { status: number; message: string };
					const sMsg =
						errorObj.status && errorObj.status === 404
							? `Metadata not found (${errorObj.status}) for value help of property ${sPropertyFullPath}`
							: errorObj.message;
					Log.error(sMsg);
				});
		}
		return sPropertyValue;
	},

	displayAggregateDetails: async function (event: Event, aggregatedPropertyPath?: string): Promise<void> {
		if (!aggregatedPropertyPath) {
			return;
		}
		const link = event.getSource<Link>();
		const analyticalTable = FPMHelper.getMdcTable(link)!;

		const rowContext = link.getBindingContext() as Context;
		const tableRowBinding = rowContext.getBinding() as ODataListBinding;

		// Get the filters corresponding to the total row
		const rowContextData = rowContext.getObject();
		const rowSpecificFilter: Filter[] = [];
		const rowFilter = rowContext.getFilter();
		if (rowFilter) {
			rowSpecificFilter.push(rowFilter);
		}

		// Add the filters applied to the original table
		const allFilters = rowSpecificFilter.concat(tableRowBinding.getFilters("Application"), tableRowBinding.getFilters("Control"));

		// Calculate $$aggregation parameters for the table in the popover (aggregate amount, group by currency/unit)
		const aggregation = tableRowBinding.getAggregation() as {
			group: Record<string, object>;
			aggregate: Record<string, { unit: string }>;
			search?: string;
		};
		const unitOrCurrencyName = aggregation.aggregate[aggregatedPropertyPath].unit;
		const group: Record<string, object> = {};
		group[unitOrCurrencyName] = {};
		const aggregate: Record<string, object> = {};
		aggregate[aggregatedPropertyPath] = { grandTotal: false, subtotals: false, unit: unitOrCurrencyName };

		// The item displayed in the table in the popover is a copy of the item displayed in the table
		const tableItem = link.getDependents()[0].clone();
		const currencyOrQuantityEnabledLayout = new HBox({
			renderType: "Bare",
			justifyContent: "End",
			items: [tableItem]
		} as $HBoxSettings);

		const aggregationParameters: {
			group: Record<string, object>;
			aggregate: Record<string, object>;
			search?: string;
		} = { group, aggregate };
		if (aggregation.search) {
			aggregationParameters.search = aggregation.search;
		}

		const oItemsBindingInfo = {
			path: tableRowBinding.getResolvedPath(),
			filters: allFilters,
			parameters: {
				$$aggregation: aggregationParameters
			},
			sorter: new Sorter(unitOrCurrencyName, false) // Order by currency
		};

		const isPopoverForGrandTotal = rowContextData["@$ui5.node.level"] === 0;
		const popover: ResponsivePopover = await Util.createOrUpdateMultiUnitPopover(`${analyticalTable.getId()}-multiUnitPopover`, {
			control: analyticalTable,
			grandTotal: isPopoverForGrandTotal,
			itemsBindingInfo: oItemsBindingInfo,
			listItemContentTemplate: currencyOrQuantityEnabledLayout
		});
		analyticalTable.addDependent(popover);

		const fnOnClose = (): void => {
			analyticalTable.removeDependent(popover);
			popover.detachEvent("afterClose", fnOnClose);
			popover.destroy();
		};
		popover.attachEvent("afterClose", fnOnClose);
		popover.openBy(link);
	}
};

ObjectPath.set("sap.fe.macros.field.FieldRuntime", FieldRuntime);

export default FieldRuntime;
