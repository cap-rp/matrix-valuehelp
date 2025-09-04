import { UIAnnotationTerms } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import FlexBox from "sap/m/FlexBox";
import Label from "sap/m/Label";
import mobilelibrary from "sap/m/library";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type AreaMicroChart from "sap/suite/ui/microchart/AreaMicroChart";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type ColumnMicroChart from "sap/suite/ui/microchart/ColumnMicroChart";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type ComparisonMicroChart from "sap/suite/ui/microchart/ComparisonMicroChart";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type LineMicroChart from "sap/suite/ui/microchart/LineMicroChart";
import type LineMicroChartLine from "sap/suite/ui/microchart/LineMicroChartLine";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import type { AccessibilityInfo } from "sap/ui/core/library";
import type RenderManager from "sap/ui/core/RenderManager";
import type Context from "sap/ui/model/Context";
import ODataV4ListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import DateType from "sap/ui/model/type/Date";

const ValueColor = mobilelibrary.ValueColor;
type DataPointValueType = {
	value: number;
	context?: Context;
	index?: number;
};
/**
 *  Container Control for Micro Chart and UoM.
 * @private
 * @experimental This module is only for internal/experimental use!
 */
@defineUI5Class("sap.fe.macros.microchart.MicroChartContainer")
class MicroChartContainer extends Control {
	@property({
		type: "boolean",
		defaultValue: false
	})
	showOnlyChart!: boolean;

	@property({
		type: "string",
		defaultValue: undefined
	})
	uomPath!: string;

	@property({
		type: "string[]",
		defaultValue: []
	})
	measures!: string[];

	@property({
		type: "string",
		defaultValue: undefined
	})
	dimension?: string;

	@property({
		type: "string[]",
		defaultValue: []
	})
	dataPointQualifiers!: string[];

	@property({
		type: "int",
		defaultValue: undefined
	})
	measurePrecision!: number;

	@property({
		type: "int",
		defaultValue: 1
	})
	measureScale!: number;

	@property({
		type: "int",
		defaultValue: undefined
	})
	dimensionPrecision?: number;

	@property({
		type: "string",
		defaultValue: ""
	})
	chartTitle!: string;

	@property({
		type: "string",
		defaultValue: ""
	})
	chartDescription!: string;

	@property({
		type: "string",
		defaultValue: ""
	})
	calendarPattern!: string;

	@event()
	onTitlePressed!: Function;

	@aggregation({
		type: "sap.ui.core.Control",
		multiple: false,
		isDefault: true
	})
	microChart!: Control;

	@aggregation({
		type: "sap.m.Label",
		multiple: false
	})
	_uomLabel!: Label;

	@aggregation({
		type: "sap.ui.core.Control",
		multiple: true
	})
	microChartTitle!: Control[];

	private _olistBinding?: ODataV4ListBinding;

	private _oDateType?: DateType;

	constructor(
		id?: string | undefined | (PropertiesOf<MicroChartContainer> & $ControlSettings),
		settings?: $ControlSettings & PropertiesOf<MicroChartContainer>
	) {
		super(id as string, settings);
	}

	static render(renderManager: RenderManager, control: MicroChartContainer): void {
		renderManager.openStart("div", control);
		renderManager.openEnd();
		if (!control.showOnlyChart) {
			const chartTitle = control.microChartTitle;
			if (chartTitle) {
				chartTitle.forEach(function (subChartTitle) {
					renderManager.openStart("div");
					renderManager.openEnd();
					renderManager.renderControl(subChartTitle);
					renderManager.close("div");
				});
			}
			renderManager.openStart("div");
			renderManager.openEnd();
			const chartDescription = new Label({ text: control.chartDescription });
			renderManager.renderControl(chartDescription);
			renderManager.close("div");
		}
		const microChart = control.microChart;
		if (microChart) {
			microChart.addStyleClass("sapUiTinyMarginTopBottom");
			renderManager.renderControl(microChart);
			if (!control.showOnlyChart && control.uomPath) {
				const settings = control._checkIfChartRequiresRuntimeLabels() ? undefined : { text: { path: control.uomPath } },
					label = new Label(settings),
					flexBox = new FlexBox({
						alignItems: "Start",
						justifyContent: "End",
						items: [label]
					});
				renderManager.renderControl(flexBox);
				control.setAggregation("_uomLabel", label);
			}
		}
		renderManager.close("div");
	}

