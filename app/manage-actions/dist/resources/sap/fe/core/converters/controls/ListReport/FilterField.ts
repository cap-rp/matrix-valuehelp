import type { NavigationProperty, Property } from "@sap-ux/vocabularies-types";
import type {
	FilterExpressionType,
	FilterRestrictions,
	FilterRestrictionsType
} from "@sap-ux/vocabularies-types/vocabularies/Capabilities";
import type { EntitySetAnnotations_Capabilities } from "@sap-ux/vocabularies-types/vocabularies/Capabilities_Edm";
import Log from "sap/base/Log";
import { getTargetEntitySetInfo, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";

const ALLOWED_EXPRESSIONS_PRIORITY = [
	"SingleValue",
	"MultiValue",
	"SingleRange",
	"MultiRange",
	"SearchExpression",
	"MultiRangeOrSearchExpression"
];

/**
 * Get allowed filter expression by priority.
 * @param expressions Allowed filter expressions from different sources.
 * @returns Allowed filter expression
 */
function getSpecificAllowedExpression(expressions: string[]): string {
	expressions.sort(function (a: string, b: string) {
		return ALLOWED_EXPRESSIONS_PRIORITY.indexOf(a) - ALLOWED_EXPRESSIONS_PRIORITY.indexOf(b);
	});

	return expressions[0];
}

/**
 * Get allowed filter expression from filter restrictions.
 * @param propertyName Property name
 * @param filterRestictions Filter restrictions
 * @returns Allowed filter expression
 */
function getAllowedFilterExpressionForFilterRestictions(
	propertyName: string,
	filterRestictions?: FilterRestrictions | FilterRestrictionsType
): string | undefined {
	const fR = filterRestictions?.FilterExpressionRestrictions?.find((fr) => fr.Property?.value === propertyName);
	return fR?.AllowedExpressions?.toString();
}

/**
 * Get the allowed filter expression for a property.
 * @param propertyObjectPath Property object path
 * @returns Allowed filter expression
 */
export function getAllowedFilterExpressionForProperty<T extends Property>(
	propertyObjectPath: DataModelObjectPath<T>
): FilterExpressionType | undefined {
	if (propertyObjectPath.targetEntityType.annotations.Common?.ResultContext?.valueOf() === true) {
		// It is a Parameter
		return "SingleValue";
	}

	const navProps = propertyObjectPath.navigationProperties as NavigationProperty[];
	const lastNavProp = navProps[navProps.length - 1];
	const isContainment = lastNavProp?.containsTarget;
	const propertyName = propertyObjectPath.targetObject?.name;
	if (!propertyName) {
		Log.warning(`Property name not found!`);
		return;
	}
	let allowedExps: string[] = [];
	if (lastNavProp) {
		// Allowed Exp at parent navigation property
		const navPropFR = (lastNavProp.annotations.Capabilities as EntitySetAnnotations_Capabilities)?.FilterRestrictions;
		const navPropAllowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, navPropFR);
		allowedExps = allowedExps.concat(navPropAllowedExp ? [navPropAllowedExp] : []);

		const { parentEntitySet, parentNavigationPath } = getTargetEntitySetInfo(propertyObjectPath);

		// Allowed Exp at parent entitySet.
		const parentFRAllowedExp = getAllowedFilterExpressionForFilterRestictions(
			`${parentNavigationPath}/${propertyName}`,
			(parentEntitySet?.annotations.Capabilities as EntitySetAnnotations_Capabilities)?.FilterRestrictions
		);
		allowedExps = allowedExps.concat(parentFRAllowedExp ? [parentFRAllowedExp] : []);

		// Allowed Exp at parent entitySet Nav Restrictions.
		const parentNR = parentEntitySet?.annotations.Capabilities?.NavigationRestrictions?.RestrictedProperties.find(
			(rp) => rp.NavigationProperty.value === parentNavigationPath
		);
		// New way property name in restriction is expected to have navigation path at the start of it.
		const parentNRAllowedExp = getAllowedFilterExpressionForFilterRestictions(
			`${parentNavigationPath}/${propertyName}`,
			parentNR?.FilterRestrictions
		);
		allowedExps = allowedExps.concat(parentNRAllowedExp ? [parentNRAllowedExp] : []);

		// Old way property name in restriction is relative to navigation path of the navigation restriction.
		const legacyParenNRtAllowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, parentNR?.FilterRestrictions);
		allowedExps = allowedExps.concat(legacyParenNRtAllowedExp ? [legacyParenNRtAllowedExp] : []);
	}

	// Allowed Exp at target entitySet.
	if (!isContainment && propertyObjectPath.targetEntitySet) {
		const targetEntitySet = propertyObjectPath.targetEntitySet;
		const filterRestictions = (targetEntitySet.annotations.Capabilities as EntitySetAnnotations_Capabilities)?.FilterRestrictions;

		const allowedExp = getAllowedFilterExpressionForFilterRestictions(propertyName, filterRestictions);
		allowedExps = allowedExps.concat(allowedExp ? [allowedExp] : []);
	}
	return getSpecificAllowedExpression(allowedExps);
}

/**
 * Checks the maximum number of filter conditions for a property.
 * @param propertyObjectPath Property object path
 * @returns The number of maximum allowed conditions or -1 if there is no limit.
 */
export function getMaxConditions<T extends Property>(propertyObjectPath: DataModelObjectPath<T>): number {
	let max = -1;

	const allowedExpression = getAllowedFilterExpressionForProperty(propertyObjectPath);
	if (
		propertyObjectPath.targetObject?.type === "Edm.Boolean" ||
		allowedExpression === "SingleValue" ||
		allowedExpression === "SingleRange"
	) {
		max = 1;
	}

	return max;
}
