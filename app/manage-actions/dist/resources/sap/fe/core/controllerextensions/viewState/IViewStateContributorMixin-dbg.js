/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/controllerextensions/viewState/IViewStateContributor", "sap/ui/core/Component"], function (IViewStateContributor, Component) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let IViewStateContributorMixin = /*#__PURE__*/function (_ref) {
    function IViewStateContributorMixin() {
      return _ref.apply(this, arguments) || this;
    }
    _exports = IViewStateContributorMixin;
    _inheritsLoose(IViewStateContributorMixin, _ref);
    var _proto = IViewStateContributorMixin.prototype;
    _proto.getInterfaceName = function getInterfaceName() {
      return IViewStateContributorMixin.interfaceName;
    };
    _proto.setupMixin = function setupMixin(baseClass) {
      function _getOwner(inControl) {
        let owner = Component.getOwnerComponentFor(inControl);
        let control = inControl;
        while (!owner && control && !control.isA("sap.ui.core.mvc.View")) {
          control = control.getParent();
          if (control) {
            owner = Component.getOwnerComponentFor(control);
          }
        }
        if (owner?.isA("sap.fe.core.TemplateComponent")) {
          return owner;
        }
      }
      function getPageController(inControl) {
        return _getOwner(inControl)?.getRootController();
      }
      function _stateContributorChangeEventHandler(ev) {
        const pageControllerInHandler = getPageController(ev.getSource());
        if (pageControllerInHandler) {
          pageControllerInHandler?.viewState?.registerStateContributor(ev.getSource());
          ev.getSource().detachEvent("modelContextChange", _stateContributorChangeEventHandler);
        }
      }
      const baseInit = baseClass.prototype.init;
      baseClass.prototype.init = function () {
        baseInit?.call(this);
        const pageController = getPageController(this);
        if (!pageController) {
          this.attachEvent("modelContextChange", _stateContributorChangeEventHandler);
        } else {
          pageController.viewState.registerStateContributor(this);
        }
      };
      const baseDestroy = baseClass.prototype.destroy;
      baseClass.prototype.destroy = function () {
        getPageController(this)?.viewState?.deregisterStateContributor(this);
        baseDestroy?.call(this);
      };
    };
    return IViewStateContributorMixin;
  }(IViewStateContributor);
  IViewStateContributorMixin.interfaceName = "sap.fe.core.controllerextensions.viewState.IViewStateContributor";
  _exports = IViewStateContributorMixin;
  return _exports;
}, false);
//# sourceMappingURL=IViewStateContributorMixin-dbg.js.map
