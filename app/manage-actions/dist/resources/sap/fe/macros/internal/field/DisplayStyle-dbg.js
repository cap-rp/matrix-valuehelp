/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/uid", "sap/fe/base/BindingToolkit", "sap/fe/core/controls/FormElementWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/quickView/QuickView", "sap/m/Avatar", "sap/m/Button", "sap/m/ExpandableText", "sap/m/HBox", "sap/m/ImageCustomData", "sap/m/Label", "sap/m/Link", "sap/m/ObjectIdentifier", "sap/m/ObjectStatus", "sap/m/Text", "sap/m/VBox", "sap/m/library", "sap/ui/core/CustomData", "sap/ui/core/Icon", "sap/ui/mdc/enums/FieldEditMode", "sap/ui/unified/FileUploader", "sap/ui/unified/FileUploaderHttpRequestMethod", "../../contact/Contact", "../../contact/Email", "../../controls/ConditionalWrapper", "../../controls/FileWrapper", "../../controls/TextLink", "../../draftIndicator/DraftIndicator", "../../situations/SituationsIndicator", "../DataPoint", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (uid, BindingToolkit, FormElementWrapper, MetaModelConverter, valueFormatters, BindingHelper, StableIdHelper, CriticalityFormatters, DataModelPathHelper, UIFormatters, FieldHelper, FieldTemplating, QuickView, Avatar, Button, ExpandableText, HBox, ImageCustomData, Label, Link, ObjectIdentifier, ObjectStatus, Text, VBox, library, CustomData, Icon, FieldEditMode, FileUploader, FileUploaderHttpRequestMethod, Contact, Email, ConditionalWrapper, FileWrapper, TextLink, DraftIndicator, SituationsIndicator, DataPoint, _jsx, _jsxs) {
  "use strict";

  var ObjectMarkerVisibility = library.ObjectMarkerVisibility;
  var LinkAccessibleRole = library.LinkAccessibleRole;
  var hasValidAnalyticalCurrencyOrUnit = UIFormatters.hasValidAnalyticalCurrencyOrUnit;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var buildExpressionForCriticalityIcon = CriticalityFormatters.buildExpressionForCriticalityIcon;
  var buildExpressionForCriticalityColor = CriticalityFormatters.buildExpressionForCriticalityColor;
  var buildExpressionForCriticalityButtonType = CriticalityFormatters.buildExpressionForCriticalityButtonType;
  var generate = StableIdHelper.generate;
  var UI = BindingHelper.UI;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  const DisplayStyle = {
    getPrecisionForCurrency(field) {
      let scale = field.property.scale ?? 5;
      if (typeof scale !== "number") {
        // Scale can be "variable" but it's not typed as such. In this case, Scale equals the precision
        scale = field.property.precision ?? 5;
      }
      return Math.min(scale, 5);
    },
    getCurrencyOrUnitControl(field, currencyOrUnit, visibleExpression) {
      return _jsx(Link, {
        "core:require": "{FIELDRUNTIME: 'sap/fe/macros/field/FieldRuntime'}",
        text: "{sap.fe.i18n>M_TABLE_SHOW_DETAILS}",
        press: field.eventHandlers.displayAggregationDetails,
        visible: visibleExpression,
        children: {
          dependents: currencyOrUnit?.clone ? currencyOrUnit.clone() : currencyOrUnit
        }
      });
    },
    /**
     * Generates the NumberWithUnitOrCurrencyAligned template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getNumberWithUnitOrCurrencyAlignedTemplate(field) {
      // We don't display anything if the value is undefined
      const relativePropertyPath = getContextRelativeTargetObjectPath(field.dataModelPath);
      const overallVisible = not(equal(pathInModel(relativePropertyPath), undefined));
      const currency = _jsxs(HBox, {
        renderType: "Bare",
        justifyContent: "End",
        class: "sapFeControlsUnitCurrencyHbox",
        children: [_jsx(Text, {
          textDirection: "LTR",
          wrapping: "false",
          textAlign: "End",
          class: "sapUiTinyMarginEnd",
          text: field.valueAsStringBindingExpression
        }), _jsx(Text, {
          textDirection: "LTR",
          wrapping: "false",
          textAlign: "End",
          text: field.unitBindingExpression,
          width: "3.3em"
        })]
      });
      if (field.formatOptions.isAnalytics) {
        return _jsx(ConditionalWrapper, {
          visible: field.displayVisible,
          condition: field.hasValidAnalyticalCurrencyOrUnit,
          children: {
            contentTrue: currency,
            contentFalse: this.getCurrencyOrUnitControl(field, currency, overallVisible)
          }
        });
      } else {
        return currency;
      }
    },
    /**
     * Generates the Avatar template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getAvatarTemplate(field) {
      let avatarId;
      if (field._flexId) {
        avatarId = field._flexId;
      } else if (field.idPrefix) {
        avatarId = generate([field.idPrefix, "Field-content"]);
      }
      const avatarVisible = FieldTemplating.getVisibleExpression(field.dataModelPath);
      const avatarSrc = FieldTemplating.getValueBinding(field.dataModelPath, {});
      const avatarDisplayShape = FieldTemplating.getAvatarShape(field.dataModelPath);
      return _jsx(FormElementWrapper, {
        visible: avatarVisible,
        children: _jsx(Avatar, {
          id: avatarId,
          src: avatarSrc,
          displaySize: "S",
          class: "sapUiSmallMarginEnd",
          imageFitType: "Cover",
          displayShape: avatarDisplayShape
        })
      });
    },
    /**
     * Generates the button template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getButtonTemplate: field => {
      const icon = field.formatOptions?.showIconUrl ?? false ? field.convertedMetaPath.IconUrl : undefined;
      const text = !(field.formatOptions?.showIconUrl ?? false) ? field.convertedMetaPath.Label : undefined;
      const tooltip = field.formatOptions?.showIconUrl ?? false ? field.convertedMetaPath.Label : undefined;
      let buttonPress;
      let buttonIsBound;
      let buttonOperationAvailable;
      let buttonOperationAvailableFormatted;
      let navigationAvailable;
      if (field.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
        buttonPress = field.eventHandlers.onDataFieldActionButton;
        buttonIsBound = field.convertedMetaPath.ActionTarget ? field.convertedMetaPath.ActionTarget.isBound : true;
        buttonOperationAvailable = field.convertedMetaPath.ActionTarget ? field.convertedMetaPath.ActionTarget.annotations?.Core?.OperationAvailable : "false";
        buttonOperationAvailableFormatted = field.convertedMetaPath.ActionTarget ? undefined : "false";
        if (buttonOperationAvailable && buttonOperationAvailable !== "false") {
          const actionTarget = field.convertedMetaPath.ActionTarget;
          const bindingParamName = actionTarget.parameters[0].name;
          //QUALMS, needs to be checked whether this makes sense at that place, might be good in a dedicated helper function
          buttonOperationAvailableFormatted = compileExpression(getExpressionFromAnnotation(buttonOperationAvailable, [], undefined, path => {
            if (path.startsWith(bindingParamName)) {
              return path.replace(bindingParamName + "/", "");
            }
            return path;
          }));
        }
      }
      if (field.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
        buttonPress = field.eventHandlers.onDataFieldWithIBN;
        navigationAvailable = true;
        if (field.convertedMetaPath?.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && field.convertedMetaPath.NavigationAvailable !== undefined && String(field.formatOptions.ignoreNavigationAvailable) !== "true") {
          navigationAvailable = compileExpression(getExpressionFromAnnotation(field.convertedMetaPath.NavigationAvailable));
        }
      }
      let button = "";
      if (field.convertedMetaPath.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
        button = _jsx(Button, {
          visible: field.visible,
          text: text,
          icon: icon,
          enabled: navigationAvailable,
          tooltip: tooltip,
          press: buttonPress
        });
      } else if (FieldHelper.isDataFieldActionButtonVisible(field.convertedMetaPath, buttonIsBound, buttonOperationAvailable)) {
        let enabled = FieldHelper.isDataFieldActionButtonEnabled(field.convertedMetaPath, buttonIsBound, buttonOperationAvailable, buttonOperationAvailableFormatted);
        if (field.formatOptions.isAnalyticalAggregatedRow) {
          enabled = compileExpression(and(resolveBindingString(enabled), UI.isNodeLevelNavigable));
        }
        const type = buildExpressionForCriticalityButtonType(field.dataModelPath);
        button = _jsx(Button, {
          class: field.class,
          text: text,
          icon: icon,
          tooltip: tooltip,
          press: buttonPress,
          enabled: enabled,
          visible: field.visible,
          type: type
        });
      }
      return button;
    },
    /**
     * Generates the Contact template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getContactTemplate(field) {
      const contactMetaPath = field.metaPath.getModel().createBindingContext("Target/$AnnotationPath", field.metaPath);
      const contactVisible = FieldTemplating.getVisibleExpression(field.dataModelPath);
      return _jsx(Contact, {
        idPrefix: field.idPrefix,
        ariaLabelledBy: field.ariaLabelledBy,
        metaPath: contactMetaPath.getPath(),
        contextPath: field.contextPath.getPath(),
        _flexId: field._flexId,
        visible: contactVisible,
        showEmptyIndicator: field.formatOptions.showEmptyIndicator
      });
    },
    /**
     * Generates the innerpart of the data point to be used in getDataPointTemplate.
     * @param field Reference to the current field instance
     * @param withConditionalWrapper Boolean value to determine whether the DataPoint
     * 					  			shall be generated for the conditional wrapper case
     * @returns An XML-based string with the definition of the field control
     */
    getDataPointInnerPart(field, withConditionalWrapper) {
      const convertedDataField = MetaModelConverter.convertMetaModelContext(field.metaPath);
      const metaPath = convertedDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" ? field.metaPath.getModel().createBindingContext("Target/$AnnotationPath", field.metaPath) : field.metaPath;
      const formatOptions = {
        measureDisplayMode: field.formatOptions.measureDisplayMode,
        showEmptyIndicator: field.formatOptions.showEmptyIndicator
      };
      return _jsx(DataPoint, {
        idPrefix: withConditionalWrapper ? undefined : field.idPrefix,
        visible: !withConditionalWrapper ? field.displayVisible : undefined,
        ariaLabelledBy: field.ariaLabelledBy ? field.ariaLabelledBy : undefined,
        metaPath: metaPath.getPath(),
        contextPath: field.contextPath?.getPath(),
        value: field.value,
        children: {
          formatOptions: {
            formatOptions
          }
        }
      });
    },
    /**
     * Generates the DataPoint template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getDataPointTemplate(field) {
      if ((field.formatOptions.isAnalytics ?? false) && (field.hasUnitOrCurrency ?? false)) {
        return _jsx(ConditionalWrapper, {
          visible: field.displayVisible,
          condition: field.hasValidAnalyticalCurrencyOrUnit,
          children: {
            contentTrue: this.getDataPointInnerPart(field, true),
            contentFalse: this.getCurrencyOrUnitControl(field, this.getDataPointInnerPart(field, true))
          }
        });
      } else {
        return this.getDataPointInnerPart(field, false);
      }
    },
    /**
     * Generates the ExpandableText template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getExpandableText(field) {
      return _jsx(ExpandableText, {
        id: field?.displayStyleId,
        visible: field?.displayVisible,
        text: field.text,
        overflowMode: field?.formatOptions?.textExpandBehaviorDisplay,
        maxCharacters: field?.formatOptions?.textMaxCharactersDisplay,
        emptyIndicatorMode: field?.emptyIndicatorMode
      });
    },
    /**
     * Generates the File template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getFileTemplate(field) {
      let innerFilePart;
      const fileStreamNotEmpty = compileExpression(not(equal(pathInModel(`${field.fileRelativePropertyPath}@odata.mediaContentType`), null)));
      const fileFilenameExpression = field.fileFilenameExpression ? "{ path: '" + field.fileFilenameExpression + "' }" : "";

      // FileWrapper
      const fileUploadUrl = FieldTemplating.getValueBinding(field.dataModelPath, {});
      const fileFilenamePath = field.property.annotations.Core?.ContentDisposition?.Filename?.path;
      const fileMediaType = field.property.annotations.Core?.MediaType && compileExpression(getExpressionFromAnnotation(field.property.annotations.Core?.MediaType));

      // template:if
      const fileIsImage = !!field.property.annotations.UI?.IsImageURL || !!field.property.annotations.UI?.IsImage || /image\//i.test(field.property.annotations.Core?.MediaType?.toString() ?? "");

      // Avatar
      const fileAvatarSrc = FieldTemplating.getValueBinding(field.dataModelPath, {});
      const fileAvatarDisplayShape = FieldTemplating.getAvatarShape(field.dataModelPath);

      // Icon
      const fileIconSrc = FieldHelper.getPathForIconSource(field.fileRelativePropertyPath);

      // Link
      const fileLinkText = FieldHelper.getFilenameExpr(fileFilenameExpression, "{sap.fe.i18n>M_FIELD_FILEUPLOADER_NOFILENAME_TEXT}");
      const fileLinkHref = FieldHelper.getDownloadUrl(fileUploadUrl ?? "");

      // Text
      const fileTextVisible = compileExpression(equal(pathInModel(`${field.fileRelativePropertyPath}@odata.mediaContentType`), null));
      let fileAcceptableMediaTypes;
      // FileUploader
      if (field.property.annotations.Core?.AcceptableMediaTypes) {
        const acceptedTypes = Array.from(field.property.annotations.Core.AcceptableMediaTypes).map(type => `'${type}'`);
        fileAcceptableMediaTypes = `{=odata.collection([${acceptedTypes.join(",")}])}`; // This does not feel right, but follows the logic of AnnotationHelper#value
      }
      const fileMaximumSize = FieldHelper.calculateMBfromByte(field.property.maxLength);
      if (fileIsImage) {
        innerFilePart = {
          avatar: _jsx(Avatar, {
            visible: field.displayVisible,
            src: fileAvatarSrc,
            displaySize: "S",
            class: "sapUiSmallMarginEnd",
            imageFitType: "Cover",
            displayShape: fileAvatarDisplayShape,
            children: {
              customData: _jsx(ImageCustomData, {
                paramName: "xcache"
              })
            }
          })
        };
      } else {
        innerFilePart = {
          icon: _jsx(Icon, {
            src: fileIconSrc,
            class: "sapUiSmallMarginEnd",
            visible: fileStreamNotEmpty
          }),
          link: _jsx(Link, {
            text: fileLinkText,
            target: "_blank",
            href: fileLinkHref,
            visible: fileStreamNotEmpty,
            wrapping: "true"
          }),
          text: _jsx(Text, {
            emptyIndicatorMode: field.emptyIndicatorMode,
            text: "",
            visible: fileTextVisible
          })
        };
      }
      if ((field.editMode ?? field.computedEditMode) !== FieldEditMode.Display) {
        const beforeDialogOpen = field.collaborationEnabled ? field.eventHandlers.handleOpenUploader : undefined;
        const afterDialogOpen = field.collaborationEnabled ? field.eventHandlers.handleCloseUploader : undefined;
        innerFilePart = {
          ...innerFilePart,
          fileUploader: _jsx(FileUploader, {
            name: "FEV4FileUpload",
            visible: field.editableExpression,
            buttonOnly: "true",
            iconOnly: "true",
            multiple: "false",
            tooltip: "{sap.fe.i18n>M_FIELD_FILEUPLOADER_UPLOAD_BUTTON_TOOLTIP}",
            icon: "sap-icon://upload",
            style: "Transparent",
            sendXHR: "true",
            useMultipart: "false",
            sameFilenameAllowed: "true",
            mimeType: fileAcceptableMediaTypes,
            typeMissmatch: field.eventHandlers.handleTypeMissmatch,
            maximumFileSize: fileMaximumSize,
            fileSizeExceed: field.eventHandlers.handleFileSizeExceed,
            uploadOnChange: "false",
            uploadComplete: field.eventHandlers.handleUploadComplete,
            httpRequestMethod: field.isDynamicInstantiation ? FileUploaderHttpRequestMethod.Put : "Put",
            change: field.eventHandlers.uploadStream,
            beforeDialogOpen: beforeDialogOpen,
            afterDialogClose: afterDialogOpen,
            uploadStart: field.eventHandlers.handleOpenUploader
          }),
          deleteButton: _jsx(Button, {
            icon: "sap-icon://sys-cancel",
            type: "Transparent",
            press: field.eventHandlers.removeStream,
            tooltip: "{sap.fe.i18n>M_FIELD_FILEUPLOADER_DELETE_BUTTON_TOOLTIP}",
            visible: field.editableExpression,
            enabled: fileStreamNotEmpty
          })
        };
      }
      return _jsx(FileWrapper, {
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        visible: field.visible,
        uploadUrl: fileUploadUrl,
        propertyPath: field.fileRelativePropertyPath,
        filename: fileFilenamePath,
        mediaType: fileMediaType,
        fieldGroupIds: field.fieldGroupIds,
        validateFieldGroup: field.eventHandlers.validateFieldGroup,
        children: {
          customData: _jsx(CustomData, {
            value: field.dataSourcePath
          }, "sourcePath"),
          innerFilePart
        }
      });
    },
    /**
     * Generates the Link template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getLinkTemplate(field) {
      let linkUrl;
      let iconUrl;
      let linkActived;
      let linkTarget;
      switch (field.convertedMetaPath.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
          return _jsx(Link, {
            id: field.displayStyleId,
            visible: field.displayVisible,
            text: DisplayStyle.computeTextWithWhiteSpace(field),
            press: field.eventHandlers.onDataFieldWithIBN,
            ariaLabelledBy: field.ariaLabelledBy,
            emptyIndicatorMode: field.emptyIndicatorMode,
            class: "sapMTextRenderWhitespaceWrap",
            accessibleRole: LinkAccessibleRole.Button
          });
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
          return _jsx(Link, {
            id: field.displayStyleId,
            "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
            visible: field.displayVisible,
            text: field.text,
            press: field.eventHandlers.onDataFieldWithNavigationPath,
            enabled: field.formatOptions.isAnalyticalAggregatedRow ? UI.isNodeLevelNavigable : undefined,
            ariaLabelledBy: field.ariaLabelledBy,
            emptyIndicatorMode: field.emptyIndicatorMode,
            class: "sapMTextRenderWhitespaceWrap"
          });
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
          return _jsx(Link, {
            id: field.displayStyleId,
            visible: field.displayVisible,
            text: field.text,
            press: field.eventHandlers.onDataFieldActionButton,
            enabled: field.formatOptions.isAnalyticalAggregatedRow ? UI.isNodeLevelNavigable : undefined,
            ariaLabelledBy: field.ariaLabelledBy,
            emptyIndicatorMode: field.emptyIndicatorMode,
            class: "sapMTextRenderWhitespaceWrap",
            accessibleRole: LinkAccessibleRole.Button
          });
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
          const html5LinkTarget = field.property.annotations.HTML5?.LinkTarget;
          field.text = DisplayStyle.computeTextWithWhiteSpace(field);
          iconUrl = field.convertedMetaPath.IconUrl ? compileExpression(getExpressionFromAnnotation(field.convertedMetaPath.IconUrl)) : undefined;
          const linkBinding = getExpressionFromAnnotation(field.convertedMetaPath.Url);
          linkUrl = compileExpression(linkBinding);
          linkActived = compileExpression(not(equal(linkBinding, "")));
          linkTarget = html5LinkTarget && html5LinkTarget.toString();
      }
      if (field.property.annotations?.Communication?.IsEmailAddress || field.property.annotations?.Communication?.IsPhoneNumber) {
        const linkIsEmailAddress = field.property.annotations.Communication?.IsEmailAddress !== undefined;
        const linkIsPhoneNumber = field.property.annotations.Communication?.IsPhoneNumber !== undefined;
        const propertyValueBinding = FieldTemplating.getValueBinding(field.dataModelPath, {});
        const mailBlockId = field.displayStyleId ? field.displayStyleId : `mailBlock${uid()}`;
        if (linkIsEmailAddress) {
          linkUrl = `mailto:${propertyValueBinding}`;
          return _jsx(Email, {
            id: mailBlockId,
            visible: field.displayVisible,
            text: field.text,
            mail: propertyValueBinding,
            ariaLabelledBy: field.ariaLabelledBy ? field.ariaLabelledBy : undefined,
            emptyIndicatorMode: field.emptyIndicatorMode
          });
        }
        if (linkIsPhoneNumber) {
          linkUrl = `tel:${propertyValueBinding}`;
          return _jsx(Link, {
            id: field.displayStyleId,
            visible: field.displayVisible,
            text: DisplayStyle.computeTextWithWhiteSpace(field),
            href: linkUrl,
            enabled: linkActived,
            ariaLabelledBy: field.ariaLabelledBy,
            emptyIndicatorMode: field.emptyIndicatorMode,
            class: "sapMTextRenderWhitespaceWrap"
          });
        }
      }
      if (iconUrl) {
        return _jsx(ObjectStatus, {
          "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
          id: field.displayStyleId,
          icon: iconUrl,
          visible: field.displayVisible,
          text: field.text,
          press: field.eventHandlers.openExternalLink,
          active: linkActived,
          emptyIndicatorMode: field.emptyIndicatorMode,
          ariaLabelledBy: field.ariaLabelledBy,
          children: {
            customData: _jsx(CustomData, {
              value: linkUrl
            }, "url")
          }
        });
      } else {
        return _jsx(Link, {
          id: field.displayStyleId,
          visible: field.displayVisible,
          text: field.text,
          href: linkUrl,
          enabled: linkActived,
          target: linkTarget === undefined ? "_top" : linkTarget,
          wrapping: field.wrap === undefined ? true : field.wrap,
          ariaLabelledBy: field.ariaLabelledBy,
          emptyIndicatorMode: field.emptyIndicatorMode
        });
      }
    },
    /**
     * Find the foreign key of target entity which quick view Facets we want to display.
     * @param field Reference to the current field instance
     * @returns The key of the target entity
     */
    getForeignKeyForCustomData(field) {
      const relativePathToQuickViewEntity = QuickView.getRelativePathToQuickViewEntity(field.dataModelPath);
      if (relativePathToQuickViewEntity) {
        const targetNavigationProperties = field.dataModelPath.targetEntityType.navigationProperties;
        const targetNavProp = targetNavigationProperties.find(navProp => navProp.name === relativePathToQuickViewEntity);
        const refConstraint = targetNavProp?.referentialConstraint;
        const key = refConstraint?.length && typeof refConstraint[0] === "object" && refConstraint[0].targetProperty;
        const keyToFetch = key ? `${relativePathToQuickViewEntity}/${key}` : undefined;
        if (keyToFetch !== undefined) {
          return keyToFetch;
        }
      }
      return undefined;
    },
    /**
     * Generates the check expression for displaying or not a quickview.
     * @param field Reference to the current field instance
     * @returns The key of the target entity
     */
    getForeignKeyValueExpression(field) {
      const foreignKeyRelativePath = QuickView.getRelativePathToQuickViewEntity(field.dataModelPath) ? this.getForeignKeyForCustomData(field) : undefined;
      const expression = {
        path: `${foreignKeyRelativePath}`,
        _type: "PathInModel"
      };
      return `${compileExpression(ifElse(equal(foreignKeyRelativePath, undefined), constant(true), not(equal(null, expression))))}`;
    },
    /**
     * Generates the StandardLinkWithQuickView template.
     * @param field Reference to the current field instance
     * @param text The text to display
     * @returns An XML-based string with the definition of the field control
     */
    getStandardLinkWithQuickViewTemplate(field, text) {
      return _jsx(Link, {
        id: field.displayStyleId,
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        text: text,
        visible: field.displayVisible,
        wrapping: field.wrap === undefined ? true : field.wrap,
        press: field.eventHandlers.linkPressed,
        ariaLabelledBy: field.ariaLabelledBy,
        emptyIndicatorMode: field.emptyIndicatorMode,
        accessibleRole: LinkAccessibleRole.Button,
        children: {
          customData: [_jsx(CustomData, {
            value: field.valueAsStringBindingExpression
          }, "loadValue")],
          dependents: DisplayStyle.getMdcLinkForQuickView(field)
        }
      });
    },
    /**
     * Generates the ConditionalLinkTemplate template.
     * @param field Reference to the current field instance
     * @param condition Condition to display a Link or a Text
     * @param text The text to display
     * @returns An XML-based string with the definition of the field control
     */
    getConditionalLinkWithQuickViewTemplate(field, condition, text) {
      const semanticObject = field.semanticObject?.bindingString ?? field.semanticObject;
      return _jsx(TextLink, {
        id: field.displayStyleId,
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        showAsLink: condition,
        semanticObject: semanticObject,
        text: text,
        visible: field.displayVisible,
        wrapping: field.wrap === undefined ? true : field.wrap,
        press: field.eventHandlers.linkPressed,
        ariaLabelledBy: field.ariaLabelledBy,
        emptyIndicatorMode: field.emptyIndicatorMode,
        children: {
          customData: [_jsx(CustomData, {
            value: field.valueAsStringBindingExpression
          }, "loadValue")],
          dependents: DisplayStyle.getMdcLinkForQuickView(field)
        }
      });
    },
    /**
     * Generates the ConditionalLinkTemplate template.
     * @param field Reference to the current field instance
     * @param condition Condition to display a Link or a Text
     * @param contentTrue The Control to display in case condition is true
     * @param contentFalse The Control to display in case condition is false
     * @returns An XML-based string with the definition of the field control
     */
    getConditionalWrapperForQuickViewTemplate(field, condition, contentTrue, contentFalse) {
      return _jsx(ConditionalWrapper, {
        visible: field.displayVisible,
        condition: condition,
        children: {
          contentTrue: contentTrue,
          contentFalse: contentFalse
        }
      });
    },
    /**
     * Generates the LinkWithQuickView template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getLinkWithQuickViewTemplate(field) {
      const text = field.formatOptions.retrieveTextFromValueList ? field.textFromValueList : DisplayStyle.computeTextWithWhiteSpace(field);
      const condition = this.getQuickViewCondition(field);
      if (condition === "true") {
        return this.getStandardLinkWithQuickViewTemplate(field, text);
      }
      return this.getConditionalLinkWithQuickViewTemplate(field, condition, text);
    },
    /**
     * Generates the Text template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTextTemplate(field) {
      if (field.formatOptions.retrieveTextFromValueList) {
        return _jsx(Text, {
          id: field.displayStyleId,
          visible: field.displayVisible,
          text: field.textFromValueList,
          "core:require": "{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}",
          emptyIndicatorMode: field.emptyIndicatorMode,
          renderWhitespace: "true"
        });
      } else {
        // When having a TextArrangement with TextOnly, RTA can only find the binding for the text, but not for the field.
        // To prevent that such a field can be added twice via RTA, we need to provide the field binding as a dummy custom binding.
        let customdata;
        if (field.formatOptions.displayMode === "Description" && field.valueAsStringBindingExpression) {
          customdata = _jsx(CustomData, {
            value: field.valueAsStringBindingExpression
          }, "fieldBinding");
        }
        return _jsx(Text, {
          id: field.displayStyleId,
          visible: field.displayVisible,
          text: field.text,
          wrapping: field.wrap,
          emptyIndicatorMode: field.emptyIndicatorMode,
          renderWhitespace: "true",
          children: customdata
        });
      }
    },
    /**
     * Gets template for the password field.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getPasswordTemplate(field) {
      const textBinding = FieldTemplating.getTextBinding(field.dataModelPath, field.formatOptions, true);
      const textExpression = isPathInModelExpression(textBinding) || typeof textBinding === "string" ? compileExpression(formatResult([textBinding], valueFormatters.formatPasswordText)) : compileExpression(textBinding);
      return _jsx(Text, {
        "core:require": "{valueFormatters: 'sap/fe/core/formatters/ValueFormatter'}",
        id: field.displayStyleId,
        visible: field.displayVisible,
        text: textExpression,
        wrapping: field.wrap,
        renderWhitespace: "true"
      });
    },
    /**
     * Generates the ObjectIdentifier template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getObjectIdentifier(field) {
      let dependents;
      let titleActive;
      if (field.hasQuickView) {
        titleActive = this.getQuickViewCondition(field);
        dependents = DisplayStyle.getMdcLinkForQuickView(field);
      } else {
        titleActive = false;
      }
      let identifier = _jsx(ObjectIdentifier, {
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        id: field.displayStyleId,
        title: field.identifierTitle,
        text: field.identifierText,
        titleActive: titleActive,
        titlePress: field.eventHandlers.linkPressed,
        ariaLabelledBy: field.ariaLabelledBy,
        emptyIndicatorMode: field.emptyIndicatorMode,
        children: {
          customData: [_jsx(CustomData, {
            value: field.valueAsStringBindingExpression
          }, "loadValue")],
          dependents: dependents
        }
      });
      if (field.hasSituationsIndicator) {
        identifier = _jsxs(HBox, {
          alignItems: "Center",
          justifyContent: "SpaceBetween",
          width: "100%",
          children: [identifier, _jsx(SituationsIndicator, {
            contextPath: field.contextPath.getPath(),
            propertyPath: field.situationsIndicatorPropertyPath
          })]
        });
      }
      if (field.showErrorIndicator && field.showErrorObjectStatus) {
        identifier = _jsxs(VBox, {
          children: [identifier, _jsx(ObjectStatus, {
            visible: field.showErrorObjectStatus,
            class: "sapUiSmallMarginBottom",
            text: "{sap.fe.i18n>Contains_Errors}",
            state: "Error"
          })]
        });
      }
      return identifier;
    },
    /**
     * Generates the ObjectStatus template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getObjectStatus(field) {
      let objectStatus;
      let requiredHelper = {
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
      };
      const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath, field.contextPath);
      const enhancedValueDataModelPath = enhanceDataModelPath(dataModelObjectPath, dataModelObjectPath.targetObject?.Value.path);
      const condition = hasValidAnalyticalCurrencyOrUnit(enhancedValueDataModelPath);
      const convertedDataField = MetaModelConverter.getInvolvedDataModelObjects(field.metaPath);
      const criticalityIcon = buildExpressionForCriticalityIcon(convertedDataField);
      const state = buildExpressionForCriticalityColor(convertedDataField);
      const linkUrl = field.convertedMetaPath.Url ? compileExpression(getExpressionFromAnnotation(field.convertedMetaPath.Url)) : undefined;
      if (field.formatOptions.isAnalytics && field.hasUnitOrCurrency) {
        const content = DisplayStyle.getCurrencyOrUnitControl(field, _jsx(Text, {
          text: field.text,
          textAlign: "End"
        }));
        objectStatus = _jsx(ConditionalWrapper, {
          id: field.displayStyleId,
          condition: condition,
          children: {
            contentTrue: _jsx(ObjectStatus, {
              icon: criticalityIcon,
              state: state,
              visible: field.displayVisible,
              text: field.text,
              emptyIndicatorMode: field.emptyIndicatorMode,
              class: "sapMTextRenderWhitespaceWrap"
            }),
            contentFalse: content
          }
        });
      } else {
        let dependents;
        let active = false;
        let isActive;
        let pressAction;
        if (field.hasQuickView) {
          dependents = DisplayStyle.getMdcLinkForQuickView(field);
          isActive = this.getQuickViewCondition(field);
          pressAction = "FieldRuntimeHelper.pressLink";
        }
        if (linkUrl) {
          active = true;
          requiredHelper = {
            "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
          };
          pressAction = field.eventHandlers.openExternalLink;
        }
        objectStatus = _jsx(ObjectStatus, {
          id: field.displayStyleId,
          icon: criticalityIcon,
          state: state,
          text: field.text,
          visible: field.displayVisible,
          emptyIndicatorMode: field.emptyIndicatorMode,
          ...requiredHelper,
          active: isActive ? isActive : active,
          press: pressAction,
          ariaLabelledBy: field.ariaLabelledBy,
          children: {
            customData: [_jsx(CustomData, {
              value: field.valueAsStringBindingExpression
            }, "loadValue"), _jsx(CustomData, {
              value: linkUrl
            }, "url")],
            dependents: dependents
          }
        });
      }
      return objectStatus;
    },
    getMdcLinkForQuickView(field) {
      const semanticObject = field.semanticObject?.bindingString ?? field.semanticObject;
      return new QuickView(field.dataModelPath, field.metaPath.getPath(), field.contextPath.getPath(), semanticObject).createContent();
    },
    /**
     * Generates the LabelSemantickey template.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getLabelSemanticKey(field) {
      const contentTrue = _jsx(Link, {
        text: field.text,
        wrapping: "true",
        "core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}",
        press: field.eventHandlers.linkPressed,
        ariaLabelledBy: field.ariaLabelledBy,
        emptyIndicatorMode: field.emptyIndicatorMode,
        accessibleRole: LinkAccessibleRole.Button,
        children: {
          customData: [_jsx(CustomData, {
            value: field.valueAsStringBindingExpression
          }, "loadValue")],
          dependents: DisplayStyle.getMdcLinkForQuickView(field)
        }
      });
      const contentFalse = _jsx(Label, {
        id: field.displayStyleId,
        visible: field.displayVisible,
        text: field.identifierTitle,
        design: "Bold"
      });
      if (field.hasQuickView) {
        const hasQuickview = this.getQuickViewCondition(field);
        if (hasQuickview === "true") {
          return contentTrue;
        } else {
          return this.getConditionalWrapperForQuickViewTemplate(field, hasQuickview, contentTrue, contentFalse);
        }
      }
      return _jsx(Label, {
        id: field.displayStyleId,
        visible: field.displayVisible,
        text: field.identifierTitle,
        design: "Bold"
      });
    },
    /**
     * Gets the template for the semantic key with draft indicator.
     * @param semanticKeyTemplate The template result without draft indicator
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    addDraftIndicator(semanticKeyTemplate, field) {
      if (!field.formatOptions.fieldGroupDraftIndicatorPropertyPath) {
        // if the draftIndicator is not handled at the fieldGroup level
        //TODO could this be a boolean no draftIndicator
        semanticKeyTemplate = _jsx(FormElementWrapper, {
          visible: field.displayVisible,
          children: _jsxs(VBox, {
            class: FieldHelper.getMarginClass(field.formatOptions.compactSemanticKey),
            children: [semanticKeyTemplate, _jsx(DraftIndicator, {
              draftIndicatorType: ObjectMarkerVisibility.IconAndText,
              contextPath: field.contextPath.getPath(),
              visible: field.draftIndicatorVisible,
              ariaLabelledBy: field.ariaLabelledBy ? field.ariaLabelledBy : []
            })]
          })
        });
      }
      return semanticKeyTemplate;
    },
    /**
     * Computes the text property with the appropriate white space handling.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    computeTextWithWhiteSpace(field) {
      const text = FieldTemplating.getTextBinding(field.dataModelPathExternalID ?? field.dataModelPath, field.formatOptions, true);
      return isPathInModelExpression(text) || typeof text === "string" ? compileExpression(formatResult([text], valueFormatters.replaceWhitespace)) : compileExpression(text);
    },
    /**
     * Gets the condition for having an active link that opens the quick view.
     * @param field
     * @returns A compile binding expression for the condition.
     */
    getQuickViewCondition(field) {
      switch (field.quickViewType) {
        case "Facets":
          //there is quick viewFacets annotation only then we check if the navigation is reachable
          return this.getForeignKeyValueExpression(field);
        case "SemanticLinks":
          if (field.dynamicSemanticObjects) {
            const listOfDynamicSemanticObjects = [];
            if (field.semanticObject) {
              // If we see a dynamic expression with a formatter, we return false. The condition will be resolved later in TextLink control.
              return compileExpression(constant(false));
            }
            for (const semanticObjectExpression of field.dynamicSemanticObjects) {
              if (semanticObjectExpression._type === "PathInModel" || semanticObjectExpression._type === "Constant") {
                listOfDynamicSemanticObjects.push(semanticObjectExpression);
              } else {
                // If we see a dynamic expression ($edmJson), we return true.
                return compileExpression(constant(true));
              }
            }
            const semanticObjectsPath = [pathInModel("/semanticObjects", "internal")].concat(listOfDynamicSemanticObjects);
            return compileExpression(formatResult(semanticObjectsPath, valueFormatters.hasSemanticObjects));
          }
          return "true";
        default:
          // "facetsAndSemanticLinks"
          // if there is both facets and semantic links, we do not check if the navigation is reachable
          return "true";
      }
    },
    /**
     * Entry point for further templating processings.
     * @param field Reference to the current field instance
     * @returns An XML-based string with the definition of the field control
     */
    getTemplate: field => {
      let innerFieldContent;
      switch (field.displayStyle) {
        case "NumberWithUnitOrCurrencyAligned":
          innerFieldContent = DisplayStyle.getNumberWithUnitOrCurrencyAlignedTemplate(field);
          break;
        case "Avatar":
          innerFieldContent = DisplayStyle.getAvatarTemplate(field);
          break;
        case "Button":
          innerFieldContent = DisplayStyle.getButtonTemplate(field);
          break;
        case "Contact":
          innerFieldContent = DisplayStyle.getContactTemplate(field);
          break;
        case "DataPoint":
          innerFieldContent = DisplayStyle.getDataPointTemplate(field);
          break;
        case "ExpandableText":
          innerFieldContent = DisplayStyle.getExpandableText(field);
          break;
        case "File":
          innerFieldContent = DisplayStyle.getFileTemplate(field);
          break;
        case "Link":
          innerFieldContent = DisplayStyle.getLinkTemplate(field);
          break;
        case "LinkWithQuickView":
          innerFieldContent = DisplayStyle.getLinkWithQuickViewTemplate(field);
          break;
        case "ObjectIdentifier":
          innerFieldContent = DisplayStyle.getObjectIdentifier(field);
          break;
        case "ObjectStatus":
          {
            innerFieldContent = DisplayStyle.getObjectStatus(field);
            break;
          }
        case "LabelSemanticKey":
          innerFieldContent = DisplayStyle.getLabelSemanticKey(field);
          break;
        case "Text":
          innerFieldContent = DisplayStyle.getTextTemplate(field);
          break;
        case "Masked":
          innerFieldContent = DisplayStyle.getPasswordTemplate(field);
          break;
        default:
          innerFieldContent = "";
      }
      if (field.addDraftIndicator && innerFieldContent) {
        innerFieldContent = DisplayStyle.addDraftIndicator(innerFieldContent, field);
      }
      return innerFieldContent;
    }
  };
  return DisplayStyle;
}, false);
//# sourceMappingURL=DisplayStyle-dbg.js.map
