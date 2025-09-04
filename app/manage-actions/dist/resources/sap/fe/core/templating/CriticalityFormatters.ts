import type { PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataPoint,
	DataPointType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { CriticalityType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, equal, getExpressionFromAnnotation, ifElse, or, pathInModel } from "sap/fe/base/BindingToolkit";
import criticalityFormatters from "sap/fe/core/formatters/CriticalityFormatter";
import { getRelativePaths, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";

const getCriticalityExpression = (
	target: DataField | DataPointType | DataModelObjectPath<DataPointType | DataFieldForAction> | DataFieldAbstractTypes,
	propertyDataModelPath?: DataModelObjectPath<DataPointType>
): BindingToolkitExpression<unknown> => {
	const relativeLocations = propertyDataModelPath ? getRelativePaths(propertyDataModelPath) : undefined;
	const annotationTarget = (target as DataModelObjectPath<DataPointType | DataFieldForAction>).targetObject ?? (target as DataPointType);
	if (annotationTarget.Criticality) {
		const criticality = criticalityFormatters.getCriticality(annotationTarget.Criticality);
		if (criticality) {
			// it's a constant so no need to use a virtual property
			return constant(criticality);
		}
		return pathInModel(`${annotationTarget.fullyQualifiedName}@$ui5.fe.virtual.criticality`, undefined, relativeLocations);
	}
	return constant(undefined);
};

export const getCriticalityExpressionForCards = (
	criticalityExpression: BindingToolkitExpression<string | number>,
	isInsightsCard: boolean
): BindingToolkitExpression<string> => {
	const negativeCriticality = isInsightsCard ? constant("sap-icon://error") : constant("attention");
	const criticalCriticality = isInsightsCard ? constant("sap-icon://warning") : constant("warning");
	const positiveCriticality = isInsightsCard ? constant("sap-icon://status-positive") : constant("good");
	const informationCriticality = isInsightsCard
		? ifElse(
				or(
					equal(criticalityExpression, constant("UI.CriticalityType/Information")),
					equal(criticalityExpression as BindingToolkitExpression<number>, constant(5)),
					equal(criticalityExpression, constant("5"))
				),
				constant("sap-icon://information"),
				constant("")
		  )
		: constant("default");
	return ifElse(
		or(
			equal(criticalityExpression, constant("UI.CriticalityType/Negative")),
			equal(criticalityExpression as BindingToolkitExpression<number>, constant(1)),
			equal(criticalityExpression, constant("1"))
		),
		negativeCriticality,
		ifElse(
			or(
				equal(criticalityExpression, constant("UI.CriticalityType/Critical")),
				equal(criticalityExpression as BindingToolkitExpression<number>, constant(2)),
				equal(criticalityExpression, constant("2"))
			),
			criticalCriticality,
			ifElse(
				or(
					equal(criticalityExpression, constant("UI.CriticalityType/Positive")),
					equal(criticalityExpression as BindingToolkitExpression<number>, constant(3)),
					equal(criticalityExpression, constant("3"))
				),
				positiveCriticality,
				informationCriticality
			)
		)
	);
};

/**
 * Builds an expression to determine the criticality status for integration cards.
 * Used when virtual properties cannot be applied.
 * @param criticalityProperty The criticality annotation value (string or number).
 * @returns An expression resolving to the criticality status for integration cards.
 */
export const criticalityExpressionForIntegrationCards = (
	criticalityProperty: PropertyAnnotationValue<string | number> | undefined
): string | undefined => {
	if (criticalityProperty) {
		const criticalityExpression: BindingToolkitExpression<string | number> = getExpressionFromAnnotation(criticalityProperty);
		return compileExpression(
			ifElse(
				or(
					equal(criticalityExpression, constant(CriticalityType.Negative)),
					equal(criticalityExpression, constant(1)),
					equal(criticalityExpression, constant("1"))
				),
				constant("Error"),
				ifElse(
					or(
						equal(criticalityExpression, constant(CriticalityType.Critical)),
						equal(criticalityExpression, constant(2)),
						equal(criticalityExpression, constant("2"))
					),
					constant("Warning"),
					ifElse(
						or(
							equal(criticalityExpression, constant(CriticalityType.Positive)),
							equal(criticalityExpression, constant(3)),
							equal(criticalityExpression, constant("3"))
						),
						constant("Success"),
						ifElse(
							or(
								equal(criticalityExpression, constant(CriticalityType.Information)),
								equal(criticalityExpression, constant(5)),
								equal(criticalityExpression, constant("5"))
							),
							constant("Information"),
							constant("None")
						)
					)
				)
			)
		);
	}
};

/**
 * Builds an expression to determine the criticality icon for integration cards.
 * Used when virtual properties cannot be applied.
 * @param target The target object containing the criticality property.
 * @returns An expression resolving to the criticality icon for integration cards.
 */
export const criticalityIconExpressionForIntegrationCards = (
	target: DataPointType | DataModelObjectPath<DataPointType>
): string | undefined => {
	const criticalityProperty = (target as DataPointType)?.Criticality;
	const criticalityExpression: BindingToolkitExpression<string> = getExpressionFromAnnotation(criticalityProperty);
	const condition =
		(target as DataPointType).CriticalityRepresentation &&
		(target as DataPointType).CriticalityRepresentation === "UI.CriticalityRepresentationType/WithoutIcon";
	let iconPath;
	if (!condition) {
		if (criticalityProperty) {
			iconPath = getCriticalityExpressionForCards(criticalityExpression, true);
		} else {
			iconPath = constant("");
		}
	} else {
		iconPath = constant("");
	}
	return compileExpression(iconPath);
};

/**
 * Returns an expression to set button type based on Criticality
 * Supported Criticality: Positive, Negative, Critical, and Information leading to Success, Error, Warning, and None state respectively.
 * @param target A DataField, a DataPoint, or a DataModelObjectPath.
 * @param propertyDataModelPath DataModelObjectPath.
 * @returns An expression to deduce the state of an objectStatus.
 */
export const buildExpressionForCriticalityColor = (
	target: DataPointType | DataModelObjectPath<DataPointType>,
	propertyDataModelPath?: DataModelObjectPath<DataPointType>
): string | undefined => {
	const virtualCriticalityExpression = getCriticalityExpression(target, propertyDataModelPath);
	return compileExpression(
		ifElse(
			equal(virtualCriticalityExpression, constant(CriticalityType.Negative)),
			constant("Error"),
			ifElse(
				equal(virtualCriticalityExpression, constant(CriticalityType.Critical)),
				constant("Warning"),
				ifElse(
					equal(virtualCriticalityExpression, constant(CriticalityType.Positive)),
					constant("Success"),
					ifElse(
						equal(virtualCriticalityExpression, constant(CriticalityType.Information)),
						constant("Information"),
						constant("None")
					)
				)
			)
		)
	);
};

/**
 * Returns an expression to set icon type based on Criticality
 * Supported Criticality: Positive, Negative, Critical and Information.
 * @param target A DataField a DataPoint or a DataModelObjectPath.
 * @param [propertyDataModelPath] DataModelObjectPath.
 * @returns An expression to deduce the icon of an objectStatus.
 */
export const buildExpressionForCriticalityIcon = (
	target: DataPointType | DataModelObjectPath<DataPointType>,
	propertyDataModelPath?: DataModelObjectPath<DataPointType>
): string | undefined => {
	const annotationTarget = (target as DataModelObjectPath<DataPointType>).targetObject ?? (target as DataPointType);
	const virtualCriticalityExpression = getCriticalityExpression(annotationTarget, propertyDataModelPath);
	const condition = annotationTarget.CriticalityRepresentation === "UI.CriticalityRepresentationType/WithoutIcon";
	let iconPath;
	if (!condition) {
		iconPath = ifElse(
			equal(virtualCriticalityExpression, constant(CriticalityType.Negative)),
			constant("sap-icon://error"),
			ifElse(
				equal(virtualCriticalityExpression, constant(CriticalityType.Critical)),
				constant("sap-icon://warning"),
				ifElse(
					equal(virtualCriticalityExpression, constant(CriticalityType.Positive)),
					constant("sap-icon://status-positive"),
					ifElse(
						equal(virtualCriticalityExpression, constant(CriticalityType.Information)),
						constant("sap-icon://information"),
						constant("")
					)
				)
			)
		);
	} else {
		iconPath = constant("");
	}
	return compileExpression(iconPath);
};

/**
 * Returns an expression to set button type based on Criticality
 * Supported Criticality: Positive and Negative leading to Accept and Reject button type respectively.
 * @param annotationTarget A DataField, DataPoint, DataModelObjectPath.
 * @returns An expression to deduce button type.
 */
export const buildExpressionForCriticalityButtonType = (
	annotationTarget: DataModelObjectPath<DataPointType | DataFieldForAction>
): string | undefined => {
	const virtualCriticalityExpression = getCriticalityExpression(annotationTarget);
	return compileExpression(
		ifElse(
			equal(virtualCriticalityExpression, constant(undefined)),
			constant("Ghost"),
			ifElse(
				equal(virtualCriticalityExpression, constant(CriticalityType.Negative)),
				constant("Reject"),
				ifElse(equal(virtualCriticalityExpression, constant(CriticalityType.Positive)), constant("Accept"), constant("Default"))
			)
		)
	);
};

/**
 * Returns an expression to set color in MicroCharts based on Criticality
 * Supported Criticality: Positive, Negative and Critical leading to Good, Error and Critical color respectively.
 * @param dataPoint A DataField, DataPoint, DataModelObjectPath
 * @returns An expression to deduce colors in Microcharts
 */
export const buildExpressionForCriticalityColorMicroChart = (dataPoint: DataPoint | DataModelObjectPath<DataPoint>): string | undefined => {
	const annotationTarget = (dataPoint as DataModelObjectPath<DataPoint>)?.targetObject ?? (dataPoint as DataPoint);
	const sColorExpression = buildExpressionForCriticality(annotationTarget);
	return compileExpression(sColorExpression);
};

/**
 * Generates an expression to set color based on Criticality.
 * @param annotationTarget A DataField, DataPoint
 * @param criticalityMap Criticality Mapper
 * @returns An expression to deduce colors in datapoints
 */
export const buildExpressionForCriticality = (
	annotationTarget: DataField | DataPoint | DataFieldAbstractTypes,
	criticalityMap = {
		error: "Error",
		critical: "Critical",
		good: "Good",
		neutral: "Neutral"
	}
): BindingToolkitExpression<string> => {
	const virtualCriticalityExpression = getCriticalityExpression(annotationTarget);
	return ifElse(
		equal(virtualCriticalityExpression, constant(CriticalityType.Negative)),
		constant(criticalityMap.error),
		ifElse(
			equal(virtualCriticalityExpression, constant(CriticalityType.Critical)),
			constant(criticalityMap.critical),
			ifElse(
				equal(virtualCriticalityExpression, constant(CriticalityType.Positive)),
				constant(criticalityMap.good),
				constant(criticalityMap.neutral)
			)
		)
	);
};
