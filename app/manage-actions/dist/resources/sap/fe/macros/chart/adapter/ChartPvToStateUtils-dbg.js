/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  const PresentationVariantToStateUtilsPV = {
    /**
     * Get StateUtil PV structure from the supplied Presentation Variant.
     * @param presentationVariant Presentation Variant to set
     * @param existingPresentationVariant the existing Presentation Variant of the chart to be overridden
     * @param propertiesInfo Property infos of the Chart
     * @returns StateUtil PresentationVariant format
     */

    convertPvToStateUtilPv: (presentationVariant, existingPresentationVariant, propertiesInfo) => {
      const visChart = presentationVariant.getChartVisualization();
      const properties = presentationVariant.getProperties();
      const currentVisChart = existingPresentationVariant.getChartVisualization();
      const currentProperties = existingPresentationVariant.getProperties();
      let sorters = [];
      let items = [];
      sorters = PresentationVariantToStateUtilsPV._overrideExistingSorters(properties?.SortOrder ?? [], currentProperties?.SortOrder ?? [], propertiesInfo ?? []);
      items = PresentationVariantToStateUtilsPV._overrideExistingItems(visChart, currentVisChart);
      return {
        items,
        sorters,
        supplementaryConfig: {
          properties: {
            chartType: PresentationVariantToStateUtilsPV._getCharsAfterSlashInLowerCase(visChart?.Content?.ChartType)
          }
        }
      };
    },
    /**
     * Method to return suffix after forward slash in lower case.
     * @param str input string
     * @returns The string containing suffix after slash.
     */

    _getCharsAfterSlashInLowerCase: str => {
      if (str == undefined) {
        return undefined;
      }
      return str.split("/")[1].toLowerCase();
    },
    /**
     * Method to add prefix to chart properties based on role.
     * @param propertyName string
     * @param propertiesInfo propertiesInfo of the chart
     * @returns propertyName with prefix added
     */

    _getPropertyNameWithPrefix: (propertyName, propertiesInfo) => {
      let propertyNameWithPrefix;
      for (const chartProperty of propertiesInfo) {
        propertyNameWithPrefix = chartProperty.name;
        if (propertyNameWithPrefix?.includes(propertyName)) {
          break;
        }
      }
      return propertyNameWithPrefix ?? propertyName;
    },
    /**
     * Method to return list of Sorters for StateUtils by overriding existing sorters.
     * @param sorters sorters in the applied Presentation Variant
     * @param existingSorters existing sorters in the chart
     * @param propertiesInfo propertiesInfo of the chart
     * @returns list of sorter objects for stateUtils
     */

    _overrideExistingSorters: (sorters, existingSorters, propertiesInfo) => {
      const sorterPropertyNames = [];
      const newSorters = sorters.map(sorter => {
        sorterPropertyNames.push(sorter.Property);
        return {
          descending: sorter.Descending,
          key: PresentationVariantToStateUtilsPV._getPropertyNameWithPrefix(sorter.Property, propertiesInfo),
          name: PresentationVariantToStateUtilsPV._getPropertyNameWithPrefix(sorter.Property, propertiesInfo)
        };
      });
      const existingSortersRes = existingSorters.filter(sorter => !sorterPropertyNames.includes(sorter.Property)).map(sorter => ({
        descending: sorter.Descending,
        key: PresentationVariantToStateUtilsPV._getPropertyNameWithPrefix(sorter.Property, propertiesInfo),
        name: PresentationVariantToStateUtilsPV._getPropertyNameWithPrefix(sorter.Property, propertiesInfo),
        sorted: false
      }));
      return [...newSorters, ...existingSortersRes];
    },
    /**
     * Method to return Items aggregation for StateUtils by overriding existing items both measures and dimensions.
     * @param visChart visualization for chart to be set
     * @param currentVisChart visualization for existing chart
     * @returns aggregated items in stateUtils structure
     */

    _overrideExistingItems: (visChart, currentVisChart) => {
      const finalItemsMeasures = PresentationVariantToStateUtilsPV._overrideExistingItemsMeasures(visChart, currentVisChart);
      const finalItemsDimensions = PresentationVariantToStateUtilsPV._overrideExistingItemsDimensions(visChart, currentVisChart);
      return [...finalItemsMeasures, ...finalItemsDimensions];
    },
    /**
     * Method to return Items aggregation for StateUtils by overriding existing items measures.
     * @param visChart visualization for chart to be set
     * @param currentVisChart visualization for existing chart
     * @returns aggregated items in stateUtils structure
     */

    _overrideExistingItemsMeasures: (visChart, currentVisChart) => {
      const itemsMeasuresPropertyNames = [];
      const itemsMeasures = visChart?.Content?.MeasureAttributes.map(measure => {
        itemsMeasuresPropertyNames.push(measure.Measure);
        return {
          name: "_fe_aggregatable_" + measure.Measure,
          role: PresentationVariantToStateUtilsPV._getCharsAfterSlashInLowerCase(measure.Role)
        };
      }) ?? [];
      const existingItemsMeasures = currentVisChart?.Content?.MeasureAttributes.filter(measure => !itemsMeasuresPropertyNames.includes(measure.Measure)).map(measure => ({
        name: "_fe_aggregatable_" + measure.Measure,
        role: PresentationVariantToStateUtilsPV._getCharsAfterSlashInLowerCase(measure.Role),
        visible: false
      })) ?? [];
      return [...itemsMeasures, ...existingItemsMeasures];
    },
    /**
     * Method to return Items aggregation for StateUtils by overriding existing items dimensions.
     * @param visChart visualization for chart to be set
     * @param currentVisChart visualization for existing chart
     * @returns aggregated items in stateUtils structure
     */

    _overrideExistingItemsDimensions: (visChart, currentVisChart) => {
      const itemsDimensionsPropertyNames = [];
      const itemsDimensions = visChart?.Content?.DimensionAttributes.map(dimension => {
        itemsDimensionsPropertyNames.push(dimension.Dimension);
        return {
          name: "_fe_groupable_" + dimension.Dimension,
          role: PresentationVariantToStateUtilsPV._getCharsAfterSlashInLowerCase(dimension.Role)
        };
      }) ?? [];
      const existingItemsDimensions = currentVisChart?.Content?.DimensionAttributes.filter(dimension => !itemsDimensionsPropertyNames.includes(dimension.Dimension)).map(dimension => ({
        name: "_fe_groupable_" + dimension.Dimension,
        role: PresentationVariantToStateUtilsPV._getCharsAfterSlashInLowerCase(dimension.Role),
        visible: false
      })) ?? [];
      return [...itemsDimensions, ...existingItemsDimensions];
    }
  };
  return {
    convertPvToStateUtilPv: PresentationVariantToStateUtilsPV.convertPvToStateUtilPv
  };
}, false);
//# sourceMappingURL=ChartPvToStateUtils-dbg.js.map
