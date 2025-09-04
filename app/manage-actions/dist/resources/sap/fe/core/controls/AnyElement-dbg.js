/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Element"], function (Element) {
  "use strict";

  /**
   * A custom element to evaluate the value of Binding.
   * @hideconstructor
   */
  const AnyElement = Element.extend("sap.fe.core.controls.AnyElement", {
    metadata: {
      properties: {
        anyText: "string"
      }
    },
    updateProperty: function (sName) {
      // Avoid Promise processing in Element and set Promise as value directly
      if (sName === "anyText") {
        this.setAnyText(this.getBindingInfo(sName).binding.getExternalValue());
      }
    }
  });
  return AnyElement;
}, false);
//# sourceMappingURL=AnyElement-dbg.js.map
