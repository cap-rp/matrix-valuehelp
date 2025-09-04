import Log from "sap/base/Log";
import { defineUI5Class, extensible, finalExtension, methodOverride, publicExtension } from "sap/fe/base/ClassSupport";
import type PageController from "sap/fe/core/PageController";
import { recommendationHelper } from "sap/fe/core/helpers/RecommendationHelper";
import type {
	RecommendationContextsInfo,
	RecommendationInfo,
	StandardRecommendationResponse
} from "sap/fe/core/helpers/StandardRecommendationHelper";
import { standardRecommendationHelper } from "sap/fe/core/helpers/StandardRecommendationHelper";
import type Control from "sap/ui/core/Control";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import type Context from "sap/ui/model/Context";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type { FEView } from "../BaseController";
import CommonUtils from "../CommonUtils";
import type FclController from "../rootView/Fcl.controller";
import TransactionHelper from "./editFlow/TransactionHelper";

import { RecommendationDialogDecision } from "../controls/Recommendations/ConfirmRecommendationDialog";
import type { RecommendationTelemetry } from "../services/TelemetryServiceFactory";
import Telemetry from "./recommendations/Telemetry";

export type AcceptAllParams = {
	recommendationData?: RecommendationData[];
};

export type RecommendationData = {
	context?: ODataV4Context;
	contextIdentifier?: string[];
	contextIdentifierText?: string[];
	propertyPath?: string;
	value?: string;
	text?: string;
};
@defineUI5Class("sap.fe.core.controllerextensions.Recommendations")
export default class Recommendations extends ControllerExtension {
	base!: PageController;

	recommendationContexts!: RecommendationContextsInfo[];

	rootContext!: Context | undefined;

	internalModel!: JSONModel;

	telemetry!: Telemetry;

	allRecommendedFields!: string[];

	// the data shown in Accept/Ignore dialog of Recommendations
	dataToBeAccepted: RecommendationData[] = [];

	previousContext: Context | null | undefined;

	constructor() {
		super();
	}

	@methodOverride()
	onInit(): void {
		this.telemetry = new Telemetry();
		this.allRecommendedFields = [];
		this.internalModel = this.base.getView().getModel("internal");
		this.previousContext = undefined;
	}

	@methodOverride("_routing")
	async onAfterBinding(context: Context | null): Promise<void> {
		if (context) {
			const currentContextBasePath = context.getPath().split("/")[1];
			const previousContextBasePath = this.previousContext?.getPath().split("/")[1];
			//	console.log('current::', currentContextBasePath);
			//	console.log('previous', previousContextBasePath);
			this.rootContext = undefined;
			// use internal model because we have to use this information across the application for different instances.
			let isRecommendationEnabled = this.internalModel.getProperty("/isRecommendationEnabled");
			// onAfter binding is called for all contexts
			// but we do not need to call the isEnabled hook all the time
			// so check if recommendation enabled is already available
			this.previousContext = context;
			const rootContext = await this._getRootContext(context as ODataV4Context);
			if (rootContext) {
				if (isRecommendationEnabled === undefined) {
					isRecommendationEnabled = this.base.recommendations.isEnabled(rootContext);
					this.internalModel.setProperty("/isRecommendationEnabled", isRecommendationEnabled);
				}
				//	if(!this.previousContext) {

				//	}
				const isFclEnabled = this.base.getAppComponent()._isFclEnabled();
				const isFullScreen = isFclEnabled
					? (this.base.getAppComponent().getRootViewController() as FclController).getHelper().getCurrentUIState().isFullScreen
					: true;
				if (currentContextBasePath !== previousContextBasePath) {
					// different contexts/ OP
					//	console.log("run reset logic")
					this.tryResetRecommendations(rootContext as ODataV4Context);
					this.telemetry.resetData();
				}
				if (isFclEnabled && !isFullScreen) {
					return;
				}
			}
		}
	}

