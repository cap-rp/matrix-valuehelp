import Log from "sap/base/Log";
import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { PathInModelExpression } from "sap/fe/base/BindingToolkit";
import { bindState, equal, length, lessThan } from "sap/fe/base/BindingToolkit";
import { aggregation, defineState, defineUI5Class, event, property, type PropertiesOf, type StateOf } from "sap/fe/base/ClassSupport";
import EventDelegateHook from "sap/fe/base/EventDelegateHook";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import ShellHistoryProvider from "sap/fe/controls/easyFilter/ShellHistoryProvider";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import FlexBox from "sap/m/FlexBox";
import HBox from "sap/m/HBox";
import IllustratedMessage from "sap/m/IllustratedMessage";
import IllustratedMessageSize from "sap/m/IllustratedMessageSize";
import IllustratedMessageType from "sap/m/IllustratedMessageType";
import type { Input$LiveChangeEvent } from "sap/m/Input";
import Input from "sap/m/Input";
import List from "sap/m/List";
import type { ListBase$DeleteEvent } from "sap/m/ListBase";
import Popover from "sap/m/Popover";
import type StandardListItem from "sap/m/StandardListItem";
import Text from "sap/m/Text";
import Title from "sap/m/Title";
import { ButtonType, FlexAlignItems, FlexDirection, FlexJustifyContent, FlexWrap, ListMode, PlacementType } from "sap/m/library";
import type UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/core/Control";
import Control from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import { TitleLevel, ValueState } from "sap/ui/core/library";
import type Context from "sap/ui/model/Context";
import type { EventHandler } from "../../../../../../../types/extension_types";

type RecentType = {
	text: string;
	isFavorite: boolean;
};
@defineUI5Class("sap.fe.controls.easyFilter.EasyFilterInput")
export default class EasyFilterInput extends Control {
	@aggregation({ type: "sap.m.Input", multiple: false, isDefault: true })
	$searchInput!: Input;

	@property({ type: "string" })
	appId?: string;

	@property({ type: "array" })
	recommendedValues?: string[];

	@event()
	queryChanged?: EventHandler<UI5Event<{ query: string }, EasyFilterInput>>;

	@event()
	enterPressed?: EventHandler<UI5Event<{ query: string }, EasyFilterInput>>;

	@event()
	liveChange?: EventHandler;

	private resourceBundle!: ResourceBundle;

	shellHistoryProvider: ShellHistoryProvider | undefined;

	$favoritePopover: Popover | undefined;

	@defineState()
	protected state: StateOf<{
		queryChanged: boolean;
		recentQueries: readonly string[];
		recentQueriesWitFavorites: readonly RecentType[];
		isHistoryEnabled: boolean;
		favoriteQueries: string[];
		recommendedQueries: string[];
	}> = {
		queryChanged: false,
		isHistoryEnabled: false,
		recentQueries: [],
		recentQueriesWitFavorites: [],
		favoriteQueries: [] as string[],
		recommendedQueries: [] as string[]
	};

	constructor(properties: string | ($ControlSettings & PropertiesOf<EasyFilterInput>), others?: $ControlSettings) {
		super(properties as string, others);
		this.initialize();
	}

	public getValue(): string {
		return this.$searchInput.getValue();
	}

	public isHistoryEnabled(): boolean {
		return this.state.isHistoryEnabled.valueOf();
	}

	setValue(value: string): this {
		this.$searchInput.setValue(value);
		return this;
	}

	setPlaceholder(value: string): this {
		this.$searchInput.setPlaceholder(value);
		return this;
	}

	public getPlaceholder(): string {
		return this.$searchInput.getPlaceholder();
	}

	initialize(): void {
		this.state.recommendedQueries = this.recommendedValues ?? [];
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
		this.createInput();
	}

	setAsInvalid(message: string): void {
		this.$searchInput.setValueState(ValueState.Warning);
		this.$searchInput.setValueStateText(message);
		this.$searchInput.openValueStateMessage();
	}

