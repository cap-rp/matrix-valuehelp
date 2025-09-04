/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Button", "sap/m/Dialog", "sap/m/Page", "sap/m/Panel", "sap/ui/core/Component", "sap/ui/core/util/reflection/JsControlTreeModifier", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, Action, ResourceModelHelper, Button, Dialog, Page, Panel, Component, JsControlTreeModifier, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var ButtonType = Action.ButtonType;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let TableFullScreenButton = (_dec = defineUI5Class("sap.fe.macros.table.TableFullScreenButton"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function TableFullScreenButton(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _this.tablePlaceHolderPanel = new Panel();
      _this.tablePlaceHolderPanel.data("FullScreenTablePlaceHolder", true);
      return _this;
    }
    _exports = TableFullScreenButton;
    _inheritsLoose(TableFullScreenButton, _BuildingBlock);
    var _proto = TableFullScreenButton.prototype;
    _proto.getTableAPI = function getTableAPI() {
      if (!this.tableAPI) {
        let currentControl = this.content;
        do {
          currentControl = currentControl.getParent();
        } while (!currentControl.isA("sap.fe.macros.table.TableAPI"));
        this.tableAPI = currentControl;
        return this.tableAPI;
      } else {
        return this.tableAPI;
      }
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.initializeContent();
      }
    }

    /**
     * Set the focus back to the full screen button after opening the dialog.
     */;
    _proto.afterDialogOpen = function afterDialogOpen() {
      this.content?.focus();
    }

    /**
     * Handle dialog close via Esc, navigation etc.
     */;
    _proto.beforeDialogClose = function beforeDialogClose() {
      this.getTableAPI().setFullScreenDialog(undefined);
      this.restoreNormalState();
    }

    /**
     * Some follow up after closing the dialog.
     */;
    _proto.afterDialogClose = function afterDialogClose() {
      this.fullScreenDialog?.destroy();
      this.fullScreenDialog = undefined;
      const component = Component.getOwnerComponentFor(this.getTableAPI());
      const appComponent = Component.getOwnerComponentFor(component);
      this.content?.focus();
      // trigger the automatic scroll to the latest navigated row :
      appComponent?.getRootViewController()._scrollTablesToLastNavigatedItems();
    }

    /**
     * Create the full screen dialog.
     * @returns The new dialog
     */;
    _proto.createDialog = function createDialog() {
      const endButton = _jsx(Button, {
        text: this.resourceModel.getText("M_COMMON_TABLE_FULLSCREEN_CLOSE"),
        type: ButtonType.Transparent,
        press: () => {
          // Just close the dialog here, all the needed processing is triggered
          // in beforeClose.
          // This ensures, that we only do it once event if the user presses the
          // ESC key and the Close button simultaneously
          this.fullScreenDialog?.close();
        }
      });
      const newDialog = _jsx(Dialog, {
        showHeader: false,
        stretch: true,
        afterOpen: this.afterDialogOpen.bind(this),
        beforeClose: this.beforeDialogClose.bind(this),
        afterClose: this.afterDialogClose.bind(this),
        endButton: endButton,
        content: _jsx(Page, {})
      });

      // The below is needed for correctly setting the focus after adding a new row in
      // the table in fullscreen mode
      newDialog.data("FullScreenDialog", true);
      return newDialog;
    }

    /**
     * Restores the table to its "normal" state (non fullscreen).
     * Changes the button icon and text and moves the table back to its original place.
     */;
    _proto.restoreNormalState = function restoreNormalState() {
      const tableAPI = this.getTableAPI();
      try {
        // The MDC table shall ignore the contextChange event during the switch to fullscreen,
        // as it can cause a rebind of the table and thus a loss of the current expansion state
        tableAPI.setIgnoreContextChangeEvent(true);

        // change the button icon and text
        this.content?.setIcon("sap-icon://full-screen");
        this.content?.setTooltip(this.resourceModel.getText("M_COMMON_TABLE_FULLSCREEN_MAXIMIZE"));

        //set the rowCountMode to the initial value (if it was set in the manifest)
        if (tableAPI.getTableDefinition().control.type === "GridTable" || tableAPI.getTableDefinition().control.type === "TreeTable" && tableAPI.getTableDefinition().control.rowCountMode) {
          tableAPI.getContent().getType().setRowCountMode(tableAPI.getTableDefinition().control.rowCountMode);
        }

        // Move the table back to the old place and close the dialog
        const aggregation = this.originalTableParent.getAggregation(this.originalAggregationName);
        if (Array.isArray(aggregation)) {
          this.originalTableParent.removeAggregation(this.originalAggregationName, this.tablePlaceHolderPanel);
          this.originalTableParent.addAggregation(this.originalAggregationName, tableAPI);
        } else {
          this.originalTableParent.setAggregation(this.originalAggregationName, tableAPI);
        }
      } finally {
        tableAPI.setIgnoreContextChangeEvent(false);
      }
    }

    /**
     * Displays the table in "fullscreen" mode.
     * Changes the button icon and text, creates a dialog and moves the table into it.
     */;
    _proto.setFullScreenState = async function setFullScreenState() {
      const tableAPI = this.getTableAPI();
      try {
        // The MDC table shall ignore the contextChange event during the switch to fullscreen,
        // as it can cause a rebind of the table and thus a loss of the current expansion state
        tableAPI.setIgnoreContextChangeEvent(true);

        // change the button icon and text
        this.content?.setIcon("sap-icon://exit-full-screen");
        this.content?.setTooltip(this.resourceModel.getText("M_COMMON_TABLE_FULLSCREEN_MINIMIZE"));
        this.tablePlaceHolderPanel.data("tableAPIreference", tableAPI);

        // Store the current location of the table to be able to move it back later
        this.originalTableParent = tableAPI.getParent();
        this.originalAggregationName = await JsControlTreeModifier.getParentAggregationName(tableAPI);

        // Replace the current position of the table with an empty Panel as a placeholder
        const aggregation = this.originalTableParent.getAggregation(this.originalAggregationName);
        if (Array.isArray(aggregation)) {
          this.originalTableParent.removeAggregation(this.originalAggregationName, tableAPI);
          this.originalTableParent.addAggregation(this.originalAggregationName, this.tablePlaceHolderPanel);
        } else {
          this.originalTableParent.setAggregation(this.originalAggregationName, this.tablePlaceHolderPanel);
        }

        // Create the full screen dialog
        this.fullScreenDialog = this.createDialog();
        // Add the dialog as a dependent to the original parent of the table in order to not lose the context
        this.originalTableParent?.addDependent(this.fullScreenDialog);

        //Ensure that the rowCountMode of the mdc table is set to "Auto" to avoid the table from being cut off in fullscreen mode
        if (tableAPI.getTableDefinition().control.type === "GridTable" || tableAPI.getTableDefinition().control.type === "TreeTable") {
          tableAPI.getContent().getType().setRowCountMode("Auto");
        }

        // Move the table over into the content page in the dialog and open the dialog
        this.fullScreenDialog.getContent()[0].addContent(this.getTableAPI());
        this.fullScreenDialog.open();
        tableAPI.setFullScreenDialog(this.fullScreenDialog);
      } finally {
        tableAPI.setIgnoreContextChangeEvent(false);
      }
    }

    /**
     * Switches the table between normal display and fullscreen.
     */;
    _proto.onFullScreenToggle = async function onFullScreenToggle() {
      if (this.fullScreenDialog) {
        // The dialog is open --> close it
        this.fullScreenDialog.close();
      } else {
        // Create a new fullscreen dialog
        await this.setFullScreenState();
      }
    }

    /**
     * Created the content (i.e. the button).
     */;
    _proto.initializeContent = function initializeContent() {
      this.resourceModel = getResourceModel(this);
      this.content = _jsx(Button, {
        id: this.createId("_btn"),
        tooltip: this.resourceModel.getText("M_COMMON_TABLE_FULLSCREEN_MAXIMIZE"),
        icon: "sap-icon://full-screen",
        press: this.onFullScreenToggle.bind(this),
        type: "Transparent",
        visible: true,
        enabled: true
      });
    };
    return TableFullScreenButton;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TableFullScreenButton;
  return _exports;
}, false);
//# sourceMappingURL=TableFullScreenButton-dbg.js.map
