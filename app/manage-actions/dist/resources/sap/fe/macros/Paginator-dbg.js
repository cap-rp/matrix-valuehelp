/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/HBox", "sap/ui/core/Element", "sap/ui/core/InvisibleText", "sap/ui/model/json/JSONModel", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, ClassSupport, HookSupport, BuildingBlock, HBox, Element, InvisibleText, JSONModel, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var controllerExtensionHandler = HookSupport.controllerExtensionHandler;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a paginator control.
   *
   * Usage example:
   * <pre>
   * &lt;macros:Paginator /&gt;
   * </pre>
   * @hideconstructor
   * @public
   * @since 1.94.0
   */
  let Paginator = (_dec = defineUI5Class("sap.fe.macros.Paginator"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = defineReference(), _dec5 = defineReference(), _dec6 = defineReference(), _dec7 = defineReference(), _dec8 = controllerExtensionHandler("paginator", "initialize"), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function Paginator(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      /**
       * The identifier of the Paginator control.
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Title of the object that is readout by screen readers when the next/previous item is loaded via keyboard focus on the paginator button.
       * @public
       */
      _initializerDefineProperty(_this, "ariaTitle", _descriptor2, _this);
      _initializerDefineProperty(_this, "upButton", _descriptor3, _this);
      _initializerDefineProperty(_this, "downButton", _descriptor4, _this);
      _initializerDefineProperty(_this, "upDescription", _descriptor5, _this);
      _initializerDefineProperty(_this, "downDescription", _descriptor6, _this);
      _this.paginatorModel = new JSONModel({
        navUpEnabled: false,
        navDownEnabled: false
      });
      _this._iCurrentIndex = -1;
      return _this;
    }
    _exports = Paginator;
    _inheritsLoose(Paginator, _BuildingBlock);
    Paginator.load = async function load() {
      if (Paginator.ObjectPageHeaderActionButton === undefined) {
        const {
          default: ObjectPageHeaderActionButton
        } = await __ui5_require_async("sap/uxap/ObjectPageHeaderActionButton");
        Paginator.ObjectPageHeaderActionButton = ObjectPageHeaderActionButton;
      }
      return this;
    };
    var _proto = Paginator.prototype;
    _proto.onMetadataAvailable = async function onMetadataAvailable(_ownerComponent) {
      await Paginator.load();
      this.content = this.createContent(_ownerComponent);
    };
    _proto.onModelContextChange = function onModelContextChange(event) {
      const source = event.getSource();
      if (source.isA("sap.m.HBox") && this.upButton.current && this.downButton.current) {
        const context = source.getBindingContext();
        if (!context) {
          return;
        }
        this._updateDescriptionAndFocus(this.upButton.current, this.downButton.current);
      }
    }

    /**
     * Initiates the paginator control.
     * @param listBinding ODataListBinding object
     * @param context Current context where the navigation is initiated
     * @since 1.94.0
     */;
    _proto.initialize = function initialize(listBinding, context) {
      if (listBinding && listBinding.getAllCurrentContexts) {
        this._oListBinding = listBinding;
        listBinding.attachEvent("change", this._updateCurrentIndexAndButtonEnablement.bind(this));
      } else {
        this._oListBinding = undefined;
      }
      if (context) {
        this._oCurrentContext = context;
      }
      this._updateCurrentIndexAndButtonEnablement();
    };
    _proto._updateCurrentIndexAndButtonEnablement = function _updateCurrentIndexAndButtonEnablement() {
      if (this._oCurrentContext && this._oListBinding) {
        const sPath = this._oCurrentContext.getPath();
        // Storing the currentIndex in global variable
        this._iCurrentIndex = this._oListBinding?.getAllCurrentContexts()?.findIndex(function (oContext) {
          return oContext && oContext.getPath() === sPath;
        });
        const oCurrentIndexContext = this._oListBinding?.getAllCurrentContexts()?.[this._iCurrentIndex];
        if (!this._iCurrentIndex && this._iCurrentIndex !== 0 || !oCurrentIndexContext || this._oCurrentContext.getPath() !== oCurrentIndexContext.getPath()) {
          this._updateCurrentIndex();
        }
      }
      this._handleButtonEnablement();
    }

    /**
     * Handles the enablement of navigation buttons based on the current context and list binding.
     * If applicable, updates the model properties to enable or disable the navigation buttons.
     */;
    _proto._handleButtonEnablement = function _handleButtonEnablement() {
      //Enabling and Disabling the Buttons on change of the control context

      const mButtonEnablementModel = this.paginatorModel;
      if (this._oListBinding && this._oListBinding.getAllCurrentContexts()?.length > 1 && this._iCurrentIndex > -1) {
        if (this._iCurrentIndex === this._oListBinding.getAllCurrentContexts().length - 1) {
          mButtonEnablementModel.setProperty("/navDownEnabled", false);
        } else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex + 1].isInactive()) {
          //check the next context is not an inactive context
          mButtonEnablementModel.setProperty("/navDownEnabled", false);
        } else {
          mButtonEnablementModel.setProperty("/navDownEnabled", true);
        }
        if (this._iCurrentIndex === 0) {
          mButtonEnablementModel.setProperty("/navUpEnabled", false);
        } else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex - 1].isInactive()) {
          mButtonEnablementModel.setProperty("/navUpEnabled", false);
        } else {
          mButtonEnablementModel.setProperty("/navUpEnabled", true);
        }
      } else {
        // Don't show the paginator buttons
        // 1. When no listbinding is available
        // 2. Only '1' or '0' context exists in the listBinding
        // 3. The current index is -ve, i.e the currentIndex is invalid.
        mButtonEnablementModel.setProperty("/navUpEnabled", false);
        mButtonEnablementModel.setProperty("/navDownEnabled", false);
      }
    };
    _proto._updateCurrentIndex = function _updateCurrentIndex() {
      if (this._oCurrentContext && this._oListBinding) {
        const sPath = this._oCurrentContext.getPath();
        // Storing the currentIndex in global variable
        this._iCurrentIndex = this._oListBinding?.getAllCurrentContexts()?.findIndex(function (oContext) {
          return oContext && oContext.getPath() === sPath;
        });
      }
    };
    _proto.updateCurrentContext = async function updateCurrentContext(iDeltaIndex) {
      if (!this._oListBinding) {
        return;
      }
      const oModel = this._oCurrentContext?.getModel ? this._oCurrentContext?.getModel() : undefined;
      //Submitting any pending changes that might be there before navigating to next context.
      await oModel?.submitBatch("$auto");
      const aCurrentContexts = this._oListBinding.getAllCurrentContexts();
      const iNewIndex = this._iCurrentIndex + iDeltaIndex;
      const oNewContext = aCurrentContexts[iNewIndex];
      if (oNewContext) {
        const bPreventIdxUpdate = this.getPageController()?.paginator.onBeforeContextUpdate(this._oListBinding, this._iCurrentIndex, iDeltaIndex);
        if (!bPreventIdxUpdate) {
          this._iCurrentIndex = iNewIndex;
          this._oCurrentContext = oNewContext;
        }
        this.getPageController()?.paginator.onContextUpdate(oNewContext);
      }
      this._handleButtonEnablement();
    };
    _proto._updateDescriptionAndFocus = function _updateDescriptionAndFocus(upButton, downButton) {
      const focusControl = Element.getActiveElement();
      const upEnabled = upButton.getEnabled();
      const downEnabled = downButton.getEnabled();
      let upDescriptionText = "";
      let downDescriptionText = "";
      if (upEnabled && !downEnabled && focusControl === downButton) {
        // Last record in the list.
        upButton.focus();
        upDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_BOTTOM");
        downDescriptionText = "";
      } else if (downEnabled && !upEnabled && focusControl === upButton) {
        // First record in the list.
        downButton.focus();
        upDescriptionText = "";
        downDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_TOP");
      }
      if (this.upDescription.current) {
        this.upDescription.current.setText(upDescriptionText);
      }
      if (this.downDescription.current) {
        this.downDescription.current.setText(downDescriptionText);
      }
    }

    /**
     * The runtime building block template function.
     * @param _ownerComponent
     * @returns A JS-based string
     */;
    _proto.createContent = function createContent(_ownerComponent) {
      // The model name is hardcoded, as this building block can also be used transparently by application developers
      const navUpEnabledExpression = pathInModel("/navUpEnabled", "paginator");
      const navDownEnabledExpression = pathInModel("/navDownEnabled", "paginator");
      const visibleExpression = or(navUpEnabledExpression, navDownEnabledExpression);
      const navUpTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_UP", "sap.fe.i18n");
      const navDownTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_DOWN", "sap.fe.i18n");
      const titleDescription = this.ariaTitle ? this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_TITLE_LOADED", [this.ariaTitle]) : this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_OBJECT_LOADED");
      _ownerComponent.setModel(this.paginatorModel, "paginator");
      return _jsxs(HBox, {
        displayInline: "true",
        id: this.createId("_box"),
        visible: compileExpression(visibleExpression),
        modelContextChange: event => {
          this.onModelContextChange(event);
        },
        children: [_jsx(InvisibleText, {
          ref: this.upDescription,
          id: this.createId("upDescription")
        }), _jsx(InvisibleText, {
          ref: this.downDescription,
          id: this.createId("downDescription")
        }), _jsx(InvisibleText, {
          id: this.createId("titleDescription"),
          text: titleDescription
        }), _jsx(Paginator.ObjectPageHeaderActionButton, {
          id: this.createId("previousItem"),
          ref: this.upButton,
          enabled: compileExpression(navUpEnabledExpression),
          tooltip: compileExpression(navUpTooltipExpression),
          icon: "sap-icon://navigation-up-arrow",
          press: async () => this.updateCurrentContext(-1),
          type: "Transparent",
          importance: "High",
          ariaDescribedBy: [this.createId("titleDescription"), this.createId("upDescription")].filter(val => val !== undefined)
        }), _jsx(Paginator.ObjectPageHeaderActionButton, {
          id: this.createId("nextItem"),
          ref: this.downButton,
          enabled: compileExpression(navDownEnabledExpression),
          tooltip: compileExpression(navDownTooltipExpression),
          icon: "sap-icon://navigation-down-arrow",
          press: async () => this.updateCurrentContext(1),
          type: "Transparent",
          importance: "High",
          ariaDescribedBy: [this.createId("titleDescription"), this.createId("downDescription")].filter(val => val !== undefined)
        })]
      });
    };
    return Paginator;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "ariaTitle", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "upButton", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "downButton", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "upDescription", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "downDescription", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "initialize", [_dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "initialize"), _class2.prototype), _class2)) || _class);
  _exports = Paginator;
  return _exports;
}, false);
//# sourceMappingURL=Paginator-dbg.js.map
