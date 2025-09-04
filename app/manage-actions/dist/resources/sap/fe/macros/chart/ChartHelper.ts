import type * as Edm from "@sap-ux/vocabularies-types/Edm";
import { AggregationAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Aggregation";
import type { SortOrderType } from "@sap-ux/vocabularies-types/vocabularies/Common";
import { CommonAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/Common";
import type {
	Chart,
	ChartType,
	CriticalityType,
	DataFieldForAction,
	OperationGroupingType,
	PresentationVariantType,
	ValueCriticalityType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type DimensionRoleType from "sap/chart/data/DimensionRoleType";
import type AttributeModel from "sap/fe/core/buildingBlocks/templating/AttributeModel";
import type { ChartApplySupported } from "sap/fe/core/converters/controls/Common/Chart";
import { getUiControl } from "sap/fe/core/converters/controls/Common/DataVisualization";
import type { ComputedAnnotationInterface } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import type { MeasureType } from "sap/fe/macros/chart/MdcChartTemplate";
import ActionHelper from "sap/fe/macros/internal/helpers/ActionHelper";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModelAnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { ExpandPathType, MetaModelEnum, MetaModelType } from "types/metamodel_types";

function getEntitySetPath(annotationContext: Context): string {
	return annotationContext.getPath().replace(/@com.sap.vocabularies.UI.v1.(Chart|PresentationVariant).*/, "");
}

const ChartTypeEnum = {
	"com.sap.vocabularies.UI.v1.ChartType/Column": "column",
	"com.sap.vocabularies.UI.v1.ChartType/ColumnStacked": "stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/ColumnDual": "dual_column",
	"com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual": "dual_stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/ColumnStacked100": "100_stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/ColumnStackedDual100": "100_dual_stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/Bar": "bar",
	"com.sap.vocabularies.UI.v1.ChartType/BarStacked": "stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/BarDual": "dual_bar",
	"com.sap.vocabularies.UI.v1.ChartType/BarStackedDual": "dual_stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/BarStacked100": "100_stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/BarStackedDual100": "100_dual_stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/Area": "area",
	"com.sap.vocabularies.UI.v1.ChartType/AreaStacked": "stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/AreaStacked100": "100_stacked_column",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalArea": "bar",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked": "stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalAreaStacked100": "100_stacked_bar",
	"com.sap.vocabularies.UI.v1.ChartType/Line": "line",
	"com.sap.vocabularies.UI.v1.ChartType/LineDual": "dual_line",
	"com.sap.vocabularies.UI.v1.ChartType/Combination": "combination",
	"com.sap.vocabularies.UI.v1.ChartType/CombinationStacked": "stacked_combination",
	"com.sap.vocabularies.UI.v1.ChartType/CombinationDual": "dual_combination",
	"com.sap.vocabularies.UI.v1.ChartType/CombinationStackedDual": "dual_stacked_combination",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationStacked": "horizontal_stacked_combination",
	"com.sap.vocabularies.UI.v1.ChartType/Pie": "pie",
	"com.sap.vocabularies.UI.v1.ChartType/Donut": "donut",
	"com.sap.vocabularies.UI.v1.ChartType/Scatter": "scatter",
	"com.sap.vocabularies.UI.v1.ChartType/Bubble": "bubble",
	"com.sap.vocabularies.UI.v1.ChartType/Radar": "line",
	"com.sap.vocabularies.UI.v1.ChartType/HeatMap": "heatmap",
	"com.sap.vocabularies.UI.v1.ChartType/TreeMap": "treemap",
	"com.sap.vocabularies.UI.v1.ChartType/Waterfall": "waterfall",
	"com.sap.vocabularies.UI.v1.ChartType/Bullet": "bullet",
	"com.sap.vocabularies.UI.v1.ChartType/VerticalBullet": "vertical_bullet",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalWaterfall": "horizontal_waterfall",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationDual": "dual_horizontal_combination",
	"com.sap.vocabularies.UI.v1.ChartType/HorizontalCombinationStackedDual": "dual_horizontal_stacked_combination"
};
const DimensionRoleTypeEnum = {
	"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category": "category",
	"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Series": "series",
	"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category2": "category2"
};
/**
 * Helper class for sap.fe.macros Chart phantom control for preprocessing.
 * <h3><b>Note:</b></h3>
 * The class is experimental and the API/behaviour is not finalised
 * and hence this should not be used for productive usage.
 * Especially this class is not intended to be used for the FE scenario,
 * here we shall use sap.fe.macros.ChartHelper that is especially tailored for V4
 * meta model
 * @author SAP SE
 * @private
 * @experimental
 * @since 1.62.0
 * @alias sap.fe.macros.ChartHelper
 */
const ChartHelper = {
	formatJSONToString(crit: object | undefined): string | undefined {
		if (!crit) {
			return undefined;
		}

		let criticality = JSON.stringify(crit);
		criticality = criticality.replace(new RegExp("{", "g"), "\\{");
		criticality = criticality.replace(new RegExp("}", "g"), "\\}");
		return criticality;
	},
	formatChartType(chartType: ChartType): string {
		return ChartTypeEnum[(chartType as unknown as MetaModelEnum<ChartType>)?.$EnumMember as keyof typeof ChartTypeEnum];
	},
	formatDimensions(annotationContext: Context): Context {
		const annotation = annotationContext.getObject("./") as Chart,
			metaModel = annotationContext.getModel(),
			entitySetPath = getEntitySetPath(annotationContext),
			dimensions = [];

		let isNavigationText = false;

		//perhaps there are no dimension
		annotation.DimensionAttributes = annotation.DimensionAttributes || [];

		for (const dimension of annotation.Dimensions) {
			const key = (dimension as unknown as ExpandPathType<Edm.PropertyPath>).$PropertyPath;
			const text = metaModel.getObject(`${entitySetPath + key}@${CommonAnnotationTerms.Text}`) || {};
			if (key.includes("/")) {
				Log.error(`$expand is not yet supported. Dimension: ${key} from an association cannot be used`);
			}
			if (text.$Path && text.$Path.indexOf("/") > -1) {
				Log.error(
					`$expand is not yet supported. Text Property: ${text.$Path} from an association cannot be used for the dimension ${key}`
				);
				isNavigationText = true;
			}

			const chartDimension: { [key: string]: string | undefined } = {
				key: key,
				textPath: !isNavigationText ? text.$Path : undefined,
				label: metaModel.getObject(`${entitySetPath + key}@${CommonAnnotationTerms.Label}`),
				role: "category"
			};

			for (const attribute of annotation.DimensionAttributes) {
				if (chartDimension.key === (attribute.Dimension as unknown as ExpandPathType<Edm.PropertyPath>)?.$PropertyPath) {
					chartDimension.role =
						DimensionRoleTypeEnum[
							(attribute.Role as unknown as MetaModelEnum<DimensionRoleType>)
								?.$EnumMember as keyof typeof DimensionRoleTypeEnum
						] || chartDimension.role;
					break;
				}
			}

			const criticality = this.fetchCriticality(metaModel, metaModel.createBindingContext(entitySetPath + key));
			chartDimension.criticality = this.formatJSONToString(criticality);
			dimensions.push(chartDimension);
		}

		const dimensionModel = new JSONModel(dimensions);
		(dimensionModel as AttributeModel).$$valueAsPromise = true;
		return dimensionModel.createBindingContext("/");
	},

	fetchCriticality(oMetaModel: ODataMetaModel, oCtx: Context): object | undefined {
		const UI = "@com.sap.vocabularies.UI.v1";
		const aValueCriticality: MetaModelType<ValueCriticalityType>[] = oMetaModel.getObject(`${UI}.ValueCriticality`, oCtx);
		let oCriticality: Record<string, unknown[]> | undefined, oValueCriticality: MetaModelType<ValueCriticalityType>;

		if (aValueCriticality) {
			oCriticality = {
				VeryPositive: [],
				Positive: [],
				Critical: [],
				VeryNegative: [],
				Negative: [],
				Neutral: []
			};

			for (let i = 0; i < aValueCriticality.length; i++) {
				oValueCriticality = aValueCriticality[i];
				const criticality = oValueCriticality.Criticality as unknown as MetaModelEnum<CriticalityType>;
				if (criticality?.$EnumMember.endsWith("VeryPositive")) {
					oCriticality.VeryPositive.push(oValueCriticality.Value);
				} else if (criticality?.$EnumMember.endsWith("Positive")) {
					oCriticality.Positive.push(oValueCriticality.Value);
				} else if (criticality?.$EnumMember.endsWith("Critical")) {
					oCriticality.Critical.push(oValueCriticality.Value);
				} else if (criticality?.$EnumMember.endsWith("VeryNegative")) {
					oCriticality.VeryNegative.push(oValueCriticality.Value);
				} else if (criticality?.$EnumMember.endsWith("Negative")) {
					oCriticality.Negative.push(oValueCriticality.Value);
				} else {
					oCriticality.Neutral.push(oValueCriticality.Value);
				}
			}

			for (const sKey in oCriticality) {
				if (oCriticality[sKey]?.length == 0) {
					delete oCriticality[sKey];
				}
			}
		}

		return oCriticality;
	},

	formatMeasures(annotationContext: Context): MeasureType[] {
		return (annotationContext.getModel() as JSONModel).getData();
	},

	getUiChart(presentationContext: Context): Context {
		return getUiControl(presentationContext, `@${UIAnnotationTerms.Chart}`);
	},
	getOperationAvailableMap(chart: Chart, contextContext: ComputedAnnotationInterface): string {
		const chartCollection = chart?.Actions || [];
		return JSON.stringify(ActionHelper.getOperationAvailableMap(chartCollection, "chart", contextContext));
	},

	/**
	 * Returns a JSON object containing Presentation Variant sort conditions.
	 * @param oContext
	 * @param oContext.getPath
	 * @param oContext.getModel
	 * @param oPresentationVariant Presentation Variant annotation
	 * @param sPresentationVariantPath
	 * @param oApplySupported
	 * @returns JSON object
	 */
	getSortConditions: function (
		oContext: Context,
		oPresentationVariant: MetaModelType<PresentationVariantType>,
		sPresentationVariantPath: string,
		oApplySupported: ChartApplySupported
	):
		| {
				sorters: { name: string; descending: boolean }[];
		  }
		| undefined {
		if (
			oPresentationVariant &&
			CommonHelper._isPresentationVariantAnnotation(sPresentationVariantPath) &&
			oPresentationVariant.SortOrder
		) {
			const aSortConditions: {
				sorters: { name: string; key: string; descending: boolean }[];
			} = {
				sorters: []
			};
			const sEntityPath = oContext.getPath().split("@")[0];
			oPresentationVariant.SortOrder.forEach(function (oCondition: MetaModelType<SortOrderType> = {}): void {
				let oSortProperty = "";
				if (oCondition.DynamicProperty) {
					oSortProperty =
						"_fe_aggregatable_" + oContext.getModel().getObject(sEntityPath + oCondition.DynamicProperty.$AnnotationPath)?.Name;
				} else if (oCondition.Property) {
					const aGroupableProperties = oApplySupported.GroupableProperties;
					if (aGroupableProperties && aGroupableProperties.length) {
						for (let i = 0; i < aGroupableProperties.length; i++) {
							if (
								(aGroupableProperties[i] as { $PropertyPath: string }).$PropertyPath === oCondition.Property.$PropertyPath
							) {
								oSortProperty = "_fe_groupable_" + oCondition.Property.$PropertyPath;
								break;
							}
							if (!oSortProperty) {
								oSortProperty = "_fe_aggregatable_" + oCondition.Property.$PropertyPath;
							}
						}
					} else if (
						oContext
							.getModel()
							.getObject(`${sEntityPath + oCondition.Property.$PropertyPath}@${AggregationAnnotationTerms.Groupable}`)
					) {
						oSortProperty = "_fe_groupable_" + oCondition.Property.$PropertyPath;
					} else {
						oSortProperty = "_fe_aggregatable_" + oCondition.Property.$PropertyPath;
					}
				}
				if (oSortProperty) {
					const oSorter = {
						name: oSortProperty,
						key: oSortProperty,
						descending: !!oCondition.Descending
					};
					aSortConditions.sorters.push(oSorter);
				} else {
					throw new Error("Please define the right path to the sort property");
				}
			});
			return aSortConditions;
		}
		return undefined;
	},
	_getModel(oCollection: unknown, oInterface: ComputedAnnotationInterface): Context {
		return oInterface.context;
	},
	// TODO: combine this one with the one from the table
	isDataFieldForActionButtonEnabled(
		bIsBound: boolean,
		sAction: string,
		oCollection: Context,
		sOperationAvailableMap: string,
		sEnableSelectOn: string
	): string {
		if (bIsBound !== true) {
			return "true";
		}
		const oModel = oCollection.getModel();
		const sNavPath = oCollection.getPath();
		const sPartner = oModel.getObject(sNavPath).$Partner;
		const oOperationAvailableMap = sOperationAvailableMap && JSON.parse(sOperationAvailableMap);
		const aPath = oOperationAvailableMap && oOperationAvailableMap[sAction] && oOperationAvailableMap[sAction].split("/");
		const sNumberOfSelectedContexts = ActionHelper.getNumberOfContextsExpression(sEnableSelectOn);
		if (aPath && aPath[0] === sPartner) {
			const sPath = oOperationAvailableMap[sAction].replace(sPartner + "/", "");
			return "{= ${" + sNumberOfSelectedContexts + " && ${" + sPath + "}}";
		} else {
			return "{= ${" + sNumberOfSelectedContexts + "}";
		}
	},
	getHiddenPathExpressionForTableActionsAndIBN(sHiddenPath: string, oDetails: ComputedAnnotationInterface): string | true {
		const oContext = oDetails.context,
			sPropertyPath = oContext.getPath(),
			sEntitySetPath = ODataModelAnnotationHelper.getNavigationPath(sPropertyPath);
		if (sHiddenPath.indexOf("/") > 0) {
			const aSplitHiddenPath = sHiddenPath.split("/");
			const sNavigationPath = aSplitHiddenPath[0];
			// supports visiblity based on the property from the partner association
			if (oContext.getObject(sEntitySetPath + "/$Partner") === sNavigationPath) {
				return "{= !%{" + aSplitHiddenPath.slice(1).join("/") + "} }";
			}
			// any other association will be ignored and the button will be made visible
		}
		return true;
	},
	/**
	 * Method to get press event for DataFieldForActionButton.
	 * @param id Current control ID
	 * @param action DataFieldForAction model
	 * @param operationAvailableMap Stringified JSON object
	 * @returns A binding expression for the press property of the DataFieldForActionButton
	 */
	getPressEventForDataFieldForActionButton(
		id: string,
		action: MetaModelType<DataFieldForAction> & { InvocationGrouping: MetaModelEnum<OperationGroupingType> },
		operationAvailableMap: string
	): string {
		return ActionHelper.getPressEventDataFieldForActionButton(
			id,
			action,
			{
				contexts: "${internal>selectedContexts}"
			},
			operationAvailableMap
		);
	},
	/**
	 * @param action DataFieldForAction model
	 * @returns A Boolean value depending on the action type
	 */
	getActionType(action: DataFieldForAction): boolean {
		return (
			(action["$Type"].includes(UIAnnotationTypes.DataFieldForIntentBasedNavigation) ||
				action["$Type"].includes(UIAnnotationTypes.DataFieldForAction)) &&
			action["Inline"]
		).valueOf();
	},
	getCollectionName(collection: string): string {
		const collectionSplit = collection.split("/");
		return collectionSplit[collectionSplit.length - 1];
	}
};
(ChartHelper.getSortConditions as { requiresIContext?: boolean }).requiresIContext = true;

export default ChartHelper;
