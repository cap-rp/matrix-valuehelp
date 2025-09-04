/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2024 SAP SE. All rights reserved
 */
 sap.ui.define([], function() {
 	var FEDefinition;
/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 42:
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Placement = exports.BaseDefinition = void 0;
exports.annotation = annotation;
exports.configurable = configurable;
let Placement = exports.Placement = /*#__PURE__*/function (Placement) {
  Placement["After"] = "After";
  Placement["Before"] = "Before";
  Placement["End"] = "End";
  return Placement;
}({});
class BaseDefinition {
  constructor(metaPath, configuration) {
    this.annotationPath = metaPath?.getPath();
    for (const configurablePropertiesKey in this.__configurableProperties) {
      const configSettings = this.__configurableProperties[configurablePropertiesKey];
      if (configSettings) {
        const configurationValue = configuration[configSettings.aliasFor];
        if (configurationValue !== undefined) {
          this[configurablePropertiesKey] = configSettings.validator(configurationValue);
        } else if (configSettings.defaultValue !== undefined) {
          this[configurablePropertiesKey] = configSettings.defaultValue;
        }
      }
    }
    const targetObject = metaPath?.getTarget();
    if (targetObject) {
      for (const annotationPropertiesKey in this.__annotationProperties) {
        const configSettings = this.__annotationProperties[annotationPropertiesKey];
        if (configSettings) {
          const configurationValue = targetObject.annotations._annotations?.[configSettings.term];
          if (configurationValue !== undefined && configurationValue !== null) {
            this[annotationPropertiesKey] = configurationValue.valueOf();
          } else if (configSettings.defaultValue !== undefined) {
            this[annotationPropertiesKey] = configSettings.defaultValue;
          }
        }
      }
    }
  }
  getConfiguration() {
    const outObj = {};
    for (const configurablePropertiesKey in this.__configurableProperties) {
      const configSettings = this.__configurableProperties[configurablePropertiesKey];
      if (configSettings) {
        outObj[configSettings.aliasFor] = this[configurablePropertiesKey];
      }
    }
    return outObj;
  }
}
exports.BaseDefinition = BaseDefinition;
function noop(value) {
  return value;
}
function configurable(propertyConfiguration = {}) {
  return function (target, propertyKey, propertyDescriptor) {
    const localPropertyConfiguration = {
      name: propertyKey,
      validator: propertyConfiguration.validator || noop,
      aliasFor: propertyConfiguration.aliasFor || propertyKey,
      defaultValue: propertyDescriptor.initializer?.()
    };
    const targetPrototype = target.constructor.prototype;
    if (!targetPrototype.__configurableProperties) {
      targetPrototype.__configurableProperties = {};
    }
    delete propertyDescriptor?.initializer;
    targetPrototype.__configurableProperties[propertyKey] = localPropertyConfiguration;
  };
}
function annotation(annotationConfiguration) {
  return function (target, propertyKey, propertyDescriptor) {
    const localAnnotationConfiguration = {
      name: propertyKey,
      term: annotationConfiguration.term,
      defaultValue: propertyDescriptor.initializer?.()
    };
    const targetPrototype = target.constructor.prototype;
    if (!targetPrototype.__annotationProperties) {
      targetPrototype.__annotationProperties = {};
    }
    targetPrototype.__annotationProperties[propertyKey] = localAnnotationConfiguration;
    delete propertyDescriptor.initializer;
    return propertyDescriptor;
  }; // This is technically an accessor decorator, but somehow the compiler doesn't like it if i declare it as such.;
}


/***/ }),

/***/ 156:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _TypeGuards = __webpack_require__(890);
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
/**
 *
 */
class MetaPath {
  /**
   * Create the MetaPath object.
   * @param convertedMetadata The current model converter output
   * @param metaPath The current object metaPath
   * @param contextPath The current context
   */
  constructor(convertedMetadata, metaPath, contextPath) {
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
      if ((0, _TypeGuards.isServiceObject)(objectPart)) {
        switch (objectPart._type) {
          case "NavigationProperty":
            navigatedPaths.push(objectPart.name);
            this.navigationProperties.push(objectPart);
            currentEntityType = objectPart.targetType;
            if (currentEntitySet?.navigationPropertyBinding.hasOwnProperty(navigatedPaths.join("/"))) {
              currentEntitySet = currentEntitySet.navigationPropertyBinding[navigatedPaths.join("/")];
              navigatedPaths = [];
            }
            break;
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
    this.serviceObjectPath = "/" + rootEntitySet.name;
    if (this.navigationProperties.length) {
      this.serviceObjectPath += "/" + this.navigationProperties.map(nav => nav.name).join("/");
    }
    this.rootEntitySet = rootEntitySet;
    this.currentEntitySet = currentEntitySet;
    this.currentEntityType = currentEntityType;
  }
  getResolvedContextPath(objectPart, currentEntityType, rootEntitySet) {
    if ((0, _TypeGuards.isServiceObject)(objectPart)) {
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
  }
  getContextPath() {
    return this.contextPath;
  }

  /**
   * Retrieve the absolute path for this MetaPath.
   * @param sPathPart The path to evaluate
   * @returns The absolute path
   */
  getPath(sPathPart) {
    return enhancePath(this.absolutePath, sPathPart);
  }

  /**
   * Retrieve the path relative to the context for this MetaPath.
   * @param sPathPart The path to evaluate
   * @returns The relative path
   */
  getRelativePath(sPathPart) {
    return enhancePath(this.relativePath, sPathPart);
  }

  /**
   * Retrieve the typed target for this object call.
   * @returns The typed target object
   */
  getTarget() {
    return this.targetObject;
  }

  /**
   * Retrieve the closest entityset in the path.
   * @returns The closest entityset
   */
  getClosestEntitySet() {
    let closestEntitySet = this.rootEntitySet;
    for (const navigationProperty of this.navigationProperties) {
      const navigationPropertyBindingElement = closestEntitySet.navigationPropertyBinding[navigationProperty.name];
      if (navigationPropertyBindingElement) {
        closestEntitySet = navigationPropertyBindingElement;
      }
    }
    return closestEntitySet;
  }
  getClosestEntityType() {
    let closestEntityType = this.rootEntitySet.entityType;
    for (const navigationProperty of this.navigationProperties) {
      closestEntityType = navigationProperty.targetType;
    }
    return closestEntityType;
  }

  /**
   * Retrieve the closest entityset in the path.
   * @returns The closest entityset
   */
  getContextClosestEntitySet() {
    let closestEntitySet = this.contextRootEntitySet;
    if (closestEntitySet === undefined) {
      return closestEntitySet;
    }
    const nonNullEntitySet = closestEntitySet;
    for (const navigationProperty of this.contextNavigationProperties) {
      if (nonNullEntitySet.navigationPropertyBinding[navigationProperty.name]) {
        closestEntitySet = nonNullEntitySet.navigationPropertyBinding[navigationProperty.name];
      }
    }
    return closestEntitySet;
  }
  getNavigationProperties() {
    return this.navigationProperties;
  }
  getMetaPathForClosestEntitySet() {
    return new MetaPath(this.convertedMetadata, "", this.getClosestEntitySet().fullyQualifiedName);
  }
  getMetaPathForPath(targetPath) {
    try {
      return new MetaPath(this.convertedMetadata, enhancePath(this.serviceObjectPath, targetPath), this.contextPath);
    } catch (_error) {
      return undefined;
    }
  }
  getMetaPathForObject(targetObject) {
    if ((0, _TypeGuards.isAnnotationPath)(targetObject)) {
      return this.getMetaPathForPath(targetObject.value);
    } else if ((0, _TypeGuards.isPathAnnotationExpression)(targetObject)) {
      return this.getMetaPathForPath(targetObject.path);
    } else {
      const metaPathApp = targetObject.fullyQualifiedName.replace(this.rootEntitySet.entityType.fullyQualifiedName, this.contextPath);
      return new MetaPath(this.convertedMetadata, metaPathApp, this.contextPath);
    }
  }
  getConvertedMetadata() {
    return this.convertedMetadata;
  }
}
exports["default"] = MetaPath;


/***/ }),

/***/ 227:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = exports.FilterField = void 0;
var _BaseDefinition = __webpack_require__(42);
var _EntitySet2 = _interopRequireDefault(__webpack_require__(779));
var _TypeGuards = __webpack_require__(890);
var _dec, _dec2, _dec3, _dec4, _dec5, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4;
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
let FilterField = exports.FilterField = (_dec = (0, _BaseDefinition.configurable)(), _dec2 = (0, _BaseDefinition.configurable)(), _dec3 = (0, _BaseDefinition.configurable)(), _dec4 = (0, _BaseDefinition.configurable)(), _dec5 = (0, _BaseDefinition.configurable)(), _class = class FilterField extends _BaseDefinition.BaseDefinition {
  get name() {
    return this.filterFieldProperty.getTarget().name;
  }
  get isParameter() {
    // The property is a parameter if the closest entity type has a ResultContext annotation
    // This indicates that the entity type is a parametrized entity type with a result context
    return !!this.filterFieldProperty.getClosestEntityType().annotations.Common?.ResultContext;
  }
  get label() {
    return this.filterFieldProperty.getTarget().annotations.Common?.Label?.toString() ?? this.filterFieldProperty.getTarget().name;
  }
  constructor(filterFieldProperty, filterFieldConfiguration) {
    super(filterFieldProperty, filterFieldConfiguration);
    _initializerDefineProperty(this, "group", _descriptor, this);
    _initializerDefineProperty(this, "groupLabel", _descriptor2, this);
    _initializerDefineProperty(this, "visible", _descriptor3, this);
    _initializerDefineProperty(this, "required", _descriptor4, this);
    this.filterFieldProperty = filterFieldProperty;
  }
  getTarget() {
    return this.filterFieldProperty.getTarget();
  }
}, _descriptor = _applyDecoratedDescriptor(_class.prototype, "group", [_dec], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, "groupLabel", [_dec2], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, "visible", [_dec3], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, "required", [_dec4], {
  configurable: true,
  enumerable: true,
  writable: true,
  initializer: null
}), _applyDecoratedDescriptor(_class.prototype, "name", [_dec5], Object.getOwnPropertyDescriptor(_class.prototype, "name"), _class.prototype), _class);
class FilterBar {
  constructor(selectionFields, filterBarConfiguration, metaPath) {
    this.selectionFields = selectionFields;
    this.filterBarConfiguration = filterBarConfiguration;
    this.metaPath = metaPath;
  }
  isParameterizedEntitySet() {
    const target = this.metaPath.getTarget();
    if (target._type === "NavigationProperty" && target.containsTarget) {
      return this.metaPath.getClosestEntitySet().entityType.annotations.Common?.ResultContext !== undefined;
    }
    return false;
  }
  getFilterGroups() {
    const filterFacets = this.metaPath.getClosestEntityType().annotations.UI?.FilterFacets;
    const filterFieldsGroup = {};
    if (!filterFacets) {
      const fieldGroups = Object.keys(this.metaPath.getClosestEntityType().annotations.UI ?? {}).filter(key => {
        return key.startsWith("FieldGroup");
      }).map(key => {
        return this.metaPath.getClosestEntityType().annotations.UI?.[key];
      });
      for (const fieldGroup of fieldGroups) {
        fieldGroup.Data.forEach(fieldGroupEntry => {
          switch (fieldGroupEntry.$Type) {
            case "com.sap.vocabularies.UI.v1.DataField":
              {
                const fieldGroupValue = fieldGroupEntry.Value;
                if ((0, _TypeGuards.isPathAnnotationExpression)(fieldGroupValue) && fieldGroupValue.$target) {
                  filterFieldsGroup[fieldGroupValue.$target.fullyQualifiedName] = {
                    group: fieldGroup.fullyQualifiedName,
                    groupLabel: fieldGroup.Label?.toString() ?? fieldGroup.annotations?.Common?.Label?.toString() ?? fieldGroup.qualifier
                  };
                }
                break;
              }
            default:
              // Not supported
              break;
          }
        });
      }
    } else {
      filterFacets.forEach(filterFacet => {
        const filterFacetTarget = filterFacet.Target.$target;
        if ((0, _TypeGuards.isAnnotationOfType)(filterFacetTarget, "com.sap.vocabularies.UI.v1.FieldGroupType")) {
          filterFacetTarget.Data.forEach(fieldGroupEntry => {
            switch (fieldGroupEntry.$Type) {
              case "com.sap.vocabularies.UI.v1.DataField":
                {
                  const fieldGroupValue = fieldGroupEntry.Value;
                  if ((0, _TypeGuards.isPathAnnotationExpression)(fieldGroupValue) && fieldGroupValue.$target) {
                    filterFieldsGroup[fieldGroupValue.$target.fullyQualifiedName] = {
                      group: filterFacet.ID?.toString(),
                      groupLabel: filterFacet.Label?.toString()
                    };
                  }
                  break;
                }
              default:
                // Not supported
                break;
            }
          });
        }
      });
    }
    return filterFieldsGroup;
  }
  getFilterFields() {
    const filterGroups = this.getFilterGroups();
    const consideredProperties = {};
    let parameterizedFields = [];
    if (this.isParameterizedEntitySet()) {
      const parametrizedEntitySetMetaPath = this.metaPath.getMetaPathForClosestEntitySet();
      parameterizedFields = parametrizedEntitySetMetaPath.getClosestEntityType().entityProperties.map(property => {
        const metaPathForProperty = parametrizedEntitySetMetaPath.getMetaPathForPath(property.name);
        if (metaPathForProperty) {
          consideredProperties[metaPathForProperty.getTarget().fullyQualifiedName] = true;
          return new FilterField(metaPathForProperty, {
            group: filterGroups[metaPathForProperty.getTarget().fullyQualifiedName]?.group,
            groupLabel: filterGroups[metaPathForProperty.getTarget().fullyQualifiedName]?.groupLabel,
            visible: true,
            required: true,
            isParameter: true
          });
        }
      }).filter(field => {
        return !!field;
      });
    }
    const requiredProperties = new _EntitySet2.default(this.metaPath).getRequiredProperties();
    const fromSelectionField = this.selectionFields.filter(_TypeGuards.isValidPropertyPathExpression).map(field => {
      const metaPathForProperty = this.metaPath.getMetaPathForPath(field.value);
      if (metaPathForProperty && !consideredProperties[metaPathForProperty.getTarget().fullyQualifiedName]) {
        consideredProperties[metaPathForProperty.getTarget().fullyQualifiedName] = true;
        return new FilterField(metaPathForProperty, {
          group: filterGroups[metaPathForProperty.getTarget().fullyQualifiedName]?.group,
          groupLabel: filterGroups[metaPathForProperty.getTarget().fullyQualifiedName]?.groupLabel,
          visible: true,
          required: requiredProperties.includes(metaPathForProperty.getTarget())
        });
      }
    }).filter(field => {
      return !!field;
    });
    const nonFilterableProperties = new _EntitySet2.default(this.metaPath).getNonFilterableProperties();
    this.metaPath.getClosestEntityType().entityProperties.forEach(property => {
      if (!consideredProperties[property.fullyQualifiedName] && !nonFilterableProperties.includes(property) && property.targetType === undefined && property.annotations.UI?.Hidden?.valueOf() !== true) {
        consideredProperties[property.fullyQualifiedName] = true;
        fromSelectionField.push(new FilterField(this.metaPath.getMetaPathForPath(property.name), {
          group: filterGroups[property.fullyQualifiedName]?.group,
          groupLabel: filterGroups[property.fullyQualifiedName]?.groupLabel,
          visible: false
        }));
      }
    });
    return [...parameterizedFields, ...fromSelectionField];
  }
  isSearchSupported() {
    return new _EntitySet2.default(this.metaPath).isSearchAllowed();
  }
}
exports["default"] = FilterBar;


/***/ }),

