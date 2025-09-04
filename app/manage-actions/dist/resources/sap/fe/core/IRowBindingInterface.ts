import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

@defineUI5Class("sap.fe.core.IRowBindingInterface")
export default abstract class IRowBindingInterface {
	__implements__sap_fe_core_IRowBindingInterface = true;

	abstract getRowBinding(): ODataListBinding;
}
