/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/Label", "sap/m/List", "sap/m/Text", "sap/m/VBox", "sap/ui/core/CustomData", "sap/ui/core/library", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Button, CustomListItem, Dialog, Label, List, Text, VBox, CustomData, library, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var ValueState = library.ValueState;
  let DIALOGRESULT = /*#__PURE__*/function (DIALOGRESULT) {
    DIALOGRESULT["SAVE"] = "Save";
    DIALOGRESULT["DISCARD"] = "Discard";
    DIALOGRESULT["CANCEL"] = "Cancel";
    return DIALOGRESULT;
  }({});
  _exports.DIALOGRESULT = DIALOGRESULT;
  let BeforeNavigationDialog = /*#__PURE__*/function () {
    function BeforeNavigationDialog(view, dialogCallBack) {
      this.containingView = view;
      this.dialogCallBack = dialogCallBack;
      this.optionsList = _jsx(List, {
        mode: "SingleSelectLeft",
        showSeparators: "None",
        includeItemInSelection: "true",
        backgroundDesign: "Transparent",
        class: "sapUiNoContentPadding",
        children: {
          items: [_jsx(CustomListItem, {
            customData: [new CustomData({
              key: "itemKey",
              value: "SAVE"
            })],
            children: _jsxs(VBox, {
              class: "sapUiTinyMargin",
              children: [_jsx(Label, {
                text: "{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_SAVE_RBL}",
                design: "Bold"
              }), _jsx(Text, {
                text: "{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_SAVE_TOL}"
              })]
            })
          }), _jsx(CustomListItem, {
            customData: [new CustomData({
              key: "itemKey",
              value: "DISCARD"
            })],
            children: _jsxs(VBox, {
              class: "sapUiTinyMargin",
              children: [_jsx(Label, {
                text: "{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_DISCARD_RBL}",
                design: "Bold"
              }), _jsx(Text, {
                text: "{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_DISCARD_TOL}"
              })]
            })
          })]
        }
      });
      this.dialog = _jsxs(Dialog, {
        title: "{sap.fe.i18n>WARNING}",
        type: "Message",
        contentWidth: "22rem",
        state: ValueState.Warning,
        children: [{
          content: [_jsx(Text, {
            text: "{sap.fe.i18n>C_INLINE_EDIT_BEFORENAVIGATION_MESSAGE}",
            class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
          }), this.optionsList]
        }, {
          beginButton: _jsx(Button, {
            type: "Emphasized",
            text: "{sap.fe.i18n>C_COMMON_DIALOG_OK}",
            press: () => this.closeAndOK()
          })
        }, {
          endButton: _jsx(Button, {
            text: "{sap.fe.i18n>C_COMMON_DIALOG_CANCEL}",
            press: () => this.closeAndCancel()
          })
        }]
      });
      view.addDependent(this.dialog);
    }

    /**
     * Open the dialog.
     */
    _exports = BeforeNavigationDialog;
    var _proto = BeforeNavigationDialog.prototype;
    _proto.open = function open() {
      this.dialog.open();
      this.selectAndFocusFirstEntry();
    }

    /**
     * Gets the key of the selected item from the list of options that was set via customData.
     * @returns The key of the currently selected item
     */;
    _proto.getSelectedKey = function getSelectedKey() {
      const optionsList = this.optionsList;
      return optionsList.getSelectedItem().data("itemKey");
    }

    /**
     * Sets the focus on the first list item of the dialog.
     *
     */;
    _proto.selectAndFocusFirstEntry = function selectAndFocusFirstEntry() {
      const firstListItemOption = this.optionsList.getItems()[0];
      this.optionsList.setSelectedItem(firstListItemOption);
      // We do not set the focus on the button, but catch the ENTER key in the dialog
      // and process it as Ok, since focusing the button was reported as an ACC issue
      firstListItemOption?.focus();
    }

    /**
     * Close the dialog and call the callBack with the selected key.
     * @private
     */;
    _proto.closeAndOK = function closeAndOK() {
      if (this.getSelectedKey() === "SAVE") {
        this.dialogCallBack(DIALOGRESULT.SAVE);
      } else {
        this.dialogCallBack(DIALOGRESULT.DISCARD);
      }
      this.dialog.close();
      this.dialog.destroy();
    }

    /**
     * Close the dialog and call the callBack with 'CANCEL'.
     * @private
     */;
    _proto.closeAndCancel = function closeAndCancel() {
      this.dialogCallBack(DIALOGRESULT.CANCEL);
      this.dialog.close();
      this.dialog.destroy();
    };
    return BeforeNavigationDialog;
  }();
  _exports = BeforeNavigationDialog;
  return _exports;
}, false);
//# sourceMappingURL=BeforeNavigationDialog-dbg.js.map
