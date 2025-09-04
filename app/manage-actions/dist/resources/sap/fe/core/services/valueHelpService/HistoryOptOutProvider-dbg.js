/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/m/Button", "sap/m/Dialog", "sap/m/FlexBox", "sap/m/HBox", "sap/m/Label", "sap/m/MessageBox", "sap/m/Switch", "sap/m/VBox", "sap/ui/core/IconPool", "sap/ui/core/Lib"], function (Log, Button, Dialog, FlexBox, HBox, Label, MessageBox, Switch, VBox, IconPool, Library) {
  "use strict";

  var _exports = {};
  let HistoryOptOutProvider = /*#__PURE__*/function () {
    function HistoryOptOutProvider(valueHelpHistoryService) {
      this.resourceBundle = Library.getResourceBundleFor("sap.fe.core");
      this.valueHelpHistoryService = valueHelpHistoryService;
    }
    _exports = HistoryOptOutProvider;
    var _proto = HistoryOptOutProvider.prototype;
    _proto.getDialog = function getDialog() {
      return this.dialog;
    }

    /**
     * For history settings we need to create a user profile entry and a handler for opening the dialog.
     * @returns Promise that is resolved when user menu entry control is created
     */;
    _proto.createOptOutUserProfileEntry = async function createOptOutUserProfileEntry() {
      const shellExtensionService = this.valueHelpHistoryService.getShellExtensionService();
      let userAction;
      try {
        userAction = await shellExtensionService.createUserAction({
          id: "sapui5.history.optOut.trigger",
          text: this.resourceBundle.getText("C_HISTORY_SETTING_TITLE"),
          icon: IconPool.getIconURI("history"),
          press: async () => {
            this.historyEnabledSwitch = new Switch();
            this.dialog = this.createDialog();
            const enabled = await this.valueHelpHistoryService.getHistoryEnabled();
            this.historyEnabledSwitch.setState(enabled);
            this.dialog.open();
          }
        }, {
          controlType: "sap.m.Button"
        });
        userAction.showForCurrentApp();
      } catch (err) {
        Log.error("Cannot add user action", err instanceof Error ? err.message : String(err));
      }
      return userAction;
    }

    /*
    	Create Controls
     */

    /**
     * For the history setting dialog we need to create all the necessary UI elements for the
     * enable history tracking switch and the clear history button.
     * @returns The dialog layout
     */;
    _proto.createDialogLayout = function createDialogLayout() {
      const historyEnabledLabel = new Label({
        text: this.resourceBundle.getText("C_HISTORY_SETTING_ENABLE_TRACKING_DESCRIPTION"),
        labelFor: this.historyEnabledSwitch
      }).addStyleClass("sapUiSmallMarginEnd");
      const historyEnabledLayout = new HBox({
        alignItems: "Center",
        items: [historyEnabledLabel, this.historyEnabledSwitch]
      });
      const deleteHistoryButton = new Button({
        busyIndicatorDelay: 0,
        text: this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_BUTTON"),
        press: this.onDeleteHistoryPress.bind(this)
      });
      const deleteHistoryLabel = new Label({
        text: this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_DESCRIPTION"),
        labelFor: deleteHistoryButton
      }).addStyleClass("sapUiSmallMarginEnd");
      const deleteHistoryLayout = new FlexBox({
        alignItems: "Center",
        items: [deleteHistoryLabel, deleteHistoryButton]
      });
      return new VBox({
        items: [historyEnabledLayout, deleteHistoryLayout]
      }).addStyleClass("sapUiSmallMargin");
    }

    /**
     * Create history setting dialog with save and cancel buttons.
     * @returns The dialog for the history settings
     */;
    _proto.createDialog = function createDialog() {
      const dialogLayout = this.createDialogLayout();
      const saveButton = new Button({
        text: this.resourceBundle.getText("C_HISTORY_SETTING_SAVE"),
        press: this.onSavePress.bind(this)
      });
      const cancelButton = new Button({
        text: this.resourceBundle.getText("C_HISTORY_SETTING_CANCEL"),
        press: () => this.closeDialog()
      });
      return new Dialog("sapui5.history.optOutDialog", {
        title: this.resourceBundle.getText("C_HISTORY_SETTING_TITLE"),
        content: [dialogLayout],
        buttons: [saveButton, cancelButton],
        afterClose: () => {
          // When the dialog is closed we need to free the resources
          this.dialog?.destroy();
          this.dialog = undefined;
          this.historyEnabledSwitch = undefined;
        }
      });
    }

    /*
    	Handlers
     */

    /**
     * Handler which is called on clear history button press.
     * @param event Button press event
     */;
    _proto.onDeleteHistoryPress = function onDeleteHistoryPress(event) {
      const button = event.getSource();
      button.setBusy(true);
      MessageBox.confirm(this.resourceBundle.getText("C_HISTORY_SETTING_DELETE_CONFIRM_MESSAGE"), {
        onClose: async result => {
          if (result === "CANCEL") {
            return;
          }
          await this.valueHelpHistoryService.deleteHistoryForAllApps().then(function () {
            return window.location.reload();
          });
          this.closeDialog();
        }
      });
      button.setBusy(false);
    }

    /**
     * Handler which is called on save button press.
     */;
    _proto.onSavePress = function onSavePress() {
      MessageBox.confirm(this.resourceBundle.getText("C_HISTORY_SETTING_SAVE_CONFIRM_MESSAGE"), {
        onClose: async result => {
          if (result === "CANCEL") {
            return;
          }
          const enabled = this.historyEnabledSwitch?.getState() ?? false;
          await this.valueHelpHistoryService.setHistoryEnabled(enabled);
          this.closeDialog();
        }
      });
    }

    /**
     * Close the dialog.
     */;
    _proto.closeDialog = function closeDialog() {
      this.dialog?.close();
    };
    return HistoryOptOutProvider;
  }();
  _exports = HistoryOptOutProvider;
  return _exports;
}, false);
//# sourceMappingURL=HistoryOptOutProvider-dbg.js.map
