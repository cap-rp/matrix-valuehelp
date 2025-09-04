import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import Element from "sap/ui/core/Element";

export type AnyElementType = Element & {
	new (props: { anyText?: PropertyBindingInfo }): AnyElementType;
	mBindingInfos: object;
	getAnyText(): string;
	setAnyText(value: unknown): void;
	getBindingInfo(property: string): object;
	extend(sName: string, sExtension: string): AnyElementType;
};

/**
 * A custom element to evaluate the value of Binding.
 * @hideconstructor
 */
const AnyElement = Element.extend("sap.fe.core.controls.AnyElement", {
	metadata: {
		properties: {
			anyText: "string"
		}
	},
	updateProperty: function (this: AnyElementType, sName: string) {
		// Avoid Promise processing in Element and set Promise as value directly
		if (sName === "anyText") {
			this.setAnyText(this.getBindingInfo(sName).binding.getExternalValue());
		}
	}
});

export default AnyElement as unknown as AnyElementType;
