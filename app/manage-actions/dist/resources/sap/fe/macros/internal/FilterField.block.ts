import type { Property } from "@sap-ux/vocabularies-types";
import type { PropertyAnnotations_Common } from "@sap-ux/vocabularies-types/vocabularies/Common_Edm";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, constant, formatResult } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { SAP_UI_MODEL_CONTEXT, xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getMaxConditions } from "sap/fe/core/converters/controls/ListReport/FilterField";
import type { VisualFilters } from "sap/fe/core/converters/controls/ListReport/VisualFilters";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import {
	getContextRelativeTargetObjectPath,
	getTargetObjectPath,
	type DataModelObjectPath
} from "sap/fe/core/templating/DataModelPathHelper";
import { getRelativePropertyPath } from "sap/fe/core/templating/PropertyFormatters";
import { getAssociatedExternalIdPropertyPath } from "sap/fe/core/templating/PropertyHelper";
import { getDisplayMode, type ComputedAnnotationInterface, type MetaModelContext } from "sap/fe/core/templating/UIFormatters";
import CommonHelper from "sap/fe/macros/CommonHelper";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import {
	constraints,
	formatOptions,
	getConditionsBinding,
	getDataType,
	getPlaceholder,
	isRequiredInFilter
} from "sap/fe/macros/filter/FilterFieldHelper";
import { getFilterFieldDisplayFormat } from "sap/fe/macros/filter/FilterFieldTemplating";
import ExtendedSemanticDateOperators from "sap/fe/macros/filterBar/ExtendedSemanticDateOperators";
import type Context from "sap/ui/model/Context";
import type MetaModel from "sap/ui/model/MetaModel";

/**
 * Building block for creating a Filter Field based on the metadata provided by OData V4.
 * <br>
 * It is designed to work based on a property context(property) pointing to an entity type property
 * needed to be used as filterfield and entityType context(contextPath) to consider the relativity of
 * the propertyPath of the property wrt entityType.
 *
 * Usage example:
 * <pre>
 * &lt;macros:FilterField id="MyFilterField" property="CompanyName" /&gt;
 * </pre>
 * @private
 */
@defineBuildingBlock({
	name: "FilterField",
	namespace: "sap.fe.macros.internal"
})
export default class FilterFieldBlock extends BuildingBlockTemplatingBase {
	/**
	 * Defines the metadata path to the property.
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		isPublic: true
	})
	property!: Context;

	/**
	 * Metadata path to the entitySet or navigationProperty
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		isPublic: true
	})
	contextPath!: Context;

	/**
	 * Visual filter settings for filter field.
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true
	})
	visualFilter?: Context | VisualFilters;

	/**
	 * A prefix that is added to the generated ID of the filter field.
	 */
	@blockAttribute({
		type: "string",
		isPublic: true
	})
	idPrefix = "FilterField";

	/**
	 * A prefix that is added to the generated ID of the value help used for the filter field.
	 */
	@blockAttribute({
		type: "string",
		isPublic: true
	})
	vhIdPrefix = "FilterFieldValueHelp";

	/**
	 * Specifies the Sematic Date Range option for the filter field.
	 */
	@blockAttribute({
		type: "boolean",
		isPublic: true
	})
	useSemanticDateRange = true;

	/**
	 * Settings from the manifest.
	 */
	@blockAttribute({
		type: "string",
		isPublic: true
	})
	settings = "";

	/**
	 * Speficies the enablement of the filter field.
	 */
	@blockAttribute({
		type: "string",
		isPublic: false
	})
	editMode?: string;

	/***********************************************
	 *            INTERNAL ATTRIBUTES              *
	 **********************************************/

	/**
	 * Control Id for MDC filter field used inside.
	 */
	controlId!: string;

	/**
	 * Property key for filter field.
	 */
	propertyKey!: string;

	/**
	 * Source annotation path of the property.
	 */
	sourcePath!: string;

	/**
	 * Source annotation path of the property.
	 */
	documentRefText?: string;

	/**
	 * Label for filterfield.
	 */
	label!: string;

	/**
	 * Data Type of the filter field.
	 */
	dataType!: string;

	/**
	 * Maximum conditions that can be added to the filter field.
	 */
	maxConditions!: number;

	/**
	 * Value Help id as association for the filter field.
	 */
	valueHelpProperty?: string;

	/**
	 * Binding path for conditions added to filter field.
	 */
	conditionsBinding!: string;

	/**
	 * Datatype constraints of the filter field.
	 */
	dataTypeConstraints?: string;

	/**
	 * Datatype format options of the filter field.
	 */
	dataTypeFormatOptions?: string;

	/**
	 * To specify filter field is mandatory for filtering.
	 */
	required!: boolean;

