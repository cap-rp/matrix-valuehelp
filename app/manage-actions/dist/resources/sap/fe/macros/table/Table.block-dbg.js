/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/MacroAPI", "sap/fe/macros/table/MdcTableTemplate", "sap/fe/macros/table/TableAPI", "sap/fe/macros/table/TableCreationOptions", "sap/m/FlexItemData", "../TSXUtils", "./TableEventHandlerProvider", "sap/fe/base/jsx-runtime/jsx"], function (Log, BuildingBlockSupport, BuildingBlockTemplatingBase, ManifestSettings, MetaModelConverter, DataVisualization, StandardActions, StableIdHelper, TypeGuards, DataModelPathHelper, MacroAPI, MdcTableTemplate, TableAPI, TableCreationOptions, FlexItemData, TSXUtils, TableEventHandlerProvider, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _descriptor41, _descriptor42, _descriptor43, _descriptor44, _descriptor45, _descriptor46, _descriptor47, _descriptor48, _descriptor49, _descriptor50, _descriptor51, _descriptor52, _descriptor53, _descriptor54, _descriptor55, _TableBlock;
  var _exports = {};
  var createCustomData = TSXUtils.createCustomData;
  var getMDCTableTemplate = MdcTableTemplate.getMDCTableTemplate;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var isAnnotationOfTerm = TypeGuards.isAnnotationOfTerm;
  var generate = StableIdHelper.generate;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var getVisualizationsFromAnnotation = DataVisualization.getVisualizationsFromAnnotation;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var VisualizationType = ManifestSettings.VisualizationType;
  var CreationMode = ManifestSettings.CreationMode;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  function safeGetAttribute(node, name) {
    return node.getAttribute(name) ?? undefined;
  }

  /**
   * Gets the dynamic Boolean value of an attribute.
   * @param node The node to get the attribute from
   * @param name The name of the attribute
   * @returns The Boolean value of the attribute
   */
  function getDynamicBooleanValueOfAttribute(node, name) {
    const enablementAttr = node.getAttribute(name);
    switch (enablementAttr) {
      case null:
      case "true":
        return true;
      case "false":
        return false;
      default:
        return enablementAttr;
      // To manage binding expressions
    }
  }

  /**
   * Removes all properties with the value of undefined from the object.
   * @param obj The object to remove the undefined properties from
   */
  function removeUndefinedProperties(obj) {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      }
    });
  }

  /**
   * Gets the action properties from an XML node.
   * @param actionNode The action node
   * @returns The action properties
   */
  function parseActionFromElement(actionNode) {
    const commonProperties = getCommonCustomActionProperties(actionNode);
    if (actionNode.localName === "Action") {
      return {
        text: actionNode.getAttribute("text") ?? commonProperties.key,
        press: safeGetAttribute(actionNode, "press"),
        requiresSelection: actionNode.getAttribute("requiresSelection") === "true",
        ...commonProperties
      };
    }
    return {
      enableAutoScroll: getDynamicBooleanValueOfAttribute(actionNode, "enableAutoScroll"),
      navigateToInstance: getDynamicBooleanValueOfAttribute(actionNode, "navigateToInstance"),
      defaultValuesFunction: safeGetAttribute(actionNode, "defaultValuesFunction"),
      ...commonProperties
    };
  }

  /**
   * Parses the common custom properties of the action from the XML node.
   * @param actionNode The action group node
   * @returns The column properties for the given node
   */
  function getCommonCustomActionProperties(actionNode) {
    return {
      key: actionNode.getAttribute("key").replace("InlineXML_", ""),
      enabled: getDynamicBooleanValueOfAttribute(actionNode, "enabled"),
      visible: getDynamicBooleanValueOfAttribute(actionNode, "visible"),
      command: safeGetAttribute(actionNode, "command"),
      enableOnSelect: safeGetAttribute(actionNode, "enableOnSelect"),
      placement: safeGetAttribute(actionNode, "placement"),
      anchor: safeGetAttribute(actionNode, "anchor"),
      _type: actionNode.localName === "Action" ? "Action" : "ActionOverride"
    };
  }

  /**
   * Parses the actions and action groups from the XML node.
   * @param actionNode
   * @param aggregationObject
   * @returns The action or action group properties for the given node
   */
  function setCustomActionGroupProperties(actionNode, aggregationObject) {
    if (["ActionGroup", "ActionGroupOverride"].includes(actionNode.localName)) {
      const commonProperties = getCommonCustomActionsGroupProperties(actionNode, aggregationObject);
      if (actionNode.localName === "ActionGroup") {
        return {
          text: actionNode.getAttribute("text") ?? commonProperties.key,
          defaultAction: safeGetAttribute(actionNode, "defaultAction"),
          ...commonProperties
        };
      }
      return commonProperties;
    }

    //Action or ActionOverride
    return parseActionFromElement(actionNode);
  }
  const setCustomMassEditProperties = function (element) {
    return {
      key: "configuration",
      customContent: element.children[0]?.outerHTML,
      visibleFields: element.getAttribute("visibleFields")?.split(","),
      ignoredFields: element.getAttribute("ignoredFields")?.split(","),
      operationGroupingMode: element.getAttribute("operationGroupingMode") ?? undefined
    };
  };

  /**
   * Parses the quickVariantSelection from the XML node.
   * @param quickVariantSelection The XML node containing the quickVariantSelection
   * @returns The QuickVariantSelection for the given node
   */
  const setQuickVariantSelection = function (quickVariantSelection) {
    return {
      key: "quickFilters",
      paths: quickVariantSelection.getAttribute("paths")?.split(","),
      showCounts: quickVariantSelection.getAttribute("showCounts") === "true"
    };
  };

  /**
   * Parses the common custom properties of the action groups from the XML node.
   * @param actionNode The action group node
   * @param aggregationObject The aggregation object
   * @returns The column properties for the given node
   */
  function getCommonCustomActionsGroupProperties(actionNode, aggregationObject) {
    const actionsInMenu = Array.prototype.slice.apply(actionNode.children).map(subAction => {
      return parseActionFromElement(subAction);
    });
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    actionNode.setAttribute("key", aggregationObject.key);
    return {
      key: aggregationObject.key,
      actions: actionsInMenu,
      anchor: safeGetAttribute(actionNode, "anchor"),
      placement: safeGetAttribute(actionNode, "placement"),
      _type: actionNode.localName === "ActionGroup" ? "ActionGroup" : "ActionGroupOverride"
    };
  }

  /**
   * Parses the common custom properties of the columns from the XML node.
   * @param childColumn The column node
   * @param aggregationObject The aggregation object
   * @returns The column properties for the given node
   */
  function getCommonCustomColumnsProperties(childColumn, aggregationObject) {
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    childColumn.setAttribute("key", aggregationObject.key);
    return {
      key: aggregationObject.key,
      width: safeGetAttribute(childColumn, "width"),
      widthIncludingColumnHeader: childColumn.getAttribute("widthIncludingColumnHeader") ? childColumn.getAttribute("widthIncludingColumnHeader") === "true" : undefined,
      importance: safeGetAttribute(childColumn, "importance"),
      horizontalAlign: safeGetAttribute(childColumn, "horizontalAlign"),
      availability: safeGetAttribute(childColumn, "availability"),
      placement: safeGetAttribute(childColumn, "placement") || safeGetAttribute(childColumn, "positionPlacement"),
      // positionPlacement is kept for backwards compatibility
      anchor: safeGetAttribute(childColumn, "anchor") || safeGetAttribute(childColumn, "positionAnchor"),
      // positionAnchor is kept for backwards compatibility
      exportSettings: parseExportSettings(childColumn)
    };
  }

  /**
   * Parses the custom columns from the XML node.
   * @param childColumn
   * @param aggregationObject
   * @returns THe column properties for the given node
   */
  function setCustomColumnProperties(childColumn, aggregationObject) {
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    childColumn.setAttribute("key", aggregationObject.key);
    if (childColumn.localName === "Column") {
      return {
        ...getCommonCustomColumnsProperties(childColumn, aggregationObject),
        header: safeGetAttribute(childColumn, "header"),
        tooltip: safeGetAttribute(childColumn, "tooltip"),
        template: getColumnTemplate(childColumn),
        properties: safeGetAttribute(childColumn, "properties")?.split(","),
        required: childColumn.getAttribute("required") ? childColumn.getAttribute("required") === "true" : undefined,
        _type: childColumn.localName
      };
    }
    return {
      ...getCommonCustomColumnsProperties(childColumn, aggregationObject),
      _type: "ColumnOverride"
    };
  }
  const parseExportSettings = element => {
    const exportSettings = parseSimpleAggregation(element, "exportSettings");
    if (!exportSettings) {
      return undefined;
    }
    return {
      template: exportSettings.template,
      wrap: exportSettings.wrap === "true",
      type: exportSettings.type,
      property: exportSettings.property?.split(","),
      width: exportSettings.width
    };
  };
  const getColumnTemplate = element => {
    let aggregation = getAggregation(element, "template");
    if (!aggregation) {
      for (let i = 0; i < element.children.length; i++) {
        const child = element.children.item(i);
        if (child && !child.nodeName.endsWith("exportSettings")) {
          aggregation = child;
          break;
        }
      }
    }
    return aggregation?.outerHTML;
  };
  const parseSimpleAggregation = (element, aggregationName) => {
    const aggregation = getAggregation(element, aggregationName);
    const child = aggregation?.children[0];
    const result = {};
    if (!child) {
      return undefined;
    }
    for (const name of child.getAttributeNames()) {
      const value = child.getAttribute(name);
      if (value) {
        result[name] = value;
      }
    }
    return result;
  };
  const getAggregation = (element, aggregationName) => {
    let aggregation;
    for (let i = 0; i < element.children.length; i++) {
      const child = element.children.item(i);
      if (child?.nodeName.endsWith(aggregationName) === true) {
        aggregation = child;
        break;
      }
    }
    return aggregation;
  };

  /**
   * Building block used to create a table based on the metadata provided by OData V4.
   * <br>
   * Usually, a LineItem, PresentationVariant, or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
   * <br>
   * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
   * <br>
   * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
   *
   * Usage example:
   * <pre>
   * &lt;macros:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
   * </pre>
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/table Overview of Table Building Blocks}
   * @mixes sap.fe.macros.table.TableAPI
   * @augments sap.fe.macros.MacroAPI
   * @public
   */
  let TableBlock = (_dec = defineBuildingBlock({
    name: "Table",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.table.TableAPI"]
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    underlyingType: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"],
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "boolean",
    isPublic: true,
    bindable: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    underlyingType: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    isPublic: true
  }), _dec5 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "int",
    isPublic: true
  }), _dec11 = blockAttribute({
    type: "number",
    isPublic: true
  }), _dec12 = blockAttribute({
    type: "int",
    isPublic: true
  }), _dec13 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec14 = blockAttribute({
    type: "string",
    allowedValues: ["Auto", "Fixed", "Interactive"],
    isPublic: true
  }), _dec15 = blockAttribute({
    type: "int",
    isPublic: true
  }), _dec16 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec17 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec18 = blockAttribute({
    type: "int",
    isPublic: true
  }), _dec19 = blockAttribute({
    type: "string",
    isPublic: true,
    isAssociation: true
  }), _dec20 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec21 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec22 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec23 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec24 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec25 = blockAttribute({
    type: "sap.ui.model.Context",
    underlyingType: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.SelectionVariant"],
    isPublic: true
  }), _dec26 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec27 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec28 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec29 = blockAttribute({
    type: "string",
    isPublic: true,
    allowedValues: ["GridTable", "ResponsiveTable", "AnalyticalTable"]
  }), _dec30 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec31 = blockAttribute({
    type: "string",
    isPublic: true,
    allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"]
  }), _dec32 = blockAttribute({
    type: "string",
    isPublic: true,
    allowedValues: ["Control"]
  }), _dec33 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec34 = blockAttribute({
    type: "string",
    isPublic: true,
    allowedValues: ["illustratedMessage-Auto", "illustratedMessage-Base", "illustratedMessage-Medium", "illustratedMessage-Dot", "illustratedMessage-ExtraSmall", "illustratedMessage-Scene", "illustratedMessage-Large", "illustratedMessage-Spot", "illustratedMessage-Small", "text"]
  }), _dec35 = blockAttribute({
    type: "sap.ui.core.TitleLevel"
  }), _dec36 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec37 = blockAttribute({
    type: "string"
  }), _dec38 = blockAttribute({
    type: "boolean"
  }), _dec39 = blockAttribute({
    type: "boolean"
  }), _dec40 = blockAttribute({
    type: "string"
  }), _dec41 = blockAttribute({
    type: "boolean"
  }), _dec42 = blockAttribute({
    type: "boolean"
  }), _dec43 = blockAttribute({
    type: "object",
    underlyingType: "sap.fe.macros.table.TableCreationOptions",
    isPublic: true,
    validate: function (creationOptionsInput) {
      if (creationOptionsInput.name && !["NewPage", "Inline", "InlineCreationRows", "External", "CreationDialog"].includes(creationOptionsInput.name)) {
        throw new Error(`Allowed value ${creationOptionsInput.name} for creationMode does not match`);
      }
      return creationOptionsInput;
    }
  }), _dec44 = blockAttribute({
    type: "object",
    underlyingType: "sap.fe.macros.table.AnalyticalConfiguration",
    isPublic: true,
    validate: function (analyticalConfiguration) {
      if (typeof analyticalConfiguration.aggregationOnLeafLevel === "string") {
        analyticalConfiguration.aggregationOnLeafLevel = analyticalConfiguration.aggregationOnLeafLevel === "true";
      }
      return analyticalConfiguration;
    }
  }), _dec45 = blockAggregation({
    type: "sap.fe.macros.table.Action",
    altTypes: ["sap.fe.macros.table.ActionGroup", "sap.fe.macros.table.ActionOverride", "sap.fe.macros.table.ActionGroupOverride"],
    isPublic: true,
    hasVirtualNode: true,
    multiple: true,
    processAggregations: setCustomActionGroupProperties
  }), _dec46 = blockAggregation({
    type: "sap.fe.macros.table.MassEdit",
    isPublic: true,
    multiple: false,
    skipKey: true,
    processAggregations: setCustomMassEditProperties
  }), _dec47 = blockAggregation({
    type: "sap.fe.macros.table.Column",
    altTypes: ["sap.fe.macros.table.ColumnOverride"],
    isPublic: true,
    multiple: true,
    hasVirtualNode: true,
    isDefault: true,
    processAggregations: setCustomColumnProperties
  }), _dec48 = blockAggregation({
    type: "sap.fe.macros.table.QuickVariantSelection",
    isPublic: true,
    skipKey: true,
    multiple: false,
    processAggregations: setQuickVariantSelection
  }), _dec49 = blockEvent(), _dec50 = blockEvent(), _dec51 = blockEvent(), _dec52 = blockEvent(), _dec53 = blockEvent(), _dec54 = blockEvent(), _dec55 = blockEvent(), _dec56 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec(_class = (_class2 = (_TableBlock = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function TableBlock(props, controlConfiguration, templateProcessorSettings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, controlConfiguration, templateProcessorSettings) || this;
      //  *************** Public & Required Attributes ********************
      /**
       * Defines the relative path to a LineItem, PresentationVariant or SelectionPresentationVariant in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor, _this);
      //  *************** Public Attributes ********************
      /**
       * An expression that allows you to control the 'busy' state of the table.
       * @public
       */
      _initializerDefineProperty(_this, "busy", _descriptor2, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      /**
       * Determines whether the table adapts to the condensed layout.
       * @public
       */
      _initializerDefineProperty(_this, "condensedTableLayout", _descriptor4, _this);
      /**
       * Controls whether the table can be opened in fullscreen mode or not.
       * @public
       */
      _initializerDefineProperty(_this, "enableFullScreen", _descriptor5, _this);
      /**
       * Determine whether the data copied to the computed columns is sent to the back end.
       * @public
       */
      _initializerDefineProperty(_this, "enablePastingOfComputedProperties", _descriptor6, _this);
      /**
       * Determines whether the Clear All button is enabled by default.
       * To enable the Clear All button by default, you must set this property to false.
       * @public
       */
      _initializerDefineProperty(_this, "enableSelectAll", _descriptor7, _this);
      /**
       * Controls if the export functionality of the table is enabled or not.
       * @public
       */
      _initializerDefineProperty(_this, "enableExport", _descriptor8, _this);
      /**
       * Maximum allowed number of records to be exported in one request.
       * @public
       */
      _initializerDefineProperty(_this, "exportRequestSize", _descriptor9, _this);
      /**
       * Defines the maximum number of rows that can be selected at once in the table.
       * This property does not apply to responsive tables.
       * @public
       */
      _initializerDefineProperty(_this, "selectionLimit", _descriptor10, _this);
      /**
       * Number of columns that are fixed on the left. Only columns which are not fixed can be scrolled horizontally.
       *
       * This property is not relevant for responsive tables
       * @public
       */
      _initializerDefineProperty(_this, "frozenColumnCount", _descriptor11, _this);
      /**
       * Indicates if the column header should be a part of the width calculation.
       * @public
       */
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor12, _this);
      /**
       * Defines how the table handles the visible rows. Does not apply to Responsive tables.
       *
       * Allowed values are `Auto`, `Fixed`, and `Interactive`.<br/>
       * - If set to `Fixed`, the table always has as many rows as defined in the rowCount property.<br/>
       * - If set to `Auto`, the number of rows is changed by the table automatically. It will then adjust its row count to the space it is allowed to cover (limited by the surrounding container) but it cannot have less than defined in the `rowCount` property.<br/>
       * - If set to `Interactive` the table can have as many rows as defined in the rowCount property. This number of rows can be modified by dragging the resizer available in this mode.<br/>
       * @public
       */
      _initializerDefineProperty(_this, "rowCountMode", _descriptor13, _this);
      /**
       * Number of rows to be displayed in the table. Does not apply to responsive tables.
       * @public
       */
      _initializerDefineProperty(_this, "rowCount", _descriptor14, _this);
      /**
       * Controls if the paste functionality of the table is enabled or not.
       * @public
       */
      _initializerDefineProperty(_this, "enablePaste", _descriptor15, _this);
      /**
       * Controls if the copy functionality of the table is disabled or not.
       * @public
       */
      _initializerDefineProperty(_this, "disableCopyToClipboard", _descriptor16, _this);
      /**
       * Defines how many additional data records are requested from the back-end system when the user scrolls vertically in the table.
       * @public
       */
      _initializerDefineProperty(_this, "scrollThreshold", _descriptor17, _this);
      /**
       * ID of the FilterBar building block associated with the table.
       * @public
       */
      _initializerDefineProperty(_this, "filterBar", _descriptor18, _this);
      /**
       * Specifies the header text that is shown in the table.
       * @public
       */
      _initializerDefineProperty(_this, "header", _descriptor19, _this);
      /**
       * Defines the "aria-level" of the table header
       */
      _initializerDefineProperty(_this, "headerLevel", _descriptor20, _this);
      /**
       * Controls if the header text should be shown or not.
       * @public
       */
      _initializerDefineProperty(_this, "headerVisible", _descriptor21, _this);
      _initializerDefineProperty(_this, "id", _descriptor22, _this);
      _initializerDefineProperty(_this, "contentId", _descriptor23, _this);
      /**
       * Additionnal SelectionVariant to be applied on the table content.
       */
      _initializerDefineProperty(_this, "associatedSelectionVariantPath", _descriptor24, _this);
      /**
       * Defines whether to display the search action.
       * @public
       */
      _initializerDefineProperty(_this, "isSearchable", _descriptor25, _this);
      /**
       * Controls which options should be enabled for the table personalization dialog.
       *
       * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
       * If it is set to `false`, personalization is disabled.<br/>
       * <br/>
       * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
       * Available options are:<br/>
       * - Sort<br/>
       * - Column<br/>
       * - Filter<br/>
       * - Group<br/>
       * <br/>
       * The Group option is only applicable to analytical tables and responsive tables.<br/>
       * @public
       */
      _initializerDefineProperty(_this, "personalization", _descriptor26, _this);
      /**
       * An expression that allows you to control the 'read-only' state of the table.
       *
       * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
       * @public
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor27, _this);
      /**
       * Defines the type of table that will be used by the building block to render the data.
       *
       * Allowed values are `GridTable`, `ResponsiveTable` and `AnalyticalTable`.
       * @public
       */
      _initializerDefineProperty(_this, "type", _descriptor28, _this);
      /**
       * Specifies whether the table is displayed with condensed layout (true/false). The default setting is `false`.
       */
      _initializerDefineProperty(_this, "useCondensedLayout", _descriptor29, _this);
      /**
       * Defines the selection mode to be used by the table.
       *
       * Allowed values are `None`, `Single`, `ForceSingle`, `Multi`, `ForceMulti` or `Auto`.
       * If set to 'Single', 'Multi' or 'Auto', SAP Fiori elements hooks into the standard lifecycle to determine the consistent selection mode.
       * If set to 'ForceSingle' or 'ForceMulti' your choice will be respected but this might not respect the Fiori guidelines.
       * @public
       */
      _initializerDefineProperty(_this, "selectionMode", _descriptor30, _this);
      /**
       * Controls the kind of variant management that should be enabled for the table.
       *
       * Allowed value is `Control`.<br/>
       * If set with value `Control`, a variant management control is seen within the table and the table is linked to this.<br/>
       * If not set with any value, control level variant management is not available for this table.
       * @public
       */
      _initializerDefineProperty(_this, "variantManagement", _descriptor31, _this);
      /**
       * Comma-separated value of fields that must be ignored in the OData metadata by the Table building block.<br>
       * The table building block is not going to create built-in columns or offer table personalization for comma-separated value of fields that are provided in the ignoredfields.<br>
       * Any column referencing an ignored field is to be removed.<br>
       * @since 1.124.0
       * @public
       */
      _initializerDefineProperty(_this, "ignoredFields", _descriptor32, _this);
      /**
       * Changes the size of the IllustratedMessage in the table, or removes it completely.
       * Allowed values are `illustratedMessage-Auto`, `illustratedMessage-Base`, `illustratedMessage-Dialog`, `illustratedMessage-Dot`, `illustratedMessage-Scene`, `illustratedMessage-Spot` or `text`.
       * @since 1.129.0
       * @public
       */
      _initializerDefineProperty(_this, "modeForNoDataMessage", _descriptor33, _this);
      /**
       * Defines the header style of the table header
       */
      _initializerDefineProperty(_this, "headerStyle", _descriptor34, _this);
      /**
       * Specifies if the column width is automatically calculated.
       * @public
       */
      _initializerDefineProperty(_this, "enableAutoColumnWidth", _descriptor35, _this);
      _initializerDefineProperty(_this, "fieldMode", _descriptor36, _this);
      _initializerDefineProperty(_this, "isAlp", _descriptor37, _this);
      /**
       * True if the table is in a ListReport multi view
       */
      _initializerDefineProperty(_this, "inMultiView", _descriptor38, _this);
      _initializerDefineProperty(_this, "tabTitle", _descriptor39, _this);
      _initializerDefineProperty(_this, "visible", _descriptor40, _this);
      _initializerDefineProperty(_this, "displaySegmentedButton", _descriptor41, _this);
      /**
       * A set of options that can be configured.
       * @public
       */
      _initializerDefineProperty(_this, "creationMode", _descriptor42, _this);
      /**
       * A set of options that can be configured to control the aggregation behavior
       * @private
       */
      _initializerDefineProperty(_this, "analyticalConfiguration", _descriptor43, _this);
      /**
       * Aggregate actions of the table.
       * @public
       */
      _initializerDefineProperty(_this, "actions", _descriptor44, _this);
      /**
       * Aggregate mass edit of the table.
       * @public
       */
      _initializerDefineProperty(_this, "massEdit", _descriptor45, _this);
      /**
       * Aggregate columns of the table.
       * @public
       */
      _initializerDefineProperty(_this, "columns", _descriptor46, _this);
      /**
       * Aggregate quickVariantSelection of the table.
       * @public
       */
      _initializerDefineProperty(_this, "quickVariantSelection", _descriptor47, _this);
      /**
       * Before a table rebind, an event is triggered that contains information about the binding.
       *
       * You can use this event to add selects, and add or read the sorters and filters.
       * @public
       */
      _initializerDefineProperty(_this, "beforeRebindTable", _descriptor48, _this);
      /**
       * An event is triggered when the user chooses a row; the event contains information about which row is chosen.
       *
       * You can set this in order to handle the navigation manually.
       * @public
       */
      _initializerDefineProperty(_this, "rowPress", _descriptor49, _this);
      /**
       * Event handler to react to the change event of the table's list binding.
       *
       * Internal only
       */
      _initializerDefineProperty(_this, "listBindingChange", _descriptor50, _this);
      /**
       * Event handler called when the user chooses an option of the segmented button in the ALP View
       */
      _initializerDefineProperty(_this, "segmentedButtonPress", _descriptor51, _this);
      _initializerDefineProperty(_this, "variantSaved", _descriptor52, _this);
      /**
       * An event triggered when the selection in the table changes.
       * @public
       */
      _initializerDefineProperty(_this, "selectionChange", _descriptor53, _this);
      _initializerDefineProperty(_this, "variantSelected", _descriptor54, _this);
      _initializerDefineProperty(_this, "initialLoad", _descriptor55, _this);
      const contextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
      _this.contextObjectPath = contextObjectPath;
      _this.tableDefinition = TableBlock.createTableDefinition(_this, templateProcessorSettings);
      _this.tableDefinitionContext = MacroAPI.createBindingContext(_this.tableDefinition, templateProcessorSettings);
      _this.convertedMetadata = _this.contextObjectPath.convertedTypes;
      _this.metaModel = templateProcessorSettings.models.metaModel;
      _this.collectionEntity = _this.convertedMetadata.resolvePath(_this.tableDefinition.annotation.collection).target;
      _this.appComponent = templateProcessorSettings.appComponent;
      _this.setUpId();
      _this.creationMode ??= {};
      _this.creationMode.name ??= _this.tableDefinition.annotation.create.mode;
      _this.creationMode.createAtEnd ??= _this.tableDefinition.annotation.create.append;
      // Special code for readOnly
      // readonly = false -> Force editable
      // readonly = true -> Force display mode
      // readonly = undefined -> Bound to edit flow
      if (_this.readOnly === undefined && (_this.tableDefinition.annotation.displayMode === true || _this.tableDefinition.control.readOnly === true)) {
        _this.readOnly = true;
      }
      TableAPI.updateColumnsVisibility(_this.tableDefinition.control.ignoredFields, [], _this.tableDefinition);
      let useBasicSearch = false;

      // Note for the 'filterBar' property:
      // 1. ID relative to the view of the Table.
      // 2. Absolute ID.
      // 3. ID would be considered in association to TableAPI's ID.
      if (!_this.filterBar) {
        // filterBar: Public property for building blocks
        // filterBarId: Only used as Internal private property for FE templates
        _this.filterBar = generate([_this.contentId, "StandardAction", "BasicSearch"]);
        useBasicSearch = true;
      }
      // Internal properties
      _this.useBasicSearch = useBasicSearch;
      return _this;
    }

    /**
     * Returns the annotation path pointing to the visualization annotation (LineItem).
     * @param contextObjectPath The datamodel object path for the table
     * @param converterContext The converter context
     * @returns The annotation path
     */
    _exports = TableBlock;
    _inheritsLoose(TableBlock, _BuildingBlockTemplat);
    TableBlock.getVisualizationPath = function getVisualizationPath(contextObjectPath, converterContext) {
      const metaPath = getContextRelativeTargetObjectPath(contextObjectPath);

      // fallback to default LineItem if metapath is not set
      if (!metaPath) {
        Log.error(`Missing meta path parameter for LineItem`);
        return `@${"com.sap.vocabularies.UI.v1.LineItem"}`;
      }
      if (isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.LineItem")) {
        return metaPath; // MetaPath is already pointing to a LineItem
      }
      //Need to switch to the context related the PV or SPV
      const resolvedTarget = converterContext.getEntityTypeAnnotation(metaPath);
      let visualizations = [];
      if (isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") || isAnnotationOfTerm(contextObjectPath.targetObject, "com.sap.vocabularies.UI.v1.PresentationVariant")) {
        visualizations = getVisualizationsFromAnnotation(contextObjectPath.targetObject, metaPath, resolvedTarget.converterContext, true);
      } else {
        Log.error(`Bad metapath parameter for table : ${contextObjectPath.targetObject.term}`);
      }
      const lineItemViz = visualizations.find(viz => {
        return viz.visualization.term === "com.sap.vocabularies.UI.v1.LineItem";
      });
      if (lineItemViz) {
        return lineItemViz.annotationPath;
      } else {
        // fallback to default LineItem if annotation missing in PV
        Log.error(`Bad meta path parameter for LineItem: ${contextObjectPath.targetObject.term}`);
        return `@${"com.sap.vocabularies.UI.v1.LineItem"}`; // Fallback
      }
    };
    var _proto = TableBlock.prototype;
    _proto.getTableSettings = function getTableSettings() {
      const tableSettings = {};
      TableBlock.addSetting(tableSettings, "enableExport", this.enableExport);
      TableBlock.addSetting(tableSettings, "readOnly", this.readOnly);
      TableBlock.addSetting(tableSettings, "ignoredFields", this.ignoredFields);
      TableBlock.addSetting(tableSettings, "selectionLimit", this.selectionLimit);
      TableBlock.addSetting(tableSettings, "condensedTableLayout", this.condensedTableLayout);
      TableBlock.addSetting(tableSettings, "exportRequestSize", this.exportRequestSize);
      TableBlock.addSetting(tableSettings, "frozenColumnCount", this.frozenColumnCount);
      TableBlock.addSetting(tableSettings, "widthIncludingColumnHeader", this.widthIncludingColumnHeader);
      TableBlock.addSetting(tableSettings, "rowCountMode", this.rowCountMode);
      TableBlock.addSetting(tableSettings, "rowCount", this.rowCount);
      TableBlock.addSetting(tableSettings, "enableFullScreen", this.enableFullScreen);
      TableBlock.addSetting(tableSettings, "selectAll", this.enableSelectAll);
      TableBlock.addSetting(tableSettings, "enablePastingOfComputedProperties", this.enablePastingOfComputedProperties);
      TableBlock.addSetting(tableSettings, "enablePaste", this.enablePaste);
      TableBlock.addSetting(tableSettings, "disableCopyToClipboard", this.disableCopyToClipboard);
      TableBlock.addSetting(tableSettings, "scrollThreshold", this.scrollThreshold);
      TableBlock.addSetting(tableSettings, "selectionMode", this.selectionMode);
      TableBlock.addSetting(tableSettings, "type", this.type);
      if (this.quickVariantSelection?.quickFilters?.paths?.length) {
        TableBlock.addSetting(tableSettings, "quickVariantSelection", {
          paths: this.quickVariantSelection.quickFilters.paths.map(path => {
            return {
              annotationPath: path
            };
          }),
          showCounts: this.quickVariantSelection.quickFilters.showCounts
        });
      }
      if (this.creationMode) {
        const creationMode = {};
        TableBlock.addSetting(creationMode, "name", this.creationMode.name);
        TableBlock.addSetting(creationMode, "creationFields", this.creationMode.creationFields);
        TableBlock.addSetting(creationMode, "createAtEnd", this.creationMode.createAtEnd);
        TableBlock.addSetting(creationMode, "inlineCreationRowsHiddenInEditMode", this.creationMode.inlineCreationRowsHiddenInEditMode);
        TableBlock.addSetting(creationMode, "outbound", this.creationMode.outbound);
        if (Object.entries(creationMode).length > 0) {
          tableSettings["creationMode"] = creationMode;
        }
      }
      if (this.massEdit) {
        const enableMassEdit = {};
        TableBlock.addSetting(enableMassEdit, "customFragment", this.massEdit.configuration?.customContent);
        TableBlock.addSetting(enableMassEdit, "fromInline", true);
        TableBlock.addSetting(enableMassEdit, "visibleFields", this.massEdit.configuration?.visibleFields?.join(","));
        TableBlock.addSetting(enableMassEdit, "ignoredFields", this.massEdit.configuration?.ignoredFields?.join(","));
        TableBlock.addSetting(enableMassEdit, "operationGroupingMode", this.massEdit.configuration?.operationGroupingMode);
        tableSettings["enableMassEdit"] = enableMassEdit;
      }
      if (this.analyticalConfiguration?.aggregationOnLeafLevel === true) {
        const analyticalConfiguration = {};
        TableBlock.addSetting(analyticalConfiguration, "aggregationOnLeafLevel", this.analyticalConfiguration.aggregationOnLeafLevel);
        if (Object.entries(analyticalConfiguration).length > 0) {
          tableSettings["analyticalConfiguration"] = analyticalConfiguration;
        }
      }
      return tableSettings;
    };
    TableBlock.createTableDefinition = function createTableDefinition(table, templateProcessorSettings) {
      const initialConverterContext = table.getConverterContext(table.contextObjectPath, table.contextPath?.getPath(), templateProcessorSettings);
      const visualizationPath = TableBlock.getVisualizationPath(table.contextObjectPath, initialConverterContext);
      const tableSettings = table.getTableSettings();
      const extraManifestSettings = {
        actions: TableBlock.createActionsFromManifest(table),
        columns: TableBlock.createColumnsForManifest(table),
        tableSettings
      };
      const extraParams = {};
      extraParams[visualizationPath] = extraManifestSettings;
      const converterContext = table.getConverterContext(table.contextObjectPath, table.contextPath?.getPath(), templateProcessorSettings, extraParams);
      let associatedSelectionVariant;
      if (table.associatedSelectionVariantPath) {
        const svObjectPath = getInvolvedDataModelObjects(table.associatedSelectionVariantPath, table.contextPath);
        associatedSelectionVariant = svObjectPath.targetObject;
      }
      const visualizationDefinition = getDataVisualizationConfiguration(table.inMultiView && table.contextObjectPath.targetObject ? converterContext.getRelativeAnnotationPath(table.contextObjectPath.targetObject.fullyQualifiedName, converterContext.getEntityType()) : getContextRelativeTargetObjectPath(table.contextObjectPath), converterContext, {
        isCondensedTableLayoutCompliant: table.useCondensedLayout,
        associatedSelectionVariant,
        isMacroOrMultipleView: table.inMultiView ?? true
      });

      // take the (first) Table visualization
      return visualizationDefinition.visualizations.find(viz => viz.type === VisualizationType.Table);
    }

    /**
     * Creates the manifest actions for the table.
     * @param table The table block
     * @returns The manifest actions for the table
     */;
    TableBlock.createActionsFromManifest = function createActionsFromManifest(table) {
      const actionsSettings = {};
      const addActionToExtraManifest = action => {
        const key = action.key;
        actionsSettings[key] = {
          position: {
            placement: action.placement ?? "After",
            anchor: action.anchor
          },
          command: action.command,
          enableOnSelect: action.enableOnSelect,
          visible: action.visible,
          enabled: action.enabled
        };
        if (action._type === "Action") {
          actionsSettings[key] = {
            ...actionsSettings[key],
            text: action.text,
            __noWrap: true,
            press: action.press,
            requiresSelection: action.requiresSelection
          };
          return;
        }
        const afterExecution = {
          enableAutoScroll: action["enableAutoScroll"],
          navigateToInstance: action["navigateToInstance"]
        };
        removeUndefinedProperties(afterExecution);
        actionsSettings[key] = {
          ...actionsSettings[key],
          afterExecution: Object.entries(afterExecution).length ? afterExecution : undefined,
          defaultValuesFunction: action.defaultValuesFunction
        };
      };
      if (table.actions) {
        Object.values(table.actions).forEach(item => {
          if (item._type === "Action" || item._type === "ActionOverride") {
            addActionToExtraManifest(item);
          } else if (item._type === "ActionGroup" || item._type === "ActionGroupOverride") {
            // ActionGroup or ActionGroupOverride
            const key = item.key;
            actionsSettings[key] = {
              position: {
                placement: item.placement ?? "After",
                anchor: item.anchor
              },
              menu: item.actions.map(action => action.key)
            };
            if (item._type === "ActionGroup") {
              actionsSettings[key] = {
                ...actionsSettings[key],
                text: item.text,
                defaultAction: item.defaultAction,
                __noWrap: true
              };
            }
            item.actions.forEach(action => {
              addActionToExtraManifest(action);
            });
          }
        });
      }
      return actionsSettings;
    }

    /**
     * Creates the manifest columns for the table.
     * @param table The table block
     * @returns The manifest actions for the table
     */;
    TableBlock.createColumnsForManifest = function createColumnsForManifest(table) {
      const isBlockColumn = block => {
        return block._type === "Column";
      };
      const columnSettings = {};
      if (table.columns) {
        Object.values(table.columns).forEach(column => {
          let customColumnDefinition;
          if (isBlockColumn(column)) {
            customColumnDefinition = {
              header: column.header,
              width: column.width,
              importance: column.importance,
              horizontalAlign: column.horizontalAlign,
              widthIncludingColumnHeader: column.widthIncludingColumnHeader,
              exportSettings: column.exportSettings,
              properties: column.properties,
              tooltip: column.tooltip,
              template: column.template,
              availability: column.availability,
              required: column.required,
              type: "Slot"
            };
          } else {
            customColumnDefinition = {
              key: column.key,
              width: column.width,
              importance: column.importance,
              horizontalAlign: column.horizontalAlign,
              widthIncludingColumnHeader: column.widthIncludingColumnHeader,
              exportSettings: column.exportSettings,
              availability: column.availability
            };
          }

          // Remove all undefined properties, so that they don't erase what is set in the manifest
          // (necessary because manifest-based columns are transformed into slot columns and we don't copy
          // all their properties in the XML)
          removeUndefinedProperties(customColumnDefinition);
          if (isBlockColumn(column) && (column.anchor || column.placement)) {
            customColumnDefinition.position = {
              anchor: column.anchor,
              placement: column.placement ?? "After"
            };
          }
          columnSettings[column.key] = customColumnDefinition;
        });
      }
      return columnSettings;
    };
    _proto.setUpId = function setUpId() {
      if (this.id) {
        // The given ID shall be assigned to the TableAPI and not to the MDC Table
        this._apiId = this.id;
        // Generate the contentId based on the ID, if not provided (FPM case)
        this.contentId ??= this.getContentId(this.id);
      } else {
        // We generate the ID and the contentID. Due to compatibility reasons we keep it on the MDC Table but provide assign
        // the ID with a ::Table suffix to the TableAPI
        this.id = this.tableDefinition.annotation.apiId;
        this.contentId = this.tableDefinition.annotation.id;
        this._apiId = this.tableDefinition.annotation.apiId;
      }
    };
    _proto._getEntityType = function _getEntityType() {
      return this.collectionEntity?.entityType || this.collectionEntity?.targetType;
    };
    _proto.getEmptyRowsEnabled = function getEmptyRowsEnabled() {
      const enabled = this.creationMode.name === CreationMode.InlineCreationRows ? this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create)?.enabled : undefined;
      return enabled === "false" ? undefined : enabled;
    };
    _proto.getTemplate = function getTemplate() {
      const entityType = this._getEntityType();
      const tableProps = this;
      tableProps.overrideRowPress = this.rowPress !== undefined;
      const collectionEntity = this.convertedMetadata.resolvePath(tableProps.tableDefinition.annotation.collection).target;
      const handlerProvider = new TableEventHandlerProvider(tableProps, {
        collectionEntity,
        metaModel: this.metaPath.getModel()
      });
      let creationMode;
      if (this.creationMode && Object.keys(this.creationMode).length > 0) {
        creationMode = _jsx(TableCreationOptions, {
          ...this.creationMode
        });
      }
      return _jsx(TableAPI, {
        "core:require": "{FPM: 'sap/fe/core/helpers/FPMHelper'}",
        binding: `{internal>controls/${this.contentId}}`,
        id: this._apiId,
        contentId: this.contentId,
        visible: this.visible,
        headerLevel: this.headerLevel,
        headerStyle: this.headerStyle,
        headerVisible: this.headerVisible,
        tabTitle: this.tabTitle,
        exportRequestSize: this.exportRequestSize,
        disableCopyToClipboard: this.disableCopyToClipboard,
        scrollThreshold: this.scrollThreshold,
        isSearchable: this.isSearchable,
        busy: this.busy,
        initialLoad: this.initialLoad,
        header: this.header,
        isAlp: this.isAlp,
        fieldMode: this.fieldMode,
        personalization: this.personalization,
        rowPress: this.rowPress,
        variantSaved: this.variantSaved,
        variantSelected: this.variantSelected,
        segmentedButtonPress: this.segmentedButtonPress,
        variantManagement: this.variantManagement,
        ignoredFields: this.tableDefinition.control.ignoredFields // Need to be from the tableDefinition to be in phase for the getIgnoreFields
        ,
        tableDefinition: `{_pageModel>${this.tableDefinitionContext.getPath()}}`,
        entityTypeFullyQualifiedName: entityType?.fullyQualifiedName,
        metaPath: this.metaPath?.getPath(),
        useBasicSearch: this.useBasicSearch,
        enableFullScreen: this.enableFullScreen,
        enableExport: this.enableExport,
        frozenColumnCount: this.frozenColumnCount,
        enablePaste: this.enablePaste,
        rowCountMode: this.rowCountMode,
        rowCount: this.rowCount,
        contextPath: this.contextPath?.getPath(),
        selectionChange: this.selectionChange,
        listBindingChange: this.listBindingChange,
        readOnly: this.readOnly,
        selectionMode: this.selectionMode,
        useCondensedLayout: this.useCondensedLayout,
        type: this.type,
        filterBar: this.filterBar,
        emptyRowsEnabled: this.getEmptyRowsEnabled(),
        enableAutoColumnWidth: this.enableAutoColumnWidth,
        beforeRebindTable: this.beforeRebindTable,
        widthIncludingColumnHeader: this.widthIncludingColumnHeader,
        modeForNoDataMessage: this.modeForNoDataMessage,
        associatedSelectionVariantPath: this.associatedSelectionVariantPath?.getPath(),
        displaySegmentedButton: this.displaySegmentedButton,
        enablePastingOfComputedProperties: this.enablePastingOfComputedProperties,
        enableSelectAll: this.enableSelectAll,
        inMultiView: this.inMultiView,
        selectionLimit: this.selectionLimit,
        condensedTableLayout: this.condensedTableLayout,
        children: {
          customData: createCustomData("tableAPILocalId", this._apiId),
          creationMode,
          layoutData: _jsx(FlexItemData, {
            maxWidth: "100%"
          }),
          content: getMDCTableTemplate(tableProps, {
            metaPath: this.metaPath,
            convertedMetadata: this.convertedMetadata,
            metaModel: this.metaModel,
            handlerProvider,
            appComponent: this.appComponent
          })
        }
      });
    };
    return TableBlock;
  }(BuildingBlockTemplatingBase), _TableBlock.addSetting = (target, key, value) => {
    if (value !== undefined) {
      target[key] = value;
    }
  }, _TableBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "busy", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "condensedTableLayout", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "enableFullScreen", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "enablePastingOfComputedProperties", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "enableSelectAll", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "enableExport", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "exportRequestSize", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "selectionLimit", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "frozenColumnCount", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "rowCountMode", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "rowCount", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "enablePaste", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "disableCopyToClipboard", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "scrollThreshold", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "contentId", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "associatedSelectionVariantPath", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "isSearchable", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "useCondensedLayout", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "ignoredFields", [_dec33], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "modeForNoDataMessage", [_dec34], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "headerStyle", [_dec35], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoColumnWidth", [_dec36], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "fieldMode", [_dec37], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "isAlp", [_dec38], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor38 = _applyDecoratedDescriptor(_class2.prototype, "inMultiView", [_dec39], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor39 = _applyDecoratedDescriptor(_class2.prototype, "tabTitle", [_dec40], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor40 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec41], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor41 = _applyDecoratedDescriptor(_class2.prototype, "displaySegmentedButton", [_dec42], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor42 = _applyDecoratedDescriptor(_class2.prototype, "creationMode", [_dec43], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor43 = _applyDecoratedDescriptor(_class2.prototype, "analyticalConfiguration", [_dec44], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {};
    }
  }), _descriptor44 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec45], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor45 = _applyDecoratedDescriptor(_class2.prototype, "massEdit", [_dec46], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor46 = _applyDecoratedDescriptor(_class2.prototype, "columns", [_dec47], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor47 = _applyDecoratedDescriptor(_class2.prototype, "quickVariantSelection", [_dec48], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor48 = _applyDecoratedDescriptor(_class2.prototype, "beforeRebindTable", [_dec49], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor49 = _applyDecoratedDescriptor(_class2.prototype, "rowPress", [_dec50], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor50 = _applyDecoratedDescriptor(_class2.prototype, "listBindingChange", [_dec51], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor51 = _applyDecoratedDescriptor(_class2.prototype, "segmentedButtonPress", [_dec52], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor52 = _applyDecoratedDescriptor(_class2.prototype, "variantSaved", [_dec53], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor53 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec54], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor54 = _applyDecoratedDescriptor(_class2.prototype, "variantSelected", [_dec55], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor55 = _applyDecoratedDescriptor(_class2.prototype, "initialLoad", [_dec56], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TableBlock;
  return _exports;
}, false);
//# sourceMappingURL=Table.block-dbg.js.map