	onBeforeRendering(): void {
		const binding = this._getListBindingForRuntimeLabels();

		if (binding) {
			binding.detachEvent("change", this._setRuntimeChartLabelsAndUnitOfMeasure, this);
			this._olistBinding = undefined;
		}
	}

	onAfterRendering(): void {
		const binding = this._getListBindingForRuntimeLabels();

		if (!this._checkIfChartRequiresRuntimeLabels()) {
			return;
		}

		if (binding) {
			binding.attachEvent("change", undefined, this._setRuntimeChartLabelsAndUnitOfMeasure, this);
			this._olistBinding = binding;
		}
	}

	setShowOnlyChart(value: boolean): void {
		if (!value && this._olistBinding) {
			this._setChartLabels();
		}
		this.setProperty("showOnlyChart", value, false /*re-rendering*/);
	}

	_checkIfChartRequiresRuntimeLabels(): boolean {
		const microChart = this.microChart;
		if (microChart) {
			return Boolean(
				microChart.isA<AreaMicroChart>("sap.suite.ui.microchart.AreaMicroChart") ||
					microChart.isA<ColumnMicroChart>("sap.suite.ui.microchart.ColumnMicroChart") ||
					microChart.isA<LineMicroChart>("sap.suite.ui.microchart.LineMicroChart") ||
					microChart.isA<ComparisonMicroChart>("sap.suite.ui.microchart.ComparisonMicroChart")
			);
		}
		return false;
	}

	_checkForChartLabelAggregations(): boolean {
		const microChart = this.microChart;
		if (microChart) {
			return Boolean(
				(microChart.isA<AreaMicroChart>("sap.suite.ui.microchart.AreaMicroChart") &&
					microChart.getAggregation("firstYLabel") &&
					microChart.getAggregation("lastYLabel") &&
					microChart.getAggregation("firstXLabel") &&
					microChart.getAggregation("lastXLabel")) ||
					(microChart.isA<ColumnMicroChart>("sap.suite.ui.microchart.ColumnMicroChart") &&
						microChart.getAggregation("leftTopLabel") &&
						microChart.getAggregation("rightTopLabel") &&
						microChart.getAggregation("leftBottomLabel") &&
						microChart.getAggregation("rightBottomLabel")) ||
					microChart.isA<LineMicroChart>("sap.suite.ui.microchart.LineMicroChart")
			);
		}
		return false;
	}

	_getListBindingForRuntimeLabels(): ODataV4ListBinding | false {
		const microChart = this.microChart;
		let binding;
		if (microChart) {
			if (microChart.isA<AreaMicroChart>("sap.suite.ui.microchart.AreaMicroChart")) {
				const chart = microChart.getChart();
				binding = chart && chart.getBinding("points");
			} else if (microChart.isA<ColumnMicroChart>("sap.suite.ui.microchart.ColumnMicroChart")) {
				binding = microChart.getBinding("columns");
			} else if (microChart.isA<LineMicroChart>("sap.suite.ui.microchart.LineMicroChart")) {
				const lines = microChart.getLines();
				binding = lines && lines.length && lines[0].getBinding("points");
			} else if (microChart.isA<ComparisonMicroChart>("sap.suite.ui.microchart.ComparisonMicroChart")) {
				binding = microChart.getBinding("data");
			}
		}

		return binding instanceof ODataV4ListBinding ? binding : false;
	}

