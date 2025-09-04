/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/macros/Field"], function (Log, ClassSupport, FieldBlock) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block for creating a field based on the metadata provided by OData V4.
   * <br>
   * Usually, a DataField or DataPoint annotation is expected, but the field can also be used to display a property from the entity type.
   * When creating a Field building block, you must provide an ID to ensure everything works correctly.
   *
   * Usage example:
   * <pre>
   * sap.ui.require(["sap/fe/macros/field/Field"], function(Field) {
   * 	 ...
   * 	 new Field("MyField", {metaPath:"MyProperty"})
   * })
   * </pre>
   *
   * This is currently an experimental API because the structure of the generated content will change to come closer to the Field that you get out of templates.
   * The public method and property will not change but the internal structure will so be careful on your usage.
   * @public
   * @experimental
   * @mixes sap.fe.macros.Field
   * @augments sap.ui.core.Control
   * @deprecatedsince 1.135
   * @deprecated Use {@link sap.fe.macros.Field} instead
   */
  let Field = (_dec = defineUI5Class("sap.fe.macros.field.Field"), _dec(_class = /*#__PURE__*/function (_FieldBlock) {
    function Field(props, others) {
      Log.warning("You've consumed deprecated Field class. Use sap.fe.macros.field.Field instead");
      return _FieldBlock.call(this, props, others) || this;
    }
    _exports = Field;
    _inheritsLoose(Field, _FieldBlock);
    return Field;
  }(FieldBlock)) || _class);
  _exports = Field;
  return _exports;
}, false);
//# sourceMappingURL=Field-dbg.js.map
