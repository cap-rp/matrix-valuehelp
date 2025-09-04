import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class } from "sap/fe/base/ClassSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import Button from "sap/m/Button";
import CustomListItem from "sap/m/CustomListItem";
import Dialog from "sap/m/Dialog";
import FlexItemData from "sap/m/FlexItemData";
import HBox from "sap/m/HBox";
import List from "sap/m/List";
import Text from "sap/m/Text";
import Toolbar from "sap/m/Toolbar";
import ToolbarSpacer from "sap/m/ToolbarSpacer";
import ManagedObject from "sap/ui/base/ManagedObject";
import type UI5Element from "sap/ui/core/Element";
import { ValueState } from "sap/ui/core/library";
import type View from "sap/ui/core/mvc/View";
import Sorter from "sap/ui/model/Sorter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { EventHandler } from "types/extension_types";
import type BaseController from "../../BaseController";
import type PageController from "../../PageController";
import type ResourceModel from "../../ResourceModel";
import type { AcceptAllParams, RecommendationData } from "../../controllerextensions/Recommendations";
import valueFormatters from "../../formatters/ValueFormatter";
import type { RecommendationContextsInfo } from "../../helpers/StandardRecommendationHelper";
import { standardRecommendationHelper, type StandardRecommendationDataType } from "../../helpers/StandardRecommendationHelper";
import type FclController from "../../rootView/Fcl.controller";

export enum RecommendationDialogDecision {
	Accept = "Accept_Recommendations",
	Ignore = "Ignore_Recommendations",
	Continue = "Continue_Editing",
	Skipped = "Skipped"
}

@defineUI5Class("sap.fe.core.controls.Recommendations.ConfirmRecommendationDialog")
export class ConfirmRecommendationDialog extends ManagedObject {
	constructor(props: PropertiesOf<ConfirmRecommendationDialog>) {
		super(props);
		this.view = props.view as View;
		this.confirmRecommendationDialogResourceModel = getResourceModel(this.view);
	}

	@defineReference()
	confirmRecommendationDialog!: Ref<Dialog>;

	public view!: View;

	private confirmRecommendationDialogResourceModel!: ResourceModel;

	protected key!: string;

	private isSave!: boolean;

	private acceptAllParams!: AcceptAllParams;

	/**
	 * Resolves the promise with the selected dialog list option
	 */
	private promiseResolve!: Function;

	/**
	 * Rejects the promise of open dialog
	 */
	public promiseReject!: Function;

	/**
	 *
	 * @returns Recommendation Data
	 */

	public getOpenRecommendations(): RecommendationData[] {
		const visibleContextPaths = this.getVisiblePageContextPaths();
		const openRecommendations = this.getOpenRecommendationsForVisibleContextPaths(visibleContextPaths);
		const recommendations: RecommendationData[] = [];
		if (openRecommendations.length > 0) {
			openRecommendations.forEach((recommendation) => {
				const context = this.view.getBindingContext();
				const propertyPath: string = recommendation.propertyPath ? recommendation.propertyPath : "";
				if (
					context?.getProperty(propertyPath) === null ||
					context?.getProperty(propertyPath) === undefined ||
					context?.getProperty(propertyPath) == ""
				) {
					recommendations.push(recommendation);
				}
			});
		}
		return recommendations;
		// check if we have recommendations from the current page in the localAnnotationModel
		// return open recommendations.
	}

	/**
	 *
	 * @returns Collection of context paths
	 */

	public getVisiblePageContextPaths(): (string | undefined)[] {
		const visiblePageContextPaths = [this.view.getBindingContext()?.getPath()];
		const controller = this.view.getController() as BaseController;
		const fclController = controller.getAppComponent().getRootViewController() as FclController;
		const isFclEnabled = controller.getAppComponent()._isFclEnabled();
		const isFullScreen = isFclEnabled ? fclController.getHelper().getCurrentUIState().isFullScreen : true;
		if (isFclEnabled && !isFullScreen) {
			const rightMostContext = fclController.getRightmostContext();
			visiblePageContextPaths.push(rightMostContext?.getPath());
		}
		return visiblePageContextPaths;
	}

