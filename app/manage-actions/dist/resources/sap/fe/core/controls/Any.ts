import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import Element from "sap/ui/core/Element";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

export type AnyType = Element & {
	new (props: {
		any?: PropertyBindingInfo;
		anyText?: PropertyBindingInfo;
		anyBoolean?: PropertyBindingInfo;
		bindBackProperty?: string;
	}): AnyType;
	mBindingInfos: object;
	setBindBackProperty(value: string): void;
	getBindBackProperty(): string | undefined;
	getAny(): unknown;
	getAnyText(): string;
	setAny(value: unknown): void;
	setAnyText(value: string): void;
	getBindingInfo(property: string): object;
	extend(sName: string, sExtension: string): AnyType;
};

/**
 * A custom element to evaluate the value of Binding.
 * @hideconstructor
 */
const Any = Element.extend("sap.fe.core.controls.Any", {
	metadata: {
		properties: {
			any: "any",
			bindBackProperty: "string",
			anyText: "string",
			anyBoolean: "boolean"
		}
	},
	updateProperty: function (this: AnyType, name: string) {
		// Avoid Promise processing in ManagedObject and set Promise as value directly
		const newValue = this.getBindingInfo(name).binding.getExternalValue();
		if (name === "any") {
			this.setAny(newValue);
			const bindingContext = this.getBindingContext();
			if (this.getBindBackProperty() && bindingContext) {
				const localAnnotationModel = (
					this.getModel() as ODataModel & { getLocalAnnotationModel: JSONModel }
				).getLocalAnnotationModel();
				const path = bindingContext.getPath(this.getBindBackProperty());
				if (localAnnotationModel.getProperty(path) !== newValue) {
					localAnnotationModel.setProperty(path, newValue);
				}
			}
		} else {
			this.setAnyText(newValue);
		}
	}
});

export default Any as unknown as AnyType;
