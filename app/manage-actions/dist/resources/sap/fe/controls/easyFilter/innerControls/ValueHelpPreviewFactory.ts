import Log from "sap/base/Log";
import deepClone from "sap/base/util/deepClone";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { BaseFactory } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import Utils from "sap/fe/controls/easyFilter/utils";
import List from "sap/m/List";
import type { ListBase$DeleteEvent } from "sap/m/ListBase";
import type Popover from "sap/m/Popover";
import StandardListItem from "sap/m/StandardListItem";
import { ListMode, ListSeparators } from "sap/m/library";
import CustomData from "sap/ui/core/CustomData";
import type EasyFilterBarContainer from "../EasyFilterBarContainer";
import type {
	BetweenSelectedValues,
	CodeListType,
	TokenDefinition,
	TokenSelectedValuesDefinition,
	TokenType,
	ValueHelpBetweenSelectedValues,
	ValueHelpSelectedValuesDefinition
} from "../EasyFilterBarContainer";
import type EasyFilterToken from "../Token";

class ValueHelpPreviewFactory extends BaseFactory<List> {
	constructor(EFB: EnhanceWithUI5<EasyFilterBarContainer>, token: EnhanceWithUI5<EasyFilterToken>) {
		super(EFB, token);
		this.setControl(
			new List({
				delete: this.onDelete.bind(this),
				mode: ListMode.Delete,
				showSeparators: ListSeparators.None
			})
		);
	}

	setItems(
		items: ValueHelpSelectedValuesDefinition[] | TokenSelectedValuesDefinition[],
		tokenType: TokenType,
		isDateTimeOffset: boolean
	): void {
		if (Utils.areItemsSame(items, this.items as ValueHelpSelectedValuesDefinition[])) {
			return;
		}
		this.items = items;
		const list = this.getControl();
		list?.destroyAggregation("items");
		//Make sure only top 5 values are shown
		let ctr = 0;
		items.forEach((item, index1) => {
			const { operator, selectedValues } = item;
			let title = "";
			//Currently hardCoding the most number of values that can be shown is 5
			//ValueHelp will have non-fixed values, so its important to limit the number of values to be shown
			if (tokenType === "ValueHelp" && ctr < 5) {
				if (Utils.isBetweenSelectedValues(operator)) {
					title = Utils.mapOperatorForBetweenOperator(
						operator,
						selectedValues as ValueHelpBetweenSelectedValues,
						tokenType,
						isDateTimeOffset
					);
					this.insertItem(list as List, title, [index1]);
					++ctr;
				} else {
					selectedValues.forEach((selectedValue, index2) => {
						if (ctr < 5) {
							title = Utils.mapOperatorForValueHelp(operator, selectedValue as CodeListType, tokenType, isDateTimeOffset);
							this.insertItem(list as List, title, [index1, index2]);
							++ctr;
						}
					});
				}
			} else if (tokenType !== "ValueHelp") {
				if (Utils.isBetweenSelectedValues(operator)) {
					title = Utils.mapOperatorForBetweenOperator(
						operator,
						selectedValues as BetweenSelectedValues,
						tokenType,
						isDateTimeOffset
					);
					//In this case, we don't need t to store index2, because we know that LLM or VHD always gives you only 2 values in return
					this.insertItem(list as List, title, [index1]);
				} else {
					selectedValues.forEach((selectedValue, index2) => {
						title = Utils.mapOperator(operator, selectedValue as string | boolean | number | Date, tokenType, isDateTimeOffset);
						//We need to store index2 to find out which item has been removed inside the array
						this.insertItem(list as List, title, [index1, index2]);
					});
				}
			}
		});
	}

	insertItem(list: List, title: string, indexPositions: number[]): void {
		list?.addItem(
			new StandardListItem({
				title,
				customData: new CustomData({
					key: "arrayIndex",
					value: indexPositions
				})
			})
		);
	}

	onDelete(event: ListBase$DeleteEvent): void {
		const popover = this.getToken()?.getCustomDataValue("popover") as Popover;
		event.getParameter("listItem")?.setVisible(false);
		popover.focus();
	}

