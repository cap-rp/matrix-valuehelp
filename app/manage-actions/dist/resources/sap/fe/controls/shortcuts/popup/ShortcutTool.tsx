import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import BuildingBlockBase from "sap/fe/base/BuildingBlockBase";
import { defineReference, defineUI5Class } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import CustomTreeItem from "sap/m/CustomTreeItem";
import FlexBox from "sap/m/FlexBox";
import FormattedText from "sap/m/FormattedText";
import Label from "sap/m/Label";
import Panel from "sap/m/Panel";
import type { SearchField$SearchEvent } from "sap/m/SearchField";
import SearchField from "sap/m/SearchField";
import Tree from "sap/m/Tree";
import type Control from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import type Context from "sap/ui/model/Context";

type NamedKeyboardInteraction = {
	name: string;
	description?: string;
	kbd: string[];
};
type DocKeyboardInteraction = {
	description: string;
	kbd: string[];
};

type RefKeyboardInteraction = {
	$ref: string;
};
type KeyboardElements = {
	class: string;
	id: string;
	label: string;
	interactions: (NamedKeyboardInteraction | RefKeyboardInteraction)[];
};
type ShortcutElement = { label: string; shortcutKeys: string[] };

function getDocsDetail(docsPath: string, data: object): DocKeyboardInteraction[] | undefined {
	const spltiPath = docsPath.split("/");
	let result = data;
	spltiPath.forEach((path) => {
		result = result[path as keyof typeof result];
	});
	return result as DocKeyboardInteraction[] | undefined;
}

function collapseDuplicate(
	elements: { label: string; nodes: ShortcutElement[] }[],
	filterQuery: string
): { label: string; nodes: ShortcutElement[] }[] {
	const map: Record<string, ShortcutElement[]> = {};
	elements.forEach((element) => {
		if (!map[element.label]) {
			map[element.label] = [];
		}
		element.nodes
			.filter((node) => {
				return node.label.toLowerCase().includes(filterQuery.toLowerCase());
			})
			.forEach((node) => {
				if (!map[element.label].some((existingNode) => existingNode.label === node.label)) {
					map[element.label].push(node);
				}
			});
	});
	return Object.entries(map).map(([label, nodes]) => ({ label, nodes }));
}

function mapKeyToSymbol(key: string): string {
	switch (key.trim()) {
		case "ArrowDown":
			return "↓";
		case "ArrowUp":
			return "↑";
		case "ArrowLeft":
			return "←";
		case "ArrowRight":
			return "→";
		default:
			return key;
	}
}

type ShortcutToolState = {
	shortcutsTree: { label: string; nodes: ShortcutElement[] }[];
	originalTree: { label: string; nodes: ShortcutElement[] }[];
	initialFocus: boolean;
};
@defineUI5Class("sap.fe.controls.shortcuts.popup.ShortcutTool")
export default class ShortcutTool extends BuildingBlockBase<Panel, ShortcutToolState> {
	private resourceBundle: ResourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;

	@defineReference()
	$searchField!: Ref<SearchField>;

	@defineReference()
	$tree!: Ref<Tree>;

	constructor() {
		super();
		this.state.shortcutsTree = [];
		this.state.originalTree = [];

		this.content = this.createContent();
		this.state.initialFocus = true;
		this.$searchField.current?.addEventDelegate({
			onAfterRendering: (): void => {
				if (this.state.initialFocus) {
					this.$searchField.current?.focus();
					this.state.initialFocus = false;
				}
			}
		});

		if ((window as { messagePort?: MessagePort }).messagePort) {
			this.setupPort((window as { messagePort?: MessagePort }).messagePort!);
		}
	}

	setupPort(messagePort: MessagePort): void {
		messagePort.onmessage = this.onMessageReceived.bind(this);
		messagePort.postMessage({ service: "sap.ui.interaction.StartDisplay" });
	}

	onMessageReceived(e: MessageEvent): void {
		if (e?.data?.service === "sap.ui.interaction.UpdateDisplay") {
			const elements = e.data.payload.elements as KeyboardElements[];
			elements.reverse();
			this.state.originalTree = elements.map((element) => {
				const nodes: ShortcutElement[] = [];
				element.interactions.forEach((shortcut) => {
					if ((shortcut as RefKeyboardInteraction).$ref) {
						const interactions = getDocsDetail((shortcut as RefKeyboardInteraction).$ref, e.data.payload);
						interactions?.forEach((documentationInteraction) => {
							nodes.push({
								label: documentationInteraction.description,
								shortcutKeys: documentationInteraction.kbd
							});
						});
					} else {
						nodes.push({
							label: (shortcut as NamedKeyboardInteraction).description ?? (shortcut as NamedKeyboardInteraction).name,
							shortcutKeys: (shortcut as NamedKeyboardInteraction).kbd
						});
					}
				});
				return {
					label: element.label,
					nodes: nodes
				};
			});
		}
		this.state.shortcutsTree = collapseDuplicate(this.state.originalTree.concat(), "");
	}

	onStateChange(): void {
		this.$tree.current?.expandToLevel(1);
	}

	onSearch(_e: SearchField$SearchEvent): void {
		const query = _e.getParameter("query") ?? "";
		this.state.shortcutsTree = collapseDuplicate(
			this.state.originalTree
				.filter((element) => {
					const isTitleMatch = element.label.toLowerCase().includes(query.toLowerCase());
					const isNodeMatch = element.nodes.some((node) => node.label.toLowerCase().includes(query.toLowerCase()));
					return isTitleMatch || isNodeMatch;
				})
				.concat(),
			query
		);
	}

	createContent(): Panel {
		return (
			<Panel headerText={this.resourceBundle.getText("C_SHORTCUT_TITLE")} width="100%">
				{{
					content: [
						<SearchField
							ref={this.$searchField}
							placeholder={this.resourceBundle.getText("C_SHORTCUT_PLACEHOLDER")}
							search={(e): void => this.onSearch(e)}
						/>,
						<Tree
							ref={this.$tree}
							items={this.bindState("shortcutsTree")}
							noDataText={this.resourceBundle.getText("C_SHORTCUT_NODATA")}
						>
							<CustomTreeItem>
								<FlexBox alignItems={"Start"} width={"100%"} renderType={"Bare"} justifyContent={"SpaceBetween"}>
									<FormattedText htmlText={this.state.shortcutsTree.label} class={"sapFeControlsShorcutMFT"} />
									<FlexBox
										renderType={"Bare"}
										justifyContent={"SpaceBetween"}
										items={"{$componentState>shortcutKeys}"}
										direction={"Column"}
									>
										{{
											items: function (id: string, context: Context): Label {
												const shortcutKey = context.getObject();
												const shortcutKeys = shortcutKey.split("+");
												const elements: Control[] = [];
												shortcutKeys.forEach((key: string, idx: number) => {
													elements.push(
														<Label
															text={mapKeyToSymbol(key)}
															class={"sapUiTinyMarginEnd sapFeControlsShortcutKey"}
														/>
													);
													if (idx !== shortcutKeys.length - 1) {
														elements.push(<Label text={"+"} class={"sapUiTinyMarginEnd"} />);
													}
												});
												return (
													<FlexBox id={id} renderType={"Bare"} alignItems={"Center"}>
														{{ items: elements }}
													</FlexBox>
												);
											}
										}}
									</FlexBox>
								</FlexBox>
							</CustomTreeItem>
						</Tree>
					]
				}}
			</Panel>
		);
	}
}
