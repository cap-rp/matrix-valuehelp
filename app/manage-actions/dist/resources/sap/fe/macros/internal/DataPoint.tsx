import type { Property } from "@sap-ux/vocabularies-types";
import { VisualizationType, type DataPointType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, type BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { aggregation, association, defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import { buildExpressionForCriticalityColor, buildExpressionForCriticalityIcon } from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { hasCurrency, hasUnit } from "sap/fe/core/templating/PropertyHelper";
import { getPropertyWithSemanticObject } from "sap/fe/core/templating/SemanticObjectHelper";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import { getVisibleExpression, isUsedInNavigationWithQuickViewFacets } from "sap/fe/macros/field/FieldTemplating";
import {
	buildExpressionForProgressIndicatorDisplayValue,
	buildExpressionForProgressIndicatorPercentValue,
	buildFieldBindingExpression,
	getValueFormatted
} from "sap/fe/macros/internal/helpers/DataPointTemplating";
import QuickView from "sap/fe/macros/quickView/QuickView";
import ObjectNumber from "sap/m/ObjectNumber";
import type { ObjectStatus$PressEvent } from "sap/m/ObjectStatus";
import ObjectStatus from "sap/m/ObjectStatus";
import ProgressIndicator from "sap/m/ProgressIndicator";
import RatingIndicator from "sap/m/RatingIndicator";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import type MdcLink from "sap/ui/mdc/Link";
import FieldRuntimeHelper from "../field/FieldRuntimeHelper";
import DataPointFormatOptions from "./DataPointFormatOptions";

@defineUI5Class("sap.fe.macros.internal.DataPoint")
export default class DataPoint extends BuildingBlock<Control> {
	/**
	 * Prefix added to the generated ID of the field
	 */
	@association({
		type: "string"
	})
	public idPrefix?: string;

	/**
	 * Metadata path to the dataPoint.
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	@property({
		type: "string"
	})
	public contextPath?: string;

	@aggregation({ type: "sap.fe.macros.internal.DataPointFormatOptions", multiple: false, defaultClass: DataPointFormatOptions })
	formatOptions!: DataPointFormatOptions;

	/**
	 * Property to set an external value that comes from a different model than the oData model
	 */
	@property({
		type: "string",
		isBindingInfo: true
	})
	public value?: string;

	/**
	 * Property to set the visualization type
	 */
	private visualization?: string;

	/**
	 * Property to set the visibility
	 */
	private visible: CompiledBindingToolkitExpression;

	/**
	 * Property to set property if the property has a Quickview
	 */
	private hasQuickView = false;

	private dataModelPath?: DataModelObjectPath<DataPointType>;

	private valueDataModelPath?: DataModelObjectPath<Property>;

	constructor(properties: $ControlSettings & PropertiesOf<DataPoint>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		this.getTemplatingObjects();
		this.content = this.createContent();
	}

	/**
	 * Function to get the templating objects.
	 */
	private getTemplatingObjects(): void {
		const internalDataModelPath = this.getDataModelObjectForMetaPath<DataPointType>(this.metaPath, this.contextPath);
		if (!internalDataModelPath) {
			return;
		}
		let internalValueDataModelPath;
		this.visible = getVisibleExpression(internalDataModelPath);
		if (internalDataModelPath?.targetObject?.Value?.path) {
			internalValueDataModelPath = enhanceDataModelPath<Property>(
				internalDataModelPath,
				internalDataModelPath.targetObject.Value.path
			);
		}

		this.dataModelPath = internalDataModelPath;
		this.valueDataModelPath = internalValueDataModelPath;
	}

	/**
	 * Function that calculates the visualization type for this DataPoint.
	 * @param dataModelPath
	 */
	private getDataPointVisualization(dataModelPath: DataModelObjectPath<DataPointType>): void {
		if (dataModelPath.targetObject?.Visualization === VisualizationType.Rating) {
			this.visualization = "Rating";
			return;
		}
		if (dataModelPath.targetObject?.Visualization === VisualizationType.Progress) {
			this.visualization = "Progress";
			return;
		}
		const valueProperty = this.valueDataModelPath && this.valueDataModelPath.targetObject;
		//check whether the visualization type should be an object number in case one of the if conditions met
		this.hasQuickView = (valueProperty && isUsedInNavigationWithQuickViewFacets(dataModelPath, valueProperty)) ?? false;
		if (this.valueDataModelPath && getPropertyWithSemanticObject(this.valueDataModelPath)) {
			this.hasQuickView = true;
		}
		if (this.hasQuickView !== true) {
			if (isProperty(valueProperty) && (hasUnit(valueProperty) || hasCurrency(valueProperty))) {
				// we only show an objectNumber if there is no quickview and a unit or a currency
				this.visualization = "ObjectNumber";
				return;
			}
		}

		//default case to handle this as objectStatus type
		this.visualization = "ObjectStatus";
	}

	/**
	 * Gets the current enablement state of the dataPoint.
	 * @returns Boolean value with the enablement state
	 */
	getEnabled(): boolean {
		if (this.content?.isA<ObjectStatus>("sap.m.ObjectStatus")) {
			return this.content.getActive();
		} else {
			return true;
		}
	}

	/**
	 * Sets the current enablement state of the datapoint.
	 * @param enabled
	 * @returns The current datapoint reference
	 */
	setEnabled(enabled: boolean): Control {
		if (this.content?.isA<ObjectStatus>("sap.m.ObjectStatus")) {
			this.content.setProperty("active", enabled);
		} else {
			throw "setEnabled isn't implemented for this field type";
		}
		return this;
	}

	/**
	 * Creates a RatingIndicator control.
	 * @param dataModelPath
	 * @returns RatingIndicator
	 */
	createRatingIndicator(dataModelPath: DataModelObjectPath<DataPointType>): RatingIndicator {
		const dataPointTarget = dataModelPath.targetObject;
		const targetValue = this.getTargetValueBinding(dataModelPath);

		const dataPointValue = dataPointTarget?.Value || "";
		const propertyType = dataPointValue?.$target?.type;

		let numberOfFractionalDigits;
		if (propertyType === "Edm.Decimal" && dataPointTarget?.ValueFormat) {
			if (dataPointTarget.ValueFormat.NumberOfFractionalDigits) {
				numberOfFractionalDigits = dataPointTarget.ValueFormat.NumberOfFractionalDigits;
			}
		}
		const value = getValueFormatted(this.valueDataModelPath, dataPointValue, propertyType, numberOfFractionalDigits);

		return (
			<RatingIndicator
				id={this.idPrefix ? generate([this.idPrefix, "RatingIndicator-Field-display"]) : undefined}
				maxValue={targetValue}
				value={this.value ?? compileExpression(value)}
				tooltip={this.getTooltipValue(dataModelPath)}
				iconSize={this.formatOptions?.iconSize}
				class={this.formatOptions?.showLabels ?? false ? "sapUiTinyMarginTopBottom" : undefined}
				editable="false"
				ariaLabelledBy={this.ariaLabelledBy}
			/>
		);
	}

	/**
	 * Creates a ProgressIndicator control.
	 * @param dataModelPath
	 * @returns ProgressIndicator
	 */
	createProgressIndicator(dataModelPath: DataModelObjectPath<DataPointType>): ProgressIndicator {
		const criticalityColorExpression = dataModelPath.targetObject
			? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath)
			: undefined;
		const displayValue = buildExpressionForProgressIndicatorDisplayValue(dataModelPath);
		const percentValue = buildExpressionForProgressIndicatorPercentValue(dataModelPath);

		return (
			<ProgressIndicator
				id={this.idPrefix ? generate([this.idPrefix, "ProgressIndicator-Field-display"]) : undefined}
				displayValue={displayValue}
				percentValue={percentValue}
				state={criticalityColorExpression}
				tooltip={this.getTooltipValue(dataModelPath)}
				ariaLabelledBy={this.ariaLabelledBy}
			/>
		);
	}

	/**
	 * Creates an ObjectNumber control.
	 * @param dataModelPath
	 * @returns ObjectNumber
	 */
	createObjectNumber(dataModelPath: DataModelObjectPath<DataPointType>): ObjectNumber {
		const criticalityColorExpression = dataModelPath.targetObject
			? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath)
			: undefined;
		const emptyIndicatorMode = this.formatOptions?.showEmptyIndicator ?? false ? "On" : undefined;
		const objectStatusNumber = buildFieldBindingExpression(dataModelPath, this.formatOptions, true);
		const limitShowDecimals = this.getManifestWrapper()?.getSapFeManifestConfiguration()?.app?.showOnlyUnitDecimals === true;
		const unit =
			this.formatOptions?.measureDisplayMode === "Hidden"
				? undefined
				: compileExpression(UIFormatters.getBindingForUnitOrCurrency(this.valueDataModelPath, true, limitShowDecimals));

		return (
			<ObjectNumber
				id={this.idPrefix ? generate([this.idPrefix, "ObjectNumber-Field-display"]) : undefined}
				state={criticalityColorExpression}
				number={this.value ?? objectStatusNumber}
				unit={unit}
				visible={this.visible}
				emphasized="false"
				class={this.formatOptions?.dataPointStyle === "large" ? "sapMObjectNumberLarge" : undefined}
				tooltip={this.getTooltipValue(dataModelPath)}
				emptyIndicatorMode={emptyIndicatorMode}
			/>
		);
	}

	/**
	 * Returns the dependent.
	 * @returns Dependent either with the QuickView or an empty string.
	 */
	private createDependents(): MdcLink | undefined {
		if (this.hasQuickView) {
			return new QuickView(
				this.valueDataModelPath as DataModelObjectPath<Property>,
				this.metaPath,
				this.contextPath ?? ""
			).createContent() as MdcLink;
		}
		return undefined;
	}

	/**
	 * Creates an ObjectStatus control.
	 * @param dataModelPath
	 * @returns ObjectStatus
	 */
	createObjectStatus(dataModelPath: DataModelObjectPath<DataPointType>): ObjectStatus {
		let criticalityColorExpression = dataModelPath.targetObject
			? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath)
			: undefined;
		if (criticalityColorExpression === "None" && this.valueDataModelPath) {
			criticalityColorExpression = this.hasQuickView ? "Information" : "None";
		}
		const emptyIndicatorMode = this.formatOptions?.showEmptyIndicator ?? false ? "On" : undefined;
		const objectStatusText = buildFieldBindingExpression(dataModelPath, this.formatOptions, false);
		const iconExpression =
			this.formatOptions?.dataPointStyle === "large" || !dataModelPath.targetObject
				? undefined
				: buildExpressionForCriticalityIcon(dataModelPath.targetObject, dataModelPath);

		return (
			<ObjectStatus
				id={this.idPrefix ? generate([this.idPrefix, "ObjectStatus-Field-display"]) : undefined}
				class={this.formatOptions?.dataPointStyle === "large" ? "sapMObjectStatusLarge sapMObjectStatusLongText" : undefined}
				icon={iconExpression}
				tooltip={this.getTooltipValue(dataModelPath)}
				state={criticalityColorExpression}
				text={this.value ?? objectStatusText}
				emptyIndicatorMode={emptyIndicatorMode}
				active={this.hasQuickView}
				press={FieldRuntimeHelper.pressLink as unknown as (oEvent: ObjectStatus$PressEvent) => void}
				ariaLabelledBy={this.ariaLabelledBy}
			>
				{{
					dependents: this.createDependents()
				}}
			</ObjectStatus>
		);
	}

	/**
	 * The helper method to get a possible tooltip text.
	 * @param dataModelPath
	 * @returns BindingToolkitExpression
	 */
	private getTooltipValue(dataModelPath: DataModelObjectPath<DataPointType>): BindingToolkitExpression<string> | undefined {
		return dataModelPath.targetObject?.annotations?.Common?.QuickInfo
			? getExpressionFromAnnotation(dataModelPath.targetObject?.annotations?.Common?.QuickInfo, getRelativePaths(dataModelPath))
			: undefined;
	}

	/**
	 * The helper method to get a possible target value binding.
	 * @param dataModelPath
	 * @returns BindingToolkitExpression
	 */
	private getTargetValueBinding(
		dataModelPath: DataModelObjectPath<DataPointType>
	): BindingToolkitExpression<string | number> | undefined {
		return dataModelPath.targetObject?.TargetValue
			? getExpressionFromAnnotation(dataModelPath.targetObject?.TargetValue, getRelativePaths(dataModelPath))
			: undefined;
	}

	createContent(): ObjectStatus | ObjectNumber | RatingIndicator | ProgressIndicator | undefined {
		if (!this.dataModelPath) {
			return undefined;
		}
		this.getDataPointVisualization(this.dataModelPath);
		switch (this.visualization) {
			case "Rating": {
				return this.createRatingIndicator(this.dataModelPath);
			}
			case "Progress": {
				return this.createProgressIndicator(this.dataModelPath);
			}
			case "ObjectNumber": {
				return this.createObjectNumber(this.dataModelPath);
			}
			default: {
				return this.createObjectStatus(this.dataModelPath);
			}
		}
	}

	/**
	 * Retrieves the current value of the datapoint.
	 * @returns The current value of the datapoint
	 */
	getValue(): boolean | string | undefined {
		if (this.content?.isA<ObjectStatus>("sap.m.ObjectStatus")) {
			return this.content.getText();
		} else if (this.content?.isA<ObjectNumber>("sap.m.ObjectNumber")) {
			return this.content.getNumber();
		} else if (this.content?.isA<ProgressIndicator>("sap.m.ProgressIndicator")) {
			return this.content.getDisplayValue();
		} else if (this.content?.isA<RatingIndicator>("sap.m.RatingIndicator")) {
			return this.content.getValue().toString();
		} else {
			this.getProperty("value");
		}
	}

	/**
	 * Sets the current value of the field.
	 * @param value
	 * @returns The current field reference
	 */
	setValue(value: boolean | string | number | undefined): Control {
		this.setProperty("value", value);
		if (this.content?.isA<ObjectStatus>("sap.m.ObjectStatus")) {
			this.content.setText(value as string | undefined);
		} else if (this.content?.isA<ObjectNumber>("sap.m.ObjectNumber")) {
			this.content.setNumber(value as string);
		} else if (this.content?.isA<ProgressIndicator>("sap.m.ProgressIndicator")) {
			Log.error("setValue isn't implemented for this field type yet");
		} else if (this.content?.isA<RatingIndicator>("sap.m.RatingIndicator")) {
			this.content.setValue(value as number);
		}
		return this;
	}
}
