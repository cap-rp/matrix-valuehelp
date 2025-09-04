/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/CommonUtils", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog", "sap/fe/core/controllerextensions/routing/NavigationReason", "sap/fe/core/controls/Any", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/Table", "sap/fe/core/converters/controls/Common/table/StandardActions", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/PasteHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/MacroAPI", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/table/MdcTableTemplate", "sap/fe/macros/table/TableCreationOptions", "sap/fe/macros/table/TableHelper", "sap/fe/macros/table/TableRuntime", "sap/fe/macros/table/Utils", "sap/fe/macros/table/adapter/TablePVToState", "sap/fe/macros/table/massEdit/MassEditDialogHelper", "sap/fe/navigation/PresentationVariant", "sap/m/IllustratedMessage", "sap/m/IllustratedMessageType", "sap/m/MessageBox", "sap/m/MessageToast", "sap/m/Text", "sap/ui/base/ManagedObjectMetadata", "sap/ui/core/Element", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/library", "sap/ui/core/message/Message", "sap/ui/core/util/XMLPreprocessor", "sap/ui/mdc/p13n/StateUtil", "../mdc/adapter/StateHelper", "./TableDefinition", "./TableEventHandlerProvider", "./mixin/ColumnManagement", "./mixin/ContextMenuHandler", "./mixin/EmptyRowsHandler", "./mixin/TableAPIStateHandler", "./mixin/TableExport", "./mixin/TableHierarchy", "./mixin/TableOptimisticBatch", "./mixin/TableSharing"], function (Log, deepClone, BindingToolkit, ClassSupport, jsx, CommonUtils, BuildingBlockTemplateProcessor, NotApplicableContextDialog, NavigationReason, Any, ManifestSettings, MetaModelConverter, Table, StandardActions, DeleteHelper, FPMHelper, PasteHelper, ResourceModelHelper, StableIdHelper, DataModelPathHelper, UIFormatters, MacroAPI, FieldTemplating, FilterUtils, MdcTableTemplate, TableCreationOptions, TableHelper, TableRuntime, TableUtils, TablePVToState, MassEditDialogHelper, PresentationVariantClass, IllustratedMessage, IllustratedMessageType, MessageBox, MessageToast, Text, ManagedObjectMetadata, UI5Element, Fragment, Library, Messaging, library, Message, XMLPreprocessor, StateUtil, StateHelper, TableDefinition, TableEventHandlerProvider, ColumnManagement, ContextMenuHandler, EmptyRowsHandler, TableAPIStateHandler, TableExport, TableHierarchy, TableOptimisticBatch, TableSharing) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _dec51, _dec52, _dec53, _dec54, _dec55, _dec56, _dec57, _dec58, _dec59, _dec60, _dec61, _dec62, _dec63, _dec64, _dec65, _dec66, _dec67, _dec68, _dec69, _dec70, _dec71, _dec72, _dec73, _dec74, _dec75, _dec76, _dec77, _dec78, _dec79, _dec80, _dec81, _dec82, _dec83, _dec84, _dec85, _dec86, _dec87, _dec88, _dec89, _dec90, _dec91, _dec92, _dec93, _dec94, _dec95, _dec96, _dec97, _dec98, _dec99, _dec100, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31, _descriptor32, _descriptor33, _descriptor34, _descriptor35, _descriptor36, _descriptor37, _descriptor38, _descriptor39, _descriptor40, _descriptor41, _descriptor42, _descriptor43, _descriptor44, _descriptor45, _descriptor46, _descriptor47, _descriptor48, _descriptor49, _descriptor50, _descriptor51, _descriptor52, _descriptor53, _descriptor54, _descriptor55, _descriptor56, _descriptor57, _descriptor58, _descriptor59, _descriptor60, _descriptor61, _descriptor62, _descriptor63, _descriptor64;
  var createTableDefinition = TableDefinition.createTableDefinition;
  var TitleLevel = library.TitleLevel;
  var convertPVToState = TablePVToState.convertPVToState;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var StandardActionKeys = StandardActions.StandardActionKeys;
  var getCustomFunctionInfo = Table.getCustomFunctionInfo;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var CreationMode = ManifestSettings.CreationMode;
  var xml = BuildingBlockTemplateProcessor.xml;
  var parseXMLString = BuildingBlockTemplateProcessor.parseXMLString;
  var xmlEventHandler = ClassSupport.xmlEventHandler;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create a table based on the metadata provided by OData V4.
   * <br>
   * Usually, a LineItem, PresentationVariant or SelectionPresentationVariant annotation is expected, but the Table building block can also be used to display an EntitySet.
   * <br>
   * If a PresentationVariant is specified, then it must have UI.LineItem as the first property of the Visualizations.
   * <br>
   * If a SelectionPresentationVariant is specified, then it must contain a valid PresentationVariant that also has a UI.LineItem as the first property of the Visualizations.
   *
   * Usage example:
   * <pre>
   * &lt;macros:Table id="MyTable" metaPath="@com.sap.vocabularies.UI.v1.LineItem" /&gt;
   * </pre>
   * @private
   */
  let TableAPI = (_dec = defineUI5Class("sap.fe.macros.table.TableAPI", {
    returnTypes: ["sap.fe.macros.MacroAPI"]
  }), _dec2 = mixin(TableAPIStateHandler), _dec3 = mixin(TableExport), _dec4 = mixin(TableOptimisticBatch), _dec5 = mixin(TableHierarchy), _dec6 = mixin(EmptyRowsHandler), _dec7 = mixin(ContextMenuHandler), _dec8 = mixin(TableSharing), _dec9 = mixin(ColumnManagement), _dec10 = implementInterface("sap.fe.core.IRowBindingInterface"), _dec11 = implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor"), _dec12 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"],
    expectedAnnotations: ["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"],
    required: true
  }), _dec13 = property({
    type: "string",
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec14 = property({
    type: "object"
  }), _dec15 = property({
    type: "string"
  }), _dec16 = property({
    type: "string"
  }), _dec17 = property({
    type: "boolean"
  }), _dec18 = property({
    type: "boolean"
  }), _dec19 = property({
    type: "int"
  }), _dec20 = property({
    type: "string",
    allowedValues: ["Auto", "Fixed"]
  }), _dec21 = property({
    type: "int"
  }), _dec22 = property({
    type: "boolean"
  }), _dec23 = property({
    type: "boolean"
  }), _dec24 = property({
    type: "int"
  }), _dec25 = property({
    type: "boolean"
  }), _dec26 = property({
    type: "string",
    allowedValues: ["GridTable", "ResponsiveTable", "AnalyticalTable"]
  }), _dec27 = property({
    type: "boolean"
  }), _dec28 = property({
    type: "string",
    allowedValues: ["None", "Single", "Multi", "Auto", "ForceMulti", "ForceSingle"]
  }), _dec29 = property({
    type: "boolean"
  }), _dec30 = aggregation({
    type: "sap.fe.macros.table.Action",
    altTypes: ["sap.fe.macros.table.ActionGroup", "sap.fe.macros.table.ActionOverride", "sap.fe.macros.table.ActionGroupOverride"],
    multiple: true
  }), _dec31 = aggregation({
    type: "sap.fe.macros.table.Column",
    altTypes: ["sap.fe.macros.table.ColumnOverride"],
    multiple: true
  }), _dec32 = property({
    type: "boolean"
  }), _dec33 = property({
    type: "string"
  }), _dec34 = property({
    type: "boolean",
    defaultValue: true
  }), _dec35 = property({
    type: "boolean",
    defaultValue: false
  }), _dec36 = property({
    type: "string",
    allowedValues: ["illustratedMessage-Auto", "illustratedMessage-Base", "illustratedMessage-Dialog", "illustratedMessage-Medium", "illustratedMessage-Dot", "illustratedMessage-ExtraSmall", "illustratedMessage-Scene", "illustratedMessage-Large", "illustratedMessage-Spot", "illustratedMessage-Small", "text"]
  }), _dec37 = property({
    type: "boolean",
    defaultValue: false
  }), _dec38 = property({
    type: "boolean",
    defaultValue: false
  }), _dec39 = property({
    type: "boolean",
    defaultValue: false
  }), _dec40 = property({
    type: "boolean",
    defaultValue: false
  }), _dec41 = property({
    type: "string"
  }), _dec42 = property({
    type: "string"
  }), _dec43 = property({
    type: "string"
  }), _dec44 = property({
    type: "string"
  }), _dec45 = property({
    type: "sap.ui.core.TitleLevel",
    defaultValue: TitleLevel.Auto
  }), _dec46 = property({
    type: "sap.ui.core.TitleLevel"
  }), _dec47 = property({
    type: "int"
  }), _dec48 = property({
    type: "boolean"
  }), _dec49 = property({
    type: "string"
  }), _dec50 = property({
    type: "string"
  }), _dec51 = property({
    type: "boolean"
  }), _dec52 = property({
    type: "boolean",
    defaultValue: false
  }), _dec53 = property({
    type: "boolean",
    isBindingInfo: true
  }), _dec54 = property({
    type: "string"
  }), _dec55 = property({
    type: "string"
  }), _dec56 = property({
    type: "boolean"
  }), _dec57 = property({
    type: "boolean"
  }), _dec58 = property({
    type: "boolean"
  }), _dec59 = property({
    type: "boolean"
  }), _dec60 = property({
    type: "int"
  }), _dec61 = aggregation({
    type: "sap.fe.macros.table.TableCreationOptions",
    defaultClass: TableCreationOptions
  }), _dec62 = aggregation({
    type: "sap.m.IllustratedMessage",
    altTypes: ["sap.m.Text"],
    forwarding: {
      getter: "getMDCTable",
      aggregation: "noData"
    }
  }), _dec63 = aggregation({
    type: "sap.fe.macros.table.AnalyticalConfiguration"
  }), _dec64 = aggregation({
    type: "sap.fe.macros.table.QuickVariantSelection"
  }), _dec65 = aggregation({
    type: "sap.fe.macros.table.MassEdit"
  }), _dec66 = event(), _dec67 = event(), _dec68 = event(), _dec69 = event(), _dec70 = event(), _dec71 = event(), _dec72 = event(), _dec73 = event(), _dec74 = xmlEventHandler(), _dec75 = xmlEventHandler(), _dec76 = xmlEventHandler(), _dec77 = xmlEventHandler(), _dec78 = xmlEventHandler(), _dec79 = xmlEventHandler(), _dec80 = xmlEventHandler(), _dec81 = xmlEventHandler(), _dec82 = xmlEventHandler(), _dec83 = xmlEventHandler(), _dec84 = xmlEventHandler(), _dec85 = xmlEventHandler(), _dec86 = xmlEventHandler(), _dec87 = xmlEventHandler(), _dec88 = xmlEventHandler(), _dec89 = xmlEventHandler(), _dec90 = xmlEventHandler(), _dec91 = xmlEventHandler(), _dec92 = xmlEventHandler(), _dec93 = xmlEventHandler(), _dec94 = xmlEventHandler(), _dec95 = xmlEventHandler(), _dec96 = xmlEventHandler(), _dec97 = xmlEventHandler(), _dec98 = xmlEventHandler(), _dec99 = xmlEventHandler(), _dec100 = xmlEventHandler(), _dec(_class = _dec2(_class = _dec3(_class = _dec4(_class = _dec5(_class = _dec6(_class = _dec7(_class = _dec8(_class = _dec9(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function TableAPI(mSettings) {
      var _this;
      for (var _len = arguments.length, others = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        others[_key - 1] = arguments[_key];
      }
      _this = _MacroAPI.call(this, mSettings, ...others) || this;
      _this.propertyEditModeCache = {};
      _this.initialControlState = {};
      _initializerDefineProperty(_this, "__implements__sap_fe_core_IRowBindingInterface", _descriptor, _this);
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", _descriptor2, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor4, _this);
      _initializerDefineProperty(_this, "tableDefinition", _descriptor5, _this);
      _initializerDefineProperty(_this, "contentId", _descriptor6, _this);
      _initializerDefineProperty(_this, "entityTypeFullyQualifiedName", _descriptor7, _this);
      _initializerDefineProperty(_this, "enableFullScreen", _descriptor8, _this);
      _initializerDefineProperty(_this, "enableExport", _descriptor9, _this);
      _initializerDefineProperty(_this, "frozenColumnCount", _descriptor10, _this);
      _initializerDefineProperty(_this, "rowCountMode", _descriptor11, _this);
      _initializerDefineProperty(_this, "rowCount", _descriptor12, _this);
      _initializerDefineProperty(_this, "enablePaste", _descriptor13, _this);
      _initializerDefineProperty(_this, "disableCopyToClipboard", _descriptor14, _this);
      _initializerDefineProperty(_this, "scrollThreshold", _descriptor15, _this);
      _initializerDefineProperty(_this, "isSearchable", _descriptor16, _this);
      _initializerDefineProperty(_this, "type", _descriptor17, _this);
      _initializerDefineProperty(_this, "useCondensedLayout", _descriptor18, _this);
      _initializerDefineProperty(_this, "selectionMode", _descriptor19, _this);
      _initializerDefineProperty(_this, "condensedTableLayout", _descriptor20, _this);
      _initializerDefineProperty(_this, "actions", _descriptor21, _this);
      _initializerDefineProperty(_this, "columns", _descriptor22, _this);
      /**
       * An expression that allows you to control the 'read-only' state of the table.
       *
       * If you do not set any expression, SAP Fiori elements hooks into the standard lifecycle to determine the current state.
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor23, _this);
      /**
       * ID of the FilterBar building block associated with the table.
       */
      //@association({ type: "sap.fe.macros.filterBar.FilterBarAPI" })
      _initializerDefineProperty(_this, "filterBar", _descriptor24, _this);
      /**
       * Specifies if the column width is automatically calculated.
       */
      _initializerDefineProperty(_this, "enableAutoColumnWidth", _descriptor25, _this);
      /**
       * Indicates if the column header should be a part of the width calculation.
       */
      _initializerDefineProperty(_this, "widthIncludingColumnHeader", _descriptor26, _this);
      /**
       * Changes the size of the IllustratedMessage in the table, or removes it completely.
       * Allowed values are `illustratedMessage-Auto`, `illustratedMessage-Base`, `illustratedMessage-Dialog`, `illustratedMessage-Dot`, `illustratedMessage-Scene`, `illustratedMessage-Spot` or `text`.
       */
      _initializerDefineProperty(_this, "modeForNoDataMessage", _descriptor27, _this);
      _initializerDefineProperty(_this, "dataInitialized", _descriptor28, _this);
      _initializerDefineProperty(_this, "bindingSuspended", _descriptor29, _this);
      _initializerDefineProperty(_this, "outDatedBinding", _descriptor30, _this);
      _initializerDefineProperty(_this, "isAlp", _descriptor31, _this);
      _initializerDefineProperty(_this, "variantManagement", _descriptor32, _this);
      _initializerDefineProperty(_this, "ignoredFields", _descriptor33, _this);
      _initializerDefineProperty(_this, "id", _descriptor34, _this);
      _initializerDefineProperty(_this, "fieldMode", _descriptor35, _this);
      _initializerDefineProperty(_this, "headerLevel", _descriptor36, _this);
      _initializerDefineProperty(_this, "headerStyle", _descriptor37, _this);
      _initializerDefineProperty(_this, "exportRequestSize", _descriptor38, _this);
      _initializerDefineProperty(_this, "initialLoad", _descriptor39, _this);
      /**
       * Controls which options should be enabled for the table personalization dialog.
       *
       * If it is set to `true`, all possible options for this kind of table are enabled.<br/>
       * If it is set to `false`, personalization is disabled.<br/>
       *<br/>
       * You can also provide a more granular control for the personalization by providing a comma-separated list with the options you want to be available.<br/>
       * Available options are:<br/>
       *  - Sort<br/>
       *  - Column<br/>
       *  - Filter<br/>
       *  - Group<br/>
       *<br/>
       * The Group option is only applicable to analytical tables and responsive tables.<br/>
       */
      _initializerDefineProperty(_this, "personalization", _descriptor40, _this);
      /**
       * Specifies the header text that is shown in the table.
       *
       */
      _initializerDefineProperty(_this, "header", _descriptor41, _this);
      _initializerDefineProperty(_this, "useBasicSearch", _descriptor42, _this);
      /**
       * Specifies if the empty rows are enabled. This allows to have dynamic enablement of the empty rows using the setter function.
       */
      _initializerDefineProperty(_this, "emptyRowsEnabled", _descriptor43, _this);
      /**
       * Controls if the header text should be shown or not.
       *
       */
      _initializerDefineProperty(_this, "headerVisible", _descriptor44, _this);
      _initializerDefineProperty(_this, "tabTitle", _descriptor45, _this);
      _initializerDefineProperty(_this, "associatedSelectionVariantPath", _descriptor46, _this);
      _initializerDefineProperty(_this, "inMultiView", _descriptor47, _this);
      _initializerDefineProperty(_this, "displaySegmentedButton", _descriptor48, _this);
      _initializerDefineProperty(_this, "enablePastingOfComputedProperties", _descriptor49, _this);
      _initializerDefineProperty(_this, "enableSelectAll", _descriptor50, _this);
      _initializerDefineProperty(_this, "selectionLimit", _descriptor51, _this);
      _initializerDefineProperty(_this, "creationMode", _descriptor52, _this);
      /**
       * Aggregation to forward the IllustratedMessage control to the mdc control.
       * @public
       */
      _initializerDefineProperty(_this, "noData", _descriptor53, _this);
      /**
       * A set of options that can be configured to control the aggregation behavior
       * @public
       */
      _initializerDefineProperty(_this, "analyticalConfiguration", _descriptor54, _this);
      /**
       * Aggregate quickVariantSelection of the table.
       */
      _initializerDefineProperty(_this, "quickVariantSelection", _descriptor55, _this);
      /**
       * Aggregate mass edit of the table.
       */
      _initializerDefineProperty(_this, "massEdit", _descriptor56, _this);
      /**
       * An event is triggered when the table is about to be rebound. This event contains information about the binding info.
       *
       * You can use this event to add or read: Filters, Sorters.
       * You can use this event to read the binding info.
       * You can use this event to add: Selects.
       */
      _initializerDefineProperty(_this, "beforeRebindTable", _descriptor57, _this);
      /**
       * An event is triggered when the user chooses a row; the event contains information about which row is chosen.
       *
       * You can set this in order to handle the navigation manually.
       */
      _initializerDefineProperty(_this, "rowPress", _descriptor58, _this);
      /**
       * An event is triggered when the user switched between view in an ALP.
       */
      _initializerDefineProperty(_this, "segmentedButtonPress", _descriptor59, _this);
      /**
       * An event is triggered when the user saved the variant.
       */
      _initializerDefineProperty(_this, "variantSaved", _descriptor60, _this);
      /**
       * An event is triggered when the user selected a variant.
       */
      _initializerDefineProperty(_this, "variantSelected", _descriptor61, _this);
      /**
       * An event triggered when the Table list binding changes.
       */
      _initializerDefineProperty(_this, "listBindingChange", _descriptor62, _this);
      _initializerDefineProperty(_this, "internalDataRequested", _descriptor63, _this);
      _this.ignoreContextChangeEvent = false;
      _this.lock = {};
      _this.overrideRowPress = false;
      /**
       * An event triggered when the selection in the table changes.
       */
      _initializerDefineProperty(_this, "selectionChange", _descriptor64, _this);
      _this.enhancedPropertyInfos = [];
      _this.propertyInfos = [];
      _this.originalTableDefinition = _this.tableDefinition;
      _this.attachStateChangeHandler();
      _this.attachManifestEvents();
      _this.overrideRowPress = _this.hasListeners("rowPress");
      return _this;
    }
    _inheritsLoose(TableAPI, _MacroAPI);
    var _proto = TableAPI.prototype;
    _proto.getRowBinding = function getRowBinding() {
      const mdcTable = this.content;
      const dataModel = mdcTable.getModel();
      return mdcTable.getRowBinding() ?? dataModel?.bindList(this.getRowCollectionPath());
    };
    _proto.attachStateChangeHandler = function attachStateChangeHandler() {
      StateUtil.detachStateChange(this.stateChangeHandler);
      StateUtil.attachStateChange(this.stateChangeHandler);
    };
    _proto.stateChangeHandler = function stateChangeHandler(oEvent) {
      const control = oEvent.getParameter("control");
      if (control.isA("sap.ui.mdc.Table")) {
        const tableAPI = control.getParent();
        if (tableAPI?.handleStateChange) {
          tableAPI.handleStateChange();
        }
      }
    }

    /**
     * Attach the event handlers coming from the manifest for 'rowPress', 'selectionChange' and 'beforeRebindTable'.
     * We ignore the manifest handlers if the table already has event handlers (override).
     */;
    _proto.attachManifestEvents = function attachManifestEvents() {
      const attachIfNoListeners = (eventName, methodConfig) => {
        if (!this.hasListeners(eventName) && methodConfig !== undefined) {
          this.attachEvent(eventName, ui5Event => {
            FPMHelper.loadModuleAndCallMethod(methodConfig.moduleName, methodConfig.methodName, ui5Event, ui5Event).catch(error => {
              Log.error(`Failed to call ${eventName} event handler ${methodConfig.moduleName} ${methodConfig.methodName}`, error);
            });
          });
        }
      };
      attachIfNoListeners("beforeRebindTable", getCustomFunctionInfo(this.tableDefinition?.control?.beforeRebindTable, this.tableDefinition?.control));
      attachIfNoListeners("rowPress", getCustomFunctionInfo(this.tableDefinition?.control?.rowPress, this.tableDefinition?.control));
      attachIfNoListeners("selectionChange", getCustomFunctionInfo(this.tableDefinition?.control?.selectionChange, this.tableDefinition?.control));
    }

    /**
     * Sets an illustrated message during the initialisation of the table API.
     * Useful if we have a building block in a list report without initial load.
     * @private
     */;
    _proto.setUpNoDataInformation = function setUpNoDataInformation() {
      const table = this.content;
      if (!table || table.getNoData()) {
        return;
      }
      const owner = this._getOwner();
      let description;
      let title;
      if (owner) {
        const resourceModel = getResourceModel(owner);
        if (resourceModel) {
          let suffix;
          const metaPath = this.metaPath;
          if (metaPath) {
            suffix = metaPath.startsWith("/") ? metaPath.substring(1) : metaPath;
          }
          title = resourceModel.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH");
          description = resourceModel.getText("T_TABLE_AND_CHART_NO_DATA_TEXT", undefined, suffix);
        }
      } else {
        const resourceBundle = Library.getResourceBundleFor("sap.fe.templates");
        title = resourceBundle.getText("T_ILLUSTRATED_MESSAGE_TITLE_BEFORESEARCH");
        description = resourceBundle.getText("T_TABLE_AND_CHART_NO_DATA_TEXT");
      }
      if (this.getNoDataMessageMode() === "text") {
        this.setAggregation("noData", new Text({
          text: description
        }));
      } else {
        const illustratedMessage = new IllustratedMessage({
          title: title,
          description: description,
          illustrationType: IllustratedMessageType.BeforeSearch,
          illustrationSize: this.getNoDataMessageMode(),
          enableDefaultTitleAndDescription: false
        });
        this.setAggregation("noData", illustratedMessage);
      }
    };
    _proto.getSectionContentRole = function getSectionContentRole() {
      return "consumer";
    }

    /**
     * Implementation of the sendDataToConsumer method which is a part of the ISingleSectionContributor
     *
     * Will be called from the sap.fe.macros.controls.Section control when there is a Table building block rendered within a section
     * along with the consumerData i.e. section's data such as title and title level which is then applied to the table using the implementation below accordingly.
     *
     */;
    _proto.sendDataToConsumer = function sendDataToConsumer(consumerData) {
      if (this.content?.isA("sap.ui.mdc.Table")) {
        this.content?.setHeader(consumerData.title);
        this.content?.setHeaderStyle(consumerData.headerStyle);
        this.content?.setHeaderLevel(consumerData.titleLevel);
      }
    };
    _proto.getIgnoreContextChangeEvent = function getIgnoreContextChangeEvent() {
      return this.ignoreContextChangeEvent;
    };
    _proto.setIgnoreContextChangeEvent = function setIgnoreContextChangeEvent(value) {
      this.ignoreContextChangeEvent = value;
    }

    /**
     * Gets the relevant tableAPI for a UI5 event.
     * An event can be triggered either by the inner control (the table) or the Odata listBinding
     * The first initiator is the usual one so it's managed by the MacroAPI whereas
     * the second one is specific to this API and has to managed by the TableAPI.
     * @param source The UI5 event source
     * @returns The TableAPI or false if not found
     * @private
     */;
    TableAPI._getAPIExtension = function _getAPIExtension(source) {
      let tableAPI;
      if (source.isA("sap.ui.model.odata.v4.ODataListBinding")) {
        tableAPI = this.instanceMap?.get(this)?.find(api => api.content?.getRowBinding?.() === source || api.content?.getBinding("items") === source);
      }
      return tableAPI;
    }

    /**
     * Gets contexts from the table that have been selected by the user.
     * @returns Contexts of the rows selected by the user
     * @public
     */;
    _proto.getSelectedContexts = function getSelectedContexts() {
      // When a context menu item has been pressed, the selectedContexts correspond to the items on which
      // the corresponding action shall be applied.
      return this.isContextMenuActive() ? this.getBindingContext("internal")?.getProperty("contextmenu/selectedContexts") ?? [] : this.content.getSelectedContexts();
    }

    /**
     * Adds a message to the table.
     *
     * The message applies to the whole table and not to an individual table row.
     * @param [parameters] The parameters to create the message
     * @param parameters.type Message type
     * @param parameters.message Message text
     * @param parameters.description Message description
     * @param parameters.persistent True if the message is persistent
     * @returns The ID of the message
     * @public
     */;
    _proto.addMessage = function addMessage(parameters) {
      const msgManager = this._getMessageManager();
      const oTable = this.getContent();
      const oMessage = new Message({
        target: oTable.getRowBinding().getResolvedPath(),
        type: parameters.type,
        message: parameters.message,
        processor: oTable.getModel(),
        description: parameters.description,
        persistent: parameters.persistent
      });
      msgManager.addMessages(oMessage);
      return oMessage.getId();
    }

    /**
     * This function will check if the table should request recommendations function.
     * The table in view should only request recommendations if
     * 1. The Page is in Edit mode
     * 2. Table is not read only
     * 3. It has annotation for Common.RecommendedValuesFunction
     * 4. View is not ListReport, for OP/SubOP and forward views recommendations should be requested.
     * @param _oEvent
     * @returns True if recommendations needs to be requested
     */;
    _proto.checkIfRecommendationRelevant = function checkIfRecommendationRelevant(_oEvent) {
      const isTableReadOnly = this.getProperty("readOnly");
      const isEditable = CommonUtils.getIsEditable(this);
      const view = CommonUtils.getTargetView(this);
      const viewData = view.getViewData();
      // request for action only if we are in OP/SubOP and in Edit mode, also table is not readOnly
      if (!isTableReadOnly && isEditable && viewData.converterType !== "ListReport") {
        return true;
      }
      return false;
    }

    /**
     * Removes a message from the table.
     * @param id The id of the message
     * @public
     */;
    _proto.removeMessage = function removeMessage(id) {
      const msgManager = this._getMessageManager();
      const messages = msgManager.getMessageModel().getData();
      const result = messages.find(e => e.getId() === id);
      if (result) {
        msgManager.removeMessages(result);
      }
    }

    /**
     * Requests a refresh of the table.
     * @public
     */;
    _proto.refresh = function refresh() {
      const tableRowBinding = this.content.getRowBinding();
      if (tableRowBinding && (tableRowBinding.isRelative() || this.getTableDefinition().control.type === "TreeTable")) {
        // For tree tables, the refresh is always done using side effects to preserve expansion states
        const appComponent = CommonUtils.getAppComponent(this.content);
        const headerContext = tableRowBinding.getHeaderContext();
        if (headerContext) {
          appComponent.getSideEffectsService().requestSideEffects([{
            $NavigationPropertyPath: ""
          }], headerContext, tableRowBinding.getGroupId());
        }
      } else {
        tableRowBinding?.refresh();
      }
    };
    _proto.getQuickFilter = function getQuickFilter() {
      return this.content?.getQuickFilter();
    }

    /**
     * Get the presentation variant that is currently applied on the table.
     * @returns The presentation variant applied to the table
     * @public
     */;
    _proto.getPresentationVariant = async function getPresentationVariant() {
      try {
        const table = this.content;
        const tableState = await StateUtil.retrieveExternalState(table);

        //We remove "Property::" as it is prefixed to those columns that have associated propertyInfos.
        //The Presentation Variant format does not support this (it is only required by the Table and AppState).
        const sortOrder = tableState.sorters?.map(sorter => {
          return {
            Property: sorter.name.replace("Property::", ""),
            Descending: sorter.descending ?? false
          };
        });
        const groupLevels = tableState.groupLevels?.map(group => {
          return group.name.replace("Property::", "");
        });
        const tableViz = {
          Content: tableState.items?.map(item => {
            return {
              Value: item.name
            };
          }),
          Type: "LineItem"
        };
        const aggregations = {};
        let hasAggregations = false;
        for (const key in tableState.aggregations) {
          const newKey = key.replace("Property::", "");
          aggregations[newKey] = tableState.aggregations[key];
          hasAggregations = true;
        }
        const initialExpansionLevel = table.getPayload()?.initialExpansionLevel;
        const tablePV = new PresentationVariantClass();
        tablePV.setTableVisualization(tableViz);
        const properties = {
          GroupBy: groupLevels || [],
          SortOrder: sortOrder || []
        };
        if (hasAggregations) {
          properties.Aggregations = aggregations;
        }
        if (initialExpansionLevel) {
          properties.initialExpansionLevel = initialExpansionLevel;
        }
        tablePV.setProperties(properties);
        return tablePV;
      } catch (error) {
        const id = this.getId();
        const message = error instanceof Error ? error.message : String(error);
        Log.error(`Table Building Block (${id}) - get presentation variant failed : ${message}`);
        throw Error(error);
      }
    }

    /**
     * Set a new presentation variant to the table.
     * @param tablePV The new presentation variant that is to be set on the table.
     * @public
     */;
    _proto.setPresentationVariant = async function setPresentationVariant(tablePV) {
      try {
        const table = this.content;
        const currentStatePV = await this.getPresentationVariant();
        const propertyInfos = this.getEnhancedFetchedPropertyInfos();
        const propertyInfoNames = propertyInfos.map(propInfo => propInfo.key);
        const newTableState = convertPVToState(tablePV, currentStatePV, propertyInfoNames);
        const tableProperties = tablePV.getProperties();
        if (tableProperties?.initialExpansionLevel !== undefined) {
          const tablePayload = table.getPayload();
          tablePayload.initialExpansionLevel = tableProperties.initialExpansionLevel;
        }
        await StateUtil.applyExternalState(table, newTableState);
      } catch (error) {
        const id = this.getId();
        const message = error instanceof Error ? error.message : String(error);
        Log.error(`Table Building Block (${id}) - set presentation variant failed : ${message}`);
        throw Error(message);
      }
    }

    /**
     * Get the variant management applied to the table.
     * @returns Key of the currently selected variant. In case the model is not yet set, `null` will be returned.
     * @public
     */;
    _proto.getCurrentVariantKey = function getCurrentVariantKey() {
      return this.content.getVariant()?.getCurrentVariantKey();
    }

    /**
     * Set a variant management to the table.
     * @param key Key of the variant that should be selected. If the passed key doesn't identify a variant, it will be ignored.
     * @public
     */;
    _proto.setCurrentVariantKey = function setCurrentVariantKey(key) {
      const variantManagement = this.content.getVariant();
      variantManagement.setCurrentVariantKey(key);
    };
    _proto._getMessageManager = function _getMessageManager() {
      return Messaging;
    };
    _proto._getRowBinding = function _getRowBinding() {
      const oTable = this.getContent();
      return oTable.getRowBinding();
    };
    _proto.getCounts = async function getCounts() {
      const oTable = this.getContent();
      return TableUtils.getListBindingForCount(oTable, oTable.getBindingContext(), {
        batchGroupId: !this.getProperty("bindingSuspended") ? oTable.data("batchGroupId") : "$auto",
        additionalFilters: TableUtils.getHiddenFilters(oTable)
      }).then(iValue => {
        return TableUtils.getCountFormatted(iValue);
      }).catch(() => {
        return "0";
      });
    }

    /**
     * Handles the context change on the table.
     * An event is fired to propagate the OdataListBinding event and the enablement
     * of the creation row is calculated.
     * @param ui5Event The UI5 event
     */;
    _proto.onListBindingChange = function onListBindingChange(ui5Event) {
      this.fireEvent("listBindingChange", ui5Event.getParameters());
      this.setFastCreationRowEnablement();
      this.getQuickFilter()?.refreshSelectedCount();
      TableRuntime.setContextsAsync(this.content);
    }

    /**
     * Handler for the onFieldLiveChange event.
     * @param ui5Event The event object passed by the onFieldLiveChange event
     */;
    _proto.onFieldLiveChange = function onFieldLiveChange(ui5Event) {
      // We can't fully move an xmlEventHandler to a mixin...
      this._onFieldLiveChange(ui5Event);
    }

    /**
     * Handles the change on a quickFilter
     * The table is rebound if the FilterBar is not suspended and update the AppState.
     *
     */;
    _proto.onQuickFilterSelectionChange = function onQuickFilterSelectionChange() {
      const table = this.content;
      // Rebind the table to reflect the change in quick filter key.
      // We don't rebind the table if the filterBar for the table is suspended
      // as rebind will be done when the filterBar is resumed
      const filterBarID = table.getFilter();
      const filterBar = filterBarID && UI5Element.getElementById(filterBarID);
      if (!filterBar?.getSuspendSelection?.()) {
        table.rebind();
      }
      CommonUtils.getTargetView(this)?.getController()?.getExtensionAPI().updateAppState();
    };
    _proto.onTableNavigate = function onTableNavigate(oController, oContext, mParameters) {
      if (this.isTableRowNavigationPossible(oContext)) {
        if (this.fullScreenDialog) {
          // Exit fullscreen mode before navigation
          this.fullScreenDialog.close(); // The fullscreendialog will set this.fullScreenDialog to undefined when closing
        }
        const navigationParameters = Object.assign({}, mParameters, {
          reason: NavigationReason.RowPress
        });
        oController._routing.navigateForwardToContext(oContext, navigationParameters);
      } else {
        return false;
      }
    }

    /**
     * Event handler for the row press event of the table.
     * @param pressEvent
     * @returns Promise<boolean>
     */;
    _proto.onTableRowPress = async function onTableRowPress(pressEvent) {
      const rowNavigationInfo = this.tableDefinition?.annotation.row?.navigationInfo;
      if (this.overrideRowPress === true) {
        // There's an event handler for the rowPress event --> we just fire the event and do not navigate
        this.fireEvent("rowPress", pressEvent.getParameters());
      } else if (rowNavigationInfo !== undefined) {
        const controller = this.getPageController();
        const bindingContext = pressEvent.getParameter("bindingContext");
        if (rowNavigationInfo.type === "Outbound") {
          // Outbound navigation
          return this.avoidParallelCalls(async () => controller._intentBasedNavigation.onChevronPressNavigateOutBound(controller, rowNavigationInfo.navigationTarget, bindingContext, ""), "onChevronPressNavigateOutBound");
        } else {
          // Internal navigation
          const editable = rowNavigationInfo.checkEditable ? !bindingContext.getProperty("IsActiveEntity") : undefined;
          const parameters = {
            callExtension: true,
            targetPath: rowNavigationInfo.targetPath,
            editable,
            recreateContext: rowNavigationInfo.recreateContext
          };
          return this.onTableNavigate(controller, bindingContext, parameters);
        }
      }
    }

    /**
     * Fires the corresponding event when the segmented button is pressed (in ALP).
     * @param oEvent
     */;
    _proto.onSegmentedButtonPressed = function onSegmentedButtonPressed(oEvent) {
      this.fireEvent("segmentedButtonPress", oEvent.getParameters());
    }

    /**
     * Fires the corresponding event when a new variant is selected.
     * @param oEvent
     */;
    _proto.onVariantSelected = function onVariantSelected(oEvent) {
      this.fireEvent("variantSelected", oEvent.getParameters());
    }

    /**
     * Fires the corresponding event when a variant is saved.
     * @param oEvent
     */;
    _proto.onVariantSaved = function onVariantSaved(oEvent) {
      this.fireEvent("variantSaved", oEvent.getParameters());
    }

    /**
     * Fires the corresponding event when a row is pressed.
     * @param oEvent
     */;
    _proto.onRowPressed = function onRowPressed(oEvent) {
      this.fireEvent("rowPress", oEvent.getParameters());
    };
    _proto.isTableRowNavigationPossible = function isTableRowNavigationPossible(context) {
      // prevent navigation to an empty row
      const emptyRow = context.isInactive() == true && context.isTransient() === true;
      // Or in the case of an analytical table, if we're trying to navigate to a context corresponding to a visual group or grand total
      // --> Cancel navigation
      const analyticalGroupHeaderExpanded = this.getTableDefinition().enableAnalytics === true && context.isA("sap.ui.model.odata.v4.Context") && typeof context.getProperty("@$ui5.node.isExpanded") === "boolean";
      return !(emptyRow || analyticalGroupHeaderExpanded);
    };
    _proto.onShareToCollaborationManagerPress = function onShareToCollaborationManagerPress(oEvent, controller, contexts, maxNumberofSelectedItems) {
      // We can't fully move an xmlEventHandler to a mixin...
      return this._onShareToCollaborationManagerPress(controller, contexts, maxNumberofSelectedItems);
    };
    _proto.onOpenInNewTabPress = function onOpenInNewTabPress(oEvent, controller, contexts, parameters, maxNumberofSelectedItems) {
      if (contexts.length <= maxNumberofSelectedItems) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const that = this;
        contexts.forEach(async function (context) {
          if (that.isTableRowNavigationPossible(context)) {
            parameters.editable = !context.getProperty("IsActiveEntity");
            await controller._routing.navigateForwardToContext(context, parameters);
          } else {
            return false;
          }
        });
      } else {
        MessageBox.warning(Library.getResourceBundleFor("sap.fe.macros").getText("T_TABLE_NAVIGATION_TOO_MANY_ITEMS_SELECTED", [maxNumberofSelectedItems]));
      }
    };
    _proto.onInternalPatchCompleted = function onInternalPatchCompleted() {
      // BCP: 2380023090
      // We handle enablement of Delete for the table here.
      // EditFlow.ts#handlePatchSent is handling the action enablement.
      const internalModelContext = this.getBindingContext("internal");
      const selectedContexts = this.getSelectedContexts();
      DeleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, selectedContexts);
    };
    _proto.onInternalDataReceived = function onInternalDataReceived(oEvent) {
      const isRecommendationRelevant = this.checkIfRecommendationRelevant(oEvent);
      if (isRecommendationRelevant) {
        const contextIdentifier = this.getIdentifierColumn(isRecommendationRelevant);
        const responseContextsArray = oEvent.getSource().getAllCurrentContexts();
        const newContexts = [];
        responseContextsArray.forEach(context => {
          newContexts.push({
            context,
            contextIdentifier
          });
        });
        this.getPageController().recommendations.fetchAndApplyRecommendations(newContexts, true);
      }
      if (oEvent.getParameter("error")) {
        this.getPageController().messageHandler.showMessageDialog({
          control: this
        });
      } else {
        this.getPageController().messageHandler.releaseHoldByControl(this);
        this.setDownloadUrl();
      }
    };
    _proto.onInternalDataRequested = function onInternalDataRequested(oEvent) {
      this.setProperty("dataInitialized", true);
      this.fireEvent("internalDataRequested", oEvent.getParameters());
      if (this.getQuickFilter() !== undefined && this.getTableDefinition().control.filters?.quickFilters?.showCounts === true) {
        this.getQuickFilter()?.setCountsAsLoading();
        this.getQuickFilter()?.refreshUnSelectedCounts();
      }
      this.getPageController().messageHandler.holdMessagesForControl(this);
    }

    /**
     * Handles the Paste operation.
     * @param evt The event
     * @param controller The page controller
     * @param forContextMenu
     */;
    _proto.onPaste = async function onPaste(evt, controller) {
      let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const rawPastedData = evt.getParameter("data"),
        source = evt.getSource();
      let table;
      if (!forContextMenu) {
        // table toolbar
        table = source.isA("sap.ui.mdc.Table") ? source : source.getParent();
      } else {
        // context menu
        const menu = source.isA("sap.m.Menu") ? source : source.getParent();
        table = menu.getParent()?.getParent();
      }
      const internalContext = table.getBindingContext("internal");

      // If paste is disabled or if we're not in edit mode in an ObjectPage, we can't paste anything
      if (!this.tableDefinition.control.enablePaste || table.getRowBinding().isRelative() && !CommonUtils.getIsEditable(this)) {
        return;
      }

      //This code is executed only in case of TreeTable
      const action = internalContext.getProperty("nodeUpdatesInfo/lastAction");
      const srcContexts = internalContext.getProperty("nodeUpdatesInfo/pastableContexts");
      if (this.tableDefinition.control.type === "TreeTable") {
        let srcContext = srcContexts[0];
        const newParentContext = !forContextMenu ? table.getSelectedContexts()[0] : internalContext?.getProperty("contextmenu/selectedContexts")[0];
        // If the targetContext has been disassociated from the table due to expand and collapse actions, we attempt to retrieve it using its path.
        srcContext = table.getRowBinding().getAllCurrentContexts().find(context => context.getPath() === srcContext?.getPath());
        if (!srcContext) {
          Log.error(`The ${action} operation is unsuccessful because the relevant context is no longer available`);
          return;
        }
        try {
          await Promise.all([srcContext.move({
            parent: newParentContext ?? null,
            copy: action === "Copy"
          }), action === "Copy" ? this.requestSideEffectsForCopyAction(srcContext) : this.requestSideEffectsForChangeNextSiblingAction(srcContext)]);
        } catch (error) {
          MessageToast.show(this.getTranslatedText("M_TABLEDROP_FAILED", [error.message ?? ""]));
        }
        internalContext.setProperty(`nodeUpdatesInfo/pastableContexts`, []);
        internalContext.setProperty(`nodeUpdatesInfo/pasteEnablement`, false);
        internalContext.setProperty(`contextmenu/nodeUpdatesInfo/pasteEnablement`, false);
        internalContext.setProperty(`nodeUpdatesInfo/lastAction`, undefined);
        return;
      }

      //This code is executed for tables excepted TreeTable
      if (table.getEnablePaste() === true && !forContextMenu) {
        const cellSelection = table.getCellSelector()?.getSelection();
        if (cellSelection?.columns.length > 0) {
          PasteHelper.pasteRangeData(rawPastedData ?? [], cellSelection, table);
        } else {
          PasteHelper.pasteData(rawPastedData ?? [], table, controller);
        }
      } else {
        const resourceBundle = Library.getResourceBundleFor("sap.fe.core");
        MessageBox.error(resourceBundle.getText("T_OP_CONTROLLER_SAPFE_PASTE_DISABLED_MESSAGE"), {
          title: resourceBundle.getText("C_COMMON_SAPFE_ERROR")
        });
      }
    }

    /**
     * Handles the Cut operation.
     * @param evt The UI5 event.
     * @param forContextMenu
     */;
    _proto.onCut = function onCut(evt) {
      let forContextMenu = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // We can't fully move an xmlEventHandler to a mixin...
      this._onCopyCut(evt, forContextMenu, "Cut");
    }

    /**
     * Handles the Copy operation.
     * @param evt The UI5 event.
     * @param forContextMenu
     */;
    _proto.onCopy = function onCopy(evt) {
      let forContextMenu = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      // We can't fully move an xmlEventHandler to a mixin...
      this._onCopyCut(evt, forContextMenu, "Copy");
    }

    // This event will allow us to intercept the export before is triggered to cover specific cases
    // that couldn't be addressed on the propertyInfos for each column.
    // e.g. Fixed Target Value for the datapoints
    ;
    _proto.onBeforeExport = function onBeforeExport(exportEvent) {
      // We can't fully move an xmlEventHandler to a mixin...
      this._onBeforeExport(exportEvent);
    }

    /**
     * Handles the MDC DataStateIndicator plugin to display messageStrip on a table.
     * @param message
     * @param control
     * @returns Whether to render the messageStrip visible
     */;
    _proto.dataStateIndicatorFilter = function dataStateIndicatorFilter(message, control) {
      const mdcTable = control;
      const sTableContextBindingPath = mdcTable.getBindingContext()?.getPath();
      const sTableRowBinding = (sTableContextBindingPath ? `${sTableContextBindingPath}/` : "") + mdcTable.getRowBinding().getPath();
      return sTableRowBinding === message.getTargets()[0] ? true : false;
    }

    /**
     * This event handles the DataState of the DataStateIndicator plugin from MDC on a table.
     * It's fired when new error messages are sent from the backend to update row highlighting.
     * @param evt Event object
     */;
    _proto.onDataStateChange = function onDataStateChange(evt) {
      const dataStateIndicator = evt.getSource();
      const filteredMessages = evt.getParameter("filteredMessages");
      if (filteredMessages) {
        const hiddenMandatoryProperties = filteredMessages.map(msg => {
          const technicalDetails = msg.getTechnicalDetails() || {};
          return technicalDetails.emptyRowMessage === true && technicalDetails.missingColumn;
        }).filter(hiddenProperty => !!hiddenProperty);
        if (hiddenMandatoryProperties.length) {
          const messageStripError = Library.getResourceBundleFor("sap.fe.macros").getText(hiddenMandatoryProperties.length === 1 ? "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN" : "M_MESSAGESTRIP_EMPTYROW_MANDATORY_HIDDEN_PLURAL", [hiddenMandatoryProperties.join(", ")]);
          dataStateIndicator.showMessage(messageStripError, "Error");
        }
        const internalModel = dataStateIndicator.getModel("internal");
        internalModel.setProperty("filteredMessages", filteredMessages, dataStateIndicator.getBindingContext("internal"));
      }
    };
    _proto.resumeBinding = function resumeBinding(bRequestIfNotInitialized) {
      this.setProperty("bindingSuspended", false);
      if (bRequestIfNotInitialized && !this.getDataInitialized() || this.getProperty("outDatedBinding")) {
        this.setProperty("outDatedBinding", false);
        this.getContent()?.rebind();
      }
    };
    _proto.refreshNotApplicableFields = function refreshNotApplicableFields(oFilterControl) {
      const oTable = this.getContent();
      return FilterUtils.getNotApplicableFilters(oFilterControl, oTable);
    };
    _proto.suspendBinding = function suspendBinding() {
      this.setProperty("bindingSuspended", true);
    };
    _proto.invalidateContent = function invalidateContent() {
      this.setProperty("dataInitialized", false);
      this.setProperty("outDatedBinding", false);
    }

    /**
     * Sets the enablement of the creation row.
     * @private
     */;
    _proto.setFastCreationRowEnablement = function setFastCreationRowEnablement() {
      const table = this.content;
      const fastCreationRow = table.getCreationRow();
      if (fastCreationRow && !fastCreationRow.getBindingContext()) {
        const tableBinding = table.getRowBinding();
        const bindingContext = tableBinding.getContext();
        if (bindingContext) {
          TableHelper.enableFastCreationRow(fastCreationRow, tableBinding.getPath(), bindingContext, bindingContext.getModel(), Promise.resolve());
        }
      }
    }

    /**
     * Event handler to create insightsParams and call the API to show insights card preview for table.
     * @returns Undefined if the card preview is rendered.
     */;
    _proto.onAddCardToInsightsPressed = async function onAddCardToInsightsPressed() {
      // We can't fully move an xmlEventHandler to a mixin...
      return this._onAddCardToInsightsPressed();
    };
    _proto.onMassEditButtonPressed = function onMassEditButtonPressed(ui5Event, forContextMenu) {
      const massEditHelper = new MassEditDialogHelper({
        table: this.content,
        onContextMenu: forContextMenu,
        onClose: () => {
          this.setMassEditDialogHelper();
        }
      });
      this.setMassEditDialogHelper(massEditHelper);
      massEditHelper.open();
    };
    _proto.onSelectionChanged = async function onSelectionChanged(ui5event) {
      await TableRuntime.setContexts(ui5event);
      this.fireEvent("selectionChange", {
        ...ui5event.getParameters(),
        selectedContext: this.getSelectedContexts()
      });
    };
    _proto.onActionPress = async function onActionPress(oEvent, pageController, actionName, parameters) {
      parameters.model = oEvent.getSource().getModel();
      let executeAction = true;
      if (parameters.notApplicableContexts && parameters.notApplicableContexts.length > 0) {
        // If we have non applicable contexts, we need to open a dialog to ask the user if he wants to continue
        const convertedMetadata = convertTypes(parameters.model.getMetaModel());
        const entityType = convertedMetadata.resolvePath(this.entityTypeFullyQualifiedName).target;
        const myUnapplicableContextDialog = new NotApplicableContextDialog({
          entityType: entityType,
          notApplicableContexts: parameters.notApplicableContexts,
          title: parameters.label,
          resourceModel: getResourceModel(this),
          entitySet: parameters.entitySetName,
          actionName: actionName
        });
        parameters.contexts = parameters.applicableContexts;
        executeAction = await myUnapplicableContextDialog.open(this);
      }
      if (executeAction) {
        // Direct execution of the action
        try {
          return await pageController.editFlow.invokeAction(actionName, {
            ...parameters,
            ...{
              feFrameworkCall: true
            }
          });
        } catch (e) {
          Log.info(e);
        }
      }
    };
    _proto.onContextMenuPress = function onContextMenuPress(oEvent) {
      // We can't fully move an xmlEventHandler to a mixin...
      this._onContextMenuPress(oEvent);
    }

    /**
     * Expose the internal table definition for external usage in the delegate.
     * @returns The tableDefinition
     */;
    _proto.getTableDefinition = function getTableDefinition() {
      return this.tableDefinition;
    }

    /**
     * Sets the mass edit related to the table.
     * @param massEditDialogHelper
     */;
    _proto.setMassEditDialogHelper = function setMassEditDialogHelper(massEditDialogHelper) {
      this.massEditDialogHelper = massEditDialogHelper;
    }

    /**
     * Expose the mass edit related to the table.
     * @returns The mass edit related to the table, if any
     */;
    _proto.getMassEditDialogHelper = function getMassEditDialogHelper() {
      return this.massEditDialogHelper;
    }

    /**
     * connect the filter to the tableAPI if required
     * @private
     * @alias sap.fe.macros.TableAPI
     */;
    _proto.updateFilterBar = function updateFilterBar() {
      const table = this.getContent();
      const filterBarRefId = this.getFilterBar();
      if (table && filterBarRefId && table.getFilter?.() !== filterBarRefId) {
        this._setFilterBar(filterBarRefId);
      }
    }

    /**
     * Removes the table from the listeners of the filterBar.
     */;
    _proto.detachFilterBar = function detachFilterBar() {
      const table = this.content;
      table?.setFilter("");
    }

    /**
     * Gets the filter control.
     * @param filterBarRefId Id of the filter bar
     * @returns The filter control
     * @private
     * @alias sap.fe.macros.TableAPI
     */;
    _proto.getFilterBarControl = function getFilterBarControl(filterBarRefId) {
      // 'filterBar' property of macros:Table(passed as customData) might be
      // 1. A localId wrt View(FPM explorer example).
      // 2. Absolute Id(this was not supported in older versions).
      // 3. A localId wrt FragmentId(when an XMLComposite or Fragment is independently processed) instead of ViewId.
      //    'filterBar' was supported earlier as an 'association' to the 'mdc:Table' control inside 'macros:Table' in prior versions.
      //    In newer versions 'filterBar' is used like an association to 'macros:TableAPI'.
      //    This means that the Id is relative to 'macros:TableAPI'.
      //    This scenario happens in case of FilterBar and Table in a custom sections in OP of FEV4.

      const tableAPIId = this?.getId();
      const tableAPILocalId = this.data("tableAPILocalId");
      const potentialfilterBarId = tableAPILocalId && filterBarRefId && tableAPIId && tableAPIId.replace(new RegExp(tableAPILocalId + "$"), filterBarRefId); // 3
      return this.getPageController()?.byId(filterBarRefId) || UI5Element.getElementById(filterBarRefId) || UI5Element.getElementById(potentialfilterBarId);
    }

    /**
     * Sets the filter depending on the type of filterBar.
     * @param filterBarRefId Id of the filter bar
     * @private
     * @alias sap.fe.macros.TableAPI
     */;
    _proto._setFilterBar = function _setFilterBar(filterBarRefId) {
      const table = this.getContent();
      const filterBar = this.getFilterBarControl(filterBarRefId);
      if (filterBar) {
        if (filterBar.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
          table.setFilter(`${filterBar.getId()}-content`);
        } else if (filterBar.isA("sap.fe.macros.filterBar.FilterBar") && filterBar?.content?.isA("sap.fe.macros.filterBar.FilterBarAPI")) {
          table.setFilter(`${filterBar.content.getId()}-content`);
        } else if (filterBar.isA("sap.ui.mdc.FilterBar") || filterBar.isA("sap.fe.macros.table.BasicSearch")) {
          table.setFilter(filterBar.getId());
        }
      }
    }

    /**
     * Handles the CreateActivate event from the ODataListBinding.
     * @param activateEvent The event sent by the binding
     */;
    _proto.handleCreateActivate = async function handleCreateActivate(activateEvent) {
      // We can't fully move an xmlEventHandler to a mixin...
      await this._handleCreateActivate(activateEvent);
    }

    /**
     * The dragged element enters a table row.
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     */;
    _proto.onDragEnterDocument = function onDragEnterDocument(ui5Event) {
      // We can't fully move an xmlEventHandler to a mixin...
      this._onDragEnterDocument(ui5Event);
    }

    /**
     * Starts the drag of the document.
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     */;
    _proto.onDragStartDocument = function onDragStartDocument(ui5Event) {
      // We can't fully move an xmlEventHandler to a mixin...
      this._onDragStartDocument(ui5Event);
    }

    /**
     * Drops the document.
     * @param ui5Event UI5 event coming from the MDC drag and drop config
     * @returns The Promise
     */;
    _proto.onDropDocument = async function onDropDocument(ui5Event) {
      // We can't fully move an xmlEventHandler to a mixin...
      await this._onDropDocument(ui5Event);
    };
    _proto.onCollapseExpandNode = async function onCollapseExpandNode(ui5Event, expand) {
      // We can't fully move an xmlEventHandler to a mixin...
      await this._onCollapseExpandNode(ui5Event, expand);
    }

    /**
     * Internal method to move a row up or down in a Tree table.
     * @param ui5Event
     * @param moveUp True for move up, false for move down
     * @param forContextMenu
     */;
    _proto.onMoveUpDown = async function onMoveUpDown(ui5Event, moveUp) {
      let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      // We can't fully move an xmlEventHandler to a mixin...
      await this._onMoveUpDown(ui5Event, moveUp, forContextMenu);
    }

    /**
     * Get the selection variant from the table. This function considers only the selection variant applied at the control level.
     * @returns A promise which resolves with {@link sap.fe.navigation.SelectionVariant}
     * @public
     */;
    _proto.getSelectionVariant = async function getSelectionVariant() {
      return StateHelper.getSelectionVariant(this.getContent());
    }

    /**
     * Sets {@link sap.fe.navigation.SelectionVariant} to the table. Note: setSelectionVariant will clear existing filters and then apply the SelectionVariant values.
     * @param selectionVariant The {@link sap.fe.navigation.SelectionVariant} to apply to the table
     * @param prefillDescriptions Optional. If true, we will use the associated text property values (if they're available in the SelectionVariant) to display the filter value descriptions, instead of loading them from the backend
     * @returns A promise for asynchronous handling
     * @public
     */;
    _proto.setSelectionVariant = async function setSelectionVariant(selectionVariant) {
      let prefillDescriptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      return StateHelper.setSelectionVariantToMdcControl(this.getContent(), selectionVariant, prefillDescriptions);
    };
    _proto._createContentV2Mode = async function _createContentV2Mode() {
      const owner = this._getOwner();
      const preprocessorContext = owner?.preprocessorContext;
      if (owner && preprocessorContext) {
        const metaModel = owner.getAppComponent().getMetaModel();
        const metaPath = metaModel.createBindingContext(this.metaPath);
        const contextPath = metaModel.createBindingContext(this.contextPath);
        this.tableDefinition = deepClone(this.originalTableDefinition);
        this.updateColumnsVisibility(this.ignoredFields, this.tableDefinition);
        const convertedMetadata = convertTypes(metaModel);
        const collectionEntity = convertedMetadata.resolvePath(this.tableDefinition.annotation.collection).target;
        this.contextObjectPath = getInvolvedDataModelObjects(metaPath, contextPath);
        const handlerProvider = new TableEventHandlerProvider(this, {
          collectionEntity,
          metaModel
        });
        const fragment = await XMLPreprocessor.process(parseXMLString(xml`<root
			xmlns="sap.m"
			xmlns:mdc="sap.ui.mdc"
			xmlns:plugins="sap.m.plugins"
			xmlns:mdcTable="sap.ui.mdc.table"
			xmlns:macroTable="sap.fe.macros.table"
			xmlns:mdcat="sap.ui.mdc.actiontoolbar"
			xmlns:core="sap.ui.core"
			xmlns:control="sap.fe.core.controls"
			xmlns:dt="sap.ui.dt"
			xmlns:fl="sap.ui.fl"
			xmlns:variant="sap.ui.fl.variants"
			xmlns:p13n="sap.ui.mdc.p13n"
			xmlns:internalMacro="sap.fe.macros.internal">${jsx.renderAsXML(() => {
          return MdcTableTemplate.getMDCTableTemplate(this, {
            convertedMetadata: preprocessorContext.getConvertedMetadata(),
            metaModel,
            handlerProvider,
            appComponent: owner.getAppComponent(),
            metaPath
          });
        })}</root>`, true)[0], {
          models: {}
        }, preprocessorContext);
        if (fragment.firstElementChild) {
          // Remove the old MDC table from the list of FilterBar listeners
          this.detachFilterBar();
          this.content?.destroy();
          const content = await Fragment.load({
            definition: fragment.firstElementChild,
            controller: owner.getRootController(),
            containingView: owner.getRootControl()
          });
          this.content = content;
          this.updateFilterBar();
        }
      }
    };
    _proto.setProperty = function setProperty(propertyKey, propertyValue, bSuppressInvalidate) {
      if (!this._applyingSettings && propertyValue !== undefined && ["ignoredFields", "metaPath"].includes(propertyKey)) {
        _MacroAPI.prototype.setProperty.call(this, propertyKey, propertyValue, true);
        this._createContentV2Mode();
      } else {
        _MacroAPI.prototype.setProperty.call(this, propertyKey, propertyValue, bSuppressInvalidate);
      }
      return this;
    }

    /**
     * Retrieves the data model and converted target object based on the provided property name.
     * @param propertyName The name of the property.
     * @returns Returns data model path and converted target object.
     */;
    _proto.getDataModelAndConvertedTargetObject = function getDataModelAndConvertedTargetObject(propertyName) {
      const table = this.getContent();
      const metaModel = table.getModel()?.getMetaModel();
      if (!metaModel) {
        return;
      }
      const entityPath = table.data("metaPath");
      const targetMetaPath = this.getEnhancedFetchedPropertyInfos().find(propertyInfo => propertyInfo.name === propertyName)?.annotationPath;
      const targetObject = metaModel.getContext(targetMetaPath);
      const entitySet = metaModel.getContext(entityPath);
      const convertedtargetObject = MetaModelConverter.convertMetaModelContext(targetObject);
      let dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(targetObject, entitySet);
      dataModelPath = FieldTemplating.getDataModelObjectPathForValue(dataModelPath) || dataModelPath;
      return {
        dataModelPath: dataModelPath,
        convertedtargetObject: convertedtargetObject
      };
    }

    /**
     * Get the binding context for the given ModeAsExpression.
     * @param ModeAsExpression
     * @param rowContext
     * @returns
     */;
    _proto.createAnyControl = function createAnyControl(ModeAsExpression, rowContext) {
      const table = this.getContent();
      const anyObject = new Any({
        any: ModeAsExpression
      });
      anyObject.setModel(rowContext?.getModel());
      anyObject.setModel(table.getModel("ui"), "ui");
      return anyObject;
    }

    /**
     * Get the edit mode of a Property.
     * @param propertyName The name of the property
     * @param rowContext The context of the row containing the property
     * @returns The edit mode of the field
     */;
    _proto.getPropertyEditMode = function getPropertyEditMode(propertyName, rowContext) {
      let anyObject;
      if (!this.propertyEditModeCache[propertyName]) {
        const dataModelPath = this.getDataModelAndConvertedTargetObject(propertyName)?.dataModelPath;
        const convertedtargetObject = this.getDataModelAndConvertedTargetObject(propertyName)?.convertedtargetObject;
        if (dataModelPath && convertedtargetObject) {
          const propertyForFieldControl = dataModelPath?.targetObject?.Value ? (dataModelPath?.targetObject).Value : dataModelPath?.targetObject;
          const editModeAsExpression = compileExpression(UIFormatters.getEditMode(propertyForFieldControl, dataModelPath, false, true, convertedtargetObject));
          anyObject = this.createAnyControl(editModeAsExpression, rowContext);
          this.propertyEditModeCache[propertyName] = anyObject;
          anyObject.setBindingContext(null); // we need to set the binding context to null otherwise the following addDependent will set it to the context of the table
          this.addDependent(anyObject); // to destroy it when the tableAPI is destroyed
        }
      } else {
        anyObject = this.propertyEditModeCache[propertyName];
      }
      anyObject?.setBindingContext(rowContext);
      const editMode = anyObject?.getAny();
      anyObject?.setBindingContext(null);
      return editMode;
    }

    /**
     * Show the columns with the given column keys by setting their availability to Default.
     * @param columnKeys The keys for the columns to show
     * @returns Promise<void>
     * @public
     * @experimental As of version 1.124.0
     * @since 1.124.0
     */;
    _proto.showColumns = async function showColumns(columnKeys) {
      for (const columnKey of columnKeys) {
        this.modifyDynamicVisibilityForColumn(columnKey, true);
      }
      return this._createContentV2Mode();
    }

    /**
     * Hide the columns with the given column keys by setting their availability to Default.
     * @param columnKeys The keys for the columns to hide
     * @returns Promise<void>
     * @public
     * @experimental As of version 1.124.0
     * @since 1.124.0
     */;
    _proto.hideColumns = async function hideColumns(columnKeys) {
      for (const columnKey of columnKeys) {
        this.modifyDynamicVisibilityForColumn(columnKey, false);
      }
      return this._createContentV2Mode();
    }

    /**
     * Sets the fields that should be ignored when generating the table.
     * @param ignoredFields The fields to ignore
     * @returns Reference to this in order to allow method chaining
     * @experimental
     * @since 1.124.0
     * @public
     */;
    _proto.setIgnoredFields = function setIgnoredFields(ignoredFields) {
      return this.setProperty("ignoredFields", ignoredFields);
    }

    /**
     * Get the fields that should be ignored when generating the table.
     * @returns The value of the ignoredFields property
     * @experimental
     * @since 1.124.0
     * @public
     */;
    _proto.getIgnoredFields = function getIgnoredFields() {
      return this.getProperty("ignoredFields") ?? this.tableDefinition.control.ignoredFields;
    }

    /**
     * Retrieves the control state based on the given control state key.
     * @param controlState The current state of the control.
     * @returns - The full state of the control along with the initial state if available.
     */;
    _proto.getControlState = function getControlState(controlState) {
      const initialControlState = this.initialControlState;
      if (controlState) {
        return {
          fullState: controlState,
          initialState: initialControlState
        };
      }
      return controlState;
    }

    /**
     * Returns the key to be used for given control.
     * @param oControl The control to get state key for
     * @returns The key to be used for storing the controls state
     */;
    _proto.getStateKey = function getStateKey(oControl) {
      return CommonUtils.getTargetView(this.content)?.getLocalId(oControl.getId()) || oControl.getId();
    }

    /**
     * Updates the table definition with ignoredFields and dynamicVisibilityForColumns.
     * @param ignoredFields
     * @param dynamicVisibilityForColumns
     * @param tableDefinition
     */;
    TableAPI.updateColumnsVisibility = function updateColumnsVisibility(ignoredFields, dynamicVisibilityForColumns, tableDefinition) {
      ColumnManagement.updateColumnsVisibilityStatic(ignoredFields, dynamicVisibilityForColumns, tableDefinition);
    }

    /**
     * Returns the MDC table.
     * This method is called by the forwarding aggregation to get the target of the aggregation.
     * @private
     * @returns The mdc table
     */;
    _proto.getMDCTable = function getMDCTable() {
      return this.content;
    }

    /**
     * Called by the MDC state util when the state for this control's child has changed.
     */;
    _proto.handleStateChange = function handleStateChange() {
      this.getPageController()?.getExtensionAPI().updateAppState();
    }

    /**
     * Calls the asyncCall function only if the lockName is not already locked.
     * @param asyncCall
     * @param lockName
     * @returns Promise<void>
     */;
    _proto.avoidParallelCalls = async function avoidParallelCalls(asyncCall, lockName) {
      if (this.lock[lockName]) {
        return;
      }
      this.lock[lockName] = true;
      try {
        await asyncCall();
      } catch {
        this.lock[lockName] = false;
      }
      this.lock[lockName] = false;
    };
    _proto.destroy = function destroy(suppressInvalidate) {
      // We release hold on messageHandler by the control if there is one.
      this.getPageController(false)?.messageHandler?.releaseHoldByControl(this);
      _MacroAPI.prototype.destroy.call(this, suppressInvalidate);
    };
    // The dialog used to display the table in full screen mode
    _proto.setFullScreenDialog = function setFullScreenDialog(dialog) {
      this.fullScreenDialog = dialog;
    };
    /**
     * Sets the fetched propertyInfos from the table delegate containing internal properties.
     * @param enhancedPropertyInfos
     * @private
     */
    _proto.setEnhancedFetchedPropertyInfos = function setEnhancedFetchedPropertyInfos(enhancedPropertyInfos) {
      this.enhancedPropertyInfos = enhancedPropertyInfos;
    }

    /**
     * Gets the fetched propertyInfos from the table delegate containing internal properties.
     * @returns The PropertyInfo enhanced with the PropertyInfos from the table delegate
     * @private
     */;
    _proto.getEnhancedFetchedPropertyInfos = function getEnhancedFetchedPropertyInfos() {
      return this.enhancedPropertyInfos;
    }

    /**
     * Gets the MDC expected propertyInfos from the table delegate containing internal additional properties.
     * @returns The PropertyInfo
     * @private
     */;
    _proto.getPropertyInfos = function getPropertyInfos() {
      const propertyInfos = [];
      for (const enhancedPropertyInfo of this.enhancedPropertyInfos) {
        let propertyInfo = {
          key: enhancedPropertyInfo.key,
          label: enhancedPropertyInfo.label,
          visible: enhancedPropertyInfo.visible,
          exportSettings: enhancedPropertyInfo.exportSettings,
          clipboardSettings: enhancedPropertyInfo.clipboardSettings,
          visualSettings: enhancedPropertyInfo.visualSettings,
          tooltip: enhancedPropertyInfo.tooltip,
          isKey: enhancedPropertyInfo.isKey
        };
        if (enhancedPropertyInfo.propertyInfos) {
          propertyInfo = {
            ...propertyInfo,
            propertyInfos: enhancedPropertyInfo.propertyInfos
          };
        } else {
          let extension;
          if (enhancedPropertyInfo.extension) {
            extension = {
              technicallyGroupable: enhancedPropertyInfo.extension.technicallyGroupable,
              technicallyAggregatable: enhancedPropertyInfo.extension.technicallyAggregatable,
              customAggregate: enhancedPropertyInfo.extension.customAggregate
            };
            extension = Object.fromEntries(Object.entries(extension).filter(_ref => {
              let [_, value] = _ref;
              return value !== undefined;
            }));
          }
          propertyInfo = {
            ...propertyInfo,
            path: enhancedPropertyInfo.path,
            maxConditions: enhancedPropertyInfo.maxConditions,
            formatOptions: enhancedPropertyInfo.formatOptions,
            constraints: enhancedPropertyInfo.constraints,
            group: enhancedPropertyInfo.group,
            groupLabel: enhancedPropertyInfo.groupLabel,
            caseSensitive: enhancedPropertyInfo.caseSensitive,
            filterable: enhancedPropertyInfo.filterable,
            sortable: enhancedPropertyInfo.sortable,
            groupable: enhancedPropertyInfo.groupable,
            dataType: enhancedPropertyInfo.dataType,
            aggregatable: enhancedPropertyInfo.aggregatable,
            unit: enhancedPropertyInfo.unit,
            text: enhancedPropertyInfo.text,
            extension
          };
        }
        propertyInfos.push(Object.fromEntries(Object.entries(propertyInfo).filter(_ref2 => {
          let [_, value] = _ref2;
          return value !== undefined;
        })));
      }
      return propertyInfos;
    };
    _proto.setCachedPropertyInfos = function setCachedPropertyInfos(propertyInfos) {
      this.propertyInfos = propertyInfos;
    };
    _proto.getCachedPropertyInfos = function getCachedPropertyInfos() {
      return this.propertyInfos;
    }

    /**
     * Gets the path for the table collection.
     * @returns The path
     */;
    _proto.getRowCollectionPath = function getRowCollectionPath() {
      const controller = this.getPageController();
      const metaModel = controller.getModel().getMetaModel();
      const collectionContext = metaModel.createBindingContext(this.tableDefinition.annotation.collection);
      const contextPath = metaModel.createBindingContext(this.contextPath);
      const dataModelPath = getInvolvedDataModelObjects(collectionContext, contextPath);
      return getContextRelativeTargetObjectPath(dataModelPath) || getTargetObjectPath(dataModelPath);
    }

    /**
     * Gets the binding info used when creating the list binding for the MDC table.
     * @returns The table binding info
     */;
    _proto.getTableTemplateBindingInfo = function getTableTemplateBindingInfo() {
      const controller = this.getPageController();
      const path = this.getRowCollectionPath();
      const rowBindingInfo = {
        suspended: false,
        path,
        parameters: {
          $count: true
        }
      };
      if (this.tableDefinition.enable$select) {
        // Don't add $select parameter in case of an analytical query, this isn't supported by the model
        const select = Object.keys(this.tableDefinition.requestAtLeast).join(",");
        if (select) {
          rowBindingInfo.parameters.$select = select;
        }
      }
      if (this.tableDefinition.enable$$getKeepAliveContext) {
        // we later ensure in the delegate only one list binding for a given targetCollectionPath has the flag $$getKeepAliveContext
        rowBindingInfo.parameters.$$getKeepAliveContext = true;
      }

      // Clears the selection after a search/filter
      rowBindingInfo.parameters.$$clearSelectionOnFilter = true;
      rowBindingInfo.parameters.$$groupId = "$auto.Workers";
      rowBindingInfo.parameters.$$updateGroupId = "$auto";
      rowBindingInfo.parameters.$$ownRequest = true;
      rowBindingInfo.parameters.$$patchWithoutSideEffects = true;

      // Event handlers
      const editFlowExtension = controller.editFlow;
      const eventHandlers = {};
      eventHandlers.patchCompleted = this.onInternalPatchCompleted.bind(this);
      eventHandlers.dataReceived = this.onInternalDataReceived.bind(this);
      eventHandlers.dataRequested = this.onInternalDataRequested.bind(this);
      eventHandlers.change = this.onListBindingChange.bind(this);
      eventHandlers.createActivate = this.handleCreateActivate.bind(this);
      eventHandlers.createSent = editFlowExtension.handleCreateSent.bind(editFlowExtension);
      if (this.tableDefinition.handlePatchSent) {
        eventHandlers.patchSent = editFlowExtension.handlePatchSent.bind(editFlowExtension);
      } else if (controller.inlineEditFlow.isInlineEditPossible()) {
        eventHandlers.patchSent = controller.inlineEditFlow.handleInlineEditPatchSent.bind(controller.inlineEditFlow);
      }
      rowBindingInfo.events = eventHandlers;
      return rowBindingInfo;
    };
    TableAPI.addSetting = function addSetting(target, key, value) {
      if (value !== undefined) {
        target[key] = value;
      }
    }

    /**
     * Create manifest-friendly settings from tableAPI properties.
     * @returns Settings
     */;
    _proto.getSettingsForManifest = function getSettingsForManifest() {
      const tableSettings = {};
      TableAPI.addSetting(tableSettings, "enableExport", this.enableExport);
      TableAPI.addSetting(tableSettings, "exportRequestSize", this.exportRequestSize);
      TableAPI.addSetting(tableSettings, "frozenColumnCount", this.frozenColumnCount);
      TableAPI.addSetting(tableSettings, "widthIncludingColumnHeader", this.widthIncludingColumnHeader);
      TableAPI.addSetting(tableSettings, "rowCountMode", this.rowCountMode);
      TableAPI.addSetting(tableSettings, "rowCount", this.rowCount);
      TableAPI.addSetting(tableSettings, "enableFullScreen", this.enableFullScreen);
      TableAPI.addSetting(tableSettings, "enablePaste", this.enablePaste);
      TableAPI.addSetting(tableSettings, "disableCopyToClipboard", this.disableCopyToClipboard);
      TableAPI.addSetting(tableSettings, "scrollThreshold", this.scrollThreshold);
      TableAPI.addSetting(tableSettings, "selectionMode", this.selectionMode);
      TableAPI.addSetting(tableSettings, "type", this.type);
      TableAPI.addSetting(tableSettings, "enablePastingOfComputedProperties", this.enablePastingOfComputedProperties);
      TableAPI.addSetting(tableSettings, "selectAll", this.enableSelectAll);
      TableAPI.addSetting(tableSettings, "ignoredFields", this.ignoredFields);
      TableAPI.addSetting(tableSettings, "selectionLimit", this.selectionLimit);
      TableAPI.addSetting(tableSettings, "condensedTableLayout", this.condensedTableLayout);
      if (this.creationMode) {
        const creationMode = {};
        TableAPI.addSetting(creationMode, "name", this.creationMode.name);
        TableAPI.addSetting(creationMode, "creationFields", this.creationMode.creationFields);
        TableAPI.addSetting(creationMode, "createAtEnd", this.creationMode.createAtEnd);
        TableAPI.addSetting(creationMode, "inlineCreationRowsHiddenInEditMode", this.creationMode.inlineCreationRowsHiddenInEditMode);
        TableAPI.addSetting(creationMode, "outbound", this.creationMode.outbound);
        if (Object.entries(creationMode).length > 0) {
          tableSettings["creationMode"] = creationMode;
        }
      }
      if (this.massEdit) {
        const enableMassEdit = {};
        TableAPI.addSetting(enableMassEdit, "customFragment", this.massEdit.customContent);
        TableAPI.addSetting(enableMassEdit, "fromInline", true);
        TableAPI.addSetting(enableMassEdit, "visibleFields", this.massEdit.visibleFields?.join(","));
        TableAPI.addSetting(enableMassEdit, "ignoredFields", this.massEdit.ignoredFields?.join(","));
        TableAPI.addSetting(enableMassEdit, "operationGroupingMode", this.massEdit.operationGroupingMode);
        tableSettings["enableMassEdit"] = enableMassEdit;
      }
      if (this.analyticalConfiguration?.aggregationOnLeafLevel === true) {
        const analyticalConfiguration = {};
        TableAPI.addSetting(analyticalConfiguration, "aggregationOnLeafLevel", this.analyticalConfiguration.aggregationOnLeafLevel);
        if (Object.entries(analyticalConfiguration).length > 0) {
          tableSettings["analyticalConfiguration"] = analyticalConfiguration;
        }
      }
      if (this.quickVariantSelection?.paths?.length) {
        TableAPI.addSetting(tableSettings, "quickVariantSelection", {
          paths: this.quickVariantSelection.paths.map(path => {
            return {
              annotationPath: path
            };
          }),
          showCounts: this.quickVariantSelection.showCounts
        });
      }
      return tableSettings;
    }

    /**
     * Find an action from its key.
     * @param key
     * @returns The action if it can be found (or undefined)
     */;
    _proto.findSlotActionFromKey = function findSlotActionFromKey(key) {
      let result;
      for (const action of this.actions ?? []) {
        if (action.isA("sap.fe.macros.table.ActionGroup") || action.isA("sap.fe.macros.table.ActionGroupOverride")) {
          result ??= action.actions.find(a => {
            return a.isA("sap.fe.macros.table.Action") && a.key === key;
          });
        } else if (action.isA("sap.fe.macros.table.Action") && action.key === key) {
          result = action;
          break;
        }
      }
      return result;
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.createContent();
    };
    _proto.getFullMetaPath = function getFullMetaPath() {
      if (this.metaPath.startsWith("/")) {
        return this.metaPath;
      } else if (this.contextPath.endsWith("/")) {
        return `${this.contextPath}${this.metaPath}`;
      } else {
        return `${this.contextPath}/${this.metaPath}`;
      }
    };
    _proto.createContent = function createContent() {
      let forceCreation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      const owner = this._getOwner();
      if (!owner) {
        return;
      }
      this.contextPath ??= this.getOwnerContextPath();
      const fullMetaPath = this.getFullMetaPath();
      if (!this.content || forceCreation) {
        this.detachFilterBar();
        this.content?.destroy();
        const metaModel = owner.getAppComponent().getMetaModel();
        const metaPathContext = metaModel.createBindingContext(fullMetaPath);
        this.tableDefinition = createTableDefinition(this);
        this.updatePropertiesFromTableDefinition();
        this.updateColumnsVisibility(this.tableDefinition.control.ignoredFields, this.tableDefinition);
        const collectionEntity = this.contextObjectPath.convertedTypes.resolvePath(this.tableDefinition.annotation.collection).target;
        const entityType = collectionEntity?.entityType ?? collectionEntity?.targetType;
        this.entityTypeFullyQualifiedName = entityType?.fullyQualifiedName;
        const handlerProvider = new TableEventHandlerProvider(this, {
          metaModel,
          collectionEntity
        }, this);
        this.content = this.createMDCTable({
          appComponent: owner.getAppComponent(),
          metaPath: metaPathContext,
          convertedMetadata: MetaModelConverter.convertTypes(metaModel),
          handlerProvider,
          metaModel
        });
      }
      this.updateFilterBar();
      this.setupOptimisticBatch();
      this.setUpNoDataInformation();
      this.getQuickFilter()?.setMetaPath(fullMetaPath);
    };
    _proto.createMDCTable = function createMDCTable(parameters) {
      return MdcTableTemplate.getMDCTableTemplate(this, parameters);
    };
    _proto.updatePropertiesFromTableDefinition = function updatePropertiesFromTableDefinition() {
      // ID for the internal MDC table
      if (ManagedObjectMetadata.isGeneratedId(this.getId())) {
        this.contentId ??= this.tableDefinition.annotation.id;
      } else {
        this.contentId ??= `${this.getId()}-content`;
      }

      // Basic search field if no filter bar is provided
      if (this.useBasicSearch === undefined) {
        // If no filterbar is provided, use the basic search field
        if (!this.filterBar) {
          this.filterBar = generate([this.contentId, "StandardAction", "BasicSearch"]);
          this.useBasicSearch = true;
        } else {
          this.useBasicSearch = false;
        }
      }

      // Read-only mode
      if (this.readOnly === undefined && (this.tableDefinition.annotation.displayMode === true || this.tableDefinition.control.readOnly === true)) {
        this.readOnly = true;
      }

      // Enable empty rows
      if (this.emptyRowsEnabled === undefined) {
        const enabled = this.creationMode?.name === CreationMode.InlineCreationRows ? this.tableDefinition.actions.find(a => a.key === StandardActionKeys.Create)?.enabled : undefined;
        if (enabled !== undefined && enabled !== "false") {
          this.setProperty("emptyRowsEnabled", enabled);
        }
      }
    };
    _proto.getNoDataMessageMode = function getNoDataMessageMode() {
      const mode = this.modeForNoDataMessage ?? this.tableDefinition.control.modeForNoDataMessage ?? "illustratedMessage-Auto";
      return mode === "text" ? "text" : mode.split("-")[1];
    };
    return TableAPI;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_IRowBindingInterface", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "tableDefinition", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contentId", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "entityTypeFullyQualifiedName", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "enableFullScreen", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "enableExport", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "frozenColumnCount", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "rowCountMode", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "rowCount", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "enablePaste", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "disableCopyToClipboard", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "scrollThreshold", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "isSearchable", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "type", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "useCondensedLayout", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "selectionMode", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "condensedTableLayout", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "actions", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "columns", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec33], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "enableAutoColumnWidth", [_dec34], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "widthIncludingColumnHeader", [_dec35], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "modeForNoDataMessage", [_dec36], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "dataInitialized", [_dec37], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "bindingSuspended", [_dec38], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "outDatedBinding", [_dec39], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "isAlp", [_dec40], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor32 = _applyDecoratedDescriptor(_class2.prototype, "variantManagement", [_dec41], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor33 = _applyDecoratedDescriptor(_class2.prototype, "ignoredFields", [_dec42], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor34 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec43], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor35 = _applyDecoratedDescriptor(_class2.prototype, "fieldMode", [_dec44], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor36 = _applyDecoratedDescriptor(_class2.prototype, "headerLevel", [_dec45], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor37 = _applyDecoratedDescriptor(_class2.prototype, "headerStyle", [_dec46], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor38 = _applyDecoratedDescriptor(_class2.prototype, "exportRequestSize", [_dec47], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor39 = _applyDecoratedDescriptor(_class2.prototype, "initialLoad", [_dec48], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor40 = _applyDecoratedDescriptor(_class2.prototype, "personalization", [_dec49], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor41 = _applyDecoratedDescriptor(_class2.prototype, "header", [_dec50], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor42 = _applyDecoratedDescriptor(_class2.prototype, "useBasicSearch", [_dec51], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor43 = _applyDecoratedDescriptor(_class2.prototype, "emptyRowsEnabled", [_dec52], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor44 = _applyDecoratedDescriptor(_class2.prototype, "headerVisible", [_dec53], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor45 = _applyDecoratedDescriptor(_class2.prototype, "tabTitle", [_dec54], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor46 = _applyDecoratedDescriptor(_class2.prototype, "associatedSelectionVariantPath", [_dec55], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor47 = _applyDecoratedDescriptor(_class2.prototype, "inMultiView", [_dec56], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor48 = _applyDecoratedDescriptor(_class2.prototype, "displaySegmentedButton", [_dec57], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor49 = _applyDecoratedDescriptor(_class2.prototype, "enablePastingOfComputedProperties", [_dec58], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor50 = _applyDecoratedDescriptor(_class2.prototype, "enableSelectAll", [_dec59], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor51 = _applyDecoratedDescriptor(_class2.prototype, "selectionLimit", [_dec60], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor52 = _applyDecoratedDescriptor(_class2.prototype, "creationMode", [_dec61], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor53 = _applyDecoratedDescriptor(_class2.prototype, "noData", [_dec62], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor54 = _applyDecoratedDescriptor(_class2.prototype, "analyticalConfiguration", [_dec63], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor55 = _applyDecoratedDescriptor(_class2.prototype, "quickVariantSelection", [_dec64], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor56 = _applyDecoratedDescriptor(_class2.prototype, "massEdit", [_dec65], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor57 = _applyDecoratedDescriptor(_class2.prototype, "beforeRebindTable", [_dec66], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor58 = _applyDecoratedDescriptor(_class2.prototype, "rowPress", [_dec67], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor59 = _applyDecoratedDescriptor(_class2.prototype, "segmentedButtonPress", [_dec68], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor60 = _applyDecoratedDescriptor(_class2.prototype, "variantSaved", [_dec69], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor61 = _applyDecoratedDescriptor(_class2.prototype, "variantSelected", [_dec70], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor62 = _applyDecoratedDescriptor(_class2.prototype, "listBindingChange", [_dec71], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor63 = _applyDecoratedDescriptor(_class2.prototype, "internalDataRequested", [_dec72], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor64 = _applyDecoratedDescriptor(_class2.prototype, "selectionChange", [_dec73], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _applyDecoratedDescriptor(_class2.prototype, "onFieldLiveChange", [_dec74], Object.getOwnPropertyDescriptor(_class2.prototype, "onFieldLiveChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onTableRowPress", [_dec75], Object.getOwnPropertyDescriptor(_class2.prototype, "onTableRowPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onSegmentedButtonPressed", [_dec76], Object.getOwnPropertyDescriptor(_class2.prototype, "onSegmentedButtonPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onVariantSelected", [_dec77], Object.getOwnPropertyDescriptor(_class2.prototype, "onVariantSelected"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onVariantSaved", [_dec78], Object.getOwnPropertyDescriptor(_class2.prototype, "onVariantSaved"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onRowPressed", [_dec79], Object.getOwnPropertyDescriptor(_class2.prototype, "onRowPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onShareToCollaborationManagerPress", [_dec80], Object.getOwnPropertyDescriptor(_class2.prototype, "onShareToCollaborationManagerPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onOpenInNewTabPress", [_dec81], Object.getOwnPropertyDescriptor(_class2.prototype, "onOpenInNewTabPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalPatchCompleted", [_dec82], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalPatchCompleted"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataReceived", [_dec83], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataReceived"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onInternalDataRequested", [_dec84], Object.getOwnPropertyDescriptor(_class2.prototype, "onInternalDataRequested"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onPaste", [_dec85], Object.getOwnPropertyDescriptor(_class2.prototype, "onPaste"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onCut", [_dec86], Object.getOwnPropertyDescriptor(_class2.prototype, "onCut"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onCopy", [_dec87], Object.getOwnPropertyDescriptor(_class2.prototype, "onCopy"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeExport", [_dec88], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeExport"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDataStateChange", [_dec89], Object.getOwnPropertyDescriptor(_class2.prototype, "onDataStateChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAddCardToInsightsPressed", [_dec90], Object.getOwnPropertyDescriptor(_class2.prototype, "onAddCardToInsightsPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onMassEditButtonPressed", [_dec91], Object.getOwnPropertyDescriptor(_class2.prototype, "onMassEditButtonPressed"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onSelectionChanged", [_dec92], Object.getOwnPropertyDescriptor(_class2.prototype, "onSelectionChanged"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onActionPress", [_dec93], Object.getOwnPropertyDescriptor(_class2.prototype, "onActionPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onContextMenuPress", [_dec94], Object.getOwnPropertyDescriptor(_class2.prototype, "onContextMenuPress"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleCreateActivate", [_dec95], Object.getOwnPropertyDescriptor(_class2.prototype, "handleCreateActivate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDragEnterDocument", [_dec96], Object.getOwnPropertyDescriptor(_class2.prototype, "onDragEnterDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDragStartDocument", [_dec97], Object.getOwnPropertyDescriptor(_class2.prototype, "onDragStartDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onDropDocument", [_dec98], Object.getOwnPropertyDescriptor(_class2.prototype, "onDropDocument"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onCollapseExpandNode", [_dec99], Object.getOwnPropertyDescriptor(_class2.prototype, "onCollapseExpandNode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onMoveUpDown", [_dec100], Object.getOwnPropertyDescriptor(_class2.prototype, "onMoveUpDown"), _class2.prototype), _class2)) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class) || _class);
  return TableAPI;
}, false);
//# sourceMappingURL=TableAPI-dbg.js.map
