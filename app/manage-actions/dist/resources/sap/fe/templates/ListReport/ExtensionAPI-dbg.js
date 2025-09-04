/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/ExtensionAPI", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/fe/templates/ListReport/LRMessageStrip", "sap/ui/core/InvisibleMessage", "sap/ui/core/library"], function (Log, ClassSupport, ExtensionAPI, ChartUtils, FilterUtils, $LRMessageStrip, InvisibleMessage, library) {
  "use strict";

  var _dec, _class;
  var InvisibleMessageMode = library.InvisibleMessageMode;
  var LRMessageStrip = $LRMessageStrip.LRMessageStrip;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Extension API for list reports in SAP Fiori elements for OData V4.
   *
   * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
   * @public
   * @hideconstructor
   * @final
   * @since 1.79.0
   */
  let ListReportExtensionAPI = (_dec = defineUI5Class("sap.fe.templates.ListReport.ExtensionAPI"), _dec(_class = /*#__PURE__*/function (_ExtensionAPI) {
    function ListReportExtensionAPI() {
      return _ExtensionAPI.apply(this, arguments) || this;
    }
    _inheritsLoose(ListReportExtensionAPI, _ExtensionAPI);
    var _proto = ListReportExtensionAPI.prototype;
    /**
     * Refreshes the List Report.
     * This method currently only supports triggering the search (by clicking on the GO button)
     * in the List Report Filter Bar. It can be used to request the initial load or to refresh the
     * currently shown data based on the filters entered by the user.
     * Please note: The Promise is resolved once the search is triggered and not once the data is returned.
     * @returns Resolved once the data is refreshed or rejected if the request failed
     * @public
     */
    _proto.refresh = async function refresh() {
      const filterBar = this._controller._getFilterBarControl();
      const filterBarAPI = filterBar?.getParent();
      if (filterBarAPI) {
        filterBarAPI.triggerSearch();
      }
      // TODO: if there is no filter bar, make refresh work
      return Promise.resolve();
    }

    /**
     * Gets the list entries currently selected for the displayed control.
     * @returns Array containing the selected contexts
     * @public
     */;
    _proto.getSelectedContexts = function getSelectedContexts() {
      const oControl = this._controller._isMultiMode() && this._controller._getMultiModeControl()?.getSelectedInnerControl()?.content || this._controller._getTable(); // This can never be a TableAPI, but it causes issue line 73 otherwise.
      if (oControl.isA("sap.ui.mdc.Chart")) {
        const aSelectedContexts = [];
        if (oControl && oControl.get_chart()) {
          const aSelectedDataPoints = ChartUtils.getChartSelectedData(oControl.get_chart());
          for (const item of aSelectedDataPoints) {
            aSelectedContexts.push(item.context);
          }
        }
        return aSelectedContexts;
      } else {
        return oControl.getParent().getSelectedContexts();
      }
    }

    /**
     * Refreshes the count of the views in the MultiMode control.
     * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' count will be refreshed. If not provided, all the views' count will be refreshed
     * @public
     */;
    _proto.refreshTabsCount = function refreshTabsCount(keys) {
      this._controller._getMultiModeControl()?.refreshTabsCount(keys);
    }

    /**
     * Refreshes the content of the underlying views upon the next opening.
     * Note: The content of the selected view, if part of the provided keys, will be refreshed immediately.
     * @param [keys] The list of the keys identifying the views defined in the manifest for which the views' content will be refreshed. If not provided, all the views' content will be refreshed
     * @public
     */;
    _proto.setTabContentToBeRefreshedOnNextOpening = function setTabContentToBeRefreshedOnNextOpening(keys) {
      this._controller._getMultiModeControl()?.setTabContentToBeRefreshedOnNextOpening(keys);
    }

    /**
     * Set the filter values for the given property in the filter bar.
     * The filter values can be either a single value or an array of values.
     * Each filter value must be represented as a primitive value.
     * @param sConditionPath The path to the property as a condition path
     * @param [sOperator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
     * @param vValues The values to be applied
     * @returns A promise for asynchronous handling
     * @public
     */;
    _proto.setFilterValues = async function setFilterValues(sConditionPath, sOperator, vValues) {
      // The List Report has two filter bars: The filter bar in the header and the filter bar in the "Adapt Filter" dialog;
      // when the dialog is opened, the user is working with that active control: Pass it to the setFilterValues method!
      const filterBar = this._controller._getAdaptationFilterBarControl() || this._controller._getFilterBarControl();
      if (vValues === undefined) {
        vValues = sOperator;
        return FilterUtils.setFilterValues(filterBar, sConditionPath, vValues);
      }
      return FilterUtils.setFilterValues(filterBar, sConditionPath, sOperator, vValues);
    }

    /**
     * This method converts the filter conditions to filters.
     * @param mFilterConditions Map containing the filter conditions of the FilterBar.
     * @returns Object containing the converted FilterBar filters or undefined.
     * @public
     */;
    _proto.createFiltersFromFilterConditions = function createFiltersFromFilterConditions(mFilterConditions) {
      const filterBar = this._controller._getFilterBarControl();
      if (!filterBar) {
        Log.error("The filter bar is not available");
        return;
      }
      return FilterUtils.getFilterInfo(filterBar, undefined, mFilterConditions);
    }

    /**
     * Provides all the model filters from the filter bar that are currently active
     * along with the search expression.
     * @returns An array of active filters and the search expression or undefined.
     * @public
     */;
    _proto.getFilters = function getFilters() {
      const oFilterBar = this._controller._getFilterBarControl();
      return FilterUtils.getFilters(oFilterBar);
    }

    /**
     * Provide an option for showing a custom message in the message strip above the list report table.
     * @param message Custom message along with the message type to be set on the table.
     * @param message.message Message string to be displayed.
     * @param message.type Indicates the type of message.
     * @param tabKey The tabKey identifying the table where the custom message is displayed. If tabKey is empty, the message is displayed in all tabs . If tabKey = ['1','2'], the message is displayed in tabs 1 and 2 only
     * @param onClose A function that is called when the user closes the message bar.
     * @public
     */;
    _proto.setCustomMessage = function setCustomMessage(message, tabKey, onClose) {
      if (!this.ListReportMessageStrip) {
        this.ListReportMessageStrip = new LRMessageStrip();
      }
      this.ListReportMessageStrip.showCustomMessage(message, this._controller, tabKey, onClose);
      if (message?.message) {
        InvisibleMessage.getInstance().announce(message.message, InvisibleMessageMode.Assertive);
      }
    }

    /**
     * Destroys the message strip set on the List Report, if any.
     * @private
     */;
    _proto.destroy = function destroy() {
      this.ListReportMessageStrip?.destroy();
      _ExtensionAPI.prototype.destroy.call(this);
    }

    /**
     * Provides an option for the selection of a specific tab programamatically.
     * @param tabKey Specific tab to be selected.
     * @public
     */;
    _proto.setSelectedTab = function setSelectedTab(tabKey) {
      const control = this._controller._getIconTabBar();
      control?.fireSelect({
        selectedKey: "fe::table::" + tabKey + "::LineItem"
      });
    };
    return ListReportExtensionAPI;
  }(ExtensionAPI)) || _class);
  return ListReportExtensionAPI;
}, false);
//# sourceMappingURL=ExtensionAPI-dbg.js.map
