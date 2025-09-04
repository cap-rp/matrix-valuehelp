/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/chart/TimeUnitType", "sap/fe/core/CommonUtils", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/chart/ChartHelper", "sap/fe/macros/chart/ChartUtils", "sap/fe/macros/filter/FilterUtils", "sap/m/IllustratedMessageSize", "sap/m/IllustratedMessageType", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/mdc/enums/ChartItemRoleType", "sap/ui/mdc/odata/v4/util/DelegateUtil", "sap/ui/mdc/odata/v4/vizChart/ChartDelegate", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "../filterBar/FilterBarDelegate"], function (Log, merge, TimeUnitType, CommonUtils, valueFormatters, MetaModelFunction, ModelHelper, ResourceModelHelper, CommonHelper, MacrosDelegateUtil, ChartHelper, ChartUtils, FilterUtils, IllustratedMessageSize, IllustratedMessageType, Element, Library, ChartItemRoleType, DelegateUtil, BaseChartDelegate, Filter, FilterOperator, FilterBarDelegate) {
  "use strict";

  var isMultiValueFilterExpression = MetaModelFunction.isMultiValueFilterExpression;
  var getSortRestrictionsInfo = MetaModelFunction.getSortRestrictionsInfo;
  var getFilterableData = MetaModelFunction.getFilterableData;
  const ChartDelegate = Object.assign({}, BaseChartDelegate);
  BaseChartDelegate.apiVersion = 2;
  ChartDelegate._loadChart = async function () {
    await Library.load({
      name: "sap.chart"
    });
    return BaseChartDelegate._loadChart();
  };
  ChartDelegate._handleProperty = function (oContext, oMDCChart, mEntitySetAnnotations, mKnownAggregatableProps, mCustomAggregates, aProperties, sCriticality, unitOfMeasures) {
    const oApplySupported = CommonHelper.parseCustomData(oMDCChart.data("applySupported"));
    const sortRestrictionsInfo = getSortRestrictionsInfo(mEntitySetAnnotations);
    const metaModel = oContext.getModel();
    const entityTypePath = oMDCChart.data("entityType");
    const bindingPath = ModelHelper.getEntitySetPath(entityTypePath);
    const filterRestrictions = CommonUtils.getFilterRestrictionsByPath(bindingPath, metaModel);
    const propertyFilterableData = {};
    getFilterableData(propertyFilterableData, filterRestrictions.NonFilterableProperties, Object.keys(filterRestrictions.FilterAllowedExpressions));
    const oObj = oContext.getModel().getObject(oContext.getPath());
    const sKey = oContext.getModel().getObject(`${oContext.getPath()}@sapui.name`);
    const aModes = oMDCChart.getP13nMode();
    checkForNonfilterableEntitySet(oMDCChart, aModes);
    if (oObj && oObj.$kind === "Property") {
      // ignore (as for now) all complex properties
      // not clear if they might be nesting (complex in complex)
      // not clear how they are represented in non-filterable annotation
      // etc.
      if (oObj.$isCollection) {
        //Log.warning("Complex property with type " + oObj.$Type + " has been ignored");
        return;
      }
      const oPropertyAnnotations = metaModel.getObject(`${oContext.getPath()}@`);
      const sPath = metaModel.getObject("@sapui.name", metaModel.getMetaContext(oContext.getPath()));
      const aGroupableProperties = oApplySupported && oApplySupported.GroupableProperties;
      const aAggregatableProperties = oApplySupported && oApplySupported.AggregatableProperties;
      let bGroupable = aGroupableProperties ? checkPropertyType(aGroupableProperties, sPath) : false;
      let bAggregatable = aAggregatableProperties ? checkPropertyType(aAggregatableProperties, sPath) : false;
      const customAggregates = Object.keys(mCustomAggregates);
      if (!aGroupableProperties || aGroupableProperties && !aGroupableProperties.length) {
        bGroupable = oPropertyAnnotations["@Org.OData.Aggregation.V1.Groupable"];
      }
      if (!aAggregatableProperties || aAggregatableProperties && !aAggregatableProperties.length) {
        bAggregatable = oPropertyAnnotations["@Org.OData.Aggregation.V1.Aggregatable"];
      }
      if (customAggregates.includes(sKey)) {
        bAggregatable = true;
      }

      //Right now: skip them, since we can't create a chart from it
      if (!bGroupable && !bAggregatable) {
        return;
      }
      const propertyFilterable = CommonHelper.isPropertyFilterable(oContext);
      if (bAggregatable) {
        const aAggregateProperties = ChartDelegate._createPropertyInfosForAggregatable(oMDCChart, sKey, oPropertyAnnotations, filterRestrictions, sortRestrictionsInfo, mKnownAggregatableProps, mCustomAggregates, oObj.$Type);
        aAggregateProperties.forEach(function (oAggregateProperty) {
          // if a property is UOM then do not add it to measures
          if (!unitOfMeasures.includes(oAggregateProperty.path)) {
            aProperties.push(oAggregateProperty);
          }
        });
        //Add transformation aggregated properties to chart properties
        if (aModes && aModes.includes("Filter")) {
          const aKnownAggregatableProps = Object.keys(mKnownAggregatableProps);
          const aGroupablePropertiesValues = aGroupableProperties?.map(oProperty => oProperty.$PropertyPath);
          // Add transformation aggregated property to chart so that in the filter dropdown it's visible
          // Also mark visibility false as this property should not come up in under chart section of personalization dialog
          // if a property is UOM then do not add it to measures
          if (aKnownAggregatableProps.includes(sKey) && !aGroupablePropertiesValues?.includes(sKey) && !unitOfMeasures.includes(sKey)) {
            aProperties = addPropertyToChart(aProperties, sKey, oPropertyAnnotations, customAggregates.includes(sKey) ? false : checkPropertyFilterable(sKey, propertyFilterable, propertyFilterableData), filterRestrictions, false,
            // 'isSortable' is set to 'false' to avoid duplicate entries in the sort queue for aggregatable properties. These properties are already queued for sorting in the 'createPropertyInfosForAggregatable' method.
            oMDCChart, sCriticality, oObj, false, true, undefined, true);
          }
        }
      }
      if (bGroupable) {
        const sName = sKey || "",
          sTextProperty = oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.Text"] ? oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.Text"].$Path : null;
        let bIsNavigationText = false;
        if (sName && sName.includes("/")) {
          Log.error(`$expand is not yet supported. Property: ${sName} from an association cannot be used`);
          return;
        }
        if (sTextProperty && sTextProperty.indexOf("/") > -1) {
          Log.error(`$expand is not yet supported. Text Property: ${sTextProperty} from an association cannot be used`);
          bIsNavigationText = true;
        }
        aProperties = addPropertyToChart(aProperties, sKey, oPropertyAnnotations, checkPropertyFilterable(sKey, propertyFilterable, propertyFilterableData) ? customAggregates.includes(sKey) && unitOfMeasures.includes(sKey) || !unitOfMeasures.includes(sKey) : false,
        // UOM property should be filterable if it is marked as custom aggregate as well as groupable
        filterRestrictions, ChartDelegate._getSortable(oMDCChart, sortRestrictionsInfo.propertyInfo[sKey], false), oMDCChart, sCriticality, oObj, !customAggregates.includes(sKey) || customAggregates.includes(sKey) && unitOfMeasures.includes(sKey) ? true : false,
        // if a property is UOM, marked as custom aggregate and groupable then show it in dimensions
        false, bIsNavigationText);
      }
    }
  };

  /**
   * Get all the properties which are marked as unit of measure.
   * @param entityType The entity type displayed in the chart
   * @param metaModel  MetaModel
   * @param entitySetPath Entity set path
   * @returns An array of unit of measures
   */
  function _getUnitOfMeasures(entityType, metaModel, entitySetPath) {
    const unitOfMeasures = [];
    for (const sKey in entityType) {
      const context = metaModel.createBindingContext(`${entitySetPath}/${sKey}`);
      const propertyAnnotations = metaModel.getObject(`${context?.getPath()}@`);
      const unit = propertyAnnotations?.["@Org.OData.Measures.V1.ISOCurrency"]?.$Path || propertyAnnotations?.["@Org.OData.Measures.V1.Unit"]?.$Path;
      if (unit && !unitOfMeasures.includes(unit)) {
        unitOfMeasures.push(unit);
      }
    }
    return unitOfMeasures;
  }

  // create properties for chart
  function addPropertyToChart(aProperties, sKey, oPropertyAnnotations, isFilterable, oFilterRestrictionsInfo, isSortable, oMDCChart, sCriticality, oObj, bIsGroupable, bIsAggregatable, bIsNavigationText, bIsHidden) {
    let chartRole = ChartItemRoleType.category;
    const chartData = oMDCChart.data("chartDimensionKeyAndRole");
    if (Array.isArray(chartData)) {
      chartData.forEach(record => {
        if (record[sKey]) {
          chartRole = record[sKey].split("/").pop()?.toLowerCase() || chartRole;
        }
      });
    }
    const oProperty = {
      name: "_fe_groupable_" + sKey,
      label: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"]?.toString() || sKey,
      sortable: isSortable,
      filterable: isFilterable,
      groupable: bIsGroupable,
      aggregatable: bIsAggregatable,
      maxConditions: isMultiValueFilterExpression(oFilterRestrictionsInfo["FilterAllowedExpressions"]?.[sKey]?.[0]) ? -1 : 1,
      path: sKey,
      role: chartRole,
      //standard, normally this should be interpreted from UI.Chart annotation
      criticality: sCriticality,
      //To be implemented by FE
      dataType: oObj.$Type,
      visible: bIsHidden ? !bIsHidden : true,
      textProperty: !bIsNavigationText && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"] ? oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"].$Path : null,
      //To be implemented by FE
      textFormatter: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]
    };
    // timeUnitType = undefined -> crashes the chart. therefore:
    const timeUnitType = ChartDelegate._getTimeType(oObj, oPropertyAnnotations);
    if (timeUnitType) oProperty.timeUnitType = timeUnitType;
    if (oObj.$Type === "Edm.DateTimeOffset" || oObj.$Type === "Edm.TimeOfDay") {
      switch (oObj.$Type) {
        case "Edm.DateTimeOffset":
          oProperty.formatOptions = {
            style: "medium/short"
          };
          break;
        case "Edm.TimeOfDay":
          oProperty.formatOptions = {
            style: "short"
          };
          break;
        default:
          break;
      }
    }
    aProperties.push(oProperty);
    return aProperties;
  }

  /**
   * Check if a property is filterable or not.
   * @param key Property key
   * @param propertyFilterable  Filter restrictions
   * @param propertyFilterableData
   * @returns Boolean value for a property
   */
  function checkPropertyFilterable(key, propertyFilterable, propertyFilterableData) {
    if (propertyFilterable === false) {
      return false;
    } else if (typeof propertyFilterable === "string") {
      // path based filterable is yet to handle here in future
      return true;
    } else {
      return propertyFilterableData?.[key]?.filterable ?? true;
    }
  }
  ChartDelegate._getTimeType = function (oObj, oPropertyAnnotations) {
    switch (oObj.$Type) {
      case "Edm.Date":
        return TimeUnitType.Date;
      case "Edm.String":
        if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsFiscalYear"]) {
          return TimeUnitType.fiscalyear;
        } else if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod"]) {
          return TimeUnitType.fiscalyearperiod;
        } else if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsCalendarYearMonth"]) {
          return TimeUnitType.yearmonth;
        } else if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsCalendarYearQuarter"]) {
          return TimeUnitType.yearquarter;
        } else if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsCalendarYearWeek"]) {
          return TimeUnitType.yearweek;
        } else if (oPropertyAnnotations["@" + "com.sap.vocabularies.Common.v1.IsCalendarDate"]) {
          return TimeUnitType.yearmonthday;
        }
        break;
      default:
        return undefined;
    }
  };

  // If entityset is non filterable,then from p13n modes remove Filter so that on UI filter option doesn't show up
  function checkForNonfilterableEntitySet(oMDCChart, aModes) {
    const bEntitySetFilerable = oMDCChart?.getModel()?.getMetaModel()?.getObject(`${oMDCChart.data("targetCollectionPath")}@Org.OData.Capabilities.V1.FilterRestrictions`)?.Filterable;
    if (bEntitySetFilerable !== undefined && !bEntitySetFilerable) {
      aModes = aModes.filter(item => item !== "Filter");
      oMDCChart.setP13nMode(aModes);
    }
  }

  //  check if Groupable /Aggregatable property is present or not
  function checkPropertyType(aProperties, sPath) {
    if (aProperties.length) {
      for (const element of aProperties) {
        if (element?.$PropertyPath === sPath || element?.Property?.$PropertyPath === sPath) {
          return true;
        }
      }
    }
  }
  ChartDelegate.formatText = function (oValue1, oValue2) {
    const sValue = this.typeConfig?.typeInstance?.formatValue(oValue1, "string") || oValue1;
    if (oValue2) {
      const oTextArrangementAnnotation = this.textFormatter;
      if (!oTextArrangementAnnotation || oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextFirst") {
        return valueFormatters.formatWithBrackets(oValue2, sValue);
      }
      if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
        return valueFormatters.formatWithBrackets(sValue, oValue2);
      }
    }
    return oValue2 || sValue;
  };

  /**
   * Update the illustrated message with a new title, description, and type.
   * @param oChart Reference to the MDC_Chart
   * @param illustratedMessageDetail Object corresponds to the illustrated message
   */
  ChartDelegate._updateIllustratedMessage = function (oChart, illustratedMessageDetail) {
    const noDataControl = oChart.getNoData();
    noDataControl.setTitle(illustratedMessageDetail.title);
    noDataControl.setDescription(illustratedMessageDetail.description);
    noDataControl.setIllustrationType(illustratedMessageDetail.illustrationType || IllustratedMessageType.NoData);
    noDataControl.setIllustrationSize(illustratedMessageDetail.illustrationSize || IllustratedMessageSize.Auto);
  };

  /**
   * We set the illustrated message's title, description, and type based on different conditions.
   * @param chart Reference to the MDC_Chart
   * @param bindingInfo BindingInfo
   */
  ChartDelegate.setChartNoDataIllustratedMessage = function (chart, bindingInfo) {
    const resourceModel = ResourceModelHelper.getResourceModel(chart);
    let illustratedInformation = {};
    const converterType = CommonUtils.getTargetView(chart).getViewData().converterType;
    const oChartFilterInfo = ChartUtils.getAllFilterInfo(chart);
    const suffixResourceKey = bindingInfo.path.startsWith("/") ? bindingInfo.path.substr(1) : bindingInfo.path;
    const getNoDataIllustratedMessageWithFilters = function () {
      if (chart.data("multiViews") === "true") {
        return {
          title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS", undefined, suffixResourceKey),
          description: resourceModel.getText("M_TABLE_AND_CHART_NO_DATA_TEXT_MULTI_VIEW", undefined, suffixResourceKey),
          illustrationType: IllustratedMessageType.NoSearchResults
        };
      }
      return {
        title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NOSEARCHRESULTS", undefined, suffixResourceKey),
        description: resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT_WITH_FILTER", undefined, suffixResourceKey),
        illustrationType: IllustratedMessageType.NoSearchResults,
        illustrationSize: converterType === "ObjectPage" ? IllustratedMessageSize.Small : IllustratedMessageSize.Auto
      };
    };
    if (chart.getFilter() && converterType !== "ObjectPage") {
      if (oChartFilterInfo.search || oChartFilterInfo.filters?.length) {
        illustratedInformation = getNoDataIllustratedMessageWithFilters();
      }
    } else if (oChartFilterInfo.search || oChartFilterInfo.filters?.length) {
      //check if chart has any personalization filters
      illustratedInformation = getNoDataIllustratedMessageWithFilters();
    } else {
      illustratedInformation = {
        title: resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_NODATA", undefined, suffixResourceKey),
        description: resourceModel.getText("M_TABLE_AND_CHART_NO_FILTERS_NO_DATA_TEXT", undefined, suffixResourceKey),
        illustrationType: IllustratedMessageType.NoData,
        illustrationSize: IllustratedMessageSize.Small
      };
    }
    ChartDelegate._updateIllustratedMessage(chart, illustratedInformation);
  };
  ChartDelegate.updateBindingInfo = function (oChart, oBindingInfo) {
    const internalBindingContext = oChart.getBindingContext("internal");
    internalBindingContext.setProperty("isInsightsEnabled", true);
    ChartDelegate.setChartNoDataIllustratedMessage(oChart, oBindingInfo);
    const oFilter = Element.getElementById(oChart.getFilter());
    const mConditions = oChart.getConditions();
    if (!oBindingInfo) {
      oBindingInfo = {};
    }
    if (!oBindingInfo.parameters) {
      oBindingInfo.parameters = {};
    }
    if (oFilter) {
      // Search
      const oInfo = FilterUtils.getFilterInfo(oFilter, {});
      const oApplySupported = CommonHelper.parseCustomData(oChart.data("applySupported"));
      if (oApplySupported && oApplySupported.enableSearch && oInfo.search) {
        oBindingInfo.parameters.$search = CommonUtils.normalizeSearchTerm(oInfo.search);
      } else if (oBindingInfo.parameters.$search) {
        delete oBindingInfo.parameters.$search;
      }
    }
    const sParameterPath = mConditions ? DelegateUtil.getParametersInfo(oFilter, mConditions) : null;
    if (sParameterPath) {
      oBindingInfo.path = sParameterPath;
    }
    const oFilterInfo = ChartUtils.getAllFilterInfo(oChart);
    if (oFilterInfo.bindingPath) {
      oBindingInfo.path = oFilterInfo.bindingPath;
    }
    if (CommonUtils.getTargetView(oChart).getViewData().viewLevel > 0 && oBindingInfo.path && oChart.getBindingContext()) {
      oBindingInfo.path = ChartHelper.getCollectionName(oBindingInfo.path);
    }

    // remove prefixes so that entityset will match with the property names with these field
    if (oFilterInfo.filters) {
      oFilterInfo.filters.forEach(element => {
        if (element.getPath()) {
          element.sPath = oChart.getParent().getChartPropertiesWithoutPrefixes(element.getPath());
        }
      });
    }
    oBindingInfo.events ??= {};
    oBindingInfo.events.dataRequested = oChart.getParent().onInternalDataRequested.bind(oChart.getParent());
    oBindingInfo.filters = oFilterInfo.filters.length > 0 ? new Filter({
      filters: oFilterInfo.filters,
      and: true
    }) : undefined;
    oBindingInfo.sorter = this.getSorters(oChart);
    ChartDelegate._checkAndAddDraftFilter(oChart, oBindingInfo);
  };
  ChartDelegate.fetchProperties = async function (oMDCChart) {
    const oModel = this._getModel(oMDCChart);
    let pCreatePropertyInfos;
    if (!oModel) {
      pCreatePropertyInfos = new Promise(resolve => {
        oMDCChart.attachModelContextChange({
          resolver: resolve
        }, onModelContextChange, this);
      }).then(oRetrievedModel => {
        return this._createPropertyInfos(oMDCChart, oRetrievedModel);
      });
    } else {
      pCreatePropertyInfos = this._createPropertyInfos(oMDCChart, oModel);
    }
    return pCreatePropertyInfos.then(function (aProperties) {
      if (oMDCChart.data) {
        oMDCChart.data("$mdcChartPropertyInfo", aProperties);
        // store the properties to fetch during p13n calculation
        MacrosDelegateUtil.setCachedProperties(oMDCChart, aProperties);
      }
      return aProperties;
    });
  };
  function onModelContextChange(oEvent, oData) {
    const oMDCChart = oEvent.getSource();
    const oModel = this._getModel(oMDCChart);
    if (oModel) {
      oMDCChart.detachModelContextChange(onModelContextChange);
      oData.resolver(oModel);
    }
  }
  ChartDelegate._createPropertyInfos = async function (oMDCChart, oModel) {
    const sEntitySetPath = `/${oMDCChart.data("entitySet")}`;
    const oMetaModel = oModel.getMetaModel();
    const aResults = await Promise.all([oMetaModel.requestObject(`${sEntitySetPath}/`), oMetaModel.requestObject(`${sEntitySetPath}@`)]);
    const aProperties = [];
    const oEntityType = aResults[0];
    const mEntitySetAnnotations = aResults[1];
    const mCustomAggregates = CommonHelper.parseCustomData(oMDCChart.data("customAgg"));
    getCustomAggregate(mCustomAggregates, oMDCChart);
    let sAnno;
    for (const sAnnoKey in mEntitySetAnnotations) {
      if (sAnnoKey.startsWith("@Org.OData.Aggregation.V1.CustomAggregate")) {
        sAnno = sAnnoKey.replace("@Org.OData.Aggregation.V1.CustomAggregate#", "");
        const aAnno = sAnno.split("@");
        if (aAnno.length == 2 && aAnno[1] == "com.sap.vocabularies.Common.v1.Label") {
          mCustomAggregates[aAnno[0]] = mEntitySetAnnotations[sAnnoKey];
        }
      }
    }
    const mTypeAggregatableProps = CommonHelper.parseCustomData(oMDCChart.data("transAgg"));
    const mKnownAggregatableProps = {};
    for (const sAggregatable in mTypeAggregatableProps) {
      const sPropKey = mTypeAggregatableProps[sAggregatable].propertyPath;
      mKnownAggregatableProps[sPropKey] = mKnownAggregatableProps[sPropKey] || {};
      mKnownAggregatableProps[sPropKey][mTypeAggregatableProps[sAggregatable].aggregationMethod] = {
        name: mTypeAggregatableProps[sAggregatable].name,
        label: mTypeAggregatableProps[sAggregatable].label
      };
    }
    const unitOfMeasures = _getUnitOfMeasures(oEntityType, oMetaModel, sEntitySetPath);
    for (const sKey in oEntityType) {
      if (sKey.indexOf("$") !== 0) {
        const criticality = ChartHelper.fetchCriticality(oMetaModel, oMetaModel.createBindingContext(`${sEntitySetPath}/${sKey}`));
        ChartDelegate._handleProperty(oMetaModel.getMetaContext(`${sEntitySetPath}/${sKey}`), oMDCChart, mEntitySetAnnotations, mKnownAggregatableProps, mCustomAggregates, aProperties, criticality, unitOfMeasures);
      }
    }
    return aProperties;
  };
  function getCustomAggregate(mCustomAggregates, oMDCChart) {
    const aDimensions = [],
      aMeasures = [];
    if (mCustomAggregates && Object.keys(mCustomAggregates).length >= 1) {
      const aChartItems = oMDCChart.getItems();
      for (const key in aChartItems) {
        if (aChartItems[key].getType() === "groupable") {
          aDimensions.push(ChartDelegate.getInternalChartNameFromPropertyNameAndKind(aChartItems[key].getPropertyKey(), "groupable"));
        } else if (aChartItems[key].getType() === "aggregatable") {
          aMeasures.push(ChartDelegate.getInternalChartNameFromPropertyNameAndKind(aChartItems[key].getPropertyKey(), "aggregatable"));
        }
      }
      if (aMeasures.filter(function (val) {
        return aDimensions.includes(val);
      }).length >= 1) {
        Log.error("Dimension and Measure has the sameProperty Configured");
      }
    }
  }
  ChartDelegate._createPropertyInfosForAggregatable = function (oMDCChart, sKey, oPropertyAnnotations, oFilterRestrictionsInfo, sortRestrictionsInfo, mKnownAggregatableProps, mCustomAggregates, dataType) {
    const aAggregateProperties = [];
    if (Object.keys(mKnownAggregatableProps).includes(sKey)) {
      for (const sAggregatable in mKnownAggregatableProps[sKey]) {
        aAggregateProperties.push({
          name: "_fe_aggregatable_" + mKnownAggregatableProps[sKey][sAggregatable].name,
          label: mKnownAggregatableProps[sKey][sAggregatable].label || `${oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"]} (${sAggregatable})` || `${sKey} (${sAggregatable})`,
          sortable: sortRestrictionsInfo.propertyInfo[sKey] ? sortRestrictionsInfo.propertyInfo[sKey].sortable : true,
          filterable: false,
          groupable: false,
          aggregatable: true,
          path: sKey,
          dataType: dataType,
          aggregationMethod: sAggregatable,
          maxConditions: isMultiValueFilterExpression(oFilterRestrictionsInfo["FilterAllowedExpressions"]?.[sKey]?.[0]) ? -1 : 1,
          role: ChartItemRoleType.axis1,
          datapoint: null,
          //To be implemented by FE
          unitPath: oPropertyAnnotations["@Org.OData.Measures.V1.ISOCurrency"]?.$Path || oPropertyAnnotations["@Org.OData.Measures.V1.Unit"]?.$Path
        });
      }
    }
    if (Object.keys(mCustomAggregates).includes(sKey)) {
      for (const sCustom in mCustomAggregates) {
        if (sCustom === sKey) {
          const oItem = merge({}, mCustomAggregates[sCustom], {
            name: "_fe_aggregatable_" + sCustom,
            groupable: false,
            aggregatable: true,
            filterable: false,
            role: ChartItemRoleType.axis1,
            path: sCustom,
            dataType: dataType,
            datapoint: null,
            //To be implemented by FE
            unitPath: oPropertyAnnotations["@Org.OData.Measures.V1.ISOCurrency"]?.$Path || oPropertyAnnotations["@Org.OData.Measures.V1.Unit"]?.$Path
          });
          aAggregateProperties.push(oItem);
          break;
        }
      }
    }
    return aAggregateProperties;
  };
  ChartDelegate.rebind = function (oMDCChart, oBindingInfo) {
    const sSearch = oBindingInfo.parameters.$search;
    if (sSearch) {
      delete oBindingInfo.parameters.$search;
    }
    BaseChartDelegate.rebind(oMDCChart, oBindingInfo);
    if (sSearch) {
      const oInnerChart = oMDCChart.getControlDelegate().getInnerChart(oMDCChart),
        oChartBinding = oInnerChart && oInnerChart.getBinding("data");

      // Temporary workaround until this is fixed in MDCChart / UI5 Chart
      // In order to avoid having 2 OData requests, we need to suspend the binding before setting some aggregation properties
      // and resume it once the chart has added other aggregation properties (in onBeforeRendering)
      oChartBinding.suspend();
      oChartBinding.setAggregation({
        search: sSearch
      });
      const oInnerChartDelegate = {
        onBeforeRendering: function () {
          oChartBinding.resume();
          oInnerChart.removeEventDelegate(oInnerChartDelegate);
        }
      };
      oInnerChart.addEventDelegate(oInnerChartDelegate);
    }
    oMDCChart.fireEvent("bindingUpdated");
  };
  ChartDelegate._setChart = function (oMDCChart, oInnerChart) {
    const oChartAPI = oMDCChart.getParent();
    oInnerChart.setVizProperties(oMDCChart.data("vizProperties"));
    oInnerChart.detachSelectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.detachDeselectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.detachDrilledUp(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachSelectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachDeselectData(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.attachDrilledUp(oChartAPI.handleSelectionChange.bind(oChartAPI));
    oInnerChart.setSelectionMode(oMDCChart.getPayload().selectionMode.toUpperCase());
    BaseChartDelegate._setChart(oMDCChart, oInnerChart);
  };
  ChartDelegate._getBindingInfo = function (oMDCChart) {
    if (this._getBindingInfoFromState(oMDCChart)) {
      return this._getBindingInfoFromState(oMDCChart);
    }
    const oMetadataInfo = oMDCChart.getDelegate().payload;
    const oParams = merge({}, oMetadataInfo.parameters, {
      entitySet: oMDCChart.data("entitySet")
    });
    return {
      path: oMetadataInfo.chartContextPath,
      events: {
        dataRequested: oMDCChart.getParent().onInternalDataRequested.bind(oMDCChart.getParent())
      },
      parameters: oParams
    };
  };
  ChartDelegate.removeItemFromInnerChart = function (oMDCChart, oMDCChartItem) {
    BaseChartDelegate.removeItemFromInnerChart.call(this, oMDCChart, oMDCChartItem);
    if (oMDCChartItem.getType() === "groupable") {
      const oInnerChart = this.getInnerChart(oMDCChart);
      oInnerChart.fireDeselectData();
    }
  };
  ChartDelegate._getSortable = function (oMDCChart, sortRestrictionsProperty, bIsTransAggregate) {
    if (bIsTransAggregate) {
      if (oMDCChart.data("draftSupported") === "true") {
        return false;
      } else {
        return sortRestrictionsProperty ? sortRestrictionsProperty.sortable : true;
      }
    }
    return sortRestrictionsProperty ? sortRestrictionsProperty.sortable : true;
  };
  ChartDelegate._checkAndAddDraftFilter = function (oChart, oBindingInfo) {
    if (oChart.data("draftSupported") === "true") {
      if (!oBindingInfo) {
        oBindingInfo = {};
      }
      if (!oBindingInfo.filters) {
        oBindingInfo.filters = [];
        oBindingInfo.filters.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
      } else {
        oBindingInfo.filters?.aFilters?.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
      }
    }
  };

  /**
   * This function returns an ID which should be used in the internal chart for the measure or dimension.
   * For standard cases, this is just the ID of the property.
   * If it is necessary to use another ID internally inside the chart (e.g. on duplicate property IDs) this method can be overwritten.
   * In this case, <code>getPropertyFromNameAndKind</code> needs to be overwritten as well.
   * @param name ID of the property
   * @param kind Type of the property (measure or dimension)
   * @returns Internal ID for the sap.chart.Chart
   */
  ChartDelegate.getInternalChartNameFromPropertyNameAndKind = function (name, kind) {
    return name.replace("_fe_" + kind + "_", "");
  };

  /**
   * This maps an id of an internal chart dimension or measure & type of a property to its corresponding property entry.
   * @param name ID of internal chart measure or dimension
   * @param kind The kind of property that is used
   * @param mdcChart Reference to the MDC_Chart
   * @returns PropertyInfo object
   */
  ChartDelegate.getPropertyFromNameAndKind = function (name, kind, mdcChart) {
    return mdcChart.getPropertyHelper().getProperty("_fe_" + kind + "_" + name);
  };

  /**
   * Provide the chart's filter delegate to provide basic filter functionality such as adding FilterFields.
   * @returns Object for the personalization of the chart filter
   */
  ChartDelegate.getFilterDelegate = function () {
    return Object.assign({
      apiVersion: 2
    }, FilterBarDelegate, {
      addItem: async function (oParentControl, sPropertyInfoName) {
        const prop = ChartDelegate.getInternalChartNameFromPropertyNameAndKind(sPropertyInfoName, "groupable");
        return FilterBarDelegate.addItem(oParentControl, prop).then(oFilterItem => {
          oFilterItem?.bindProperty("conditions", {
            path: "$filters>/conditions/" + sPropertyInfoName
          });
          oFilterItem?.setPropertyKey(sPropertyInfoName);
          return oFilterItem;
        });
      }
    });
  };
  return ChartDelegate;
}, false);
//# sourceMappingURL=ChartDelegate-dbg.js.map
