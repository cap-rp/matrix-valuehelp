import { defineUI5Class } from "sap/fe/base/ClassSupport";
import HBox from "sap/m/HBox";
import type ManagedObject from "sap/ui/base/ManagedObject";

@defineUI5Class("sap.fe.macros.controls.CollaborationHBox")
class CollaborationHBox extends HBox {
	enhanceAccessibilityState(_oElement: object, mAriaProps: object): object {
		const oParent = this.getParent();

		if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
			// forward  enhanceAccessibilityState call to the parent
			(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(_oElement, mAriaProps);
		}

		return mAriaProps;
	}
}

export default CollaborationHBox;
