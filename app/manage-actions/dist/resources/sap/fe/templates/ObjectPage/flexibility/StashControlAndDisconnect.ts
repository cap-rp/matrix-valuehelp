import type AppComponent from "sap/fe/core/AppComponent";
import type Control from "sap/ui/core/Control";
import type BaseTreeModifier from "sap/ui/core/util/reflection/BaseTreeModifier";
import LayerUtils from "sap/ui/fl/LayerUtils";
import StashControl from "sap/ui/fl/changeHandler/StashControl";

type FlexChange = {
	getLayer: () => string;
};
export default class StashControlAndDisconnect {
	static async applyChange(change: FlexChange, control: Control, propertyBag: { modifier: typeof BaseTreeModifier }): Promise<void> {
		await StashControl.applyChange(change, control, propertyBag);
		if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
			// If we're at the key user layer we should force the disconnect as the stash is just a hide
			propertyBag.modifier.setProperty(control, "_disconnected", true);
		}
	}

	static async revertChange(change: FlexChange, control: Control, propertyBag: { modifier: typeof BaseTreeModifier }): Promise<void> {
		await StashControl.revertChange(change, control, propertyBag);
		if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
			// If we're at the key user layer we should force the disconnect as the stash is just a hide
			propertyBag.modifier.setProperty(control, "_disconnected", false);
		}
	}

	static completeChangeContent(): void {}

	static getCondenserInfo(change: FlexChange): object {
		return StashControl.getCondenserInfo(change);
	}

	static getChangeVisualizationInfo(change: FlexChange, appComponent: AppComponent): object {
		return StashControl.getChangeVisualizationInfo(change, appComponent);
	}
}
