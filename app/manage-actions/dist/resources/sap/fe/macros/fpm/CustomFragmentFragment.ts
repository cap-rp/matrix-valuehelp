import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import Fragment from "sap/ui/core/Fragment";

@defineUI5Class("sap.fe.macros.fpm.CustomFragmentFragment")
export default class CustomFragmentFragment extends Fragment {
	/*
	 * Event to hold and resolve functions for runtime building blocks
	 */
	@property({ type: "string" })
	childCustomData!: object;

	@property({ type: "string" })
	contextPath?: string;
}
