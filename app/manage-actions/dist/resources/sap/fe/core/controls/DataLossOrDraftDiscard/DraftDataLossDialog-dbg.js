/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/Label", "sap/m/List", "sap/m/Text", "sap/m/VBox", "sap/ui/base/ManagedObject", "sap/ui/core/CustomData", "sap/ui/core/library", "../../CommonUtils", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs", "sap/fe/base/jsx-runtime/Fragment"], function (ClassSupport, ResourceModelHelper, StableIdHelper, Button, CustomListItem, Dialog, Label, List, Text, VBox, ManagedObject, CustomData, library, CommonUtils, _jsx, _jsxs, _Fragment) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var ValueState = library.ValueState;
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let DraftDataLossDialog = (_dec = defineUI5Class("sap.fe.core.controls.DataLossOrDraftDiscard.DraftDataLossDialog"), _dec2 = defineReference(), _dec3 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_ManagedObject) {
    function DraftDataLossDialog() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _ManagedObject.call(this, ...args) || this;
      _initializerDefineProperty(_this, "dataLossDialog", _descriptor, _this);
      _initializerDefineProperty(_this, "optionsList", _descriptor2, _this);
      _this.shallForceDraftSaveOrDiscard = false;
      return _this;
    }
    _exports = DraftDataLossDialog;
    _inheritsLoose(DraftDataLossDialog, _ManagedObject);
    var _proto = DraftDataLossDialog.prototype;
    /**
     * Opens the data loss dialog.
     * @param controller
     */
    _proto.open = async function open(controller) {
      this.view = controller.getView();
      const appComponent = CommonUtils.getAppComponent(this.view);
      this.isHiddenDraft = appComponent.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
      const viewContext = this.view.getBindingContext();
      this.isRootContextNew = viewContext ? await controller.editFlow.isRootContextNew(viewContext) : false;
      this.shallForceDraftSaveOrDiscard = controller.editFlow.shallForceDraftSaveOrDiscard();
      this.dataLossResourceModel = getResourceModel(this.view);
      this.createContent();
      const dataLossConfirm = () => this.handleDataLossOk();
      this.optionsList.current?.addEventDelegate({
        onkeyup: function (e) {
          if (e.key === "Enter") {
            dataLossConfirm();
          }
        }
      });
      this.view.addDependent(this.dataLossDialog.current);
      this.dataLossDialog.current?.open();
      this.selectAndFocusFirstEntry();
      return new Promise(resolve => {
        this.promiseResolve = resolve;
      });
    }

    /**
     * Handler to close the dataloss dialog.
     *
     */;
    _proto.close = function close() {
      this.dataLossDialog.current?.close();
      this.dataLossDialog.current?.destroy();
    }

    /**
     * Executes the logic when the data loss dialog is confirmed. The selection of an option resolves the promise and leads to the
     * processing of the originally triggered action like e.g. a back navigation.
     *
     */;
    _proto.handleDataLossOk = function handleDataLossOk() {
      this.promiseResolve(this.getSelectedKey());
    }

    /**
     * Handler to close the dataloss dialog.
     *
     */;
    _proto.handleDataLossCancel = function handleDataLossCancel() {
      this.promiseResolve("cancel");
    }

    /**
     * Sets the focus on the first list item of the dialog.
     *
     */;
    _proto.selectAndFocusFirstEntry = function selectAndFocusFirstEntry() {
      const firstListItemOption = this.optionsList.current?.getItems()[0];
      this.optionsList.current?.setSelectedItem(firstListItemOption);
      // We do not set the focus on the button, but catch the ENTER key in the dialog
      // and process it as Ok, since focusing the button was reported as an ACC issue
      firstListItemOption?.focus();
    }

    /**
     * Gets the key of the selected item from the list of options that was set via customData.
     * @returns The key of the currently selected item
     */;
    _proto.getSelectedKey = function getSelectedKey() {
      const optionsList = this.optionsList.current;
      return optionsList.getSelectedItem().data("itemKey");
    }

    /**
     * Returns the confirm button.
     * @returns A button
     */;
    _proto.getConfirmButton = function getConfirmButton() {
      return _jsx(Button, {
        text: this.dataLossResourceModel.getText("C_COMMON_DIALOG_OK"),
        type: "Emphasized",
        press: () => this.handleDataLossOk()
      });
    }

    /**
     * Returns the cancel button.
     * @returns A button
     */;
    _proto.getCancelButton = function getCancelButton() {
      return _jsx(Button, {
        text: this.isHiddenDraft ? this.dataLossResourceModel.getText("C_COMMON_SAPFE_CLOSE") : this.dataLossResourceModel.getText("C_COMMON_DIALOG_CANCEL"),
        press: () => this.handleDataLossCancel()
      });
    }

    /**
     * Returns the options available in the dialog.
     * @param isSave
     * @returns The options as CustomListItems
     */;
    _proto.getItems = function getItems(isSave) {
      let createOrSaveText = "";
      let createOrSaveLabel = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_RBL");
      if (isSave) {
        createOrSaveText = this.isHiddenDraft ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_HIDDEN_DRAFT_TOL") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_SAVE_DRAFT_TOL");
      } else {
        createOrSaveLabel = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_RBL");
        createOrSaveText = this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_CREATE_ENTITY_TOL");
      }
      const items = [];
      items.push(_jsx(CustomListItem, {
        customData: [new CustomData({
          key: "itemKey",
          value: "draftDataLossOptionSave"
        })],
        children: _jsxs(VBox, {
          class: "sapUiTinyMargin",
          children: [_jsx(Label, {
            text: createOrSaveLabel,
            design: "Bold"
          }), _jsx(Text, {
            text: createOrSaveText
          })]
        })
      }));

      // The option to keep the draft is not available for new drafts and if shallForceDraftSaveOrDiscard === true
      // (TreeTable in the ListReport)
      if ((isSave || !this.shallForceDraftSaveOrDiscard) && !this.isHiddenDraft) {
        items.push(_jsx(CustomListItem, {
          customData: [new CustomData({
            key: "itemKey",
            value: "draftDataLossOptionKeep"
          })],
          children: _jsxs(VBox, {
            class: "sapUiTinyMargin",
            children: [_jsx(Label, {
              text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_RBL"),
              design: "Bold"
            }), _jsx(Text, {
              text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_KEEP_DRAFT_TOL")
            })]
          })
        }));
      }
      items.push(_jsx(CustomListItem, {
        customData: [new CustomData({
          key: "itemKey",
          value: "draftDataLossOptionDiscard"
        })],
        children: _jsxs(VBox, {
          class: "sapUiTinyMargin",
          children: [_jsx(Label, {
            text: this.isHiddenDraft ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_HIDDEN_DRAFT_RBL") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_RBL"),
            design: "Bold"
          }), _jsx(Text, {
            text: this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_DISCARD_DRAFT_TOL")
          })]
        })
      }));
      return items;
    }

    /**
     * The building block render function.
     * @returns An XML-based string
     */;
    _proto.createContent = function createContent() {
      const hasActiveEntity = this.view.getBindingContext()?.getObject().HasActiveEntity === true;
      const isSave = this.isHiddenDraft ? !this.isRootContextNew : hasActiveEntity;
      const description = isSave ? this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_SAVE") : this.dataLossResourceModel.getText("ST_DRAFT_DATALOSS_POPUP_MESSAGE_CREATE");
      return _jsx(Dialog, {
        id: generate([this.getId(), "draftDataLossDialog"]),
        title: this.dataLossResourceModel.getText("WARNING"),
        state: ValueState.Warning,
        type: "Message",
        contentWidth: "22rem",
        ref: this.dataLossDialog,
        children: {
          content: _jsxs(_Fragment, {
            children: [_jsx(Text, {
              text: description,
              class: "sapUiTinyMarginBegin sapUiTinyMarginTopBottom"
            }), _jsx(List, {
              mode: "SingleSelectLeft",
              showSeparators: "None",
              includeItemInSelection: "true",
              backgroundDesign: "Transparent",
              class: "sapUiNoContentPadding",
              ref: this.optionsList,
              items: this.getItems(isSave)
            })]
          }),
          buttons: _jsxs(_Fragment, {
            children: ["confirmButton = ", this.getConfirmButton(), "cancelButton = ", this.getCancelButton()]
          })
        }
      });
    };
    return DraftDataLossDialog;
  }(ManagedObject), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "dataLossDialog", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "optionsList", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = DraftDataLossDialog;
  return _exports;
}, false);
//# sourceMappingURL=DraftDataLossDialog-dbg.js.map
