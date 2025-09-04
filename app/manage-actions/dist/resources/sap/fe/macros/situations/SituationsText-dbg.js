/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/model/odata/type/Boolean", "sap/ui/model/odata/type/Date", "sap/ui/model/odata/type/DateTimeOffset", "sap/ui/model/odata/type/Decimal", "sap/ui/model/odata/type/Guid", "sap/ui/model/odata/type/Int32", "sap/ui/model/odata/type/String"], function (Log, EdmBoolean, EdmDate, DateTimeOffset, Decimal, Guid, Int32, EdmString) {
  "use strict";

  var _exports = {};
  /**
   * Attribute type.
   *
   * Situation Handling supports a subset of the EDM types.
   */

  /**
   * Attribute.
   */

  const types = {};
  function createEdmType(attributeEDMType) {
    switch (attributeEDMType) {
      case "EDM.BOOLEAN":
        return new EdmBoolean();
      case "EDM.DATE":
      case "EDM.DATETIME":
        return new EdmDate();
      case "EDM.DATETIMEOFFSET":
        return new DateTimeOffset();
      case "EDM.DECIMAL":
        return new Decimal();
      case "EDM.GUID":
        return new Guid();
      case "EDM.INT32":
        return new Int32();
      case "EDM.STRING":
        return new EdmString();
      default:
        return createEdmType("EDM.STRING");
    }
  }
  function parseAttributeValue(type, value, oDataType) {
    switch (type) {
      case "EDM.STRING":
        return value;
      case "EDM.DATE":
      case "EDM.DATETIME":
      case "EDM.DATETIMEOFFSET":
        return oDataType.parseValue(value, "string");
      case "EDM.INT32":
        return parseInt(value, 10);
      case "EDM.DECIMAL":
        return parseFloat(value);
      case "EDM.GUID":
        return value;
      case "EDM.BOOLEAN":
        // ABAP style: 'X' = true, '' = false
        return value === "X";
      default:
        return value;
    }
  }
  function getType(attributeEDMType) {
    let type = types[attributeEDMType];
    if (!type) {
      type = createEdmType(attributeEDMType);
      types[attributeEDMType] = type;
    }
    return type;
  }
  function formatter(key, template) {
    const context = this.getBindingContext();
    if (key === undefined || key === null || template === undefined || template === null || !context) {
      return "";
    }
    const attributes = context.getObject("_InstanceAttribute");
    if (attributes === undefined || attributes === null || attributes.length === 0) {
      return template;
    }
    const placeholderReplacer = (match, attributeSource, attributeName) => {
      const source = parseInt(attributeSource, 10).toString(); // remove leading zeros from the attribute source

      const resolvedAttribute = attributes.find(attribute => attribute.SitnInstceAttribSource === source && attribute.SitnInstceAttribName === attributeName);
      if (resolvedAttribute === undefined) {
        Log.error(`Failed to resolve attribute ${attributeSource}.${attributeName}`);
        return "";
      }
      if (!resolvedAttribute._InstanceAttributeValue) {
        Log.error(`Failed to resolve a value for attribute ${attributeSource}.${attributeName}`);
        return "";
      }
      const resolvedAttributeType = getType(resolvedAttribute.SitnInstceAttribEntityType);

      // Format the value(s) - if there are multiple, concatenate them
      return resolvedAttribute._InstanceAttributeValue.map(value => {
        const parsedValue = parseAttributeValue(resolvedAttribute.SitnInstceAttribEntityType, value.SitnInstceAttribValue, resolvedAttributeType);
        return resolvedAttributeType.formatValue(parsedValue, "string");
      }).join(", ");
    };

    // Replace placeholders for attribute values.
    // Their format is {<digitsequence>.<something>} - e.g. {01.PURCHASECONTRACT}
    return template.replace(/\{(\d+)\.([^}]+)}/g, placeholderReplacer);
  }
  _exports.formatter = formatter;
  function bindText(textTemplatePropertyPath) {
    return {
      parts: [{
        path: "SitnInstceKey"
      }, {
        path: `_InstanceText/${textTemplatePropertyPath}`
      }],
      formatter: formatter
    };
  }
  _exports.bindText = bindText;
  return _exports;
}, false);
//# sourceMappingURL=SituationsText-dbg.js.map
