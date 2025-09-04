/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/controls/Any", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/DisplayModeFormatter", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/m/MessageBox", "sap/ui/core/Component", "sap/ui/core/Lib", "sap/ui/mdc/enums/FieldEditMode", "sap/ui/model/BindingMode", "./MassEditDialog", "./library"], function (Log, deepClone, BindingToolkit, CommonUtils, Any, MetaModelConverter, DataField, ModelHelper, TypeGuards, DataModelPathHelper, DisplayModeFormatter, FieldControlHelper, PropertyHelper, UIFormatters, FieldTemplating, MessageBox, Component, Library, FieldEditMode, BindingMode, MassEditDialog, library) {
  "use strict";

  var _exports = {};
  var SpecificSelectKeys = library.SpecificSelectKeys;
  var setEditStyleProperties = FieldTemplating.setEditStyleProperties;
  var getTextBinding = FieldTemplating.getTextBinding;
  var isVisible = UIFormatters.isVisible;
  var isMultiValueField = UIFormatters.isMultiValueField;
  var getRequiredExpression = UIFormatters.getRequiredExpression;
  var getEditMode = UIFormatters.getEditMode;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedTextPropertyPath = PropertyHelper.getAssociatedTextPropertyPath;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var isReadOnlyExpression = FieldControlHelper.isReadOnlyExpression;
  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertMetaModelContext = MetaModelConverter.convertMetaModelContext;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Display the massEdit dialog.
   */
  let MassEditDialogHelper = /*#__PURE__*/function () {
    function MassEditDialogHelper(props) {
      this.maxAnalyzedRows = 30;
      this.analyzedContexts = [];
      this.fieldProperties = [];
      const entityTypePath = props.table.getParent().getTableDefinition().annotation.collection,
        metaModel = props.table.getModel().getMetaModel();
      this.table = props.table;
      this.manifestSettings = this.table.getParent().getTableDefinition().control.massEdit;
      this.onContextMenu = props.onContextMenu;
      this.onDialogClose = props.onClose;
      this.view = CommonUtils.getTargetView(this.table);
      this.contexts = this.fetchContextsForEdit();
      this.degradedMode = this.contexts.length > this.maxAnalyzedRows;
      this.analyzedContexts = this.degradedMode ? this.contexts.slice(0, this.maxAnalyzedRows) : this.contexts;
      this.isAdaptation = CommonUtils.getAppComponent(this.table).isAdaptationMode();
      this.headerInfo = getInvolvedDataModelObjects(metaModel.getContext(entityTypePath)).targetEntityType.annotations.UI?.HeaderInfo;
    }

    /**
     * Opens the mass edit dialog if all selected contexts are editable,
     * otherwise a message box to confirm the selection.
     * @returns A promise that resolves on open of the mass edit dialog.
     */
    _exports = MassEditDialogHelper;
    var _proto = MassEditDialogHelper.prototype;
    _proto.open = async function open() {
      try {
        const templateComponent = Component.getOwnerComponentFor(this.view);
        const internalModelContext = this.table.getBindingContext("internal"),
          internalModelProperty = !this.onContextMenu ? "numberOfSelectedContexts" : "contextmenu/numberOfSelectedContexts",
          selectedContexts = internalModelContext.getProperty(internalModelProperty) || 0;
        this.fieldProperties = await this.getFieldsPropertiesFromInfo(this.getFieldsInfo());
        if (!this.isAdaptation) {
          // no field to edit
          if (!this.fieldProperties.some(field => field.visible)) {
            this.noFieldInformation();
            return;
          }
          //Some rows are not editable -> do we want to continue?
          if (this.contexts.length !== selectedContexts) {
            this.contexts = await this.confirmSelection(this.contexts, selectedContexts);
            if (!this.contexts.length) {
              // the user doesn't want to continue
              this.onDialogClose?.();
              return;
            }
          }
        }
        await templateComponent.runAsOwner(async () => {
          this.massEditDialog = new MassEditDialog({
            table: this.table,
            contexts: this.contexts,
            fieldProperties: this.fieldProperties
          });
          const dialog = await this.massEditDialog.create();
          dialog.attachBeforeClose(() => {
            this.onDialogClose?.();
          });
          dialog.open();
          const requiredDataPromise = this.massEditDialog.getRequiredDataPromise();
          try {
            await this.getDataAfterOpeningDialog(this.fieldProperties);
            requiredDataPromise.resolve();
          } catch (error) {
            Log.error("Mass Edit: Something went wrong in mass edit dialog to get required data.", error);
            requiredDataPromise.reject();
          }
        });
      } catch (error) {
        Log.error("Mass Edit: Something went wrong in mass edit dialog creation.", error);
      }
    }

    /**
     * Opens the message box to notify no fields are editable.
     */;
    _proto.noFieldInformation = function noFieldInformation() {
      const visibleFieldsFromManifest = this.table.getParent().getTableDefinition().control.massEdit.visibleFields;
      const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      let message = "",
        messageDetail;
      if (visibleFieldsFromManifest.length > 0) {
        message = resourceBundle.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS_WITH_MANIFEST", [this.getResourceText(this.headerInfo?.TypeName) ?? resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME")]);
        messageDetail = `<ul>
			${this.fieldProperties.reduce((fields, fieldProperty) => {
          if (visibleFieldsFromManifest.includes(fieldProperty.propertyInfo.relativePath)) {
            fields.push(`<li>${fieldProperty.label}</li>`);
          }
          return fields;
        }, []).join("")} </ul>`;
      } else {
        message = resourceBundle.getText("C_MASS_EDIT_NO_EDITABLE_FIELDS_DEFAULT");
      }
      MessageBox.information(message, {
        details: messageDetail,
        onClose: () => {
          this.onDialogClose?.();
        }
      });
    }

    /**
     * Opens the confirmation dialog to validate the selected contexts.
     * @param contexts The contexts set as updatable
     * @param selectedContexts  The number of selected contexts
     * @returns A promise that resolves the contexts to be finally managed.
     */;
    _proto.confirmSelection = async function confirmSelection(contexts, selectedContexts) {
      const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      const coreResourceBundle = Library.getResourceBundleFor("sap.fe.core");
      const updatableContexts = contexts.length;
      return new Promise(resolve => {
        try {
          const tableAPI = this.table.getParent();
          const editButton = resourceBundle.getText("C_MASS_EDIT_CONFIRM_BUTTON_TEXT"),
            cancelButton = coreResourceBundle.getText("C_COMMON_OBJECT_PAGE_CANCEL"),
            metaModel = this.table.getModel().getMetaModel(),
            typeName = this.getResourceText(this.headerInfo?.TypeName) ?? resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME"),
            typeNamePlural = this.getResourceText(this.headerInfo?.TypeNamePlural) ?? resourceBundle.getText("C_MASS_EDIT_DIALOG_DEFAULT_TYPENAME_PLURAL"),
            messageDetail = ModelHelper.isDraftSupported(metaModel, this.table.data("targetCollectionPath")) && tableAPI.readOnly ? this.getMessageDetailForNonEditable(typeName, typeNamePlural) : "";
          MessageBox.warning(resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE", [selectedContexts - updatableContexts, selectedContexts, updatableContexts, typeNamePlural]), {
            details: messageDetail,
            actions: [editButton, cancelButton],
            emphasizedAction: editButton,
            onClose: function (selection) {
              resolve(selection === editButton ? contexts : []);
            }
          });
        } catch (error) {
          Log.error(error);
        }
      });
    }

    /**
     * Gets the text according to an annotation.
     * @param annotation The annotation
     * @returns The text.
     */;
    _proto.getResourceText = function getResourceText(annotation) {
      if (!annotation) {
        return undefined;
      }
      return CommonUtils.getTranslatedTextFromExpBindingString(compileExpression(getExpressionFromAnnotation(annotation)), this.view)?.toLocaleLowerCase();
    }

    /**
     * Gets the message detail of the confirmation dialog.
     * @param typeName The type name of the entity set
     * @param typeNamePlural The type name plural of the entity set
     * @returns The text.
     */;
    _proto.getMessageDetailForNonEditable = function getMessageDetailForNonEditable(typeName, typeNamePlural) {
      const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      return `<p><strong>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_HEADER")}</strong></p>\n
			<p>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON", [typeNamePlural])}</p>\n
			<ul>
				<li>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_DRAFT", [typeName])}</li>
				<li>${resourceBundle.getText("C_MASS_EDIT_CONFIRM_MESSAGE_DETAIL_REASON_NON_EDITABLE", [typeName])}</li>
			</ul>`;
    }

    /**
     * Gets information about the entity which is compliant for a Mass Edit.
     * @returns Array of the field information.
     */;
    _proto.getEntityFieldsInfo = function getEntityFieldsInfo() {
      const tableAPI = this.table.getParent();
      const columnsData = tableAPI.getTableDefinition().columns;
      const propertiesKeys = new Set(columnsData.reduce((fields, column) => {
        if (column.type === "Annotation") {
          fields.push(column.name);
        }
        return fields;
      }, []));
      return this.transformPathsToInfo(propertiesKeys);
    }

    /**
     * Gets information about the properties of the table which are compliant for a Mass Edit.
     * @returns Array of the field information.
     */;
    _proto.getFieldsInfo = function getFieldsInfo() {
      const propertiesKeys = this.manifestSettings.visibleFields.length > 0 ? new Set(this.manifestSettings.visibleFields) : new Set(this.table.getColumns().map(column => column.getPropertyKey()));
      if (this.manifestSettings.ignoredFields.length > 0) {
        for (const ignoredField of this.manifestSettings.ignoredFields) {
          propertiesKeys.delete(ignoredField);
        }
      }
      return this.transformPathsToInfo(propertiesKeys);
    }

    /**
     * Transforms a set of property paths to an array of field information.
     * @param propertiesPaths The set of property paths
     * @returns Array of the field information.
     */;
    _proto.transformPathsToInfo = function transformPathsToInfo(propertiesPaths) {
      return Array.from(propertiesPaths).reduce((columnInfos, propertyPath) => {
        const columnInfo = this.getFieldInfo(propertyPath);
        if (columnInfo) {
          columnInfos.push(columnInfo);
        }
        return columnInfos;
      }, []);
    }

    /**
     * Gets information about a property.
     * @param propertyPath
     * @returns Field information.
     */;
    _proto.getFieldInfo = function getFieldInfo(propertyPath) {
      const columnsData = this.table.getParent().getTableDefinition().columns;
      const metaModel = this.table.getModel().getMetaModel();
      const entityPath = metaModel.getMetaPath(this.table.data("metaPath"));
      const entitySetDataModel = getInvolvedDataModelObjects(metaModel.getContext(entityPath));
      const relatedColumnInfo = columnsData.find(fieldInfo => fieldInfo.name === propertyPath && fieldInfo.type === "Annotation");
      if (relatedColumnInfo) {
        const annotationPath = relatedColumnInfo.annotationPath;
        if (annotationPath && propertyPath) {
          const propertyDataModel = enhanceDataModelPath(entitySetDataModel, propertyPath);
          const convertedAnnotation = convertMetaModelContext(metaModel.getContext(annotationPath));
          const targetProperty = this.getCompliantProperty(propertyDataModel, convertedAnnotation);
          if (targetProperty && entitySetDataModel.targetEntityType.entityProperties.includes(targetProperty)) return {
            key: relatedColumnInfo.key,
            propertyDataModel,
            targetProperty,
            label: relatedColumnInfo.label ?? relatedColumnInfo.key,
            convertedAnnotation
          };
        }
      }
      return undefined;
    }

    /**
     * Gets the property to display on the Dialog.
     * @param propertyDataModel The dataModelObjectPath of the column
     * @param annotation  The converted annotation of the column
     * @returns The property if it is compliant, undefined otherwise
     */;
    _proto.getCompliantProperty = function getCompliantProperty(propertyDataModel, annotation) {
      const targetObject = propertyDataModel.targetObject;
      let targetProperty;
      if (isProperty(targetObject)) {
        targetProperty = targetObject;
        if (targetObject.annotations.UI?.IsImageURL) {
          return;
        }
      } else if (isDataFieldTypes(annotation) && !annotation.hasOwnProperty("Action")) {
        targetProperty = annotation.Value.$target;
      } else {
        return;
      }

      // Check if the field is compliant for the MassEdit
      const unitProperty = getAssociatedUnitProperty(targetProperty);
      if (isMultiValueField(propertyDataModel) || hasValueHelp(targetProperty) && targetProperty.annotations?.Common?.ValueListRelevantQualifiers ||
      // context dependent VH is not supported for Mass Edit.
      unitProperty && hasValueHelp(unitProperty) && unitProperty.annotations?.Common?.ValueListRelevantQualifiers) {
        return;
      }
      return targetProperty;
    }

    /**
     * Checks if the field is hidden for the provided contexts.
     * @param expBinding The expression binding of the property.
     * @returns True if the field is hidden for all contexts, false otherwise
     */;
    _proto.isHiddenForContexts = function isHiddenForContexts(expBinding) {
      if (expBinding === "true") {
        return false;
      } else if (expBinding === "false") {
        return true;
      }
      const anyObject = new Any({
        anyBoolean: expBinding
      });
      anyObject.setModel(this.analyzedContexts[0].getModel());
      const isHidden = !this.analyzedContexts.find(context => {
        anyObject.setBindingContext(context);
        return anyObject.getBinding("anyBoolean").getExternalValue();
      });
      anyObject.destroy();
      return isHidden;
    }

    /**
     * Gets the selected context set as updatable.
     * @returns The contexts.
     */;
    _proto.fetchContextsForEdit = function fetchContextsForEdit() {
      const internalModelContext = this.table.getBindingContext("internal"),
        updatableContextProperty = !this.onContextMenu ? "updatableContexts" : "contextmenu/updatableContexts";
      return internalModelContext?.getProperty(updatableContextProperty) ?? [];
    }

    /**
     * Gets the properties of the mass edit fields.
     * @returns The properties of the mass edit field.
     */;
    _proto.getFieldProperties = function getFieldProperties() {
      return deepClone(this.fieldProperties);
    }

    /**
     * Gets the properties of the mass edit fields from an array of field information.
     * @param fieldsInfo The field information.
     * @returns The properties of the mass edit fields.
     */;
    _proto.getFieldsPropertiesFromInfo = async function getFieldsPropertiesFromInfo(fieldsInfo) {
      const fieldProperties = [];
      for (const fieldInfo of fieldsInfo) {
        const {
          targetProperty,
          propertyDataModel,
          convertedAnnotation
        } = fieldInfo;
        const dataPropertyPath = getContextRelativeTargetObjectPath(propertyDataModel);
        if (dataPropertyPath) {
          const unitOrCurrencyPropertyPath = getAssociatedUnitPropertyPath(targetProperty) || getAssociatedCurrencyPropertyPath(targetProperty);
          const inputType = this.getInputType(convertedAnnotation, propertyDataModel);
          if (inputType && propertyDataModel.targetObject) {
            const relativePath = getRelativePaths(propertyDataModel);
            const fieldData = {
              visibilityBindings: {
                isVisible: compileExpression(isVisible(convertedAnnotation)),
                editMode: getEditMode(targetProperty, propertyDataModel, false, false, convertedAnnotation, constant(true))
              },
              visible: true,
              //by default the field is visible
              label: fieldInfo.label || targetProperty.annotations.Common?.Label || dataPropertyPath,
              isFieldRequired: getRequiredExpression(targetProperty, convertedAnnotation, true, false, {}, propertyDataModel),
              descriptionPath: getAssociatedTextPropertyPath(propertyDataModel.targetObject),
              textBinding: {
                expression: getTextBinding(propertyDataModel, {
                  displayMode: getDisplayMode(targetProperty, propertyDataModel)
                }),
                type: targetProperty.type === "Edm.DateTimeOffset" || targetProperty?.annotations?.Common?.IsTimezone ? "anyText" : "any"
              },
              readOnlyExpression: isReadOnlyExpression(targetProperty, relativePath),
              inputType,
              propertyInfo: {
                clearable: this.isPropertyClearable(targetProperty),
                emptyValue: this.getEmptyValueForProperty(targetProperty, dataPropertyPath),
                key: fieldInfo.key,
                relativePath: dataPropertyPath,
                unitOrCurrencyPropertyPath
              },
              selectItems: []
            };
            fieldProperties.push(fieldData);
          }
        }
      }
      await this.getDataForOpeningDialog(fieldProperties);
      await Promise.all(fieldProperties.map(async fieldData => {
        fieldData.visible = this.manifestSettings.visibleFields.length === 0 ? this.isFieldVisible(fieldData) : true;
        const runtimeSelection = !this.isAdaptation ? await this.getRuntimeSelection(fieldData) : [];
        fieldData.selectItems = [...this.getDefaultSelectOptions(fieldData), ...runtimeSelection];
      }));
      return fieldProperties;
    }

    /**
     * Gets the properties of dialog fields.
     * @returns The properties.
     */;
    _proto.generateFieldsProperties = async function generateFieldsProperties() {
      return this.getFieldsPropertiesFromInfo(this.getFieldsInfo());
    }

    /**
     * Gets the properties of the entity.
     * @returns The properties.
     */;
    _proto.generateEntityFieldsProperties = async function generateEntityFieldsProperties() {
      return this.getFieldsPropertiesFromInfo(this.getEntityFieldsInfo());
    }

    /**
     * Gets the relevant data from the model needed after the opening of the dialog.
     * This method is called only in the degraded mode since the data is already fetched in the normal mode.
     * the degraded mode is set when the number of selected contexts is greater than the max analyzed rows.
     * @param fieldProperties The field properties
     * @returns A promise that resolves when the data is fetched.
     */;
    _proto.getDataAfterOpeningDialog = async function getDataAfterOpeningDialog(fieldProperties) {
      if (this.degradedMode) {
        const missingContexts = this.contexts.slice(this.maxAnalyzedRows, this.contexts.length);
        const bindingsToFetch = [].concat(...fieldProperties.map(fieldData => [{
          expression: compileExpression(fieldData.readOnlyExpression),
          contexts: this.contexts
        }, {
          expression: compileExpression(pathInModel(fieldData.propertyInfo.relativePath)),
          contexts: missingContexts
        }, {
          expression: compileExpression(pathInModel(fieldData.propertyInfo.unitOrCurrencyPropertyPath)),
          contexts: missingContexts
        }]));
        await this.getMissingData(bindingsToFetch);
      }
    }

    /**
     * Gets the relevant data from the model needed to open the dialog.
     * @param fieldProperties The field properties
     * @returns A promise that resolves when the data is fetched.
     */;
    _proto.getDataForOpeningDialog = async function getDataForOpeningDialog(fieldProperties) {
      const bindingsToResolve = [].concat(fieldProperties.reduce((bindings, fieldData) => {
        bindings = bindings.concat([{
          expression: fieldData.textBinding.expression
        }, {
          expression: compileExpression(pathInModel(fieldData.propertyInfo.relativePath)),
          type: fieldData.textBinding.type
        }, {
          expression: compileExpression(pathInModel(fieldData.propertyInfo.unitOrCurrencyPropertyPath))
        }]);
        if (!this.manifestSettings.visibleFields.length) {
          bindings = bindings.concat([{
            expression: fieldData.visibilityBindings.isVisible
          }, {
            expression: fieldData.visibilityBindings.editMode
          }]);
        }
        if (!this.degradedMode) {
          bindings.push({
            expression: compileExpression(fieldData.readOnlyExpression)
          });
        }
        return bindings;
      }, []));
      await this.getMissingData(bindingsToResolve);
    }

    /**
     * Gets the missing data for the fields.
     * This method generates controls with the provided bindings to fetch the missing data.
     * The model requests the data to the backend when the contexts doesn't contains the related properties.
     * @param bindingsToFetch The binding to resolve and its property path reference
     * @returns A promise that resolves when the data is fetched.
     */;
    _proto.getMissingData = async function getMissingData(bindingsToFetch) {
      if (this.isAdaptation) {
        return;
      }
      if (this.view.getViewData().converterType === "ObjectPage") {
        const displayedProperties = this.table.getColumns().map(column => column.getPropertyKey());
        if (this.manifestSettings.visibleFields.every(field => displayedProperties.includes(field))) {
          return;
        }
      }
      const promises = [];
      const controls = [];
      const model = this.contexts[0].getModel();
      for (const binding of bindingsToFetch.filter(binding => binding.expression?.startsWith("{"))) {
        // Avoid to fetch constant bindings
        const parameters = {};
        const analyzedContexts = binding.contexts ?? this.analyzedContexts;
        const bindingType = binding.type ?? "any";
        parameters[bindingType] = binding.expression;
        for (const context of analyzedContexts) {
          const control = new Any(parameters);
          control.setModel(model);
          control.setBindingContext(context);
          controls.push(control);
          promises.push(async () => {
            const controlBinding = control.getBinding(bindingType);
            if (controlBinding) {
              controlBinding.setBindingMode(BindingMode.OneTime);
              if (controlBinding.isA("sap.ui.model.CompositeBinding")) {
                await Promise.all(controlBinding.getBindings().map(nestedBinding => nestedBinding.requestValue?.()));
              } else {
                await controlBinding.requestValue?.();
              }
            }
          });
        }
      }
      await Promise.all(promises.map(async promise => promise()));
      for (const control of controls) {
        control.destroy();
      }
    }

    /**
     * Gets the default value of the property when the related field is empty.
     * @param property The property
     * @param propertyPath The property path
     * @returns The default value.
     */;
    _proto.getEmptyValueForProperty = function getEmptyValueForProperty(property, propertyPath) {
      if (property.nullable !== false) {
        return null;
      } else {
        const context = this.contexts[0];
        const anyObject = new Any({
          any: compileExpression(formatWithTypeInformation(property, pathInModel(propertyPath)))
        });
        anyObject.setModel(context.getModel());
        anyObject.setBindingContext(context);
        const value = anyObject.getBindingInfo("any").binding.getType().parseValue("", "string");
        anyObject.destroy();
        return value;
      }
    }

    /**
     * Checks if the property is clearable.
     * Some OData types don't access empty string or 0 as a valid value when it's not nullable.
     * For example, Edm.DateTime doesn't accept an empty string as a valid value.
     * @param property The property
     * @returns True if the property is clearable, false otherwise.
     */;
    _proto.isPropertyClearable = function isPropertyClearable(property) {
      if (property.nullable !== false) {
        return true;
      } else {
        return !["Edm.DateTime", "Edm.DateTimeOffset", "Edm.TimeOfDay", "Edm.Time", "Edm.Date", "Edm.DateTimeWithTimezone"].includes(property.type);
      }
    }

    /**
     * Gets the selection options of a field generated by the selected contexts.
     * @param fieldData Data of the field used by both the static and the runtime model
     * @returns The select options of the field
     */;
    _proto.getRuntimeSelection = async function getRuntimeSelection(fieldData) {
      const distinctMap = new Set();
      const selectOptions = [];
      if (fieldData.inputType === "CheckBox") {
        return [];
      }
      const anyObject = new Any({
        anyText: fieldData.textBinding.expression
      });
      anyObject.setModel(this.contexts[0].getModel());
      for (const selectedContext of this.analyzedContexts) {
        anyObject.setBindingContext(selectedContext);
        const textBinding = anyObject.getBinding("anyText");
        if (textBinding?.isA("sap.ui.model.CompositeBinding")) {
          // If the text binding is a composite binding, we need to request the value of each binding
          // to wait for the promise to resolve before getting the value of requestUnitsOfMeasure/requestCurrencyCodes
          // for the custom units of measure and currency codes.
          // We have to set the binding mode to OneTime to avoid the binding to be updated when the context changes.
          // Indeed even if the requestUnitsOfMeasure/requestCurrencyCodes doesn't change it's trigger a PATCH request
          textBinding.setBindingMode(BindingMode.OneTime);
          await Promise.all(textBinding.getBindings().map(binding => binding.requestValue?.()));
        }
        const propertyText = anyObject.getBinding("anyText")?.getExternalValue();
        if (propertyText && !distinctMap.has(propertyText)) {
          distinctMap.add(propertyText);
          selectOptions.push({
            text: propertyText,
            key: propertyText,
            unitOrCurrencyValue: fieldData.propertyInfo.unitOrCurrencyPropertyPath ? selectedContext.getObject(fieldData.propertyInfo.unitOrCurrencyPropertyPath) : "",
            propertyValue: selectedContext.getObject(fieldData.propertyInfo.relativePath)
          });
        }
      }
      anyObject.destroy();
      return selectOptions;
    }

    /**
     * Gets the default selection options of a field.
     * @param fieldData The property information
     * @returns The default select options.
     */;
    _proto.getDefaultSelectOptions = function getDefaultSelectOptions(fieldData) {
      const resourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      const keepEntry = {
        text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_KEEP_VALUES"),
        key: SpecificSelectKeys.KeepKey
      };
      const defaultOptions = [];
      defaultOptions.push(keepEntry);
      if (fieldData.inputType === "CheckBox") {
        defaultOptions.push({
          text: resourceBundle.getText("yes"),
          key: "true"
        }, {
          text: resourceBundle.getText("no"),
          key: "false"
        });
      } else {
        defaultOptions.push({
          text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_REPLACE_VALUES"),
          key: SpecificSelectKeys.ReplaceKey
        });
        if (fieldData.isFieldRequired !== "true" && fieldData.propertyInfo.clearable) {
          defaultOptions.push({
            text: resourceBundle.getText("C_MASS_EDIT_COMBOBOX_CLEAR_VALUES"),
            key: SpecificSelectKeys.ClearFieldValueKey
          });
        }
      }
      return defaultOptions;
    }

    /**
     * Checks if the the field is editable.
     * @param expBinding The expression binding of the property.
     * @returns Returns true if the mass edit field is editable.
     */;
    _proto.getFieldEditable = function getFieldEditable(expBinding) {
      if (expBinding === FieldEditMode.Editable) {
        return true;
      } else if (Object.keys(FieldEditMode).includes(expBinding)) {
        return false;
      } else if (expBinding) {
        const anyControl = new Any({
          any: expBinding
        });
        const model = this.analyzedContexts[0].getModel();
        anyControl.setModel(model);
        const visible = this.analyzedContexts.some(context => {
          anyControl.setBindingContext(context);
          return anyControl.getBinding("any").getExternalValue() === FieldEditMode.Editable;
        });
        anyControl.destroy();
        return visible;
      } else {
        return true;
      }
    }

    /**
     * Gets the input type of the field.
     * @param dataFieldConverted The converted annotation fo the field
     * @param dataModelPath The dataModelObjectPath of the property
     * @returns The input type.
     */;
    _proto.getInputType = function getInputType(dataFieldConverted, dataModelPath) {
      const editStyleProperties = {};
      setEditStyleProperties(editStyleProperties, dataFieldConverted, dataModelPath, true);
      return editStyleProperties?.editStyle;
    }

    /**
     * Gets the visibility of the field
     * This visibility is not dependent on the context when
     *  - either the adaptation mode is set.
     *  - or the field is visible in the manifest and the degraded mode is set.
     * @param fieldProperties The properties of the mass edit field
     * @returns True if the field is visible, false otherwise
     */;
    _proto.isFieldVisible = function isFieldVisible(fieldProperties) {
      if (this.isAdaptation || this.manifestSettings.visibleFields.length && this.degradedMode) {
        const isStaticEditMode = Object.keys(FieldEditMode).includes(fieldProperties.visibilityBindings.editMode);
        const isEditable = !isStaticEditMode || isStaticEditMode && fieldProperties.visibilityBindings.editMode === FieldEditMode.Editable;
        return isEditable && fieldProperties.visibilityBindings.isVisible !== "false";
      }
      return this.getFieldEditable(fieldProperties.visibilityBindings.editMode) && !this.isHiddenForContexts(fieldProperties.visibilityBindings.isVisible);
    };
    return MassEditDialogHelper;
  }();
  _exports = MassEditDialogHelper;
  return _exports;
}, false);
//# sourceMappingURL=MassEditDialogHelper-dbg.js.map
