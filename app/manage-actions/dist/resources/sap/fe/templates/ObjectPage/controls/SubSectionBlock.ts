import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import BlockBase from "sap/uxap/BlockBase";
import type { BlockBaseColumnLayout } from "sap/uxap/library";
import uxapLib from "sap/uxap/library";
const BlockBaseFormAdjustment = uxapLib.BlockBaseFormAdjustment;
@defineUI5Class("sap.fe.templates.ObjectPage.controls.SubSectionBlock")
class SubSectionBlock extends BlockBase {
	@property({ type: "sap.uxap.BlockBaseColumnLayout", group: "Behavior", defaultValue: "4" })
	columnLayout!: BlockBaseColumnLayout;

	@aggregation({ type: "sap.ui.core.Control", multiple: false })
	content!: Control;

	private _oParentObjectPageSubSection!: { _oLayoutConfig: unknown };

	init(): void {
		super.init();
		(this as unknown as { _bConnected: boolean })._bConnected = true;
	}

	_applyFormAdjustment(): void {
		const sFormAdjustment = this.getFormAdjustment(),
			oView = this._getSelectedViewContent(),
			oParent = this._oParentObjectPageSubSection;
		let oFormAdjustmentFields;

		if (sFormAdjustment !== BlockBaseFormAdjustment.None && oView && oParent) {
			oFormAdjustmentFields = this._computeFormAdjustmentFields(sFormAdjustment, oParent._oLayoutConfig);

			this._adjustForm(oView, oFormAdjustmentFields);
		}
	}

	setMode(sMode: string): void {
		this.setProperty("mode", sMode);
		// OPTIONAL: this.internalModel.setProperty("/mode", sMode);
	}

	connectToModels(): void {
		// View is already connected to the UI5 model tree, hence no extra logic required here
	}

	/// SubSectionBlock use aggregation instead of a view, i.e. return that as the view content
	_getSelectedViewContent(): ManagedObject | ManagedObject[] | null {
		return this.getAggregation("content");
	}
}

interface SubSectionBlock {
	_adjustForm(view: ManagedObject | ManagedObject[], formFields: unknown): void;
	_computeFormAdjustmentFields(sFormAdjustment: string, _oLayoutConfig: unknown): unknown;
}

export default SubSectionBlock;
