import Log from "sap/base/Log";
import type { EnhanceWithUI5, StateOf } from "sap/fe/base/ClassSupport";
import {
	aggregation,
	createReference,
	defineReference,
	defineState,
	defineUI5Class,
	event,
	property,
	type PropertiesOf
} from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import Token from "sap/fe/controls/easyFilter/Token";
import Button from "sap/m/Button";
import FlexBox from "sap/m/FlexBox";
import Popover from "sap/m/Popover";
import Tokenizer from "sap/m/Tokenizer";
import VBox from "sap/m/VBox";
import { ButtonType, FlexAlignItems, FlexJustifyContent, FlexWrap, PlacementType, TokenizerRenderMode } from "sap/m/library";
import type UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import { ValueState } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";

import type { PrimitiveType } from "@sap-ux/vocabularies-types";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import deepClone from "sap/base/util/deepClone";
import { and, bindState } from "sap/fe/base/BindingToolkit";
import EasyFilterInput from "sap/fe/controls/easyFilter/EasyFilterInput";
import type EasyFilterToken from "sap/fe/controls/easyFilter/Token";
import MessageStrip from "sap/m/MessageStrip";
import OverflowToolbar from "sap/m/OverflowToolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import FilterOperator from "sap/ui/model/FilterOperator";
import FESRHelper from "sap/ui/performance/trace/FESRHelper";
import type EasyFilter from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type { EasyFilterMetadata, EasyFilterResult, PropertyMetadata, Success } from "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
import type { EventHandler } from "../../../../../../../types/extension_types";
import AINotice from "./AINotice";
import EasyFilterUtils from "./utils";

//For current release we are ignoring "All" and "Any"
//We can incorporate these values in future
export type BetweenSelectedValues = [boolean, boolean] | [string, string] | [number, number] | [Date, Date];

type llmResultForSelectedValuesType = string | Date | boolean | number;

export type CodeListType = {
	value: PrimitiveType;
	description: llmResultForSelectedValuesType;
};

export type ValueHelpBetweenSelectedValues = [CodeListType, CodeListType];

export type ValueHelpSelectedValuesDefinition =
	| {
			operator: Exclude<FilterOperator, FilterOperator.BT | FilterOperator.NB>;
			selectedValues: CodeListType[];
	  }
	| {
			operator: FilterOperator.BT | FilterOperator.NB;
			selectedValues: ValueHelpBetweenSelectedValues;
	  };

//We will be handling "ALL" and "ANY" at later point of time
export type TokenSelectedValuesDefinition =
	| {
			operator: Exclude<FilterOperator, FilterOperator.BT | FilterOperator.NB>;
			selectedValues: string[] | boolean[] | number[] | Date[];
	  }
	| {
			operator: FilterOperator.BT | FilterOperator.NB;
			selectedValues: BetweenSelectedValues;
	  };

export type TokenType = "MenuWithCheckBox" | "Calendar" | "Time" | "ValueHelp" | "MenuWithSingleSelect";

export type ValueHelpTokenDefinition = {
	key: string;
	label: string;
	keySpecificSelectedValues: ValueHelpSelectedValuesDefinition[];
	type: "ValueHelp";
	busy: boolean;
	isRequired?: boolean;
};

export type NonValueHelpTokenDefinition = {
	key: string;
	label: string;
	keySpecificSelectedValues: TokenSelectedValuesDefinition[];
	type: Exclude<TokenType, "ValueHelp">;
	isRequired?: boolean;
	busy: boolean;
};

export type TokenDefinition = ValueHelpTokenDefinition | NonValueHelpTokenDefinition;

export type TokenSetters = "setSelectedValues";

export type EasyFilterPropertyMetadata = PropertyMetadata &
	(
		| {
				type: "ValueHelp";
				defaultValue?: ValueHelpSelectedValuesDefinition[];
		  }
		| {
				type: Exclude<TokenType, "ValueHelp">;
				defaultValue?: TokenSelectedValuesDefinition[];
		  }
	);

