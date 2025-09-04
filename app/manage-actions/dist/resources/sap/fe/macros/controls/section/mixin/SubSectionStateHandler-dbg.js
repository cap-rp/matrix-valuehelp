/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/controls/section/mixin/BaseStateHandler", "sap/uxap/BlockBase"], function (BaseStateHandler, BlockBase) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  let SubSectionStateHandler = /*#__PURE__*/function (_BaseStateHandler) {
    function SubSectionStateHandler() {
      return _BaseStateHandler.apply(this, arguments) || this;
    }
    _exports = SubSectionStateHandler;
    _inheritsLoose(SubSectionStateHandler, _BaseStateHandler);
    var _proto = SubSectionStateHandler.prototype;
    /**
     * Listen to subsections rendering to enable state interactions.
     */
    _proto.setupStateInteractionsForLazyRendering = function setupStateInteractionsForLazyRendering() {
      if (!this.checkForStateInteractions()) {
        this.registerSubSectionDelegate(this);
      }
    }

    /**
     * Check if blocks are available for state interactions.
     * @returns Boolean.
     */;
    _proto.isBlocksAvailable = function isBlocksAvailable() {
      const blocks = this.getBlocks().filter(block => block instanceof BlockBase);
      return blocks.length > 0;
    };
    return SubSectionStateHandler;
  }(BaseStateHandler);
  _exports = SubSectionStateHandler;
  return _exports;
}, false);
//# sourceMappingURL=SubSectionStateHandler-dbg.js.map
