/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DisplayModeFormatter", "sap/m/table/Util", "sap/ui/mdc/odata/v4/TypeMap"], function (Log, SizeHelper, TypeGuards, DisplayModeFormatter, TableUtil, TypeMap) {
  "use strict";

  var getDisplayMode = DisplayModeFormatter.getDisplayMode;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  const TableSizeHelper = {
    /**
     * Method to calculate the width of the MDCColumn.
     * @param dataField The Property or PropertyInfo Object for which the width will be calculated.
     * @param properties An array containing all property definitions (optional)
     * @param convertedMetaData
     * @param widthIncludingColumnHeader Indicates if the label should be a part of the width calculation
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns The width of the column.
     */
    getMDCColumnWidthFromDataField: function (dataField, properties, convertedMetaData) {
      let widthIncludingColumnHeader = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      const property = properties.find(prop => prop.annotationPath && convertedMetaData.resolvePath(prop.annotationPath)?.target?.fullyQualifiedName === dataField?.fullyQualifiedName);
      return property ? this.getMDCColumnWidthFromProperty(property, properties, widthIncludingColumnHeader) : 0;
    },
    /**
     *  Method to calculate the width of the MDCColumn.
     * @param property The PropertyInfo object for which the width is calculated
     * @param properties  An array containing all property definitions (optional)
     * @param widthIncludingColumnHeader Indicates if the label is part of the width calculation
     * @param isSortableColumn Indicates if the column is sortable
     * @param isColumnRequired Indicates if the column is required
     * @returns The width of the column.
     */
    getMDCColumnWidthFromProperty: function (property, properties) {
      let widthIncludingColumnHeader = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      let isSortableColumn = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      let isColumnRequired = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      const mWidthCalculation = Object.assign({
        headerGap: widthIncludingColumnHeader && isSortableColumn,
        gap: 0,
        truncateLabel: !widthIncludingColumnHeader,
        excludeProperties: [],
        required: isColumnRequired
      }, property.visualSettings?.widthCalculation);
      let types,
        propertyTypeConfig = null;
      //add the typeConfig to the properties as it's not available in the table value help
      if (property.dataType && !property.typeConfig) {
        propertyTypeConfig = TypeMap.getTypeConfig(property.dataType, property.formatOptions, property.constraints);
      }
      if (property.propertyInfos?.length) {
        types = property.propertyInfos.map(propName => {
          const prop = properties.find(_property => _property.key === propName);
          return propertyTypeConfig ? propertyTypeConfig.typeInstance : prop?.typeConfig?.typeInstance;
        }).filter(item => item);
      } else if (property.typeConfig?.typeInstance || propertyTypeConfig) {
        types = propertyTypeConfig ? [propertyTypeConfig.typeInstance] : [property.typeConfig?.typeInstance];
      }
      const size = types ? TableUtil.calcColumnWidth(types, property.label, mWidthCalculation) : null;
      if (!size) {
        Log.error(`Cannot compute the column width for property: ${property.key}`);
      }
      return size ? parseFloat(size.replace("Rem", "")) : 0;
    },
    /**
     * Method to calculate the  width of a DataFieldAnnotation object contained in a fieldGroup.
     * @param dataField DataFieldAnnotation object.
     * @param widthIncludingColumnHeader Indicates if the column header should be a part of the width calculation.
     * @param properties Array containing all PropertyInfo objects.
     * @param convertedMetaData
     * @param showDataFieldsLabel Label is displayed inside the field
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns Object containing the width of the label and the width of the property.
     */
    getWidthForDataFieldForAnnotation: function (dataField, widthIncludingColumnHeader, properties, convertedMetaData) {
      let showDataFieldsLabel = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      const oTargetedProperty = isAnnotationOfType(dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") ? dataField?.Target?.$target : undefined;
      let nPropertyWidth = 0,
        fLabelWidth = 0;
      if (isAnnotationOfType(oTargetedProperty, "com.sap.vocabularies.UI.v1.DataPointType") && oTargetedProperty?.Visualization) {
        switch (oTargetedProperty.Visualization) {
          case "UI.VisualizationType/Rating":
            const nbStars = oTargetedProperty.TargetValue;
            nPropertyWidth = parseInt(nbStars, 10) * 1.375;
            break;
          case "UI.VisualizationType/Progress":
          default:
            nPropertyWidth = 5;
        }
        const sLabel = oTargetedProperty ? oTargetedProperty.label : dataField?.Label?.toString() || "";
        fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
      } else if (convertedMetaData && properties && isAnnotationOfType(oTargetedProperty, "com.sap.vocabularies.Communication.v1.ContactType") && isPathAnnotationExpression(oTargetedProperty.fn)) {
        nPropertyWidth = this.getMDCColumnWidthFromDataField(oTargetedProperty.fn.$target, properties, convertedMetaData, widthIncludingColumnHeader);
      }
      return {
        labelWidth: fLabelWidth,
        propertyWidth: nPropertyWidth
      };
    },
    /**
     * Method to calculate the width of a DataField object.
     * @param dataField DataFieldAnnotation object.
     * @param showDataFieldsLabel Label is displayed inside the field.
     * @param properties Array containing all PropertyInfo objects.
     * @param convertedMetaData Context Object of the parent property.
     * @private
     * @alias sap.fe.macros.TableSizeHelper
     * @returns {object} Object containing the width of the label and the width of the property.
     */

    getWidthForDataField: function (dataField, showDataFieldsLabel, properties, convertedMetaData, widthIncludingColumnHeader) {
      const oTargetedProperty = dataField.Value?.$target,
        oTextArrangementTarget = oTargetedProperty?.annotations?.Common?.Text,
        displayMode = getDisplayMode(dataField.Value?.$target);
      let nPropertyWidth = 0,
        fLabelWidth = 0;
      if (oTargetedProperty) {
        switch (displayMode) {
          case "Description":
            nPropertyWidth = this.getMDCColumnWidthFromDataField(oTextArrangementTarget.$target, properties, convertedMetaData, widthIncludingColumnHeader) - 1;
            break;
          case "DescriptionValue":
          case "ValueDescription":
          case "Value":
          default:
            nPropertyWidth = this.getMDCColumnWidthFromDataField(oTargetedProperty, properties, convertedMetaData, widthIncludingColumnHeader) - 1;
        }
        const sLabel = dataField.Label ? dataField.Label : oTargetedProperty.label;
        fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
      } else {
        Log.error(`Cannot compute width for type object: ${dataField.$Type}`);
      }
      return {
        labelWidth: fLabelWidth,
        propertyWidth: nPropertyWidth
      };
    }
  };
  return TableSizeHelper;
}, false);
//# sourceMappingURL=TableSizeHelper-dbg.js.map
