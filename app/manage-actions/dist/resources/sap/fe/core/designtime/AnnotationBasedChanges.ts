import type { EntityType, Property } from "@sap-ux/vocabularies-types";
import { TextArrangementType } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { convertTypes } from "sap/fe/core/converters/MetaModelConverter";
import MetaPath from "sap/fe/core/helpers/MetaPath";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import Lib from "sap/ui/core/Lib";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
// OK since we are in designtime we can ignore that dependency
import { hasCurrency, hasUnit, isCurrency, isUnit } from "sap/fe/core/templating/PropertyHelper";
import type Field from "sap/fe/macros/Field";
import type FormElement from "sap/ui/layout/form/FormElement";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import CommonUtils from "sap/fe/core/CommonUtils";
import AnnotationTypes from "sap/ui/rta/plugin/annotations/AnnotationTypes";

const resourceBundleDesigntime = Lib.getResourceBundleFor("sap.fe.core.designtime")!;

export const getText = function (key: string): string {
	return resourceBundleDesigntime.getText(key);
};

type AnnotationChangeReturnType = {
	serviceUrl: string | undefined;
	properties: {
		propertyName: string;
		annotationPath: string;
		currentValue: string;
	}[];
	possibleValues: { key: string; text: string }[];
	preSelectedProperty: string; // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
};

const TEXT_ARRANGEMENT_LABELS = {
	[TextArrangementType.TextOnly]: "Text Only",
	[TextArrangementType.TextFirst]: "Text First",
	[TextArrangementType.TextLast]: "Text Last",
	[TextArrangementType.TextSeparate]: "ID Only"
};

function filterPropertyWithTextAnnotation(prop: Property): boolean {
	return prop.annotations.Common?.Text !== undefined && !hasCurrency(prop) && !hasUnit(prop) && !isCurrency(prop) && !isUnit(prop);
}

/**
 * Collects all properties with a Text annotation from the given entity type and its navigation properties.
 * @param entityType The entity type to start with
 * @param properties The array to collect the properties in
 * @param filterFn A filter function to determine which properties to collect
 * @param visitedEntity A map to keep track of visited entities
 */
function _collectProperties(
	entityType: EntityType,
	properties: { property: Property; entityType: EntityType }[],
	filterFn: (prop: Property) => boolean,
	visitedEntity: Record<string, boolean>
): void {
	if (visitedEntity[entityType.fullyQualifiedName]) {
		return;
	}
	visitedEntity[entityType.fullyQualifiedName] = true;
	properties.push(
		...entityType.entityProperties
			.filter(filterFn)
			.filter((prop) => {
				// Always filter out UI.Hidden = true
				// Always filter out complex type
				if (prop.annotations.UI?.Hidden?.valueOf() === true || !!prop.targetType) {
					return false;
				}
				return true;
			})
			.map((prop: Property) => {
				return {
					property: prop,
					entityType: entityType
				};
			})
	);
}

function collectProperties(
	templateComponent: TemplateComponent,
	control: ManagedObject,
	filterFn: (prop: Property) => boolean
): { property: Property; entityType: EntityType }[] | null {
	const metaModel = templateComponent.getMetaModel();
	const contextPathToUse = templateComponent.getFullContextPath();
	// Find closest building block
	let buildingBlock: ManagedObject | null = control;
	while (buildingBlock && !buildingBlock.isA<BuildingBlock>("sap.fe.core.buildingBlocks.BuildingBlock")) {
		buildingBlock = buildingBlock.getParent();
	}
	let metaPath = contextPathToUse!;
	if (buildingBlock) {
		metaPath = buildingBlock.getProperty("metaPath") ?? contextPathToUse;
	}
	const properties: { property: Property; entityType: EntityType }[] = [];
	if (metaModel && contextPathToUse) {
		let targetEntity: MetaPath<EntityType>;
		try {
			targetEntity = new MetaPath(convertTypes(metaModel), metaPath, contextPathToUse);
		} catch (e) {
			Log.warning(`No metamodel or metaPath is not reachable with ${metaPath} and ${contextPathToUse}`);
			return null;
		}

		const visitedEntity: Record<string, boolean> = {};
		// Collect all properties, don't apply filters
		_collectProperties(targetEntity.getClosestEntityType(), properties, filterFn, visitedEntity);
	}
	return properties;
}

export function getTargetPropertyFromFormElement(oControl: ManagedObject): string | undefined {
	let targetProperty;
	if (oControl.isA<FormElement>("sap.ui.layout.form.FormElement")) {
		const fields = oControl.getFields();
		if (fields?.length > 0 && fields[0].isA<Field>("sap.fe.macros.Field")) {
			const targetObject = fields[0];
			targetProperty = targetObject.getMainPropertyRelativePath();
		}
	}
	return targetProperty;
}

