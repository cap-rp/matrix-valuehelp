import type { Property } from "@sap-ux/vocabularies-types";
import { defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import Field from "sap/fe/macros/Field";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings, Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import type { IFormContent } from "sap/ui/core/library";

@defineUI5Class("sap.fe.macros.form.CustomFormElement")
export default class CustomFormElement extends BuildingBlock<Control> implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	/**
	 * Metadata path to the property used for the side effects.
	 */
	@property({
		type: "string",
		required: true
	})
	public metaPath?: string;

	@property({
		type: "string"
	})
	public contextPath?: string;

	/**
	 * The key used to identify the custom form element (note that this is also the fragmentId).
	 */
	@property({
		type: "string",
		required: true
	})
	public formElementKey?: string;

	fieldGroupIds?: string[];

	constructor(properties: $ControlSettings & PropertiesOf<CustomFormElement>, others?: $ControlSettings) {
		super(properties, others);
	}

	getFormDoNotAdjustWidth(): boolean {
		return (this.content as unknown as IFormContent)?.getFormDoNotAdjustWidth?.() ?? false;
	}

	onMetadataAvailable(): void {
		this.setUpSidesEffectHandlingForContent();
	}

	/**
	 * Sets up side effect handling for the content of the custom form element.
	 */
	setUpSidesEffectHandlingForContent(): void {
		if (!this.content || !this.metaPath) {
			return;
		}
		const appComponent = this.getAppComponent();
		const dataModelObjectForMetaPath = this.getDataModelObjectForMetaPath<Property>(this.metaPath, this.contextPath);
		if (!appComponent || !dataModelObjectForMetaPath) {
			return;
		}
		const sideEffectService = appComponent.getSideEffectsService();
		this.fieldGroupIds = sideEffectService.computeFieldGroupIds(
			dataModelObjectForMetaPath.targetEntityType?.fullyQualifiedName ?? "",
			dataModelObjectForMetaPath.targetObject?.fullyQualifiedName ?? ""
		);
		if (this.fieldGroupIds.length === 0) {
			return;
		}
		// we add a unique fieldGroupId based on the fragmentID taht will be used to trigger specific handling
		// that fires immediate side effects and register non immediate
		this.fieldGroupIds.push(`fe_sideEffectHandling_${this.formElementKey}`);

		const customControls =
			(this.content?.findAggregatedObjects(true, (managedObject: ManagedObject) =>
				managedObject.isA<Control>("sap.ui.core.Control")
			) as Control[] | undefined) ?? [];
		for (const control of customControls) {
			this.setUpSidesEffectHandlingForControl(control);
		}
	}

	/**
	 * Sets up side effect handling for a control.
	 * @param control
	 */
	setUpSidesEffectHandlingForControl(control: Control): void {
		if (control.getFieldGroupIds()?.length) {
			// there is already some fieldgroup handling  do not overwrite it
			return;
		}
		control.setFieldGroupIds(this.fieldGroupIds);
		control.attachValidateFieldGroup((event: Control$ValidateFieldGroupEvent) => {
			(Field as unknown as { onValidateFieldGroup: Function }).onValidateFieldGroup(event);
		});
	}
}
