import type DynamicPage from "sap/f/DynamicPage";
import { defineUI5Class, extensible, publicExtension, usingExtension } from "sap/fe/base/ClassSupport";
import BaseController from "sap/fe/core/BaseController";
import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import CollaborativeDraft from "sap/fe/core/controllerextensions/CollaborativeDraft";
import EditFlow from "sap/fe/core/controllerextensions/EditFlow";
import InlineEditFlow from "sap/fe/core/controllerextensions/InlineEditFlow";
import IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import InternalIntentBasedNavigation from "sap/fe/core/controllerextensions/InternalIntentBasedNavigation";
import InternalRouting from "sap/fe/core/controllerextensions/InternalRouting";
import MessageHandler from "sap/fe/core/controllerextensions/MessageHandler";
import PageReady from "sap/fe/core/controllerextensions/PageReady";
import Paginator from "sap/fe/core/controllerextensions/Paginator";
import Placeholder from "sap/fe/core/controllerextensions/Placeholder";
import Recommendations from "sap/fe/core/controllerextensions/Recommendations";
import Routing from "sap/fe/core/controllerextensions/Routing";
import Share from "sap/fe/core/controllerextensions/Share";
import SideEffects from "sap/fe/core/controllerextensions/SideEffects";
import Telemetry from "sap/fe/core/controllerextensions/Telemetry";
import ViewState from "sap/fe/core/controllerextensions/ViewState";
import type { TitleInformation } from "sap/fe/core/rootView/RootViewBaseController";
import MessageBox from "sap/m/MessageBox";
import Component from "sap/ui/core/Component";
import Library from "sap/ui/core/Lib";
import type View from "sap/ui/core/mvc/View";
import type Control from "sap/ui/mdc/Control";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import ContextSharing from "./controllerextensions/ContextSharing";
import CollaborationManager from "./controllerextensions/cards/CollaborationManager";

/**
 * Base controller class for your custom page used inside an SAP Fiori elements application.
 *
 * This controller provides preconfigured extensions that will ensure you have the basic functionalities required to use the building blocks.
 * @hideconstructor
 * @public
 * @since 1.88.0
 */
@defineUI5Class("sap.fe.core.PageController")
class PageController extends BaseController {
	@usingExtension(Routing)
	routing!: Routing;

	@usingExtension(CollaborativeDraft)
	collaborativeDraft!: CollaborativeDraft;

	@usingExtension(InternalRouting)
	_routing!: InternalRouting;

	@usingExtension(EditFlow)
	editFlow!: EditFlow;

	@usingExtension(IntentBasedNavigation)
	intentBasedNavigation!: IntentBasedNavigation;

	@usingExtension(InternalIntentBasedNavigation)
	_intentBasedNavigation!: InternalIntentBasedNavigation;

	@usingExtension(PageReady)
	pageReady!: PageReady;

	@usingExtension(MessageHandler)
	messageHandler!: MessageHandler;

	@usingExtension(Share)
	share!: Share;

	@usingExtension(Paginator)
	paginator!: Paginator;

	@usingExtension(ViewState)
	viewState!: ViewState;

	@usingExtension(Placeholder)
	placeholder!: Placeholder;

	@usingExtension(SideEffects)
	_sideEffects!: SideEffects;

	@usingExtension(Recommendations)
	recommendations!: Recommendations;

	@usingExtension(Telemetry)
	telemetry!: Telemetry;

	@usingExtension(ContextSharing)
	contextSharing!: ContextSharing;

	@usingExtension(CollaborationManager)
	collaborationManager!: CollaborationManager;

	@usingExtension(InlineEditFlow)
	inlineEditFlow!: InlineEditFlow;

	extension!: Record<string, unknown>;

	_oView?: View;

	routingTargetName?: string;

	protected extensionAPI?: ExtensionAPI;

	constructor(name: string) {
		super(name);

		const ownProps = Object.getOwnPropertyNames(this.constructor.prototype);
		for (const ownProp of ownProps) {
			if (ownProp !== "constructor" && ownProp !== "getMetadata" && ownProp !== "extension") {
				const fnProp = (this as Record<string, unknown>)[ownProp];
				if (fnProp && typeof fnProp === "function" && !(fnProp as { getMetadata?: Function }).getMetadata) {
					(this as Record<string, unknown>)[ownProp] = (...args: unknown[]): unknown => {
						const ownerComponent = Component.getOwnerComponentFor(this.getView());
						if (ownerComponent) {
							return ownerComponent.runAsOwner(() => fnProp.apply(this, args));
						} else {
							return fnProp.apply(this, args);
						}
					};
				}
			}
		}

		Object.defineProperty(this, "oView", {
			get(): View | undefined {
				return this._oView;
			},
			set(v: View) {
				this._oView = v;
				// On the initial view instantiation from XML the templating process may be finished before the view is completely created
				// When that happens we need to ensure that the root controller is available on the TemplateComponent
				this.getOwnerComponent()?.setRootController?.(this);
			}
		});
	}

