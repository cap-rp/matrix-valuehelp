import type { EntitySet } from "@sap-ux/vocabularies-types";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, ifElse, not, pathInModel } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import type { HiddenDraft } from "sap/fe/core/converters/ManifestSettings";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { Entity, UI } from "sap/fe/core/helpers/BindingHelper";
import {
	getSwitchDraftAndActiveVisibility,
	getSwitchToActiveVisibility,
	getSwitchToDraftVisibility
} from "sap/fe/templates/ObjectPage/ObjectPageTemplating";
import Button from "sap/m/Button";
import ResponsivePopover from "sap/m/ResponsivePopover";
import type { SelectList$ItemPressEvent } from "sap/m/SelectList";
import SelectList from "sap/m/SelectList";
import type Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import InvisibleText from "sap/ui/core/InvisibleText";
import Item from "sap/ui/core/Item";
import type View from "sap/ui/core/mvc/View";
import type Context from "sap/ui/model/odata/v4/Context";
import type ObjectPageController from "../ObjectPageController.controller";

@defineUI5Class("sap.fe.macros.DraftToggle")
export default class DraftToggle extends BuildingBlock<Button> {
	@implementInterface("sap.m.IOverflowToolbarContent")
	__implements__sap_m_IOverflowToolbarContent = true;

	private _containingView!: View;

	private popover?: ResponsivePopover;

	private readonly SWITCH_TO_DRAFT_KEY = "switchToDraft";

	private readonly SWITCH_TO_ACTIVE_KEY = "switchToActive";

	@property({ type: "string" })
	public id?: string;

	@property({ type: "string" })
	public contextPath?: string;

	@defineReference()
	public switchToActiveRef!: Ref<Item>;

	@defineReference()
	public switchToDraftRef!: Ref<Item>;

	private initialSelectedKey: string = this.SWITCH_TO_ACTIVE_KEY;

	private _hiddenDraft = false;

	constructor(props: $ControlSettings & PropertiesOf<DraftToggle>, others?: $ControlSettings) {
		super(props, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		this._hiddenDraft = (controller.getAppComponent().getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)
			?.enabled;
		if (!this.content && !this._hiddenDraft) {
			this.content = this.createContent();
		}
	}

	getVisible(): boolean {
		return this.content?.getVisible() ?? true;
	}

	getEnabled(): boolean {
		return this.content?.getProperty("enabled") ?? true;
	}

	getOverflowToolbarConfig(): object {
		return {
			canOverflow: true
		};
	}

	handleSelectedItemChange = (event: SelectList$ItemPressEvent): void => {
		const selectedItemKey = event.getParameter("item")?.getProperty("key");
		if (selectedItemKey !== this.initialSelectedKey) {
			(this._containingView.getController() as PageController).editFlow.toggleDraftActive(
				this._containingView.getBindingContext() as Context
			);
		}
		if (this.popover) {
			this.popover.close();
			this.popover.destroy();
			delete this.popover;
		}
	};

	openSwitchActivePopover = (event: Event<{}, Button>): ResponsivePopover => {
		const sourceControl = event.getSource();
		const containingView = CommonUtils.getTargetView(sourceControl);

		const context: Context = containingView.getBindingContext();
		const isActiveEntity = context.getObject().IsActiveEntity;
		this.initialSelectedKey = isActiveEntity ? this.SWITCH_TO_ACTIVE_KEY : this.SWITCH_TO_DRAFT_KEY;
		this.popover = this.createPopover();

		this._containingView = containingView;
		containingView.addDependent(this.popover);
		this.popover.openBy(sourceControl);
		this.popover.attachEventOnce("afterOpen", () => {
			if (isActiveEntity) {
				this.switchToDraftRef.current?.focus();
			} else {
				this.switchToActiveRef.current?.focus();
			}
		});
		return this.popover;
	};

	createPopover(): ResponsivePopover {
		return (
			<ResponsivePopover
				showHeader={false}
				contentWidth={"15.625rem"}
				verticalScrolling={false}
				class={"sapUiNoContentPadding"}
				placement={"Bottom"}
			>
				<SelectList selectedKey={this.initialSelectedKey} itemPress={this.handleSelectedItemChange}>
					<Item
						text={"{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISPLAY_DRAFT_MIT}"}
						key={this.SWITCH_TO_DRAFT_KEY}
						ref={this.switchToDraftRef}
					/>
					<Item
						text={"{sap.fe.i18n>C_COMMON_OBJECT_PAGE_DISPLAY_SAVED_VERSION_MIT}"}
						key={this.SWITCH_TO_ACTIVE_KEY}
						ref={this.switchToActiveRef}
					/>
				</SelectList>
			</ResponsivePopover>
		);
	}

	createContent(): Button {
		const contextPathToUse = this._getOwner()?.preprocessorContext?.fullContextPath;
		const odataMetaModel = this._getOwner()?.getMetaModel();
		const context = odataMetaModel?.createBindingContext(this.contextPath ?? contextPathToUse!);
		const entityset = MetaModelConverter.convertMetaModelContext(context!) as EntitySet;
		const textValue = ifElse(
			and(not(UI.IsEditable), not(UI.IsCreateMode), Entity.HasDraft),
			pathInModel("C_COMMON_OBJECT_PAGE_SAVED_VERSION_BUT", "sap.fe.i18n"),
			pathInModel("C_COMMON_OBJECT_PAGE_DRAFT_BUT", "sap.fe.i18n")
		);
		const visible = getSwitchDraftAndActiveVisibility(entityset);
		const controller = this._getOwner()?.getRootController() as ObjectPageController;
		const invisibleText = (
			<InvisibleText
				text="{sap.fe.i18n>T_HEADER_DATAPOINT_TITLE_DRAFT_SWITCHER_ARIA_BUTTON}"
				id={this.createId("AriaTextDraftSwitcher")}
			/>
		);
		invisibleText.toStatic();
		const draftToggle = (
			<Button
				id={this.createId("_dt")}
				dt:designtime="not-adaptable"
				text={textValue}
				visible={visible}
				icon="sap-icon://navigation-down-arrow"
				iconFirst={false}
				type="Transparent"
				press={(event: Event<{}, Button>): ResponsivePopover => this.openSwitchActivePopover(event)}
				ariaDescribedBy={this.createId("AriaTextDraftSwitcher") ? [this.createId("AriaTextDraftSwitcher")!] : undefined}
			/>
		);
		draftToggle.addDependent(invisibleText);
		controller.getView().addDependent(
			<CommandExecution
				command="SwitchToActiveObject"
				execute={(): void => {
					controller.editFlow.toggleDraftActive(controller.getView().getBindingContext());
				}}
				visible={getSwitchToActiveVisibility(entityset) as unknown as BindingToolkitExpression<boolean>}
			/>
		);
		controller.getView().addDependent(
			<CommandExecution
				command="SwitchToDraftObject"
				execute={(): void => {
					controller.editFlow.toggleDraftActive(controller.getView().getBindingContext());
				}}
				visible={getSwitchToDraftVisibility(entityset) as unknown as BindingToolkitExpression<boolean>}
			/>
		);
		return draftToggle;
	}
}
