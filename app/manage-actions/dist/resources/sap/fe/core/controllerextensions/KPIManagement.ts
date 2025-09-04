import Log from "sap/base/Log";
import Localization from "sap/base/i18n/Localization";
import { defineUI5Class, methodOverride } from "sap/fe/base/ClassSupport";
import type BaseController from "sap/fe/core/BaseController";
import type PageController from "sap/fe/core/PageController";
import type {
	AnalyticalKPIDefinition,
	KPIChartDefinition,
	KPIDefinition,
	NavigationInfo
} from "sap/fe/core/converters/controls/Common/KPI";
import type { FilterDefinition, RangeDefinition } from "sap/fe/core/converters/helpers/SelectionVariantHelper";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import type { IShellServices } from "sap/fe/core/services/ShellServicesFactory";
import type GenericTag from "sap/m/GenericTag";
import Popover from "sap/m/Popover";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import Locale from "sap/ui/core/Locale";
import DateFormat from "sap/ui/core/format/DateFormat";
import NumberFormat from "sap/ui/core/format/NumberFormat";
import MessageType from "sap/ui/core/message/MessageType";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import type HostType from "sap/ui/integration/Host";
import type { Host$ActionEvent } from "sap/ui/integration/Host";
import type { default as Card, CardManifest, default as CardType, ChartCardContent } from "sap/ui/integration/widgets/Card";
import Filter from "sap/ui/model/Filter";
import type FilterOperator from "sap/ui/model/FilterOperator";
import Sorter from "sap/ui/model/Sorter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

const MessageTypeFromCriticality: Record<string, MessageType> = {
	"1": MessageType.Error,
	"2": MessageType.Warning,
	"3": MessageType.Success,
	"5": MessageType.Information
};

const ValueColorFromMessageType: Record<MessageType, string> = {
	Error: "Error",
	Warning: "Critical",
	Success: "Good",
	Information: "None",
	None: "None"
};

/**
 * Function to get a message state from a calculated criticality of type 'Target'.
 * @param kpiValue The value of the KPI to be tested against.
 * @param aThresholds Thresholds to be used [DeviationRangeLowValue,ToleranceRangeLowValue,AcceptanceRangeLowValue,AcceptanceRangeHighValue,ToleranceRangeHighValue,DeviationRangeHighValue].
 * @returns The corresponding MessageType
 */
function messageTypeFromTargetCalculation(kpiValue: number, aThresholds: (number | undefined | null)[]): MessageType {
	let criticalityProperty: MessageType;

	if (aThresholds[0] !== undefined && aThresholds[0] !== null && kpiValue < aThresholds[0]) {
		criticalityProperty = MessageType.Error;
	} else if (aThresholds[1] !== undefined && aThresholds[1] !== null && kpiValue < aThresholds[1]) {
		criticalityProperty = MessageType.Warning;
	} else if (aThresholds[2] !== undefined && aThresholds[2] !== null && kpiValue < aThresholds[2]) {
		criticalityProperty = MessageType.None;
	} else if (aThresholds[5] !== undefined && aThresholds[5] !== null && kpiValue > aThresholds[5]) {
		criticalityProperty = MessageType.Error;
	} else if (aThresholds[4] !== undefined && aThresholds[4] !== null && kpiValue > aThresholds[4]) {
		criticalityProperty = MessageType.Warning;
	} else if (aThresholds[3] !== undefined && aThresholds[3] !== null && kpiValue > aThresholds[3]) {
		criticalityProperty = MessageType.None;
	} else {
		criticalityProperty = MessageType.Success;
	}

	return criticalityProperty;
}

/**
 * Function to get a message state from a calculated criticality of type 'Minimize'.
 * @param kpiValue The value of the KPI to be tested against.
 * @param aThresholds Thresholds to be used [AcceptanceRangeHighValue,ToleranceRangeHighValue,DeviationRangeHighValue].
 * @returns The corresponding MessageType
 */
function messageTypeFromMinimizeCalculation(kpiValue: number, aThresholds: (number | undefined | null)[]): MessageType {
	let criticalityProperty: MessageType;

	if (aThresholds[2] !== undefined && aThresholds[2] !== null && kpiValue > aThresholds[2]) {
		criticalityProperty = MessageType.Error;
	} else if (aThresholds[1] !== undefined && aThresholds[1] !== null && kpiValue > aThresholds[1]) {
		criticalityProperty = MessageType.Warning;
	} else if (aThresholds[0] !== undefined && aThresholds[0] !== null && kpiValue > aThresholds[0]) {
		criticalityProperty = MessageType.None;
	} else {
		criticalityProperty = MessageType.Success;
	}

	return criticalityProperty;
}

/**
 * Function to get a message state from a calculated criticality of type 'Maximize'.
 * @param kpiValue The value of the KPI to be tested against.
 * @param aThresholds Thresholds to be used [DeviationRangeLowValue,ToleranceRangeLowValue,AcceptanceRangeLowValue].
 * @returns The corresponding MessageType
 */
function messageTypeFromMaximizeCalculation(kpiValue: number, aThresholds: (number | undefined | null)[]): MessageType {
	let criticalityProperty: MessageType;

	if (aThresholds[0] !== undefined && aThresholds[0] !== null && kpiValue < aThresholds[0]) {
		criticalityProperty = MessageType.Error;
	} else if (aThresholds[1] !== undefined && aThresholds[1] !== null && kpiValue < aThresholds[1]) {
		criticalityProperty = MessageType.Warning;
	} else if (aThresholds[2] !== undefined && aThresholds[2] !== null && kpiValue < aThresholds[2]) {
		criticalityProperty = MessageType.None;
	} else {
		criticalityProperty = MessageType.Success;
	}

	return criticalityProperty;
}

