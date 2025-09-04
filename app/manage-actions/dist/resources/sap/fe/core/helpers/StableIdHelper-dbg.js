/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  /**
   * Generates the ID from an IBN.
   *
   * The ID contains the value, the potential action and context.
   * @param dataField The IBN annotation
   * @returns The ID
   */
  const _getStableIdPartFromIBN = dataField => {
    const idParts = [dataField.SemanticObject.valueOf(), dataField.Action?.valueOf()];
    if (dataField.RequiresContext) {
      idParts.push("RequiresContext");
    }
    return idParts.filter(id => id).join("::");
  };

  /**
   * Generates the ID part related to the value of the DataField.
   * @param dataField The DataField
   * @returns String related to the DataField value
   */
  const _getStableIdPartFromValue = dataField => {
    const value = dataField.Value;
    if (value.path) {
      return value.path;
    } else if (value.$Apply && value.$Function === "odata.concat") {
      return value.$Apply.map(app => app.$Path).join("::");
    }
    return replaceSpecialChars(value.replace(/ /g, "_"));
  };

  /**
   * Generates the ID part related to the value or url of the DataFieldWithUrl.
   * @param dataField The DataFieldWithUrl
   * @returns String related to the DataFieldWithUrl value or url
   */
  const _getStableIdPartFromUrlOrPath = dataField => {
    const value = dataField.Value;
    if (value?.path) {
      return value.path;
    } else if (value?.$Apply && value.$Function === "odata.concat") {
      return value.$Apply.map(app => app.$Path).join("::");
    }
    const url = dataField.Url;
    if (isPathAnnotationExpression(url) && url?.path) {
      return url.path;
    } else if (url?.$Apply && url.$Function === "odata.concat") {
      return url.$Apply.map(app => app.$Path).join("::");
    }
    return replaceSpecialChars(value?.replace(/ /g, "_"));
  };

  /**
   * Copy for the Core.isValid function to be independent.
   * @param value String to validate
   * @returns Whether the value is valid or not
   */
  const _isValid = value => {
    return /^([A-Za-z_][-A-Za-z0-9_.:]*)$/.test(value);
  };

  /**
   * Removes the annotation namespaces.
   * @param id String to manipulate
   * @returns String without the annotation namespaces
   */
  const _removeNamespaces = id => {
    id = id.replace("com.sap.vocabularies.UI.v1.", "");
    id = id.replace("com.sap.vocabularies.Communication.v1.", "");
    return id;
  };

  /**
   * Generates the ID from an annotation.
   * @param annotation The annotation
   * @param idPreparation Determines whether the ID needs to be prepared for final usage
   * @returns The ID
   */
  const createIdForAnnotation = function (annotation) {
    let idPreparation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
    let id;
    switch (annotation.$Type) {
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        id = annotation.ID ?? annotation.Target.value;
        break;
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        id = annotation.ID ?? "undefined"; // CollectionFacet without Id is not supported but doesn't necessary fail right now
        break;
      case "com.sap.vocabularies.UI.v1.FieldGroupType":
        id = annotation.Label;
        break;
      default:
        id = getStableIdPartFromDataField(annotation);
        break;
    }
    id = id?.toString();
    return id && idPreparation ? prepareId(id) : id;
  };

  /**
   * Generates a stable ID based on the given parameters.
   *
   * Parameters are combined in the same order in which they are provided and are separated by '::'.
   * Generate(['Stable', 'Id']) would result in 'Stable::Id' as the stable ID.
   * Currently supported annotations are Facets, FieldGroup and all kinds of DataField.
   * @param stableIdParts Array of strings, undefined, dataModelObjectPath or annotations
   * @returns Stable ID constructed from the provided parameters
   */
  _exports.createIdForAnnotation = createIdForAnnotation;
  const generate = stableIdParts => {
    const ids = stableIdParts.map(element => {
      if (typeof element === "string" || !element) {
        return element;
      }
      return createIdForAnnotation(element.targetObject || element, false);
    });
    const result = ids.filter(id => id).join("::");
    return prepareId(result);
  };

  /**
   * Generates the ID from a DataField.
   * @param dataField The DataField
   * @param ignoreForCompatibility Ignore a part of the ID on the DataFieldWithNavigationPath to be aligned with previous versions
   * @returns The ID
   */
  _exports.generate = generate;
  const getStableIdPartFromDataField = function (dataField) {
    let ignoreForCompatibility = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let id = "";
    switch (dataField.$Type) {
      case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        id = `DataFieldForAction::${dataField.Action}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
        // DataFieldForActionGroup comes with ID property unlike other DataField types
        id = `DataFieldForActionGroup::${dataField.ID}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        id = `DataFieldForIntentBasedNavigation::${_getStableIdPartFromIBN(dataField)}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        id = `DataFieldForAnnotation::${dataField.Target.value}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        id = `DataFieldWithAction::${_getStableIdPartFromValue(dataField)}::${dataField.Action}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataField":
        id = `DataField::${_getStableIdPartFromValue(dataField)}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        id = `DataFieldWithIntentBasedNavigation::${_getStableIdPartFromValue(dataField)}::${_getStableIdPartFromIBN(dataField)}`;
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        id = `DataFieldWithNavigationPath::${_getStableIdPartFromValue(dataField)}`;
        if (dataField.Target.type === "NavigationPropertyPath" && !ignoreForCompatibility) {
          id = `${id}::${dataField.Target.value}`;
        }
        break;
      case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        id = `DataFieldWithUrl::${_getStableIdPartFromUrlOrPath(dataField)}`;
        break;
      default:
        break;
    }
    return id ? prepareId(id) : undefined;
  };

  /**
   * Removes or replaces with "::" some special characters.
   * Special characters (@, /, #) are replaced by '::' if they are in the middle of the stable ID and removed altogether if they are at the beginning or end.
   * @param id String to manipulate
   * @returns String without the special characters
   */
  _exports.getStableIdPartFromDataField = getStableIdPartFromDataField;
  const replaceSpecialChars = id => {
    if (id.includes(" ")) {
      throw Error(`${id} - Spaces are not allowed in ID parts.`);
    }
    id = id.replace(/^\/|^@|^#|^\*/, "") // remove special characters from the beginning of the string
    .replace(/\/$|@$|#$|\*$/, "") // remove special characters from the end of the string
    .replace(/[/|@()#]/g, "::"); // replace special characters with ::

    // Replace double occurrences of the separator with a single separator
    while (id.includes("::::")) {
      id = id.replace("::::", "::");
    }

    // If there is a :: at the end of the ID remove it
    if (id.slice(-2) == "::") {
      id = id.slice(0, -2);
    }
    return id;
  };

  /**
   * Prepares the ID.
   *
   * Removes namespaces and special characters and checks the validity of this ID.
   * @param id The ID
   * @returns The ID or throws an error
   */
  _exports.replaceSpecialChars = replaceSpecialChars;
  const prepareId = function (id) {
    id = replaceSpecialChars(_removeNamespaces(id));
    if (_isValid(id)) {
      return id;
    } else {
      throw Error(`${id} - Stable Id could not be generated due to insufficient information.`);
    }
  };
  _exports.prepareId = prepareId;
  return _exports;
}, false);
//# sourceMappingURL=StableIdHelper-dbg.js.map
