import ObjectPath from "sap/base/util/ObjectPath";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";

const customBooleanPropertyCheck = async function (
	this: ManagedObject,
	oView: View,
	modulePath: string,
	aSelectedContexts: Context[]
): Promise<boolean> {
	const parts = modulePath.split(".");
	const methodName = parts.pop() as string;
	const moduleName = parts.join("/");

	return FPMHelper.loadModuleAndCallMethod(
		moduleName,
		methodName,
		oView,
		this.getBindingContext(),
		aSelectedContexts || []
	) as Promise<boolean>;
};
customBooleanPropertyCheck.__functionName = "sap.fe.core.formatters.FPMFormatter#customBooleanPropertyCheck";

/**
 * Collection of table formatters.
 * @param this The context
 * @param sName The inner function name
 * @param oArgs The inner function parameters
 * @returns The value from the inner function
 */
const fpmFormatter = function (this: object, sName: string, ...oArgs: unknown[]): unknown {
	if (fpmFormatter.hasOwnProperty(sName)) {
		return (fpmFormatter as unknown as Record<string, Function>)[sName].apply(this, oArgs);
	} else {
		return "";
	}
};

fpmFormatter.customBooleanPropertyCheck = customBooleanPropertyCheck;

ObjectPath.set("sap.fe.core.formatters.FPMFormatter", fpmFormatter);

export default fpmFormatter;