	private async _getRootContext(context: ODataV4Context): Promise<Context | undefined> {
		const programmingModel = TransactionHelper.getProgrammingModel(context);
		return CommonUtils.createRootContext(programmingModel, this.base.getView(), this.base.getAppComponent());
	}

	/**
	 * Clear all recommendations currently available on the UI.
	 * @public
	 */
	@publicExtension()
	public clearRecommendations(): void {
		const bindingContext = this.getView().getBindingContext();
		if (bindingContext) {
			recommendationHelper.clearRecommendations(this.base.getView(), bindingContext);
		}
	}

	/**
	 * Check if recommendations are enabled or not.
	 * @param _rootContext The root entity context
	 * @returns True if recommendation is enabled. False if recommendation is disabled.
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public isEnabled(_rootContext: Context): boolean {
		return false;
	}

	/**
	 * Method returns a boolean value indicating recommendation is enabled or not. In case called before
	 * the enablement check is completed, method will return false which is the default value.
	 * @returns True if recommendation is enabled else false.
	 */
	@publicExtension()
	@finalExtension()
	public isRecommendationEnabled(): boolean {
		return !!this.internalModel?.getProperty("/isRecommendationEnabled");
	}

	/**
	 * Fetch the recommendation for a specific context.
	 * @param _context The context that shall be considered when fetching recommendations
	 * @param _rootContext The root entity context
	 * @returns The recommendation entries
	 * @public
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public async fetchRecommendations(_context: ODataV4Context[], _rootContext?: Context): Promise<StandardRecommendationResponse[]> {
		return Promise.resolve([]);
	}

	/**
	 * Fetch the recommendations and apply them on the UI.
	 * @param currentContextsInfo Contexts Info that contains the context that shall be considered when fetching recommendations along with contextIdentifier
	 * @param considerOnlyNewContext Boolean property indicating Recommendation
	 * should be fetched only for new contexts with no recommendation fetch call
	 * @returns `true` if the recommendations were fetched and applied correctly
	 */
	@publicExtension()
	public async fetchAndApplyRecommendations(
		currentContextsInfo: RecommendationContextsInfo[],
		considerOnlyNewContext?: boolean
	): Promise<boolean> {
		let isSuccess = false;
		const sideEffects = this.base.getAppComponent().getSideEffectsService();
		const recommendationRegistry = sideEffects.getRecommendationsMapping();
		const filteredContextsInfo = currentContextsInfo.filter((contextInfo: RecommendationContextsInfo) => {
			return standardRecommendationHelper.checkIfRecommendationRoleExistsForContext(contextInfo, recommendationRegistry);
		});
		if (this.isRecommendationEnabled()) {
			const contextsInfo: RecommendationContextsInfo[] = considerOnlyNewContext
				? standardRecommendationHelper.getContextsWithNoRecommendations(filteredContextsInfo, this.internalModel)
				: filteredContextsInfo;
			const contexts: ODataV4Context[] = contextsInfo.map(
				(contextInfo: RecommendationContextsInfo) => contextInfo.context
			) as ODataV4Context[];
			if (contexts && contexts.length > 0) {
				try {
					const rootContext = await this._getRootContext(contexts[0]);
					const startTime = performance.now();
					const recommendationData = await this.base.recommendations.fetchRecommendations(contexts, rootContext);
					const endTime = performance.now();
					this.telemetry.updateResponseTimeInfo(endTime - startTime);
					if (recommendationData?.length) {
						this.updateAllRecommendedFields(recommendationData);
						this.telemetry.updateDataFromRecommendationResponse(recommendationData);
					} else {
						// if empty recommendations, then store it for telemetry purpose
						this.telemetry.increaseCount("numberOfTimesEmptyRecommendations");
					}
					// need to validate that the response is properly formatted
					isSuccess = this.applyRecommendation(recommendationData, contexts);
				} catch (e) {
					Log.error("There was an error fetching the recommendations", e as Error);
				}
			}

			this.storeRecommendationContexts(filteredContextsInfo);
		}

		return isSuccess;
	}

