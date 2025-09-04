import Library from "sap/ui/core/Lib";
import "sap/ui/core/library";

/**
 * This is the successor of {@link sap.ui.generic.app.navigation.service.ParamHandlingMode}.<br>
 * A static enumeration type which indicates the conflict resolution method when merging URL parameters into select options.
 * @public
 * @enum {string}
 * @readonly
 * @since 1.83.0
 */
export enum ParamHandlingMode {
	/**
	 * The conflict resolution favors the SelectionVariant over URL parameters
	 * @public
	 */
	SelVarWins = "SelVarWins",

	/**
	 * The conflict resolution favors the URL parameters over the SelectionVariant. Caution: In case of cross-app navigation
	 * a navigation parameter value from the source app is overwritten by a default, if a default is maintained in the launchpad
	 * designer for this parameter in the target app!
	 * @public
	 */
	URLParamWins = "URLParamWins",

	/**
	 * The conflict resolution adds URL parameters to the SelectionVariant
	 * @public
	 */
	InsertInSelOpt = "InsertInSelOpt"
}

/**
 * This is the successor of {@link sap.ui.generic.app.navigation.service.NavType}.<br>
 * A static enumeration type which indicates the type of inbound navigation.
 * @enum {string}
 * @readonly
 * @public
 * @since 1.86.0
 */
export enum NavType {
	/**
	 * Initial startup without any navigation or default parameters
	 * @public
	 */
	initial = "initial",

	/**
	 * Basic cross-app navigation with URL parameters only (without sap-xapp-state) or initial start with default parameters
	 * @public
	 */
	URLParams = "URLParams",

	/**
	 * Cross-app navigation with sap-xapp-state parameter (and URL parameters), defaulted parameters may be added
	 * @public
	 */
	xAppState = "xAppState",

	/**
	 * Back navigation with sap-iapp-state parameter
	 * @public
	 */
	iAppState = "iAppState",

	/**
	 * Passing iapp-state data within xapp state in addition to existing values
	 * @private
	 */
	hybrid = "hybrid"
}

/**
 * This is the successor of {@link sap.ui.generic.app.navigation.service.SuppressionBehavior}.<br>
 * A static enumeration type which indicates whether semantic attributes with values <code>null</code>,
 * <code>undefined</code> or <code>""</code> (empty string) shall be suppressed, before they are mixed in to the selection variant in the
 * method {@link sap.fe.navigation.NavigationHandler.mixAttributesAndSelectionVariant mixAttributesAndSelectionVariant}
 * of the {@link sap.fe.navigation.NavigationHandler NavigationHandler}.
 * @public
 * @enum {string}
 * @readonly
 * @since 1.83.0
 */
export enum SuppressionBehavior {
	/**
	 * Standard suppression behavior: semantic attributes with a <code>null</code> or an <code>undefined</code> value are ignored,
	 * the remaining attributes are mixed in to the selection variant
	 * @public
	 */
	standard = 0,

	/**
	 * Semantic attributes with an empty string are ignored, the remaining attributes are mixed in to the selection variant.
	 * Warning! Consider the impact on Boolean variable values!
	 * @public
	 */
	ignoreEmptyString = 1,

	/**
	 * Semantic attributes with a <code>null</code> value lead to an {@link sap.fin.central.lib.error.Error error} of type NavigationHandler.INVALID_INPUT
	 * @public
	 */
	raiseErrorOnNull = 2,

	/**
	 * Semantic attributes with an <code>undefined</code> value lead to an {@link sap.fin.central.lib.error.Error error} of type NavigationHandler.INVALID_INPUT
	 * @public
	 */
	raiseErrorOnUndefined = 4
}

/**
 * A static enumeration type which indicates the Odata version used for runnning the Navigation Handler.
 * @public
 * @enum {string}
 * @readonly
 * @since 1.83.0
 */
export enum Mode {
	/**
	 * This is used for ODataV2 services to do some internal tasks like creation of appstate, removal of sensitive data etc.,
	 * @public
	 */
	ODataV2 = "ODataV2",

	/**
	 * This is used for ODataV4 services to do some internal tasks like creation of appstate, removal of sensitive data etc.,
	 * @public
	 */
	ODataV4 = "ODataV4"
}

/**
 * Common library for all cross-application navigation functions.
 * @namespace
 * @public
 */
export const feNavigationNamespace = "sap.fe.navigation";

/**
 * Common library for all cross-application navigation functions.
 * @public
 * @since 1.83.0
 */
const thisLib = Library.init({
	name: "sap.fe.navigation",
	apiVersion: 2,
	// eslint-disable-next-line no-template-curly-in-string
	version: "${version}",
	dependencies: ["sap.ui.core"],
	types: ["sap.fe.navigation.NavType", "sap.fe.navigation.ParamHandlingMode", "sap.fe.navigation.SuppressionBehavior"],
	interfaces: [],
	controls: [],
	elements: [],
	noLibraryCSS: true
}) as {
	[key: string]: unknown;
	ParamHandlingMode: typeof ParamHandlingMode;
	NavType: typeof NavType;
	SuppressionBehavior: typeof SuppressionBehavior;
	Mode: typeof Mode;
};

thisLib.ParamHandlingMode = ParamHandlingMode;

thisLib.NavType = NavType;

thisLib.SuppressionBehavior = SuppressionBehavior;

thisLib.Mode = Mode;

export default thisLib;
