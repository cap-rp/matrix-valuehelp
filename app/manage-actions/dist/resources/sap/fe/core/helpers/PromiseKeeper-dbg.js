/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  /**
   * Helper class that allows to create a Promise and resolve it "from the outside".
   *
   * For example, to return a string promise that is resolved when an event is fired:
   * <code>
   * 		const keeper = new PromiseKeeper<string>();
   * 		eventProvider.attachEvent('myEvent', () => {
   * 			keeper.resolve("I'm resolved!!");
   * 		});
   *
   * 		return keeper.promise;
   * </code>
   */
  let PromiseKeeper = /*#__PURE__*/function () {
    /**
     * The Promise wrapped by the PromiseKeeper
     */

    function PromiseKeeper() {
      this.promise = new Promise((resolve, reject) => {
        this.resolver = resolve;
        this.rejector = reject;
      });
    }

    /**
     * Resolves the wrapped Promise.
     * @param result The resolved value.
     */
    _exports = PromiseKeeper;
    var _proto = PromiseKeeper.prototype;
    _proto.resolve = function resolve(result) {
      if (this.resolver) {
        this.resolver(result);
      }
    }

    /**
     * Rejects the wrapped Promise. The promise is always rejected using an Error object.
     * @param error The error or error message for the rejection.
     */;
    _proto.reject = function reject(error) {
      if (this.rejector) {
        if (error === undefined || typeof error === "string") {
          this.rejector(new Error(error));
        } else {
          this.rejector(error);
        }
      }
    };
    return PromiseKeeper;
  }();
  _exports = PromiseKeeper;
  return _exports;
}, false);
//# sourceMappingURL=PromiseKeeper-dbg.js.map
