/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/ManifestWrapper", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper"], function (ManifestWrapper, MetaModelConverter, BindingHelper, ModelHelper, TypeGuards, DataModelPathHelper) {
  "use strict";

  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isServiceObject = TypeGuards.isServiceObject;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var getInvolvedDataModelObjectFromPath = MetaModelConverter.getInvolvedDataModelObjectFromPath;
  var convertTypes = MetaModelConverter.convertTypes;
  /**
   * Checks whether an object is an annotation term.
   * @param vAnnotationPath
   * @returns `true` if it's an annotation term
   */
  const isAnnotationTerm = function (vAnnotationPath) {
    return typeof vAnnotationPath === "object";
  };
  const getDataModelPathForEntitySet = function (resolvedMetaPath, convertedTypes) {
    let rootEntitySet;
    let currentEntitySet;
    let previousEntitySet;
    let currentEntityType;
    let navigatedPaths = [];
    const navigationProperties = [];
    resolvedMetaPath.objectPath.forEach(objectPart => {
      if (isServiceObject(objectPart)) {
        switch (objectPart._type) {
          case "NavigationProperty":
            navigatedPaths.push(objectPart.name);
            navigationProperties.push(objectPart);
            currentEntityType = objectPart.targetType;
            if (previousEntitySet && previousEntitySet.navigationPropertyBinding.hasOwnProperty(navigatedPaths.join("/"))) {
              currentEntitySet = previousEntitySet.navigationPropertyBinding[navigatedPaths.join("/")];
              previousEntitySet = currentEntitySet;
              navigatedPaths = [];
            } else {
              currentEntitySet = undefined;
            }
            break;
          case "EntitySet":
            if (rootEntitySet === undefined) {
              rootEntitySet = objectPart;
            }
            currentEntitySet = objectPart;
            previousEntitySet = currentEntitySet;
            currentEntityType = currentEntitySet?.entityType;
            break;
          default:
            break;
        }
      }
    });
    const dataModelPath = {
      startingEntitySet: rootEntitySet,
      targetEntityType: currentEntityType,
      targetEntitySet: currentEntitySet,
      navigationProperties: navigationProperties,
      contextLocation: undefined,
      targetObject: resolvedMetaPath.target,
      convertedTypes: convertedTypes
    };
    dataModelPath.contextLocation = dataModelPath;
    return dataModelPath;
  };

  /**
   * Create a ConverterContext object that will be used within the converters.
   * @param {ConvertedMetadata} oConvertedTypes The converted annotation and service types
   * @param {BaseManifestSettings} oManifestSettings The manifestSettings that applies to this page
   * @param {TemplateType} templateType The type of template we're looking at right now
   * @param {IDiagnostics} diagnostics The diagnostics shim
   * @param {Function} mergeFn The function to be used to perfom some deep merges between object
   * @param {DataModelObjectPath} targetDataModelPath The global path to reach the entitySet
   * @returns {ConverterContext} A converter context for the converters
   */
  let ConverterContext = /*#__PURE__*/function () {
    //private manifestWrapper: ManifestWrapper;

    function ConverterContext(convertedTypes, manifestWrapper, diagnostics, targetDataModelPath) {
      this.convertedTypes = convertedTypes;
      this.manifestWrapper = manifestWrapper;
      this.diagnostics = diagnostics;
      this.targetDataModelPath = targetDataModelPath;
      this.baseContextPath = getTargetObjectPath(this.targetDataModelPath);
    }
    var _proto = ConverterContext.prototype;
    _proto._getEntityTypeFromFullyQualifiedName = function _getEntityTypeFromFullyQualifiedName(fullyQualifiedName) {
      return this.convertedTypes.entityTypes.find(entityType => {
        if (fullyQualifiedName.startsWith(entityType.fullyQualifiedName)) {
          const replaceAnnotation = fullyQualifiedName.replace(entityType.fullyQualifiedName, "");
          return replaceAnnotation.startsWith("/") || replaceAnnotation.startsWith("@");
        }
        return false;
      });
    }

    /**
     * Retrieve the entityType associated with an annotation object.
     * @param annotation The annotation object for which we want to find the entityType
     * @returns The EntityType the annotation refers to
     */;
    _proto.getAnnotationEntityType = function getAnnotationEntityType(annotation) {
      if (annotation && typeof annotation === "object") {
        const annotationPath = annotation.fullyQualifiedName;
        const targetEntityType = this._getEntityTypeFromFullyQualifiedName(annotationPath);
        if (!targetEntityType) {
          throw new Error(`Cannot find Entity Type for ${annotation.fullyQualifiedName}`);
        }
        return targetEntityType;
      } else {
        return this.targetDataModelPath.targetEntityType;
      }
    }

    /**
     * Retrieve the manifest settings defined for a specific control within controlConfiguration.
     * @param annotationPath The annotation path or object to evaluate
     * @returns The control configuration for that specific annotation path if it exists
     */;
    _proto.getManifestControlConfiguration = function getManifestControlConfiguration(annotationPath) {
      if (isAnnotationTerm(annotationPath)) {
        return this.manifestWrapper.getControlConfiguration(annotationPath.fullyQualifiedName.replace(this.targetDataModelPath.targetEntityType.fullyQualifiedName, ""));
      }
      const hasEntitySetKeyInManifest = typeof this.manifestWrapper.getEntitySet() === "string" && this.manifestWrapper.getEntitySet().length > 0;
      const hasContextPathKeyInManifest = typeof this.manifestWrapper.getContextPath() === "string" && this.manifestWrapper.getContextPath().length > 0;
      const isPathAbsolute = annotationPath.startsWith("/");

      // In case of multiple-entitySet, we compare the entity set of the ControlConfiguration with what is specified either in the 'entitySet' or 'contextPath' manifest setting.
      if (!this.manifestWrapper.hasMultipleEntitySets()) {
        return this.manifestWrapper.getControlConfiguration(annotationPath);
      } else if (!isPathAbsolute && (hasEntitySetKeyInManifest && this.baseContextPath !== `/${this.manifestWrapper.getEntitySet()}` || hasContextPathKeyInManifest && this.baseContextPath !== this.manifestWrapper.getContextPath())) {
        return this.manifestWrapper.getControlConfiguration(`${this.baseContextPath}/${annotationPath}`);
      } else if (Object.keys(this.manifestWrapper.getControlConfiguration(annotationPath)).length > 0) {
        return this.manifestWrapper.getControlConfiguration(annotationPath);
      }
      return this.manifestWrapper.getControlConfiguration(`${this.baseContextPath}/${annotationPath}`);
    }

    /**
     * Create an absolute annotation path based on the current meta model context.
     * @param sAnnotationPath The relative annotation path
     * @returns The correct annotation path based on the current context
     */;
    _proto.getAbsoluteAnnotationPath = function getAbsoluteAnnotationPath(sAnnotationPath) {
      if (!sAnnotationPath) {
        return sAnnotationPath;
      }
      if (sAnnotationPath[0] === "/") {
        return sAnnotationPath;
      }
      return `${this.baseContextPath}/${sAnnotationPath}`;
    }

    /**
     * Retrieve the current entitySet.
     * @returns The current EntitySet if it exists.
     */;
    _proto.getEntitySet = function getEntitySet() {
      return this.targetDataModelPath.targetEntitySet;
    }

    /**
     * Retrieve the context path.
     * @returns The context path of the converter.
     */;
    _proto.getContextPath = function getContextPath() {
      return this.baseContextPath;
    }

    /**
     * Retrieve the current data model object path.
     * @returns The current data model object path
     */;
    _proto.getDataModelObjectPath = function getDataModelObjectPath() {
      return this.targetDataModelPath;
    }

    /**
     * Get the EntityContainer.
     * @returns The current service EntityContainer
     */;
    _proto.getEntityContainer = function getEntityContainer() {
      return this.convertedTypes.entityContainer;
    }

    /**
     * Get the EntityType based on the fully qualified name.
     * @returns The current EntityType.
     */;
    _proto.getEntityType = function getEntityType() {
      return this.targetDataModelPath.targetEntityType;
    }

    /**
     * Gets the entity type of the parameter in case of a parameterized service.
     * @returns The entity type of the parameter
     */;
    _proto.getParameterEntityType = function getParameterEntityType() {
      const parameterEntityType = this.targetDataModelPath.startingEntitySet.entityType;
      const isParameterized = !!parameterEntityType.annotations?.Common?.ResultContext;
      return isParameterized && parameterEntityType;
    }

    /**
     * Retrieves an annotation from an entity type based on annotation path.
     * @param annotationPath The annotation path to be evaluated
     * @returns The target annotation path as well as a converter context to go with it
     */;
    _proto.getEntityTypeAnnotation = function getEntityTypeAnnotation(annotationPath) {
      if (!annotationPath.includes("@")) {
        throw new Error(`Not an annotation path: '${annotationPath}'`);
      }
      const isAbsolute = annotationPath.startsWith("/");
      let path;
      if (isAbsolute) {
        // path can be used as-is
        path = annotationPath;
      } else {
        // build an absolute path based on the entity type (this function works on the type!)
        const base = this.getContextPath().split("@", 1)[0];
        path = base.endsWith("/") ? base + annotationPath : `${base}/${annotationPath}`;
      }
      const target = this.resolveAbsolutePath(path);
      const dataModelObjectPath = getInvolvedDataModelObjectFromPath({
        target: target.target,
        visitedObjects: target.objectPath
      }, this.convertedTypes, isAbsolute ? undefined : this.targetDataModelPath.contextLocation, true);
      return {
        annotation: target.target,
        converterContext: new ConverterContext(this.convertedTypes, this.manifestWrapper, this.diagnostics, dataModelObjectPath)
      };
    }

    /**
     * Retrieve the type of template we're working on (e.g. ListReport / ObjectPage / ...).
     * @returns The current tenplate type
     */;
    _proto.getTemplateType = function getTemplateType() {
      return this.manifestWrapper.getTemplateType();
    }

    /**
     * Retrieve the converted types.
     * @returns The current converted types
     */;
    _proto.getConvertedTypes = function getConvertedTypes() {
      return this.convertedTypes;
    }

    /**
     * Retrieve a relative annotation path between an annotation path and an entity type.
     * @param annotationPath
     * @param entityType
     * @returns The relative anntotation path.
     */;
    _proto.getRelativeAnnotationPath = function getRelativeAnnotationPath(annotationPath, entityType) {
      return annotationPath.replace(entityType.fullyQualifiedName, "");
    }

    /**
     * Transform an entityType based path to an entitySet based one (ui5 templating generally expect an entitySetBasedPath).
     * @param annotationPath
     * @returns The EntitySet based annotation path
     */;
    _proto.getEntitySetBasedAnnotationPath = function getEntitySetBasedAnnotationPath(annotationPath) {
      if (!annotationPath) {
        return annotationPath;
      }
      const entityTypeFQN = this.targetDataModelPath.targetEntityType.fullyQualifiedName;
      if (this.targetDataModelPath.targetEntitySet || (this.baseContextPath.startsWith("/") && this.baseContextPath.match(/\//g) || []).length > 1) {
        let replacedAnnotationPath = annotationPath.replace(entityTypeFQN, "/");
        if (replacedAnnotationPath.length > 2 && replacedAnnotationPath[0] === "/" && replacedAnnotationPath[1] === "/") {
          replacedAnnotationPath = replacedAnnotationPath.substring(1);
        }
        return this.baseContextPath + (replacedAnnotationPath.startsWith("/") ? replacedAnnotationPath : `/${replacedAnnotationPath}`);
      } else {
        return `/${annotationPath}`;
      }
    }

    /**
     * Retrieve the manifest wrapper for the current context.
     * @returns The current manifest wrapper
     */;
    _proto.getManifestWrapper = function getManifestWrapper() {
      return this.manifestWrapper;
    };
    _proto.getDiagnostics = function getDiagnostics() {
      return this.diagnostics;
    }

    /**
     * Retrieve the target from an absolute path.
     * @param path The path we want to get the target
     * @returns The absolute path
     */;
    _proto.resolveAbsolutePath = function resolveAbsolutePath(path) {
      return this.convertedTypes.resolvePath(path);
    }

    /**
     * Retrieve a new converter context, scoped for a different context path.
     * @param contextPath The path we want to orchestrate the converter context around
     * @returns The converted context for the sub path
     */;
    _proto.getConverterContextFor = function getConverterContextFor(contextPath) {
      const resolvedMetaPath = this.convertedTypes.resolvePath(contextPath);
      const targetPath = getDataModelPathForEntitySet(resolvedMetaPath, this.convertedTypes);
      return new ConverterContext(this.convertedTypes, this.manifestWrapper, this.diagnostics, targetPath);
    }

    /**
     * Get all annotations of a given term and vocabulary on an entity type
     * (or on the current entity type if entityType isn't specified).
     * @param vocabularyName
     * @param annotationTerm
     * @param [annotationSources]
     * @returns All the annotation for a specific term and vocabulary from an entity type
     */;
    _proto.getAnnotationsByTerm = function getAnnotationsByTerm(vocabularyName, annotationTerm) {
      let annotationSources = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [this.getEntityType()];
      let outAnnotations = [];
      annotationSources.forEach(annotationSource => {
        if (annotationSource) {
          const annotations = annotationSource?.annotations[vocabularyName] || {};
          if (annotations) {
            outAnnotations = Object.keys(annotations).filter(annotation => annotations[annotation].term === annotationTerm).reduce((previousValue, key) => {
              previousValue.push(annotations[key]);
              return previousValue;
            }, outAnnotations);
          }
        }
      });
      return outAnnotations;
    }

    /**
     * Retrieves the relative model path based on the current context path.
     * @returns The relative model path or undefined if the path is not resolveable
     */;
    _proto.getRelativeModelPathFunction = function getRelativeModelPathFunction() {
      const targetDataModelPath = this.targetDataModelPath;
      const convertedMetaModel = this.convertedTypes;
      return function (sPath) {
        const singletonPath = singletonPathVisitor(sPath, convertedMetaModel, []);
        const enhancedPath = enhanceDataModelPath(targetDataModelPath, sPath);
        const contextRelativePath = getContextRelativeTargetObjectPath(enhancedPath, true);
        if (contextRelativePath) {
          return contextRelativePath;
        }
        return singletonPath;
      };
    }

    /**
     * Create the converter context necessary for a macro based on a metamodel context.
     * @param entityName
     * @param oMetaModelContext
     * @param diagnostics
     * @param mergeFn
     * @param targetDataModelPath
     * @param manifestWrapper
     * @returns The current converter context
     */;
    ConverterContext.createConverterContextForMacro = function createConverterContextForMacro(entityName, oMetaModelContext, diagnostics, mergeFn, targetDataModelPath, manifestWrapper) {
      const oMetaModel = oMetaModelContext.isA("sap.ui.model.odata.v4.ODataMetaModel") ? oMetaModelContext : oMetaModelContext.getModel();
      const oConvertedMetadata = convertTypes(oMetaModel);
      let targetEntitySet = oConvertedMetadata.entitySets.find(entitySet => entitySet.name === entityName);
      if (!targetEntitySet) {
        targetEntitySet = oConvertedMetadata.singletons.find(entitySet => entitySet.name === entityName);
      }
      if (!targetDataModelPath || targetEntitySet !== targetDataModelPath.startingEntitySet) {
        targetDataModelPath = {
          startingEntitySet: targetEntitySet,
          navigationProperties: [],
          targetEntitySet: targetEntitySet,
          // contained entity does not have an entity set but only entity type
          targetEntityType: targetEntitySet?.entityType || oConvertedMetadata.entityTypes.find(entityType => entityType.name === entityName),
          targetObject: targetEntitySet,
          convertedTypes: oConvertedMetadata
        };
      }
      if (!manifestWrapper) {
        manifestWrapper = new ManifestWrapper({});
      }
      return new ConverterContext(oConvertedMetadata, manifestWrapper, diagnostics, targetDataModelPath);
    }

    /**
     * Resolves a metadata binding to its text.
     * @param path
     * @returns The resolved text if possible, else the input value or an empty string if the path was undefined
     */;
    _proto.fetchTextFromMetaModel = function fetchTextFromMetaModel(path) {
      return ModelHelper.fetchTextFromMetaModel(path, this);
    };
    return ConverterContext;
  }();
  return ConverterContext;
}, false);
//# sourceMappingURL=ConverterContext-dbg.js.map
