import Log from "sap/base/Log";
import encodeURL from "sap/base/security/encodeURL";
import { defineUI5Class } from "sap/fe/base/ClassSupport";
import ManagedObject from "sap/ui/base/ManagedObject";
import IconPool from "sap/ui/core/IconPool";
import Lib from "sap/ui/core/Lib";
import Theming from "sap/ui/core/Theming";
import type Container from "sap/ushell/Container";
import type Extension from "sap/ushell/services/Extension";

/**
 * Provides a dialog to explain the shortcuts to the user.
 * This dialog will be registered in the shell user menu and will open as an independent window.
 * @experimental
 */
@defineUI5Class("sap.fe.controls.shortcuts.ShortcutExplanationProvider")
export default class ShortcutExplanationProvider extends ManagedObject {
	private _popupIdx = 0;

	getShellDialogContent(): void {
		// Position to top right of the main window if possible
		const windowWidth = 620;
		let left = window.screenLeft + window.outerWidth;
		if (left + windowWidth > window.screen.availWidth) {
			left = window.screen.availWidth - windowWidth;
		}
		const theme = Theming.getTheme();
		const url = sap.ui.require.toUrl("sap/fe/controls/shortcuts/popup/index.html");
		const localOrigin = window.location.protocol + "//" + window.location.host;
		// We pass the theme and the origin to the popup so that it can communicate safely with the parent
		const params = "?sap-ui-xx-shortcut-origin=" + encodeURL(localOrigin) + "&sap-ui-theme=" + theme;
		const myWin = window.open(
			url + params,
			"_blank",
			`popup,toolbar=no,menubar=no,scrollbars=no,location=no,width=${windowWidth},height=550,top=${window.screenTop},left=${left}`
		);
		if (myWin) {
			const handleMessageReceived = (messageEvent: MessageEvent): void => {
				if (localOrigin === messageEvent.origin) {
					const messageData = messageEvent?.data;
					if (messageData.service === "sap.ui.interaction.MessagePortReady") {
						const messagePort = messageEvent.ports[0]; // Remember the port
						myWin.postMessage({ service: "sap.ui.interaction.MessagePortReady" }, url.startsWith("/") ? localOrigin : url, [
							messagePort
						]);
						window.removeEventListener("message", handleMessageReceived);
					}
				}
			};
			try {
				myWin.opener = null;
			} catch (e) {
				// This might fail when there is CORS involved anyway and we can't access the opener anyway
				Log.debug("Cannot set opener to null", e instanceof Error ? e.message : String(e));
			}

			setTimeout((): void => {
				window.addEventListener("message", handleMessageReceived);
				window.postMessage(
					{ id: "sap.fe.interaction.Popup" + this._popupIdx++, service: "sap.ui.interaction.RequestMessagePort" },
					localOrigin
				);
			}, 1500); // give a bit of time for the popup to be ready
			// We can't rely on the onload of the popup because it is not always availble in CORS scenarios
			window.onunload = function (): void {
				myWin.close();
			};
		}
	}

	static instancePromise: Promise<ShortcutExplanationProvider | undefined>;

	static instance: ShortcutExplanationProvider | undefined;

	static isDialogAdded = false;

	/**
	 * Creates or returns the instance of the ShortcutExplanationProvider.
	 * This is a singleton to ensure we only have one instance of the dialog.
	 * @returns The instance of the ShortcutExplanationProvider
	 */
	static async getInstance(): Promise<ShortcutExplanationProvider | undefined> {
		// Test the shell existence and register the extension
		const shellContainer = sap.ui.require("sap/ushell/Container") as Container | undefined;
		let resolveCreation: Function | undefined;
		try {
			if (shellContainer && !this.instance) {
				this.instancePromise = new Promise<ShortcutExplanationProvider | undefined>((resolve) => {
					resolveCreation = resolve;
				});
				const extensionService = (await shellContainer.getServiceAsync("Extension")) as Extension | undefined;
				if (extensionService) {
					const shellHistoryProvider = await ShortcutExplanationProvider.registerUserAction(extensionService);
					this.instance = shellHistoryProvider;
					resolveCreation!(shellHistoryProvider);
				}
			}
		} catch (e) {
			Log.error("Cannot register extension", e instanceof Error ? e.message : String(e));
			resolveCreation?.(undefined);
		}
		return this.instancePromise;
	}

	/**
	 * Adds the user action to the shell, the action will open the dialog with the shortcuts.
	 * @param shellExtensionService The extension service to add the user action to the shell
	 * @returns The dialog with the shortcuts
	 */
	static async registerUserAction(shellExtensionService: Extension): Promise<ShortcutExplanationProvider | undefined> {
		try {
			const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;

			const shellHistoryDialog = new ShortcutExplanationProvider();
			if (!this.isDialogAdded) {
				this.isDialogAdded = true;
				const userAction = await shellExtensionService.createUserAction(
					{
						id: "sapui5.shortcut.explanation.trigger",
						text: resourceBundle.getText("C_SHORTCUT_TITLE"),
						icon: IconPool.getIconURI("keyboard-and-mouse"),
						press: (): void => {
							shellHistoryDialog.getShellDialogContent();
						}
					},
					{
						controlType: "sap.m.Button"
					}
				);
				userAction.showForAllApps();
			}
			return shellHistoryDialog;
		} catch (err) {
			Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
		}
	}
}
