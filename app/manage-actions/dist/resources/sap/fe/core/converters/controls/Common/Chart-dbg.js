/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/ui/core/Lib", "../../ManifestSettings", "../../helpers/Aggregation", "../../helpers/ID", "../../helpers/InsightsHelpers"], function (Log, BindingToolkit, DataField, Action, ConfigurableObject, Key, StableIdHelper, DataModelPathHelper, Library, ManifestSettings, Aggregation, ID, InsightsHelpers) {
  "use strict";

  var _exports = {};
  var getInsightsVisibility = InsightsHelpers.getInsightsVisibility;
  var getInsightsEnablement = InsightsHelpers.getInsightsEnablement;
  var getFilterBarID = ID.getFilterBarID;
  var getChartID = ID.getChartID;
  var AggregationHelper = Aggregation.AggregationHelper;
  var VisualizationType = ManifestSettings.VisualizationType;
  var VariantManagementType = ManifestSettings.VariantManagementType;
  var TemplateType = ManifestSettings.TemplateType;
  var ActionType = ManifestSettings.ActionType;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var generate = StableIdHelper.generate;
  var KeyHelper = Key.KeyHelper;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var OverrideType = ConfigurableObject.OverrideType;
  var isMenuAIOperation = Action.isMenuAIOperation;
  var isActionAIOperation = Action.isActionAIOperation;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var isDataFieldForActionAbstract = DataField.isDataFieldForActionAbstract;
  var not = BindingToolkit.not;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * @typedef ChartVisualization
   */

  /**
   * Method to retrieve all chart actions from annotations.
   * @param chartAnnotation
   * @param visualizationPath
   * @param converterContext
   * @returns The chart actions from the annotation
   */
  function getChartActionsFromAnnotations(chartAnnotation, visualizationPath, converterContext) {
    const chartActions = [];
    if (chartAnnotation?.Actions) {
      chartAnnotation.Actions.forEach(dataField => {
        const key = KeyHelper.generateKeyFromDataField(dataField);
        if (isDataFieldForActionAbstract(dataField) && !dataField.Inline && !dataField.Determining) {
          switch (dataField.$Type) {
            case "com.sap.vocabularies.UI.v1.DataFieldForAction":
              if (dataField.ActionTarget && !dataField.ActionTarget.isBound) {
                chartActions.push({
                  type: ActionType.DataFieldForAction,
                  annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
                  key,
                  visible: getCompileExpressionForAction(dataField, converterContext),
                  isAIOperation: isActionAIOperation(dataField) === true || undefined
                });
              }
              break;
            case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
              chartActions.push({
                type: ActionType.DataFieldForIntentBasedNavigation,
                annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
                key,
                visible: getCompileExpressionForAction(dataField, converterContext),
                isNavigable: true
              });
              break;
          }
        }
        if (isAnnotationActionGroup(dataField)) {
          chartActions.push({
            type: ActionType.Menu,
            text: dataField.Label?.toString(),
            visible: getCompileExpressionForAction(dataField, converterContext),
            menu: dataField.Actions.map(action => getDataFieldAnnotationAction(action, converterContext)),
            key: KeyHelper.generateKeyFromDataField(dataField),
            isAIOperation: isMenuAIOperation(dataField.Actions) === true || undefined
          });
        }
      });
    }
    return chartActions;
  }
  /**
   * Checks if the dataField is a DataFieldForActionGroup.
   * @param dataField The dataField to check.
   * @returns The dataField if it matches DataFieldForActionGroup.
   */
  function isAnnotationActionGroup(dataField) {
    return dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForActionGroup";
  }

  /**
   * Creates and returns DataFieldForAction for menu of DataFieldForActionGroup.
   * @param dataField The datafield to get the annotation action from.
   * @param converterContext The converter context.
   * @returns An annotation action.
   */
  function getDataFieldAnnotationAction(dataField, converterContext) {
    return {
      type: ActionType.DataFieldForAction,
      annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
      key: KeyHelper.generateKeyFromDataField(dataField),
      visible: getCompileExpressionForAction(dataField, converterContext)
    };
  }
  function getChartActions(chartAnnotation, visualizationPath, converterContext) {
    const aAnnotationActions = getChartActionsFromAnnotations(chartAnnotation, visualizationPath, converterContext);
    const manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(visualizationPath).actions, converterContext, aAnnotationActions);
    const actionOverwriteConfig = {
      enabled: OverrideType.overwrite,
      enableOnSelect: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      command: OverrideType.overwrite,
      position: OverrideType.overwrite
    };
    const chartActions = insertCustomElements(aAnnotationActions, manifestActions.actions, actionOverwriteConfig);
    return {
      actions: chartActions,
      commandActions: manifestActions.commandActions
    };
  }
  _exports.getChartActions = getChartActions;
  function getP13nMode(visualizationPath, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const chartManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    const variantManagement = manifestWrapper.getVariantManagement();
    const aPersonalization = [];
    // Personalization configured in manifest.
    const personalization = chartManifestSettings?.chartSettings?.personalization;
    const isControlVariant = variantManagement === VariantManagementType.Control ? true : false;
    // if personalization is set to false do not show any option
    if (personalization !== undefined && !personalization || personalization == "false") {
      return false;
    }
    if (typeof personalization === "object") {
      // Specific personalization options enabled in manifest. Use them as is.
      if (personalization.type) {
        aPersonalization.push("Type");
      }
      if (personalization.item) {
        aPersonalization.push("Item");
      }
      if (personalization.sort) {
        aPersonalization.push("Sort");
      }
      if (personalization.filter) {
        aPersonalization.push("Filter");
      }
      return aPersonalization.join(",");
    } else if (isControlVariant || !!personalization) {
      // manifest has personalization configured, check if it's true
      // if manifest doesn't have personalization, check for variant management is set to control
      return "Sort,Type,Item,Filter";
    } else {
      // if manifest doesn't have personalization, show default options without filter
      return "Sort,Type,Item";
    }
  }
  _exports.getP13nMode = getP13nMode;
  function getHeaderInfo(visualizationPath, converterContext) {
    const chartManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    return {
      header: chartManifestSettings.chartSettings?.header,
      headerVisible: chartManifestSettings?.chartSettings?.headerVisible
    };
  }
  _exports.getHeaderInfo = getHeaderInfo;
  function getSelectionMode(visualizationPath, converterContext) {
    const chartManifestSettings = converterContext.getManifestControlConfiguration(visualizationPath);
    return chartManifestSettings.chartSettings?.selectionMode;
  }
  _exports.getSelectionMode = getSelectionMode;
  function getAggregatablePropertiesObject(aggProp) {
    let obj;
    if (aggProp?.Property) {
      obj = {
        Property: {
          $PropertyPath: aggProp?.Property?.value
        }
      };
    } else {
      obj = {
        Property: {
          $PropertyPath: aggProp?.name
        }
      };
    }
    return obj;
  }
  /**
   * Create the ChartVisualization configuration that will be used to display a chart using the Chart building block.
   * @param chartAnnotation The targeted chart annotation
   * @param visualizationPath The path of the visualization annotation
   * @param converterContext The converter context
   * @param doNotCheckApplySupported Flag that indicates whether ApplySupported needs to be checked or not
   * @param selectionPresentationVariantPath
   * @returns The chart visualization based on the annotation
   */
  function createChartVisualization(chartAnnotation, visualizationPath, converterContext, doNotCheckApplySupported, selectionPresentationVariantPath) {
    const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart
    if (!doNotCheckApplySupported && !aggregationHelper.isAnalyticsSupported()) {
      throw new Error("ApplySupported is not added to the annotations");
    }
    const aTransAggregations = aggregationHelper.getTransAggregations();
    const aCustomAggregates = aggregationHelper.getCustomAggregateDefinitions();
    const pageManifestSettings = converterContext.getManifestWrapper();
    const variantManagement = pageManifestSettings.getVariantManagement();
    const p13nMode = getP13nMode(visualizationPath, converterContext);
    if (p13nMode === undefined && variantManagement === "Control") {
      Log.warning("Variant Management cannot be enabled when personalization is disabled");
    }
    const mCustomAggregates = {};
    if (aCustomAggregates) {
      const entityType = aggregationHelper.getEntityType();
      for (const customAggregate of aCustomAggregates) {
        const aContextDefiningProperties = customAggregate?.annotations?.Aggregation?.ContextDefiningProperties;
        const qualifier = customAggregate?.qualifier;
        const relatedCustomAggregateProperty = qualifier && entityType.entityProperties.find(property => property.name === qualifier);
        const label = relatedCustomAggregateProperty && relatedCustomAggregateProperty?.annotations?.Common?.Label?.toString();
        mCustomAggregates[qualifier] = {
          name: qualifier,
          label: label || `Custom Aggregate (${qualifier})`,
          sortable: true,
          sortOrder: "both",
          contextDefiningProperty: aContextDefiningProperties ? aContextDefiningProperties.map(oCtxDefProperty => {
            return oCtxDefProperty.value;
          }) : []
        };
      }
    }
    const mTransAggregations = {};
    const oResourceBundleCore = Library.getResourceBundleFor("sap.fe.core");
    if (aTransAggregations) {
      for (const element of aTransAggregations) {
        mTransAggregations[element.Name] = {
          name: element.Name,
          propertyPath: element.AggregatableProperty.value,
          aggregationMethod: element.AggregationMethod,
          label: element?.annotations?.Common?.Label ? element?.annotations?.Common?.Label?.toString() : `${oResourceBundleCore.getText("AGGREGATABLE_PROPERTY")} (${element.Name})`,
          sortable: true,
          sortOrder: "both",
          custom: false
        };
      }
    }
    const aAggProps = aggregationHelper.getAggregatableProperties();
    const aGrpProps = aggregationHelper.getGroupableProperties();
    const mApplySupported = {};
    mApplySupported.$Type = "Org.OData.Aggregation.V1.ApplySupportedType";
    mApplySupported.AggregatableProperties = [];
    mApplySupported.GroupableProperties = [];
    if (aAggProps) {
      mApplySupported.AggregatableProperties = aAggProps.map(prop => getAggregatablePropertiesObject(prop));
    }
    if (aGrpProps) {
      mApplySupported.GroupableProperties = aGrpProps.map(prop => ({
        ["$PropertyPath"]: prop.value
      }));
    }
    const chartActions = getChartActions(chartAnnotation, visualizationPath, converterContext);
    let [navigationPropertyPath /*, annotationPath*/] = visualizationPath.split("@");
    if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
      // Drop trailing slash
      navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
    }
    const title = chartAnnotation.Title?.toString() || ""; // read title from chart annotation
    const dataModelPath = converterContext.getDataModelObjectPath();
    const isEntitySet = navigationPropertyPath.length === 0;
    const entityName = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
    const sFilterbarId = isEntitySet ? getFilterBarID(converterContext.getContextPath()) : undefined;
    const oVizProperties = {
      plotArea: {
        window: {
          start: "firstDataPoint",
          end: "lastDataPoint"
        }
      },
      legendGroup: {
        layout: {
          position: "bottom"
        }
      }
    };
    let autoBindOnInit;
    if (converterContext.getTemplateType() === TemplateType.ObjectPage) {
      autoBindOnInit = true;
    } else if (converterContext.getTemplateType() === TemplateType.ListReport || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      autoBindOnInit = false;
    }
    const hasMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
    const onSegmentedButtonPressed = hasMultipleVisualizations ? ".handlers.onSegmentedButtonPressed" : "";
    const visible = hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true";
    const allowedTransformations = aggregationHelper.getAllowedTransformations();
    mApplySupported.enableSearch = allowedTransformations ? allowedTransformations.includes("search") : true;
    let qualifier = "";
    if (chartAnnotation.fullyQualifiedName.split("#").length > 1) {
      qualifier = chartAnnotation.fullyQualifiedName.split("#")[1];
    }
    const isInsightsVisible = getInsightsVisibility("Analytical", converterContext, visualizationPath);
    const isParameterizedEntitySet = converterContext.getParameterEntityType() ? true : false;
    const isInsightsEnabled = and(getInsightsEnablement(), isInsightsVisible);
    const {
      header,
      headerVisible
    } = getHeaderInfo(visualizationPath, converterContext);
    const selectionMode = getSelectionMode(visualizationPath, converterContext);
    const chartDimensionKeyAndRole = [];
    chartAnnotation?.DimensionAttributes?.forEach(dimensionAttribute => {
      const obj = {};
      obj[dimensionAttribute?.Dimension?.value] = dimensionAttribute?.Role;
      chartDimensionKeyAndRole.push(obj);
    });
    const chartMeasureKeyAndRole = [];
    chartAnnotation?.MeasureAttributes?.forEach(measureAttribute => {
      const obj = {};
      obj[measureAttribute?.Measure?.value] = measureAttribute?.Role;
      chartMeasureKeyAndRole.push({});
    });
    return {
      type: VisualizationType.Chart,
      id: qualifier ? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart) : getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
      collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
      apiId: generate([qualifier ? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart) : getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart), "Chart"]),
      entityName: entityName,
      personalization: getP13nMode(visualizationPath, converterContext),
      navigationPath: navigationPropertyPath,
      annotationPath: converterContext.getAbsoluteAnnotationPath(visualizationPath),
      filterId: sFilterbarId,
      vizProperties: JSON.stringify(oVizProperties),
      actions: chartActions.actions,
      commandActions: chartActions.commandActions,
      title: title,
      autoBindOnInit: autoBindOnInit,
      onSegmentedButtonPressed: onSegmentedButtonPressed,
      visible: visible,
      customAgg: mCustomAggregates,
      transAgg: mTransAggregations,
      applySupported: mApplySupported,
      selectionPresentationVariantPath,
      variantManagement: findVariantManagement(p13nMode, variantManagement),
      isInsightsEnabled: isInsightsEnabled,
      isInsightsVisible: isInsightsVisible,
      isParameterizedEntitySet: isParameterizedEntitySet,
      header: header,
      headerVisible: headerVisible,
      selectionMode: selectionMode,
      chartDimensionKeyAndRole: chartDimensionKeyAndRole,
      chartMeasureKeyAndRole: chartMeasureKeyAndRole
    };
  }
  /**
   * Method to determine the variant management.
   * @param p13nMode
   * @param variantManagement
   * @returns The variant management for the chart
   */
  _exports.createChartVisualization = createChartVisualization;
  function findVariantManagement(p13nMode, variantManagement) {
    return variantManagement === "Control" && !p13nMode ? VariantManagementType.None : variantManagement;
  }

  /**
   * Create the ChartVisualization configuration that will be used to during templating.
   * @param converterContext The converter context
   * @param visualizationPath The path of the visualization annotation
   * @param visualization The visualization annotation
   * @returns The chart visualization based on the annotation used for templating
   */
  function createChartVisualizationForTemplating(converterContext, visualizationPath, visualization) {
    const qualifier = visualization.fullyQualifiedName.split("#").length > 1 ? visualization.fullyQualifiedName.split("#")[1] : "";
    const [navigationPropertyPath] = visualizationPath.split("@");
    const dataModelPath = converterContext.getDataModelObjectPath();
    const isEntitySet = navigationPropertyPath.length === 0;
    const entityName = dataModelPath.targetEntitySet?.name ?? dataModelPath.startingEntitySet.name;
    const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true);
    const allowedTransformations = aggregationHelper.getAllowedTransformations();
    const isParameterizedEntitySet = !!converterContext.getParameterEntityType();
    return {
      annotationPath: converterContext.getAbsoluteAnnotationPath(visualizationPath),
      isParameterizedEntitySet,
      collection: getTargetObjectPath(converterContext.getDataModelObjectPath()),
      type: VisualizationType.Chart,
      entityName,
      id: qualifier ? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart) : getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart),
      apiId: generate([qualifier ? getChartID(isEntitySet ? entityName : navigationPropertyPath, qualifier, VisualizationType.Chart) : getChartID(isEntitySet ? entityName : navigationPropertyPath, VisualizationType.Chart), "Chart"]),
      applySupported: {
        $Type: "Org.OData.Aggregation.V1.ApplySupportedType",
        enableSearch: allowedTransformations?.includes("search") ?? true
      }
    };
  }

  /**
   * Method to get compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation.
   * @param dataField
   * @param converterContext
   * @returns Compile expression for DataFieldForAction and DataFieldForIntentBasedNavigation
   */
  _exports.createChartVisualizationForTemplating = createChartVisualizationForTemplating;
  function getCompileExpressionForAction(dataField, converterContext) {
    return compileExpression(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden, [], undefined, converterContext.getRelativeModelPathFunction()), true)));
  }
  function createBlankChartVisualization(converterContext) {
    const hasMultipleVisualizations = converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
    const dataModelPath = converterContext.getDataModelObjectPath();
    const entityName = dataModelPath.targetEntitySet ? dataModelPath.targetEntitySet.name : dataModelPath.startingEntitySet.name;
    const visualization = {
      type: VisualizationType.Chart,
      id: getChartID(entityName, VisualizationType.Chart),
      apiId: generate([getChartID(entityName, VisualizationType.Chart), "Chart"]),
      entityName: entityName,
      title: "",
      collection: "",
      personalization: undefined,
      navigationPath: "",
      annotationPath: "",
      vizProperties: JSON.stringify({
        legendGroup: {
          layout: {
            position: "bottom"
          }
        }
      }),
      actions: [],
      commandActions: {},
      autoBindOnInit: false,
      onSegmentedButtonPressed: "",
      visible: hasMultipleVisualizations ? "{= ${pageInternal>alpContentView} !== 'Table'}" : "true",
      customAgg: {},
      transAgg: {},
      applySupported: {
        $Type: "Org.OData.Aggregation.V1.ApplySupportedType",
        AggregatableProperties: [],
        GroupableProperties: [],
        enableSearch: false
      },
      multiViews: false,
      variantManagement: VariantManagementType.None
    };
    return visualization;
  }
  _exports.createBlankChartVisualization = createBlankChartVisualization;
  return _exports;
}, false);
//# sourceMappingURL=Chart-dbg.js.map
