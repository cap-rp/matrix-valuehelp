import type { ConvertedMetadata } from "@sap-ux/vocabularies-types";
import { defineUI5Class, event, implementInterface, property } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import type { IBuildingBlockOwnerComponent } from "sap/fe/core/buildingBlocks/IBuildingBlockOwnerComponent";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { NavigationTargetConfiguration } from "sap/fe/core/converters/ManifestSettings";
import { type BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import { getMetaModelById } from "sap/fe/core/converters/MetaModelConverter";
import type { DefinitionContext, DefinitionPage } from "sap/fe/core/definition/FEDefinition";
import type { TitleInformation } from "sap/fe/core/rootView/RootViewBaseController";
import type ComponentContainer from "sap/ui/core/ComponentContainer";
import UIComponent from "sap/ui/core/UIComponent";
import type { IAsyncContentCreation } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import type BaseContext from "sap/ui/model/Context";
import type Model from "sap/ui/model/Model";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

export type NavigationConfiguration = {
	detail: {
		route: string;
		parameters: unknown;
		outbound?: string;
		outboundDetail?: NavigationTargetConfiguration["outboundDetail"];
	};
	create: {
		route: string;
		parameters: unknown;
		outbound?: string;
		outboundDetail?: NavigationTargetConfiguration["outboundDetail"];
	};
};

export type XMLPreprocessorContext = {
	bindingContexts: Record<string, BaseContext | null>;
	models: Record<string, Model>;
	fullContextPath: string;
	getConvertedMetadata: () => ConvertedMetadata;
	getDefinitionContext: () => DefinitionContext;
	getDefinitionForPage: () => DefinitionPage;
	appComponent: AppComponent;
	viewId: string;
};

@defineUI5Class("sap.fe.core.TemplateComponent")
class TemplateComponent extends UIComponent implements IAsyncContentCreation, IBuildingBlockOwnerComponent {
	@implementInterface("sap.ui.core.IAsyncContentCreation")
	__implements__sap_ui_core_IAsyncContentCreation = true;

	@implementInterface("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent")
	__implements__sap_fe_core_buildingBlocks_IBuildingBlockOwnerComponent = true;

	/**
	 * Name of the OData entity set
	 */
	@property({ type: "string", defaultValue: null })
	entitySet: string | null = null;

	/**
	 * Context Path for rendering the template
	 */
	@property({ type: "string", defaultValue: null })
	contextPath: string | null = null;

	@property({ type: "object" })
	preprocessorContext?: XMLPreprocessorContext;

	/**
	 * The pattern for the binding context to be create based on the parameters from the navigation
	 * If not provided we'll default to what was passed in the URL
	 */
	@property({ type: "string" })
	bindingContextPattern!: string;

	/**
	 * Map of used OData navigations and its routing targets
	 */
	@property({ type: "object" })
	navigation!: Record<string, NavigationConfiguration>;

	/**
	 * Enhance the i18n bundle used for this page with one or more app specific i18n resource bundles or resource models
	 * or a combination of both. The last resource bundle/model is given highest priority
	 */
	@property({ type: "string[]" })
	enhanceI18n!: string[];

	/**
	 * Define control related configuration settings
	 */
	@property({ type: "object" })
	controlConfiguration?: Record<string, unknown>;

	@property({ type: "object" })
	inlineEdit?: Record<string, unknown>;

	/**
	 * Adjusts the template content
	 */
	@property({ type: "object" })
	content?: Record<string, unknown>;

	/**
	 * Whether or not you can reach this page directly through semantic bookmarks
	 */
	@property({ type: "boolean" })
	allowDeepLinking!: boolean;

	/**
	 * Defines the context path on the component that is refreshed when the app is restored using keep alive mode
	 */
	@property({ type: "object" })
	refreshStrategyOnAppRestore: unknown;

	@property({ type: "string" })
	viewType = "XML";

	@property({ type: "string" })
	viewName?: string;

	@property({ type: "string" })
	_jsxViewName = "";

	@event()
	containerDefined!: Function;

	@event()
	heroesBatchReceived!: Function;

	@event()
	workersBatchReceived!: Function;

	protected oAppComponent!: AppComponent;

	private _rootController?: PageController;

	// The id of a fragment being processed, it will take priority in the ID generation
	private _temporaryFragmentId?: string;

	setContainer(oContainer: ComponentContainer): this {
		super.setContainer(oContainer);
		this.fireEvent("containerDefined", { container: oContainer });
		return this;
	}

	init(): void {
		this.oAppComponent = CommonUtils.getAppComponent(this);
		super.init();
	}

	// This method is called by UI5 core to access to the component containing the customizing configuration.
	// as controller extensions are defined in the manifest for the app component and not for the
	// template component we return the app component.
	getExtensionComponent(): AppComponent {
		return this.oAppComponent;
	}

	getAppComponent(): AppComponent {
		return this.oAppComponent;
	}

	setRootController(controller: PageController): void {
		this._rootController = controller;
	}

	getRootController(): PageController | undefined {
		const rootControl: View = this.getRootControl();
		let rootController: PageController | undefined;
		if (rootControl && rootControl.getController) {
			rootController = rootControl.getController() as PageController;
		} else {
			rootController = this._rootController;
		}
		return rootController;
	}

	onPageReady(mParameters: unknown): void {
		const rootController = this.getRootController();
		if (rootController && rootController.onPageReady) {
			rootController.onPageReady(mParameters);
		}
	}

	getNavigationConfiguration(sTargetPath: string): NavigationConfiguration {
		const mNavigation = this.navigation;
		return mNavigation[sTargetPath];
	}

	getViewData(): Record<string, unknown> {
		const mProperties = this.getMetadata().getAllProperties();
		const oViewData = Object.keys(mProperties).reduce((mViewData: Record<string, unknown>, sPropertyName: string) => {
			mViewData[sPropertyName] = mProperties[sPropertyName].get!(this);
			return mViewData;
		}, {});
		delete oViewData.preprocessorContext;
		// Access the internal _isFclEnabled which will be there
		oViewData.fclEnabled = this.oAppComponent._isFclEnabled();
		const routingTargetName = this.oAppComponent.getRoutingService().getTargetName(this);
		oViewData.isInlineEditEnabled = routingTargetName
			? this.oAppComponent.getInlineEditService().doesPageHaveInlineEdit(routingTargetName)
			: false;

		return oViewData;
	}

	_getPageTitleInformation(): TitleInformation {
		const rootControl = this.getRootControl();
		if (rootControl && rootControl.getController() && rootControl.getController()._getPageTitleInformation) {
			return rootControl.getController()._getPageTitleInformation();
		} else {
			return {} as TitleInformation;
		}
	}

	getExtensionAPI(): ExtensionAPI {
		return this.getRootControl().getController().getExtensionAPI();
	}

	/**
	 * Retrieves the metamodel for the given metamodel reference (ID / name or undefined for the default one).
	 * @param metaModelReference The metamodel reference
	 * @returns The correct metamodel if it exits
	 */
	getMetaModel(metaModelReference?: string): ODataMetaModel | undefined {
		if (!metaModelReference) {
			return this.preprocessorContext?.models.metaModel as ODataMetaModel | undefined;
		} else if (metaModelReference.startsWith("id-")) {
			return getMetaModelById(metaModelReference);
		} else if (!this.getModel(metaModelReference)) {
			return this.getAppComponent().getModel(metaModelReference)?.getMetaModel() as ODataMetaModel | undefined;
		} else {
			return this.getModel(metaModelReference)?.getMetaModel() as ODataMetaModel | undefined;
		}
	}

	/**
	 * Retrieves the full context path for the given metamodel reference (ID / name or undefined for the default one).
	 * @param metaModelReference The metamodel reference
	 * @returns The correct full context path
	 */
	getFullContextPath(metaModelReference?: string): string | undefined {
		if (!metaModelReference) {
			return this.preprocessorContext?.fullContextPath;
		}
	}

	/**
	 * Retrieves the ManifestWrapper for the current view.
	 * @returns The ManifestWrapper
	 */
	getManifestWrapper(): ManifestWrapper {
		return new ManifestWrapper(this.getViewData() as BaseManifestSettings);
	}
}
interface TemplateComponent {
	// TODO: this should be ideally be handled by the editflow/routing without the need to have this method in the object page - for now keep it here
	createDeferredContext?(
		sPath: string,
		oListBinding: ODataListBinding | undefined,
		parentContext: Context | undefined,
		data: object | undefined,
		bActionCreate: boolean
	): void;
	isOpenInEditMode(): boolean;
	getRootControl(): { getController(): PageController } & View;
	extendPageDefinition?(pageDefinition: {}, converterContext?: ConverterContext): {};
	getModel(): ODataModel;
	getModel(modelName: "_pageModel"): JSONModel;
	getModel(modelName: string): Model | undefined;
}
export default TemplateComponent;
