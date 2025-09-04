import Log from "sap/base/Log";
import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import { BaseFactory } from "sap/fe/controls/easyFilter/innerControls/BaseFactory";
import type Popover from "sap/m/Popover";
import type UI5Date from "sap/ui/core/date/UI5Date";
import DateFormat from "sap/ui/core/format/DateFormat";
import FilterOperator from "sap/ui/model/FilterOperator";
import Calendar from "sap/ui/unified/Calendar";
import type EasyFilterBarContainer from "../EasyFilterBarContainer";
import type { TokenDefinition, TokenSelectedValuesDefinition } from "../EasyFilterBarContainer";
import type EasyFilterToken from "../Token";
import EasyFilterUtils from "../utils";

class CalenderFactory extends BaseFactory<Calendar> {
	constructor(EFB: EnhanceWithUI5<EasyFilterBarContainer>, token: EnhanceWithUI5<EasyFilterToken>) {
		super(EFB, token);
		this.setControl(new Calendar({}));
	}

	invokeOkButtonHandler(): void {
		const calendar = this.getControl();
		const popover = this.getToken()?.getCustomDataValue("popover") as Popover;
		const { key, keySpecificSelectedValues } = this.getToken()?.getCustomDataValue("TokenInfo") as TokenDefinition;
		const formattedDate = DateFormat.getDateInstance().format(calendar?.getSelectedDates()[0].getStartDate() as UI5Date | Date);
		const operator = keySpecificSelectedValues.length === 0 ? FilterOperator.EQ : keySpecificSelectedValues[0].operator;
		const newSpecificValue: TokenDefinition["keySpecificSelectedValues"] = [
			{
				operator: operator as Exclude<
					FilterOperator,
					FilterOperator.BT | FilterOperator.NB | FilterOperator.All | FilterOperator.Any
				>,
				selectedValues: [formattedDate] as string[] | number[] | boolean[]
			}
		];
		if (EasyFilterUtils.areItemsSame(keySpecificSelectedValues, newSpecificValue)) {
			return;
		}
		this.getEasyFilter()?.updateTokenArray("setSelectedValues", newSpecificValue, key);
		popover?.close();
	}

	async invokeShowAllButtonHandler(): Promise<void> {
		const token = this.getToken();
		const key = token?.getKey() as string;
		const valueHelpPromise = new Promise<TokenSelectedValuesDefinition[]>((resolve, reject) => {
			this.getEasyFilter()?.fireEvent("showValueHelp", {
				key,
				selectedValues: token?.getItems(),
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
}

export default CalenderFactory;
