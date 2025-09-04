/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/mdc/filterbar/aligned/FilterContainer"], function (ClassSupport, MdcFilterContainer) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Constructor for a new FE filter container.
   *
   */
  let FilterContainer = (_dec = defineUI5Class("sap.fe.macros.controls.filterbar.FilterContainer"), _dec(_class = /*#__PURE__*/function (_MdcFilterContainer) {
    function FilterContainer() {
      return _MdcFilterContainer.apply(this, arguments) || this;
    }
    _inheritsLoose(FilterContainer, _MdcFilterContainer);
    var _proto = FilterContainer.prototype;
    _proto.init = function init() {
      this.aAllFilterFields = [];
      this.aAllVisualFilters = {};
      _MdcFilterContainer.prototype.init.call(this);
      this.oLayout.setParent(this);
    };
    _proto.exit = function exit() {
      // destroy layout
      _MdcFilterContainer.prototype.exit.call(this);
      // destroy all filter fields which are not in the layout
      this.aAllFilterFields.forEach(function (oFilterField) {
        oFilterField.destroy();
      });
      Object.keys(this.aAllVisualFilters).forEach(sKey => {
        this.aAllVisualFilters[sKey].destroy();
      });
    };
    _proto.insertFilterField = function insertFilterField(oControl, iIndex) {
      const oFilterItemLayoutEventDelegate = {
        onBeforeRendering: function () {
          // For compact filters the item layout needs to render both label and filter field.
          // hence use the original getContent of the FilterItemLayout
          if (oControl._fnGetContentCopy) {
            oControl.getContent = oControl._fnGetContentCopy;
          }
          oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
        }
      };
      oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

      // In this layout there is no need to render visual filter
      // hence find the filter field from the layout and remove it's content aggregation
      oControl.getContent().forEach(oInnerControl => {
        if (oInnerControl.isA("sap.ui.mdc.FilterField")) {
          const oContent = oInnerControl.getContent && oInnerControl.getContent();
          if (oContent && oContent.isA("sap.fe.macros.visualfilters.VisualFilter")) {
            // store the visual filter for later use.
            const oVFId = oInnerControl.getId();
            this.aAllVisualFilters[oVFId] = oContent;
            // remove the content aggregation to render internal content of the field
            oInnerControl.setContent(null);
          }
        }
      });

      // store filter fields to refer to when switching between layout
      this.aAllFilterFields.push(oControl);
      _MdcFilterContainer.prototype.insertFilterField.call(this, oControl, iIndex);
    };
    _proto.removeFilterField = function removeFilterField(oControl) {
      const oFilterFieldIndex = this.aAllFilterFields.findIndex(function (oFilterField) {
        return oFilterField.getId() === oControl.getId();
      });

      // Setting VF content for Fillterfield before removing
      oControl.getContent().forEach(oInnerControl => {
        if (oInnerControl.isA("sap.ui.mdc.FilterField") && !oInnerControl.getContent()) {
          const oVFId = oInnerControl.getId();
          if (this.aAllVisualFilters[oVFId]) {
            oInnerControl.setContent(this.aAllVisualFilters[oVFId]);
          }
        }
      });
      this.aAllFilterFields.splice(oFilterFieldIndex, 1);
      _MdcFilterContainer.prototype.removeFilterField.call(this, oControl);
    };
    _proto.removeAllFilterFields = function removeAllFilterFields() {
      this.aAllFilterFields = [];
      this.aAllVisualFilters = {};
      this.oLayout.removeAllContent();
    };
    _proto.getAllButtons = function getAllButtons() {
      const buttonLayout = this.oLayout.getEndContent();
      return buttonLayout?.[0]?.getContent()?.[1]?.getContent();
    };
    _proto.removeButton = function removeButton(oControl) {
      this.oLayout.removeEndContent(oControl);
    };
    _proto.getAllFilterFields = function getAllFilterFields() {
      return this.aAllFilterFields.filter(filterFieldLayout => !filterFieldLayout.isDestroyed());
    };
    _proto.getAllVisualFilterFields = function getAllVisualFilterFields() {
      return this.aAllVisualFilters;
    };
    _proto.setAllFilterFields = function setAllFilterFields(aFilterFields) {
      this.aAllFilterFields = aFilterFields;
    };
    return FilterContainer;
  }(MdcFilterContainer)) || _class);
  return FilterContainer;
}, false);
//# sourceMappingURL=FilterContainer-dbg.js.map
