/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/templating/EntityTypeHelper", "sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/HBox", "sap/m/List", "sap/m/Text", "sap/m/VBox", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (EntityTypeHelper, Button, CustomListItem, Dialog, HBox, List, Text, VBox, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _exports = {};
  var getTitleExpression = EntityTypeHelper.getTitleExpression;
  /**
   * Display a dialog to inform the user that some contexts are not applicable for the action.
   * This is not the target Ux but just keeping the current behavior
   */
  let NotApplicableContextDialog = /*#__PURE__*/function () {
    function NotApplicableContextDialog(props) {
      this.title = props.title;
      this.resourceModel = props.resourceModel;
      this.entityType = props.entityType;
      this.notApplicableContexts = props.notApplicableContexts;
      this._shouldContinue = false;
      this.actionName = props.actionName;
      this.entitySetName = props.entitySet;
      this._dialog = this.createDialog();
      this._processingPromise = new Promise(resolve => {
        this._fnResolve = resolve;
      });
    }
    _exports = NotApplicableContextDialog;
    var _proto = NotApplicableContextDialog.prototype;
    _proto.onAfterClose = function onAfterClose() {
      this._fnResolve(this._shouldContinue);
      this._dialog.destroy();
    };
    _proto.onContinue = function onContinue() {
      this._shouldContinue = true;
      this._dialog.close();
    };
    _proto.open = async function open(owner) {
      owner.addDependent(this._dialog);
      this._dialog.open();
      return this._processingPromise;
    };
    _proto.getDialog = function getDialog() {
      return this._dialog;
    };
    _proto.createDialog = function createDialog() {
      let boundActionName = this.actionName;
      boundActionName = boundActionName?.includes(".") ? boundActionName?.split(".")[boundActionName?.split(".").length - 1] : boundActionName;
      const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
      return _jsx(Dialog, {
        state: "Warning",
        showHeader: true,
        resizable: true,
        verticalScrolling: true,
        horizontalScrolling: true,
        class: "sapUiContentPadding",
        title: this.getTitleText(this.title),
        afterClose: this.onAfterClose.bind(this),
        children: {
          beginButton: _jsx(Button, {
            text: this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_CONTINUE_ANYWAY", undefined, suffixResourceKey),
            press: this.onContinue.bind(this),
            type: "Emphasized"
          }),
          endButton: _jsx(Button, {
            text: this.resourceModel.getText("C_COMMON_SAPFE_CLOSE"),
            press: () => this._dialog.close()
          }),
          content: _jsxs(_Fragment, {
            children: [_jsx(VBox, {
              children: _jsx(Text, {
                text: this.notApplicableContexts.length === 1 ? this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION", undefined, suffixResourceKey) : this.resourceModel.getText("C_ACTION_PARTIAL_FRAGMENT_SAPFE_BOUND_ACTION_PLURAL", [this.notApplicableContexts.length], suffixResourceKey),
                class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
              })
            }), _jsx(List, {
              headerText: this.entityType.annotations.UI?.HeaderInfo?.TypeNamePlural,
              showSeparators: "None",
              children: {
                items: this.notApplicableContexts.map(notApplicableContext => {
                  // Either show the HeaderInfoName or the Semantic Key property
                  const titleExpression = getTitleExpression(this.entityType);
                  const customListItem = _jsx(CustomListItem, {
                    children: _jsx(HBox, {
                      justifyContent: "Start",
                      children: _jsx(Text, {
                        text: titleExpression,
                        class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
                      })
                    })
                  });
                  customListItem.setBindingContext(notApplicableContext);
                  return customListItem;
                })
              }
            })]
          })
        }
      });
    }

    /**
     * Gets the title of the dialog.
     * @param actionLabel The label of the action
     * @returns The title.
     */;
    _proto.getTitleText = function getTitleText(actionLabel) {
      const key = "ACTION_PARAMETER_DIALOG_ACTION_TITLE";
      const defaultKey = "C_OPERATIONS_ACTION_PARAMETER_DIALOG_TITLE";
      return this.getOverriddenText(key, defaultKey, actionLabel);
    }

    /**
     * Gets an overridden text.
     * @param key The key for an overridden text
     * @param defaultKey The default key for the text
     * @param actionLabel The label of the action
     * @returns The overridden text or label.
     */;
    _proto.getOverriddenText = function getOverriddenText(key, defaultKey, actionLabel) {
      let boundActionName = this.actionName;
      boundActionName = boundActionName?.split(".").pop() ?? boundActionName;
      const suffixResourceKey = boundActionName && this.entitySetName ? `${this.entitySetName}|${boundActionName}` : "";
      if (actionLabel) {
        if (this.resourceModel.checkIfResourceKeyExists(`${key}|${suffixResourceKey}`)) {
          return this.resourceModel.getText(key, undefined, suffixResourceKey);
        } else if (this.resourceModel.checkIfResourceKeyExists(`${key}|${this.entitySetName}`)) {
          return this.resourceModel.getText(key, undefined, `${this.entitySetName}`);
        } else if (this.resourceModel.checkIfResourceKeyExists(`${key}`)) {
          return this.resourceModel.getText(key);
        } else {
          return actionLabel;
        }
      } else {
        return this.resourceModel.getText(defaultKey);
      }
    };
    return NotApplicableContextDialog;
  }();
  _exports = NotApplicableContextDialog;
  return _exports;
}, false);
//# sourceMappingURL=NotApplicableContextDialog-dbg.js.map
