/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/HBox", "sap/ui/core/StashedControlSupport"], function (ClassSupport, HBox, StashedControlSupport) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let StashableHBox = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.controls.StashableHBox", {
    designtime: "sap/fe/templates/ObjectPage/designtime/StashableHBox.designtime"
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_HBox) {
    function StashableHBox() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _HBox.call(this, ...args) || this;
      /*
       * Title of the Header Facet. Not visible on the UI. Visible on the UI is the Title or Link control inside the items aggregation of the Header Facet.
       * Must always be in sync with the visible Title or Link control.
       */
      _initializerDefineProperty(_this, "title", _descriptor, _this);
      /*
       * Fallback title to be displayed if no title is available (only needed for displaying stashed header facets in Flex dialog)
       */
      _initializerDefineProperty(_this, "fallbackTitle", _descriptor2, _this);
      _initializerDefineProperty(_this, "_disconnected", _descriptor3, _this);
      return _this;
    }
    _inheritsLoose(StashableHBox, _HBox);
    var _proto = StashableHBox.prototype;
    /*
     * Set title of visible Title/Link control and own title property.
     */
    _proto.setTitle = function setTitle(sTitle) {
      const oControl = this.getTitleControl();
      if (oControl) {
        oControl.setText(sTitle);
      }
      this.title = sTitle;
      return this;
    }

    /*
     * Return the title property.
     */;
    _proto.getTitle = function getTitle() {
      return this.title || this.fallbackTitle;
    }

    /*
     * In case of UI changes, Title/Link text needs to be set to new value after Header Facet control and inner controls are rendered.
     * Else: title property needs to be initialized.
     */;
    _proto.onAfterRendering = function onAfterRendering() {
      if (this.title) {
        this.setTitle(this.title);
      } else {
        const oControl = this.getTitleControl();
        if (oControl) {
          this.title = oControl.getText();
        }
      }
    };
    _proto.getControlItems = function getControlItems(items) {
      let aItems = [],
        i;
      if (items) {
        for (i = 0; i < items.length; i++) {
          if (items[i].getItems) {
            aItems = items[i].getItems();
          } else if (items[i].getMicroChartTitle) {
            aItems = items[i].getMicroChartTitle();
          } else if (items[i].getContent().getMicroChartTitle) {
            aItems = items[i].getContent().getMicroChartTitle();
          }
        }
      }
      return aItems;
    }

    /*
     * Retrieves Title/Link control from items aggregation.
     */;
    _proto.getTitleControl = function getTitleControl() {
      let aItems = [],
        content,
        i;
      const items = this.getItems();
      aItems = this.getControlItems(items);
      for (i = 0; i < aItems.length; i++) {
        const item = aItems[i].isA("sap.fe.macros.internal.TitleLink") ? aItems[i].getContent() : aItems[i];
        if (item) {
          if (item.isA("sap.m.Title") || item.isA("sap.m.Link")) {
            if (item.isA("sap.m.Title")) {
              // If a title was found, check if there is a link in the content aggregation
              content = item.getContent();
              if (content && content.isA("sap.m.Link")) {
                return content;
              }
            }
            return item;
          }
        }
      }
      return null;
    };
    _proto.set_disconnected = function set_disconnected(disconnected) {
      this._disconnected = disconnected;
      // By setting the binding context to `null` we are preventing data loading
      // Setting it back to `undefined` ensures that the parent context is applied
      if (disconnected) {
        this.setBindingContext(null);
      } else {
        this.setBindingContext(undefined);
      }
      return this;
    }

    /*
     * Retrieves label controls from items aggregation.
     */;
    _proto.getFormLabels = function getFormLabels() {
      // NOTE: Present implementation only supports for direct ReferenceFacets(VBox) in UI.Facets as per the requirement for getting Labels from forms.
      const ret = [],
        formVBox = this.getItems && this.getItems()[0];

      // VBox is equivalent of form
      if (formVBox?.isA("sap.m.VBox")) {
        formVBox.getItems().forEach(formElementHBox => {
          // HBox is equivalent of form element
          if (formElementHBox.isA("sap.m.HBox")) {
            const labelCtrl = formElementHBox.getItems()[0];
            if (labelCtrl?.isA("sap.m.Label")) {
              // First element is label
              ret.push(labelCtrl);
            }
          }
        });
      }
      return ret;
    };
    return StashableHBox;
  }(HBox), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "fallbackTitle", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_disconnected", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  StashedControlSupport.mixInto(StashableHBox);
  return StashableHBox;
}, false);
//# sourceMappingURL=StashableHBox-dbg.js.map