/**
 * Function to calculate a DeviationIndicator value from a trend value.
 * @param trendValue The criticality values.
 * @returns The corresponding DeviationIndicator value
 */
function deviationIndicatorFromTrendType(trendValue: number | string): string {
	let deviationIndicator: string;

	switch (trendValue) {
		case 1: // StrongUp
		case "1":
		case 2: // Up
		case "2":
			deviationIndicator = "Up";
			break;

		case 4: // Down
		case "4":
		case 5: // StrongDown
		case "5":
			deviationIndicator = "Down";
			break;

		default:
			deviationIndicator = "None";
	}

	return deviationIndicator;
}

/**
 * Function to calculate a DeviationIndicator from a TrendCalculation.
 * @param kpiValue The value of the KPI
 * @param referenceValue The reference value to compare with
 * @param isRelative True is the comparison is relative
 * @param aThresholds Array of thresholds [StrongDownDifference, DownDifference, UpDifference, StrongUpDifference]
 * @returns The corresponding DeviationIndicator value
 */
function deviationIndicatorFromCalculation(
	kpiValue: number,
	referenceValue: number,
	isRelative: boolean,
	aThresholds: (number | undefined | null)[] | undefined
): string {
	let deviationIndicator: string;

	if (!aThresholds || (isRelative && !referenceValue)) {
		return "None";
	}

	const compValue = isRelative ? (kpiValue - referenceValue) / referenceValue : kpiValue - referenceValue;

	if (aThresholds[0] !== undefined && aThresholds[0] !== null && compValue <= aThresholds[0]) {
		// StrongDown --> Down
		deviationIndicator = "Down";
	} else if (aThresholds[1] !== undefined && aThresholds[1] !== null && compValue <= aThresholds[1]) {
		// Down --> Down
		deviationIndicator = "Down";
	} else if (aThresholds[3] !== undefined && aThresholds[3] !== null && compValue >= aThresholds[3]) {
		// StrongUp --> Up
		deviationIndicator = "Up";
	} else if (aThresholds[2] !== undefined && aThresholds[2] !== null && compValue >= aThresholds[2]) {
		// Up --> Up
		deviationIndicator = "Up";
	} else {
		// Sideways --> None
		deviationIndicator = "None";
	}

	return deviationIndicator;
}

/**
 * Creates a sap.ui.model.Filter from a filter definition.
 * @param filterDefinition The filter definition
 * @returns Returns a sap.ui.model.Filter from the definition, or undefined if the definition is empty (no ranges)
 */
function createFilterFromDefinition(filterDefinition: FilterDefinition): Filter | undefined {
	if (filterDefinition.ranges.length === 0) {
		return undefined;
	} else if (filterDefinition.ranges.length === 1) {
		return new Filter(
			filterDefinition.propertyPath,
			filterDefinition.ranges[0].operator as FilterOperator,
			filterDefinition.ranges[0].rangeLow,
			filterDefinition.ranges[0].rangeHigh
		);
	} else {
		const aRangeFilters = filterDefinition.ranges.map((range) => {
			return new Filter(filterDefinition.propertyPath, range.operator as FilterOperator, range.rangeLow, range.rangeHigh);
		});
		return new Filter({
			filters: aRangeFilters,
			and: false
		});
	}
}

function getFilterStringFromDefinition(filterDefinition: FilterDefinition): string {
	const currentLocale = new Locale(Localization.getLanguage());
	const resBundle = Library.getResourceBundleFor("sap.fe.core")!;
	const dateFormat = DateFormat.getDateInstance({ style: "medium" }, currentLocale);

	function formatRange(range: RangeDefinition): string {
		const valueLow =
			filterDefinition.propertyType.indexOf("Edm.Date") === 0
				? dateFormat.format(new Date(range.rangeLow))
				: (range.rangeLow as string);
		const valueHigh =
			filterDefinition.propertyType.indexOf("Edm.Date") === 0 && range.rangeHigh !== undefined
				? dateFormat.format(new Date(range.rangeHigh))
				: range.rangeHigh;

		switch (range.operator) {
			case "BT":
				return `[${valueLow} - ${valueHigh}]`;

			case "Contains":
				return `*${valueLow}*`;

			case "GE":
				return `\u2265${valueLow}`;

			case "GT":
				return `>${valueLow}`;

			case "LE":
				return `\u2264${valueLow}`;

			case "LT":
				return `<${valueLow}`;

			case "NB":
				return resBundle.getText("C_KPICARD_FILTERSTRING_NOT", [`[${valueLow} - ${valueHigh}]`]);

			case "NE":
				return `\u2260${valueLow}`;

			case "NotContains":
				return resBundle.getText("C_KPICARD_FILTERSTRING_NOT", [`*${valueLow}*`]);

			case "EQ":
			default:
				return valueLow;
		}
	}
	if (filterDefinition.ranges.length === 0) {
		return "";
	} else if (filterDefinition.ranges.length === 1) {
		return formatRange(filterDefinition.ranges[0]);
	} else {
		return `(${filterDefinition.ranges.map(formatRange).join(",")})`;
	}
}

