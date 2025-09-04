import type { FEView } from "sap/fe/core/BaseController";
import type View from "sap/ui/core/mvc/View";
import type JSONModel from "sap/ui/model/json/JSONModel";
import type { RecommendationInfo, StandardRecommendationResponse } from "../../helpers/StandardRecommendationHelper";
import type { RecommendationTelemetry } from "../../services/TelemetryServiceFactory";

class Telemetry {
	private telemetryData!: RecommendationTelemetry;

	public constructor() {
		this.resetData();
	}

	public updateData(key: keyof RecommendationTelemetry, value: number): void {
		this.telemetryData[key] = value;
	}

	public increaseCount(key: keyof RecommendationTelemetry): number {
		return ++this.telemetryData[key];
	}

	/**
	 * This function will update details about the recommendation calls like min, max or avarage time taken for a particular recommendation call.
	 * @param timeTaken
	 */
	public updateResponseTimeInfo(timeTaken: number): void {
		const totalRecommendationCalls = this.increaseCount("numberOfTimesRecommendationsFetched");

		// update max time taken
		if (timeTaken > this.telemetryData.maxTimeTakenToReceiveRecommendations) {
			this.updateData("maxTimeTakenToReceiveRecommendations", timeTaken);
		}
		// update min time taken
		if (
			this.telemetryData.minTimeTakenToReceiveRecommendations === 0 ||
			timeTaken < this.telemetryData.minTimeTakenToReceiveRecommendations
		) {
			this.updateData("minTimeTakenToReceiveRecommendations", timeTaken);
		}

		const totalTimeTaken = this.telemetryData.totalTimeTaken + timeTaken;
		const avgTimeTaken = totalTimeTaken / totalRecommendationCalls;
		this.updateData("averageTimeTakenToReceiveRecommendations", avgTimeTaken);
		this.updateData("totalTimeTaken", totalTimeTaken);
	}

	public resetData(): void {
		this.telemetryData = {
			numberOfTimesRecommendationsFetched: 0,
			maxTimeTakenToReceiveRecommendations: 0,
			minTimeTakenToReceiveRecommendations: 0,
			averageTimeTakenToReceiveRecommendations: 0,
			numberOfTimesNoPlaceholderIsShownOnUI: 0,
			numberOfRecommendedFields: 0,
			numberOfTimesTopRecommendationsSelected: 0,
			numberOfTimesNonTopRecommendationsSelected: 0,
			numberOfTimesNonRecommendedValueWasSelected: 0,
			numberOfFieldsAcceptedThroughAcceptButton: 0,
			numberOfFieldsIgnoredThroughIgnoreButton: 0,
			numberOfTimesEmptyRecommendations: 0,
			numberofTimesFormatterCalled: 0,
			totalNumberOfRecommendationsReceived: 0,
			numberOfTimesFormatterNotCalled: 0,
			totalTimeTaken: 0
		};
	}

	public storeData(view: FEView): void {
		if (Object.keys(this.telemetryData).length) {
			// update telemetry information, as per data collected earlier, before sending to backend
			this.telemetryData["numberOfTimesFormatterNotCalled"] =
				this.telemetryData["totalNumberOfRecommendationsReceived"] - this.telemetryData["numberofTimesFormatterCalled"];
		}
		view.getController().telemetry.storeAction({
			type: "FE.Recommendations",
			parameters: this.telemetryData
		});
	}

	public getData(): RecommendationTelemetry {
		return this.telemetryData;
	}

	/**
	 * This function will update telemetry data based on response we got.
	 * @param recommendations Recommendations obtained from response.
	 */
	public updateDataFromRecommendationResponse(recommendations: StandardRecommendationResponse[]): void {
		for (let i = 0; i < recommendations.length; i++) {
			const recommendation = recommendations[i];
			const target = recommendation.AIRecommendedFieldPath;
			if (!(recommendation.AIRecommendedFieldValue && recommendation.AIRecommendedFieldDescription)) {
				this.increaseCount("numberOfTimesNoPlaceholderIsShownOnUI");
			}
			if (target) {
				if (recommendation._AIAltvRecmddFldVals?.length) {
					this.increaseCount("totalNumberOfRecommendationsReceived");
				}
			}
		}
	}

	/**
	 * This function will update data in telemetry as per top/non-top recommendation value was chosen or if non recommended value was chosen.
	 * @param view
	 * @param fieldPath
	 * @param selectedValue
	 */
	public updateTelemetryDataBasedOnUserSelection(view: View, fieldPath: string, selectedValue: string): void {
		const recommendationsData = (view?.getModel("internal") as JSONModel).getProperty("/recommendationsData") as
			| RecommendationInfo
			| undefined;
		if (recommendationsData?.[fieldPath]) {
			const fieldRecommData = recommendationsData[fieldPath];
			const valueIndexInRecommendations = fieldRecommData.additionalValues?.findIndex(
				(additionalValue) => additionalValue.value === selectedValue
			);

			if (selectedValue == fieldRecommData.value) {
				// top recommendation was selected then store the data in telemetry
				this.increaseCount("numberOfTimesTopRecommendationsSelected");
			} else if (valueIndexInRecommendations !== -1) {
				// some other recommendation was selected
				this.increaseCount("numberOfTimesNonTopRecommendationsSelected");
			} else {
				// selected value is not from recommendations
				this.increaseCount("numberOfTimesNonRecommendedValueWasSelected");
			}
		}
	}
}
export default Telemetry;
