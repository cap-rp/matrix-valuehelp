import type AppComponent from "sap/fe/core/AppComponent";
import type Control from "sap/ui/core/Control";
import type BaseTreeModifier from "sap/ui/core/util/reflection/BaseTreeModifier";
import LayerUtils from "sap/ui/fl/LayerUtils";
import UnstashControl from "sap/ui/fl/changeHandler/UnstashControl";

type FlexChange = {
	getLayer: () => string;
};
export default class UnstashControlAndConnect {
	static async applyChange(change: FlexChange, control: Control, propertyBag: { modifier: typeof BaseTreeModifier }): Promise<void> {
		await UnstashControl.applyChange(change, control, propertyBag);
		if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
			// If we're at the key user layer we should force the disconnect as the stash is just a hide
			propertyBag.modifier.setProperty(control, "_disconnected", false);
		}
	}

	static async revertChange(change: FlexChange, control: Control, propertyBag: { modifier: typeof BaseTreeModifier }): Promise<void> {
		await UnstashControl.revertChange(change, control, propertyBag);
		if (!LayerUtils.isDeveloperLayer(change.getLayer())) {
			// If we're at the key user layer we should force the disconnect as the stash is just a hide
			propertyBag.modifier.setProperty(control, "_disconnected", true);
		}
	}

	static completeChangeContent(): void {}

	static getCondenserInfo(change: FlexChange): object {
		return UnstashControl.getCondenserInfo(change);
	}

	static getChangeVisualizationInfo(change: FlexChange, appComponent: AppComponent): object {
		return UnstashControl.getChangeVisualizationInfo(change, appComponent);
	}
}
