import type { Property } from "@sap-ux/vocabularies-types";
import type {
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldWithNavigationPath,
	DataPointTypeTypes,
	OperationGroupingType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression } from "sap/fe/base/BindingToolkit";
import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, event, mixin, property, xmlEventHandler } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type { XMLPreprocessorContext } from "sap/fe/core/TemplateComponent";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import { Activity } from "sap/fe/core/controllerextensions/collaboration/CollaborationCommon";
import type FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { getContextRelativeTargetObjectPath, type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type Contact from "sap/fe/macros/contact/Contact";
import type BuildingBlockObjectProperty from "sap/fe/macros/controls/BuildingBlockObjectProperty";
import type FieldWrapper from "sap/fe/macros/controls/FieldWrapper";
import type TextLink from "sap/fe/macros/controls/TextLink";
import FieldRuntime from "sap/fe/macros/field/FieldRuntime";
import { getDataModelObjectPathForValue } from "sap/fe/macros/field/FieldTemplating";
import type DataPoint from "sap/fe/macros/internal/DataPoint";
import * as FieldStructure from "sap/fe/macros/internal/field/FieldStructure";
import type { FieldBlockProperties, InputFieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import { setUpField } from "sap/fe/macros/internal/field/FieldStructureHelper";
import type Avatar from "sap/m/Avatar";
import type Button from "sap/m/Button";
import type { Button$PressEvent } from "sap/m/Button";
import type CheckBox from "sap/m/CheckBox";
import type { CheckBox$SelectEvent } from "sap/m/CheckBox";
import type ExpandableText from "sap/m/ExpandableText";
import type HBox from "sap/m/HBox";
import type InputBase from "sap/m/InputBase";
import type { InputBase$ChangeEvent } from "sap/m/InputBase";
import type Label from "sap/m/Label";
import type Link from "sap/m/Link";
import MessageToast from "sap/m/MessageToast";
import type ObjectIdentifier from "sap/m/ObjectIdentifier";
import type ObjectStatus from "sap/m/ObjectStatus";
import type RatingIndicator from "sap/m/RatingIndicator";
import type Text from "sap/m/Text";
import type VBox from "sap/m/VBox";
import type UI5Event from "sap/ui/base/Event";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import LabelEnablement from "sap/ui/core/LabelEnablement";
import Messaging from "sap/ui/core/Messaging";
import Message from "sap/ui/core/message/Message";
import type MessageType from "sap/ui/core/message/MessageType";
import type FormElement from "sap/ui/layout/form/FormElement";
import type { Field$ChangeEvent, default as mdcField } from "sap/ui/mdc/Field";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/Context";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context, default as V4Context } from "sap/ui/model/odata/v4/Context";
import type ODataContextBinding from "sap/ui/model/odata/v4/ODataContextBinding";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type FileUploader from "sap/ui/unified/FileUploader";
import type {
	FileUploader$ChangeEvent,
	FileUploader$FileSizeExceedEvent,
	FileUploader$TypeMissmatchEvent
} from "sap/ui/unified/FileUploader";
import type { EventHandler } from "types/extension_types";
import type { MetaModelEnum, MetaModelType } from "../../../../../../types/metamodel_types";
import MacroAPI from "./MacroAPI";
import type Email from "./contact/Email";
import type FileWrapper from "./controls/FileWrapper";
import type FieldFormatOptions from "./field/FieldFormatOptions";
import FieldRuntimeHelper from "./field/FieldRuntimeHelper";
import InlineEdit from "./inlineEdit/InlineEdit";

type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void; getAriaLabelledBy: () => string[] };

/**
 * Building block for creating a field based on the metadata provided by OData V4.
 * <br>
 * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
 * When creating a Field building block, you must provide an ID to ensure everything works correctly.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Field id="MyField" metaPath="MyProperty" /&gt;
 * </pre>
 * <a href="/sapui5-sdk-internal/test-resources/sap/fe/core/fpmExplorer/index.html#/buildingBlocks/buildingBlockOverview" target="_blank" >Overview of Building Blocks</a>
 * @alias sap.fe.macros.Field
 * @public
 */
@defineUI5Class("sap.fe.macros.Field", {
	returnTypes: [
		"sap.fe.core.controls.FormElementWrapper" /*, not sure i want to add those yet "sap.fe.macros.Field", "sap.m.HBox", "sap.fe.macros.controls.ConditionalWrapper", "sap.m.Button"*/
	]
})
@mixin(InlineEdit)
class Field extends MacroAPI {
	/**
	 * An expression that allows you to control the editable state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine if the page is currently editable.
	 * Please note that you cannot set a field to editable if it has been defined in the annotation as not editable.
	 * @private
	 * @deprecated
	 */
	@property({ type: "boolean" })
	public readonly editable!: boolean;

	/**
	 * An expression that allows you to control the read-only state of the field.
	 *
	 * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
	 * @public
	 */
	@property({ type: "boolean", bindToState: true })
	public readonly readOnly!: boolean;

	/**
	 * The identifier of the Field control.
	 */
	@property({ type: "string" })
	public id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: [],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty", "Property"]
	})
	public readonly metaPath!: string;

	/**
	 * Wrap field
	 */
	@property({
		type: "boolean"
	})
	public readonly wrap?: boolean;

	/**
	 * Defines the path of the context used in the current page or block.
	 * This setting is defined by the framework.
	 * @public
	 */
	@property({
		type: "string",
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	public readonly contextPath!: string;

	/**
	 * An event containing details is triggered when the value of the field is changed.
	 * @public
	 */
	@event()
	change!: EventHandler;

	/**
	 * An event containing details is triggered when the field get the focus.
	 *
	 */
	@event()
	focusin!: EventHandler;

	/**
	 * An event containing details is triggered when the value of the field is live changed.
	 * @public
	 */
	@event()
	liveChange!: EventHandler;

	@association({
		type: "string"
	})
	public idPrefix?: string;

	/**
	 * Prefix added to the generated ID of the value help used for the field
	 */
	@association({
		type: "string"
	})
	public vhIdPrefix!: string;

	/**
	 * Flag indicating whether action will navigate after execution
	 */
	@property({
		type: "boolean"
	})
	public readonly navigateAfterAction: boolean = true;

	/**
	 * A set of options that can be configured.
	 * @public
	 */
	@aggregation({ type: "sap.fe.macros.field.FieldFormatOptions" })
	public readonly formatOptions?: FieldFormatOptions;

	@association({ type: "string" })
	// eslint-disable-next-line @typescript-eslint/naming-convention
	public _flexId?: string;

	/**
	 * Edit Mode of the field.
	 *
	 * If the editMode is undefined then we compute it based on the metadata
	 * Otherwise we use the value provided here.
	 */
	@property({
		type: "sap.ui.mdc.enums.FieldEditMode"
	})
	public readonly editMode?: FieldEditMode | CompiledBindingToolkitExpression;

	/**
	 * Option to add semantic objects for a field.
	 * This parameter overwrites the semantic objects defined through annotations.
	 * Valid options are either a single semantic object, a stringified array of semantic objects,
	 * a formatter or a single binding expression returning either a single semantic object or an array of semantic objects.
	 * @public
	 */
	@property({ type: "string", isBindingInfo: true })
	public readonly semanticObject!: PropertyBindingInfo;

	/**
	 * This is used to optionally provide an external value that comes from a different model than the oData model.
	 * It is designed to work with a field with value help, and without support for complex value help (currency / unit).
	 * @experimental
	 * @public
	 */
	@property({
		type: "string",
		bindable: true,
		isBindingInfo: true,
		required: false
	})
	public readonly value?: string;

	/**
	 * This is used to optionally provide an external description that comes from a different model than the oData model.
	 * This should be used in conjunction with the value property.
	 * @experimental
	 * @public
	 */
	@property({
		type: "string",
		bindable: true,
		isBindingInfo: true,
		required: false
	})
	public readonly description?: string;

	@property({
		type: "sap.ui.core.TextAlign"
	})
	public readonly textAlign?: string;

	@property({ type: "object", isBindingInfo: true })
	public readonly showErrorObjectStatus?: object | boolean;

	@property({ type: "string" })
	public collaborationEnabled?: boolean; // Need to be computed on demand

	@property({ type: "string" })
	public mainPropertyRelativePath?: string; // Need to be computed on demand

	@property({ type: "object", isBindingInfo: true })
	customValueBinding?: boolean | string | number | PropertyBindingInfo;

	@property({ type: "boolean" })
	inlineEditEnabled? = false;

	@property({ type: "boolean" })
	hasInlineEdit?: boolean;

	private focusHandlersAttached = false;

	private computedMetaPath?: Context;

	private computedContextPath?: Context;

	private odataMetaModel!: ODataMetaModel | undefined;

	@property({ type: "string" })
	_apiId?: string;

	@property({ type: "boolean" })
	required?: boolean;

	private preprocessorContext!: XMLPreprocessorContext | undefined;

	/**
	 * Gets the binding used for collaboration notifications.
	 * @param field
	 * @returns The binding
	 */
	getCollaborationBinding(field: Control): ODataListBinding | ODataContextBinding {
		let binding = (field.getBindingContext() as V4Context).getBinding();

		if (!binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
			const oView = CommonUtils.getTargetView(field);
			binding = oView.getBindingContext().getBinding();
		}

		return binding;
	}

	/**
	 * Extracts data from a change event for usage in the handleChange method.
	 * @param changeEvent The change event object.
	 * @returns An object containing the extracted details
	 */
	private extractChangeEventDetails(changeEvent: Field$ChangeEvent & UI5Event<{ isValid: boolean }>): {
		source: mdcField;
		controller: PageController;
		isTransient: boolean;
		valueResolved: Promise<void>;
		valid: boolean | undefined;
		fieldValidity: boolean;
		customValueBinding: boolean | string | number | PropertyBindingInfo | undefined;
	} {
		const source = changeEvent.getSource();
		const controller = this.getPageController();
		// If the field is bound to a JSON model, source.getBindingContext() returns undefined.
		// In such cases, we cannot call isTransient on it. Defaulting to false.
		const bindingContext = source && source.getBindingContext();
		const isTransient = bindingContext ? (bindingContext as unknown as { isTransient: Function }).isTransient() : false;
		const valueResolved = changeEvent.getParameter("promise") || Promise.resolve();
		const valid = changeEvent.getParameter("valid");
		const fieldValidity = FieldRuntimeHelper.getFieldStateOnChange(changeEvent).state["validity"];
		const customValueBinding = this?.customValueBinding;

		return { source, controller, isTransient, valueResolved, valid, fieldValidity, customValueBinding };
	}

	@xmlEventHandler()
	handleChange(changeEvent: Field$ChangeEvent & UI5Event<{ isValid: boolean }>): void {
		const { source, controller, isTransient, valueResolved, valid, fieldValidity, customValueBinding } =
			this.extractChangeEventDetails(changeEvent);

		if (customValueBinding) {
			let newValue;
			const valueModel = source?.getModel(customValueBinding.model) as JSONModel | undefined;
			if (source.isA("sap.m.CheckBox")) {
				newValue = (changeEvent as CheckBox$SelectEvent).getParameter("selected");
			} else {
				newValue = (changeEvent as InputBase$ChangeEvent).getParameter("value");
			}
			valueModel?.setProperty(customValueBinding.path, newValue);
			valueModel?.updateBindings(true);
		}

		// Use the FE Controller instead of the extensionAPI to access internal FE controllers
		const feController = controller ? FieldRuntimeHelper.getExtensionController(controller) : undefined;

		// Currently we have undefined and true... and our creation row implementation relies on this.
		// I would move this logic to this place as it's hard to understand for field consumer
		valueResolved
			.then(() => {
				// The event is gone. For now we'll just recreate it again
				(changeEvent as { oSource?: mdcField }).oSource = source;
				(changeEvent as { mParameters?: { valid?: boolean } }).mParameters = {
					valid: valid ?? true
				};
				this?.fireEvent("change", { value: this.getValue(), isValid: valid ?? true });
				if (!isTransient) {
					// trigger side effects without registering deferred side effects
					// deferred side effects are already registered by prepareDeferredSideEffectsForField before valueResolved is resolved.
					feController?._sideEffects.handleFieldChange(changeEvent, !!fieldValidity, valueResolved, true);
				}
				// Recommendations
				if (controller) {
					FieldRuntimeHelper.fetchRecommendations(source, controller);
				}
				return;
			})
			.catch(() => {
				// The event is gone. For now we'll just recreate it again
				(changeEvent as { oSource?: mdcField }).oSource = source;
				(changeEvent as { mParameters?: { valid?: boolean } }).mParameters = {
					valid: false
				};
				Log.debug("Prerequisites on Field for the SideEffects and Recommendations have been rejected");
				// as the UI might need to react on. We could provide a parameter to inform if validation
				// was successful?
				this.fireEvent("change", { value: this.getValue(), isValid: valid ?? false });
			});

		// For the EditFlow synchronization, we need to wait for the corresponding PATCH request to be sent (or an error to be detected), otherwise there could be e.g. action or save invoked in parallel with the PATCH request.
		// This is done with a 0-timeout, to allow for the 'patchSent' event to be sent by the binding (then the internal edit flow synchronization kicks in with EditFlow.handlePatchSent).
		const valueResolvedAndPatchSent = valueResolved
			.then(async () => {
				return new Promise<void>((resolve) => {
					setTimeout(resolve, 0);
				});
			})
			.catch(async () => {
				return new Promise<void>((resolve) => {
					setTimeout(resolve, 0);
				});
			});
		feController?.editFlow.syncTask(valueResolvedAndPatchSent);

		// if the context is transient, it means the request would fail anyway as the record does not exist in reality
		// Should the request be made in future if the context is transient?
		if (isTransient) {
			return;
		}

		feController?._sideEffects.prepareDeferredSideEffectsForField(changeEvent, !!fieldValidity, valueResolved);
		// Collaboration Draft Activity Sync
		const bCollaborationEnabled = controller?.collaborativeDraft.isConnected();

		if (bCollaborationEnabled && fieldValidity) {
			const binding = this.getCollaborationBinding(source);

			const data = [
				...((source.getBindingInfo("value") || source.getBindingInfo("selected"))?.parts || []),
				...(source.getBindingInfo("additionalValue")?.parts || [])
			]
				.filter((part) => {
					return part?.path !== undefined && part.path.indexOf("@@") < 0; // Remove binding parts with @@ that make no sense for collaboration messages
				})
				.map(function (part: { path: string }) {
					return `${source.getBindingContext()?.getPath()}/${part.path}`;
				});

			// From this point, we will always send a collaboration message (UNLOCK or CHANGE), so we retain
			// a potential UNLOCK that would be sent in handleFocusOut, to make sure it's sent after the CHANGE message
			controller?.collaborativeDraft.retainAsyncMessages(data);

			const updateCollaboration = (): void => {
				if (binding.hasPendingChanges()) {
					// The value has been changed by the user --> wait until it's sent to the server before sending a notification to other users
					binding.attachEventOnce("patchCompleted", function () {
						controller?.collaborativeDraft.send({ action: Activity.Change, content: data });
						controller?.collaborativeDraft.releaseAsyncMessages(data);
					});
				} else {
					controller?.collaborativeDraft.releaseAsyncMessages(data);
				}
			};
			if (source.isA("sap.ui.mdc.Field") || (source as Control).isA("sap.ui.mdc.MultiValueField")) {
				valueResolved
					.then(() => {
						updateCollaboration();
						return;
					})
					.catch(() => {
						updateCollaboration();
					});
			} else {
				updateCollaboration();
			}
		}
	}

	@xmlEventHandler()
	handleLiveChange(_event: UI5Event): void {
		this.fireEvent("liveChange");
	}

	@xmlEventHandler()
	onValidateFieldGroup(_event: Control$ValidateFieldGroupEvent): void {
		const sourceField = _event.getSource(),
			view = CommonUtils.getTargetView(sourceField),
			controller = view.getController();

		const feController = FieldRuntimeHelper.getExtensionController(controller);
		feController._sideEffects.handleFieldGroupChange(_event);
	}

	constructor(props?: PropertiesOf<Field, "change" | "liveChange" | "focusin">, others?: PropertiesOf<Field>) {
		let combinedProps;

		if (props) {
			if (typeof props === "string") {
				combinedProps = { ...others, id: props } as PropertiesOf<Field>;
			} else {
				combinedProps = { ...props, ...others } as PropertiesOf<Field>;
			}

			const { _flexId, vhIdPrefix, idPrefix, id, _apiId } = combinedProps;

			if (_flexId && !_flexId.includes("-content")) {
				combinedProps._apiId = _flexId;
				combinedProps._flexId = `${_flexId}-content`;
			}

			if (!vhIdPrefix) {
				//no vhIdPrefix means "public use case"
				combinedProps.vhIdPrefix = "FieldValueHelp";
				combinedProps._flexId = id;
				combinedProps.idPrefix = idPrefix || id;
			}
			if (!id) {
				if (combinedProps._apiId) {
					combinedProps.id = combinedProps._apiId;
				} else if (idPrefix) {
					combinedProps.id = generate([idPrefix, "Field"]);
				}
			}
		}
		super(combinedProps);
	}

	_setAriaLabelledBy(oContent?: ControlWithAccessibility): void {
		if (oContent && oContent.addAriaLabelledBy) {
			const aAriaLabelledBy = this.ariaLabelledBy;

			for (const sId of aAriaLabelledBy) {
				const aAriaLabelledBys = oContent.getAriaLabelledBy() || [];
				if (!aAriaLabelledBys.includes(sId)) {
					oContent.addAriaLabelledBy(sId);
				}
			}
		}
	}

	onBeforeRendering(): void {
		// before calling the renderer of the Field parent control may have set ariaLabelledBy
		// we ensure it is passed to its inner controls
		this._setAriaLabelledBy(this.content as unknown as ControlWithAccessibility);
	}

	onAfterRendering(): void {
		if (this.collaborationEnabled && !this.focusHandlersAttached) {
			// The event delegate doesn't work on the Field, we need to put it on its content (FieldWrapper)
			this.content?.addEventDelegate(
				{
					onfocusin: (evt: FocusEvent) => {
						this.getPageController().collaborativeDraft.handleContentFocusIn(this, evt);
					}
				},
				this
			);

			this.focusHandlersAttached = true; // To avoid attaching events twice
		}
	}

	/**
	 * Returns the first visible control in the FieldWrapper.
	 * @param control FieldWrapper
	 * @returns The first visible control
	 */
	static getControlInFieldWrapper(control: Control | undefined): Control | undefined {
		if (control?.isA("sap.fe.macros.controls.FieldWrapper") && !control?.isA("sap.fe.macros.controls.FileWrapper")) {
			const fieldWrapper = control as EnhanceWithUI5<FieldWrapper>;
			const controls = fieldWrapper.getEditMode() === "Display" ? [fieldWrapper.getContentDisplay()] : fieldWrapper.getContentEdit();
			if (controls.length >= 1) {
				return controls[0];
			}
		} else {
			return control;
		}
	}

	/**
	 * Returns the label controls of the field
	 * when being referenced by the 'labelFor' attribute on the label or when in a form.
	 * @returns The label controls
	 */
	getLabelControls(): Label[] {
		const referencingLabels = this._getLabelsFromReferencingLabels();
		return referencingLabels.length > 0 ? referencingLabels : this._getLabelsForFormFields();
	}

	/**
	 * Returns the label controls of the field when referenced by a label.
	 * @returns The label controls
	 */
	_getLabelsFromReferencingLabels(): Label[] {
		const labelIds = LabelEnablement.getReferencingLabels(this);
		const labelControls: Label[] = [];
		const view = this.getPageController().getView();
		labelIds.forEach((labelId) => {
			const labelControl = view.byId(labelId);
			if (labelControl) {
				labelControls.push(labelControl as Label);
			}
		});
		return labelControls;
	}

	/**
	 * Returns the label controls of the field or connected field when in a form.
	 * @returns The label controls
	 */
	_getLabelsForFormFields(): Label[] {
		// if the field is not in a form, we return undefined
		if (!this.getId().includes("FormElement")) {
			return [];
		}
		let control = this as ManagedObject | null;
		// search the parents of the control until we find a sap.ui.layout.form.FormElement
		// or we reach the root control
		while (control && !control.isA("sap.ui.layout.form.FormElement")) {
			control = (control as ManagedObject)?.getParent();
		}
		return control ? [(control as FormElement).getLabelControl() as Label] : [];
	}

	/**
	 * Retrieves the current value of the field.
	 * @public
	 * @returns The current value of the field
	 */
	getValue(): boolean | string | float | undefined {
		let oControl = Field.getControlInFieldWrapper(this.content);
		if (!oControl) {
			return undefined;
		}
		if (this.collaborationEnabled && oControl?.isA("sap.m.HBox")) {
			oControl = (oControl as HBox).getItems()[0];
		}
		if (oControl?.isA("sap.m.CheckBox")) {
			return (oControl as CheckBox).getSelected();
		} else if (oControl?.isA("sap.m.RatingIndicator")) {
			return (oControl as RatingIndicator).getValue();
		} else if (oControl?.isA("sap.m.InputBase")) {
			return (oControl as InputBase).getValue();
		} else if (oControl?.isA("sap.m.Link")) {
			return (oControl as Link).getText();
		} else if (oControl?.isA("sap.m.Label")) {
			return (oControl as Label).getText();
		} else if (oControl?.isA("sap.m.Text")) {
			return (oControl as Text).getText(false);
		} else if (oControl?.isA<EnhanceWithUI5<TextLink>>("sap.fe.macros.controls.TextLink")) {
			return oControl.getText();
		} else if (oControl?.isA("sap.m.ObjectStatus")) {
			return (oControl as ObjectStatus).getText();
		} else if (oControl?.isA("sap.m.ObjectIdentifier")) {
			return (oControl as ObjectIdentifier).getTitle();
		} else if (oControl?.isA<mdcField>("sap.ui.mdc.Field")) {
			return oControl.getValue(); // FieldWrapper
		} else if (
			oControl?.isA<DataPoint>("sap.fe.macros.internal.DataPoint") ||
			oControl?.isA<Email>("sap.fe.macros.contact.Email") ||
			oControl?.isA<Contact>("sap.fe.macros.contact.Contact")
		) {
			// this is a BBv4 underneath, call the method on the BBV4
			return oControl.getValue();
		} else {
			throw new Error("getting value not yet implemented for this field type");
		}
	}

	getMainPropertyRelativePath(): string | undefined {
		return this.mainPropertyRelativePath;
	}

	/**
	 * Sets the current value of the field.
	 * @param value
	 * @public
	 * @returns The current field reference
	 */
	setValue(value: boolean | string): Control {
		if (!this.content) {
			return this.setProperty("value", value);
		}
		let control = Field.getControlInFieldWrapper(this.content);
		if (this.collaborationEnabled && control?.isA("sap.m.HBox")) {
			// for chaining reasons, let´s keep it like that
			control = (control as HBox).getItems()[0];
		}
		if (control?.isA<CheckBox>("sap.m.CheckBox")) {
			control.setSelected(value as boolean);
		} else if (control?.isA<InputBase>("sap.m.InputBase")) {
			control.setValue(value as string);
		} else if (control?.isA<Text>("sap.m.Text")) {
			control.setText(value as string);
		} else if (control?.isA<mdcField>("sap.ui.mdc.Field")) {
			control.setValue(value);
		} else {
			throw "setting value not yet implemented for this field type";
		}
		return this;
	}

	/**
	 * Gets the current enablement state of the field.
	 * @public
	 * @returns Boolean value with the enablement state
	 */
	getEnabled(): boolean {
		let control = Field.getControlInFieldWrapper(this.content);
		if (control !== null && control !== undefined && !control?.isA("sap.m.Text")) {
			//check needed for file wrapper which does not have a content
			if (this.collaborationEnabled && control.isA<HBox>("sap.m.HBox")) {
				// for chaining reasons, let´s keep it like that
				control = control.getItems()[0];
			}
			if (control.isA<VBox>("sap.m.VBox")) {
				// for chaining reasons, let´s keep it like that
				control = control.getItems()[0];
			}

			// we need to call the getProperty in the following examples
			// otherwise we end up in a max call stack size
			if (control.isA<CheckBox>("sap.m.CheckBox")) {
				return control.getProperty("enabled");
			} else if (control.isA<InputBase>("sap.m.InputBase")) {
				return control.getProperty("enabled");
			} else if (control.isA<Link>("sap.m.Link")) {
				return control.getProperty("enabled");
			} else if (control.isA<Button>("sap.m.Button")) {
				return control.getProperty("enabled");
			} else if (control.isA<ObjectStatus>("sap.m.ObjectStatus")) {
				return true;
			} else if (control.isA<ObjectIdentifier>("sap.m.ObjectIdentifier")) {
				return true;
			} else if (control.isA<FormElementWrapper>("sap.fe.core.controls.FormElementWrapper")) {
				// It is for a Draft Indicator
				return true;
			} else if (control.isA<DataPoint>("sap.fe.macros.internal.DataPoint")) {
				return control.getEnabled();
			} else if (control.isA<Email>("sap.fe.macros.contact.Email")) {
				return control.getProperty("linkEnabled");
			} else if (control.isA<Contact>("sap.fe.macros.contact.Contact")) {
				return control.getEnabled();
			} else if (control.isA<ExpandableText>("sap.m.ExpandableText")) {
				// otherwise show more would be inactive
				return true;
			} else if (control.isA<mdcField>("sap.ui.mdc.Field")) {
				const editMode = control.getEditMode();
				// The mdc field does not have a direct property "enabled", therefore we map
				// the internal disabled setting of the edit mode in this graceful pattern
				return editMode !== FieldEditMode.Disabled;
			} else if (control.isA<FileWrapper>("sap.fe.macros.controls.FileWrapper")) {
				// The file wrapper could contain a link or an avatar with a delete button,
				// we must ensure the enablement in both cases
				return control.link ? control.link.getProperty("enabled") : true;
			} else if (
				control.isA("sap.fe.macros.controls.ConditionalWrapper") ||
				(control as Control).isA<TextLink>("sap.fe.macros.controls.TextLink")
			) {
				return true;
			} else {
				return false;
			}
		} else {
			return true;
		}
	}

	/**
	 * Sets the current enablement state of the field.
	 * @param enabled
	 * @public
	 * @returns The current field reference
	 */
	setEnabled(enabled: boolean): Control {
		let control = Field.getControlInFieldWrapper(this.content);
		if (this.collaborationEnabled && control?.isA<HBox>("sap.m.HBox")) {
			// for chaining reasons, let´s keep it like that
			control = control.getItems()[0];
		}

		// we need to call the setProperty in the following examples
		// otherwise we end up in a max call stack size
		if (control?.isA<CheckBox>("sap.m.CheckBox")) {
			return control.setProperty("enabled", enabled);
		} else if (control?.isA<InputBase>("sap.m.InputBase")) {
			return control.setProperty("enabled", enabled);
		} else if (control?.isA<Link>("sap.m.Link")) {
			return control.setProperty("enabled", enabled);
		} else if (control?.isA<Button>("sap.m.Button")) {
			return control.setProperty("enabled", enabled);
		} else if (control?.isA<ObjectStatus>("sap.m.ObjectStatus")) {
			return control.setProperty("active", enabled);
		} else if (control?.isA<ObjectIdentifier>("sap.m.ObjectIdentifier")) {
			return control.setProperty("titleActive", enabled);
		} else if (control?.isA<mdcField>("sap.ui.mdc.Field")) {
			// The mdc field does not have a direct property "enabled", therefore we map
			// the enabled property to the respective disabled setting of the edit mode
			// with this graceful pattern
			let editModeType;
			if (enabled) {
				editModeType = FieldEditMode.Editable;
			} else {
				editModeType = FieldEditMode.Disabled;
			}
			control.setEditMode(editModeType);
		} else if (control?.isA<Email>("sap.fe.macros.contact.Email")) {
			control.setLinkEnabled(enabled);
			return control;
		} else if (control?.isA<DataPoint>("sap.fe.macros.internal.DataPoint")) {
			control.setEnabled(enabled);
		} else {
			throw "setEnabled isn't implemented for this field type";
		}
		return this;
	}

	/**
	 * Adds a message to the field.
	 * @param [parameters] The parameters to create message
	 * @param parameters.type Type of the message
	 * @param parameters.message Message text
	 * @param parameters.description Message description
	 * @param parameters.persistent True if the message is persistent
	 * @returns The id of the message
	 * @public
	 */
	addMessage(parameters: { type?: MessageType; message?: string; description?: string; persistent?: boolean }): string {
		const msgManager = this.getMessageManager();
		const oControl = Field.getControlInFieldWrapper(this.content);

		let path; //target for oMessage
		if (oControl?.isA("sap.m.CheckBox")) {
			path = (oControl as CheckBox).getBinding("selected")?.getResolvedPath();
		} else if (oControl?.isA("sap.m.InputBase")) {
			path = (oControl as InputBase).getBinding("value")?.getResolvedPath();
		} else if (oControl?.isA<Field>("sap.ui.mdc.Field")) {
			path = oControl.getBinding("value")!.getResolvedPath();
		}

		const oMessage = new Message({
			target: path,
			type: parameters.type,
			message: parameters.message,
			processor: oControl?.getModel(),
			description: parameters.description,
			persistent: parameters.persistent
		});

		msgManager.addMessages(oMessage);
		return oMessage.getId();
	}

	/**
	 * Removes a message from the field.
	 * @param id The id of the message
	 * @public
	 */
	removeMessage(id: string): void {
		const msgManager = this.getMessageManager();
		const arr = msgManager.getMessageModel().getData();
		const result = arr.find((e: Message) => e?.getId?.() === id);
		if (result) {
			msgManager.removeMessages(result);
		}
	}

	getMessageManager(): Messaging {
		return Messaging;
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			const preparedProperties = this.prepareProperties();
			if (preparedProperties) {
				this.content = this.createContent(preparedProperties);
			}
		}
	}

	/**
	 * Prepares the properties required for the Field block.
	 *
	 * This function computes the meta path and context path, sets up the input field properties,
	 * and calls the setUpField function to prepare the properties for the Field block.
	 * Additionally, it sets the mainPropertyRelativePath and collaborationEnabled properties.
	 * @returns The prepared properties for the Field block, or undefined if the preprocessor context is not available.
	 */
	prepareProperties(): FieldBlockProperties | undefined {
		const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);

		if (!metaContextPath) {
			return undefined;
		}
		const owner = this._getOwner();
		const inputFieldProperties = this.getPropertyBag() as InputFieldBlockProperties;
		Object.defineProperty(inputFieldProperties, "value", {
			get: () => {
				return this.value;
			}
		});
		Object.defineProperty(inputFieldProperties, "description", {
			get: () => {
				return this.description;
			}
		});

		inputFieldProperties.readOnly = this.bindState("readOnly");
		inputFieldProperties.vhIdPrefix = this.vhIdPrefix;
		inputFieldProperties.idPrefix = this.idPrefix;
		inputFieldProperties._flexId = this._flexId;
		inputFieldProperties.onLiveChange = this.hasListeners("liveChange") ? "Something" : undefined;

		this.preprocessorContext = owner?.preprocessorContext;
		this.odataMetaModel = this.getMetaModel();
		this.computedContextPath = this.odataMetaModel?.getMetaContext(this.getComputedContextPath(this.contextPath));

		this.computedMetaPath = this.odataMetaModel?.createBindingContext(metaContextPath.getPath()) as Context;

		// Some code rely on us checking if visible is defined or not, the only way to do it is through the isPropertyInitial method
		if (this.isPropertyInitial("visible")) {
			inputFieldProperties.visible = undefined;
		}

		//if (this.preprocessorContext) {
		// If the ID is not set by the consumer, use the ID provided by UI5.
		// (The logic for setting the value help relies on always having an ID.)
		inputFieldProperties.id = inputFieldProperties.id ?? this.getId();

		const preparedProperties = setUpField(
			inputFieldProperties,
			{} as TemplateProcessorSettings,
			(this.preprocessorContext?.models.viewData as JSONModel) ?? new JSONModel(this._getOwner()?.getViewData?.() ?? {}),
			(this.preprocessorContext?.models.internal as JSONModel) ?? this._getOwner()!.getAppComponent().getModel("internal"),
			this.preprocessorContext?.appComponent ?? this._getOwner()!.getAppComponent(),
			this.isPropertyInitial("readOnly"),
			this.computedMetaPath,
			this.computedContextPath
		);
		preparedProperties.isDynamicInstantiation = true;
		if (preparedProperties.mainPropertyRelativePath) this.mainPropertyRelativePath = preparedProperties.mainPropertyRelativePath;
		if (preparedProperties.collaborationEnabled) this.collaborationEnabled = preparedProperties.collaborationEnabled;
		return preparedProperties;
	}

	/**
	 * Creates the content for the Field block.
	 *
	 * This function uses the prepared properties to create and return the content control for the Field block.
	 * @param preparedProperties The prepared properties for the Field block.
	 * @returns The created content control.
	 */
	createContent(preparedProperties: FieldBlockProperties): Control {
		try {
			const controller = this.getPageController();
			// We have to set (or bind) some properties to the Field so they can be accessed by consumers/UI5
			if (preparedProperties.required === undefined) {
				this.setOrBindProperty("required", preparedProperties.requiredExpression);
			}
			this.setOrBindProperty("editable", preparedProperties.editableExpression);

			this.setOrBindProperty("visible", preparedProperties.visible);
			this.setOrBindProperty("inlineEditEnabled", preparedProperties.inlineEditEnabled);
			if (typeof preparedProperties.value !== "string") {
				this.customValueBinding = preparedProperties.value;
			}
			this.setOrBindProperty("hasInlineEdit", compileExpression(preparedProperties.hasInlineEdit));

			if (preparedProperties.computedEditMode !== undefined) {
				this.setOrBindProperty("editMode", preparedProperties.editMode ?? compileExpression(preparedProperties.computedEditMode));
			}
			preparedProperties.eventHandlers.change = (Field as unknown as { handleChange: EventHandler }).handleChange;
			preparedProperties.eventHandlers.liveChange = (Field as unknown as { handleLiveChange: EventHandler }).handleLiveChange;
			preparedProperties.eventHandlers.validateFieldGroup = (
				Field as unknown as { onValidateFieldGroup: EventHandler }
			).onValidateFieldGroup;
			preparedProperties.eventHandlers.handleTypeMissmatch = this.onHandleTypeMissmatch.bind(this);
			preparedProperties.eventHandlers.handleFileSizeExceed = this.onHandleFileSizeExceed.bind(this);
			preparedProperties.eventHandlers.handleUploadComplete = (ev): void => {
				FieldRuntimeHelper.handleUploadComplete(
					ev,
					{ path: preparedProperties.fileFilenameExpression },
					preparedProperties.fileRelativePropertyPath,
					controller
				);
			};
			preparedProperties.eventHandlers.uploadStream = this.onUploadStream.bind(this);
			preparedProperties.eventHandlers.removeStream = (ev): void => {
				FieldRuntimeHelper.removeStream(
					ev as Field$ChangeEvent & UI5Event<{ isValid: boolean }>,
					{ path: preparedProperties.fileFilenameExpression },
					preparedProperties.fileRelativePropertyPath,
					controller
				);
			};
			preparedProperties.eventHandlers.handleOpenUploader = this.onHandleOpenUploader.bind(this);
			preparedProperties.eventHandlers.handleCloseUploader = this.onHandleCloseUploader.bind(this);
			preparedProperties.eventHandlers.openExternalLink = this.onOpenExternalLink.bind(this);
			preparedProperties.eventHandlers.onFocusOut = this.onFocusOut.bind(this);
			preparedProperties.eventHandlers.linkPressed = this.onLinkPressed.bind(this);
			preparedProperties.eventHandlers.onDataFieldWithIBN = (ev: Button$PressEvent): void => {
				const oDataField = preparedProperties.metaPath.getObject();
				if (!oDataField) return undefined;
				const mNavigationParameters: {
					navigationContexts?: ODataV4Context;
					label?: string;
					applicableContexts?: ODataV4Context[];
					notApplicableContexts?: ODataV4Context[];
					semanticObjectMapping?: string;
				} = {
					navigationContexts: ev.getSource()?.getBindingContext() as ODataV4Context
				};
				if (oDataField.Mapping) {
					mNavigationParameters.semanticObjectMapping = oDataField.Mapping;
				}
				controller._intentBasedNavigation.navigate(
					oDataField.SemanticObject,
					oDataField.Action,
					mNavigationParameters,
					ev.getSource()
				);
			};
			preparedProperties.eventHandlers.onDataFieldActionButton = (ev: Button$PressEvent): void => {
				const oThis: FieldBlockProperties = preparedProperties;
				const oDataField: MetaModelType<DataFieldForAction> = preparedProperties.metaPath.getObject();
				let sInvocationGrouping = "Isolated";
				if (
					oDataField.InvocationGrouping &&
					(oDataField.InvocationGrouping as unknown as MetaModelEnum<OperationGroupingType>).$EnumMember ===
						"com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet"
				) {
					sInvocationGrouping = "ChangeSet";
				}
				let bIsNavigable = oThis.navigateAfterAction as boolean | string;
				bIsNavigable = bIsNavigable === "false" ? false : true;

				const entities: Array<string> = oThis?.contextPath?.getPath().split("/");
				const entitySetName: string = entities[entities.length - 1];

				const oParams = {
					contexts: ev.getSource().getBindingContext()! as ODataV4Context,
					invocationGrouping: sInvocationGrouping,
					model: ev.getSource().getModel() as ODataModel,
					label: oDataField.Label,
					isNavigable: bIsNavigable,
					entitySetName: entitySetName,
					feFrameworkCall: true
				};

				controller.editFlow.invokeAction(oDataField.Action!, oParams);
			};
			preparedProperties.eventHandlers.displayAggregationDetails = (ev): void => {
				FieldRuntime.displayAggregateDetails(ev, getContextRelativeTargetObjectPath(preparedProperties.dataModelPath));
			};
			if (preparedProperties.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
				preparedProperties.eventHandlers.onDataFieldWithNavigationPath = (ev): void => {
					FieldRuntimeHelper.onDataFieldWithNavigationPath(
						ev.getSource(),
						controller,
						(preparedProperties.convertedMetaPath as DataFieldWithNavigationPath).Target.value
					);
				};
			}
			preparedProperties.eventHandlers.showCollaborationEditUser = this.onShowCollaborationEditUser.bind(this);
			preparedProperties.valueHelpId = FieldStructure.getPossibleValueHelpTemplateId(
				preparedProperties,
				this.getPageController(),
				this.getMetaModel()!
			);
			this.content = FieldStructure.getFieldStructureTemplate(preparedProperties) as unknown as Control;
		} catch (e) {
			if (e instanceof Error) {
				MessageToast.show(e.message + " in createContent of Field");
			} else {
				MessageToast.show("An unknown error occurred");
			}
		}
		return this.content;
	}

	onHandleTypeMissmatch(ev: FileUploader$TypeMissmatchEvent): void {
		FieldRuntimeHelper.handleTypeMissmatch(ev);
	}

	onHandleFileSizeExceed(ev: FileUploader$FileSizeExceedEvent): void {
		FieldRuntimeHelper.handleFileSizeExceed(ev);
	}

	onHandleOpenUploader(ev: UI5Event<{}, FileUploader>): void {
		FieldRuntimeHelper.handleOpenUploader(ev);
	}

	onUploadStream(ev: FileUploader$ChangeEvent): void {
		FieldRuntimeHelper.uploadStream(this.getPageController(), ev);
	}

	onHandleCloseUploader(ev: UI5Event<{}, FileUploader>): void {
		FieldRuntimeHelper.handleCloseUploader(ev);
	}

	onOpenExternalLink(ev: UI5Event<{}, Link>): void {
		FieldRuntimeHelper.openExternalLink(ev);
	}

	onLinkPressed(ev: Button$PressEvent): void {
		FieldRuntimeHelper.pressLink(ev);
	}

	onFocusOut(ev: Control$ValidateFieldGroupEvent): void {
		const controller = this.getPageController();
		controller.collaborativeDraft.handleContentFocusOut(ev);
	}

	onShowCollaborationEditUser(ev: UI5Event<{}, Avatar>): void {
		const source = ev.getSource();
		const view = this.getPageController().getView();
		FieldRuntimeHelper.showCollaborationEditUser(source, view);
	}

	getPropertyBag(): PropertiesOf<this> {
		const settings: PropertiesOf<this> = {} as PropertiesOf<this>;
		const properties = this.getMetadata().getAllProperties();
		const aggregations = this.getMetadata().getAllAggregations();
		for (const propertyName in properties) {
			const currentPropertyValue = this.getProperty(propertyName);
			settings[propertyName as keyof PropertiesOf<this>] = currentPropertyValue;
		}
		for (const aggregationName in aggregations) {
			const aggregationContent = this.getAggregation(aggregationName);
			if (Array.isArray(aggregationContent)) {
				const childrenArray = [];
				for (const managedObject of aggregationContent) {
					if (managedObject.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
						childrenArray.push(managedObject.getPropertyBag());
					}
				}
				settings[aggregationName as keyof PropertiesOf<this>] = childrenArray;
			} else if (aggregationContent) {
				if (aggregationContent.isA<BuildingBlockObjectProperty>("sap.fe.macros.controls.BuildingBlockObjectProperty")) {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getPropertyBag();
				} else {
					settings[aggregationName as keyof PropertiesOf<this>] = aggregationContent.getId();
				}
			}
		}
		return settings;
	}

	/**
	 * Determines the target property of the inline edit field.
	 * @returns The targetProperty of the inline edit field.
	 */
	getInlineEditProperty(): Property | undefined {
		const dataModelPath = this.getDataModelObjectForMetaPath<DataFieldAbstractTypes | DataPointTypeTypes>(
			this.metaPath,
			this.contextPath
		);
		const targetProperty = getDataModelObjectPathForValue(
			dataModelPath as DataModelObjectPath<DataFieldAbstractTypes | DataPointTypeTypes>
		)?.targetObject;
		return targetProperty;
	}

	/**
	 * Determines the fullyQualifiedName of the inline edit field.
	 * @returns The fullyQualifiedName of the inline edit field.
	 */
	getInlineEditPropertyName(): string | undefined {
		return this.getInlineEditProperty()?.fullyQualifiedName;
	}
}

export default Field;
