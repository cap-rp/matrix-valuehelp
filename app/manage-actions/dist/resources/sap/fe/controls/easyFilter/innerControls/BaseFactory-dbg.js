/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  let BaseFactory = /*#__PURE__*/function () {
    function BaseFactory(easyFilter, easyFilterToken) {
      // Private property to hold array of items
      this.items = [];
      this.easyFilter = easyFilter;
      this.easyFilterToken = easyFilterToken;
    }
    _exports.BaseFactory = BaseFactory;
    var _proto = BaseFactory.prototype;
    _proto.getItems = function getItems() {
      return this.items;
    };
    _proto.getControl = function getControl() {
      return this.control;
    };
    _proto.setControl = function setControl(control) {
      this.control = control;
    };
    _proto.getEasyFilter = function getEasyFilter() {
      return this.easyFilter;
    };
    _proto.getToken = function getToken() {
      return this.easyFilterToken;
    };
    return BaseFactory;
  }();
  _exports.BaseFactory = BaseFactory;
  return _exports;
}, false);
//# sourceMappingURL=BaseFactory-dbg.js.map
