import type { PrimitiveType } from "@sap-ux/vocabularies-types/Edm";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type { finalCodeListType } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import { BaseFactory } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import Utils from "sap/fe/controls/easyFilter/utils";
import List from "sap/m/List";
import type { ListBase$SelectionChangeEvent } from "sap/m/ListBase";
import StandardListItem from "sap/m/StandardListItem";
import library from "sap/m/library";
import CustomData from "sap/ui/core/CustomData";
import FilterOperator from "sap/ui/model/FilterOperator";
import type { PropertyMetadata } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type EasyFilterBarContainer from "../EasyFilterBarContainer";
import type { TokenDefinition, TokenSelectedValuesDefinition } from "../EasyFilterBarContainer";
import type EasyFilterToken from "../Token";

type codeListType = PropertyMetadata["codeList"];

class MenuWithSingleSelectFactory extends BaseFactory<List> {
	private selectedItemIndex = -1;

	constructor(EFB: EnhanceWithUI5<EasyFilterBarContainer>, token: EnhanceWithUI5<EasyFilterToken>) {
		const ListSeparators = library.ListSeparators;
		const ListMode = library.ListMode;

		super(EFB, token);

		// Initialize the list with single-select mode.
		this.setControl(
			new List({
				mode: ListMode.SingleSelectMaster,
				showSeparators: ListSeparators.None,
				selectionChange: this.onItemSelected.bind(this) // Attach the selection event handler.
			})
		);
	}

	/**
	 * Sets the items for the list and initializes the selection.
	 * @param newItems
	 * @param allSelectedValues
	 */
	async setItems(newItems: codeListType, allSelectedValues: TokenDefinition["keySpecificSelectedValues"]): Promise<void> {
		if (await Utils.areCodeListsSame(newItems, this.getItems() as codeListType)) {
			return;
		}

		const list: List | undefined = this.getControl();
		this.items = (await Utils.getCodeListArray(newItems)) as finalCodeListType[];
		list?.destroyAggregation("items");
		this.selectedItemIndex = -1;

		this.items.forEach((item, idx) => {
			let selectState = false;

			// Check if the item matches any preselected value.
			if (allSelectedValues.length > 0 && allSelectedValues[0].selectedValues.length > 0) {
				const firstValue = allSelectedValues[0].selectedValues[0];
				if (typeof firstValue === typeof item.value && firstValue === item.value) {
					selectState = true;
					this.selectedItemIndex = idx;
				}
			}

			// Add item to the list with the appropriate selection state.
			list?.addItem(
				new StandardListItem({
					title: item.description,
					selected: selectState,
					customData: [
						new CustomData({
							key: "value",
							value: item.value
						})
					]
				})
			);
		});
	}

	/**
	 * Event handler for item selection.
	 * Directly triggers the token update when an item is selected.
	 * @param event
	 */
	private onItemSelected(event: ListBase$SelectionChangeEvent): void {
		const selectedItem = event.getParameter("listItem");
		const list: List | undefined = this.getControl();
		const easyFilterBarContainer = this.getEasyFilter() as EasyFilterBarContainer;

		if (!selectedItem || !list) {
			return;
		}

		// Get the value of the selected item.
		const value: PrimitiveType = selectedItem
			.getCustomData()
			.find((customData: CustomData) => customData.getKey() === "value")
			?.getValue() as string | number | boolean;

		if (value !== undefined) {
			// Prepare the selected values definition.
			const selectedValue: TokenSelectedValuesDefinition[] = [
				{
					operator: FilterOperator.EQ,
					selectedValues: [value]
				}
			];

			easyFilterBarContainer?.closeInnerControlPopover();

			// Get the key of the token and update the token array.
			const { key } = this.getToken()?.getCustomDataValue("TokenInfo") as TokenDefinition;
			easyFilterBarContainer.updateTokenArray("setSelectedValues", selectedValue, key);

			// Update the selected item index for internal tracking.
			this.selectedItemIndex = list.indexOfItem(selectedItem);
		}
	}

	//Retrieves the index of the currently selected item.
	getSelectedIndex(): number {
		const selectedItem: StandardListItem | undefined = this.getControl()?.getSelectedItems()?.[0] as StandardListItem;

		return selectedItem ? this.getControl()?.indexOfItem(selectedItem) ?? -1 : -1;
	}
}

export default MenuWithSingleSelectFactory;
