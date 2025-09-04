/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/base/util/merge", "sap/base/util/uid", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/controls/CommandExecution", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/CommonHelper", "sap/m/Button", "sap/m/FlexItemData", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageSize", "sap/m/IllustratedMessageType", "sap/m/Menu", "sap/m/MenuButton", "sap/m/MenuItem", "sap/m/OverflowToolbarLayoutData", "sap/m/SegmentedButton", "sap/m/SegmentedButtonItem", "sap/ui/Device", "sap/ui/core/CustomData", "sap/ui/core/Element", "sap/ui/core/Popup", "sap/ui/fl/variants/VariantManagement", "sap/ui/mdc/Chart", "sap/ui/mdc/actiontoolbar/ActionToolbarAction", "sap/ui/mdc/chart/Item", "sap/ui/mdc/p13n/PersistenceProvider", "sap/ui/model/json/JSONModel", "../internal/helpers/ActionHelper", "../internal/helpers/DefaultActionHandler", "./ChartHelper", "sap/fe/base/jsx-runtime/jsx"], function (Log, deepClone, merge, uid, BindingToolkit, CommonUtils, BuildingBlockTemplateProcessor, CommandExecution, ConverterContext, ManifestSettings, ManifestWrapper, MetaModelConverter, DataField, Action, DataVisualization, Aggregation, FPMHelper, ModelHelper, StableIdHelper, TypeGuards, DataModelPathHelper, CommonHelper, Button, FlexItemData, IllustratedMessage, IllustratedMessageSize, IllustratedMessageType, Menu, MenuButton, MenuItem, OverflowToolbarLayoutData, SegmentedButton, SegmentedButtonItem, Device, CustomData, Element, Popup, VariantManagement, MdcChart, ActionToolbarAction, MdcChartItem, PersistenceProvider, JSONModel, ActionHelper, DefaultActionHandler, ChartHelper, _jsx) {
  "use strict";

  var _exports = {};
  var Dock = Popup.Dock;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var generate = StableIdHelper.generate;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getVisualizationsFromAnnotation = DataVisualization.getVisualizationsFromAnnotation;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var aiIcon = Action.aiIcon;
  var isDataModelObjectPathForActionWithDialog = DataField.isDataModelObjectPathForActionWithDialog;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var TemplateType = ManifestSettings.TemplateType;
  var escapeXMLAttributeValue = BuildingBlockTemplateProcessor.escapeXMLAttributeValue;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var notEqual = BindingToolkit.notEqual;
  const measureRole = {
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1": "axis1",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2": "axis2",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3": "axis3",
    "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis4": "axis4"
  };
  var personalizationValues = /*#__PURE__*/function (personalizationValues) {
    personalizationValues["Sort"] = "Sort";
    personalizationValues["Type"] = "Type";
    personalizationValues["Item"] = "Item";
    personalizationValues["Filter"] = "Filter";
    return personalizationValues;
  }(personalizationValues || {});
  function createChartDefinition(chartBlock, converterContext, contextObjectPath, controlPath) {
    let visualizationPath = getContextRelativeTargetObjectPath(contextObjectPath);
    let visualizations = [];
    if (chartBlock._metaPathContext?.getObject()?.$Type === "com.sap.vocabularies.UI.v1.PresentationVariantType") {
      visualizations = chartBlock._metaPathContext.getObject().Visualizations;
    } else if (chartBlock._metaPathContext?.getObject()?.$Type === "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") {
      visualizations = chartBlock._metaPathContext.getObject().PresentationVariant?.Visualizations;
    }
    if (visualizations?.length && !checkChartExists(visualizations, controlPath)) {
      visualizationPath = "";
    }

    // fallback to default Chart if visualizationPath is missing or visualizationPath is not found in control (in case of PresentationVariant)
    if (!visualizationPath) {
      visualizationPath = `@${"com.sap.vocabularies.UI.v1.Chart"}`;
    }
    const visualizationDefinition = getDataVisualizationConfiguration(visualizationPath, converterContext, {
      isCondensedTableLayoutCompliant: chartBlock.useCondensedLayout,
      isMacroOrMultipleView: true,
      shouldCreateTemplateChartVisualization: false
    });
    return visualizationDefinition.visualizations[0];
  }
  function checkChartExists(visualizations, visualizationPath) {
    return visualizations.some(visualization => visualizationPath?.includes(visualization.$AnnotationPath));
  }
  function getContentId(macroId) {
    return `${macroId}-content`;
  }

  /**
   * Function used to get details WRT action(s) shown in the chart's toolbar.
   * @param chartBlock Chart block properties
   * @param visualizationPath Visualization path
   * @returns Object with all the required action(s) details
   */
  function getExtraParams(chartBlock, visualizationPath) {
    const extraParams = {};
    const customActions = {};
    if (chartBlock.actions) {
      Object.values(chartBlock.actions)?.forEach(action => {
        if (action.isA("sap.fe.macros.chart.ActionGroup")) {
          customActions[action.key] = getActionProperties(action.key, action.text, null, false, true, {
            placement: action.placement,
            anchor: action.anchor
          }, action.actions.map((_, index) => action.key + "_Menu_" + index));
          action.actions?.forEach((act, index) => {
            const actionKey = action.key.concat("_Menu_", index);
            customActions[actionKey] = getActionProperties(actionKey, act.text, act.press, !!act.requiresSelection, act.enabled === null || act.enabled === undefined ? true : act.enabled);
          });
        } else if (action.isA("sap.fe.macros.chart.Action")) {
          customActions[action.key] = getActionProperties(action.key, action.text, action.press, !!action.requiresSelection, action.enabled === null || action.enabled == undefined ? true : action.enabled, {
            placement: action.placement,
            anchor: action.anchor
          });
        }
      });
    }
    if (visualizationPath && chartBlock.actions) {
      extraParams[visualizationPath] = {
        actions: customActions
      };
    }
    return extraParams;
  }
  function getActionProperties(key, text, press, requiresSelection, enabled, position, menu) {
    const actionProperties = {
      key,
      text,
      __noWrap: true,
      press,
      requiresSelection,
      enabled
    };
    if (position) {
      actionProperties.position = position;
    }
    if (menu) {
      actionProperties.menu = menu;
    }
    return actionProperties;
  }
  function createBindingContext(data) {
    const contextPath = `/${uid()}`;
    const actionsModel = new JSONModel();
    actionsModel.setProperty(contextPath, data);
    return actionsModel.createBindingContext(contextPath);
  }
  function getChartMeasures(chartBlock, aggregationHelper) {
    const chartAnnotationPath = chartBlock.chartDefinition.annotationPath.split("/");
    // this is required because getAbsolutePath in converterContext returns "/SalesOrderManage/_Item/_Item/@com.sap.vocabularies.v1.Chart" as annotationPath
    const annotationPath = chartAnnotationPath.filter(function (item, pos) {
      return chartAnnotationPath.indexOf(item) == pos;
    }).toString().replaceAll(",", "/");
    const oChart = getInvolvedDataModelObjects(chartBlock._metaModel.createBindingContext(annotationPath), chartBlock._context).targetObject;
    const aggregatedProperty = aggregationHelper.getAggregatedProperty();
    let measures = [];
    const annoPath = chartBlock._metaPathContext.getPath();
    const aggregatedProperties = aggregationHelper.getAggregatedProperties();
    const chartMeasures = oChart?.Measures ? oChart.Measures : [];
    const chartDynamicMeasures = oChart?.DynamicMeasures ? oChart.DynamicMeasures : [];
    //check if there are measures pointing to aggregated properties
    const transAggInMeasures = aggregatedProperties[0] ? aggregatedProperties[0].filter(function (properties) {
      return chartMeasures.some(function (propertyMeasureType) {
        return properties.Name === propertyMeasureType.value;
      });
    }) : undefined;
    const entitySetPath = annoPath.replace(/@com.sap.vocabularies.UI.v1.(Chart|PresentationVariant|SelectionPresentationVariant).*/, "");
    const transAggregations = chartBlock.chartDefinition.transAgg;
    const customAggregations = chartBlock.chartDefinition.customAgg;
    // intimate the user if there is AggregateProperty configured with no DYnamicMeasures, bu there are measures with AggregatedProperties
    if (aggregatedProperty.length > 0 && !chartDynamicMeasures && transAggInMeasures && transAggInMeasures.length > 0) {
      Log.warning("The transformational aggregate measures are configured as Chart.Measures but should be configured as Chart.DynamicMeasures instead. Please check the SAP Help documentation and correct the configuration accordingly.");
    }
    const isCustomAggregateIsMeasure = chartMeasures.some(oChartMeasure => {
      const oCustomAggMeasure = getCustomAggMeasure(customAggregations, oChartMeasure);
      return !!oCustomAggMeasure;
    });
    if (aggregatedProperty.length > 0 && !chartDynamicMeasures?.length && !isCustomAggregateIsMeasure) {
      throw new Error("Please configure DynamicMeasures for the chart");
    }
    if (aggregatedProperty.length > 0 && oChart) {
      for (const dynamicMeasure of chartDynamicMeasures) {
        measures = getDynamicMeasures(measures, dynamicMeasure, entitySetPath, oChart, chartBlock);
      }
    }
    for (const chartMeasure of chartMeasures) {
      const key = chartMeasure.value;
      const customAggMeasure = getCustomAggMeasure(customAggregations, chartMeasure);
      const measureType = {};
      if (customAggMeasure) {
        measures = setCustomAggMeasure(measures, measureType, customAggMeasure, key);
        //if there is neither aggregatedProperty nor measures pointing to customAggregates, but we have normal measures. Now check if these measures are part of AggregatedProperties Obj
      } else if (aggregatedProperty.length === 0 && transAggregations[key]) {
        measures = setTransAggMeasure(measures, measureType, transAggregations, key);
      }
      setChartMeasureAttributes(chartBlock._chart.MeasureAttributes, entitySetPath, measureType, chartBlock);
    }
    const measuresModel = new JSONModel(measures);
    measuresModel.$$valueAsPromise = true;
    return measuresModel.createBindingContext("/");
  }
  function setCustomAggMeasure(measures, measure, customAggMeasure, key) {
    if (key.includes("/")) {
      Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
    }
    measure.key = customAggMeasure.value;
    measure.role = "axis1";
    measure.label = customAggMeasure.label;
    measure.propertyPath = customAggMeasure.value;
    measures.push(measure);
    return measures;
  }
  function setTransAggMeasure(measures, measure, transAggregations, key) {
    const transAggMeasure = transAggregations[key];
    measure.key = transAggMeasure.name;
    measure.role = "axis1";
    measure.propertyPath = key;
    measure.aggregationMethod = transAggMeasure.aggregationMethod;
    measure.label = transAggMeasure.label || measure.label;
    measures.push(measure);
    return measures;
  }
  function getDynamicMeasures(measures, chartDynamicMeasure, entitySetPath, chart, chartBlock) {
    const key = chartDynamicMeasure.value || "";
    const aggregatedProperty = getInvolvedDataModelObjects(chartBlock._metaModel.createBindingContext(entitySetPath + key), chartBlock._context).targetObject;
    if (key.includes("/")) {
      Log.error(`$expand is not yet supported. Measure: ${key} from an association cannot be used`);
      // check if the annotation path is wrong
    } else if (!aggregatedProperty) {
      throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
      // check if the path starts with @
    } else if (chartDynamicMeasure.value?.startsWith(`@${"com.sap.vocabularies.Analytics.v1.AggregatedProperty"}`) === null) {
      throw new Error(`Please provide the right AnnotationPath to the Dynamic Measure ${chartDynamicMeasure.value}`);
    } else {
      // check if AggregatedProperty is defined in given DynamicMeasure
      const dynamicMeasure = {
        key: aggregatedProperty.Name.toString(),
        role: "axis1"
      };
      dynamicMeasure.propertyPath = aggregatedProperty.AggregatableProperty.value;
      dynamicMeasure.aggregationMethod = aggregatedProperty.AggregationMethod.toString();
      dynamicMeasure.label = resolveBindingString(aggregatedProperty.annotations?.Common?.Label?.toString() ?? aggregatedProperty.AggregatableProperty.$target?.annotations?.Common?.Label?.toString() ?? "");
      setChartMeasureAttributes(chart.MeasureAttributes, entitySetPath, dynamicMeasure, chartBlock);
      measures.push(dynamicMeasure);
    }
    return measures;
  }
  function getCustomAggMeasure(customAggregations, measure) {
    if (measure.value && customAggregations[measure.value]) {
      measure.label = customAggregations[measure.value]?.label;
      return measure;
    }
    return null;
  }
  function setChartMeasureAttributes(measureAttributes, entitySetPath, measure, chartBlock) {
    if (measureAttributes?.length) {
      for (const measureAttribute of measureAttributes) {
        _setChartMeasureAttribute(measureAttribute, entitySetPath, measure, chartBlock);
      }
    }
  }
  function _setChartMeasureAttribute(measureAttribute, entitySetPath, measure, chartBlock) {
    const path = measureAttribute.DynamicMeasure ? measureAttribute?.DynamicMeasure?.value : measureAttribute?.Measure?.value;
    const measureAttributeDataPoint = measureAttribute.DataPoint ? measureAttribute?.DataPoint?.value : null;
    const role = measureAttribute.Role;
    const dataPoint = measureAttributeDataPoint ? getInvolvedDataModelObjects(chartBlock._metaModel.createBindingContext(entitySetPath + measureAttributeDataPoint), chartBlock._context).targetObject : undefined;
    if (measure.key === path) {
      setMeasureRole(measure, role);
      //still to add data point, but UI5 Chart API is missing
      setMeasureDataPoint(measure, dataPoint);
    }
  }

  /**
   * Format the data point as a JSON object.
   * @param oDataPointAnno
   * @returns The formatted json object
   */
  function createDataPointProperty(oDataPointAnno) {
    const oDataPoint = {};
    if (oDataPointAnno.TargetValue) {
      oDataPoint.targetValue = oDataPointAnno.TargetValue.$Path;
    }
    if (oDataPointAnno.ForecastValue) {
      oDataPoint.foreCastValue = oDataPointAnno.ForecastValue.$Path;
    }
    let oCriticality = null;
    if (oDataPointAnno.Criticality) {
      if (isPathAnnotationExpression(oDataPointAnno.Criticality) && oDataPointAnno.Criticality.path) {
        //will be an aggregated property or custom aggregate
        oCriticality = {
          Calculated: oDataPointAnno.Criticality.path
        };
      } else {
        oCriticality = {
          Static: oDataPointAnno.Criticality.$EnumMember.replace("com.sap.vocabularies.UI.v1.CriticalityType/", "")
        };
      }
    } else if (oDataPointAnno.CriticalityCalculation) {
      const oThresholds = {};
      const bConstant = buildThresholds(oThresholds, oDataPointAnno.CriticalityCalculation);
      if (bConstant) {
        oCriticality = {
          ConstantThresholds: oThresholds
        };
      } else {
        oCriticality = {
          DynamicThresholds: oThresholds
        };
      }
    }
    if (oCriticality) {
      oDataPoint.criticality = oCriticality;
    }
    return oDataPoint;
  }

  /**
   * Checks whether the thresholds are dynamic or constant.
   * @param thresholds The threshold skeleton
   * @param criticalityCalculation The UI.DataPoint.CriticalityCalculation annotation
   * @returns `true` if the threshold should be supplied as ConstantThresholds, <code>false</code> if the threshold should
   * be supplied as DynamicThresholds
   * @private
   */
  function buildThresholds(thresholds, criticalityCalculation) {
    const keys = ["AcceptanceRangeLowValue", "AcceptanceRangeHighValue", "ToleranceRangeLowValue", "ToleranceRangeHighValue", "DeviationRangeLowValue", "DeviationRangeHighValue"];
    thresholds.ImprovementDirection = criticalityCalculation.ImprovementDirection?.$EnumMember.replace("com.sap.vocabularies.UI.v1.ImprovementDirectionType/", "");
    const dynamicThresholds = {
      oneSupplied: false,
      usedMeasures: []
      // combination to check whether at least one is supplied
    };
    const constantThresholds = {
      oneSupplied: false
      // combination to check whether at least one is supplied
    };
    initialiseThresholds(keys, dynamicThresholds, constantThresholds, criticalityCalculation);
    processThresholds(keys, thresholds, dynamicThresholds, constantThresholds, criticalityCalculation);
    return !dynamicThresholds.oneSupplied;
  }
  function initialiseThresholds(keys, dynamicThresholds, constantThresholds, criticalityCalculation) {
    for (const key of keys) {
      dynamicThresholds[key] = criticalityCalculation[key] ? criticalityCalculation[key].$Path : undefined;
      dynamicThresholds.oneSupplied = dynamicThresholds.oneSupplied || dynamicThresholds[key];
      if (!dynamicThresholds.oneSupplied) {
        // only consider in case no dynamic threshold is supplied
        constantThresholds[key] = criticalityCalculation[key];
        constantThresholds.oneSupplied = constantThresholds.oneSupplied || constantThresholds[key];
      } else if (dynamicThresholds[key]) {
        dynamicThresholds.usedMeasures.push(dynamicThresholds[key]);
      }
    }
  }
  function processThresholds(keys, thresholds, dynamicThresholds, constantThresholds, criticalityCalculation) {
    // dynamic definition shall overrule constant definition
    if (dynamicThresholds.oneSupplied) {
      for (const key of keys) {
        if (dynamicThresholds[key]) {
          thresholds[key] = dynamicThresholds[key];
        }
      }
      thresholds.usedMeasures = dynamicThresholds.usedMeasures;
    } else {
      thresholds.AggregationLevels = [];
      processAggregationLevelForThresholds(keys, thresholds, constantThresholds, criticalityCalculation);
    }
  }
  function processAggregationLevelForThresholds(keys, thresholds, constantThresholds, criticalityCalculation) {
    let oAggregationLevel = {};
    // check if at least one static value is supplied
    if (constantThresholds.oneSupplied) {
      // add one entry in the aggregation level
      oAggregationLevel = {
        VisibleDimensions: null
      };
      for (const sKey of keys) {
        if (constantThresholds[sKey]) {
          oAggregationLevel[sKey] = constantThresholds[sKey];
        }
      }
      thresholds.AggregationLevels?.push(oAggregationLevel);
    }
    processAggregationLevelsForConstantThresholds(keys, thresholds, criticalityCalculation, oAggregationLevel);
  }
  function processAggregationLevelsForConstantThresholds(keys, thresholds, criticalityCalculation, aggregationLevel) {
    if (criticalityCalculation.ConstantThresholds && criticalityCalculation.ConstantThresholds.length > 0) {
      for (const aggregationLevelInfo of criticalityCalculation.ConstantThresholds) {
        const visibleDimensions = aggregationLevelInfo.AggregationLevel ? [] : null;
        if (visibleDimensions && aggregationLevelInfo.AggregationLevel && aggregationLevelInfo.AggregationLevel.length > 0) {
          for (const propertyPath of aggregationLevelInfo.AggregationLevel) {
            visibleDimensions.push(propertyPath.$PropertyPath);
          }
        }
        aggregationLevel = {
          VisibleDimensions: visibleDimensions
        };
        for (const key of keys) {
          const value = aggregationLevelInfo[key];
          if (value) {
            aggregationLevel[key] = value;
          }
        }
        thresholds.AggregationLevels?.push(aggregationLevel);
      }
    }
  }
  function setMeasureDataPoint(measure, dataPoint) {
    if (dataPoint && dataPoint.Value.$Path == measure.key) {
      measure.dataPoint = ChartHelper.formatJSONToString(createDataPointProperty(dataPoint)) || "";
    }
  }
  function setMeasureRole(measure, role) {
    if (role != null) {
      const index = role.$EnumMember;
      measure.role = measureRole[index];
    }
  }
  function getDependents(chartBlock, chartContext) {
    if (chartBlock._commandActions.length > 0) {
      return chartBlock._commandActions.map(commandAction => {
        return getActionCommand(commandAction, chartContext, chartBlock);
      });
    }
    return "";
  }

  /**
   *
   * @param personalization Specifies the chart personalization
   */

  function checkPersonalizationInChartProperties(personalization, chartBlock) {
    if (personalization) {
      if (personalization === "false" || personalization === false) {
        chartBlock._personalization = undefined;
      } else if (personalization === "true" || personalization === true) {
        chartBlock._personalization = Object.values(personalizationValues).join(",");
      } else if (verifyValidPersonalization(personalization) === true) {
        chartBlock._personalization = personalization;
      } else {
        chartBlock._personalization = undefined;
      }
    }
  }

  /**
   *
   * @param personalization
   * @returns `true` or `false` if the personalization is valid or not valid
   */
  function verifyValidPersonalization(personalization) {
    let valid = true;
    const splitArray = personalization.split(",");
    const acceptedValues = Object.values(personalizationValues);
    splitArray.forEach(arrayElement => {
      if (!acceptedValues.includes(arrayElement)) {
        valid = false;
      }
    });
    return valid;
  }
  function getVariantManagement(chartBlock) {
    const variantManagement = chartBlock.variantManagement ? chartBlock.variantManagement : chartBlock.chartDefinition.variantManagement;
    return chartBlock.personalization === undefined ? "None" : variantManagement;
  }
  function createVariantManagement(chartBlock) {
    const personalization = chartBlock.personalization;
    if (personalization) {
      const variantManagement = getVariantManagement(chartBlock);
      if (variantManagement === "Control") {
        return _jsx(VariantManagement, {
          id: generate([chartBlock._blockId, "VM"]),
          for: [chartBlock._blockId],
          showSetAsDefault: true,
          headerLevel: chartBlock.headerLevel,
          select: event => {
            chartBlock.fireVariantSelected?.(event);
          },
          save: event => {
            chartBlock.fireVariantSaved?.(event);
          }
        });
      } else if (variantManagement === "None" || variantManagement === "Page") {
        return "";
      }
    } else if (!personalization) {
      Log.warning("Variant Management cannot be enabled when personalization is disabled");
    }
    return "";
  }
  function getPersistenceProvider(chartBlock) {
    if (getVariantManagement(chartBlock) === "None") {
      return _jsx(PersistenceProvider, {
        id: generate([chartBlock._blockId, "PersistenceProvider"]),
        for: chartBlock._blockId
      });
    }
  }
  function pushActionCommand(actionContext, dataField, chartOperationAvailableMap, action, chartBlock) {
    if (dataField) {
      const commandAction = {
        actionContext: actionContext,
        onExecuteAction: ChartHelper.getPressEventForDataFieldForActionButton(chartBlock._blockId, dataField, chartOperationAvailableMap || ""),
        onExecuteIBN: CommonHelper.getPressHandlerForDataFieldForIBN(dataField, `\${internal>selectedContexts}`, false),
        onExecuteManifest: CommonHelper.buildActionWrapper(action, chartBlock),
        chartOperationAvailableMap
      };
      chartBlock._commandActions.push(commandAction);
    }
  }
  function getActionCommand(commandAction, chartContext, chartBlock) {
    const action = commandAction.actionContext.getObject();
    const dataFieldContext = action.annotationPath && chartBlock._metaModel.createBindingContext(action.annotationPath);
    const dataField = dataFieldContext && dataFieldContext.getObject();
    const dataFieldAction = chartBlock._metaModel.createBindingContext(action.annotationPath + "/Action");
    const actionContext = CommonHelper.getActionContext(dataFieldAction);
    const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
    const isBound = chartBlock._metaModel.createBindingContext(isBoundPath).getObject();
    const chartOperationAvailableMap = escapeXMLAttributeValue(ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
      context: chartContext
    }));
    const isActionEnabled = action.enabled ? action.enabled : ChartHelper.isDataFieldForActionButtonEnabled(isBound && isBound.$IsBound, dataField.Action, chartBlock._context, chartOperationAvailableMap || "", action.enableOnSelect || "");
    let isIBNEnabled;
    if (action.enabled) {
      isIBNEnabled = action.enabled;
    } else if (dataField.RequiresContext) {
      isIBNEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
    }
    let commandEnabled;
    switch (action.type) {
      case "ForAction":
        commandEnabled = isActionEnabled ?? action.enabled;
        break;
      case "ForNavigation":
        commandEnabled = isIBNEnabled ?? action.enabled;
        break;
      default:
        commandEnabled = action.enabled;
        break;
    }
    const actionCommand = _jsx(CommandExecution, {
      execute: event => commandExecute(event, action, chartBlock._blockId, commandAction.chartOperationAvailableMap, dataField),
      enabled: commandEnabled,
      visible: getVisible(dataFieldContext, chartBlock) ?? action.visible,
      command: action.command
    });
    if (action.type == "ForAction" && (!isBound || isBound.IsBound !== true || actionContext[`@${"Org.OData.Core.V1.OperationAvailable"}`] !== false)) {
      return actionCommand;
    } else if (action.type == "ForAction") {
      return "";
    } else {
      return actionCommand;
    }
  }
  function commandExecute(event, action, id, chartOperationAvailableMap, dataField) {
    const view = CommonUtils.getTargetView(event.getSource());
    const controller = view?.getController();
    switch (action.type) {
      case "ForAction":
        const sInvocationGrouping = action.InvocationGrouping && action.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated";
        const params = {
          contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
          invocationGrouping: sInvocationGrouping,
          controlId: id,
          operationAvailableMap: chartOperationAvailableMap,
          model: view.getModel(),
          label: dataField.Label
        };
        controller.editFlow.invokeAction(dataField.Action, params);
        break;
      case "ForNavigation":
        const navigationParameters = {
          navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
        };
        if (dataField.Mapping) {
          navigationParameters.semanticObjectMapping = JSON.stringify(dataField.Mapping);
        }
        controller._intentBasedNavigation.navigate(dataField.SemanticObject, dataField.Action, navigationParameters);
        break;
      default:
        FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {
          contexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
        });
        break;
    }
  }
  function getItems(chartBlock) {
    if (chartBlock._chart) {
      const dimensions = [];
      const measures = [];
      if (chartBlock._chart.Dimensions) {
        ChartHelper.formatDimensions(chartBlock._chartContext).getObject().forEach(dimension => {
          dimension.id = generate([chartBlock.id, "dimension", dimension.key]);
          dimensions.push(getItem({
            id: dimension.id,
            key: dimension.key,
            label: dimension.label,
            role: dimension.role
          }, "_fe_groupable_", "groupable"));
        });
      }
      if (chartBlock.measures) {
        ChartHelper.formatMeasures(chartBlock.measures).forEach(measure => {
          measure.id = generate([chartBlock.id, "measure", measure.key]);
          measures.push(getItem({
            id: measure.id,
            key: measure.key,
            label: measure.label,
            role: measure.role
          }, "_fe_aggregatable_", "aggregatable"));
        });
      }
      if (dimensions.length && measures.length) {
        return dimensions.concat(measures);
      }
    }
    return "";
  }
  function getItem(item, prefix, type) {
    return _jsx(MdcChartItem, {
      id: item.id,
      propertyKey: prefix + item.key,
      type: type,
      label: resolveBindingString(item.label, "string"),
      role: item.role
    });
  }
  function getToolbarActions(chartBlock) {
    const actions = getActions(chartBlock);
    if (chartBlock.chartDefinition?.onSegmentedButtonPressed) {
      actions.push(getSegmentedButton(chartBlock));
    }
    if (chartBlock.chartDefinition.isInsightsEnabled) {
      actions.push(getStandardActions(chartBlock.chartDefinition.isInsightsEnabled, chartBlock.chartDefinition.isInsightsVisible, chartBlock._blockId, chartBlock));
    }
    if (actions.length > 0) {
      return actions;
    }
    return [];
  }
  function getStandardActions(isInsightsEnabled, isInsightsVisible, id, chartBlock) {
    return _jsx(ActionToolbarAction, {
      visible: isInsightsVisible,
      children: _jsx(Button, {
        id: generate([id, "StandardAction::Insights"]),
        text: "{sap.fe.i18n>M_COMMON_INSIGHTS_CARD}",
        press: () => {
          chartBlock.onAddCardToInsightsPressed();
        },
        enabled: isInsightsEnabled,
        children: {
          layoutData: _jsx(OverflowToolbarLayoutData, {
            priority: "AlwaysOverflow"
          })
        }
      })
    });
  }
  function getActions(chartBlock) {
    const actions = removeMenuItems(chartBlock.chartActions ?? []);
    return actions.map(action => {
      if (action.annotationPath || action.type === "Menu" && !action.id?.startsWith("CustomAction")) {
        // Load annotation based actions
        return getAction(action, chartBlock._chartContext, false, chartBlock);
      } else if (action.hasOwnProperty("noWrap")) {
        // Load XML or manifest based actions / action groups
        return getCustomActions(action, chartBlock._chartContext, chartBlock);
      }
    });
  }
  function removeMenuItems(actions) {
    // If action is already part of menu in action group, then it will
    // be removed from the main actions list
    for (const action of actions) {
      if (action.menu) {
        action.menu.forEach(item => {
          const idx = actions.map(act => act.key).indexOf(item.key);
          if (idx !== -1) {
            actions.splice(idx, 1);
          }
        });
      }
    }
    return actions;
  }
  function getCustomActions(action, chartContext, chartBlock) {
    let actionEnabled = action.enabled;
    if ((action.requiresSelection ?? false) && action.enabled === "true") {
      actionEnabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
    }
    if (action.type === "Default") {
      // Load XML or manifest based toolbar actions
      return getActionToolbarAction(action, {
        id: generate([chartBlock._blockId, action.id]),
        unittestid: "DataFieldForActionButtonAction",
        label: action.text ? action.text : "",
        ariaHasPopup: undefined,
        press: action.press ? action.press : "",
        enabled: actionEnabled,
        visible: action.visible ? action.visible : false
      }, false, chartBlock);
    } else if (action.type === "Menu") {
      // Load action groups (Menu)
      return getActionToolbarMenuAction({
        id: generate([chartBlock._blockId, action.id]),
        text: action.text,
        visible: action.visible,
        enabled: actionEnabled,
        useDefaultActionOnly: DefaultActionHandler.getUseDefaultActionOnly(action),
        buttonMode: DefaultActionHandler.getButtonMode(action),
        defaultAction: undefined,
        actions: action
      }, chartContext, chartBlock);
    }
  }
  function getMenuItemFromMenu(menuItemAction, chartContext, chartBlock) {
    let pressHandler;
    if (menuItemAction.annotationPath) {
      //Annotation based action is passed as menu item for menu button
      return getAction(menuItemAction, chartContext, true, chartBlock);
    }
    if (menuItemAction.command) {
      pressHandler = {
        "jsx:command": `cmd:${menuItemAction.command}|press`
      };
    } else if (menuItemAction.noWrap ?? false) {
      pressHandler = {
        press: event => {
          const functionName = menuItemAction.handlerMethod?.split(".")[1];
          const controller = {
            ...CommonUtils.getTargetView(event.getSource()).getController()
          };
          if (controller[functionName]) controller[functionName](event);
        }
      };
    } else {
      pressHandler = {
        press: event => {
          const selectedContexts = CommonUtils.getTargetView(event.getSource()).getBindingContext("internal")?.getProperty("selectedContexts");
          FPMHelper.actionWrapper(event, menuItemAction.handlerModule, menuItemAction.handlerMethod, {
            contexts: selectedContexts
          });
        }
      };
    }
    return _jsx(MenuItem, {
      text: menuItemAction.text,
      ...pressHandler,
      visible: menuItemAction.visible,
      enabled: menuItemAction.enabled
    });
  }
  function getActionToolbarMenuAction(props, chartContext, chartBlock) {
    const aMenuItems = (props.actions?.menu).map(action => {
      return getMenuItemFromMenu(action, chartContext, chartBlock);
    });
    return _jsx(ActionToolbarAction, {
      children: _jsx(MenuButton, {
        text: props.text,
        type: "Transparent",
        id: props.id,
        visible: props.visible,
        enabled: props.enabled,
        useDefaultActionOnly: props.useDefaultActionOnly,
        buttonMode: props.buttonMode,
        menuPosition: Dock.BeginBottom,
        defaultAction: "props.defaultAction",
        children: {
          menu: _jsx(Menu, {
            children: aMenuItems
          })
        }
      })
    });
  }
  function getAction(action, chartContext, isMenuItem, chartBlock) {
    const dataFieldContext = chartBlock._metaModel.createBindingContext(action.annotationPath ?? "");
    if (action.type === "ForNavigation") {
      return getNavigationActions(action, dataFieldContext, isMenuItem, chartBlock);
    } else if (action.type === "ForAction") {
      return getAnnotationActions(chartContext, action, dataFieldContext, isMenuItem, chartBlock);
    } else if (action.type === "Menu") {
      const menuItems = action.menu?.map(menuAction => {
        return getAction(menuAction, chartContext, true, chartBlock);
      });
      return _jsx(ActionToolbarAction, {
        children: _jsx(MenuButton, {
          text: action.text,
          type: "Transparent",
          id: action.key,
          visible: action.visible,
          enabled: action.enabled,
          menuPosition: Dock.BeginBottom,
          icon: action?.isAIOperation === true ? aiIcon : undefined,
          children: {
            menu: _jsx(Menu, {
              children: menuItems
            })
          }
        })
      });
    }
    return undefined;
  }
  function getNavigationActions(action, dataFieldContext, isMenuItem, chartBlock) {
    let enabled = "true";
    const dataField = dataFieldContext.getObject();
    if (action.enabled !== undefined) {
      enabled = action.enabled;
    } else if (dataField.RequiresContext) {
      enabled = "{= %{internal>numberOfSelectedContexts} >= 1}";
    }
    return getActionToolbarAction(action, {
      id: undefined,
      unittestid: "DataFieldForIntentBasedNavigationButtonAction",
      label: dataField.Label,
      ariaHasPopup: undefined,
      press: CommonHelper.getPressHandlerForDataFieldForIBN(dataField, `\${internal>selectedContexts}`, false),
      enabled: enabled,
      visible: getVisible(dataFieldContext, chartBlock)
    }, isMenuItem, chartBlock, dataField);
  }
  function getAnnotationActions(chartContext, action, dataFieldContext, isMenuItem, chartBlock) {
    const dataFieldAction = chartBlock._metaModel.createBindingContext(action.annotationPath + "/Action");
    const actionContext = chartBlock._metaModel.createBindingContext(CommonHelper.getActionContext(dataFieldAction));
    const actionObject = actionContext?.getObject();
    const isBoundPath = CommonHelper.getPathToBoundActionOverload(dataFieldAction);
    const isBound = chartBlock._metaModel.createBindingContext(isBoundPath).getObject();
    const dataField = dataFieldContext.getObject();
    if (!isBound || isBound.$IsBound !== true || actionObject[`@${"Org.OData.Core.V1.OperationAvailable"}`] !== false) {
      const enabled = getAnnotationActionsEnabled(action, isBound, dataField, chartContext, chartBlock._context);
      const dataFieldModelObjectPath = getInvolvedDataModelObjects(chartBlock._metaModel.createBindingContext(action.annotationPath));
      const ariaHasPopup = isDataModelObjectPathForActionWithDialog(dataFieldModelObjectPath);
      const chartOperationAvailableMap = escapeXMLAttributeValue(ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
        context: chartContext
      })) || "";
      return getActionToolbarAction(action, {
        id: generate([chartBlock._blockId, getInvolvedDataModelObjects(dataFieldContext)]),
        unittestid: "DataFieldForActionButtonAction",
        label: dataField.Label,
        ariaHasPopup: ariaHasPopup,
        enabled: enabled,
        visible: getVisible(dataFieldContext, chartBlock)
      }, isMenuItem, chartBlock, dataField, chartOperationAvailableMap);
    }
    return undefined;
  }
  function getActionToolbarAction(action, toolbarAction, isMenuItem, chartBlock, dataField, chartOperationAvailableMap) {
    if (isMenuItem) {
      const pressEvent = action.command ? {
        "jsx:command": `cmd:${action.command}|press`
      } : {
        press: event => {
          const view = CommonUtils.getTargetView(event.getSource());
          const controller = view.getController();
          if (action.type === "ForAction") {
            const params = {
              contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
              invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
              controlId: chartBlock._blockId,
              operationAvailableMap: chartOperationAvailableMap,
              model: view.getModel(),
              label: dataField?.Label
            };
            controller.editFlow.invokeAction(dataField?.Action, params);
          } else if (action.type === "ForNavigation") {
            const navigationParameters = {
              navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
            };
            if (dataField?.Mapping) {
              navigationParameters.semanticObjectMapping = JSON.stringify(dataField.Mapping);
            }
            controller._intentBasedNavigation.navigate(dataField.SemanticObject, dataField.Action, navigationParameters);
          }
        }
      };
      return _jsx(MenuItem, {
        text: toolbarAction.label,
        ...pressEvent,
        enabled: toolbarAction.enabled,
        visible: toolbarAction.visible
      });
    } else {
      return buildAction(action, toolbarAction, chartBlock, dataField, chartOperationAvailableMap);
    }
  }
  function buildAction(action, toolbarAction, chartBlock, dataField, chartOperationAvailableMap) {
    return _jsx(ActionToolbarAction, {
      children: _jsx(Button, {
        id: toolbarAction.id,
        text: toolbarAction.label,
        ariaHasPopup: toolbarAction.ariaHasPopup,
        ...getActionPress(action, dataField, chartOperationAvailableMap, chartBlock),
        enabled: toolbarAction.enabled,
        visible: toolbarAction.visible,
        icon: action.isAIOperation === true ? aiIcon : undefined
      })
    });
  }
  function getActionPress(action, dataField, chartOperationAvailableMap, chartBlock) {
    let actionPress = {
      press: ""
    };
    if (action.hasOwnProperty("noWrap")) {
      if (action.command) {
        actionPress = {
          "jsx:command": `cmd:${action.command}|press`
        };
      } else if (action.noWrap === true) {
        actionPress = getCustomActionPress(action);
      } else if (!action.annotationPath) {
        actionPress = getActionPressWithAnnotationPath(action);
      }
    } else {
      actionPress = action.command ? {
        "jsx:command": `cmd:${action.command}|press`
      } : getStandardActionPressWithNoCommand(action, dataField, chartBlock, chartOperationAvailableMap);
    }
    return actionPress;
  }
  function getCustomActionPress(action) {
    return {
      press: event => {
        const functionName = action.handlerMethod?.split(".")[1];
        const controller = {
          ...CommonUtils.getTargetView(event.getSource()).getController()
        };
        if (controller[functionName]) controller[functionName](event);
      }
    };
  }
  function getActionPressWithAnnotationPath(action) {
    return {
      press: event => {
        const selectedContexts = event.getSource().getBindingContext("internal")?.getProperty("selectedContexts");
        FPMHelper.actionWrapper(event, action.handlerModule, action.handlerMethod, {
          contexts: selectedContexts
        });
      }
    };
  }
  function getStandardActionPressWithNoCommand(action, dataField, chartBlock, chartOperationAvailableMap) {
    return {
      press: event => {
        const view = CommonUtils.getTargetView(event.getSource());
        const controller = view.getController();
        if (action.type === "ForAction") {
          const params = {
            contexts: view.getBindingContext("internal")?.getProperty("selectedContexts"),
            invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
            controlId: chartBlock?._blockId,
            operationAvailableMap: chartOperationAvailableMap,
            model: view.getModel(),
            label: dataField?.Label
          };
          controller.editFlow.invokeAction(dataField?.Action, params);
        } else if (action.type === "ForNavigation") {
          const navigationParameters = {
            navigationContexts: view.getBindingContext("internal")?.getProperty("selectedContexts")
          };
          if (dataField?.Mapping) {
            navigationParameters.semanticObjectMapping = JSON.stringify(dataField.Mapping);
          }
          controller._intentBasedNavigation.navigate(dataField.SemanticObject, dataField.Action, navigationParameters);
        }
      }
    };
  }
  function getAnnotationActionsEnabled(action, isBound, dataField, chartContext, context) {
    return action.enabled !== undefined ? action.enabled : ChartHelper.isDataFieldForActionButtonEnabled(isBound && isBound.$IsBound, dataField.Action, context, ChartHelper.getOperationAvailableMap(chartContext.getObject(), {
      context: chartContext
    }), action.enableOnSelect || "");
  }
  function getSegmentedButton(chartBlock) {
    return _jsx(ActionToolbarAction, {
      layoutInformation: {
        aggregationName: "end",
        alignment: "End"
      },
      children: _jsx(SegmentedButton, {
        id: generate([chartBlock._blockId, "SegmentedButton", "TemplateContentView"]),
        selectionChange: event => {
          chartBlock.fireSegmentedButtonPressed?.(merge(event.getParameters(), {
            selectedKey: event.getSource().getSelectedKey()
          }));
        },
        visible: notEqual(pathInModel("alpContentView", "pageInternal"), "Table"),
        selectedKey: pathInModel("alpContentView", "pageInternal"),
        children: {
          items: getSegmentedButtonItems()
        }
      })
    });
  }
  function getSegmentedButtonItems() {
    const segmentedButtonItems = [];
    if (CommonHelper.isDesktop()) {
      segmentedButtonItems.push(getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_HYBRID_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Hybrid", "sap-icon://chart-table-view"));
    }
    segmentedButtonItems.push(getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_CHART_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Chart", "sap-icon://bar-chart"));
    segmentedButtonItems.push(getSegmentedButtonItem("{sap.fe.i18n>M_COMMON_TABLE_SEGMENTED_BUTTON_ITEM_TOOLTIP}", "Table", "sap-icon://table-view"));
    return segmentedButtonItems;
  }
  function getSegmentedButtonItem(tooltip, key, icon) {
    return _jsx(SegmentedButtonItem, {
      tooltip: tooltip,
      icon: icon
    }, key);
  }

  /**
   * Returns the annotation path pointing to the visualization annotation (Chart).
   * @param contextObjectPath The datamodel object path for the chart
   * @param converterContext The converter context
   * @returns The annotation path
   */
  function getVisualizationPath(contextObjectPath, converterContext) {
    const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

    // fallback to default Chart if metaPath is not set
    if (!metaPath) {
      Log.error(`Missing metaPath parameter for Chart`);
      return `@${"com.sap.vocabularies.UI.v1.Chart"}`;
    }
    if (contextObjectPath.targetObject?.term === "com.sap.vocabularies.UI.v1.Chart") {
      return metaPath; // MetaPath is already pointing to a Chart
    }

    //Need to switch to the context related the PV or SPV
    const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);
    let visualizations = [];
    switch (contextObjectPath.targetObject?.term) {
      case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
        if (contextObjectPath.targetObject.PresentationVariant) {
          visualizations = getVisualizationsFromAnnotation(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
        }
        break;
      case "com.sap.vocabularies.UI.v1.PresentationVariant":
        visualizations = getVisualizationsFromAnnotation(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
        break;
      default:
        break;
    }
    const chartViz = visualizations.find(viz => {
      return viz.visualization.term === "com.sap.vocabularies.UI.v1.Chart";
    });
    if (chartViz) {
      return chartViz.annotationPath;
    } else {
      // fallback to default Chart if annotation missing in PV
      Log.error(`Bad metaPath parameter for chart: ${contextObjectPath.targetObject?.term}`);
      return `@${"com.sap.vocabularies.UI.v1.Chart"}`;
    }
  }
  function getVisible(dataFieldContext, chartBlock) {
    const dataField = dataFieldContext.getObject();
    if (dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`] && dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path) {
      const hiddenPathContext = chartBlock._metaModel.createBindingContext(dataFieldContext.getPath() + `/@${"com.sap.vocabularies.UI.v1.Hidden"}/$Path`, dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path);
      return ChartHelper.getHiddenPathExpressionForTableActionsAndIBN(dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`].$Path, {
        context: hiddenPathContext
      });
    } else if (dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`]) {
      return !dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`];
    } else {
      return true;
    }
  }
  function getChartConverterContext(properties, originalViewData, contextObjectPath, diagnostics, extraParams) {
    let viewData = Object.assign({}, originalViewData);
    delete viewData.resourceModel;
    delete viewData.appComponent;
    viewData = deepClone(viewData);
    let controlConfiguration = {};

    // Only merge in page control configuration if the building block is on the same context
    const relativePath = getTargetObjectPath(contextObjectPath.contextLocation ?? contextObjectPath);
    const entitySetName = contextObjectPath.contextLocation?.targetEntitySet?.name ?? contextObjectPath.targetEntitySet?.name;
    if (relativePath === originalViewData?.contextPath || relativePath === `/${originalViewData?.entitySet}` || entitySetName === originalViewData?.entitySet) {
      controlConfiguration = viewData.controlConfiguration;
    }
    viewData.controlConfiguration = merge(controlConfiguration, extraParams || {});
    return ConverterContext.createConverterContextForMacro(contextObjectPath.startingEntitySet.name, properties._metaModel, diagnostics, merge, contextObjectPath.contextLocation, new ManifestWrapper(viewData));
  }
  function getConverterContext(chartBlock, viewData, contextObjectPath, diagnostics) {
    const initialConverterContext = getChartConverterContext(chartBlock, viewData, contextObjectPath, diagnostics);
    const visualizationPath = getVisualizationPath(contextObjectPath, initialConverterContext);
    const extraParams = getExtraParams(chartBlock, visualizationPath);
    return getChartConverterContext(chartBlock, viewData, contextObjectPath, diagnostics, extraParams);
  }
  function modifyIdentifiers(chartBlock) {
    if (chartBlock._applyIdToContent) {
      chartBlock._blockId = chartBlock.id.replace(/::Chart$/, "");
      chartBlock._contentId = chartBlock._blockId;
    } else {
      chartBlock._blockId = chartBlock.id;
      chartBlock._contentId = getContentId(chartBlock.id);
    }
  }
  function initialise(chartBlock, viewData, diagnostics, contextObjectPath) {
    const metaContextPath = chartBlock.getMetaPathObject(chartBlock.metaPath, chartBlock._resolvedContextPath);
    chartBlock._metaModel = chartBlock._getOwner()?.preprocessorContext?.models.metaModel;
    chartBlock._metaPathContext = chartBlock._metaModel.createBindingContext(metaContextPath.getPath());
    chartBlock._context = chartBlock._metaModel.createBindingContext(chartBlock.contextPath ?? metaContextPath?.getContextPath());
    const converterContext = getConverterContext(chartBlock, viewData, contextObjectPath, diagnostics);
    const viewConfig = converterContext.getManifestWrapper()?.getViewConfiguration();
    const isMultiTabs = viewConfig?.paths?.length > 1;
    const hasMultipleVisualizations = converterContext.getManifestWrapper()?.hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
    const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext, true); // passing the last parameter as true to consider the old annotations i.e. Aggregation.Aggregatable for backward compatibility in case of chart

    chartBlock._chartContext = ChartHelper.getUiChart(chartBlock._metaPathContext);
    chartBlock._chart = chartBlock._chartContext.getObject();
    chartBlock._blockActions = [];
    chartBlock._commandActions = [];
    modifyIdentifiers(chartBlock);
    if (chartBlock._chart) {
      chartBlock.chartDefinition = createChartDefinition(chartBlock, converterContext, contextObjectPath, chartBlock._chartContext.getPath());
      const collection = chartBlock._metaModel.createBindingContext(chartBlock.chartDefinition.collection);
      // API Properties
      chartBlock.navigationPath = chartBlock.chartDefinition.navigationPath;
      chartBlock.autoBindOnInit = chartBlock.chartDefinition.autoBindOnInit;
      chartBlock.vizProperties = chartBlock.chartDefinition.vizProperties;
      chartBlock.chartActions = chartBlock.chartDefinition.actions;
      chartBlock.filter = getFilterBar(chartBlock);
      let personalization;
      if (chartBlock.chartDefinition?.personalization !== undefined) {
        personalization = chartBlock.chartDefinition.personalization;
      } else {
        switch (chartBlock.personalization) {
          case "false":
            personalization = undefined;
            break;
          case "true":
            personalization = Object.values(personalizationValues).join(",");
            break;
          default:
            personalization = chartBlock.personalization;
        }
      }
      checkPersonalizationInChartProperties(personalization, chartBlock);
      chartBlock.visible = chartBlock.chartDefinition.visible;
      let contextPath = chartBlock._context.getPath();
      contextPath = contextPath[contextPath.length - 1] === "/" ? contextPath.slice(0, -1) : contextPath;
      chartBlock.draftSupported = ModelHelper.isDraftSupported(chartBlock._metaModel, contextPath);
      chartBlock._chartType = ChartHelper.formatChartType(chartBlock._chart.ChartType);
      const operationAvailableMap = ChartHelper.getOperationAvailableMap(chartBlock._chart, {
        context: chartBlock._chartContext
      });
      if (Object.keys(chartBlock.chartDefinition?.commandActions).length > 0) {
        Object.keys(chartBlock.chartDefinition?.commandActions).forEach(key => {
          const action = chartBlock.chartDefinition?.commandActions[key];
          const actionContext = createBindingContext(action);
          const dataFieldContext = action.annotationPath && chartBlock._metaModel.createBindingContext(action.annotationPath);
          const dataField = dataFieldContext && dataFieldContext.getObject();
          const chartOperationAvailableMap = escapeXMLAttributeValue(operationAvailableMap);
          pushActionCommand(actionContext, dataField, chartOperationAvailableMap, action, chartBlock);
        });
      }
      chartBlock.measures = getChartMeasures(chartBlock, aggregationHelper);
      const presentationPath = CommonHelper.createPresentationPathContext(chartBlock._metaPathContext);
      chartBlock._sortConditions = ChartHelper.getSortConditions(chartBlock._metaPathContext, chartBlock._metaPathContext.getObject(), presentationPath.getPath(), chartBlock.chartDefinition.applySupported);
      const chartActionsContext = chartBlock._metaModel.createBindingContext(chartBlock._chartContext.getPath() + "/Actions", chartBlock._chart.Actions);
      const targetCollectionPath = CommonHelper.getTargetCollectionPath(collection);
      const targetCollectionPathContext = chartBlock._metaModel.createBindingContext(targetCollectionPath, collection);
      const actionsObject = contextObjectPath.convertedTypes.resolvePath(chartActionsContext.getPath())?.target;
      chartBlock._customData = {
        targetCollectionPath: chartBlock.chartDefinition.collection,
        entitySet: typeof targetCollectionPathContext.getObject() === "string" ? targetCollectionPathContext.getObject() : targetCollectionPathContext.getObject("@sapui.name"),
        entityType: chartBlock.chartDefinition.collection + "/",
        operationAvailableMap: JSON.parse(operationAvailableMap),
        multiSelectDisabledActions: ActionHelper.getMultiSelectDisabledActions(actionsObject) + "",
        segmentedButtonId: generate([chartBlock._blockId, "SegmentedButton", "TemplateContentView"]),
        customAgg: chartBlock.chartDefinition?.customAgg,
        transAgg: chartBlock.chartDefinition?.transAgg,
        applySupported: chartBlock.chartDefinition?.applySupported,
        vizProperties: JSON.parse(chartBlock.vizProperties),
        draftSupported: chartBlock.draftSupported,
        multiViews: chartBlock.chartDefinition?.multiViews || !hasMultipleVisualizations && isMultiTabs,
        selectionPresentationVariantPath: {
          data: chartBlock.chartDefinition?.selectionPresentationVariantPath
        },
        chartDimensionKeyAndRole: chartBlock.chartDefinition?.chartDimensionKeyAndRole,
        chartMeasureKeyAndRole: chartBlock.chartDefinition?.chartMeasureKeyAndRole
      };
      if (chartBlock.chartDefinition.isParameterizedEntitySet) {
        chartBlock._customData.entitySet = chartBlock.chartDefinition.collection.substring(1);
      }
    } else {
      // fallback to display empty chart
      chartBlock.autoBindOnInit = false;
      chartBlock.visible = "true";
      chartBlock.navigationPath = "";
      chartBlock._customData = {
        targetCollectionPath: "",
        entitySet: "",
        entityType: "",
        operationAvailableMap: "",
        multiSelectDisabledActions: "",
        segmentedButtonId: "",
        customAgg: {},
        transAgg: {},
        applySupported: {},
        vizProperties: {}
      };
    }
  }
  function getFilterBar(chartBlock) {
    const filterBar = Element.getElementById(chartBlock.filterBar);
    if (chartBlock.filterBar && filterBar?.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
      return getContentId(chartBlock.filterBar);
    } else if (filterBar?.isA("sap.fe.macros.controls.FilterBar")) {
      return chartBlock.filterBar;
    } else if (chartBlock.filterBar) {
      return getContentId(chartBlock.filterBar);
    }
  }
  function getDelegate(chartBlock) {
    if (chartBlock.chartDelegate) {
      chartBlock.chartDelegate.payload.selectionMode = chartBlock.chartDefinition.selectionMode?.toUpperCase() ?? chartBlock.chartDelegate.payload.selectionMode ?? "MULTIPLE";
    }
    return chartBlock.chartDelegate ? chartBlock.chartDelegate : {
      name: "sap/fe/macros/chart/ChartDelegate",
      payload: {
        chartContextPath: chartBlock._customData.targetCollectionPath,
        parameters: {
          $$groupId: "$auto.Workers"
        },
        selectionMode: chartBlock.chartDefinition.selectionMode?.toUpperCase() ?? chartBlock.selectionMode?.toUpperCase() ?? "MULTIPLE"
      }
    };
  }
  function getCustomData(chartBlock) {
    return [_jsx(CustomData, {
      value: chartBlock._customData.targetCollectionPath
    }, "targetCollectionPath"), _jsx(CustomData, {
      value: chartBlock._customData.entitySet
    }, "entitySet"), _jsx(CustomData, {
      value: chartBlock._customData.entityType
    }, "entityType"), _jsx(CustomData, {
      value: chartBlock._customData.operationAvailableMap
    }, "operationAvailableMap"), _jsx(CustomData, {
      value: chartBlock._customData.multiSelectDisabledActions
    }, "multiSelectDisabledActions"), _jsx(CustomData, {
      value: chartBlock._customData.segmentedButtonId
    }, "segmentedButtonId"), _jsx(CustomData, {
      value: chartBlock._customData.customAgg
    }, "customAgg"), _jsx(CustomData, {
      value: chartBlock._customData.transAgg
    }, "transAgg"), _jsx(CustomData, {
      value: chartBlock._customData.applySupported
    }, "applySupported"), _jsx(CustomData, {
      value: chartBlock._customData.vizProperties
    }, "vizProperties"), _jsx(CustomData, {
      value: chartBlock._customData.draftSupported
    }, "draftSupported"), _jsx(CustomData, {
      value: chartBlock._customData.multiViews
    }, "multiViews"), _jsx(CustomData, {
      value: chartBlock._customData.selectionPresentationVariantPath
    }, "selectionPresentationVariantPath"), _jsx(CustomData, {
      value: chartBlock._customData.chartDimensionKeyAndRole
    }, "chartDimensionKeyAndRole"), _jsx(CustomData, {
      value: chartBlock._customData.chartMeasureKeyAndRole
    }, "chartMeasureKeyAndRole")];
  }
  function getNoData(chartBlock) {
    if (chartBlock._customData.targetCollectionPath === "") {
      return;
    }
    return _jsx(IllustratedMessage, {
      illustrationSize: IllustratedMessageSize.Auto,
      illustrationType: IllustratedMessageType.BeforeSearch,
      title: chartBlock.getTranslatedText("T_TABLE_AND_CHART_NO_DATA_TITLE_TEXT"),
      description: chartBlock.getTranslatedText("T_TABLE_AND_CHART_NO_DATA_TEXT"),
      enableDefaultTitleAndDescription: false,
      enableVerticalResponsiveness: true
    });
  }
  function getMdcChartTemplate(chartBlock, viewData, diagnostics, contextObjectPath) {
    initialise(chartBlock, viewData, diagnostics, contextObjectPath);
    chartBlock.layoutData = _jsx(FlexItemData, {
      growFactor: "1",
      shrinkFactor: "1"
    });
    return _jsx(MdcChart, {
      binding: {
        internal: "controls/" + chartBlock._blockId
      },
      id: chartBlock._contentId,
      chartType: chartBlock._chartType,
      sortConditions: chartBlock._sortConditions,
      header: chartBlock.chartDefinition.header ?? chartBlock.header ?? chartBlock._chart?.Title?.toString() ?? "",
      headerVisible: chartBlock.chartDefinition.headerVisible ?? chartBlock.headerVisible,
      minHeight: Device.system.phone ? "80vh" : "400px",
      height: "100%",
      width: "100%",
      headerLevel: chartBlock.headerLevel,
      headerStyle: chartBlock.headerStyle,
      p13nMode: chartBlock._personalization?.split(","),
      filter: chartBlock.filter,
      noDataText: chartBlock._customData.targetCollectionPath === "" ? chartBlock.getTranslatedText("M_CHART_NO_ANNOTATION_SET_TEXT") : chartBlock.noDataText,
      autoBindOnInit: chartBlock.autoBindOnInit,
      delegate: getDelegate(chartBlock),
      visible: chartBlock.visible,
      children: {
        customData: getCustomData(chartBlock),
        dependents: [getDependents(chartBlock, chartBlock._chartContext), getPersistenceProvider(chartBlock)],
        items: getItems(chartBlock),
        actions: chartBlock.chartActions ? getToolbarActions(chartBlock) : chartBlock._blockActions,
        variant: createVariantManagement(chartBlock),
        noData: getNoData(chartBlock)
      }
    });
  }
  _exports.getMdcChartTemplate = getMdcChartTemplate;
  return _exports;
}, false);
//# sourceMappingURL=MdcChartTemplate-dbg.js.map
