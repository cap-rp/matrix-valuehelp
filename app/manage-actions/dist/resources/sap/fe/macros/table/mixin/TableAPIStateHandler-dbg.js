/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/controllerextensions/viewState/IViewStateContributorMixin", "sap/ui/mdc/p13n/StateUtil"], function (Log, IViewStateContributorMixin, StateUtil) {
  "use strict";

  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let TableAPIStateHandler = /*#__PURE__*/function (_IViewStateContributo) {
    function TableAPIStateHandler() {
      return _IViewStateContributo.apply(this, arguments) || this;
    }
    _exports = TableAPIStateHandler;
    _inheritsLoose(TableAPIStateHandler, _IViewStateContributo);
    var _proto = TableAPIStateHandler.prototype;
    /**
     * Asynchronously retrieves the state of the table based on the provided viewstate.
     * @returns A promise that resolves to the table state or null if not found.
     */
    _proto.retrieveState = async function retrieveState() {
      const tableState = {};
      tableState.innerTable = this.getControlState(await StateUtil.retrieveExternalState(this.content));
      const quickFilter = this.getQuickFilter();
      if (quickFilter) {
        const quickFilterState = quickFilter.getSelectedKey();
        if (!tableState.quickFilter) {
          tableState.quickFilter = {};
        }
        tableState.quickFilter.selectedKey = quickFilterState;
      }
      const variantToRetrieve = this.content.getVariant()?.getId();
      if (variantToRetrieve) {
        const variantManagementControl = this.content.getVariant();
        if (!tableState.variantManagement) {
          tableState.variantManagement = {
            variantId: variantManagementControl?.getCurrentVariantKey()
          };
        } else {
          tableState.variantManagement.variantId = variantManagementControl?.getCurrentVariantKey();
        }
      }
      return tableState;
    }

    /**
     * Sets the initial state of the control by retrieving the external state.
     * @returns A promise that resolves when the initial state is set.
     */;
    _proto.setInitialState = async function setInitialState() {
      try {
        const initialControlState = await StateUtil.retrieveExternalState(this.content);
        this.initialControlState = initialControlState;
      } catch (e) {
        Log.error(e);
      }
    }

    /**
     * Applies the legacy state to the table based on the provided control state retrieval function.
     * @param getControlState Function to retrieve the control state.
     * @param [_navParameters] Optional navigation parameters.
     * @param [shouldApplyDiffState] Flag indicating whether to apply the diff state.
     * @returns - A promise that resolves when the state has been applied.
     */;
    _proto.applyLegacyState = async function applyLegacyState(getControlState, _navParameters, shouldApplyDiffState) {
      const table = this.content;
      const vm = table.getVariant();
      const quickFilter = this.getQuickFilter();
      const tableState = getControlState(table);
      const vmState = vm ? getControlState(vm) : null;
      const quickFilterState = quickFilter?.content ? getControlState(quickFilter.content) : null;
      const controlState = {};
      if (tableState) {
        controlState.innerTable = {
          ...controlState.innerTable,
          ...tableState,
          fullState: {
            ...controlState.innerTable?.fullState,
            ...tableState.fullState
          },
          initialState: {
            ...controlState.innerTable?.initialState,
            ...tableState.initialState
          }
        };
      }
      if (vmState?.variantId) {
        controlState.variantManagement = {
          ...controlState.variantManagement,
          variantId: vmState.variantId.toString()
        };
      }
      if (quickFilterState?.selectedKey) {
        controlState.quickFilter = {
          ...controlState.quickFilter,
          selectedKey: quickFilterState.selectedKey.toString()
        };
      }
      if (controlState && Object.keys(controlState).length > 0) {
        await this.applyState(controlState, _navParameters, shouldApplyDiffState);
      }
    }

    /**
     * Asynchronously applies the provided control state to the viewstate.
     * @param controlState The state to be applied to the control.
     * @param [_navParameters] Optional navigation parameters.
     * @param [shouldApplyDiffState] Optional flag to skip merging states.
     * @returns A promise that resolves when the state has been applied.
     */;
    _proto.applyState = async function applyState(controlState, _navParameters, shouldApplyDiffState) {
      if (!controlState) return;

      // Table properties need to be available before calling diffState/retrieveState. However, applyState
      // gets called too early in the table's lifecycle, so the delegate and properties are not yet available.
      await this.content.initialized();
      const innerTableState = controlState?.innerTable;
      const variantId = controlState?.variantManagement?.variantId;
      const currentVariant = this.content?.getVariant();
      const quickFilterKey = controlState?.quickFilter?.selectedKey;
      const quickFilter = this.getQuickFilter();

      // Handle Variant Management
      if (variantId !== undefined && variantId !== currentVariant.getCurrentVariantKey()) {
        const ovM = this.content?.getVariant();
        const aVariants = ovM?.getVariants();
        const sVariantReference = aVariants?.some(oVariant => oVariant.getKey() === variantId) ? variantId : ovM?.getStandardVariantKey;
        try {
          const ControlVariantApplyAPI = (await __ui5_require_async("sap/ui/fl/apply/api/ControlVariantApplyAPI")).default;
          await ControlVariantApplyAPI.activateVariant({
            element: ovM,
            variantReference: sVariantReference
          });
          await this.setInitialState();
        } catch (error) {
          Log.error(error);
          await this.setInitialState();
        }
      } else {
        // we need to update initial state even if above condition not satiesfied
        await this.setInitialState();
      }

      // Handle Inner Table State

      let finalState;
      if (innerTableState) {
        if (shouldApplyDiffState && innerTableState.initialState) {
          if (!innerTableState.initialState.supplementaryConfig) {
            innerTableState.initialState.supplementaryConfig = {};
          }
          finalState = await StateUtil.diffState(this.content, innerTableState.initialState, innerTableState.fullState);
        } else {
          if (controlState && !controlState?.supplementaryConfig) {
            controlState.supplementaryConfig = {};
          }
          finalState = innerTableState.fullState;
        }
        await StateUtil.applyExternalState(this.content, finalState);
      }

      // Handle Quick Filter State
      if (quickFilterKey && quickFilterKey !== quickFilter?.getSelectedKey()) {
        quickFilter?.setSelectedKey(quickFilterKey);
        this.onQuickFilterSelectionChange();
      }
      if (this.initialLoad && this.filterBar) {
        const filterBar = this.getFilterBarControl(this.filterBar);
        if (filterBar && filterBar.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
          filterBar.waitForInitialState().then(() => {
            this.content.rebind();
            return;
          }).catch(() => {
            Log.error("Error while waiting for initial state of filter bar");
          });
        }
      }
    };
    return TableAPIStateHandler;
  }(IViewStateContributorMixin);
  _exports = TableAPIStateHandler;
  return _exports;
}, false);
//# sourceMappingURL=TableAPIStateHandler-dbg.js.map
