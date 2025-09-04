/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/m/Dialog", "sap/m/Text", "sap/ui/core/library", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Button, Dialog, Text, library, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var ValueState = library.ValueState;
  let BeforeActionDialog = /*#__PURE__*/function () {
    function BeforeActionDialog(view) {
      this.containingView = view;
      this.dialog = _jsxs(Dialog, {
        title: "{sap.fe.i18n>WARNING}",
        type: "Message",
        state: ValueState.Warning,
        children: [{
          content: _jsx(Text, {
            text: "{sap.fe.i18n>C_INLINE_EDIT_DRAFT_EXISTS}"
          })
        }, {
          beginButton: _jsx(Button, {
            type: "Emphasized",
            text: "{sap.fe.i18n>C_COMMON_DIALOG_OK}",
            press: () => this.close()
          })
        }]
      });
      view.addDependent(this.dialog);
    }

    /**
     * Open.
     */
    _exports = BeforeActionDialog;
    var _proto = BeforeActionDialog.prototype;
    _proto.open = function open() {
      this.dialog.open();
    }

    /**
     * Close the dialog and call the inline edit discard.
     */;
    _proto.close = function close() {
      this.dialog.close();
      this.dialog.destroy();
    };
    return BeforeActionDialog;
  }();
  _exports = BeforeActionDialog;
  return _exports;
}, false);
//# sourceMappingURL=DraftExistsDialog-dbg.js.map
