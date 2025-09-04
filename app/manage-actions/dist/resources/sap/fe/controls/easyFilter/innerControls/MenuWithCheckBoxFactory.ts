import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type { finalCodeListType } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import { BaseFactory } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import Utils from "sap/fe/controls/easyFilter/utils";
import List from "sap/m/List";
import StandardListItem from "sap/m/StandardListItem";
import library from "sap/m/library";
import CustomData from "sap/ui/core/CustomData";
import FilterOperator from "sap/ui/model/FilterOperator";
import type { PropertyMetadata } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type EasyFilterBarContainer from "../EasyFilterBarContainer";
import type { TokenDefinition, TokenSelectedValuesDefinition } from "../EasyFilterBarContainer";
import type EasyFilterToken from "../Token";
type codeListType = PropertyMetadata["codeList"];
class MenuWithCheckBoxFactory extends BaseFactory<List> {
	private selectionList: number[] = [];

	private okButtonClicked = false;

	constructor(EFB: EnhanceWithUI5<EasyFilterBarContainer>, token: EnhanceWithUI5<EasyFilterToken>) {
		const ListSeparators = library.ListSeparators;
		const ListMode = library.ListMode;
		super(EFB, token);
		this.setControl(
			new List({
				mode: ListMode.MultiSelect,
				showSeparators: ListSeparators.None
			})
		);
	}

	async setItems(newItems: codeListType, allSelectedValues: TokenDefinition["keySpecificSelectedValues"]): Promise<void> {
		if (await Utils.areCodeListsSame(newItems, this.getItems() as codeListType)) {
			return;
		}
		const list: List | undefined = this.getControl();

		this.items = (await Utils.getCodeListArray(newItems)) as finalCodeListType[];
		list?.destroyAggregation("items");
		this.selectionList = [];
		this.items.forEach((item, idx) => {
			let selectState = false;
			//Value should either be string, number or boolean.
			if (allSelectedValues.length > 0 && allSelectedValues[0].selectedValues.length > 0) {
				const firstValue = allSelectedValues[0].selectedValues[0];
				if (typeof firstValue === "string" && typeof item.value === "string") {
					// Assert selectedValues as string[]
					if ((allSelectedValues[0].selectedValues as string[]).includes(item.value)) {
						selectState = true;
						this.selectionList?.push(idx);
					}
				} else if (typeof firstValue === "boolean" && typeof item.value === "boolean") {
					// Assert selectedValues as boolean[]
					if ((allSelectedValues[0].selectedValues as boolean[]).includes(item.value)) {
						selectState = true;
						this.selectionList?.push(idx);
					}
				} else if (typeof firstValue === "number" && typeof item.value === "number") {
					// Assert selectedValues as number[]
					if ((allSelectedValues[0].selectedValues as number[]).includes(item.value)) {
						selectState = true;
						this.selectionList?.push(idx);
					}
				}
			}

			list?.addItem(
				new StandardListItem({
					title: item.description,
					selected: selectState,
					customData: [
						//Saving the value inside the CustomData, because at the end we would be exposing the values to the consumer not the description
						new CustomData({
							key: "value",
							value: item.value
						})
					]
				})
			);
		});
	}

	invokeOkButtonHandler(): void {
		if (this.areSelectListSame()) {
			return;
		}
		this.selectionList = this.getSelectedIndices();
		this.okButtonClicked = true;
		const listItems: StandardListItem[] | undefined = this.getControl()?.getSelectedItems() as StandardListItem[];
		const easyFilterBarContainer = this.getEasyFilter() as EasyFilterBarContainer;
		let allSelectedValues: TokenSelectedValuesDefinition[] = [
			{
				operator: FilterOperator.EQ,
				selectedValues: []
			}
		];
		const { key } = this.getToken()?.getCustomDataValue("TokenInfo") as TokenDefinition;
		listItems.forEach((item) => {
			const value: string | number | boolean | undefined = item
				.getCustomData()
				.find((customData: CustomData) => customData.getKey() === "value")
				?.getValue() as string | number | boolean;

			if (value !== undefined) {
				// Check the type of value and the contents of selectedValues
				if (Array.isArray(allSelectedValues[0].selectedValues)) {
					const selectedValues = allSelectedValues[0].selectedValues;
					if (
						(typeof value === "string" && selectedValues.every((val): val is string => typeof val === "string")) ||
						(typeof value === "boolean" && selectedValues.every((val): val is boolean => typeof val === "boolean")) ||
						(typeof value === "number" && selectedValues.every((val): val is number => typeof val === "number"))
					) {
						// Push the value only if all selectedValues are of the same type
						(selectedValues as Array<typeof value>).push(value);
					}
				}
			}
		});

		allSelectedValues = allSelectedValues[0].selectedValues.length === 0 ? [] : allSelectedValues;
		easyFilterBarContainer.updateTokenArray("setSelectedValues", allSelectedValues, key);
	}

	areSelectListSame(): boolean {
		//The below case would get applicable in mandatory tokens case where no value has been set
		const tempSelectList = this.getSelectedIndices();
		if (this.selectionList.length === 0 || tempSelectList.length !== this.selectionList.length) {
			return false;
		}
		return this.selectionList.every((item, idx) => tempSelectList[idx] === item);
	}

	invokePopupCloseHandler(): void {
		if (this.okButtonClicked) {
			this.okButtonClicked = false;
			return;
		}
		this.okButtonClicked = false;
		this.getControl()?.removeSelections();
		this.selectionList?.forEach((idx) => this.getControl()?.getItems()[idx].setSelected(true));
	}

	setSelectList(): void {
		this.selectionList = [];
		const listItems: StandardListItem[] = this.getControl()?.getSelectedItems() as StandardListItem[];
		listItems?.forEach((item) => this.selectionList?.push(this.getControl()?.indexOfItem(item) as number));
	}

	getSelectedIndices(): number[] {
		const selectionList: number[] = [];
		const listItems: StandardListItem[] = this.getControl()?.getSelectedItems() as StandardListItem[];
		listItems?.forEach((item) => selectionList?.push(this.getControl()?.indexOfItem(item) as number));
		return selectionList;
	}
}

export default MenuWithCheckBoxFactory;
