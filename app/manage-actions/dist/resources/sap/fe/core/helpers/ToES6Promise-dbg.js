/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  /**
   * Transforms a jQuery promise into a regular ES6/TS promise.
   * @param oThenable The jQueryPromise
   * @returns The corresponding ES6 Promise
   */
  async function toES6Promise(oThenable) {
    return new Promise((resolve, reject) => {
      oThenable.then(function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        resolve(Array.prototype.slice.call(args));
        return;
      }).catch(function () {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        reject(Array.prototype.slice.call(args));
      });
    });
  }
  return toES6Promise;
}, false);
//# sourceMappingURL=ToES6Promise-dbg.js.map
