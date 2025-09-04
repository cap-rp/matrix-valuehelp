/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/controls/easyFilter/innerControls/BaseFactory", "sap/m/TimePickerClocks", "sap/ui/core/format/DateFormat", "sap/ui/model/FilterOperator", "../utils"], function (Log, $BaseFactory, TimePickerClocks, DateFormat, FilterOperator, EasyFilterUtils) {
  "use strict";

  var BaseFactory = $BaseFactory.BaseFactory;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let TimeFactory = /*#__PURE__*/function (_BaseFactory) {
    function TimeFactory(EFB, token) {
      var _this;
      _this = _BaseFactory.call(this, EFB, token) || this;
      _this.setControl(new TimePickerClocks());
      return _this;
    }
    _inheritsLoose(TimeFactory, _BaseFactory);
    var _proto = TimeFactory.prototype;
    _proto.invokeOkButtonHandler = function invokeOkButtonHandler() {
      const timePickerControl = this.getControl();
      const popover = this.getToken()?.getCustomDataValue("popover");
      const {
        key,
        keySpecificSelectedValues
      } = this.getToken()?.getCustomDataValue("TokenInfo");
      const formattedTime = DateFormat.getTimeInstance().format(timePickerControl?.getTimeValues());
      const operator = keySpecificSelectedValues.length === 0 ? FilterOperator.EQ : keySpecificSelectedValues[0].operator;
      const newSpecificValue = [{
        operator: operator,
        selectedValues: [formattedTime]
      }];
      if (EasyFilterUtils.areItemsSame(keySpecificSelectedValues, newSpecificValue)) {
        return;
      }
      this.getEasyFilter()?.updateTokenArray("setSelectedValues", newSpecificValue, key);
      popover?.close();
    };
    _proto.invokeShowAllButtonHandler = async function invokeShowAllButtonHandler() {
      const token = this.getToken();
      const key = token?.getKey();
      const valueHelpPromise = new Promise((resolve, reject) => {
        this.getEasyFilter()?.fireEvent("showValueHelp", {
          key,
          selectedValues: token?.getItems(),
          resolve,
          reject
        });
      });
      try {
        const newSelectedValues = await valueHelpPromise;
        this.getEasyFilter()?.updateTokenArray("setSelectedValues", newSelectedValues, key);
      } catch (error) {
        if (error instanceof Error) {
          Log.error("Error while fetching new tokens", error.message);
        } else {
          Log.error("Error while fetching new tokens", String(error));
        }
      }
    };
    return TimeFactory;
  }(BaseFactory);
  return TimeFactory;
}, false);
//# sourceMappingURL=TimeFactory-dbg.js.map
