/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BuildingBlockBase", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MetaPath", "sap/fe/core/helpers/StableIdHelper", "sap/ui/core/Component", "sap/ui/core/ElementRegistry"], function (Log, BuildingBlockBase, ClassSupport, HookSupport, MetaModelConverter, MetaPath, StableIdHelper, Component, ElementRegistry) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor, _BuildingBlock;
  var generate = StableIdHelper.generate;
  var getMetaModelById = MetaModelConverter.getMetaModelById;
  var getInvolvedDataModelObjectsForTargetPath = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath;
  var convertTypes = MetaModelConverter.convertTypes;
  var removeControllerExtensionHookHandlers = HookSupport.removeControllerExtensionHookHandlers;
  var initControllerExtensionHookHandlers = HookSupport.initControllerExtensionHookHandlers;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Defines a control that will not exist in the DOM.
   * Instead, only its child will be there and this control will forward all DOM related instruction to it.
   * @experimental
   * @since 1.121.0
   * @public
   */
  let BuildingBlock = (_dec = defineUI5Class("sap.fe.core.buildingBlocks.BuildingBlock"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = (_BuildingBlock = /*#__PURE__*/function (_BuildingBlockBase) {
    function BuildingBlock(settings, others) {
      var _this;
      _this = _BuildingBlockBase.call(this, settings, others) || this;
      /**
       * The metamodel name or id to be used for this building block
       */
      _initializerDefineProperty(_this, "metaModel", _descriptor, _this);
      _this._applyingSettings = false;
      _this.notifyBBObservers();
      return _this;
    }
    _inheritsLoose(BuildingBlock, _BuildingBlockBase);
    var _proto = BuildingBlock.prototype;
    _proto.applySettings = function applySettings(mSettings, oScope) {
      this._applyingSettings = true;
      _BuildingBlockBase.prototype.applySettings.call(this, mSettings, oScope);
      this._applyingSettings = false;
      this._checkIfMetadataReady(true);
      return this;
    };
    _proto.notifyBBObservers = function notifyBBObservers() {
      let destroy = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      const bbobserverMap = BuildingBlock._bbobserverMap.get(this.getId());
      if (bbobserverMap && bbobserverMap.length > 0) {
        for (const observeBB of bbobserverMap) {
          if (destroy) {
            if (observeBB.onDestroy) {
              observeBB.onDestroy(this);
            }
          } else if (observeBB.onAvailable) {
            observeBB.onAvailable(this);
          }
        }
      }
    }

    /**
     * Allows to observe building block once it is created.
     * @param id The id of the building block which will be observed
     * @param parameters The id of the building block which is being requsted
     * @param parameters.onAvailable Callback which is called with the instance of the BB when it is available
     * @param parameters.onDestroy Callback which is called with the instance of the BB when it is destroyed
     */;
    BuildingBlock.observeBuildingBlock = function observeBuildingBlock(id, parameters) {
      //if (parameters)
      const element = ElementRegistry.get(id);
      // if the element is already registered
      if (element) {
        if (parameters.onAvailable) {
          parameters.onAvailable(element);
        }
      } else {
        const bbobserverMap = BuildingBlock._bbobserverMap.get(id);
        if (bbobserverMap) {
          bbobserverMap.push(parameters);
        } else {
          BuildingBlock._bbobserverMap.set(id, [parameters]);
        }
      }
    }

    /**
     * Get the instance of a building block based once it is registered.
     * @param id The id of the building block which is being requsted
     * @returns Promise resolved with an instance of the building block once it is registered/instantied.
     * 	 The promise is resolved when the building block is intantied hence it recommended to only await on the promise
     * 	 when it is known that the building block will be available. In cases here the building block might not be available,
     * 	 for example becuase of lazy loading, then it is recommended not to await on the promise and instead use Promise.then().
     */;
    _proto._getOwner = function _getOwner() {
      //eslint-disable-next-line @typescript-eslint/no-this-alias
      let control = this;
      let owner = Component.getOwnerComponentFor(control);
      while (!owner && control && !control.isA("sap.ui.core.mvc.View")) {
        control = control.getParent();
        if (control) {
          owner = Component.getOwnerComponentFor(control);
        }
      }
      if (owner?.isA("sap.fe.core.TemplateComponent")) {
        return owner;
      }
      if (owner?.isA("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent")) {
        return owner;
      }
    }

    /*
     * Get the page controller instance
     * @param logError Whether to log an error if the page controller is not found
     * @returns The page controller instance
     */;
    _proto.getPageController = function getPageController() {
      let logError = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
      const pageController = this._getOwner()?.getRootController?.();
      if (!pageController && logError) {
        Log.error("No sap.fe.core.PageController found");
      }
      return pageController;
    };
    _proto.getMetaModel = function getMetaModel() {
      const owner = this._getOwner();
      if (owner?.isA("sap.fe.core.buildingBlocks.IBuildingBlockOwnerComponent")) {
        let metaModel = owner?.getMetaModel(this.metaModel);
        // Fallback in case they don't apply the logic for the metamodel converter
        if (!metaModel && this.metaModel?.startsWith("id-")) {
          metaModel = getMetaModelById(this.metaModel);
        }
        return metaModel;
      } else {
        return owner?.getMetaModel(this.metaModel);
      }
    };
    _proto.destroy = function destroy(suppressInvalidate) {
      if (this.isA("sap.fe.core.controllerextensions.viewState.IViewStateContributor")) {
        this.getPageController(false)?.viewState?.deregisterStateContributor(this);
      }
      if (this.getPageController(false)) {
        removeControllerExtensionHookHandlers(this, this.getPageController());
      }
      this.notifyBBObservers(true);
      _BuildingBlockBase.prototype.destroy.call(this, suppressInvalidate);
    };
    _proto._checkIfMetadataReady = function _checkIfMetadataReady() {
      let fromApplySettings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      const owner = this._getOwner();
      if (owner) {
        this.onMetadataAvailable(owner);
        if (this.isA("sap.fe.core.controllerextensions.viewState.IViewStateContributor")) {
          this.getPageController()?.viewState.registerStateContributor(this);
        }
        if (this.getPageController()) {
          initControllerExtensionHookHandlers(this, this.getPageController());
        }
      } else {
        if (!fromApplySettings && !this.content) {
          // In case couldn't create the content during the applySettings, try again
          Log.warning("The building block was not created within an ExtensionAPI.runWithFPMContext call, for performance reason it's recommended to do so.", this);
        }
        this.attachEventOnce("modelContextChange", function () {
          this._checkIfMetadataReady();
        });
      }
    };
    _proto.clone = function clone(sIdSuffix, aLocalIds) {
      const owner = this._getOwner();
      if (owner) {
        return owner.runAsOwner(() => {
          return _BuildingBlockBase.prototype.clone.call(this, sIdSuffix, aLocalIds);
        });
      } else {
        return _BuildingBlockBase.prototype.clone.call(this, sIdSuffix, aLocalIds);
      }
    };
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      // To be overriden by the child class
    };
    _proto.getAppComponent = function getAppComponent() {
      const owner = this._getOwner();
      return owner?.getAppComponent();
    };
    _proto.getDataModelObjectPath = function getDataModelObjectPath(targetPath) {
      const metaModel = this.getMetaModel();
      const targetPathToUse = targetPath ?? this.getOwnerContextPath();
      return getInvolvedDataModelObjectsForTargetPath(targetPathToUse, metaModel);
    }

    /**
     * Retrieves the context path from the owner component.
     * @returns The context path
     */;
    _proto.getOwnerContextPath = function getOwnerContextPath() {
      const owner = this._getOwner();
      return owner.getFullContextPath(this.metaModel);
    }

    /**
     * Get the data model object for the given metapath and optional contextPath.
     * @param metapath
     * @param contextPath
     * @returns The data model object path
     */;
    _proto.getDataModelObjectForMetaPath = function getDataModelObjectForMetaPath(metapath, contextPath) {
      const metaModel = this.getMetaModel();
      const contextPathToUse = this.getComputedContextPath(contextPath);
      let resolvedContextPath;
      if (contextPathToUse) {
        resolvedContextPath = contextPathToUse.endsWith("/") ? contextPathToUse : contextPathToUse + "/";
      }
      if (!metaModel || !(resolvedContextPath || metapath.charAt(0) === "/")) {
        throw new Error("No metamodel or metapath is not reachable with contextPath");
      }
      let metaContext = resolvedContextPath ? metaModel.createBindingContext(resolvedContextPath) : undefined;
      metaContext = metaContext ? metaContext : undefined;
      const metaPathContext = metaModel.createBindingContext(metapath, metaContext);
      return metaPathContext ? MetaModelConverter.getInvolvedDataModelObjects(metaPathContext, metaContext) : undefined;
    };
    _proto.getComputedContextPath = function getComputedContextPath(contextPath) {
      let contextPathToUse = contextPath ?? this.getOwnerContextPath();
      if (contextPathToUse && !contextPathToUse.startsWith("/")) {
        contextPathToUse = this.getOwnerContextPath() + contextPathToUse;
      }
      return contextPathToUse;
    }

    /**
     * Retrieves the MetaPath object for the given metaPath and optional contextPath.
     * @param metaPath
     * @param contextPath
     * @returns A MetaPath pointing to the target {metaPath, contextPath}
     */;
    _proto.getMetaPathObject = function getMetaPathObject(metaPath, contextPath) {
      const metaModel = this.getMetaModel();
      const contextPathToUse = this.getComputedContextPath(contextPath);
      if (!metaModel || !(contextPathToUse || metaPath.charAt(0) === "/")) {
        Log.warning(`No metamodel or metaPath is not reachable with ${contextPath}:${metaPath}`);
        return null;
      }
      try {
        return new MetaPath(convertTypes(metaModel), metaPath, contextPathToUse);
      } catch (e) {
        Log.warning(`No metamodel or metaPath is not reachable with ${contextPath}:${metaPath}`);
        return null;
      }
    };
    _proto.createId = function createId() {
      // If the child instance has an ID property use it otherwise return undefined
      if (this.getId()) {
        for (var _len = arguments.length, stringParts = new Array(_len), _key = 0; _key < _len; _key++) {
          stringParts[_key] = arguments[_key];
        }
        return generate([this.getId(), ...stringParts]);
      }
      return undefined;
    };
    _proto.getTranslatedText = function getTranslatedText(textID, parameters, metaPath) {
      return (this.getModel("sap.fe.i18n") ?? this._getOwner()?.getModel("sap.fe.i18n"))?.getText(textID, parameters, metaPath) || textID;
    };
    _proto.getManifestWrapper = function getManifestWrapper() {
      return this._getOwner()?.getManifestWrapper();
    };
    _proto.getOwnerPageDefinition = function getOwnerPageDefinition() {
      return this._getOwner()?.preprocessorContext?.getDefinitionForPage();
    };
    return BuildingBlock;
  }(BuildingBlockBase), _BuildingBlock._bbobserverMap = new Map(), _BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaModel", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return BuildingBlock;
}, false);
//# sourceMappingURL=BuildingBlock-dbg.js.map
