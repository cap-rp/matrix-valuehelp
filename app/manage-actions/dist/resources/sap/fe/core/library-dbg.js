/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/formatters/CriticalityFormatter", "sap/fe/core/formatters/FPMFormatter", "sap/fe/core/formatters/StandardFormatter", "sap/fe/core/formatters/ValueFormatter", "sap/fe/core/services/AsyncComponentServiceFactory", "sap/fe/core/services/CacheHandlerServiceFactory", "sap/fe/core/services/CollaborativeToolsServiceFactory", "sap/fe/core/services/EnvironmentServiceFactory", "sap/fe/core/services/NavigationServiceFactory", "sap/fe/core/services/ResourceModelServiceFactory", "sap/fe/core/services/RoutingServiceFactory", "sap/fe/core/services/ShellServicesFactory", "sap/fe/core/services/SideEffectsServiceFactory", "sap/fe/core/services/TemplatedViewServiceFactory", "./services/CollaborationManagerServiceFactory", "./services/ValueHelpHistoryServiceFactory", "sap/fe/base/HookSupport", "sap/fe/base/library", "sap/fe/core/services/InlineEditServiceFactory", "sap/fe/core/services/TelemetryServiceFactory", "sap/fe/core/type/Date", "sap/fe/core/type/DateTimeWithTimezone", "sap/fe/core/type/Email", "sap/fe/core/type/FiscalDate", "sap/fe/core/type/InputMask", "sap/fe/navigation/library", "sap/fe/placeholder/library", "sap/ui/base/DataType", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/core/mvc/View", "sap/ui/core/service/ServiceFactoryRegistry", "./services/ContextSharingServiceFactory", "./services/collaborativeDraftServiceFactory"], function (Log, _CriticalityFormatter, _FPMFormatter, _StandardFormatter, _ValueFormatter, AsyncComponentServiceFactory, CacheHandlerServiceFactory, CollaborativeToolsServiceFactory, $EnvironmentServiceFactory, NavigationService, ResourceModelServiceFactory, RoutingServiceFactory, ShellServicesFactory, SideEffectsServiceFactory, TemplatedViewServiceFactory, CollaborationManagerServiceFactory, ValueHelpHistoryServiceFactory, HookSupport, _library, InlineEditServiceFactory, TelemetryServiceFactory, _Date, _DateTimeWithTimezone, _Email, _FiscalDate, _InputMask, _library2, _library3, DataType, Library, _library4, View, ServiceFactoryRegistry, ContextSharingServiceFactory, CollaborativeDraftServiceFactory) {
  "use strict";

  var _exports = {};
  var xmlViewPreprocessor = HookSupport.xmlViewPreprocessor;
  var EnvironmentServiceFactory = $EnvironmentServiceFactory.EnvironmentServiceFactory;
  /**
   * Root namespace for all the libraries related to SAP Fiori elements.
   * @namespace
   * @public
   */
  const feNamespace = "sap.fe";
  /**
   * Library providing the core functionality of the runtime for SAP Fiori elements for OData V4.
   * @namespace
   * @public
   */
  _exports.feNamespace = feNamespace;
  const feCoreNamespace = "sap.fe.core";
  /**
   * Collection of controller extensions used internally in SAP Fiori elements exposing a method that you can override to allow more flexibility.
   * @namespace
   * @public
   */
  _exports.feCoreNamespace = feCoreNamespace;
  const feCextNamespace = "sap.fe.core.controllerextensions";
  /**
   * Collection of classes provided by SAP Fiori elements for the Flexible Programming Model
   * @namespace
   * @public
   */
  _exports.feCextNamespace = feCextNamespace;
  const feFpmNamespace = "sap.fe.core.fpm";
  _exports.feFpmNamespace = feFpmNamespace;
  const thisLib = Library.init({
    name: "sap.fe.core",
    apiVersion: 2,
    dependencies: ["sap.ui.core", "sap.fe.base", "sap.fe.navigation", "sap.fe.placeholder", "sap.f"],
    types: ["sap.fe.core.CreationMode", "sap.fe.core.VariantManagement"],
    interfaces: [],
    controls: [],
    elements: [],
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    noLibraryCSS: true,
    extensions: {
      //Configuration used for rule loading of Support Assistant
      "sap.ui.support": {
        publicRules: true,
        internalRules: true
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  });

  /**
   * Available values for invocation grouping.
   * @readonly
   * @enum {string}
   */
  thisLib.InvocationGrouping = {
    /**
     * Isolated.
     * @constant
     * @type {string}
     * @public
     */
    Isolated: "Isolated",
    /**
     * ChangeSet.
     * @constant
     * @type {string}
     * @public
     */
    ChangeSet: "ChangeSet"
  };
  /**
   * Available values for creation mode.
   * @readonly
   * @enum {string}
   */
  thisLib.CreationMode = {
    /**
     * New Page.
     * @constant
     * @type {string}
     * @public
     */
    NewPage: "NewPage",
    /**
     * Sync.
     * @constant
     * @type {string}
     * @public
     */
    Sync: "Sync",
    /**
     * Async.
     * @constant
     * @type {string}
     * @public
     */
    Async: "Async",
    /**
     * Deferred.
     * @constant
     * @type {string}
     * @public
     */
    Deferred: "Deferred",
    /**
     * Inline.
     * @constant
     * @type {string}
     * @public
     */
    Inline: "Inline",
    /**
     * Creation row.
     * @constant
     * @type {string}
     * @public
     */
    CreationRow: "CreationRow",
    /**
     * Inline creation rows.
     * @constant
     * @type {string}
     * @public
     */
    InlineCreationRows: "InlineCreationRows",
    /**
     * External (by outbound navigation).
     * @constant
     * @type {string}
     * @public
     */
    External: "External",
    /**
     * Creation dialog.
     * @constant
     * @type {string}
     * @public
     */
    CreationDialog: "CreationDialog"
  };
  DataType.registerEnum("sap.fe.core.CreationMode", thisLib.CreationMode);
  /**
   * Available values for Variant Management.
   * @readonly
   * @enum {string}
   */
  thisLib.VariantManagement = {
    /**
     * No variant management at all.
     * @constant
     * @type {string}
     * @public
     */
    None: "None",
    /**
     * One variant configuration for the whole page.
     * @constant
     * @type {string}
     * @public
     */
    Page: "Page",
    /**
     * Variant management on control level.
     * @constant
     * @type {string}
     * @public
     */
    Control: "Control"
  };
  DataType.registerEnum("sap.fe.core.VariantManagement", thisLib.VariantManagement);
  /**
   * Available constants.
   * @readonly
   * @enum {string}
   */
  thisLib.Constants = {
    /*
     * Indicates cancelling of an action dialog.
     *
     * @constant
     * @type {string}
     * @public
     */
    CancelActionDialog: "cancel",
    /*
     * Indicates failure returned from backend during the execution of an action
     *
     * @constant
     * @type {string}
     * @public
     */
    ActionExecutionFailed: "actionExecutionFailed",
    /*
     * Indicates failure returned from backend during creation of a business object (via direct POST)
     *
     * @constant
     * @type {string}
     * @public
     */
    CreationFailed: "creationFailed",
    /*
     * Indicates failure returned from onBeforeCreate Edit Flow hook called before creation of a business object
     *
     * @constant
     * @type {string}
     * @public
     */
    OnBeforeCreateFailed: "onBeforeCreateFailed"
  };
  /**
   * Available values for programming model.
   * @readonly
   * @enum {string}
   */
  thisLib.ProgrammingModel = {
    /*
     * Draft.
     *
     * @constant
     * @type {string}
     * @public
     */
    Draft: "Draft",
    /**
     * Sticky.
     * @constant
     * @type {string}
     * @public
     */
    Sticky: "Sticky",
    /**
     * NonDraft.
     * @constant
     * @type {string}
     * @public
     */
    NonDraft: "NonDraft"
  };
  /**
   * Available values for draft status.
   * @readonly
   * @enum {string}
   */
  thisLib.DraftStatus = {
    /**
     * Saving.
     * @constant
     * @type {string}
     * @public
     */
    Saving: "Saving",
    /**
     * Saved.
     * @constant
     * @type {string}
     * @public
     */
    Saved: "Saved",
    /**
     * Clear.
     * @constant
     * @type {string}
     * @public
     */
    Clear: "Clear"
  };
  /**
   * Edit mode values.
   * @readonly
   * @enum {string}
   */
  thisLib.EditMode = {
    /**
     * View is currently displaying only.
     * @constant
     * @type {string}
     * @public
     */
    Display: "Display",
    /**
     * View is currently editable.
     * @constant
     * @type {string}
     * @public
     */
    Editable: "Editable"
  };
  /**
   * Template views.
   * @readonly
   * @enum {string}
   */
  thisLib.TemplateContentView = {
    /**
     * Hybrid.
     * @constant
     * @type {string}
     */
    Hybrid: "Hybrid",
    /**
     * Chart.
     * @constant
     * @type {string}
     */
    Chart: "Chart",
    /**
     * Table.
     * @constant
     * @type {string}
     */
    Table: "Table"
  };
  /**
   * Possible initial load (first app startup) modes for a ListReport.
   * @enum {string}
   * @readonly
   * @public
   * @since 1.86.0
   */
  let InitialLoadMode = /*#__PURE__*/function (InitialLoadMode) {
    /**
     * Data will be loaded initially.
     * @public
     */
    InitialLoadMode["Enabled"] = "Enabled";
    /**
     * Data will not be loaded initially.
     * @public
     */
    InitialLoadMode["Disabled"] = "Disabled";
    /**
     * Data will be loaded initially if filters are set.
     * @public
     */
    InitialLoadMode["Auto"] = "Auto";
    return InitialLoadMode;
  }({});
  thisLib.InitialLoadMode = InitialLoadMode;

  /**
   * Value of the startup mode
   * @readonly
   * @enum {string}
   */
  _exports.InitialLoadMode = InitialLoadMode;
  thisLib.StartupMode = {
    /**
     * App has been started normally.
     * @constant
     * @type {string}
     */
    Normal: "Normal",
    /**
     * App has been started with startup keys (deeplink).
     * @constant
     * @type {string}
     */
    Deeplink: "Deeplink",
    /**
     * App has been started in 'create' mode.
     * @constant
     * @type {string}
     */
    Create: "Create",
    /**
     * App has been started in 'auto create' mode which means to skip any dialogs on startup
     * @constant
     * @type {string}
     */
    AutoCreate: "AutoCreate"
  };
  // explicit type to handle backward compatibility with boolean values
  const InitialLoadType = DataType.createType("sap.fe.core.InitialLoadMode", {
    defaultValue: thisLib.InitialLoadMode.Auto,
    isValid: function (vValue) {
      if (typeof vValue === "boolean") {
        Log.warning("DEPRECATED: boolean value not allowed for 'initialLoad' manifest setting - supported values are: Disabled|Enabled|Auto");
      }
      return vValue === undefined || vValue === null || typeof vValue === "boolean" || thisLib.InitialLoadMode.hasOwnProperty(vValue);
    }
  });
  // normalize a value, taking care of boolean type
  InitialLoadType.setNormalizer(function (vValue) {
    if (!vValue) {
      // undefined, null or false
      return thisLib.InitialLoadMode.Disabled;
    }
    return vValue === true ? thisLib.InitialLoadMode.Enabled : vValue;
  });
  ServiceFactoryRegistry.register("sap.fe.core.services.TemplatedViewService", new TemplatedViewServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.ResourceModelService", new ResourceModelServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.CacheHandlerService", new CacheHandlerServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.CollaborationManagerService", new CollaborationManagerServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.NavigationService", new NavigationService());
  ServiceFactoryRegistry.register("sap.fe.core.services.RoutingService", new RoutingServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.SideEffectsService", new SideEffectsServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.ShellServices", new ShellServicesFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.EnvironmentService", new EnvironmentServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.AsyncComponentService", new AsyncComponentServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.CollaborativeToolsService", new CollaborativeToolsServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.TelemetryService", new TelemetryServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.ValueHelpHistoryService", new ValueHelpHistoryServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.CollaborativeDraftService", new CollaborativeDraftServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.ContextSharingService", new ContextSharingServiceFactory());
  ServiceFactoryRegistry.register("sap.fe.core.services.InlineEditService", new InlineEditServiceFactory());
  View.registerPreprocessor("controls", xmlViewPreprocessor, "XML", false, true);
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map
