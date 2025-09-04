/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "../../helpers/TypeGuards"], function (Log, TypeGuards) {
  "use strict";

  var _exports = {};
  var isProperty = TypeGuards.isProperty;
  /**
   * Checks for statically hidden reference properties.
   * @param source The dataField or property to be analized
   * @returns Whether the argument has been set as hidden
   */
  function isReferencePropertyStaticallyHidden(source) {
    if (!source) {
      return false;
    }
    function isPropertyHidden(property) {
      const dataFieldDefault = property.annotations.UI?.DataFieldDefault || false;
      return isPropertyStaticallyHidden("Hidden", property) || dataFieldDefault && isStaticallyHiddenDataField(dataFieldDefault);
    }
    function isDataFieldAbstractTypesHidden(dataField) {
      return isStaticallyHiddenDataField(dataField) || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && isAnnotationFieldStaticallyHidden(dataField);
    }
    function getPropertyPathFromPropertyWithHiddenFilter(property) {
      return isPropertyStaticallyHidden("HiddenFilter", property) && property.name;
    }
    function getPropertyPathFromDataFieldWithHiddenFilter(dataField) {
      return isDataFieldTypes(dataField) && isPropertyStaticallyHidden("HiddenFilter", dataField.Value.$target) && dataField.Value.path;
    }
    const isHidden = isProperty(source) ? isPropertyHidden(source) : isDataFieldAbstractTypesHidden(source);
    const propertyPathWithHiddenFilter = isProperty(source) ? getPropertyPathFromPropertyWithHiddenFilter(source) : getPropertyPathFromDataFieldWithHiddenFilter(source);
    if (isHidden && propertyPathWithHiddenFilter) {
      setLogMessageForHiddenFilter(propertyPathWithHiddenFilter);
    }
    return isHidden;
  }

  /**
   * Checks for data fields for annotation with statically hidden referenced properties.
   * @param annotationProperty The dataField or reference Facet type to be analyzed
   * @returns Whether the argument has been set as hidden
   */
  _exports.isReferencePropertyStaticallyHidden = isReferencePropertyStaticallyHidden;
  function isAnnotationFieldStaticallyHidden(annotationProperty) {
    if (isStaticallyHiddenDataField(annotationProperty)) {
      return true;
    }
    switch (annotationProperty.Target.$target?.term) {
      case "com.sap.vocabularies.UI.v1.Chart":
        const measuresHidden = annotationProperty.Target.$target.Measures.every(chartMeasure => {
          if (chartMeasure.$target && isPropertyStaticallyHidden("Hidden", chartMeasure.$target)) {
            if (isPropertyStaticallyHidden("HiddenFilter", chartMeasure.$target)) {
              setLogMessageForHiddenFilter(chartMeasure.$target.name);
            }
            return true;
          }
        });
        if (measuresHidden) {
          Log.warning("Warning: All measures attribute for Chart are statically hidden hence chart can't be rendered");
        }
        return measuresHidden;
      case "com.sap.vocabularies.UI.v1.FieldGroup":
        return annotationProperty.Target.$target.Data.every(isReferencePropertyStaticallyHidden);
      case "com.sap.vocabularies.UI.v1.DataPoint":
        const propertyValueAnnotation = annotationProperty.Target.$target.Value.$target;
        return isReferencePropertyStaticallyHidden(propertyValueAnnotation);
      default:
        return false;
    }
  }

  /**
   * Checks if header is statically hidden.
   * @param propertyDataModel The property Data Model to be analized
   * @returns Whether the argument has been set as hidden
   */
  _exports.isAnnotationFieldStaticallyHidden = isAnnotationFieldStaticallyHidden;
  function isHeaderStaticallyHidden(propertyDataModel) {
    if (propertyDataModel?.targetObject) {
      const headerInfoAnnotation = propertyDataModel.targetObject;
      return isReferencePropertyStaticallyHidden(headerInfoAnnotation);
    }
    return false;
  }

  /**
   * Checks if data field or Reference Facet is statically hidden.
   * @param dataField The dataField or Reference Facet to be analyzed
   * @returns Whether the argument has been set statically as hidden
   */
  _exports.isHeaderStaticallyHidden = isHeaderStaticallyHidden;
  function isStaticallyHiddenDataField(dataField) {
    return dataField.annotations?.UI?.Hidden?.valueOf() === true || isDataFieldTypes(dataField) && isPropertyStaticallyHidden("Hidden", dataField?.Value?.$target);
  }

  /**
   * Adds console warning when setting hidden and hidden filter together.
   * @param path The property path to be added to the warning error message
   */
  function setLogMessageForHiddenFilter(path) {
    Log.warning("Warning: Property " + path + " is set with both UI.Hidden and UI.HiddenFilter - please set only one of these! UI.HiddenFilter is ignored currently!");
  }

  /**
   * Identifies if the given dataFieldAbstract that is passed is a "DataFieldTypes".
   * DataField has a value defined.
   * @param dataField DataField to be evaluated
   * @returns Validate that dataField is a DataFieldTypes
   */
  function isDataFieldTypes(dataField) {
    return dataField.hasOwnProperty("Value");
  }

  /**
   * Identifies if the given property is statically hidden or hidden Filter".
   * @param AnnotationTerm AnnotationTerm to be evaluated, only options are "Hidden" or "HiddenFilter
   * @param property The property to be checked
   * @returns `true` if it is a statically hidden or hidden filter property
   */
  function isPropertyStaticallyHidden(AnnotationTerm, property) {
    return property?.annotations?.UI?.[AnnotationTerm]?.valueOf() === true;
  }

  /**
   * Check if dataField or dataPoint main property is potentially sensitive.
   * @param dataField DataFieldAbstractTypes or DataPOint.
   * @returns Boolean
   */
  function isPotentiallySensitive(dataField) {
    let property;
    switch (dataField?.$Type) {
      case "com.sap.vocabularies.UI.v1.DataField":
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        property = dataField?.Value?.$target;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        const dataFieldTarget = dataField.Target.$target;
        if (dataFieldTarget?.term === "com.sap.vocabularies.UI.v1.DataPoint") {
          property = dataFieldTarget?.Value?.$target;
        }
        if (dataFieldTarget?.term === "com.sap.vocabularies.Communication.v1.Contact") {
          property = dataFieldTarget?.fn?.$target;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataPointType":
        property = dataField?.Value?.$target;
        break;
      default:
        break;
    }
    return property?.annotations?.PersonalData?.IsPotentiallySensitive?.valueOf() === true;
  }
  _exports.isPotentiallySensitive = isPotentiallySensitive;
  return _exports;
}, false);
//# sourceMappingURL=DataFieldHelper-dbg.js.map
