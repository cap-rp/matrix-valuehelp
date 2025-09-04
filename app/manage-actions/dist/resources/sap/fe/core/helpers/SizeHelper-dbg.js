/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/ui/core/StaticArea", "sap/ui/core/UIArea", "sap/ui/dom/units/Rem"], function (Button, StaticArea, UIArea, Rem) {
  "use strict";

  const SizeHelper = {
    calls: 0,
    hiddenButton: undefined,
    /**
     * Creates a hidden button and places it in the static area.
     */
    init: function () {
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
    getButtonWidth: function (text) {
      if (!text || !this.hiddenButton) {
        return 0;
      }
      this.hiddenButton.setVisible(true);
      this.hiddenButton.setText(text);
      UIArea.rerenderControl(this.hiddenButton);
      const buttonWidth = Rem.fromPx(this.hiddenButton.getDomRef()?.scrollWidth);
      this.hiddenButton.setVisible(false);
      return Math.round(buttonWidth * 100) / 100;
    },
    /**
     * Deletes the hidden button if not needed anymore.
     */
    exit: function () {
      this.calls--;
      if (this.calls === 0) {
        this.hiddenButton?.destroy();
        this.hiddenButton = undefined;
      }
    }
  };
  return SizeHelper;
}, false);
//# sourceMappingURL=SizeHelper-dbg.js.map
