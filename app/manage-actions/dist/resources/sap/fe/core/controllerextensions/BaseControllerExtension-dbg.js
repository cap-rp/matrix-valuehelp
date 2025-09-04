/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/mvc/ControllerExtension"], function (ClassSupport, ControllerExtension) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * A base implementation for controller extension used internally in sap.fe for central functionalities.
   * @public
   * @since 1.118.0
   */
  let BaseControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.BaseControllerExtension"), _dec(_class = /*#__PURE__*/function (_ControllerExtension) {
    function BaseControllerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.init();
      return _this;
    }

    /**
     * This method is called when the controller extension is instantiated.
     * We need to override it for the specific handling for BeforeAsync and AfterAsync methods, otherwise the last level of extension just replace our implementation.
     * @returns The interface for this controller extension
     */
    _exports = BaseControllerExtension;
    _inheritsLoose(BaseControllerExtension, _ControllerExtension);
    var _proto = BaseControllerExtension.prototype;
    _proto.getInterface = function getInterface() {
      var _this2 = this;
      const interfaceObj = _ControllerExtension.prototype.getInterface.call(this);
      const metadata = this.getMetadata();
      const allMethods = metadata.getAllMethods();
      const methodHolder = {};
      for (const methodName in allMethods) {
        const method = allMethods[methodName];
        if (method.overrideExecution && (method.overrideExecution === "AfterAsync" || method.overrideExecution === "BeforeAsync")) {
          methodHolder[methodName] = [interfaceObj[methodName]];
          Object.defineProperty(interfaceObj, methodName, {
            configurable: true,
            set: v => {
              return methodHolder[methodName].push(v);
            },
            get: () => {
              return async function () {
                const methodArrays = methodHolder[methodName];
                if (method.overrideExecution === "BeforeAsync") {
                  methodArrays.reverse();
                }
                let result;
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }
                for (const arg of methodArrays) {
                  result = await arg.apply(_this2, args);
                }
                return result;
              };
            }
          });
        }
      }
      return interfaceObj;
    };
    return BaseControllerExtension;
  }(ControllerExtension)) || _class);
  _exports = BaseControllerExtension;
  return _exports;
}, false);
//# sourceMappingURL=BaseControllerExtension-dbg.js.map
