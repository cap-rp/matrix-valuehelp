/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/RecommendationHelper", "sap/fe/core/helpers/StandardRecommendationHelper", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../CommonUtils", "./editFlow/TransactionHelper", "../controls/Recommendations/ConfirmRecommendationDialog", "./recommendations/Telemetry"], function (Log, ClassSupport, RecommendationHelper, StandardRecommendationHelper, ControllerExtension, OverrideExecution, CommonUtils, TransactionHelper, ConfirmRecommendationDialog, Telemetry) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _class, _class2;
  var _exports = {};
  var RecommendationDialogDecision = ConfirmRecommendationDialog.RecommendationDialogDecision;
  var standardRecommendationHelper = StandardRecommendationHelper.standardRecommendationHelper;
  var recommendationHelper = RecommendationHelper.recommendationHelper;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  let Recommendations = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Recommendations"), _dec2 = methodOverride(), _dec3 = methodOverride("_routing"), _dec4 = publicExtension(), _dec5 = publicExtension(), _dec6 = extensible(OverrideExecution.Instead), _dec7 = publicExtension(), _dec8 = finalExtension(), _dec9 = publicExtension(), _dec10 = extensible(OverrideExecution.Instead), _dec11 = publicExtension(), _dec12 = publicExtension(), _dec13 = publicExtension(), _dec14 = extensible("AfterAsync"), _dec15 = publicExtension(), _dec16 = extensible(OverrideExecution.Instead), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function Recommendations() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      // the data shown in Accept/Ignore dialog of Recommendations
      _this.dataToBeAccepted = [];
      return _this;
    }
    _exports = Recommendations;
    _inheritsLoose(Recommendations, _ControllerExtension);
    var _proto = Recommendations.prototype;
    _proto.onInit = function onInit() {
      this.telemetry = new Telemetry();
      this.allRecommendedFields = [];
      this.internalModel = this.base.getView().getModel("internal");
      this.previousContext = undefined;
    };
    _proto.onAfterBinding = async function onAfterBinding(context) {
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
        const rootContext = await this._getRootContext(context);
        if (rootContext) {
          if (isRecommendationEnabled === undefined) {
            isRecommendationEnabled = this.base.recommendations.isEnabled(rootContext);
            this.internalModel.setProperty("/isRecommendationEnabled", isRecommendationEnabled);
          }
          //	if(!this.previousContext) {

          //	}
          const isFclEnabled = this.base.getAppComponent()._isFclEnabled();
          const isFullScreen = isFclEnabled ? this.base.getAppComponent().getRootViewController().getHelper().getCurrentUIState().isFullScreen : true;
          if (currentContextBasePath !== previousContextBasePath) {
            // different contexts/ OP
            //	console.log("run reset logic")
            this.tryResetRecommendations(rootContext);
            this.telemetry.resetData();
          }
          if (isFclEnabled && !isFullScreen) {
            return;
          }
        }
      }
    };
    _proto._getRootContext = async function _getRootContext(context) {
      const programmingModel = TransactionHelper.getProgrammingModel(context);
      return CommonUtils.createRootContext(programmingModel, this.base.getView(), this.base.getAppComponent());
    }

    /**
     * Clear all recommendations currently available on the UI.
     * @public
     */;
    _proto.clearRecommendations = function clearRecommendations() {
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
     */;
    _proto.isEnabled = function isEnabled(_rootContext) {
      return false;
    }

    /**
     * Method returns a boolean value indicating recommendation is enabled or not. In case called before
     * the enablement check is completed, method will return false which is the default value.
     * @returns True if recommendation is enabled else false.
     */;
    _proto.isRecommendationEnabled = function isRecommendationEnabled() {
      return !!this.internalModel?.getProperty("/isRecommendationEnabled");
    }

    /**
     * Fetch the recommendation for a specific context.
     * @param _context The context that shall be considered when fetching recommendations
     * @param _rootContext The root entity context
     * @returns The recommendation entries
     * @public
     */;
    _proto.fetchRecommendations = async function fetchRecommendations(_context, _rootContext) {
      return Promise.resolve([]);
    }

    /**
     * Fetch the recommendations and apply them on the UI.
     * @param currentContextsInfo Contexts Info that contains the context that shall be considered when fetching recommendations along with contextIdentifier
     * @param considerOnlyNewContext Boolean property indicating Recommendation
     * should be fetched only for new contexts with no recommendation fetch call
     * @returns `true` if the recommendations were fetched and applied correctly
     */;
    _proto.fetchAndApplyRecommendations = async function fetchAndApplyRecommendations(currentContextsInfo, considerOnlyNewContext) {
      let isSuccess = false;
      const sideEffects = this.base.getAppComponent().getSideEffectsService();
      const recommendationRegistry = sideEffects.getRecommendationsMapping();
      const filteredContextsInfo = currentContextsInfo.filter(contextInfo => {
        return standardRecommendationHelper.checkIfRecommendationRoleExistsForContext(contextInfo, recommendationRegistry);
      });
      if (this.isRecommendationEnabled()) {
        const contextsInfo = considerOnlyNewContext ? standardRecommendationHelper.getContextsWithNoRecommendations(filteredContextsInfo, this.internalModel) : filteredContextsInfo;
        const contexts = contextsInfo.map(contextInfo => contextInfo.context);
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
            Log.error("There was an error fetching the recommendations", e);
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
     */;
    _proto.fetchAndApplyRecommendationsOnFieldChange = async function fetchAndApplyRecommendationsOnFieldChange(field, contextInfo) {
      const appComponent = this.base.getAppComponent();
      const isFieldRecommendationRelevant = appComponent.getSideEffectsService().checkIfFieldIsRecommendationRelevant(field);
      if (isFieldRecommendationRelevant) {
        //getting the visible targets on the UI and their respective contexts
        const targets = this.fetchTargets(true);
        const filteredRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
        //filtering the child contexts from the available contexts
        const recommendationContext = filteredRecommendationContexts.filter(function (filteredRecommendationContext) {
          if (filteredRecommendationContext.context.getPath()?.includes((contextInfo?.context).getPath())) {
            return filteredRecommendationContext;
          }
        });
        standardRecommendationHelper.clearIgnoredContexts(this.internalModel, (contextInfo?.context).getPath());
        return this.fetchAndApplyRecommendations(recommendationContext);
      } else {
        return false;
      }
    }

    /**
     * Returns the filtered recommendations from passed recommendations and then based on it we either show the filtered recommendations or not show the Accept all Dialog if there are no recommendations.
     * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
     * @returns Promise
     */;
    _proto.onBeforeAcceptRecommendations = async function onBeforeAcceptRecommendations(_params) {
      //do nothing
      return Promise.resolve(); //had to do this because of eslint error of not having await when the function is async
    }

    /**
     * This function is responsible for accepting the recommendations.
     * @param _params Params object containing recommendationData property which is an array of objects containing context, propertyPath, value and text for a recommendation
     * @returns Promise which resolved to a Boolean value based on whether recommendations are accepted or not
     */;
    _proto.acceptRecommendations = async function acceptRecommendations(_params) {
      // the following code will be executed if there is no hook implementation i.e. for the new orchestration
      const promises = [];
      if (_params.recommendationData) {
        for (const recommendationData of _params.recommendationData) {
          if (recommendationData.context && recommendationData.propertyPath) {
            promises.push(recommendationData.context.setProperty(recommendationData.propertyPath, recommendationData.value, "$auto.abc"));
          }
        }
        await Promise.all(promises);
      }
      return true;
    };
    _proto.applyRecommendation = function applyRecommendation(recommendationResponses, _context) {
      standardRecommendationHelper.storeRecommendations(recommendationResponses, this.getView().getModel("internal"), _context);
      return true;
    }

    /**
     * Stores the recommendation contexts.
     * @param contextsInfo
     */;
    _proto.storeRecommendationContexts = function storeRecommendationContexts(contextsInfo) {
      const contextPaths = [];
      let recommendationContexts = this.internalModel.getProperty("/recommendationContexts") || [];
      contextsInfo.forEach(contextInfo => {
        contextPaths.push(contextInfo.context.getPath());
      });
      recommendationContexts = recommendationContexts?.filter(recommendationContext => {
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
     */;
    _proto.fetchFilteredRecommendationContexts = function fetchFilteredRecommendationContexts(targets) {
      const contextPaths = [];
      const filteredRecommendationContexts = [];
      for (const key of targets) {
        const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
        const recommendationContexts = this.getView().getModel("internal").getProperty("/recommendationContexts");
        recommendationContexts.forEach(contextInfo => {
          const context = contextInfo.context;
          if (context.getPath() == contextPathFromKey && !contextPaths.includes(contextPathFromKey)) {
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
     */;
    _proto.fetchFilteredRecommendationData = function fetchFilteredRecommendationData(filteredTargets) {
      const filterRecommendationsData = {};
      const recommendationData = this.getView().getModel("internal")?.getProperty("/recommendationsData");
      Object.keys(recommendationData).forEach(key => {
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
     */;
    _proto.fetchTargets = function fetchTargets(considerRecommendationContexts) {
      const recommendationData = this.getView().getModel("internal")?.getProperty("/recommendationsData");
      if (recommendationData.version === null) {
        return [];
      }
      const isFclEnabled = this.base.getAppComponent()._isFclEnabled();
      const isFullScreen = isFclEnabled ? this.base.getAppComponent().getRootViewController().getHelper().getCurrentUIState().isFullScreen : true;
      const isRecommendationAcceptable = (contextPath, key) => {
        const splitPathAndCheckIfRecommendationAcceptable = ctxtPath => {
          const pathArray = key.split(ctxtPath);
          const newPath = pathArray[1];
          let newPathArray = newPath.split("/");
          //here we check the path by splitting to decide whether to include recommendations or not in dialog
          if (newPathArray.length <= 3) {
            return true;
          } else {
            newPathArray = newPathArray.slice(2);
            return !newPathArray.some(value => value.includes("("));
          }
        };
        if (isFclEnabled && !isFullScreen) {
          const rightMostContext = this.base.getAppComponent().getRootViewController().getRightmostContext();
          if (key.includes(rightMostContext?.getPath())) {
            return splitPathAndCheckIfRecommendationAcceptable(rightMostContext?.getPath());
          } else {
            return splitPathAndCheckIfRecommendationAcceptable(contextPath);
          }
        } else {
          return splitPathAndCheckIfRecommendationAcceptable(contextPath);
        }
      };
      const dataToBeFiltered = this.fetchDataToBeFiltered(recommendationData, considerRecommendationContexts);
      return dataToBeFiltered.filter(key => {
        return key.includes(this.getView().getBindingContext()?.getPath()) && isRecommendationAcceptable(this.getView().getBindingContext()?.getPath(), key);
      }) || [];
    }

    /**
     * Fetches the data to be filtered depending on the recommendationData.
     * @param recommendationData
     * @param considerRecommendationContexts Passed as true when recommendation contexts should be considered instead of data
     * @returns Array of contextPaths to be filtered
     */;
    _proto.fetchDataToBeFiltered = function fetchDataToBeFiltered(recommendationData, considerRecommendationContexts) {
      let dataToBeFiltered = [];
      // consider recommendationContexts for fetching the paths in case of field change so that contexts for which empty recommendation data is returned are also considered
      if (considerRecommendationContexts) {
        const recommendationContexts = this.getView().getModel("internal")?.getProperty("/recommendationContexts");
        recommendationContexts.forEach(recommendationContext => {
          dataToBeFiltered.push(recommendationContext.context.getPath());
        });
      } else {
        // consider recommendationData in case of accept all dialog scenarios
        dataToBeFiltered = Object.keys(recommendationData).filter(key => {
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
     */;
    _proto.adjustAcceptAllParams = function adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params) {
      params.recommendationData = [];
      for (const key in filterRecommendationData) {
        if (filterRecommendationData[key].value || filterRecommendationData[key].text) {
          // In case there is no placeholder value or placeholder text then this recommendation is not relevant for Accept.
          // User needs to manually select the recommended value in these cases & therefore filter the same.
          const contextPathFromKey = key.substring(0, key.lastIndexOf(")") + 1);
          const propertyPathFromKey = key.substring(key.lastIndexOf(")") + 2);
          const matchingContext = filterRecommendationContexts.filter(function (contextInfo) {
            if ((contextInfo?.context).getPath() === contextPathFromKey) {
              return true;
            }
          });
          if (matchingContext?.length > 0 && standardRecommendationHelper.isRecommendationFieldNull(matchingContext[0].context, key, propertyPathFromKey)) {
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
     */;
    _proto.fetchAcceptAllParams = async function fetchAcceptAllParams() {
      const targets = this.fetchTargets();
      const filterRecommendationData = this.fetchFilteredRecommendationData(targets);
      const filterRecommendationContexts = this.fetchFilteredRecommendationContexts(targets);
      const params = {};
      this.adjustAcceptAllParams(filterRecommendationData, filterRecommendationContexts, params);
      await this.getView().getController().recommendations.onBeforeAcceptRecommendations(params);
      standardRecommendationHelper.addContextIdentifierText(params, this.getView()?.getBindingContext()?.getPath());
      this.dataToBeAccepted = params.recommendationData || [];
      return params;
    }

    /**
     * Checks if recommendations exist or not.
     * @returns Boolean value based on whether recommendations are present or not
     */;
    _proto.checkIfRecommendationsExist = function checkIfRecommendationsExist() {
      const recommendationData = this.internalModel.getProperty("/recommendationsData") || {};
      return Object.keys(recommendationData).length !== 0;
    }

    /**
     * This function will clear recommendation Data for a given context and all its children.
     * @param contexts Context for which recommendation has to be cleared
     */;
    _proto.ignoreRecommendationForContexts = function ignoreRecommendationForContexts(contexts) {
      if (!contexts || !contexts.length) {
        const view = this.getView();
        const bindingContext = view.getBindingContext();
        contexts = [bindingContext];
      }
      standardRecommendationHelper.ignoreRecommendationForContexts(contexts, this.internalModel);
    };
    _proto.tryResetRecommendations = function tryResetRecommendations(rootContext) {
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
     */;
    _proto.storeDataForTelemetry = async function storeDataForTelemetry(recommendationOptionChoosen) {
      const rootContext = await this._getRootContext(this.getView().getBindingContext());
      if (rootContext && this.base.recommendations.isEnabled(rootContext)) {
        if (recommendationOptionChoosen === RecommendationDialogDecision.Accept) {
          // increase accept count
          this.telemetry.updateData("numberOfFieldsAcceptedThroughAcceptButton", this.dataToBeAccepted.length);
        } else if (recommendationOptionChoosen === RecommendationDialogDecision.Ignore) {
          // increase ignore count
          this.telemetry.updateData("numberOfFieldsIgnoredThroughIgnoreButton", this.dataToBeAccepted.length);
        }
        this.telemetry.storeData(this.getView());
      }
    }

    /**
     * This function will update the count by 1 in telemetry data.
     * @param key
     */;
    _proto.increaseTelemetryDataCount = function increaseTelemetryDataCount(key) {
      this.telemetry.increaseCount(key);
    }

    /**
     * This function will update telemetry data for which option user chose when selecting a field value, as top/non-top recommendation or some other value.
     * @param fieldPath
     * @param selectedValue
     */;
    _proto.updateTelemetryDataBasedOnUserSelection = function updateTelemetryDataBasedOnUserSelection(fieldPath, selectedValue) {
      this.telemetry.updateTelemetryDataBasedOnUserSelection(this.getView(), fieldPath, selectedValue);
    }

    /**
     * This function will update the total number of fields recommended. If the field is already included in telemetry count then we do not include.
     * This way we know the total number of unique fields recommended.
     * @param recommendationData
     */;
    _proto.updateAllRecommendedFields = function updateAllRecommendedFields(recommendationData) {
      const viewBindingContextPath = this.getView().getBindingContext().getPath();
      const newRecommendationsForCurrentContexts = recommendationData.filter(response => response["AIRecommendedFieldPath"]?.includes(viewBindingContextPath));
      if (!this.allRecommendedFields) {
        this.allRecommendedFields = [];
      }
      newRecommendationsForCurrentContexts.forEach(response => {
        const fieldPath = response["AIRecommendedFieldPath"];
        if (fieldPath) {
          if (!this.allRecommendedFields.includes(fieldPath)) {
            this.allRecommendedFields.push(fieldPath);
            this.telemetry.increaseCount("numberOfRecommendedFields");
          }
        }
      });
    };
    return Recommendations;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onAfterBinding", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onAfterBinding"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearRecommendations", [_dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "clearRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isEnabled", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "isEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isRecommendationEnabled", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "isRecommendationEnabled"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchRecommendations", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchAndApplyRecommendations", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchAndApplyRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "fetchAndApplyRecommendationsOnFieldChange", [_dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "fetchAndApplyRecommendationsOnFieldChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onBeforeAcceptRecommendations", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "onBeforeAcceptRecommendations"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "acceptRecommendations", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "acceptRecommendations"), _class2.prototype), _class2)) || _class);
  _exports = Recommendations;
  return _exports;
}, false);
//# sourceMappingURL=Recommendations-dbg.js.map
