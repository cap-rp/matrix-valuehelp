/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"], function (Log) {
  "use strict";

  var _exports = {};
  async function requireDependencies(dependencyNames) {
    let resolveFn;
    let rejectFn;
    const awaiter = new Promise((resolve, reject) => {
      resolveFn = resolve;
      rejectFn = reject;
    });
    if (dependencyNames.length > 0) {
      sap.ui.require(dependencyNames, function () {
        for (var _len = arguments.length, dependencies = new Array(_len), _key = 0; _key < _len; _key++) {
          dependencies[_key] = arguments[_key];
        }
        resolveFn(dependencies);
      }, err => {
        Log.error(`Error while loading dependency modules: ${dependencyNames.join(", ")}: ${err}`);
        rejectFn(err);
      });
    } else {
      resolveFn([]);
    }
    return awaiter;
  }
  _exports.requireDependencies = requireDependencies;
  return _exports;
}, false);
//# sourceMappingURL=LoaderUtils-dbg.js.map
