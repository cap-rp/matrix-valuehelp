/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/FlexBox", "sap/m/HeaderContainer", "sap/ui/Device", "sap/ui/core/library", "sap/ui/mdc/filterbar/IFilterContainer"], function (ClassSupport, FlexBox, HeaderContainer, Device, coreLibrabry, IFilterContainer) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Constructor for a new Visual Filter Container.
   * Used for visual filters.
   *
   */
  let VisualFilterContainer = (_dec = defineUI5Class("sap.fe.macros.controls.filterbar.VisualFilterContainer"), _dec2 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    visibility: "hidden"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_IFilterContainer) {
    function VisualFilterContainer() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _IFilterContainer.call(this, ...args) || this;
      _initializerDefineProperty(_this, "_layout", _descriptor, _this);
      _this.aVisualFilterFields = {};
      return _this;
    }
    _inheritsLoose(VisualFilterContainer, _IFilterContainer);
    var _proto = VisualFilterContainer.prototype;
    _proto.init = function init() {
      _IFilterContainer.prototype.init.call(this);
      const Orientation = coreLibrabry.Orientation;
      const sOrientation = Device.system.phone ? Orientation.Vertical : undefined;
      const sDirection = Device.system.phone ? "ColumnReverse" : "Column";
      this.oHeaderContainer = new HeaderContainer({
        orientation: sOrientation
      });
      this.oButtonFlexBox = new FlexBox({
        alignItems: "End",
        justifyContent: "End"
      });
      this.oLayout = new FlexBox({
        direction: sDirection,
        // Direction is Column Reverse for Phone
        items: [this.oHeaderContainer, this.oButtonFlexBox]
      });
      this.oLayout.setParent(this);
      this.aAllFilterFields = [];
      this.aVisualFilterFields = {};
    };
    _proto.exit = function exit() {
      // destroy layout
      _IFilterContainer.prototype.exit.call(this);
      // destroy all filter fields which are not in the layout
      const aAllFilterFields = this.getAllFilterFields();
      aAllFilterFields.forEach(function (oFilterField) {
        oFilterField.destroy();
      });
      this.oHeaderContainer = undefined;
      this.oButtonFlexBox = undefined;
      this.aAllFilterFields = [];
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ;
    _proto.insertFilterField = function insertFilterField(oControl, iIndex) {
      const oFilterItemLayoutEventDelegate = {
        onBeforeRendering: function () {
          // visual filter does not need to render a label
          // hence override the getContent of the FilterItemLayout
          // and store the original getContent for later usage in the compact filters
          if (!oControl._fnGetContentCopy) {
            oControl._fnGetContentCopy = oControl.getContent;
          }
          // override getContent of FilterItemLayout
          // to add only filterField and not label
          oControl.getContent = function () {
            const aContent = [];
            aContent.push(oControl._oFilterField);
            return aContent;
          };
          oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
        }
      };
      oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

      // Setting VF control for the Filterfield.
      const oVisualFilters = this.aVisualFilterFields;
      oControl.getContent().some(oInnerControl => {
        const sFFId = oInnerControl.getId();
        if (oVisualFilters && oVisualFilters[sFFId] && oInnerControl.isA("sap.ui.mdc.FilterField")) {
          oInnerControl.setContent(oVisualFilters[sFFId]);
          this.oHeaderContainer.insertContent(oControl, iIndex);
        }
      });
    };
    _proto.removeFilterField = function removeFilterField(oControl) {
      this.oHeaderContainer.removeContent(oControl);
    };
    _proto.removeAllFilterFields = function removeAllFilterFields() {
      this.aAllFilterFields = [];
      this.aVisualFilterFields = {};
      this.oHeaderContainer.removeAllContent();
    };
    _proto.getFilterFields = function getFilterFields() {
      return this.oHeaderContainer.getContent();
    };
    _proto.addButton = function addButton(oControl) {
      this.oButtonFlexBox.addItem(oControl);
    };
    _proto.getAllButtons = function getAllButtons() {
      return this.oButtonFlexBox.getItems().reverse();
    };
    _proto.removeButton = function removeButton(oControl) {
      this.oButtonFlexBox.removeItem(oControl);
    };
    _proto.getAllFilterFields = function getAllFilterFields() {
      return this.aAllFilterFields.filter(filterFieldLayout => !filterFieldLayout.isDestroyed());
    };
    _proto.setAllFilterFields = function setAllFilterFields(aFilterFields, aVisualFilterFields) {
      this.aAllFilterFields = aFilterFields;
      this.aVisualFilterFields = aVisualFilterFields;
    };
    return VisualFilterContainer;
  }(IFilterContainer), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "_layout", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return VisualFilterContainer;
}, false);
//# sourceMappingURL=VisualFilterContainer-dbg.js.map
