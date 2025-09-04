/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const jsxRenderManager = function (type, mSettings, key, renderManager) {
    return () => {
      if (typeof type === "string") {
        if (mSettings.ref) {
          renderManager.openStart(type, mSettings.ref);
        } else {
          renderManager.openStart(type);
        }
        for (const mSetting in mSettings) {
          if (mSetting !== "children" && mSetting !== "ref" && mSetting !== "class") {
            renderManager.attr(mSetting, mSettings[mSetting]);
          }
        }
        if (mSettings.class) {
          mSettings.class.split(" ").forEach(className => {
            renderManager.class(className);
          });
        }
        renderManager.openEnd();
      }
      const children = mSettings.children;
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (typeof child === "string" || typeof child === "number" || typeof child === "boolean") {
            renderManager.text(child.toString());
          } else if (typeof child === "function") {
            child();
          } else if (child !== undefined) {
            renderManager.renderControl(child);
          }
        });
      } else if (typeof children === "string" || typeof children === "number" || typeof children === "boolean") {
        renderManager.text(children.toString());
      } else if (typeof children === "function") {
        children();
      } else if (children !== undefined) {
        renderManager.renderControl(children);
      }
      if (typeof type === "string") {
        renderManager.close(type);
      }
    };
  };
  return jsxRenderManager;
}, false);
//# sourceMappingURL=jsx-renderManager-dbg.js.map
