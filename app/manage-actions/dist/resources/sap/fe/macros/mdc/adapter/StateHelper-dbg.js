/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/filterBar/DraftEditState", "sap/fe/macros/mdc/adapter/SelectionVariantToStateFilters", "sap/fe/macros/mdc/adapter/StateFilterToSelectionVariant", "sap/fe/navigation/SelectionVariant", "sap/ui/mdc/p13n/StateUtil"], function (Log, deepClone, PropertyHelper, DraftEditState, svToStateFilters, StateFiltersToSelectionVariant, SelectionVariant, StateUtil) {
  "use strict";

  /**
   * This is to extend MDC control APIs for filter, table, chart building blocks.
   * @public
   */

  const StateHelper = {
    /**
     * Gets selection variant from the mdc control.
     * @param control The control for which Selection Variant is to be fetched
     * @returns A promise which resolves with a {@link sap.fe.navigation.SelectionVariant}
     * @public
     */
    async getSelectionVariant(control) {
      try {
        const controlState = await StateUtil.retrieveExternalState(control);
        const controlObject = controlState.filter;
        let parameters = [];
        if (control?.getParent()?.isA("sap.fe.macros.filterBar.FilterBarAPI") && control.getParent().getParameters !== undefined) {
          parameters = control.getParent().getParameters();
        }
        const selectionVariant = StateFiltersToSelectionVariant.getSelectionVariantFromConditions(controlObject, control.getPropertyHelper(), parameters);
        if (control?.isA("sap.ui.mdc.Chart")) {
          const externalSV = new SelectionVariant();
          const selectOptions = selectionVariant._getSelectOptions();
          for (const property in selectOptions) {
            externalSV.massAddSelectOption(property.split("_fe_groupable_")[1], selectOptions[property]);
          }
          return externalSV;
        } else {
          return selectionVariant;
        }
      } catch (error) {
        const id = control?.getId();
        const message = error instanceof Error ? error.message : String(error);
        Log.error(`Building Block (${id}) - get selection variant failed : ${message}`);
        throw Error(message);
      }
    },
    /**
     * Convert selection variant to conditions.
     * @param control Control can be a table, chart or filter bar
     * @param selectionVariant The selection variant to apply to the table or chart or filter bar.
     * @param prefillDescriptions If true, we try to find the associated Text value for each property in the selectionVariant (to avoid fetching it from the server)
     * @param model The control model
     * @returns A promise resolving to conditions
     */
    async convertSelectionVariantToStateFilters(control, selectionVariant, prefillDescriptions, model) {
      // Note: This method is private and restricted to usage by sap.fe(ViewState controller extension) for filter bar/ chart / table state scenarios.
      const propertyInfos = await this._getSupportedFilterFields(control);
      if (!propertyInfos.length) {
        throw new Error("No valid metadata properties present for filter bar");
      }
      const filterBarInfoForConversion = this._getControlInfoForConversion(control);
      const metaModel = model?.getMetaModel();
      const copyofPropertyInfos = JSON.parse(JSON.stringify(propertyInfos));
      const updatedPropertyInfos = this._updatePropertyInfoToSupportSV(control, copyofPropertyInfos);
      const conditions = svToStateFilters.getStateFiltersFromSV(selectionVariant, filterBarInfoForConversion, updatedPropertyInfos ?? copyofPropertyInfos, prefillDescriptions, metaModel);
      return conditions;
    },
    /**
     * Get the filter information needed for the conversion of selection variant to conditions.
     * @param control This can be a table, chart, or filterbar
     * @returns The control information (metaModel, contextPath, use of semantic date range, all filter fields config)
     */
    _getControlInfoForConversion(control) {
      const metaModel = control.getModel()?.getMetaModel(),
        contextPath = control.data("entityType");
      if (control.isA("sap.fe.macros.controls.FilterBar")) {
        const useSemanticDateRange = control.data("useSemanticDateRange") === "true" || control.data("useSemanticDateRange") === true,
          viewDataInstance = control.getModel("viewData"),
          viewData = viewDataInstance.getData(),
          config = viewData?.controlConfiguration,
          selectionFieldsConfigs = config?.["@com.sap.vocabularies.UI.v1.SelectionFields"],
          filterFieldsConfig = selectionFieldsConfigs?.filterFields;
        return {
          metaModel,
          contextPath,
          useSemanticDateRange,
          filterFieldsConfig,
          selectionFieldsConfigs
        };
      } else {
        return {
          metaModel,
          contextPath
        };
      }
    },
    /**
     * Get supported filter field properties from the table, chart, or filter bar.
     * @param control Control can be a table, chart, or filter bar
     * @returns Supported filter fields.
     */
    async _getSupportedFilterFields(control) {
      if (control.isA("sap.ui.mdc.Filterbar")) {
        await control.waitForInitialization();
        return control.getControlDelegate().fetchFilterProperties(control);
      } else if (control.isA("sap.fe.macros.controls.FilterBar")) {
        return control.getControlDelegate().fetchFilterProperties(control);
      } else {
        await control.awaitControlDelegate();
      }
      return control.getControlDelegate().fetchProperties(control);
    },
    /**
     * Clears all input values of visible filter fields in the table, chart, or filter bar..
     * @param controlInstance This can be a filter bar, chart, or table.
     */
    async clearFilterValues(controlInstance) {
      await this._clearFilterValuesWithOptions(controlInstance.content);
      // Allow app developers to update filters after clearing
      controlInstance.fireEvent("afterClear");
    },
    /**
     * Clears all input values of visible filter fields in the table, chart, or filter bar.
     * @param control This can be a table, chart, or filter bar
     * @param options Options for filtering the filter bar
     * @param options.clearEditFilter Whether to clear the edit filter or retain the default value 'All'
     */
    async _clearFilterValuesWithOptions(control, options) {
      if (!control) {
        return;
      }
      const state = await StateUtil.retrieveExternalState(control);
      let editStatePath = "",
        currentEditStateCondition,
        editStateDefaultValue,
        currentEditStateIsDefault,
        shouldClearEditFilter;
      if (control.isA("sap.ui.mdc.FilterBar")) {
        editStatePath = "$editState";
        editStateDefaultValue = DraftEditState.ALL.id;
        currentEditStateCondition = deepClone(state.filter[editStatePath]?.[0]);
        currentEditStateIsDefault = currentEditStateCondition?.values[0] === editStateDefaultValue;
        shouldClearEditFilter = options && Object.keys(options).length > 0 && options.clearEditFilter;
      }

      // Clear all conditions
      for (const conditionPath of Object.keys(state.filter)) {
        if (!shouldClearEditFilter && conditionPath === editStatePath && currentEditStateIsDefault) {
          // Do not clear edit state condition if it is already "ALL"
          continue;
        }
        for (const condition of state.filter[conditionPath]) {
          condition.filtered = false;
        }
      }
      await StateUtil.applyExternalState(control, {
        filter: state.filter
      });
      if (control.isA("sap.ui.mdc.FilterBar")) {
        // Set edit state to 'ALL' if it wasn't before
        if (!shouldClearEditFilter && currentEditStateCondition && !currentEditStateIsDefault) {
          currentEditStateCondition.values = [editStateDefaultValue];
          await StateUtil.applyExternalState(control, {
            filter: {
              [editStatePath]: [currentEditStateCondition]
            }
          });
        }

        //clear filter fields in error state
        control.cleanUpAllFilterFieldsInErrorState();
      }
    },
    /**
     * Method returns the copy of propertyInfo by adding necessary fields so that selection variant can be set to a control like table and chart.
     * @param control This could be a table, chart, or filter bar
     * @param propertyInfos Array of PropertyInfo of the control
     * @returns The deep clone of propertyInfos with some additional fields
     */
    _updatePropertyInfoToSupportSV(control, propertyInfos) {
      if (control.isA("sap.ui.mdc.FilterBar")) {
        return propertyInfos;
      }
      propertyInfos.forEach(propertyInfo => {
        if (control.isA("sap.ui.mdc.Table")) {
          propertyInfo["conditionPath"] = propertyInfo.name;
          propertyInfo["annotationPath"] = propertyInfo.metadataPath ? propertyInfo.metadataPath : "";
          propertyInfo["hasValueHelp"] = PropertyHelper.hasValueHelp(control.getPropertyHelper().getProperty(propertyInfo.name));
          propertyInfo["dataType"] = propertyInfo?.typeConfig?.className;
        } else if (control.isA("sap.ui.mdc.Chart")) {
          if (propertyInfo.path) {
            propertyInfo["name"] = propertyInfo.path;
            propertyInfo["conditionPath"] = propertyInfo.path;
            const property = control.getParent()?.getPropertyDataModel(propertyInfo.path)?.targetObject;
            propertyInfo["hasValueHelp"] = property ? PropertyHelper.hasValueHelp(property) : false;
            propertyInfo["dataType"] = propertyInfo?.typeConfig?.className || propertyInfo.dataType;
          }
        }
      });
      return propertyInfos;
    },
    /**
     * Sets selection variant to the table. Note: setSelectionVariant will clear the existing filters and then apply the SelectionVariant values.
     * @param controlInstance This could be a table, chart, or filter bar
     * @param selectionVariant The selection variant to apply to the respective mdc controls
     * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the selectionVariant) to display the filter value descriptions, instead of loading them from the backend
     * @returns A promise for asynchronous handling
     * @public
     */
    async setSelectionVariantToMdcControl(controlInstance, selectionVariant) {
      let prefillDescriptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      try {
        const state = await StateUtil.retrieveExternalState(controlInstance);
        if (!state.filter) {
          Log.error(`FE : setSelectionVariant API cannot be applied on : ${controlInstance?.getId()}`);
          return;
        }
        const conditions = await this.convertSelectionVariantToStateFilters(controlInstance, selectionVariant, prefillDescriptions, controlInstance?.getModel());

        // Clear filter of table before applying selection variant
        await this.clearFilterValues(controlInstance?.getParent());

        // State to apply
        const propertyInfos = await this._getSupportedFilterFields(controlInstance);
        const stateToApply = svToStateFilters.getStateToApply(propertyInfos, conditions);
        if (controlInstance?.isA("sap.ui.mdc.Chart")) {
          this.convertConditionsForChart(stateToApply);
        }
        return await StateUtil.applyExternalState(controlInstance, stateToApply);
      } catch (err) {
        const id = controlInstance?.getId();
        const message = err instanceof Error ? err.message : String(err);
        Log.error(`FE : BuildingBlock (${id}) - set selection variant failed  : ${message}`);
        throw Error(message);
      }
    },
    /**
     * Convert the chart properties to internal properties before applying the conditions.
     * @param stateToApply This contains the information regarding filter and conditions
     */
    convertConditionsForChart(stateToApply) {
      // replace keys of filter object from "SalesOder" to internal format "_fe_groupable_SalesOrder"
      for (const property in stateToApply.filter) {
        delete Object.assign(stateToApply.filter, {
          ["_fe_groupable_" + property]: stateToApply.filter[property]
        })[property];
      }
      // replace keys of items array from "SalesOder" to internal format "_fe_groupable_SalesOrder"
      stateToApply.items.forEach(propertyObj => {
        propertyObj.name = "_fe_groupable_" + propertyObj.name;
      });
    }
  };
  return StateHelper;
}, false);
//# sourceMappingURL=StateHelper-dbg.js.map