/***/ 465:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DefinitionPage = void 0;
var _FilterBar = _interopRequireDefault(__webpack_require__(227));
var _HeaderInfo2 = __webpack_require__(674);
var _Identification2 = __webpack_require__(893);
var _LineItem2 = __webpack_require__(526);
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class DefinitionPage {
  constructor(metaPath) {
    this.metaPath = metaPath;
  }
  getMetaPath() {
    return this.metaPath;
  }

  /**
   * Gets the target entity set identification annotation if available.
   *
   * @returns Identification annotation wrapper
   */
  getIdentification() {
    const targetEntityType = this.metaPath.getClosestEntityType();
    const idAnnotation = targetEntityType.annotations.UI?.Identification;
    if (idAnnotation) {
      return new _Identification2._Identification(idAnnotation, this.metaPath);
    } else {
      return undefined;
    }
  }
  getHeaderInfo() {
    const targetEntityType = this.metaPath.getClosestEntityType();
    const info = targetEntityType.annotations.UI?.HeaderInfo;
    if (info) {
      return new _HeaderInfo2._HeaderInfo(info, this.metaPath);
    } else {
      return undefined;
    }
  }

  /**
   * Retrieves the LineItem annotation for the target entity set
   * @returns LineItem annotation
   */
  getTableVisualization() {
    return _LineItem2._LineItem.fromSPV(this._getTableVisualizationAnnotation(), this.metaPath);
  }
  getFilterBarDefinition(filterBarConfiguration) {
    const targetEntityType = this.metaPath.getClosestEntityType();
    //this.tracer.markRequest("Page.getFilterBarDefinition", targetEntityType);
    let selectionField = targetEntityType.annotations.UI?.SelectionFields;
    if (!selectionField) {
      selectionField = Object.assign([], {
        term: "com.sap.vocabularies.UI.v1.SelectionFields"
      });
    }
    //this.tracer.endMarkRequest("Page.getFilterBarDefinition");
    return new _FilterBar.default(selectionField, filterBarConfiguration, this.metaPath);
  }

  /**
   * Create a default LineItem annotation for the target entity type based on properties
   * @returns LineItem annotation
   */
  createDefaultTableVisualization() {
    return _LineItem2._LineItem.createDefault(this.metaPath);
  }
  _getTableVisualizationAnnotation() {
    const targetEntityType = this.metaPath.getClosestEntityType();
    const spv = targetEntityType.annotations.UI?.SelectionPresentationVariant;
    if (spv) {
      if (spv.PresentationVariant.Visualizations.find(v => v.$target?.term === "com.sap.vocabularies.UI.v1.LineItem")) {
        return spv;
      }
    }
    const pv = targetEntityType.annotations.UI?.PresentationVariant;
    if (pv?.Visualizations) {
      if (pv.Visualizations.find(v => v.$target?.term === "com.sap.vocabularies.UI.v1.LineItem")) {
        return pv;
      }
    }
    return targetEntityType.annotations.UI?.LineItem;
  }
}
exports.DefinitionPage = DefinitionPage;


/***/ }),

/***/ 16:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
var _exportNames = {
  FilterField: true,
  DefinitionPage: true,
  _DataField: true,
  _LineItem: true,
  DefinitionContext: true,
  QueryBuilder: true,
  FORMATTERS_PATH: true,
  formatters: true
};
Object.defineProperty(exports, "DefinitionContext", ({
  enumerable: true,
  get: function () {
    return _DefinitionContext.DefinitionContext;
  }
}));
Object.defineProperty(exports, "DefinitionPage", ({
  enumerable: true,
  get: function () {
    return _DefinitionPage.DefinitionPage;
  }
}));
Object.defineProperty(exports, "FORMATTERS_PATH", ({
  enumerable: true,
  get: function () {
    return _Formatters.FORMATTERS_PATH;
  }
}));
Object.defineProperty(exports, "FilterField", ({
  enumerable: true,
  get: function () {
    return _FilterBar.FilterField;
  }
}));
Object.defineProperty(exports, "QueryBuilder", ({
  enumerable: true,
  get: function () {
    return _QueryBuilder.QueryBuilder;
  }
}));
Object.defineProperty(exports, "_DataField", ({
  enumerable: true,
  get: function () {
    return _DataField._DataField;
  }
}));
Object.defineProperty(exports, "_LineItem", ({
  enumerable: true,
  get: function () {
    return _LineItem._LineItem;
  }
}));
Object.defineProperty(exports, "formatters", ({
  enumerable: true,
  get: function () {
    return _Formatters.formatters;
  }
}));
var _FilterBar = __webpack_require__(227);
var _DefinitionPage = __webpack_require__(465);
var _DataField = __webpack_require__(703);
var _LineItem = __webpack_require__(526);
var _DefinitionContext = __webpack_require__(666);
var _QueryBuilder = __webpack_require__(139);
var _Formatters = __webpack_require__(507);
var _TypeGuards = __webpack_require__(890);
Object.keys(_TypeGuards).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _TypeGuards[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _TypeGuards[key];
    }
  });
});


/***/ }),

/***/ 666:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.DefinitionContext = void 0;
var _MetaPath = _interopRequireDefault(__webpack_require__(156));
var _DefinitionPage = __webpack_require__(465);
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class DefinitionContext {
  constructor(convertedMetadata) {
    this.convertedMetadata = convertedMetadata;
  }
  addApplicationManifest(manifest) {
    this.manifest = manifest;
  }
  getEntitySets() {
    return this.convertedMetadata.entitySets;
  }
  getEntitySet(entitySetName) {
    return this.convertedMetadata.entitySets.by_name(entitySetName);
  }
  getRootEntitySet() {
    if (this.manifest) {
      // Use the ui5 routing config to identify the root entityset
      const initialRoutePattern = ":?query:";
      const initialRoute = (this.manifest["sap.ui5"]?.routing?.routes).find(r => r.pattern === initialRoutePattern);
      if (initialRoute?.target && this.manifest["sap.ui5"]?.routing?.targets) {
        const target = this.manifest["sap.ui5"].routing.targets[initialRoute.target];
        if (target?.name) {
          const options = target.options;
          const settings = options?.settings;
          const entitySet = this.convertedMetadata.resolvePath(settings?.contextPath ?? `${settings?.entitySet}`);
          return entitySet.target;
        }
      }
    }
    // Try to determine the root entity set from the metadata
  }
  getMetaPath(metaPath, contextPath) {
    return new _MetaPath.default(this.convertedMetadata, metaPath, contextPath);
  }
  getPageFor(contextPath) {
    // A page could point to
    // - An entitySet (/SalesOrder)
    // - A singleton (/Me)
    // - A navigation property (/SalesOrder/Set)
    return new _DefinitionPage.DefinitionPage(new _MetaPath.default(this.convertedMetadata, contextPath, contextPath));
  }
  getVersion() {
    const match = this.convertedMetadata.version.match(/^(\d+)\.(\d+)$/);
    if (!match) {
      throw new Error("Invalid version format");
    }
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10)
    };
  }
}
exports.DefinitionContext = DefinitionContext;