function formatChartTitle(kpiDef: AnalyticalKPIDefinition): string {
	const resBundle = Library.getResourceBundleFor("sap.fe.core")!;

	function formatList(items: { name: string; label: string }[]): string {
		if (items.length === 0) {
			return "";
		} else if (items.length === 1) {
			return items[0].label;
		} else {
			let res = items[0].label;
			for (let I = 1; I < items.length - 1; I++) {
				res += `, ${items[I].label}`;
			}

			return resBundle.getText("C_KPICARD_ITEMSLIST", [res, items[items.length - 1].label]);
		}
	}

	// If the chart has a title, use it. Otherwise, create a title from the dimensions and measures
	return (
		kpiDef.chart.title ??
		resBundle.getText("C_KPICARD_CHARTTITLE", [formatList(kpiDef.chart.measures), formatList(kpiDef.chart.dimensions)])
	);
}

function updateChartLabelSettings(
	chartDefinition: KPIChartDefinition,
	oChartProperties: {
		categoryAxis: { title: { visible: boolean } };
		sizeLegend: { visible: boolean };
		legendGroup: { layout: { position: string; alignment: string } };
		valueAxis: {
			title: { visible: boolean };
			label: {
				formatString: string;
			};
		};
		valueAxis2: {
			title: { visible: boolean };
			label: {
				formatString: string;
			};
		};
		plotArea: {
			dataLabel: {};
		};
	}
): void {
	switch (chartDefinition.chartType) {
		case "Donut":
			// Show data labels, do not show axis titles
			oChartProperties.categoryAxis = {
				title: {
					visible: false
				}
			};
			oChartProperties.valueAxis = {
				title: {
					visible: false
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.plotArea.dataLabel = {
				visible: true,
				type: "value",
				formatString: "ShortFloat_MFD2"
			};
			break;

		case "bubble":
			// Show axis title, bubble size legend, do not show data labels
			oChartProperties.valueAxis = {
				title: {
					visible: true
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.valueAxis2 = {
				title: {
					visible: true
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.legendGroup = {
				layout: {
					position: "bottom",
					alignment: "topLeft"
				}
			};
			oChartProperties.sizeLegend = {
				visible: true
			};
			oChartProperties.plotArea.dataLabel = { visible: false };
			break;

		case "scatter":
			// Do not show data labels and axis titles
			oChartProperties.valueAxis = {
				title: {
					visible: false
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.valueAxis2 = {
				title: {
					visible: false
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.plotArea.dataLabel = { visible: false };
			break;

		default:
			// Do not show data labels and axis titles
			oChartProperties.categoryAxis = {
				title: {
					visible: false
				}
			};
			oChartProperties.valueAxis = {
				title: {
					visible: false
				},
				label: {
					formatString: "ShortFloat"
				}
			};
			oChartProperties.plotArea.dataLabel = { visible: false };
	}
}
function filterMap(aObjects: { name: string; label: string; role?: string }[], aRoles?: (string | undefined)[]): string[] {
	if (aRoles && aRoles.length) {
		return aObjects
			.filter((dimension) => {
				return aRoles.includes(dimension.role);
			})
			.map((dimension) => {
				return dimension.label;
			});
	} else {
		return aObjects.map((dimension) => {
			return dimension.label;
		});
	}
}

function getScatterBubbleChartFeeds(chartDefinition: KPIChartDefinition): { uid: string; type: string; values: string[] }[] {
	const axis1Measures = filterMap(chartDefinition.measures, ["Axis1"]);
	const axis2Measures = filterMap(chartDefinition.measures, ["Axis2"]);
	const axis3Measures = filterMap(chartDefinition.measures, ["Axis3"]);
	const otherMeasures = filterMap(chartDefinition.measures, [undefined]);
	const seriesDimensions = filterMap(chartDefinition.dimensions, ["Series"]);

	// Get the first dimension with role "Category" for the shape
	const shapeDimension = chartDefinition.dimensions.find((dimension) => {
		return dimension.role === "Category";
	});

	// Measure for the x-Axis : first measure for Axis1, or for Axis2 if not found, or for Axis3 if not found
	const xMeasure = axis1Measures.shift() || axis2Measures.shift() || axis3Measures.shift() || otherMeasures.shift() || "";
	// Measure for the y-Axis : first measure for Axis2, or second measure for Axis1 if not found, or first measure for Axis3 if not found
	const yMeasure = axis2Measures.shift() || axis1Measures.shift() || axis3Measures.shift() || otherMeasures.shift() || "";
	const res = [
		{
			uid: "valueAxis",
			type: "Measure",
			values: [xMeasure]
		},
		{
			uid: "valueAxis2",
			type: "Measure",
			values: [yMeasure]
		}
	];

	if (chartDefinition.chartType === "bubble") {
		// Measure for the size of the bubble: first measure for Axis3, or remaining measure for Axis1/Axis2 if not found
		const sizeMeasure = axis3Measures.shift() || axis1Measures.shift() || axis2Measures.shift() || otherMeasures.shift() || "";
		res.push({
			uid: "bubbleWidth",
			type: "Measure",
			values: [sizeMeasure]
		});
	}

	// Color (optional)
	if (seriesDimensions.length) {
		res.push({
			uid: "color",
			type: "Dimension",
			values: seriesDimensions
		});
	}
	// Shape (optional)
	if (shapeDimension) {
		res.push({
			uid: "shape",
			type: "Dimension",
			values: [shapeDimension.label]
		});
	}
	return res;
}

function getChartFeeds(chartDefinition: KPIChartDefinition): { uid: string; type: string; values: string[] }[] {
	let res: { uid: string; type: string; values: string[] }[];

	switch (chartDefinition.chartType) {
		case "Donut":
			res = [
				{
					uid: "size",
					type: "Measure",
					values: filterMap(chartDefinition.measures)
				},
				{
					uid: "color",
					type: "Dimension",
					values: filterMap(chartDefinition.dimensions)
				}
			];
			break;

		case "bubble":
		case "scatter":
			res = getScatterBubbleChartFeeds(chartDefinition);
			break;

		case "vertical_bullet":
			res = [
				{
					uid: "actualValues",
					type: "Measure",
					values: filterMap(chartDefinition.measures, [undefined, "Axis1"])
				},
				{
					uid: "targetValues",
					type: "Measure",
					values: filterMap(chartDefinition.measures, ["Axis2"])
				},
				{
					uid: "categoryAxis",
					type: "Dimension",
					values: filterMap(chartDefinition.dimensions, [undefined, "Category"])
				},
				{
					uid: "color",
					type: "Dimension",
					values: filterMap(chartDefinition.dimensions, ["Series"])
				}
			];
			break;

		default:
			res = [
				{
					uid: "valueAxis",
					type: "Measure",
					values: filterMap(chartDefinition.measures)
				},
				{
					uid: "categoryAxis",
					type: "Dimension",
					values: filterMap(chartDefinition.dimensions, [undefined, "Category"])
				},
				{
					uid: "color",
					type: "Dimension",
					values: filterMap(chartDefinition.dimensions, ["Series"])
				}
			];
	}

	return res;
}

async function getNavigationParameters(
	navInfo: NavigationInfo,
	oShellService: IShellServices
): Promise<{ semanticObject?: string; action?: string; outbound?: string } | undefined> {
	if (navInfo.semanticObject) {
		if (navInfo.action) {
			// Action is already specified: check if it's available in the shell
			return oShellService.getLinks([{ semanticObject: navInfo.semanticObject, action: navInfo.action }]).then((aLinks) => {
				return aLinks.length && aLinks[0].length ? { semanticObject: navInfo.semanticObject, action: navInfo.action } : undefined;
			});
		} else {
			// We get the primary intent from the shell
			return oShellService.getPrimaryIntent(navInfo.semanticObject).then((oLink) => {
				if (!oLink) {
					// No primary intent...
					return undefined;
				}

				// Check that the primary intent is not part of the unavailable actions
				const oInfo = oShellService.parseShellHash(oLink.intent);
				return navInfo.unavailableActions && navInfo.unavailableActions.includes(oInfo.action)
					? undefined
					: { semanticObject: oInfo.semanticObject, action: oInfo.action };
			});
		}
	} else {
		// Outbound navigation specified in the manifest
		return navInfo.outboundNavigation ? Promise.resolve({ outbound: navInfo.outboundNavigation }) : Promise.resolve(undefined);
	}
}

/**
 * A controller extension for managing the KPIs in an analytical list page.
 * @hideconstructor
 * @since 1.93.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.KPIManagement")
class KPIManagementControllerExtension extends ControllerExtension {
	private base!: PageController;

	protected aKPIDefinitions?: KPIDefinition[];

	protected oCard!: Card;

	protected oPopover!: Popover;

	constructor() {
		super();
	}

	/**
	 * Creates the card manifest for a KPI definition and stores it in a JSON model.
	 * @param kpiDefinition The KPI definition
	 * @param oKPIModel The JSON model in which the manifest will be stored
	 */
	protected initCardManifest(kpiDefinition: AnalyticalKPIDefinition, oKPIModel: JSONModel): void {
		const oCardManifest: CardManifest<Partial<ChartCardContent>> = {
			"sap.app": {
				id: "sap.fe.KPICard",
				type: "card"
			},
			"sap.ui": {
				technology: "UI5"
			},
			"sap.card": {
				type: "Analytical",
				data: {
					json: {}
				},
				header: {
					type: "Numeric",
					title: kpiDefinition.datapoint.title,
					subTitle: kpiDefinition.datapoint.description,
					unitOfMeasurement: "{mainUnit}",
					mainIndicator: {
						number: "{mainValueNoScale}",
						unit: "{mainValueScale}",
						state: "{mainState}",
						trend: "{trend}"
					}
				},
				content: {
					minHeight: "25rem",
					chartProperties: {
						plotArea: {},
						title: {
							visible: true,
							alignment: "left"
						}
					},
					data: {
						path: "/chartData"
					}
				}
			}
		};

		// Add side indicators in the card header if a target is defined for the KPI
		if (kpiDefinition.datapoint.targetPath || kpiDefinition.datapoint.targetValue !== undefined) {
			const resBundle = Library.getResourceBundleFor("sap.fe.core")!;
			oCardManifest["sap.card"].header.sideIndicators = [
				{
					title: resBundle.getText("C_KPICARD_INDICATOR_TARGET"),
					number: "{targetNumber}",
					unit: "{targetUnit}"
				},
				{
					title: resBundle.getText("C_KPICARD_INDICATOR_DEVIATION"),
					number: "{deviationNumber}",
					unit: "%"
				}
			];
		}

		// Details of the card: filter descriptions
		if (kpiDefinition.selectionVariantFilterDefinitions?.length) {
			const aDescriptions: string[] = [];
			kpiDefinition.selectionVariantFilterDefinitions.forEach((filterDefinition) => {
				const desc = getFilterStringFromDefinition(filterDefinition);
				if (desc) {
					aDescriptions.push(desc);
				}
			});

			if (aDescriptions.length) {
				oCardManifest["sap.card"].header.details = aDescriptions.join(", ");
			}
		}

		// Chart settings: type, title, dimensions and measures in the manifest
		oCardManifest["sap.card"].content.chartType = kpiDefinition.chart.chartType;
		updateChartLabelSettings(kpiDefinition.chart, oCardManifest["sap.card"].content.chartProperties);
		oCardManifest["sap.card"].content.chartProperties.title.text = formatChartTitle(kpiDefinition);
		oCardManifest["sap.card"].content.dimensions = kpiDefinition.chart.dimensions.map((dimension) => {
			return { label: dimension.label, value: `{${dimension.name}}` };
		});
		oCardManifest["sap.card"].content.measures = kpiDefinition.chart.measures.map((measure) => {
			return { label: measure.label, value: `{${measure.name}}` };
		});
		oCardManifest["sap.card"].content.feeds = getChartFeeds(kpiDefinition.chart);

		oKPIModel.setProperty(`/${kpiDefinition.id}`, {
			manifest: oCardManifest
		});
	}

	protected async initNavigationInfo(
		kpiDefinition: AnalyticalKPIDefinition,
		oKPIModel: JSONModel,
		oShellService: IShellServices
	): Promise<void> {
		// Add navigation
		if (kpiDefinition.navigation) {
			return getNavigationParameters(kpiDefinition.navigation, oShellService).then((oNavInfo) => {
				if (oNavInfo) {
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/header/actions`, [
						{
							type: "Navigation",
							parameters: oNavInfo
						}
					]);
				}
				return;
			});
		} else {
			return Promise.resolve();
		}
	}

	@methodOverride()
	public onInit(): void {
		this.aKPIDefinitions = (this.getView().getController() as PageController)._getPageModel()?.getProperty("/kpiDefinitions");

		if (this.aKPIDefinitions && this.aKPIDefinitions.length) {
			const oView = this.getView();
			const oAppComponent = (oView.getController() as BaseController).getAppComponent();

			// Create a JSON model to store KPI data
			const oKPIModel = new JSONModel();
			oView.setModel(oKPIModel, "kpiModel");

			this.aKPIDefinitions.forEach((kpiDefinition) => {
				// We only need to worry about analytical KPI definition
				if (kpiDefinition.type === "Analytical") {
					// Create the manifest for the KPI card and store it in the KPI model
					this.initCardManifest(kpiDefinition, oKPIModel);

					// Set the navigation information in the manifest
					this.initNavigationInfo(kpiDefinition, oKPIModel, oAppComponent.getShellServices()).catch(function (err: string) {
						Log.error(err);
					});

					// Load tag data for the KPI
					this.loadKPITagData(kpiDefinition, oAppComponent.getModel(), oKPIModel).catch(function (err: string) {
						Log.error(err);
					});
				}
			});
		}
	}

	@methodOverride()
	public onExit(): void {
		const oKPIModel = this.getView().getModel("kpiModel") as JSONModel;

		if (oKPIModel) {
			oKPIModel.destroy();
		}
	}

	private updateDatapointValueAndCurrency(kpiDefinition: AnalyticalKPIDefinition, kpiContext: Context, oKPIModel: JSONModel): void {
		const currentLocale = new Locale(Localization.getLanguage());
		const rawUnit = kpiDefinition.datapoint.unit?.isPath
			? kpiContext.getProperty(kpiDefinition.datapoint.unit.value)
			: kpiDefinition.datapoint.unit?.value;

		const isPercentage = kpiDefinition.datapoint.unit?.isCurrency === false && rawUnit === "%";

		// /////////////////////
		// Main KPI value
		const rawValue = Number.parseFloat(kpiContext.getProperty(kpiDefinition.datapoint.propertyPath));

		// Value formatted with a scale
		const kpiValue = NumberFormat.getFloatInstance(
			{
				style: isPercentage ? undefined : "short",
				minFractionDigits: 0,
				maxFractionDigits: kpiDefinition.datapoint.numberOfFractionalDigits ?? 1,
				showScale: !isPercentage
			},
			currentLocale
		).format(rawValue);
		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValue`, kpiValue);

		// Value without a scale
		const kpiValueUnscaled = NumberFormat.getFloatInstance(
			{
				maxFractionDigits: kpiDefinition.datapoint.numberOfFractionalDigits ?? 2,
				showScale: false,
				groupingEnabled: true
			},
			currentLocale
		).format(rawValue);
		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueUnscaled`, kpiValueUnscaled);

		// Value formatted with the scale omitted
		const kpiValueNoScale = NumberFormat.getFloatInstance(
			{
				style: isPercentage ? undefined : "short",
				minFractionDigits: 0,
				maxFractionDigits: kpiDefinition.datapoint.numberOfFractionalDigits ?? 1,
				showScale: false
			},
			currentLocale
		).format(rawValue);
		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueNoScale`, kpiValueNoScale);

		// Scale of the value
		const kpiValueScale = NumberFormat.getFloatInstance(
			{
				style: isPercentage ? undefined : "short",
				decimals: 0,
				maxIntegerDigits: 0,
				showScale: true
			},
			currentLocale
		).format(rawValue);
		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueScale`, kpiValueScale);

		// /////////////////////
		// Unit or currency
		if (kpiDefinition.datapoint.unit && rawUnit) {
			if (kpiDefinition.datapoint.unit.isCurrency) {
				oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainUnit`, rawUnit);
			} else {
				// In case of unit of measure, we have to format it properly
				const kpiUnit = NumberFormat.getUnitInstance({ showNumber: false }, currentLocale).format(rawValue, rawUnit);
				oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainUnit`, kpiUnit);
			}
		}
	}

	private updateDatapointCriticality(kpiDefinition: AnalyticalKPIDefinition, kpiContext: Context, oKPIModel: JSONModel): void {
		const rawValue = Number.parseFloat(kpiContext.getProperty(kpiDefinition.datapoint.propertyPath));

		let criticalityValue = MessageType.None;
		if (kpiDefinition.datapoint.criticalityValue != null) {
			// Criticality is a fixed value
			criticalityValue = kpiDefinition.datapoint.criticalityValue;
		} else if (kpiDefinition.datapoint.criticalityPath) {
			// Criticality comes from another property (via a path)
			criticalityValue =
				MessageTypeFromCriticality[kpiContext.getProperty(kpiDefinition.datapoint.criticalityPath)] || MessageType.None;
		} else if (kpiDefinition.datapoint.criticalityCalculationThresholds && kpiDefinition.datapoint.criticalityCalculationMode != null) {
			// Criticality calculation
			switch (kpiDefinition.datapoint.criticalityCalculationMode) {
				case "UI.ImprovementDirectionType/Target":
					criticalityValue = messageTypeFromTargetCalculation(rawValue, kpiDefinition.datapoint.criticalityCalculationThresholds);
					break;

				case "UI.ImprovementDirectionType/Minimize":
					criticalityValue = messageTypeFromMinimizeCalculation(
						rawValue,
						kpiDefinition.datapoint.criticalityCalculationThresholds
					);
					break;

				case "UI.ImprovementDirectionType/Maximize":
				default:
					criticalityValue = messageTypeFromMaximizeCalculation(
						rawValue,
						kpiDefinition.datapoint.criticalityCalculationThresholds
					);
					break;
			}
		}

		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainCriticality`, criticalityValue);
		oKPIModel.setProperty(
			`/${kpiDefinition.id}/manifest/sap.card/data/json/mainState`,
			ValueColorFromMessageType[criticalityValue] || "None"
		);
	}

	private updateDatapointTrend(kpiDefinition: AnalyticalKPIDefinition, kpiContext: Context, oKPIModel: JSONModel): void {
		const rawValue = Number.parseFloat(kpiContext.getProperty(kpiDefinition.datapoint.propertyPath));

		let trendValue = "None";

		if (kpiDefinition.datapoint.trendValue) {
			// Trend is a fixed value
			trendValue = kpiDefinition.datapoint.trendValue;
		} else if (kpiDefinition.datapoint.trendPath) {
			// Trend comes from another property via a path
			trendValue = deviationIndicatorFromTrendType(kpiContext.getProperty(kpiDefinition.datapoint.trendPath));
		} else if (
			kpiDefinition.datapoint.trendCalculationReferenceValue !== undefined ||
			kpiDefinition.datapoint.trendCalculationReferencePath
		) {
			// Calculated trend
			let trendReferenceValue: number;
			if (kpiDefinition.datapoint.trendCalculationReferenceValue !== undefined) {
				trendReferenceValue = kpiDefinition.datapoint.trendCalculationReferenceValue;
			} else {
				trendReferenceValue = Number.parseFloat(
					kpiContext.getProperty(kpiDefinition.datapoint.trendCalculationReferencePath || "")
				);
			}
			trendValue = deviationIndicatorFromCalculation(
				rawValue,
				trendReferenceValue,
				!!kpiDefinition.datapoint.trendCalculationIsRelative,
				kpiDefinition.datapoint.trendCalculationTresholds
			);
		}

		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/trend`, trendValue);
	}

	private updateTargetValue(kpiDefinition: AnalyticalKPIDefinition, kpiContext: Context, oKPIModel: JSONModel): void {
		if (kpiDefinition.datapoint.targetValue === undefined && kpiDefinition.datapoint.targetPath === undefined) {
			return; // No target set for the KPI
		}
		const rawValue = Number.parseFloat(kpiContext.getProperty(kpiDefinition.datapoint.propertyPath));
		const currentLocale = new Locale(Localization.getLanguage());

		let targetRawValue: number;
		if (kpiDefinition.datapoint.targetValue !== undefined) {
			targetRawValue = kpiDefinition.datapoint.targetValue;
		} else {
			targetRawValue = Number.parseFloat(kpiContext.getProperty(kpiDefinition.datapoint.targetPath || ""));
		}
		const deviationRawValue = targetRawValue !== 0 ? ((rawValue - targetRawValue) / targetRawValue) * 100 : undefined;

		// Formatting
		const targetValue = NumberFormat.getFloatInstance(
			{
				style: "short",
				minFractionDigits: 0,
				maxFractionDigits: kpiDefinition.datapoint.numberOfFractionalDigits ?? 1, // Use the same precision as the main value
				showScale: false
			},
			currentLocale
		).format(targetRawValue);
		const targetScale = NumberFormat.getFloatInstance(
			{
				style: "short",
				decimals: 0,
				maxIntegerDigits: 0,
				showScale: true
			},
			currentLocale
		).format(targetRawValue);

		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/targetNumber`, targetValue);
		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/targetUnit`, targetScale);

		if (deviationRawValue !== undefined) {
			const deviationValue = NumberFormat.getFloatInstance(
				{
					minFractionDigits: 0,
					maxFractionDigits: 1,
					showScale: false
				},
				currentLocale
			).format(deviationRawValue);
			oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/deviationNumber`, deviationValue);
		} else {
			oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/deviationNumber`, "N/A");
		}
	}

	/**
	 * Loads tag data for a KPI, and stores it in the JSON KPI model.
	 * @param kpiDefinition The definition of the KPI.
	 * @param oMainModel The model used to load the data.
	 * @param oKPIModel The JSON model where the data will be stored
	 * @param loadFull If not true, loads only data for the KPI tag
	 * @returns The promise that is resolved when data is loaded.
	 */
	protected async loadKPITagData(
		kpiDefinition: AnalyticalKPIDefinition,
		oMainModel: ODataModel,
		oKPIModel: JSONModel,
		loadFull?: boolean
	): Promise<void | Context[]> {
		// If loadFull=false, then we're just loading data for the tag and we use the "$auto.LongRunners" groupID
		// If loadFull=true, we're loading data for the whole KPI (tag + card) and we use the "$auto.Workers" groupID
		const oListBinding = loadFull
			? oMainModel.bindList(kpiDefinition.contextPath, undefined, undefined, undefined, { $$groupId: "$auto.Workers" })
			: oMainModel.bindList(kpiDefinition.contextPath, undefined, undefined, undefined, { $$groupId: "$auto.LongRunners" });
		const oAggregate: Record<string, { unit?: string }> = {};

		// Main value + currency/unit
		if (kpiDefinition.datapoint.unit?.isPath) {
			oAggregate[kpiDefinition.datapoint.propertyPath] = { unit: kpiDefinition.datapoint.unit.value };
		} else {
			oAggregate[kpiDefinition.datapoint.propertyPath] = {};
		}

		// Property for criticality
		if (kpiDefinition.datapoint.criticalityPath) {
			oAggregate[kpiDefinition.datapoint.criticalityPath] = {};
		}

		// Properties for trend and trend calculation
		if (loadFull) {
			if (kpiDefinition.datapoint.trendPath) {
				oAggregate[kpiDefinition.datapoint.trendPath] = {};
			}
			if (kpiDefinition.datapoint.trendCalculationReferencePath) {
				oAggregate[kpiDefinition.datapoint.trendCalculationReferencePath] = {};
			}
			if (kpiDefinition.datapoint.targetPath) {
				oAggregate[kpiDefinition.datapoint.targetPath] = {};
			}
		}

		oListBinding.setAggregation({ aggregate: oAggregate });

		// Manage SelectionVariant filters
		if (kpiDefinition.selectionVariantFilterDefinitions?.length) {
			const aFilters = kpiDefinition.selectionVariantFilterDefinitions.map(createFilterFromDefinition).filter((filter) => {
				return filter !== undefined;
			}) as Filter[];
			oListBinding.filter(aFilters);
		}

		return oListBinding.requestContexts(0, 1).then((aContexts: Context[]): void => {
			if (aContexts.length) {
				const rawUnit = kpiDefinition.datapoint.unit?.isPath
					? aContexts[0].getProperty(kpiDefinition.datapoint.unit.value)
					: kpiDefinition.datapoint.unit?.value;

				if (kpiDefinition.datapoint.unit && !rawUnit) {
					// A unit/currency is defined, but its value is undefined --> multi-unit situation
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValue`, "*");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueUnscaled`, "*");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueNoScale`, "*");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainValueScale`, "");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainUnit`, undefined);
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainCriticality`, MessageType.None);
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/mainState`, "None");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/trend`, "None");
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/targetNumber`, undefined);
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/targetUnit`, undefined);
					oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/deviationNumber`, undefined);
				} else {
					this.updateDatapointValueAndCurrency(kpiDefinition, aContexts[0], oKPIModel);
					this.updateDatapointCriticality(kpiDefinition, aContexts[0], oKPIModel);

					if (loadFull) {
						this.updateDatapointTrend(kpiDefinition, aContexts[0], oKPIModel);
						this.updateTargetValue(kpiDefinition, aContexts[0], oKPIModel);
					}
				}
			}
			return;
		});
	}

	/**
	 * Loads card data for a KPI, and stores it in the JSON KPI model.
	 * @param kpiDefinition The definition of the KPI.
	 * @param oMainModel The model used to load the data.
	 * @param oKPIModel The JSON model where the data will be stored
	 * @returns The promise that is resolved when data is loaded.
	 */
	protected async loadKPICardData(
		kpiDefinition: AnalyticalKPIDefinition,
		oMainModel: ODataModel,
		oKPIModel: JSONModel
	): Promise<void | Context[]> {
		const oListBinding = oMainModel.bindList(kpiDefinition.contextPath, undefined, undefined, undefined, {
			$$groupId: "$auto.Workers"
		});
		const oGroup: Record<string, { additionally?: string[] }> = {};
		const oAggregate: Record<string, Object> = {};

		kpiDefinition.chart.dimensions.forEach((dimension) => {
			oGroup[dimension.name] = {};
			if (dimension.text) {
				// Also load the text property if there's one (as an additional property)
				oGroup[dimension.name].additionally = [dimension.text];
			}
		});
		kpiDefinition.chart.measures.forEach((measure) => {
			oAggregate[measure.name] = {};
		});
		oListBinding.setAggregation({
			group: oGroup,
			aggregate: oAggregate
		});

		// Manage SelectionVariant filters
		if (kpiDefinition.selectionVariantFilterDefinitions?.length) {
			const aFilters = kpiDefinition.selectionVariantFilterDefinitions.map(createFilterFromDefinition).filter((filter) => {
				return filter !== undefined;
			}) as Filter[];
			oListBinding.filter(aFilters);
		}

		// Sorting
		if (kpiDefinition.chart.sortOrder) {
			oListBinding.sort(
				kpiDefinition.chart.sortOrder.map((sortInfo) => {
					return new Sorter(sortInfo.name, sortInfo.descending);
				})
			);
		}

		const allContexts = await oListBinding.requestContexts(0, kpiDefinition.chart.maxItems);
		const chartData = allContexts.map((oContext) => {
			const oData: Record<string, unknown> = {};
			kpiDefinition.chart.dimensions.forEach((dimension) => {
				// We have to format the dimension value here, as the card doesn't support calculated bindings yet
				switch (dimension.textArrangement) {
					case "TextOnly":
						oData[dimension.name] = oContext.getProperty(dimension.text!);
						break;

					case "TextLast":
						oData[dimension.name] = valueFormatters.formatWithBrackets(
							oContext.getProperty(dimension.name),
							oContext.getProperty(dimension.text!)
						);
						break;

					case undefined:
						// No text arrangement
						oData[dimension.name] = oContext.getProperty(dimension.name);
						break;

					default:
						//Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
						oData[dimension.name] = valueFormatters.formatWithBrackets(
							oContext.getProperty(dimension.text!),
							oContext.getProperty(dimension.name)
						);
				}
			});
			kpiDefinition.chart.measures.forEach((measure) => {
				oData[measure.name] = oContext.getProperty(measure.name);
			});

			return oData;
		});

		oKPIModel.setProperty(`/${kpiDefinition.id}/manifest/sap.card/data/json/chartData`, chartData);
	}

	/**
	 * Gets the popover to display the KPI card
	 * The popover and the contained card for the KPIs are created if necessary.
	 * The popover is shared between all KPIs, so it's created only once.
	 * @param oKPITag The tag that triggered the popover opening.
	 * @returns The shared popover as a promise.
	 */
	protected async getPopover(oKPITag: GenericTag): Promise<Popover> {
		if (!this.oPopover) {
			return new Promise((resolve, reject) => {
				Library.load({ name: "sap/ui/integration" })
					.then((): void => {
						sap.ui.require(["sap/ui/integration/widgets/Card", "sap/ui/integration/Host"], (...params: unknown[]) => {
							const CardClass = params[0] as typeof CardType;
							const Host = params[1] as typeof HostType;
							const oHost = new Host();

							oHost.attachAction((oEvent: Host$ActionEvent) => {
								const sType = oEvent.getParameter("type");
								const oParams = oEvent.getParameter("parameters") as {
									semanticObject?: string;
									action: string;
									outbound: string;
								};

								if (sType === "Navigation") {
									if (oParams.semanticObject) {
										this.base._intentBasedNavigation.navigate(oParams.semanticObject, oParams.action);
									} else {
										this.base._intentBasedNavigation.navigateOutbound(oParams.outbound);
									}
								}
							});

							this.oCard = new CardClass({
								width: "25rem",
								height: "auto"
							});
							this.oCard.setHost(oHost as unknown as Control);

							this.oPopover = new Popover("kpi-Popover", {
								showHeader: false,
								placement: "Auto",
								content: [this.oCard]
							});

							oKPITag.addDependent(this.oPopover); // The first clicked tag gets the popover as dependent

							resolve(this.oPopover);
						});
						return;
					})
					.catch(function () {
						reject();
					});
			});
		} else {
			return Promise.resolve(this.oPopover);
		}
	}

	public async onKPIPressed(oKPITag: GenericTag, kpiID: string): Promise<void> {
		const oKPIModel = oKPITag.getModel("kpiModel") as JSONModel;

		if (this.aKPIDefinitions && this.aKPIDefinitions.length) {
			const kpiDefinition = this.aKPIDefinitions.find(function (oDef) {
				return (oDef as AnalyticalKPIDefinition).id === kpiID;
			}) as AnalyticalKPIDefinition | undefined;

			if (kpiDefinition) {
				try {
					const oModel = oKPITag.getModel() as ODataModel;

					const popover = await this.getPopover(oKPITag);
					// Set the popover as modal while the card is loading (so that card rendering doesn't interfere with the popover and close it)
					popover.setModal(true);

					this.oCard.setManifest(oKPIModel.getProperty(`/${kpiID}/manifest`));
					this.oCard.setPreviewMode("Abstract"); // Display placeholders in the card until data is loaded
					popover.openBy(oKPITag, false); // Open the popover immediately

					const promises = [
						this.loadKPITagData(kpiDefinition, oModel, oKPIModel, true),
						this.loadKPICardData(kpiDefinition, oModel, oKPIModel)
					];

					await Promise.all(promises);
					this.oCard.attachEventOnce("stateChanged", () => {
						// Once the card has been rendered, set the focus properly and set the popover as non-modal
						(this.oCard.getFocusDomRef() as HTMLElement)?.focus();
						popover.setModal(false);
					});
					this.oCard.setManifest(oKPIModel.getProperty(`/${kpiID}/manifest`));
					this.oCard.refresh();
					this.oCard.setPreviewMode("Off"); // Display real data in the card
				} catch (err) {
					Log.error(err as string);
				}
			}
		}
	}
}

export default KPIManagementControllerExtension;
