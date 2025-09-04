/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/EventDelegateHook", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/controls/CollaborationHBox", "sap/fe/macros/controls/RadioButtons", "sap/fe/macros/field/FieldTemplating", "sap/m/Avatar", "sap/m/CheckBox", "sap/m/DatePicker", "sap/m/DateTimePicker", "sap/m/FlexItemData", "sap/m/Input", "sap/m/MaskInput", "sap/m/MaskInputRule", "sap/m/RatingIndicator", "sap/m/TextArea", "sap/m/TimePicker", "sap/ui/core/CustomData", "sap/ui/mdc/Field", "sap/ui/mdc/enums/FieldEditMode", "../../field/FieldHelper", "../../field/TextAreaEx", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (BindingToolkit, EventDelegateHook, MetaModelConverter, CollaborationFormatters, PropertyHelper, UIFormatter, CollaborationHBox, RadioButtons, FieldTemplating, Avatar, CheckBox, DatePicker, DateTimePicker, FlexItemData, Input, MaskInput, MaskInputRule, RatingIndicator, TextArea, TimePicker, CustomData, Field, FieldEditMode, FieldHelper, TextAreaEx, _jsx, _jsxs) {
  "use strict";

  var getTextAlignment = FieldTemplating.getTextAlignment;
  var getMultipleLinesForDataField = FieldTemplating.getMultipleLinesForDataField;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var pathInModel = BindingToolkit.pathInModel;
  var compileExpression = BindingToolkit.compileExpression;
  const EditStyle = {
    /**
     * An internal helper to retrieve the reused layout data.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getLayoutData(field) {
      let layoutData = "";
      if (field.collaborationEnabled) {
        layoutData = _jsx(FlexItemData, {
          growFactor: "9"
        });
      }
      return layoutData;
    },
    /**
     * Generates the avatar control next a field locked.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the avatar
     */
    getCollaborationAvatar(field) {
      const collaborationHasActivityExpression = compileExpression(field.collaborationExpression);
      const collaborationInitialsExpression = compileExpression(UIFormatter.getCollaborationExpression(field.dataModelPath, CollaborationFormatters.getCollaborationActivityInitials));
      const collaborationColorExpression = compileExpression(UIFormatter.getCollaborationExpression(field.dataModelPath, CollaborationFormatters.getCollaborationActivityColor));
      return _jsx(Avatar, {
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        visible: collaborationHasActivityExpression,
        initials: collaborationInitialsExpression,
        displaySize: "Custom",
        customDisplaySize: "1.5rem",
        customFontSize: "0.8rem",
        backgroundColor: collaborationColorExpression,
        press: field.eventHandlers.showCollaborationEditUser,
        children: {
          dependents: _jsx(EventDelegateHook, {
            stopTapPropagation: true
          })
        }
      });
    },
    /**
     * Generates a template for one of the pickers reference in the type.
     * @param field Reference to the current field instance
     * @param type Reference to one of the edit style picker types
     * @returns An XML-based string with the definition of the field control
     */
    getDateTimePickerGeneric(field, type) {
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath, field.contextPath);
      const textAlign = getTextAlignment(dataModelObjectPath, field.formatOptions, field.editModeAsObject);
      const dateTimePickerProperties = {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        width: "100%",
        editable: field.editableExpression,
        enabled: field.enabledExpression,
        required: field.requiredExpression,
        textAlign: textAlign,
        ariaLabelledBy: field.ariaLabelledBy,
        value: field.valueBindingExpression,
        fieldGroupIds: field.fieldGroupIds,
        showTimezone: field.showTimezone,
        minDate: type === "DateTimePicker" || type === "DatePicker" ? field.minDateExpression : undefined,
        maxDate: type === "DateTimePicker" || type === "DatePicker" ? field.maxDateExpression : undefined,
        change: type === "DateTimePicker" ? field.change || field.eventHandlers.change : field.eventHandlers.change,
        liveChange: field.eventHandlers.liveChange,
        validateFieldGroup: field.eventHandlers.validateFieldGroup
      };
      function getDateTimePicker(dateTimePickerType) {
        let dateTimePicker;
        switch (dateTimePickerType) {
          case "DatePicker":
            dateTimePicker = _jsx(DatePicker, {
              ...dateTimePickerProperties,
              children: {
                customData: _jsx(CustomData, {
                  value: field.dataSourcePath
                }, "sourcePath")
              }
            });
            break;
          case "DateTimePicker":
            dateTimePicker = _jsx(DateTimePicker, {
              ...dateTimePickerProperties,
              children: {
                customData: _jsx(CustomData, {
                  value: field.dataSourcePath
                }, "sourcePath")
              }
            });
            break;
          case "TimePicker":
            dateTimePicker = _jsx(TimePicker, {
              ...dateTimePickerProperties,
              children: {
                customData: _jsx(CustomData, {
                  value: field.dataSourcePath
                }, "sourcePath")
              }
            });
            break;
        }
        return dateTimePicker;
      }
      return getDateTimePicker(type);
    },
    /**
     * Generates the Input template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getInputTemplate(field) {
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath, field.contextPath);
      const textAlign = getTextAlignment(dataModelObjectPath, field.formatOptions, field.editModeAsObject);
      return _jsx(Input, {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        value: field.valueBindingExpression,
        placeholder: field.editStylePlaceholder,
        width: "100%",
        editable: field.editableExpression,
        description: field.staticDescription,
        enabled: field.enabledExpression,
        required: field.requiredExpression,
        fieldGroupIds: field.fieldGroupIds,
        textAlign: textAlign,
        type: field.editStyle === "Masked" ? "Password" : undefined,
        ariaLabelledBy: field.ariaLabelledBy,
        maxLength: field.formatOptions.textMaxLength,
        change: field.eventHandlers.change,
        liveChange: field.eventHandlers.liveChange,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        children: {
          layoutData: EditStyle.getLayoutData(field),
          customData: _jsx(CustomData, {
            value: field.dataSourcePath
          }, "sourcePath")
        }
      });
    },
    /**
     * Returns if a field shall be templated as a radio button group.
     * @param field Reference to the current field instance
     * @returns The evaluation result
     */
    showAsRadioButton(field) {
      // Determine if we need to render the field as a radio button group
      // TODO: Remove the next two lines once UX updated the vocabulary module including the new experimental annotation
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const radioButtonConfigured = field.property.annotations?.Common?.ValueListWithFixedValues && hasValueHelpWithFixedValues(field.property) === true && (field.property.annotations.Common.ValueListWithFixedValues.annotations?.Common?.ValueListShowValuesImmediately && field.property.annotations.Common.ValueListWithFixedValues.annotations?.Common?.ValueListShowValuesImmediately.valueOf() === true || field.formatOptions.fieldEditStyle === "RadioButtons");

      // Exclude not supported cases
      // - ValueListParamaterInOut / ...Out must not be empty
      // - ValueListRelevantQualifiers annotation must not be used
      // Further cases may not make sense with radio buttons but we do not explicitly exclude them but mention this in documentation.
      // Check documentation, discuss and decide before adding further restrictions here.
      const valueListParameterInOut = field.property?.annotations?.Common?.ValueList?.Parameters.find(valueListParameter => (valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut") && valueListParameter.LocalDataProperty.value === field.property.name);
      return radioButtonConfigured && valueListParameterInOut !== undefined && !field.property.annotations?.Common?.ValueListRelevantQualifiers;
    },
    /**
     * Generates the RadioButton template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the radio button definition
     */
    getRadioButtonTemplate(field) {
      const fixedValuesPath = "/" + field.property?.annotations?.Common?.ValueList?.CollectionPath;
      const valueListParameterInOut = field.property?.annotations?.Common?.ValueList?.Parameters.find(valueListParameter => (valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || valueListParameter.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut") && valueListParameter.LocalDataProperty.value === field.property.name);

      // we know that a valueListProperty exists because we check this already in showAsRadioButton
      const valueListKeyPath = pathInModel(valueListParameterInOut.ValueListProperty);
      let valueListDescriptionPath;
      const valueHelpKeyTextAnnotationPath = field.dataModelPath.targetEntityType.resolvePath(fixedValuesPath).entityType.keys[0].annotations?.Common?.Text?.path;
      if (valueHelpKeyTextAnnotationPath) {
        valueListDescriptionPath = pathInModel(valueHelpKeyTextAnnotationPath);
      } else {
        valueListDescriptionPath = valueListKeyPath;
      }
      return _jsx(RadioButtons, {
        id: field.editStyleId,
        requiredExpression: field.requiredExpression,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        fixedValuesPath: fixedValuesPath,
        fieldGroupIds: field.fieldGroupIds,
        value: field.valueBindingExpression,
        enabledExpression: field.enabledExpression,
        radioButtonTextProperty: valueListDescriptionPath,
        radioButtonKeyProperty: valueListKeyPath,
        horizontalLayout: field.formatOptions.radioButtonsHorizontalLayout
      });
    },
    /**
     * Generates the InputWithValueHelp template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getInputWithValueHelpTemplate(field) {
      const dataFieldDataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath, field.contextPath);
      const delegate = FieldHelper.computeFieldBaseDelegate("sap/fe/macros/field/FieldBaseDelegate", field.formatOptions.retrieveTextFromValueList);
      const display = UIFormatter.getFieldDisplay(field.property, field.formatOptions.displayMode, field.editModeAsObject);
      const hasMultilineAnnotation = !!field.property?.annotations?.UI?.MultiLineText;
      const multipleLines = getMultipleLinesForDataField(field, hasMultilineAnnotation);
      const textAlign = getTextAlignment(dataFieldDataModelObjectPath, field.formatOptions, field.editModeAsObject, true);
      const label = FieldHelper.computeLabelText(field, {
        context: field.metaPath
      });
      let optionalContentEdit = "";
      if (field.property.type === "Edm.String" && hasMultilineAnnotation) {
        optionalContentEdit = _jsx(TextArea, {
          value: field.valueBindingExpression,
          required: field.requiredExpression,
          rows: field.formatOptions.textLinesEdit,
          growing: field.formatOptions.textMaxLines > 0 ? true : undefined,
          growingMaxLines: field.formatOptions.textMaxLines,
          width: "100%",
          change: field.eventHandlers.change,
          fieldGroupIds: field.fieldGroupIds
        });
      }
      let optionalLayoutData = "";
      if (field.collaborationEnabled === true) {
        optionalLayoutData = _jsx(FlexItemData, {
          growFactor: "9"
        });
      }
      if (this.showAsRadioButton(field) !== true) {
        return _jsx(Field, {
          "core:require": "{Field: 'sap/fe/macros/Field'}",
          delegate: delegate,
          id: field.editStyleId,
          value: field.valueBindingExpression,
          placeholder: field.editStylePlaceholder,
          valueState: field.valueState,
          editMode: field.editMode ?? field.computedEditMode,
          width: "100%",
          required: field.requiredExpression,
          additionalValue: field.textBindingExpression,
          display: display,
          multipleLines: multipleLines === false ? undefined : multipleLines,
          valueHelp: field.valueHelpId,
          fieldGroupIds: field.fieldGroupIds,
          textAlign: textAlign,
          ariaLabelledBy: field.ariaLabelledBy,
          label: label,
          change: field.eventHandlers.change,
          liveChange: field.eventHandlers.liveChange,
          validateFieldGroup: field.eventHandlers.validateFieldGroup,
          children: {
            contentEdit: optionalContentEdit,
            layoutData: optionalLayoutData,
            customData: _jsx(CustomData, {
              value: field.dataSourcePath
            }, "sourcePath")
          }
        });
      } else {
        return this.getRadioButtonTemplate(field);
      }
    },
    /**
     * Generates the CheckBox template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getCheckBoxTemplate(field) {
      return _jsx(CheckBox, {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        selected: field.valueBindingExpression,
        editable: field.editableExpression,
        enabled: field.enabledExpression,
        fieldGroupIds: field.fieldGroupIds,
        ariaLabelledBy: field.ariaLabelledBy,
        select: field.eventHandlers.change,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        children: {
          customData: _jsx(CustomData, {
            value: field.dataSourcePath
          }, "sourcePath")
        }
      });
    },
    /**
     * Generates the TextArea template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTextAreaTemplate(field) {
      const growing = field.formatOptions.textMaxLines ? true : false;
      const showExceededText = !!field.formatOptions.textMaxLength;

      //unfortunately this one is a "different" layoutData than the others, therefore the reuse function from above cannot be used for the textArea template
      let layoutData = "";
      if (field.collaborationEnabled) {
        layoutData = _jsx(FlexItemData, {
          growFactor: "9"
        });
      }
      return _jsx(TextAreaEx, {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        value: field.valueBindingExpression,
        placeholder: field.editStylePlaceholder,
        required: field.requiredExpression,
        rows: field.formatOptions.textLinesEdit,
        growing: growing,
        growingMaxLines: field.formatOptions.textMaxLines,
        cols: 300 //As the default is 20, the "cols" property is configured with a value of 300 to guarantee that the textarea will occupy all the available space.
        ,
        width: "100%",
        editable: field.editableExpression,
        enabled: field.enabledExpression,
        fieldGroupIds: field.fieldGroupIds,
        ariaLabelledBy: field.ariaLabelledBy,
        maxLength: field.formatOptions.textMaxLength,
        showExceededText: showExceededText,
        change: field.eventHandlers.change,
        liveChange: field.eventHandlers.liveChange,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        children: {
          layoutData: layoutData,
          customData: _jsx(CustomData, {
            value: field.dataSourcePath
          }, "sourcePath")
        }
      });
    },
    /**
     * Generates the RatingIndicator template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getRatingIndicatorTemplate: field => {
      const tooltip = field.ratingIndicatorTooltip || "{sap.fe.i18n>T_COMMON_RATING_INDICATOR_TITLE_LABEL}";
      return _jsx(RatingIndicator, {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        maxValue: field.ratingIndicatorTargetValue,
        value: field.valueBindingExpression,
        tooltip: tooltip,
        fieldGroupIds: field.fieldGroupIds,
        iconSize: "1.375rem",
        class: "sapUiTinyMarginTopBottom",
        editable: "true",
        change: field.eventHandlers.change,
        children: {
          layoutData: EditStyle.getLayoutData(field)
        }
      });
    },
    /**
     * Helps to calculate the content edit functionality / templating.
     * Including a wrapper an hbox in case of collaboration mode finally
     * it calls internally EditStyle.getTemplate.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTemplateWithWrapper(field) {
      let contentEdit;
      if ((field.editMode ?? field.computedEditMode) !== FieldEditMode.Display && !!field.editStyle) {
        if (field.collaborationEnabled ?? false) {
          contentEdit = _jsxs(CollaborationHBox, {
            width: "100%",
            alignItems: "End",
            children: [EditStyle.getTemplate(field), EditStyle.getCollaborationAvatar(field)]
          });
        } else {
          contentEdit = EditStyle.getTemplate(field);
        }
      }
      return contentEdit || "";
    },
    /**
     * Generates the InputMask template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getInputMaskTemplate(field) {
      const optionalMaskInputRules = [];
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath, field.contextPath);
      const textAlign = getTextAlignment(dataModelObjectPath, field.formatOptions, field.editModeAsObject);
      if (field.mask?.maskRule) {
        for (const rule of field.mask.maskRule) {
          optionalMaskInputRules.push(_jsx(MaskInputRule, {
            maskFormatSymbol: rule.symbol,
            regex: rule.regex
          }));
        }
      }
      return _jsx(MaskInput, {
        "core:require": "{Field: 'sap/fe/macros/Field'}",
        id: field.editStyleId,
        value: field.valueBindingExpression,
        placeholder: field.editStylePlaceholder,
        width: "100%",
        editable: field.editableExpression,
        ariaLabelledBy: field.ariaLabelledBy,
        mask: field.mask?.mask,
        enabled: field.enabledExpression,
        required: field.requiredExpression,
        fieldGroupIds: field.fieldGroupIds,
        textAlign: textAlign,
        placeholderSymbol: field.mask?.placeholderSymbol,
        liveChange: field.eventHandlers.liveChange,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        children: {
          rules: optionalMaskInputRules,
          customData: _jsx(CustomData, {
            value: field.dataSourcePath
          }, "sourcePath")
        }
      });
    },
    /**
     * Entry point for further templating processings.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTemplate: field => {
      let innerFieldContent;
      switch (field.editStyle) {
        case "CheckBox":
          innerFieldContent = EditStyle.getCheckBoxTemplate(field);
          break;
        case "DatePicker":
        case "DateTimePicker":
        case "TimePicker":
          {
            innerFieldContent = EditStyle.getDateTimePickerGeneric(field, field.editStyle);
            break;
          }
        case "Input":
          {
            innerFieldContent = EditStyle.getInputTemplate(field);
            break;
          }
        case "Masked":
          {
            innerFieldContent = EditStyle.getInputTemplate(field);
            break;
          }
        case "InputWithValueHelp":
          {
            innerFieldContent = EditStyle.getInputWithValueHelpTemplate(field);
            break;
          }
        case "RatingIndicator":
          innerFieldContent = EditStyle.getRatingIndicatorTemplate(field);
          break;
        case "TextArea":
          innerFieldContent = EditStyle.getTextAreaTemplate(field);
          break;
        case "InputMask":
          innerFieldContent = EditStyle.getInputMaskTemplate(field);
          break;
        default:
      }
      return innerFieldContent;
    }
  };
  return EditStyle;
}, false);
//# sourceMappingURL=EditStyle-dbg.js.map