/***/ }),

/***/ 779:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = void 0;
var _BaseDefinition = __webpack_require__(42);
class _EntitySet extends _BaseDefinition.BaseDefinition {
  constructor(entitySet, entitySetConfiguration = {}) {
    super(entitySet, entitySetConfiguration);
    this.entitySet = entitySet;
    this.entitySetConfiguration = entitySetConfiguration;
  }
  //
  // @annotation({
  // 	term: CapabilitiesAnnotationTerms.FilterRestrictions,
  // 	processor: (filterRestrictions?: FilterRestrictions): Property[] => {
  // 		const requiredProperties =
  // 			filterRestrictions?.RequiredProperties ?? [];
  // 		return requiredProperties
  // 			.map((propertyPath) => {
  // 				return propertyPath.$target;
  // 			})
  // 			.filter((property): property is Property => {
  // 				return !!property;
  // 			});
  // 	}
  // })
  // requiredProperties: Property[];

  /**
   * Retrieves the required properties for the entity set.
   */
  getRequiredProperties() {
    const requiredProperties = this.entitySet.getTarget().annotations.Capabilities?.FilterRestrictions?.RequiredProperties ?? [];
    return requiredProperties.map(propertyPath => {
      return propertyPath.$target;
    }).filter(property => {
      return !!property;
    });
  }

  /**
   * Retrieves the required properties for the entity set.
   */
  getNonFilterableProperties() {
    const nonFilterableProperties = this.entitySet.getTarget().annotations.Capabilities?.FilterRestrictions?.NonFilterableProperties ?? [];
    return nonFilterableProperties.map(propertyPath => {
      return propertyPath.$target;
    }).filter(property => {
      return !!property;
    });
  }

  /**
   * Retrieves the required properties for the entity set.
   * @param property
   */
  getAllowedFilterExpression(property) {
    const filterExpressionRestrictions = this.entitySet.getTarget().annotations.Capabilities?.FilterRestrictions?.FilterExpressionRestrictions ?? [];
    const propertyRestrictions = filterExpressionRestrictions.filter(filterExpressionRestriction => filterExpressionRestriction.Property?.$target === property);
    return propertyRestrictions.map(propertyRestriction => {
      return propertyRestriction.AllowedExpressions;
    }).filter(propertyRestriction => {
      return !!propertyRestriction;
    });
  }
  isSearchAllowed() {
    return !!this.entitySet.getTarget().annotations.Capabilities?.SearchRestrictions?.Searchable;
  }
}
exports["default"] = _EntitySet;


/***/ }),

/***/ 139:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.QueryBuilder = void 0;
var _Expression = __webpack_require__(678);
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
class QueryBuilder {
  constructor(contextMetaPath, definitionContext) {
    _defineProperty(this, "paths", new Set());
    this.contextMetaPath = contextMetaPath;
    this.definitionContext = definitionContext;
  }
  addPathsFromExpression(expression) {
    (0, _Expression.transformRecursively)(expression, "PathInModel", pathExpression => {
      this.addPath(pathExpression.path);
      return pathExpression;
    }, true /*includeAllExpressions*/);
  }
  addPath(path) {
    this.paths.add(path);
  }
  buildQuery() {
    let query;
    if (this.definitionContext.getVersion().major >= 4) {
      query = this.createQueryV4(this.paths);
    } else {
      query = this.createQueryV2(this.paths);
    }
    return query;
  }
  createQueryV2(paths) {
    const select = [];
    const expand = new Set();
    paths.forEach(property => {
      const parts = property.split("/");
      const propertyMetaPath = this.contextMetaPath.getMetaPathForPath(property);
      const name = parts[0];
      if (name && this.isNavigationProperty(name, propertyMetaPath?.getNavigationProperties() ?? [])) {
        expand.add(name);
      } else {
        select.push(property);
      }
    });
    const query = {
      $format: "json",
      $select: select.join(",")
    };
    if (expand.size > 0) {
      query.$expand = Array.from(expand).join(",");
    }
    return query;
  }
  createQueryV4(paths) {
    const node = {
      name: "",
      $select: new Set(),
      $expand: new Map()
    };
    paths.forEach(property => {
      const parts = property.split("/");
      const propertyMetaPath = this.contextMetaPath.getMetaPathForPath(property);
      const navigationProperties = propertyMetaPath?.getNavigationProperties() ?? [];
      this.processPathRecursiveV4(parts, node, navigationProperties);
    });
    const query = {
      $format: "json",
      $select: Array.from(node.$select).join(",")
    };
    if (node.$expand.size > 0) {
      query.$expand = Array.from(node.$expand.values()).map(serializeExpandV4Recursive).join(",");
    }
    return query;
  }
  processPathRecursiveV4(parts, parentNode, navigationProperties) {
    let node;
    const name = parts[0];
    if (name && this.isNavigationProperty(name, navigationProperties)) {
      node = parentNode.$expand.get(name);
      if (!node) {
        node = {
          name,
          $select: new Set(),
          $expand: new Map()
        };
      }
      parentNode.$expand.set(name, node);
      if (parts.length === 2) {
        node.$select.add(parts[1] ?? "");
      } else {
        this.processPathRecursiveV4(parts.slice(1), node, navigationProperties.slice(1));
      }
    } else {
      parentNode.$select.add(parts.join("/"));
    }
  }
  isNavigationProperty(property, navigationProperties) {
    const navigationPropertyOffset = this.contextMetaPath.getNavigationProperties().length;
    return navigationProperties.length > navigationPropertyOffset && property === navigationProperties[navigationPropertyOffset]?.name;
  }
}
exports.QueryBuilder = QueryBuilder;
function serializeExpandV4Recursive(expandNode) {
  const select = serializeSelect(expandNode.$select);
  const expandValue = Array.from(expandNode.$expand.values()).map(serializeExpandV4Recursive).join(",");
  const expand = expandValue.length > 0 ? `$expand=${expandValue}` : "";
  const separator = select.length > 0 && expand.length > 0 ? ";" : "";
  return `${expandNode.name}(${select}${separator}${expand})`;
}
function serializeSelect(fields) {
  return fields.size > 0 ? `$select=${Array.from(fields).join(",")}` : "";
}


/***/ }),

/***/ 703:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._DataField = void 0;
var _Expression = __webpack_require__(678);
var _Formatters = _interopRequireDefault(__webpack_require__(507));
var _TypeGuards = __webpack_require__(890);
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
class _DataField {
  constructor(dataField, scopedContextMetaPath) {
    this.dataField = dataField;
    this.scopedContextMetaPath = scopedContextMetaPath;
  }
  getValue() {
    if (!(0, _TypeGuards.isAnnotationOfType)(this.dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
      return (0, _Expression.getExpressionFromAnnotation)(this.dataField.Value);
    }
    return _Expression.unresolvableExpression;
  }
  getFormattedValue() {
    if (!(0, _TypeGuards.isAnnotationOfType)(this.dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
      // Compute display mode and then return the formatted value
      // Also consider units and currency
      const targetValue = (0, _Expression.getExpressionFromAnnotation)(this.dataField.Value, this.scopedContextMetaPath.getNavigationProperties().map(navProp => navProp.name));
      return (0, _Expression.transformRecursively)(targetValue, "PathInModel", value => {
        const propertyMetaPath = this.scopedContextMetaPath.getMetaPathForPath(value.ownPath);
        if (!propertyMetaPath) {
          return _Expression.unresolvableExpression;
        }
        const measure = this.getMeasure(propertyMetaPath);
        if (measure) {
          return (0, _Expression.concat)(value, " ", measure);
        }
        const displayMode = this.getDisplayMode(propertyMetaPath);
        if (displayMode !== "Value") {
          const text = (0, _Expression.getExpressionFromAnnotation)(propertyMetaPath.getTarget().annotations.Common?.Text, propertyMetaPath.getNavigationProperties().map(navProp => navProp.name));
          if (displayMode === "Description") {
            return text;
          } else if (displayMode === "DescriptionValue") {
            return (0, _Expression.formatResult)([text, value], _Formatters.default.formatWithBrackets);
          } else if (displayMode === "ValueDescription") {
            return (0, _Expression.formatResult)([value, text], _Formatters.default.formatWithBrackets);
          }
        }
        return value;
      });
    }
    return _Expression.unresolvableExpression;
  }

  /**
   * Checks if the given property has a Unit or ISOCurrency annotation and returns it.
   *
   * @param property property to get the measure for
   * @returns the measure annotation or undefined
   */
  getMeasure(property) {
    const measures = property.getTarget().annotations.Measures;
    if (measures) {
      const measure = measures.Unit ?? measures.ISOCurrency;
      if (measure) {
        return (0, _Expression.getExpressionFromAnnotation)(measure);
      }
    }
    return undefined;
  }
  getDisplayMode(property) {
    const currentEntityType = property.getClosestEntityType();
    const textAnnotation = property.getTarget().annotations.Common?.Text;
    const textArrangement = textAnnotation?.annotations?.UI?.TextArrangement ?? currentEntityType.annotations.UI?.TextArrangement;
    let displayMode = textAnnotation ? "DescriptionValue" : "Value";
    if (textAnnotation && textArrangement != null) {
      if (textArrangement === "UI.TextArrangementType/TextOnly") {
        displayMode = "Description";
      } else if (textArrangement === "UI.TextArrangementType/TextLast") {
        displayMode = "ValueDescription";
      } else if (textArrangement === "UI.TextArrangementType/TextSeparate") {
        displayMode = "Value";
      } else {
        //Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
        displayMode = "DescriptionValue";
      }
    }
    return displayMode;
  }
  getLabel() {
    let label = this.dataField.Label?.toString() ?? this.dataField.annotations?.Common?.Label?.toString();
    if (!label) {
      label = this.dataField.fullyQualifiedName; // Fallback to the fully qualified name
      if ((0, _TypeGuards.isAnnotationOfType)(this.dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
        const target = this.dataField.Target.$target;
        if ((0, _TypeGuards.isAnnotationOfType)(target, "com.sap.vocabularies.UI.v1.FieldGroupType") && target.Label) {
          label = target.Label.toString();
        }
      } else {
        const valueTarget = this.dataField.Value;
        if ((0, _TypeGuards.isPathAnnotationExpression)(valueTarget)) {
          label = valueTarget.$target?.annotations.Common?.Label?.toString() ?? valueTarget.$target?.name ?? valueTarget.path;
        }
      }
    }
    return label;
  }

  /**
   * Retrieve a property from the data field IF it can be easily determined (no complex exression)
   */
  getProperty() {
    if (!(0, _TypeGuards.isAnnotationOfType)(this.dataField, "com.sap.vocabularies.UI.v1.DataFieldForAnnotation")) {
      const valueTarget = this.dataField.Value;
      if (valueTarget && (0, _TypeGuards.isPathAnnotationExpression)(valueTarget)) {
        return valueTarget.$target;
      }
    }
    return undefined;
  }
  getFullyQualifiedName() {
    return this.dataField.fullyQualifiedName;
  }
}
exports._DataField = _DataField;


/***/ }),

/***/ 674:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._HeaderInfo = void 0;
var _DataField2 = __webpack_require__(703);
class _HeaderInfo {
  constructor(info, pageMetaPath) {
    this.info = info;
    this.pageMetaPath = pageMetaPath;
  }
  getFullyQualifiedName() {
    return this.info.fullyQualifiedName;
  }
  getTitle() {
    return this.info.Title ? new _DataField2._DataField(this.info.Title, this.pageMetaPath) : undefined;
  }
  getDescription() {
    return this.info.Description ? new _DataField2._DataField(this.info.Description, this.pageMetaPath) : undefined;
  }
  getTypeName() {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return this.info.TypeName.toString();
  }
}
exports._HeaderInfo = _HeaderInfo;


/***/ }),