	async _setRuntimeChartLabelsAndUnitOfMeasure(): Promise<void> {
		const listBinding = this._olistBinding,
			contexts = listBinding?.getContexts(),
			measures = this.measures,
			dimension = this.dimension,
			unitOfMeasurePath = this.uomPath,
			microChart = this.microChart,
			unitOfMeasureLabel = this._uomLabel;

		if (unitOfMeasureLabel && unitOfMeasurePath && contexts && contexts.length && !this.showOnlyChart) {
			unitOfMeasureLabel.setText(contexts[0].getObject(unitOfMeasurePath));
		} else if (unitOfMeasureLabel) {
			unitOfMeasureLabel.setText("");
		}

		if (!this._checkForChartLabelAggregations()) {
			return;
		}

		if (!contexts || !contexts.length) {
			this._setChartLabels();
			return;
		}

		const firstContext = contexts[0],
			lastContext = contexts[contexts.length - 1],
			linesPomises: Promise<mobilelibrary.ValueColor>[] = [],
			lineChart = microChart?.isA<LineMicroChart>("sap.suite.ui.microchart.LineMicroChart"),
			currentMinX = firstContext.getObject(dimension),
			currentMaxX = lastContext.getObject(dimension);
		let currentMinY,
			currentMaxY,
			minX: DataPointValueType = { value: Infinity },
			maxX: DataPointValueType = { value: -Infinity },
			minY: DataPointValueType = { value: Infinity },
			maxY: DataPointValueType = { value: -Infinity };

		minX = currentMinX == undefined ? minX : { context: firstContext, value: currentMinX };
		maxX = currentMaxX == undefined ? maxX : { context: lastContext, value: currentMaxX };

		if (measures?.length) {
			measures.forEach((measure: string, i: number) => {
				currentMinY = firstContext.getObject(measure);
				currentMaxY = lastContext.getObject(measure);
				maxY = currentMaxY > maxY.value ? { context: lastContext, value: currentMaxY, index: lineChart ? i : 0 } : maxY;
				minY = currentMinY < minY.value ? { context: firstContext, value: currentMinY, index: lineChart ? i : 0 } : minY;
				if (lineChart) {
					linesPomises.push(this._getCriticalityFromPoint({ context: lastContext, value: currentMaxY, index: i }));
				}
			});
		}
		this._setChartLabels(minY.value, maxY.value, minX.value, maxX.value);
		if (lineChart) {
			const colors = await Promise.all(linesPomises);
			if (colors?.length) {
				const lines = microChart.getLines();
				lines.forEach(function (line: LineMicroChartLine, i: number) {
					line.setColor(colors[i]);
				});
			}
		} else {
			await this._setChartLabelsColors(maxY, minY);
		}
	}

	async _setChartLabelsColors(maxY: DataPointValueType, minY: DataPointValueType): Promise<void> {
		const microChart = this.microChart;

		const criticality = await Promise.all([this._getCriticalityFromPoint(minY), this._getCriticalityFromPoint(maxY)]);

		if (microChart?.isA<AreaMicroChart>("sap.suite.ui.microchart.AreaMicroChart")) {
			(microChart.getAggregation("firstYLabel") as ManagedObject).setProperty("color", criticality[0], true);
			(microChart.getAggregation("lastYLabel") as ManagedObject).setProperty("color", criticality[1], true);
		} else if (microChart?.isA<ColumnMicroChart>("sap.suite.ui.microchart.ColumnMicroChart")) {
			(microChart.getAggregation("leftTopLabel") as ManagedObject).setProperty("color", criticality[0], true);
			(microChart.getAggregation("rightTopLabel") as ManagedObject).setProperty("color", criticality[1], true);
		}
	}

