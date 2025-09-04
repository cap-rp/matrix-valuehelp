/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/contact/ContactHelper", "sap/ui/mdc/Field", "sap/ui/mdc/Link", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, StableIdHelper, DataModelPathHelper, ContactHelper, MdcField, MdcLink, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var getMsTeamsMail = ContactHelper.getMsTeamsMail;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var generate = StableIdHelper.generate;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let Contact = (_dec = defineUI5Class("sap.fe.macros.contact.Contact"), _dec2 = association({
    type: "string"
  }), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "boolean"
  }), _dec6 = association({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function Contact(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * Prefix added to the generated ID of the field
       */
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _this);
      /**
       * Metadata path to the dataPoint.
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      _initializerDefineProperty(_this, "showEmptyIndicator", _descriptor4, _this);
      _initializerDefineProperty(_this, "_flexId", _descriptor5, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = Contact;
    _inheritsLoose(Contact, _BuildingBlock);
    var _proto = Contact.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        const content = this.createContent();
        if (content) {
          this.content = content;
        }
      }
    }

    /**
     * Gets the current enablement state of the contact.
     * @returns Boolean value with the enablement state
     */;
    _proto.getEnabled = function getEnabled() {
      return true;
    };
    _proto.createContent = function createContent() {
      let id;
      if (this._flexId) {
        //in case a flex id is given, take this one
        id = this._flexId;
      } else {
        //alternatively check for idPrefix and generate an appropriate id
        id = this.idPrefix ? generate([this.idPrefix, "Field-content"]) : undefined;
      }
      const contactDataModelObjectPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (!contactDataModelObjectPath) {
        return null;
      }
      const isNaturalPerson = !!contactDataModelObjectPath.targetEntityType?.annotations?.Common?.IsNaturalPerson?.valueOf();
      const value = getExpressionFromAnnotation(contactDataModelObjectPath.targetObject?.fn, getRelativePaths(contactDataModelObjectPath));
      const delegateConfiguration = {
        name: "sap/fe/macros/contact/ContactDelegate",
        payload: {
          contact: this.metaPath,
          mail: getMsTeamsMail(contactDataModelObjectPath),
          isNaturalPerson: isNaturalPerson
        }
      };
      return _jsx(MdcField, {
        delegate: {
          name: "sap/fe/macros/field/FieldBaseDelegate"
        },
        id: id,
        editMode: "Display",
        width: "100%",
        showEmptyIndicator: this.showEmptyIndicator,
        value: compileExpression(value),
        multipleLines: true,
        children: {
          fieldInfo: _jsx(MdcLink, {
            enablePersonalization: "false",
            delegate: delegateConfiguration
          })
        }
      });
    }

    /**
     * Retrieves the current value of the datapoint.
     * @returns The current value of the datapoint
     */;
    _proto.getValue = function getValue() {
      return this.content?.getValue();
    };
    return Contact;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "showEmptyIndicator", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "_flexId", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = Contact;
  return _exports;
}, false);
//# sourceMappingURL=Contact-dbg.js.map
