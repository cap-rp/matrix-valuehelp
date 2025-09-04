/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"], function (TypeGuards) {
  "use strict";

  var _exports = {};
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationPath = TypeGuards.isAnnotationPath;
  function isServiceObject(objectPart) {
    return objectPart && objectPart.hasOwnProperty("_type");
  }
  function enhancePath(sBasePath, sPathAddition) {
    if (sPathAddition) {
      if (sPathAddition.startsWith("/")) {
        return sPathAddition;
      } else if (sPathAddition.startsWith("@")) {
        return sBasePath + sPathAddition;
      } else if (!sBasePath.endsWith("/")) {
        return sBasePath + "/" + sPathAddition;
      } else {
        return sBasePath + sPathAddition;
      }
    }
    return sBasePath;
  }
  let MetaPath = /*#__PURE__*/function () {
    /**
     * Create the MetaPath object.
     * @param convertedMetadata The current model converter output
     * @param metaPath The current object metaPath
     * @param contextPath The current context
     */
    function MetaPath(convertedMetadata, metaPath, contextPath) {
      this.convertedMetadata = convertedMetadata;
      this.metaPath = metaPath;
      this.contextPath = contextPath;
      this.navigationProperties = [];
      this.contextNavigationProperties = [];
      this.absolutePath = enhancePath(contextPath, metaPath);
      this.relativePath = this.absolutePath.replace(contextPath, "");
      if (this.relativePath.startsWith("/")) {
        this.relativePath = this.relativePath.substring(1);
      }
      const resolvedMetaPath = this.convertedMetadata.resolvePath(this.absolutePath);
      const resolvedContextPath = this.convertedMetadata.resolvePath(contextPath);
      if (resolvedMetaPath.target === undefined || resolvedMetaPath.target === null) {
        throw new Error(`No annotation target found for ${metaPath}`);
      }
      this.targetObject = resolvedMetaPath.target;
      let rootEntitySet;
      let currentEntitySet;
      let currentEntityType;
      let navigatedPaths = [];
      resolvedMetaPath.objectPath.forEach(objectPart => {
        if (isServiceObject(objectPart)) {
          switch (objectPart._type) {
            case "NavigationProperty":
              navigatedPaths.push(objectPart.name);
              this.navigationProperties.push(objectPart);
              currentEntityType = objectPart.targetType;
              if (currentEntitySet && currentEntitySet.navigationPropertyBinding.hasOwnProperty(navigatedPaths.join("/"))) {
                currentEntitySet = currentEntitySet.navigationPropertyBinding[navigatedPaths.join("/")];
                navigatedPaths = [];
              }
              break;
            case "Singleton":
            case "EntitySet":
              if (rootEntitySet === undefined) {
                rootEntitySet = objectPart;
              }
              currentEntitySet = objectPart;
              currentEntityType = currentEntitySet.entityType;
              break;
            case "EntityType":
              if (currentEntityType === undefined) {
                currentEntityType = objectPart;
              }
              break;
            default:
              break;
          }
        }
      });
      resolvedContextPath.objectPath.forEach(objectPart => {
        rootEntitySet = this.getResolvedContextPath(objectPart, currentEntityType, rootEntitySet);
      });
      if (rootEntitySet === undefined || currentEntityType === undefined) {
        throw new Error("MetaPath doesn't contain an entitySet -> Should never happen");
      }
      this.serviceObjectPath = this.contextPath;
      if (this.navigationProperties.length) {
        this.serviceObjectPath += "/" + this.navigationProperties.map(nav => nav.name).join("/");
      }
      this.rootEntitySet = rootEntitySet;
      this.currentEntitySet = currentEntitySet;
      this.currentEntityType = currentEntityType;
    }
    _exports = MetaPath;
    var _proto = MetaPath.prototype;
    _proto.getResolvedContextPath = function getResolvedContextPath(objectPart, currentEntityType, rootEntitySet) {
      if (isServiceObject(objectPart)) {
        switch (objectPart._type) {
          case "NavigationProperty":
            this.contextNavigationProperties.push(objectPart);
            break;
          case "EntitySet":
            if (this.contextRootEntitySet === undefined) {
              this.contextRootEntitySet = objectPart;
            }
            if (rootEntitySet === undefined && objectPart.entityType === currentEntityType) {
              rootEntitySet = objectPart;
            }
            break;
          default:
            break;
        }
      }
      return rootEntitySet;
    };
    _proto.getContextPath = function getContextPath() {
      return this.contextPath;
    }

    /**
     * Retrieve the absolute path for this MetaPath.
     * @param sPathPart The path to evaluate
     * @returns The absolute path
     */;
    _proto.getPath = function getPath(sPathPart) {
      return enhancePath(this.absolutePath, sPathPart);
    }

    /**
     * Retrieve the path relative to the context for this MetaPath.
     * @param sPathPart The path to evaluate
     * @returns The relative path
     */;
    _proto.getRelativePath = function getRelativePath(sPathPart) {
      return enhancePath(this.relativePath, sPathPart);
    }

    /**
     * Retrieve the typed target for this object call.
     * @returns The typed target object
     */;
    _proto.getTarget = function getTarget() {
      return this.targetObject;
    }

    /**
     * Retrieve the closest entityset in the path.
     * @returns The closest entityset
     */;
    _proto.getClosestEntitySet = function getClosestEntitySet() {
      let closestEntitySet = this.rootEntitySet;
      for (const navigationProperty of this.navigationProperties) {
        if (closestEntitySet.navigationPropertyBinding[navigationProperty.name]) {
          closestEntitySet = closestEntitySet.navigationPropertyBinding[navigationProperty.name];
        }
      }
      return closestEntitySet;
    };
    _proto.getClosestEntityType = function getClosestEntityType() {
      let closestEntityType = this.rootEntitySet.entityType;
      for (const navigationProperty of this.navigationProperties) {
        closestEntityType = navigationProperty.targetType;
      }
      return closestEntityType;
    }

    /**
     * Retrieve the closest entityset in the path.
     * @returns The closest entityset
     */;
    _proto.getContextClosestEntitySet = function getContextClosestEntitySet() {
      let closestEntitySet = this.contextRootEntitySet;
      if (closestEntitySet) {
        for (const navigationProperty of this.contextNavigationProperties) {
          if (closestEntitySet.navigationPropertyBinding[navigationProperty.name]) {
            closestEntitySet = closestEntitySet.navigationPropertyBinding[navigationProperty.name];
          }
        }
      }
      return closestEntitySet;
    };
    _proto.getNavigationProperties = function getNavigationProperties() {
      return this.navigationProperties;
    };
    _proto.getMetaPathForPath = function getMetaPathForPath(targetPath) {
      try {
        return new MetaPath(this.convertedMetadata, enhancePath(this.serviceObjectPath, targetPath), this.contextPath);
      } catch {
        return undefined;
      }
    };
    _proto.getMetaPathForObject = function getMetaPathForObject(targetObject) {
      if (isAnnotationPath(targetObject)) {
        return this.getMetaPathForPath(targetObject.value);
      } else if (isPathAnnotationExpression(targetObject)) {
        return this.getMetaPathForPath(targetObject.path);
      } else {
        let metaPathApp = targetObject?.fullyQualifiedName?.replace(this.rootEntitySet?.entityType.fullyQualifiedName, this.contextPath);
        if (metaPathApp === targetObject?.fullyQualifiedName) {
          metaPathApp = targetObject.fullyQualifiedName?.replace(this.targetObject?.fullyQualifiedName, this.relativePath); // This branch is reached when the target has no relationship to the parent, in that case the fullyQualifiedName refers to the full path of the new target as something completely independent somehow, we need to make sure it's considered as a root object.
        }
        return new MetaPath(this.convertedMetadata, metaPathApp, this.contextPath);
      }
    };
    _proto.getConvertedMetadata = function getConvertedMetadata() {
      return this.convertedMetadata;
    };
    _proto.getDataModelObjectPath = function getDataModelObjectPath() {
      return {
        targetObject: this.targetObject,
        startingEntitySet: this.rootEntitySet,
        targetEntitySet: this.getClosestEntitySet(),
        targetEntityType: this.getClosestEntityType(),
        navigationProperties: this.getNavigationProperties(),
        convertedTypes: this.convertedMetadata
      };
    };
    return MetaPath;
  }();
  _exports = MetaPath;
  return _exports;
}, false);
//# sourceMappingURL=MetaPath-dbg.js.map