	normalizeString(str: string): string {
		const regex = /^(>=|<=|!=|>|<)+/;
		return str.replace(regex, "");
	}

	invokeOkButtonHandler(): void {
		const popover = this.getToken()?.getCustomDataValue("popover") as Popover;
		const token = this.getToken();
		const easyFilterBarContainer = this.getEasyFilter() as EasyFilterBarContainer;
		const items = token?.getItems()?.map((item) => ({
			operator: JSON.parse(JSON.stringify(item.operator)), // Deep copy of operator
			selectedValues: deepClone(item.selectedValues) // Deep copy of selectedValues, if its a complex object
		}));
		const indicesToBeRemoved: number[][] = [];
		this.getControl()
			?.getItems()
			.forEach((listItem) => {
				//If the item is hidden that means it should be removed completely
				if (!listItem.getVisible()) {
					const [index1 = Infinity, index2 = Infinity] =
						(listItem
							?.getCustomData()
							?.find((data) => data?.getKey() === "arrayIndex")
							?.getValue() as number[]) ?? [];
					if (index1 === Infinity || !items) {
						return;
					}
					indicesToBeRemoved.push([index1, index2]);
				}
			});

		/*
		Without sorting in descending order:

		Removing an object would shift all subsequent indices, potentially causing incorrect removals or skips.
		Removing values from selectedValues could shift other values, resulting in missed or unintended removals.
		This approach ensures that each removal operates on stable, correct indices.

		This is the reason why we have added valueIndex to infinity
		Infinity is greater than any valid index, so sorting in descending order will naturally place entries with valueIndex = Infinity at the top for each objIndex.
		This way, we can process the complete removal of an object before handling any individual selectedValues removals within that object, preventing unwanted shifts.
		 */
		indicesToBeRemoved.sort((a, b) => b[0] - a[0] || b[1] - a[1]);

		indicesToBeRemoved.forEach(([objIndex, valueIndex]) => {
			if (items) {
				//If valueIndex is infinity, then it means it should be a between operator scenario, so remove the total object only
				if (valueIndex === Infinity) {
					items.splice(objIndex, 1);
					return;
				}
				items[objIndex].selectedValues.splice(valueIndex, 1);
				// If the values array becomes empty, remove the whole object
				if (items[objIndex].selectedValues.length === 0) {
					items.splice(objIndex, 1);
				}
			}
		});
		easyFilterBarContainer.updateTokenArray(
			"setSelectedValues",
			items as TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[],
			token?.getKey() as string
		);
		popover.close();
	}

	async invokeShowAllButtonHandler(): Promise<void> {
		const token = this.getToken();
		const { type } = token?.getCustomDataValue("TokenInfo") as TokenDefinition;
		const key = token?.getKey() as string;
		const valueHelpPromise = new Promise<TokenSelectedValuesDefinition[]>((resolve, reject) => {
			this.getEasyFilter()?.fireEvent("showValueHelp", {
				key,
				values: token?.getItems()?.map((item: TokenSelectedValuesDefinition | ValueHelpSelectedValuesDefinition) => {
					if (type === "ValueHelp") {
						return {
							operator: item.operator,
							//Making sure that only the id part is passed
							selectedValues: (item as ValueHelpSelectedValuesDefinition).selectedValues.map(
								(selectedValue) => selectedValue.value
							)
						};
					} else {
						return item;
					}
				}),
				resolve,
				reject
			});
		});

		try {
			const newSelectedValues = await valueHelpPromise;
			this.getEasyFilter()?.updateTokenArray("setSelectedValues", newSelectedValues, key);
		} catch (error) {
			if (error instanceof Error) {
				Log.error("Error while fetching new tokens", error.message);
			} else {
				Log.error("Error while fetching new tokens", String(error));
			}
		}
	}

	invokePopupCloseHandler(): void {
		//Whatever has been deleted, make them appear again so that they can be visible as soon as you click the token again
		this.getControl()
			?.getItems()
			.forEach((item) => item.setVisible(true));
	}
}

export default ValueHelpPreviewFactory;
