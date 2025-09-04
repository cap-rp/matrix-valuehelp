/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/internal/valuehelp/ValueHelpTemplating"], function (Log, CommonUtils, MetaModelConverter, StableIdHelper, DataModelPathHelper, PropertyFormatters, PropertyHelper, FieldHelper, ValueHelpTemplating) {
  "use strict";

  var generateID = ValueHelpTemplating.generateID;
  var getAssociatedUnitPropertyPath = PropertyHelper.getAssociatedUnitPropertyPath;
  var getAssociatedCurrencyPropertyPath = PropertyHelper.getAssociatedCurrencyPropertyPath;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var generate = StableIdHelper.generate;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const NS_MACRODATA = "http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1";
  function _retrieveModel() {
    this.control.detachModelContextChange(_retrieveModel, this);
    const sModelName = this.modelName,
      oModel = this.control.getModel(sModelName);
    if (oModel) {
      this.resolve(oModel);
    } else {
      this.control.attachModelContextChange(_retrieveModel, this);
    }
  }
  const DelegateUtil = {
    FETCHED_PROPERTIES_DATA_KEY: "sap_fe_ControlDelegate_propertyInfoMap",
    setCachedProperties(control, fetchedProperties) {
      // do not cache during templating, else it becomes part of the cached view
      if (control instanceof window.Element) {
        return;
      }
      const key = DelegateUtil.FETCHED_PROPERTIES_DATA_KEY;
      DelegateUtil.setCustomData(control, key, fetchedProperties);
    },
    getCachedProperties(control) {
      // properties are not cached during templating
      if (control instanceof window.Element) {
        return undefined;
      }
      const key = DelegateUtil.FETCHED_PROPERTIES_DATA_KEY;
      return DelegateUtil.getCustomData(control, key);
    },
    async getCustomDataWithModifier(control, property, modifier) {
      if (!modifier) {
        return Promise.resolve(DelegateUtil.getCustomData(control, property));
      }
      const customData = await DelegateUtil.retrieveCustomDataNode(control, property, modifier);
      if (customData.length === 1) {
        return modifier.getProperty(customData[0], "value");
      } else {
        return undefined;
      }
    },
    getCustomData(oControl, sProperty) {
      // Delegate invoked from a non-flex change - FilterBarDelegate._addP13nItem for OP table filtering, FilterBarDelegate.fetchProperties etc.
      if (oControl && sProperty) {
        if (oControl instanceof window.Element) {
          return oControl.getAttributeNS(NS_MACRODATA, sProperty);
        }
        if (oControl.data instanceof Function) {
          return oControl.data(sProperty);
        }
      }
      return undefined;
    },
    setCustomData(oControl, sProperty, vValue) {
      if (oControl && sProperty) {
        if (oControl instanceof window.Element) {
          return oControl.setAttributeNS(NS_MACRODATA, `customData:${sProperty}`, vValue);
        }
        if (oControl.data instanceof Function) {
          return oControl.data(sProperty, vValue);
        }
      }
    },
    fetchPropertiesForEntity(sEntitySet, oMetaModel) {
      return oMetaModel.requestObject(`${sEntitySet}/`);
    },
    fetchAnnotationsForEntity(sEntitySet, oMetaModel) {
      return oMetaModel.requestObject(`${sEntitySet}@`);
    },
    async fetchModel(oControl) {
      return new Promise(resolve => {
        const sModelName = oControl.getDelegate().payload && oControl.getDelegate().payload?.modelName,
          oContext = {
            modelName: sModelName,
            control: oControl,
            resolve: resolve
          };
        _retrieveModel.call(oContext);
      });
    },
    async templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier) {
      return CommonUtils.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier);
    },
    async doesValueHelpExist(mParameters) {
      const sPropertyName = mParameters.sPropertyName || "";
      const sValueHelpType = mParameters.sValueHelpType || "";
      const oMetaModel = mParameters.oMetaModel;
      const oModifier = mParameters.oModifier;
      const sOriginalProperty = `${mParameters.sBindingPath}/${sPropertyName}`;
      const propertyContext = oMetaModel.createBindingContext(sOriginalProperty);
      let valueHelpPropertyPath = FieldHelper.valueHelpProperty(propertyContext);
      const bIsAbsolute = mParameters.sBindingPath && mParameters.sBindingPath.indexOf("/") === 0;

      // unit/currency
      if (valueHelpPropertyPath.includes("$Path")) {
        valueHelpPropertyPath = oMetaModel.getObject(valueHelpPropertyPath);
      }
      const propertyDataModel = getInvolvedDataModelObjects(propertyContext);
      if (bIsAbsolute && valueHelpPropertyPath.indexOf("/") !== 0) {
        const unitOrCurrencyPropertyPath = getAssociatedCurrencyPropertyPath(propertyDataModel.targetObject) || getAssociatedUnitPropertyPath(propertyDataModel.targetObject);
        const unitOrCurrencyDataModel = enhanceDataModelPath(propertyDataModel, unitOrCurrencyPropertyPath);
        valueHelpPropertyPath = getTargetObjectPath(unitOrCurrencyDataModel);
      }
      const sGeneratedId = generateID(mParameters.flexId, generate([oModifier ? oModifier.getId(mParameters.oControl) : mParameters.oControl.getId(), sValueHelpType]), undefined, getRelativePropertyPath(propertyContext.getProperty(sOriginalProperty), {
        context: {
          getModel: () => {
            return mParameters.oMetaModel;
          },
          getPath: () => {
            return sOriginalProperty;
          }
        }
      }), getRelativePropertyPath(propertyContext.getProperty(valueHelpPropertyPath), {
        context: {
          getModel: () => {
            return mParameters.oMetaModel;
          },
          getPath: () => {
            return valueHelpPropertyPath;
          }
        }
      }));
      return Promise.resolve().then(async function () {
        if (oModifier) {
          return oModifier.getAggregation(mParameters.oControl, "dependents");
        }
        return mParameters.oControl.getAggregation("dependents");
      }).then(async function (aDependents) {
        if (aDependents) {
          for (const oDependent of aDependents) {
            let oTargetDependent = oDependent;
            if (oModifier) {
              if (oModifier.getControlType(oDependent) === "sap.fe.macros.ValueHelp" && (await oModifier.getProperty(oDependent, "metaPath")) === mParameters.metaPath) {
                // in xml validate against the metaPath of the ValueHelp
                return true;
              } else if (oModifier.getControlType(oDependent) === "sap.fe.macros.ValueHelp" && oModifier.targets !== "xmlTree") {
                // in xml validate against the metaPath of the ValueHelp
                oTargetDependent = oDependent.getContent();
              } else if (oModifier.getControlType(oDependent) === "sap.ui.mdc.ValueHelp" && oModifier.targets !== "xmlTree" && oModifier.getId(oTargetDependent).includes("::FilterFieldValueHelp::")) {
                const payload = oDependent.getPayload();
                if (payload?.propertyPath && payload?.propertyPath === mParameters.metaPath) {
                  // specific case of the OVP
                  return true;
                } else if (!payload?.propertyPath) {
                  // sometimes propertyPath is not filled
                  const targetId = oModifier.getId(oTargetDependent);
                  const lastIDPart = targetId.split("::FilterFieldValueHelp::")[1];
                  const generatedIdLastPart = sGeneratedId.split("::FilterFieldValueHelp::")[1];
                  if (lastIDPart === generatedIdLastPart) {
                    return true;
                  }
                }
              }
              if (oTargetDependent && oModifier.getId(oTargetDependent) === sGeneratedId) {
                return true;
              }
            } else {
              const oDependentAsUi5Element = oDependent;
              if (oDependentAsUi5Element.isA("sap.fe.macros.ValueHelp")) {
                oTargetDependent = oDependentAsUi5Element.getContent();
              }
              if (oTargetDependent?.getId() === sGeneratedId) {
                return true;
              }
            }
          }
        }
        return false;
      });
    },
    async isValueHelpRequired(mParameters, bInFilterField) {
      const sPropertyName = mParameters.sPropertyName || "",
        oMetaModel = mParameters.oMetaModel,
        sProperty = `${mParameters.sBindingPath}/${sPropertyName}`,
        oPropertyContext = oMetaModel.createBindingContext(sProperty),
        sValueHelpProperty = FieldHelper.valueHelpProperty(oPropertyContext, bInFilterField);
      return this.getCustomDataWithModifier(mParameters.oControl, "displayModePropertyBinding", mParameters.oModifier).then(async function (bReadOnly) {
        // Check whether the control is read-only. If yes, no need of a value help.
        bReadOnly = typeof bReadOnly === "boolean" ? bReadOnly : bReadOnly === "true";
        if (bReadOnly) {
          return false;
        }
        // Else, check whether Value Help relevant annotation exists for the property.
        // TODO use PropertyFormatter.hasValueHelp () => if doing so, QUnit tests fail due to mocked model implementation
        return Promise.all([oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListWithFixedValues`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListReferences`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListMapping`), oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueList`)]);
      }).then(function (aResults) {
        if (!Array.isArray(aResults)) {
          return aResults;
        }
        return !!aResults[0] || !!aResults[1] || !!aResults[2] || !!aResults[3];
      }).catch(function (oError) {
        Log.warning("Error while retrieving custom data / value list annotation values", oError);
        return false;
      });
    },
    isMultiValue(property) {
      let isMultiValue = true;
      if (property.dataType && property.dataType?.indexOf("Boolean") > 0) {
        isMultiValue = false;
      }
      return isMultiValue;
    },
    /**
     * Retrieves a custom data node from the control.
     * @param control The control from which to retrieve the custom data node
     * @param propertyKey The key of the custom data node to retrieve
     * @param modifier The modifier for the control
     * @returns - The custom data node
     */
    async retrieveCustomDataNode(control, propertyKey, modifier) {
      const customData = [];
      const aRetrievedCustomData = await Promise.resolve().then(modifier.getAggregation.bind(modifier, control, "customData"));

      // Process each retrieved custom data element
      for (const oCustomData of aRetrievedCustomData) {
        const key = await modifier.getProperty(oCustomData, "key");
        if (key === propertyKey) {
          customData.push(oCustomData);
        }
      }
      return customData;
    }
  };
  return DelegateUtil;
}, false);
//# sourceMappingURL=DelegateUtil-dbg.js.map
