/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/ui/core/CommandExecution", "sap/ui/core/Component", "sap/ui/core/Element", "sap/ui/core/Shortcut"], function (Log, ClassSupport, CoreCommandExecution, Component, Element, Shortcut) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let CommandExecution = (_dec = defineUI5Class("sap.fe.core.controls.CommandExecution"), _dec(_class = /*#__PURE__*/function (_CoreCommandExecution) {
    function CommandExecution(sId, mSettings) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return _CoreCommandExecution.call(this, sId, mSettings) || this;
    }
    _exports = CommandExecution;
    _inheritsLoose(CommandExecution, _CoreCommandExecution);
    var _proto = CommandExecution.prototype;
    _proto.setParent = function setParent(oParent) {
      _CoreCommandExecution.prototype.setParent.call(this, oParent);
      const aCommands = oParent.data("sap.ui.core.Shortcut");
      if (Array.isArray(aCommands) && aCommands.length > 0) {
        const oCommand = oParent.data("sap.ui.core.Shortcut")[aCommands.length - 1],
          oShortcut = oCommand.shortcutSpec;
        if (oShortcut) {
          // Check if single key shortcut
          for (const key in oShortcut) {
            if (oShortcut[key] && key !== "key") {
              return;
            }
          }
        }
        return;
      }
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      const oParent = this.getParent();
      if (oParent) {
        const oCommand = this._getCommandInfo();
        if (oCommand) {
          Shortcut.unregister(this.getParent(), oCommand.shortcut);
        }
        this._cleanupContext(oParent);
      }
      Element.prototype.destroy.apply(this, [bSuppressInvalidate]);
    };
    _proto.setVisible = function setVisible(bValue) {
      let oCommand,
        oParentControl = this.getParent(),
        oComponent;
      if (!oParentControl) {
        _CoreCommandExecution.prototype.setVisible.call(this, bValue);
      }
      while (!oComponent && oParentControl) {
        oComponent = Component.getOwnerComponentFor(oParentControl);
        oParentControl = oParentControl.getParent();
      }
      if (oComponent) {
        oCommand = oComponent.getCommand(this.getCommand());
        if (oCommand) {
          _CoreCommandExecution.prototype.setVisible.call(this, bValue);
        } else {
          Log.info("There is no shortcut definition registered in the manifest for the command : " + this.getCommand());
        }
      }
      return this;
    };
    return CommandExecution;
  }(CoreCommandExecution)) || _class);
  _exports = CommandExecution;
  return _exports;
}, false);
//# sourceMappingURL=CommandExecution-dbg.js.map