	createInput(): void {
		this.$searchInput = (
			<Input
				width="100%"
				showClearIcon={true}
				change={(e): void => {
					this.fireEvent("queryChanged", { query: e.getParameter("value") });
				}}
				liveChange={(e: Input$LiveChangeEvent): void => {
					this.state.queryChanged = true;
					this.fireEvent("liveChange");
					if (!e.getSource().getValue() && !(this.$favoritePopover?.isOpen() ?? false)) {
						this.openSuggestionPopover();
					}
					if (e.getParameter("value") === "") {
						this.setPlaceholder(this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER"));
					}
				}}
				placeholder={this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")}
			></Input>
		);
		const favoritePopover = this.createFavoritePopover();
		this.$favoritePopover = favoritePopover;
		this.$searchInput.addDependent(favoritePopover);
		this.$searchInput.addEventDelegate({
			onkeyup: (e: KeyboardEvent) => {
				if (e.key === "Enter") {
					this.onEnterPressed();
				}
				if (this.$favoritePopover && this.$searchInput.getValue()) {
					this.$favoritePopover.close();
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				if (
					e.key === "Tab" &&
					this.$searchInput?.getValue().length === 0 &&
					this.$searchInput?.getValue() !== this.$searchInput?.getPlaceholder() &&
					this.$searchInput?.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")
				) {
					e.preventDefault();
					this.$searchInput?.setValue(this.$searchInput?.getPlaceholder());
					this.fireEvent("liveChange");
				}
			},
			ontap: () => {
				this.openSuggestionPopover();
			},
			onfocusin: () => {
				this.openSuggestionPopover();
			}
		});
	}

	private openSuggestionPopover(): void {
		if (!this.$searchInput?.getValue() && (!this.$favoritePopover || !this.$favoritePopover?.isOpen())) {
			// Open the easy filter popover
			this.state.isHistoryEnabled = this.shellHistoryProvider?.isHistoryEnabled() ?? false;
			this.state.favoriteQueries = this.shellHistoryProvider?.getFavoriteQueries() ?? [];
			this.state.recentQueries = (this.shellHistoryProvider?.getRecentQueries() ?? []).map((query) => query);
			this.$favoritePopover?.openBy(this.$searchInput);
		}
	}

	requestFavorite(e: Button$PressEvent): void {
		this.$favoritePopover?.close();
		this.$searchInput?.setValue(e.getSource().getText());
		this.onEnterPressed();
	}

	onEnterPressed(): void {
		this.$favoritePopover?.close();
		this.state.queryChanged = false;
		let magicQuery = this.$searchInput?.getValue();
		if (magicQuery === "" && this.$searchInput.getPlaceholder() !== this.resourceBundle.getText("M_EASY_FILTER_PLACEHOLDER")) {
			magicQuery = this.$searchInput.getPlaceholder();
			this.$searchInput?.setValue(magicQuery);
		}
		this.$searchInput?.setValueStateText("");
		this.$searchInput?.setValueState("None");
		this.fireEvent("enterPressed", { query: magicQuery });
	}

	addRecentQuery(queryString: string | undefined): void {
		// Normalize backslashes before storing
		queryString = queryString?.replace(/\\/g, "\\\\");

		const recentQueryIndex = this.state.recentQueries.findIndex((query) => query.toLowerCase() === queryString?.toLowerCase());
		if (queryString && recentQueryIndex === -1) {
			this.state.recentQueries = [queryString].concat(this.state.recentQueries);
			if (this.state.recentQueries.length > 5) {
				this.state.recentQueries = this.state.recentQueries.slice(0, 5);
			}
		} else if (queryString) {
			const recentQueries = this.state.recentQueries.filter((query) => query.toLowerCase() !== queryString?.toLowerCase());
			recentQueries.unshift(queryString);
			this.state.recentQueries = recentQueries;
		}
	}

	onStateChange(changedProps: string[] = []): void {
		if (changedProps.includes("favoriteQueries") || changedProps.includes("recentQueries")) {
			this.shellHistoryProvider?.setFavoriteQueries(this.state.favoriteQueries);
			this.shellHistoryProvider?.setRecentQueries(this.state.recentQueries.map((query) => query));
			this.state.recentQueriesWitFavorites = this.state.recentQueries.map((recentQuery) => {
				return {
					text: recentQuery,
					isFavorite: !!this.state.favoriteQueries.find((favoriteQuery) => favoriteQuery === recentQuery)
				};
			});
		}
	}

	async initShellHistoryProvider(): Promise<void> {
		try {
			this.shellHistoryProvider = await ShellHistoryProvider.getInstance(this.appId ?? "<unknownApp>");
		} catch (error) {
			Log.error("Error while creating ShellHistoryProvider for easy filter", error as string);
		}
	}

	createFavoritePopover(): Popover {
		return (
			<Popover
				id={this.getId() + "-favoritePopover"}
				showHeader={false}
				horizontalScrolling={false}
				placement={PlacementType.Bottom}
				showArrow={false}
				initialFocus={this.$searchInput}
				class={"sapFEControlsPopover"}
				visible={this.state.recommendedQueries.length > 0 || equal(bindState(this.state, "isHistoryEnabled"), true)}
			>
				{{
					content: (
						<FlexBox direction={FlexDirection.Column} class={"sapUiContentPadding"} renderType={"Bare"}>
							{{
								items: [
									<Title
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_SUGGESTIONS_TITLE")}
										class={"sapFeControlsTitleBorder"}
										visible={this.state.recommendedQueries.length > 0}
									/>,
									<HBox
										class={"sapUiContentPadding"}
										items={bindState(this.state, "recommendedQueries")}
										wrap={FlexWrap.Wrap}
										visible={this.state.recommendedQueries.length > 0}
									>
										{{
											items: (id: string, ctx: Context): StandardListItem => {
												return (
													<Button
														class={"sapUiTinyMarginEnd"}
														text={ctx.getObject()}
														press={this.requestFavorite.bind(this)}
													/>
												);
											}
										}}
									</HBox>,
									<Title
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_FAVORITE_TITLE")}
										class={"sapFeControlsTitleBorder"}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									/>,
									<List
										items={bindState(this.state, "favoriteQueries")}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									>
										{{
											noData: (
												<IllustratedMessage
													title={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_TITLE")}
													illustrationSize={IllustratedMessageSize.ExtraSmall}
													illustrationType={IllustratedMessageType.NoEntries}
													description={this.resourceBundle.getText(
														"M_EASY_FILTER_POPOVER_EMPTY_FAVORITE_DESCRIPTION"
													)}
												/>
											),
											items: (id: string, ctx: Context): StandardListItem => {
												return (
													<CustomListItem
														class={"sapUiSmallMarginBegin"}
														customData={[<CustomData key={"text"} value={ctx.getObject()} />]}
														press={(): void => {
															this.$searchInput.setValue(ctx.getObject());
															this.onEnterPressed();
														}}
													>
														<FlexBox
															width={"100%"}
															direction={FlexDirection.Row}
															alignItems={FlexAlignItems.Center}
															justifyContent={FlexJustifyContent.SpaceBetween}
															renderType={"Bare"}
															id={id}
														>
															<Text
																text={ctx.getObject()}
																tooltip={ctx.getObject()}
																wrapping={false}
																class="sapFEControlsPointer"
															>
																{{
																	dependents: (
																		<EventDelegateHook
																			tap={(): void => {
																				this.$searchInput?.setValue(
																					ctx.getObject().replace(/\\\\/g, "\\")
																				);
																				this.onEnterPressed();
																			}}
																		/>
																	)
																}}
															</Text>
															<Button
																icon={"sap-icon://favorite"}
																tooltip={this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR")}
																type={ButtonType.Transparent}
																press={(): void => {
																	//Retaining the focus on popover doesn't make the popover close on every interaction
																	this.$favoritePopover?.focus();
																	const queryString = ctx.getObject();
																	const index = this.state.favoriteQueries.indexOf(queryString);
																	if (index !== -1) {
																		this.state.favoriteQueries = this.state.favoriteQueries.filter(
																			(query) => query !== queryString
																		);
																	}
																}}
															/>
														</FlexBox>
													</CustomListItem>
												);
											}
										}}
									</List>,
									<Title
										titleStyle={TitleLevel.H6}
										text={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_LAST_USED")}
										class={"sapFeControlsTitleBorder"}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
									/>,
									<List
										items={bindState(this.state, "recentQueriesWitFavorites")}
										visible={equal(bindState(this.state, "isHistoryEnabled"), true)}
										mode={ListMode.Delete}
										delete={(e: ListBase$DeleteEvent): void => {
											//Retaining the focus on popover doesn't make the popover close on every interaction
											this.$favoritePopover?.focus();
											let queryString = e.getParameter("listItem")?.data("text");

											if (!queryString) return;
											// Normalize backslashes before comparing
											queryString = queryString?.replace(/\\/g, "\\\\");

											this.state.recentQueries = this.state.recentQueries.filter((query) => query !== queryString);
										}}
									>
										{{
											noData: (
												<IllustratedMessage
													title={this.resourceBundle.getText("M_EASY_FILTER_POPOVER_EMPTY_LAST_USED_TITLE")}
													illustrationSize={IllustratedMessageSize.ExtraSmall}
													illustrationType={IllustratedMessageType.NoEntries}
													description={this.resourceBundle.getText(
														"M_EASY_FILTER_POPOVER_EMPTY_RECENT_DESCRIPTION"
													)}
												/>
											),
											items: (id: string, ctx: Context): FlexBox => {
												return (
													<CustomListItem
														press={(): void => {
															this.$searchInput?.setValue(ctx.getObject().text);
															this.onEnterPressed();
														}}
														class={"sapUiSmallMarginBegin"}
														customData={[<CustomData key={"text"} value={ctx.getObject().text} />]}
													>
														<FlexBox
															width={"100%"}
															direction={FlexDirection.Row}
															alignItems={FlexAlignItems.Center}
															justifyContent={FlexJustifyContent.SpaceBetween}
															renderType={"Bare"}
															id={id}
														>
															<Text
																text={ctx.getObject().text}
																tooltip={ctx.getObject().text}
																wrapping={false}
																class="sapFEControlsPointer"
															>
																{{
																	dependents: (
																		<EventDelegateHook
																			tap={(): void => {
																				this.$searchInput?.setValue(
																					ctx.getObject().text.replace(/\\\\/g, "\\")
																				);
																				this.onEnterPressed();
																			}}
																		/>
																	)
																}}
															</Text>
															<Button
																icon={
																	ctx.getObject().isFavorite
																		? "sap-icon://favorite"
																		: "sap-icon://add-favorite"
																}
																tooltip={
																	ctx.getObject().isFavorite
																		? this.resourceBundle.getText("M_EASY_FILTER_FILLED_STAR")
																		: this.resourceBundle.getText("M_EASY_FILTER_EMPTY_START")
																}
																enabled={lessThan(
																	length(
																		bindState(
																			this.state,
																			"favoriteQueries"
																		) as PathInModelExpression<unknown>
																	),
																	5
																)}
																type={ButtonType.Transparent}
																press={(): void => {
																	//Retaining the focus on popover doesn't make the popover close on every interaction
																	this.$favoritePopover?.focus();
																	const queryString = ctx.getObject().text;
																	const isFavorite = ctx.getObject().isFavorite;

																	if (isFavorite) {
																		this.removeFromFavorites(queryString);
																	} else {
																		this.addToFavorites(queryString);
																	}
																}}
															/>
														</FlexBox>
													</CustomListItem>
												);
											}
										}}
									</List>
								]
							}}
						</FlexBox>
					)
				}}
			</Popover>
		) as Popover;
	}

	private removeFromFavorites(query: string): void {
		this.state.favoriteQueries = this.state.favoriteQueries.filter((data) => data.toLowerCase() !== query.toLowerCase());
	}

	private addToFavorites(query: string): void {
		const newFavorite = [query].concat(this.state.favoriteQueries.concat());
		if (newFavorite.length > 5) {
			newFavorite.pop();
		}
		this.state.favoriteQueries = newFavorite;
	}

	static render(rm: RenderManager, control: EasyFilterInput): void {
		return jsx.renderUsingRenderManager(rm, control, () => {
			return (
				<span ref={control} class={"sapFEEasyFilterInput"}>
					{control.$searchInput}
				</span>
			);
		});
	}
}
