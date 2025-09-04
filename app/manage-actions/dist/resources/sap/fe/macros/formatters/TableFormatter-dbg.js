/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/SizeHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/table/TableSizeHelper", "sap/ui/core/message/MessageType", "sap/ui/mdc/enums/FieldEditMode"], function (Log, ObjectPath, CommonUtils, SizeHelper, DelegateUtil, TableSizeHelper, MessageType, FieldEditMode) {
  "use strict";

  const getMessagetypeOrder = function (messageType) {
    switch (messageType) {
      case "Error":
        return 4;
      case "Warning":
        return 3;
      case "Information":
        return 2;
      case "None":
        return 1;
      default:
        return -1;
    }
  };

  /**
   * Gets the validity of creation row fields.
   * @param fieldValidityObject Object holding the fields
   * @returns `true` if all the fields in the creation row are valid, `false` otherwise
   */
  const validateCreationRowFields = function (fieldValidityObject) {
    if (!fieldValidityObject) {
      return false;
    }
    const fieldKeys = Object.keys(fieldValidityObject);
    return fieldKeys.length > 0 && fieldKeys.every(function (key) {
      return fieldValidityObject[key]["validity"];
    });
  };
  validateCreationRowFields.__functionName = "sap.fe.macros.formatters.TableFormatter#validateCreationRowFields";

  /**
   * @param this The object status control.
   * @param semanticKeyHasDraftIndicator The property name of the draft indicator.
   * @param aFilteredMessages Array of messages.
   * @param columnName
   * @param isSemanticKeyInFieldGroup Flag which says if semantic key is a part of field group.
   * @returns The value for the visibility property of the object status
   */
  const getErrorStatusTextVisibilityFormatter = function (semanticKeyHasDraftIndicator, aFilteredMessages, columnName, isSemanticKeyInFieldGroup) {
    let statusVisibility = false;
    if (aFilteredMessages && aFilteredMessages.length > 0 && (isSemanticKeyInFieldGroup || columnName === semanticKeyHasDraftIndicator)) {
      const sCurrentContextPath = this.getBindingContext() ? this.getBindingContext()?.getPath() : undefined;
      aFilteredMessages.forEach(oMessage => {
        if (oMessage.getType() === "Error" && sCurrentContextPath && oMessage.getTargets()[0].indexOf(sCurrentContextPath) === 0) {
          statusVisibility = true;
          return statusVisibility;
        }
      });
    }
    return statusVisibility;
  };
  getErrorStatusTextVisibilityFormatter.__functionName = "sap.fe.macros.formatters.TableFormatter#getErrorStatusTextVisibilityFormatter";

  /**
   * Method to calculate the row highlighting based on the criticality value and the messages.
   * @param criticalityValue
   * @param aFilteredMessages
   * @param hasActiveEntity
   * @param isActiveEntity
   * @param isDraftMode
   * @param contextPath
   * @param isInactive
   */
  const rowHighlighting = function (criticalityValue, aFilteredMessages, hasActiveEntity, isActiveEntity, isDraftMode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contextPath, isInactive) {
    let iHighestCriticalityValue = -1;
    if (aFilteredMessages && aFilteredMessages.length > 0) {
      const sCurrentContextPath = this.getBindingContext()?.getPath();
      aFilteredMessages.forEach(message => {
        if (sCurrentContextPath && message.getTargets()[0].indexOf(sCurrentContextPath) === 0 && iHighestCriticalityValue < getMessagetypeOrder(message.getType())) {
          iHighestCriticalityValue = getMessagetypeOrder(message.getType());
          criticalityValue = message.getType();
        }
      });
    }
    if (typeof criticalityValue !== "string") {
      switch (criticalityValue) {
        case 1:
          criticalityValue = MessageType.Error;
          break;
        case 2:
          criticalityValue = MessageType.Warning;
          break;
        case 3:
          criticalityValue = MessageType.Success;
          break;
        case 5:
          criticalityValue = MessageType.Information;
          break;
        default:
          criticalityValue = MessageType.None;
      }
    }
    if (!Object.values(MessageType).includes(criticalityValue)) {
      Log.error(`'${criticalityValue}' isn't a valid value for a row highlight.`);
      return MessageType.None;
    }

    // If we have calculated a criticality <> None, return it
    if (criticalityValue !== MessageType.None) {
      return criticalityValue;
    }

    // If not, we set criticality to 'Information' for newly created rows in Draft mode, and keep 'None' otherwise
    const isNewObject = !hasActiveEntity && !isActiveEntity && !isInactive;
    return isDraftMode === "true" && isNewObject ? MessageType.Information : MessageType.None;
  };
  rowHighlighting.__functionName = "sap.fe.macros.formatters.TableFormatter#rowHighlighting";
  const navigatedRow = function (deepestPath) {
    const sPath = this.getBindingContext()?.getPath();
    if (sPath && deepestPath) {
      return deepestPath.indexOf(sPath) === 0;
    } else {
      return false;
    }
  };
  navigatedRow.__functionName = "sap.fe.macros.formatters.TableFormatter#navigatedRow";

  /**
   * Method to calculate the width of an MDCColumn based on the property definition.
   * @param this The MDCColumn object
   * @param editMode The EditMode of the table
   * @param isPropertiesCacheAvailable Indicates if the properties cache is available
   * @param propertyName The name of the property we want to calculate the width
   * @param useRemUnit Indicates if the rem unit must be concatenated with the column width result
   * @param widthIncludingColumnHeader Indicates if the column header should be a part of the width calculation.
   * @param isSortableColumn Indicates if the column is sortable
   * @param isColumnRequired
   * @returns The width of the column
   */
  const getColumnWidth = function (editMode, isPropertiesCacheAvailable, propertyName) {
    let useRemUnit = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
    let widthIncludingColumnHeader = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    let isSortableColumn = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
    let isColumnRequired = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;
    if (!isPropertiesCacheAvailable) {
      return null;
    }
    const mdcTable = this.getParent();
    let properties;
    if (mdcTable?.getParent()?.isA("sap.ui.mdc.valuehelp.content.MDCTable")) {
      properties = DelegateUtil.getCachedProperties(this.getParent());
    } else {
      properties = mdcTable.getParent().getEnhancedFetchedPropertyInfos();
    }
    if (!properties) return null;
    const property = properties.find(prop => prop.key === propertyName);
    if (!property) return null;
    let columnWidth = TableSizeHelper.getMDCColumnWidthFromProperty(property, properties, widthIncludingColumnHeader, isSortableColumn, isColumnRequired);
    const unitOrTimezone = property.exportSettings?.unit || property.exportSettings?.timezone;
    columnWidth += unitOrTimezone ? SizeHelper.getButtonWidth(unitOrTimezone) : 0;
    if (editMode === FieldEditMode.Editable) {
      switch (property.typeConfig?.baseType) {
        case "Date":
        case "Time":
        case "DateTime":
          columnWidth += 2.8;
          break;
        default:
      }
    }
    if (useRemUnit) {
      return columnWidth + "rem";
    }
    return columnWidth;
  };
  getColumnWidth.__functionName = "sap.fe.macros.formatters.TableFormatter#getColumnWidth";

  /**
   * Method to calculate the width of an MDCColumn for valueHelp the table.
   * @param this The MDCColumn object
   * @param isPropertiesCacheAvailable Indicates if the properties cache is available
   * @param propertyName The name of the property we want to calculate the width
   * @param isTargetSmallDevice Indicates the current device has a small device
   * @param widthIncludingColumnHeader
   * @returns The width of the column
   */
  const getColumnWidthForValueHelpTable = function (isPropertiesCacheAvailable, propertyName, isTargetSmallDevice) {
    let widthIncludingColumnHeader = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const isSmallDevice = CommonUtils.isSmallDevice();
    const withUnit = !isSmallDevice;
    return isSmallDevice && isTargetSmallDevice || !isSmallDevice && !isTargetSmallDevice ? tableFormatter.getColumnWidth.call(this, FieldEditMode.Display, isPropertiesCacheAvailable, propertyName, withUnit, widthIncludingColumnHeader) : null;
  };
  getColumnWidthForValueHelpTable.__functionName = "sap.fe.macros.formatters.TableFormatter#getColumnWidthForValueHelpTable";
  function isRatingIndicator(oControl) {
    if (oControl.isA("sap.fe.macros.controls.FieldWrapper")) {
      const vContentDisplay = Array.isArray(oControl.getContentDisplay()) ? oControl.getContentDisplay()[0] : oControl.getContentDisplay();
      if (vContentDisplay && vContentDisplay.isA("sap.m.RatingIndicator")) {
        return true;
      }
    }
    return false;
  }
  function _updateStyleClassForRatingIndicator(fieldWrapper, last) {
    const vContentDisplay = Array.isArray(fieldWrapper.getContentDisplay()) ? fieldWrapper.getContentDisplay()[0] : fieldWrapper.getContentDisplay();
    const vContentEdit = Array.isArray(fieldWrapper.getContentEdit()) ? fieldWrapper.getContentEdit()[0] : fieldWrapper.getContentEdit();
    if (last) {
      vContentDisplay.addStyleClass("sapUiNoMarginBottom");
      vContentDisplay.addStyleClass("sapUiNoMarginTop");
      vContentEdit.removeStyleClass("sapUiTinyMarginBottom");
    } else {
      vContentDisplay.addStyleClass("sapUiNoMarginBottom");
      vContentDisplay.removeStyleClass("sapUiNoMarginTop");
      vContentEdit.addStyleClass("sapUiTinyMarginBottom");
    }
  }
  function getVBoxVisibility() {
    const aItems = this.getItems();
    let bLastElementFound = false;
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    for (let index = aItems.length - 1; index >= 0; index--) {
      if (!bLastElementFound) {
        if (args[index] !== true) {
          bLastElementFound = true;
          if (isRatingIndicator(aItems[index])) {
            _updateStyleClassForRatingIndicator(aItems[index], true);
          } else {
            aItems[index].removeStyleClass("sapUiTinyMarginBottom");
          }
        }
      } else if (isRatingIndicator(aItems[index])) {
        _updateStyleClassForRatingIndicator(aItems[index], false);
      } else {
        aItems[index].addStyleClass("sapUiTinyMarginBottom");
      }
    }
    return true;
  }
  getVBoxVisibility.__functionName = "sap.fe.macros.formatters.TableFormatter#getVBoxVisibility";

  // See https://www.typescriptlang.org/docs/handbook/functions.html#this-parameters for more detail on this weird syntax
  /**
   * Collection of table formatters.
   * @param this The context
   * @param sName The inner function name
   * @param oArgs The inner function parameters
   * @returns The value from the inner function
   */
  const tableFormatter = function (sName) {
    if (tableFormatter.hasOwnProperty(sName)) {
      for (var _len2 = arguments.length, oArgs = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        oArgs[_key2 - 1] = arguments[_key2];
      }
      return tableFormatter[sName].apply(this, oArgs);
    } else {
      return "";
    }
  };
  tableFormatter.validateCreationRowFields = validateCreationRowFields;
  tableFormatter.rowHighlighting = rowHighlighting;
  tableFormatter.navigatedRow = navigatedRow;
  tableFormatter.getErrorStatusTextVisibilityFormatter = getErrorStatusTextVisibilityFormatter;
  tableFormatter.getVBoxVisibility = getVBoxVisibility;
  tableFormatter.isRatingIndicator = isRatingIndicator; // for unit tests
  tableFormatter.getColumnWidth = getColumnWidth;
  tableFormatter.getColumnWidthForValueHelpTable = getColumnWidthForValueHelpTable;
  ObjectPath.set("sap.fe.macros.formatters.TableFormatter", tableFormatter);
  return tableFormatter;
}, false);
//# sourceMappingURL=TableFormatter-dbg.js.map
