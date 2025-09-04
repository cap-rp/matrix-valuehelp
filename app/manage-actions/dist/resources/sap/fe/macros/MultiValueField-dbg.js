/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldTemplating", "sap/ui/core/CustomData", "sap/ui/mdc/MultiValueField", "sap/ui/mdc/field/MultiValueFieldItem", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/controls/FormElementWrapper", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/helpers/ModelHelper", "sap/fe/macros/field/FieldRuntime", "sap/fe/macros/multivaluefield/FormatOptions", "sap/fe/macros/multivaluefield/MultiValueFieldRuntime", "sap/m/Avatar", "sap/m/HBox", "sap/ui/base/Event", "sap/ui/core/Element", "./ValueHelp", "./field/FieldRuntimeHelper", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BindingHelper, ID, TypeGuards, DataModelPathHelper, UIFormatters, FieldHelper, FieldTemplating, CustomData, MultiValueField, MultiValueFieldItem, BuildingBlock, CollaborationCommon, FormElementWrapper, CollaborationFormatters, ModelHelper, FieldRuntime, FormatOptions, MultiValueFieldRuntime, Avatar, HBox, UI5Event, Element, ValueHelp, FieldRuntimeHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var _exports = {};
  var CollaborationFieldGroupPrefix = CollaborationCommon.CollaborationFieldGroupPrefix;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getValueBinding = FieldTemplating.getValueBinding;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getCollaborationExpression = UIFormatters.getCollaborationExpression;
  var isPathInsertable = DataModelPathHelper.isPathInsertable;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isPropertyPathExpression = TypeGuards.isPropertyPathExpression;
  var isProperty = TypeGuards.isProperty;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isMultipleNavigationProperty = TypeGuards.isMultipleNavigationProperty;
  var UI = BindingHelper.UI;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a MultiValueField based on the metadata provided by OData V4.
   * <br>
   * The MultiValueField can be used to display either a DataField or Property directly. It has to point to a collection property.
   * <br>
   * Usage example:
   * <pre>
   * &lt;macro:MultiValueField
   * id="SomeUniqueIdentifier"
   * contextPath="{entitySet&gt;}"
   * metaPath="{dataField&gt;}"
   * /&gt;
   * </pre>
   * @alias sap.fe.macros.MultiValueField
   * @public
   * @since 1.118.0
   * @experimental
   */
  let MultiValueFieldBlock = (_dec = defineUI5Class("sap.fe.macros.MultiValueField"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "string"
  }), _dec4 = association({
    type: "string"
  }), _dec5 = association({
    type: "string"
  }), _dec6 = property({
    type: "string",
    required: true
  }), _dec7 = property({
    type: "boolean",
    required: false
  }), _dec8 = property({
    type: "string"
  }), _dec9 = property({
    type: "any",
    isBindingInfo: true
  }), _dec10 = aggregation({
    type: "sap.fe.macros.multivaluefield.FormatOptions",
    multiple: false,
    defaultClass: FormatOptions
  }), _dec11 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    // Computed properties

    /**
     * Pointed at dataField, can be DataFieldDefault from a property.
     */

    /**
     * DataModelPath for the corresponding property displayed.
     */

    /**
     * Property to be displayed
     */

    /**
     * Edit Mode of the field.
     * If the editMode is undefined then we compute it based on the metadata
     * Otherwise we use the value provided here.
     */

    /**
     * The display mode added to the collection field
     */

    /**
     * The CompiledBindingToolkitExpression that is calculated internally
     */

    function MultiValueFieldBlock(props, others) {
      var _this;
      if (typeof props !== "string") {
        // type of props can be a string if we are cloning the MultiValueField inside an aggregation
        // in that case _isInEditMode has already been computed on the one we clone
        props._isInEditMode = compileExpression(UI.IsEditable);
      }
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      /**
       * The 'id' property
       */
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      /**
       * Prefix added to the generated ID of the field - only if no id is provided
       */
      _initializerDefineProperty(_this, "idPrefix", _descriptor3, _this);
      /**
       * Prefix added to the generated ID of the value help used for the field
       */
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor4, _this);
      /**
       * Defines the relative Metadata path to the MultiValueField.
       * The metaPath should point to a Property or DataField.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor5, _this);
      /**
       * The readOnly flag
       * @public
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor6, _this);
      /**
       * The context path provided for the MultiValueField
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor7, _this);
      /**
       * Property added to be able to add data / items to the multi value field via a different model
       * @experimental
       * @public
       */
      _initializerDefineProperty(_this, "items", _descriptor8, _this);
      /**
       * The object with the formatting options
       *
       */
      _initializerDefineProperty(_this, "formatOptions", _descriptor9, _this);
      _initializerDefineProperty(_this, "_isInEditMode", _descriptor10, _this);
      return _this;
    }

    /**
     * In case an external value is set (e.g. for providing data in a json model) we need to override the binding strings for the item.
     * @param collectionBinding
     * @param itemDataModelObjectPath
     * @param textExpression
     * @param key
     * @returns MultiInputSettings
     */
    _exports = MultiValueFieldBlock;
    _inheritsLoose(MultiValueFieldBlock, _BuildingBlock);
    var _proto = MultiValueFieldBlock.prototype;
    _proto._overrideValue = function _overrideValue(collectionBinding, itemDataModelObjectPath, textExpression, key) {
      if (this.items) {
        const model = this.items.model ?? this.items.modelName;
        collectionBinding = {
          path: `${model}>${this.items.path}`
        };
        const commonTargetObjectProperty = itemDataModelObjectPath.targetObject;
        const commonPropertyPath = `{${model}>${commonTargetObjectProperty.name}}`;

        // Text arrangement use case
        if (isPathAnnotationExpression(commonTargetObjectProperty.annotations.Common?.Text)) {
          textExpression = `{${model}>${commonTargetObjectProperty.annotations.Common?.Text?.path}}`;
          // non text arrangement use case
        } else {
          textExpression = commonPropertyPath;
        }
        key = commonPropertyPath;
      }
      return {
        description: textExpression,
        collectionBinding,
        key: key
      };
    }

    /**
     * Function to get the correct settings for the multi input.
     * @param propertyDataModelObjectPath The corresponding DataModelObjectPath.
     * @param formatOptions The format options to calculate the result
     * @returns MultiInputSettings
     */;
    _proto._getMultiInputSettings = function _getMultiInputSettings(propertyDataModelObjectPath, formatOptions) {
      const {
        collectionPath,
        itemDataModelObjectPath
      } = MultiValueFieldBlock._getPathStructure(propertyDataModelObjectPath);
      const collectionBinding = {
        path: collectionPath,
        parameters: {
          $$ownRequest: true
        },
        templateShareable: false
      };
      const propertyPathOrProperty = propertyDataModelObjectPath.targetObject;
      const propertyDefinition = isPropertyPathExpression(propertyPathOrProperty) ? propertyPathOrProperty.$target : propertyPathOrProperty;
      const commonText = propertyDefinition?.annotations.Common?.Text;
      const relativeLocation = getRelativePaths(propertyDataModelObjectPath);
      const textExpression = commonText ? compileExpression(getExpressionFromAnnotation(commonText, relativeLocation)) : getValueBinding(itemDataModelObjectPath, formatOptions ?? {}, true);
      const key = getValueBinding(itemDataModelObjectPath, formatOptions ?? {}, true);
      let displayOnly = false;
      if (getRelativePaths(itemDataModelObjectPath).length > 0) {
        // if the relative path to the value contains a navigation, create will not be possible in the delegate, so we force the display Mode
        displayOnly = true;
      }
      return {
        displayOnly,
        ...this._overrideValue(collectionBinding, itemDataModelObjectPath, textExpression, key)
      };
    }

    // Process the dataModelPath to find the collection and the relative DataModelPath for the item.
    ;
    MultiValueFieldBlock._getPathStructure = function _getPathStructure(dataModelObjectPath) {
      let firstCollectionPath = "";
      const currentEntitySet = dataModelObjectPath.contextLocation?.targetEntitySet ? dataModelObjectPath.contextLocation.targetEntitySet : dataModelObjectPath.startingEntitySet;
      const navigatedPaths = [];
      const contextNavsForItem = dataModelObjectPath.contextLocation?.navigationProperties || [];
      for (const navProp of dataModelObjectPath.navigationProperties) {
        if (dataModelObjectPath.contextLocation === undefined || !dataModelObjectPath.contextLocation.navigationProperties.some(contextNavProp => contextNavProp.fullyQualifiedName === navProp.fullyQualifiedName)) {
          // in case of relative entitySetPath we don't consider navigationPath that are already in the context
          navigatedPaths.push(navProp.name);
          contextNavsForItem.push(navProp);
          if (currentEntitySet.navigationPropertyBinding.hasOwnProperty(navProp.name)) {
            if (isMultipleNavigationProperty(navProp)) {
              break;
            }
          }
        }
      }
      firstCollectionPath = `${navigatedPaths.join("/")}`;
      const itemDataModelObjectPath = Object.assign({}, dataModelObjectPath);
      if (itemDataModelObjectPath.contextLocation) {
        itemDataModelObjectPath.contextLocation.navigationProperties = contextNavsForItem; // this changes the creation of the valueHelp ID ...
      }
      return {
        collectionPath: firstCollectionPath,
        itemDataModelObjectPath: itemDataModelObjectPath
      };
    }

    /**
     * Calculate the fieldGroupIds for the MultiValueField.
     * @param appComponent
     * @returns The value for the fieldGroupIds
     */;
    _proto.computeFieldGroupIds = function computeFieldGroupIds(appComponent) {
      if (!appComponent) {
        //for ValueHelp / Mass edit Templating the appComponent is not passed to the templating
        return "";
      }
      const sideEffectService = appComponent.getSideEffectsService();
      const fieldGroupIds = sideEffectService.computeFieldGroupIds(this.dataModelPath.targetEntityType.fullyQualifiedName, this.dataModelPath.targetObject.fullyQualifiedName);
      if (this.collaborationEnabled) {
        const collaborationFieldGroup = `${CollaborationFieldGroupPrefix}${this.dataSourcePath}`;
        fieldGroupIds.push(collaborationFieldGroup);
      }
      this.fieldGroupIds = fieldGroupIds.length ? fieldGroupIds.join(",") : undefined;
      const result = fieldGroupIds.join(",");
      return result === "" ? undefined : result;
    };
    _proto.initialize = function initialize(metaContextPath) {
      const owner = this._getOwner();
      this.contextPath = this.contextPath ?? owner?.preprocessorContext?.fullContextPath;
      const odataMetaModel = owner?.getMetaModel();
      const metaContext = odataMetaModel?.createBindingContext(metaContextPath.getPath());
      const metaPathObject = metaContextPath?.getTarget();

      // If the target is a property with a DataFieldDefault, use this as data field
      if (isProperty(metaPathObject) && metaPathObject.annotations.UI?.DataFieldDefault !== undefined) {
        this.enhancedMetaPath = odataMetaModel?.createBindingContext(`@${"com.sap.vocabularies.UI.v1.DataFieldDefault"}`, metaContext);
      } else {
        this.enhancedMetaPath = metaContext;
      }
      const dataFieldDataModelPath = this.getDataModelObjectForMetaPath(this.enhancedMetaPath.getPath(), this.contextPath);
      this.convertedDataField = dataFieldDataModelPath.targetObject;
      this.dataModelPath = enhanceDataModelPath(dataFieldDataModelPath, this.convertedDataField.Value.path);
      this.dataSourcePath = getTargetObjectPath(this.dataModelPath);
      this.property = this.dataModelPath.targetObject;
      let insertable = isPathInsertable(this.dataModelPath);
      const deleteNavigationRestriction = isPathDeletable(this.dataModelPath, {
        ignoreTargetCollection: true,
        authorizeUnresolvable: true
      });
      const deletePath = isPathDeletable(this.dataModelPath);

      // deletable:
      //		if restrictions come from Navigation we apply it
      //		otherwise we apply restrictions defined on target collection only if it's a constant
      //      otherwise it's true!
      let deletable = ifElse(deleteNavigationRestriction._type === "Unresolvable", or(not(isConstant(deletePath)), deletePath), deletePath);
      if (this.items) {
        insertable = deletable = constant(!this.readOnly);
      } else {
        this.visible = getVisibleExpression(this.dataModelPath, this.formatOptions);
      }
      this.insertableAndDeletable = and(insertable, deletable);
      this.collaborationExpression = constant(false);
      this.computeCollaborationProperties();
      if (this.formatOptions?.displayOnly === true || this.readOnly === true) {
        this.editMode = "Display";
      } else if (this.readOnly === false) {
        this.editMode = compileExpression(ifElse(and(insertable, deletable), ifElse(this.collaborationExpression, constant("ReadOnly"), constant("Editable")), constant("Display")));
      } else {
        this.editMode = compileExpression(ifElse(and(insertable, deletable, UI.IsEditable), ifElse(this.collaborationExpression, constant("ReadOnly"), constant("Editable")), constant("Display")));
      }
      this.displayMode = getDisplayMode(this.dataModelPath);
      const localDataModelPath = enhanceDataModelPath(this.getDataModelObjectForMetaPath(this.enhancedMetaPath.getPath(), this.contextPath), this.convertedDataField.Value.path);
      this.item = this._getMultiInputSettings(localDataModelPath, this.formatOptions); // this function rewrites dataModelPath, therefore, for now a clean object is passed
      if (this.item.displayOnly) {
        this.editMode = "Display";
      }
      this.collection = this.item.collectionBinding;
      const appComponent = this.getAppComponent();
      this.fieldGroupIds = this.computeFieldGroupIds(appComponent);
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
     * The function checks if the collaboration draft is supported.
     * @returns True if the collaboration draft is supported.
     */;
    _proto.isCollaborationDraftSupported = function isCollaborationDraftSupported() {
      const owner = this._getOwner();
      const odataMetaModel = owner?.getMetaModel();
      return ModelHelper.isCollaborationDraftSupported(odataMetaModel);
    }

    /**
     * This helper computes the properties that are needed for the collaboration avatar.
     */;
    _proto.computeCollaborationProperties = function computeCollaborationProperties() {
      if (this.isCollaborationDraftSupported() && this.editMode !== "Display") {
        this.collaborationEnabled = true;
        this.collaborationExpression = UIFormatters.getCollaborationExpression(this.dataModelPath, CollaborationFormatters.hasCollaborationActivity);
        this.collaborationInitialsExpression = compileExpression(getCollaborationExpression(this.dataModelPath, CollaborationFormatters.getCollaborationActivityInitials));
        this.collaborationColorExpression = compileExpression(getCollaborationExpression(this.dataModelPath, CollaborationFormatters.getCollaborationActivityColor));
      }
    }

    /**
     * Creates the content.
     * @returns The content of the building block.
     */;
    _proto.createContent = function createContent() {
      const metaContextPath = this.getMetaPathObject(this.metaPath, this.contextPath);
      if (metaContextPath) {
        this.initialize(metaContextPath);

        // BuildingBlock with set ID scenario
        if (this.id) {
          this.vhIdPrefix = ID.generate([this.getId(), this.vhIdPrefix ?? "FieldValueHelp"]); // Use getId to retrieve ID, not this.id
        } else if (!this.vhIdPrefix) {
          // Maybe not entered
          this.vhIdPrefix = this.createId("FieldValueHelp");
        }
        const controller = this._getOwner()?.getRootController();
        const view = controller.getView();
        const odataMetaModel = this._getOwner()?.getMetaModel();
        const metaContext = odataMetaModel?.createBindingContext(metaContextPath.getPath());
        const context = odataMetaModel?.createBindingContext(metaContextPath.getContextPath());
        if (!metaContext || !context) {
          return;
        }

        //create a new binding context for the value help

        const itemsAggregation = this.collection;
        const customAggregationLength = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.multiValueField?.itemsSizeLimit;
        if (customAggregationLength !== undefined) {
          itemsAggregation.length = customAggregationLength;
        }

        //compute the correct label
        const label = FieldHelper.computeLabelText(this.convertedDataField.Value, {
          context: metaContext
        });
        const vhControl = ValueHelp.getValueHelpForMetaPath(this.getPageController(), getContextRelativeTargetObjectPath(this.dataModelPath), this.contextPath ?? this.getOwnerContextPath(), this._getOwner()?.getMetaModel());
        let valueHelp;
        if (vhControl && vhControl.getContent()) {
          valueHelp = vhControl.getContent().getId();
        }
        const multiValueField = _jsx(MultiValueField, {
          id: this.createId("_mvf"),
          delegate: {
            name: "sap/fe/macros/multivaluefield/MultiValueFieldDelegate"
          },
          items: itemsAggregation,
          display: this.displayMode,
          width: "100%",
          editMode: this.editMode,
          valueHelp: valueHelp,
          ariaLabelledBy: this.ariaLabelledBy ? this.ariaLabelledBy : [],
          showEmptyIndicator: this.formatOptions?.showEmptyIndicator,
          label: label,
          change: MultiValueFieldRuntime.handleChange.bind(MultiValueFieldRuntime, controller),
          fieldGroupIds: this.fieldGroupIds,
          validateFieldGroup: FieldRuntime.onValidateFieldGroup,
          children: {
            items: _jsx(MultiValueFieldItem, {
              description: this.item.description
            }, this.item.key),
            customData: _jsx(CustomData, {
              value: this.insertableAndDeletable
            }, "insertableAndDeletable")
          }
        });
        let formwrapper = null;
        if (this.collaborationEnabled) {
          const avatar = _jsx(Avatar, {
            visible: this.collaborationExpression,
            initials: this.collaborationInitialsExpression,
            displaySize: "Custom",
            customDisplaySize: "1.5rem",
            customFontSize: "0.8rem",
            backgroundColor: this.collaborationColorExpression,
            press: () => {
              FieldRuntimeHelper.showCollaborationEditUser(avatar, view);
            }
          });
          formwrapper = _jsx(FormElementWrapper, {
            children: _jsx(HBox, {
              width: "100%",
              renderType: "Bare",
              alignItems: "End",
              children: {
                items: [multiValueField, avatar]
              }
            })
          });
          multiValueField?.addEventDelegate({
            onfocusin: evt => {
              const currentMultiValueField = evt.srcControl.getParent();
              controller.collaborativeDraft?.handleContentFocusIn(currentMultiValueField);
              if (valueHelpControl?.getDomRef()) {
                valueHelpControl.attachEventOnce("closed", () => {
                  currentMultiValueField?.focus();
                });
              }
            },
            onfocusout: evt => {
              let currentMultiValueField = evt.srcControl.getParent();
              if (currentMultiValueField?.isA("sap.m.Tokenizer")) {
                currentMultiValueField = currentMultiValueField.getParent()?.getParent();
              }
              const event = new UI5Event("", currentMultiValueField, {
                fieldGroupIds: currentMultiValueField.getFieldGroupIds()
              });
              controller.collaborativeDraft.handleContentFocusOut(event);
            }
          }, this);
          const valueHelpControl = Element.getElementById(multiValueField.getValueHelp());
          valueHelpControl?.attachOpened(evt => {
            const currentMultiValueField = evt.getSource().getControl();
            controller.collaborativeDraft.handleContentFocusIn(currentMultiValueField);
          });
        }
        multiValueField.addCustomData(new CustomData({
          key: "forwardedItemsBinding",
          value: this.items
        }));
        return this.collaborationEnabled ? formwrapper : multiValueField;
      }
    }

    /**
     * Setter for the readOnly property.
     * @param readOnly
     */;
    _proto.setReadOnly = function setReadOnly(readOnly) {
      _BuildingBlock.prototype.setProperty.call(this, "readOnly", readOnly);
      this.updateEditMode();
    }

    /**
     * Setter for the _isInEditMode property.
     * @param inEditMode
     */;
    _proto.set_isInEditMode = function set_isInEditMode(inEditMode) {
      _BuildingBlock.prototype.setProperty.call(this, "_isInEditMode", inEditMode);
      this.updateEditMode();
    }

    /**
     * The function returns the MultiValueField.
     * @returns The MultiValueField.
     */;
    _proto.getMultiValueField = function getMultiValueField() {
      if (this.isCollaborationDraftSupported()) {
        return this.content.content.getItems()[0];
      } else {
        return this.content;
      }
    }

    /**
     * Update the edit mode based on the readOnly and _isInEditMode properties.
     */;
    _proto.updateEditMode = function updateEditMode() {
      if (!this.content) {
        return;
      }
      const multivalueField = this.getMultiValueField();
      const insertableAndDeletable = multivalueField.data("insertableAndDeletable");
      if (this.readOnly === true) {
        this.editMode = "Display";
        multivalueField.setEditMode("Display");
      } else if (this.readOnly === false && insertableAndDeletable) {
        //readOnly false can only have impact if items are provided
        if (this._isInEditMode) {
          this.editMode = "Editable";
          multivalueField.setEditMode("Editable");
        } else {
          this.editMode = "Display";
          multivalueField.setEditMode("Display");
        }
      }
      // if readOnly is not explicitly set we keep teh standard behavior
    }

    /**
     * On Before rendering froward the ariaLabelledBy to the mdc MultiValueField.
     */;
    _proto.onBeforeRendering = function onBeforeRendering() {
      if (this.content) {
        const multiValueField = this.getMultiValueField();
        const aAriaLabelledBy = this.getAriaLabelledBy();
        for (const sId of aAriaLabelledBy) {
          const aAriaLabelledBys = multiValueField.getAriaLabelledBy();
          if (!aAriaLabelledBys.includes(sId)) {
            multiValueField.addAriaLabelledBy(sId);
          }
        }
      }
    };
    return MultiValueFieldBlock;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "items", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "_isInEditMode", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  _exports = MultiValueFieldBlock;
  return _exports;
}, false);
//# sourceMappingURL=MultiValueField-dbg.js.map
