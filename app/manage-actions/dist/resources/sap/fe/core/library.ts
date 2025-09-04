import Log from "sap/base/Log";
import "sap/fe/core/formatters/CriticalityFormatter";
import "sap/fe/core/formatters/FPMFormatter";
import "sap/fe/core/formatters/StandardFormatter";
import "sap/fe/core/formatters/ValueFormatter";

import AsyncComponentServiceFactory from "sap/fe/core/services/AsyncComponentServiceFactory";
import CacheHandlerServiceFactory from "sap/fe/core/services/CacheHandlerServiceFactory";
import CollaborativeToolsServiceFactory from "sap/fe/core/services/CollaborativeToolsServiceFactory";
import { EnvironmentServiceFactory } from "sap/fe/core/services/EnvironmentServiceFactory";
import NavigationService from "sap/fe/core/services/NavigationServiceFactory";
import ResourceModelServiceFactory from "sap/fe/core/services/ResourceModelServiceFactory";
import RoutingServiceFactory from "sap/fe/core/services/RoutingServiceFactory";
import ShellServicesFactory from "sap/fe/core/services/ShellServicesFactory";
import SideEffectsServiceFactory from "sap/fe/core/services/SideEffectsServiceFactory";
import TemplatedViewServiceFactory from "sap/fe/core/services/TemplatedViewServiceFactory";
import CollaborationManagerServiceFactory from "./services/CollaborationManagerServiceFactory";
import ValueHelpHistoryServiceFactory from "./services/ValueHelpHistoryServiceFactory";

import { xmlViewPreprocessor } from "sap/fe/base/HookSupport";
import "sap/fe/base/library";
import InlineEditServiceFactory from "sap/fe/core/services/InlineEditServiceFactory";
import TelemetryServiceFactory from "sap/fe/core/services/TelemetryServiceFactory";
import "sap/fe/core/type/Date";
import "sap/fe/core/type/DateTimeWithTimezone";
import "sap/fe/core/type/Email";
import "sap/fe/core/type/FiscalDate";
import "sap/fe/core/type/InputMask";
import "sap/fe/navigation/library";
import "sap/fe/placeholder/library";
import DataType from "sap/ui/base/DataType";
import Library from "sap/ui/core/Lib";
import "sap/ui/core/library";
import View from "sap/ui/core/mvc/View";
import ServiceFactoryRegistry from "sap/ui/core/service/ServiceFactoryRegistry";
import ContextSharingServiceFactory from "./services/ContextSharingServiceFactory";
import CollaborativeDraftServiceFactory from "./services/collaborativeDraftServiceFactory";

/**
 * Root namespace for all the libraries related to SAP Fiori elements.
 * @namespace
 * @public
 */
export const feNamespace = "sap.fe";
/**
 * Library providing the core functionality of the runtime for SAP Fiori elements for OData V4.
 * @namespace
 * @public
 */
export const feCoreNamespace = "sap.fe.core";
/**
 * Collection of controller extensions used internally in SAP Fiori elements exposing a method that you can override to allow more flexibility.
 * @namespace
 * @public
 */
export const feCextNamespace = "sap.fe.core.controllerextensions";
/**
 * Collection of classes provided by SAP Fiori elements for the Flexible Programming Model
 * @namespace
 * @public
 */
export const feFpmNamespace = "sap.fe.core.fpm";

const thisLib = Library.init({
	name: "sap.fe.core",
	apiVersion: 2,
	dependencies: ["sap.ui.core", "sap.fe.base", "sap.fe.navigation", "sap.fe.placeholder", "sap.f"],
	types: ["sap.fe.core.CreationMode", "sap.fe.core.VariantManagement"],
	interfaces: [],
	controls: [],
	elements: [],
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	noLibraryCSS: true,
	extensions: {
		//Configuration used for rule loading of Support Assistant
		"sap.ui.support": {
			publicRules: true,
			internalRules: true
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
}) as any;

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
export enum InitialLoadMode {
	/**
	 * Data will be loaded initially.
	 * @public
	 */
	Enabled = "Enabled",

	/**
	 * Data will not be loaded initially.
	 * @public
	 */
	Disabled = "Disabled",

	/**
	 * Data will be loaded initially if filters are set.
	 * @public
	 */
	Auto = "Auto"
}
thisLib.InitialLoadMode = InitialLoadMode;

/**
 * Value of the startup mode
 * @readonly
 * @enum {string}
 */
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
	isValid: function (vValue: string | boolean | undefined) {
		if (typeof vValue === "boolean") {
			Log.warning(
				"DEPRECATED: boolean value not allowed for 'initialLoad' manifest setting - supported values are: Disabled|Enabled|Auto"
			);
		}
		return vValue === undefined || vValue === null || typeof vValue === "boolean" || thisLib.InitialLoadMode.hasOwnProperty(vValue);
	}
});
// normalize a value, taking care of boolean type
InitialLoadType.setNormalizer(function (vValue: string | boolean | undefined) {
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

export type CoreLib = {
	InvocationGrouping: {
		ChangeSet: "ChangeSet";
		Isolated: "Isolated";
	};
};
export default thisLib;
