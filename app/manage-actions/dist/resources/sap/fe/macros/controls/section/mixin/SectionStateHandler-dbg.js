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
  let SectionStateHandler = /*#__PURE__*/function (_BaseStateHandler) {
    function SectionStateHandler() {
      return _BaseStateHandler.apply(this, arguments) || this;
    }
    _exports = SectionStateHandler;
    _inheritsLoose(SectionStateHandler, _BaseStateHandler);
    var _proto = SectionStateHandler.prototype;
    /**
     * Listen to subsections rendering to enable state interactions.
     */
    _proto.setupStateInteractionsForLazyRendering = function setupStateInteractionsForLazyRendering() {
      if (this.isSubSectionsAvailable()) {
        this.checkForSectionStateInteractions();
      } else {
        // Subsections are not available yet, so we hook to onBeforeRendering event delegate.
        const sectionEventDelegate = {
          onBeforeRendering: () => {
            if (this.isSubSectionsAvailable()) {
              // once subsections are avialable, we detach event delegate.
              this.checkForSectionStateInteractions();
              this.removeEventDelegate(sectionEventDelegate);
            }
          }
        };
        this.addEventDelegate(sectionEventDelegate);
      }
    }

    /**
     * Check for state interactions for the section.
     */;
    _proto.checkForSectionStateInteractions = function checkForSectionStateInteractions() {
      if (!this.checkForStateInteractions()) {
        // Blocks are not avialable yet, so we hook to onBeforeRendering event delegate.
        const subSections = this.getSubSections();
        subSections.forEach(this.registerSubSectionDelegate.bind(this));
      }
    }

    /**
     * Check if subsections are available.
     * @returns Boolean.
     */;
    _proto.isSubSectionsAvailable = function isSubSectionsAvailable() {
      return this.getSubSections().length > 0;
    }

    /**
     * Check if blocks are available for state interactions.
     * @returns Boolean.
     */;
    _proto.isBlocksAvailable = function isBlocksAvailable() {
      const subSections = this.getSubSections();
      return subSections.some(subSection => {
        const blocks = subSection.getBlocks().filter(block => block instanceof BlockBase);
        return blocks.length > 0;
      });
    };
    return SectionStateHandler;
  }(BaseStateHandler);
  _exports = SectionStateHandler;
  return _exports;
}, false);
//# sourceMappingURL=SectionStateHandler-dbg.js.map
