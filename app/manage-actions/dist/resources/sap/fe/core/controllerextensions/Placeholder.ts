import ObjectPath from "sap/base/util/ObjectPath";
import type FlexibleColumnLayout from "sap/f/FlexibleColumnLayout";
import { defineUI5Class, publicExtension } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type PageController from "sap/fe/core/PageController";
import "sap/fe/placeholder/library";
import type NavContainer from "sap/m/NavContainer";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import type Control from "sap/ui/core/Control";
import Placeholder from "sap/ui/core/Placeholder";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";

type PlaceholderDebugStats = {
	iHidePlaceholderTimestamp: number;
	iPageReadyEventTimestamp: number;
	iHeroesBatchReceivedEventTimestamp: number;
};
type PlaceholderRootContainer = (NavContainer | FlexibleColumnLayout) & {
	_placeholder: {
		placeholder: unknown;
	};
	hidePlaceholder: Function;
};
/**
 * {@link sap.ui.core.mvc.ControllerExtension Controller extension} for Placeholder
 *
 */
@defineUI5Class("sap.fe.core.controllerextensions.Placeholder")
class PlaceholderControllerExtension extends ControllerExtension {
	private base!: PageController;

	private oAppComponent!: AppComponent;

	private oRootContainer!: PlaceholderRootContainer;

	private debugStats!: PlaceholderDebugStats;

	constructor() {
		super();
	}

	@publicExtension()
	public attachHideCallback(): void {
		if (this.isPlaceholderEnabled()) {
			const oView = this.base.getView();
			const oPage = oView.getParent() && (oView.getParent() as Control & { oContainer: ComponentContainer }).oContainer;
			const oNavContainer = (oPage && oPage.getParent()) as PlaceholderRootContainer;

			if (!oNavContainer || !oPage) {
				return;
			}
			const _fnContainerDelegate = {
				onAfterShow: function (oEvent: { isBackToPage?: boolean }): void {
					if (
						oEvent.isBackToPage ||
						new URLSearchParams(window.location.hash.replace(/#.*\?/, "")).get("restoreHistory") === "true"
					) {
						// in case we navigate to the listreport using the shell
						oNavContainer.hidePlaceholder();
					}
				}
			};
			oPage.addEventDelegate(_fnContainerDelegate);

			const oPageReady = oView.getController().pageReady;
			//In case of objectPage, the placeholder should be hidden when heroes requests are received
			// But for some scenario like "Create item", heroes requests are not sent .
			// The pageReady event is then used as fallback

			const aAttachEvents = ["pageReady"];
			if (oView.getControllerName() === "sap.fe.templates.ObjectPage.ObjectPageController") {
				aAttachEvents.push("heroesBatchReceived");
			}
			aAttachEvents.forEach((sEvent: string) => {
				oPageReady.attachEvent(
					sEvent,
					null,
					function () {
						oNavContainer.hidePlaceholder();
					},
					this
				);
			});
		}
	}

	@publicExtension()
	attachRouteMatchers(): void {
		this._init();
	}

	hideRootPlaceholder(): void {
		this.oRootContainer = this.oAppComponent.getRootContainer() as PlaceholderRootContainer;
		this.oRootContainer.hidePlaceholder();
	}

	_init(): void {
		this.oAppComponent = this.base.getAppComponent();
		this.oRootContainer = this.oAppComponent.getRootContainer() as PlaceholderRootContainer;

		// eslint-disable-next-line no-constant-condition
		if (this.isPlaceholderEnabled()) {
			Placeholder.registerProvider(function (oConfig: { name: string }) {
				switch (oConfig.name) {
					case "sap.fe.templates.ListReport":
						return {
							html: "sap/fe/placeholder/view/PlaceholderLR.fragment.html",
							autoClose: false
						};
					case "sap.fe.templates.ObjectPage":
						return {
							html: "sap/fe/placeholder/view/PlaceholderOP.fragment.html",
							autoClose: false
						};
					default:
				}
			});
		}
		if (this.isPlaceholderDebugEnabled()) {
			this.initPlaceholderDebug();
		}
	}

	@publicExtension()
	initPlaceholderDebug(): void {
		this.resetPlaceholderDebugStats();
		const handler = {
			apply: (target: Function): unknown => {
				if (this.oRootContainer._placeholder && this.oRootContainer._placeholder.placeholder) {
					this.debugStats.iHidePlaceholderTimestamp = Date.now();
				}
				return target.bind(this.oRootContainer)();
			}
		};
		// eslint-disable-next-line no-undef
		const proxy1 = new Proxy(this.oRootContainer.hidePlaceholder, handler);
		this.oRootContainer.hidePlaceholder = proxy1;
	}

	@publicExtension()
	isPlaceholderDebugEnabled(): boolean {
		if (new URLSearchParams(window.location.search).get("sap-ui-xx-placeholder-debug") === "true") {
			return true;
		}
		return false;
	}

	@publicExtension()
	resetPlaceholderDebugStats(): void {
		this.debugStats = {
			iHidePlaceholderTimestamp: 0,
			iPageReadyEventTimestamp: 0,
			iHeroesBatchReceivedEventTimestamp: 0
		};
	}

	@publicExtension()
	getPlaceholderDebugStats(): PlaceholderDebugStats {
		return this.debugStats;
	}

	@publicExtension()
	isPlaceholderEnabled(): boolean {
		const bPlaceholderEnabledInFLP = ObjectPath.get("sap-ushell-config.apps.placeholder.enabled");
		if (bPlaceholderEnabledInFLP === false) {
			return false;
		}

		return Placeholder.isEnabled();
	}

	@publicExtension()
	disableAnimation(): void {
		this.base.getAppComponent().getRootControl().addStyleClass("sapFeNoAnimation");
	}

	@publicExtension()
	enableAnimation(): void {
		this.base.getAppComponent().getRootControl().removeStyleClass("sapFeNoAnimation");
	}
}

export default PlaceholderControllerExtension;
