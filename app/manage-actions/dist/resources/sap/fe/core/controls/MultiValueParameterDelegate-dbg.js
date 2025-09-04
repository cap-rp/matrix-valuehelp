/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/mdc/field/MultiValueFieldDelegate"], function (MultiValueFieldDelegate) {
  "use strict";

  // This is a special case as it only will happen when using the action parameter dialog so at a point where the MDC library will have been loaded anyway
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  const oMultiValueFieldDelegate = Object.assign({}, MultiValueFieldDelegate, {
    _transformConditions: function (aConditions, sKeyPath, sDescriptionPath) {
      const aTransformedItems = [];
      for (const condition of aConditions) {
        const oItem = {};
        oItem[sKeyPath] = condition.values[0];
        if (sDescriptionPath) {
          oItem[sDescriptionPath] = condition.values[1];
        }
        aTransformedItems.push(oItem);
      }
      return aTransformedItems;
    },
    updateItems: function (oPayload, aConditions, oMultiValueField) {
      const oListBinding = oMultiValueField.getBinding("items");
      const oBindingInfo = oMultiValueField.getBindingInfo("items");
      const sItemPath = oBindingInfo.path;
      const oTemplate = oBindingInfo.template;
      const oKeyBindingInfo = oTemplate.getBindingInfo("key");
      const sKeyPath = oKeyBindingInfo && oKeyBindingInfo.parts[0].path;
      const oDescriptionBindingInfo = oTemplate.getBindingInfo("description");
      const sDescriptionPath = oDescriptionBindingInfo && oDescriptionBindingInfo.parts[0].path;
      const oModel = oListBinding.getModel();
      oModel.setProperty(sItemPath, this._transformConditions(aConditions, sKeyPath, sDescriptionPath));
    }
  });
  return oMultiValueFieldDelegate;
}, false);
//# sourceMappingURL=MultiValueParameterDelegate-dbg.js.map
