/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define([], function () {
  "use strict";

  var _exports = {};
  const recommendationHelper = {
    /**
     * This function will take recommendation data for a field and sort it in descending order based on probability of the value.
     * @param incompletenessInfo The set of recommended data for a field
     */
    sortRecommendationsData(incompletenessInfo) {
      const recommendationDataSorted = incompletenessInfo.recommendations;
      recommendationDataSorted.sort((param1, param2) => {
        if (param1.probability && param2.probability) {
          if (param1.probability < param2.probability) {
            return 1;
          } else if (param1.probability > param2.probability) {
            return -1;
          }
        }
        return 0;
      });
      const info = incompletenessInfo;
      delete info.recommendations;
      info.additionalValues = recommendationDataSorted;
    },
    // The incompletenessinfo can be either for direct fields or fields through navigation property.
    // If the property is from the 1:n navigation then the information will be in the form of array of objects, where each object will be data
    // for a specific context in 1:n. The format of data for each object would be similar to that of fields at first level.
    // This may be the scenario for multiple levels i.e. 1:n navigation data inside another 1:n navigation and so on.
    // As we do not know the definite number of levels we use recursion to update data for all properties(for navigation properties as well, the data will
    // be nested but will follow same structure for each field info).
    // For reference of how data will look like, check CustomAction.js -> function setCustomRecommendation
    /**
     * This function will go through entire recommendation data for both direct fields and fields from navigation property and for each field update the recommendation info in descending order.
     * As with our use case we want recommendations that are in the order of probability for given value.
     * @param data Incompleteness info data
     */
    transformRecommendationsForInternalStorage(data) {
      if (data.hasOwnProperty("recommendations")) {
        this.sortRecommendationsData(data);
        return;
      } else if (Array.isArray(data)) {
        // we expect the data in array format for fields from 1:n navigation paths
        data.forEach(dataObj => {
          // for each entry in 1:n navigation we update the 'recommendations' object to sort in descending order of proability
          Object.values(dataObj).forEach(valObj => {
            if (typeof valObj === "object") {
              this.transformRecommendationsForInternalStorage(valObj);
            }
          });
        });
      } else {
        // for direct fields we check for the data value against the given Field and sort its recommendation data
        // from the given information
        Object.values(data).forEach(valObj => {
          if (typeof valObj === "object") {
            this.transformRecommendationsForInternalStorage(valObj);
          }
        });
      }
    },
    /**
     * This function check if we are in create mode, then explicity empty recommendations data from model.
     * Else if we are same page as before and after some actions then do not empty recommendations data.
     * @param view
     * @param inputBindingContext Context
     */
    clearRecommendations: (view, inputBindingContext) => {
      const internalModel = view.getModel("internal");
      const currentContext = internalModel.getProperty("/currentCtxt");
      const createMode = view.getBindingContext("pageInternal")?.getProperty("createMode");
      if (currentContext?.getPath() !== inputBindingContext?.getPath() || createMode === true) {
        internalModel.setProperty("/recommendationsData", {});
      }
    }
  };
  _exports.recommendationHelper = recommendationHelper;
  return _exports;
}, false);
//# sourceMappingURL=RecommendationHelper-dbg.js.map