	/**
	 * Fetch the recommendations on field change and apply them on the UI.
	 * @param field The changed field.
	 * @param contextInfo ContextInfo which contains the context is only considered when fetching the recommendations along with contextIdentifier
	 * @returns `true` if the recommendation were fetched and applied correctly
	 */
	@publicExtension()
	public async fetchAndApplyRecommendationsOnFieldChange(field: Control, contextInfo: RecommendationContextsInfo): Promise<boolean> {
		const appComponent = this.base.getAppComponent();
		const isFieldRecommendationRelevant = appComponent.getSideEffectsService().checkIfFieldIsRecommendationRelevant(field);
		if (isFieldRecommendationRelevant) {
			//getting the visible targets on the UI and their respective contexts
			const targets = this.fetchTargets(true);
			const filteredRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
			//filtering the child contexts from the available contexts
			const recommendationContext = filteredRecommendationContexts.filter(function (filteredRecommendationContext) {
				if (
					(filteredRecommendationContext.context as ODataV4Context)
						.getPath()
						?.includes((contextInfo?.context as ODataV4Context).getPath())
				) {
					return filteredRecommendationContext;
				}
			});
			standardRecommendationHelper.clearIgnoredContexts(this.internalModel, (contextInfo?.context as ODataV4Context).getPath());
			return this.fetchAndApplyRecommendations(recommendationContext);
		} else {
			return false;
		}
	}

	/**
	 * Returns the filtered recommendations from passed recommendations and then based on it we either show the filtered recommendations or not show the Accept all Dialog if there are no recommendations.
	 * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
	 * @returns Promise
	 */
	@publicExtension()
	@extensible("AfterAsync")
	public async onBeforeAcceptRecommendations(_params: AcceptAllParams): Promise<void> {
		//do nothing
		return Promise.resolve(); //had to do this because of eslint error of not having await when the function is async
	}

	/**
	 * This function is responsible for accepting the recommendations.
	 * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
	 * @returns Promise which resolved to a Boolean value based on whether recommendations are accepted or not
	 */
	@publicExtension()
	@extensible(OverrideExecution.Instead)
	public async acceptRecommendations(_params: AcceptAllParams): Promise<boolean> {
		// the following code will be executed if there is no hook implementation i.e. for the new orchestration
		const promises = [];
		if (_params.recommendationData) {
			for (const recommendationData of _params.recommendationData) {
				if (recommendationData.context && recommendationData.propertyPath) {
					promises.push(
						recommendationData.context.setProperty(recommendationData.propertyPath, recommendationData.value, "$auto.abc")
					);
				}
			}
			await Promise.all(promises);
		}
		return true;
	}

	private applyRecommendation(recommendationResponses: StandardRecommendationResponse[], _context: ODataV4Context[]): boolean {
		standardRecommendationHelper.storeRecommendations(
			recommendationResponses,
			this.getView().getModel("internal") as JSONModel,
			_context
		);
		return true;
	}

	/**
	 * Stores the recommendation contexts.
	 * @param contextsInfo
	 */
	private storeRecommendationContexts(contextsInfo: RecommendationContextsInfo[]): void {
		const contextPaths: string[] = [];
		let recommendationContexts = this.internalModel.getProperty("/recommendationContexts") || [];
		contextsInfo.forEach((contextInfo: RecommendationContextsInfo) => {
			contextPaths.push((contextInfo.context as ODataV4Context).getPath());
		});

		recommendationContexts = recommendationContexts?.filter((recommendationContext: RecommendationContextsInfo) => {
			const context = recommendationContext?.context;
			if (context) {
				const contextPath = context.getPath();
				const index = contextPaths.indexOf(contextPath);
				if (index < 0) {
					// Existing context path is not found in the newly fetched recommendation & therefore don't do anything
					return true;
				} else if (recommendationContext.contextIdentifier) {
					// Existing context path is found. we try to update the contextInfo with the latest context
					// instead of outdated one
					contextsInfo[index].contextIdentifier = recommendationContext.contextIdentifier;
				}
			}
			return false;
		});

		this.internalModel.setProperty("/recommendationContexts", [...recommendationContexts, ...contextsInfo]);
	}

