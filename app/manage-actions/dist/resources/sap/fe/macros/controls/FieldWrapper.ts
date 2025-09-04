import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type InputBase from "sap/m/InputBase";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import type { AccessibilityInfo, CSSSize, IFormContent, TextAlign } from "sap/ui/core/library";
import type Field from "../Field";

type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void; getAriaLabelledBy: () => string[] };

@defineUI5Class("sap.fe.macros.controls.FieldWrapper")
class FieldWrapper extends Control implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@property({ type: "sap.ui.core.TextAlign" })
	textAlign!: TextAlign;

	@property({ type: "sap.ui.core.CSSSize", defaultValue: null })
	width!: CSSSize;

	@property({ type: "boolean", defaultValue: false })
	formDoNotAdjustWidth!: boolean;

	@property({ type: "string", defaultValue: "Display" })
	editMode!: string;

	@property({ type: "boolean", defaultValue: false })
	required!: boolean;

	/**
	 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
	 */
	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: string[];

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	contentDisplay!: ControlWithAccessibility;

	@aggregation({ type: "sap.ui.core.Control", multiple: true })
	contentEdit!: ControlWithAccessibility[];

	private resourceBundle: ResourceBundle;

	constructor(
		id?: string | undefined | (PropertiesOf<FieldWrapper> & $ControlSettings),
		settings?: $ControlSettings & PropertiesOf<FieldWrapper>
	) {
		super(id as string, settings);
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
	}

	enhanceAccessibilityState(oElement: object, mAriaProps: object): object {
		const oParent = this.getParent();

		if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
			// forward  enhanceAccessibilityState call to the parent
			(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(oElement, mAriaProps);
		}

		return mAriaProps;
	}

	/**
	 * Adds a control to the aggregation.
	 * @param sAggregationName
	 * @param oObject
	 * @param bSuppressInvalidate
	 * @returns The FieldWrapper instance
	 */
	addAggregation(sAggregationName: string, oObject: ManagedObject, bSuppressInvalidate?: boolean): this {
		if (sAggregationName === "contentEdit" && oObject.isA<InputBase>("sap.m.InputBase")) {
			oObject.setPreferUserInteraction(true);
		}
		return super.addAggregation(sAggregationName, oObject, bSuppressInvalidate);
	}

	getAccessibilityInfo(): AccessibilityInfo {
		let oContent;
		if (this.editMode === "Display") {
			oContent = this.contentDisplay;
		} else {
			oContent = this.contentEdit.length ? this.contentEdit[0] : null;
		}
		return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
	}

	/**
	 * Returns the DOMNode ID to be used for the "labelFor" attribute.
	 *
	 * We forward the call of this method to the content control.
	 * @returns ID to be used for the <code>labelFor</code>
	 */
	getIdForLabel(): string {
		let oContent;
		if (this.editMode === "Display") {
			oContent = this.contentDisplay;
		} else {
			oContent = this.contentEdit.length ? this.contentEdit[0] : null;
		}
		return (oContent as Control)?.getIdForLabel();
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
		// before calling the renderer of the FieldWrapper parent control may have set ariaLabelledBy
		// we ensure it is passed to its inner controls
		this._setAriaLabelledBy(this.contentDisplay);
		const aContentEdit = this.contentEdit;
		for (const item of aContentEdit) {
			this._setAriaLabelledBy(item);
		}
	}

	static render(oRm: RenderManager, oControl: FieldWrapper): void {
		oRm.openStart("div", oControl);
		oRm.style("text-align", oControl.textAlign);
		if (oControl.editMode === "Display") {
			oRm.style("width", oControl.width);
			if ((oControl.getParent() as Field).hasInlineEdit) {
				// tooltip
				oRm.attr("title", oControl.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_DOUBLECLICK_EDIT"));
				// focus
				oRm.attr("tabindex", 0);
			}
			oRm.openEnd();
			oRm.renderControl(oControl.contentDisplay); // render the child Control for display
		} else {
			const aContentEdit = oControl.contentEdit;

			oRm.style("width", oControl.width);
			oRm.openEnd();
			for (const oContent of aContentEdit) {
				// render the child Control  for edit
				oRm.renderControl(oContent);
			}
		}
		oRm.close("div"); // end of the complete Control
	}
}

export default FieldWrapper;
