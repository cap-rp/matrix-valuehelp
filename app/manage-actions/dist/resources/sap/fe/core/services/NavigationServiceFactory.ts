import type { InnerAppData } from "sap/fe/navigation/NavigationHandler";
import NavigationHandler from "sap/fe/navigation/NavigationHandler";
import type SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type { SerializedSelectionVariant } from "sap/fe/navigation/SelectionVariant";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import jQuery from "sap/ui/thirdparty/jquery";
import type { ServiceContext } from "types/metamodel_types";

type NavigationServiceSettings = {};
export class NavigationService extends Service<NavigationServiceSettings> {
	initPromise!: Promise<this>;

	oNavHandler!: NavigationHandler;

	init(): void {
		const oContext = this.getContext(),
			oComponent = oContext && oContext.scopeObject;

		this.oNavHandler = new NavigationHandler(oComponent);
		this.oNavHandler.setModel(oComponent.getModel());
		this.initPromise = Promise.resolve(this);
	}

	exit(): void {
		this.oNavHandler.destroy();
	}

	/**
	 * Triggers a cross-app navigation after saving the inner and the cross-app states.
	 * @param sSemanticObject Semantic object of the target app
	 * @param sActionName Action of the target app
	 * @param [vNavigationParameters] Navigation parameters as an object with key/value pairs or as a string representation of
	 *        such an object. If passed as an object, the properties are not checked against the <code>IsPotentialSensitive</code> or
	 *        <code>Measure</code> type.
	 * @param [oInnerAppData] Object for storing current state of the app
	 * @param [fnOnError] Callback that is called if an error occurs during navigation <br>
	 * @param [oExternalAppData] Object for storing the state which will be forwarded to the target component.
	 * @param oExternalAppData.valueTexts
	 * @param oExternalAppData.presentationVariant
	 * @param oExternalAppData.selectionVariant
	 * @param [sNavMode] Argument is used to overwrite the FLP-configured target for opening a URL. If used, only the
	 *        <code>explace</code> or <code>inplace</code> values are allowed. Any other value will lead to an exception
	 *        <code>NavigationHandler.INVALID_NAV_MODE</code>.
	 */
	navigate(
		sSemanticObject: string,
		sActionName: string,
		vNavigationParameters: string | object,
		oInnerAppData?: InnerAppData,
		fnOnError?: Function,
		oExternalAppData?: {
			valueTexts?: object | undefined;
			presentationVariant?: object | undefined;
			selectionVariant?: object | undefined;
		},
		sNavMode?: string
	): void {
		// TODO: Navigation Handler does not handle navigation without a context
		// but in v4 DataFieldForIBN with requiresContext false can trigger a navigation without any context
		// This should be handled
		this.oNavHandler.navigate(
			sSemanticObject,
			sActionName,
			vNavigationParameters,
			oInnerAppData,
			fnOnError,
			oExternalAppData,
			sNavMode
		);
	}

	/**
	 * Parses the incoming URL and returns a Promise.
	 * @returns A Promise object which returns the
	 * extracted app state, the startup parameters, and the type of navigation when execution is successful,
	 */
	parseNavigation(): jQuery.Promise<unknown[]> {
		return this.oNavHandler.parseNavigation() as jQuery.Promise<unknown[]>;
	}

	/**
	 * Get App specific hash.
	 * @param appHash The path string
	 * @returns A string representing base path
	 */
	async getAppSpecificHash(appHash: string): Promise<string | undefined> {
		return this.oNavHandler._getAppSpecificHash(appHash);
	}