	/**
	 * Filters the contexts and only returns those that matches the contexts.
	 * @param targets
	 * @returns Returns the filtered recommendation relevant contexts
	 */
	private fetchFilteredRecommendationContexts(targets: string[]): RecommendationContextsInfo[] {
		const contextPaths: string[] = [];
		const filteredRecommendationContexts: RecommendationContextsInfo[] = [];
		for (const key of targets) {
			const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
			const recommendationContexts = (this.getView().getModel("internal") as JSONModel).getProperty("/recommendationContexts");
			recommendationContexts.forEach((contextInfo: RecommendationContextsInfo) => {
				const context = contextInfo.context;
				if ((context as ODataV4Context).getPath() == contextPathFromKey && !contextPaths.includes(contextPathFromKey)) {
					contextPaths.push(contextPathFromKey);
					filteredRecommendationContexts.push(contextInfo);
				}
			});
		}
		return filteredRecommendationContexts;
	}

	/**
	 * Fetches RecommendationData based on filtered targets.
	 * @param filteredTargets
	 * @returns RecommendationData
	 */
	private fetchFilteredRecommendationData(filteredTargets: string[]): RecommendationInfo {
		const filterRecommendationsData: RecommendationInfo = {};
		const recommendationData = this.getView().getModel("internal")?.getProperty("/recommendationsData");
		Object.keys(recommendationData).forEach((key: string) => {
			if (filteredTargets.includes(key)) {
				filterRecommendationsData[key] = Object.assign(recommendationData[key], {});
			}
		});
		return filterRecommendationsData;
	}

	/**
	 * Fetches the filtered targets.
	 * @param considerRecommendationContexts Passed as true when recommendation contexts should be considered instead of data
	 * @returns Array of Filtered targets
	 */
	private fetchTargets(considerRecommendationContexts?: boolean): string[] {
		const recommendationData = this.getView().getModel("internal")?.getProperty("/recommendationsData");
		if (recommendationData.version === null) {
			return [];
		}
		const isFclEnabled = this.base.getAppComponent()._isFclEnabled();
		const isFullScreen = isFclEnabled
			? (this.base.getAppComponent().getRootViewController() as FclController).getHelper().getCurrentUIState().isFullScreen
			: true;
		const isRecommendationAcceptable = (contextPath: string, key: string): boolean => {
			const splitPathAndCheckIfRecommendationAcceptable = (ctxtPath: string): boolean => {
				const pathArray = key.split(ctxtPath);
				const newPath = pathArray[1];
				let newPathArray = newPath.split("/");
				//here we check the path by splitting to decide whether to include recommendations or not in dialog
				if (newPathArray.length <= 3) {
					return true;
				} else {
					newPathArray = newPathArray.slice(2);
					return !newPathArray.some((value: string) => value.includes("("));
				}
			};
			if (isFclEnabled && !isFullScreen) {
				const rightMostContext = (this.base.getAppComponent().getRootViewController() as FclController).getRightmostContext();
				if (key.includes(rightMostContext?.getPath() as string)) {
					return splitPathAndCheckIfRecommendationAcceptable(rightMostContext?.getPath() as string);
				} else {
					return splitPathAndCheckIfRecommendationAcceptable(contextPath);
				}
			} else {
				return splitPathAndCheckIfRecommendationAcceptable(contextPath);
			}
		};

		const dataToBeFiltered = this.fetchDataToBeFiltered(recommendationData, considerRecommendationContexts);
		return (
			dataToBeFiltered.filter((key: string) => {
				return (
					key.includes(this.getView().getBindingContext()?.getPath() as string) &&
					isRecommendationAcceptable(this.getView().getBindingContext()?.getPath() as string, key)
				);
			}) || []
		);
	}

