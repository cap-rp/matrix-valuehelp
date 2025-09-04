/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/table/delegates/TableDelegate", "sap/ui/core/Element"], function (Log, TableDelegate, UI5Element) {
  "use strict";

  var _exports = {};
  let TableOptimisticBatch = /*#__PURE__*/function () {
    function TableOptimisticBatch() {}
    _exports = TableOptimisticBatch;
    var _proto = TableOptimisticBatch.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    }

    /**
     * Method to enable the optimistic batch mode for the table.
     */;
    _proto.enableOptimisticBatchMode = function enableOptimisticBatchMode() {
      try {
        const controller = this.getPageController();
        TableDelegate.setOptimisticBatchPromiseForModel(controller, this);
        TableDelegate.enableOptimisticBatchMode(controller, this.getContent());
      } catch (e) {
        Log.warning(e);
        // An exception will be thrown when the user clicks go and the table data has already been loaded
        // (setOptimisticBatchPromiseForModel is not supposed to be called once a batch has laready been sent)
        // We just ignore this exception
      }
    }

    /**
     * Method to setup the optimistic batch mode for the table.
     * It attaches the search event to the filter bar and enables the optimistic batch mode before the initial load of the table.
     * @param this The table block
     */;
    _proto.setupOptimisticBatch = async function setupOptimisticBatch() {
      const table = this.getContent();
      const controller = this.getPageController();
      if (!table || !controller) {
        return;
      }
      const filterBar = UI5Element.getElementById(table?.getFilter());
      const filterBarAPI = controller.getView().getViewData()?.hideFilterBar !== true ? filterBar?.getParent() : null;
      const controllerExtension = controller.extension;
      filterBarAPI?.attachEvent("search", () => {
        const internalBindingContext = table.getBindingContext("internal");
        internalBindingContext?.setProperty("searchFired", true);
      });
      if (filterBar && controller.isA("sap.fe.templates.ListReport.ListReportController") && (controllerExtension === undefined || this.getTableDefinition().control?.disableRequestCache === false)) {
        if (filterBarAPI) {
          //The handler above will be triggered only in case of a search event during the initialisation of the page.
          // it will be removed once the page is ready
          filterBarAPI.attachEventOnce("search", this.enableOptimisticBatchMode, this);
          await controller.pageReady.waitPageReady();
          filterBarAPI.detachEvent("search", this.enableOptimisticBatchMode, this);
        } else {
          this.enableOptimisticBatchMode();
        }
      }
    }

    /**
     * Setter for the optimisticBatchEnablerPromise property.
     * @param optimisticBatchEnablerPromiseObject The Promise that is to be resolved by the V4 model
     */;
    _proto.setOptimisticBatchEnablerPromise = function setOptimisticBatchEnablerPromise(optimisticBatchEnablerPromiseObject) {
      this.optimisticBatchEnablerPromise = optimisticBatchEnablerPromiseObject;
    }

    /**
     * Getter for the optimisticBatchEnablerPromise property.
     * @returns The optimisticBatchEnablerPromise property.
     */;
    _proto.getOptimisticBatchEnablerPromise = function getOptimisticBatchEnablerPromise() {
      return this.optimisticBatchEnablerPromise;
    }

    /**
     * Method to know if ListReport is configured with Optimistic batch mode disabled.
     * @returns Is Optimistic batch mode disabled
     */;
    _proto.isOptimisticBatchDisabled = function isOptimisticBatchDisabled() {
      return this.getTableDefinition().control.disableRequestCache || false;
    };
    return TableOptimisticBatch;
  }();
  _exports = TableOptimisticBatch;
  return _exports;
}, false);
//# sourceMappingURL=TableOptimisticBatch-dbg.js.map
