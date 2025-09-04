import Log from "sap/base/Log";
import type { EnhanceWithUI5, PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import type List from "sap/m/List";
import type Popover from "sap/m/Popover";
import type TimePickerClocks from "sap/m/TimePickerClocks";
import type { $TokenSettings } from "sap/m/Token";
import Token from "sap/m/Token";
import type Tokenizer from "sap/m/Tokenizer";
import ValueStateMessage from "sap/m/delegate/ValueStateMessage";
import type Control from "sap/ui/core/Control";
import type CustomData from "sap/ui/core/CustomData";
import type UI5Element from "sap/ui/core/Element";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import { ValueState } from "sap/ui/core/library";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Calendar from "sap/ui/unified/Calendar";
import type { PropertyMetadata } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type EasyFilterBarContainer from "./EasyFilterBarContainer";
import type {
	BetweenSelectedValues,
	CodeListType,
	EasyFilterPropertyMetadata,
	TokenDefinition,
	TokenSelectedValuesDefinition,
	ValueHelpSelectedValuesDefinition
} from "./EasyFilterBarContainer";
import CalenderFactory from "./innerControls/CalendarFactory";
import MenuWithCheckBoxFactory from "./innerControls/MenuWithCheckBoxFactory";
import MenuWithSingleSelectFactory from "./innerControls/MenuWithSingleSelectFactory";
import TimeFactory from "./innerControls/TimeFactory";
import ValueHelpPreviewFactory from "./innerControls/ValueHelpPreviewFactory";
import EasyFilterUtils from "./utils";

type codeListType = PropertyMetadata["codeList"];
type CustomKeys = "TokenInfo" | "popover" | "easyFilterBarContainer" | "codeList";

@defineUI5Class("sap.fe.controls.easyFilter.Token")
export default class EasyFilterToken extends Token {
	@property({ type: "string" })
	label?: string;

	@property({ type: "string" })
	titlePopover?: string;

	@property({ type: "string" })
	value?: string;

	@property({ type: "string", defaultValue: null })
	valueStateText?: string;

	@property({ type: "boolean" })
	mandatory?: boolean;

	@property({ type: "array" })
	items?: TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[];

	@property({ type: "sap.ui.core.ValueState", group: "Appearance", defaultValue: ValueState.None })
	valueState?: ValueState;

	@property({ type: "int", visibility: "hidden" })
	posinset?: number;

	@property({ type: "int", visibility: "hidden" })
	setsize?: number;

	private resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;

	private innerControl?: Calendar | TimePickerClocks | List;

	private time?: TimeFactory;

	private calender?: CalenderFactory;

	private valueHelpPreview?: ValueHelpPreviewFactory;

	private menuWithCheckBox?: MenuWithCheckBoxFactory;

	private menuWithSingleSelect?: MenuWithSingleSelectFactory;

	private eventAttached = false;

	private isDescriptionFetched = false;

	private valueStateMessage?: ValueStateMessage;

	private static prevTokenKey?: string;

	constructor(
		idOrSettings: string | (PropertiesOf<EasyFilterToken> & $TokenSettings),
		settings?: PropertiesOf<EasyFilterToken> & $TokenSettings
	) {
		super(idOrSettings as string, settings);
		this.valueStateMessage = new ValueStateMessage(this);
		//Closing the ValueState popovers whenever we are clicking/tapping else where on the screen
		this.attachCloseHandlersForValueStateMessagePopup();
	}

	firePress(_parameters: unknown): this {
		const tokenizer = this.getParent() as Tokenizer;
		if (!tokenizer.getEditable()) {
			return this;
		}
		// We hijack the press event to open the detail popover
		this.fireEvent("press");
		this.valueStateMessage?.close();

		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;

		const { key, type, keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;

		// Check if the popover is already open
		if (popover.isOpen()) {
			// If the popover is open and the new key is the same as the previous one, do nothing
			if (EasyFilterToken.prevTokenKey === key) {
				return this; // Return early to prevent any further action
			} else {
				// If the key is different, update prevTokenKey and close the popover
				EasyFilterToken.prevTokenKey = key; // Update the previous token key to the new one
				popover.close(); // Close the popover
			}
		} else {
			// If the popover is not open, update prevTokenKey for the first time
			EasyFilterToken.prevTokenKey = key;
		}

		//resetting the header and footer, if hidden by singleselect
		popover?.setShowHeader(true);
		popover?.getFooter()?.setVisible(true);

		if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			this.invokeCalendar();
		} else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			this.invokeTime();
		} else if (type === "MenuWithCheckBox") {
			this.invokeMenuWithCheckBox();
		} else if (type === "MenuWithSingleSelect") {
			this.invokeMenuWithSingleSelect();
		} else {
			this.invokeValueHelpPreview();
		}
		const okButton = easyFilterBarContainer?.getOkButton();
		const showAllButton = easyFilterBarContainer?.getShowAllButton();
		if (!(this.eventAttached ?? false)) {
			okButton?.attachPress(this.handleOkClick.bind(this));
			showAllButton?.attachPress(this.handleShowAllClick.bind(this));
			popover.attachAfterClose(this.handleAttachAfterClose.bind(this));
			this.eventAttached = true;
		}
		return this;
	}

	getCustomDataValue(key: CustomKeys): TokenDefinition | Popover | EasyFilterBarContainer | codeListType | undefined {
		return this.getCustomData()
			.find((customData: CustomData) => customData.getKey() === key)
			?.getValue();
	}

	onBeforeRendering(e: jQuery.Event): void | undefined {
		Token.prototype.onBeforeRendering.apply(this, [e]);
		if (!this.isDescriptionFetched) {
			this.setValueForToken();
		}
		this.isDescriptionFetched = false;
	}

	attachCloseHandlersForValueStateMessagePopup(): void {
		document.addEventListener("click", () => {
			if (this?.valueStateMessage) {
				this.valueStateMessage.close();
			}
		});

		document.addEventListener("touchstart", () => {
			if (this?.valueStateMessage) {
				this.valueStateMessage.close();
			}
		});
	}

	setValueForToken(): void {
		const tokenSelectedValues = this.items as (TokenSelectedValuesDefinition | ValueHelpSelectedValuesDefinition)[];
		if (tokenSelectedValues.length === 0) {
			this.setProperty("value", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_SELECT_VALUE"), true);
			return;
		}

		const firstSelectedValue = tokenSelectedValues[0];
		const totalSelectedValues = this.calculateTotalSelectedValues(tokenSelectedValues);

		if (totalSelectedValues === 1) {
			this.handleSingleSelectedValue(firstSelectedValue);
		} else {
			this.handleMultipleSelectedValues(totalSelectedValues);
		}
	}

	private calculateTotalSelectedValues(
		tokenSelectedValues: (TokenSelectedValuesDefinition | ValueHelpSelectedValuesDefinition)[]
	): number {
		return tokenSelectedValues.reduce((counter, token) => {
			return EasyFilterUtils.isBetweenSelectedValues(token.operator) ? counter + 1 : counter + token.selectedValues.length;
		}, 0);
	}

	private handleSingleSelectedValue(firstSelectedValue: TokenSelectedValuesDefinition | ValueHelpSelectedValuesDefinition): void {
		const tokenInfo = this.getCustomDataValue("TokenInfo");
		const firstOperator = firstSelectedValue?.operator;
		const initSelectedValue = firstSelectedValue.selectedValues[0];
		const selectedValues = firstSelectedValue.selectedValues;
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer | undefined;
		const requiredMetadata = easyFilterBarContainer?.filterBarMetadata?.find((data) => data.name === this.getKey());

		if (!requiredMetadata) {
			return;
		}

		const { type, dataType } = requiredMetadata;
		if (tokenInfo) {
			const { key } = tokenInfo as TokenDefinition;
			if (type === "MenuWithCheckBox" || type === "MenuWithSingleSelect") {
				this.setValueForMenu(key);
				return;
			}
			if (type === "ValueHelp") {
				if (EasyFilterUtils.isBetweenSelectedValues(firstOperator)) {
					this.setProperty(
						"value",
						EasyFilterUtils.mapOperatorForBetweenOperator(
							firstOperator,
							selectedValues as BetweenSelectedValues,
							type,
							dataType === "Edm.DateTimeOffset"
						),
						true
					);
				} else {
					this.setProperty(
						"value",
						EasyFilterUtils.mapOperatorForValueHelp(
							firstOperator,
							initSelectedValue as CodeListType,
							type,
							dataType === "Edm.DateTimeOffset"
						),
						true
					);
				}
			} else if (EasyFilterUtils.isBetweenSelectedValues(firstOperator)) {
				this.setProperty(
					"value",
					EasyFilterUtils.mapOperatorForBetweenOperator(
						firstOperator,
						selectedValues as BetweenSelectedValues,
						type,
						dataType === "Edm.DateTimeOffset"
					),
					true
				);
			} else {
				this.setProperty(
					"value",
					EasyFilterUtils.mapOperator(
						firstOperator,
						initSelectedValue as string | number | boolean | Date,
						type,
						dataType === "Edm.DateTimeOffset"
					),
					true
				);
			}
		}
	}

	private handleMultipleSelectedValues(totalSelectedValues: number): void {
		const tokenInfo = this.getCustomDataValue("TokenInfo") as TokenDefinition | undefined;

		if (tokenInfo?.type === "ValueHelp" && totalSelectedValues > 5) {
			totalSelectedValues = 5;
		}

		this.setProperty("value", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_ITEMS", [totalSelectedValues]), true);
	}

	setValueForMenu(key: string): void {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		//The retrieval of codeList might take more time so marking the control as busy until then
		this.setBusy(true);
		(async (): Promise<void> => {
			try {
				const description = await this.getDescriptionByKey(
					easyFilterBarContainer.filterBarMetadata?.find((data) => data.name === key) as EasyFilterPropertyMetadata,
					this.items as TokenSelectedValuesDefinition[]
				);
				//Rerender the token once the description is fetched
				this.setProperty("value", description);
				this.isDescriptionFetched = true;
				this.setBusy(false);
			} catch (error) {
				Log.error("Error while fetching codeList", error as Error);
			}
		})();
	}

	getDomRefForValueStateMessage(): Element | null {
		return this.getDomRef();
	}

	async getDescriptionByKey(
		data: EasyFilterPropertyMetadata,
		selectedValues: TokenDefinition["keySpecificSelectedValues"]
	): Promise<string> {
		const codeList = await EasyFilterUtils.getCodeListArray(data.codeList);
		return codeList?.find((list) => list.value === selectedValues[0].selectedValues[0])?.description as string;
	}

	async invokeMenuWithCheckBox(): Promise<void> {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;
		const codeList = this.getCustomDataValue("codeList") as codeListType;
		const { keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;
		if (!this.menuWithCheckBox) {
			this.menuWithCheckBox = new MenuWithCheckBoxFactory(
				easyFilterBarContainer as EnhanceWithUI5<EasyFilterBarContainer>,
				this as EasyFilterToken as EnhanceWithUI5<EasyFilterToken>
			);
		}
		this.innerControl = this.menuWithCheckBox.getControl();
		this.addDependent(this.innerControl as UI5Element);
		await this.menuWithCheckBox.setItems(codeList, keySpecificSelectedValues);
		popover?.removeAllContent();
		popover?.addContent(this.innerControl as Control);
		easyFilterBarContainer?.getShowAllButton()?.setVisible(false);
		this.openPopover();
	}

	async invokeMenuWithSingleSelect(): Promise<void> {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;
		const codeList = this.getCustomDataValue("codeList") as codeListType;
		const { keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;
		if (!this.menuWithSingleSelect) {
			this.menuWithSingleSelect = new MenuWithSingleSelectFactory(
				easyFilterBarContainer as EnhanceWithUI5<EasyFilterBarContainer>,
				this as EasyFilterToken as EnhanceWithUI5<EasyFilterToken>
			);
		}
		this.innerControl = this.menuWithSingleSelect.getControl();
		this.addDependent(this.innerControl as UI5Element);
		await this.menuWithSingleSelect.setItems(codeList, keySpecificSelectedValues);

		popover.setShowHeader(false);
		popover.getFooter()?.setVisible(false);

		popover?.removeAllContent();
		popover?.addContent(this.innerControl as Control);
		this.openPopover();
	}

	invokeCalendar(): void {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;
		if (!this.calender) {
			this.calender = new CalenderFactory(
				easyFilterBarContainer as EnhanceWithUI5<EasyFilterBarContainer>,
				this as EasyFilterToken as EnhanceWithUI5<EasyFilterToken>
			);
		}
		this.innerControl = this.calender.getControl();
		this.addDependent(this.innerControl as UI5Element);
		popover?.removeAllContent();
		popover?.addContent(this.innerControl as Control);
		easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
		this.openPopover();
	}

	invokeTime(): void {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;
		if (!this.time) {
			this.time = new TimeFactory(
				easyFilterBarContainer as EnhanceWithUI5<EasyFilterBarContainer>,
				this as EasyFilterToken as EnhanceWithUI5<EasyFilterToken>
			);
		}
		this.innerControl = this.time.getControl();
		this.addDependent(this.innerControl as UI5Element);
		popover?.removeAllContent();
		popover?.addContent(this.innerControl as Control);
		easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
		this.openPopover();
	}

	invokeValueHelpPreview(): void {
		const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer") as EasyFilterBarContainer;
		const popover = this.getCustomDataValue("popover") as Popover;
		if (!this.valueHelpPreview) {
			this.valueHelpPreview = new ValueHelpPreviewFactory(
				easyFilterBarContainer as EnhanceWithUI5<EasyFilterBarContainer>,
				this as EasyFilterToken as EnhanceWithUI5<EasyFilterToken>
			);
		}
		const { type, dataType } = easyFilterBarContainer.filterBarMetadata?.find(
			(data) => data.name === this.getKey()
		) as EasyFilterPropertyMetadata;

		if (type === "ValueHelp") {
			this.valueHelpPreview.setItems(this.items as ValueHelpSelectedValuesDefinition[], type, dataType === "Edm.DateTimeOffset");
		} else {
			this.valueHelpPreview.setItems(this.items as TokenSelectedValuesDefinition[], type, dataType === "Edm.DateTimeOffset");
		}
		this.innerControl = this.valueHelpPreview.getControl();
		this.addDependent(this.innerControl as UI5Element);
		popover?.removeAllContent();
		popover?.addContent(this.innerControl as Control);
		easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
		this.openPopover();
	}

	openPopover(): void {
		const oPopover = this.getCustomDataValue("popover") as Popover;
		oPopover?.setTitle(this.label);
		oPopover?.openBy(this);
	}

	handleOkClick(): void {
		// The below event handler would be invoked on all the tokens when OK button is clicked on the popover
		//Writing the below check so that we know that the current token instance is handling the press events appropriately
		if (!this.innerControl?.getDomRef()) {
			return;
		}
		const { type, keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;
		const popover = this.getCustomDataValue("popover") as Popover;

		let okButtonHandler: (() => void) | undefined;
		if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			okButtonHandler = this.calender?.invokeOkButtonHandler.bind(this.calender);
		} else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			okButtonHandler = this.time?.invokeOkButtonHandler.bind(this.time);
		} else if (type === "MenuWithCheckBox") {
			okButtonHandler = this.menuWithCheckBox?.invokeOkButtonHandler.bind(this.menuWithCheckBox);
		} else {
			okButtonHandler = this.valueHelpPreview?.invokeOkButtonHandler.bind(this.valueHelpPreview);
		}

		if (okButtonHandler) {
			okButtonHandler();
		}
		popover?.close();
	}

	handleShowAllClick(): void {
		// The below event handler would be invoked on all the tokens when OK button is clicked on the popover
		//Writing the below check so that we know that the current token instance is handling the press events appropriately
		if (!this.innerControl?.getDomRef()) {
			return;
		}
		const popover = this.getCustomDataValue("popover") as Popover;
		const { type, keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;
		popover.close();
		let valueHelpHandler: (() => Promise<void>) | undefined;
		if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			valueHelpHandler = this.calender?.invokeShowAllButtonHandler.bind(this.calender);
		} else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
			valueHelpHandler = this.time?.invokeShowAllButtonHandler.bind(this.time);
		} else {
			valueHelpHandler = this.valueHelpPreview?.invokeShowAllButtonHandler.bind(this.valueHelpPreview);
		}
		if (valueHelpHandler) {
			((): void => {
				valueHelpHandler();
			})();
		}
	}

	handleAttachAfterClose(): void {
		if (!this.innerControl?.getDomRef()) {
			return;
		}
		const tokenInfo = this.getCustomDataValue("TokenInfo") as TokenDefinition | undefined;
		if (tokenInfo) {
			const { type, keySpecificSelectedValues } = this.getCustomDataValue("TokenInfo") as TokenDefinition;
			if (
				type === "ValueHelp" ||
				((type === "Calendar" || type === "Time") && !this.shouldOpenDefaultFragment(keySpecificSelectedValues))
			) {
				this.valueHelpPreview?.invokePopupCloseHandler();
			} else if (type === "MenuWithCheckBox") {
				this.menuWithCheckBox?.invokePopupCloseHandler();
			}
		}
	}

	getInnerControl(): Calendar | TimePickerClocks | List | undefined {
		return this.innerControl;
	}

	openValueStateMessage(): void {
		this.valueStateMessage?.open();
	}

	closeValueStateMessage(): void {
		this.valueStateMessage?.close();
	}

	shouldOpenDefaultFragment(keySpecificSelectedValues: TokenSelectedValuesDefinition[]): boolean {
		//Between and NotBetween cant be handled by default fragments
		const isBetweenOperator = keySpecificSelectedValues.find(
			(selectedValues) => selectedValues.operator === FilterOperator.BT || selectedValues.operator === FilterOperator.NB
		);
		//This first condition would be useful in mandatory token scenario and no value has been set to it
		return (
			keySpecificSelectedValues.length === 0 ||
			(keySpecificSelectedValues.length === 1 && keySpecificSelectedValues[0].selectedValues.length === 1 && !isBetweenOperator)
		);
	}

	focusout(): void {
		this.valueStateMessage?.close();
	}

	static render(rm: RenderManager, control: EnhanceWithUI5<EasyFilterToken>): void {
		return jsx.renderUsingRenderManager(rm, control, () => {
			const tokenizer = control.getParent() as EnhanceWithUI5<Tokenizer>;
			const classes = ["sapMToken", "sapFeControlsToken"];
			const classesForLabel = ["sapMTokenText", "sapFeControlsTokenPropertyName"];
			const classesForValue = ["sapMTokenText", "sapFeControlsTokenPropertyValues"];
			const isMandatory = control.getMandatory();
			if (typeof tokenizer?.getEditable === "function" && tokenizer?.getEditable()) {
				classes.push("sapFEControlsPointer");
			}
			if (control.getSelected()) {
				classes.push("sapMTokenSelected");
			}
			if (isMandatory ?? false) {
				classes.push("sapFeControlsTokenMandatory");
				if (control.getValue() === control.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_SELECT_VALUE")) {
					classesForValue.push("sapFeControlsTokenMandatory");
				}
			}
			if (control.getValueState() === ValueState.Error) {
				classes.push("sapFeTokenError");
			}
			return (
				<div
					ref={control}
					class={classes.join(" ")}
					aria-selected={control.getSelected()}
					tabindex={-1}
					aria-posinset={control.getProperty("posinset")}
					aria-setsize={control.getProperty("setsize")}
				>
					<span class={classesForLabel.join(" ")}>{control.getLabel()}:</span>
					<span class={classesForValue.join(" ")}>{control.getValue()}</span>
					{isMandatory === true ? null : control.getAggregation("deleteIcon")}
				</div>
			);
		});
	}
}
