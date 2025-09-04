import {
	getRenameAction,
	getTargetPropertyFromFormElement,
	getTextArrangementChangeAction
} from "sap/fe/core/designtime/AnnotationBasedChanges";
import type Control from "sap/ui/core/Control";
import FeaturesAPI from "sap/ui/fl/write/api/FeaturesAPI";
import type FormElement from "sap/ui/layout/form/FormElement";

export default {
	actions: {
		annotation: (control: Control): object => {
			let renameOption;
			const targetPropertyPath = getTargetPropertyFromFormElement(control);
			if (targetPropertyPath && FeaturesAPI.areAnnotationChangesEnabled()) {
				renameOption = getRenameAction(true);
			}
			const returnOptions: Record<string, object> = {
				textArrangement: getTextArrangementChangeAction()
			};
			if (renameOption) {
				returnOptions.rename = renameOption;
			}
			return returnOptions;
		},
		rename: (control: Control): undefined | { changeType: string; domRef: Function } => {
			const targetPropertyPath = getTargetPropertyFromFormElement(control);
			if (targetPropertyPath && FeaturesAPI.areAnnotationChangesEnabled()) {
				return undefined;
			}
			return {
				changeType: "renameField",
				domRef: function (oControl: FormElement): Element | null {
					return (oControl.getLabelControl() as unknown as Control)?.getDomRef();
				}
			};
		}
	}
};