	_setChartLabels(leftTop?: number, rightTop?: number, leftBottom?: number, rightBottom?: number): void {
		const microChart = this.microChart;

		leftTop = this._formatDateAndNumberValue(leftTop, this.measurePrecision, this.measureScale) as number | undefined;
		rightTop = this._formatDateAndNumberValue(rightTop, this.measurePrecision, this.measureScale) as number | undefined;
		leftBottom = this._formatDateAndNumberValue(leftBottom, this.dimensionPrecision, undefined, this.calendarPattern) as
			| number
			| undefined;
		rightBottom = this._formatDateAndNumberValue(rightBottom, this.dimensionPrecision, undefined, this.calendarPattern) as
			| number
			| undefined;

		if (microChart?.isA<AreaMicroChart>("sap.suite.ui.microchart.AreaMicroChart")) {
			(microChart.getAggregation("firstYLabel") as ManagedObject).setProperty("label", leftTop, false);
			(microChart.getAggregation("lastYLabel") as ManagedObject).setProperty("label", rightTop, false);
			(microChart.getAggregation("firstXLabel") as ManagedObject).setProperty("label", leftBottom, false);
			(microChart.getAggregation("lastXLabel") as ManagedObject).setProperty("label", rightBottom, false);
		} else if (microChart?.isA<ColumnMicroChart>("sap.suite.ui.microchart.ColumnMicroChart")) {
			(microChart.getAggregation("leftTopLabel") as ManagedObject).setProperty("label", leftTop, false);
			(microChart.getAggregation("rightTopLabel") as ManagedObject).setProperty("label", rightTop, false);
			(microChart.getAggregation("leftBottomLabel") as ManagedObject).setProperty("label", leftBottom, false);
			(microChart.getAggregation("rightBottomLabel") as ManagedObject).setProperty("label", rightBottom, false);
		} else if (microChart?.isA<LineMicroChart>("sap.suite.ui.microchart.LineMicroChart")) {
			microChart.setProperty("leftTopLabel", leftTop, false);
			microChart.setProperty("rightTopLabel", rightTop, false);
			microChart.setProperty("leftBottomLabel", leftBottom, false);
			microChart.setProperty("rightBottomLabel", rightBottom, false);
		}
	}

