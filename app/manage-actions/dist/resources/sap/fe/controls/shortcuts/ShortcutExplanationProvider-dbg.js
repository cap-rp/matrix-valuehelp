/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/security/encodeURL", "sap/fe/base/ClassSupport", "sap/ui/base/ManagedObject", "sap/ui/core/IconPool", "sap/ui/core/Lib", "sap/ui/core/Theming"], function (Log, encodeURL, ClassSupport, ManagedObject, IconPool, Lib, Theming) {
  "use strict";

  var _dec, _class, _ShortcutExplanationProvider;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Provides a dialog to explain the shortcuts to the user.
   * This dialog will be registered in the shell user menu and will open as an independent window.
   * @experimental
   */
  let ShortcutExplanationProvider = (_dec = defineUI5Class("sap.fe.controls.shortcuts.ShortcutExplanationProvider"), _dec(_class = (_ShortcutExplanationProvider = /*#__PURE__*/function (_ManagedObject) {
    function ShortcutExplanationProvider() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ManagedObject.call(this, ...args) || this;
      _this._popupIdx = 0;
      return _this;
    }
    _exports = ShortcutExplanationProvider;
    _inheritsLoose(ShortcutExplanationProvider, _ManagedObject);
    var _proto = ShortcutExplanationProvider.prototype;
    _proto.getShellDialogContent = function getShellDialogContent() {
      // Position to top right of the main window if possible
      const windowWidth = 620;
      let left = window.screenLeft + window.outerWidth;
      if (left + windowWidth > window.screen.availWidth) {
        left = window.screen.availWidth - windowWidth;
      }
      const theme = Theming.getTheme();
      const url = sap.ui.require.toUrl("sap/fe/controls/shortcuts/popup/index.html");
      const localOrigin = window.location.protocol + "//" + window.location.host;
      // We pass the theme and the origin to the popup so that it can communicate safely with the parent
      const params = "?sap-ui-xx-shortcut-origin=" + encodeURL(localOrigin) + "&sap-ui-theme=" + theme;
      const myWin = window.open(url + params, "_blank", `popup,toolbar=no,menubar=no,scrollbars=no,location=no,width=${windowWidth},height=550,top=${window.screenTop},left=${left}`);
      if (myWin) {
        const handleMessageReceived = messageEvent => {
          if (localOrigin === messageEvent.origin) {
            const messageData = messageEvent?.data;
            if (messageData.service === "sap.ui.interaction.MessagePortReady") {
              const messagePort = messageEvent.ports[0]; // Remember the port
              myWin.postMessage({
                service: "sap.ui.interaction.MessagePortReady"
              }, url.startsWith("/") ? localOrigin : url, [messagePort]);
              window.removeEventListener("message", handleMessageReceived);
            }
          }
        };
        try {
          myWin.opener = null;
        } catch (e) {
          // This might fail when there is CORS involved anyway and we can't access the opener anyway
          Log.debug("Cannot set opener to null", e instanceof Error ? e.message : String(e));
        }
        setTimeout(() => {
          window.addEventListener("message", handleMessageReceived);
          window.postMessage({
            id: "sap.fe.interaction.Popup" + this._popupIdx++,
            service: "sap.ui.interaction.RequestMessagePort"
          }, localOrigin);
        }, 1500); // give a bit of time for the popup to be ready
        // We can't rely on the onload of the popup because it is not always availble in CORS scenarios
        window.onunload = function () {
          myWin.close();
        };
      }
    };
    /**
     * Creates or returns the instance of the ShortcutExplanationProvider.
     * This is a singleton to ensure we only have one instance of the dialog.
     * @returns The instance of the ShortcutExplanationProvider
     */
    ShortcutExplanationProvider.getInstance = async function getInstance() {
      // Test the shell existence and register the extension
      const shellContainer = sap.ui.require("sap/ushell/Container");
      let resolveCreation;
      try {
        if (shellContainer && !this.instance) {
          this.instancePromise = new Promise(resolve => {
            resolveCreation = resolve;
          });
          const extensionService = await shellContainer.getServiceAsync("Extension");
          if (extensionService) {
            const shellHistoryProvider = await ShortcutExplanationProvider.registerUserAction(extensionService);
            this.instance = shellHistoryProvider;
            resolveCreation(shellHistoryProvider);
          }
        }
      } catch (e) {
        Log.error("Cannot register extension", e instanceof Error ? e.message : String(e));
        resolveCreation?.(undefined);
      }
      return this.instancePromise;
    }

    /**
     * Adds the user action to the shell, the action will open the dialog with the shortcuts.
     * @param shellExtensionService The extension service to add the user action to the shell
     * @returns The dialog with the shortcuts
     */;
    ShortcutExplanationProvider.registerUserAction = async function registerUserAction(shellExtensionService) {
      try {
        const resourceBundle = Lib.getResourceBundleFor("sap.fe.controls");
        const shellHistoryDialog = new ShortcutExplanationProvider();
        if (!this.isDialogAdded) {
          this.isDialogAdded = true;
          const userAction = await shellExtensionService.createUserAction({
            id: "sapui5.shortcut.explanation.trigger",
            text: resourceBundle.getText("C_SHORTCUT_TITLE"),
            icon: IconPool.getIconURI("keyboard-and-mouse"),
            press: () => {
              shellHistoryDialog.getShellDialogContent();
            }
          }, {
            controlType: "sap.m.Button"
          });
          userAction.showForAllApps();
        }
        return shellHistoryDialog;
      } catch (err) {
        Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
      }
    };
    return ShortcutExplanationProvider;
  }(ManagedObject), _ShortcutExplanationProvider.isDialogAdded = false, _ShortcutExplanationProvider)) || _class);
  _exports = ShortcutExplanationProvider;
  return _exports;
}, false);
//# sourceMappingURL=ShortcutExplanationProvider-dbg.js.map
