import Log from "sap/base/Log";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type ReuseComponent from "sap/fe/core/ReuseComponent";
import { getSideContentLayoutID } from "sap/fe/core/converters/helpers/ID";
import type { InCompletenessInfoType } from "sap/fe/core/helpers/RecommendationHelper";
import { recommendationHelper } from "sap/fe/core/helpers/RecommendationHelper";
import ResourceModelHelper from "sap/fe/core/helpers/ResourceModelHelper";
import type { SideEffectsTargetType } from "sap/fe/core/services/SideEffectsServiceFactory";
import type Section from "sap/fe/macros/controls/Section";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import type ManagedObject from "sap/ui/base/ManagedObject";
import InvisibleMessage from "sap/ui/core/InvisibleMessage";
import { InvisibleMessageMode } from "sap/ui/core/library";
import Message from "sap/ui/core/message/Message";
import MessageType from "sap/ui/core/message/MessageType";
import type DynamicSideContent from "sap/ui/layout/DynamicSideContent";
import type Control from "sap/ui/mdc/Control";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

/**
 * Extension API for object pages on SAP Fiori elements for OData V4.
 *
 * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
 * @public
 * @hideconstructor
 * @final
 * @since 1.79.0
 */
@defineUI5Class("sap.fe.templates.ObjectPage.ExtensionAPI")
class ObjectPageExtensionAPI extends ExtensionAPI {
	/**
	 * Refreshes either the whole object page or only parts of it.
	 * @param [vPath] Path or array of paths referring to entities or properties to be refreshed.
	 * If omitted, the whole object page is refreshed. The path "" refreshes the entity assigned to the object page
	 * without navigations
	 * @returns Resolved once the data is refreshed or rejected if the request failed
	 * @public
	 */
	async refresh(vPath?: string | string[]): Promise<void> {
		const oBindingContext = this._view.getBindingContext();
		if (!oBindingContext) {
			// nothing to be refreshed - do not block the app!
			return Promise.resolve();
		}
		const oAppComponent = CommonUtils.getAppComponent(this._view),
			oSideEffectsService = oAppComponent.getSideEffectsService(),
			oMetaModel = oBindingContext.getModel().getMetaModel(),
			oSideEffects: SideEffectsTargetType = {
				targetProperties: [],
				targetEntities: []
			};

		if (vPath === undefined || vPath === null) {
			// we just add an empty path which should refresh the page with all dependent bindings
			oSideEffects.targetEntities.push({
				$NavigationPropertyPath: ""
			});
		} else {
			const allPaths = Array.isArray(vPath) ? vPath : [vPath];
			const ownerComponent = this._controller.getOwnerComponent() as unknown as {
				getContextPath: () => string;
				getEntitySet: () => string;
			};
			const contextPath = ownerComponent.getContextPath() || `/${ownerComponent.getEntitySet()}`;

			for (const path of allPaths) {
				if (path === "") {
					// an empty path shall refresh the entity without dependencies which means * for the model
					oSideEffects.targetProperties.push("*");
				} else {
					const kind = oMetaModel.getObject(`${contextPath}/${path}/$kind`);

					if (kind === "NavigationProperty") {
						oSideEffects.targetEntities.push({
							$NavigationPropertyPath: path
						});
					} else if (kind) {
						oSideEffects.targetProperties.push(path);
					} else {
						return Promise.reject(`${path} is not a valid path to be refreshed`);
					}
				}
			}
		}
		return oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
	}

	/**
	 * Gets the list entries currently selected for the table.
	 * @param sTableId The ID identifying the table the selected context is requested for
	 * @returns Array containing the selected contexts
	 * @public
	 */
	getSelectedContexts(sTableId: string): ODataV4Context[] {
		let table = this._view.byId(sTableId);
		if (table?.isA<Table>("sap.ui.mdc.Table")) {
			table = table.getParent() as TableAPI;
		}
		if (table?.isA("sap.fe.macros.table.TableAPI")) {
			return (table as TableAPI).getSelectedContexts();
		}
		return [];
	}

	/**
	 * Displays or hides the side content of an object page.
	 * @param sSubSectionKey Key of the side content fragment as defined in the manifest.json
	 * @param [bShow] Optional Boolean flag to show or hide the side content
	 * @public
	 */
	showSideContent(sSubSectionKey: string, bShow?: boolean): void {
		const sBlockID = getSideContentLayoutID(sSubSectionKey),
			oBlock = this._view.byId(sBlockID),
			bBlockState = bShow === undefined ? !(oBlock as DynamicSideContent).getShowSideContent() : bShow;
		(oBlock as DynamicSideContent).setShowSideContent(bBlockState, false);
	}

	/**
	 * Gets the bound context of the current object page.
	 * @returns Context bound to the object page
	 * @public
	 */
	getBindingContext(): Context | null | undefined {
		return this._view.getBindingContext();
	}

