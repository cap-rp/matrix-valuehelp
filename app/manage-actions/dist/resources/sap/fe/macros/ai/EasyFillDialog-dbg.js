/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/controls/easyFill/EasyFillPlaceholder", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/Field", "sap/fe/macros/field/FieldTemplating", "sap/m/Button", "sap/m/Dialog", "sap/m/FlexBox", "sap/m/FlexItemData", "sap/m/FormattedText", "sap/m/OverflowToolbar", "sap/m/ScrollContainer", "sap/m/TextArea", "sap/m/Title", "sap/m/ToolbarSpacer", "sap/m/VBox", "sap/m/library", "sap/ui/core/InvisibleText", "sap/ui/core/Title", "sap/ui/layout/form/ColumnLayout", "sap/ui/layout/form/Form", "sap/ui/layout/form/FormContainer", "sap/ui/layout/form/FormElement", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (Log, BindingToolkit, ClassSupport, EasyFillPlaceholder, BuildingBlock, CollaborationCommon, MetaModelConverter, PropertyHelper, Field, FieldTemplating, Button, Dialog, FlexBox, FlexItemData, FormattedText, OverflowToolbar, ScrollContainer, TextArea, Title, ToolbarSpacer, VBox, library, InvisibleText, CoreTitle, ColumnLayout, Form, FormContainer, FormElement, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var _exports = {};
  var FlexDirection = library.FlexDirection;
  var getValueBinding = FieldTemplating.getValueBinding;
  var isImmutable = PropertyHelper.isImmutable;
  var isComputed = PropertyHelper.isComputed;
  var getLabel = PropertyHelper.getLabel;
  var CollaborationUtils = CollaborationCommon.CollaborationUtils;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  var createReference = ClassSupport.createReference;
  var transformRecursively = BindingToolkit.transformRecursively;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let EasyFillDialog = (_dec = defineUI5Class("sap.fe.macros.ai.EasyFillDialog"), _dec2 = defineReference(), _dec3 = property({
    type: "Function"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function EasyFillDialog(idOrProps, props) {
      var _this;
      _this = _BuildingBlock.call(this, idOrProps, props) || this;
      _initializerDefineProperty(_this, "$reviewArea", _descriptor, _this);
      _initializerDefineProperty(_this, "getEditableFields", _descriptor2, _this);
      return _this;
    }
    _exports = EasyFillDialog;
    _inheritsLoose(EasyFillDialog, _BuildingBlock);
    var _proto = EasyFillDialog.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.state.newValues = {};
      this.state.hasValues = false;
      this.content = this.createContent();
    };
    _proto.onConfirm = async function onConfirm(_e) {
      // Validate the data handling
      const mainPageBindingContext = this.getPageController().getView()?.getBindingContext();
      const allProps = [];
      const newValues = this._bindingContext?.getObject() ?? this.state.newValues;
      for (const newValuesKey in newValues) {
        if (newValuesKey !== "__bindingInfo" && !newValuesKey.startsWith("@$")) {
          if (typeof newValues[newValuesKey] !== "object") {
            mainPageBindingContext?.setProperty(newValuesKey, newValues[newValuesKey]);
            allProps.push(this.applyUpdatesForChange(this.getPageController().getView(), mainPageBindingContext.getPath(newValuesKey)));
          }
        }
      }
      await Promise.all(allProps);
      this.content?.close();
    };
    _proto.applyUpdatesForChange = async function applyUpdatesForChange(view, propertyPathForUpdate) {
      const metaModel = view.getModel().getMetaModel();
      const metaContext = metaModel.getMetaContext(propertyPathForUpdate);
      const dataModelObject = MetaModelConverter.getInvolvedDataModelObjects(metaContext);
      const targetContext = view.getBindingContext();
      try {
        const sideEffectsPromises = [];
        const sideEffectsService = CollaborationUtils.getAppComponent(view).getSideEffectsService();

        // We have a target context, so we can retrieve the updated property
        const targetMetaPath = metaModel.getMetaPath(targetContext.getPath());
        const relativeMetaPathForUpdate = metaModel.getMetaPath(propertyPathForUpdate).replace(targetMetaPath, "").slice(1);
        sideEffectsPromises.push(sideEffectsService.requestSideEffects([relativeMetaPathForUpdate], targetContext, "$auto"));

        // Get the fieldGroupIds corresponding to pathForUpdate
        const fieldGroupIds = sideEffectsService.computeFieldGroupIds(dataModelObject.targetEntityType.fullyQualifiedName, dataModelObject.targetObject.fullyQualifiedName);

        // Execute the side effects for the fieldGroupIds
        if (fieldGroupIds.length) {
          const pageController = view.getController();
          const sideEffectsMapForFieldGroup = pageController._sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds, targetContext);
          Object.keys(sideEffectsMapForFieldGroup).forEach(sideEffectName => {
            const sideEffect = sideEffectsMapForFieldGroup[sideEffectName];
            sideEffectsPromises.push(pageController._sideEffects.requestSideEffects(sideEffect.sideEffects, sideEffect.context, "$auto", undefined, true));
          });
        }
        await Promise.all(sideEffectsPromises);
      } catch (err) {
        Log.error("Failed to update data after change:" + err);
        throw err;
      }
    };
    _proto.onCancel = function onCancel() {
      this.content?.close();
    };
    _proto.open = function open() {
      this.content?.open();
    };
    _proto._getFieldMapping = function _getFieldMapping(definitionPage) {
      const fieldMapping = {};
      if (definitionPage) {
        const pageTarget = definitionPage.getMetaPath().getTarget();
        let entityType;
        switch (pageTarget._type) {
          case "EntitySet":
          case "Singleton":
            entityType = pageTarget.entityType;
            break;
          case "NavigationProperty":
            entityType = pageTarget.targetType;
            break;
        }
        if (entityType !== undefined) {
          for (const entityProperty of entityType.entityProperties) {
            if (!isImmutable(entityProperty) && !isComputed(entityProperty) && entityProperty.annotations.UI?.Hidden?.valueOf() !== true) {
              // If not immutable, computed or hidden add to the field mapping
              fieldMapping[entityProperty.name] = {
                description: getLabel(entityProperty) ?? entityProperty.name,
                dataType: entityProperty.type
              };
            }
          }
        }
      }
      return fieldMapping;
    };
    _proto.generateListBinding = function generateListBinding(path, model) {
      const transientListBinding = model.bindList(path, undefined, [], [], {
        $$updateGroupId: "submitLater"
      });
      transientListBinding.refreshInternal = () => {
        /* */
      };
      return transientListBinding;
    };
    _proto.onEasyEditPressed = async function onEasyEditPressed() {
      // Call the AI service
      // Process through chat completion API
      const metaPath = this.getOwnerPageDefinition();
      const fieldMapping = this._getFieldMapping(metaPath);
      const easyFillLibrary = await __ui5_require_async("ux/eng/fioriai/reuse/easyfill/EasyFill");
      const odataModel = this.getModel();
      const transientListBinding = this.generateListBinding(odataModel.getMetaModel().getMetaPath(this.getPageController().getView()?.getBindingContext()?.getPath()), this.getModel());
      this._bindingContext = transientListBinding.create({}, true);
      const aiCallResult = await easyFillLibrary.extractFieldValuesFromText(this.state.enteredText, fieldMapping);
      if (aiCallResult.success) {
        const updatedFields = aiCallResult.data;
        const editableFields = (await this.getEditableFields?.()) ?? {};
        this.state.hasValues = false;
        this.state.hasIncorrectValues = false;
        this.$reviewArea.current?.removeAllItems();
        const reviewAreaForm = _jsx(Form, {
          editable: true,
          class: "sapUiSmallMarginTopBottom",
          visible: this.bindState("hasValues"),
          children: {
            layout: _jsx(ColumnLayout, {
              columnsM: 2,
              columnsL: 2,
              columnsXL: 2,
              labelCellsLarge: 1,
              emptyCellsLarge: 1
            })
          }
        });
        const incorrectValuesForm = _jsx(Form, {
          editable: false,
          class: "sapUiSmallMarginTopBottom",
          visible: this.bindState("hasIncorrectValues"),
          children: {
            layout: _jsx(ColumnLayout, {
              columnsM: 2,
              columnsL: 2,
              columnsXL: 2,
              labelCellsLarge: 1,
              emptyCellsLarge: 1
            })
          }
        });
        const previousValuesFormContainer = _jsx(FormContainer, {
          children: {
            title: _jsx(CoreTitle, {
              text: this.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUES")
            })
          }
        });
        const previousValuesFormContainer2 = _jsx(FormContainer, {
          children: {
            title: _jsx(CoreTitle, {
              text: this.getTranslatedText("C_EASYEDIT_PREVIOUS_VALUES")
            })
          }
        });
        const newValuesFormContainer = _jsx(FormContainer, {
          children: {
            title: _jsx(CoreTitle, {
              text: this.getTranslatedText("C_EASYEDIT_NEW_VALUES")
            })
          }
        });
        const newValuesFormContainer2 = _jsx(FormContainer, {
          children: {
            title: _jsx(CoreTitle, {
              text: this.getTranslatedText("C_EASYEDIT_NEW_VALUES")
            })
          }
        });
        const uiContext = this.getPageController().getModel("ui")?.createBindingContext("/easyEditDialog");
        this.getPageController().getModel("ui").setProperty("/easyEditDialog", {});
        uiContext.setProperty("isEditable", true);
        newValuesFormContainer.setBindingContext(uiContext, "ui");
        reviewAreaForm.addFormContainer(previousValuesFormContainer);
        reviewAreaForm.addFormContainer(newValuesFormContainer);
        incorrectValuesForm.addFormContainer(previousValuesFormContainer2);
        incorrectValuesForm.addFormContainer(newValuesFormContainer2);
        const newValues = {};
        const incorrectValues = {};
        newValuesFormContainer.setBindingContext(this._bindingContext);
        newValuesFormContainer2.setBindingContext(this.getModel("$componentState")?.createBindingContext("/incorrectValues"));
        newValuesFormContainer2.setModel(this.getModel("$componentState"));
        for (const updatedField in updatedFields) {
          if (editableFields[updatedField] && editableFields[updatedField].isEditable === true) {
            newValues[updatedField] = updatedFields[updatedField];
            this._bindingContext.setProperty(updatedField, updatedFields[updatedField]);
            this.state.hasValues = true;
            let valueBinding = getValueBinding(this.getDataModelObjectForMetaPath(updatedField, this.getOwnerContextPath()), {}, false, false, undefined, false, false, 0, false, true);
            valueBinding = transformRecursively(valueBinding, "PathInModel", path => {
              path.modelName = "$componentState";
              path.path = "/newValues/" + path.path;
              return path;
            });
            previousValuesFormContainer.addFormElement(_jsx(FormElement, {
              label: fieldMapping[updatedField].description,
              children: _jsx(Field, {
                metaPath: updatedField,
                contextPath: this.getOwnerContextPath(),
                readOnly: true
              })
            }));
            newValuesFormContainer.addFormElement(_jsx(FormElement, {
              label: fieldMapping[updatedField].description,
              children: _jsx(Field, {
                metaPath: updatedField,
                contextPath: this.getOwnerContextPath()
              })
            }));
          } else {
            incorrectValues[updatedField] = updatedFields[updatedField];
            this.state.hasIncorrectValues = true;
            previousValuesFormContainer2.addFormElement(_jsx(FormElement, {
              label: fieldMapping[updatedField].description,
              children: _jsx(Field, {
                metaPath: updatedField,
                contextPath: this.getOwnerContextPath(),
                readOnly: true
              })
            }));
            newValuesFormContainer2.addFormElement(_jsx(FormElement, {
              label: fieldMapping[updatedField].description,
              children: _jsx(Field, {
                metaPath: updatedField,
                contextPath: this.getOwnerContextPath(),
                readOnly: true
              })
            }));
          }
        }
        const $vBox = createReference();
        this.$reviewArea.current?.addItem(_jsx(ScrollContainer, {
          vertical: true,
          class: "sapUiContentPadding",
          children: {
            content: _jsx(VBox, {
              ref: $vBox,
              children: {
                items: [_jsx(Title, {
                  text: this.getTranslatedText("C_EASYEDIT_FILLED_FIELDS"),
                  visible: this.bindState("hasValues")
                }), reviewAreaForm, _jsx(Title, {
                  text: this.getTranslatedText("C_EASYEDIT_INCORRECT_FIELDS"),
                  class: "sapUiSmallMarginTopBottom",
                  visible: this.bindState("hasIncorrectValues")
                }), incorrectValuesForm]
              }
            })
          }
        }));
        $vBox.current?.setBindingContext(this.getPageController().getView()?.getBindingContext());
        $vBox.current?.setModel(this.getPageController().getModel());
        $vBox.current?.setModel(this.getPageController().getModel("ui"), "ui");
        this.state.newValues = newValues;
        this.state.incorrectValues = incorrectValues;
      }
    };
    _proto.createContent = function createContent() {
      const easyEditDescription = _jsx(InvisibleText, {
        text: this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION")
      });
      return _jsx(Dialog, {
        title: this.getTranslatedText("C_EASYEDIT_DIALOG_TITLE"),
        resizable: true,
        horizontalScrolling: false,
        verticalScrolling: false,
        contentWidth: "1100px",
        contentHeight: "800px",
        escapeHandler: () => {
          this.onCancel();
        },
        afterClose: () => {
          this.destroy();
        },
        children: {
          content: _jsxs(FlexBox, {
            direction: FlexDirection.Row,
            renderType: "Bare",
            width: "100%",
            height: "100%",
            children: [_jsxs(FlexBox, {
              width: "40%",
              id: this.createId("inputArea"),
              direction: FlexDirection.Column,
              class: "sapUiContentPadding",
              renderType: "Bare",
              children: [_jsx(FormattedText, {
                htmlText: this.getTranslatedText("C_EASYEDIT_DIALOG_DESCRIPTION"),
                class: "sapUiMarginEnd"
              }), easyEditDescription, _jsx(TextArea, {
                value: this.bindState("enteredText"),
                width: "100%",
                rows: 20,
                growing: true,
                growingMaxLines: 30,
                ariaLabelledBy: easyEditDescription
              }), _jsx(Button, {
                text: this.getTranslatedText("C_EASYEDIT_BUTTON"),
                icon: "sap-icon://ai",
                enabled: true,
                press: this.onEasyEditPressed.bind(this),
                children: {
                  layoutData: _jsx(FlexItemData, {
                    alignSelf: "End"
                  })
                }
              })]
            }), _jsx(FlexBox, {
              id: this.createId("reviewArea"),
              ref: this.$reviewArea,
              width: "60%",
              renderType: "Bare",
              direction: FlexDirection.Column,
              class: "sapFeEasyFillReviewArea",
              children: _jsx(EasyFillPlaceholder, {})
            })]
          }),
          footer: _jsxs(OverflowToolbar, {
            children: [_jsx(ToolbarSpacer, {}), _jsx(Button, {
              text: this.getTranslatedText("C_EASYEDIT_DIALOG_SAVE"),
              type: "Emphasized",
              enabled: this.bindState("hasValues"),
              press: this.onConfirm.bind(this)
            }), _jsx(Button, {
              text: this.getTranslatedText("C_EASYEDIT_DIALOG_CANCEL"),
              type: "Transparent",
              press: this.onCancel.bind(this)
            })]
          })
        }
      });
    };
    return EasyFillDialog;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "$reviewArea", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "getEditableFields", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EasyFillDialog;
  return _exports;
}, false);
//# sourceMappingURL=EasyFillDialog-dbg.js.map