	/**
	 * Valid operators for the filter field.
	 */
	operators?: string;

	/**
	 * Visual Filter id to be used.
	 */
	vfId?: string;

	/**
	 * Visual Filter building block id to be used.
	 */
	vfRuntimeId?: string;

	/**
	 * Visual Filter is expected.
	 */
	vfEnabled!: boolean;

	/**
	 * Property used is filterable
	 */
	isFilterable!: boolean;

	/**
	 * Property for placeholder
	 */
	placeholder?: string;

	/**
	 * Property to hold promise for display
	 */
	display?: Promise<string | undefined>;

	propertyExternalId?: Context;

	constructor(props: PropertiesOf<FilterFieldBlock>, configuration: unknown, settings: TemplateProcessorSettings) {
		super(props, configuration, settings);

		const propertyConverted = MetaModelConverter.convertMetaModelContext(this.property) as Property;

		const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(propertyConverted) as string;
		if (externalIdPropertyPath) {
			this.propertyExternalId = this.property
				.getModel()
				.createBindingContext(this.property.getPath().replace(propertyConverted.name, externalIdPropertyPath), this.property);
		}

		const propertyConvertedExternalId = this.propertyExternalId
			? (MetaModelConverter.convertMetaModelContext(this.propertyExternalId) as Property)
			: undefined;

		const dataModelPath = MetaModelConverter.getInvolvedDataModelObjects<Property>(this.property, this.contextPath);

		// Property settings
		const propertyName = propertyConverted.name,
			originalPropertyName = propertyConverted.name,
			fixedValues =
				!!propertyConvertedExternalId?.annotations?.Common?.ValueListWithFixedValues ||
				!!propertyConverted.annotations?.Common?.ValueListWithFixedValues;

		this.controlId = this.idPrefix && generate([this.idPrefix, originalPropertyName]);
		this.sourcePath = getTargetObjectPath(dataModelPath);

		type PropertyAnnotations_Common_extended = PropertyAnnotations_Common & { DocumentationRef?: string };
		this.documentRefText = (
			dataModelPath.targetObject?.annotations.Common as PropertyAnnotations_Common_extended
		)?.DocumentationRef?.toString();

		this.dataType = getDataType(propertyConvertedExternalId || propertyConverted); // data type for LR-FilterBar condition of the value help
		const labelTerm = propertyConverted?.annotations?.Common?.Label;
		const labelExpression = labelTerm?.toString() ?? constant(propertyName);
		this.label = compileExpression(labelExpression) || propertyName;
		this.conditionsBinding = getConditionsBinding(dataModelPath) || "";
		this.placeholder = getPlaceholder(propertyConverted);
		this.propertyKey = getContextRelativeTargetObjectPath(dataModelPath, false, true) || propertyName;
		// Visual Filter settings
		this.vfEnabled = !!this.visualFilter && !(this.idPrefix && this.idPrefix.includes("Adaptation"));
		this.vfId = this.vfEnabled ? generate([this.idPrefix, propertyName, "VisualFilter"]) : undefined;
		this.vfRuntimeId = this.vfEnabled ? generate([this.idPrefix, propertyName, "VisualFilterContainer"]) : undefined;

		//-----------------------------------------------------------------------------------------------------//
		// TODO: need to change operations from MetaModel to Converters.
		// This mainly included changing changing getFilterRestrictions operations from metaModel to converters
		const propertyContext = this.property,
			model: MetaModel = propertyContext.getModel(),
			vhPropertyPath: string = FieldHelper.valueHelpPropertyForFilterField(propertyContext),
			filterable = CommonHelper.isPropertyFilterable(propertyContext),
			propertyObject = propertyContext.getObject(),
			propertyInterface = { context: propertyContext } as ComputedAnnotationInterface;

		this.display = getFilterFieldDisplayFormat(dataModelPath, propertyConverted, propertyInterface);
		this.isFilterable = !(filterable === false || filterable === "false");
		this.maxConditions = getMaxConditions(dataModelPath);
		this.dataTypeConstraints = constraints(propertyObject, propertyInterface);
		this.dataTypeFormatOptions = formatOptions(propertyObject, propertyInterface);
		this.required = isRequiredInFilter(propertyObject, propertyInterface);
		this.operators = FieldHelper.operators(
			propertyContext,
			propertyObject,
			this.useSemanticDateRange,
			this.settings || "",
			this.contextPath.getPath()
		);
		if (this.operators) {
			// Extended operators are not added by default.
			// We add them to MDC filter environment.
			ExtendedSemanticDateOperators.addExtendedFilterOperators(this.operators.split(","));
		}
		// Value Help settings
		// TODO: This needs to be updated when VH macro is converted to 2.0
		const vhProperty = model.createBindingContext(vhPropertyPath) as Context;
		const vhPropertyObject = vhProperty.getObject() as MetaModelContext,
			vhPropertyInterface = { context: vhProperty },
			relativeVhPropertyPath = getRelativePropertyPath(vhPropertyObject, vhPropertyInterface),
			relativePropertyPath = getRelativePropertyPath(propertyObject, propertyInterface);
		this.valueHelpProperty = FieldHelper.getValueHelpPropertyForFilterField(
			propertyContext,
			propertyObject,
			propertyObject.$Type,
			this.vhIdPrefix,
			dataModelPath.targetEntityType.name,
			relativePropertyPath,
			relativeVhPropertyPath,
			fixedValues,
			this.useSemanticDateRange
		);

		//-----------------------------------------------------------------------------------------------------//
	}