// We need the third arguement because there might be a chance of composite keys scenario
type DataFetcher = (
	propertyName: string,
	valueOfCurrentProperty: TokenSelectedValuesDefinition[],
	llmResult: Success<EasyFilterResult>
) => Promise<ValueHelpSelectedValuesDefinition[]>;

interface FocusHandlingControl {
	onsapfocusleave?: () => void;
}

/*
 * Delivery for beta release for the easy filter feature.
 * @experimental
 */
@defineUI5Class("sap.fe.controls.easyFilter.EasyFilterBarContainer")
export default class EasyFilterBarContainer extends Control {
	@property({ type: "string" })
	contextPath?: string;

	@property({ type: "string" })
	appId?: string;

	@property({ type: "string" })
	easyFilterLib?: string;

	@property({ type: "array" })
	filterBarMetadata?: EasyFilterPropertyMetadata[];

	@property({ type: "array" })
	recommendedValues?: string[];

	@property({ type: "function" })
	dataFetcher?: DataFetcher;

	@defineReference()
	easyFilterInput!: Ref<EnhanceWithUI5<EasyFilterInput>>;

	@defineReference()
	tokenizer!: Ref<Tokenizer>;

	@aggregation({ type: "sap.ui.core.Control" })
	content?: Control;

	@event()
	tokensChanged?: EventHandler<UI5Event<{ tokens: TokenDefinition[] }, EasyFilterBarContainer>>;

	@event()
	queryChanged?: EventHandler<UI5Event<{ query: string }, EasyFilterBarContainer>>;

	@event()
	showValueHelp?: EventHandler<
		UI5Event<
			{ key: string; values: unknown[]; resolve: (value: TokenSelectedValuesDefinition[]) => void; reject: (reason?: Error) => void },
			EasyFilterBarContainer
		>
	>;

	@event()
	clearFilters?: EventHandler;

	@event()
	beforeQueryProcessing?: EventHandler;

	@event()
	afterQueryProcessing?: EventHandler;

	private resourceBundle!: ResourceBundle;

	@defineState()
	protected state: StateOf<{
		showResult: boolean;
		tokens: TokenDefinition[];
		tokenizerEditable: boolean;
		showSingleValueMessageStrip?: boolean;
		singleValueMessageStripText?: string;
	}> = {
		showResult: false,
		tokens: [] as TokenDefinition[],
		tokenizerEditable: true,
		showSingleValueMessageStrip: false,
		singleValueMessageStripText: ""
	};

	private innerControlPopover?: Popover;

	private okButton?: Button;

	private showAllButton?: Button;

	private toolbar?: OverflowToolbar;

	private mandatoryKeyMap?: Record<string, boolean>;

	//If set to true the error state can be seen on the tokens
	private isMandatoryCheckRequired?: boolean;

	private shouldTokenChangeEventFired = true;

	easyfilter?: Promise<typeof EasyFilter | undefined>;

	private resolveContentReady!: () => void;

	private inputFieldReady: Promise<void> = new Promise((resolve) => {
		this.resolveContentReady = resolve;
	});

	constructor(properties: string | ($ControlSettings & PropertiesOf<EasyFilterBarContainer>), others?: $ControlSettings) {
		super(properties as string, others);
		this.initialize();
	}

	setEasyFilterLib(easyFilterLib: string): void {
		this.setProperty("easyFilterLib", easyFilterLib);
		if (this.easyFilterLib) {
			this.easyfilter = import(this.easyFilterLib);
		}
	}

	async setAppId(appId: string): Promise<void> {
		if (!this.appId) {
			this.setProperty("appId", appId, true);
			await this.inputFieldReady;
			this.easyFilterInput.current?.setProperty("appId", appId, true);
			await this.easyFilterInput.current?.initShellHistoryProvider();
		}
	}