	/**
	 *
	 * @param contextPaths Paths of the contexts
	 * @returns RecommendationData for visible contexts
	 */
	public getOpenRecommendationsForVisibleContextPaths(contextPaths: (string | undefined)[]): RecommendationData[] {
		const openRecommendations: RecommendationData[] = [];
		if (contextPaths.length > 0) {
			const localAnnotationModel = (this.view.getModel() as ODataModel).getLocalAnnotationModel();
			// check context paths in local annotation models which match to
			// 1. current page and
			// 2. immediate children of the current page
			// Need to consider also immediate children
			// iterate over all keys
			contextPaths.forEach((contextPath) => {
				if (contextPath !== undefined) {
					const localAnnotationObject = localAnnotationModel.getObject(contextPath);
					if (localAnnotationObject) {
						const annotationObject = localAnnotationObject;
						/**
						 * The local annotation object will be of the following structure :
						 * {
						 * "PropertyName@$ui5.fe.recommendations.placeholderDescription": Value
						 * "PropertyName@$ui5.fe.recommendations.placeholderValue": Value
						 * "PropertyName@$ui5.fe.recommendations.typeAheadValues": Value
						 * PropertyName: {
						 * 		"PropertyName@$ui5.fe.recommendations.placeholderDescription": Value
						 * 		"PropertyName@$ui5.fe.recommendations.placeholderValue": Value
						 * 		"PropertyName@$ui5.fe.recommendations.typeAheadValues": Value
						 * 		recommendationContext:{ context }
						 * 	 }
						 * recommendationContext:{ context }
						 * }
						 *
						 * so in order to get the recommendations as per each context - for parent/child entities we need to iterate over each keys recursively in the fetchLocalAnnotationObject function,
						 * form the corresponding structure and then send it for getting the recommendations accordingly.
						 */
						this.fetchLocalAnnotationObject(annotationObject, openRecommendations);
					}
				}
			});
		}
		return openRecommendations;
	}

	/**
	 *
	 * @param annotationObject
	 * @param openRecommendations Recommendation Data
	 */

	private fetchLocalAnnotationObject(annotationObject: Record<string, unknown>, openRecommendations: RecommendationData[]): void {
		if (annotationObject["recommendationContext"]) {
			const recommendationObject: Record<string, unknown> = {};
			recommendationObject["recommendationContext"] = annotationObject["recommendationContext"] as ODataV4Context;
			for (const currentKey in annotationObject) {
				const currentValue = annotationObject[currentKey];
				if (currentValue) {
					if ((currentValue as Record<string, ODataV4Context>)["recommendationContext"]) {
						this.fetchLocalAnnotationObject(annotationObject[currentKey] as Record<string, unknown>, openRecommendations);
					} else if (
						currentKey.includes("@$ui5.fe.recommendations.placeholderValue") ||
						currentKey.includes("@$ui5.fe.recommendations.placeholderDescription") ||
						currentKey.includes("@$ui5.fe.recommendations.typeAheadValues")
					) {
						recommendationObject[currentKey] = currentValue;
					}
				}
			}
			const keys = MetaModelConverter.getInvolvedDataModelObjectEntityKeys(
				recommendationObject["recommendationContext"] as ODataV4Context
			);
			(recommendationObject["recommendationContext"] as RecommendationContextsInfo).contextIdentifier = keys["semanticKeys"]
				? keys["semanticKeys"]
				: keys["technicalKeys"];
			this.getOpenRecommendationsForContext(
				recommendationObject,
				recommendationObject["recommendationContext"] as ODataV4Context,
				openRecommendations
			);
		}
	}
	/**
	 *
	 * @param contextData The context data object for recommendations
	 * @param recommendationContext The recommendation context
	 * @param openRecommendations RecommendationData
	 * @param contextKey Context Key
	 */

	private getOpenRecommendationsForContext(
		contextData: Record<string, unknown>,
		recommendationContext: ODataV4Context,
		openRecommendations: RecommendationData[],
		contextKey = ""
	): void {
		for (const currentKey in contextData) {
			const currentValue = contextData[currentKey];
			if (currentValue) {
				const currentValueIsContext =
					(currentValue as ODataV4Context).isA && (currentValue as ODataV4Context).isA("sap.ui.model.odata.v4.Context");
				if (currentKey.includes("@$ui5.fe.recommendations.placeholderValue")) {
					const propertyPath = currentKey.split("@$ui5.fe.recommendations.placeholderValue")[0];
					const openRecommendation: RecommendationData = {
						context: recommendationContext,
						propertyPath: contextKey ? `${contextKey}/${propertyPath}` : propertyPath,
						value: currentValue as string,
						contextIdentifier: (recommendationContext as RecommendationContextsInfo).contextIdentifier,
						contextIdentifierText: []
					};
					const description = contextData[`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`];
					if (description) {
						openRecommendation.text = description as string;
					}
					openRecommendations.push(openRecommendation);
				} else if (typeof currentValue === "object" && !Array.isArray(currentValue) && !currentValueIsContext) {
					this.getOpenRecommendationsForContext(
						currentValue as Record<string, unknown>,
						recommendationContext,
						openRecommendations,
						currentKey
					);
				}
			}
		}
	}

