import type { Action, PrimitiveType } from "@sap-ux/vocabularies-types";
import type AppComponent from "sap/fe/core/AppComponent";
import type Dialog from "sap/m/Dialog";
import type Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type Message from "sap/ui/core/message/Message";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { FEView } from "./BaseController";
import type MessageHandler from "./controllerextensions/MessageHandler";

export type ExitDialogEvent = Event<{
	accept: boolean;
}>;

export interface StandardDialog {
	openDialog(): void;
	closeDialog(): void;
	setBusy(busy: boolean): void;
	attachExitDialog(data: object, handler: (e: ExitDialogEvent) => void, listener?: object): void;
	isOpen(): boolean;
	displayErrorMessages(messages: Message[]): void;
}

export interface StandardOperationParameterDialog {
	createDialog(): Promise<Dialog>;
	openDialog(): Promise<void>;
	closeDialog(): void;
	waitForParametersValues(): Promise<Record<string, PrimitiveType>>;
	getDialog(): Dialog | undefined;
	isOpen(): boolean;
	resetState(): void;
}

export interface CoreUIFactory {
	newCreateDialog(
		contextToUpdate: ODataV4Context,
		fieldNames: string[],
		appComponent: AppComponent,
		mode: "Standalone" | "WithNavigation",
		parentControl?: Control
	): StandardDialog;
	newOperationParameterDialog(
		action: Action,
		parameters: {
			appComponent: AppComponent;
			contexts: ODataV4Context[];
			parametersValues: Record<string, PrimitiveType>;
			defaultValuesExtensionFunction: string | undefined;
			isCreateAction?: boolean;
			label?: string;
			model: ODataModel;
			view?: FEView;
			events?: {
				onParameterDialogOpened?: () => void;
				onParameterDialogClosed?: () => void;
			};
		},
		parameterValues: Record<string, unknown>[] | undefined,
		entitySetName: string | undefined,
		messageHandler: MessageHandler
	): StandardOperationParameterDialog;
}

let currentFactory: CoreUIFactory | undefined;

export function getCoreUIFactory(): CoreUIFactory {
	if (currentFactory === undefined) {
		throw new Error("sap.fe.core UI provider not defined");
	}

	return currentFactory;
}

export function setCoreUIFactory(provider?: CoreUIFactory): void {
	currentFactory = provider;
}
