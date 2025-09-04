import CommonUtils from "sap/fe/core/CommonUtils";
import Fragment from "sap/ui/core/Fragment";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";

import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type Control from "sap/ui/core/Control";
import LinkType from "sap/ui/mdc/enums/LinkType";
import type Link from "sap/ui/mdc/Link";
import LinkDelegate from "sap/ui/mdc/LinkDelegate";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as Context, default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

type ContactPayload = { navigationPath: string; contact: string };

export default Object.assign({}, LinkDelegate, {
	/**
	 * Method called to do the templating of the popover content.
	 * @param payload
	 * @param metaModel
	 * @param mdcLinkControl
	 * @returns  A promise containing the popover content
	 */
	_fnTemplateFragment: async function (payload: ContactPayload, metaModel: ODataMetaModel, mdcLinkControl: Link) {
		const fragmentName = "sap.fe.macros.contact.ContactQuickView";
		const containingView = CommonUtils.getTargetView(mdcLinkControl);
		const appComponent = CommonUtils.getAppComponent(containingView);

		const preProcessorSettings: { bindingContexts: object; models: object; appComponent: AppComponent } = {
			bindingContexts: {},
			models: {},
			appComponent
		};
		const contactContext = metaModel.createBindingContext(payload.contact);
		const payloadModel = new JSONModel(payload);

		if (payload.contact && contactContext) {
			preProcessorSettings.bindingContexts = {
				contact: contactContext,
				payload: payloadModel.createBindingContext("/")
			};
			preProcessorSettings.models = {
				contact: metaModel,
				payload: payloadModel
			};
		}

		const fragment = XMLTemplateProcessor.loadTemplate(fragmentName, "fragment");
		const templateComponent = containingView.getController().getOwnerComponent() as EnhanceWithUI5<TemplateComponent>;

		const templatedFragment = await XMLPreprocessor.process(fragment, { name: fragmentName }, preProcessorSettings);
		return templateComponent.runAsOwner(async (): Promise<Control> => {
			return Fragment.load({
				definition: templatedFragment,
				controller: containingView.getController()
			}) as Promise<Control>;
		});
	},

	/**
	 * Method calls by the mdc.field to determine what should be the content of the popup when mdcLink#open is called.
	 * @param mdcLinkControl
	 * @returns A promise containing the popover content
	 */
	fetchAdditionalContent: async function (mdcLinkControl: Link) {
		const payload: ContactPayload = mdcLinkControl.getPayload() as ContactPayload;
		const navigateRegexpMatch = payload.navigationPath?.match(/{(.*?)}/);

		const binding = (mdcLinkControl.getBindingContext() as ODataV4Context)?.getBinding();
		const aggregation = binding?.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding")
			? (binding.getAggregation() as { hierarchyQualifier?: string } | undefined)
			: undefined;
		const isListBindingAnalytical = aggregation !== undefined && !aggregation.hierarchyQualifier;

		let bindingContext =
			navigateRegexpMatch && navigateRegexpMatch.length > 1 && navigateRegexpMatch[1]
				? (mdcLinkControl.getModel() as ODataModel).bindContext(
						navigateRegexpMatch[1],
						mdcLinkControl.getBindingContext() as Context,
						{ $$ownRequest: true }
				  )
				: null;
		if (isListBindingAnalytical && !bindingContext) {
			// in case of analytical binding, we need to have a binding with its own cache to ensure data is properly requested
			bindingContext = (mdcLinkControl.getModel() as ODataModel).bindContext("", mdcLinkControl.getBindingContext() as Context, {
				$$ownRequest: true
			});
		}
		if (mdcLinkControl.isA("sap.ui.mdc.Link")) {
			const metaModel = (mdcLinkControl.getModel() as ODataModel).getMetaModel();
			const popoverContent = (await this._fnTemplateFragment(payload, metaModel, mdcLinkControl)) as Control;
			if (bindingContext) {
				popoverContent.setBindingContext(bindingContext.getBoundContext());
			}
			return [popoverContent];
		}
		return Promise.resolve([]);
	},

	fetchLinkType: async function (): Promise<object> {
		return Promise.resolve({
			initialType: {
				type: LinkType.Popover, // this means mdcLink.open will open a popup which shows content retrieved by fetchAdditionalContent
				directLink: undefined
			},
			runtimeType: undefined
		});
	}
});