/***/ 893:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._Identification = void 0;
var _DataField2 = __webpack_require__(703);
class _Identification {
  constructor(id, pageMetaPath) {
    this.id = id;
    this.pageMetaPath = pageMetaPath;
  }
  getDataFields(options) {
    return this.id.filter(item => {
      if (options?.restrictTypes && !options.restrictTypes.includes(item.$Type)) {
        return false;
      }
      switch (item.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
          return options?.importance === undefined || options.importance.includes(item.annotations?.UI?.Importance?.toString());
        default:
          return false;
      }
    }).map(item => {
      return new _DataField2._DataField(item, this.pageMetaPath);
    });
  }
}
exports._Identification = _Identification;


/***/ }),

/***/ 526:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._LineItem = void 0;
var _DataField2 = __webpack_require__(703);
class _LineItem {
  constructor(lineItem, pageMetaPath) {
    this.lineItem = lineItem;
    this.pageMetaPath = pageMetaPath;
  }
  static createDefault(pageMetaPath) {
    const fakeLineItemAnnotation = pageMetaPath.getClosestEntityType().entityProperties.map(prop => {
      if (prop.annotations.UI?.DataFieldDefault) {
        return prop.annotations.UI.DataFieldDefault;
      } else {
        return {
          $Type: "com.sap.vocabularies.UI.v1.DataField",
          Value: {
            type: "Path",
            path: prop.name,
            $target: prop
          }
        };
      }
    });
    fakeLineItemAnnotation.term = "com.sap.vocabularies.UI.v1.LineItem";
    return new _LineItem(fakeLineItemAnnotation, pageMetaPath);
  }
  static fromSPV(spv, pageMetaPath) {
    switch (spv?.term) {
      case "com.sap.vocabularies.UI.v1.LineItem":
        return new _LineItem(spv, pageMetaPath);
      case "com.sap.vocabularies.UI.v1.PresentationVariant":
        return new _LineItem(spv.Visualizations[0].$target, pageMetaPath);
      case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
        return new _LineItem(spv.PresentationVariant.Visualizations[0].$target, pageMetaPath);
      case undefined:
        return undefined;
    }
  }
  getActions() {
    return this.lineItem.filter(item => item.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction");
  }
  getHeaderActions() {
    return this.getActions().filter(action => action.Determining === true);
  }
  getDataFields(options) {
    return this.lineItem.filter(item => {
      if (options?.restrictTypes && !options.restrictTypes.includes(item.$Type)) {
        return false;
      }
      switch (item.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithAction":
        case "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup":
        case "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
          return options?.importance === undefined || options.importance.includes(item.annotations?.UI?.Importance?.toString());
        default:
          return false;
      }
    }).map(item => {
      return new _DataField2._DataField(item, this.pageMetaPath);
    });
  }
}
exports._LineItem = _LineItem;


/***/ }),

/***/ 678:
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports._checkExpressionsAreEqual = _checkExpressionsAreEqual;
exports.and = and;
exports.annotationApplyExpression = annotationApplyExpression;
exports.annotationIfExpression = annotationIfExpression;
exports.concat = concat;
exports.constant = constant;
exports.equal = equal;
exports.fn = fn;
exports.formatResult = formatResult;
exports.getExpressionFromAnnotation = getExpressionFromAnnotation;
exports.getFiscalType = void 0;
exports.greaterOrEqual = greaterOrEqual;
exports.greaterThan = greaterThan;
exports.hasUnresolvableExpression = hasUnresolvableExpression;
exports.ifElse = ifElse;
exports.isComplexTypeExpression = isComplexTypeExpression;
exports.isConstant = isConstant;
exports.isEmpty = isEmpty;
exports.isExpression = isExpression;
exports.isPathInModelExpression = isPathInModelExpression;
exports.isTruthy = isTruthy;
exports.isUndefinedExpression = isUndefinedExpression;
exports.length = length;
exports.lessOrEqual = lessOrEqual;
exports.lessThan = lessThan;
exports.not = not;
exports.notEqual = notEqual;
exports.objectPath = objectPath;
exports.or = or;
exports.pathInModel = pathInModel;
exports.ref = ref;
exports.resolveBindingString = resolveBindingString;
exports.transformRecursively = transformRecursively;
exports.unresolvableExpression = void 0;
exports.wrapPrimitive = wrapPrimitive;
// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types

/**
 */

/**
 * An expression that evaluates to type T.
 *
 */

/**
 * An expression that evaluates to type T, or a constant value of type T
 */

const unresolvableExpression = exports.unresolvableExpression = {
  _type: "Unresolvable"
};
function hasUnresolvableExpression(...expressions) {
  return expressions.find(expr => expr._type === "Unresolvable") !== undefined;
}
/**
 * Check two expressions for (deep) equality.
 *
 * @param a
 * @param b
 * @returns `true` if the two expressions are equal
 */
function _checkExpressionsAreEqual(a, b) {
  if (!a || !b) {
    return false;
  }
  if (a._type !== b._type) {
    return false;
  }
  switch (a._type) {
    case "Unresolvable":
      return false;
    // Unresolvable is never equal to anything even itself
    case "Constant":
    case "EmbeddedBinding":
    case "EmbeddedExpressionBinding":
      return a.value === b.value;
    case "Not":
      return _checkExpressionsAreEqual(a.operand, b.operand);
    case "Truthy":
      return _checkExpressionsAreEqual(a.operand, b.operand);
    case "Set":
      return a.operator === b.operator && a.operands.length === b.operands.length && a.operands.every(expression => b.operands.some(otherExpression => _checkExpressionsAreEqual(expression, otherExpression)));
    case "IfElse":
      return _checkExpressionsAreEqual(a.condition, b.condition) && _checkExpressionsAreEqual(a.onTrue, b.onTrue) && _checkExpressionsAreEqual(a.onFalse, b.onFalse);
    case "Comparison":
      return a.operator === b.operator && _checkExpressionsAreEqual(a.operand1, b.operand1) && _checkExpressionsAreEqual(a.operand2, b.operand2);
    case "Concat":
      {
        const aExpressions = a.expressions;
        const bExpressions = b.expressions;
        if (aExpressions.length !== bExpressions.length) {
          return false;
        }
        return aExpressions.every((expression, index) => {
          return _checkExpressionsAreEqual(expression, bExpressions[index]);
        });
      }
    case "Length":
      return _checkExpressionsAreEqual(a.pathInModel, b.pathInModel);
    case "PathInModel":
      return a.modelName === b.modelName && a.path === b.path && a.targetEntitySet === b.targetEntitySet;
    case "Formatter":
      return a.fn === b.fn && a.parameters.length === b.parameters.length && a.parameters.every((value, index) => _checkExpressionsAreEqual(b.parameters[index], value));
    case "ComplexType":
      return a.type === b.type && a.bindingParameters.length === b.bindingParameters.length && a.bindingParameters.every((value, index) => _checkExpressionsAreEqual(b.bindingParameters[index], value));
    case "Function":
      const otherFunction = b;
      if (a.obj === undefined || otherFunction.obj === undefined) {
        return a.obj === otherFunction;
      }
      return a.fn === otherFunction.fn && _checkExpressionsAreEqual(a.obj, otherFunction.obj) && a.parameters.length === otherFunction.parameters.length && a.parameters.every((value, index) => _checkExpressionsAreEqual(otherFunction.parameters[index], value));
    case "Ref":
      return a.ref === b.ref;
  }
  return false;
}

/**
 * Converts a nested SetExpression by inlining operands of type SetExpression with the same operator.
 *
 * @param expression The expression to flatten
 * @returns A new SetExpression with the same operator
 */
function flattenSetExpression(expression) {
  return expression.operands.reduce((result, operand) => {
    const candidatesForFlattening = operand._type === "Set" && operand.operator === expression.operator ? operand.operands : [operand];
    candidatesForFlattening.forEach(candidate => {
      if (result.operands.every(e => !_checkExpressionsAreEqual(e, candidate))) {
        result.operands.push(candidate);
      }
    });
    return result;
  }, {
    _type: "Set",
    operator: expression.operator,
    operands: []
  });
}

/**
 * Detects whether an array of boolean expressions contains an expression and its negation.
 *
 * @param expressions Array of expressions
 * @returns `true` if the set of expressions contains an expression and its negation
 */