	getVisualFilterContent(): string {
		let visualFilterObject = this.visualFilter,
			vfXML = "";
		if (!this.vfEnabled || !visualFilterObject) {
			return vfXML;
		}
		if ((visualFilterObject as Context)?.isA?.(SAP_UI_MODEL_CONTEXT)) {
			visualFilterObject = (visualFilterObject as Context).getObject() as VisualFilters;
		}

		const {
			contextPath,
			presentationAnnotation,
			outParameter,
			inParameters,
			valuelistProperty,
			selectionVariantAnnotation,
			multipleSelectionAllowed,
			required,
			requiredProperties = [],
			showOverlayInitially,
			renderLineChart,
			isValueListWithFixedValues
		} = visualFilterObject as VisualFilters;
		vfXML = xml`
				<visualFilter:VisualFilter
				    xmlns:visualFilter= "sap.fe.macros.visualfilters"
					id="${this.vfRuntimeId}"
					_contentId="${this.vfId}"
					contextPath="${contextPath}"
					metaPath="${presentationAnnotation}"
					outParameter="${outParameter}"
					inParameters="${CommonHelper.stringifyCustomData(inParameters)}"
					valuelistProperty="${valuelistProperty}"
					selectionVariantAnnotation="${selectionVariantAnnotation}"
					multipleSelectionAllowed="${multipleSelectionAllowed}"
					required="${required}"
					requiredProperties="${CommonHelper.stringifyCustomData(requiredProperties)}"
					showOverlayInitially="${showOverlayInitially}"
					renderLineChart="${renderLineChart}"
					isValueListWithFixedValues="${isValueListWithFixedValues}"
					filterBarEntityType="${contextPath}"
				/>
			`;

		return vfXML;
	}

	async getTemplate(): Promise<string> {
		let xmlRet = ``;
		if (this.isFilterable) {
			let display;
			const companionTextAvailable = this.documentRefText === undefined || null ? false : true;
			const formattedResult: CompiledBindingToolkitExpression = compileExpression(
				formatResult([this.documentRefText], "sap.fe.core.formatters.StandardFormatter#asArray")
			);
			try {
				const dataModelPathExternalId =
					this.propertyExternalId && MetaModelConverter.getInvolvedDataModelObjects(this.propertyExternalId, this.contextPath);
				display = dataModelPathExternalId
					? getDisplayMode(dataModelPathExternalId as DataModelObjectPath<Property>)
					: await this.display;
			} catch (err: unknown) {
				Log.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${err}`);
			}
			xmlRet = xml`
				<mdc:FilterField
					xmlns:mdc="sap.ui.mdc"
					xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
					xmlns:macro="sap.fe.macros"
					xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:fieldhelp="sap.ui.core.fieldhelp"
					customData:sourcePath="${this.sourcePath}"
					id="${this.controlId}"
					delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate', payload:{isFilterField:true}}"
					propertyKey="${this.propertyKey}"
					label="${this.label}"
					dataType="${this.dataType}"
					display="${display}"
					maxConditions="${this.maxConditions}"
					valueHelp="${this.valueHelpProperty}"
					conditions="${this.conditionsBinding}"
					dataTypeConstraints="${this.dataTypeConstraints}"
					dataTypeFormatOptions="${this.dataTypeFormatOptions}"
					required="${this.required}"
					operators="${this.operators}"
					placeholder="${this.placeholder}"
					${this.attr("editMode", this.editMode)}
				>
					${
						companionTextAvailable
							? xml`
						<mdc:customData>
							<fieldhelp:FieldHelpCustomData
								${this.attr("value", formattedResult)}
							/>
						</mdc:customData>
					`
							: ""
					}
					${this.vfEnabled ? this.getVisualFilterContent() : ""}
				</mdc:FilterField>
			`;
		}

		return xmlRet;
	}
}
