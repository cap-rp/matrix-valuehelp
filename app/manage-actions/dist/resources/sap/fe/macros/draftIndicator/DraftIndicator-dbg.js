/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/strings/formatMessage", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/BindingHelper", "sap/m/Button", "sap/m/ObjectMarker", "sap/m/Popover", "sap/m/Text", "sap/m/VBox", "sap/m/library", "sap/ui/core/Lib", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (formatMessage, BindingToolkit, ClassSupport, CommonUtils, BuildingBlock, BindingHelper, Button, ObjectMarker, Popover, Text, VBox, library, Library, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var ObjectMarkerVisibility = library.ObjectMarkerVisibility;
  var ObjectMarkerType = library.ObjectMarkerType;
  var UI = BindingHelper.UI;
  var Entity = BindingHelper.Entity;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isEmpty = BindingToolkit.isEmpty;
  var ifElse = BindingToolkit.ifElse;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a DraftIndicator based on the metadata provided by OData V4.
   *
   * Usage example:
   * <pre>
   * &lt;macros:DraftIndicator
   * id="SomeID"
   * /&gt;
   * </pre>
   * @private
   */
  let DraftIndicator = (_dec = defineUI5Class("sap.fe.macros.draftIndicator.DraftIndicator"), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string",
    required: true
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean"
  }), _dec7 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function DraftIndicator(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * ID of the DraftIndicator
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "draftIndicatorType", _descriptor2, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      _initializerDefineProperty(_this, "class", _descriptor4, _this);
      _initializerDefineProperty(_this, "usedInTable", _descriptor5, _this);
      _initializerDefineProperty(_this, "usedInAnalyticalTable", _descriptor6, _this);
      return _this;
    }
    _exports = DraftIndicator;
    _inheritsLoose(DraftIndicator, _BuildingBlock);
    var _proto = DraftIndicator.prototype;
    _proto.setDraftIndicatorType = function setDraftIndicatorType(indicator) {
      if ([ObjectMarkerVisibility.IconOnly, ObjectMarkerVisibility.IconAndText].includes(indicator)) {
        this.setProperty("draftIndicatorType", indicator);
      } else {
        throw new Error(`Allowed value ${indicator} does not match`);
      }
    };
    _proto.addAriaLabelledByForDraftIndicator = function addAriaLabelledByForDraftIndicator(element) {
      const ariaLabelledBys = this.content?.getAriaLabelledBy() ?? [];
      if (!ariaLabelledBys.includes(element)) {
        this.content?.addAriaLabelledBy(element);
      }
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        this.content = this.createContent();
      }
    }

    /**
     * Runtime formatter function to format the correct text that displays the owner of a draft.
     *
     * This is used in case the DraftIndicator is shown for an active entity that has a draft of another user.
     * @param hasDraftEntity
     * @param draftInProcessByUser
     * @param draftLastChangedByUser
     * @param draftInProcessByUserDesc
     * @param draftLastChangedByUserDesc
     * @returns Text to display
     */;
    DraftIndicator.formatDraftOwnerTextInPopover = function formatDraftOwnerTextInPopover(hasDraftEntity, draftInProcessByUser, draftLastChangedByUser, draftInProcessByUserDesc, draftLastChangedByUserDesc) {
      const macroResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      if (!macroResourceBundle) {
        return "";
      }
      if (hasDraftEntity) {
        const userDescription = draftInProcessByUserDesc || draftInProcessByUser || draftLastChangedByUserDesc || draftLastChangedByUser;
        if (!userDescription) {
          return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_UNKNOWN");
        } else {
          return draftInProcessByUser ? macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_LOCKED_BY_KNOWN", [userDescription]) : macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_KNOWN", [userDescription]);
        }
      } else {
        return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_NO_DATA_TEXT");
      }
    }

    /***
     * Gets the properties of the DraftAdministrativeData entity connected to the given entity set
     *
     * @returns List of property names
     */;
    _proto.getDraftAdministrativeDataProperties = function getDraftAdministrativeDataProperties() {
      const metaData = this.getDataModelObjectPath(this.contextPath);
      const draftAdminElement = metaData?.targetEntityType.navigationProperties.find(a => a.name === "DraftAdministrativeData");
      const draftAdminProperties = draftAdminElement?.targetType.entityProperties;
      return draftAdminProperties?.map(oDraftAdminProperty => oDraftAdminProperty.name);
    }

    /**
     * Constructs the binding expression for the text displayed as title of the popup.
     * @returns The binding expression
     */;
    _proto.getPopoverTitleBindingExpression = function getPopoverTitleBindingExpression() {
      return ifElse(not(Entity.IsActive), this.isHiddenDraftEnabled ? pathInModel("M_DRAFT_POPOVER_ADMIN_UNSAVED_OBJECT", "sap.fe.i18n") : pathInModel("M_COMMON_DRAFT_OBJECT", "sap.fe.i18n"), ifElse(Entity.HasDraft, ifElse(not(isEmpty(pathInModel("DraftAdministrativeData/InProcessByUser"))), pathInModel("M_COMMON_DRAFT_LOCKED_OBJECT", "sap.fe.i18n"), pathInModel("M_DRAFT_POPOVER_ADMIN_UNSAVED_OBJECT", "sap.fe.i18n")), this.draftIndicatorType === ObjectMarkerVisibility.IconAndText ? " " : pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_FLAGGED_OBJECT", "sap.fe.i18n")));
    }

    /**
     * Constructs the binding expression for the text displayed to identify the draft owner in the popup.
     * This binding is configured to call formatDraftOwnerTextInPopover at runtime.
     *
     * We cannot reference formatDraftOwnerTextInPopover directly as we need to conditionally pass properties that might exist or not,
     * and referring to non-existing properties fails the binding.
     * @returns The binding expression
     */;
    _proto.getDraftOwnerTextBindingExpression = function getDraftOwnerTextBindingExpression() {
      const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();
      const parts = [{
        path: "HasDraftEntity",
        targetType: "any"
      }, {
        path: "DraftAdministrativeData/InProcessByUser"
      }, {
        path: "DraftAdministrativeData/LastChangedByUser"
      }];
      if (draftAdministrativeDataProperties?.includes("InProcessByUserDescription")) {
        parts.push({
          path: "DraftAdministrativeData/InProcessByUserDescription"
        });
      }
      if (draftAdministrativeDataProperties?.includes("LastChangedByUserDescription")) {
        parts.push({
          path: "DraftAdministrativeData/LastChangedByUserDescription"
        });
      }

      //parts.push({path: "sap.fe.i18n>"})

      return {
        parts,
        formatter: DraftIndicator.formatDraftOwnerTextInPopover
      };
    }

    /**
     * Creates a popover control to display draft information.
     * @param control Control that the popover is to be created for
     * @returns The created popover control
     */;
    _proto.createPopover = function createPopover(control) {
      const isDraftWithNoChangesBinding = and(not(Entity.IsActive), isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime")));
      const draftWithNoChangesTextBinding = this.draftIndicatorType === ObjectMarkerVisibility.IconAndText ? pathInModel("M_DRAFT_POPOVER_ADMIN_GENERIC_LOCKED_OBJECT_POPOVER_TEXT", "sap.fe.i18n") : pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_POPOVER_NO_DATA_TEXT", "sap.fe.i18n");
      const isDraftWithChangesBinding = and(not(Entity.IsActive), not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime"))));
      const draftWithChangesTextBinding = {
        parts: [{
          path: "M_DRAFT_POPOVER_ADMIN_LAST_CHANGE_TEXT",
          model: "sap.fe.i18n"
        }, {
          path: "DraftAdministrativeData/LastChangeDateTime"
        }],
        formatter: formatMessage
      };
      const isActiveInstanceBinding = and(Entity.IsActive, not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime"))));
      const activeInstanceTextBinding = {
        ...draftWithChangesTextBinding
      };
      const popover = _jsx(Popover, {
        title: this.getPopoverTitleBindingExpression(),
        showHeader: true,
        verticalScrolling: false,
        class: "sapUiContentPadding",
        placement: "Auto",
        endButton: _jsx(Button, {
          icon: "sap-icon://decline",
          press: () => {
            this.draftPopover?.close();
          }
        }),
        children: _jsxs(VBox, {
          class: "sapUiContentPadding",
          children: [_jsx(VBox, {
            visible: isDraftWithNoChangesBinding,
            children: _jsx(Text, {
              text: draftWithNoChangesTextBinding
            })
          }), _jsx(VBox, {
            visible: isDraftWithChangesBinding,
            children: _jsx(Text, {
              text: draftWithChangesTextBinding
            })
          }), _jsxs(VBox, {
            visible: isActiveInstanceBinding,
            children: [_jsx(Text, {
              text: this.getDraftOwnerTextBindingExpression()
            }), _jsx(Text, {
              class: "sapUiSmallMarginTop",
              text: activeInstanceTextBinding
            })]
          })]
        })
      });
      CommonUtils.getTargetView(control).addDependent(popover);
      return popover;
    }

    /**
     * Handles pressing of the object marker by opening a corresponding popover.
     * @param event Event object passed from the press event
     */;
    _proto.onObjectMarkerPressed = function onObjectMarkerPressed(event) {
      const source = event.getSource();
      const bindingContext = source.getBindingContext();
      this.draftPopover ??= this.createPopover(source);
      this.draftPopover.setBindingContext(bindingContext);
      this.draftPopover.openBy(source, false);
    }

    /**
     * Constructs the binding expression for the "additionalInfo" attribute in the "IconAndText" case.
     * @returns The binding expression
     */;
    _proto.getIconAndTextAdditionalInfoBindingExpression = function getIconAndTextAdditionalInfoBindingExpression() {
      const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();
      const orBindings = [];
      if (draftAdministrativeDataProperties?.includes("InProcessByUserDescription")) {
        orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUserDescription"));
      }
      orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUser"));
      if (draftAdministrativeDataProperties?.includes("LastChangedByUserDescription")) {
        orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUserDescription"));
      }
      orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUser"));
      return ifElse(Entity.HasDraft, or(...orBindings), "");
    }

    /**
     * Returns the content of this building block for the "IconAndText" type.
     * @returns The control tree
     */;
    _proto.getIconAndTextContent = function getIconAndTextContent() {
      this.isHiddenDraftEnabled = this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().HiddenDraft?.enabled;
      const objMarkerType = this.isHiddenDraftEnabled ? ObjectMarkerType.Unsaved : ObjectMarkerType.Draft;
      const type = ifElse(not(Entity.IsActive), objMarkerType, ifElse(Entity.HasDraft, ifElse(pathInModel("DraftAdministrativeData/InProcessByUser"), ObjectMarkerType.LockedBy, ifElse(pathInModel("DraftAdministrativeData/LastChangedByUser"), ObjectMarkerType.UnsavedBy, ObjectMarkerType.Unsaved)), ObjectMarkerType.Flagged));
      const visibility = ifElse(not(Entity.HasDraft), ObjectMarkerVisibility.TextOnly, ObjectMarkerVisibility.IconAndText);
      return _jsx(ObjectMarker, {
        type: type,
        press: this.onObjectMarkerPressed.bind(this),
        visibility: visibility,
        additionalInfo: this.getIconAndTextAdditionalInfoBindingExpression(),
        ariaLabelledBy: this.ariaLabelledBy ? this.ariaLabelledBy : [],
        class: this.class
      });
    }

    /**
     * Returns the content of this building block for the "IconOnly" type.
     * @returns The control tree
     */;
    _proto.getIconOnlyContent = function getIconOnlyContent() {
      const type = ifElse(not(Entity.IsActive), ObjectMarkerType.Draft, ifElse(Entity.HasDraft, ifElse(!!this.usedInAnalyticalTable, ObjectMarkerType.Locked, ifElse(pathInModel("DraftAdministrativeData/InProcessByUser"), ObjectMarkerType.Locked, ObjectMarkerType.Unsaved)), ObjectMarkerType.Flagged));
      let visible;
      if (this.usedInTable === true) {
        visible = or(not(Entity.IsActive), and(Entity.IsActive, Entity.HasDraft));
      } else {
        // If Entity.HasDraft is empty, there is no context at all, so don't show the indicator
        visible = and(not(isEmpty(Entity.HasDraft)), not(UI.IsEditable), Entity.HasDraft, not(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe")));
      }
      return _jsx(ObjectMarker, {
        type: type,
        press: !this.usedInAnalyticalTable ? this.onObjectMarkerPressed.bind(this) : undefined,
        visibility: ObjectMarkerVisibility.IconOnly,
        visible: visible,
        ariaLabelledBy: this.ariaLabelledBy ? this.ariaLabelledBy : [],
        class: this.class
      });
    }

    /**
     * Returns the content of this building block.
     * @returns The control tree
     */;
    _proto.createContent = function createContent() {
      if (this.draftIndicatorType === ObjectMarkerVisibility.IconAndText) {
        return this.getIconAndTextContent();
      } else {
        return this.getIconOnlyContent();
      }
    };
    return DraftIndicator;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "draftIndicatorType", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return ObjectMarkerVisibility.IconAndText;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "class", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "usedInTable", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "usedInAnalyticalTable", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = DraftIndicator;
  return _exports;
}, false);
//# sourceMappingURL=DraftIndicator-dbg.js.map
