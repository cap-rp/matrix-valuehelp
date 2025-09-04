import type { EntityType } from "@sap-ux/vocabularies-types";
import type ResourceModel from "sap/fe/core/ResourceModel";
import { getTitleExpression } from "sap/fe/core/templating/EntityTypeHelper";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import Dialog from "sap/m/Dialog";
import HBox from "sap/m/HBox";
import List from "sap/m/List";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";
import type Context from "sap/ui/model/Context";

/**
 * Display a dialog to inform the user that some contexts are not applicable for the action.
 * This is not the target Ux but just keeping the current behavior
 */
export default class NotApplicableContextDialog {
	private readonly title: string;

	private resourceModel: ResourceModel;

	private readonly entityType: EntityType;

	private readonly _dialog: Dialog;

	private readonly _processingPromise: Promise<boolean>;

	private _fnResolve!: (resolveValue: boolean) => void;

	private _shouldContinue: boolean;

	private readonly actionName: string | undefined;

	private readonly entitySetName: string | undefined;

	private notApplicableContexts: Context[];

	constructor(props: {
		title: string;
		entityType: EntityType;
		resourceModel: ResourceModel;
		notApplicableContexts: Context[];
		entitySet?: string;
		actionName?: string;
	}) {
		this.title = props.title;
		this.resourceModel = props.resourceModel;
		this.entityType = props.entityType;
		this.notApplicableContexts = props.notApplicableContexts;
		this._shouldContinue = false;
		this.actionName = props.actionName;
		this.entitySetName = props.entitySet;
		this._dialog = this.createDialog();
		this._processingPromise = new Promise((resolve) => {
			this._fnResolve = resolve;
		});
	}

	private onAfterClose(): void {
		this._fnResolve(this._shouldContinue);
		this._dialog.destroy();
	}

	private onContinue(): void {
		this._shouldContinue = true;
		this._dialog.close();
	}

	async open(owner: Control): Promise<boolean> {
		owner.addDependent(this._dialog);
		this._dialog.open();
		return this._processingPromise;
	}

	getDialog(): Dialog {
		return this._dialog;
	}

	createDialog(): Dialog {
		let boundActionName = this.actionName;
		boundActionName = boundActionName?.includes(".")
			? boundActionName?.split(".")[boundActionName?.split(".").length - 1]
			: boundActionName;
		const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
		return (
			<Dialog
				state={"Warning"}
				showHeader={true}
				resizable={true}
				verticalScrolling={true}
				horizontalScrolling={true}
				class={"sapUiContentPadding"}
				title={this.getTitleText(this.title)}
				afterClose={this.onAfterClose.bind(this)}
			>
				{{
					beginButton: (
						<Button
							text={this.resourceModel.getText(
								"C_ACTION_PARTIAL_FRAGMENT_SAPFE_CONTINUE_ANYWAY",
								undefined,
								suffixResourceKey
							)}
							press={this.onContinue.bind(this)}
							type="Emphasized"
						/>
					),
					endButton: (
						<Button text={this.resourceModel.getText("C_COMMON_SAPFE_CLOSE")} press={(): Dialog => this._dialog.close()} />
					),
					content: (
						<>
							<VBox>
								<Text
									text={
										this.notApplicableContexts.length === 1
											? this.resourceModel.getText(
													"C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION",
													undefined,
													suffixResourceKey
											  )
											: this.resourceModel.getText(
													"C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION_PLURAL",
													[this.notApplicableContexts.length],
													suffixResourceKey
											  )
									}
									class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
								/>
							</VBox>
							<List headerText={this.entityType.annotations.UI?.HeaderInfo?.TypeNamePlural} showSeparators="None">
								{{
									items: this.notApplicableContexts.map((notApplicableContext) => {
										// Either show the HeaderInfoName or the Semantic Key property
										const titleExpression = getTitleExpression(this.entityType);
										const customListItem = (
											<CustomListItem>
												<HBox justifyContent={"Start"}>
													<Text text={titleExpression} class="sapUiTinyMarginBegin sapUiTinyMarginTopBottom" />
												</HBox>
											</CustomListItem>
										);
										customListItem.setBindingContext(notApplicableContext);
										return customListItem;
									})
								}}
							</List>
						</>
					)
				}}
			</Dialog>
		) as Dialog;
	}

	/**
	 * Gets the title of the dialog.
	 * @param actionLabel The label of the action
	 * @returns The title.
	 */
	private getTitleText(actionLabel: string | undefined): string {
		const key = "ACTION_PARAMETER_DIALOG_ACTION_TITLE";
		const defaultKey = "C_OPERATIONS_ACTION_PARAMETER_DIALOG_TITLE";
		return this.getOverriddenText(key, defaultKey, actionLabel);
	}

	/**
	 * Gets an overridden text.
	 * @param key The key for an overridden text
	 * @param defaultKey The default key for the text
	 * @param actionLabel The label of the action
	 * @returns The overridden text or label.
	 */
	private getOverriddenText(key: string, defaultKey: string, actionLabel?: string): string {
		let boundActionName = this.actionName;
		boundActionName = boundActionName?.split(".").pop() ?? boundActionName;
		const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
		if (actionLabel) {
			if (this.resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`)) {
				return this.resourceModel.getText(key, undefined, suffixResourceKey);
			} else if (this.resourceModel.checkIfResourceKeyExists(`${key}|${this.entitySetName}`)) {
				return this.resourceModel.getText(key, undefined, `${this.entitySetName}`);
			} else if (this.resourceModel.checkIfResourceKeyExists(`${key}`)) {
				return this.resourceModel.getText(key);
			} else {
				return actionLabel;
			}
		} else {
			return this.resourceModel.getText(defaultKey);
		}
	}
}