	/**
	 * Build the internal context path of the MessageStrip control.
	 * @returns The internal binding context path for the messageStrip
	 */
	_getMessageStripBindingContextPath(): string {
		const internalModelContextPath = this._view.getBindingContext("internal")?.getPath();
		const viewContextPath = this._view.getBindingContext()?.getPath();
		return internalModelContextPath && viewContextPath
			? `${internalModelContextPath}/MessageStrip/${viewContextPath.replace(/\//g, "-")}`
			: "";
	}

	/**
	 * Displays the message strip between the title and the header of the ObjectPage.
	 * @param  messages The message to be displayed
	 * @public
	 */

	showMessages(messages: Message[]): void {
		this._showMessages(messages);
	}

	/**
	 * Displays the message strip between the title and the header of the ObjectPage.
	 * @param messages The message to be displayed
	 * @param origin The origin of the message . It may come from a backend message or a custom message
	 */

	_showMessages(messages: Message[], origin: "Backend" | "Custom" = "Custom"): void {
		try {
			const view = this._view;
			const internalModel = view.getModel("internal");
			const messagestripInternalModelContext = internalModel.bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
			if (!messagestripInternalModelContext) {
				return;
			}
			const resourceModel = ResourceModelHelper.getResourceModel(view);
			let message: Message | null = null;
			messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
			switch (messages.length) {
				case 0:
					break;
				case 1:
					message = messages[0];
					messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
					break;
				default:
					const messageStats: { [key: string]: { id: number; count: number } } = {
						Error: { id: 2, count: 0 },
						Warning: { id: 1, count: 0 },
						Information: { id: 0, count: 0 }
					};
					message = messages.reduce(
						(acc, currentValue) => {
							const currentType = currentValue.getType();
							acc.setType(messageStats[currentType].id > messageStats[acc.getType()].id ? currentType : acc.getType());
							messageStats[currentType].count++;
							return acc;
						},
						new Message({ type: MessageType.Information })
					);
					if (origin === "Backend" && !CommonUtils.getIsEditable(view)) {
						messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, false);
					} else {
						messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
					}

					if (messageStats.Error.count > 0) {
						message.setMessage(resourceModel.getText("OBJECTPAGESTATE_ERROR"));
					} else if (messageStats.Warning.count > 0) {
						message.setMessage(resourceModel.getText("OBJECTPAGESTATE_WARNING"));
					} else {
						message.setMessage(resourceModel.getText("OBJECTPAGESTATE_INFORMATION"));
					}
			}
			messagestripInternalModelContext.setProperty(`OP${origin}MessageText`, message ? message.getMessage() : null);
			messagestripInternalModelContext.setProperty(`OP${origin}MessageType`, message ? message.getType() : null);
			if (message) {
				InvisibleMessage.getInstance().announce(message.getMessage(), InvisibleMessageMode.Assertive);
			}
		} catch (err) {
			Log.error("Cannot display ObjectPage message");
		}
	}

	/**
	 * Hides the message strip below the anchor bar.
	 * @public
	 */
	hideMessage(): void {
		const internalModel = this._view.getModel("internal");
		const messagestripInternalModelContext = internalModel.bindContext(this._getMessageStripBindingContextPath()).getBoundContext()!;
		messagestripInternalModelContext.setProperty(`OPCustomMessageVisible`, false);
	}

	/**
	 * This function will take the recommendation data details, transform it and update internal model with that.
	 * @param data Recommendation data for the app
	 */
	setRecommendations(data: InCompletenessInfoType): void {
		recommendationHelper.transformRecommendationsForInternalStorage(data);
		this._view.getModel("internal").setProperty("/recommendationsData", data);
	}

	/**
	 * Defines a control to be the title owner of its section/subsection. As the title owners of standard subsections are determined automatically, it is recommended to use this function for custom section/subsection.
	 * The title owner can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
	 * The framework adapts the value of these properties to be aligned with the title that is shown in the anchor bar (or icon tab bar) for the section. Moreover, the title of the subsection (and if applicable also of the section) is hidden in order to prevent redundant titles, if the subsection possesses a title owner.
	 * Hint: If you choose to set sap.m.Title as the title owner, styling adjustments may be required in the custom view. For example, if sap.m.Title is set as title owner which belongs to sap.m.OverflowToolbar or to sap.m.Toolbar, then the ‘design’ property of the toolbar control is to be set to ‘Transparent’.
	 * @param control The single content control can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
	 * @public
	 */
	setAsSectionTitleOwner(control: ManagedObject): void {
		let section;
		const originalControl = control;
		while (control) {
			if (control.isA<Section>("sap.fe.macros.controls.Section")) {
				section = control;
				break;
			}
			if (control.isA<ReuseComponent>("sap.fe.core.ReuseComponent")) {
				control = control.container.getParent() as Control;
			}
			const controlParent = control.getParent();
			if (controlParent) {
				control = controlParent;
			} else {
				break;
			}
		}
		if (section) {
			section.adjustForSingleContent(originalControl);
		}
	}
}

export default ObjectPageExtensionAPI;
