/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/JSTokenizer", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/type/FiscalDate", "sap/fe/macros/CommonHelper", "sap/ui/model/odata/v4/AnnotationHelper"], function (JSTokenizer, BindingToolkit, CommonUtils, DataModelPathHelper, PropertyFormatters, FiscalDate, CommonHelper, AnnotationHelper) {
  "use strict";

  var _exports = {};
  var getProperty = PropertyFormatters.getProperty;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var pathInModel = BindingToolkit.pathInModel;
  var getFiscalType = BindingToolkit.getFiscalType;
  var EDM_TYPE_MAPPING = BindingToolkit.EDM_TYPE_MAPPING;
  var compileExpression = BindingToolkit.compileExpression;
  /**
   * Checks whether the property with the given path is required in the filter for the given annotation interface.
   * @param path Property path - ignored when provided as string
   * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
   * @returns The value true if the given input is requird for filtering
   */
  function isRequiredInFilter(path, annotationInterface) {
    const model = annotationInterface.context.getModel();
    const propertyPath = annotationInterface.context.getPath();
    const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, propertyPath);
    let property;
    let required = model.getObject(`${propertyLocationPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
    if (!required) {
      if (typeof path === "string") {
        property = path;
      } else {
        property = model.getObject(`${propertyPath}@sapui.name`);
      }
      const oFR = CommonUtils.getFilterRestrictionsByPath(propertyLocationPath, model);
      required = oFR?.RequiredProperties?.includes(property);
    }
    return required;
  }

  /**
   * Checks the maximum number of conditions for the given path and given annotation interface.
   * @param path Property path - ignored when provided as string
   * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
   * @returns The number of maximum allowed conditions or -1 if there is no limit.
   */
  _exports.isRequiredInFilter = isRequiredInFilter;
  function maxConditions(path, annotationInterface) {
    const model = annotationInterface.context.getModel();
    const propertyPath = annotationInterface.context.getPath();
    const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, propertyPath);
    let property;
    let max = -1;
    if (model.getObject(`${propertyLocationPath}/@com.sap.vocabularies.Common.v1.ResultContext`) === true) {
      return 1;
    }
    if (typeof path === "string") {
      property = path;
    } else {
      property = model.getObject(`${propertyPath}@sapui.name`);
    }
    const filterRestrictions = CommonUtils.getFilterRestrictionsByPath(propertyLocationPath, model);
    let propertyInfo = model.getObject(`${propertyLocationPath}/${property}`);
    if (!propertyInfo) {
      propertyInfo = model.getObject(propertyPath);
    }
    if (propertyInfo.$Type === "Edm.Boolean") {
      max = 1;
    } else if (filterRestrictions?.FilterAllowedExpressions?.[property]) {
      const allowedExpression = CommonUtils.getSpecificAllowedExpression(filterRestrictions.FilterAllowedExpressions[property]);
      if (allowedExpression === "SingleValue" || allowedExpression === "SingleRange") {
        max = 1;
      }
    }
    return max;
  }

  /**
   * To Create binding for mdc:filterfield conditions.
   * @param dataModelObjectPath Data Model Object path to filter field property
   * @returns Expression binding for conditions for the field
   */
  _exports.maxConditions = maxConditions;
  function getConditionsBinding(dataModelObjectPath) {
    const relativePropertyPath = getContextRelativeTargetObjectPath(dataModelObjectPath, false, true);
    return compileExpression(pathInModel(`/conditions/${relativePropertyPath}`, "$filters"));
  }

  /**
   * Get the contraints string for the given property and interface.
   * @param context
   * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
   * @returns Constraints as string if available otherwise undefined
   */
  _exports.getConditionsBinding = getConditionsBinding;
  function constraints(context, annotationInterface) {
    const value = AnnotationHelper.format(context, annotationInterface) || "";
    const matches = value.match(/constraints:.*?({.*?})/);
    const propertyConstraints = JSTokenizer.parseJS(matches?.[1] || "{}");
    // Workaround. Add "V4: true" to DateTimeOffset constraints. AnnotationHelper is not aware of this flag.
    if (value.includes("sap.ui.model.odata.type.DateTimeOffset")) {
      // Ensure that V4:true is  there. With the openUI5 BLI: CPOUI5ODATAV4-2131 the constraints are already include 'V4':true
      propertyConstraints.V4 = true;
    }
    // Remove {nullable:false} from the constraints as it prevents from having an empty filter field
    // in the case of a single-value filter
    if (propertyConstraints.nullable === false) {
      delete propertyConstraints.nullable;
    }
    // Unfortunately, JSTokenizer does not provide a method to stringify (reversing parseJS).
    // Using JSON.stringify and replacing double quotes with single quotes works at least in the known simple cases (flat objects not containing quotes in property names or values).
    // If special cases should occur in future, this might need some adoption (depending on the required string format in that case).
    return Object.keys(propertyConstraints).length === 0 ? undefined : JSON.stringify(propertyConstraints).replaceAll('"', "'");
  }

  /**
   * Get the format options as string for the given path and given annotation interface.
   * @param context
   * @param annotationInterface Structure returned by the ODataMetaModel when using the @@ operator in XML templates
   * @returns Format options as string if available otherwise undefined
   */
  _exports.constraints = constraints;
  function formatOptions(context, annotationInterface) {
    // as the Annotation helper always returns "parseKeepsEmptyString: true" we need to prevent this in case a property (of type string) is nullable
    // Filling annotationInterface.arguments with an array where the first parameter is null, and the second contains the "expected"
    // parseKeepsEmptyString value follows a proposal from the model colleagues to "overrule" the behavior of the AnnotationHelper
    if (context.$Type === "Edm.String") {
      if (!context.hasOwnProperty("$Nullable") || context.$Nullable === true) {
        annotationInterface.arguments = [null, {
          parseKeepsEmptyString: false
        }];
      }
      const fiscalType = getFiscalType(getProperty(context, annotationInterface));
      if (fiscalType) {
        if (!annotationInterface.arguments) {
          annotationInterface.arguments = [null, {}];
        }
        annotationInterface.arguments[1].fiscalType = fiscalType;
      }
    }
    const value = AnnotationHelper.format(context, annotationInterface) || "";
    return value.match(/formatOptions:.*?({.*?})/)?.[1] || undefined;
  }

  /**
   * Get the data type for a given property.
   * @param property Property information
   * @returns Type as string
   */
  _exports.formatOptions = formatOptions;
  function getDataType(property) {
    if (property.type === "Edm.String") {
      const fiscalType = getFiscalType(property);
      if (fiscalType) {
        return "sap.fe.core.type.FiscalDate";
      }
    }
    const typeMapping = EDM_TYPE_MAPPING[property.type];
    return typeMapping ? typeMapping.type : property.type;
  }

  /**
   * Get the placeholder of properties of type Edm.String.
   * @param property Property information
   * @returns Placeholder as string if available otherwise undefined
   */
  _exports.getDataType = getDataType;
  function getPlaceholder(property) {
    if (property.type === "Edm.String") {
      const fiscalType = getFiscalType(property);
      if (fiscalType) {
        return new FiscalDate({
          fiscalType
        }, {}).getPattern();
      }
    }
    return undefined;
  }
  _exports.getPlaceholder = getPlaceholder;
  return _exports;
}, false);
//# sourceMappingURL=FilterFieldHelper-dbg.js.map
