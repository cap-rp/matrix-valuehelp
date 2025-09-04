import Button from "sap/m/Button";
import type Control from "sap/ui/core/Control";
import StaticArea from "sap/ui/core/StaticArea";
import UIArea from "sap/ui/core/UIArea";
import Rem from "sap/ui/dom/units/Rem";

const SizeHelper = {
	calls: 0,
	hiddenButton: undefined as undefined | Button,

	/**
	 * Creates a hidden button and places it in the static area.
	 */
	init: function (): void {
		// Create a new button in static area
		this.calls++;
		this.hiddenButton = this.hiddenButton ? this.hiddenButton : new Button().placeAt(StaticArea.getDomRef());
		// Hide button from accessibility tree
		this.hiddenButton.setVisible(false);
	},
	/**
	 * Method to calculate the width of the button from a temporarily created button placed in the static area.
	 * @param text The text to measure inside the Button.
	 * @returns The value of the Button width.
	 */
	getButtonWidth: function (text?: string): number {
		if (!text || !this.hiddenButton) {
			return 0;
		}

		this.hiddenButton.setVisible(true);
		this.hiddenButton.setText(text);
		(UIArea as unknown as { rerenderControl(control: Control): void }).rerenderControl(this.hiddenButton);

		const buttonWidth = Rem.fromPx(this.hiddenButton.getDomRef()?.scrollWidth);
		this.hiddenButton.setVisible(false);
		return Math.round(buttonWidth * 100) / 100;
	},

	/**
	 * Deletes the hidden button if not needed anymore.
	 */
	exit: function (): void {
		this.calls--;
		if (this.calls === 0) {
			this.hiddenButton?.destroy();
			this.hiddenButton = undefined;
		}
	}
};

export default SizeHelper;
