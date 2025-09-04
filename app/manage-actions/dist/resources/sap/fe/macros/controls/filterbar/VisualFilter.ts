import type { Parameter, SelectOptionType, SelectionVariantType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { defineUI5Class, implementInterface } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import CommonHelper from "sap/fe/macros/CommonHelper";
import VisualFilterUtils from "sap/fe/macros/controls/filterbar/utils/VisualFilterUtils";
import type { IFilterControl } from "sap/fe/macros/filter/FilterUtils";
import FilterUtils from "sap/fe/macros/filter/FilterUtils";
import { getFiltersConditionsFromSelectionVariant } from "sap/fe/macros/filterBar/FilterHelper";
import type { PropertyInfo } from "sap/fe/macros/internal/PropertyInfo";
import type { SerializedSelectionVariant } from "sap/fe/navigation/SelectionVariant";
import VBox from "sap/m/VBox";
import type InteractiveBarChart from "sap/suite/ui/microchart/InteractiveBarChart";
import type InteractiveDonutChart from "sap/suite/ui/microchart/InteractiveDonutChart";
import type InteractiveLineChart from "sap/suite/ui/microchart/InteractiveLineChart";
import Library from "sap/ui/core/Lib";
import type { IFormContent } from "sap/ui/core/library";
import type FilterBar from "sap/ui/mdc/FilterBar";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type { ODataListBinding$DataReceivedEvent } from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { MetaModelType } from "types/metamodel_types";
/**
 * Constructor for a new filterBar/aligned/FilterItemLayout.
 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
 * @param {object} [mSettings] Initial settings for the new control
 * @since 1.61.0
 */
@defineUI5Class("sap.fe.macros.controls.filterbar.VisualFilter")
class VisualFilter extends VBox implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	private _oChartBinding?: ODataListBinding;

	onAfterRendering(): void {
		let sLabel;
		const oInteractiveChart = this.getInteractiveChart();
		const sInternalContextPath = this.data("infoPath");
		const oInteractiveChartListBinding = (oInteractiveChart.getBinding("segments") ||
			oInteractiveChart.getBinding("bars") ||
			oInteractiveChart.getBinding("points")) as ODataListBinding;
		const oInternalModelContext = oInteractiveChart.getBindingContext("internal") as InternalModelContext;
		const oResourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
		const bShowOverLayInitially = oInteractiveChart.data("showOverlayInitially");
		const oSelectionVariantAnnotation: MetaModelType<SelectionVariantType> = (oInteractiveChart.data(
			"selectionVariantAnnotation"
		) as SerializedSelectionVariant)
			? oInteractiveChart.data("selectionVariantAnnotation")
			: ({ SelectOptions: [] } as unknown as MetaModelType<SelectionVariantType>);
		const aRequiredProperties: string[] = oInteractiveChart.data("requiredProperties")
			? (CommonHelper.parseCustomData(oInteractiveChart.data("requiredProperties")) as string[])
			: [];
		const oMetaModel = (oInteractiveChart.getModel() as ODataModel).getMetaModel();
		const sEntitySetPath = oInteractiveChartListBinding ? oInteractiveChartListBinding.getPath() : "";
		let oFilterBar = this.getParent()?.getParent()?.getParent() as FilterBar;
		// TODO: Remove this part once 2170204347 is fixed
		if (oFilterBar.getMetadata().getElementName() === "sap.ui.mdc.filterbar.p13n.AdaptationFilterBar") {
			oFilterBar = oFilterBar.getParent()?.getParent()?.getParent() as FilterBar;
		}
		let oFilterBarConditions: Record<string, ConditionObject[]> = {};
		let aPropertyInfoSet: PropertyInfo[] = [];
		let sFilterEntityName;
		if (oFilterBar.isA<FilterBar>("sap.fe.macros.controls.FilterBar")) {
			oFilterBarConditions = oFilterBar.getConditions();
			aPropertyInfoSet = FilterUtils.getFilterPropertyInfo(oFilterBar as IFilterControl) as PropertyInfo[];
			sFilterEntityName = oFilterBar.data("entityType").split("/")[1];
		}
		const aParameters = oInteractiveChart.data("parameters") ? oInteractiveChart.data("parameters") : [];
		const filterConditions = getFiltersConditionsFromSelectionVariant(
			sEntitySetPath,
			oMetaModel,
			oSelectionVariantAnnotation,
			VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils)
		);
		const oSelectionVariantConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
		const mConditions: Record<string, ConditionObject[]> = {};

		Object.keys(oFilterBarConditions).forEach(function (sKey: string) {
			if (oFilterBarConditions[sKey].length) {
				mConditions[sKey] = oFilterBarConditions[sKey];
			}
		});

		Object.keys(oSelectionVariantConditions).forEach(function (sKey: string) {
			if (!mConditions[sKey]) {
				mConditions[sKey] = oSelectionVariantConditions[sKey];
			}
		});
		if (bShowOverLayInitially === true) {
			if (!Object.keys(oSelectionVariantAnnotation).length) {
				if (aRequiredProperties.length > 1) {
					oInternalModelContext.setProperty(sInternalContextPath, {
						showError: true,
						errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
						errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF")
					});
				} else {
					sLabel =
						oMetaModel.getObject(`${sEntitySetPath}/${aRequiredProperties[0]}@com.sap.vocabularies.Common.v1.Label`) ||
						aRequiredProperties[0];
					oInternalModelContext.setProperty(sInternalContextPath, {
						showError: true,
						errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
						errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF", sLabel)
					});
				}
			} else {
				const aSelectOptions: string[] = [];
				const aNotMatchedConditions: string[] = [];
				if (oSelectionVariantAnnotation.SelectOptions) {
					oSelectionVariantAnnotation.SelectOptions.forEach(function (oSelectOption: MetaModelType<SelectOptionType>) {
						aSelectOptions.push(oSelectOption.PropertyName!.$PropertyPath);
					});
				}
				if (oSelectionVariantAnnotation.Parameters) {
					oSelectionVariantAnnotation.Parameters.forEach(function (oParameter) {
						aSelectOptions.push((oParameter as MetaModelType<Parameter>).PropertyName!.$PropertyPath);
					});
				}
				aRequiredProperties.forEach(function (sPath: string) {
					if (!aSelectOptions.includes(sPath)) {
						aNotMatchedConditions.push(sPath);
					}
				});

				const errorInfo = VisualFilterUtils.getErrorInfoForNoInitialOverlay(
					aNotMatchedConditions,
					oResourceBundle,
					sEntitySetPath,
					oMetaModel
				);
				oInternalModelContext.setProperty(sInternalContextPath, errorInfo);
			}
		}

		if (!this._oChartBinding || this._oChartBinding !== oInteractiveChartListBinding) {
			if (this._oChartBinding) {
				this.detachDataReceivedHandler(this._oChartBinding);
			}
			this.attachDataRecivedHandler(oInteractiveChartListBinding);
			this._oChartBinding = oInteractiveChartListBinding;
		}
		const bShowOverlay =
			oInternalModelContext.getProperty(sInternalContextPath) && oInternalModelContext.getProperty(sInternalContextPath).showError;
		const sChartEntityName = sEntitySetPath !== "" ? sEntitySetPath.split("/")[1].split("(")[0] : "";
		if (aParameters && aParameters.length && sFilterEntityName === sChartEntityName) {
			const sBindingPath = FilterUtils.getBindingPathForParameters(
				oFilterBar as IFilterControl,
				mConditions,
				aPropertyInfoSet,
				aParameters
			);
			if (sBindingPath) {
				(oInteractiveChartListBinding as { sPath?: string }).sPath = sBindingPath;
			}
		}
		// resume binding for only those visual filters that do not have a in parameter attached.
		// Bindings of visual filters with inParameters will be resumed later after considering in parameters.
		if (oInteractiveChartListBinding && oInteractiveChartListBinding.isSuspended() && !bShowOverlay) {
			oInteractiveChartListBinding.resume();
		}
	}

	attachDataRecivedHandler(oInteractiveChartListBinding: ODataListBinding): void {
		if (oInteractiveChartListBinding) {
			oInteractiveChartListBinding.attachEvent("dataReceived", {}, this.onInternalDataReceived, this);
			this._oChartBinding = oInteractiveChartListBinding;
		}
	}

	detachDataReceivedHandler(oInteractiveChartListBinding: ODataListBinding): void {
		if (oInteractiveChartListBinding) {
			oInteractiveChartListBinding.detachEvent("dataReceived", this.onInternalDataReceived, this);
			this._oChartBinding = undefined;
		}
	}

	getInteractiveChart(): InteractiveBarChart | InteractiveDonutChart | InteractiveLineChart {
		return (this.getItems()[1] as VBox).getItems()[0] as InteractiveBarChart | InteractiveDonutChart | InteractiveLineChart;
	}

	onInternalDataReceived(oEvent: ODataListBinding$DataReceivedEvent): void {
		const sId = this.getId();
		const oView = CommonUtils.getTargetView(this);
		const oInteractiveChart = this.getInteractiveChart();
		const sInternalContextPath = this.data("infoPath");
		const oInternalModelContext = oInteractiveChart.getBindingContext("internal") as InternalModelContext;
		const oResourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
		const vUOM = oInteractiveChart.data("uom");
		VisualFilterUtils.updateChartScaleFactorTitle(oInteractiveChart, oView, sId, sInternalContextPath);
		if (oEvent.getParameter("error")) {
			const s18nMessageTitle = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE");
			const s18nMessage = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_DATA_TEXT");
			VisualFilterUtils.applyErrorMessageAndTitle(s18nMessageTitle, s18nMessage, sInternalContextPath, oView);
		} else if (oEvent.getParameter("data")) {
			const oData = oEvent.getSource().getCurrentContexts();
			if (oData && oData.length === 0) {
				VisualFilterUtils.setNoDataMessage(sInternalContextPath, oResourceBundle, oView);
			} else {
				oInternalModelContext.setProperty(sInternalContextPath, {});
			}
			VisualFilterUtils.setMultiUOMMessage(oData, oInteractiveChart, sInternalContextPath, oResourceBundle, oView);
		}
		if (vUOM && ((vUOM["ISOCurrency"] && vUOM["ISOCurrency"].$Path) || (vUOM["Unit"] && vUOM["Unit"].$Path))) {
			const oContexts = oEvent.getSource().getContexts();
			const oContextData = oContexts && oContexts[0].getObject();
			VisualFilterUtils.applyUOMToTitle(oInteractiveChart, oContextData, oView, sInternalContextPath);
		}
	}
}
export default VisualFilter;