	async _getCriticalityFromPoint(point: DataPointValueType): Promise<mobilelibrary.ValueColor> {
		if (point?.context) {
			const metaModel = this.getModel() && (this.getModel() as ODataModel).getMetaModel(),
				dataPointQualifiers = this.dataPointQualifiers,
				metaPath = metaModel instanceof ODataMetaModel && point.context.getPath() && metaModel.getMetaPath(point.context.getPath());
			if (metaModel && typeof metaPath === "string") {
				const dataPoint = await metaModel.requestObject(
					`${metaPath}/@${UIAnnotationTerms.DataPoint}${
						point.index !== undefined && dataPointQualifiers[point.index] ? `#${dataPointQualifiers[point.index]}` : ""
					}`
				);
				if (dataPoint) {
					let criticality = ValueColor.Neutral;
					const context = point.context;

					if (dataPoint.Criticality) {
						criticality = this._criticality(dataPoint.Criticality, context);
					} else if (dataPoint.CriticalityCalculation) {
						const criticalityCalculation = dataPoint.CriticalityCalculation;
						const getValue = function (valueProperty: { $Path?: string; $Decimal?: number }): number {
							let valueResponse;
							if (valueProperty?.$Path) {
								valueResponse = context.getObject(valueProperty.$Path);
							} else if (valueProperty?.hasOwnProperty("$Decimal")) {
								valueResponse = valueProperty.$Decimal;
							}
							return valueResponse;
						};

						criticality = this._criticalityCalculation(
							criticalityCalculation.ImprovementDirection.$EnumMember,
							point.value,
							getValue(criticalityCalculation.DeviationRangeLowValue),
							getValue(criticalityCalculation.ToleranceRangeLowValue),
							getValue(criticalityCalculation.AcceptanceRangeLowValue),
							getValue(criticalityCalculation.AcceptanceRangeHighValue),
							getValue(criticalityCalculation.ToleranceRangeHighValue),
							getValue(criticalityCalculation.DeviationRangeHighValue)
						);
					}

					return criticality;
				}
			}
		}

		return Promise.resolve(ValueColor.Neutral);
	}

	_criticality(criticality: { $Path?: string; $EnumMember?: string }, context: Context): mobilelibrary.ValueColor {
		let criticalityValue, result;
		if (criticality.$Path) {
			criticalityValue = context.getObject(criticality.$Path);
			if (criticalityValue === "Negative" || criticalityValue.toString() === "1") {
				result = ValueColor.Error;
			} else if (criticalityValue === "Critical" || criticalityValue.toString() === "2") {
				result = ValueColor.Critical;
			} else if (criticalityValue === "Positive" || criticalityValue.toString() === "3") {
				result = ValueColor.Good;
			}
		} else if (criticality.$EnumMember) {
			criticalityValue = criticality.$EnumMember;
			if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Negative")) {
				result = ValueColor.Error;
			} else if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Positive")) {
				result = ValueColor.Good;
			} else if (criticalityValue.includes("com.sap.vocabularies.UI.v1.CriticalityType/Critical")) {
				result = ValueColor.Critical;
			}
		}
		if (result === undefined) {
			Log.warning("Case not supported, returning the default Value Neutral");
			return ValueColor.Neutral;
		}
		return result;
	}

	_criticalityCalculation(
		improvementDirection: string,
		value: number,
		deviationLow?: number,
		toleranceLow?: number,
		acceptanceLow?: number,
		acceptanceHigh?: number,
		toleranceHigh?: number,
		deviationHigh?: number
	): mobilelibrary.ValueColor {
		let result;

		// Dealing with Decimal and Path based bingdings
		deviationLow = deviationLow == undefined ? -Infinity : deviationLow;
		toleranceLow = toleranceLow == undefined ? deviationLow : toleranceLow;
		acceptanceLow = acceptanceLow == undefined ? toleranceLow : acceptanceLow;
		deviationHigh = deviationHigh == undefined ? Infinity : deviationHigh;
		toleranceHigh = toleranceHigh == undefined ? deviationHigh : toleranceHigh;
		acceptanceHigh = acceptanceHigh == undefined ? toleranceHigh : acceptanceHigh;

		// Creating runtime expression binding from criticality calculation for Criticality State
		if (improvementDirection.includes("Minimize")) {
			if (value <= acceptanceHigh) {
				result = ValueColor.Good;
			} else if (value <= toleranceHigh) {
				result = ValueColor.Neutral;
			} else if (value <= deviationHigh) {
				result = ValueColor.Critical;
			} else {
				result = ValueColor.Error;
			}
		} else if (improvementDirection.includes("Maximize")) {
			if (value >= acceptanceLow) {
				result = ValueColor.Good;
			} else if (value >= toleranceLow) {
				result = ValueColor.Neutral;
			} else if (value >= deviationLow) {
				result = ValueColor.Critical;
			} else {
				result = ValueColor.Error;
			}
		} else if (improvementDirection.includes("Target")) {
			if (value <= acceptanceHigh && value >= acceptanceLow) {
				result = ValueColor.Good;
			} else if ((value >= toleranceLow && value < acceptanceLow) || (value > acceptanceHigh && value <= toleranceHigh)) {
				result = ValueColor.Neutral;
			} else if ((value >= deviationLow && value < toleranceLow) || (value > toleranceHigh && value <= deviationHigh)) {
				result = ValueColor.Critical;
			} else {
				result = ValueColor.Error;
			}
		}

		if (result === undefined) {
			Log.warning("Case not supported, returning the default Value Neutral");
			return ValueColor.Neutral;
		}

		return result;
	}

	_formatDateAndNumberValue(value?: number | string, precision?: number, scale?: number, pattern?: string): string | number | undefined {
		if (pattern) {
			return this._getSemanticsValueFormatter(pattern).formatValue(value, "string");
		} else if (!isNaN(value as number)) {
			return this._getLabelNumberFormatter(precision, scale).format(value as number);
		}

		return value;
	}

	_getSemanticsValueFormatter(pattern: string): DateType {
		if (!this._oDateType) {
			this._oDateType = new DateType({
				style: "short",
				source: {
					pattern
				}
			} as unknown as { source: object });
		}

		return this._oDateType;
	}

	_getLabelNumberFormatter(precision?: number, scale?: number): NumberFormat {
		return NumberFormat.getFloatInstance({
			style: "short",
			showScale: true,
			precision: (typeof precision === "number" && precision) || 0,
			decimals: (typeof scale === "number" && scale) || 0
		});
	}

	getAccessibilityInfo(): AccessibilityInfo {
		return this.microChart?.getAccessibilityInfo();
	}
}

export default MicroChartContainer;
