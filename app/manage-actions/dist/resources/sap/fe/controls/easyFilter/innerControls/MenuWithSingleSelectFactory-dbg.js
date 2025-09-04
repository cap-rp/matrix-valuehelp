/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/controls/easyFilter/innerControls/BaseFactory", "sap/fe/controls/easyFilter/utils", "sap/m/List", "sap/m/StandardListItem", "sap/m/library", "sap/ui/core/CustomData", "sap/ui/model/FilterOperator"], function ($BaseFactory, Utils, List, StandardListItem, library, CustomData, FilterOperator) {
  "use strict";

  var BaseFactory = $BaseFactory.BaseFactory;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let MenuWithSingleSelectFactory = /*#__PURE__*/function (_BaseFactory) {
    function MenuWithSingleSelectFactory(EFB, token) {
      var _this;
      const ListSeparators = library.ListSeparators;
      const ListMode = library.ListMode;
      _this = _BaseFactory.call(this, EFB, token) || this;

      // Initialize the list with single-select mode.
      _this.selectedItemIndex = -1;
      _this.setControl(new List({
        mode: ListMode.SingleSelectMaster,
        showSeparators: ListSeparators.None,
        selectionChange: _this.onItemSelected.bind(_this) // Attach the selection event handler.
      }));
      return _this;
    }

    /**
     * Sets the items for the list and initializes the selection.
     * @param newItems
     * @param allSelectedValues
     */
    _inheritsLoose(MenuWithSingleSelectFactory, _BaseFactory);
    var _proto = MenuWithSingleSelectFactory.prototype;
    _proto.setItems = async function setItems(newItems, allSelectedValues) {
      if (await Utils.areCodeListsSame(newItems, this.getItems())) {
        return;
      }
      const list = this.getControl();
      this.items = await Utils.getCodeListArray(newItems);
      list?.destroyAggregation("items");
      this.selectedItemIndex = -1;
      this.items.forEach((item, idx) => {
        let selectState = false;

        // Check if the item matches any preselected value.
        if (allSelectedValues.length > 0 && allSelectedValues[0].selectedValues.length > 0) {
          const firstValue = allSelectedValues[0].selectedValues[0];
          if (typeof firstValue === typeof item.value && firstValue === item.value) {
            selectState = true;
            this.selectedItemIndex = idx;
          }
        }

        // Add item to the list with the appropriate selection state.
        list?.addItem(new StandardListItem({
          title: item.description,
          selected: selectState,
          customData: [new CustomData({
            key: "value",
            value: item.value
          })]
        }));
      });
    }

    /**
     * Event handler for item selection.
     * Directly triggers the token update when an item is selected.
     * @param event
     */;
    _proto.onItemSelected = function onItemSelected(event) {
      const selectedItem = event.getParameter("listItem");
      const list = this.getControl();
      const easyFilterBarContainer = this.getEasyFilter();
      if (!selectedItem || !list) {
        return;
      }

      // Get the value of the selected item.
      const value = selectedItem.getCustomData().find(customData => customData.getKey() === "value")?.getValue();
      if (value !== undefined) {
        // Prepare the selected values definition.
        const selectedValue = [{
          operator: FilterOperator.EQ,
          selectedValues: [value]
        }];
        easyFilterBarContainer?.closeInnerControlPopover();

        // Get the key of the token and update the token array.
        const {
          key
        } = this.getToken()?.getCustomDataValue("TokenInfo");
        easyFilterBarContainer.updateTokenArray("setSelectedValues", selectedValue, key);

        // Update the selected item index for internal tracking.
        this.selectedItemIndex = list.indexOfItem(selectedItem);
      }
    }

    //Retrieves the index of the currently selected item.
    ;
    _proto.getSelectedIndex = function getSelectedIndex() {
      const selectedItem = this.getControl()?.getSelectedItems()?.[0];
      return selectedItem ? this.getControl()?.indexOfItem(selectedItem) ?? -1 : -1;
    };
    return MenuWithSingleSelectFactory;
  }(BaseFactory);
  return MenuWithSingleSelectFactory;
}, false);
//# sourceMappingURL=MenuWithSingleSelectFactory-dbg.js.map
