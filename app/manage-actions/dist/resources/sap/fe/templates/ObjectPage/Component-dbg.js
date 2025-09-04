/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateComponent", "sap/fe/core/library", "sap/fe/templates/ObjectPage/ExtendPageDefinition", "sap/fe/templates/library"], function (Log, ClassSupport, CommonUtils, TemplateComponent, CoreLibrary, ExtendPageDefinition, templateLib) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11;
  var extendObjectPageDefinition = ExtendPageDefinition.extendObjectPageDefinition;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const VariantManagement = CoreLibrary.VariantManagement,
    CreationMode = CoreLibrary.CreationMode;
  const SectionLayout = templateLib.ObjectPage.SectionLayout;
  let ObjectPageComponent = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.Component", {
    library: "sap.fe.templates",
    manifest: "json"
  }), _dec2 = property({
    type: "sap.fe.core.VariantManagement",
    defaultValue: VariantManagement.None
  }), _dec3 = property({
    type: "sap.fe.templates.ObjectPage.SectionLayout",
    defaultValue: SectionLayout.Page
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "object"
  }), _dec6 = property({
    type: "object"
  }), _dec7 = property({
    type: "boolean",
    defaultValue: true
  }), _dec8 = property({
    type: "boolean",
    defaultValue: false
  }), _dec9 = property({
    type: "boolean",
    defaultValue: true
  }), _dec10 = property({
    type: "object"
  }), _dec11 = property({
    type: "boolean"
  }), _dec12 = property({
    type: "boolean",
    defaultValue: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_TemplateComponent) {
    function ObjectPageComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _TemplateComponent.call(this, ...args) || this;
      /**
       * Defines if and on which level variants can be configured:
       * 		None: no variant configuration at all
       * 		Page: one variant configuration for the whole page
       * 		Control: variant configuration on control level
       */
      _initializerDefineProperty(_this, "variantManagement", _descriptor, _this);
      /**
       * Defines how the sections are rendered
       * 		Page: all sections are shown on one page
       * 		Tabs: each top-level section is shown in an own tab
       */
      _initializerDefineProperty(_this, "sectionLayout", _descriptor2, _this);
      /**
       * Enables the related apps features
       */
      _initializerDefineProperty(_this, "showRelatedApps", _descriptor3, _this);
      /**
       * Enables the 'Microsoft Teams > As Card' option in the 'Share' menu
       */
      _initializerDefineProperty(_this, "share", _descriptor4, _this);
      _initializerDefineProperty(_this, "additionalSemanticObjects", _descriptor5, _this);
      /**
       * Enables the editable object page header
       */
      _initializerDefineProperty(_this, "editableHeaderContent", _descriptor6, _this);
      /**
       * Shows a text instead of an IllustratedMessage in the noData aggregation of Tables or Charts
       */
      _initializerDefineProperty(_this, "useTextForNoDataMessages", _descriptor7, _this);
      /**
       * Enables the BreadCrumbs features
       */
      _initializerDefineProperty(_this, "showBreadCrumbs", _descriptor8, _this);
      /**
       * Defines the properties which can be used for inbound Navigation
       */
      _initializerDefineProperty(_this, "inboundParameters", _descriptor9, _this);
      /**
       * Defines if an object page should be opened in edit mode
       */
      _initializerDefineProperty(_this, "openInEditMode", _descriptor10, _this);
      _initializerDefineProperty(_this, "enableLazyLoading", _descriptor11, _this);
      _this.DeferredContextCreated = false;
      return _this;
    }
    _inheritsLoose(ObjectPageComponent, _TemplateComponent);
    var _proto = ObjectPageComponent.prototype;
    _proto.isContextExpected = function isContextExpected() {
      return true;
    };
    _proto.extendPageDefinition = function extendPageDefinition(pageDefinition, converterContext) {
      return extendObjectPageDefinition(pageDefinition, converterContext);
    }

    // TODO: this should be ideally be handled by the editflow/routing without the need to have this method in the
    // object page - for now keep it here
    ;
    _proto.createDeferredContext = function createDeferredContext(sPath, oListBinding, parentContext, data, bActionCreate) {
      if (!this.DeferredContextCreated) {
        this.DeferredContextCreated = true;
        const oParameters = {
          $$groupId: "$auto.Heroes",
          $$updateGroupId: "$auto"
        };
        if (!oListBinding) {
          oListBinding = this.getModel().bindList(sPath.replace("(...)", ""), undefined, undefined, undefined, oParameters);
        }
        const oStartUpParams = this.oAppComponent && this.oAppComponent.getComponentData() && this.oAppComponent.getComponentData().startupParameters,
          oInboundParameters = this.getViewData().inboundParameters;
        let createParams;
        if (oStartUpParams && oStartUpParams.preferredMode && oStartUpParams.preferredMode[0].includes("create")) {
          createParams = Object.assign({}, data, CommonUtils.getAdditionalParamsForCreate(oStartUpParams, oInboundParameters));
        } else {
          createParams = data;
        }

        // for now wait until the view and the controller is created
        this.getRootControl().getController().editFlow.createDocument(oListBinding, {
          creationMode: CreationMode.Sync,
          createAction: bActionCreate,
          data: createParams,
          bFromDeferred: true,
          selectedContexts: parentContext ? [parentContext] : undefined
        }).finally(() => {
          this.DeferredContextCreated = false;
        }).catch(function () {
          // Do Nothing ?
        });
      }
    };
    _proto.setVariantManagement = function setVariantManagement(sVariantManagement) {
      if (sVariantManagement === VariantManagement.Page) {
        Log.error("ObjectPage does not support Page-level variant management yet");
        sVariantManagement = VariantManagement.None;
      }
      this.setProperty("variantManagement", sVariantManagement);
    }

    /**
     * Checks if openInEditMode is defined in the manifest settings
     * @returns a boolean indicating if edit mode is set for an object page
     */;
    _proto.isOpenInEditMode = function isOpenInEditMode() {
      const openInEditMode = this.getViewData().openInEditMode;
      return openInEditMode === true;
    };
    return ObjectPageComponent;
  }(TemplateComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "sectionLayout", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "showRelatedApps", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "share", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "additionalSemanticObjects", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "editableHeaderContent", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "useTextForNoDataMessages", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "showBreadCrumbs", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "inboundParameters", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "openInEditMode", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "enableLazyLoading", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ObjectPageComponent;
}, false);
//# sourceMappingURL=Component-dbg.js.map