	setFilterBarMetadata(filterBarMetadata: EasyFilterPropertyMetadata[]): void {
		if (!this.filterBarMetadata) {
			this.setProperty("filterBarMetadata", filterBarMetadata, true);
			// populate the tokens with default value
			const tokens = this.getDefaultTokens();
			if (!this.innerControlPopover) {
				this.innerControlPopover = this.createPopoverForInnerControls();
				this.addDependent(this.innerControlPopover);
			}
			this.state.tokens = tokens;
			this.state.showResult = tokens.length > 0;
			///We don't want to display error valueStateMessage as soon the control renders
			this.isMandatoryCheckRequired = true;
			//onTokenChange event should not be fired when initial set of tokens are set
			this.shouldTokenChangeEventFired = false;
		}
	}

	init(): void {
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
	}

	initialize(): void {
		this.content = this.createContent();
		this.resolveContentReady();
		if (!this.innerControlPopover) {
			this.innerControlPopover = this.createPopoverForInnerControls();
			this.addDependent(this.innerControlPopover);
		}
		//We don't want to display error valueStateMessage as soon the control renders
		this.isMandatoryCheckRequired = true;
		//onTokenChange event should not be fired when initial set of tokens are set
		this.shouldTokenChangeEventFired = false;
	}

	// This method should be used before updating the state, once the state is updated the previous overridden default values would be gone forever
	getDefaultTokens(): TokenDefinition[] {
		const tokens: TokenDefinition[] = [];
		if (!this.mandatoryKeyMap) {
			this.mandatoryKeyMap = {};
		}
		this.filterBarMetadata?.forEach((data) => {
			const isRequired = data.required;
			if (isRequired) {
				(this.mandatoryKeyMap as Record<string, boolean>)[data.name] = true;
				//Check whether the keys exist in the current state else push it across
				if (data.type === "ValueHelp") {
					tokens.push({
						key: data.name,
						label: data.label as string,
						keySpecificSelectedValues: (data.defaultValue as ValueHelpSelectedValuesDefinition[]) ?? [],
						type: data.type,
						busy: false,
						isRequired
					});
				} else {
					tokens.push({
						key: data.name,
						label: data.label as string,
						keySpecificSelectedValues: (data.defaultValue as TokenSelectedValuesDefinition[]) ?? [],
						type: data.type,
						busy: false,
						isRequired
					});
				}
			}
		});
		return tokens;
	}

	onEnterPressed(e: UI5Event<{ query: string }, EasyFilterInput>): void {
		this.onGoPress(e.getParameter("query"));
	}

