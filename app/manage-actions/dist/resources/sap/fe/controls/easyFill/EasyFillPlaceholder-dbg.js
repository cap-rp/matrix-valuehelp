/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx", "sap/ui/core/Control", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, jsx, Control, _jsx) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let EasyFillPlaceholder = (_dec = defineUI5Class("sap.fe.controls.easyFill.EasyFillPlaceholder"), _dec(_class = /*#__PURE__*/function (_Control) {
    function EasyFillPlaceholder() {
      return _Control.apply(this, arguments) || this;
    }
    _exports = EasyFillPlaceholder;
    _inheritsLoose(EasyFillPlaceholder, _Control);
    EasyFillPlaceholder.render = function render(rm, control) {
      jsx.renderUsingRenderManager(rm, control, () => {
        return _jsx("div", {
          ref: control,
          class: "sapFeEasyFillPlaceholder"
        });
      });
    };
    return EasyFillPlaceholder;
  }(Control)) || _class);
  _exports = EasyFillPlaceholder;
  return _exports;
}, false);
//# sourceMappingURL=EasyFillPlaceholder-dbg.js.map
