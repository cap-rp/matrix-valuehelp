/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/fe/macros/CommonHelper", "sap/fe/macros/controls/filterbar/utils/VisualFilterUtils", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/FilterHelper", "sap/ui/core/Lib", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/mdc/util/FilterUtil", "sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (Log, ObjectPath, CommonHelper, VisualFilterUtils, FilterUtils, FilterHelper, Library, Condition, TypeMap, MdcFilterUtil, Filter, FilterOperator) {
  "use strict";

  var getFiltersConditionsFromSelectionVariant = FilterHelper.getFiltersConditionsFromSelectionVariant;
  /**
   * Static class used by Visual Filter during runtime
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const VisualFilterRuntime = {
    selectionChanged(oEvent) {
      const oInteractiveChart = oEvent.getSource();
      const sOutParameter = oInteractiveChart.data("outParameter");
      const sValueListProperty = oInteractiveChart.data("valuelistProperty");
      const sDimension = oInteractiveChart.data("dimension");
      const sDimensionText = oInteractiveChart.data("dimensionText");
      const bMultipleSelectionAllowed = oInteractiveChart.data("multipleSelectionAllowed");
      const sDimensionType = oInteractiveChart.data("dimensionType");
      const oSelectedAggregation = oEvent.getParameter("bar") || oEvent.getParameter("point") || oEvent.getParameter("segment");
      const bIsAggregationSelected = oEvent.getParameter("selected");
      const oConditionModel = oInteractiveChart.getModel("$field");
      let aConditions = oConditionModel.getProperty("/conditions");
      if (!sOutParameter || sValueListProperty !== sDimension) {
        Log.error("VisualFilter: Cannot sync values with regular filter as out parameter is not configured properly!");
      } else {
        let sSelectionChangedValue = oSelectedAggregation?.getBindingContext()?.getObject(sValueListProperty);
        if (sSelectionChangedValue) {
          let sSelectionChangedValueText = oSelectedAggregation?.getBindingContext()?.getObject(sDimensionText);
          if (typeof sSelectionChangedValueText !== "string" && !(sSelectionChangedValueText instanceof String)) {
            sSelectionChangedValueText = undefined;
          }
          // if selection has been done on the aggregation then add to conditions
          if (bIsAggregationSelected) {
            if (bMultipleSelectionAllowed === false) {
              aConditions = [];
            }
            if (sDimensionType === "Edm.DateTimeOffset") {
              sSelectionChangedValue = VisualFilterUtils._parseDateTime(sSelectionChangedValue);
            }
            const oCondition = Condition.createItemCondition(sSelectionChangedValue, sSelectionChangedValueText || undefined, {}, {});
            aConditions.push(oCondition);
          } else {
            // because selection was removed on the aggregation hence remove this from conditions
            aConditions = aConditions.filter(function (oCondition) {
              if (sDimensionType === "Edm.DateTimeOffset") {
                return oCondition.operator !== "EQ" || Date.parse(oCondition.values[0]) !== Date.parse(sSelectionChangedValue);
              }
              return oCondition.operator !== "EQ" || oCondition.values[0] !== sSelectionChangedValue;
            });
          }
          oConditionModel.setProperty("/conditions", aConditions);
        } else {
          Log.error("VisualFilter: No vaue found for the outParameter");
        }
      }
    },
    // THIS IS A FORMATTER
    getAggregationSelected(aConditions) {
      let aSelectableValues = [];
      if (!this.getBindingContext()) {
        return;
      }
      for (let i = 0; i <= aConditions.length - 1; i++) {
        const oCondition = aConditions[i];
        // 1. get conditions with EQ operator (since visual filter can only deal with EQ operators) and get their values
        if (oCondition.operator === "EQ") {
          aSelectableValues.push(oCondition.values[0]);
        }
      }

      // access the interactive chart from the control.
      const oInteractiveChart = this.getParent();
      const sDimension = oInteractiveChart.data("dimension");
      const sDimensionType = oInteractiveChart.data("dimensionType");
      let sDimensionValue = this.getBindingContext()?.getObject(sDimension);
      if (sDimensionType === "Edm.DateTimeOffset") {
        sDimensionValue = VisualFilterUtils._parseDateTime(sDimensionValue);
      }
      if (oInteractiveChart.data("multipleSelectionAllowed") === false && aSelectableValues.length > 1) {
        aSelectableValues = [aSelectableValues[0]];
      }
      return aSelectableValues.includes(sDimensionValue);
    },
    // THIS IS A FORMATTER
    getFiltersFromConditions() {
      for (var _len = arguments.length, aArguments = new Array(_len), _key = 0; _key < _len; _key++) {
        aArguments[_key] = arguments[_key];
      }
      const oInteractiveChart = this.getParent();
      const oFilterBar = oInteractiveChart.getParent()?.getParent()?.getParent()?.getParent()?.getParent();
      const aInParameters = oInteractiveChart.data("inParameters").customData;
      const bIsDraftSupported = oInteractiveChart.data("draftSupported") === true;
      const aPropertyInfoSet = FilterUtils.getFilterPropertyInfo(oFilterBar);
      const mConditions = {};
      const aValueListPropertyInfoSet = [];
      let oFilters;
      let aFilters = [];
      const aParameters = oInteractiveChart.data("parameters");
      const oSelectionVariantAnnotation = oInteractiveChart.data("selectionVariantAnnotation");
      const oInteractiveChartListBinding = oInteractiveChart.getBinding("bars") || oInteractiveChart.getBinding("points") || oInteractiveChart.getBinding("segments");
      const sPath = oInteractiveChartListBinding.getPath();
      const oMetaModel = oInteractiveChart.getModel().getMetaModel();
      const sEntitySetPath = oInteractiveChartListBinding.getPath();
      const filterConditions = getFiltersConditionsFromSelectionVariant(sEntitySetPath, oMetaModel, oSelectionVariantAnnotation, VisualFilterUtils.getCustomConditions.bind(VisualFilterUtils));
      for (const i in aPropertyInfoSet) {
        aPropertyInfoSet[i].typeConfig = TypeMap.getTypeConfig(aPropertyInfoSet[i].dataType, {}, {});
      }
      const oSelectionVariantConditions = VisualFilterUtils.convertFilterCondions(filterConditions);
      // aInParameters and the bindings to in parameters are in the same order so we can rely on it to create our conditions
      Object.keys(oSelectionVariantConditions).forEach(function (sKey) {
        mConditions[sKey] = oSelectionVariantConditions[sKey];
        //fetch localDataProperty if selection variant key is based on vaue list property
        const inParameterForKey = aInParameters.find(function (inParameter) {
          return inParameter.valueListProperty === sKey;
        });
        const localDataProperty = inParameterForKey ? inParameterForKey.localDataProperty : sKey;
        if (!aParameters || aParameters && !aParameters.includes(sKey)) {
          for (const i in aPropertyInfoSet) {
            const propertyInfoSet = aPropertyInfoSet[i];
            if (localDataProperty === propertyInfoSet.name) {
              if (propertyInfoSet?.typeConfig?.baseType === "DateTime") {
                if (mConditions[sKey]) {
                  mConditions[sKey].forEach(function (condition) {
                    condition.values[0] = VisualFilterUtils._formatDateTime(condition.values[0]);
                  });
                }
              }
              aValueListPropertyInfoSet.push({
                name: sKey,
                typeConfig: propertyInfoSet.typeConfig
              });
            }
          }
        }
      });
      aInParameters.forEach(function (oInParameter, index) {
        if (aArguments[index].length > 0) {
          // store conditions with value list property since we are filtering on the value list collection path
          mConditions[oInParameter.valueListProperty] = aArguments[index];
          if (!aParameters || aParameters && !aParameters.includes(oInParameter.valueListProperty)) {
            // aPropertyInfoSet is list of properties from the filter bar but we need to create conditions for the value list
            // which could have a different collectionPath.
            // Only typeConfig from aPropertyInfoSet is required for getting the converted filters from conditions
            // so we update aPropertyInfoSet to have the valueListProperties only
            // This way conditions will be converted to sap.ui.model.Filter for the value list
            // This works because for in parameter mapping the property from the main entity type should be of the same type as the value list entity type
            // TODO: Follow up with MDC to check if they can provide a clean api to convert conditions into filters
            for (const i in aPropertyInfoSet) {
              // store conditions with value list property since we are filtering on the value list collection path
              const propertyInfoSet = aPropertyInfoSet[i];
              if (propertyInfoSet.name === oInParameter.localDataProperty) {
                if (propertyInfoSet?.typeConfig?.baseType === "DateTime") {
                  if (mConditions[oInParameter.valueListProperty]) {
                    mConditions[oInParameter.valueListProperty].forEach(function (condition) {
                      condition.values[0] = VisualFilterUtils._formatDateTime(condition.values[0]);
                    });
                  }
                }
                aValueListPropertyInfoSet.push({
                  name: oInParameter.valueListProperty,
                  typeConfig: propertyInfoSet.typeConfig
                });
              }
            }
          }
        }
      });
      const oInternalModelContext = oInteractiveChart.getBindingContext("internal");
      const sInfoPath = oInteractiveChart.data("infoPath");
      let bEnableBinding;
      const oResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
      const aRequiredProperties = CommonHelper.parseCustomData(oInteractiveChart.data("requiredProperties"));
      if (aRequiredProperties.length) {
        const aConditions = Object.keys(mConditions) || [];
        const aNotMatchedConditions = [];
        aRequiredProperties.forEach(function (requiredPropertyPath) {
          if (!aConditions.includes(requiredPropertyPath)) {
            aNotMatchedConditions.push(requiredPropertyPath);
          }
        });
        if (!aNotMatchedConditions.length) {
          bEnableBinding = oInternalModelContext.getProperty(`${sInfoPath}/showError`);
          oInternalModelContext.setProperty(sInfoPath, {
            errorMessageTitle: "",
            errorMessage: "",
            showError: false
          });
        } else if (aNotMatchedConditions.length > 1) {
          oInternalModelContext.setProperty(sInfoPath, {
            errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
            errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF"),
            showError: true
          });
          return;
        } else {
          const sLabel = oMetaModel.getObject(`${sEntitySetPath}/${aNotMatchedConditions[0]}@com.sap.vocabularies.Common.v1.Label`) || aNotMatchedConditions[0];
          oInternalModelContext.setProperty(sInfoPath, {
            errorMessageTitle: oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
            errorMessage: oResourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF", sLabel),
            showError: true
          });
          return;
        }
      } else {
        bEnableBinding = oInternalModelContext.getProperty(`${sInfoPath}/showError`);
        oInternalModelContext.setProperty(sInfoPath, {
          errorMessageTitle: "",
          errorMessage: "",
          showError: false
        });
      }
      const sFilterEntityName = oFilterBar.data("entityType").split("/")[1];
      const sChartEntityName = sPath.split("/")[1].split("(")[0];
      if (aParameters && aParameters.length && sFilterEntityName === sChartEntityName) {
        const sBindingPath = bEnableBinding ? FilterUtils.getBindingPathForParameters(oFilterBar, mConditions, aPropertyInfoSet, aParameters) : undefined;
        if (sBindingPath) {
          oInteractiveChartListBinding.sPath = sBindingPath;
        }
      }
      if (aParameters && aParameters.length) {
        //Remove parameters from mConditions since it should not be a part of $filter
        aParameters.forEach(function (parameter) {
          if (mConditions[parameter]) {
            delete mConditions[parameter];
          }
        });
      }

      // On InitialLoad when initiallayout is visual, aPropertyInfoSet is always empty and we cannot get filters from MDCFilterUtil.
      // Also when SVQualifier is there then we should not change the listbinding filters to empty as we are not getting filters from MDCFilterUtil but
      // instead we need to not call listbinding.filter and use the template time binding itself.
      if (Object.keys(mConditions).length > 0 && aValueListPropertyInfoSet.length) {
        try {
          oFilters = MdcFilterUtil.getFilterInfo(oFilterBar, mConditions, aValueListPropertyInfoSet, []).filters;
        } catch (e) {
          Log.debug("VisualFilter: Error while getting filters from MDCFilterUtil");
        }
        if (oFilters) {
          if (!oFilters.getFilters()) {
            aFilters.push(oFilters);
          } else if (oFilters.getFilters()) {
            aFilters = oFilters.getFilters();
          }
        }
      }
      if (bIsDraftSupported) {
        aFilters.push(new Filter("IsActiveEntity", FilterOperator.EQ, true));
      }
      if (aFilters && aFilters.length > 0) {
        oInteractiveChartListBinding?.filter(aFilters);
      } else if (!Object.keys(mConditions).length) {
        oInteractiveChartListBinding?.filter();
      }
      // update the interactive chart binding
      if (bEnableBinding && oInteractiveChartListBinding?.isSuspended()) {
        oInteractiveChartListBinding?.resume();
      }
      return aFilters;
    },
    getFilterCounts(oConditions) {
      if (this.data("multipleSelectionAllowed") === false && oConditions.length > 0) {
        return `(1)`;
      }
      if (oConditions.length > 0) {
        return `(${oConditions.length})`;
      } else {
        return undefined;
      }
    },
    scaleVisualFilterValue(oValue, scaleFactor, numberOfFractionalDigits, currency, oRawValue) {
      // ScaleFactor if defined is priority for formatting
      if (scaleFactor) {
        return VisualFilterUtils.getFormattedNumber(oRawValue, scaleFactor, numberOfFractionalDigits);
        // If Scale Factor is not defined, use currency formatting
      } else if (currency) {
        return VisualFilterUtils.getFormattedNumber(oRawValue, undefined, undefined, currency);
        // No ScaleFactor and no Currency, use numberOfFractionalDigits defined in DataPoint
      } else if (numberOfFractionalDigits > 0) {
        // Number of fractional digits shall not exceed 2, unless required by currency
        numberOfFractionalDigits = numberOfFractionalDigits > 2 ? 2 : numberOfFractionalDigits;
        return VisualFilterUtils.getFormattedNumber(oRawValue, undefined, numberOfFractionalDigits);
      } else {
        return oValue;
      }
    },
    fireValueHelp(oEvent) {
      oEvent.getSource().getParent()?.getParent()?.getParent()?.getParent()?.fireEvent("valueHelpRequest");
    }
  };
  ObjectPath.set("sap.fe.macros.visualfilters.VisualFilterRuntime", VisualFilterRuntime);
  return VisualFilterRuntime;
}, false);
//# sourceMappingURL=VisualFilterRuntime-dbg.js.map