	/**
	 * Opens the confirm recommendations dialog.
	 * @param isSave Boolean flag which would be set to true if we are saving the document and would be false if we do apply changes
	 * @returns Promise which would resolve with RecommendationDialogDecision (Accept, Ignore, Continue, Skipped)
	 */
	public async open(isSave: boolean): Promise<RecommendationDialogDecision | undefined> {
		// check for built-in recommendations
		const openRecommendations = this.getOpenRecommendations();
		if (openRecommendations.length > 0) {
			standardRecommendationHelper.addContextIdentifierText(
				{ recommendationData: openRecommendations },
				this.view.getBindingContext()?.getPath()
			);
			this.acceptAllParams = {
				recommendationData: openRecommendations
			};
		} else {
			// if built-in recommendations are not found then check for legacy recommendations.
			const legacyRecommendationsExist = (this.view?.getController() as PageController).recommendations.checkIfRecommendationsExist();
			if (legacyRecommendationsExist) {
				this.acceptAllParams = await (this.view?.getController() as PageController).recommendations.fetchAcceptAllParams();
			} else {
				return undefined;
			}
		}
		const acceptModel = this.getAcceptAllModel();
		this.view.setModel(acceptModel, "_acceptDialogModel");
		if (!acceptModel.getData().items?.length) {
			return RecommendationDialogDecision.Skipped;
		}
		this.isSave = isSave;
		const dialog = this.getContent();
		dialog?.setEscapeHandler(this.onContinueEditing.bind(this));
		this.view.addDependent(dialog as UI5Element);
		dialog?.open();
		return new Promise((resolve, reject) => {
			this.promiseResolve = resolve;
			this.promiseReject = reject;
		});
	}

	/**
	 * Handler to close the confirmRecommendation dialog.
	 *
	 */
	public close(): void {
		this.confirmRecommendationDialog.current?.close();
		this.confirmRecommendationDialog.current?.destroy();
	}

	/**
	 * Handler for Accept and Save button.
	 */
	private async onAcceptAndSave(): Promise<void> {
		try {
			const isAccepted = await (this.view?.getController() as PageController).recommendations.acceptRecommendations(
				this.acceptAllParams
			);
			if (!isAccepted) {
				this.promiseReject("Accept Failed");
			}
			this.promiseResolve(RecommendationDialogDecision.Accept);
		} catch {
			Log.error("Accept Recommendations Failed");
			this.promiseReject("Accept Failed");
		} finally {
			this.close();
		}
	}

	/**
	 * Handler for Ignore and Save button.
	 */
	private onIgnoreAndSave(): void {
		(this.view?.getController() as PageController).recommendations.ignoreRecommendationForContexts();
		this.promiseResolve(RecommendationDialogDecision.Ignore);
		this.close();
	}

	/**
	 * Handler for Continue Editing button.
	 */
	private onContinueEditing(): void {
		this.promiseResolve(RecommendationDialogDecision.Continue);
		this.close();
	}

	/**
	 * Gets the label or name of the Field based on its property path.
	 * @param targetPath
	 * @returns Returns the label of the Field.
	 */
	private getFieldName(targetPath: string): string {
		const involvedDataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath<Property>(
			targetPath,
			this.view?.getBindingContext()?.getModel()?.getMetaModel() as ODataMetaModel
		);
		return (
			involvedDataModelObject?.targetObject?.annotations?.Common?.Label?.toString() ||
			targetPath.split("/")[targetPath.split("/").length - 1]
		);
	}

	/**
	 * Fetches text for recommendation based on display mode.
	 * @param recommendation
	 * @param displayMode
	 * @returns Text for a recommendation
	 */
	private getText(recommendation: StandardRecommendationDataType, displayMode: string): string {
		if (recommendation.text || recommendation.value) {
			switch (displayMode) {
				case "Description":
					return recommendation.text!;
				case "DescriptionValue":
					return valueFormatters.formatWithBrackets(recommendation.text, recommendation.value);
				case "ValueDescription":
					return valueFormatters.formatWithBrackets(recommendation.value, recommendation.text);
				case "Value":
					return recommendation.value!;
			}
		}
		return recommendation.value || "";
	}

	/**
	 * Returns Button with given text, type and pressHandler.
	 * @param text Text for the button
	 * @param type Type of the button
	 * @param pressHandler Press Handler for the button
	 * @returns Button with the given settings
	 */
	private getButton(text: string, type: string, pressHandler: EventHandler): Button {
		return (
			<Button text={text} type={type} width={"auto"} press={pressHandler}>
				{{
					layoutData: (
						<>
							<FlexItemData minWidth={"100%"}></FlexItemData>
						</>
					)
				}}
			</Button>
		);
	}

