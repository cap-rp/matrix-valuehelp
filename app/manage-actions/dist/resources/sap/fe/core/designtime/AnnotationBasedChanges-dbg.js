/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/MetaPath", "sap/ui/core/Component", "sap/ui/core/Lib", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/CommonUtils", "sap/ui/rta/plugin/annotations/AnnotationTypes"], function (Log, MetaModelConverter, MetaPath, Component, Lib, PropertyHelper, CommonUtils, AnnotationTypes) {
  "use strict";

  var _exports = {};
  var isUnit = PropertyHelper.isUnit;
  var isCurrency = PropertyHelper.isCurrency;
  var hasUnit = PropertyHelper.hasUnit;
  var hasCurrency = PropertyHelper.hasCurrency;
  var convertTypes = MetaModelConverter.convertTypes;
  // OK since we are in designtime we can ignore that dependency
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  const resourceBundleDesigntime = Lib.getResourceBundleFor("sap.fe.core.designtime");
  const getText = function (key) {
    return resourceBundleDesigntime.getText(key);
  };
  _exports.getText = getText;
  const TEXT_ARRANGEMENT_LABELS = {
    ["UI.TextArrangementType/TextOnly"]: "Text Only",
    ["UI.TextArrangementType/TextFirst"]: "Text First",
    ["UI.TextArrangementType/TextLast"]: "Text Last",
    ["UI.TextArrangementType/TextSeparate"]: "ID Only"
  };
  function filterPropertyWithTextAnnotation(prop) {
    return prop.annotations.Common?.Text !== undefined && !hasCurrency(prop) && !hasUnit(prop) && !isCurrency(prop) && !isUnit(prop);
  }

  /**
   * Collects all properties with a Text annotation from the given entity type and its navigation properties.
   * @param entityType The entity type to start with
   * @param properties The array to collect the properties in
   * @param filterFn A filter function to determine which properties to collect
   * @param visitedEntity A map to keep track of visited entities
   */
  function _collectProperties(entityType, properties, filterFn, visitedEntity) {
    if (visitedEntity[entityType.fullyQualifiedName]) {
      return;
    }
    visitedEntity[entityType.fullyQualifiedName] = true;
    properties.push(...entityType.entityProperties.filter(filterFn).filter(prop => {
      // Always filter out UI.Hidden = true
      // Always filter out complex type
      if (prop.annotations.UI?.Hidden?.valueOf() === true || !!prop.targetType) {
        return false;
      }
      return true;
    }).map(prop => {
      return {
        property: prop,
        entityType: entityType
      };
    }));
  }
  function collectProperties(templateComponent, control, filterFn) {
    const metaModel = templateComponent.getMetaModel();
    const contextPathToUse = templateComponent.getFullContextPath();
    // Find closest building block
    let buildingBlock = control;
    while (buildingBlock && !buildingBlock.isA("sap.fe.core.buildingBlocks.BuildingBlock")) {
      buildingBlock = buildingBlock.getParent();
    }
    let metaPath = contextPathToUse;
    if (buildingBlock) {
      metaPath = buildingBlock.getProperty("metaPath") ?? contextPathToUse;
    }
    const properties = [];
    if (metaModel && contextPathToUse) {
      let targetEntity;
      try {
        targetEntity = new MetaPath(convertTypes(metaModel), metaPath, contextPathToUse);
      } catch (e) {
        Log.warning(`No metamodel or metaPath is not reachable with ${metaPath} and ${contextPathToUse}`);
        return null;
      }
      const visitedEntity = {};
      // Collect all properties, don't apply filters
      _collectProperties(targetEntity.getClosestEntityType(), properties, filterFn, visitedEntity);
    }
    return properties;
  }
  function getTargetPropertyFromFormElement(oControl) {
    let targetProperty;
    if (oControl.isA("sap.ui.layout.form.FormElement")) {
      const fields = oControl.getFields();
      if (fields?.length > 0 && fields[0].isA("sap.fe.macros.Field")) {
        const targetObject = fields[0];
        targetProperty = targetObject.getMainPropertyRelativePath();
      }
    }
    return targetProperty;
  }
  _exports.getTargetPropertyFromFormElement = getTargetPropertyFromFormElement;
  function getRenameAction() {
    let isAtElementLevel = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    return {
      changeType: "renameLabel",
      title: () => isAtElementLevel ? getText("RTA_CONTEXT_ACTIONMENU_RENAME") : getText("RTA_CONTEXT_ACTIONMENU_CHANGELABELS"),
      icon: "sap-icon://edit",
      singleRename: isAtElementLevel,
      controlBasedRenameChangeType: "renameField",
      type: AnnotationTypes.StringType,
      delegate: {
        getAnnotationsChangeInfo: (oControl, _annotation) => {
          let templateComponent = Component.getOwnerComponentFor(oControl);
          if (!templateComponent) {
            const view = CommonUtils.getTargetView(oControl);
            templateComponent = view?.getController().getOwnerComponent();
          }
          if (templateComponent) {
            let targetProperty;
            const properties = collectProperties(templateComponent, oControl, () => true);
            const targetPropertyPath = getTargetPropertyFromFormElement(oControl);
            if (targetPropertyPath) {
              targetProperty = properties?.find(prop => {
                return prop.property.name === targetPropertyPath;
              })?.property;
            }
            if (properties && properties.length > 0) {
              return {
                serviceUrl: oControl.getModel()?.getServiceUrl(),
                properties: properties.map(prop => {
                  return {
                    propertyName: `${prop.property.name}`,
                    annotationPath: "/" + prop.entityType.fullyQualifiedName + "/" + prop.property.name + "@com.sap.vocabularies.Common.v1.Label",
                    currentValue: prop.property.annotations.Common?.Label?.toString() ?? prop.property.name
                  };
                }),
                possibleValues: [],
                preSelectedProperty: targetProperty ? "/" + targetProperty.fullyQualifiedName + "@com.sap.vocabularies.Common.v1.Label" : "" // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
              };
            }
          }
          return null;
        }
      }
    };
  }
  _exports.getRenameAction = getRenameAction;
  function getTextArrangementChangeAction() {
    let key = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "RTA_CONTEXT_ACTIONMENU_TEXTARRANGE";
    return {
      changeType: "textArrangement_Test",
      title: () => getText(key),
      type: AnnotationTypes.ValueListType,
      delegate: {
        getAnnotationsChangeInfo: (oControl, _annotation) => {
          let templateComponent = Component.getOwnerComponentFor(oControl);
          if (!templateComponent) {
            const view = CommonUtils.getTargetView(oControl);
            templateComponent = view?.getController().getOwnerComponent();
          }
          if (templateComponent) {
            const properties = collectProperties(templateComponent, oControl, filterPropertyWithTextAnnotation);
            if (properties && properties.length > 0) {
              return {
                serviceUrl: oControl.getModel()?.getServiceUrl(),
                properties: properties.map(prop => {
                  const defaultType = prop.entityType.annotations.UI?.TextArrangement?.toString() ?? "UI.TextArrangementType/TextFirst".toString();
                  return {
                    propertyName: prop.property.annotations.Common?.Label?.toString() ?? prop.property.name,
                    annotationPath: "/" + prop.entityType.fullyQualifiedName + "/" + prop.property.name + "@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement",
                    currentValue: prop.property.annotations.Common?.Text?.annotations?.UI?.TextArrangement?.toString() ?? defaultType
                  };
                }),
                possibleValues: Object.keys(TEXT_ARRANGEMENT_LABELS).map(sKey => ({
                  key: sKey,
                  text: TEXT_ARRANGEMENT_LABELS[sKey]
                })),
                preSelectedProperty: "" // if the action is triggered from a control that corresponds to a property, only this one will be shown in the Dialog initially (search field populated with this string)
              };
            }
          }
          return null;
        }
      }
    };
  }
  _exports.getTextArrangementChangeAction = getTextArrangementChangeAction;
  return _exports;
}, false);
//# sourceMappingURL=AnnotationBasedChanges-dbg.js.map
