import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type DraftIndicator from "sap/fe/macros/draftIndicator/DraftIndicator";
import type Avatar from "sap/m/Avatar";
import type HBox from "sap/m/HBox";
import type VBox from "sap/m/VBox";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import type RenderManager from "sap/ui/core/RenderManager";
import type { AccessibilityInfo, CSSSize, IFormContent } from "sap/ui/core/library";

@defineUI5Class("sap.fe.core.controls.FormElementWrapper")
class FormElementWrapper extends Control implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@property({
		type: "sap.ui.core.CSSSize",
		defaultValue: null
	})
	width!: CSSSize;

	@property({
		type: "boolean",
		defaultValue: false
	})
	formDoNotAdjustWidth!: boolean;

	/**
	 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
	 */
	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: (string | Control)[];

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	content!: Control;

	getAccessibilityInfo(): AccessibilityInfo {
		const oContent = this.content;
		return oContent && oContent.getAccessibilityInfo ? oContent.getAccessibilityInfo() : {};
	}

	constructor(
		id?: string | undefined | (PropertiesOf<FormElementWrapper> & $ControlSettings),
		settings?: $ControlSettings & PropertiesOf<FormElementWrapper>
	) {
		super(id as string, settings);
	}

	onBeforeRendering(): void {
		const setAriaLabelledByForControl = (control: Control): void => {
			if (control.isA<VBox>("sap.m.VBox") || control.isA<HBox>("sap.m.HBox")) {
				const items = control.getItems().filter((item) => !item.isA<Avatar>("sap.m.Avatar"));
				//exclude Avatar from aria-labelledby to avoid overriding aria-label
				for (const item of items) {
					setAriaLabelledByForControl(item);
				}
			} else if (control.isA("sap.fe.macros.draftIndicator.DraftIndicator")) {
				this.setAriaLabelledByForDraftIndicator(control as DraftIndicator);
			} else {
				this.setAriaLabelledBy(control);
			}
		};
		setAriaLabelledByForControl((this as unknown as EnhanceWithUI5<FormElementWrapper>).getContent());
	}

	/**
	 * Sets ariaLabelledBy for the content control.
	 * @param content The content control.
	 */
	private setAriaLabelledBy(content: (Control & { addAriaLabelledBy?: Function; getAriaLabelledBy?: Function }) | undefined): void {
		if (content?.addAriaLabelledBy) {
			const ariaLabelledBy = this.ariaLabelledBy;

			for (const element of ariaLabelledBy) {
				const ariaLabelledBys = content.getAriaLabelledBy?.() || [];
				if (ariaLabelledBys.indexOf(element) === -1) {
					content.addAriaLabelledBy(element);
				}
			}
		}
	}

	/**
	 * Sets ariaLabelledBy for the draft indicator.
	 * @param content The draft indicator control.
	 */
	private setAriaLabelledByForDraftIndicator(content: DraftIndicator | undefined): void {
		if (content?.addAriaLabelledByForDraftIndicator) {
			const ariaLabelledBy = this.ariaLabelledBy;

			for (const element of ariaLabelledBy) {
				const ariaLabelledBys = content.getAriaLabelledBy();
				if (!ariaLabelledBys.includes(element as string)) {
					content.addAriaLabelledByForDraftIndicator(element as string);
				}
			}
		}
	}

	static render(oRm: RenderManager, oControl: FormElementWrapper): void {
		oRm.openStart("div", oControl);
		oRm.style("min-height", "1rem");
		oRm.style("width", oControl.width);
		oRm.openEnd();

		oRm.openStart("div");
		oRm.style("display", "flex");
		oRm.style("box-sizing", "border-box");
		oRm.style("justify-content", "space-between");
		oRm.style("align-items", "center");
		oRm.style("flex-wrap", "wrap");
		oRm.style("align-content", "stretch");
		oRm.style("width", "100%");
		oRm.openEnd();
		oRm.renderControl(oControl.content); // render the child Control
		oRm.close("div");
		oRm.close("div"); // end of the complete Control
	}
}
export default FormElementWrapper;