	/**
	 * Fetches the data to be filtered depending on the recommendationData.
	 * @param recommendationData
	 * @param considerRecommendationContexts Passed as true when recommendation contexts should be considered instead of data
	 * @returns Array of contextPaths to be filtered
	 */
	private fetchDataToBeFiltered(recommendationData: RecommendationInfo, considerRecommendationContexts: boolean | undefined): string[] {
		let dataToBeFiltered: string[] = [];
		// consider recommendationContexts for fetching the paths in case of field change so that contexts for which empty recommendation data is returned are also considered
		if (considerRecommendationContexts) {
			const recommendationContexts = this.getView().getModel("internal")?.getProperty("/recommendationContexts");
			recommendationContexts.forEach((recommendationContext: RecommendationContextsInfo) => {
				dataToBeFiltered.push((recommendationContext.context as ODataV4Context).getPath());
			});
		} else {
			// consider recommendationData in case of accept all dialog scenarios
			dataToBeFiltered = Object.keys(recommendationData).filter((key) => {
				return key !== "version" && key !== "keys";
			});
		}
		return dataToBeFiltered;
	}

	/**
	 * Overwrites AcceptAll Params based of recommendation data and contexts.
	 * @param filterRecommendationData
	 * @param filterRecommendationContexts
	 * @param params
	 */
	private adjustAcceptAllParams(
		filterRecommendationData: RecommendationInfo,
		filterRecommendationContexts: RecommendationContextsInfo[],
		params: AcceptAllParams
	): void {
		params.recommendationData = [];
		for (const key in filterRecommendationData) {
			if (filterRecommendationData[key].value || filterRecommendationData[key].text) {
				// In case there is no placeholder value or placeholder text then this recommendation is not relevant for Accept.
				// User needs to manually select the recommended value in these cases & therefore filter the same.
				const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
				const propertyPathFromKey = key.substring(key.lastIndexOf(")") + 2);
				const matchingContext = filterRecommendationContexts.filter(function (contextInfo) {
					if ((contextInfo?.context as ODataV4Context).getPath() === contextPathFromKey) {
						return true;
					}
				});
				if (
					matchingContext?.length > 0 &&
					standardRecommendationHelper.isRecommendationFieldNull(
						matchingContext[0].context as ODataV4Context,
						key,
						propertyPathFromKey
					)
				) {
					params.recommendationData.push({
						context: matchingContext[0].context,
						contextIdentifier: matchingContext[0].contextIdentifier,
						propertyPath: propertyPathFromKey,
						value: filterRecommendationData[key].value,
						text: filterRecommendationData[key].text
					});
				}
			}
		}
	}

