import { defineUI5Class } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import Control from "sap/ui/core/Control";
import type RenderManager from "sap/ui/core/RenderManager";

@defineUI5Class("sap.fe.controls.easyFill.EasyFillPlaceholder")
export default class EasyFillPlaceholder extends Control {
	static render(rm: RenderManager, control: EasyFillPlaceholder): void {
		jsx.renderUsingRenderManager(rm, control, () => {
			return <div ref={control} class={"sapFeEasyFillPlaceholder"}></div>;
		});
	}
}
