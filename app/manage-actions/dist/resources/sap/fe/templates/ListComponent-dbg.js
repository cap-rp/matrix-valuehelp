/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/TemplateComponent", "sap/fe/core/library", "sap/fe/templates/ListReport/ExtendPageDefinition"], function (ClassSupport, TemplateComponent, CoreLibrary, ExtendPageDefinition) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var extendListReportPageDefinition = ExtendPageDefinition.extendListReportPageDefinition;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const VariantManagement = CoreLibrary.VariantManagement,
    InitialLoadMode = CoreLibrary.InitialLoadMode;
  let ListBasedComponent = (_dec = defineUI5Class("sap.fe.templates.ListComponent", {
    manifest: {
      "sap.ui": {
        technology: "UI5",
        deviceTypes: {
          desktop: true,
          tablet: true,
          phone: true
        },
        supportedThemes: ["sap_fiori_3", "sap_hcb", "sap_bluecrystal", "sap_belize", "sap_belize_plus", "sap_belize_hcw"]
      },
      "sap.app": {
        i18n: "messagebundle.properties"
      },
      "sap.ui5": {
        services: {
          templatedViewService: {
            factoryName: "sap.fe.core.services.TemplatedViewService",
            startup: "waitFor",
            settings: {
              viewName: "sap.fe.templates.ListReport.ListReport",
              converterType: "ListReport",
              errorViewName: "sap.fe.core.services.view.TemplatingErrorPage"
            }
          },
          asyncComponentService: {
            factoryName: "sap.fe.core.services.AsyncComponentService",
            startup: "waitFor"
          }
        },
        commands: {
          Create: {
            name: "Create",
            shortcut: "Ctrl+Enter",
            description: "{{CREATE_OBJECT_SHORTCUT_DESCRIPTION}}"
          },
          DeleteEntry: {
            name: "DeleteEntry",
            shortcut: "Ctrl+D",
            description: "{{DELETE_OBJECT_SHORTCUT_DESCRIPTION}}"
          },
          Share: {
            name: "Share",
            shortcut: "Shift+Ctrl+S",
            description: "{{SHARE_SHORTCUT_DESCRIPTION}}"
          },
          FE_FilterSearch: {
            name: "FE_FilterSearch",
            shortcut: "Ctrl+Enter",
            description: "{{FILTER_SEARCH_SHORTCUT_DESCRIPTION}}"
          },
          Cut: {
            name: "Cut",
            shortcut: "Ctrl+X",
            description: "{{CUT_SHORTCUT_DESCRIPTION}}"
          },
          Copy: {
            name: "Copy",
            shortcut: "Ctrl+C"
          },
          Paste: {
            name: "Paste",
            shortcut: "Ctrl+V",
            description: "{{PASTE_SHORTCUT_DESCRIPTION}}"
          },
          TableMoveElementUp: {
            name: "TableMoveElementUp",
            shortcut: "Ctrl+Alt+ArrowUp",
            description: "{{TABLE_MOVE_ELEMENT_UP_DESCRIPTION}}"
          },
          TableMoveElementDown: {
            name: "TableMoveElementDown",
            shortcut: "Ctrl+Alt+ArrowDown",
            description: "{{TABLE_MOVE_ELEMENT_DOWN_DESCRIPTION}}"
          }
        },
        handleValidation: true,
        dependencies: {
          minUI5Version: "${sap.ui5.core.version}",
          libs: {
            "sap.f": {},
            "sap.fe.macros": {
              lazy: true
            },
            "sap.m": {},
            "sap.suite.ui.microchart": {
              lazy: true
            },
            "sap.ui.core": {},
            "sap.ui.layout": {},
            "sap.ui.mdc": {},
            "sap.ushell": {
              lazy: true
            },
            "sap.ui.fl": {}
          }
        },
        contentDensities: {
          compact: true,
          cozy: true
        }
      }
    },
    library: "sap.fe.templates"
  }), _dec2 = property({
    type: "sap.fe.core.InitialLoadMode",
    defaultValue: InitialLoadMode.Auto
  }), _dec3 = property({
    type: "sap.fe.core.VariantManagement",
    defaultValue: VariantManagement.Page
  }), _dec4 = property({
    type: "string",
    defaultValue: undefined
  }), _dec5 = property({
    type: "boolean",
    defaultValue: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_TemplateComponent) {
    function ListBasedComponent() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _TemplateComponent.call(this, ...args) || this;
      _initializerDefineProperty(_this, "initialLoad", _descriptor, _this);
      _initializerDefineProperty(_this, "variantManagement", _descriptor2, _this);
      _initializerDefineProperty(_this, "defaultTemplateAnnotationPath", _descriptor3, _this);
      _initializerDefineProperty(_this, "liveMode", _descriptor4, _this);
      return _this;
    }
    _inheritsLoose(ListBasedComponent, _TemplateComponent);
    var _proto = ListBasedComponent.prototype;
    _proto.extendPageDefinition = function extendPageDefinition(pageDefinition) {
      return extendListReportPageDefinition(pageDefinition);
    };
    return ListBasedComponent;
  }(TemplateComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "initialLoad", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "defaultTemplateAnnotationPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ListBasedComponent;
}, false);
//# sourceMappingURL=ListComponent-dbg.js.map
