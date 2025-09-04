import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { $ManagedObjectSettings } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type { $ComponentContainerSettings } from "sap/ui/core/ComponentContainer";
import Control from "sap/ui/core/Control";
import type RenderManager from "sap/ui/core/RenderManager";
import type { $TargetSettings } from "sap/ui/core/routing/Target";
import type Targets from "sap/ui/core/routing/Targets";
import type UIComponent from "sap/ui/core/UIComponent";

/**
 * Control for loading a component using UI5 routing.
 */
@defineUI5Class("sap.fe.core.controls.ComponentLoader")
export default class ComponentLoader extends Control {
	/**
	 * Name of the component.
	 */
	@property({ type: "string", required: true })
	name!: string;

	/**
	 * Route prefix for the component.
	 */
	@property({ type: "string" })
	prefix?: string;

	/**
	 * Setting that will be passed to the component.
	 */
	@property({ type: "object" })
	settings?: $ComponentContainerSettings["settings"];

	/**
	 * This aggregation holds the embedded component.
	 */
	@aggregation({ type: "sap.ui.core.ComponentContainer", multiple: false, isDefault: true })
	private component: ComponentContainer | null = null;

	/**
	 * Targets API.
	 */
	private targets!: Targets;

	init(): void {
		this.targets = this.getTargets();
	}

	/**
	 * Get the {@link Targets} instance responsible for this control.
	 * @returns The {@link Targets} instance.
	 * @throws If the instance could not be found, e.g., if there is no router at all.
	 */
	private getTargets(): Targets {
		let component = Component.getOwnerComponentFor(this);
		let targets: Targets | undefined;
		while (component && !targets) {
			if (component.isA<UIComponent>("sap.ui.core.UIComponent")) {
				targets = component.getTargets();
			}
			component = Component.getOwnerComponentFor(component);
		}

		if (!targets) {
			throw new Error("Could not determine the instance of sap.ui.core.routing.Targets");
		}

		return targets;
	}

	/**
	 * Add a target, using this control's ID as the name.
	 */
	private addTarget(): void {
		const target = this.targets.getTarget(this.getId(), true);
		if (!target) {
			// UI5 routing will later create one instance of the component per tuple [name, id] or [usage, id], respectively.
			const targetSettings: $TargetSettings & { options?: object } = {
				type: "Component",
				name: this.name,
				id: this.getId(),

				// this is where the component's view will be placed. It must be **this** control's 'component' aggregation.
				controlId: this.getId(),
				controlAggregation: "component"
			};

			if (this.settings) {
				targetSettings.options = { settings: this.settings };
			}

			this.targets.addTarget(this.getId(), targetSettings);
		}
	}

	applySettings(mSettings: $ManagedObjectSettings, oScope?: object): this {
		super.applySettings(mSettings, oScope);
		this.addTarget();
		return this;
	}

	onBeforeRendering(): void {
		this.targets.display({
			name: this.getId(),
			prefix: this.prefix,
			routeRelevant: true
		});
	}

	static render(rm: RenderManager, loader: ComponentLoader): void {
		// delegate rendering to the nested ComponentContainer
		if (loader.component) {
			loader.component.getRenderer().render(rm, loader.component);
		}
	}
}
