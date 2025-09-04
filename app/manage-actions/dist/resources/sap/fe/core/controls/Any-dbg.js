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
  const Any = Element.extend("sap.fe.core.controls.Any", {
    metadata: {
      properties: {
        any: "any",
        bindBackProperty: "string",
        anyText: "string",
        anyBoolean: "boolean"
      }
    },
    updateProperty: function (name) {
      // Avoid Promise processing in ManagedObject and set Promise as value directly
      const newValue = this.getBindingInfo(name).binding.getExternalValue();
      if (name === "any") {
        this.setAny(newValue);
        const bindingContext = this.getBindingContext();
        if (this.getBindBackProperty() && bindingContext) {
          const localAnnotationModel = this.getModel().getLocalAnnotationModel();
          const path = bindingContext.getPath(this.getBindBackProperty());
          if (localAnnotationModel.getProperty(path) !== newValue) {
            localAnnotationModel.setProperty(path, newValue);
          }
        }
      } else {
        this.setAnyText(newValue);
      }
    }
  });
  return Any;
}, false);
//# sourceMappingURL=Any-dbg.js.map
