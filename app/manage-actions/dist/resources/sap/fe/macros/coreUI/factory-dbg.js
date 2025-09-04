/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/UIProvider", "sap/fe/macros/coreUI/CreateDialog", "sap/fe/macros/coreUI/OperationParameterDialog"], function (UIProvider, CreateDialog, OperationParameterDialog) {
  "use strict";

  var setCoreUIFactory = UIProvider.setCoreUIFactory;
  const factory = {
    newCreateDialog(contextToUpdate, fieldNames, appComponent, mode, parentControl) {
      return new CreateDialog(contextToUpdate, fieldNames, appComponent, mode, parentControl);
    },
    newOperationParameterDialog(action, parameters, parameterValues, entitySetName, messageHandler) {
      return new OperationParameterDialog(action, parameters, parameterValues, entitySetName, messageHandler);
    }
  };
  setCoreUIFactory(factory);
}, false);
//# sourceMappingURL=factory-dbg.js.map
