/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/deepClone", "sap/base/util/merge", "sap/base/util/uid", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/templating/DataModelPathHelper", "sap/ui/base/ManagedObject", "sap/ui/core/Component"], function (deepClone, merge, uid, ClassSupport, BuildingBlock, ConverterContext, ManifestWrapper, DataModelPathHelper, ManagedObject, Component) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _MacroAPI;
  var bindingParser = ManagedObject.bindingParser;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Base API control for building blocks.
   * @hideconstructor
   * @public
   */
  let MacroAPI = (_dec = defineUI5Class("sap.fe.macros.MacroAPI"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = (_MacroAPI = /*#__PURE__*/function (_BuildingBlock) {
    function MacroAPI(mSettings, others) {
      var _this;
      _this = _BuildingBlock.call(this, mSettings, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "content", _descriptor2, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor4, _this);
      _this.parentContextToBind = {};
      return _this;
    }
    _inheritsLoose(MacroAPI, _BuildingBlock);
    var _proto = MacroAPI.prototype;
    _proto.applySettings = function applySettings(mSettings, oScope) {
      // Cleanup events
      if (mSettings) {
        const eventsKeys = Object.keys(this.getMetadata().getEvents());
        for (const eventsKey of eventsKeys) {
          if (mSettings[eventsKey] === undefined) {
            delete mSettings[eventsKey];
          }
        }
      }
      return _BuildingBlock.prototype.applySettings.call(this, mSettings, oScope);
    };
    _proto.init = function init() {
      _BuildingBlock.prototype.init.call(this);
      if (!this.getModel("_pageModel")) {
        const oPageModel = Component.getOwnerComponentFor(this)?.getModel("_pageModel");
        if (oPageModel) {
          this.setModel(oPageModel, "_pageModel");
        }
      }
    };
    /**
     * Set or bind a property.
     * @param propertyName The name of the property
     * @param value The value of the property
     */
    _proto.setOrBindProperty = function setOrBindProperty(propertyName, value) {
      if (value !== undefined) {
        const parsedExpression = bindingParser(value);
        if (parsedExpression) {
          this.bindProperty(propertyName, parsedExpression);
        } else {
          if (this.getMetadata().getProperty(propertyName)?.type === "boolean" && typeof value === "string") {
            value = value === "true";
          }
          this.setProperty(propertyName, value);
        }
      }
    }

    /**
     * Retrieve a Converter Context.
     * @param dataModelObjectPath
     * @param contextPath
     * @param settings
     * @param extraParams
     * @returns A Converter Context
     */;
    /**
     * Keep track of a binding context that should be assigned to the parent of that control.
     * @param modelName The model name that the context will relate to
     * @param path The path of the binding context
     */
    _proto.setParentBindingContext = function setParentBindingContext(modelName, path) {
      this.parentContextToBind[modelName] = path;
    };
    _proto.setParent = function setParent() {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _BuildingBlock.prototype.setParent.call(this, ...args);
      Object.keys(this.parentContextToBind).forEach(modelName => {
        this.getParent().bindObject({
          path: this.parentContextToBind[modelName],
          model: modelName,
          events: {
            change: function () {
              const oBoundContext = this.getBoundContext();
              if (oBoundContext && !oBoundContext.getObject()) {
                oBoundContext.setProperty("", {});
              }
            }
          }
        });
      });
    };
    return MacroAPI;
  }(BuildingBlock), _MacroAPI.namespace = "sap.fe.macros", _MacroAPI.macroName = "Macro", _MacroAPI.fragment = "sap.fe.macros.Macro", _MacroAPI.hasValidation = true, _MacroAPI.getConverterContext = function (dataModelObjectPath, contextPath, settings, extraParams) {
    const appComponent = settings.appComponent;
    const originalViewData = settings.models.viewData?.getData();
    let viewData = Object.assign({}, originalViewData);
    delete viewData.resourceModel;
    delete viewData.appComponent;
    viewData = deepClone(viewData);
    let controlConfiguration = {};

    // Only merge in page control configuration if the building block is on the same context
    const relativePath = getTargetObjectPath(dataModelObjectPath.contextLocation ?? dataModelObjectPath);
    const entitySetName = dataModelObjectPath.contextLocation?.targetEntitySet?.name ?? dataModelObjectPath.targetEntitySet?.name;
    if (relativePath === originalViewData?.contextPath || relativePath === `/${originalViewData?.entitySet}` || entitySetName === originalViewData?.entitySet) {
      controlConfiguration = viewData.controlConfiguration;
    }
    viewData.controlConfiguration = merge(controlConfiguration, extraParams || {});
    return ConverterContext.createConverterContextForMacro(dataModelObjectPath.startingEntitySet.name, settings.models.metaModel, appComponent?.getDiagnostics(), merge, dataModelObjectPath.contextLocation, new ManifestWrapper(viewData, appComponent));
  }, _MacroAPI.createBindingContext = function (oData, mSettings) {
    const sContextPath = `/uid--${uid()}`;
    mSettings.models.converterContext.setProperty(sContextPath, oData);
    return mSettings.models.converterContext.createBindingContext(sContextPath);
  }, _MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return MacroAPI;
}, false);
//# sourceMappingURL=MacroAPI-dbg.js.map
