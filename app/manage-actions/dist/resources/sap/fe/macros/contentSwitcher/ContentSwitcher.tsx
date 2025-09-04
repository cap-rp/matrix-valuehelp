import { bindState } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineReference, defineUI5Class, event, implementInterface, property } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type IViewStateContributor from "sap/fe/core/controllerextensions/viewState/IViewStateContributor";
import type ContentSwitcherItem from "sap/fe/macros/contentSwitcher/ContentSwitcherItem";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type { EventHandler } from "../../../../../../../types/extension_types";

type ContentSwitcherState = {
	selectedKey?: string;
};
/**
 * Defines a new building block which can be used to toggle the visibility of the content referenced by the item.
 * Each item will be displayed in a segmented button with the
 */
@defineUI5Class("sap.fe.macros.contentSwitcher.ContentSwitcher")
export default class ContentSwitcher
	extends BuildingBlock<
		SegmentedButton,
		{
			selectedKey: string;
		}
	>
	implements IViewStateContributor<ContentSwitcherState>
{
	@implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor")
	__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor = true;

	@aggregation({ type: "sap.fe.macros.contentSwitcher.ContentSwitcherItem", multiple: true, isDefault: true })
	items!: ContentSwitcherItem[];

	@event()
	selectionChange?: EventHandler;

	@defineReference()
	$segmentedButton!: Ref<SegmentedButton>;

	@property({ type: "string", bindToState: true })
	selectedKey?: string;

	constructor(propertiesOrId: string | PropertiesOf<ContentSwitcher>, properties?: PropertiesOf<ContentSwitcher>) {
		super(propertiesOrId, properties);
		this.content = this.createContent();
		if (this.state.selectedKey) {
			// if there is already a selected key let's make sure to apply it
			this.onStateChange(["selectedKey"]);
		} else {
			// otherwise let's set an initial state
			this.state.selectedKey = "key0";
		}
	}

	retrieveState(): ContentSwitcherState {
		return {
			selectedKey: this.$segmentedButton.current?.getSelectedKey()
		};
	}

	applyState(appState?: ContentSwitcherState): void {
		if (appState) {
			this.state.selectedKey = appState.selectedKey ?? this.items[0]?.key ?? "key0";
		}
	}

	/**
	 * Retrieves the control referenced by the ContentSwitcherItem.
	 * @param item The ContentSwitcherItem
	 * @returns The control referenced by the ContentSwitcherItem
	 */
	_getControlFromItem(item: ContentSwitcherItem): Control | undefined {
		const controlToSwitch = item.controlToSwitch;
		if (controlToSwitch) {
			const control = UI5Element.getElementById(controlToSwitch);
			if (control?.isA<Control>("sap.ui.core.Control")) {
				return control;
			}
		}
	}

	private showHideControls(selectedKey: string): void {
		const controlsToHide: Control[] = [];
		const controlsToDisplay: Control[] = [];
		for (const item of this.items) {
			const control = this._getControlFromItem(item);
			// item.key -> compact
			// selectedKey -> compact & { czxmcz;lkxzc }
			if (control && item.key !== selectedKey) {
				controlsToHide.push(control);
			} else if (control) {
				controlsToDisplay.push(control);
			}
		}
		for (const control of controlsToHide) {
			if (!controlsToDisplay.includes(control)) {
				control.setVisible(false);
			}
		}
		for (const control of controlsToDisplay) {
			control.setVisible(true);
		}
	}

	onStateChange(changedKeys: string[]): void {
		if (changedKeys?.includes("selectedKey")) {
			this.showHideControls(this.state.selectedKey);
			this.getPageController()?.getExtensionAPI().updateAppState();
			this.fireEvent("selectionChange");
		}
	}

	/**
	 * Creates the content of the building block.
	 * @returns The SegmentedButton
	 */
	createContent(): SegmentedButton {
		const segmentedButtonId = this.createId("filterTypeSwitch");

		return (
			<SegmentedButton ref={this.$segmentedButton} id={segmentedButtonId} selectedKey={bindState(this.state, "selectedKey")}>
				{{ items: this.items.map((item, index) => this.createSegmentedButtonItem(item, index)) }}
			</SegmentedButton>
		);
	}

	/**
	 * Creates the SegmentedButtonItem for the SegmentedButton and associate a key to it.
	 * @param item The ContentSwitcherItem
	 * @param itemIdx The index of the item
	 * @returns The SegmentedButtonItem
	 */
	createSegmentedButtonItem(item: ContentSwitcherItem, itemIdx: number): SegmentedButtonItem {
		const segmentButtonItemId = this.createId(item.key);
		item.key ??= `key${itemIdx}`;
		if (item.icon) {
			return <SegmentedButtonItem icon={item.icon} tooltip={item.text} key={item.key} id={segmentButtonItemId} />;
		}
		return <SegmentedButtonItem text={item.text} key={item.key} id={segmentButtonItemId} />;
	}
}
