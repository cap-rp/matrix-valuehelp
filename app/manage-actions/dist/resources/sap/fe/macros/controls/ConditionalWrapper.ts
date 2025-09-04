import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, association, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import type RenderManager from "sap/ui/core/RenderManager";
import type { AccessibilityInfo, CSSSize, IFormContent } from "sap/ui/core/library";
type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void; getAriaLabelledBy?: () => string[] };
@defineUI5Class("sap.fe.macros.controls.ConditionalWrapper")
class ConditionalWrapper extends Control implements IFormContent {
	@implementInterface("sap.ui.core.IFormContent")
	__implements__sap_ui_core_IFormContent = true;

	@property({ type: "sap.ui.core.CSSSize", defaultValue: null })
	width!: CSSSize;

	@property({ type: "boolean", defaultValue: false })
	formDoNotAdjustWidth!: boolean;

	@property({ type: "boolean", defaultValue: false })
	condition!: boolean | CompiledBindingToolkitExpression;

	/**
	 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
	 */
	@association({ type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" })
	ariaLabelledBy!: string[];

	@aggregation({ type: "sap.ui.core.Control", multiple: false, isDefault: true })
	contentTrue!: ControlWithAccessibility;

	@aggregation({ type: "sap.ui.core.Control", multiple: false })
	contentFalse!: ControlWithAccessibility;

	constructor(
		id?: string | undefined | (PropertiesOf<ConditionalWrapper> & $ControlSettings),
		settings?: $ControlSettings & PropertiesOf<ConditionalWrapper>
	) {
		super(id as string, settings);
	}

	enhanceAccessibilityState(oElement: Control, mAriaProps: object): object {
		const oParent = this.getParent() as Control;

		if (oParent && oParent.enhanceAccessibilityState) {
			oParent.enhanceAccessibilityState(this, mAriaProps);
		}

		return mAriaProps;
	}

	/**
	 * This function provides the current accessibility state of the control.
	 * @returns The accessibility info of the wrapped control
	 */
	getAccessibilityInfo(): AccessibilityInfo {
		let content;
		if (this.condition) {
			content = this.contentTrue;
		} else {
			content = this.contentFalse;
		}
		return content?.getAccessibilityInfo ? content.getAccessibilityInfo() : {};
	}

	_setAriaLabelledBy(oContent?: ControlWithAccessibility): void {
		if (oContent && oContent.addAriaLabelledBy && oContent.getAriaLabelledBy) {
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
		// before calling the renderer of the ConditionalWrapper parent control may have set ariaLabelledBy
		// we ensure it is passed to its inner controls
		this._setAriaLabelledBy(this.contentTrue);
		this._setAriaLabelledBy(this.contentFalse);
	}

	static render(oRm: RenderManager, oControl: ConditionalWrapper): void {
		oRm.openStart("div", oControl);
		oRm.style("width", oControl.width);
		oRm.style("display", "inline-block");
		oRm.openEnd();
		if (oControl.condition) {
			oRm.renderControl(oControl.contentTrue);
		} else {
			oRm.renderControl(oControl.contentFalse);
		}
		oRm.close("div"); // end of the complete Control
	}
}

export default ConditionalWrapper as unknown as EnhanceWithUI5<ConditionalWrapper>;
