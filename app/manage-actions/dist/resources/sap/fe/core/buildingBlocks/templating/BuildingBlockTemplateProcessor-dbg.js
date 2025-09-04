/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/base/util/uid", "sap/fe/base/BindingToolkit", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/buildingBlocks/templating/AttributeModel", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/helpers/TypeGuards", "sap/ui/base/BindingParser", "sap/ui/core/util/XMLPreprocessor", "sap/ui/model/json/JSONModel", "../TraceInfo"], function (Log, deepClone, uid, BindingToolkit, jsx, AttributeModel, ConfigurableObject, TypeGuards, BindingParser, XMLPreprocessor, JSONModel, TraceInfo) {
  "use strict";

  var _exports = {};
  var isFunctionArray = TypeGuards.isFunctionArray;
  var isContext = TypeGuards.isContext;
  var Placement = ConfigurableObject.Placement;
  var isUndefinedExpression = BindingToolkit.isUndefinedExpression;
  var isBindingToolkitExpression = BindingToolkit.isBindingToolkitExpression;
  var compileExpression = BindingToolkit.compileExpression;
  const LOGGER_SCOPE = "sap.fe.core.buildingBlocks.templating.BuildingBlockTemplateProcessor";
  const XMLTEMPLATING_NS = "http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1";
  const DOMParserInstance = new DOMParser();

  /**
   * Definition of a meta data context
   */

  function validateMacroMetadataContext(sName, mContexts, oContextSettings, sKey) {
    const oContext = mContexts[sKey];
    const oContextObject = oContext?.getObject();
    if (oContextSettings.required === true && (!oContext || oContextObject === null)) {
      throw new Error(`${sName}: Required metadataContext '${sKey}' is missing`);
    } else if (oContextObject) {
      // If context object has $kind property, $Type should not be checked
      // Therefore remove from context settings
      if (oContextObject.hasOwnProperty("$kind") && oContextObject.$kind !== undefined && oContextSettings.expectedTypes !== undefined) {
        // Check if the $kind is part of the allowed ones
        if (!oContextSettings.expectedTypes.includes(oContextObject.$kind)) {
          throw new Error(`${sName}: '${sKey}' must be '$kind' '${oContextSettings.expectedTypes}' but is '${oContextObject.$kind}': ${oContext.getPath()}`);
        }
      } else if (oContextObject.hasOwnProperty("$Type") && oContextObject.$Type !== undefined && oContextSettings.expectedAnnotationTypes) {
        // Check only $Type
        if (!oContextSettings.expectedAnnotationTypes.includes(oContextObject.$Type)) {
          throw new Error(`${sName}: '${sKey}' must be '$Type' '${oContextSettings.expectedAnnotationTypes}' but is '${oContextObject.$Type}': ${oContext.getPath()}`);
        }
      }
    }
  }
  function validateMacroSignature(sName, oMetadata, mContexts, oNode) {
    const aMetadataContextKeys = oMetadata.metadataContexts && Object.keys(oMetadata.metadataContexts) || [],
      aProperties = oMetadata.properties && Object.keys(oMetadata.properties) || [],
      oAttributeNames = {};

    // collect all attributes to find unchecked properties
    const attributeNames = oNode.getAttributeNames();
    for (const attributeName of attributeNames) {
      oAttributeNames[attributeName] = true;
    }

    //Check metadataContexts
    aMetadataContextKeys.forEach(function (sKey) {
      const oContextSettings = oMetadata.metadataContexts[sKey];
      validateMacroMetadataContext(sName, mContexts, oContextSettings, sKey);
      delete oAttributeNames[sKey];
    });
    //Check properties
    aProperties.forEach(function (sKey) {
      const oPropertySettings = oMetadata.properties[sKey];
      if (!oNode.hasAttribute(sKey)) {
        if (oPropertySettings.required && !oPropertySettings.hasOwnProperty("defaultValue")) {
          throw new Error(`${sName}: ` + `Required property '${sKey}' is missing`);
        }
      } else {
        delete oAttributeNames[sKey];
      }
    });

    // Unchecked properties
    Object.keys(oAttributeNames).forEach(function (sKey) {
      // no check for properties which contain a colon ":" (different namespace), e.g. xmlns:trace, trace:macroID, unittest:id
      if (!sKey.includes(":") && !sKey.startsWith("xmlns")) {
        Log.warning(`Unchecked parameter: ${sName}: ${sKey}`, undefined, LOGGER_SCOPE);
      }
    });
  }
  _exports.validateMacroSignature = validateMacroSignature;
  const SAP_UI_CORE_ELEMENT = "sap.ui.core.Element";
  const SAP_UI_MODEL_CONTEXT = "sap.ui.model.Context";

  /**
   * Transforms the metadata of a building block by adding additional aggregations,
   * and splitting properties into actual properties and metadata contexts.
   * @param buildingBlockMetadata The metadata received from the input
   * @returns The transformed metadata
   */
  _exports.SAP_UI_MODEL_CONTEXT = SAP_UI_MODEL_CONTEXT;
  function transformMetadata(buildingBlockMetadata) {
    const properties = {
      class: {
        type: "string",
        isPublic: true
      }
    };
    const aggregations = {
      dependents: {
        type: SAP_UI_CORE_ELEMENT,
        slot: "dependents",
        isPublic: true
      },
      customData: {
        type: SAP_UI_CORE_ELEMENT,
        slot: "customData",
        isPublic: true
      },
      layoutData: {
        type: SAP_UI_CORE_ELEMENT,
        slot: "layoutData",
        isPublic: true
      },
      ...buildingBlockMetadata.aggregations
    };
    const metadataContexts = {};
    for (const propertyName of Object.keys(buildingBlockMetadata.properties)) {
      const propertyType = buildingBlockMetadata.properties[propertyName].type;
      if (propertyType !== SAP_UI_MODEL_CONTEXT) {
        properties[propertyName] = buildingBlockMetadata.properties[propertyName];
      }
      if ([SAP_UI_MODEL_CONTEXT, "object", "array"].includes(propertyType)) {
        // Explicitly defined contexts, objects, and arrays may come from the metadataContext
        metadataContexts[propertyName] = buildingBlockMetadata.properties[propertyName];
      }
    }
    return {
      ...buildingBlockMetadata,
      properties,
      metadataContexts,
      aggregations
    };
  }

  /**
   * Checks the absolute or context paths and returns an appropriate MetaContext.
   * @param oSettings Additional settings
   * @param sAttributeValue The attribute value
   * @returns The meta data context object
   */
  function _checkAbsoluteAndContextPaths(oSettings, sAttributeValue) {
    let sMetaPath;
    if (sAttributeValue && sAttributeValue.startsWith("/")) {
      // absolute path - we just use this one
      sMetaPath = sAttributeValue;
    } else {
      let sContextPath = oSettings.currentContextPath.getPath();
      if (!sContextPath.endsWith("/")) {
        sContextPath += "/";
      }
      sMetaPath = sContextPath + sAttributeValue;
    }
    return {
      model: "metaModel",
      path: sMetaPath
    };
  }

  /**
   * This method helps to create the metadata context in case it is not yet available in the store.
   * @param oSettings Additional settings
   * @param sAttributeName The attribute name
   * @param sAttributeValue The attribute value
   * @returns The meta data context object
   */
  function _createInitialMetadataContext(oSettings, sAttributeName, sAttributeValue) {
    let returnContext;
    if (sAttributeValue.startsWith("/uid--") && !oSettings.models.converterContext.getProperty(sAttributeValue)) {
      const data = unstoreObjectValue(sAttributeValue);
      oSettings.models.converterContext.setProperty(sAttributeValue, data);
      returnContext = {
        model: "converterContext",
        path: sAttributeValue
      };
    } else if (sAttributeName === "metaPath" && oSettings.currentContextPath || sAttributeName === "contextPath") {
      returnContext = _checkAbsoluteAndContextPaths(oSettings, sAttributeValue);
    } else if (sAttributeValue && sAttributeValue.startsWith("/")) {
      // absolute path - we just use this one
      returnContext = {
        model: "metaModel",
        path: sAttributeValue
      };
    } else {
      returnContext = {
        model: "metaModel",
        path: oSettings.bindingContexts.entitySet ? oSettings.bindingContexts.entitySet.getPath(sAttributeValue) : sAttributeValue
      };
    }
    return returnContext;
  }
  function _getMetadataContext(oSettings, oNode, sAttributeName, oVisitor, bDoNotResolve, isOpen) {
    let oMetadataContext;
    if (!bDoNotResolve && oNode.hasAttribute(sAttributeName)) {
      let sAttributeValue = oNode.getAttribute(sAttributeName);
      oMetadataContext = BindingParser.complexParser(sAttributeValue);
      if (oMetadataContext && sAttributeName === "metaPath" && oMetadataContext.model && oMetadataContext.path) {
        // if the metaPath is filled through a JSON model, we can't use this context as the metadataContext,
        // but instead we have to create a new one with the actual value
        const metaContextPath = `${oMetadataContext.model}>${oMetadataContext.path}`;
        const context = oVisitor.getContext(metaContextPath);
        if (context?.getModel()?.isA("sap.ui.model.json.JSONModel")) {
          sAttributeValue = context.getObject();
          oMetadataContext = undefined;
        }
      }
      if (!oMetadataContext) {
        oMetadataContext = _createInitialMetadataContext(oSettings, sAttributeName, sAttributeValue);
      }
    } else if (oSettings.bindingContexts.hasOwnProperty(sAttributeName)) {
      oMetadataContext = {
        model: sAttributeName,
        path: ""
      };
    } else if (isOpen) {
      try {
        if (oVisitor.getContext(`${sAttributeName}>`)) {
          oMetadataContext = {
            model: sAttributeName,
            path: ""
          };
        }
      } catch (e) {
        return undefined;
      }
    }
    return oMetadataContext;
  }

  /**
   * Parse the incoming XML node and try to resolve the properties defined there.
   * @param oMetadata The metadata for the building block
   * @param oNode The XML node to parse
   * @param isPublic Whether the building block is used in a public context or not
   * @param oVisitor The visitor instance
   * @returns The processed properties
   */
  async function processProperties(oMetadata, oNode, isPublic, oVisitor) {
    const definitionProperties = oMetadata.properties;

    // Retrieve properties values
    const aDefinitionPropertiesKeys = Object.keys(definitionProperties);
    const propertyValues = {};
    for (const sKeyValue of aDefinitionPropertiesKeys) {
      if (definitionProperties[sKeyValue].type === "object") {
        propertyValues[sKeyValue] = definitionProperties[sKeyValue].defaultValue && deepClone(definitionProperties[sKeyValue].defaultValue); // To avoid values being reused across macros
      } else {
        propertyValues[sKeyValue] = definitionProperties[sKeyValue].defaultValue;
      }
      if (oNode.hasAttribute(sKeyValue) && isPublic && definitionProperties[sKeyValue].isPublic !== true) {
        Log.error(`Property ${sKeyValue} was ignored as it is not intended for public usage`);
      } else if (oNode.hasAttribute(sKeyValue)) {
        await oVisitor.visitAttribute(oNode, oNode.attributes.getNamedItem(sKeyValue));
        let value = oNode.getAttribute(sKeyValue);
        if (value !== undefined && value !== null) {
          if (typeof value === "string" && !value.startsWith("{")) {
            switch (definitionProperties[sKeyValue].type) {
              case "boolean":
                value = value === "true";
                break;
              case "number":
                value = Number(value);
                break;
            }
          }
          value = value === null ? undefined : value;
          propertyValues[sKeyValue] = value;
        }
      }
    }
    return propertyValues;
  }

  /**
   * Parse the incoming XML node and try to resolve the binding contexts defined inside.
   * @param oMetadata The metadata for the building block
   * @param oSettings The settings object
   * @param oNode The XML node to parse
   * @param isPublic Whether the building block is used in a public context or not
   * @param oVisitor The visitor instance
   * @param mContexts The contexts to be used
   * @param propertyValues The current property values
   * @returns The processed and missing contexts
   */
  function processContexts(oMetadata, oSettings, oNode, isPublic, oVisitor, mContexts, propertyValues) {
    oSettings.currentContextPath = oSettings.bindingContexts.contextPath;
    const mMissingContext = {};
    const oDefinitionContexts = oMetadata.metadataContexts;
    const aDefinitionContextsKeys = Object.keys(oDefinitionContexts);
    // Since the metaPath and other property can be relative to the contextPath we need to evaluate the current contextPath first
    const contextPathIndex = aDefinitionContextsKeys.indexOf("contextPath");
    if (contextPathIndex !== -1) {
      // If it is defined we extract it and reinsert it in the first position of the array
      const contextPathDefinition = aDefinitionContextsKeys.splice(contextPathIndex, 1);
      aDefinitionContextsKeys.splice(0, 0, contextPathDefinition[0]);
    }
    for (const sAttributeName of aDefinitionContextsKeys) {
      // If the context was resolved as a property (binding / xml aggregation) then we don't need to resolve it here.
      const propertyValue = propertyValues[sAttributeName];
      if (propertyValue !== undefined && typeof propertyValue === "object" && Object.keys(propertyValue).length > 0) {
        delete oMetadata.metadataContexts[sAttributeName];
        continue;
      }
      const bDoNotResolve = isPublic && oDefinitionContexts[sAttributeName].isPublic === false && oNode.hasAttribute(sAttributeName);
      const oMetadataContext = _getMetadataContext(oSettings, oNode, sAttributeName, oVisitor, bDoNotResolve, oMetadata.isOpen ?? false);
      if (oMetadataContext) {
        oMetadataContext.name = sAttributeName;
        addSingleContext(mContexts, oVisitor, oMetadataContext);
        if ((sAttributeName === "entitySet" || sAttributeName === "contextPath") && !oSettings.bindingContexts.hasOwnProperty(sAttributeName)) {
          oSettings.bindingContexts[sAttributeName] = mContexts[sAttributeName];
        }
        if (sAttributeName === "contextPath") {
          oSettings.currentContextPath = mContexts[sAttributeName];
        }
        if (mContexts[sAttributeName] !== undefined) {
          propertyValues[sAttributeName] = mContexts[sAttributeName];
        } else if (typeof propertyValues[sAttributeName] === "string") {
          // If the binding couldn't be resolved consider that there was no value here
          delete oMetadata.metadataContexts[sAttributeName];
        }
      } else {
        mMissingContext[sAttributeName] = true;
      }
    }
    return mMissingContext;
  }
  async function parseAggregation(oVisitor, oAggregation, definition) {
    const oOutObjects = {};
    if (oAggregation && oAggregation.children.length > 0) {
      const firstElementChild = oAggregation.firstElementChild;
      if (firstElementChild?.namespaceURI === XMLTEMPLATING_NS) {
        // In case we encounter a templating tag, run the visitor on it and continue with the resulting child
        const oParent = firstElementChild.parentNode;
        if (oParent) {
          await oVisitor.visitNode(firstElementChild);
        }
      }
      const children = oAggregation.children;
      for (let childIdx = 0; childIdx < children.length; childIdx++) {
        const childDefinition = children[childIdx];
        let childKey = childDefinition.getAttribute("key") || childDefinition.getAttribute("id") || definition?.skipKey && definition.multiple === false && uid();
        if (childKey) {
          childKey = `InlineXML_${childKey}`;
          childDefinition.setAttribute("key", childKey);
          let aggregationObject = {
            key: childKey,
            position: {
              placement: childDefinition.getAttribute("placement") || Placement.After,
              anchor: childDefinition.getAttribute("anchor") || undefined
            },
            type: "Slot"
          };
          if (definition?.processAggregations) {
            aggregationObject = definition.processAggregations(childDefinition, aggregationObject);
          }
          oOutObjects[aggregationObject.key] = aggregationObject;
        } else if (childDefinition.tagName !== "slot") {
          Log.error(`The aggregation ${childDefinition.nodeName} is missing a Key attribute. It is not displayed`);
        }
      }
    }
    return oOutObjects;
  }

  /**
   * Processes the child nodes of the building block properties when the type is an object.
   * @param element The XML element to parse
   * @returns The processed object
   */
  function processObject(element) {
    const children = element.children;
    const myArray = [];
    const myObject = {};
    for (const attributeName of element.getAttributeNames()) {
      myObject[attributeName] = element.getAttribute(attributeName);
    }
    if (children.length > 0) {
      const childNodeNames = Object.keys(children).map(key => children[key].localName);
      const childIsArray = childNodeNames.length !== new Set(childNodeNames).size;
      for (const childDefinition of children) {
        if (childIsArray) {
          myArray.push(processObject(childDefinition));
        } else {
          myObject[childDefinition.localName] = processObject(childDefinition);
        }
      }
      if (childIsArray) {
        return myArray;
      }
    }
    return myObject;
  }

  /**
   * Processes the child nodes of the building block and parses them as either aggregations or object-/array-based values.
   * @param oNode The XML node for which to process the children
   * @param oVisitor The visitor instance
   * @param oMetadata The metadata for the building block
   * @param isPublic Whether the building block is used in a public context or not
   * @param propertyValues The values of already parsed property
   * @returns The processed children
   */
  async function processChildren(oNode, oVisitor, oMetadata, isPublic, propertyValues) {
    const oAggregations = {};
    if (oNode.firstElementChild !== null) {
      let oFirstElementChild = oNode.firstElementChild;
      while (oFirstElementChild !== null) {
        if (oFirstElementChild.namespaceURI === XMLTEMPLATING_NS) {
          // In case we encounter a templating tag, run the visitor on it and continue with the resulting child
          const oParent = oFirstElementChild.parentNode;
          if (oParent) {
            const iChildIndex = Array.from(oParent.children).indexOf(oFirstElementChild);
            await oVisitor.visitNode(oFirstElementChild);
            oFirstElementChild = oParent.children[iChildIndex] ? oParent.children[iChildIndex] : null;
          } else {
            // Not sure how this could happen but I also don't want to create infinite loops
            oFirstElementChild = oFirstElementChild.nextElementSibling;
          }
        } else {
          const sChildName = oFirstElementChild.localName;
          let sAggregationName = sChildName;
          if (sAggregationName[0].toUpperCase() === sAggregationName[0]) {
            // not a sub aggregation, go back to default Aggregation
            sAggregationName = oMetadata.defaultAggregation || "";
          }
          const aggregationDefinition = oMetadata.aggregations[sAggregationName];
          if (aggregationDefinition !== undefined && !aggregationDefinition.slot) {
            const parsedAggregation = await parseAggregation(oVisitor, oFirstElementChild, aggregationDefinition);
            propertyValues[sAggregationName] = parsedAggregation;
            for (const parsedAggregationKey in parsedAggregation) {
              oMetadata.aggregations[parsedAggregationKey] = parsedAggregation[parsedAggregationKey];
            }
          }
          oFirstElementChild = oFirstElementChild.nextElementSibling;
        }
      }
      oFirstElementChild = oNode.firstElementChild;
      while (oFirstElementChild !== null) {
        const oNextChild = oFirstElementChild.nextElementSibling;
        const sChildName = oFirstElementChild.localName;
        let sAggregationName = sChildName;
        if (sAggregationName[0].toUpperCase() === sAggregationName[0]) {
          // not a sub aggregation, go back to default Aggregation
          sAggregationName = oMetadata.defaultAggregation || "";
        }
        if (Object.keys(oMetadata.aggregations).includes(sAggregationName) && (!isPublic || oMetadata.aggregations[sAggregationName].isPublic === true)) {
          const aggregationDefinition = oMetadata.aggregations[sAggregationName];
          if (!aggregationDefinition.slot && oFirstElementChild !== null && oFirstElementChild.children.length > 0) {
            await oVisitor.visitNode(oFirstElementChild);
            let childDefinition = oFirstElementChild.firstElementChild;
            while (childDefinition) {
              const nextChild = childDefinition.nextElementSibling;
              if (!aggregationDefinition.hasVirtualNode) {
                const childWrapper = document.createElementNS(oNode.namespaceURI, childDefinition.getAttribute("key"));
                childWrapper.appendChild(childDefinition);
                oAggregations[childDefinition.getAttribute("key")] = childWrapper;
              } else {
                oAggregations[childDefinition.getAttribute("key")] = childDefinition;
              }
              childDefinition.removeAttribute("key");
              childDefinition = nextChild;
            }
          } else if (aggregationDefinition.slot) {
            await oVisitor.visitNode(oFirstElementChild);
            if (sAggregationName !== sChildName) {
              if (!oAggregations[sAggregationName]) {
                const oNewChild = document.createElementNS(oNode.namespaceURI, sAggregationName);
                oAggregations[sAggregationName] = oNewChild;
              }
              oAggregations[sAggregationName].appendChild(oFirstElementChild.cloneNode(true));
            } else {
              oAggregations[sAggregationName] = oFirstElementChild.cloneNode(true);
            }
          }
        } else if (Object.keys(oMetadata.properties).includes(sAggregationName)) {
          await oVisitor.visitNode(oFirstElementChild);
          if (oMetadata.properties[sAggregationName].type === "object") {
            const aggregationPropertyValues = processObject(oFirstElementChild);
            propertyValues[sAggregationName] = aggregationPropertyValues;
          } else if (oMetadata.properties[sAggregationName].type === "array") {
            if (oFirstElementChild !== null && oFirstElementChild.children.length > 0) {
              const children = oFirstElementChild.children;
              const oOutObjects = [];
              for (let childIdx = 0; childIdx < children.length; childIdx++) {
                const childDefinition = children[childIdx];
                // non keyed child, just add it to the aggregation
                const myChild = {};
                const attributeNames = childDefinition.getAttributeNames();
                for (const attributeName of attributeNames) {
                  myChild[attributeName] = childDefinition.getAttribute(attributeName);
                }
                oOutObjects.push(myChild);
              }
              propertyValues[sAggregationName] = oOutObjects;
            }
          }
        }
        oFirstElementChild = oNextChild;
      }
    }
    return oAggregations;
  }
  function processSlots(oAggregations, oMetadataAggregations, oNode) {
    let processCustomData = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (Object.keys(oAggregations).length > 0) {
      Object.keys(oAggregations).forEach(function (sAggregationName) {
        const oAggregationElement = oAggregations[sAggregationName];
        if (oNode !== null && oNode !== undefined && oAggregationElement) {
          // slots can have :: as keys which is not a valid aggregation name therefore replacing them
          const oElementChild = oAggregationElement.firstElementChild;
          if (!["dependents", "customData", "layoutData"].includes(sAggregationName)) {
            const sSlotName = oMetadataAggregations[sAggregationName] !== undefined && oMetadataAggregations[sAggregationName].slot || sAggregationName;
            const oTargetElement = oNode.querySelector(`slot[name='${sSlotName}']`);
            if (oTargetElement !== null) {
              const oNewChild = prepareAggregationElement(oNode, sAggregationName, oElementChild);
              oTargetElement.replaceWith(...oNewChild.children); // Somehow TS doesn't like this but the documentation says is should work
            }
          } else if (processCustomData && oElementChild !== null) {
            const sSlotName = oMetadataAggregations[sAggregationName] !== undefined && oMetadataAggregations[sAggregationName].slot || sAggregationName;
            const oTargetElement = oNode.querySelector(`slot[name='${sSlotName}']`);
            const oNewChild = prepareAggregationElement(oNode, sAggregationName, oElementChild);
            if (oTargetElement !== null) {
              oTargetElement.replaceWith(...oNewChild.children); // Somehow TS doesn't like this but the documentation says is should work
            } else {
              oNode.appendChild(oNewChild);
            }
          }
        }
      });
    }
  }
  function prepareAggregationElement(oNode, sAggregationName, oElementChild) {
    const oNewChild = document.createElementNS(oNode.namespaceURI, sAggregationName.replace(/:/gi, "_"));
    while (oElementChild) {
      const oNextChild = oElementChild.nextElementSibling;
      oNewChild.appendChild(oElementChild);
      oElementChild = oNextChild;
    }
    return oNewChild;
  }
  async function processBuildingBlock(BuildingBlockClass, oNode, oVisitor) {
    let isPublic = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const oMetadata = transformMetadata(BuildingBlockClass.metadata);
    const sFragmentName = oMetadata.fragment ?? `${oMetadata.namespace ?? oMetadata.publicNamespace}.${oMetadata.xmlTag ?? oMetadata.name}`;
    const mContexts = {};
    const oSettings = oVisitor.getSettings();

    // Add an empty converter context if there is none in order to have a place to store object values
    oSettings.models.converterContext ??= new JSONModel();

    //Inject storage for macros
    if (!oSettings[sFragmentName]) {
      oSettings[sFragmentName] = {};
    }

    // First of all we need to visit the attributes to resolve the properties and the metadata contexts
    const propertyValues = await processProperties(oMetadata, oNode, isPublic, oVisitor);
    const initialKeys = Object.keys(propertyValues);
    const mMissingContext = processContexts(oMetadata, oSettings, oNode, isPublic, oVisitor, mContexts, propertyValues);
    try {
      // Aggregation and complex type support
      const oAggregations = await processChildren(oNode, oVisitor, oMetadata, isPublic, propertyValues);
      let oControlConfig = {};
      if (oSettings.models.viewData) {
        // Only used in the Field macro and even then maybe not really useful
        oControlConfig = oSettings.models.viewData.getProperty("/controlConfiguration");
      }
      let processedPropertyValues = propertyValues;
      Object.keys(propertyValues).forEach(propName => {
        let oData = propertyValues[propName];
        //check for additional processing function to validate / overwrite parameters
        const originalDefinition = BuildingBlockClass?.metadata?.properties[propName];
        if (originalDefinition?.validate) {
          oData = originalDefinition.validate(oData) || oData;
        }
        if (oData?.isA?.(SAP_UI_MODEL_CONTEXT) && !oData.getModel().isA("sap.ui.model.odata.v4.ODataMetaModel")) {
          propertyValues[propName] = oData.getObject();
        }
      });
      propertyValues.isPublic = isPublic;
      const oInstance = new BuildingBlockClass({
        ...propertyValues,
        ...oAggregations
      }, oControlConfig, oSettings);
      processedPropertyValues = oInstance.getProperties();
      Object.keys(oMetadata.metadataContexts).forEach(function (sContextName) {
        if (processedPropertyValues.hasOwnProperty(sContextName)) {
          const targetObject = processedPropertyValues[sContextName];
          if (isContext(targetObject)) {
            mContexts[sContextName] = targetObject;
          } else if (typeof targetObject === "object") {
            const attributeValue = storeObjectValue(targetObject);
            oSettings.models.converterContext.setProperty(attributeValue, targetObject);
            const newContext = oSettings.models.converterContext.createBindingContext(attributeValue);
            unstoreObjectValue(attributeValue);
            mContexts[sContextName] = newContext;
          }
        }
      });
      const oAttributesModel = new AttributeModel(oNode, processedPropertyValues, BuildingBlockClass);
      mContexts["this"] = oAttributesModel.createBindingContext("/");
      let oPreviousMacroInfo;
      // core:require need to be defined on the node itself to be picked up due to the templating step
      const coreRequire = oNode?.getAttribute("core:require") || undefined;

      // Keep track
      if (TraceInfo.isTraceInfoActive()) {
        const oTraceInfo = TraceInfo.traceMacroCalls(sFragmentName, oMetadata, mContexts, oNode, oVisitor);
        if (oTraceInfo?.macroInfo) {
          oPreviousMacroInfo = oSettings["_macroInfo"];
          oSettings["_macroInfo"] = oTraceInfo.macroInfo;
        }
      }
      validateMacroSignature(sFragmentName, oMetadata, mContexts, oNode);
      const oContextVisitor = oVisitor.with(mContexts, oMetadata.isOpen !== undefined ? !oMetadata.isOpen : true);
      const oParent = oNode.parentNode;
      let iChildIndex;
      let oPromise;
      if (oParent) {
        iChildIndex = Array.from(oParent.children).indexOf(oNode);
        if (oMetadata.fragment) {
          oPromise = oContextVisitor.insertFragment(sFragmentName, oNode);
        } else {
          const oldKeys = Object.keys(temporaryObjectStore);
          const templateString = await jsx.renderAsXML(async () => oInstance.getTemplate(oNode));
          if (BuildingBlockClass.isRuntime) {
            // For runtime building blocks, we need to attach all objects to the converterContext directly, as the actual rendering takes place at runtime
            for (const storeKey in temporaryObjectStore) {
              if (!oldKeys.includes(storeKey)) {
                const data = unstoreObjectValue(storeKey);
                oSettings.models.converterContext.setProperty(storeKey, data);
              }
            }
          }
          let hasError = "";
          if (templateString) {
            let hasParseError = false;
            let parsedTemplate = parseXMLString(templateString, true);
            // For safety purpose we try to detect trailing text in between XML Tags
            for (const element of parsedTemplate) {
              const iter = document.createNodeIterator(element, NodeFilter.SHOW_TEXT);
              let textnode = iter.nextNode();
              if (element.localName === "parsererror") {
                hasParseError = true;
              }
              while (textnode) {
                if (textnode.textContent && textnode.textContent.trim().length > 0) {
                  hasError = textnode.textContent;
                }
                textnode = iter.nextNode();
              }
            }
            if (hasParseError) {
              // If there is a parseerror while processing the XML it means the XML itself is malformed, as such we rerun the template process
              // Setting isTraceMode true will make it so that each xml` expression is checked for validity from XML perspective
              // If an error is found it's returned instead of the normal fragment
              Log.error(`Error while processing building block ${oMetadata.xmlTag || oMetadata.name}`, hasError);
              parsedTemplate = await processXmlInTrace(async () => {
                const initialTemplate = await jsx.renderAsXML(async () => oInstance.getTemplate(oNode));
                return parseXMLString(initialTemplate ?? "", true);
              });
            } else if (hasError.length > 0) {
              // If there is trailing text we create a standard error and display it.
              Log.error(`Error while processing building block ${oMetadata.xmlTag || oMetadata.name}`);
              const oErrorText = createErrorXML([`Error while processing building block ${oMetadata.xmlTag || oMetadata.name}`, `Trailing text was found in the XML: ${hasError}`], parsedTemplate.map(template => template.outerHTML).join("\n"));
              parsedTemplate = parseXMLString(oErrorText, true);
            }
            oNode.replaceWith(...parsedTemplate);
            const visitedNodes = parsedTemplate.map(async internalNode => {
              processSlots(oAggregations, oMetadata.aggregations, internalNode, false);
              return oContextVisitor.visitNode(internalNode);
            });
            oPromise = Promise.all(visitedNodes);
          } else {
            oNode.remove();
            oPromise = Promise.resolve();
          }
        }
        await oPromise;
        const oMacroElement = oParent.children[iChildIndex];
        processSlots(oAggregations, oMetadata.aggregations, oMacroElement, true);
        if (oMacroElement !== undefined) {
          const oRemainingSlots = oMacroElement.querySelectorAll("slot");
          oRemainingSlots.forEach(function (oSlotElement) {
            oSlotElement.remove();
          });
          if (coreRequire) {
            let requireOnMacro = oMacroElement.getAttributeNS("sap.ui.core", "require");
            if (requireOnMacro) {
              requireOnMacro = requireOnMacro.substring(0, requireOnMacro.length - 1) + "," + coreRequire.substring(1); // Remove last } and first {
            } else {
              requireOnMacro = coreRequire;
            }
            oMacroElement.setAttributeNS("sap.ui.core", "core:require", requireOnMacro);
          }
          if (propertyValues.class && !BuildingBlockClass.isRuntime) {
            oMacroElement.classList.add(propertyValues.class);
          }
        }
      }
      if (oPreviousMacroInfo) {
        //restore macro info if available
        oSettings["_macroInfo"] = oPreviousMacroInfo;
      } else {
        delete oSettings["_macroInfo"];
      }
    } catch (e) {
      // In case there is a generic error (usually code error), we retrieve the current context information and create a dedicated error message

      const traceDetails = {
        initialProperties: {},
        resolvedProperties: {},
        missingContexts: mMissingContext
      };
      for (const propertyName of initialKeys) {
        const propertyValue = propertyValues[propertyName];
        if (isContext(propertyValue)) {
          traceDetails.initialProperties[propertyName] = {
            path: propertyValue.getPath(),
            value: propertyValue.getObject()
          };
        } else {
          traceDetails.initialProperties[propertyName] = propertyValue;
        }
      }
      for (const propertyName in propertyValues) {
        const propertyValue = propertyValues[propertyName];
        if (!initialKeys.includes(propertyName)) {
          if (isContext(propertyValue)) {
            traceDetails.resolvedProperties[propertyName] = {
              path: propertyValue.getPath(),
              value: propertyValue.getObject()
            };
          } else {
            traceDetails.resolvedProperties[propertyName] = propertyValue;
          }
        }
      }
      Log.error(e);
      const oError = createErrorXML([`Error while processing building block ${oMetadata.name}`], oNode.outerHTML, traceDetails, e.stack);
      const oTemplate = parseXMLString(oError, true);
      oNode.replaceWith(...oTemplate);
    }
  }
  function addSingleContext(mContexts, oVisitor, oCtx) {
    const sKey = oCtx.name || oCtx.model || undefined;
    if (mContexts[sKey]) {
      return; // do not add twice
    }
    try {
      let sContextPath = oCtx.path;
      if (oCtx.model !== null) {
        sContextPath = `${oCtx.model}>${sContextPath}`;
      }
      const mSetting = oVisitor.getSettings();
      if (oCtx.model === "converterContext" && oCtx.path.length > 0) {
        mContexts[sKey] = mSetting.models[oCtx.model].getContext(oCtx.path /*, mSetting.bindingContexts[oCtx.model]*/); // add the context to the visitor
      } else if (!mSetting.bindingContexts[oCtx.model] && mSetting.models[oCtx.model]) {
        mContexts[sKey] = mSetting.models[oCtx.model].getContext(oCtx.path); // add the context to the visitor
      } else {
        mContexts[sKey] = oVisitor.getContext(sContextPath); // add the context to the visitor
      }
    } catch (ex) {
      // ignore the context as this can only be the case if the model is not ready,
      // i.e. not a preprocessing model but maybe a model for providing afterwards
    }
  }

  /**
   * Register a building block definition to be used inside the xml template processor.
   * @param BuildingBlockClass The building block definition
   */
  function registerBuildingBlock(BuildingBlockClass) {
    if (BuildingBlockClass.metadata.namespace !== undefined) {
      XMLPreprocessor.plugIn(async (oNode, oVisitor) => processBuildingBlock(BuildingBlockClass, oNode, oVisitor), BuildingBlockClass.metadata.namespace, BuildingBlockClass.metadata.xmlTag || BuildingBlockClass.metadata.name);
    }
    if (BuildingBlockClass.metadata.publicNamespace !== undefined) {
      XMLPreprocessor.plugIn(async (oNode, oVisitor) => processBuildingBlock(BuildingBlockClass, oNode, oVisitor, true), BuildingBlockClass.metadata.publicNamespace, BuildingBlockClass.metadata.xmlTag || BuildingBlockClass.metadata.name);
    }
  }

  /**
   * UnRegister a building block definition so that it is no longer used inside the xml template processor.
   * @param BuildingBlockClass The building block definition
   */
  _exports.registerBuildingBlock = registerBuildingBlock;
  function unregisterBuildingBlock(BuildingBlockClass) {
    if (BuildingBlockClass.metadata.namespace !== undefined) {
      XMLPreprocessor.plugIn(null, BuildingBlockClass.metadata.namespace, BuildingBlockClass.metadata.xmlTag || BuildingBlockClass.metadata.name);
    }
    if (BuildingBlockClass.metadata.publicNamespace !== undefined) {
      XMLPreprocessor.plugIn(null, BuildingBlockClass.metadata.publicNamespace, BuildingBlockClass.metadata.xmlTag || BuildingBlockClass.metadata.name);
    }
  }
  _exports.unregisterBuildingBlock = unregisterBuildingBlock;
  function createErrorXML(errorMessages, xmlFragment, additionalData, stack) {
    const errorLabels = errorMessages.map(errorMessage => xml`<m:Label text="${escapeXMLAttributeValue(errorMessage)}"/>`);
    let errorStack = "";
    if (stack) {
      const stackFormatted = btoa(`<pre>${stack}</pre>`);
      errorStack = xml`<m:FormattedText htmlText="{= BBF.base64Decode('${stackFormatted}') }" />`;
    }
    let additionalText = "";
    if (additionalData) {
      additionalText = xml`<m:VBox>
						<m:Label text="Trace Info"/>
						<code:CodeEditor type="json"  value="${`{= BBF.base64Decode('${btoa(JSON.stringify(additionalData, null, 4))}') }`}" height="300px" />
					</m:VBox>`;
    }
    return xml`<controls:FormElementWrapper xmlns:controls="sap.fe.core.controls">
					<m:VBox xmlns:m="sap.m" xmlns:code="sap.ui.codeeditor" core:require="{BBF:'sap/fe/core/buildingBlocks/templating/BuildingBlockFormatter'}">
					${errorLabels}
					${errorStack}
						<grid:CSSGrid gridTemplateRows="fr" gridTemplateColumns="repeat(2,1fr)" gridGap="1rem" xmlns:grid="sap.ui.layout.cssgrid" >
							<m:VBox>
								<m:Label text="How the building block was called"/>
								<code:CodeEditor type="xml" value="${`{= BBF.base64Decode('${btoa(xmlFragment.replaceAll("&gt;", ">"))}') }`}" height="300px" />
							</m:VBox>
							${additionalText}
						</grid:CSSGrid>
					</m:VBox>
				</controls:FormElementWrapper>`;
  }
  const temporaryObjectStore = {};

  /**
   * Stores an object value in a temporary storage and returns an ID used to retrieve this value at a later point in time.
   *
   * Required as there is functionality like the xml` function, which might take objects as parameters but needs to return a serialized string.
   * @param value Value to store
   * @returns ID to retrieve this value
   */
  function storeObjectValue(value) {
    const propertyUID = `/uid--${uid()}`;
    temporaryObjectStore[propertyUID] = value;
    return propertyUID;
  }

  /**
   * Unstores an object from a temporary store by removing it and returning its object value.
   * @param propertyUID ID to retrieve this value
   * @returns Object value
   */
  _exports.storeObjectValue = storeObjectValue;
  function unstoreObjectValue(propertyUID) {
    const value = temporaryObjectStore[propertyUID];
    delete temporaryObjectStore[propertyUID];
    return value;
  }
  let processNextXmlInTrace = false;
  /**
   * Makes sure that all xml` calls inside the given method are processed in trace mode.
   * @param method The method to execute
   * @returns The return value of the given method
   */
  const processXmlInTrace = async function (method) {
    processNextXmlInTrace = true;
    let returnValue;
    try {
      returnValue = method();
    } finally {
      processNextXmlInTrace = false;
    }
    return returnValue;
  };

  /**
   * Parse an XML string and return the associated document.
   * @param xmlString The xml string
   * @param [addDefaultNamespaces] Whether or not default namespaces should be added
   * @returns The XML document.
   */
  function parseXMLString(xmlString) {
    let addDefaultNamespaces = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (addDefaultNamespaces) {
      xmlString = `<template
						xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
						xmlns:m="sap.m"
						xmlns:macros="sap.fe.macros"
						xmlns:core="sap.ui.core"
						xmlns:mdc="sap.ui.mdc"
						xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1">${xmlString}</template>`;
    }
    const xmlDocument = DOMParserInstance.parseFromString(xmlString, "text/xml");
    let output = xmlDocument.firstElementChild;
    while (output?.localName === "template") {
      output = output.firstElementChild;
    }
    const children = output?.parentElement ? output?.parentElement.children : [output];
    return Array.from(children);
  }

  /**
   * Escape an XML attribute value.
   * @param value The attribute value to escape.
   * @returns The escaped string.
   */
  _exports.parseXMLString = parseXMLString;
  function escapeXMLAttributeValue(value) {
    return value?.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  _exports.escapeXMLAttributeValue = escapeXMLAttributeValue;
  function renderInTraceMode(outStr) {
    const xmlResult = parseXMLString(outStr, true);
    if (xmlResult?.length > 0 && xmlResult[0]?.localName === "parsererror") {
      const errorMessage = xmlResult[0].innerText || xmlResult[0].innerHTML;
      return createErrorXML([errorMessage.split("\n")[0]], outStr);
    } else {
      return outStr;
    }
  }
  /**
   * Create a string representation of the template literal while handling special object case.
   * @param strings The string parts of the template literal
   * @param values The values part of the template literal
   * @returns The XML string document representing the string that was used.
   */
  const xml = function (strings) {
    let outStr = "";
    let i;
    for (var _len = arguments.length, values = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      values[_key - 1] = arguments[_key];
    }
    for (i = 0; i < values.length; i++) {
      outStr += strings[i];

      // Handle the different case of object, if it's an array we join them, if it's a binding expression then we compile it.
      const value = values[i];
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        outStr += value.flat(5).join("\n").trim();
      } else if (isFunctionArray(value)) {
        outStr += value.map(valuefn => valuefn()).join("\n");
      } else if (isBindingToolkitExpression(value)) {
        const compiledExpression = compileExpression(value);
        outStr += escapeXMLAttributeValue(compiledExpression);
      } else if (typeof value === "undefined") {
        outStr += "{this>undefinedValue}";
      } else if (typeof value === "function") {
        outStr += value();
      } else if (typeof value === "object" && value !== null) {
        if (isContext(value)) {
          outStr += value.getPath();
        } else {
          const propertyUId = storeObjectValue(value);
          outStr += `${propertyUId}`;
        }
      } else if (value && typeof value === "string" && !value.startsWith("<") && !value.startsWith("&lt;")) {
        outStr += escapeXMLAttributeValue(value);
      } else {
        outStr += value;
      }
    }
    outStr += strings[i];
    outStr = outStr.trim();
    if (processNextXmlInTrace) {
      return renderInTraceMode(outStr);
    }
    return outStr;
  };
  _exports.xml = xml;
  const addConditionallyToXML = function (condition, partToAdd) {
    if (condition) {
      return partToAdd;
    } else {
      return "";
    }
  };

  /**
   * Add an attribute depending on the current value of the property.
   * If it's undefined the attribute is not added.
   * @param attributeName
   * @param value
   * @returns The attribute to add if the value is not undefined, otherwise an empty string
   */
  _exports.addConditionallyToXML = addConditionallyToXML;
  const addAttributeToXML = function (attributeName, value) {
    if (value !== undefined && !isUndefinedExpression(value)) {
      return () => xml`${attributeName}="${value}"`;
    } else {
      return () => "";
    }
  };
  _exports.addAttributeToXML = addAttributeToXML;
  return _exports;
}, false);
//# sourceMappingURL=BuildingBlockTemplateProcessor-dbg.js.map
