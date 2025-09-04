import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type BaseObject from "sap/ui/base/Object";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import type ControllerMetadata from "sap/ui/core/mvc/ControllerMetadata";
/**
 * A base implementation for controller extension used internally in sap.fe for central functionalities.
 * @public
 * @since 1.118.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.BaseControllerExtension")
export default class BaseControllerExtension extends ControllerExtension {
	constructor() {
		super();
		(this as unknown as { init: Function }).init();
	}

	/**
	 * This method is called when the controller extension is instantiated.
	 * We need to override it for the specific handling for BeforeAsync and AfterAsync methods, otherwise the last level of extension just replace our implementation.
	 * @returns The interface for this controller extension
	 */
	getInterface(): BaseObject {
		const interfaceObj = super.getInterface();
		const metadata = this.getMetadata() as ControllerMetadata;
		const allMethods = metadata.getAllMethods();
		const methodHolder: Record<string, Function[]> = {};

		for (const methodName in allMethods) {
			const method = allMethods[methodName];
			if (method.overrideExecution && (method.overrideExecution === "AfterAsync" || method.overrideExecution === "BeforeAsync")) {
				methodHolder[methodName] = [(interfaceObj as unknown as Record<string, Function>)[methodName]];
				Object.defineProperty(interfaceObj, methodName, {
					configurable: true,
					set: (v: Function) => {
						return methodHolder[methodName].push(v);
					},
					get: () => {
						return async (...args: unknown[]) => {
							const methodArrays = methodHolder[methodName];
							if (method.overrideExecution === "BeforeAsync") {
								methodArrays.reverse();
							}
							let result;
							for (const arg of methodArrays) {
								result = await arg.apply(this, args);
							}
							return result;
						};
					}
				});
			}
		}

		return interfaceObj;
	}
}
