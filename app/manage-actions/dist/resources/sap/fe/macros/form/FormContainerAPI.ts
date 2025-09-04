import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import Field from "sap/fe/macros/Field";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import Label from "sap/m/Label";
import type Control from "sap/ui/core/Control";
import InvisibleText from "sap/ui/core/InvisibleText";
import ColumnElementData from "sap/ui/layout/form/ColumnElementData";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type FormElement from "sap/ui/layout/form/FormElement";
import type mdcField from "sap/ui/mdc/Field";
import MacroAPI from "../MacroAPI";

/**
 * @alias sap.fe.macros.form.FormContainerAPI
 * @private
 */
@defineUI5Class("sap.fe.macros.form.FormContainerAPI")
class FormContainerAPI extends MacroAPI {
	/**
	 * The identifier of the form container control.
	 * @public
	 */
	@property({ type: "string" })
	formContainerId!: string;

	@property({ type: "boolean" })
	showDetails = false;

	static isDependentBound = true;

	constructor(props?: PropertiesOf<FormContainerAPI>) {
		super(props);
		this.setParentBindingContext("internal", `controls/${this.formContainerId}`);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 * @param ownerComponent
	 */
	onMetadataAvailable(ownerComponent: TemplateComponent): void {
		const view = ownerComponent.getRootController()?.getView();
		if (!view) {
			return;
		}
		let formContainer = view.byId(this.formContainerId) as FormContainer | undefined;
		if (formContainer) {
			this.setFormElementsInvisibleTextsToStatic(formContainer);
		} else {
			view.attachEventOnce(
				"afterRendering",
				function (this: FormContainerAPI): void {
					formContainer = view.byId(this.formContainerId) as FormContainer | undefined;
					if (formContainer) {
						this.setFormElementsInvisibleTextsToStatic(formContainer);
					}
				}.bind(this)
			);
		}
	}

	/**
	 * Sets the Invisible Texts to static.
	 * @param formContainer FormContainer control.
	 */
	setFormElementsInvisibleTextsToStatic(formContainer: FormContainer): void {
		const formElements = formContainer.getFormElements();
		formElements.forEach((formElement: FormElement) => {
			const dependents = formElement.getDependents();
			dependents.forEach((dependent) => {
				if (dependent.isA<InvisibleText>("sap.ui.core.InvisibleText")) {
					dependent.toStatic();
				}
			});
		});
	}

	/**
	 * Sets the InvisibleText when the TextArea Label is hidden.
	 * @param formElement FormElement control.
	 * @param field Field control.
	 */
	static setInvisibleTextWhereTextAreaLabelIsHidden(formElement: FormElement, field: mdcField): void {
		formElement.addDependent(new InvisibleText(generate([field.getId(), "FormElementAriaText"]), { text: formElement.getLabel() }));
		formElement.setLabel(
			new Label(generate([field.getId(), "FormElementLabel"]), {
				text: formElement.getLabel(),
				visible: false,
				layoutData: new ColumnElementData({ cellsLarge: 12 })
			})
		);
		field.addAriaLabelledBy(generate([field.getId(), "FormElementAriaText"]));
	}

	/**
	 * Sets the TextArea Label's Visibility.
	 * @param formContainer FormContainer control.
	 */
	static setTextAreaLabelVisibility(formContainer: FormContainer): void {
		const allFormElements = formContainer.getFormElements();
		const formElements = allFormElements.filter((formElement) => formElement.getVisible());
		if (formElements.length === 1) {
			const fields = formElements[0].getFields();
			if (fields.length === 1) {
				const control = Field.getControlInFieldWrapper((fields[0] as mdcField).getContent());
				const isTextArea = control?.isA("sap.fe.macros.field.TextAreaEx");
				const isRequired = (fields[0] as mdcField).getRequired() === true;
				const pageMode = (control?.getParent() as FieldWrapper).editMode;
				if (isTextArea && isRequired && pageMode !== "Display") {
					(formElements[0].getLabelControl() as unknown as Control).setVisible(true);
				}
				if (pageMode === "Display") {
					(formElements[0].getLabelControl() as unknown as Control).setVisible(false);
				}
				const textAreaLabelVisibility = (formElements[0].getLabelControl() as unknown as Control).getVisible();
				const dependents = formElements[0].getDependents();
				const isInvisibleTextAdded = dependents.find((dependent) => dependent.isA<InvisibleText>("sap.ui.core.InvisibleText"));
				if (!textAreaLabelVisibility && !isInvisibleTextAdded) {
					this.setInvisibleTextWhereTextAreaLabelIsHidden(formElements[0], fields[0] as mdcField);
				}
			}
		}
	}

	@xmlEventHandler()
	toggleDetails(): void {
		this.showDetails = !this.showDetails;
	}
}

export default FormContainerAPI;
