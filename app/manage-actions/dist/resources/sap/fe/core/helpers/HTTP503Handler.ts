import type ResourceModel from "sap/fe/core/ResourceModel";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import Button from "sap/m/Button";
import Dialog, { type $DialogSettings } from "sap/m/Dialog";
import ProgressIndicator from "sap/m/ProgressIndicator";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import type Control from "sap/ui/core/Control";

const handler = {
	/**
	 * Creates a dialog from settings (exported for test purposes).
	 * @param settings
	 * @returns The dialog
	 */
	createDialog(settings: $DialogSettings): Dialog {
		return new Dialog(settings);
	},

	/**
	 * Displays a busy indicator for a given amount of time.
	 * @param delayInMs
	 * @param rootControl
	 * @returns A promise that resolves after the given amount of time.
	 */
	async _handleDelayBusy(delayInMs: number, rootControl: Control): Promise<undefined> {
		BusyLocker.lock(rootControl);
		return new Promise<undefined>((resolve) => {
			setTimeout(() => {
				BusyLocker.unlock(rootControl);
				resolve(undefined);
			}, delayInMs);
		});
	},

	/**
	 * Displays a dialog with a progress bar and a text for a given amount of time.
	 * @param delayInMs
	 * @param error
	 * @param error.retryAfter
	 * @param resourceModel
	 * @returns A promise that resolves after the given amount of time, or rejected if the user clicks Cancel.
	 */
	async _handleDelayProgressBar(
		delayInMs: number,
		error: Error & { retryAfter?: Date },
		resourceModel: ResourceModel
	): Promise<undefined> {
		const promiseKeeper = new PromiseKeeper<undefined>();
		const dialogTextRemaining = new Text();
		const dialogProgress = new ProgressIndicator({ displayOnly: true, percentValue: 0, showValue: false });

		const content = new VBox({ items: [new Text({ text: resourceModel.getText("C_MESSAGE_HANDLING_SAPFE_503_TITLE") })] });
		if (error.message) {
			content.addItem(new Text({ text: error.message.replaceAll(/[\n\r]/g, " ") }));
		}
		content.addItem(dialogTextRemaining);
		content.addItem(dialogProgress);

		function updateContent(): boolean {
			const remainingTime = error.retryAfter!.getTime() - Date.now();
			if (remainingTime <= 0) {
				return false;
			} else {
				const progress = 100 - (remainingTime / delayInMs) * 100;
				dialogProgress.setPercentValue(progress);
				const remainingInSeconds = Math.ceil(remainingTime / 1000);
				const remainingMinutes = Math.floor(remainingInSeconds / 60);
				const remainingSeconds = remainingInSeconds % 60;
				if (remainingMinutes > 0) {
					dialogTextRemaining.setText(
						resourceModel.getText("C_UNAVAILABLE_SERVER_MESSAGE_MINUTES_SECONDS", [remainingMinutes, remainingSeconds])
					);
				} else {
					dialogTextRemaining.setText(resourceModel.getText("C_UNAVAILABLE_SERVER_MESSAGE_SECONDS", [remainingSeconds]));
				}

				return true;
			}
		}

		const progressAnimationTimer = setInterval(() => {
			if (!updateContent()) {
				clearInterval(progressAnimationTimer);
				dialog.close();
				promiseKeeper.resolve(undefined);
			}
		}, 100);

		const onCancel = (): void => {
			clearInterval(progressAnimationTimer);
			dialog.close();
			delete error.retryAfter; // We can ignore the expected date, as it was already displayed in the progress dialog
			promiseKeeper.reject(error);
		};

		const dialog = this.createDialog({
			type: "Message",
			title: resourceModel.getText("WARNING"),
			content: [content],
			endButton: new Button({ text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"), press: onCancel }),
			state: "Warning"
		});
		updateContent();
		dialog.open();

		return promiseKeeper.promise;
	},

	/**
	 * Handles an HTTP 503 error with a delay.
	 * @param error
	 * @param error.retryAfter
	 * @param rootControl
	 * @param resourceModel
	 * @returns A promise that resolves after the delay, or rejected if the user clicks Cancel.
	 */
	async handle503Delay(error: Error & { retryAfter?: Date }, rootControl: Control, resourceModel: ResourceModel): Promise<undefined> {
		if (error.retryAfter === undefined) {
			// No retry-after parameter -> rethrow error
			return Promise.reject(error);
		}

		const delayInMs = error.retryAfter.getTime() - Date.now();
		if (delayInMs < 5000) {
			// Less than 5 seconds -> show busy indicator
			return this._handleDelayBusy(delayInMs, rootControl);
		} else if (delayInMs < 600000) {
			// Between 5s and 10min -> show progress bar
			return this._handleDelayProgressBar(delayInMs, error as Error & { retryAfter: Date }, resourceModel);
		} else {
			// More than 10 minutes or undefined --> standard error
			return Promise.reject(error);
		}
	}
};

export default handler;