function hasOppositeExpressions(expressions) {
  const negatedExpressions = expressions.map(not);
  return expressions.some((expression, index) => {
    for (let i = index + 1; i < negatedExpressions.length; i++) {
      if (_checkExpressionsAreEqual(expression, negatedExpressions[i])) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Logical `and` expression.
 *
 * The expression is simplified to false if this can be decided statically (that is, if one operand is a constant
 * false or if the expression contains an operand and its negation).
 *
 * @param operands Expressions to connect by `and`
 * @returns Expression evaluating to boolean
 */
function and(...operands) {
  const expressions = flattenSetExpression({
    _type: "Set",
    operator: "&&",
    operands: operands.map(wrapPrimitive)
  }).operands;
  if (hasUnresolvableExpression(...expressions)) {
    return unresolvableExpression;
  }
  let isStaticFalse = false;
  const nonTrivialExpression = expressions.filter(expression => {
    if (isFalse(expression)) {
      isStaticFalse = true;
    }
    return !isConstant(expression);
  });
  if (isStaticFalse) {
    return constant(false);
  } else if (nonTrivialExpression.length === 0) {
    // Resolve the constant then
    const isValid = expressions.reduce((result, expression) => result && isTrue(expression), true);
    return constant(isValid);
  } else if (nonTrivialExpression.length === 1) {
    return nonTrivialExpression[0];
  } else if (hasOppositeExpressions(nonTrivialExpression)) {
    return constant(false);
  } else {
    return {
      _type: "Set",
      operator: "&&",
      operands: nonTrivialExpression
    };
  }
}

// let tracer: any;
// export function traceExpression(inTracer: never): void {
// 	tracer = inTracer;
// }
//
// export function pickFirstNonNull(
// 	...operands: ExpressionOrPrimitive<PrimitiveType>[]
// ): ExpressionOrPrimitive<PrimitiveType> {
// 	const result = operands.find((operand) => operand !== undefined);
// 	if (tracer) {
// 		tracer.logConditional("pickFirstNonNull", operands, result);
// 	}
// 	return result;
// }
/**
 * Logical `or` expression.
 *
 * The expression is simplified to true if this can be decided statically (that is, if one operand is a constant
 * true or if the expression contains an operand and its negation).
 *
 * @param operands Expressions to connect by `or`
 * @returns Expression evaluating to boolean
 */
function or(...operands) {
  const expressions = flattenSetExpression({
    _type: "Set",
    operator: "||",
    operands: operands.map(wrapPrimitive)
  }).operands;
  if (hasUnresolvableExpression(...expressions)) {
    return unresolvableExpression;
  }
  let isStaticTrue = false;
  const nonTrivialExpression = expressions.filter(expression => {
    if (isTrue(expression)) {
      isStaticTrue = true;
    }
    return !isConstant(expression) || expression.value;
  });
  if (isStaticTrue) {
    return constant(true);
  } else if (nonTrivialExpression.length === 0) {
    // Resolve the constant then
    const isValid = expressions.reduce((result, expression) => result && isTrue(expression), true);
    return constant(isValid);
  } else if (nonTrivialExpression.length === 1) {
    return nonTrivialExpression[0];
  } else if (hasOppositeExpressions(nonTrivialExpression)) {
    return constant(true);
  } else {
    return {
      _type: "Set",
      operator: "||",
      operands: nonTrivialExpression
    };
  }
}

/**
 * Logical `not` operator.
 *
 * @param operand The expression to reverse
 * @returns The resulting expression that evaluates to boolean
 */
function not(operand) {
  operand = wrapPrimitive(operand);
  if (hasUnresolvableExpression(operand)) {
    return unresolvableExpression;
  } else if (isConstant(operand)) {
    return constant(!operand.value);
  } else if (typeof operand === "object" && operand._type === "Set" && operand.operator === "||" && operand.operands.every(expression => isConstant(expression) || isComparison(expression))) {
    return and(...operand.operands.map(expression => not(expression)));
  } else if (typeof operand === "object" && operand._type === "Set" && operand.operator === "&&" && operand.operands.every(expression => isConstant(expression) || isComparison(expression))) {
    return or(...operand.operands.map(expression => not(expression)));
  } else if (isComparison(operand)) {
    // Create the reverse comparison
    switch (operand.operator) {
      case "!==":
        return {
          ...operand,
          operator: "==="
        };
      case "<":
        return {
          ...operand,
          operator: ">="
        };
      case "<=":
        return {
          ...operand,
          operator: ">"
        };
      case "===":
        return {
          ...operand,
          operator: "!=="
        };
      case ">":
        return {
          ...operand,
          operator: "<="
        };
      case ">=":
        return {
          ...operand,
          operator: "<"
        };
    }
  } else if (operand._type === "Not") {
    return operand.operand;
  }
  return {
    _type: "Not",
    operand: operand
  };
}

/**
 * Evaluates whether a binding expression is equal to true with a loose equality.
 *
 * @param operand The expression to check
 * @returns The resulting expression that evaluates to boolean
 */
function isTruthy(operand) {
  if (isConstant(operand)) {
    return constant(!!operand.value);
  } else {
    return {
      _type: "Truthy",
      operand: operand
    };
  }
}

/**
 * Creates a binding expression that will be evaluated by the corresponding model.
 *
 * @param path
 * @param modelName
 * @param visitedNavigationPaths
 * @param pathVisitor
 * @returns An expression representating that path in the model
 */
function objectPath(path, modelName, visitedNavigationPaths = [], pathVisitor) {
  return pathInModel(path, modelName, visitedNavigationPaths, pathVisitor);
}

/**
 * Creates a binding expression that will be evaluated by the corresponding model.
 *
 * @template TargetType
 * @param path The path on the model
 * @param [modelName] The name of the model
 * @param [visitedNavigationPaths] The paths from the root entitySet
 * @param [pathVisitor] A function to modify the resulting path
 * @returns An expression representating that path in the model
 */

function pathInModel(path, modelName, visitedNavigationPaths = [], pathVisitor) {
  if (path === undefined) {
    return unresolvableExpression;
  }
  let targetPath;
  if (pathVisitor) {
    targetPath = pathVisitor(path);
    if (targetPath === undefined) {
      return unresolvableExpression;
    }
  } else {
    const localPath = visitedNavigationPaths.concat();
    localPath.push(path);
    targetPath = localPath.join("/");
  }
  return {
    _type: "PathInModel",
    modelName: modelName,
    path: targetPath,
    ownPath: path
  };
}
/**
 * Creates a constant expression based on a primitive value.
 *
 * @template T
 * @param value The constant to wrap in an expression
 * @returns The constant expression
 */
function constant(value) {
  let constantValue;
  if (typeof value === "object" && value !== null && value !== undefined) {
    if (Array.isArray(value)) {
      constantValue = value.map(wrapPrimitive);
    } else if (isPrimitiveObject(value)) {
      constantValue = value.valueOf();
    } else {
      constantValue = Object.entries(value).reduce((plainExpression, [key, val]) => {
        const wrappedValue = wrapPrimitive(val);
        if (wrappedValue._type !== "Constant" || wrappedValue.value !== undefined) {
          plainExpression[key] = wrappedValue;
        }
        return plainExpression;
      }, {});
    }
  } else {
    constantValue = value;
  }
  return {
    _type: "Constant",
    value: constantValue
  };
}
function resolveBindingString(value, targetType) {
  if (value !== undefined && typeof value === "string" && value.startsWith("{")) {
    const pathInModelRegex = /^{(.*)>(.+)}$/; // Matches model paths like "model>path" or ">path" (default model)
    const pathInModelRegexMatch = pathInModelRegex.exec(value);
    if (value.startsWith("{=")) {
      // Expression binding, we can just remove the outer binding things
      return {
        _type: "EmbeddedExpressionBinding",
        value: value
      };
    } else if (pathInModelRegexMatch) {
      return pathInModel(pathInModelRegexMatch[2] || "", pathInModelRegexMatch[1] || undefined);
    } else {
      return {
        _type: "EmbeddedBinding",
        value: value
      };
    }
  } else if (targetType === "boolean" && typeof value === "string" && (value === "true" || value === "false")) {
    return constant(value === "true");
  } else if (targetType === "number" && typeof value === "string" && (!isNaN(Number(value)) || value === "NaN")) {
    return constant(Number(value));
  } else {
    return constant(value);
  }
}

/**
 * A named reference.
 *
 * @see fn
 * @param reference Reference
 * @returns The object reference binding part
 */
function ref(reference) {
  return {
    _type: "Ref",
    ref: reference
  };
}

/**
 * Wrap a primitive into a constant expression if it is not already an expression.
 *
 * @template T
 * @param something The object to wrap in a Constant expression
 * @returns Either the original object or the wrapped one depending on the case
 */
function wrapPrimitive(something) {
  if (isExpression(something)) {
    return something;
  }
  return constant(something);
}

/**
 * Checks if the expression or value provided is a binding tooling expression or not.
 *
 * Every object having a property named `_type` of some value is considered an expression, even if there is actually
 * no such expression type supported.
 *
 * @param expression
 * @returns `true` if the expression is a binding toolkit expression
 */
function isExpression(expression) {
  return expression?._type !== undefined;
}

/**
 * Checks if the expression or value provided is constant or not.
 *
 * @template T The target type
 * @param  maybeConstant The expression or primitive value that is to be checked
 * @returns `true` if it is constant
 */
function isConstant(maybeConstant) {
  return typeof maybeConstant !== "object" || maybeConstant._type === "Constant";
}
function isTrue(expression) {
  return isConstant(expression) && expression.value === true;
}
function isFalse(expression) {
  return isConstant(expression) && expression.value === false;
}

/**
 * Checks if the expression or value provided is a path in model expression or not.
 *
 * @template T The target type
 * @param  maybeBinding The expression or primitive value that is to be checked
 * @returns `true` if it is a path in model expression
 */
function isPathInModelExpression(maybeBinding) {
  return maybeBinding._type === "PathInModel";
}

/**
 * Checks if the expression or value provided is a complex type expression.
 *
 * @template T The target type
 * @param  maybeBinding The expression or primitive value that is to be checked
 * @returns `true` if it is a path in model expression
 */
function isComplexTypeExpression(maybeBinding) {
  return maybeBinding._type === "ComplexType";
}

/**
 * Checks if the expression or value provided is a concat expression or not.
 *
 * @param expression
 * @returns `true` if the expression is a ConcatExpression
 */
function isConcatExpression(expression) {
  return expression._type === "Concat";
}

/**
 * Checks if the expression or value provided is a IfElse expression or not.
 *
 * @param expression
 * @returns `true` if the expression is a IfElseExpression
 */
function isIfElseExpression(expression) {
  return expression._type === "IfElse";
}

/**
 * Checks if the expression provided is a comparison or not.
 *
 * @template T The target type
 * @param expression The expression
 * @returns `true` if the expression is a ComparisonExpression
 */
function isComparison(expression) {
  return expression._type === "Comparison";
}

/**
 * Checks whether the input parameter is a constant expression of type undefined.
 *
 * @param expression The input expression or object in general
 * @returns `true` if the input is constant which has undefined for value
 */
function isUndefinedExpression(expression) {
  const expressionAsExpression = expression;
  return expressionAsExpression._type === "Constant" && expressionAsExpression.value === undefined;
}
function isPrimitiveObject(objectType) {
  switch (objectType.constructor.name) {
    case "String":
    case "Number":
    case "Boolean":
      return true;
    default:
      return false;
  }
}
/**
 * Check if the passed annotation annotationValue is a ComplexAnnotationExpression.
 *
 * @template T The target type
 * @param  annotationValue The annotation annotationValue to evaluate
 * @returns `true` if the object is a {ComplexAnnotationExpression}
 */
function isComplexAnnotationExpression(annotationValue) {
  return typeof annotationValue === "object" && !isPrimitiveObject(annotationValue);
}

/**
 * Generate the corresponding annotationValue for a given annotation annotationValue.
 *
 * @template T The target type
 * @param annotationValue The source annotation annotationValue
 * @param visitedNavigationPaths The path from the root entity set
 * @param defaultValue Default value if the annotationValue is undefined
 * @param pathVisitor A function to modify the resulting path
 * @returns The annotationValue equivalent to that annotation annotationValue
 */
function getExpressionFromAnnotation(annotationValue, visitedNavigationPaths = [], defaultValue, pathVisitor) {
  if (annotationValue === undefined) {
    return wrapPrimitive(defaultValue);
  }
  annotationValue = annotationValue.valueOf();
  if (!isComplexAnnotationExpression(annotationValue)) {
    return constant(annotationValue);
  }
  switch (annotationValue.type) {
    case "Path":
      return pathInModel(annotationValue.path, undefined, visitedNavigationPaths, pathVisitor);
    case "If":
      return annotationIfExpression(annotationValue.$If, visitedNavigationPaths, pathVisitor);
    case "Not":
      return not(parseAnnotationCondition(annotationValue.$Not, visitedNavigationPaths, pathVisitor));
    case "Eq":
      return equal(parseAnnotationCondition(annotationValue.$Eq[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Eq[1], visitedNavigationPaths, pathVisitor));
    case "Ne":
      return notEqual(parseAnnotationCondition(annotationValue.$Ne[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ne[1], visitedNavigationPaths, pathVisitor));
    case "Gt":
      return greaterThan(parseAnnotationCondition(annotationValue.$Gt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Gt[1], visitedNavigationPaths, pathVisitor));
    case "Ge":
      return greaterOrEqual(parseAnnotationCondition(annotationValue.$Ge[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ge[1], visitedNavigationPaths, pathVisitor));
    case "Lt":
      return lessThan(parseAnnotationCondition(annotationValue.$Lt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Lt[1], visitedNavigationPaths, pathVisitor));
    case "Le":
      return lessOrEqual(parseAnnotationCondition(annotationValue.$Le[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Le[1], visitedNavigationPaths, pathVisitor));
    case "Or":
      return or(...annotationValue.$Or.map(function (orCondition) {
        return parseAnnotationCondition(orCondition, visitedNavigationPaths, pathVisitor);
      }));
    case "And":
      return and(...annotationValue.$And.map(function (andCondition) {
        return parseAnnotationCondition(andCondition, visitedNavigationPaths, pathVisitor);
      }));
    case "Apply":
      return annotationApplyExpression(annotationValue, visitedNavigationPaths, pathVisitor);
    case "Constant":
      return constant(annotationValue.value);
  }
  return unresolvableExpression;
}

/**
 * Parse the annotation condition into an expression.
 *
 * @template T The target type
 * @param annotationValue The condition or value from the annotation
 * @param visitedNavigationPaths The path from the root entity set
 * @param pathVisitor A function to modify the resulting path
 * @returns An equivalent expression
 */
function parseAnnotationCondition(annotationValue, visitedNavigationPaths = [], pathVisitor) {
  if (annotationValue === null || typeof annotationValue !== "object") {
    return constant(annotationValue);
  } else if (annotationValue.hasOwnProperty("$Or")) {
    return or(...annotationValue.$Or.map(function (orCondition) {
      return parseAnnotationCondition(orCondition, visitedNavigationPaths, pathVisitor);
    }));
  } else if (annotationValue.hasOwnProperty("$And")) {
    return and(...annotationValue.$And.map(function (andCondition) {
      return parseAnnotationCondition(andCondition, visitedNavigationPaths, pathVisitor);
    }));
  } else if (annotationValue.hasOwnProperty("$Not")) {
    return not(parseAnnotationCondition(annotationValue.$Not, visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Eq")) {
    return equal(parseAnnotationCondition(annotationValue.$Eq[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Eq[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Ne")) {
    return notEqual(parseAnnotationCondition(annotationValue.$Ne[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ne[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Gt")) {
    return greaterThan(parseAnnotationCondition(annotationValue.$Gt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Gt[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Ge")) {
    return greaterOrEqual(parseAnnotationCondition(annotationValue.$Ge[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Ge[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Lt")) {
    return lessThan(parseAnnotationCondition(annotationValue.$Lt[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Lt[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Le")) {
    return lessOrEqual(parseAnnotationCondition(annotationValue.$Le[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue.$Le[1], visitedNavigationPaths, pathVisitor));
  } else if (annotationValue.hasOwnProperty("$Path")) {
    return pathInModel(annotationValue.$Path, undefined, visitedNavigationPaths, pathVisitor);
  } else if (annotationValue.hasOwnProperty("Path")) {
    return pathInModel(annotationValue.Path, undefined, visitedNavigationPaths, pathVisitor);
  } else if (annotationValue.hasOwnProperty("$Apply")) {
    return getExpressionFromAnnotation({
      type: "Apply",
      $Function: annotationValue.$Function,
      $Apply: annotationValue.$Apply
    }, visitedNavigationPaths, undefined, pathVisitor);
  } else if (annotationValue.hasOwnProperty("$If")) {
    return getExpressionFromAnnotation({
      type: "If",
      $If: annotationValue.$If
    }, visitedNavigationPaths, undefined, pathVisitor);
  } else if (annotationValue.hasOwnProperty("$EnumMember")) {
    return constant(annotationValue.$EnumMember);
  } else if (annotationValue.hasOwnProperty("String")) {
    return constant(annotationValue.String);
  } else if (annotationValue.hasOwnProperty("Bool")) {
    return constant(annotationValue.Bool);
  } else if (annotationValue.hasOwnProperty("Int")) {
    return constant(annotationValue.Int);
  } else if (annotationValue.hasOwnProperty("Decimal")) {
    return constant(annotationValue.Decimal);
  } else if (annotationValue.hasOwnProperty("type") && annotationValue.type === "Null") {
    return constant(null);
  }
  return constant(false);
}

/**
 * Process the {IfAnnotationExpressionValue} into an expression.
 *
 * @template T The target type
 * @param annotationValue An If expression returning the type T
 * @param visitedNavigationPaths The path from the root entity set
 * @param pathVisitor A function to modify the resulting path
 * @returns The equivalent ifElse expression
 */
function annotationIfExpression(annotationValue, visitedNavigationPaths = [], pathVisitor) {
  return ifElse(parseAnnotationCondition(annotationValue[0], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue[1], visitedNavigationPaths, pathVisitor), parseAnnotationCondition(annotationValue[2], visitedNavigationPaths, pathVisitor));
}
// This type is not recursively transformed from the metamodel content, as such we have some ugly things there

function convertSubApplyParameters(applyParam) {
  let applyParamConverted = applyParam;
  if (applyParam.hasOwnProperty("$Path")) {
    applyParamConverted = {
      type: "Path",
      path: applyParam.$Path
    };
  } else if (applyParam.hasOwnProperty("$If")) {
    applyParamConverted = {
      type: "If",
      $If: applyParam.$If
    };
  } else if (applyParam.hasOwnProperty("$Apply")) {
    applyParamConverted = {
      type: "Apply",
      $Function: applyParam.$Function,
      $Apply: applyParam.$Apply
    };
  }
  return applyParamConverted;
}
function annotationApplyExpression(applyExpression, visitedNavigationPaths = [], pathVisitor) {
  switch (applyExpression.$Function) {
    case "odata.concat":
      return concat(...applyExpression.$Apply.map(applyParam => {
        return getExpressionFromAnnotation(convertSubApplyParameters(applyParam), visitedNavigationPaths, undefined, pathVisitor);
      }));
    case "odata.uriEncode":
      const parameter = getExpressionFromAnnotation(convertSubApplyParameters(applyExpression.$Apply[0]), visitedNavigationPaths, undefined, pathVisitor);
      // The second parameter for uriEncode is always a string since the target evaluation is against a formatValue call in ODataUtils which expect the target type as second parameter
      return fn("odata.uriEncode", [parameter, "Edm.String"], undefined, true);
    case "odata.fillUriTemplate":
      const template = applyExpression.$Apply[0];
      const templateParams = applyExpression.$Apply.slice(1);
      const targetObject = {};
      templateParams.forEach(applyParam => {
        targetObject[applyParam.$Name] = getExpressionFromAnnotation(convertSubApplyParameters(applyParam.$LabeledElement), visitedNavigationPaths, undefined, pathVisitor);
      });
      return fn("odata.fillUriTemplate", [template, targetObject], undefined, true);
  }
  return unresolvableExpression;
}

/**
 * Generic helper for the comparison operations (equal, notEqual, ...).
 *
 * @template T The target type
 * @param operator The operator to apply
 * @param leftOperand The operand on the left side of the operator
 * @param rightOperand The operand on the right side of the operator
 * @returns An expression representing the comparison
 */
function comparison(operator, leftOperand, rightOperand) {
  const leftExpression = wrapPrimitive(leftOperand);
  const rightExpression = wrapPrimitive(rightOperand);
  if (hasUnresolvableExpression(leftExpression, rightExpression)) {
    return unresolvableExpression;
  }
  if (isConstant(leftExpression) && isConstant(rightExpression)) {
    switch (operator) {
      case "!==":
        return constant(leftExpression.value !== rightExpression.value);
      case "===":
        return constant(leftExpression.value === rightExpression.value);
      case "<":
        if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
          return constant(false);
        }
        return constant(leftExpression.value < rightExpression.value);
      case "<=":
        if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
          return constant(false);
        }
        return constant(leftExpression.value <= rightExpression.value);
      case ">":
        if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
          return constant(false);
        }
        return constant(leftExpression.value > rightExpression.value);
      case ">=":
        if (leftExpression.value === null || leftExpression.value === undefined || rightExpression.value === null || rightExpression.value === undefined) {
          return constant(false);
        }
        return constant(leftExpression.value >= rightExpression.value);
    }
  } else {
    return {
      _type: "Comparison",
      operator: operator,
      operand1: leftExpression,
      operand2: rightExpression
    };
  }
}

/**
 * Generic helper for the length of an expression.
 *
 * @param expression The input expression pointing to an array
 * @param checkUndefined Is the array potentially undefined
 * @returns An expression representing the length
 */
function length(expression, checkUndefined = false) {
  if (expression._type === "Unresolvable") {
    return expression;
  }
  if (!checkUndefined) {
    return {
      _type: "Length",
      pathInModel: expression
    };
  }
  return ifElse(equal(expression, undefined), -1, length(expression));
}

/**
 * Comparison: "equal" (===).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function equal(leftOperand, rightOperand) {
  const leftExpression = wrapPrimitive(leftOperand);
  const rightExpression = wrapPrimitive(rightOperand);
  if (hasUnresolvableExpression(leftExpression, rightExpression)) {
    return unresolvableExpression;
  }
  if (_checkExpressionsAreEqual(leftExpression, rightExpression)) {
    return constant(true);
  }
  function reduce(left, right) {
    if (left._type === "Comparison" && isTrue(right)) {
      // compare(a, b) === true ~~> compare(a, b)
      return left;
    } else if (left._type === "Comparison" && isFalse(right)) {
      // compare(a, b) === false ~~> !compare(a, b)
      return not(left);
    } else if (left._type === "IfElse" && _checkExpressionsAreEqual(left.onTrue, right)) {
      // (if (x) { a } else { b }) === a ~~> x || (b === a)
      return or(left.condition, equal(left.onFalse, right));
    } else if (left._type === "IfElse" && _checkExpressionsAreEqual(left.onFalse, right)) {
      // (if (x) { a } else { b }) === b ~~> !x || (a === b)
      return or(not(left.condition), equal(left.onTrue, right));
    } else if (left._type === "IfElse" && isConstant(left.onTrue) && isConstant(left.onFalse) && isConstant(right) && !_checkExpressionsAreEqual(left.onTrue, right) && !_checkExpressionsAreEqual(left.onFalse, right)) {
      return constant(false);
    }
    return undefined;
  }

  // exploit symmetry: a === b <~> b === a
  const reduced = reduce(leftExpression, rightExpression) ?? reduce(rightExpression, leftExpression);
  return reduced ?? comparison("===", leftExpression, rightExpression);
}

/**
 * Comparison: "not equal" (!==).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function notEqual(leftOperand, rightOperand) {
  return not(equal(leftOperand, rightOperand));
}

/**
 * Comparison: "greater or equal" (>=).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function greaterOrEqual(leftOperand, rightOperand) {
  return comparison(">=", leftOperand, rightOperand);
}

/**
 * Comparison: "greater than" (>).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function greaterThan(leftOperand, rightOperand) {
  return comparison(">", leftOperand, rightOperand);
}

/**
 * Comparison: "less or equal" (<=).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function lessOrEqual(leftOperand, rightOperand) {
  return comparison("<=", leftOperand, rightOperand);
}

/**
 * Comparison: "less than" (<).
 *
 * @template T The target type
 * @param leftOperand The operand on the left side
 * @param rightOperand The operand on the right side of the comparison
 * @returns An expression representing the comparison
 */
function lessThan(leftOperand, rightOperand) {
  return comparison("<", leftOperand, rightOperand);
}

/**
 * If-then-else expression.
 *
 * Evaluates to onTrue if the condition evaluates to true, else evaluates to onFalse.
 *
 * @template T The target type
 * @param condition The condition to evaluate
 * @param onTrue Expression result if the condition evaluates to true
 * @param onFalse Expression result if the condition evaluates to false
 * @returns The expression that represents this conditional check
 */
function ifElse(condition, onTrue, onFalse) {
  let conditionExpression = wrapPrimitive(condition);
  let onTrueExpression = wrapPrimitive(onTrue);
  let onFalseExpression = wrapPrimitive(onFalse);

  // swap branches if the condition is a negation
  if (conditionExpression._type === "Not") {
    // ifElse(not(X), a, b) --> ifElse(X, b, a)
    [onTrueExpression, onFalseExpression] = [onFalseExpression, onTrueExpression];
    conditionExpression = not(conditionExpression);
  }

  // inline nested if-else expressions: onTrue branch
  // ifElse(X, ifElse(X, a, b), c) ==> ifElse(X, a, c)
  if (onTrueExpression._type === "IfElse" && _checkExpressionsAreEqual(conditionExpression, onTrueExpression.condition)) {
    onTrueExpression = onTrueExpression.onTrue;
  }

  // inline nested if-else expressions: onFalse branch
  // ifElse(X, a, ifElse(X, b, c)) ==> ifElse(X, a, c)
  if (onFalseExpression._type === "IfElse" && _checkExpressionsAreEqual(conditionExpression, onFalseExpression.condition)) {
    onFalseExpression = onFalseExpression.onFalse;
  }

  // (if true then a else b)  ~~> a
  // (if false then a else b) ~~> b
  if (isConstant(conditionExpression)) {
    return conditionExpression.value ? onTrueExpression : onFalseExpression;
  }

  // if (isConstantBoolean(onTrueExpression) || isConstantBoolean(onFalseExpression)) {
  // 	return or(and(condition, onTrueExpression as Expression<boolean>), and(not(condition), onFalseExpression as Expression<boolean>)) as Expression<T>
  // }

  // (if X then a else a) ~~> a
  if (_checkExpressionsAreEqual(onTrueExpression, onFalseExpression)) {
    return onTrueExpression;
  }

  // if X then a else false ~~> X && a
  if (isFalse(onFalseExpression)) {
    return and(conditionExpression, onTrueExpression);
  }

  // if X then a else true ~~> !X || a
  if (isTrue(onFalseExpression)) {
    return or(not(conditionExpression), onTrueExpression);
  }

  // if X then false else a ~~> !X && a
  if (isFalse(onTrueExpression)) {
    return and(not(conditionExpression), onFalseExpression);
  }

  // if X then true else a ~~> X || a
  if (isTrue(onTrueExpression)) {
    return or(conditionExpression, onFalseExpression);
  }
  if (hasUnresolvableExpression(conditionExpression, onTrueExpression, onFalseExpression)) {
    return unresolvableExpression;
  }
  if (isComplexTypeExpression(condition) || isComplexTypeExpression(onTrue) || isComplexTypeExpression(onFalse)) {
    let pathIdx = 0;
    const myIfElseExpression = formatResult([condition, onTrue, onFalse], "sap.fe.core.formatters.StandardFormatter#ifElse");
    const allParts = [];
    transformRecursively(myIfElseExpression, "PathInModel", constantPath => {
      allParts.push(constantPath);
      return pathInModel(`$${pathIdx++}`, "$");
    }, true);
    allParts.unshift(constant(JSON.stringify(myIfElseExpression)));
    return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
  }
  return {
    _type: "IfElse",
    condition: conditionExpression,
    onTrue: onTrueExpression,
    onFalse: onFalseExpression
  };
}

/**
 * Checks whether the current expression has a reference to the default model (undefined).
 *
 * @param expression The expression to evaluate
 * @returns `true` if there is a reference to the default context
 */
function hasReferenceToDefaultContext(expression) {
  switch (expression._type) {
    case "Constant":
    case "Formatter":
    case "ComplexType":
      return false;
    case "Set":
      return expression.operands.some(hasReferenceToDefaultContext);
    case "PathInModel":
      return expression.modelName === undefined;
    case "Comparison":
      return hasReferenceToDefaultContext(expression.operand1) || hasReferenceToDefaultContext(expression.operand2);
    case "IfElse":
      return hasReferenceToDefaultContext(expression.condition) || hasReferenceToDefaultContext(expression.onTrue) || hasReferenceToDefaultContext(expression.onFalse);
    case "Not":
    case "Truthy":
      return hasReferenceToDefaultContext(expression.operand);
    default:
      return false;
  }
}

// This is one case where any does make sense...
// eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

// So, this works but I cannot get it to compile :D, but it still does what is expected...

/**
 * A function reference or a function name.
 */

/**
 * Function parameters, either derived from the function or an untyped array.
 */

/**
 * Calls a formatter function to process the parameters.
 * If requireContext is set to true and no context is passed a default context will be added automatically.
 *
 * @template T
 * @template U
 * @param parameters The list of parameter that should match the type and number of the formatter function
 * @param formatterFunction The function to call
 * @param [contextEntityType] If no parameter refers to the context then we use this information to add a reference to the keys from the entity type.
 * @param [ignoreComplexType] Whether to ignore the transgformation to the StandardFormatter or not
 * @returns The corresponding expression
 */
function formatResult(parameters, formatterFunction, contextEntityType, ignoreComplexType = false) {
  const parameterExpressions = parameters.map(wrapPrimitive);
  if (hasUnresolvableExpression(...parameterExpressions)) {
    return unresolvableExpression;
  }
  if (contextEntityType) {
    // Otherwise, if the context is required and no context is provided make sure to add the default binding
    if (!parameterExpressions.some(hasReferenceToDefaultContext)) {
      contextEntityType.keys.forEach(key => parameterExpressions.push(pathInModel(key.name, "")));
    }
  }
  let functionName = "";
  if (typeof formatterFunction === "string") {
    functionName = formatterFunction;
  } else {
    functionName = formatterFunction.__functionName;
  }
  // FormatterName can be of format sap.fe.core.xxx#methodName to have multiple formatter in one class
  const [formatterClass, formatterName] = functionName.split("#");

  // In some case we also cannot call directly a function because of too complex input, in that case we need to convert to a simpler function call
  if (!ignoreComplexType && (parameterExpressions.some(isComplexTypeExpression) || parameterExpressions.some(isConcatExpression) || parameterExpressions.some(isIfElseExpression))) {
    let pathIdx = 0;
    const myFormatExpression = formatResult(parameterExpressions, functionName, undefined, true);
    const allParts = [];
    transformRecursively(myFormatExpression, "PathInModel", constantPath => {
      allParts.push(constantPath);
      return pathInModel(`$${pathIdx++}`, "$");
    }, true);
    allParts.unshift(constant(JSON.stringify(myFormatExpression)));
    return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
  } else if (!!formatterName && formatterName.length > 0) {
    parameterExpressions.unshift(constant(formatterName));
  }
  return {
    _type: "Formatter",
    fn: formatterClass,
    parameters: parameterExpressions
  };
}
const getFiscalType = function (property) {
  if (property.annotations.Common?.IsFiscalYear) {
    return "com.sap.vocabularies.Common.v1.IsFiscalYear";
  }
  if (property.annotations.Common?.IsFiscalPeriod) {
    return "com.sap.vocabularies.Common.v1.IsFiscalPeriod";
  }
  if (property.annotations.Common?.IsFiscalYearPeriod) {
    return "com.sap.vocabularies.Common.v1.IsFiscalYearPeriod";
  }
  if (property.annotations.Common?.IsFiscalQuarter) {
    return "com.sap.vocabularies.Common.v1.IsFiscalQuarter";
  }
  if (property.annotations.Common?.IsFiscalYearQuarter) {
    return "com.sap.vocabularies.Common.v1.IsFiscalYearQuarter";
  }
  if (property.annotations.Common?.IsFiscalWeek) {
    return "com.sap.vocabularies.Common.v1.IsFiscalWeek";
  }
  if (property.annotations.Common?.IsFiscalYearWeek) {
    return "com.sap.vocabularies.Common.v1.IsFiscalYearWeek";
  }
  if (property.annotations.Common?.IsDayOfFiscalYear) {
    return "com.sap.vocabularies.Common.v1.IsDayOfFiscalYear";
  }
};

/**
 * Function call, optionally with arguments.
 *
 * @param func Function name or reference to function
 * @param parameters Arguments
 * @param on Object to call the function on
 * @param isFormattingFn
 * @returns Expression representing the function call (not the result of the function call!)
 */
exports.getFiscalType = getFiscalType;
function fn(func, parameters, on, isFormattingFn = false) {
  const functionName = typeof func === "string" ? func : func.__functionName;
  return {
    _type: "Function",
    obj: on !== undefined ? wrapPrimitive(on) : undefined,
    fn: functionName,
    isFormattingFn: isFormattingFn,
    parameters: parameters.map(wrapPrimitive)
  };
}

/**
 * Shortcut function to determine if a binding value is null, undefined or empty.
 *
 * @param expression
 * @returns A Boolean expression evaluating the fact that the current element is empty
 */
function isEmpty(expression) {
  const aBindings = [];
  transformRecursively(expression, "PathInModel", expr => {
    aBindings.push(or(equal(expr, ""), equal(expr, undefined), equal(expr, null)));
    return expr;
  });
  return and(...aBindings);
}
function concat(
//eslint-disable-next-line @typescript-eslint/no-wrapper-object-types
...inExpressions) {
  const expressions = inExpressions.map(wrapPrimitive);
  if (hasUnresolvableExpression(...expressions)) {
    return unresolvableExpression;
  }
  if (expressions.every(isConstant)) {
    return constant(expressions.reduce((concatenated, value) => {
      if (value.value !== undefined && value.value !== null) {
        return concatenated + value.value.toString();
      }
      return concatenated;
    }, ""));
  } else if (expressions.some(isComplexTypeExpression)) {
    let pathIdx = 0;
    const myConcatExpression = formatResult(expressions, "sap.fe.core.formatters.StandardFormatter#concat", undefined, true);
    const allParts = [];
    transformRecursively(myConcatExpression, "PathInModel", constantPath => {
      allParts.push(constantPath);
      return pathInModel(`$${pathIdx++}`, "$");
    });
    allParts.unshift(constant(JSON.stringify(myConcatExpression)));
    return formatResult(allParts, "sap.fe.core.formatters.StandardFormatter#evaluateComplexExpression", undefined, true);
  }
  return {
    _type: "Concat",
    expressions: expressions
  };
}
function transformRecursively(inExpression, expressionType, transformFunction, includeAllExpression = false) {
  let expression = inExpression;
  switch (expression._type) {
    case "Function":
    case "Formatter":
      expression.parameters = expression.parameters.map(parameter => transformRecursively(parameter, expressionType, transformFunction, includeAllExpression));
      break;
    case "Concat":
      expression.expressions = expression.expressions.map(subExpression => transformRecursively(subExpression, expressionType, transformFunction, includeAllExpression));
      expression = concat(...expression.expressions);
      break;
    case "ComplexType":
      expression.bindingParameters = expression.bindingParameters.map(bindingParameter => transformRecursively(bindingParameter, expressionType, transformFunction, includeAllExpression));
      break;
    case "IfElse":
      {
        const onTrue = transformRecursively(expression.onTrue, expressionType, transformFunction, includeAllExpression);
        const onFalse = transformRecursively(expression.onFalse, expressionType, transformFunction, includeAllExpression);
        let condition = expression.condition;
        if (includeAllExpression) {
          condition = transformRecursively(expression.condition, expressionType, transformFunction, includeAllExpression);
        }
        expression = ifElse(condition, onTrue, onFalse);
        break;
      }
    case "Not":
      if (includeAllExpression) {
        const operand = transformRecursively(expression.operand, expressionType, transformFunction, includeAllExpression);
        expression = not(operand);
      }
      break;
    case "Truthy":
      break;
    case "Set":
      if (includeAllExpression) {
        const operands = expression.operands.map(operand => transformRecursively(operand, expressionType, transformFunction, includeAllExpression));
        expression = expression.operator === "||" ? or(...operands) : and(...operands);
      }
      break;
    case "Comparison":
      if (includeAllExpression) {
        const operand1 = transformRecursively(expression.operand1, expressionType, transformFunction, includeAllExpression);
        const operand2 = transformRecursively(expression.operand2, expressionType, transformFunction, includeAllExpression);
        expression = comparison(expression.operator, operand1, operand2);
      }
      break;
    case "Constant":
      {
        const constantValue = expression.value;
        if (typeof constantValue === "object" && constantValue) {
          Object.keys(constantValue).forEach(key => {
            constantValue[key] = transformRecursively(constantValue[key], expressionType, transformFunction, includeAllExpression);
          });
        }
        break;
      }
    case "Ref":
    case "Length":
    case "PathInModel":
    case "EmbeddedBinding":
    case "EmbeddedExpressionBinding":
    case "Unresolvable":
      // Do nothing
      break;
  }
  if (expressionType === expression._type) {
    expression = transformFunction(inExpression);
  }
  return expression;
}


/***/ }),

/***/ 507:
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports["default"] = exports.FORMATTERS_PATH = void 0;
exports.formatWithBrackets = formatWithBrackets;
exports.formatters = void 0;
/**
 * Collection of table formatters.
 * @param this The context
 * @param name The inner function name
 * @param args The inner function parameters
 * @returns The value from the inner function
 */
const formatters = function (name, ...args) {
  if (formatters.hasOwnProperty(name)) {
    return formatters[name].apply(this, args);
  } else {
    return "";
  }
};
exports.formatters = formatters;
const FORMATTERS_PATH = exports.FORMATTERS_PATH = "sap.fe.definition.formatters";
function formatWithBrackets(firstPart, secondPart) {
  if (firstPart && secondPart) {
    return `${firstPart} (${secondPart})`;
  } else {
    return firstPart || secondPart || "";
  }
}
formatWithBrackets.__functionName = `${FORMATTERS_PATH}#formatWithBrackets`;
formatters.formatWithBrackets = formatWithBrackets;
var _default = exports["default"] = formatters;


/***/ }),

/***/ 890:
/***/ (function(__unused_webpack_module, exports) {



Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isAnnotationOfTerm = isAnnotationOfTerm;
exports.isAnnotationOfType = isAnnotationOfType;
exports.isAnnotationPath = isAnnotationPath;
exports.isAnnotationTerm = isAnnotationTerm;
exports.isComplexType = isComplexType;
exports.isEntityContainer = isEntityContainer;
exports.isEntitySet = isEntitySet;
exports.isEntityType = isEntityType;
exports.isMultipleNavigationProperty = isMultipleNavigationProperty;
exports.isNavigationProperty = isNavigationProperty;
exports.isPathAnnotationExpression = isPathAnnotationExpression;
exports.isProperty = isProperty;
exports.isPropertyPathExpression = isPropertyPathExpression;
exports.isServiceObject = isServiceObject;
exports.isSingleNavigationProperty = isSingleNavigationProperty;
exports.isSingleton = isSingleton;
exports.isTypeDefinition = isTypeDefinition;
exports.isValidPropertyPathExpression = isValidPropertyPathExpression;
/**
 * Checks whether the argument is an annotation of the given type.
 * @param potentialAnnotationType The annotation to check
 * @param typeName The type to check for
 * @returns Whether the argument is an annotation of the given type
 */
function isAnnotationOfType(potentialAnnotationType, typeName) {
  if (Array.isArray(typeName)) {
    return typeName.includes(potentialAnnotationType?.$Type);
  }
  return potentialAnnotationType?.$Type === typeName;
}

/**
 * Checks whether the argument is an annotation of the given term.
 * @param potentialAnnotation The annotation to check
 * @param termName The term to check for
 * @returns Whether the argument is an annotation of the given term
 */
function isAnnotationOfTerm(potentialAnnotation, termName) {
  return potentialAnnotation.term === termName;
}
function isAnnotationTerm(potentialAnnotation) {
  return potentialAnnotation.hasOwnProperty("term");
}

/**
 * Checks whether the argument is a {@link ServiceObject}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link ServiceObject}.
 */
function isServiceObject(serviceObject) {
  return serviceObject?.hasOwnProperty("_type") ?? false;
}

/**
 * Checks whether the argument is a {@link ComplexType}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link ComplexType}.
 */
function isComplexType(serviceObject) {
  return serviceObject._type === "ComplexType";
}

/**
 * Checks whether the argument is a {@link TypeDefinition}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link TypeDefinition}.
 */
function isTypeDefinition(serviceObject) {
  return serviceObject._type === "TypeDefinition";
}

/**
 * Checks whether the argument is an {@link EntityContainer}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntityContainer}.
 */
function isEntityContainer(serviceObject) {
  return serviceObject._type === "EntityContainer";
}

/**
 * Checks whether the argument is an {@link EntitySet}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntitySet}.
 */
function isEntitySet(serviceObject) {
  return serviceObject._type === "EntitySet";
}

/**
 * Checks whether the argument is a {@link Singleton}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link Singleton}
 */
function isSingleton(serviceObject) {
  return serviceObject._type === "Singleton";
}

/**
 * Checks whether the argument is an {@link EntityType}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is an {@link EntityType}
 */
function isEntityType(serviceObject) {
  return serviceObject._type === "EntityType";
}

/**
 * Checks whether the argument is a {@link Property}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link Property}.
 */
function isProperty(serviceObject) {
  return serviceObject._type === "Property";
}

/**
 * Checks whether the argument is a {@link NavigationProperty}.
 *
 * Hint: There are also the more specific functions {@link isSingleNavigationProperty} and {@link isMultipleNavigationProperty}. These can be
 * used to check for to-one and to-many navigation properties, respectively.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link NavigationProperty}.
 */
function isNavigationProperty(serviceObject) {
  return serviceObject._type === "NavigationProperty";
}

/**
 * Checks whether the argument is a {@link SingleNavigationProperty}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link SingleNavigationProperty}.
 */
function isSingleNavigationProperty(serviceObject) {
  return isNavigationProperty(serviceObject) && !serviceObject.isCollection;
}

/**
 * Checks whether the argument is a {@link MultipleNavigationProperty}.
 *
 * @param serviceObject The object to be checked.
 * @returns Whether the argument is a {@link MultipleNavigationProperty}.
 */
function isMultipleNavigationProperty(serviceObject) {
  return isNavigationProperty(serviceObject) && serviceObject.isCollection;
}

/**
 * Checks whether the argument is a {@link PathAnnotationExpression}.
 *
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link PathAnnotationExpression}.
 */
function isPathAnnotationExpression(expression) {
  return expression.type === "Path";
}

/**
 * Checks whether the argument is a {@link AnnotationPathExpression}.
 *
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link AnnotationPathExpression}.
 */
function isAnnotationPath(expression) {
  return expression.type == "AnnotationPath";
}

/**
 * Checks whether the argument is a {@link PropertyPath}.
 *
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link PropertyPath}.
 */
function isPropertyPathExpression(expression) {
  return expression?.type === "PropertyPath";
}
/**
 * Checks whether the argument is a {@link PropertyPath}.
 *
 * @param expression The object to be checked.
 * @returns Whether the argument is a {@link PropertyPath}.
 */
function isValidPropertyPathExpression(expression) {
  return expression.type === "PropertyPath" && !!expression.$target;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(16);
/******/ 	FEDefinition = __webpack_exports__;
/******/ 	
/******/ })()
;

    return FEDefinition;
 },true);
 //# sourceMappingURL=FEDefinition-dbg.js.map
