/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateModel", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/type/EDM", "sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating", "sap/fe/macros/mdc/adapter/StateHelper", "sap/ui/mdc/FilterBarDelegate", "sap/ui/mdc/odata/v4/TypeMap", "sap/ui/model/json/JSONModel"], function (Log, mergeObjects, jsx, CommonUtils, TemplateModel, MetaModelConverter, FilterBar, Key, MetaModelFunction, ModelHelper, ResourceModelHelper, StableIdHelper, PropertyFormatters, EDM, CommonHelper, DelegateUtil, FieldHelper, FilterUtils, ValueHelpTemplating, StateHelper, FilterBarDelegate, TypeMap, JSONModel) {
  "use strict";

  var getValueHelpTemplate = ValueHelpTemplating.getValueHelpTemplate;
  var getModelType = EDM.getModelType;
  var hasValueHelp = PropertyFormatters.hasValueHelp;
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getLocalizedText = ResourceModelHelper.getLocalizedText;
  var isPropertyFilterable = MetaModelFunction.isPropertyFilterable;
  var KeyHelper = Key.KeyHelper;
  var sortPropertyInfosByGroupLabel = FilterBar.sortPropertyInfosByGroupLabel;
  var processSelectionFields = FilterBar.processSelectionFields;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const ODataFilterBarDelegate = Object.assign({}, FilterBarDelegate);
  ODataFilterBarDelegate.apiVersion = 2;
  const EDIT_STATE_PROPERTY_NAME = "$editState",
    SEARCH_PROPERTY_NAME = "$search",
    VALUE_HELP_TYPE = "FilterFieldValueHelp",
    FETCHED_PROPERTIES_DATA_KEY = "sap_fe_FilterBarDelegate_propertyInfoMap",
    CONDITION_PATH_TO_PROPERTY_PATH_REGEX = /[+*]/g;

  // For one single entry in UI.SelectionFields

  async function _templateEditState(sIdPrefix, metaModel, oModifier) {
    const oThis = new JSONModel({
        id: sIdPrefix,
        isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
      }),
      oPreprocessorSettings = {
        bindingContexts: {
          this: oThis.createBindingContext("/")
        },
        models: {
          //"this.i18n": ResourceModel.getModel(), TODO: To be checked why this is needed, should not be needed at all
          this: oThis
        }
      };
    return DelegateUtil.templateControlFragment("sap.fe.macros.filterBar.DraftEditState", oPreprocessorSettings, undefined, oModifier).finally(function () {
      oThis.destroy();
    });
  }
  ODataFilterBarDelegate._templateCustomFilter = async function (oFilterBar, sIdPrefix, oSelectionFieldInfo, oMetaModel, oModifier) {
    const sEntityTypePath = await DelegateUtil.getCustomDataWithModifier(oFilterBar, "entityType", oModifier);
    if (oSelectionFieldInfo.annotationPath !== undefined) {
      // if property is not defined in the manifest

      const context = oMetaModel.getContext(oSelectionFieldInfo.annotationPath),
        dataModelPath = getInvolvedDataModelObjects(context),
        documentRefText = dataModelPath.targetObject?.annotations.Common?.DocumentationRef?.toString();
      oSelectionFieldInfo.documentRefText = documentRefText;
    }
    const oThis = new JSONModel({
        id: sIdPrefix
      }),
      oItemModel = new TemplateModel(oSelectionFieldInfo, oMetaModel),
      oPreprocessorSettings = {
        bindingContexts: {
          contextPath: oMetaModel.createBindingContext(sEntityTypePath),
          this: oThis.createBindingContext("/"),
          item: oItemModel.createBindingContext("/")
        },
        models: {
          contextPath: oMetaModel,
          this: oThis,
          item: oItemModel
        }
      },
      oView = CommonUtils.getTargetView(oFilterBar),
      oController = oView ? oView.getController() : undefined,
      oOptions = {
        controller: oController ? oController : undefined,
        view: oView
      };
    return DelegateUtil.templateControlFragment("sap.fe.macros.filter.CustomFilter", oPreprocessorSettings, oOptions, oModifier).finally(function () {
      oThis.destroy();
      oItemModel.destroy();
    });
  };
  function _getPropertyPath(sConditionPath) {
    return sConditionPath.replace(CONDITION_PATH_TO_PROPERTY_PATH_REGEX, "");
  }
  ODataFilterBarDelegate._findSelectionField = function (aSelectionFields, sFlexName) {
    return aSelectionFields.find(function (oSelectionField) {
      return (oSelectionField.conditionPath === sFlexName || oSelectionField.conditionPath.replaceAll(/\*/g, "") === sFlexName) && oSelectionField.availability !== "Hidden";
    });
  };
  function _generateIdPrefix(sFilterBarId, sControlType, sNavigationPrefix) {
    return sNavigationPrefix ? generate([sFilterBarId, sControlType, sNavigationPrefix]) : generate([sFilterBarId, sControlType]);
  }
  async function _templateValueHelp(oSettings, oParameters) {
    const oThis = {
      idPrefix: oParameters.sVhIdPrefix,
      conditionModel: "$filters",
      navigationPrefix: oParameters.sNavigationPrefix ? `/${oParameters.sNavigationPrefix}` : "",
      filterFieldValueHelp: true,
      useSemanticDateRange: oParameters.bUseSemanticDateRange,
      metaPath: oSettings.bindingContexts.metaPath,
      contextPath: oSettings.bindingContexts.contextPath,
      useMultiValueField: false,
      requiresValidation: false,
      collaborationEnabled: false,
      requestGroupId: undefined
    };
    const jsonModel = new JSONModel(oThis);
    const oPreprocessorSettings = mergeObjects({}, oSettings, {
      bindingContexts: {
        this: jsonModel.createBindingContext("/")
      },
      models: {
        this: oThis
      }
    });
    const targetPath = FieldHelper.valueHelpPropertyForFilterField(oSettings.bindingContexts.metaPath);
    if (oSettings.isXML) {
      let valueHelpXMLString = jsx.renderAsXML(() => getValueHelpTemplate(oSettings.bindingContexts.metaPath.getModel().createBindingContext(targetPath), oThis));
      if (valueHelpXMLString) {
        if (oSettings.isXML) {
          valueHelpXMLString = `<root>${valueHelpXMLString}</root>`;
        }
        const valueHelpXML = new DOMParser().parseFromString(valueHelpXMLString, "text/xml");
        return Promise.resolve(DelegateUtil.templateControlFragment(valueHelpXML.firstElementChild, oPreprocessorSettings, {
          isXML: oSettings.isXML
        })).then(async function (aVHElements) {
          if (aVHElements) {
            const sAggregationName = "dependents";
            //Some filter fields have the PersistenceProvider aggregation besides the FVH :
            if (Array.isArray(aVHElements)) {
              aVHElements.forEach(function (elt) {
                if (oParameters.oModifier) {
                  oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, elt, 0);
                } else {
                  oParameters.oControl.insertAggregation(sAggregationName, elt, 0, false);
                }
              });
            } else if (oParameters.oModifier) {
              return oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, aVHElements, 0, oParameters.view);
            } else {
              oParameters.oControl.insertAggregation(sAggregationName, aVHElements, 0, false);
              return;
            }
          }
          return;
        }).catch(function (oError) {
          Log.error("Error while evaluating DelegateUtil.isValueHelpRequired", oError);
        }).finally(function () {
          jsonModel.destroy();
        });
      }
    } else {
      const valueHelp = getValueHelpTemplate(oSettings.bindingContexts.metaPath.getModel().createBindingContext(targetPath), oThis);
      if (valueHelp) {
        const sAggregationName = "dependents";
        //Some filter fields have the PersistenceProvider aggregation besides the FVH :
        if (Array.isArray(valueHelp)) {
          valueHelp.forEach(function (elt) {
            if (oParameters.oModifier) {
              oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, elt, 0);
            } else {
              oParameters.oControl.insertAggregation(sAggregationName, elt, 0, false);
            }
          });
        } else if (oParameters.oModifier) {
          oParameters.oModifier.insertAggregation(oParameters.oControl, sAggregationName, valueHelp, 0);
        } else {
          oParameters.oControl.insertAggregation(sAggregationName, valueHelp, 0, false);
        }
      }
    }
  }
  async function _addXMLCustomFilterField(oFilterBar, oModifier, sPropertyPath) {
    try {
      const aDependents = await Promise.resolve(oModifier.getAggregation(oFilterBar, "dependents"));
      let i;
      if (aDependents && aDependents.length > 1) {
        for (i = 0; i <= aDependents.length; i++) {
          const oFilterField = aDependents[i];
          if (oFilterField && oFilterField.isA("sap.ui.mdc.FilterField")) {
            const sDataProperty = oFilterField.getPropertyKey(),
              sFilterFieldId = oFilterField.getId();
            if (sPropertyPath === sDataProperty && sFilterFieldId.indexOf("CustomFilterField")) {
              return oFilterField;
            }
          }
        }
      }
    } catch (oError) {
      Log.error("Filter Cannot be added", oError);
    }
  }
  async function _templateFilterField(oSettings, oParameters, sInFilterBarId, pageModel) {
    const oThis = new JSONModel({
      idPrefix: oParameters.sIdPrefix,
      vhIdPrefix: oParameters.sVhIdPrefix,
      propertyPath: oParameters.sPropertyName,
      navigationPrefix: oParameters.sNavigationPrefix ? `/${oParameters.sNavigationPrefix}` : "",
      useSemanticDateRange: oParameters.bUseSemanticDateRange,
      settings: oParameters.oSettings,
      visualFilter: oParameters.visualFilter,
      editMode: `{internal>/${sInFilterBarId}/filterFields/${oParameters.sPropertyName}/editMode}`
    });
    try {
      const oMetaModel = oParameters.oMetaModel;
      const oVisualFilter = new TemplateModel(oParameters.visualFilter, oMetaModel);
      const oPreprocessorSettings = mergeObjects({}, oSettings, {
        bindingContexts: {
          this: oThis.createBindingContext("/"),
          visualFilter: oVisualFilter.createBindingContext("/")
        },
        models: {
          this: oThis,
          visualFilter: oVisualFilter,
          metaModel: oMetaModel,
          converterContext: pageModel
        }
      });
      return await DelegateUtil.templateControlFragment("sap.fe.macros.internal.filterField.FilterFieldTemplate", oPreprocessorSettings, {
        isXML: !!oSettings.isXML
      });
    } finally {
      oThis.destroy();
    }
  }
  async function _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName) {
    try {
      // key should have the same value as name
      const sPropertyInfoKey = KeyHelper.getSelectionFieldKeyFromPath(sPropertyInfoName);
      sPropertyInfoName = sPropertyInfoName.replace("*", "");
      if (mPropertyBag && !mPropertyBag.modifier) {
        throw "FilterBar Delegate method called without modifier.";
      }
      const delegate = await mPropertyBag.modifier.getProperty(oParentControl, "delegate");
      const aPropertyInfo = await mPropertyBag.modifier.getProperty(oParentControl, "propertyInfo");
      //We do not get propertyInfo in case of table filters
      if (aPropertyInfo) {
        const hasPropertyInfo = aPropertyInfo.some(function (prop) {
          return prop.key === sPropertyInfoKey || prop.name === sPropertyInfoKey;
        });
        if (!hasPropertyInfo) {
          const entityTypePath = delegate.payload.entityTypePath;
          const converterContext = FilterUtils.createConverterContext(oParentControl, entityTypePath, oMetaModel, mPropertyBag.appComponent);
          const entityType = converterContext.getEntityType();
          const filterField = FilterUtils.getFilterField(sPropertyInfoName, converterContext, entityType);
          const propertyInfo = FilterUtils.buildProperyInfo(filterField, converterContext);
          await _updatePropertyInfo(aPropertyInfo, mPropertyBag, propertyInfo, oParentControl);
        }
      }
    } catch (errorMsg) {
      Log.warning(`${oParentControl.getId()} : ${errorMsg}`);
    }
  }
  async function _updatePropertyInfo(propertyInfo, propertyBag, filterField, parentControl) {
    let propertyInfoForFilterBar = await DelegateUtil.getCustomDataWithModifier(parentControl, "feFilterInfo", propertyBag.modifier);
    if (propertyInfoForFilterBar && propertyInfoForFilterBar.length > 0) {
      const propertyInfoForFilterBarObj = JSON.parse(propertyInfoForFilterBar);
      propertyInfoForFilterBarObj.push(filterField);
      propertyInfoForFilterBar = JSON.stringify(propertyInfoForFilterBarObj);
      propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\{/g, "\\{");
      propertyInfoForFilterBar = propertyInfoForFilterBar.replace(/\}/g, "\\}");
      const customDataNode = await DelegateUtil.retrieveCustomDataNode(parentControl, "feFilterInfo", propertyBag.modifier);
      customDataNode[0].setAttribute("value", propertyInfoForFilterBar);
      propertyBag.modifier.insertAggregation(parentControl, "customData", customDataNode[0], 0);
    }

    // Custom data is set to the parent control to store the propertyInfo
    propertyInfo.push(filterField);
    //remove unwanted property from the propertyInfo
    const _propertyInfo = FilterUtils.formatPropertyInfo(propertyInfo);
    //Update the propertyInfo in the parent control
    propertyBag.modifier.setProperty(parentControl, "propertyInfo", _propertyInfo);
  }
  /**
   * Method responsible for creating filter field in standalone mode / in the personalization settings of the filter bar.
   * @param oParentControl Parent control instance to which the filter field is added
   * @param sPropertyInfoName Name of the property being added as the filter field
   * @param mPropertyBag Instance of the property bag from Flex API
   * @param mPropertyBag.appComponent AppComponent
   * @param mPropertyBag.modifier Modifier from Flex API
   * @returns Once resolved, a filter field definition is returned
   */
  ODataFilterBarDelegate.addItem = async function (oParentControl, sPropertyInfoName, mPropertyBag) {
    if (!mPropertyBag) {
      // Invoked during runtime.
      return ODataFilterBarDelegate._addP13nItem(sPropertyInfoName, oParentControl);
    }
    const modifier = mPropertyBag.modifier;
    const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
    const oMetaModel = model && model.getMetaModel();
    if (!oMetaModel) {
      return Promise.resolve(null);
    }
    const isXML = modifier && modifier.targets === "xmlTree";
    if (isXML) {
      await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
    }
    return ODataFilterBarDelegate._addFlexItem(sPropertyInfoName, oParentControl, oMetaModel, modifier, mPropertyBag.appComponent, mPropertyBag.view);
  };

  /**
   * Method responsible for removing filter field in standalone / personalization filter bar.
   * @param oParentControl Parent control instance from which the filter field is removed
   * @param oFilterFieldProperty Object of the filter field property being removed as filter field
   * @param mPropertyBag Instance of property bag from Flex API
   * @param mPropertyBag.appComponent AppComponent
   * @param mPropertyBag.modifier Modifier from Flex API
   * @returns The resolved promise
   */
  ODataFilterBarDelegate.removeItem = async function (oParentControl, oFilterFieldProperty, mPropertyBag) {
    let doRemoveItem = true;
    const modifier = mPropertyBag.modifier;
    const isXML = modifier && modifier.targets === "xmlTree";
    if (isXML) {
      const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
      const oMetaModel = model && model.getMetaModel();
      if (!oMetaModel) {
        return Promise.resolve(null);
      }
      const filterFieldProperty = await mPropertyBag.modifier.getProperty(oFilterFieldProperty, "propertyKey");
      await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, filterFieldProperty);
    }
    if (typeof oFilterFieldProperty !== "string" && oFilterFieldProperty.isA && oFilterFieldProperty.isA("sap.ui.mdc.FilterField")) {
      if (oFilterFieldProperty.data("isSlot") === "true" && mPropertyBag) {
        // Inserting into the modifier creates a change from flex also filter is been removed hence promise is resolved to false
        modifier.insertAggregation(oParentControl, "dependents", oFilterFieldProperty);
        doRemoveItem = false;
      }
    }
    return Promise.resolve(doRemoveItem);
  };

  /**
   * Method responsible for creating filter field condition in standalone / personalization filter bar.
   * @param oParentControl Parent control instance to which the filter field is added
   * @param sPropertyInfoName Name of the property being added as filter field
   * @param mPropertyBag Instance of property bag from Flex API
   * @param mPropertyBag.appComponent AppComponent
   * @param mPropertyBag.modifier Modifier from Flex API
   * @returns The resolved promise
   */
  ODataFilterBarDelegate.addCondition = async function (oParentControl, sPropertyInfoName, mPropertyBag) {
    const modifier = mPropertyBag.modifier;
    const isXML = modifier && modifier.targets === "xmlTree";
    if (isXML) {
      const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
      const oMetaModel = model && model.getMetaModel();
      if (!oMetaModel) {
        return Promise.resolve(null);
      }
      await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
    }
    return Promise.resolve();
  };

  /**
   * Method responsible for removing filter field in standalone / personalization filter bar.
   * @param oParentControl Parent control instance from which the filter field is removed
   * @param sPropertyInfoName Name of the property being removed as filter field
   * @param mPropertyBag Instance of property bag from Flex API
   * @param mPropertyBag.appComponent AppComponent
   * @param mPropertyBag.modifier Modifier from Flex API
   * @returns The resolved promise
   */
  ODataFilterBarDelegate.removeCondition = async function (oParentControl, sPropertyInfoName, mPropertyBag) {
    const modifier = mPropertyBag.modifier;
    const isXML = modifier && modifier.targets === "xmlTree";
    if (isXML) {
      const propertyInfoFromCD = await DelegateUtil.getCustomDataWithModifier(oParentControl, "sap_fe_FilterBarDelegate_propertyInfoMap", modifier);
      if (!propertyInfoFromCD) {
        const model = mPropertyBag && mPropertyBag.appComponent && mPropertyBag.appComponent.getModel();
        const oMetaModel = model && model.getMetaModel();
        if (!oMetaModel) {
          return Promise.resolve(null);
        }
        await _addPropertyInfo(oParentControl, mPropertyBag, oMetaModel, sPropertyInfoName);
      }
    }
    return Promise.resolve();
  };
  /**
   * Clears all input values of visible filter fields in the filter bar.
   * @param oFilterControl Instance of the FilterBar control
   * @returns The resolved promise
   */
  ODataFilterBarDelegate.clearFilters = async function (oFilterControl) {
    const filterBarAPI = oFilterControl.getParent();
    return StateHelper.clearFilterValues(filterBarAPI);
  };
  /**
   * Creates the filter field in the table adaptation of the FilterBar.
   * @param sPropertyInfoName The property name of the entity type for which the filter field needs to be created
   * @param oParentControl Instance of the parent control
   * @returns Once resolved, a filter field definition is returned
   */
  ODataFilterBarDelegate._addP13nItem = async function (sPropertyInfoName, oParentControl) {
    return DelegateUtil.fetchModel(oParentControl).then(async function (oModel) {
      return ODataFilterBarDelegate._addFlexItem(sPropertyInfoName, oParentControl, oModel.getMetaModel(), undefined);
    }).catch(function (oError) {
      Log.error("Model could not be resolved", oError);
      return null;
    });
  };
  ODataFilterBarDelegate.fetchPropertiesForEntity = function (sEntityTypePath, oMetaModel, oFilterControl) {
    const oEntityType = oMetaModel.getObject(sEntityTypePath);
    const includeHidden = oFilterControl.isA("sap.ui.mdc.valuehelp.FilterBar") ? true : undefined;
    if (!oFilterControl || !oEntityType) {
      return [];
    }
    const oConverterContext = FilterUtils.createConverterContext(oFilterControl, sEntityTypePath);
    const sEntitySetPath = ModelHelper.getEntitySetPath(sEntityTypePath);
    const mFilterFields = FilterUtils.getConvertedFilterFields(oFilterControl, sEntityTypePath, includeHidden);
    let aFetchedProperties = [];
    mFilterFields.forEach(function (oFilterFieldInfo) {
      const sAnnotationPath = oFilterFieldInfo.annotationPath;
      if (sAnnotationPath) {
        const oPropertyAnnotations = oConverterContext.getConvertedTypes().resolvePath(sAnnotationPath).target;
        const sTargetPropertyPrefix = CommonHelper.getLocationForPropertyPath(oMetaModel, sAnnotationPath);
        const sProperty = sAnnotationPath.replace(`${sTargetPropertyPrefix}/`, "");
        const entityType = oConverterContext.getEntityType();
        const selectionFields = entityType.annotations?.UI?.SelectionFields;
        const filterFacets = entityType.annotations?.UI?.FilterFacets;
        if (oPropertyAnnotations && ODataFilterBarDelegate._isFilterAdaptable(oFilterFieldInfo, oPropertyAnnotations, selectionFields, filterFacets) && isPropertyFilterable(oMetaModel, sTargetPropertyPrefix, _getPropertyPath(sProperty), true)) {
          aFetchedProperties.push(oFilterFieldInfo);
        }
      } else {
        //Custom Filters
        aFetchedProperties.push(oFilterFieldInfo);
      }
    });
    const aParameterFields = [];
    const processedFields = processSelectionFields(aFetchedProperties, oConverterContext);
    const processedFieldsKeys = [];
    processedFields.forEach(function (oProps) {
      if (oProps.key) {
        processedFieldsKeys.push(oProps.key);
      }
    });
    aFetchedProperties = aFetchedProperties.filter(function (oProp) {
      return processedFieldsKeys.includes(oProp.key);
    });
    const oFR = CommonUtils.getFilterRestrictionsByPath(sEntitySetPath, oMetaModel),
      mAllowedExpressions = oFR.FilterAllowedExpressions;
    //Object.keys(processedFields).forEach(function (sFilterFieldKey: string) {
    processedFields.forEach(function (oProp, iFilterFieldIndex) {
      const oSelField = aFetchedProperties[iFilterFieldIndex];
      if (!oSelField || !oSelField.conditionPath) {
        return;
      }
      const sPropertyPath = _getPropertyPath(oSelField.conditionPath);
      //fetchBasic
      oProp = Object.assign(oProp, {
        group: oSelField.group,
        groupLabel: oSelField.groupLabel,
        path: oSelField.conditionPath,
        tooltip: null,
        removeFromAppState: false,
        hasValueHelp: false
      });

      //fetchPropInfo
      if (oSelField.annotationPath) {
        const sAnnotationPath = oSelField.annotationPath;
        const oProperty = oMetaModel.getObject(sAnnotationPath),
          oPropertyAnnotations = oMetaModel.getObject(`${sAnnotationPath}@`),
          oPropertyContext = oMetaModel.createBindingContext(sAnnotationPath);
        const bRemoveFromAppState = oPropertyAnnotations["@com.sap.vocabularies.PersonalData.v1.IsPotentiallySensitive"] || oPropertyAnnotations["@com.sap.vocabularies.UI.v1.ExcludeFromNavigationContext"] || oPropertyAnnotations["@com.sap.vocabularies.Analytics.v1.Measure"];
        const sTargetPropertyPrefix = CommonHelper.getLocationForPropertyPath(oMetaModel, oSelField.annotationPath);
        const sProperty = sAnnotationPath.replace(`${sTargetPropertyPrefix}/`, "");
        let oFilterDefaultValueAnnotation;
        let oFilterDefaultValue;
        if (oPropertyContext && isPropertyFilterable(oMetaModel, sTargetPropertyPrefix, _getPropertyPath(sProperty), true)) {
          oFilterDefaultValueAnnotation = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.FilterDefaultValue"];
          if (oFilterDefaultValueAnnotation) {
            oFilterDefaultValue = oFilterDefaultValueAnnotation[`$${getModelType(oProperty.$Type)}`];
          }
          oProp = Object.assign(oProp, {
            tooltip: oPropertyAnnotations["@com.sap.vocabularies.Common.v1.QuickInfo"] || undefined,
            removeFromAppState: bRemoveFromAppState,
            hasValueHelp: hasValueHelp(oPropertyContext.getObject(), {
              context: oPropertyContext
            }),
            defaultFilterConditions: oFilterDefaultValue ? [{
              fieldPath: oSelField.conditionPath,
              operator: "EQ",
              values: [oFilterDefaultValue]
            }] : undefined
          });
        }
      }

      //base

      if (oProp) {
        if (mAllowedExpressions[sPropertyPath] && mAllowedExpressions[sPropertyPath].length > 0) {
          oProp.filterExpression = CommonUtils.getSpecificAllowedExpression(mAllowedExpressions[sPropertyPath]);
        } else {
          oProp.filterExpression = "auto";
        }
        oProp = Object.assign(oProp, {
          visible: oSelField.availability === "Default"
        });
      }
      processedFields[iFilterFieldIndex] = oProp;
    });
    processedFields.forEach(function (propInfo) {
      // key should have the same value as name
      propInfo.key = propInfo.name;
      if (propInfo.path === "$editState") {
        propInfo.label = getResourceModel(oFilterControl).getText("FILTERBAR_EDITING_STATUS");
      }
      propInfo.typeConfig = TypeMap.getTypeConfig(propInfo.dataType, propInfo.formatOptions, propInfo.constraints);
      propInfo.label = getLocalizedText(propInfo.label, oFilterControl) || "";
      if (propInfo.isParameter) {
        aParameterFields.push(propInfo.name);
      }
    });
    aFetchedProperties = processedFields;
    DelegateUtil.setCustomData(oFilterControl, "parameters", aParameterFields);
    return aFetchedProperties;
  };
  function getLineItemQualifierFromTable(oControl, oMetaModel) {
    if (oControl.isA("sap.fe.macros.table.TableAPI")) {
      const annotationPaths = oControl.getMetaPath().split("#")[0].split("/");
      switch (annotationPaths[annotationPaths.length - 1]) {
        case `@${"com.sap.vocabularies.UI.v1.SelectionPresentationVariant"}`:
        case `@${"com.sap.vocabularies.UI.v1.PresentationVariant"}`:
          return oMetaModel.getObject(oControl.getMetaPath()).Visualizations?.find(visualization => visualization.$AnnotationPath.includes(`@${"com.sap.vocabularies.UI.v1.LineItem"}`)).$AnnotationPath;
        case `@${"com.sap.vocabularies.UI.v1.LineItem"}`:
          const metaPaths = oControl.getMetaPath().split("/");
          return metaPaths[metaPaths.length - 1];
      }
    }
    return undefined;
  }
  ODataFilterBarDelegate._isFilterAdaptable = function (filterFieldInfo, propertyAnnotations, selectionFields, filterFacets) {
    let isInFilterFacets;
    const isSelectionField = selectionFields ? ODataFilterBarDelegate._isFilterInSelectionFields(selectionFields, filterFieldInfo) : false;
    if (filterFacets) {
      isInFilterFacets = filterFacets.some(function (filterFacet) {
        const fieldGroup = filterFacet.Target?.$target;
        return fieldGroup?.Data.some(function (dataField) {
          // we expect dataField to be DataFieldTypes (having a Value) inside FieldGroups inside FilterFacets
          if (dataField.Value.path === filterFieldInfo.key) {
            return true;
          }
          // dataField types having no Value (DataFieldForAnnotationTypes, DataFieldForActionAbstractTypes, DataFieldForActionGroupTypes), there is nothing to check, but this should not occur anyway
          return false;
        });
      });
    } else {
      isInFilterFacets = false;
    }
    return isSelectionField || isInFilterFacets || !propertyAnnotations.annotations?.UI?.AdaptationHidden;
  };
  ODataFilterBarDelegate._isFilterInSelectionFields = function (selectionFields, filterFieldInfo) {
    const filterFieldKey = filterFieldInfo.key?.indexOf("::") > 0 ? filterFieldInfo.key?.replace("::", "/") : filterFieldInfo.key;
    return selectionFields.some(function (selectionField) {
      if (selectionField.value === filterFieldKey) {
        return true;
      }
      return false;
    });
  };
  ODataFilterBarDelegate._addFlexItem = async function (sFlexPropertyName, oParentControl, oMetaModel, oModifier, oAppComponent, view) {
    const sFilterBarId = oModifier ? oModifier.getId(oParentControl) : oParentControl.getId(),
      sIdPrefix = oModifier ? "" : "Adaptation",
      aSelectionFields = FilterUtils.getConvertedFilterFields(oParentControl, undefined, undefined, oMetaModel, oAppComponent, oModifier, oModifier ? undefined : getLineItemQualifierFromTable(oParentControl.getParent(), oMetaModel)),
      oSelectionField = ODataFilterBarDelegate._findSelectionField(aSelectionFields, sFlexPropertyName),
      sPropertyPath = _getPropertyPath(sFlexPropertyName),
      bIsXML = !!oModifier && oModifier.targets === "xmlTree";
    if (sFlexPropertyName === EDIT_STATE_PROPERTY_NAME) {
      return _templateEditState(_generateIdPrefix(sFilterBarId, `${sIdPrefix}FilterField`), oMetaModel, oModifier);
    } else if (sFlexPropertyName === SEARCH_PROPERTY_NAME) {
      return Promise.resolve(null);
    } else if (oSelectionField?.template) {
      return ODataFilterBarDelegate._templateCustomFilter(oParentControl, _generateIdPrefix(sFilterBarId, `${sIdPrefix}`), oSelectionField, oMetaModel, oModifier);
    }
    if (oSelectionField?.type === "Slot" && oModifier) {
      return _addXMLCustomFilterField(oParentControl, oModifier, sPropertyPath);
    }
    const sNavigationPath = CommonHelper.getNavigationPath(sPropertyPath);
    let sEntityTypePath;
    let sUseSemanticDateRange;
    let oSettings;
    let sBindingPath;
    let oParameters;
    return Promise.resolve().then(async function () {
      if (oSelectionField?.isParameter) {
        const sAnnotationPath = oSelectionField.annotationPath;
        return sAnnotationPath.substring(0, sAnnotationPath.lastIndexOf("/") + 1);
      }
      return DelegateUtil.getCustomDataWithModifier(oParentControl, "entityType", oModifier);
    }).then(async function (sRetrievedEntityTypePath) {
      sEntityTypePath = sRetrievedEntityTypePath;
      return DelegateUtil.getCustomDataWithModifier(oParentControl, "useSemanticDateRange", oModifier);
    }).then(async function (sRetrievedUseSemanticDateRange) {
      sUseSemanticDateRange = sRetrievedUseSemanticDateRange;
      const oPropertyContext = oMetaModel.createBindingContext(sEntityTypePath + sPropertyPath);
      let sInFilterBarId = oModifier ? oModifier.getId(oParentControl) : oParentControl.getId();
      if (sInFilterBarId.endsWith("-content")) {
        // -content is only added when the building block is used directly in the filter bar
        sInFilterBarId = sInFilterBarId.substring(0, sInFilterBarId.lastIndexOf("-content"));
        // By using the id of the parent control, we can get the correct idPrefix for the value help
      }
      oSettings = {
        bindingContexts: {
          contextPath: oMetaModel.createBindingContext(sEntityTypePath),
          property: oPropertyContext
        },
        models: {
          contextPath: oMetaModel,
          property: oMetaModel
        },
        isXML: bIsXML
      };
      sBindingPath = `/${ModelHelper.getEntitySetPath(sEntityTypePath).split("/").filter(ModelHelper.filterOutNavPropBinding).join("/")}`;
      oParameters = {
        metaPath: oPropertyContext.getPath(),
        sPropertyName: sPropertyPath,
        sBindingPath: sBindingPath,
        sValueHelpType: sIdPrefix + VALUE_HELP_TYPE,
        oControl: oParentControl,
        oMetaModel: oMetaModel,
        oModifier: oModifier,
        sIdPrefix: _generateIdPrefix(sInFilterBarId, `${sIdPrefix}FilterField`, sNavigationPath),
        sVhIdPrefix: _generateIdPrefix(sInFilterBarId, sIdPrefix + VALUE_HELP_TYPE),
        sNavigationPrefix: sNavigationPath,
        bUseSemanticDateRange: sUseSemanticDateRange,
        oSettings: oSelectionField?.settings ?? {},
        visualFilter: oSelectionField?.visualFilter,
        view
      };
      return DelegateUtil.doesValueHelpExist(oParameters);
    }).then(async function (bValueHelpExists) {
      if (!bValueHelpExists) {
        return _templateValueHelp({
          bindingContexts: {
            contextPath: oMetaModel.createBindingContext(sEntityTypePath),
            metaPath: oSettings.bindingContexts.property
          },
          models: {
            contextPath: oMetaModel,
            metaPath: oMetaModel
          },
          isXML: bIsXML
        }, oParameters);
      }
      return;
    }).then(async function () {
      return DelegateUtil.getCustomDataWithModifier(oParentControl, "localId", oModifier);
    }).then(async function (localId) {
      let pageModel;
      if (oParameters.visualFilter) {
        //Need to set the convertercontext as pageModel in settings for BuildingBlock 2.0
        pageModel = CommonUtils.getTargetView(oParentControl).getController()._getPageModel();
      }
      return _templateFilterField(oSettings, oParameters, localId, pageModel);
    });
  };
  function _getCachedProperties(oFilterBar) {
    // properties are not cached during templating
    if (oFilterBar instanceof window.Element) {
      return null;
    }
    return DelegateUtil.getCustomData(oFilterBar, FETCHED_PROPERTIES_DATA_KEY);
  }
  function _setCachedProperties(oFilterBar, aFetchedProperties) {
    // do not cache during templating, else it becomes part of the cached view
    if (oFilterBar instanceof window.Element) {
      return;
    }
    DelegateUtil.setCustomData(oFilterBar, FETCHED_PROPERTIES_DATA_KEY, aFetchedProperties);
  }
  function _getCachedOrFetchPropertiesForEntity(sEntityTypePath, oMetaModel, oFilterBar) {
    let aFetchedProperties = _getCachedProperties(oFilterBar);
    let localGroupLabel;
    if (!aFetchedProperties) {
      aFetchedProperties = ODataFilterBarDelegate.fetchPropertiesForEntity(sEntityTypePath, oMetaModel, oFilterBar);
      aFetchedProperties.forEach(function (oGroup) {
        localGroupLabel = null;
        if (oGroup.groupLabel) {
          localGroupLabel = getLocalizedText(oGroup.groupLabel, oFilterBar);
          oGroup.groupLabel = localGroupLabel === null ? oGroup.groupLabel : localGroupLabel;
        }
      });
      sortPropertyInfosByGroupLabel(aFetchedProperties);
      _setCachedProperties(oFilterBar, aFetchedProperties);
    }
    return aFetchedProperties;
  }
  ODataFilterBarDelegate.fetchProperties = async function (filterBar) {
    const propertyInfos = await ODataFilterBarDelegate.fetchFilterProperties(filterBar);
    DelegateUtil.setCustomData(filterBar, "feFilterInfo", propertyInfos);
    if (propertyInfos.length > 0) {
      return FilterUtils.formatPropertyInfo(propertyInfos);
    } else {
      return [];
    }
  };
  ODataFilterBarDelegate.fetchFilterProperties = async function (filterBar) {
    const entityTypePath = DelegateUtil.getCustomData(filterBar, "entityType");
    return DelegateUtil.fetchModel(filterBar).then(function (model) {
      if (!model) {
        return [];
      }
      return _getCachedOrFetchPropertiesForEntity(entityTypePath, model.getMetaModel(), filterBar);
    });
  };
  ODataFilterBarDelegate.getTypeMap = function () {
    return TypeMap;
  };
  return ODataFilterBarDelegate;
}, false);
//# sourceMappingURL=FilterBarDelegate-dbg.js.map