	/**
	 * Fetches RecommendationInfo that contains targets, filterRecommendationData, filterRecommendationContexts.
	 * @returns Promise which resolves with AcceptallParams
	 */
	public async fetchAcceptAllParams(): Promise<AcceptAllParams> {
		const targets: string[] = this.fetchTargets();
		const filterRecommendationData = this.fetchFilteredRecommendationData(targets);
		const filterRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
		const params = {};
		this.adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params);
		await (this.getView().getController() as PageController).recommendations.onBeforeAcceptRecommendations(params);
		standardRecommendationHelper.addContextIdentifierText(params, this.getView()?.getBindingContext()?.getPath());
		this.dataToBeAccepted = (params as AcceptAllParams).recommendationData || [];
		return params;
	}

	/**
	 * Checks if recommendations exist or not.
	 * @returns Boolean value based on whether recommendations are present or not
	 */
	public checkIfRecommendationsExist(): boolean {
		const recommendationData = this.internalModel.getProperty("/recommendationsData") || {};
		return Object.keys(recommendationData).length !== 0;
	}

	/**
	 * This function will clear recommendation Data for a given context and all its children.
	 * @param contexts Context for which recommendation has to be cleared
	 */
	public ignoreRecommendationForContexts(contexts?: ODataV4Context[]): void {
		if (!contexts || !contexts.length) {
			const view = this.getView();
			const bindingContext = view.getBindingContext() as ODataV4Context;
			contexts = [bindingContext];
		}
		standardRecommendationHelper.ignoreRecommendationForContexts(contexts, this.internalModel);
	}

	private tryResetRecommendations(rootContext: ODataV4Context): void {
		standardRecommendationHelper.setCurrentRootContext(rootContext);
		// TODO: StandardRecommendationHelper stores all the recommendations for an instance of business object
		// meaning doesn't matter the recommendations are on the OP/SubOP. But the recommendations contexts here
		// is specific to this controller, SubOP controller will have its own recommendation contexts. Ideally it
		// should be cleared but this is not done here. This complete thing needs to be refactored
		this.internalModel.setProperty("/recommendationContexts", []);
		standardRecommendationHelper.resetRecommendations(this.internalModel);
	}

	/**
	 * This function will store the number of fields Accepted/Ignored when Save button is clicked, depending on which recommedation option was choosen Accept/Ignore and Save.
	 * @param recommendationOptionChoosen
	 */
	public async storeDataForTelemetry(recommendationOptionChoosen: undefined | RecommendationDialogDecision): Promise<void> {
		const rootContext = await this._getRootContext(this.getView().getBindingContext() as ODataV4Context);
		if (rootContext && this.base.recommendations.isEnabled(rootContext)) {
			if (recommendationOptionChoosen === RecommendationDialogDecision.Accept) {
				// increase accept count
				this.telemetry.updateData("numberOfFieldsAcceptedThroughAcceptButton", this.dataToBeAccepted.length);
			} else if (recommendationOptionChoosen === RecommendationDialogDecision.Ignore) {
				// increase ignore count
				this.telemetry.updateData("numberOfFieldsIgnoredThroughIgnoreButton", this.dataToBeAccepted.length);
			}
			this.telemetry.storeData(this.getView() as FEView);
		}
	}

	/**
	 * This function will update the count by 1 in telemetry data.
	 * @param key
	 */
	public increaseTelemetryDataCount(key: keyof RecommendationTelemetry): void {
		this.telemetry.increaseCount(key);
	}

	/**
	 * This function will update telemetry data for which option user chose when selecting a field value, as top/non-top recommendation or some other value.
	 * @param fieldPath
	 * @param selectedValue
	 */
	public updateTelemetryDataBasedOnUserSelection(fieldPath: string, selectedValue: string): void {
		this.telemetry.updateTelemetryDataBasedOnUserSelection(this.getView(), fieldPath, selectedValue);
	}

	/**
	 * This function will update the total number of fields recommended. If the field is already included in telemetry count then we do not include.
	 * This way we know the total number of unique fields recommended.
	 * @param recommendationData
	 */
	updateAllRecommendedFields(recommendationData: StandardRecommendationResponse[]): void {
		const viewBindingContextPath = (this.getView().getBindingContext() as Context).getPath();
		const newRecommendationsForCurrentContexts = recommendationData.filter(
			(response) => response["AIRecommendedFieldPath"]?.includes(viewBindingContextPath)
		);
		if (!this.allRecommendedFields) {
			this.allRecommendedFields = [];
		}
		newRecommendationsForCurrentContexts.forEach((response) => {
			const fieldPath = response["AIRecommendedFieldPath"];
			if (fieldPath) {
				if (!this.allRecommendedFields.includes(fieldPath)) {
					this.allRecommendedFields.push(fieldPath);
					this.telemetry.increaseCount("numberOfRecommendedFields");
				}
			}
		});
	}
}
