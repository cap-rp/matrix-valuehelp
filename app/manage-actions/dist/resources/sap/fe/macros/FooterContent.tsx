import type { EntitySet } from "@sap-ux/vocabularies-types";
import type { DataFieldForAction } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, constant, equal, ifElse, or, pathInModel } from "sap/fe/base/BindingToolkit";
import { defineReference, defineUI5Class, implementInterface, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import type { CommandProperties, Ref } from "sap/fe/base/jsx-runtime/jsx";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import type { BaseManifestSettings, HiddenDraft } from "sap/fe/core/converters/ManifestSettings";
import { ActionType } from "sap/fe/core/converters/ManifestSettings";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { isActionWithDialog } from "sap/fe/core/converters/annotations/DataField";
import { aiIcon, type BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import { Draft, UI } from "sap/fe/core/helpers/BindingHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import type { CoreLib } from "sap/fe/core/library";
import library from "sap/fe/core/library";
import * as CriticalityFormatters from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import MessageButton from "sap/fe/macros/messages/MessageButton";
import type ObjectPageController from "sap/fe/templates/ObjectPage/ObjectPageController.controller";
import Button from "sap/m/Button";
import DraftIndicator from "sap/m/DraftIndicator";
import Menu from "sap/m/Menu";
import MenuButton from "sap/m/MenuButton";
import MenuItem from "sap/m/MenuItem";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import type Event from "sap/ui/base/Event";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import InvisibleText from "sap/ui/core/InvisibleText";
import type Controller from "sap/ui/core/mvc/Controller";
import type { $ControlSettings } from "sap/ui/mdc/Control";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type PageController from "sap/fe/core/PageController";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as ObjectPageTemplating from "sap/fe/templates/ObjectPage/ObjectPageTemplating";
import OverflowToolbarLayoutData from "sap/m/OverflowToolbarLayoutData";
import JSONModel from "sap/ui/model/json/JSONModel";

type ControllerWithAction = Controller & {
	handlers: {
		onCallAction: Function;
	};
};

@defineUI5Class("sap.fe.macros.FooterContent")
export default class FooterContent extends BuildingBlock<OverflowToolbar> {
	@implementInterface("sap.ui.core.Toolbar")
	__implements__sap_ui_core_Toolbar = true;

	@implementInterface("sap.m.IBar")
	__implements__sap_m_IBar = true;

	@property({
		type: "string",
		required: true
	})
	id!: string;

	@property({
		type: "string",
		required: true
	})
	public metaPath!: string;

	@property({ type: "string" })
	contextPath?: string;

	@defineReference()
	cmdExecution!: Ref<CommandExecution>;

	actions?: BaseAction[];

	oDataMetaModel!: ODataMetaModel;

	dataViewModelPath!: DataModelObjectPath<EntitySet>;

	isDraftValidation!: boolean;

	_hiddenDraft!: boolean;

	private _hideCreateNext = false;

	constructor(props: $ControlSettings & PropertiesOf<FooterContent>, others?: $ControlSettings) {
		super(props, others);
	}

	@controllerExtensionHandler("routing", "onAfterBinding")
	public async onAfterBinding(this: FooterContent): Promise<void> {
		if (this._hiddenDraft) {
			const controller = this._getOwner()?.getRootController() as PageController;
			const viewContext = controller.getView().getBindingContext();
			const isNewObject = await controller.editFlow.isRootContextNew(viewContext);
			(this.getModel("footerInternal") as JSONModel).setProperty("/rootIsNewObject", isNewObject);
		}
	}

	initialize(): void {
		const owner = this._getOwner();
		this.setModel(new JSONModel(), "footerInternal");
		this.actions = owner?.preprocessorContext?.bindingContexts?.converterContext?.getObject("footerActions");
		const contextPathToUse = owner?.preprocessorContext?.fullContextPath;
		this.oDataMetaModel = owner?.preprocessorContext?.models.metaModel as ODataMetaModel;
		this.dataViewModelPath = this.getDataModelObjectForMetaPath(this.metaPath, contextPathToUse ?? this.contextPath)!;
		const startingEntitySet = this.dataViewModelPath.startingEntitySet;
		this.isDraftValidation = !!(
			ModelHelper.getDraftRoot(startingEntitySet)?.PreparationAction && startingEntitySet?.entityType.annotations.Common?.Messages
		);
		this.content = this.createContent();
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		this._hiddenDraft = (controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)
			?.enabled;
		this._hideCreateNext =
			(controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)?.hideCreateNext ===
			true;
		if (!this.content) {
			this.initialize();
		}
	}

	private getActionModelPath(action: BaseAction): DataModelObjectPath<DataFieldForAction> | undefined {
		const annotationPath = action.annotationPath;
		if (annotationPath) {
			const actionContext = this.oDataMetaModel.getContext(annotationPath);
			return getInvolvedDataModelObjects<DataFieldForAction>(actionContext);
		}
		return undefined;
	}

	getDraftIndicator(): DraftIndicator | undefined {
		const entitySet = (this.dataViewModelPath.targetEntitySet || this.dataViewModelPath.startingEntitySet) as EntitySet; // startingEntitySet is used on containment scenario
		const commonAnnotation = entitySet.annotations?.Common;
		if ((commonAnnotation?.DraftRoot || commonAnnotation?.DraftNode) && !this._hiddenDraft) {
			return <DraftIndicator state="{ui>/draftStatus}" visible="{ui>/isEditable}" />;
		}
		return undefined;
	}

	private getApplyButton(emphasizedExpression: PropertyBindingInfo): Button | MenuButton | null {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const viewData = controller.getView().getViewData() as BaseManifestSettings;
		if ((viewData?.viewLevel != null && viewData?.viewLevel <= 1) || this._hiddenDraft) {
			return null;
		}
		if (this.isDraftValidation && !viewData.isDesktop && !viewData.fclEnabled) {
			return (
				<MenuButton
					text="{sap.fe.i18n>T_COMMON_OBJECT_PAGE_APPLY_DRAFT}"
					defaultAction={async (): Promise<void> => {
						await controller._applyDocument(controller.getView().getBindingContext());
					}}
					useDefaultActionOnly="true"
					buttonMode="Split"
					type={emphasizedExpression}
					dt:designtime="not-adaptable"
				>
					<Menu>
						<MenuItem
							text="{sap.fe.i18n>T_COMMON_OBJECT_PAGE_VALIDATE_DRAFT}"
							press={async (): Promise<void> => {
								await controller._validateDocument();
							}}
						/>
					</Menu>
				</MenuButton>
			);
		}
		return (
			<Button
				id={this.createId("StandardAction::Apply")}
				text="{sap.fe.i18n>T_COMMON_OBJECT_PAGE_APPLY_DRAFT}"
				type={emphasizedExpression}
				enabled={true}
				press={async (): Promise<void> => {
					await controller._applyDocument(controller.getView().getBindingContext());
				}}
				visible="{ui>/isEditable}"
				dt:designtime="not-adaptable"
			/>
		);
	}

	private getPrimary(emphasizedExpression?: PropertyBindingInfo): Button | MenuButton | null {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const hiddenDraft = (controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)
			?.enabled;
		const viewData = controller.getView().getViewData() as BaseManifestSettings;
		controller
			.getView()
			.addDependent(
				<CommandExecution
					ref={this.cmdExecution}
					command="Save"
					execute={controller._saveDocument}
					visible={or(
						ifElse(
							hiddenDraft === true,
							ifElse(
								viewData.fclEnabled === true,
								and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
								UI.IsEditable
							),
							UI.IsEditable
						),
						equal(pathInModel("/isInlineEditActive", "ui"), true)
					)}
				/>
			);
		if (this.isDraftValidation && !viewData.isDesktop) {
			return (
				<MenuButton
					text={this.getTextSaveButton()}
					jsx:command="cmd:Save|defaultAction"
					useDefaultActionOnly="true"
					buttonMode="Split"
					type={emphasizedExpression}
					visible={compileExpression(
						ifElse(
							hiddenDraft === true,
							ifElse(
								viewData.fclEnabled === true,
								and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
								UI.IsEditable
							),
							UI.IsEditable
						)
					)}
					dt:designtime="not-adaptable"
				>
					<Menu>
						<MenuItem
							text="{sap.fe.i18n>T_COMMON_OBJECT_PAGE_VALIDATE_DRAFT}"
							press={async (): Promise<void> => {
								await controller._validateDocument();
							}}
						/>
					</Menu>
				</MenuButton>
			);
		}
		return (
			<Button
				id={this.createId("StandardAction::Save")}
				text={this.getTextSaveButton()}
				type={emphasizedExpression}
				visible={compileExpression(
					ifElse(
						hiddenDraft === true,
						ifElse(
							viewData.fclEnabled === true,
							and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
							UI.IsEditable
						),
						UI.IsEditable
					)
				)}
				enabled={true}
				jsx:command="cmd:Save|press"
				dt:designtime="not-adaptable"
			/>
		);
	}

	private getTextSaveButton(): BindingToolkitExpression<string> {
		const saveButtonText = this.getTranslatedText("T_OP_OBJECT_PAGE_SAVE");
		const createButtonText = this.getTranslatedText("T_OP_OBJECT_PAGE_CREATE");
		// If we're in sticky mode  -> the ui is in create mode, show Create, else show Save
		// If not -> we're in draft or hidden draft
		// In case of draft if it is a new object (!IsActiveEntity && !HasActiveEntity), show create, else show save
		// In case of hidden draft the button shows up in all pages and follows the below criteria
		// 		If the root object is a new object (!IsActiveEntity && !HasActiveEntity) then all pages should show Create.
		// 		If the roor object is not a new object then all pages should show Save.
		return ifElse(
			ifElse(
				(this.dataViewModelPath.startingEntitySet as EntitySet).annotations.Session?.StickySessionSupported !== undefined,
				UI.IsCreateMode,
				ifElse(this._hiddenDraft, and(pathInModel("/rootIsNewObject", "footerInternal")), Draft.IsNewObject)
			),
			createButtonText,
			saveButtonText
		);
	}

	private getCancelButton(): Button | null {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const hiddenDraft = (controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)
			?.enabled;
		const viewData = controller.getView().getViewData() as BaseManifestSettings;
		controller.getView().addDependent(
			<CommandExecution
				ref={this.cmdExecution}
				command="Cancel"
				execute={(): void => {
					controller._cancelDocument({ cancelButton: "fe::FooterBar::StandardAction::Cancel" });
				}}
				visible={ifElse(
					hiddenDraft === true,
					ifElse(
						viewData.fclEnabled === true,
						and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
						UI.IsEditable
					),
					UI.IsEditable
				)}
			/>
		);
		// OverflowToolbarLayoutData setting is needed when the discard button is in the overflow
		return (
			<Button
				id={this.createId("StandardAction::Cancel")}
				text={
					ModelHelper.isDraftRoot(this.dataViewModelPath.targetEntitySet) && !this._hiddenDraft
						? "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISCARD_DRAFT}"
						: "{sap.fe.i18n>C_COMMON_OBJECT_PAGE_CANCEL}"
				}
				jsx:command="cmd:Cancel|press"
				visible={compileExpression(
					ifElse(
						hiddenDraft === true,
						ifElse(
							viewData.fclEnabled === true,
							and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
							UI.IsEditable
						),
						UI.IsEditable
					)
				)}
				ariaHasPopup={ifElse(pathInModel("/isDocumentModified", "ui"), constant("Dialog"), constant("None"))}
				enabled={true}
				dt:designtime="not-adaptable"
			>
				{{ layoutData: <OverflowToolbarLayoutData closeOverflowOnInteraction={false}></OverflowToolbarLayoutData> }}
			</Button>
		);
	}

	private getCreateNextButton(emphasizedExpression: PropertyBindingInfo): Button | null {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const viewData = controller.getView().getViewData() as BaseManifestSettings;
		return (
			<Button
				id={this.createId("StandardAction::CreateNext")}
				text={"{sap.fe.i18n>C_COMMON_OBJECT_PAGE_CREATE_NEXT}"}
				press={controller.editFlow.createNextDocument}
				type={emphasizedExpression}
				visible={ifElse(
					this._hiddenDraft === true,
					ifElse(
						viewData.fclEnabled === true,
						and(Draft.IsNewObject, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
						Draft.IsNewObject
					),
					Draft.IsNewObject
				)}
				enabled={true}
				dt:designtime="not-adaptable"
			>
				{{ layoutData: <OverflowToolbarLayoutData closeOverflowOnInteraction={false}></OverflowToolbarLayoutData> }}
			</Button>
		);
	}

	private getDataFieldForActionButton(action: BaseAction): Button | undefined {
		if (action.annotationPath) {
			const controller = this._getOwner()?.getRootController() as ObjectPageController;
			const annotationPath = action.annotationPath;
			let pressEvent: { press: (event: Event) => void } | { "jsx:command": CommandProperties };
			const view = controller.getView();
			const annotationPathContext = this.oDataMetaModel.getContext(annotationPath);
			const dataFieldContextModelPath = getInvolvedDataModelObjects<DataFieldForAction>(annotationPathContext);
			const dataFieldForAction = dataFieldContextModelPath.targetObject;
			if (dataFieldForAction) {
				const actionParameters = {
					entitySetName: this.dataViewModelPath.targetEntitySet?.name,
					invocationGrouping:
						dataFieldForAction.InvocationGrouping === "UI.OperationGroupingType/ChangeSet"
							? (library as CoreLib).InvocationGrouping.ChangeSet
							: (library as CoreLib).InvocationGrouping.Isolated,
					label: dataFieldForAction.Label?.toString(),
					isNavigable: action.isNavigable,
					defaultValuesExtensionFunction: action.defaultValuesExtensionFunction
				};
				if (!action.command) {
					pressEvent = {
						press: (): void => {
							(controller as ControllerWithAction).handlers.onCallAction(view, dataFieldForAction.Action as string, {
								...actionParameters,
								...{
									contexts: view.getBindingContext(),
									model: view.getModel()
								}
							});
						}
					};
				} else {
					// command coming from the manifest doesn't get the mandatory prefix "cmd:" so we need to add it
					if (!action.command.startsWith("cmd:")) {
						action.command = `cmd:${action.command}`;
					}
					pressEvent = { "jsx:command": `${action.command}|press` as CommandProperties };
				}
				return (
					<Button
						id={this.createId(this.getActionModelPath(action))}
						// This expression considers actions with dynamic visibility.
						// When we have other values than true or false, i.e. an expression, we exclude the actions from adapting the visibility.
						dt:designtime={action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility"}
						text={actionParameters.label}
						{...pressEvent}
						ariaHasPopup={isActionWithDialog(dataFieldContextModelPath.targetObject)}
						visible={action.visible}
						enabled={action.enabled}
						type={CriticalityFormatters.buildExpressionForCriticalityButtonType(dataFieldContextModelPath)}
						icon={action?.isAIOperation === true ? aiIcon : undefined}
					/>
				) as Button;
			}
		}
	}

	private getManifestButton(action: BaseAction): Button | undefined {
		if (ObjectPageTemplating.isManifestAction(action)) {
			let pressEvent: { press: (event: Event) => void } | { "jsx:command": CommandProperties };
			if (action.command) {
				pressEvent = { "jsx:command": `cmd:${action.command}|press` };
			} else {
				pressEvent = {
					press: (event: Event): void => {
						FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {}).catch((error: unknown) =>
							Log.error(error as string)
						);
					}
				};
			}
			return (
				<Button
					id={this.createId(action.id)}
					dt:designtime={action.visible === "true" || action.visible === "false" ? undefined : "not-adaptable-visibility"}
					text={action.text ?? ""}
					{...pressEvent}
					type="Transparent"
					visible={action.visible}
					enabled={action.enabled}
					icon={action?.isAIOperation === true ? aiIcon : undefined}
				/>
			) as Button;
		}
	}

	getActionControls(): Button[] | undefined {
		const emphasizedButtonExpression = ObjectPageTemplating.buildEmphasizedButtonExpression(this.dataViewModelPath);
		return this.actions
			?.map((action: BaseAction) => {
				switch (action.type) {
					case ActionType.DefaultApply:
						return this.getApplyButton(emphasizedButtonExpression);
					case ActionType.DataFieldForAction:
						return this.getDataFieldForActionButton(action);
					case ActionType.Primary:
						if (this._hiddenDraft && !this._hideCreateNext) {
							return this.getPrimary(compileExpression(ifElse(Draft.IsNewObject, undefined, emphasizedButtonExpression)));
						}
						return this.getPrimary(emphasizedButtonExpression);
					case ActionType.Secondary:
						return this.getCancelButton();
					case ActionType.CreateNext:
						if (this._hiddenDraft && !this._hideCreateNext) {
							return this.getCreateNextButton(
								compileExpression(ifElse(Draft.IsNewObject, emphasizedButtonExpression, undefined))
							);
						}
						return;
					default:
						return this.getManifestButton(action);
				}
			})
			.filter((action): action is Button => !!action);
	}

	createContent(): OverflowToolbar {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const viewData = controller.getView().getViewData() as BaseManifestSettings;
		const messageButton: MessageButton = (
			<MessageButton
				id={this.createId("MessageButton")}
				visible={compileExpression(
					ifElse(
						this._hiddenDraft === true,
						ifElse(
							viewData.fclEnabled === true,
							and(UI.IsEditable, equal(pathInModel("/showSaveAndCancelButton", "fclhelper"), true)),
							true
						),
						true
					)
				)}
				messageChange={(): void => controller._getFooterVisibility()}
				ariaLabelledBy={[this.createId("MessageButton::AriaText") as string]}
				type="Emphasized"
				ariaHasPopup="Dialog"
			/>
		);
		const footerBar = (
			<OverflowToolbar id={this.createId("_fc")} asyncMode={true}>
				<InvisibleText
					id={this.createId("MessageButton::AriaText")}
					text="{sap.fe.i18n>C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_BUTTON_ARIA_TEXT}"
				/>
				{messageButton}
				<ToolbarSpacer />
				{this.getDraftIndicator()}
				{this.getActionControls()}
			</OverflowToolbar>
		);
		controller
			.getView()
			.addDependent(
				<CommandExecution
					ref={this.cmdExecution}
					command="OpenMessageButtonMenu"
					execute={(): MessageButton => messageButton.firePress()}
				/>
			);
		return footerBar;
	}
}
