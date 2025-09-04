/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/TitleHelper", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/ui/mdc/p13n/StateUtil", "./CommonInsightsHelper"], function (BindingToolkit, CommonUtils, MetaModelConverter, DataField, valueFormatters, TitleHelper, CriticalityFormatters, DataModelPathHelper, PropertyHelper, UIFormatters, FieldTemplating, StateUtil, CommonInsightsHelper) {
  "use strict";

  var _exports = {};
  var createInsightsParams = CommonInsightsHelper.createInsightsParams;
  var getTextBinding = FieldTemplating.getTextBinding;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var isSemanticKey = PropertyHelper.isSemanticKey;
  var isImageURL = PropertyHelper.isImageURL;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var criticalityIconExpressionForIntegrationCards = CriticalityFormatters.criticalityIconExpressionForIntegrationCards;
  var criticalityExpressionForIntegrationCards = CriticalityFormatters.criticalityExpressionForIntegrationCards;
  var getTitleBindingExpression = TitleHelper.getTitleBindingExpression;
  var isDataFieldTypes = DataField.isDataFieldTypes;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatWithTypeInformation = BindingToolkit.formatWithTypeInformation;
  var formatResult = BindingToolkit.formatResult;
  var concat = BindingToolkit.concat;
  var compileExpression = BindingToolkit.compileExpression;
  function getUomBinding(propertyTargetObject, property) {
    const uom = propertyTargetObject?.annotations.Measures?.ISOCurrency || propertyTargetObject?.annotations.Measures?.Unit;
    if (!uom) {
      return;
    } else {
      const propertyBinding = pathInModel(property);
      return compileExpression(concat(propertyBinding, " ", getExpressionFromAnnotation(uom)));
    }
  }
  /**
   * Check if the given TableColumn is an AnnotationTableColumn.
   * @param column Column that is to be checked
   * @returns True of it is an AnnotationTableColumn
   */
  function isAnnotationTableColumn(column) {
    return "annotationPath" in column;
  }

  /**
   * Get all columns that are supported with SAP Insights.
   * The current implementation does not support columns with image urls and columns with multiple values, therefore, they are removed here.
   * @param columns
   * @param table
   * @param metaData
   * @returns An array containing all supported columns.
   */
  function getSupportedColumns(columns, table, metaData) {
    return table.columns.reduce(function (supportedColumns, column) {
      if (column.name in columns && isAnnotationTableColumn(column)) {
        let property;
        const dataField = metaData.resolvePath(column.annotationPath).target;
        // image urls and multi value columns are not supported
        if (isDataFieldTypes(dataField)) {
          // Check if it is from lineItem annotation else consider the property level annotation
          property = dataField.Value.$target;
        } else {
          property = metaData.resolvePath(column.annotationPath).target;
        }
        if (!(property && isImageURL(property)) && !column.isMultiValue) {
          supportedColumns.push({
            ...columns[column.name],
            annotationPath: column.annotationPath,
            formatOptions: column.typeConfig?.formatOptions
          });
        }
      }
      return supportedColumns;
    }, []);
  }
  function getAdditionalText(displayMode, dataModel) {
    let propertyBindingExpression = pathInModel(getContextRelativeTargetObjectPath(dataModel));
    const targetObject = dataModel.targetObject;
    const commonText = targetObject?.annotations.Common?.Text;
    if (commonText === undefined || targetObject === undefined) {
      return undefined;
    }
    propertyBindingExpression = formatWithTypeInformation(targetObject, propertyBindingExpression);
    switch (displayMode) {
      case "ValueDescription":
        const relativeLocation = getRelativePaths(dataModel);
        return compileExpression(getExpressionFromAnnotation(commonText, relativeLocation));
      case "DescriptionValue":
        return compileExpression(formatResult([propertyBindingExpression], valueFormatters.formatToKeepWhitespace));
      default:
        return undefined;
    }
  }
  _exports.getAdditionalText = getAdditionalText;
  function getRowCriticality(tableAPI) {
    return tableAPI.getTableDefinition().annotation.row?.rowCriticalityForInsights;
  }

  /**
   * Filters the columns that can be shown on the insights card from the visible columns on the table.
   * @param tableAPI Table API
   * @returns A list of columns that can be shown on the insightsCard.
   */
  _exports.getRowCriticality = getRowCriticality;
  function getInsightsRelevantColumns(tableAPI) {
    const table = tableAPI.getContent();
    const metaModel = table.getModel()?.getMetaModel();
    const metaPath = table.data("metaPath");
    const columns = {};
    table.getColumns().forEach(column => {
      const property = column.getPropertyKey();
      const context = metaModel.getContext(metaPath + "/" + property);
      const objectPath = getInvolvedDataModelObjects(context);
      const title = column.getProperty("header");
      columns[property] = {
        property,
        context,
        objectPath,
        title
      };
    });
    const supportedColumns = getSupportedColumns(columns, tableAPI.getTableDefinition(), convertTypes(metaModel));
    return supportedColumns.map(function (supportedColumn) {
      const dataModel = getInvolvedDataModelObjects(supportedColumn.context);
      const propertyTargetObject = dataModel.targetObject;
      const uomBinding = getUomBinding(propertyTargetObject, supportedColumn.property);
      const columnText = uomBinding ?? getTextBinding(dataModel, {}, false, "extension.formatters.sapfe.formatWithBrackets");
      const column = {
        visible: false,
        value: columnText,
        title: supportedColumn.title
      };
      if (isSemanticKey(propertyTargetObject, dataModel)) {
        const displayMode = getDisplayMode(dataModel);
        column.value = getTitleBindingExpression(dataModel, FieldTemplating.getTextBindingExpression, {
          displayMode,
          splitTitleOnTwoLines: true
        }, undefined, CommonUtils.getTargetView(tableAPI).getViewData(), "extension.formatters.sapfe.formatTitle");
        column.additionalText = getAdditionalText(displayMode, dataModel);
        column.identifier = true;
      }
      if (supportedColumn.annotationPath) {
        const criticalityBinding = getCriticalityBinding(supportedColumn.annotationPath, metaPath, metaModel);
        if (criticalityBinding) {
          column.state = criticalityBinding.state;
          column.showStateIcon = criticalityBinding.showStateIcon;
          column.customStateIcon = criticalityBinding.customStateIcon;
        }
      }
      return column;
    });
  }

  /**
   * Get criticality state binding expression and icon information.
   * @param annotationPath Annotation path
   * @param metaPath Meta path
   * @param metaModel Meta model
   * @returns The criticality state binding expression and icon information.
   */
  _exports.getInsightsRelevantColumns = getInsightsRelevantColumns;
  function getCriticalityBinding(annotationPath, metaPath, metaModel) {
    const dataModel = getInvolvedDataModelObjects(metaModel.getContext(annotationPath), metaModel.getContext(metaPath)),
      propertyTargetObject = dataModel.targetObject;
    if (propertyTargetObject.Criticality) {
      const showCriticalityIcon = propertyTargetObject.CriticalityRepresentation !== "UI.CriticalityRepresentationType/WithoutIcon";
      return {
        state: criticalityExpressionForIntegrationCards(propertyTargetObject.Criticality),
        showStateIcon: showCriticalityIcon,
        customStateIcon: showCriticalityIcon ? criticalityIconExpressionForIntegrationCards(propertyTargetObject) : ""
      };
    }
    return undefined;
  }

  /**
   * Constructs the insights parameters from the table that is required to create the insights card.
   * @param controlAPI
   * @param insightsRelevantColumns
   * @param sortConditionsQuery
   * @returns The insights parameters from the table.
   */
  async function createTableCardParams(controlAPI, insightsRelevantColumns, sortConditionsQuery) {
    const table = controlAPI.getContent();
    const params = await createInsightsParams("Table", controlAPI, table.getFilter(), insightsRelevantColumns);
    if (!params) {
      return;
    }
    try {
      const controlState = await StateUtil.retrieveExternalState(table);
      const groupProperty = controlState.groupLevels?.[0]?.name.split("::").pop();
      if (groupProperty) {
        params.requestParameters.groupBy = {
          property: groupProperty
        };
      }
    } catch {
      throw Error("Error retrieving control states");
    }
    params.parameters.isNavigationEnabled = isNavigationEnabled(controlAPI);
    params.entitySetPath = table.data("metaPath");
    params.requestParameters.sortQuery = sortConditionsQuery;
    params.requestParameters.queryUrl = table.getRowBinding().getDownloadUrl() ?? "";
    const content = {
      cardTitle: table.getHeader(),
      insightsRelevantColumns,
      rowCriticality: getRowCriticality(controlAPI) ?? undefined
    };
    return {
      ...params,
      content
    };
  }

  /**
   * Checks if row level navigation is enabled for table card.
   * @param controlAPI Table API
   * @returns True if row level navigation is enabled.
   */
  _exports.createTableCardParams = createTableCardParams;
  function isNavigationEnabled(controlAPI) {
    const table = controlAPI.getContent(),
      viewData = CommonUtils.getTargetView(controlAPI).getViewData(),
      entitySet = table.data("metaPath"),
      navigationSetting = viewData.navigation?.[entitySet] ? viewData.navigation[entitySet] : viewData.navigation?.[entitySet.replace("/", "")];
    // Disable row level navigation if external navigation is configured for LR table using manifest
    return !(navigationSetting?.detail?.outbound || navigationSetting?.display?.target);
  }
  return _exports;
}, false);
//# sourceMappingURL=TableInsightsHelper-dbg.js.map
