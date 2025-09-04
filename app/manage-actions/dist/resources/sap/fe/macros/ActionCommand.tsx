import { resolveBindingString, type BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import { type BaseAction } from "sap/fe/core/converters/controls/Common/Action";
import { type CommandExecution$ExecuteEvent } from "sap/ui/core/CommandExecution";

type CommandExecutionParameters = {
	visible?: boolean;
	onExecuteAction?: (event: CommandExecution$ExecuteEvent) => void;
	onExecuteIBN?: (event: CommandExecution$ExecuteEvent) => void;
	onExecuteManifest?: (event: CommandExecution$ExecuteEvent) => void;
	isActionEnabled?: boolean | string;
	isIBNEnabled?: boolean | string;
	isEnabled?: boolean | string;
};

export function getCommandExecutionForAction(
	commandName: string | undefined,
	action: BaseAction,
	parameters: CommandExecutionParameters
): CommandExecution {
	let executeFunction: (event: CommandExecution$ExecuteEvent) => void;
	let isEnabled: boolean | BindingToolkitExpression<boolean> | undefined;
	const actionVisible = action.visible ? resolveBindingString<boolean>(action.visible, "boolean") : undefined;
	const actionEnabled = action.enabled ? resolveBindingString<boolean>(action.enabled, "boolean") : undefined;
	switch (action.type) {
		case "ForAction":
			executeFunction = parameters.onExecuteAction!;
			isEnabled =
				parameters.isActionEnabled !== undefined
					? resolveBindingString<boolean>(parameters.isActionEnabled, "boolean")
					: actionEnabled;
			break;
		case "ForNavigation":
			executeFunction = parameters.onExecuteIBN!;
			isEnabled =
				parameters.isIBNEnabled !== undefined ? resolveBindingString<boolean>(parameters.isIBNEnabled, "boolean") : actionEnabled;
			break;
		default:
			executeFunction = parameters.onExecuteManifest!;
			isEnabled = parameters.isEnabled !== undefined ? resolveBindingString<boolean>(parameters.isEnabled, "boolean") : actionEnabled;
	}

	return (
		<CommandExecution
			core:require="{FPM: 'sap/fe/core/helpers/FPMHelper'}"
			execute={executeFunction}
			enabled={isEnabled}
			visible={parameters.visible ?? actionVisible}
			command={commandName ?? action.command!}
		/>
	);
}
