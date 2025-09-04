/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/p13n/Popup", "sap/m/p13n/SelectionPanel", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx"], function (Popup, SelectionPanel, Library, _jsx) {
  "use strict";

  var _exports = {};
  let MassEditDesignDialog = /*#__PURE__*/function () {
    function MassEditDesignDialog(tableAPI) {
      this.tableAPI = tableAPI;
      this.massEditDialogHelper = this.tableAPI.getMassEditDialogHelper();
      this.popup = this.createDialog();
      this.selectionPanel = this.popup.getPanels()[0];
      this.dialogPromise = new Promise((resolve, reject) => {
        this._fnResolve = resolve;
        this._fnReject = reject;
      });
    }

    /**
     * Creates the dialog for the mass edit adaptation.
     * @returns The popup
     */
    _exports = MassEditDesignDialog;
    var _proto = MassEditDesignDialog.prototype;
    _proto.createDialog = function createDialog() {
      return _jsx(Popup, {
        title: Library.getResourceBundleFor("sap.fe.macros").getText("C_MASS_EDIT_DESIGN_DIALOG_TITLE"),
        mode: "Dialog",
        panels: [_jsx(SelectionPanel, {
          title: "Columns",
          enableCount: "true",
          showHeader: "true"
        })],
        close: this.onClose.bind(this)
      });
    }

    /**
     * Gets the dialog for the mass edit adaptation.
     * @returns The popup
     */;
    _proto.getPopup = function getPopup() {
      return this.popup;
    }

    /**
     * Opens the dialog for the mass edit adaptation.
     * @param owner The owner of the dialog
     * @param selectedFields The selected fields
     * @returns The new selected fields
     */;
    _proto.openDialog = async function openDialog(owner, selectedFields) {
      await this.setData(selectedFields);
      this.popup.open(owner);
      this.popup.getDependents().find(control => control.isA("sap.m.Dialog"))?.addStyleClass("sapUiRTABorder");
      return this.dialogPromise;
    }

    /**
     * Sets the p13n data for the dialog.
     * @param selectedFields The selected fields
     */;
    _proto.setData = async function setData(selectedFields) {
      const displayedFields = Object.assign({}, ...selectedFields.split(",").map(fieldName => ({
        [fieldName]: true
      })));
      const entityFields = await this.massEditDialogHelper.generateEntityFieldsProperties();
      const p13nData = entityFields.map(field => {
        return {
          visible: !!displayedFields[field.propertyInfo.relativePath],
          name: field.propertyInfo.relativePath,
          label: field.label
        };
      });
      this.selectionPanel.setP13nData(p13nData);
    }

    /**
     * Closes and destroys the dialog.
     * @param event The close event
     */;
    _proto.onClose = function onClose(event) {
      if (event.getParameter("reason") === "Ok") {
        this._fnResolve(this.selectionPanel.getP13nData(true).map(item => item.name).join(","));
      } else {
        this._fnReject(undefined);
      }
      if (this.popup) {
        this.popup.destroy();
      }
    };
    return MassEditDesignDialog;
  }();
  _exports = MassEditDesignDialog;
  return _exports;
}, false);
//# sourceMappingURL=MassEditDesignDialog-dbg.js.map
