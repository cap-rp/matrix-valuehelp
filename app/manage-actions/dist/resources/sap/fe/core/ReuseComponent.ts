import Log from "sap/base/Log";
import { defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import FPMComponent from "sap/fe/core/fpm/Component";
import type ManagedObject from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";

@defineUI5Class("sap.fe.core.ReuseComponent")
class ReuseComponent extends FPMComponent {
	@property({ type: "object" })
	override?: Record<string, object>;

	// event that is fired once the component is initialized
	@event()
	initialized!: Function;

	container!: ComponentContainer;

	hooksApplied = false;

	rootControlCreated!: (control: Control) => void;

	/**
	 * Sets the container of the component.
	 *
	 * This is being called by UI5. We override this method to keep track of the container and to initialize the router.
	 * @param container The container
	 * @returns The instance of the component
	 */
	setContainer(container: ComponentContainer): this {
		super.setContainer(container);
		this.container = container;

		const router = this.getRouter();
		if (router) {
			// once the container is set, we can initialize the router
			router.initialize();
		}

		return this;
	}

	applyHooks(): void {
		type FunctionMap = {
			[key: string]: Function;
		};
		type DeepFunctionMap = {
			[key: string]: FunctionMap;
		};

		if (this.hooksApplied || !this.container) {
			return;
		}
		const pageController = this.getPageComponent().getRootController();

		if (!pageController) {
			return;
		}

		for (const controllerExtensionOverrideName in this.override) {
			const controllerExtensionOverride = this.override[controllerExtensionOverrideName];
			const pageControllerExtension = (pageController as unknown as DeepFunctionMap)[controllerExtensionOverrideName];

			if (!pageControllerExtension) {
				Log.error(`The controller extension ${controllerExtensionOverrideName} does not exist in the page controller.`);
				continue;
			}
			for (const hookName in controllerExtensionOverride) {
				const attachHook = pageControllerExtension[`attach${String(hookName)}`];
				if (!attachHook) {
					Log.error(`The hook ${hookName} does not exist in the page controller extension ${controllerExtensionOverrideName}.`);
					continue;
				}
				const handlerFunction = (controllerExtensionOverride as FunctionMap)[hookName];

				attachHook(handlerFunction);
				pageController.getView().attachBeforeExit(() => {
					this.hooksApplied = false;
					pageControllerExtension[`detach${String(hookName)}`](handlerFunction);
				});
			}
		}
		this.hooksApplied = true;
		this.fireEvent("initialized");
	}

	/**
	 * Creates the content of the component.
	 *
	 * This is being called by UI5. We override this method to implement our own template logic
	 * and to inform UI5 when the root control is being created.
	 * @returns A promise that resolves with the root control
	 */
	async createContent(): Promise<Control> {
		this.attachModelContextChange(this.applyHooks.bind(this));

		return new Promise((resolve) => {
			this.rootControlCreated = resolve;
		});
	}

	/**
	 * Sets an aggregation of the component.
	 *
	 * This is being called by UI5. We override this method to know when the rootControl is being set.
	 * @param aggregationName The name of the aggregation
	 * @param object The object to set
	 * @param suppressInvalidate Whether to suppress invalidation
	 * @returns The instance of the component
	 */
	setAggregation(aggregationName: string, object: ManagedObject, suppressInvalidate?: boolean): this {
		if (aggregationName === "rootControl") {
			const rootControl = object as Control;
			this.rootControlCreated(rootControl);
		}
		return super.setAggregation(aggregationName, object, suppressInvalidate);
	}

	getContextPath(): string {
		const contextPath = this.contextPath;
		if (contextPath?.startsWith("/")) {
			// absolute path
			return contextPath;
		} else {
			// relative path - we need to prepend the context path of the parent view
			const currentView = CommonUtils.getCurrentPageView(this.getAppComponent());
			const parentContextPath = currentView.getViewData().contextPath || "/" + currentView.getViewData().entitySet;
			if (contextPath) {
				return parentContextPath + "/" + contextPath;
			} else {
				return parentContextPath;
			}
		}
	}

	/**
	 * Returns the view name of the reuse component.
	 * This is being called by the template service to create the view.
	 * @returns The view name
	 */
	getViewName(): string {
		const rootViewName = this.getManifestEntry("sap.ui5").rootView?.viewName;
		if (!rootViewName && !this.viewName) {
			throw new Error("No root view defined in the manifest nor viewName set in the component");
		}
		return rootViewName || this.viewName;
	}

	/**
	 * Returns the page component that owns the reuse component.
	 * @returns The page component
	 */
	getPageComponent(): TemplateComponent {
		// the owner of the reuse component is not the page component but the app component.
		// we rely on the parent of the container to be the owned by the page component
		// and get the extensionAPI from there. If the parent is not a control, we throw an error
		const parent = this.container?.getParent();
		if (!parent) {
			throw new Error("The parent of the reuse component is not yet set. Thus, the page component cannot be retrieved.");
		}
		return Component.getOwnerComponentFor(parent) as TemplateComponent;
	}

	/**
	 * Returns the extension API of the page component that owns the reuse component.
	 * @returns The extension API
	 */
	getExtensionAPI(): ExtensionAPI {
		return this.getPageComponent().getExtensionAPI();
	}
}

export default ReuseComponent;