	@publicExtension()
	onInit(): void {
		const oUIModel = this.getAppComponent().getModel("ui"),
			oInternalModel = this.getAppComponent().getModel("internal") as JSONModel,
			sPath = `/pages/${this.getView().getId()}`;

		oUIModel.setProperty(sPath, {
			controls: {}
		});
		oInternalModel.setProperty(sPath, {
			controls: {},
			collaboration: {}
		});
		this.getView().bindElement({
			path: "/",
			model: "ui"
		});
		this.getView().bindElement({
			path: sPath,
			model: "internal"
		});

		// for the time being provide it also pageInternal as some macros access it - to be removed
		this.getView().bindElement({
			path: sPath,
			model: "pageInternal"
		});
		this.getView().setModel(oInternalModel, "pageInternal");

		// as the model propagation happens after init but we actually want to access the binding context in the
		// init phase already setting the model here
		this.getView().setModel(oUIModel, "ui");
		this.getView().setModel(oInternalModel, "internal");
	}

	@publicExtension()
	onBeforeRendering(): void {
		if (this.placeholder.attachHideCallback) {
			this.placeholder.attachHideCallback();
		}
	}

	/**
	 * Get the extension API for the current page.
	 * @param id PRIVATE
	 * @public
	 * @returns The extension API.
	 */
	@publicExtension()
	getExtensionAPI(id?: string): ExtensionAPI {
		if (!this.extensionAPI) {
			this.extensionAPI = new ExtensionAPI(this, id);
		}
		return this.extensionAPI;
	}

	// We specify the extensibility here the same way as it is done in the object page controller
	// since the specification here overrides it and if we do not specify anything here, the
	// behavior defaults to an execute instead!
	// TODO This may not be ideal, since it also influences the list report controller but currently it's the best solution.
	@publicExtension()
	@extensible("After")
	onPageReady(_mParameters: unknown): void {
		// Apply app state only after the page is ready with the first section selected
		const view = this.getView();
		this.getAppComponent().getAppStateHandler().applyAppState(view.getId(), view);
	}

	_getPageTitleInformation(): TitleInformation {
		return {};
	}

	_getPageModel(): JSONModel | undefined {
		const pageComponent = Component.getOwnerComponentFor(this.getView());
		return pageComponent?.getModel("_pageModel") as JSONModel;
	}

	/**
	 * Opens one or more new tabs with the given outbound target for the selected contexts.
	 * @param outboundTarget The outbound target
	 * @param contexts The selected contexts
	 * @param createPath The create path
	 * @param maxNumberOfSelectedItems The maximum number of selected items
	 */
	onOpenInNewTabNavigateOutBound(
		outboundTarget: string,
		contexts: Context[],
		createPath: string,
		maxNumberOfSelectedItems: number
	): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		if (contexts.length <= maxNumberOfSelectedItems) {
			contexts.forEach(function (context: Context) {
				that._intentBasedNavigation.onChevronPressNavigateOutBound(that, outboundTarget, context, createPath, "explace");
			});
		} else {
			MessageBox.warning(
				Library.getResourceBundleFor("sap.fe.macros")!.getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [
					maxNumberOfSelectedItems
				])
			);
		}
	}

	/**
	 * Get the name of the page as defined in the manifest routing section.
	 * @returns The name of the page
	 */
	getRoutingTargetName(): string {
		if (!this.routingTargetName) {
			this.routingTargetName = this.getAppComponent().getRoutingService().getTargetNameForView(this.getView()) ?? "";
		}
		return this.routingTargetName;
	}

	/**
	 * Method to forward setShowFooter on the first content of the view if recognized.
	 * @param show
	 */
	setShowFooter(show = false): void {
		const page = this.getView().getContent()[0];
		if (page.isA<DynamicPage>("sap.f.DynamicPage") || page.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout")) {
			page.setShowFooter(show);
		}
	}

	/**
	 * Method to get the footer.
	 * @returns The footer of the page if it exists
	 */
	getFooter(): Control | undefined {
		const page = this.getView().getContent()[0];
		if (page.isA<DynamicPage>("sap.f.DynamicPage") || page.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout")) {
			return page.getFooter() as unknown as Control;
		}
		return undefined;
	}
}

export default PageController;
