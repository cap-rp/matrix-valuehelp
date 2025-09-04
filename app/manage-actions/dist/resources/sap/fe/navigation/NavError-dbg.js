/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/base/Object"], function (BaseObject) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.NavError}.<br> An object that provides error handling information during runtime.
   * @public
   * @param {string} errorCode The code for an internal error of a consumer that allows you to track the source locations
   * @since 1.83.0
   */
  let NavError = /*#__PURE__*/function (_BaseObject) {
    /**
     * Constructor requiring the error code as input.
     * @param errorCode String based error code.
     */
    function NavError(errorCode) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this._sErrorCode = errorCode;
      return _this;
    }

    /**
     * Returns the error code with which the instance has been created.
     * @public
     * @returns The error code of the error
     */
    _exports.NavError = NavError;
    _inheritsLoose(NavError, _BaseObject);
    var _proto = NavError.prototype;
    _proto.getErrorCode = function getErrorCode() {
      return this._sErrorCode;
    };
    return NavError;
  }(BaseObject); // Exporting the class as properly typed UI5Class
  _exports.NavError = NavError;
  const UI5Class = BaseObject.extend("sap.fe.navigation.NavError", NavError.prototype);
  return UI5Class;
}, false);
//# sourceMappingURL=NavError-dbg.js.map
