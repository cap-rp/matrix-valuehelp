/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/editFlow/NotApplicableContextDialog", "sap/fe/core/controllerextensions/editFlow/draft", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/KeepAliveRefreshTypes", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/navigation/SelectionVariant", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../converters/helpers/Aggregation"], function (Log, mergeObjects, ClassSupport, CommonUtils, NotApplicableContextDialog, draft, MetaModelConverter, FPMHelper, KeepAliveHelper, KeepAliveRefreshTypes, ModelHelper, ResourceModelHelper, SelectionVariant, Element, Library, ControllerExtension, OverrideExecution, Aggregation) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _class, _class2;
  var AggregationHelper = Aggregation.AggregationHelper;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var RefreshStrategyType = KeepAliveRefreshTypes.RefreshStrategyType;
  var convertTypes = MetaModelConverter.convertTypes;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  /**
   * Navigation Parameters used during navigation
   */
  /**
   * {@link sap.ui.core.mvc.ControllerExtension Controller extension}
   * @since 1.84.0
   */
  let InternalIntentBasedNavigation = (_dec = defineUI5Class("sap.fe.core.controllerextensions.InternalInternalBasedNavigation"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec8 = extensible(OverrideExecution.Instead), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = privateExtension(), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec14 = publicExtension(), _dec15 = finalExtension(), _dec16 = publicExtension(), _dec17 = finalExtension(), _dec18 = publicExtension(), _dec19 = finalExtension(), _dec20 = publicExtension(), _dec21 = finalExtension(), _dec22 = publicExtension(), _dec23 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function InternalIntentBasedNavigation() {
      return _ControllerExtension.call(this) || this;
    }
    _inheritsLoose(InternalIntentBasedNavigation, _ControllerExtension);
    var _proto = InternalIntentBasedNavigation.prototype;
    _proto.onInit = function onInit() {
      this._oAppComponent = this.base.getAppComponent();
      this._oMetaModel = this._oAppComponent.getModel().getMetaModel();
      this._oNavigationService = this._oAppComponent.getNavigationService();
      this._oView = this.base.getView();
    }

    /**
     * Enables intent-based navigation (SemanticObject-Action) with the provided context.
     * If semantic object mapping is provided, this is also applied to the selection variant after the adaptation by a consumer.
     * This takes care of removing any technical parameters and determines if an explace or inplace navigation should take place.
     * @param semanticObject Semantic object for the target app
     * @param action  Action for the target app
     * @param [navigationParameters] Optional parameters to be passed to the external navigation
     * @param [navigationParameters.navigationContexts] Uses one of the following to be passed to the intent:
     *    a single instance of {@link sap.ui.model.odata.v4.Context}
     *    multiple instances of {@link sap.ui.model.odata.v4.Context}
     *    an object or an array of objects
     *		  If an array of objects is passed, the context is used to determine the metaPath and to remove any sensitive data
     *		  If an array of objects is passed, the following format ix expected:
     *		  {
     *			data: {
     *	 			ProductID: 7634,
     *				Name: "Laptop"
     *			 },
     *			 metaPath: "/SalesOrderManage"
     *        }
     * @param [navigationParameters.semanticObjectMapping] String representation of the SemanticObjectMapping or SemanticObjectMapping that applies to this navigation
     * @param [navigationParameters.defaultRefreshStrategy] Default refresh strategy to be used in case no refresh strategy is specified for the intent in the view.
     * @param [navigationParameters.refreshStrategies]
     * @param [navigationParameters.additionalNavigationParameters] Additional navigation parameters configured in the crossAppNavigation outbound parameters.
     * @param source The control object of the navigation source.
     */;
    _proto.navigate = function navigate(semanticObject, action, navigationParameters, source) {
      try {
        if (this.navigationAlreadyStarted !== true) {
          this.navigationAlreadyStarted = true;
          const _doNavigate = () => {
            const vNavigationContexts = navigationParameters && navigationParameters.navigationContexts;
            const aNavigationContexts = vNavigationContexts && !Array.isArray(vNavigationContexts) ? [vNavigationContexts] : vNavigationContexts;
            const vSemanticObjectMapping = navigationParameters && navigationParameters.semanticObjectMapping,
              vOutboundParams = navigationParameters && navigationParameters.additionalNavigationParameters,
              oTargetInfo = {
                semanticObject: semanticObject,
                action: action
              },
              oView = this.base.getView(),
              oController = oView.getController();
            if (semanticObject && action) {
              let aSemanticAttributes = [],
                oSelectionVariant = new SelectionVariant();
              // 1. get SemanticAttributes for navigation
              if (aNavigationContexts && aNavigationContexts.length) {
                aNavigationContexts.forEach(oNavigationContext => {
                  // 1.1.a if navigation context is instance of sap.ui.mode.odata.v4.Context
                  // else check if navigation context is of type object
                  const oNavigationContextAsContext = oNavigationContext;
                  const oNavigationContextAsObject = oNavigationContext;
                  if (oNavigationContextAsContext.isA && oNavigationContextAsContext.isA("sap.ui.model.odata.v4.Context")) {
                    // 1.1.b remove sensitive data
                    let oSemanticAttributes = oNavigationContextAsContext.getObject();
                    const sMetaPath = this._oMetaModel.getMetaPath(oNavigationContextAsContext.getPath());
                    // TODO: also remove sensitive data from  navigation properties
                    const finalSemanticAttributes = this.processSemanticAttributes(oNavigationContextAsContext, oSemanticAttributes);
                    oSemanticAttributes = this.removeSensitiveData(finalSemanticAttributes, sMetaPath);
                    const oNavContext = this.prepareContextForExternalNavigation(finalSemanticAttributes, oNavigationContextAsContext);
                    oTargetInfo["propertiesWithoutConflict"] = oNavContext.propertiesWithoutConflict;
                    aSemanticAttributes.push(oNavContext.semanticAttributes);
                  } else if (oNavigationContextAsObject && !(oNavigationContextAsObject && Array.isArray(oNavigationContextAsObject.data)) && typeof oNavigationContext === "object") {
                    // 1.1.b remove sensitive data from object
                    aSemanticAttributes.push(this.removeSensitiveData(oNavigationContextAsObject.data, oNavigationContextAsObject.metaPath));
                  } else if (oNavigationContextAsObject && Array.isArray(oNavigationContextAsObject.data)) {
                    // oNavigationContext.data can be array already ex : [{Customer: "10001"}, {Customer: "10091"}]
                    // hence assigning it to the aSemanticAttributes
                    aSemanticAttributes = this.removeSensitiveData(oNavigationContextAsObject.data, oNavigationContextAsObject.metaPath);
                  }
                });
              }
              // 2.1 Merge base selection variant and sanitized semantic attributes into one SelectionVariant
              if (aSemanticAttributes && aSemanticAttributes.length) {
                oSelectionVariant = this._oNavigationService.mixAttributesAndSelectionVariant(aSemanticAttributes, oSelectionVariant.toJSONString());
              }

              // 3. Add filterContextUrl to SV so the NavigationHandler can remove any sensitive data based on view entitySet
              const oModel = this._oView.getModel(),
                sEntitySet = this.getEntitySet(),
                sContextUrl = sEntitySet ? this._oNavigationService.constructContextUrl(sEntitySet, oModel) : undefined;
              if (sContextUrl) {
                oSelectionVariant.setFilterContextUrl(sContextUrl);
              }

              // Apply Outbound Parameters to the SV
              if (vOutboundParams) {
                this._applyOutboundParams(oSelectionVariant, vOutboundParams);
              }

              // 4. give an opportunity for the application to influence the SelectionVariant
              oController.intentBasedNavigation.adaptNavigationContext(oSelectionVariant, oTargetInfo);

              // 5. Apply semantic object mappings to the SV
              if (vSemanticObjectMapping) {
                this._applySemanticObjectMappings(oSelectionVariant, vSemanticObjectMapping);
              }

              // 6. remove technical parameters from Selection Variant
              this._removeTechnicalParameters(oSelectionVariant);

              // 7. check if programming model is sticky and page is editable
              let sNavMode = oController._intentBasedNavigation.getNavigationMode();

              // 8. Updating refresh strategy in internal model
              const mRefreshStrategies = navigationParameters && navigationParameters.refreshStrategies || {},
                oInternalModel = oView.getModel("internal");
              if (oInternalModel) {
                if ((oView && oView.getViewData()).refreshStrategyOnAppRestore) {
                  const mViewRefreshStrategies = oView.getViewData().refreshStrategyOnAppRestore || {};
                  mergeObjects(mRefreshStrategies, mViewRefreshStrategies);
                }
                const mRefreshStrategy = KeepAliveHelper.getRefreshStrategyForIntent(mRefreshStrategies, semanticObject, action);
                if (mRefreshStrategy) {
                  oInternalModel.setProperty("/refreshStrategyOnAppRestore", mRefreshStrategy);
                }
              }

              // 9. Check if navMode parameter is set and use it
              sNavMode = navigationParameters?.navMode ? navigationParameters?.navMode : sNavMode;

              // 10. Navigate via NavigationHandler
              const onError = function () {
                sap.ui.require(["sap/m/MessageBox"], function (MessageBoxClass) {
                  const oResourceBundle = Library.getResourceBundleFor("sap.fe.core");
                  MessageBoxClass.error(oResourceBundle.getText("C_COMMON_HELPER_NAVIGATION_ERROR_MESSAGE"), {
                    title: oResourceBundle.getText("C_COMMON_SAPFE_ERROR")
                  });
                });
              };
              this._oNavigationService.navigate(semanticObject, action, oSelectionVariant.toJSONString(), undefined, onError, undefined, sNavMode);
            } else {
              throw new Error("Semantic Object/action is not provided");
            }
          };
          if (source?.data("debounce")) return; //debouncing the IBN navigation
          source?.data("debounce", true);
          const oBindingContext = this.base.getView().getBindingContext();
          const oMetaModel = oBindingContext && oBindingContext.getModel().getMetaModel();
          if (this.base.getView().getViewData().converterType === "ObjectPage" && oMetaModel && !ModelHelper.isStickySessionSupported(oMetaModel) && !(navigationParameters?.navMode === "explace")) {
            draft.processDataLossOrDraftDiscardConfirmation(_doNavigate.bind(this), Function.prototype, this.base.getView().getBindingContext(), this.base.getView().getController(), false, draft.NavigationType.ForwardNavigation);
          } else {
            _doNavigate();
          }
          source?.data("debounce", false);
        }
      } finally {
        this.navigationAlreadyStarted = false;
      }
    }

    /**
     * Prepare attributes to be passed to external navigation.
     * @param oSemanticAttributes Context data after removing all sensitive information.
     * @param oContext Actual context from which the semanticAttributes were derived.
     * @returns Object of prepared attributes for external navigation and no conflict properties.
     */;
    _proto.prepareContextForExternalNavigation = function prepareContextForExternalNavigation(oSemanticAttributes, oContext) {
      // 1. Find all distinct keys in the object SemanticAttributes
      // Store meta path for each occurence of the key
      const oDistinctKeys = {},
        sContextPath = oContext.getPath(),
        oMetaModel = oContext.getModel().getMetaModel(),
        sMetaPath = oMetaModel.getMetaPath(sContextPath),
        aMetaPathParts = sMetaPath.split("/").filter(Boolean);
      function _findDistinctKeysInObject(LookUpObject, sLookUpObjectMetaPath) {
        for (const sKey in LookUpObject) {
          // null case??
          if (LookUpObject[sKey] === null || typeof LookUpObject[sKey] !== "object") {
            if (!oDistinctKeys[sKey]) {
              // if key is found for the first time then create array
              oDistinctKeys[sKey] = [];
            }
            // push path to array
            oDistinctKeys[sKey].push(sLookUpObjectMetaPath);
          } else {
            // if a nested object is found
            const oNewLookUpObject = LookUpObject[sKey];
            _findDistinctKeysInObject(oNewLookUpObject, `${sLookUpObjectMetaPath}/${sKey}`);
          }
        }
      }
      _findDistinctKeysInObject(oSemanticAttributes, sMetaPath);

      // 2. Determine distinct key value and add conflicted paths to semantic attributes
      const sMainEntitySetName = aMetaPathParts[0],
        sMainEntityTypeName = oMetaModel.getObject(`/${sMainEntitySetName}/@sapui.name`),
        oPropertiesWithoutConflict = {};
      let sMainEntityValuePath, sCurrentValuePath, sLastValuePath;
      for (const sDistinctKey in oDistinctKeys) {
        const aConflictingPaths = oDistinctKeys[sDistinctKey];
        let sWinnerValuePath;
        // Find winner value for each distinct key in case of conflict by the following rule:

        // -> A. if any meta path for a distinct key is the same as main entity take that as the value
        // -> B. if A is not met keep the value from the current context (sMetaPath === path of distince key)
        // -> C. if A, B or C are not met take the last path for value
        if (aConflictingPaths.length > 1) {
          // conflict
          for (let i = 0; i <= aConflictingPaths.length - 1; i++) {
            const sPath = aConflictingPaths[i];
            let sPathInContext = sPath.replace(sPath === sMetaPath ? sMetaPath : `${sMetaPath}/`, "");
            sPathInContext = (sPathInContext === "" ? sPathInContext : `${sPathInContext}/`) + sDistinctKey;
            const sEntityTypeName = oMetaModel.getObject(`${sPath}/@sapui.name`);
            // rule A

            // rule A
            if (sEntityTypeName === sMainEntityTypeName) {
              sMainEntityValuePath = sPathInContext;
            }

            // rule B
            if (sPath === sMetaPath) {
              sCurrentValuePath = sPathInContext;
            }

            // rule C
            sLastValuePath = sPathInContext;

            // add conflicted path to semantic attributes
            // check if the current path points to main entity and prefix attribute names accordingly
            oSemanticAttributes[`${sMetaPath}/${sPathInContext}`.split("/").filter(function (sValue) {
              return sValue != "";
            }).join(".")] = oContext.getProperty(sPathInContext);
          }
          // A || B || C
          sWinnerValuePath = sMainEntityValuePath || sCurrentValuePath || sLastValuePath;
          oSemanticAttributes[sDistinctKey] = oContext.getProperty(sWinnerValuePath);
          sMainEntityValuePath = undefined;
          sCurrentValuePath = undefined;
          sLastValuePath = undefined;
        } else {
          // no conflict, add distinct key without adding paths
          const sPath = aConflictingPaths[0]; // because there is only one and hence no conflict
          let sPathInContext = sPath.replace(sPath === sMetaPath ? sMetaPath : `${sMetaPath}/`, "");
          sPathInContext = (sPathInContext === "" ? sPathInContext : `${sPathInContext}/`) + sDistinctKey;
          oSemanticAttributes[sDistinctKey] = oContext.getProperty(sPathInContext);
          oPropertiesWithoutConflict[sDistinctKey] = `${sMetaPath}/${sPathInContext}`.split("/").filter(function (sValue) {
            return sValue != "";
          }).join(".");
        }
      }
      // 3. Remove all Navigation properties
      for (const sProperty in oSemanticAttributes) {
        if (oSemanticAttributes[sProperty] !== null && typeof oSemanticAttributes[sProperty] === "object") {
          delete oSemanticAttributes[sProperty];
        }
      }
      return {
        semanticAttributes: oSemanticAttributes,
        propertiesWithoutConflict: oPropertiesWithoutConflict
      };
    }

    /**
     * Get Navigation mode.
     * @returns The navigation mode
     */;
    _proto.getNavigationMode = function getNavigationMode() {
      return undefined;
    }

    /**
     * Allows for navigation to a given intent (SemanticObject-Action) with the provided context, using a dialog that shows the contexts which cannot be passed
     * If semantic object mapping is provided, this setting is also applied to the selection variant after adaptation by a consumer.
     * This setting also removes any technical parameters and determines if an inplace or explace navigation should take place.
     * @param sSemanticObject Semantic object for the target app
     * @param sAction  Action for the target app
     * @param [mNavigationParameters] Optional parameters to be passed to the external navigation
     * @param source
     */;
    _proto.navigateWithConfirmationDialog = async function navigateWithConfirmationDialog(sSemanticObject, sAction, mNavigationParameters, source) {
      let shouldContinue = true;
      if (source?.data("debounce")) return; //debouncing the IBN navigation
      source?.data("debounce", true);
      if (mNavigationParameters?.notApplicableContexts && mNavigationParameters.notApplicableContexts?.length >= 1) {
        const metaModel = this.base.getView().getModel().getMetaModel();
        const entitySetPath = metaModel.getMetaPath(mNavigationParameters.notApplicableContexts[0].getPath());
        const convertedMetadata = convertTypes(metaModel);
        const entitySet = convertedMetadata.resolvePath(entitySetPath).target;
        // Show the contexts that are not applicable and will not therefore be processed
        const notApplicableContextsDialog = new NotApplicableContextDialog({
          title: "",
          entityType: entitySet.entityType,
          resourceModel: getResourceModel(this.getView()),
          notApplicableContexts: mNavigationParameters.notApplicableContexts,
          entitySet: entitySet.name,
          actionName: sAction
        });
        mNavigationParameters.navigationContexts = mNavigationParameters.applicableContexts;
        shouldContinue = await notApplicableContextsDialog.open(this.getView());
      }
      if (shouldContinue) {
        this.navigate(sSemanticObject, sAction, mNavigationParameters);
      }
      source?.data("debounce", false);
    };
    _proto._removeTechnicalParameters = function _removeTechnicalParameters(oSelectionVariant) {
      oSelectionVariant.removeSelectOption("@odata.context");
      oSelectionVariant.removeSelectOption("@odata.metadataEtag");
      oSelectionVariant.removeSelectOption("SAP__Messages");
    }

    /**
     * Get targeted Entity set.
     * @returns Entity set name
     */;
    _proto.getEntitySet = function getEntitySet() {
      return this._oView.getViewData().entitySet;
    }

    /**
     * Removes sensitive data from the semantic attribute with respect to the entitySet.
     * @param oAttributes Context data
     * @param sMetaPath Meta path to reach the entitySet in the MetaModel
     * @param metaModel MetaModel
     * @returns Array of semantic Attributes
     */
    // TO-DO add unit tests for this function in the controller extension qunit.
    ;
    _proto.removeSensitiveData = function removeSensitiveData(oAttributes, sMetaPath, metaModel) {
      if (oAttributes) {
        const {
          transAggregations,
          customAggregates
        } = this._getAggregates(sMetaPath, this.base.getView(), this.base.getAppComponent().getDiagnostics());
        const aProperties = Object.keys(oAttributes);
        if (!Array.isArray(oAttributes) && aProperties.length) {
          delete oAttributes["@odata.context"];
          delete oAttributes["@odata.metadataEtag"];
          delete oAttributes["SAP__Messages"];
          for (const element of aProperties) {
            if (oAttributes[element] && typeof oAttributes[element] === "object") {
              this.removeSensitiveData(oAttributes[element], `${sMetaPath}/${element}`, metaModel);
            }
            if (element.includes("@odata.type")) {
              delete oAttributes[element];
              continue;
            }
            this._deleteAggregates([...transAggregations, ...customAggregates], element, oAttributes);
            const aPropertyAnnotations = this._getPropertyAnnotations(element, sMetaPath, oAttributes, metaModel || this._oMetaModel);
            if (aPropertyAnnotations) {
              if (aPropertyAnnotations.PersonalData?.IsPotentiallySensitive || aPropertyAnnotations.UI?.ExcludeFromNavigationContext || aPropertyAnnotations.Analytics?.Measure) {
                delete oAttributes[element];
              } else if (aPropertyAnnotations.Common?.FieldControl) {
                const oFieldControl = aPropertyAnnotations.Common.FieldControl;
                if (oFieldControl["$EnumMember"] && oFieldControl["$EnumMember"].split("/")[1] === "Inapplicable" || oFieldControl["$Path"] && this._isFieldControlPathInapplicable(oFieldControl["$Path"], oAttributes)) {
                  delete oAttributes[element];
                }
              }
            }
          }
        }
      }
      return oAttributes;
    }

    /**
     * Remove the attribute from navigation data if it is a measure.
     * @param aggregates Array of Aggregates
     * @param sProp Attribute name
     * @param oAttributes SemanticAttributes
     */;
    _proto._deleteAggregates = function _deleteAggregates(aggregates, sProp, oAttributes) {
      if (aggregates && aggregates.includes(sProp)) {
        delete oAttributes[sProp];
      }
    }

    /**
     * Returns the property annotations.
     * @param sProp
     * @param sMetaPath
     * @param oAttributes
     * @param oMetaModel
     * @returns - The property annotations
     */;
    _proto._getPropertyAnnotations = function _getPropertyAnnotations(sProp, sMetaPath, oAttributes, oMetaModel) {
      if (oAttributes[sProp] && sMetaPath && !sMetaPath.includes("undefined")) {
        const oContext = oMetaModel.createBindingContext(`${sMetaPath}/${sProp}`);
        const oFullContext = MetaModelConverter.getInvolvedDataModelObjects(oContext);
        return oFullContext?.targetObject?.annotations;
      }
      return null;
    }

    /**
     * Returns the aggregates part of the EntitySet or EntityType.
     * @param sMetaPath
     * @param oView
     * @param oDiagnostics
     * @returns - The aggregates
     */;
    _proto._getAggregates = function _getAggregates(sMetaPath, oView, oDiagnostics) {
      const converterContext = this._getConverterContext(sMetaPath, oView, oDiagnostics);
      const aggregationHelper = new AggregationHelper(converterContext.getEntityType(), converterContext);
      const isAnalyticsSupported = aggregationHelper.isAnalyticsSupported();
      let transAggregations, customAggregates;
      if (isAnalyticsSupported) {
        const transAggregationsPreprocessing = aggregationHelper.getTransAggregations();
        if (transAggregationsPreprocessing?.length) {
          transAggregations = transAggregationsPreprocessing.map(transAgg => {
            return transAgg.Name || transAgg.Value;
          });
        }
        customAggregates = aggregationHelper.getCustomAggregateDefinitions();
        if (customAggregates?.length) {
          customAggregates = customAggregates.map(customAggregate => {
            return customAggregate.qualifier;
          });
        }
      }
      transAggregations ??= [];
      customAggregates = customAggregates ? customAggregates : [];
      return {
        transAggregations,
        customAggregates
      };
    }

    /**
     * Returns converterContext.
     * @param sMetaPath
     * @param oView
     * @param oDiagnostics
     * @returns - ConverterContext
     */;
    _proto._getConverterContext = function _getConverterContext(sMetaPath, oView, oDiagnostics) {
      const oViewData = oView.getViewData();
      let sEntitySet = oViewData.entitySet;
      const sContextPath = oViewData.contextPath;
      if (sContextPath && (!sEntitySet || sEntitySet.includes("/"))) {
        sEntitySet = oViewData?.fullContextPath.split("/")[1];
      }
      return CommonUtils.getConverterContextForPath(sMetaPath, oView.getModel().getMetaModel(), sEntitySet, oDiagnostics);
    }

    /**
     * Check if path-based FieldControl evaluates to inapplicable.
     * @param sFieldControlPath Field control path
     * @param oAttribute SemanticAttributes
     * @returns `true` if inapplicable
     */;
    _proto._isFieldControlPathInapplicable = function _isFieldControlPathInapplicable(sFieldControlPath, oAttribute) {
      let bInapplicable = false;
      const aParts = sFieldControlPath.split("/");
      // sensitive data is removed only if the path has already been resolved.
      if (aParts.length > 1) {
        bInapplicable = !!(oAttribute[aParts[0]] && oAttribute[aParts[0]].hasOwnProperty(aParts[1]) && oAttribute[aParts[0]][aParts[1]] === 0);
      } else {
        bInapplicable = oAttribute[sFieldControlPath] === 0;
      }
      return bInapplicable;
    }

    /**
     * Method to replace Local Properties with Semantic Object mappings.
     * @param oSelectionVariant SelectionVariant consisting of filterbar, Table and Page Context
     * @param vMappings A string representation of semantic object mapping
     * @returns - Modified SelectionVariant with LocalProperty replaced with SemanticObjectProperties.
     */;
    _proto._applySemanticObjectMappings = function _applySemanticObjectMappings(oSelectionVariant, vMappings) {
      const oMappings = typeof vMappings === "string" ? JSON.parse(vMappings) : vMappings;
      for (const item of oMappings) {
        const sLocalProperty = item["LocalProperty"] && item["LocalProperty"]["$PropertyPath"] || item["@com.sap.vocabularies.Common.v1.LocalProperty"] && item["@com.sap.vocabularies.Common.v1.LocalProperty"]["$Path"];
        const sSemanticObjectProperty = item["SemanticObjectProperty"] || item["@com.sap.vocabularies.Common.v1.SemanticObjectProperty"];
        const oSelectOption = oSelectionVariant.getSelectOption(sLocalProperty);
        if (oSelectOption && sLocalProperty !== sSemanticObjectProperty) {
          //remove the selectOption to be overwritten then rename the one coming from the local property
          oSelectionVariant.removeSelectOption(sSemanticObjectProperty);
          oSelectionVariant.renameSelectOption(sLocalProperty, sSemanticObjectProperty);
        }
      }
      return oSelectionVariant;
    }

    /**
     * Method to store the focusInformation to the history object.
     */;
    _proto.storeFocusInfoInHistory = function storeFocusInfoInHistory() {
      let focusInfo = null;
      const focusControl = Element.getActiveElement();
      const focusControlId = focusControl?.getId();
      const focusMDCTable = focusControl && FPMHelper.getMdcTable(focusControl);
      if (focusControl?.isA("sap.m.Button")) {
        focusInfo = {
          type: "Control",
          controlId: focusControlId
        };
      } else if (focusMDCTable) {
        focusInfo = {
          type: "Row",
          tableId: focusMDCTable.getId(),
          contextPathFocus: focusControl.getBindingContext()?.getPath()
        };
      }
      history.replaceState(Object.assign({}, history.state, {
        focusInfo: focusInfo
      }), "");
    }

    /**
     * Navigates to an Outbound provided in the manifest.
     * @param sOutbound Identifier to location the outbound in the manifest
     * @param mNavigationParameters Optional map containing key/value pairs to be passed to the intent
     * @since 1.86.0
     */;
    _proto.navigateOutbound = function navigateOutbound(sOutbound, mNavigationParameters) {
      this.storeFocusInfoInHistory();
      let aNavParams;
      const oManifestEntry = this.base.getAppComponent().getManifestEntry("sap.app"),
        oOutbound = oManifestEntry.crossNavigation?.outbounds?.[sOutbound];
      if (!oOutbound) {
        Log.error("Outbound is not defined in manifest!!");
        return;
      }
      const sSemanticObject = oOutbound.semanticObject,
        sAction = oOutbound.action,
        outboundParams = oOutbound.parameters && this.getOutboundParams(oOutbound.parameters);
      if (mNavigationParameters) {
        aNavParams = [];
        Object.keys(mNavigationParameters).forEach(function (key) {
          let oParams;
          const navParameterValue = mNavigationParameters[key];
          if (Array.isArray(navParameterValue)) {
            for (const item of navParameterValue) {
              oParams = {};
              oParams[key] = item;
              aNavParams?.push(oParams);
            }
          } else {
            oParams = {};
            oParams[key] = navParameterValue;
            aNavParams?.push(oParams);
          }
        });
      }
      if (aNavParams || outboundParams) {
        mNavigationParameters = {
          navigationContexts: {
            data: aNavParams || outboundParams
          }
        };
      }
      this.base._intentBasedNavigation.navigate(sSemanticObject, sAction, mNavigationParameters);
    }

    /**
     * Method to apply outbound parameters defined in the manifest.
     * @param oSelectionVariant SelectionVariant consisting of a filter bar, a table, and a page context
     * @param vOutboundParams Outbound Properties defined in the manifest
     * @returns - The modified SelectionVariant with outbound parameters.
     */;
    _proto._applyOutboundParams = function _applyOutboundParams(oSelectionVariant, vOutboundParams) {
      const aParameters = Object.keys(vOutboundParams);
      const aSelectProperties = oSelectionVariant.getSelectOptionsPropertyNames();
      aParameters.forEach(function (key) {
        if (!aSelectProperties.includes(key)) {
          oSelectionVariant.addSelectOption(key, "I", "EQ", vOutboundParams[key]);
        }
      });
      return oSelectionVariant;
    }

    /**
     * Method to get the outbound parameters defined in the manifest.
     * @param oOutboundParams Parameters defined in the outbounds. Only "plain" is supported
     * @returns Parameters with the key-Value pair
     */;
    _proto.getOutboundParams = function getOutboundParams(oOutboundParams) {
      const oParamsMapping = {};
      if (oOutboundParams) {
        const aParameters = Object.keys(oOutboundParams) || [];
        if (aParameters.length > 0) {
          aParameters.forEach(function (key) {
            const oMapping = oOutboundParams[key];
            if (oMapping.value && oMapping.value.value && oMapping.value.format === "plain") {
              if (!oParamsMapping[key]) {
                oParamsMapping[key] = oMapping.value.value;
              }
            }
          });
        }
      }
      return oParamsMapping;
    }

    /**
     * Triggers an outbound navigation when a user chooses the chevron.
     * @param {object} oController
     * @param {string} sOutboundTarget Name of the outbound target (needs to be defined in the manifest)
     * @param oContext The context that contains the data for the target app
     * @param {string} sCreatePath Create path when the chevron is created.
     * @param {string} navMode Opens in new tab or window when set to 'explace'.
     * @returns {Promise} Promise which is resolved once the navigation is triggered
     */;
    _proto.onChevronPressNavigateOutBound = async function onChevronPressNavigateOutBound(oController, sOutboundTarget, oContext, sCreatePath, navMode) {
      const oOutbounds = oController.getAppComponent().getRoutingService().getOutbounds();
      const oDisplayOutbound = oOutbounds[sOutboundTarget];
      let additionalNavigationParameters;
      if (oDisplayOutbound && oDisplayOutbound.semanticObject && oDisplayOutbound.action) {
        const oRefreshStrategies = {
          intents: {}
        };
        const oDefaultRefreshStrategy = {};
        let sMetaPath;
        let navigationContexts = [];
        if (oContext) {
          if (Array.isArray(oContext)) {
            navigationContexts = oContext;
            sMetaPath = ModelHelper.getMetaPathForContext(oContext[0]);
          } else if (oContext.isA && oContext.isA("sap.ui.model.odata.v4.Context")) {
            sMetaPath = ModelHelper.getMetaPathForContext(oContext);
            navigationContexts = [oContext];
          }
          oDefaultRefreshStrategy[sMetaPath] = RefreshStrategyType.Self;
          oRefreshStrategies._feDefault = oDefaultRefreshStrategy;
        }
        if (sCreatePath) {
          const sKey = `${oDisplayOutbound.semanticObject}-${oDisplayOutbound.action}`;
          oRefreshStrategies.intents[sKey] = {};
          oRefreshStrategies.intents[sKey][sCreatePath] = RefreshStrategyType.Self;
        }
        if (oDisplayOutbound && oDisplayOutbound.parameters) {
          const oParams = oDisplayOutbound.parameters && this.getOutboundParams(oDisplayOutbound.parameters);
          if (Object.keys(oParams).length > 0) {
            additionalNavigationParameters = oParams;
          }
        }
        oController._intentBasedNavigation.navigate(oDisplayOutbound.semanticObject, oDisplayOutbound.action, {
          navigationContexts: navigationContexts,
          refreshStrategies: oRefreshStrategies,
          additionalNavigationParameters: additionalNavigationParameters,
          navMode: navMode
        });

        //TODO: check why returning a promise is required
        return Promise.resolve();
      } else {
        throw new Error(`outbound target ${sOutboundTarget} not found in cross navigation definition of manifest`);
      }
    }

    /**
     * Process the semantic attributes based on the navigation properties.
     * @param context Context
     * @param semanticAttributes Semantic attributes
     * @param pathsToRetain Navigation properties to be retained in case of links
     * @returns Processed semantic attributes
     */;
    _proto.processSemanticAttributes = function processSemanticAttributes(context, semanticAttributes, pathsToRetain) {
      const bKeepNavProperties = this.keepNavigationPropertiesForNavigation();
      if (!bKeepNavProperties) {
        return this.getSemanticAttributesWithoutNavigationProperties(context, pathsToRetain);
      } else {
        return semanticAttributes;
      }
    }

    /**
     * Check if navigation properties has to be considered for the external navigation.
     * @returns `true` if navigation properties has to be considered
     */;
    _proto.keepNavigationPropertiesForNavigation = function keepNavigationPropertiesForNavigation() {
      let bKeepNavProperties = false;
      const manifest = this.base.getAppComponent().getManifestEntry("sap.fe");
      bKeepNavProperties = manifest?.app?.considerNavigationPropertiesForExternalNavigation || false;
      return bKeepNavProperties;
    }

    /**
     * Get semantic attributes from context.
     * @param context Context
     * @param pathsToRetain Navigation properties to be retained in case of links
     * @returns Semantic Attributes
     */;
    _proto.getSemanticAttributesWithoutNavigationProperties = function getSemanticAttributesWithoutNavigationProperties(context, pathsToRetain) {
      const metaModel = context.getModel().getMetaModel(),
        contextPath = context.getPath(),
        metaPath = metaModel.getMetaPath(contextPath),
        ret = context.getObject();
      const navProperties = this.getNavigationPropertiesFromEntityType(metaModel, metaPath);
      if (navProperties && navProperties.length > 0) {
        navProperties.forEach(navProp => {
          const navPropName = navProp.name;
          if (Array.isArray(pathsToRetain) && pathsToRetain.length > 0) {
            // We consider 1.1 navigation properties which are used for rendering the semantic links to be passed as part of context
            if (ret.hasOwnProperty(navPropName) && ret[navPropName]) {
              Object.keys(ret[navPropName]).forEach(function (key) {
                const propertyPath = `${navPropName}/${key}`;
                if (!pathsToRetain?.includes(propertyPath) && ret[navPropName].hasOwnProperty(key)) {
                  delete ret[navPropName][key];
                  if (Object.keys(ret[navPropName]).length === 0) {
                    delete ret[navPropName];
                  }
                }
              });
            } else {
              delete ret[navPropName];
            }
          } else if (ret.hasOwnProperty(navPropName)) {
            delete ret[navPropName];
          }
        });
      }
      return ret;
    }

    /**
     * Retrieve the navigation properties from entityType using metamodel.
     * @param metaModel MetaModel
     * @param metaPath MetaPath
     * @returns Navigation properties
     */;
    _proto.getNavigationPropertiesFromEntityType = function getNavigationPropertiesFromEntityType(metaModel, metaPath) {
      const convertedMetadata = convertTypes(metaModel);
      const entityType = convertedMetadata.resolvePath(`${metaPath}/`).target;
      return entityType?.navigationProperties;
    };
    return InternalIntentBasedNavigation;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigate", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "navigate"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "prepareContextForExternalNavigation", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "prepareContextForExternalNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getNavigationMode", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "getNavigationMode"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateWithConfirmationDialog", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateWithConfirmationDialog"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getEntitySet", [_dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "getEntitySet"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "removeSensitiveData", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "removeSensitiveData"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "navigateOutbound", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "navigateOutbound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getOutboundParams", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "getOutboundParams"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onChevronPressNavigateOutBound", [_dec18, _dec19], Object.getOwnPropertyDescriptor(_class2.prototype, "onChevronPressNavigateOutBound"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "keepNavigationPropertiesForNavigation", [_dec20, _dec21], Object.getOwnPropertyDescriptor(_class2.prototype, "keepNavigationPropertiesForNavigation"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getSemanticAttributesWithoutNavigationProperties", [_dec22, _dec23], Object.getOwnPropertyDescriptor(_class2.prototype, "getSemanticAttributesWithoutNavigationProperties"), _class2.prototype), _class2)) || _class);
  return InternalIntentBasedNavigation;
}, false);
//# sourceMappingURL=InternalIntentBasedNavigation-dbg.js.map
