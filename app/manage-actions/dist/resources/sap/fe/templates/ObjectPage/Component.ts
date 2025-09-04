import Log from "sap/base/Log";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type { InboundParameter } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import TemplateComponent from "sap/fe/core/TemplateComponent";
import type ConverterContext from "sap/fe/core/converters/ConverterContext";
import type { ObjectPageDefinition } from "sap/fe/core/converters/templates/ObjectPageConverter";
import CoreLibrary from "sap/fe/core/library";
import type { FinalPageDefinition } from "sap/fe/templates/ObjectPage/ExtendPageDefinition";
import { extendObjectPageDefinition } from "sap/fe/templates/ObjectPage/ExtendPageDefinition";
import templateLib from "sap/fe/templates/library";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

const VariantManagement = CoreLibrary.VariantManagement,
	CreationMode = CoreLibrary.CreationMode;
const SectionLayout = templateLib.ObjectPage.SectionLayout;
@defineUI5Class("sap.fe.templates.ObjectPage.Component", { library: "sap.fe.templates", manifest: "json" })
class ObjectPageComponent extends TemplateComponent {
	/**
	 * Defines if and on which level variants can be configured:
	 * 		None: no variant configuration at all
	 * 		Page: one variant configuration for the whole page
	 * 		Control: variant configuration on control level
	 */
	@property({
		type: "sap.fe.core.VariantManagement",
		defaultValue: VariantManagement.None
	})
	variantManagement: typeof VariantManagement;

	/**
	 * Defines how the sections are rendered
	 * 		Page: all sections are shown on one page
	 * 		Tabs: each top-level section is shown in an own tab
	 */
	@property({
		type: "sap.fe.templates.ObjectPage.SectionLayout",
		defaultValue: SectionLayout.Page
	})
	sectionLayout: typeof SectionLayout;

	/**
	 * Enables the related apps features
	 */
	@property({
		type: "boolean",
		defaultValue: false
	})
	showRelatedApps!: boolean;

	/**
	 * Enables the 'Microsoft Teams > As Card' option in the 'Share' menu
	 */
	@property({
		type: "object"
	})
	share!: Record<string, Record<string, boolean>>;

	@property({ type: "object" })
	additionalSemanticObjects!: object;

	/**
	 * Enables the editable object page header
	 */
	@property({
		type: "boolean",
		defaultValue: true
	})
	editableHeaderContent!: boolean;

	/**
	 * Shows a text instead of an IllustratedMessage in the noData aggregation of Tables or Charts
	 */
	@property({
		type: "boolean",
		defaultValue: false
	})
	useTextForNoDataMessages!: boolean;

	/**
	 * Enables the BreadCrumbs features
	 */
	@property({
		type: "boolean",
		defaultValue: true
	})
	showBreadCrumbs!: boolean;

	/**
	 * Defines the properties which can be used for inbound Navigation
	 */
	@property({
		type: "object"
	})
	inboundParameters!: object;

	/**
	 * Defines if an object page should be opened in edit mode
	 */
	@property({
		type: "boolean"
	})
	openInEditMode: boolean | undefined;

	@property({
		type: "boolean",
		defaultValue: false
	})
	enableLazyLoading!: boolean;

	private DeferredContextCreated = false;

	isContextExpected(): boolean {
		return true;
	}

	extendPageDefinition(pageDefinition: ObjectPageDefinition, converterContext: ConverterContext): FinalPageDefinition {
		return extendObjectPageDefinition(pageDefinition, converterContext);
	}

	// TODO: this should be ideally be handled by the editflow/routing without the need to have this method in the
	// object page - for now keep it here
	createDeferredContext(
		sPath: string,
		oListBinding: ODataListBinding | undefined,
		parentContext: Context | undefined,
		data: object | undefined,
		bActionCreate: boolean
	): void {
		if (!this.DeferredContextCreated) {
			this.DeferredContextCreated = true;
			const oParameters = {
				$$groupId: "$auto.Heroes",
				$$updateGroupId: "$auto"
			};

			if (!oListBinding) {
				oListBinding = this.getModel().bindList(sPath.replace("(...)", ""), undefined, undefined, undefined, oParameters);
			}
			const oStartUpParams =
					this.oAppComponent && this.oAppComponent.getComponentData() && this.oAppComponent.getComponentData().startupParameters,
				oInboundParameters = this.getViewData().inboundParameters as Record<string, InboundParameter> | undefined;
			let createParams;
			if (oStartUpParams && oStartUpParams.preferredMode && oStartUpParams.preferredMode[0].includes("create")) {
				createParams = Object.assign({}, data, CommonUtils.getAdditionalParamsForCreate(oStartUpParams, oInboundParameters));
			} else {
				createParams = data;
			}

			// for now wait until the view and the controller is created
			this.getRootControl()
				.getController()
				.editFlow.createDocument(oListBinding, {
					creationMode: CreationMode.Sync,
					createAction: bActionCreate,
					data: createParams,
					bFromDeferred: true,
					selectedContexts: parentContext ? [parentContext] : undefined
				})
				.finally(() => {
					this.DeferredContextCreated = false;
				})
				.catch(function () {
					// Do Nothing ?
				});
		}
	}

	setVariantManagement(sVariantManagement: string): void {
		if (sVariantManagement === VariantManagement.Page) {
			Log.error("ObjectPage does not support Page-level variant management yet");
			sVariantManagement = VariantManagement.None;
		}

		this.setProperty("variantManagement", sVariantManagement);
	}

	/**
	 * Checks if openInEditMode is defined in the manifest settings
	 * @returns a boolean indicating if edit mode is set for an object page
	 */

	isOpenInEditMode(): boolean {
		const openInEditMode = this.getViewData().openInEditMode;
		return openInEditMode === true;
	}
}

export default ObjectPageComponent;
