/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/helpers/Aggregation", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/FilterTemplating"], function (BindingToolkit, Aggregation, IssueManager, TypeGuards, DataModelPathHelper, FilterTemplating) {
  "use strict";

  var _exports = {};
  var isPropertyFilterable = FilterTemplating.isPropertyFilterable;
  var getIsRequired = FilterTemplating.getIsRequired;
  var checkFilterExpressionRestrictions = DataModelPathHelper.checkFilterExpressionRestrictions;
  var isEntitySet = TypeGuards.isEntitySet;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var AggregationHelper = Aggregation.AggregationHelper;
  var not = BindingToolkit.not;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Checks that measures and dimensions of the visual filter chart can be aggregated and grouped.
   * @param converterContext The converter context
   * @param chartAnnotation The chart annotation
   * @param aggregationHelper The aggregation helper
   * @returns `true` if the measure can be grouped and aggregated
   */
  const _checkVFAggregation = function (converterContext, chartAnnotation, aggregationHelper) {
    let sMeasurePath, bGroupable, bAggregatable;
    let sMeasure;
    const customAggregates = aggregationHelper.getCustomAggregateDefinitions();
    let aTransAggregations = aggregationHelper.getTransAggregations();
    let aCustAggMeasure = [];
    // if the chart definition has custom aggregates, then consider them, else fall back to the measures with transformation aggregates
    if (chartAnnotation?.$target?.Measures) {
      aCustAggMeasure = customAggregates.filter(function (custAgg) {
        return custAgg.qualifier === chartAnnotation?.$target?.Measures?.[0]?.value;
      });
      sMeasure = aCustAggMeasure.length > 0 ? aCustAggMeasure[0].qualifier : chartAnnotation?.$target?.Measures?.[0]?.value;
    }
    // consider dynamic measures only if there are no measures with custom aggregates
    if (!aCustAggMeasure[0] && chartAnnotation?.$target?.DynamicMeasures) {
      sMeasure = converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(chartAnnotation.$target.DynamicMeasures?.[0]?.value)).getDataModelObjectPath().targetObject?.Name.toString();
      aTransAggregations = aggregationHelper.getAggregatedProperty();
    } else {
      aTransAggregations = aggregationHelper.getAggregatedProperties()[0];
    }
    const sDimension = chartAnnotation?.$target?.Dimensions[0]?.value;
    if (customAggregates.some(function (custAgg) {
      return custAgg.qualifier === sMeasure;
    })) {
      // Custom aggregate match found
      sMeasurePath = sMeasure;
      bAggregatable = true;
    } else if (aTransAggregations && aTransAggregations[0]) {
      aTransAggregations.some(function (oAggregate) {
        if (oAggregate.Name === sMeasure) {
          sMeasurePath = oAggregate?.AggregatableProperty.value;
        }
      });
    }
    if (!bAggregatable) {
      const aAggregatablePropsFromContainer = aggregationHelper.getAggregatableProperties();
      if (aAggregatablePropsFromContainer && aAggregatablePropsFromContainer.length) {
        for (const aggregatableProp of aAggregatablePropsFromContainer) {
          if (aggregatableProp?.Property?.value === sMeasurePath) {
            bAggregatable = true;
          }
        }
      }
    }
    const aGroupablePropsFromContainer = aggregationHelper.getGroupableProperties();
    if (aGroupablePropsFromContainer && aGroupablePropsFromContainer.length) {
      for (const groupableProp of aGroupablePropsFromContainer) {
        if (groupableProp?.value === sDimension) {
          bGroupable = true;
        }
      }
    }
    return bAggregatable && bGroupable;
  };
  /**
   * Method to get the visual filters object for a property.
   * @param entityType The converter context
   * @param converterContext The chart annotation
   * @param sPropertyPath The aggregation helper
   * @param FilterFields The aggregation helper
   * @returns The visual filters
   */
  function getVisualFilters(entityType, converterContext, sPropertyPath, FilterFields) {
    let visualFilter;
    const oVisualFilter = FilterFields[sPropertyPath];
    if (oVisualFilter?.visualFilter?.valueList) {
      const oVFPath = oVisualFilter?.visualFilter?.valueList;
      const annotationQualifierSplit = oVFPath.split("#");
      const qualifierVL = annotationQualifierSplit.length > 1 ? `ValueList#${annotationQualifierSplit[1]}` : annotationQualifierSplit[0];
      const property = entityType.resolvePath(sPropertyPath);
      const valueList = property?.annotations?.Common?.[qualifierVL];
      const isValueListWithFixedValues = property?.annotations?.Common?.ValueListWithFixedValues?.valueOf() || false;
      if (valueList) {
        const collectionPath = valueList?.CollectionPath.toString();
        const collectionPathConverterContext = converterContext.getConverterContextFor(`/${collectionPath || converterContext.getEntitySet()?.name}`);
        const valueListParams = valueList?.Parameters;
        let outParameter;
        const inParameters = [];
        let aParameters = [];
        const parameterEntityType = collectionPathConverterContext.getParameterEntityType();
        aParameters = parameterEntityType ? parameterEntityType.keys.map(function (key) {
          return key.name;
        }) : [];
        if (converterContext.getContextPath() === collectionPathConverterContext.getContextPath()) {
          _addInParameters(inParameters, aParameters, true);
        }
        if (valueListParams) {
          for (const valueListParam of valueListParams) {
            const localDataProperty = valueListParam.LocalDataProperty?.value;
            const valueListProperty = valueListParam.ValueListProperty;
            if ((valueListParam?.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || valueListParam?.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterOut") && sPropertyPath === localDataProperty) {
              outParameter = valueListParam;
            }
            if ((valueListParam?.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterInOut" || valueListParam?.$Type === "com.sap.vocabularies.Common.v1.ValueListParameterIn") && sPropertyPath !== localDataProperty) {
              const bNotFilterable = isPropertyFilterable(collectionPathConverterContext, valueListProperty);
              if (!bNotFilterable) {
                inParameters.push({
                  localDataProperty: localDataProperty,
                  valueListProperty: valueListProperty
                });
              }
            }
          }
        }
        if (inParameters && inParameters.length) {
          inParameters.forEach(function (oInParameter) {
            const mainEntitySetInMappingAllowedExpression = compileExpression(checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(oInParameter?.localDataProperty)).getDataModelObjectPath(), ["SingleValue"]));
            const valueListEntitySetInMappingAllowedExpression = compileExpression(checkFilterExpressionRestrictions(collectionPathConverterContext.getConverterContextFor(collectionPathConverterContext.getAbsoluteAnnotationPath(oInParameter?.valueListProperty)).getDataModelObjectPath(), ["SingleValue"]));
            if (valueListEntitySetInMappingAllowedExpression === "true" && mainEntitySetInMappingAllowedExpression === "false") {
              throw new Error(`FilterRestrictions of ${sPropertyPath} in MainEntitySet and ValueListEntitySet are different`);
            }
          });
        }
        const pvQualifier = valueList?.PresentationVariantQualifier;
        const svQualifier = valueList?.SelectionVariantQualifier;
        const pvAnnotation = collectionPathConverterContext?.getEntityType().annotations.UI?.[`PresentationVariant#${pvQualifier}`];
        const aggregationHelper = new AggregationHelper(collectionPathConverterContext.getEntityType(), collectionPathConverterContext);
        if (!aggregationHelper.isAnalyticsSupported()) {
          return undefined;
        }
        if (pvAnnotation) {
          const aVisualizations = pvAnnotation?.Visualizations;
          const contextPath = `/${valueList?.CollectionPath}` || `/${collectionPathConverterContext?.getEntitySet()?.name}`;
          visualFilter = {};
          visualFilter.contextPath = contextPath;
          visualFilter.isValueListWithFixedValues = isValueListWithFixedValues;
          let chartAnnotation;
          for (const visualization of aVisualizations) {
            if (visualization.$target?.term === "com.sap.vocabularies.UI.v1.Chart") {
              chartAnnotation = visualization;
              break;
            }
          }
          if (chartAnnotation) {
            const _bgetVFAggregation = _checkVFAggregation(collectionPathConverterContext, chartAnnotation, aggregationHelper);
            if (!_bgetVFAggregation) {
              return;
            }
            const bDimensionHidden = chartAnnotation?.$target?.Dimensions[0]?.$target?.annotations?.UI?.Hidden?.valueOf();
            const bDimensionHiddenFilter = chartAnnotation?.$target?.Dimensions[0]?.$target?.annotations?.UI?.HiddenFilter?.valueOf();
            if (bDimensionHidden === true || bDimensionHiddenFilter === true) {
              return;
            } else if (aVisualizations && aVisualizations.length) {
              visualFilter.chartAnnotation = chartAnnotation.$target ? collectionPathConverterContext?.getAbsoluteAnnotationPath(`${chartAnnotation.$target.fullyQualifiedName}/$AnnotationPath/`) : undefined;
              // This needs to be done to avoid repetitive entity type in case of non-parameterized entity set e.g /SalesOrderManage/com.c_salesordermanage_sd_aggregate.SalesOrderManage
              const entitySetName = collectionPathConverterContext.getEntitySet()?.name;
              let presentationAnnotation;
              const relativeAnnotationPath = collectionPathConverterContext?.getRelativeAnnotationPath(`${pvAnnotation.fullyQualifiedName}/`, collectionPathConverterContext.getEntityType());
              if (parameterEntityType) {
                presentationAnnotation = collectionPathConverterContext.getContextPath() + "/" + relativeAnnotationPath;
              } else {
                presentationAnnotation = "/" + entitySetName + "/" + relativeAnnotationPath;
              }
              visualFilter.presentationAnnotation = pvAnnotation ? presentationAnnotation : undefined;
              visualFilter.outParameter = outParameter?.LocalDataProperty?.value;
              visualFilter.inParameters = inParameters;
              visualFilter.valuelistProperty = outParameter?.ValueListProperty;
              const bIsRange = checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(sPropertyPath)).getDataModelObjectPath(), ["SingleRange", "MultiRange"]);
              if (compileExpression(bIsRange) === "true") {
                converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
                return undefined;
              }
              const bIsMainEntitySetSingleSelection = checkFilterExpressionRestrictions(converterContext.getConverterContextFor(converterContext.getAbsoluteAnnotationPath(sPropertyPath)).getDataModelObjectPath(), ["SingleValue"]);
              visualFilter.multipleSelectionAllowed = compileExpression(not(bIsMainEntitySetSingleSelection));
              visualFilter.required = getIsRequired(converterContext, sPropertyPath);
              let svAnnotation;
              if (svQualifier) {
                svAnnotation = collectionPathConverterContext?.getEntityTypeAnnotation(`@UI.SelectionVariant#${svQualifier}`)?.annotation;
                let selectionVariantAnnotation;
                const relativeSelectionVariantPath = collectionPathConverterContext?.getRelativeAnnotationPath(`${svAnnotation?.fullyQualifiedName}/`, collectionPathConverterContext.getEntityType());
                if (parameterEntityType) {
                  selectionVariantAnnotation = collectionPathConverterContext.getContextPath() + "/" + relativeSelectionVariantPath;
                } else {
                  selectionVariantAnnotation = "/" + entitySetName + "/" + relativeSelectionVariantPath;
                }
                visualFilter.selectionVariantAnnotation = svAnnotation ? selectionVariantAnnotation : undefined;
              }
              let requiredProperties = [];
              if (parameterEntityType) {
                const sEntitySet = collectionPath.split("/")[0];
                const sNavigationProperty = collectionPath.split("/")[1];
                const oEntitySetConverterContext = converterContext.getConverterContextFor(`/${sEntitySet}`);
                const aRestrictedProperties = oEntitySetConverterContext?.getDataModelObjectPath().startingEntitySet?.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties;
                const oRestrictedProperty = aRestrictedProperties?.find(restrictedNavProp => {
                  if (restrictedNavProp.NavigationProperty?.type === "NavigationPropertyPath") {
                    return restrictedNavProp.NavigationProperty.value === sNavigationProperty;
                  }
                });
                requiredProperties = oRestrictedProperty?.FilterRestrictions?.RequiredProperties ?? [];
              } else {
                const entitySetOrSingleton = collectionPathConverterContext?.getEntitySet();
                if (isEntitySet(entitySetOrSingleton)) {
                  requiredProperties = entitySetOrSingleton.annotations.Capabilities?.FilterRestrictions?.RequiredProperties ?? [];
                }
              }
              let requiredPropertyPaths = [];
              if (requiredProperties?.length) {
                requiredProperties.forEach(function (oRequireProperty) {
                  requiredPropertyPaths.push(oRequireProperty.value);
                });
              }
              requiredPropertyPaths = requiredPropertyPaths.concat(aParameters);
              visualFilter.requiredProperties = requiredPropertyPaths;
              if (converterContext.getContextPath() === collectionPathConverterContext.getContextPath()) {
                // if context Path for both visual filter and filter bar are same, consider required Properties as well along with in Parameters
                _addInParameters(inParameters, requiredProperties, false);
              }
              if (visualFilter.requiredProperties?.length) {
                if (!visualFilter.inParameters || !visualFilter.inParameters.length) {
                  if (!visualFilter.selectionVariantAnnotation) {
                    visualFilter.showOverlayInitially = true;
                  } else {
                    let selectOptions = svAnnotation?.SelectOptions?.reduce((results, oSelectOption) => {
                      if (oSelectOption.PropertyName?.value) {
                        results.push(oSelectOption.PropertyName.value);
                      }
                      return results;
                    }, []) ?? [];
                    const parameterOptions = svAnnotation?.Parameters?.map(oParameterOption => oParameterOption.PropertyName?.value) || [];
                    selectOptions = selectOptions.concat(parameterOptions);
                    requiredPropertyPaths = requiredPropertyPaths.sort((a, b) => a.localeCompare(b));
                    selectOptions = selectOptions.sort((a, b) => a.localeCompare(b));
                    visualFilter.showOverlayInitially = requiredPropertyPaths.some(function (sPath) {
                      return !selectOptions.includes(sPath);
                    });
                  }
                } else {
                  visualFilter.showOverlayInitially = false;
                }
              } else {
                visualFilter.showOverlayInitially = false;
              }
              const sDimensionType = chartAnnotation?.$target?.Dimensions[0]?.$target?.type;
              visualFilter.renderLineChart = sDimensionType === "Edm.DateTimeOffset" || sDimensionType === "Edm.Date" || sDimensionType === "Edm.TimeOfDay" || chartAnnotation.$target?.ChartType !== "UI.ChartType/Line";
            }
          } else {
            converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.CHART);
            return;
          }
        } else {
          converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.PRESENTATIONVARIANT);
        }
      } else {
        converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
      }
    } else {
      converterContext.getDiagnostics().addIssue(IssueCategory.Manifest, IssueSeverity.High, IssueType.MALFORMED_VISUALFILTERS.VALUELIST);
    }
    return visualFilter;
  }

  /**
   * Method to add inparameters from required properties and parameters.
   * @param inParams An array containing existing inparams
   * @param properties An array containing either requiredproperties or parameters
   * @param isParam A boolean flag indicating whether passed properties are parameters
   */
  _exports.getVisualFilters = getVisualFilters;
  function _addInParameters(inParams, properties, isParam) {
    properties.forEach(function (element) {
      const property = isParam ? element : element.value;
      inParams.push({
        localDataProperty: property,
        valueListProperty: property
      });
    });
  }
  _exports._addInParameters = _addInParameters;
  return _exports;
}, false);
//# sourceMappingURL=VisualFilters-dbg.js.map
