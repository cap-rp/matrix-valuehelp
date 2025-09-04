/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/array/uniqueSort", "sap/base/util/merge", "sap/fe/core/converters/ConverterContext", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/ui/Device", "sap/ui/core/Component", "sap/ui/core/Fragment", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor", "sap/ui/model/Filter", "./controls/AnyElement", "./converters/helpers/SelectionVariantHelper", "./helpers/MetaModelFunction"], function (Log, uniqueSort, mergeObjects, ConverterContext, MetaModelConverter, ModelHelper, StableIdHelper, TypeGuards, Device, Component, Fragment, XMLTemplateProcessor, XMLPreprocessor, Filter, AnyElement, SelectionVariantHelper, MetaModelFunction) {
  "use strict";

  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var getRangeDefinition = SelectionVariantHelper.getRangeDefinition;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var generate = StableIdHelper.generate;
  function normalizeSearchTerm(sSearchTerm) {
    if (!sSearchTerm) {
      return undefined;
    }

    // checking for search term "OR" is to allow the SD specific search for SaleOrderType=OR (OR is a hana keyword)
    if (sSearchTerm === "OR") {
      return '"' + sSearchTerm + '"';
    }
    const convertedSearchTerm = sSearchTerm.replace(/["();]/g, " "); // these are the specific characters that fail on both, CAP and RAP: "();
    if (convertedSearchTerm === "" || convertedSearchTerm === " ") {
      return undefined;
    }
    return convertedSearchTerm;
  }
  async function waitForContextRequested(bindingContext) {
    const model = bindingContext.getModel();
    const metaModel = model.getMetaModel();
    const entityPath = metaModel.getMetaPath(bindingContext.getPath());
    const dataModel = MetaModelConverter.getInvolvedDataModelObjects(metaModel.getContext(entityPath));
    await bindingContext.requestProperty(dataModel.targetEntityType.keys[0]?.name);
  }
  function fnHasTransientContexts(oListBinding) {
    let bHasTransientContexts = false;
    if (oListBinding) {
      oListBinding.getCurrentContexts().forEach(function (oContext) {
        if (oContext && oContext.isTransient()) {
          bHasTransientContexts = true;
        }
      });
    }
    return bHasTransientContexts;
  }

  // there is no navigation in entitySet path and property path

  async function _getSOIntents(oShellServiceHelper, oObjectPageLayout, oSemanticObject, oParam) {
    return oShellServiceHelper.getLinks([{
      semanticObject: oSemanticObject,
      params: oParam
    }]);
  }
  // TO-DO add this as part of applySemanticObjectmappings logic in IntentBasednavigation controller extension
  function _createMappings(oMapping) {
    const aSOMappings = [];
    const aMappingKeys = Object.keys(oMapping);
    let oSemanticMapping;
    for (const element of aMappingKeys) {
      oSemanticMapping = {
        LocalProperty: {
          $PropertyPath: element
        },
        SemanticObjectProperty: oMapping[element]
      };
      aSOMappings.push(oSemanticMapping);
    }
    return aSOMappings;
  }
  /**
   * @param linkGroup
   * @param aExcludedActions
   * @param oTargetParams
   * @param aItems
   * @param aAllowedActions
   */
  function _getRelatedAppsMenuItems(linkGroup, aExcludedActions, oTargetParams, aItems, aAllowedActions) {
    for (const links of linkGroup) {
      for (const oLink of links) {
        const sIntent = oLink.intent;
        const sAction = sIntent.split("-")[1].split("?")[0];
        if (aAllowedActions && aAllowedActions.includes(sAction) || !aAllowedActions && aExcludedActions && !aExcludedActions.includes(sAction)) {
          aItems.push({
            text: oLink.text,
            targetSemObject: sIntent.split("#")[1].split("-")[0],
            targetAction: sAction.split("~")[0],
            targetParams: oTargetParams
          });
        }
      }
    }
  }
  function _getRelatedIntents(oAdditionalSemanticObjects, oBindingContext, aManifestSOItems, aLinks) {
    if (aLinks && aLinks.length > 0) {
      const aAllowedActions = oAdditionalSemanticObjects.allowedActions || undefined;
      const aExcludedActions = oAdditionalSemanticObjects.unavailableActions ? oAdditionalSemanticObjects.unavailableActions : [];
      const aSOMappings = oAdditionalSemanticObjects.mapping ? _createMappings(oAdditionalSemanticObjects.mapping) : [];
      const oTargetParams = {
        navigationContexts: oBindingContext,
        semanticObjectMapping: aSOMappings
      };
      _getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aManifestSOItems, aAllowedActions);
    }
  }

  /**
   * This function fetches the related intents when semantic object and action are passed from feEnvironment.getIntent() only in case of My Inbox integration.
   * @param semanticObjectAndAction This specifies the semantic object and action for fetching the intents
   * @param oBindingContext This sepcifies the binding context for updating related apps
   * @param appComponentSOItems This is a list of semantic items used for updating the related apps button
   * @param aLinks This is an array comprising of related intents
   */

  function _getRelatedIntentsWithSemanticObjectsAndAction(semanticObjectAndAction, oBindingContext, appComponentSOItems, aLinks) {
    if (aLinks.length > 0) {
      const actions = [semanticObjectAndAction.action];
      const excludedActions = [];
      const soMappings = [];
      const targetParams = {
        navigationContexts: oBindingContext,
        semanticObjectMapping: soMappings
      };
      _getRelatedAppsMenuItems(aLinks, excludedActions, targetParams, appComponentSOItems, actions);
    }
  }
  async function updateRelateAppsModel(oBindingContext, oEntry, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent) {
    const oShellServiceHelper = appComponent.getShellServices();
    const oParam = {};
    let sCurrentSemObj = "",
      sCurrentAction = "";
    let oSemanticObjectAnnotations;
    let aRelatedAppsMenuItems = [];
    let aExcludedActions = [];
    let aManifestSOKeys;
    async function fnGetParseShellHashAndGetLinks() {
      const oParsedUrl = oShellServiceHelper.parseShellHash(document.location.hash);
      sCurrentSemObj = oParsedUrl.semanticObject; // Current Semantic Object
      sCurrentAction = oParsedUrl.action;
      return _getSOIntents(oShellServiceHelper, oObjectPageLayout, sCurrentSemObj, oParam);
    }
    try {
      if (oEntry) {
        if (aSemKeys && aSemKeys.length > 0) {
          for (const element of aSemKeys) {
            const sSemKey = element.$PropertyPath;
            if (!oParam[sSemKey]) {
              oParam[sSemKey] = {
                value: oEntry[sSemKey]
              };
            }
          }
        } else {
          // fallback to Technical Keys if no Semantic Key is present
          const aTechnicalKeys = oMetaModel.getObject(`${oMetaPath}/$Type/$Key`);
          for (const key in aTechnicalKeys) {
            const sObjKey = aTechnicalKeys[key];
            if (!oParam[sObjKey]) {
              oParam[sObjKey] = {
                value: oEntry[sObjKey]
              };
            }
          }
        }
      }
      // Logic to read additional SO from manifest and updated relatedapps model

      const oManifestData = getTargetView(oObjectPageLayout).getViewData();
      const aManifestSOItems = [];
      let semanticObjectIntents;
      if (oManifestData.additionalSemanticObjects) {
        aManifestSOKeys = Object.keys(oManifestData.additionalSemanticObjects);
        for (const element of aManifestSOKeys) {
          semanticObjectIntents = await Promise.resolve(_getSOIntents(oShellServiceHelper, oObjectPageLayout, element, oParam));
          _getRelatedIntents(oManifestData.additionalSemanticObjects[element], oBindingContext, aManifestSOItems, semanticObjectIntents);
        }
      }

      // appComponentSOItems is updated in case of My Inbox integration when semantic object and action are passed from feEnvironment.getIntent() method
      // In other cases it remains as an empty list
      // We concat this list towards the end with aManifestSOItems

      const appComponentSOItems = [];
      const componentData = appComponent.getComponentData();
      if (componentData.feEnvironment && componentData.feEnvironment.getIntent()) {
        const intent = componentData.feEnvironment.getIntent();
        semanticObjectIntents = await Promise.resolve(_getSOIntents(oShellServiceHelper, oObjectPageLayout, intent.semanticObject, oParam));
        _getRelatedIntentsWithSemanticObjectsAndAction(intent, oBindingContext, appComponentSOItems, semanticObjectIntents);
      }
      const internalModelContext = oObjectPageLayout.getBindingContext("internal");
      const aLinks = await fnGetParseShellHashAndGetLinks();
      if (aLinks) {
        if (aLinks.length > 0) {
          let isSemanticObjectHasSameTargetInManifest = false;
          const oTargetParams = {};
          const aAnnotationsSOItems = [];
          const sEntitySetPath = `${oMetaPath}@`;
          const sEntityTypePath = `${oMetaPath}/@`;
          const oEntitySetAnnotations = oMetaModel.getObject(sEntitySetPath);
          oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntitySetAnnotations, sCurrentSemObj);
          if (!oSemanticObjectAnnotations.bHasEntitySetSO) {
            const oEntityTypeAnnotations = oMetaModel.getObject(sEntityTypePath);
            oSemanticObjectAnnotations = CommonUtils.getSemanticObjectAnnotations(oEntityTypeAnnotations, sCurrentSemObj);
          }
          aExcludedActions = oSemanticObjectAnnotations.aUnavailableActions;
          //Skip same application from Related Apps
          aExcludedActions.push(sCurrentAction);
          oTargetParams.navigationContexts = oBindingContext;
          oTargetParams.semanticObjectMapping = oSemanticObjectAnnotations.aMappings;
          _getRelatedAppsMenuItems(aLinks, aExcludedActions, oTargetParams, aAnnotationsSOItems);
          aManifestSOItems.forEach(function (_ref) {
            let {
              targetSemObject
            } = _ref;
            if (aAnnotationsSOItems[0]?.targetSemObject === targetSemObject) {
              isSemanticObjectHasSameTargetInManifest = true;
            }
          });

          // remove all actions from current hash application if manifest contains empty allowedActions
          if (oManifestData.additionalSemanticObjects && aAnnotationsSOItems[0] && oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject] && !!oManifestData.additionalSemanticObjects[aAnnotationsSOItems[0].targetSemObject].allowedActions) {
            isSemanticObjectHasSameTargetInManifest = true;
          }
          const soItems = aManifestSOItems.concat(appComponentSOItems);
          aRelatedAppsMenuItems = isSemanticObjectHasSameTargetInManifest ? soItems : soItems.concat(aAnnotationsSOItems);
          // If no app in list, related apps button will be hidden
          internalModelContext.setProperty("relatedApps/visibility", aRelatedAppsMenuItems.length > 0);
          internalModelContext.setProperty("relatedApps/items", aRelatedAppsMenuItems);
        } else {
          internalModelContext.setProperty("relatedApps/visibility", false);
        }
      } else {
        internalModelContext.setProperty("relatedApps/visibility", false);
      }
    } catch (error) {
      Log.error("Cannot read links", error);
    }
    return aRelatedAppsMenuItems;
  }
  function _getSemanticObjectAnnotations(oEntityAnnotations, sCurrentSemObj) {
    const oSemanticObjectAnnotations = {
      bHasEntitySetSO: false,
      aAllowedActions: [],
      aUnavailableActions: [],
      aMappings: []
    };
    let sAnnotationMappingTerm, sAnnotationActionTerm;
    let sQualifier;
    for (const key in oEntityAnnotations) {
      if (key.includes("com.sap.vocabularies.Common.v1.SemanticObject") && oEntityAnnotations[key] === sCurrentSemObj) {
        oSemanticObjectAnnotations.bHasEntitySetSO = true;
        sAnnotationMappingTerm = `@${"com.sap.vocabularies.Common.v1.SemanticObjectMapping"}`;
        sAnnotationActionTerm = `@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`;
        if (key.includes("#")) {
          sQualifier = key.split("#")[1];
          sAnnotationMappingTerm = `${sAnnotationMappingTerm}#${sQualifier}`;
          sAnnotationActionTerm = `${sAnnotationActionTerm}#${sQualifier}`;
        }
        if (oEntityAnnotations[sAnnotationMappingTerm]) {
          oSemanticObjectAnnotations.aMappings = oSemanticObjectAnnotations.aMappings.concat(oEntityAnnotations[sAnnotationMappingTerm]);
        }
        if (oEntityAnnotations[sAnnotationActionTerm]) {
          oSemanticObjectAnnotations.aUnavailableActions = oSemanticObjectAnnotations.aUnavailableActions.concat(oEntityAnnotations[sAnnotationActionTerm]);
        }
        break;
      }
    }
    return oSemanticObjectAnnotations;
  }
  async function fnUpdateRelatedAppsDetails(oObjectPageLayout, appComponent) {
    const oMetaModel = oObjectPageLayout.getModel().getMetaModel();
    const oBindingContext = oObjectPageLayout.getBindingContext();
    const path = oBindingContext && oBindingContext.getPath() || "";
    const oMetaPath = oMetaModel.getMetaPath(path);
    // Semantic Key Vocabulary
    const sSemanticKeyVocabulary = `${oMetaPath}/` + `@com.sap.vocabularies.Common.v1.SemanticKey`;
    //Semantic Keys
    const aSemKeys = oMetaModel.getObject(sSemanticKeyVocabulary);
    // Unavailable Actions
    const oEntry = oBindingContext?.getObject();
    if (!oEntry && oBindingContext) {
      oBindingContext.requestObject().then(async function (requestedObject) {
        return CommonUtils.updateRelateAppsModel(oBindingContext, requestedObject, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent);
      }).catch(function (oError) {
        Log.error("Cannot update the related app details", oError);
      });
    } else {
      return CommonUtils.updateRelateAppsModel(oBindingContext, oEntry, oObjectPageLayout, aSemKeys, oMetaModel, oMetaPath, appComponent);
    }
  }

  /**
   * @param oButton
   */
  function fnFireButtonPress(oButton) {
    if (oButton && oButton.isA(["sap.m.Button", "sap.m.OverflowToolbarButton"]) && oButton.getVisible() && oButton.getEnabled()) {
      oButton.firePress();
    }
  }
  function getAppComponent(oControl) {
    if (oControl.isA("sap.fe.core.AppComponent")) {
      return oControl;
    }
    const oOwner = Component.getOwnerComponentFor(oControl);
    if (!oOwner) {
      throw new Error("There should be a sap.fe.core.AppComponent as owner of the control");
    } else {
      return getAppComponent(oOwner);
    }
  }
  function getCurrentPageView(oAppComponent) {
    const rootViewController = oAppComponent.getRootViewController();
    return rootViewController.isFclEnabled() ? rootViewController.getRightmostView() : CommonUtils.getTargetView(oAppComponent.getRootContainer().getCurrentPage());
  }
  function getTargetView(oControl) {
    if (oControl && oControl.isA("sap.ui.core.ComponentContainer")) {
      const oComponent = oControl.getComponentInstance();
      oControl = oComponent && oComponent.getRootControl();
    }
    while (oControl && !oControl.isA("sap.ui.core.mvc.View")) {
      oControl = oControl.getParent();
    }
    return oControl;
  }
  function _fnCheckIsMatch(oObject, oKeysToCheck) {
    for (const sKey in oKeysToCheck) {
      if (oKeysToCheck[sKey] !== oObject[sKey]) {
        return false;
      }
    }
    return true;
  }
  function fnGetContextPathProperties(metaModelContext, sContextPath, oFilter) {
    const oEntityType = metaModelContext.getObject(`${sContextPath}/`) || {},
      oProperties = {};
    for (const sKey in oEntityType) {
      if (oEntityType.hasOwnProperty(sKey) && !/^\$/i.test(sKey) && oEntityType[sKey].$kind && _fnCheckIsMatch(oEntityType[sKey], oFilter || {
        $kind: "Property"
      })) {
        oProperties[sKey] = oEntityType[sKey];
      }
    }
    return oProperties;
  }
  function fnGetIBNActions(oControl, aIBNActions) {
    const aActions = oControl && oControl.getActions();
    if (aActions) {
      aActions.forEach(function (oAction) {
        if (oAction.isA("sap.ui.mdc.actiontoolbar.ActionToolbarAction")) {
          oAction = oAction.getAction();
        }
        if (oAction.isA("sap.m.MenuButton")) {
          const oMenu = oAction.getMenu();
          const aItems = oMenu.getItems();
          aItems.forEach(oItem => {
            if (oItem.data("IBNData")) {
              aIBNActions.push(oItem);
            }
          });
        } else if (oAction.data("IBNData")) {
          aIBNActions.push(oAction);
        }
      });
    }
    return aIBNActions;
  }
  async function fnUpdateDataFieldForIBNButtonsVisibility(aIBNActions, oView) {
    const oParams = {};
    const oAppComponent = CommonUtils.getAppComponent(oView);
    const isSticky = ModelHelper.isStickySessionSupported(oView.getModel().getMetaModel());
    const fnGetLinks = function (oData) {
      if (oData) {
        const aKeys = Object.keys(oData);
        aKeys.forEach(function (sKey) {
          if (sKey.indexOf("_") !== 0 && !sKey.includes("odata.context")) {
            oParams[sKey] = {
              value: oData[sKey]
            };
          }
        });
      }
      if (aIBNActions.length) {
        aIBNActions.forEach(function (oIBNAction) {
          const sSemanticObject = oIBNAction.data("IBNData").semanticObject;
          const sAction = oIBNAction.data("IBNData").action;
          oAppComponent.getShellServices().getLinks([{
            semanticObject: sSemanticObject,
            action: sAction,
            params: oParams
          }]).then(function (aLink) {
            if (oIBNAction.isA("sap.ui.core.Control") || oIBNAction.isA("sap.m.MenuItem")) {
              oIBNAction.setVisible(oIBNAction.getVisible() && aLink && aLink.length === 1 && aLink[0] && aLink[0].length === 1);
            }
            if (isSticky) {
              oIBNAction.getBindingContext("internal").setProperty(oIBNAction.getId().split("--")[1], {
                shellNavigationNotAvailable: !(aLink && aLink.length === 1 && aLink[0] && aLink[0].length === 1)
              });
            }
            return;
          }).catch(function (oError) {
            Log.error("Cannot retrieve the links from the shell service", oError);
          });
        });
      }
    };
    if (oView && oView.getBindingContext()) {
      return oView.getBindingContext()?.requestObject().then(function (oData) {
        return fnGetLinks(oData);
      }).catch(function (oError) {
        Log.error("Cannot retrieve the links from the shell service", oError);
      });
    } else {
      return fnGetLinks();
    }
  }

  /**
   * Updates the menu button visibility if all the underlying selection buttons are hidden.
   * @param IBNActions
   */
  function updateMenuButtonVisiblity(IBNActions) {
    const menuButtonWithIBNAction = [];
    IBNActions.forEach(function (IBNAction) {
      if (IBNAction.isA("sap.m.MenuItem")) {
        menuButtonWithIBNAction.push(IBNAction.getParent()?.getParent());
      }
    });
    menuButtonWithIBNAction.forEach(function (menuAction) {
      const menuItems = menuAction.getMenu().getItems();
      const visibleMenuItems = menuItems.filter(function (menuItem) {
        return menuItem.getVisible();
      });
      if (visibleMenuItems.length === 0) {
        menuAction.setVisible(false);
      }
    });
  }
  function getActionPath(actionContext, bReturnOnlyPath, inActionName, bCheckStaticValue) {
    const sActionName = !inActionName ? actionContext.getObject(actionContext.getPath()).toString() : inActionName;
    let sContextPath = actionContext.getPath().split("/@")[0];
    const sEntityTypeName = actionContext.getObject(sContextPath).$Type;
    const sEntityName = getEntitySetName(actionContext.getModel(), sEntityTypeName);
    if (sEntityName) {
      sContextPath = `/${sEntityName}`;
    }
    if (bCheckStaticValue) {
      return actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable`);
    }
    if (bReturnOnlyPath) {
      return `${sContextPath}/${sActionName}`;
    } else {
      return {
        sContextPath: sContextPath,
        sProperty: actionContext.getObject(`${sContextPath}/${sActionName}@Org.OData.Core.V1.OperationAvailable/$Path`),
        sBindingParameter: actionContext.getObject(`${sContextPath}/${sActionName}/@$ui5.overload/0/$Parameter/0/$Name`)
      };
    }
  }
  function getEntitySetName(oMetaModel, sEntityType) {
    const oEntityContainer = oMetaModel.getObject("/");
    for (const key in oEntityContainer) {
      if (typeof oEntityContainer[key] === "object" && oEntityContainer[key].$Type === sEntityType) {
        return key;
      }
    }
  }
  function computeDisplayMode(oPropertyAnnotations, oCollectionAnnotations) {
    const oTextAnnotation = oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text"],
      oTextArrangementAnnotation = oTextAnnotation && (oPropertyAnnotations && oPropertyAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"] || oCollectionAnnotations && oCollectionAnnotations["@com.sap.vocabularies.UI.v1.TextArrangement"]);
    if (oTextArrangementAnnotation) {
      if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextOnly") {
        return "Description";
      } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextLast") {
        return "ValueDescription";
      } else if (oTextArrangementAnnotation.$EnumMember === "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate") {
        return "Value";
      }
      //Default should be TextFirst if there is a Text annotation and neither TextOnly nor TextLast are set
      return "DescriptionValue";
    }
    return oTextAnnotation ? "DescriptionValue" : "Value";
  }
  function _getEntityType(oContext) {
    const oMetaModel = oContext.getModel().getMetaModel();
    return oMetaModel.getObject(`${oMetaModel.getMetaPath(oContext.getPath())}/$Type`);
  }
  async function _requestObject(sAction, oSelectedContext, sProperty) {
    let oContext = oSelectedContext;
    const nBracketIndex = sAction.indexOf("(");
    if (nBracketIndex > -1) {
      const sTargetType = sAction.slice(nBracketIndex + 1, -1);
      let sCurrentType = _getEntityType(oContext);
      while (sCurrentType !== sTargetType) {
        // Find parent binding context and retrieve entity type
        oContext = oContext.getBinding().getContext();
        if (oContext) {
          sCurrentType = _getEntityType(oContext);
        } else {
          Log.warning("Cannot determine target type to request property value for bound action invocation");
          return Promise.resolve(undefined);
        }
      }
    }
    return oContext.requestObject(sProperty);
  }
  async function requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath) {
    const oPromise = sProperty && sProperty.indexOf("/") === 0 ? requestSingletonProperty(sProperty, oSelectedContext.getModel()) : _requestObject(sAction, oSelectedContext, sProperty);
    return oPromise.then(function (vPropertyValue) {
      return {
        vPropertyValue: vPropertyValue,
        oSelectedContext: oSelectedContext,
        sAction: sAction,
        sDynamicActionEnabledPath: sDynamicActionEnabledPath
      };
    });
  }
  async function setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises) {
    let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    return Promise.all(aRequestPromises).then(function (aResults) {
      if (aResults.length) {
        const aApplicableContexts = [],
          aNotApplicableContexts = [];
        aResults.forEach(function (aResult) {
          if (aResult) {
            if (aResult.vPropertyValue) {
              oInternalModelContext.getModel().setProperty(aResult.sDynamicActionEnabledPath, true);
              aApplicableContexts.push(aResult.oSelectedContext);
            } else {
              aNotApplicableContexts.push(aResult.oSelectedContext);
            }
          }
        });
        setDynamicActionContexts(oInternalModelContext, aResults[0].sAction, aApplicableContexts, aNotApplicableContexts, forContextMenu);
      }
      return;
    }).catch(function (oError) {
      Log.trace("Cannot retrieve property value from path", oError);
    });
  }

  /**
   * @param internalModelContext
   * @param action
   * @param applicable
   * @param notApplicable
   * @param forContextMenu
   */
  function setDynamicActionContexts(internalModelContext, action, applicable, notApplicable) {
    let forContextMenu = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
    const dynamicActionPathPrefix = `${internalModelContext.getPath()}/dynamicActions/${action}`,
      internalModel = internalModelContext.getModel(),
      applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu",
      notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
    internalModel.setProperty(`${dynamicActionPathPrefix}/${applicableProperty}`, applicable);
    internalModel.setProperty(`${dynamicActionPathPrefix}/${notApplicableProperty}`, notApplicable);
  }
  function getSpecificAllowedExpression(aExpressions) {
    const aAllowedExpressionsPriority = CommonUtils.AllowedExpressionsPrio;
    aExpressions.sort(function (a, b) {
      return aAllowedExpressionsPriority.indexOf(a) - aAllowedExpressionsPriority.indexOf(b);
    });
    return aExpressions[0];
  }

  /**
   * Method to return allowed operators for type Guid.
   * @returns Allowed operators for type Guid
   */
  function getOperatorsForGuidProperty() {
    const allowedOperatorsForGuid = ["EQ", "NE"];
    return allowedOperatorsForGuid.toString();
  }
  function getParameterInfo(metaModelContext, sContextPath) {
    const sParameterContextPath = sContextPath.substring(0, sContextPath.lastIndexOf("/"));
    const bResultContext = metaModelContext.getObject(`${sParameterContextPath}/@com.sap.vocabularies.Common.v1.ResultContext`);
    const oParameterInfo = {};
    if (bResultContext && sParameterContextPath !== sContextPath) {
      oParameterInfo.contextPath = sParameterContextPath;
      oParameterInfo.parameterProperties = CommonUtils.getContextPathProperties(metaModelContext, sParameterContextPath);
    }
    return oParameterInfo;
  }
  function addPageContextToSelectionVariant(oSelectionVariant, mPageContext, oView) {
    const oAppComponent = CommonUtils.getAppComponent(oView);
    const oNavigationService = oAppComponent.getNavigationService();
    return oNavigationService.mixAttributesAndSelectionVariant(mPageContext, oSelectionVariant.toJSONString());
  }
  function isStickyEditMode(oControl) {
    const bIsStickyMode = ModelHelper.isStickySessionSupported(oControl.getModel().getMetaModel());
    const bUIEditable = CommonUtils.getIsEditable(oControl);
    return bIsStickyMode && bUIEditable;
  }
  /**
   * Retrieves the user defaults from the startup app state (if available) or the startup parameter and sets them to a model.
   * @param appComponent
   * @param parameters
   * @param model
   * @param isAction
   * @param isCreate
   * @param actionDefaultValues
   */
  async function setUserDefaults(appComponent, parameters, model, isAction, isCreate, actionDefaultValues) {
    const BaseType = (await __ui5_require_async("sap/ui/mdc/enums/BaseType")).default;
    const TypeMap = (await __ui5_require_async("sap/ui/mdc/odata/v4/TypeMap")).default;
    const componentData = appComponent.getComponentData(),
      startupParameters = componentData && componentData.startupParameters || {},
      shellServices = appComponent.getShellServices();
    const startupAppState = await shellServices.getStartupAppState(appComponent);
    const startupAppStateData = startupAppState?.getData() || {},
      extendedParameters = startupAppStateData.selectionVariant && startupAppStateData.selectionVariant.SelectOptions || [];
    parameters.forEach(function (oParameter) {
      const sPropertyName = isAction ? `/${oParameter.name}` : oParameter.getPath?.().slice(oParameter.getPath().lastIndexOf("/") + 1);
      const sParameterName = isAction ? sPropertyName.slice(1) : sPropertyName;
      if (actionDefaultValues && isCreate) {
        if (actionDefaultValues[sParameterName]) {
          model.setProperty(sPropertyName, actionDefaultValues[sParameterName]);
        }
      } else if (startupParameters[sParameterName]) {
        const parametertType = oParameter.type ? TypeMap.getBaseType(oParameter.type) : BaseType.String;
        const typeInstance = TypeMap.getDataTypeInstance(parametertType);
        model.setProperty(sPropertyName, typeInstance.parseValue(startupParameters[sParameterName][0], "string"));
      } else if (extendedParameters.length > 0) {
        for (const oExtendedParameter of extendedParameters) {
          if (oExtendedParameter.PropertyName === sParameterName) {
            const oRange = oExtendedParameter.Ranges.length ? oExtendedParameter.Ranges[oExtendedParameter.Ranges.length - 1] : undefined;
            if (oRange && oRange.Sign === "I" && oRange.Option === "EQ") {
              model.setProperty(sPropertyName, oRange.Low); // high is ignored when Option=EQ
            }
          }
        }
      }
    });
  }
  function getAdditionalParamsForCreate(oStartupParameters, oInboundParameters) {
    const oInbounds = oInboundParameters,
      aCreateParameters = oInbounds !== undefined ? Object.keys(oInbounds).filter(function (sParameter) {
        return oInbounds[sParameter].useForCreate;
      }) : [];
    let oRet;
    for (const element of aCreateParameters) {
      const sCreateParameter = element;
      const aValues = oStartupParameters && oStartupParameters[sCreateParameter];
      if (aValues && aValues.length === 1) {
        oRet = oRet || Object.create(null);
        oRet[sCreateParameter] = aValues[0];
      }
    }
    return oRet;
  }
  function getSemanticObjectMapping(oOutbound) {
    const aSemanticObjectMapping = [];
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (oOutbound.parameters) {
      const aParameters = Object.keys(oOutbound.parameters) || [];
      if (aParameters.length > 0) {
        aParameters.forEach(function (sParam) {
          const oMapping = oOutbound.parameters[sParam];
          if (oMapping.value && oMapping.value.value && oMapping.value.format === "binding") {
            // using the format of UI.Mapping
            const oSemanticMapping = {
              LocalProperty: {
                $PropertyPath: oMapping.value.value
              },
              SemanticObjectProperty: sParam
            };
            if (aSemanticObjectMapping.length > 0) {
              // To check if the semanticObject Mapping is done for the same local property more that once then first one will be considered
              for (const element of aSemanticObjectMapping) {
                if (element.LocalProperty?.$PropertyPath !== oSemanticMapping.LocalProperty.$PropertyPath) {
                  aSemanticObjectMapping.push(oSemanticMapping);
                }
              }
            } else {
              aSemanticObjectMapping.push(oSemanticMapping);
            }
          }
        });
      }
    }
    return aSemanticObjectMapping;
  }
  function getHeaderFacetItemConfigForExternalNavigation(oViewData, oCrossNav) {
    const oHeaderFacetItems = {};
    let sId;
    const oControlConfig = oViewData.controlConfiguration;
    for (const config in oControlConfig) {
      if (config.includes("@com.sap.vocabularies.UI.v1.DataPoint") || config.includes("@com.sap.vocabularies.UI.v1.Chart")) {
        const sOutbound = oControlConfig[config].navigation?.targetOutbound?.outbound;
        if (sOutbound !== undefined) {
          const oOutbound = oCrossNav[sOutbound];
          if (oOutbound.semanticObject && oOutbound.action) {
            if (config.includes("Chart")) {
              sId = generate(["fe", "MicroChartLink", config]);
            } else {
              sId = generate(["fe", "HeaderDPLink", config]);
            }
            const aSemanticObjectMapping = CommonUtils.getSemanticObjectMapping(oOutbound);
            oHeaderFacetItems[sId] = {
              semanticObject: oOutbound.semanticObject,
              action: oOutbound.action,
              semanticObjectMapping: aSemanticObjectMapping
            };
          } else {
            Log.error(`Cross navigation outbound is configured without semantic object and action for ${sOutbound}`);
          }
        }
      }
    }
    return oHeaderFacetItems;
  }
  function setSemanticObjectMappings(oSelectionVariant, vMappings) {
    const oMappings = typeof vMappings === "string" ? JSON.parse(vMappings) : vMappings;
    for (const element of oMappings) {
      const sLocalProperty = element["LocalProperty"] && element["LocalProperty"]["$PropertyPath"] || element["@com.sap.vocabularies.Common.v1.LocalProperty"] && element["@com.sap.vocabularies.Common.v1.LocalProperty"]["$Path"];
      const sSemanticObjectProperty = element["SemanticObjectProperty"] || element["@com.sap.vocabularies.Common.v1.SemanticObjectProperty"];
      const oSelectOption = oSelectionVariant.getSelectOption(sLocalProperty);
      if (oSelectOption) {
        //Create a new SelectOption with sSemanticObjectProperty as the property Name and remove the older one
        oSelectionVariant.removeSelectOption(sLocalProperty);
        oSelectionVariant.massAddSelectOption(sSemanticObjectProperty, oSelectOption);
      }
    }
    return oSelectionVariant;
  }
  async function fnGetSemanticObjectsFromPath(oMetaModel, sPath, sQualifier) {
    return new Promise(function (resolve) {
      let sSemanticObject, aSemanticObjectUnavailableActions;
      if (sQualifier === "") {
        sSemanticObject = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObject"}`);
        aSemanticObjectUnavailableActions = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}`);
      } else {
        sSemanticObject = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObject"}#${sQualifier}`);
        aSemanticObjectUnavailableActions = oMetaModel.getObject(`${sPath}@${"com.sap.vocabularies.Common.v1.SemanticObjectUnavailableActions"}#${sQualifier}`);
      }
      const aSemanticObjectForGetLinks = [{
        semanticObject: sSemanticObject
      }];
      const oSemanticObject = {
        semanticObject: sSemanticObject
      };
      resolve({
        semanticObjectPath: sPath,
        semanticObjectForGetLinks: aSemanticObjectForGetLinks,
        semanticObject: oSemanticObject,
        unavailableActions: aSemanticObjectUnavailableActions
      });
    });
  }
  async function fnGetSemanticObjectPromise(oMetaModel, sPath, sQualifier) {
    return CommonUtils.getSemanticObjectsFromPath(oMetaModel, sPath, sQualifier);
  }
  function getFilterAllowedExpression(oFilterRestrictionsAnnotation) {
    const mAllowedExpressions = {};
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation.FilterExpressionRestrictions !== undefined) {
      oFilterRestrictionsAnnotation.FilterExpressionRestrictions.forEach(function (oProperty) {
        if (oProperty.Property && oProperty.AllowedExpressions !== undefined) {
          //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
          if (mAllowedExpressions[oProperty.Property.$PropertyPath] !== undefined) {
            mAllowedExpressions[oProperty.Property.$PropertyPath].push(oProperty.AllowedExpressions);
          } else {
            mAllowedExpressions[oProperty.Property.$PropertyPath] = [oProperty.AllowedExpressions];
          }
        }
      });
    }
    return mAllowedExpressions;
  }
  function getFilterRestrictions(oFilterRestrictionsAnnotation, sRestriction) {
    let aProps = [];
    if (oFilterRestrictionsAnnotation && oFilterRestrictionsAnnotation[sRestriction]) {
      aProps = oFilterRestrictionsAnnotation[sRestriction].map(function (oProperty) {
        return oProperty.$PropertyPath;
      });
    }
    return aProps;
  }
  function _fetchPropertiesForNavPath(paths, navPath, props) {
    const navPathPrefix = navPath + "/";
    return paths.reduce((outPaths, pathToCheck) => {
      if (pathToCheck.startsWith(navPathPrefix)) {
        const outPath = pathToCheck.replace(navPathPrefix, "");
        if (!outPaths.includes(outPath)) {
          outPaths.push(outPath);
        }
      }
      return outPaths;
    }, props);
  }
  function getFilterRestrictionsByPath(entityPath, oContext) {
    // NOTE: For getting FilterAllowedExpressions please use 'getAllowedFilterExpressionForProperty' from 'sap/fe/core/converters/controls/ListReport/FilterField.ts'.
    const oRet = {
      RequiredProperties: [],
      NonFilterableProperties: [],
      FilterAllowedExpressions: {}
    };
    let oFilterRestrictions;
    const navigationText = "$NavigationPropertyBinding";
    const frTerm = "@Org.OData.Capabilities.V1.FilterRestrictions";
    const entityTypePathParts = entityPath.replaceAll("%2F", "/").split("/").filter(ModelHelper.filterOutNavPropBinding);
    const entityTypePath = `/${entityTypePathParts.join("/")}/`;
    const entitySetPath = ModelHelper.getEntitySetPath(entityPath, oContext);
    const entitySetPathParts = entitySetPath.split("/").filter(ModelHelper.filterOutNavPropBinding);
    const isContainment = oContext.getObject(`${entityTypePath}$ContainsTarget`);
    const containmentNavPath = !!isContainment && entityTypePathParts[entityTypePathParts.length - 1];

    //LEAST PRIORITY - Filter restrictions directly at Entity Set
    //e.g. FR in "NS.EntityContainer/SalesOrderManage" ContextPath: /SalesOrderManage
    if (!isContainment) {
      oFilterRestrictions = oContext.getObject(`${entitySetPath}${frTerm}`);
      oRet.RequiredProperties = getFilterRestrictions(oFilterRestrictions, "RequiredProperties") || [];
      const resultContextCheck = oContext.getObject(`${entityTypePath}@com.sap.vocabularies.Common.v1.ResultContext`);
      if (!resultContextCheck) {
        oRet.NonFilterableProperties = getFilterRestrictions(oFilterRestrictions, "NonFilterableProperties") || [];
      }
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = getFilterAllowedExpression(oFilterRestrictions) || {};
    }
    if (entityTypePathParts.length > 1) {
      const navPath = isContainment ? containmentNavPath : entitySetPathParts[entitySetPathParts.length - 1];
      // In case of containment we take entitySet provided as parent. And in case of normal we would remove the last navigation from entitySetPath.
      const parentEntitySetPath = isContainment ? entitySetPath : `/${entitySetPathParts.slice(0, -1).join(`/${navigationText}/`)}`;
      //THIRD HIGHEST PRIORITY - Reading property path restrictions - Annotation at main entity but directly on navigation property path
      //e.g. Parent Customer with PropertyPath="Set/CityName" ContextPath: Customer/Set
      const oParentRet = {
        RequiredProperties: [],
        NonFilterableProperties: [],
        FilterAllowedExpressions: {}
      };
      if (!navPath.includes("%2F")) {
        const oParentFR = oContext.getObject(`${parentEntitySetPath}${frTerm}`);
        oRet.RequiredProperties = _fetchPropertiesForNavPath(getFilterRestrictions(oParentFR, "RequiredProperties") || [], navPath, oRet.RequiredProperties || []);
        oRet.NonFilterableProperties = _fetchPropertiesForNavPath(getFilterRestrictions(oParentFR, "NonFilterableProperties") || [], navPath, oRet.NonFilterableProperties || []);
        //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
        const completeAllowedExps = getFilterAllowedExpression(oParentFR) || {};
        oParentRet.FilterAllowedExpressions = Object.keys(completeAllowedExps).reduce((outProp, propPath) => {
          if (propPath.startsWith(navPath + "/")) {
            const outPropPath = propPath.replace(navPath + "/", "");
            outProp[outPropPath] = completeAllowedExps[propPath];
          }
          return outProp;
        }, {});
      }

      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions || {}, oParentRet.FilterAllowedExpressions || {});

      //SECOND HIGHEST priority - Navigation restrictions
      //e.g. Parent "/Customer" with NavigationPropertyPath="Set" ContextPath: Customer/Set
      const oNavRestrictions = MetaModelFunction.getNavigationRestrictions(oContext, parentEntitySetPath, navPath.replaceAll("%2F", "/"));
      const oNavFilterRest = oNavRestrictions && oNavRestrictions["FilterRestrictions"];
      const navResReqProps = getFilterRestrictions(oNavFilterRest, "RequiredProperties") || [];
      oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navResReqProps));
      const navNonFilterProps = getFilterRestrictions(oNavFilterRest, "NonFilterableProperties") || [];
      oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navNonFilterProps));
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions || {}, getFilterAllowedExpression(oNavFilterRest) || {});

      //HIGHEST priority - Restrictions having target with navigation association entity
      // e.g. FR in "CustomerParameters/Set" ContextPath: "Customer/Set"
      const navAssociationEntityRest = oContext.getObject(`/${entityTypePathParts.join("/")}${frTerm}`);
      const navAssocReqProps = getFilterRestrictions(navAssociationEntityRest, "RequiredProperties") || [];
      oRet.RequiredProperties = uniqueSort(oRet.RequiredProperties.concat(navAssocReqProps));
      const navAssocNonFilterProps = getFilterRestrictions(navAssociationEntityRest, "NonFilterableProperties") || [];
      oRet.NonFilterableProperties = uniqueSort(oRet.NonFilterableProperties.concat(navAssocNonFilterProps));
      //SingleValue | MultiValue | SingleRange | MultiRange | SearchExpression | MultiRangeOrSearchExpression
      oRet.FilterAllowedExpressions = mergeObjects({}, oRet.FilterAllowedExpressions, getFilterAllowedExpression(navAssociationEntityRest) || {});
    }
    return oRet;
  }
  async function templateControlFragment(sFragmentName, oPreprocessorSettings, oInOptions, oModifier) {
    const oOptions = oInOptions || {};
    if (oModifier && typeof sFragmentName === "string") {
      return oModifier.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions.view).then(function (oFragment) {
        // This is required as Flex returns an HTMLCollection as templating result in XML time.
        return oModifier.targets === "xmlTree" && oFragment.length > 0 ? oFragment[0] : oFragment;
      });
    } else {
      const fragmentData = typeof sFragmentName === "string" ? XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment") : sFragmentName;
      const oFragment = await XMLPreprocessor.process(fragmentData, {
        name: sFragmentName
      }, oPreprocessorSettings);
      const oControl = oFragment.firstElementChild;
      if (!!oOptions.isXML && oControl) {
        return oControl;
      }
      let owner = oPreprocessorSettings.appComponent ?? {
        runAsOwner: fn => fn()
      };
      if (oOptions.containingView) {
        const viewOwner = Component.getOwnerComponentFor(oOptions.containingView);
        if (viewOwner) {
          owner = viewOwner;
        }
      }
      let containingView;
      if (oOptions.view && !oOptions.controller) {
        // this is overall stupid, in case we are coming from the delegate with an xml node instead of a fragment we need to pass the containingView in there (done by the oModifier call for instance)
        // But in other runtime case where we are here we need to maintain the controller and thus cannot have a containingView...
        containingView = oOptions.view;
      }
      return owner.runAsOwner(async () => {
        return Fragment.load({
          id: oOptions.id,
          type: "SCOPEDFEFRAGMENT",
          contextPath: oOptions.contextPath,
          definition: oFragment,
          controller: oOptions.controller,
          containingView: containingView
        });
      });
    }
  }
  function getSingletonPath(path, metaModel) {
    const parts = path.split("/").filter(Boolean),
      propertyName = parts.pop(),
      navigationPath = parts.join("/"),
      entitySet = navigationPath && metaModel.getObject(`/${navigationPath}`);
    if (entitySet?.$kind === "Singleton") {
      const singletonName = parts[parts.length - 1];
      return `/${singletonName}/${propertyName}`;
    }
    return undefined;
  }
  async function requestSingletonProperty(path, model) {
    if (!path || !model) {
      return Promise.resolve(null);
    }
    const metaModel = model.getMetaModel();
    // Find the underlying entity set from the property path and check whether it is a singleton.
    const resolvedPath = getSingletonPath(path, metaModel);
    if (resolvedPath) {
      const propertyBinding = model.bindProperty(resolvedPath);
      return propertyBinding.requestValue();
    }
    return Promise.resolve(null);
  }

  // Get the path for action parameters that is needed to read the annotations
  function getParameterPath(sPath, sParameter) {
    let sContext;
    if (sPath.includes("@$ui5.overload")) {
      sContext = sPath.split("@$ui5.overload")[0];
    } else {
      // For Unbound Actions in Action Parameter Dialogs
      const aAction = sPath.split("/0")[0].split(".");
      sContext = `/${aAction[aAction.length - 1]}/`;
    }
    return sContext + sParameter;
  }

  /**
   * Get resolved expression binding used for texts at runtime.
   * @param expBinding
   * @param control
   * @returns A string after resolution.
   */
  function _fntranslatedTextFromExpBindingString(expBinding, control) {
    // The idea here is to create dummy element with the expresion binding.
    // Adding it as dependent to the view/control would propagate all the models to the dummy element and resolve the binding.
    // We remove the dummy element after that and destroy it.

    const anyResourceText = new AnyElement({
      anyText: expBinding
    });
    control.addDependent(anyResourceText);
    const resultText = anyResourceText.getAnyText();
    control.removeDependent(anyResourceText);
    anyResourceText.destroy();
    return resultText;
  }
  /**
   * Check if the current device has a small screen.
   * @returns A Boolean.
   */
  function isSmallDevice() {
    return !Device.system.desktop || Device.resize.width <= 320;
  }

  /**
   * Parses a SelectionVariant or SelectionPresentationVariant annotation and creates the corresponding filters.
   * @param control MDC Chart, MDC Table or MultiView control on which the filters are applied
   * @param annotationPath SelectionVariant or SelectionPresentationVariant annotation
   * @returns Returns an array of filters.
   */
  function getFiltersFromAnnotation(control, annotationPath) {
    const metaModel = CommonUtils.getAppComponent(control).getMetaModel();
    const svContext = metaModel.getMetaContext(`${control.data("entityType")}${annotationPath}`);
    const propertyFilters = {};
    let annotation = MetaModelConverter.getInvolvedDataModelObjects(svContext).targetObject;
    if (isAnnotationOfType(annotation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType")) {
      annotation = annotation.SelectionVariant;
    }
    if (!annotation || !isAnnotationOfType(annotation, "com.sap.vocabularies.UI.v1.SelectionVariantType")) {
      return [];
    }
    (annotation.SelectOptions || []).forEach(selectOption => {
      if (selectOption.PropertyName?.$target && selectOption.Ranges?.length > 0) {
        const propertyType = selectOption.PropertyName.$target.type;
        const propertyPath = selectOption.PropertyName.value;
        for (const j in selectOption.Ranges) {
          const range = getRangeDefinition(selectOption.Ranges[j], propertyType);
          propertyFilters[propertyPath] = (propertyFilters[propertyPath] ?? []).concat(new Filter(propertyPath, range.operator, range.rangeLow, range.rangeHigh));
        }
      }
    });
    const filters = [];
    for (const path in propertyFilters) {
      filters.push(new Filter({
        filters: propertyFilters[path],
        and: false
      }));
    }
    return filters;
  }
  function getConverterContextForPath(sMetaPath, oMetaModel, sEntitySet, oDiagnostics) {
    const oContext = oMetaModel.createBindingContext(sMetaPath);
    return ConverterContext?.createConverterContextForMacro(sEntitySet, oContext || oMetaModel, oDiagnostics, mergeObjects);
  }

  /**
   * Gets the context of the DraftRoot path.
   * If a view has been created with the draft Root Path, this method returns its bindingContext.
   * Where no view is found a new created context is returned.
   * The new created context request the key of the entity in order to get the Etag of this entity.
   * @param programmingModel
   * @param view
   * @param appComponent
   * @param bindingParameters
   * @returns Returns a Promise
   */
  async function createRootContext(programmingModel, view, appComponent, bindingParameters) {
    const context = view.getBindingContext();
    if (context) {
      const rootContextPath = programmingModel === "Draft" ? ModelHelper.getDraftRootPath(context) : ModelHelper.getStickyRootPath(context);
      let simpleRootContext;
      if (rootContextPath) {
        // Check if a view matches with the draft root path, and had already loaded its context
        const existingBindingContextOnPage = appComponent.getRootViewController().getInstancedViews().find(pageView => pageView.getBindingContext()?.getPath() === rootContextPath && pageView.getBindingContext()?.getObject() !== undefined)?.getBindingContext();
        if (existingBindingContextOnPage) {
          return existingBindingContextOnPage;
        }
        const internalModel = view.getModel("internal");
        simpleRootContext = internalModel.getProperty("/simpleRootContext");
        if (simpleRootContext?.getPath() === rootContextPath) {
          return simpleRootContext;
        }
        const model = context.getModel();
        simpleRootContext = model.bindContext(rootContextPath, undefined, bindingParameters).getBoundContext();
        await CommonUtils.waitForContextRequested(simpleRootContext);
        // Store this new created context to use it on the next iterations
        internalModel.setProperty("/simpleRootContext", simpleRootContext);
        return simpleRootContext;
      }
    }
  }

  /**
   * Helper method to determine if the source is to be display for the editmode or not.
   * @param source
   * @returns If the source is to be displayed in edit mode
   */
  function getIsEditable(source) {
    const managedObject = source.isA("sap.fe.core.PageController") ? source.getView() : source;
    return managedObject.getBindingContext("ui")?.getProperty("/isEditable");
  }
  const CommonUtils = {
    INLINEEDIT_UPDATEGROUPID: "inline",
    fireButtonPress: fnFireButtonPress,
    getTargetView: getTargetView,
    getCurrentPageView: getCurrentPageView,
    hasTransientContext: fnHasTransientContexts,
    updateRelatedAppsDetails: fnUpdateRelatedAppsDetails,
    getAppComponent: getAppComponent,
    getContextPathProperties: fnGetContextPathProperties,
    getParameterInfo: getParameterInfo,
    updateDataFieldForIBNButtonsVisibility: fnUpdateDataFieldForIBNButtonsVisibility,
    getEntitySetName: getEntitySetName,
    getActionPath: getActionPath,
    computeDisplayMode: computeDisplayMode,
    isStickyEditMode: isStickyEditMode,
    getOperatorsForGuidProperty: getOperatorsForGuidProperty,
    addPageContextToSelectionVariant: addPageContextToSelectionVariant,
    setUserDefaults: setUserDefaults,
    getIBNActions: fnGetIBNActions,
    getHeaderFacetItemConfigForExternalNavigation: getHeaderFacetItemConfigForExternalNavigation,
    getSemanticObjectMapping: getSemanticObjectMapping,
    setSemanticObjectMappings: setSemanticObjectMappings,
    getSemanticObjectPromise: fnGetSemanticObjectPromise,
    getSemanticObjectsFromPath: fnGetSemanticObjectsFromPath,
    waitForContextRequested: waitForContextRequested,
    getFilterRestrictionsByPath: getFilterRestrictionsByPath,
    getSpecificAllowedExpression: getSpecificAllowedExpression,
    getAdditionalParamsForCreate: getAdditionalParamsForCreate,
    requestSingletonProperty: requestSingletonProperty,
    templateControlFragment: templateControlFragment,
    FilterRestrictions: {
      REQUIRED_PROPERTIES: "RequiredProperties",
      NON_FILTERABLE_PROPERTIES: "NonFilterableProperties",
      ALLOWED_EXPRESSIONS: "FilterAllowedExpressions"
    },
    AllowedExpressionsPrio: ["SingleValue", "MultiValue", "SingleRange", "MultiRange", "SearchExpression", "MultiRangeOrSearchExpression"],
    normalizeSearchTerm: normalizeSearchTerm,
    setContextsBasedOnOperationAvailable: setContextsBasedOnOperationAvailable,
    setDynamicActionContexts: setDynamicActionContexts,
    requestProperty: requestProperty,
    getParameterPath: getParameterPath,
    getRelatedAppsMenuItems: _getRelatedAppsMenuItems,
    getTranslatedTextFromExpBindingString: _fntranslatedTextFromExpBindingString,
    updateRelateAppsModel: updateRelateAppsModel,
    getSemanticObjectAnnotations: _getSemanticObjectAnnotations,
    getFiltersFromAnnotation: getFiltersFromAnnotation,
    createRootContext: createRootContext,
    updateMenuButtonVisiblity: updateMenuButtonVisiblity,
    isSmallDevice,
    getConverterContextForPath,
    getIsEditable: getIsEditable
  };
  return CommonUtils;
}, false);
//# sourceMappingURL=CommonUtils-dbg.js.map
