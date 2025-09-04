/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const InternalRoutingExtension = {
    onBeforeBinding: function (oContext, mParameters) {
      this.getView().getController()._onBeforeBinding(oContext, mParameters);
    },
    onAfterBinding: function (oContext, mParameters) {
      this.getView().getController()._onAfterBinding(oContext, mParameters);
    },
    closeColumn: function () {
      const internalModelContext = this.getView().getBindingContext("internal");
      internalModelContext.setProperty("fclColumnClosed", true);
      const context = this.getView().getBindingContext();
      const path = context && context.getPath() || "";
      const metaModel = context.getModel().getMetaModel();
      const metaPath = metaModel.getMetaPath(path);
      const technicalKeys = metaModel.getObject(`${metaPath}/$Type/$Key`);
      const entry = context?.getObject();
      const technicalKeysObject = {};
      for (const key in technicalKeys) {
        const objKey = technicalKeys[key];
        if (!technicalKeysObject[objKey]) {
          technicalKeysObject[objKey] = entry[objKey];
        }
      }
      internalModelContext.setProperty("technicalKeysOfLastSeenRecord", technicalKeysObject);
    }
  };
  return InternalRoutingExtension;
}, false);
//# sourceMappingURL=InternalRouting-dbg.js.map