	/**
	 * Processes selectionVariant string and returns a Promise object (semanticAttributes and AppStateKey).
	 * @param sSelectionVariant Stringified JSON object
	 * @returns A Promise object to monitor when all actions in the function have been executed; if the execution is successful, the
	 *          semanticAttributes as well as the appStateKey are returned; if an error occurs, an error object of type
	 *          {@link sap.fe.navigation.NavError} is returned
	 * <br>
	 * @example <code>
	 *
	 * 		var oSelectionVariant = new sap.fe.navigation.SelectionVariant();
	 * 		oSelectionVariant.addSelectOption("CompanyCode", "I", "EQ", "0001");
	 * 		oSelectionVariant.addSelectOption("Customer", "I", "EQ", "C0001");
	 * 		var sSelectionVariant= oSelectionVariant.toJSONString();
	 *
	 * 		var oNavigationHandler = new sap.fe.navigation.NavigationHandler(oController);
	 * 		var oPromiseObject = oNavigationHandler._getAppStateKeyAndUrlParameters(sSelectionVariant);
	 *
	 * 		oPromiseObject.done(function(oSemanticAttributes, sAppStateKey){
	 * 			// here you can add coding that should run after all app state and the semantic attributes have been returned.
	 * 		});
	 *
	 * 		oPromiseObject.fail(function(oError){
	 * 			//some error handling
	 * 		});
	 *
	 * </code>
	 */
	// eslint-disable-next-line @typescript-eslint/promise-function-async
	getAppStateKeyAndUrlParameters(sSelectionVariant: string): JQuery.Promise<string[], unknown, unknown> {
		return this.oNavHandler._getAppStateKeyAndUrlParameters(sSelectionVariant);
	}

	/**
	 * Gets the application specific technical parameters.
	 * @returns Containing the technical parameters.
	 */
	getTechnicalParameters(): string[] {
		return this.oNavHandler.getTechnicalParameters();
	}

	/**
	 * Sets the application specific technical parameters. Technical parameters will not be added to the selection variant passed to the
	 * application.
	 * As a default sap-system, sap-ushell-defaultedParameterNames and hcpApplicationId are considered as technical parameters.
	 * @param aTechnicalParameters List of parameter names to be considered as technical parameters. <code>null</code> or
	 *        <code>undefined</code> may be used to reset the complete list.
	 */
	setTechnicalParameters(aTechnicalParameters: unknown[]): void {
		this.oNavHandler.setTechnicalParameters(aTechnicalParameters);
	}

	/**
	 * Sets the model that is used for verification of sensitive information. If the model is not set, the unnamed component model is used for the
	 * verification of sensitive information.
	 * @param oModel Model For checking sensitive information
	 */
	setModel(oModel: ODataModel): void {
		this.oNavHandler.setModel(oModel);
	}

	/**
	 * Changes the URL according to the current app state and stores the app state for later retrieval.
	 * @param mInnerAppData Object containing the current state of the app
	 * @param [bImmediateHashReplace] If set to false, the inner app hash will not be replaced until storing is successful; do not
	 *        set to false if you cannot react to the resolution of the Promise, for example, when calling the beforeLinkPressed event
	 * @param [bSkipHashReplace] If set to true, the inner app hash will not be replaced in the storeInnerAppState. Also the bImmediateHashReplace
	 * 		  will be ignored.
	 * @returns A Promise object to monitor when all the actions of the function have been executed; if the execution is successful, the
	 *          app state key is returned; if an error occurs, an object of type {@link sap.fe.navigation.NavError} is
	 *          returned
	 */
	async storeInnerAppStateAsync(
		mInnerAppData: InnerAppData,
		bImmediateHashReplace?: boolean,
		bSkipHashReplace?: boolean
	): Promise<string> {
		// safely converting JQuerry deferred to ES6 promise
		return new Promise((resolve, reject) =>
			this.oNavHandler.storeInnerAppStateAsync(mInnerAppData, bImmediateHashReplace, bSkipHashReplace).then(resolve, reject)
		);
	}

	/**
	 * Changes the URL according to the current sAppStateKey. As an reaction route change event will be triggered.
	 * @param sAppStateKey The new app state key.
	 */
	replaceHash(sAppStateKey: string): void {
		this.oNavHandler.replaceHash(sAppStateKey);
	}

	replaceInnerAppStateKey(sAppHash: string, sAppStateKey: string): string | undefined {
		return this.oNavHandler._replaceInnerAppStateKey(sAppHash, sAppStateKey);
	}

	/**
	 * Get single values from SelectionVariant for url parameters.
	 * @param [vSelectionVariant]
	 * @param [vSelectionVariant.oUrlParamaters]
	 * @returns The url parameters
	 */
	getUrlParametersFromSelectionVariant(vSelectionVariant: string | SelectionVariant | undefined): Record<string, string> {
		return this.oNavHandler._getURLParametersFromSelectionVariant(vSelectionVariant);
	}

