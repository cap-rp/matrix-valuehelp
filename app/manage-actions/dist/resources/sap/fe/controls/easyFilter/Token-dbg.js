/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx", "sap/m/Token", "sap/m/delegate/ValueStateMessage", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/model/FilterOperator", "./innerControls/CalendarFactory", "./innerControls/MenuWithCheckBoxFactory", "./innerControls/MenuWithSingleSelectFactory", "./innerControls/TimeFactory", "./innerControls/ValueHelpPreviewFactory", "./utils", "sap/fe/base/jsx-runtime/jsxs", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, jsx, Token, ValueStateMessage, Lib, library, FilterOperator, CalenderFactory, MenuWithCheckBoxFactory, MenuWithSingleSelectFactory, TimeFactory, ValueHelpPreviewFactory, EasyFilterUtils, _jsxs, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9;
  var _exports = {};
  var ValueState = library.ValueState;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let EasyFilterToken = (_dec = defineUI5Class("sap.fe.controls.easyFilter.Token"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string",
    defaultValue: null
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "array"
  }), _dec8 = property({
    type: "sap.ui.core.ValueState",
    group: "Appearance",
    defaultValue: ValueState.None
  }), _dec9 = property({
    type: "int",
    visibility: "hidden"
  }), _dec10 = property({
    type: "int",
    visibility: "hidden"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Token) {
    function EasyFilterToken(idOrSettings, settings) {
      var _this;
      _this = _Token.call(this, idOrSettings, settings) || this;
      _initializerDefineProperty(_this, "label", _descriptor, _this);
      _initializerDefineProperty(_this, "titlePopover", _descriptor2, _this);
      _initializerDefineProperty(_this, "value", _descriptor3, _this);
      _initializerDefineProperty(_this, "valueStateText", _descriptor4, _this);
      _initializerDefineProperty(_this, "mandatory", _descriptor5, _this);
      _initializerDefineProperty(_this, "items", _descriptor6, _this);
      _initializerDefineProperty(_this, "valueState", _descriptor7, _this);
      _initializerDefineProperty(_this, "posinset", _descriptor8, _this);
      _initializerDefineProperty(_this, "setsize", _descriptor9, _this);
      _this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
      _this.eventAttached = false;
      _this.isDescriptionFetched = false;
      _this.valueStateMessage = new ValueStateMessage(_this);
      //Closing the ValueState popovers whenever we are clicking/tapping else where on the screen
      _this.attachCloseHandlersForValueStateMessagePopup();
      return _this;
    }
    _exports = EasyFilterToken;
    _inheritsLoose(EasyFilterToken, _Token);
    var _proto = EasyFilterToken.prototype;
    _proto.firePress = function firePress(_parameters) {
      const tokenizer = this.getParent();
      if (!tokenizer.getEditable()) {
        return this;
      }
      // We hijack the press event to open the detail popover
      this.fireEvent("press");
      this.valueStateMessage?.close();
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      const {
        key,
        type,
        keySpecificSelectedValues
      } = this.getCustomDataValue("TokenInfo");

      // Check if the popover is already open
      if (popover.isOpen()) {
        // If the popover is open and the new key is the same as the previous one, do nothing
        if (EasyFilterToken.prevTokenKey === key) {
          return this; // Return early to prevent any further action
        } else {
          // If the key is different, update prevTokenKey and close the popover
          EasyFilterToken.prevTokenKey = key; // Update the previous token key to the new one
          popover.close(); // Close the popover
        }
      } else {
        // If the popover is not open, update prevTokenKey for the first time
        EasyFilterToken.prevTokenKey = key;
      }

      //resetting the header and footer, if hidden by singleselect
      popover?.setShowHeader(true);
      popover?.getFooter()?.setVisible(true);
      if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        this.invokeCalendar();
      } else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        this.invokeTime();
      } else if (type === "MenuWithCheckBox") {
        this.invokeMenuWithCheckBox();
      } else if (type === "MenuWithSingleSelect") {
        this.invokeMenuWithSingleSelect();
      } else {
        this.invokeValueHelpPreview();
      }
      const okButton = easyFilterBarContainer?.getOkButton();
      const showAllButton = easyFilterBarContainer?.getShowAllButton();
      if (!(this.eventAttached ?? false)) {
        okButton?.attachPress(this.handleOkClick.bind(this));
        showAllButton?.attachPress(this.handleShowAllClick.bind(this));
        popover.attachAfterClose(this.handleAttachAfterClose.bind(this));
        this.eventAttached = true;
      }
      return this;
    };
    _proto.getCustomDataValue = function getCustomDataValue(key) {
      return this.getCustomData().find(customData => customData.getKey() === key)?.getValue();
    };
    _proto.onBeforeRendering = function onBeforeRendering(e) {
      Token.prototype.onBeforeRendering.apply(this, [e]);
      if (!this.isDescriptionFetched) {
        this.setValueForToken();
      }
      this.isDescriptionFetched = false;
    };
    _proto.attachCloseHandlersForValueStateMessagePopup = function attachCloseHandlersForValueStateMessagePopup() {
      document.addEventListener("click", () => {
        if (this?.valueStateMessage) {
          this.valueStateMessage.close();
        }
      });
      document.addEventListener("touchstart", () => {
        if (this?.valueStateMessage) {
          this.valueStateMessage.close();
        }
      });
    };
    _proto.setValueForToken = function setValueForToken() {
      const tokenSelectedValues = this.items;
      if (tokenSelectedValues.length === 0) {
        this.setProperty("value", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_SELECT_VALUE"), true);
        return;
      }
      const firstSelectedValue = tokenSelectedValues[0];
      const totalSelectedValues = this.calculateTotalSelectedValues(tokenSelectedValues);
      if (totalSelectedValues === 1) {
        this.handleSingleSelectedValue(firstSelectedValue);
      } else {
        this.handleMultipleSelectedValues(totalSelectedValues);
      }
    };
    _proto.calculateTotalSelectedValues = function calculateTotalSelectedValues(tokenSelectedValues) {
      return tokenSelectedValues.reduce((counter, token) => {
        return EasyFilterUtils.isBetweenSelectedValues(token.operator) ? counter + 1 : counter + token.selectedValues.length;
      }, 0);
    };
    _proto.handleSingleSelectedValue = function handleSingleSelectedValue(firstSelectedValue) {
      const tokenInfo = this.getCustomDataValue("TokenInfo");
      const firstOperator = firstSelectedValue?.operator;
      const initSelectedValue = firstSelectedValue.selectedValues[0];
      const selectedValues = firstSelectedValue.selectedValues;
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const requiredMetadata = easyFilterBarContainer?.filterBarMetadata?.find(data => data.name === this.getKey());
      if (!requiredMetadata) {
        return;
      }
      const {
        type,
        dataType
      } = requiredMetadata;
      if (tokenInfo) {
        const {
          key
        } = tokenInfo;
        if (type === "MenuWithCheckBox" || type === "MenuWithSingleSelect") {
          this.setValueForMenu(key);
          return;
        }
        if (type === "ValueHelp") {
          if (EasyFilterUtils.isBetweenSelectedValues(firstOperator)) {
            this.setProperty("value", EasyFilterUtils.mapOperatorForBetweenOperator(firstOperator, selectedValues, type, dataType === "Edm.DateTimeOffset"), true);
          } else {
            this.setProperty("value", EasyFilterUtils.mapOperatorForValueHelp(firstOperator, initSelectedValue, type, dataType === "Edm.DateTimeOffset"), true);
          }
        } else if (EasyFilterUtils.isBetweenSelectedValues(firstOperator)) {
          this.setProperty("value", EasyFilterUtils.mapOperatorForBetweenOperator(firstOperator, selectedValues, type, dataType === "Edm.DateTimeOffset"), true);
        } else {
          this.setProperty("value", EasyFilterUtils.mapOperator(firstOperator, initSelectedValue, type, dataType === "Edm.DateTimeOffset"), true);
        }
      }
    };
    _proto.handleMultipleSelectedValues = function handleMultipleSelectedValues(totalSelectedValues) {
      const tokenInfo = this.getCustomDataValue("TokenInfo");
      if (tokenInfo?.type === "ValueHelp" && totalSelectedValues > 5) {
        totalSelectedValues = 5;
      }
      this.setProperty("value", this.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_ITEMS", [totalSelectedValues]), true);
    };
    _proto.setValueForMenu = function setValueForMenu(key) {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      //The retrieval of codeList might take more time so marking the control as busy until then
      this.setBusy(true);
      (async () => {
        try {
          const description = await this.getDescriptionByKey(easyFilterBarContainer.filterBarMetadata?.find(data => data.name === key), this.items);
          //Rerender the token once the description is fetched
          this.setProperty("value", description);
          this.isDescriptionFetched = true;
          this.setBusy(false);
        } catch (error) {
          Log.error("Error while fetching codeList", error);
        }
      })();
    };
    _proto.getDomRefForValueStateMessage = function getDomRefForValueStateMessage() {
      return this.getDomRef();
    };
    _proto.getDescriptionByKey = async function getDescriptionByKey(data, selectedValues) {
      const codeList = await EasyFilterUtils.getCodeListArray(data.codeList);
      return codeList?.find(list => list.value === selectedValues[0].selectedValues[0])?.description;
    };
    _proto.invokeMenuWithCheckBox = async function invokeMenuWithCheckBox() {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      const codeList = this.getCustomDataValue("codeList");
      const {
        keySpecificSelectedValues
      } = this.getCustomDataValue("TokenInfo");
      if (!this.menuWithCheckBox) {
        this.menuWithCheckBox = new MenuWithCheckBoxFactory(easyFilterBarContainer, this);
      }
      this.innerControl = this.menuWithCheckBox.getControl();
      this.addDependent(this.innerControl);
      await this.menuWithCheckBox.setItems(codeList, keySpecificSelectedValues);
      popover?.removeAllContent();
      popover?.addContent(this.innerControl);
      easyFilterBarContainer?.getShowAllButton()?.setVisible(false);
      this.openPopover();
    };
    _proto.invokeMenuWithSingleSelect = async function invokeMenuWithSingleSelect() {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      const codeList = this.getCustomDataValue("codeList");
      const {
        keySpecificSelectedValues
      } = this.getCustomDataValue("TokenInfo");
      if (!this.menuWithSingleSelect) {
        this.menuWithSingleSelect = new MenuWithSingleSelectFactory(easyFilterBarContainer, this);
      }
      this.innerControl = this.menuWithSingleSelect.getControl();
      this.addDependent(this.innerControl);
      await this.menuWithSingleSelect.setItems(codeList, keySpecificSelectedValues);
      popover.setShowHeader(false);
      popover.getFooter()?.setVisible(false);
      popover?.removeAllContent();
      popover?.addContent(this.innerControl);
      this.openPopover();
    };
    _proto.invokeCalendar = function invokeCalendar() {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      if (!this.calender) {
        this.calender = new CalenderFactory(easyFilterBarContainer, this);
      }
      this.innerControl = this.calender.getControl();
      this.addDependent(this.innerControl);
      popover?.removeAllContent();
      popover?.addContent(this.innerControl);
      easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
      this.openPopover();
    };
    _proto.invokeTime = function invokeTime() {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      if (!this.time) {
        this.time = new TimeFactory(easyFilterBarContainer, this);
      }
      this.innerControl = this.time.getControl();
      this.addDependent(this.innerControl);
      popover?.removeAllContent();
      popover?.addContent(this.innerControl);
      easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
      this.openPopover();
    };
    _proto.invokeValueHelpPreview = function invokeValueHelpPreview() {
      const easyFilterBarContainer = this.getCustomDataValue("easyFilterBarContainer");
      const popover = this.getCustomDataValue("popover");
      if (!this.valueHelpPreview) {
        this.valueHelpPreview = new ValueHelpPreviewFactory(easyFilterBarContainer, this);
      }
      const {
        type,
        dataType
      } = easyFilterBarContainer.filterBarMetadata?.find(data => data.name === this.getKey());
      if (type === "ValueHelp") {
        this.valueHelpPreview.setItems(this.items, type, dataType === "Edm.DateTimeOffset");
      } else {
        this.valueHelpPreview.setItems(this.items, type, dataType === "Edm.DateTimeOffset");
      }
      this.innerControl = this.valueHelpPreview.getControl();
      this.addDependent(this.innerControl);
      popover?.removeAllContent();
      popover?.addContent(this.innerControl);
      easyFilterBarContainer?.getShowAllButton()?.setVisible(true);
      this.openPopover();
    };
    _proto.openPopover = function openPopover() {
      const oPopover = this.getCustomDataValue("popover");
      oPopover?.setTitle(this.label);
      oPopover?.openBy(this);
    };
    _proto.handleOkClick = function handleOkClick() {
      // The below event handler would be invoked on all the tokens when OK button is clicked on the popover
      //Writing the below check so that we know that the current token instance is handling the press events appropriately
      if (!this.innerControl?.getDomRef()) {
        return;
      }
      const {
        type,
        keySpecificSelectedValues
      } = this.getCustomDataValue("TokenInfo");
      const popover = this.getCustomDataValue("popover");
      let okButtonHandler;
      if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        okButtonHandler = this.calender?.invokeOkButtonHandler.bind(this.calender);
      } else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        okButtonHandler = this.time?.invokeOkButtonHandler.bind(this.time);
      } else if (type === "MenuWithCheckBox") {
        okButtonHandler = this.menuWithCheckBox?.invokeOkButtonHandler.bind(this.menuWithCheckBox);
      } else {
        okButtonHandler = this.valueHelpPreview?.invokeOkButtonHandler.bind(this.valueHelpPreview);
      }
      if (okButtonHandler) {
        okButtonHandler();
      }
      popover?.close();
    };
    _proto.handleShowAllClick = function handleShowAllClick() {
      // The below event handler would be invoked on all the tokens when OK button is clicked on the popover
      //Writing the below check so that we know that the current token instance is handling the press events appropriately
      if (!this.innerControl?.getDomRef()) {
        return;
      }
      const popover = this.getCustomDataValue("popover");
      const {
        type,
        keySpecificSelectedValues
      } = this.getCustomDataValue("TokenInfo");
      popover.close();
      let valueHelpHandler;
      if (type === "Calendar" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        valueHelpHandler = this.calender?.invokeShowAllButtonHandler.bind(this.calender);
      } else if (type === "Time" && this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
        valueHelpHandler = this.time?.invokeShowAllButtonHandler.bind(this.time);
      } else {
        valueHelpHandler = this.valueHelpPreview?.invokeShowAllButtonHandler.bind(this.valueHelpPreview);
      }
      if (valueHelpHandler) {
        (() => {
          valueHelpHandler();
        })();
      }
    };
    _proto.handleAttachAfterClose = function handleAttachAfterClose() {
      if (!this.innerControl?.getDomRef()) {
        return;
      }
      const tokenInfo = this.getCustomDataValue("TokenInfo");
      if (tokenInfo) {
        const {
          type,
          keySpecificSelectedValues
        } = this.getCustomDataValue("TokenInfo");
        if (type === "ValueHelp" || (type === "Calendar" || type === "Time") && !this.shouldOpenDefaultFragment(keySpecificSelectedValues)) {
          this.valueHelpPreview?.invokePopupCloseHandler();
        } else if (type === "MenuWithCheckBox") {
          this.menuWithCheckBox?.invokePopupCloseHandler();
        }
      }
    };
    _proto.getInnerControl = function getInnerControl() {
      return this.innerControl;
    };
    _proto.openValueStateMessage = function openValueStateMessage() {
      this.valueStateMessage?.open();
    };
    _proto.closeValueStateMessage = function closeValueStateMessage() {
      this.valueStateMessage?.close();
    };
    _proto.shouldOpenDefaultFragment = function shouldOpenDefaultFragment(keySpecificSelectedValues) {
      //Between and NotBetween cant be handled by default fragments
      const isBetweenOperator = keySpecificSelectedValues.find(selectedValues => selectedValues.operator === FilterOperator.BT || selectedValues.operator === FilterOperator.NB);
      //This first condition would be useful in mandatory token scenario and no value has been set to it
      return keySpecificSelectedValues.length === 0 || keySpecificSelectedValues.length === 1 && keySpecificSelectedValues[0].selectedValues.length === 1 && !isBetweenOperator;
    };
    _proto.focusout = function focusout() {
      this.valueStateMessage?.close();
    };
    EasyFilterToken.render = function render(rm, control) {
      return jsx.renderUsingRenderManager(rm, control, () => {
        const tokenizer = control.getParent();
        const classes = ["sapMToken", "sapFeControlsToken"];
        const classesForLabel = ["sapMTokenText", "sapFeControlsTokenPropertyName"];
        const classesForValue = ["sapMTokenText", "sapFeControlsTokenPropertyValues"];
        const isMandatory = control.getMandatory();
        if (typeof tokenizer?.getEditable === "function" && tokenizer?.getEditable()) {
          classes.push("sapFEControlsPointer");
        }
        if (control.getSelected()) {
          classes.push("sapMTokenSelected");
        }
        if (isMandatory ?? false) {
          classes.push("sapFeControlsTokenMandatory");
          if (control.getValue() === control.resourceBundle.getText("M_EASY_FILTER_MANDATORY_TOKEN_SELECT_VALUE")) {
            classesForValue.push("sapFeControlsTokenMandatory");
          }
        }
        if (control.getValueState() === ValueState.Error) {
          classes.push("sapFeTokenError");
        }
        return _jsxs("div", {
          ref: control,
          class: classes.join(" "),
          "aria-selected": control.getSelected(),
          tabindex: -1,
          "aria-posinset": control.getProperty("posinset"),
          "aria-setsize": control.getProperty("setsize"),
          children: [_jsxs("span", {
            class: classesForLabel.join(" "),
            children: [control.getLabel(), ":"]
          }), _jsx("span", {
            class: classesForValue.join(" "),
            children: control.getValue()
          }), isMandatory === true ? null : control.getAggregation("deleteIcon")]
        });
      });
    };
    return EasyFilterToken;
  }(Token), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "label", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "titlePopover", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "valueStateText", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "mandatory", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "items", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "valueState", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "posinset", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "setsize", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EasyFilterToken;
  return _exports;
}, false);
//# sourceMappingURL=Token-dbg.js.map
