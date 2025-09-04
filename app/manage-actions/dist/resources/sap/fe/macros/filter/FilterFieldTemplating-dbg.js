/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/core/converters/MetaModelConverter"], function (PropertyHelper, UIFormatters, MetaModelConverter) {
  "use strict";

  var _exports = {};
  var getDisplayMode = UIFormatters.getDisplayMode;
  var hasValueHelp = PropertyHelper.hasValueHelp;
  const getDisplayProperty = function (propertyObjectPath, propertyConverted) {
    return hasValueHelp(propertyConverted) ? getDisplayMode(propertyObjectPath) : "Value";
  };
  _exports.getDisplayProperty = getDisplayProperty;
  const getFilterFieldDisplayFormat = async function (propertyObjectPath, propertyConverted, propertyInterface) {
    const oTextAnnotation = propertyConverted?.annotations?.Common?.Text;
    if (oTextAnnotation) {
      // The text annotation should be on the property defined
      return getDisplayProperty(propertyObjectPath, propertyConverted);
    }
    const bHasValueHelp = hasValueHelp(propertyConverted);
    if (bHasValueHelp) {
      // Exceptional case for missing text annotation on the property (retrieve text from value list)
      // Consider TextArrangement at EntityType otherwise set default display format 'DescriptionValue'
      const entityTextArrangement = propertyObjectPath?.targetEntityType?.annotations?.UI?.TextArrangement;
      return entityTextArrangement ? getDisplayMode(propertyObjectPath) : _getDisplayModeFromValueHelp(propertyInterface, propertyObjectPath);
    }
    return "Value";
  };

  /**
   * Method to determine the display mode from the value help.
   * @param Interface The current templating context
   * @param propertyObjectPath The global path to reach the entitySet
   * @returns A promise with the string 'DescriptionValue' or 'Value', depending on whether a text annotation exists for the property in the value help
   * Hint: A text arrangement is consciously ignored. If the text is retrieved from the value help, the text arrangement of the value help property isn´t considered. Instead, the default text arrangement #TextFirst
   * is used.
   */
  _exports.getFilterFieldDisplayFormat = getFilterFieldDisplayFormat;
  async function _getDisplayModeFromValueHelp(Interface, propertyObjectPath) {
    const context = Interface.context;
    const metaModel = Interface.context.getModel();
    return metaModel.requestValueListInfo(context.getPath(), true, context).then(function (valueListInfo) {
      const firstKey = Object.keys(valueListInfo)[0];
      const firstValueListInfo = valueListInfo[firstKey];
      const valueListParameter = firstValueListInfo.Parameters?.find(element => {
        return element.LocalDataProperty?.$PropertyPath === propertyObjectPath?.targetObject?.name;
      });
      const valueListProperty = valueListParameter?.ValueListProperty;
      const propertyConverted = MetaModelConverter.getInvolvedDataModelObjects(metaModel.createBindingContext("/" + firstValueListInfo.CollectionPath + "/" + valueListProperty));
      return getDisplayMode(propertyConverted);
    });
  }
  _exports._getDisplayModeFromValueHelp = _getDisplayModeFromValueHelp;
  return _exports;
}, false);
//# sourceMappingURL=FilterFieldTemplating-dbg.js.map
