import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import VBox from "sap/m/VBox";
import StashedControlSupport from "sap/ui/core/StashedControlSupport";
@defineUI5Class("sap.fe.templates.ObjectPage.controls.StashableVBox", {
	designtime: "sap/fe/templates/ObjectPage/designtime/StashableVBox.designtime"
})
class StashableVBox extends VBox {
	@property({ type: "boolean" })
	_disconnected!: boolean;

	set_disconnected(disconnected: boolean): this {
		this._disconnected = disconnected;
		// By setting the binding context to `null` we are preventing data loading
		// Setting it back to `undefined` ensures that the parent context is applied
		if (disconnected) {
			this.setBindingContext(null);
		} else {
			this.setBindingContext(undefined);
		}
		return this;
	}
}
StashedControlSupport.mixInto(StashableVBox);

export default StashableVBox;
