/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  let Synchronization = /*#__PURE__*/function () {
    function Synchronization() {
      this._fnResolve = null;
      this._isResolved = false;
    }
    var _proto = Synchronization.prototype;
    _proto.waitFor = async function waitFor() {
      if (this._isResolved) {
        return Promise.resolve();
      } else {
        return new Promise(resolve => {
          this._fnResolve = resolve;
        });
      }
    };
    _proto.resolve = function resolve() {
      if (!this._isResolved) {
        this._isResolved = true;
        if (this._fnResolve) {
          this._fnResolve();
        }
      }
    };
    return Synchronization;
  }();
  return Synchronization;
}, false);
//# sourceMappingURL=Synchronization-dbg.js.map