	//Making it public because in live mode the app developer can decide whether to display the error ValueStateMessage
	//In non-live mode , we are already internally handling it on every time time a user clicks on GO/Enter buttons
	public checkIfAllMandatoryTokensFilled(): boolean {
		const tokensInState = this.getUnSetMandatoryTokensInCurrentState();
		if (tokensInState.length !== 0) {
			const tokens = this.getActualTokensFromState(tokensInState);
			tokens?.forEach((token) => {
				token.setProperty("valueState", ValueState.Error);
				token.setProperty("valueStateText", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_ERROR"));
				token.openValueStateMessage();
			});
			return false;
		}
		return true;
	}

	public closeAllMandatoryValueStateMessages(): void {
		const easyTokens = this.tokenizer.current?.getTokens() as EasyFilterToken[];
		easyTokens.forEach((token) => token.closeValueStateMessage());
	}

	async onGoPress(magicQuery: string | undefined): Promise<void> {
		if (!magicQuery) {
			this.resetState();
			return;
		}
		this.state.tokenizerEditable = true;

		// Call AI service to get the filter criteria
		const easyfilter = await this.easyfilter;
		if (!easyfilter) {
			return;
		}
		this.fireEvent("beforeQueryProcessing");

		const easyFilterMetadata: EasyFilterMetadata = {
			version: 1,
			entitySet: this.contextPath,
			fields: this.filterBarMetadata as EasyFilterPropertyMetadata[]
		};

		const easyFilterResult = await easyfilter.easyFilter(magicQuery, easyFilterMetadata);

		if (easyFilterResult.success) {
			//Only add the recent query when the call is success
			//Do not track the recent queries when the isHistoryEnabled is set to false
			//It would be a violation to users privacy
			if (this.easyFilterInput.current?.isHistoryEnabled() ?? false) {
				this.easyFilterInput.current?.addRecentQuery(magicQuery);
			}
			if (easyFilterResult.data.version === 1) {
				this.handleV1Success(easyFilterResult);
			} else if (easyFilterResult.data.version === 2) {
				// Create the sap.ui.model.Filter from the filter and apply it directly to the list binding
			}
		} else {
			// error
			this.easyFilterInput.current?.setAsInvalid(easyFilterResult.message);
			this.removeNonMandatoryTokens();
			Log.error("Error while generating filter criteria: ", easyFilterResult.message);
		}

		this.fireEvent("afterQueryProcessing");
	}

	/**
	 * Handles the success response from the AI service for version 1 of the easy filter.
	 * @param easyFilterResult The result from the AI service
	 * @private
	 */
	private handleV1Success(easyFilterResult: Success<EasyFilter.EasyFilterResult>): void {
		if (easyFilterResult.data.unclear) {
			this.easyFilterInput.current?.setAsInvalid(
				this.resourceBundle.getText("M_EASY_FILTER_UNCLEAR_INPUT", [easyFilterResult.data.unclear])
			);
		}
		if (easyFilterResult.data.filter) {
			// We need to show a message to the user that the filter criteria has been generated
			Log.debug("Filter criteria generated: ", JSON.stringify(easyFilterResult.data.filter, null, 2));

			const tokens = [...this.state.tokens].filter((token) => token.isRequired);

			// Validate and apply the filter criteria
			EasyFilterUtils.formatData(tokens, easyFilterResult.data.filter, this.filterBarMetadata as EasyFilterPropertyMetadata[]);
			const valueHelpTokens = tokens.filter((result) => result.type === "ValueHelp");

			if (this.dataFetcher) {
				(valueHelpTokens as unknown as ValueHelpTokenDefinition[]).forEach(async (valueHelpToken) => {
					const result = await this.dataFetcher?.(
						valueHelpToken.key,
						valueHelpToken.keySpecificSelectedValues as unknown as TokenSelectedValuesDefinition[],
						easyFilterResult
					);
					valueHelpToken.busy = false;
					if (result) {
						valueHelpToken.keySpecificSelectedValues = result;
						this.state.showResult = true;
						this.state.tokens = updatedTokens;
					}
				});
			} else {
				//If dataFetcher is not there, then mock the value and description with the same result coming from the LLM
				valueHelpTokens.forEach((valueHelpToken) => {
					valueHelpToken.busy = false;
					valueHelpToken.keySpecificSelectedValues.forEach((keySpecificValue, idx) => {
						if (keySpecificValue.operator === FilterOperator.BT || keySpecificValue.operator === FilterOperator.NB) {
							valueHelpToken.keySpecificSelectedValues[idx].selectedValues = [
								{
									value: keySpecificValue.selectedValues[0],
									description: keySpecificValue.selectedValues[0] as unknown as llmResultForSelectedValuesType
								},
								{
									value: keySpecificValue.selectedValues[1],
									description: keySpecificValue.selectedValues[1] as unknown as llmResultForSelectedValuesType
								}
							];
						} else {
							valueHelpToken.keySpecificSelectedValues[idx].selectedValues.forEach((value, subIndx) => {
								valueHelpToken.keySpecificSelectedValues[idx].selectedValues[subIndx] = {
									value,
									description: value as unknown as llmResultForSelectedValuesType
								};
							});
						}
					});
				});
			}

			const updatedTokens = this.verifySingleSelectTokenValues(tokens);
			this.state.showResult = true;
			this.state.tokens = updatedTokens;
		}
	}

	//every single select menu type should have only one value, else splice to one value and update the  message strip
	verifySingleSelectTokenValues(tokens: TokenDefinition[]): TokenDefinition[] {
		const singleSelectTokenLabels: string[] = [];
		tokens.forEach((token) => {
			if (token.type === "MenuWithSingleSelect") {
				if (token.keySpecificSelectedValues[0].selectedValues.length > 1) {
					singleSelectTokenLabels.push(token.label);
					token.keySpecificSelectedValues[0].selectedValues.splice(1);
				}
			}
		});
		if (singleSelectTokenLabels.length) {
			this.state.singleValueMessageStripText = this.resourceBundle.getText("M_EASY_FILTER_SINGLE_VALUE_MESSAGE", [
				`<strong>${singleSelectTokenLabels.join(", ")}</strong>`
			]);
			this.state.showSingleValueMessageStrip = true;
		}
		return tokens;
	}

	createPopoverForInnerControls(): Popover {
		if (!this.innerControlPopover) {
			this.innerControlPopover = (
				<Popover id={this.getId() + "-innerPopover"} showArrow={false} showHeader={true} placement={PlacementType.Bottom}>
					{{
						footer: this.getToolbar()
					}}
				</Popover>
			);
		}
		return this.innerControlPopover as Popover;
	}

	getToolbar(): OverflowToolbar | undefined {
		if (!this.toolbar) {
			const okButton = this.getOkButton();
			const showAllButton = this.getShowAllButton();
			this.toolbar = (
				<OverflowToolbar>
					{{
						content: (
							<>
								<ToolbarSpacer />
								{okButton}
								{showAllButton}
							</>
						)
					}}
				</OverflowToolbar>
			);
		}
		return this.toolbar;
	}

	getOkButton(): Button | undefined {
		if (!this.okButton) {
			this.okButton = <Button text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_OK")} type={ButtonType.Emphasized} />;
		}
		return this.okButton;
	}

	getShowAllButton(): Button | undefined {
		if (!this.showAllButton) {
			this.showAllButton = <Button text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_SHOW_ALL_ITEMS")} />;
		}
		return this.showAllButton;
	}

	formatTokens(tokens: TokenDefinition[]): TokenDefinition[] {
		return tokens.map((token) => {
			if (token.type === "ValueHelp") {
				return {
					...token,
					keySpecificSelectedValues: token.keySpecificSelectedValues.map((value) => {
						//Making sure that only the id part is passed
						return {
							operator: value.operator,
							selectedValues: value.selectedValues.map((val) => val.value)
						};
					})
				} as TokenDefinition;
			} else {
				return deepClone(token);
			}
		});
	}

	onStateChange(changedProps: string[] = []): void {
		if (changedProps.includes("tokens")) {
			if (this.shouldTokenChangeEventFired) {
				this.fireEvent("tokensChanged", {
					tokens: this.formatTokens(this.state.tokens as unknown as TokenDefinition[])
				});
			}
			this.state.showResult = this.state.tokens.length > 0;
			if (!(this.isMandatoryCheckRequired ?? false)) {
				this.checkIfAllMandatoryTokensFilled();
			}
		}
		//Resetting to default values
		this.isMandatoryCheckRequired = false;
		this.shouldTokenChangeEventFired = true;

		//  onsapfocusleave method in sap.m.Tokenizer is automatically converting the rendermode of tokenizer to "Narrow" from "loose"
		//  In this process there are multiple popover issues happening
		//  So as a temporary fix overriding the function
		(this.tokenizer?.current as FocusHandlingControl).onsapfocusleave = (): void => {};
	}

	createContent(): VBox {
		const $topGoBtn = createReference<Button>();
		const outVBox = (
			<VBox>
				<FlexBox renderType="Bare">
					<EasyFilterInput
						recommendedValues={this.recommendedValues}
						ref={this.easyFilterInput}
						enterPressed={this.onEnterPressed.bind(this)}
						queryChanged={(e): void => {
							this.fireEvent("queryChanged", { query: e.getParameter("query") });
						}}
						liveChange={(): void => {
							this.state.tokenizerEditable = false;
						}}
					/>

					<Button
						icon={"sap-icon://ai"}
						class={"sapUiSmallMarginBegin"}
						ref={$topGoBtn}
						text={this.resourceBundle.getText("M_EASY_FILTER_GO")}
						type={ButtonType.Emphasized}
						press={this.onGoButtonPress.bind(this)}
					/>
				</FlexBox>
				<FlexBox
					renderType="Bare"
					visible={bindState(this.state, "showResult")}
					alignItems={FlexAlignItems.Center}
					wrap={FlexWrap.Wrap}
					justifyContent={FlexJustifyContent.SpaceBetween}
					class={"sapUiTinyMarginTop"}
				>
					<FlexBox class={"sapFeControlsGap8px"} renderType="Bare" alignItems={FlexAlignItems.Center} wrap={FlexWrap.Wrap}>
						<AINotice resourceBundle={this.resourceBundle} />
						<Tokenizer
							editable={and(bindState(this.state, "tokenizerEditable"), true)}
							class={"sapFeControlsTokenizer"}
							tokens={bindState(this.state, "tokens")}
							renderMode={TokenizerRenderMode.Loose}
							ref={this.tokenizer}
						>
							{{
								tokens: (idx: number, ctx: Context): Token => {
									const object = ctx.getObject() as TokenDefinition;
									return (
										<Token
											key={this.state.tokens.key}
											label={this.state.tokens.label}
											items={this.state.tokens.keySpecificSelectedValues}
											mandatory={this.isKeyMandatory(object.key)}
											busy={this.state.tokens.busy}
											delete={(): void => {
												const tokenIndex = this.state.tokens.findIndex((token) => token.key === object.key);
												const newTokens = this.state.tokens.concat();
												newTokens.splice(tokenIndex, 1);
												this.state.tokens = newTokens;
												this.updateFilterInput("tokenUpdated");
											}}
										>
											{{
												customData: [
													<CustomData key="TokenInfo" value={object} />,
													<CustomData key="popover" value={this.innerControlPopover} />,
													<CustomData key="easyFilterBarContainer" value={this} />,
													<CustomData
														key="codeList"
														value={this.filterBarMetadata?.find((data) => data.name === object.key)?.codeList}
													/>
												]
											}}
										</Token>
									);
								}
							}}
						</Tokenizer>
						<Button
							text={this.resourceBundle.getText("M_EASY_FILTER_RESET")}
							type={ButtonType.Transparent}
							press={(): void => {
								this.resetState();
								//Retaining the focus on popover doesn't make the popover close on every interaction
								this.easyFilterInput.current?.$searchInput.focus();
							}}
						/>
					</FlexBox>
				</FlexBox>
				<FlexBox renderType="Bare">
					<MessageStrip
						text={bindState(this.state, "singleValueMessageStripText")}
						showIcon={true}
						enableFormattedText={true}
						visible={bindState(this.state, "showSingleValueMessageStrip")}
						showCloseButton={true}
						close={(): void => {
							this.state.showSingleValueMessageStrip = false;
						}}
					></MessageStrip>
				</FlexBox>
			</VBox>
		) as VBox;
		FESRHelper.setSemanticStepname($topGoBtn.current!, "press", "fe:ai:search");
		return outVBox;
	}

	async onGoButtonPress(): Promise<void> {
		this.state.tokenizerEditable = true;
		let currentInputValue = this.easyFilterInput.current?.getValue();
		const currentInputPlaceholder = this.easyFilterInput.current?.getPlaceholder();

		if (currentInputValue === "" && currentInputPlaceholder !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
			this.easyFilterInput.current?.setValue(currentInputPlaceholder || "");
			currentInputValue = currentInputPlaceholder;
		}
		await this.onGoPress(currentInputValue);
	}

	resetState(clearAllFilters = true): void {
		if (clearAllFilters) {
			this.fireEvent("clearFilters");
		} else {
			this.shouldTokenChangeEventFired = false;
		}
		this.state.tokens = this.getDefaultTokens();
		this.updateFilterInput("tokenReset");
		this.state.tokenizerEditable = true;
		this.isMandatoryCheckRequired = true;
		//Set the Value States of all the Tokens back to None
		this.tokenizer.current?.getTokens().forEach((token) => token.setProperty("valueState", ValueState.None));
		this.tokenizer.current?.getTokens().forEach((token) => token.setProperty("valueStateText", null));
	}

	//The below code updates the existing state by fetching the key and selectedValues
	updateTokenArray(
		changeType: TokenSetters,
		newTokenSpecificValues: TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[],
		tokenKey: string
	): void {
		const newTokens = this.state.tokens.map((token) => ({ ...token, keySpecificSelectedValues: [...token.keySpecificSelectedValues] }));
		const tokenIndex = newTokens.findIndex((t) => t.key === tokenKey);
		const token = newTokens[tokenIndex];
		if (tokenIndex != -1) {
			switch (changeType) {
				case "setSelectedValues":
					this.setSelectedValues(token as TokenDefinition, newTokenSpecificValues, tokenIndex, newTokens as TokenDefinition[]);
					token.keySpecificSelectedValues = newTokenSpecificValues;
					//Remove the token entirely
					if (!this.isKeyMandatory(token.key) && token.keySpecificSelectedValues.length === 0) {
						newTokens.splice(tokenIndex, 1);
					}
					break;
				default:
					Log.error("Specifying a setter that is out of the boundary");
					break;
			}
			// Update the state by assigning the new tokens array
			this.state.tokens = newTokens as TokenDefinition[];
			this.state.showResult = newTokens.length > 0;
			this.updateFilterInput("tokenUpdated");
		}
	}

	public closeInnerControlPopover(): void {
		this.innerControlPopover?.close();
	}

	private setSelectedValues(
		token: TokenDefinition,
		newTokenSpecificValues: TokenSelectedValuesDefinition[] | ValueHelpSelectedValuesDefinition[],
		tokenIndex: number,
		newTokens: TokenDefinition[]
	): void {
		token.keySpecificSelectedValues = newTokenSpecificValues;
		if (!this.isKeyMandatory(token.key) && token.keySpecificSelectedValues.length === 0) {
			newTokens.splice(tokenIndex, 1);
		}
	}

	isKeyMandatory(key: string): boolean {
		if (!this.mandatoryKeyMap) {
			this.mandatoryKeyMap = {};
		}
		return this.mandatoryKeyMap[key] ? true : false;
	}

	removeNonMandatoryTokens(): this {
		const newToken: TokenDefinition[] = this.state.tokens.filter((token) => {
			return this.isKeyMandatory(token.key);
		});
		this.state.tokens = newToken;
		return this;
	}

	updateFilterInput(value: string): void {
		const currValue: string = this.easyFilterInput.current?.getValue() || "";
		if (value === "tokenUpdated" && currValue !== "") {
			this.easyFilterInput.current?.setValue("");
			this.easyFilterInput.current?.setPlaceholder(currValue);
		} else if (value === "tokenReset") {
			this.easyFilterInput.current?.setValue("");
			this.easyFilterInput.current?.setPlaceholder(this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER"));
		}
	}

	getTokensInInitialState(): TokenDefinition[] {
		const newTokens = this.state.tokens.map((token) => ({ ...token, keySpecificSelectedValues: [...token.keySpecificSelectedValues] }));
		const mandatoryTokens = newTokens.filter((token) => {
			if (this.isKeyMandatory(token.key)) {
				return true;
			}
		});
		return mandatoryTokens.map((token) => ({ ...token, keySpecificSelectedValues: [] }));
	}

	getUnSetMandatoryTokensInCurrentState(): TokenDefinition[] {
		return this.state.tokens.filter((token) => {
			const isKeyMandatory = this.isKeyMandatory(token.key);
			if (isKeyMandatory) {
				return token.keySpecificSelectedValues.length === 0;
			}
		});
	}

	getActualTokensFromState(tokens: TokenDefinition[]): EasyFilterToken[] | undefined {
		const requiredKeys = tokens.map((token) => token.key);
		return this.tokenizer.current?.getTokens().filter((token) => requiredKeys.includes(token.getKey())) as
			| EasyFilterToken[]
			| undefined;
	}

	static render(rm: RenderManager, control: EasyFilterBarContainer): void {
		return jsx.renderUsingRenderManager(rm, control, () => {
			return <span ref={control}>{control.getAggregation("content")}</span>;
		});
	}
}
