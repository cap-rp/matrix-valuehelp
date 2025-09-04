/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const PaginatorExtensionOverride = {
    onBeforeContextUpdate: function (oListBinding, iCurrentContextIndex) {
      const oCurrentView = this.getView(),
        oControlContext = oCurrentView && oCurrentView.getBindingContext(),
        aCurrentContexts = oListBinding && oListBinding.getCurrentContexts(),
        oPaginatorCurrentContext = aCurrentContexts[iCurrentContextIndex];
      if (oPaginatorCurrentContext && oControlContext && oPaginatorCurrentContext.getPath() !== oControlContext.getPath()) {
        // Prevent default update of context index in Object Page Paginator when view context is different from the paginator context.
        return true;
      }
      return false;
    },
    onContextUpdate: function (oContext) {
      this.base._routing.navigateToContext(oContext, {
        callExtension: true
      });
    }
  };
  return PaginatorExtensionOverride;
}, false);
//# sourceMappingURL=Paginator-dbg.js.map
