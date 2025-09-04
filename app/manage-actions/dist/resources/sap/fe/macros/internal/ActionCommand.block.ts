import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { blockAttribute, blockEvent, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import type { TemplateProcessorSettings } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import type { BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import { getCommandExecutionForAction } from "sap/fe/macros/ActionCommand";
import { type CommandExecution$ExecuteEvent } from "sap/ui/core/CommandExecution";

/**
 * Content of an action command
 * @private
 * @experimental
 */
@defineBuildingBlock({
	name: "ActionCommand",
	namespace: "sap.fe.macros.internal"
})
export default class ActionCommandBlock extends BuildingBlockTemplatingBase {
	@blockAttribute({ type: "string", required: true })
	public id!: string;

	@blockAttribute({ type: "object", required: true })
	public action!: BaseAction;

	@blockAttribute({ type: "boolean" })
	public isActionEnabled?: boolean;

	@blockAttribute({ type: "boolean" })
	public isIBNEnabled?: boolean;

	@blockAttribute({ type: "boolean" })
	public isEnabled?: boolean;

	@blockAttribute({ type: "boolean" })
	public visible?: boolean;

	@blockAttribute({ type: "string" })
	public command?: string;

	@blockEvent()
	onExecuteAction?: string;

	@blockEvent()
	onExecuteIBN?: string;

	@blockEvent()
	onExecuteManifest?: string;

	constructor(props: PropertiesOf<ActionCommandBlock>, _controlConfiguration?: unknown, _visitorSettings?: TemplateProcessorSettings) {
		super(props, _controlConfiguration, _visitorSettings);
	}

	/**
	 * The building block template function.
	 * @returns An XML-based string
	 */
	getTemplate(): string {
		return getCommandExecutionForAction(this.command, this.action, {
			visible: this.visible,
			onExecuteAction: this.onExecuteAction as unknown as (event: CommandExecution$ExecuteEvent) => void,
			onExecuteIBN: this.onExecuteIBN as unknown as (event: CommandExecution$ExecuteEvent) => void,
			onExecuteManifest: this.onExecuteManifest as unknown as (event: CommandExecution$ExecuteEvent) => void,
			isActionEnabled: this.isActionEnabled,
			isIBNEnabled: this.isIBNEnabled,
			isEnabled: this.isEnabled
		}) as unknown as string;
	}
}
