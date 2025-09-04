import { defineUI5Class, publicExtension } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import BaseControllerExtension from "sap/fe/core/controllerextensions/BaseControllerExtension";
import type { TemplateType } from "sap/fe/core/converters/ManifestSettings";
import type { TelemetryEvents } from "sap/fe/core/services/TelemetryServiceFactory";

@defineUI5Class("sap.fe.core.controllerextensions.Telemetry")
export default class Telemetry extends BaseControllerExtension {
	base!: PageController;

	@publicExtension()
	public storeAction(actionDefinition: TelemetryEvents): void {
		this.base
			.getAppComponent()
			.getTelemetryService()
			.storeAction(actionDefinition, (this.base.getView()?.getViewData() as { converterType: string }).converterType as TemplateType);
	}
}
