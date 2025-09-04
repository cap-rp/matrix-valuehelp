import type { Property } from "@sap-ux/vocabularies-types";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, concat, ifElse, not, pathInModel } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { TransportSelectionDefinition } from "sap/fe/core/converters/ManifestSettings";
import type { PageContextPathTarget } from "sap/fe/core/converters/TemplateConverter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getRelativePaths } from "sap/fe/core/templating/DataModelPathHelper";
import { isRequiredExpression } from "sap/fe/core/templating/FieldControlHelper";
import { getActionEnabledExpression } from "sap/fe/core/templating/UIFormatters";
import { getTextBindingExpression } from "sap/fe/macros/field/FieldTemplating";
import Link from "sap/m/Link";
import MessageStrip from "sap/m/MessageStrip";
import MessageType from "sap/ui/core/message/MessageType";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

@defineUI5Class("sap.fe.templates.ObjectPage.view.fragments.TransportSelection")
export default class TransportSelection extends BuildingBlock<MessageStrip> {
	// The transport selection definition
	private definition?: TransportSelectionDefinition;

	// a flag to indicate the leading control, also taking care on validating on safe
	@property({ type: "boolean" })
	public leadingControl!: boolean;

	// Reference to the message strip
	messageStrip!: MessageStrip;

	// the selectTransport action enablement
	actionEnabledExpression!: BindingToolkitExpression<boolean>;

	// data model object path to the transport property
	transportPropertyObjectPath!: DataModelObjectPath<Property>;

	constructor(props?: PropertiesOf<TransportSelection>, others?: PropertiesOf<TransportSelection>) {
		super(props, others);
	}

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	/**
	 * Call the selectTransportAction once the user clicks on the link in the message strip.
	 * @param actionName The name of the action to be called
	 * @returns Promise that is resolved once a transport request was selected
	 */
	async selectTransport(actionName: string): Promise<unknown> {
		const context = this.getBindingContext() as ODataV4Context;
		const label = this.messageStrip.getLink().getText();

		return this.getPageController()?.editFlow.invokeAction(actionName, { contexts: context, label: label });
	}

	/**
	 * Get expression for the message strip type.
	 *
	 * If mandatory and no transport request is given the type is Warning,
	 * otherwise it's Information.
	 * @returns Expression to determine the message strip type.
	 */
	getTypeExpression(): BindingToolkitExpression<MessageType> {
		const relativePath = getRelativePaths(this.transportPropertyObjectPath);
		const requiredExpression = isRequiredExpression(this.transportPropertyObjectPath.targetObject, relativePath);
		return ifElse(
			and(requiredExpression, not(pathInModel(this.definition?.transportRequestProperty))),
			MessageType.Warning,
			MessageType.Information
		);
	}

	/**
	 * Get expression for the link text.
	 *
	 * If transport request is given the text shall be change transport, if not
	 * it shall be select transport.
	 * @returns Expression to determine the link text.
	 */
	getLinkTextExpression(): BindingToolkitExpression<string> {
		return ifElse(
			pathInModel(this.definition?.transportRequestProperty),
			this.getTranslatedText("T_TRANSPORT_SELECTION_CHANGE_TRANSPORT"),
			this.getTranslatedText("T_TRANSPORT_SELECTION_SELECT_TRANSPORT")
		);
	}

	/**
	 * Get expression for the message strip text.
	 *
	 * If no transport given we show a warning text, if one is given we show the
	 * selected transport request, and also consider the text annotation on the
	 * transport request property.
	 * @returns Expression to determine the message strip text
	 */
	getStripText(): BindingToolkitExpression<string | undefined> {
		const textExpression = getTextBindingExpression(this.transportPropertyObjectPath, {});
		const noTransportSelected = this.getTranslatedText("T_TRANSPORT_SELECTION_NO_TRANSPORT_SELECTED");
		const transportSelected = concat(`${this.getTranslatedText("T_TRANSPORT_SELECTION_SELECTED_TRANSPORT")} `, textExpression);
		return ifElse(pathInModel(this.definition?.transportRequestProperty), transportSelected, noTransportSelected);
	}

	/**
	 * Get expression for the message strip visibility.
	 *
	 * If not in edit mode we don't show the message strip at all. If in edit
	 * mode we check the OperationAvailable annotation on the selectTransportAction.
	 * @returns Expression to determine the  message strip visibility
	 */
	getStripVisible(): BindingToolkitExpression<boolean> {
		// The visibility of the strip relies on the Core.OperationAvailable set on the transport select action
		return ifElse(this.actionEnabledExpression, UI.IsEditable, false);
	}

	/**
	 * Get the message strip to be shown in the object page header.
	 * @returns Message strip or nothing in case the feature is not enabled
	 */
	createContent(): MessageStrip | undefined {
		const dataModelObjects = this.getDataModelObjectPath<PageContextPathTarget>();

		this.definition = this.getManifestWrapper()?.getTransportSelection();
		if (this.definition) {
			let selectTransportAction = dataModelObjects?.targetEntityType.actions[this.definition.selectTransportAction];
			if (!selectTransportAction) {
				// if the action wasn't found give it a try by adding the namespace
				selectTransportAction =
					dataModelObjects?.targetEntityType.actions[
						`${dataModelObjects?.convertedTypes.namespace}.${this.definition.selectTransportAction}`
					];
			}

			if (dataModelObjects && selectTransportAction) {
				this.actionEnabledExpression = getActionEnabledExpression(
					selectTransportAction,
					dataModelObjects?.convertedTypes,
					dataModelObjects
				);
				this.transportPropertyObjectPath = enhanceDataModelPath<Property>(
					dataModelObjects,
					this.definition.transportRequestProperty
				);

				this.messageStrip = (
					<MessageStrip
						text={this.getStripText()}
						type={this.getTypeExpression()}
						showIcon="true"
						customIcon="sap-icon://shipping-status"
						class="sapUiSmallMarginTop"
						visible={this.getStripVisible()}
					>
						{{
							link: (
								<Link
									press={this.selectTransport.bind(this, selectTransportAction.fullyQualifiedName)}
									text={this.getLinkTextExpression()}
								/>
							)
						}}
					</MessageStrip>
				);
				return this.messageStrip;
			}
		}
	}

	/**
	 * Show selectTransport dialog if no transport chosen.
	 *
	 * We check if the TransportSelection feature is enabled and if the message strip
	 * type is warning (= mandatory but no transport request chosen). If so we show the selectTransport dialog.
	 * @returns Promise that is resolved once a transport request was selected
	 */
	@controllerExtensionHandler("editFlow", "onBeforeSave")
	async validateTransportRequestBeforeSave(): Promise<unknown> {
		if (
			this.messageStrip.getVisible() &&
			this.messageStrip.getType() === MessageType.Warning &&
			this.leadingControl &&
			this.definition
		) {
			return this.selectTransport(this.definition?.selectTransportAction);
		}
		return Promise.resolve();
	}
}
