/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/controls/easyFilter/innerControls/BaseFactory", "sap/fe/controls/easyFilter/utils", "sap/m/List", "sap/m/StandardListItem", "sap/m/library", "sap/ui/core/CustomData", "sap/ui/model/FilterOperator"], function ($BaseFactory, Utils, List, StandardListItem, library, CustomData, FilterOperator) {
  "use strict";

  var BaseFactory = $BaseFactory.BaseFactory;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let MenuWithCheckBoxFactory = /*#__PURE__*/function (_BaseFactory) {
    function MenuWithCheckBoxFactory(EFB, token) {
      var _this;
      const ListSeparators = library.ListSeparators;
      const ListMode = library.ListMode;
      _this = _BaseFactory.call(this, EFB, token) || this;
      _this.selectionList = [];
      _this.okButtonClicked = false;
      _this.setControl(new List({
        mode: ListMode.MultiSelect,
        showSeparators: ListSeparators.None
      }));
      return _this;
    }
    _inheritsLoose(MenuWithCheckBoxFactory, _BaseFactory);
    var _proto = MenuWithCheckBoxFactory.prototype;
    _proto.setItems = async function setItems(newItems, allSelectedValues) {
      if (await Utils.areCodeListsSame(newItems, this.getItems())) {
        return;
      }
      const list = this.getControl();
      this.items = await Utils.getCodeListArray(newItems);
      list?.destroyAggregation("items");
      this.selectionList = [];
      this.items.forEach((item, idx) => {
        let selectState = false;
        //Value should either be string, number or boolean.
        if (allSelectedValues.length > 0 && allSelectedValues[0].selectedValues.length > 0) {
          const firstValue = allSelectedValues[0].selectedValues[0];
          if (typeof firstValue === "string" && typeof item.value === "string") {
            // Assert selectedValues as string[]
            if (allSelectedValues[0].selectedValues.includes(item.value)) {
              selectState = true;
              this.selectionList?.push(idx);
            }
          } else if (typeof firstValue === "boolean" && typeof item.value === "boolean") {
            // Assert selectedValues as boolean[]
            if (allSelectedValues[0].selectedValues.includes(item.value)) {
              selectState = true;
              this.selectionList?.push(idx);
            }
          } else if (typeof firstValue === "number" && typeof item.value === "number") {
            // Assert selectedValues as number[]
            if (allSelectedValues[0].selectedValues.includes(item.value)) {
              selectState = true;
              this.selectionList?.push(idx);
            }
          }
        }
        list?.addItem(new StandardListItem({
          title: item.description,
          selected: selectState,
          customData: [
          //Saving the value inside the CustomData, because at the end we would be exposing the values to the consumer not the description
          new CustomData({
            key: "value",
            value: item.value
          })]
        }));
      });
    };
    _proto.invokeOkButtonHandler = function invokeOkButtonHandler() {
      if (this.areSelectListSame()) {
        return;
      }
      this.selectionList = this.getSelectedIndices();
      this.okButtonClicked = true;
      const listItems = this.getControl()?.getSelectedItems();
      const easyFilterBarContainer = this.getEasyFilter();
      let allSelectedValues = [{
        operator: FilterOperator.EQ,
        selectedValues: []
      }];
      const {
        key
      } = this.getToken()?.getCustomDataValue("TokenInfo");
      listItems.forEach(item => {
        const value = item.getCustomData().find(customData => customData.getKey() === "value")?.getValue();
        if (value !== undefined) {
          // Check the type of value and the contents of selectedValues
          if (Array.isArray(allSelectedValues[0].selectedValues)) {
            const selectedValues = allSelectedValues[0].selectedValues;
            if (typeof value === "string" && selectedValues.every(val => typeof val === "string") || typeof value === "boolean" && selectedValues.every(val => typeof val === "boolean") || typeof value === "number" && selectedValues.every(val => typeof val === "number")) {
              // Push the value only if all selectedValues are of the same type
              selectedValues.push(value);
            }
          }
        }
      });
      allSelectedValues = allSelectedValues[0].selectedValues.length === 0 ? [] : allSelectedValues;
      easyFilterBarContainer.updateTokenArray("setSelectedValues", allSelectedValues, key);
    };
    _proto.areSelectListSame = function areSelectListSame() {
      //The below case would get applicable in mandatory tokens case where no value has been set
      const tempSelectList = this.getSelectedIndices();
      if (this.selectionList.length === 0 || tempSelectList.length !== this.selectionList.length) {
        return false;
      }
      return this.selectionList.every((item, idx) => tempSelectList[idx] === item);
    };
    _proto.invokePopupCloseHandler = function invokePopupCloseHandler() {
      if (this.okButtonClicked) {
        this.okButtonClicked = false;
        return;
      }
      this.okButtonClicked = false;
      this.getControl()?.removeSelections();
      this.selectionList?.forEach(idx => this.getControl()?.getItems()[idx].setSelected(true));
    };
    _proto.setSelectList = function setSelectList() {
      this.selectionList = [];
      const listItems = this.getControl()?.getSelectedItems();
      listItems?.forEach(item => this.selectionList?.push(this.getControl()?.indexOfItem(item)));
    };
    _proto.getSelectedIndices = function getSelectedIndices() {
      const selectionList = [];
      const listItems = this.getControl()?.getSelectedItems();
      listItems?.forEach(item => selectionList?.push(this.getControl()?.indexOfItem(item)));
      return selectionList;
    };
    return MenuWithCheckBoxFactory;
  }(BaseFactory);
  return MenuWithCheckBoxFactory;
}, false);
//# sourceMappingURL=MenuWithCheckBoxFactory-dbg.js.map
