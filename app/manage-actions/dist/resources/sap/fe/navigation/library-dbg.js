/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Lib", "sap/ui/core/library"], function (Library, _library) {
  "use strict";

  var _exports = {};
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.ParamHandlingMode}.<br>
   * A static enumeration type which indicates the conflict resolution method when merging URL parameters into select options.
   * @public
   * @enum {string}
   * @readonly
   * @since 1.83.0
   */
  let ParamHandlingMode = /*#__PURE__*/function (ParamHandlingMode) {
    /**
     * The conflict resolution favors the SelectionVariant over URL parameters
     * @public
     */
    ParamHandlingMode["SelVarWins"] = "SelVarWins";
    /**
     * The conflict resolution favors the URL parameters over the SelectionVariant. Caution: In case of cross-app navigation
     * a navigation parameter value from the source app is overwritten by a default, if a default is maintained in the launchpad
     * designer for this parameter in the target app!
     * @public
     */
    ParamHandlingMode["URLParamWins"] = "URLParamWins";
    /**
     * The conflict resolution adds URL parameters to the SelectionVariant
     * @public
     */
    ParamHandlingMode["InsertInSelOpt"] = "InsertInSelOpt";
    return ParamHandlingMode;
  }({});
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.NavType}.<br>
   * A static enumeration type which indicates the type of inbound navigation.
   * @enum {string}
   * @readonly
   * @public
   * @since 1.86.0
   */
  _exports.ParamHandlingMode = ParamHandlingMode;
  let NavType = /*#__PURE__*/function (NavType) {
    /**
     * Initial startup without any navigation or default parameters
     * @public
     */
    NavType["initial"] = "initial";
    /**
     * Basic cross-app navigation with URL parameters only (without sap-xapp-state) or initial start with default parameters
     * @public
     */
    NavType["URLParams"] = "URLParams";
    /**
     * Cross-app navigation with sap-xapp-state parameter (and URL parameters), defaulted parameters may be added
     * @public
     */
    NavType["xAppState"] = "xAppState";
    /**
     * Back navigation with sap-iapp-state parameter
     * @public
     */
    NavType["iAppState"] = "iAppState";
    /**
     * Passing iapp-state data within xapp state in addition to existing values
     * @private
     */
    NavType["hybrid"] = "hybrid";
    return NavType;
  }({});
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
  _exports.NavType = NavType;
  let SuppressionBehavior = /*#__PURE__*/function (SuppressionBehavior) {
    /**
     * Standard suppression behavior: semantic attributes with a <code>null</code> or an <code>undefined</code> value are ignored,
     * the remaining attributes are mixed in to the selection variant
     * @public
     */
    SuppressionBehavior[SuppressionBehavior["standard"] = 0] = "standard";
    /**
     * Semantic attributes with an empty string are ignored, the remaining attributes are mixed in to the selection variant.
     * Warning! Consider the impact on Boolean variable values!
     * @public
     */
    SuppressionBehavior[SuppressionBehavior["ignoreEmptyString"] = 1] = "ignoreEmptyString";
    /**
     * Semantic attributes with a <code>null</code> value lead to an {@link sap.fin.central.lib.error.Error error} of type NavigationHandler.INVALID_INPUT
     * @public
     */
    SuppressionBehavior[SuppressionBehavior["raiseErrorOnNull"] = 2] = "raiseErrorOnNull";
    /**
     * Semantic attributes with an <code>undefined</code> value lead to an {@link sap.fin.central.lib.error.Error error} of type NavigationHandler.INVALID_INPUT
     * @public
     */
    SuppressionBehavior[SuppressionBehavior["raiseErrorOnUndefined"] = 4] = "raiseErrorOnUndefined";
    return SuppressionBehavior;
  }({});
  /**
   * A static enumeration type which indicates the Odata version used for runnning the Navigation Handler.
   * @public
   * @enum {string}
   * @readonly
   * @since 1.83.0
   */
  _exports.SuppressionBehavior = SuppressionBehavior;
  let Mode = /*#__PURE__*/function (Mode) {
    /**
     * This is used for ODataV2 services to do some internal tasks like creation of appstate, removal of sensitive data etc.,
     * @public
     */
    Mode["ODataV2"] = "ODataV2";
    /**
     * This is used for ODataV4 services to do some internal tasks like creation of appstate, removal of sensitive data etc.,
     * @public
     */
    Mode["ODataV4"] = "ODataV4";
    return Mode;
  }({});
  /**
   * Common library for all cross-application navigation functions.
   * @namespace
   * @public
   */
  _exports.Mode = Mode;
  const feNavigationNamespace = "sap.fe.navigation";

  /**
   * Common library for all cross-application navigation functions.
   * @public
   * @since 1.83.0
   */
  _exports.feNavigationNamespace = feNavigationNamespace;
  const thisLib = Library.init({
    name: "sap.fe.navigation",
    apiVersion: 2,
    // eslint-disable-next-line no-template-curly-in-string
    version: "1.136.0",
    dependencies: ["sap.ui.core"],
    types: ["sap.fe.navigation.NavType", "sap.fe.navigation.ParamHandlingMode", "sap.fe.navigation.SuppressionBehavior"],
    interfaces: [],
    controls: [],
    elements: [],
    noLibraryCSS: true
  });
  thisLib.ParamHandlingMode = ParamHandlingMode;
  thisLib.NavType = NavType;
  thisLib.SuppressionBehavior = SuppressionBehavior;
  thisLib.Mode = Mode;
  return thisLib;
}, false);
//# sourceMappingURL=library-dbg.js.map
