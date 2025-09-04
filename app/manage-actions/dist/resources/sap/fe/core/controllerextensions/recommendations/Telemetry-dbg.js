/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  let Telemetry = /*#__PURE__*/function () {
    function Telemetry() {
      this.resetData();
    }
    var _proto = Telemetry.prototype;
    _proto.updateData = function updateData(key, value) {
      this.telemetryData[key] = value;
    };
    _proto.increaseCount = function increaseCount(key) {
      return ++this.telemetryData[key];
    }

    /**
     * This function will update details about the recommendation calls like min, max or avarage time taken for a particular recommendation call.
     * @param timeTaken
     */;
    _proto.updateResponseTimeInfo = function updateResponseTimeInfo(timeTaken) {
      const totalRecommendationCalls = this.increaseCount("numberOfTimesRecommendationsFetched");

      // update max time taken
      if (timeTaken > this.telemetryData.maxTimeTakenToReceiveRecommendations) {
        this.updateData("maxTimeTakenToReceiveRecommendations", timeTaken);
      }
      // update min time taken
      if (this.telemetryData.minTimeTakenToReceiveRecommendations === 0 || timeTaken < this.telemetryData.minTimeTakenToReceiveRecommendations) {
        this.updateData("minTimeTakenToReceiveRecommendations", timeTaken);
      }
      const totalTimeTaken = this.telemetryData.totalTimeTaken + timeTaken;
      const avgTimeTaken = totalTimeTaken / totalRecommendationCalls;
      this.updateData("averageTimeTakenToReceiveRecommendations", avgTimeTaken);
      this.updateData("totalTimeTaken", totalTimeTaken);
    };
    _proto.resetData = function resetData() {
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
    };
    _proto.storeData = function storeData(view) {
      if (Object.keys(this.telemetryData).length) {
        // update telemetry information, as per data collected earlier, before sending to backend
        this.telemetryData["numberOfTimesFormatterNotCalled"] = this.telemetryData["totalNumberOfRecommendationsReceived"] - this.telemetryData["numberofTimesFormatterCalled"];
      }
      view.getController().telemetry.storeAction({
        type: "FE.Recommendations",
        parameters: this.telemetryData
      });
    };
    _proto.getData = function getData() {
      return this.telemetryData;
    }

    /**
     * This function will update telemetry data based on response we got.
     * @param recommendations Recommendations obtained from response.
     */;
    _proto.updateDataFromRecommendationResponse = function updateDataFromRecommendationResponse(recommendations) {
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
     */;
    _proto.updateTelemetryDataBasedOnUserSelection = function updateTelemetryDataBasedOnUserSelection(view, fieldPath, selectedValue) {
      const recommendationsData = (view?.getModel("internal")).getProperty("/recommendationsData");
      if (recommendationsData?.[fieldPath]) {
        const fieldRecommData = recommendationsData[fieldPath];
        const valueIndexInRecommendations = fieldRecommData.additionalValues?.findIndex(additionalValue => additionalValue.value === selectedValue);
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
    };
    return Telemetry;
  }();
  return Telemetry;
}, false);
//# sourceMappingURL=Telemetry-dbg.js.map
