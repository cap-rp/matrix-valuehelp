/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/macros/controls/BuildingBlockObjectProperty"], function (ClassSupport, BuildingBlockObjectProperty) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Share Options.
   * @public
   */
  let ShareOptions = (_dec = defineUI5Class("sap.fe.macros.share.ShareOptions"), _dec2 = property({
    type: "boolean",
    isBindingInfo: true
  }), _dec3 = property({
    type: "boolean",
    isBindingInfo: true
  }), _dec4 = property({
    type: "boolean",
    isBindingInfo: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockObjectP) {
    function ShareOptions(idOrProps, props) {
      var _this;
      let checkProps = props;
      if (typeof idOrProps !== "string") {
        checkProps = idOrProps;
      }
      const showSendEmail = checkProps?.showSendEmail;
      const showCollaborationManager = checkProps?.showCollaborationManager;
      const showMsTeamsOptions = checkProps?.showMsTeamsOptions;
      _this = _BuildingBlockObjectP.call(this, idOrProps, props) || this; // Ignore incoming binding resolution
      _initializerDefineProperty(_this, "showSendEmail", _descriptor, _this);
      _initializerDefineProperty(_this, "showCollaborationManager", _descriptor2, _this);
      _initializerDefineProperty(_this, "showMsTeamsOptions", _descriptor3, _this);
      _this.showSendEmail = showSendEmail;
      _this.showCollaborationManager = showCollaborationManager;
      _this.showMsTeamsOptions = showMsTeamsOptions;
      return _this;
    }
    _exports = ShareOptions;
    _inheritsLoose(ShareOptions, _BuildingBlockObjectP);
    return ShareOptions;
  }(BuildingBlockObjectProperty), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "showSendEmail", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "showCollaborationManager", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showMsTeamsOptions", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ShareOptions;
  return _exports;
}, false);
//# sourceMappingURL=ShareOptions-dbg.js.map
