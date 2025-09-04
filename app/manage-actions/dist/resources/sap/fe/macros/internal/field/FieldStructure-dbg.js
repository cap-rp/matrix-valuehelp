/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/ValueHelp", "sap/m/HBox", "sap/m/VBox", "sap/ui/mdc/enums/FieldEditMode", "../../CommonHelper", "../../controls/FieldWrapper", "../../field/FieldHelper", "./DisplayStyle", "./EditStyle", "./FieldStructureHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (StableIdHelper, DataModelPathHelper, PropertyHelper, ValueHelp, HBox, VBox, FieldEditMode, CommonHelper, FieldWrapper, FieldHelper, DisplayStyle, EditStyle, FieldStructureHelper, _jsx, _jsxs) {
  "use strict";

  var _exports = {};
  var setUpField = FieldStructureHelper.setUpField;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  var getAssociatedUnitProperty = PropertyHelper.getAssociatedUnitProperty;
  var getAssociatedCurrencyProperty = PropertyHelper.getAssociatedCurrencyProperty;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  /**
   * The function calculates the corresponding ValueHelp field in case it´s
   * defined for the specific control.
   * @param field
   * @param pageController
   * @param metaModel
   * @returns An XML-based string with a possible ValueHelp control.
   */
  function getPossibleValueHelpTemplateId(field, pageController, metaModel) {
    /* For currency (and later Unit) we need to forward the value help to the annotated field */
    const targetProperty = getAssociatedCurrencyProperty(field.property) ?? getAssociatedUnitProperty(field.property) ?? field.property;
    if (targetProperty && hasValueHelp(targetProperty)) {
      // depending on whether this one has a value help annotation included, add the dependent
      const vhTemplate = ValueHelp.getValueHelpForMetaPath(pageController, field.dataSourcePath, field.contextPath?.getPath(), metaModel);
      return vhTemplate?.getContent()?.getId();
    }
    return "";
  }

  /**
   * Create the fieldWrapper control for use cases with display and edit styles.
   * @param field Reference to the current internal field instance
   * @returns An XML-based string with the definition of the field control
   */
  _exports.getPossibleValueHelpTemplateId = getPossibleValueHelpTemplateId;
  function createFieldWrapper(field) {
    let fieldWrapperID;
    if (field._flexId) {
      fieldWrapperID = field._flexId;
    } else if (field.idPrefix) {
      fieldWrapperID = generate([field.idPrefix, "Field-content"]);
    } else {
      fieldWrapperID = undefined;
    }

    // compute the display part and the edit part for the fieldwrapper control
    const contentDisplay = DisplayStyle.getTemplate(field);
    // content edit part needs to be wrapped further with an hbox in case of collaboration mode
    // that´s why we need to call this special helper here which finally calls internally EditStyle.getTemplate
    // const contentEdit = EditStyle.getTemplateWithWrapper(field, controller, handleChange, field);
    const contentEdit = EditStyle.getTemplateWithWrapper(field);
    return _jsx(FieldWrapper, {
      id: fieldWrapperID,
      editMode: field.editMode ?? field.computedEditMode,
      width: "100%",
      textAlign: field.textAlign,
      class: field.class,
      validateFieldGroup: field.eventHandlers.onFocusOut,
      children: {
        contentDisplay: contentDisplay,
        contentEdit: contentEdit
      }
    });
  }

  /**
   * Helps to calculate the field structure wrapper.
   * @param field Reference to the current internal field instance
   * @returns An XML-based string with the definition of the field control
   */
  _exports.createFieldWrapper = createFieldWrapper;
  function getFieldStructureTemplate(field) {
    let preparedProperties = field;
    // Check if the field is not dynamically instantiated (the code is used for the field)
    if (!(field.isDynamicInstantiation ?? false)) {
      preparedProperties = setUpField(field, field._controlConfiguration, field._settings.models.viewData, field._settings.models.internal ?? field._settings.appComponent?.getModel?.("internal"), field._settings.appComponent, field.isPropertyInitial("readOnly"));
      const fileFilename = preparedProperties.fileFilenameExpression ? "{ path: '" + preparedProperties.fileFilenameExpression + "' }" : "undefined";
      preparedProperties.eventHandlers.change = "Field.handleChange";
      preparedProperties.eventHandlers.liveChange = "Field.handleLiveChange";
      preparedProperties.eventHandlers.validateFieldGroup = "Field.onValidateFieldGroup";
      preparedProperties.eventHandlers.handleTypeMissmatch = "FieldRuntimeHelper.handleTypeMissmatch";
      preparedProperties.eventHandlers.handleFileSizeExceed = "FieldRuntimeHelper.handleFileSizeExceed";
      preparedProperties.eventHandlers.handleUploadComplete = `FieldRuntimeHelper.handleUploadComplete($event, ${fileFilename}, '${preparedProperties.fileRelativePropertyPath}', $controller)`;
      preparedProperties.eventHandlers.uploadStream = "FieldRuntimeHelper.uploadStream($controller, $event)";
      preparedProperties.eventHandlers.removeStream = `FieldRuntimeHelper.removeStream($event, ${fileFilename}, '${preparedProperties.fileRelativePropertyPath}', $controller)`;
      preparedProperties.eventHandlers.handleOpenUploader = "FieldRuntimeHelper.handleOpenUploader";
      preparedProperties.eventHandlers.handleCloseUploader = "FieldRuntimeHelper.handleCloseUploader";
      preparedProperties.eventHandlers.openExternalLink = "FieldRuntimeHelper.openExternalLink";
      preparedProperties.eventHandlers.onFocusOut = ".collaborativeDraft.handleContentFocusOut";
      preparedProperties.eventHandlers.linkPressed = "FieldRuntimeHelper.pressLink";
      preparedProperties.eventHandlers.displayAggregationDetails = `FIELDRUNTIME.displayAggregateDetails($event, '${getContextRelativeTargetObjectPath(preparedProperties.dataModelPath)}')`;
      if (preparedProperties.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath") {
        preparedProperties.eventHandlers.onDataFieldWithNavigationPath = `FieldRuntimeHelper.onDataFieldWithNavigationPath(\${$source>/}, $controller, '${preparedProperties.convertedMetaPath.Target.value}')`;
      }
      preparedProperties.eventHandlers.showCollaborationEditUser = "FieldRuntimeHelper.showCollaborationEditUser(${$source>/}, ${$view>/})";
      preparedProperties.eventHandlers.onDataFieldActionButton = FieldHelper.getPressEventForDataFieldActionButton(preparedProperties, preparedProperties.metaPath.getObject());
      preparedProperties.eventHandlers.onDataFieldWithIBN = CommonHelper.getPressHandlerForDataFieldForIBN(preparedProperties.metaPath.getObject());
    }

    //compute the field in case of mentioned display styles
    if (preparedProperties.displayStyle === "Avatar" || preparedProperties.displayStyle === "Contact" || preparedProperties.displayStyle === "Button" || preparedProperties.displayStyle === "File") {
      // check for special handling in case a file type is used with the collaboration mode
      // (renders an avatar directly)
      if (preparedProperties.displayStyle === "File" && (preparedProperties.collaborationEnabled ?? false) && (preparedProperties.editMode ?? preparedProperties.computedEditMode) !== FieldEditMode.Display) {
        return _jsxs(HBox, {
          width: "100%",
          alignItems: "End",
          children: [_jsx(VBox, {
            width: "100%",
            children: DisplayStyle.getFileTemplate(preparedProperties)
          }), EditStyle.getCollaborationAvatar(preparedProperties)]
        });
      } else {
        //for all other cases render the displayStyles with a field api wrapper
        return DisplayStyle.getTemplate(preparedProperties);
      }
    } else if (preparedProperties.formatOptions.fieldMode === "nowrapper" && (preparedProperties.editMode ?? preparedProperties.computedEditMode) === FieldEditMode.Display) {
      //renders a display based building block (e.g. a button) that has no field api wrapper around it.
      return DisplayStyle.getTemplate(preparedProperties);
    } else {
      //for all other cases create a field wrapper
      return createFieldWrapper(preparedProperties);
    }
  }
  _exports.getFieldStructureTemplate = getFieldStructureTemplate;
  return _exports;
}, false);
//# sourceMappingURL=FieldStructure-dbg.js.map
