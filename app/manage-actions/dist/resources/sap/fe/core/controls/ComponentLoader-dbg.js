/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/ui/core/Component", "sap/ui/core/Control"], function (ClassSupport, Component, Control) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Control for loading a component using UI5 routing.
   */
  let ComponentLoader = (_dec = defineUI5Class("sap.fe.core.controls.ComponentLoader"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "object"
  }), _dec5 = aggregation({
    type: "sap.ui.core.ComponentContainer",
    multiple: false,
    isDefault: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_Control) {
    function ComponentLoader() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _Control.call(this, ...args) || this;
      /**
       * Name of the component.
       */
      _initializerDefineProperty(_this, "name", _descriptor, _this);
      /**
       * Route prefix for the component.
       */
      _initializerDefineProperty(_this, "prefix", _descriptor2, _this);
      /**
       * Setting that will be passed to the component.
       */
      _initializerDefineProperty(_this, "settings", _descriptor3, _this);
      /**
       * This aggregation holds the embedded component.
       */
      _initializerDefineProperty(_this, "component", _descriptor4, _this);
      return _this;
    }
    _exports = ComponentLoader;
    _inheritsLoose(ComponentLoader, _Control);
    var _proto = ComponentLoader.prototype;
    /**
     * Targets API.
     */
    _proto.init = function init() {
      this.targets = this.getTargets();
    }

    /**
     * Get the {@link Targets} instance responsible for this control.
     * @returns The {@link Targets} instance.
     * @throws If the instance could not be found, e.g., if there is no router at all.
     */;
    _proto.getTargets = function getTargets() {
      let component = Component.getOwnerComponentFor(this);
      let targets;
      while (component && !targets) {
        if (component.isA("sap.ui.core.UIComponent")) {
          targets = component.getTargets();
        }
        component = Component.getOwnerComponentFor(component);
      }
      if (!targets) {
        throw new Error("Could not determine the instance of sap.ui.core.routing.Targets");
      }
      return targets;
    }

    /**
     * Add a target, using this control's ID as the name.
     */;
    _proto.addTarget = function addTarget() {
      const target = this.targets.getTarget(this.getId(), true);
      if (!target) {
        // UI5 routing will later create one instance of the component per tuple [name, id] or [usage, id], respectively.
        const targetSettings = {
          type: "Component",
          name: this.name,
          id: this.getId(),
          // this is where the component's view will be placed. It must be **this** control's 'component' aggregation.
          controlId: this.getId(),
          controlAggregation: "component"
        };
        if (this.settings) {
          targetSettings.options = {
            settings: this.settings
          };
        }
        this.targets.addTarget(this.getId(), targetSettings);
      }
    };
    _proto.applySettings = function applySettings(mSettings, oScope) {
      _Control.prototype.applySettings.call(this, mSettings, oScope);
      this.addTarget();
      return this;
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      this.targets.display({
        name: this.getId(),
        prefix: this.prefix,
        routeRelevant: true
      });
    };
    ComponentLoader.render = function render(rm, loader) {
      // delegate rendering to the nested ComponentContainer
      if (loader.component) {
        loader.component.getRenderer().render(rm, loader.component);
      }
    };
    return ComponentLoader;
  }(Control), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "name", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "prefix", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "settings", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "component", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return null;
    }
  }), _class2)) || _class);
  _exports = ComponentLoader;
  return _exports;
}, false);
//# sourceMappingURL=ComponentLoader-dbg.js.map
