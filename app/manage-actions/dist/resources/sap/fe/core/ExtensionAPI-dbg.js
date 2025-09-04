/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controls/DataWatcher", "sap/ui/base/Object", "sap/ui/core/Component", "sap/ui/model/json/JSONModel"], function (Log, BindingToolkit, ClassSupport, CommonUtils, DataWatcher, BaseObject, Component, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _class, _class2, _descriptor, _descriptor2, _descriptor3;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Common Extension API for all pages of SAP Fiori elements for OData V4.
   *
   * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/controllerExtensions/controllerExtensionsOverview Overview of Building Block}
   * @public
   * @hideconstructor
   * @since 1.79.0
   */
  let ExtensionAPI = (_dec = defineUI5Class("sap.fe.core.ExtensionAPI"), _dec2 = property({
    type: "sap.fe.core.controllerextensions.EditFlow"
  }), _dec3 = property({
    type: "sap.fe.core.controllerextensions.Routing"
  }), _dec4 = property({
    type: "sap.fe.core.controllerextensions.IntentBasedNavigation"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BaseObject) {
    function ExtensionAPI(oController, sId) {
      var _this;
      _this = _BaseObject.call(this) || this;
      /**
       * A controller extension offering hooks into the edit flow of the application.
       * {@link demo:sap/fe/core/fpmExplorer/index.html#/controllerExtensions/basicExtensibility Overview of Building Block}
       * @public
       */
      _initializerDefineProperty(_this, "editFlow", _descriptor, _this);
      /**
       * A controller extension offering hooks into the routing flow of the application.
       * {@link demo:sap/fe/core/fpmExplorer/index.html#/controllerExtensions/routingExtensibility Overview of Building Block}
       * @public
       */
      _initializerDefineProperty(_this, "routing", _descriptor2, _this);
      /**
       * ExtensionAPI for intent-based navigation
       * @public
       */
      _initializerDefineProperty(_this, "intentBasedNavigation", _descriptor3, _this);
      _this._controller = oController;
      _this._view = oController.getView();
      _this.extension = _this._controller.extension;
      _this.editFlow = _this._controller.editFlow;
      _this.routing = _this._controller.routing;
      _this._routing = _this._controller._routing;
      _this.intentBasedNavigation = _this._controller.intentBasedNavigation;
      _this._prefix = sId;
      return _this;
    }

    /**
     * Retrieves the editFlow controller extension for this page.
     * @public
     * @returns The editFlow controller extension
     */
    _inheritsLoose(ExtensionAPI, _BaseObject);
    var _proto = ExtensionAPI.prototype;
    _proto.getEditFlow = function getEditFlow() {
      return this.editFlow;
    }

    /**
     * Retrieves the routing controller extension for this page.
     * @public
     * @returns The routing controller extension
     */;
    _proto.getRouting = function getRouting() {
      return this.routing;
    }

    /**
     * Retrieves the intentBasedNavigation controller extension for this page.
     * @public
     * @returns The intentBasedNavigation controller extension
     */;
    _proto.getIntentBasedNavigation = function getIntentBasedNavigation() {
      return this.intentBasedNavigation;
    }

    /**
     * Access a control by its ID. If you attempt to access an internal control instead of the stable API, the method will raise an error.
     * @param id ID of the control without view and section prefix.
     * @returns The requested control, if found in the view / section.
     * @public
     */;
    _proto.byId = function byId(id) {
      let control = this._view.byId(id);
      if (!control && this._prefix) {
        // give it a try with the prefix
        control = this._view.byId(`${this._prefix}--${id}`);
      }
      if (!control) {
        return undefined;
      }
      if (!control.isA("sap.fe.macros.MacroAPI")) {
        // check if app tried to access an internal control wrapped by a macro API
        let parent = control.getParent();
        while (parent) {
          if (parent.isA("sap.fe.macros.form.FormAPI")) {
            // we reached the formAPI but no field - the app tries to access any custom control which is fine
            break;
          }
          if (parent.isA("sap.fe.macros.MacroAPI")) {
            throw new Error(`You attempted to access an internal control. This is risky and might change later. Instead access its stable API by using ID ${parent.getId()}`);
          }
          parent = parent.getParent();
        }
      }
      return control;
    }

    /**
     * Get access to models managed by SAP Fiori elements.<br>
     * The following models can be accessed:
     * <ul>
     * <li>undefined: the undefined model returns the SAPUI5 OData V4 model bound to this page</li>
     * <li>i18n / further data models defined in the manifest</li>
     * <li>ui: returns a SAPUI5 JSON model containing UI information.
     * Only the following properties are public and supported:
     * <ul>
     * <li>isEditable: set to true if the application is in edit mode</li>
     * </ul>
     * </li>
     * </ul>.
     * editMode is deprecated and should not be used anymore. Use isEditable instead.
     * @param sModelName Name of the model
     * @returns The required model
     * @public
     */;
    _proto.getModel = function getModel(sModelName) {
      let oAppComponent;
      if (sModelName && sModelName !== "ui") {
        oAppComponent = CommonUtils.getAppComponent(this._view);
        if (!oAppComponent.getManifestEntry("sap.ui5").models[sModelName]) {
          // don't allow access to our internal models
          return undefined;
        }
      }
      return this._view.getModel(sModelName);
    }

    /**
     * Add any control as a dependent control to this SAP Fiori elements page.
     * @param oControl Control to be added as a dependent control
     * @public
     */;
    _proto.addDependent = function addDependent(oControl) {
      this._view.addDependent(oControl);
    }

    /**
     * Remove a dependent control from this SAP Fiori elements page.
     * @param oControl Control to be added as a dependent control
     * @public
     */;
    _proto.removeDependent = function removeDependent(oControl) {
      this._view.removeDependent(oControl);
    }

    /**
     * Navigate to another target.
     * @param sTarget Name of the target route
     * @param [oContext] OData v4 context instance
     * @public
     */;
    _proto.navigateToTarget = function navigateToTarget(sTarget, oContext) {
      this._controller._routing.navigateToTarget(oContext, sTarget);
    }

    /**
     * Load a fragment and go through the template preprocessor with the current page context.
     * @param mSettings The settings object
     * @param mSettings.id The ID of the fragment itself
     * @param mSettings.name The name of the fragment to be loaded
     * @param mSettings.controller The controller to be attached to the fragment
     * @param mSettings.contextPath The contextPath to be used for the templating process
     * @param mSettings.initialBindingContext The initial binding context
     * @returns The fragment definition
     * @public
     */;
    _proto.loadFragment = async function loadFragment(mSettings) {
      var _this2 = this;
      const oTemplateComponent = Component.getOwnerComponentFor(this._view);
      await oTemplateComponent.getService("templatedViewService");
      const oPageModel = this._view.getModel("_pageModel");
      const i18nModel = this._view.getModel("sap.fe.i18n");
      const oMetaModel = oTemplateComponent.getMetaModel();
      const mViewData = oTemplateComponent.getViewData();
      const targetContextPath = oTemplateComponent.getEntitySet() ? `/${oTemplateComponent.getEntitySet()}` : oTemplateComponent.getContextPath();
      const oViewDataModel = new JSONModel(mViewData),
        oPreprocessorSettings = {
          bindingContexts: {
            contextPath: oMetaModel?.createBindingContext(mSettings.contextPath || targetContextPath),
            converterContext: oPageModel.createBindingContext("/", undefined, {
              noResolve: true
            }),
            viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
          },
          models: {
            contextPath: oMetaModel,
            converterContext: oPageModel,
            metaModel: oMetaModel,
            viewData: oViewDataModel,
            "sap.fe.i18n": i18nModel
          },
          appComponent: CommonUtils.getAppComponent(this._view)
        };

      // We scope the fragment with our ExtensionAPI. If a controller object is passed we merge it with the extensionAPI
      let controllerInstance;
      if (mSettings.controller && !mSettings.controller?.isA?.("sap.fe.core.ExtensionAPI")) {
        const subClass = this.getMetadata().getClass().extend(mSettings.id + "-controller", {});
        for (const controllerElementKey in mSettings.controller) {
          const controllerElement = mSettings.controller[controllerElementKey];
          if (controllerElement?.bind) {
            const boundFunction = controllerElement.bind(mSettings.controller);
            if (oTemplateComponent) {
              subClass.prototype[controllerElementKey] = function () {
                for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                  args[_key] = arguments[_key];
                }
                return oTemplateComponent.runAsOwner(() => boundFunction.apply(_this2, args));
              };
            } else {
              subClass.prototype[controllerElementKey] = boundFunction;
            }
          } else {
            Object.defineProperty(subClass.prototype, controllerElementKey, {
              get() {
                return mSettings.controller?.[controllerElementKey];
              },
              set(v) {
                if (mSettings.controller) {
                  mSettings.controller[controllerElementKey] = v;
                }
              }
            });
          }
        }
        controllerInstance = new subClass(this._controller);
        const newIsA = controllerInstance.isA;
        controllerInstance.isA = className => {
          // We keep the 	sap.fe.core.ExtensionAPI as a valid type for this new class
          // this type is lost as soon as the merged controller object gets a method isA
          return newIsA.bind(controllerInstance)(className) || this.isA(className);
        };
      } else {
        controllerInstance = mSettings.controller ?? this;
      }
      return oTemplateComponent.runAsOwner(async () => {
        const oTemplatePromise = CommonUtils.templateControlFragment(mSettings.name, oPreprocessorSettings, {
          controller: controllerInstance,
          isXML: false,
          id: mSettings.id,
          containingView: this._view,
          contextPath: mSettings.contextPath ?? targetContextPath
        });
        try {
          const oFragment = await oTemplatePromise;
          if (mSettings.initialBindingContext !== undefined) {
            oFragment.setBindingContext(mSettings.initialBindingContext);
          }
          this.addDependent(oFragment);
          return oFragment;
        } catch (oError) {
          Log.error(oError);
        }
      });
    }

    /**
     * Triggers an update of the app state.
     * Should be called if the state of a control, or any other state-relevant information, was changed.
     * @returns A promise that resolves with the new app state object.
     * @public
     */;
    _proto.updateAppState = async function updateAppState() {
      const view = this._controller.getView();
      const appComponent = this._controller.getAppComponent();
      const appStateInfo = await appComponent.getAppStateHandler().createAppState({
        viewId: view.getId()
      });
      return appStateInfo?.appStateData;
    }

    /**
     * Run the given function with the FPM context of the current page.
     * This allows to initialize all the elements required by building blocks to render correctly.
     * @param fn The Function to be executed
     * @returns The result of the function
     * @public
     */;
    _proto.runWithFPMContext = function runWithFPMContext(fn) {
      const templateComponent = Component.getOwnerComponentFor(this._view);
      return templateComponent.runAsOwner(fn);
    }

    /**
     * Watch a property from the main page context and trigger a callback when the value changes.
     * @param propertyName The name of the property to watch
     * @param callback The callback to trigger when the value changes
     * @public
     */;
    _proto.watchProperty = function watchProperty(propertyName, callback) {
      this._view.addDependent(new DataWatcher({
        propertyBinding: compileExpression(pathInModel(propertyName)),
        valueChanged: e => {
          callback(e.getParameter("value"), e.getParameter("oldValue"), e.getParameter("isInitial"), e.getParameter("context"));
        }
      }));
    };
    return ExtensionAPI;
  }(BaseObject), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "editFlow", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "routing", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "intentBasedNavigation", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ExtensionAPI;
}, false);
//# sourceMappingURL=ExtensionAPI-dbg.js.map
