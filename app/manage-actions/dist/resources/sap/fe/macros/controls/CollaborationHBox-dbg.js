/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/HBox"], function (ClassSupport, HBox) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let CollaborationHBox = (_dec = defineUI5Class("sap.fe.macros.controls.CollaborationHBox"), _dec(_class = /*#__PURE__*/function (_HBox) {
    function CollaborationHBox() {
      return _HBox.apply(this, arguments) || this;
    }
    _inheritsLoose(CollaborationHBox, _HBox);
    var _proto = CollaborationHBox.prototype;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(_oElement, mAriaProps) {
      const oParent = this.getParent();
      if (oParent && oParent.enhanceAccessibilityState) {
        // forward  enhanceAccessibilityState call to the parent
        oParent.enhanceAccessibilityState(_oElement, mAriaProps);
      }
      return mAriaProps;
    };
    return CollaborationHBox;
  }(HBox)) || _class);
  return CollaborationHBox;
}, false);
//# sourceMappingURL=CollaborationHBox-dbg.js.map
