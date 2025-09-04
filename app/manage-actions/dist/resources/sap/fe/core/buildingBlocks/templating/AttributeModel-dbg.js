/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/ui/model/json/JSONModel"], function (Log, ObjectPath, JSONModel) {
  "use strict";

  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Special JSONModel that is used to store the attribute model for the building block.
   * It has specific handling for undefinedValue mapping
   */
  let AttributeModel = /*#__PURE__*/function (_JSONModel) {
    function AttributeModel(oNode, oProps, BuildingBlockClass) {
      var _this;
      _this = _JSONModel.call(this) || this;
      _this.oNode = oNode;
      _this.oProps = oProps;
      _this.BuildingBlockClass = BuildingBlockClass;
      _this.$$valueAsPromise = true;
      return _this;
    }
    _inheritsLoose(AttributeModel, _JSONModel);
    var _proto = AttributeModel.prototype;
    _proto._getObject = function _getObject(sPath, oContext) {
      if (sPath === undefined || sPath === "") {
        if (oContext !== undefined && oContext.getPath() !== "/") {
          return this._getObject(oContext.getPath(sPath));
        }
        return this.oProps;
      }
      if (sPath === "/undefinedValue" || sPath === "undefinedValue") {
        return undefined;
      }
      // just return the attribute - we can't validate them, and we don't support aggregations for now
      const oValue = ObjectPath.get(sPath.replace(/\//g, "."), this.oProps);
      if (oValue !== undefined) {
        return oValue;
      }
      // Deal with undefined properties
      if (this.oProps.hasOwnProperty(sPath)) {
        return this.oProps[sPath];
      }
      if (!sPath.includes(":") && !sPath.includes("/")) {
        // Gloves are off, if you have this error you forgot to decorate your property with @blockAttribute but are still using it in underlying templating
        Log.error(`Missing property ${sPath} on building block metadata ${this.BuildingBlockClass.name}`);
      }
      return this.oNode.getAttribute(sPath);
    };
    return AttributeModel;
  }(JSONModel);
  return AttributeModel;
}, false);
//# sourceMappingURL=AttributeModel-dbg.js.map
