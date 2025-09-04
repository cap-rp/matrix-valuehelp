/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Button", "sap/m/OverflowToolbarLayoutData", "sap/m/library", "sap/ui/performance/trace/FESRHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment"], function (Log, ClassSupport, CommonUtils, BuildingBlock, Button, OverflowToolbarLayoutData, library, FESRHelper, _jsx, _Fragment) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
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
  var ButtonType = library.ButtonType;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Summarization button building block.
   *
   * If the summarization feature is available, this building block will render a button that triggers the summarization feature.
   */
  let SummarizationButton = (_dec = defineUI5Class("sap.fe.macros.ai.SummarizationButton"), _dec2 = property({
    type: "string",
    required: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function SummarizationButton() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _BuildingBlock.call(this, ...args) || this;
      /**
       * The ID of the button.
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _this.fesrStepName = "fe4:sum:summarize";
      return _this;
    }
    _exports = SummarizationButton;
    _inheritsLoose(SummarizationButton, _BuildingBlock);
    var _proto = SummarizationButton.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.content = this.createContent();
    };
    _proto.createContent = function createContent() {
      const environmentService = this.getAppComponent()?.getEnvironmentCapabilities();
      let button;
      if (environmentService?.environmentCapabilities.SmartSummarize === true) {
        button = _jsx(Button, {
          id: this.createId("button"),
          "dt:designtime": "not-adaptable",
          text: "{sap.fe.i18n>SUMMARIZE}",
          icon: "sap-icon://ai",
          type: ButtonType.Ghost,
          press: async () => {
            try {
              await environmentService.prepareFeature("SmartSummarize");
              const library = await __ui5_require_async("ux/eng/fioriai/reuse/library");
              await library.summarize({
                view: CommonUtils.getTargetView(this)
              });
            } catch (error) {
              Log.error("Summarization failed", error);
            }
          },
          children: {
            layoutData: _jsx(_Fragment, {
              children: _jsx(OverflowToolbarLayoutData, {
                priority: "High"
              })
            })
          }
        });
        FESRHelper.setSemanticStepname(button, "press", this.fesrStepName);
      }
      return button;
    };
    return SummarizationButton;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = SummarizationButton;
  return _exports;
}, false);
//# sourceMappingURL=SummarizationButton-dbg.js.map
