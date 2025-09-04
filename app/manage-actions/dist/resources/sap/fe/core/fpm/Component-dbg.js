/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/TemplateComponent"], function (ClassSupport, TemplateComponent) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Component that can be used as a wrapper component for custom pages.
   *
   * The component can be used in case you want to use SAP Fiori elements Building Blocks or XML template
   * constructions. You can either extend the component and set the viewName and contextPath within your code
   * or you can use it to wrap your custom XML view directly the manifest when you define your custom page
   * under sapui5/routing/targets:
   *
   * <pre>
   * "myCustomPage": {
   *	 "type": "Component",
   *	 "id": "myCustomPage",
   *	 "name": "sap.fe.core.fpm",
   *	 "title": "My Custom Page",
   *	 "options": {
   *		"settings": {
   *			"viewName": "myNamespace.myView",
   *			"contextPath": "/MyEntitySet"
   *		}
   *	 }
   *  }
   * </pre>
   * @public
   * @experimental As of version 1.92.0
   * @since 1.92.0
   */
  let FPMComponent = (_dec = defineUI5Class("sap.fe.core.fpm.Component", {
    manifest: "json"
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "any"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_TemplateComponent) {
    function FPMComponent(mSettings) {
      var _this;
      if (mSettings.viewType === "JSX") {
        mSettings._jsxViewName = mSettings.viewName;
        mSettings.viewName = "module:sap/fe/base/jsx-runtime/ViewLoader";
        // Remove the cache property from the settings as it is not supported by the ViewLoader
        delete mSettings.cache;
      }
      _this = _TemplateComponent.call(this, mSettings) || this;
      /**
       * Name of the XML view which is used for this page. The XML view can contain SAP Fiori elements Building Blocks and XML template constructions.
       * @public
       */
      _initializerDefineProperty(_this, "viewName", _descriptor, _this);
      _initializerDefineProperty(_this, "controllerName", _descriptor2, _this);
      _initializerDefineProperty(_this, "_jsxViewName", _descriptor3, _this);
      _initializerDefineProperty(_this, "viewContent", _descriptor4, _this);
      return _this;
    }

    /**
     * Returns the current AppComponent.
     * @returns The current AppComponent
     * @public
     */
    _inheritsLoose(FPMComponent, _TemplateComponent);
    var _proto = FPMComponent.prototype;
    _proto.getAppComponent = function getAppComponent() {
      return this.oAppComponent;
    };
    return FPMComponent;
  }(TemplateComponent), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "viewName", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "controllerName", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "_jsxViewName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "viewContent", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FPMComponent;
}, false);
//# sourceMappingURL=Component-dbg.js.map
