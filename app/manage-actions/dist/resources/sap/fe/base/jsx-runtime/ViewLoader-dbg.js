/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/base/ManagedObject", "sap/ui/core/Component", "sap/ui/core/mvc/View"], function (ClassSupport, ManagedObject, Component, View) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let ViewLoader = (_dec = defineUI5Class("sap.fe.base.jsx-runtime.MDXViewLoader"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_View) {
    function ViewLoader(mSettings) {
      var _this;
      delete mSettings.cache;
      _this = _View.call(this, mSettings) || this;
      _initializerDefineProperty(_this, "viewName", _descriptor, _this);
      _this.sViewName = _this.viewName;
      _this._oContainingView = _this;
      return _this;
    }
    _exports = ViewLoader;
    _inheritsLoose(ViewLoader, _View);
    var _proto = ViewLoader.prototype;
    _proto.loadDependency = async function loadDependency(name) {
      return new Promise(resolve => {
        sap.ui.require([name], MDXContent => {
          resolve(MDXContent);
        });
      });
    };
    _proto.initViewSettings = async function initViewSettings(mSettings) {
      const viewConfig = this.getViewData();
      const viewContent = viewConfig.viewContent || (await this.loadDependency(viewConfig._jsxViewName));
      delete mSettings.cache;
      if (viewContent?.getMetadata?.().isA("sap.ui.core.mvc.Controller")) {
        mSettings.controller = new viewContent(viewConfig);
      } else {
        this.viewContentFn = viewContent;
      }
    };
    _proto.getControllerName = function getControllerName() {
      const viewData = this.getViewData();
      return viewData.controllerName;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ;
    _proto.createContent = function createContent(oController) {
      ViewLoader.preprocessorData = this?.mPreprocessors?.xml;
      ViewLoader.controller = oController;
      const owner = Component.getOwnerComponentFor(this) ?? {
        runAsOwner: fn => fn()
      };
      return owner.runAsOwner(() => {
        return ManagedObject.runWithPreprocessors(() => {
          if (oController && oController.render) {
            return oController.render();
          }
          return this.viewContentFn?.();
        }, {
          id: sId => {
            return this.createId(sId);
          },
          settings: function () {
            this.controller = oController;
          }
        });
      });
    };
    return ViewLoader;
  }(View), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewName", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = ViewLoader;
  return _exports;
}, false);
//# sourceMappingURL=ViewLoader-dbg.js.map
