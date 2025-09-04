import type {
	DataFieldAbstractTypes,
	FacetTypes,
	FieldGroup,
	Identification,
	ReferenceFacet,
	StatusInfo
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTerms, UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { FormManifestConfiguration, ManifestAction } from "sap/fe/core/converters/ManifestSettings";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import type { ConfigurableRecord } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { KeyHelper } from "sap/fe/core/converters/helpers/Key";
import { isAnnotationOfTerm, isAnnotationOfType } from "sap/fe/core/helpers/TypeGuards";
import type ConverterContext from "../ConverterContext";

enum ActionType {
	Default = "Default"
}

export const mergeFormActions = (
	source: ConfigurableRecord<ManifestAction>,
	target: ConfigurableRecord<ManifestAction>
): ConfigurableRecord<ManifestAction> => {
	for (const key in source) {
		if (source.hasOwnProperty(key)) {
			target[key] = source[key];
		}
	}
	return source;
};

export const getFormHiddenActions = (
	facetDefinition: FacetTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): BaseAction[] => {
	const formActions: ConfigurableRecord<ManifestAction> = getFormActions(facetDefinition, converterContext) || [],
		annotations = converterContext?.getEntityType()?.annotations?.UI as unknown as Record<string, unknown>;
	const hiddenFormActions: BaseAction[] = [];
	for (const property in annotations) {
		const annotationProperty = annotations[property];
		if (isAnnotationOfType<FieldGroup>(annotationProperty, UIAnnotationTypes.FieldGroupType)) {
			annotationProperty?.Data.forEach((dataField: DataFieldAbstractTypes) => {
				if (
					(dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" &&
						formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`)) ||
					(dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" &&
						formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`))
				) {
					if (dataField?.annotations?.UI?.Hidden?.valueOf() === true) {
						hiddenFormActions.push({
							type: ActionType.Default,
							key: KeyHelper.generateKeyFromDataField(dataField)
						});
					}
				}
			});
		} else if (
			isAnnotationOfTerm<Identification>(annotationProperty, UIAnnotationTerms.Identification) ||
			isAnnotationOfTerm<StatusInfo>(annotationProperty, UIAnnotationTerms.StatusInfo)
		) {
			annotationProperty?.forEach((dataField: DataFieldAbstractTypes) => {
				if (
					(dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" &&
						formActions.hasOwnProperty(`DataFieldForAction::${dataField.Action}`)) ||
					(dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" &&
						formActions.hasOwnProperty(`DataFieldForIntentBasedNavigation::${dataField.Action}`))
				) {
					if (dataField?.annotations?.UI?.Hidden?.valueOf() === true) {
						hiddenFormActions.push({
							type: ActionType.Default,
							key: KeyHelper.generateKeyFromDataField(dataField)
						});
					}
				}
			});
		}
	}
	return hiddenFormActions;
};

export const getFormActions = (
	facetDefinition: FacetTypes,
	converterContext: ConverterContext<PageContextPathTarget>
): ConfigurableRecord<ManifestAction> => {
	const manifestWrapper = converterContext.getManifestWrapper();
	let targetValue: string, manifestFormContainer: FormManifestConfiguration;
	let actions: ConfigurableRecord<ManifestAction> = {};
	if (facetDefinition?.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
		if (facetDefinition?.Facets) {
			facetDefinition?.Facets.forEach((facet: FacetTypes) => {
				if (isAnnotationOfType<ReferenceFacet>(facet, UIAnnotationTypes.ReferenceFacet)) {
					targetValue = facet?.Target?.value;
					manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
					if (manifestFormContainer?.actions) {
						for (const actionKey in manifestFormContainer.actions) {
							// store the correct facet an action is belonging to for the case it's an inline form action
							manifestFormContainer.actions[actionKey].facetName = facet.fullyQualifiedName;
						}
						actions = mergeFormActions(manifestFormContainer?.actions, actions);
					}
				}
			});
		}
	} else if (facetDefinition?.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
		targetValue = facetDefinition?.Target?.value;
		manifestFormContainer = manifestWrapper.getFormContainer(targetValue);
		if (manifestFormContainer?.actions) {
			for (const actionKey in manifestFormContainer.actions) {
				// store the correct facet an action is belonging to for the case it's an inline form action
				manifestFormContainer.actions[actionKey].facetName = facetDefinition.fullyQualifiedName;
			}
			actions = manifestFormContainer.actions;
		}
	}
	return actions;
};