	/**
	 * Save app state and return immediately without waiting for response.
	 * @param oInSelectionVariant Instance of sap.fe.navigation.SelectionVariant
	 * @returns AppState key
	 */
	saveAppStateWithImmediateReturn(oInSelectionVariant: SelectionVariant): string | undefined {
		if (oInSelectionVariant) {
			const sSelectionVariant = oInSelectionVariant.toJSONString(), // create an SV for app state in string format
				oSelectionVariant = JSON.parse(sSelectionVariant), // convert string into JSON to store in AppState
				oXAppStateObject = {
					selectionVariant: oSelectionVariant
				},
				oReturn = this.oNavHandler._saveAppStateWithImmediateReturn(oXAppStateObject);
			return oReturn?.appStateKey ? oReturn.appStateKey : "";
		} else {
			return undefined;
		}
	}

	/**
	 * Mix Attributes and selectionVariant.
	 * @param vSemanticAttributes Object/(Array of Objects) containing key/value pairs
	 * @param sSelectionVariant The selection variant in string format as provided by the SmartFilterBar control
	 * @param iSuppressionBehavior Indicates whether semantic
	 *        attributes with special values (see {@link sap.fe.navigation.SuppressionBehavior suppression behavior}) must be
	 *        suppressed before they are combined with the selection variant; several
	 *        {@link sap.fe.navigation.SuppressionBehavior suppression behaviors} can be combined with the bitwise OR operator
	 *        (|)
	 * @returns Instance of {@link sap.fe.navigation.SelectionVariant}
	 */
	mixAttributesAndSelectionVariant(
		vSemanticAttributes: object | unknown[],
		sSelectionVariant: string | SerializedSelectionVariant,
		iSuppressionBehavior?: number
	): SelectionVariant {
		return this.oNavHandler.mixAttributesAndSelectionVariant(vSemanticAttributes, sSelectionVariant, iSuppressionBehavior);
	}

	/**
	 * The method creates a context url based on provided data. This context url can either be used as.
	 * @param sEntitySetName Used for url determination
	 * @param oModel The ODataModel used for url determination. If omitted, the NavigationHandler model is used.
	 * @returns The context url for the given entities
	 */
	constructContextUrl(sEntitySetName: string, oModel: ODataModel): string {
		return this.oNavHandler.constructContextUrl(sEntitySetName, oModel);
	}

	getInterface(): this {
		return this;
	}

	/**
	 * The method returns iAppState key for the current navgation handler instance.
	 * @returns IAppState key
	 */
	getIAppStateKey(): string | undefined {
		return this.oNavHandler.getIAppStateKey();
	}

	checkIsPotentiallySensitive(oData: Object): unknown {
		return this.oNavHandler._checkIsPotentiallySensitive(oData);
	}
}
function fnGetEmptyObject(): {} {
	return {};
}

async function fnGetPromise(): Promise<{}> {
	return Promise.resolve({});
}
// eslint-disable-next-line @typescript-eslint/promise-function-async
function fnGetJQueryPromise(): JQuery.Promise<unknown> {
	const oMyDeffered = jQuery.Deferred();
	oMyDeffered.resolve({}, {}, "initial");
	return oMyDeffered.promise();
}

function fnGetEmptyString(): string {
	return "";
}
export class NavigationServicesMock extends ServiceFactory<NavigationServiceSettings> {
	initPromise: Promise<this>;

	constructor() {
		super();
		this.initPromise = Promise.resolve(this);
	}

	getInterface(): this {
		return this;
	}

	// return empty object
	createEmptyAppState = fnGetEmptyObject;

	mixAttributesAndSelectionVariant = fnGetEmptyObject;

	// return promise
	getAppState = fnGetPromise;

	getStartupAppState = fnGetPromise;

	parseNavigation = fnGetJQueryPromise;

	// return empty string
	constructContextUrl = fnGetEmptyString;

	replaceInnerAppStateKey(sAppHash: string): string {
		return sAppHash ? sAppHash : "";
	}

	getIAppStateKey = fnGetEmptyString;

	navigate(): void {
		// Don't do anything
	}
}

class NavigationServiceFactory extends ServiceFactory<NavigationServiceSettings> {
	async createInstance(oServiceContext: ServiceContext<NavigationServiceSettings>): Promise<NavigationService> {
		const oNavigationService = sap.ui.require("sap/ushell/Container")
			? new NavigationService(oServiceContext)
			: new NavigationServicesMock();
		// Wait For init
		return oNavigationService.initPromise.then(function (oService) {
			return oService as NavigationService;
		});
	}
}

export default NavigationServiceFactory;