export function getRenameAction(isAtElementLevel = false): {
	changeType: string;
	singleRename: boolean;
	controlBasedRenameChangeType: string;
	title: () => string;
	icon: string;
	type: string;
	delegate: { getAnnotationsChangeInfo: (oControl: ManagedObject, _annotation: string) => AnnotationChangeReturnType | null };
} {
	return {
		changeType: "renameLabel",
		title: (): string => (isAtElementLevel ? getText("RTA_CONTEXT_ACTIONMENU_RENAME") : getText("RTA_CONTEXT_ACTIONMENU_CHANGELABELS")),
		icon: "sap-icon://edit",
		singleRename: isAtElementLevel,
		controlBasedRenameChangeType: "renameField",
		type: AnnotationTypes.StringType,
		delegate: {
			getAnnotationsChangeInfo: (oControl: ManagedObject, _annotation: string): AnnotationChangeReturnType | null => {
				let templateComponent = Component.getOwnerComponentFor(oControl) as TemplateComponent | undefined;
				if (!templateComponent) {
					const view = CommonUtils.getTargetView(oControl);
					templateComponent = view?.getController().getOwnerComponent() as TemplateComponent | undefined;
				}
				if (templateComponent) {
					let targetProperty: Property | undefined;
					const properties = collectProperties(templateComponent, oControl, () => true);
					const targetPropertyPath = getTargetPropertyFromFormElement(oControl);
					if (targetPropertyPath) {
						targetProperty = properties?.find((prop) => {
							return prop.property.name === targetPropertyPath;
						})?.property;
					}

					if (properties && properties.length > 0) {
						return {
							serviceUrl: (oControl.getModel() as ODataModel | undefined)?.getServiceUrl(),
							properties: properties.map((prop: { property: Property; entityType: EntityType }) => {
								return {
									propertyName: `${prop.property.name}`,
									annotationPath:
										"/" +
										prop.entityType.fullyQualifiedName +
										"/" +
										prop.property.name +
										"@com.sap.vocabularies.Common.v1.Label",
									currentValue: prop.property.annotations.Common?.Label?.toString() ?? prop.property.name
								};
							}),
							possibleValues: [],
							preSelectedProperty: targetProperty
								? "/" + targetProperty.fullyQualifiedName + "@com.sap.vocabularies.Common.v1.Label"
								: "" // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
						};
					}
				}
				return null;
			}
		}
	};
}

export function getTextArrangementChangeAction(key = "RTA_CONTEXT_ACTIONMENU_TEXTARRANGE"): {
	changeType: string;
	title: () => string;
	type: string;
	delegate: { getAnnotationsChangeInfo: (oControl: ManagedObject, _annotation: string) => AnnotationChangeReturnType | null };
} {
	return {
		changeType: "textArrangement_Test",
		title: (): string => getText(key),
		type: AnnotationTypes.ValueListType,
		delegate: {
			getAnnotationsChangeInfo: (oControl: ManagedObject, _annotation: string): AnnotationChangeReturnType | null => {
				let templateComponent = Component.getOwnerComponentFor(oControl) as TemplateComponent | undefined;
				if (!templateComponent) {
					const view = CommonUtils.getTargetView(oControl);
					templateComponent = view?.getController().getOwnerComponent() as TemplateComponent | undefined;
				}
				if (templateComponent) {
					const properties = collectProperties(templateComponent, oControl, filterPropertyWithTextAnnotation);
					if (properties && properties.length > 0) {
						return {
							serviceUrl: (oControl.getModel() as ODataModel | undefined)?.getServiceUrl(),
							properties: properties.map((prop: { property: Property; entityType: EntityType }) => {
								const defaultType =
									prop.entityType.annotations.UI?.TextArrangement?.toString() ?? TextArrangementType.TextFirst.toString();
								return {
									propertyName: prop.property.annotations.Common?.Label?.toString() ?? prop.property.name,
									annotationPath:
										"/" +
										prop.entityType.fullyQualifiedName +
										"/" +
										prop.property.name +
										"@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement",
									currentValue:
										prop.property.annotations.Common?.Text?.annotations?.UI?.TextArrangement?.toString() ?? defaultType
								};
							}),
							possibleValues: Object.keys(TEXT_ARRANGEMENT_LABELS).map((sKey) => ({
								key: sKey,
								text: TEXT_ARRANGEMENT_LABELS[sKey as unknown as keyof typeof TEXT_ARRANGEMENT_LABELS]
							})),
							preSelectedProperty: "" // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
						};
					}
				}
				return null;
			}
		}
	};
}