	/**
	 * Returns Footer with Buttons.
	 * @returns Footer
	 */

	private getFooter(): Toolbar {
		return (
			<Toolbar>
				{{
					content: (
						<>
							<ToolbarSpacer />
							{this.getButton(
								this._getDialogButtonText(this.isSave, RecommendationDialogDecision.Accept),
								"Emphasized",
								this.onAcceptAndSave.bind(this)
							)}
							{this.getButton(
								this._getDialogButtonText(this.isSave, RecommendationDialogDecision.Ignore),
								"Ghost",
								this.onIgnoreAndSave.bind(this)
							)}
							{this.getButton(
								this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_CONTINUE_EDITING"),
								"Ghost",
								this.onContinueEditing.bind(this)
							)}
						</>
					)
				}}
			</Toolbar>
		);
	}

	private _getDialogButtonText(save: boolean, recommendationDialogDecision: RecommendationDialogDecision): string {
		const isAcceptButton: boolean = recommendationDialogDecision === RecommendationDialogDecision.Accept;
		if (save) {
			if (!this.view.getBindingContext()?.getObject().HasActiveEntity) {
				return isAcceptButton
					? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_CREATE")
					: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_CREATE");
			}
			return isAcceptButton
				? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_SAVE")
				: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_SAVE");
		} else {
			return isAcceptButton
				? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT")
				: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE");
		}
	}

	/**
	 * This method created a JSON Model for the accept all dialog data.
	 * @returns The JSON Model for accept all dialog.
	 */
	getAcceptAllModel(): JSONModel {
		const acceptModel = new JSONModel();
		const items = [];
		for (const recommendationData of this.acceptAllParams?.recommendationData || []) {
			const entityNameLabel = standardRecommendationHelper.getEntityName(recommendationData.context as ODataV4Context) || "";

			const identifierTexts =
				recommendationData.contextIdentifierText && recommendationData.contextIdentifierText.length > 0
					? `${entityNameLabel} (${recommendationData.contextIdentifierText})`
					: entityNameLabel;

			if (recommendationData.value || recommendationData.text) {
				const targetPath = recommendationData.context?.getPath() + "/" + recommendationData.propertyPath;
				const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(
					targetPath,
					this.view?.getBindingContext()?.getModel()?.getMetaModel() as ODataMetaModel
				);
				const listData = {
					fieldName: this.getFieldName(targetPath).valueOf(),
					fieldValue: this.getText(recommendationData, displayMode),
					identifierTexts: identifierTexts
				};
				items.push(listData);
			}
		}
		acceptModel.setData({ items: items });
		return acceptModel;
	}

	/**
	 * This method groups the contexts according to the identifier texts.
	 * @param context The context of the item
	 * @returns The text of the group
	 */
	getGroup(context: ODataV4Context): string {
		return context.getProperty("identifierTexts");
	}

	/**
	 * This function returns the message to be shown in the accept dialog.
	 * @returns A message with the desired text.
	 */
	getMessage(): Text {
		const acceptAllData = (this.view.getModel("_acceptDialogModel") as JSONModel)?.getData()?.items;
		const messageText =
			acceptAllData.length > 1
				? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT", [acceptAllData.length])
				: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT_SINGULAR");
		return <Text text={messageText} />;
	}

	/**
	 * This method creates the content for the dialog.
	 * @returns A list as content of the dialog.
	 */
	getDialogContent(): List {
		return (
			<List items={{ model: "_acceptDialogModel", path: "/items", sorter: new Sorter("identifierTexts", false, this.getGroup) }}>
				<CustomListItem>
					<HBox class="sapUiSmallMarginBegin sapUiTinyMargin">
						<Text text="{_acceptDialogModel>fieldName}: {_acceptDialogModel>fieldValue}" />
					</HBox>
				</CustomListItem>
			</List>
		);
	}

	/**
	 * The building block render function.
	 * @returns An XML-based string
	 */
	getContent(): Dialog {
		return (
			<Dialog
				title={this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TITLE")}
				state={ValueState.Information}
				type={"Message"}
				ref={this.confirmRecommendationDialog}
				resizable={"true"}
				contentWidth={"35rem"}
			>
				{{
					content: (
						<>
							{this.getMessage()}
							{this.getDialogContent()}
						</>
					),
					footer: <>{this.getFooter()}</>
				}}
			</Dialog>
		) as Dialog;
	}
}
