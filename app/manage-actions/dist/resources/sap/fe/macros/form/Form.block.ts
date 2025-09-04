import { CommunicationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	CollectionFacet,
	DataField,
	FacetTypes,
	FieldGroupType,
	Identification,
	ReferenceFacet
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, equal, getExpressionFromAnnotation, ifElse, resolveBindingString } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import {
	blockAggregation,
	blockAttribute,
	blockEvent,
	defineBuildingBlock
} from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { hasFieldGroupTarget, hasIdentificationTarget } from "sap/fe/core/converters/annotations/DataField";
import type { FormContainer } from "sap/fe/core/converters/controls/Common/Form";
import { createFormDefinition } from "sap/fe/core/converters/controls/Common/Form";
import { getFormContainerID } from "sap/fe/core/converters/helpers/ID";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import { getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import FormHelper from "sap/fe/macros/form/FormHelper";
import { TitleLevel } from "sap/ui/core/library";
import type { $ColumnLayoutSettings } from "sap/ui/layout/form/ColumnLayout";
import type { $ResponsiveGridLayoutSettings } from "sap/ui/layout/form/ResponsiveGridLayout";
import type Context from "sap/ui/model/Context";
import AnnotationHelper from "sap/ui/model/odata/v4/AnnotationHelper";

type ColumnLayout = $ColumnLayoutSettings & {
	type: "ColumnLayout";
};
type ResponsiveGridLayout = $ResponsiveGridLayoutSettings & {
	type: "ResponsiveGridLayout";
};
type FormLayoutInformation = ColumnLayout | ResponsiveGridLayout;

/**
 * Building block for creating a Form based on the metadata provided by OData V4.
 * <br>
 * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
 * </pre>
 * @alias sap.fe.macros.Form
 * @public
 */
@defineBuildingBlock({
	name: "Form",
	namespace: "sap.fe.macros.internal",
	publicNamespace: "sap.fe.macros",
	returnTypes: ["sap.fe.macros.form.FormAPI"]
})
export default class FormBlock extends BuildingBlockTemplatingBase {
	/**
	 * The identifier of the form control.
	 */
	@blockAttribute({ type: "string", isPublic: true, required: true })
	id!: string;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		required: true,
		isPublic: true,
		expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
	})
	contextPath!: Context;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@blockAttribute({
		type: "sap.ui.model.Context",
		isPublic: true,
		required: true,
		expectedAnnotationTypes: [
			"com.sap.vocabularies.UI.v1.FieldGroupType",
			"com.sap.vocabularies.UI.v1.CollectionFacet",
			"com.sap.vocabularies.UI.v1.ReferenceFacet"
		],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	metaPath!: Context;

	/**
	 * The manifest defined form containers to be shown in the action area of the table
	 */
	@blockAttribute({ type: "array" })
	formContainers?: FormContainer[];

	/**
	 * Control the rendering of the form container labels
	 */
	@blockAttribute({ type: "boolean" })
	useFormContainerLabels?: boolean;

	/**
	 * Toggle Preview: Part of Preview / Preview via 'Show More' Button
	 */
	@blockAttribute({ type: "boolean" })
	partOfPreview = true;

	/**
	 * The title of the form control.
	 * @public
	 */
	@blockAttribute({ type: "string", isPublic: true })
	title?: string;

	/**
	 * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
	 */
	@blockAttribute({ type: "sap.ui.core.TitleLevel", isPublic: true })
	titleLevel: TitleLevel = TitleLevel.Auto;

	/**
	 * Property added to associate the superordinate title
	 */
	@blockAttribute({ type: "string" })
	public ariaLabelledBy?: string;

	@blockAttribute({ type: "string" })
	displayMode?: CompiledBindingToolkitExpression;

	/**
	 * 	If set to false, the Form is not rendered.
	 */
	@blockAttribute({ type: "string" })
	isVisible = "true";
	// Independent from the form title, can be a bit confusing in standalone usage at is not showing anything by default

	// Just proxied down to the Field may need to see if needed or not
	@blockEvent()
	onChange?: string;

	@blockAggregation({ type: "sap.fe.macros.form.FormElement", isPublic: true, slot: "formElements", isDefault: true })
	formElements?: object[];

	/**
	 * Defines the layout to be used within the form.
	 * It defaults to the ColumnLayout, but you can also use a ResponsiveGridLayout.
	 * All the properties of the ResponsiveGridLayout can be added to the configuration.
	 */
	@blockAttribute({ type: "object", isPublic: true })
	layout: FormLayoutInformation = { type: "ColumnLayout", columnsM: 3, columnsXL: 6, columnsL: 4, labelCellsLarge: 12 };

	// Useful for our dynamic thing but also depends on the metadata -> make sure this is taken into account
	_editable: CompiledBindingToolkitExpression;

	_apiId: string;

	_contentId: string;

	facetType?: string;

	constructor(props: PropertiesOf<FormBlock>, configuration: unknown, mSettings: TemplateProcessorSettings) {
		super(props, configuration, mSettings);
		if (this.metaPath && this.contextPath && (this.formContainers === undefined || this.formContainers === null)) {
			const oContextObjectPath = getInvolvedDataModelObjects<FieldGroupType | CollectionFacet | ReferenceFacet>(
				this.metaPath,
				this.contextPath
			);
			const mExtraSettings: Record<string, unknown> = {};
			let oFacetDefinition = oContextObjectPath.targetObject;
			let hasFieldGroup = false;
			if (oFacetDefinition && oFacetDefinition.$Type === UIAnnotationTypes.FieldGroupType) {
				// Wrap the facet in a fake Facet annotation
				hasFieldGroup = true;
				oFacetDefinition = {
					$Type: UIAnnotationTypes.ReferenceFacet,
					Label: oFacetDefinition.Label,
					Target: {
						$target: oFacetDefinition,
						fullyQualifiedName: oFacetDefinition.fullyQualifiedName,
						path: "",
						term: "",
						type: "AnnotationPath",
						value: getContextRelativeTargetObjectPath(oContextObjectPath)
					},
					annotations: {},
					fullyQualifiedName: oFacetDefinition.fullyQualifiedName
				} as unknown as ReferenceFacet;
				mExtraSettings[oFacetDefinition.Target.value] = { fields: this.formElements };
			}

			const oConverterContext = this.getConverterContext(
				oContextObjectPath,
				/*this.contextPath*/ undefined,
				mSettings,
				mExtraSettings
			);
			const oFormDefinition = createFormDefinition(oFacetDefinition, this.isVisible, oConverterContext);
			if (hasFieldGroup) {
				oFormDefinition.formContainers[0].annotationPath = this.metaPath.getPath();
			}
			this.formContainers = oFormDefinition.formContainers;
			this.useFormContainerLabels = oFormDefinition.useFormContainerLabels;
			this.facetType = oFacetDefinition && (oFacetDefinition.$Type as string);
		} else {
			this.facetType = this.metaPath.getObject()?.$Type;
		}

		if (!this.isPublic) {
			this._apiId = this.createId("Form")!;
			this._contentId = this.id;
		} else {
			this._apiId = this.id;
			this._contentId = `${this.id}-content`;
		}
		// if displayMode === true -> _editable = false
		// if displayMode === false -> _editable = true
		//  => if displayMode === {myBindingValue} -> _editable = {myBindingValue} === true ? true : false
		// if DisplayMode === undefined -> _editable = {ui>/isEditable}
		if (this.displayMode !== undefined) {
			this._editable = compileExpression(ifElse(equal(resolveBindingString(this.displayMode, "boolean"), false), true, false));
		} else {
			this._editable = compileExpression(UI.IsEditable);
		}
	}

	getDataFieldCollection(formContainer: FormContainer, facetContext: Context): string {
		const facet = getInvolvedDataModelObjects(facetContext).targetObject as FacetTypes;
		let navigationPath;
		let idPart;
		if (facet.$Type === UIAnnotationTypes.ReferenceFacet) {
			navigationPath = AnnotationHelper.getNavigationPath(facet.Target.value);
			idPart = facet;
		} else {
			const contextPathPath = this.contextPath.getPath();
			let facetPath = facetContext.getPath();
			if (facetPath.startsWith(contextPathPath)) {
				facetPath = facetPath.substring(contextPathPath.length);
				if (facetPath.charAt(0) === "/") {
					facetPath = facetPath.slice(1);
				}
			}
			navigationPath = AnnotationHelper.getNavigationPath(facetPath);
			idPart = facetPath;
		}
		const titleLevel = FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel);
		const title = this.useFormContainerLabels && facet.Label ? getExpressionFromAnnotation(facet.Label) : "";

		const id = this.id ? getFormContainerID(idPart) : undefined;

		return xml`
					<macro:FormContainer
					xmlns:macro="sap.fe.macros"
					${this.attr("id", id)}
					title="${title}"
					titleLevel="${titleLevel}"
					contextPath="${navigationPath ? formContainer.entitySet : this.contextPath}"
					metaPath="${facetContext}"
					dataFieldCollection="${formContainer.formElements}"
					navigationPath="${navigationPath}"
					visible="${formContainer.isVisible}"
					displayMode="${this.displayMode}"
					onChange="${this.onChange}"
					actions="${formContainer.actions}"
					useSingleTextAreaFieldAsNotes="${formContainer.useSingleTextAreaFieldAsNotes}"
					hasUiHiddenAnnotation="${formContainer.annotationHidden}"
				>
				<macro:formElements>
					<slot name="formElements" />
				</macro:formElements>
			</macro:FormContainer>`;
	}

	getFormContainers(): string | string[] {
		if (this.formContainers!.length === 0) {
			return "";
		}
		if (this.facetType?.includes("com.sap.vocabularies.UI.v1.CollectionFacet")) {
			return this.formContainers!.map((formContainer, formContainerIdx) => {
				if (formContainer.isVisible) {
					const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
					const facet = facetContext.getObject();
					if (
						facet.$Type === UIAnnotationTypes.ReferenceFacet &&
						FormHelper.isReferenceFacetPartOfPreview(facet, this.partOfPreview)
					) {
						if (facet.Target.$AnnotationPath.$Type === CommunicationAnnotationTypes.AddressType) {
							return xml`<template:with path="formContainers>${formContainerIdx}" var="formContainer">
											<template:with path="formContainers>${formContainerIdx}/annotationPath" var="facet">
												<core:Fragment fragmentName="sap.fe.macros.form.AddressSection" type="XML" />
											</template:with>
										</template:with>`;
						}
						return this.getDataFieldCollection(formContainer, facetContext);
					}
				}
				return "";
			});
		} else if (this.facetType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
			return this.formContainers!.map((formContainer) => {
				if (formContainer.isVisible) {
					const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
					return this.getDataFieldCollection(formContainer, facetContext);
				} else {
					return "";
				}
			});
		}
		return "";
	}

	/**
	 * @returns True if a textarea is alone in a form
	 */
	checkIfTextAreaIsAlone(): boolean {
		if (this.formContainers!.length === 1) {
			if (this.formContainers![0].formElements.length === 1) {
				const facet = getInvolvedDataModelObjects(
					this.contextPath.getModel().createBindingContext(this.formContainers![0].annotationPath, this.contextPath)
				).targetObject as FieldGroupType | ReferenceFacet;
				let fieldGroup: FieldGroupType | undefined;
				let identification: Identification | undefined;
				// This is only for macros:form with a FieldGroup that contains only a TextArea
				if (facet.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
					fieldGroup = facet;
				} else if (hasFieldGroupTarget(facet)) {
					fieldGroup = facet?.Target?.$target as FieldGroupType;
				} else if (hasIdentificationTarget(facet)) {
					identification = facet?.Target?.$target as Identification;
				}

				if (fieldGroup?.Data.length === 1) {
					return (fieldGroup.Data[0] as DataField)?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
				}

				if (identification?.length === 1) {
					return (identification[0] as DataField)?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
				}
			}
		}
		return false;
	}

	/**
	 * Create the proper layout information based on the `layout` property defined externally.
	 * @param isTextAreaAlone Whether the section contains a lonely TextArea inside
	 * @returns The layout information for the xml.
	 */
	getLayoutInformation(isTextAreaAlone: boolean): string {
		switch (this.layout.type) {
			case "ResponsiveGridLayout":
				return xml`<f:ResponsiveGridLayout adjustLabelSpan="${this.layout.adjustLabelSpan}"
													breakpointL="${this.layout.breakpointL}"
													breakpointM="${this.layout.breakpointM}"
													breakpointXL="${this.layout.breakpointXL}"
													columnsL="${isTextAreaAlone ? 1 : this.layout.columnsL}"
													columnsM="${isTextAreaAlone ? 1 : this.layout.columnsM}"
													columnsXL="${isTextAreaAlone ? 1 : this.layout.columnsXL}"
													emptySpanL="${this.layout.emptySpanL}"
													emptySpanM="${this.layout.emptySpanM}"
													emptySpanS="${this.layout.emptySpanS}"
													emptySpanXL="${this.layout.emptySpanXL}"
													labelSpanL="${this.layout.labelSpanL}"
													labelSpanM="${this.layout.labelSpanM}"
													labelSpanS="${this.layout.labelSpanS}"
													labelSpanXL="${this.layout.labelSpanXL}"
													singleContainerFullSize="${this.layout.singleContainerFullSize}" />`;
			case "ColumnLayout":
			default:
				return xml`<f:ColumnLayout
								columnsM="${isTextAreaAlone ? 1 : this.layout.columnsM}"
								columnsL="${isTextAreaAlone ? 1 : this.layout.columnsL}"
								columnsXL="${isTextAreaAlone ? 1 : this.layout.columnsXL}"
								labelCellsLarge="${this.layout.labelCellsLarge}"
								emptyCellsLarge="${this.layout.emptyCellsLarge}" />`;
		}
	}

	getTemplate(): string {
		const onChangeStr = (this.onChange && this.onChange.replace("{", "\\{").replace("}", "\\}")) || "";
		const metaPathPath = this.metaPath.getPath();
		const contextPathPath = this.contextPath.getPath();
		const contextObjectPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
		const entitySet =
			contextObjectPath.contextLocation?.targetEntitySet?._type === "EntitySet" ? "{contextPath>@sapui.name}" : undefined;
		const isTextAreaAlone = this.checkIfTextAreaIsAlone();

		if (!this.isVisible) {
			return "";
		} else {
			return xml`<macro:FormAPI xmlns:macro="sap.fe.macros.form"
					xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:f="sap.ui.layout.form"
					xmlns:fl="sap.ui.fl"
					xmlns:dt="sap.ui.dt"
					xmlns:coreControls="sap.fe.core.controls"
					id="${this._apiId}"
					metaPath="${metaPathPath}"
					contextPath="${contextPathPath}">
				<f:Form
					fl:delegate='{
						"name": "sap/fe/macros/form/FormDelegate",
						"delegateType": "complete"
					}'
					dt:designtime="sap/fe/macros/form/Form.designtime"
					id="${this._contentId}"
					editable="${this._editable}"
					macrodata:entitySet="${entitySet}"
					visible="${this.isVisible}"
					class="sapUxAPObjectPageSubSectionAlignContent"
					macrodata:navigationPath="${contextPathPath}"
					macrodata:onChange="${onChangeStr}"
					ariaLabelledBy="${this.ariaLabelledBy}"
				>
					${this.addConditionally(
						this.title !== undefined,
						xml`<f:title>
							<core:Title level="${this.titleLevel}" text="${this.title}" />
						</f:title>`
					)}
					<f:layout>
					${this.getLayoutInformation(isTextAreaAlone)}

					</f:layout>
					<f:formContainers>
						${this.getFormContainers()}
					</f:formContainers>
					<f:dependents>
						<coreControls:HideFormGroupAutomatically />
					</f:dependents>
				</f:Form>
			</macro:FormAPI>`;
		}
	}
}
