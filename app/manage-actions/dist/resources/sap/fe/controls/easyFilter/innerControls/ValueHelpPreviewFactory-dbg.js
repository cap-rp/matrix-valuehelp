/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/fe/controls/easyFilter/innerControls/BaseFactory", "sap/fe/controls/easyFilter/utils", "sap/m/List", "sap/m/StandardListItem", "sap/m/library", "sap/ui/core/CustomData"], function (Log, deepClone, $BaseFactory, Utils, List, StandardListItem, library, CustomData) {
  "use strict";

  var ListSeparators = library.ListSeparators;
  var ListMode = library.ListMode;
  var BaseFactory = $BaseFactory.BaseFactory;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let ValueHelpPreviewFactory = /*#__PURE__*/function (_BaseFactory) {
    function ValueHelpPreviewFactory(EFB, token) {
      var _this;
      _this = _BaseFactory.call(this, EFB, token) || this;
      _this.setControl(new List({
        delete: _this.onDelete.bind(_this),
        mode: ListMode.Delete,
        showSeparators: ListSeparators.None
      }));
      return _this;
    }
    _inheritsLoose(ValueHelpPreviewFactory, _BaseFactory);
    var _proto = ValueHelpPreviewFactory.prototype;
    _proto.setItems = function setItems(items, tokenType, isDateTimeOffset) {
      if (Utils.areItemsSame(items, this.items)) {
        return;
      }
      this.items = items;
      const list = this.getControl();
      list?.destroyAggregation("items");
      //Make sure only top 5 values are shown
      let ctr = 0;
      items.forEach((item, index1) => {
        const {
          operator,
          selectedValues
        } = item;
        let title = "";
        //Currently hardCoding the most number of values that can be shown is 5
        //ValueHelp will have non-fixed values, so its important to limit the number of values to be shown
        if (tokenType === "ValueHelp" && ctr < 5) {
          if (Utils.isBetweenSelectedValues(operator)) {
            title = Utils.mapOperatorForBetweenOperator(operator, selectedValues, tokenType, isDateTimeOffset);
            this.insertItem(list, title, [index1]);
            ++ctr;
          } else {
            selectedValues.forEach((selectedValue, index2) => {
              if (ctr < 5) {
                title = Utils.mapOperatorForValueHelp(operator, selectedValue, tokenType, isDateTimeOffset);
                this.insertItem(list, title, [index1, index2]);
                ++ctr;
              }
            });
          }
        } else if (tokenType !== "ValueHelp") {
          if (Utils.isBetweenSelectedValues(operator)) {
            title = Utils.mapOperatorForBetweenOperator(operator, selectedValues, tokenType, isDateTimeOffset);
            //In this case, we don't need t to store index2, because we know that LLM or VHD always gives you only 2 values in return
            this.insertItem(list, title, [index1]);
          } else {
            selectedValues.forEach((selectedValue, index2) => {
              title = Utils.mapOperator(operator, selectedValue, tokenType, isDateTimeOffset);
              //We need to store index2 to find out which item has been removed inside the array
              this.insertItem(list, title, [index1, index2]);
            });
          }
        }
      });
    };
    _proto.insertItem = function insertItem(list, title, indexPositions) {
      list?.addItem(new StandardListItem({
        title,
        customData: new CustomData({
          key: "arrayIndex",
          value: indexPositions
        })
      }));
    };
    _proto.onDelete = function onDelete(event) {
      const popover = this.getToken()?.getCustomDataValue("popover");
      event.getParameter("listItem")?.setVisible(false);
      popover.focus();
    };
    _proto.normalizeString = function normalizeString(str) {
      const regex = /^(>=|<=|!=|>|<)+/;
      return str.replace(regex, "");
    };
    _proto.invokeOkButtonHandler = function invokeOkButtonHandler() {
      const popover = this.getToken()?.getCustomDataValue("popover");
      const token = this.getToken();
      const easyFilterBarContainer = this.getEasyFilter();
      const items = token?.getItems()?.map(item => ({
        operator: JSON.parse(JSON.stringify(item.operator)),
        // Deep copy of operator
        selectedValues: deepClone(item.selectedValues) // Deep copy of selectedValues, if its a complex object
      }));
      const indicesToBeRemoved = [];
      this.getControl()?.getItems().forEach(listItem => {
        //If the item is hidden that means it should be removed completely
        if (!listItem.getVisible()) {
          const [index1 = Infinity, index2 = Infinity] = listItem?.getCustomData()?.find(data => data?.getKey() === "arrayIndex")?.getValue() ?? [];
          if (index1 === Infinity || !items) {
            return;
          }
          indicesToBeRemoved.push([index1, index2]);
        }
      });

      /*
      Without sorting in descending order:
      	Removing an object would shift all subsequent indices, potentially causing incorrect removals or skips.
      Removing values from selectedValues could shift other values, resulting in missed or unintended removals.
      This approach ensures that each removal operates on stable, correct indices.
      	This is the reason why we have added valueIndex to infinity
      Infinity is greater than any valid index, so sorting in descending order will naturally place entries with valueIndex = Infinity at the top for each objIndex.
      This way, we can process the complete removal of an object before handling any individual selectedValues removals within that object, preventing unwanted shifts.
       */
      indicesToBeRemoved.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
      indicesToBeRemoved.forEach(_ref => {
        let [objIndex, valueIndex] = _ref;
        if (items) {
          //If valueIndex is infinity, then it means it should be a between operator scenario, so remove the total object only
          if (valueIndex === Infinity) {
            items.splice(objIndex, 1);
            return;
          }
          items[objIndex].selectedValues.splice(valueIndex, 1);
          // If the values array becomes empty, remove the whole object
          if (items[objIndex].selectedValues.length === 0) {
            items.splice(objIndex, 1);
          }
        }
      });
      easyFilterBarContainer.updateTokenArray("setSelectedValues", items, token?.getKey());
      popover.close();
    };
    _proto.invokeShowAllButtonHandler = async function invokeShowAllButtonHandler() {
      const token = this.getToken();
      const {
        type
      } = token?.getCustomDataValue("TokenInfo");
      const key = token?.getKey();
      const valueHelpPromise = new Promise((resolve, reject) => {
        this.getEasyFilter()?.fireEvent("showValueHelp", {
          key,
          values: token?.getItems()?.map(item => {
            if (type === "ValueHelp") {
              return {
                operator: item.operator,
                //Making sure that only the id part is passed
                selectedValues: item.selectedValues.map(selectedValue => selectedValue.value)
              };
            } else {
              return item;
            }
          }),
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
    _proto.invokePopupCloseHandler = function invokePopupCloseHandler() {
      //Whatever has been deleted, make them appear again so that they can be visible as soon as you click the token again
      this.getControl()?.getItems().forEach(item => item.setVisible(true));
    };
    return ValueHelpPreviewFactory;
  }(BaseFactory);
  return ValueHelpPreviewFactory;
}, false);
//# sourceMappingURL=ValueHelpPreviewFactory-dbg.js.map
