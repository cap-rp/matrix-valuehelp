/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/base/util/deepEqual", "sap/base/util/isPlainObject", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/KeepAliveHelper", "sap/fe/core/helpers/ToES6Promise", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/field/FieldRuntime", "sap/fe/navigation/SelectionVariant", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/util/XMLPreprocessor", "sap/fe/macros/quickView/QuickViewHeaderOptions", "sap/ui/mdc/LinkDelegate", "sap/ui/mdc/enums/LinkType", "sap/ui/mdc/link/Factory", "sap/ui/mdc/link/LinkItem", "sap/ui/mdc/ushell/SemanticObjectMapping", "sap/ui/mdc/ushell/SemanticObjectMappingItem", "sap/ui/mdc/ushell/SemanticObjectUnavailableAction", "sap/ui/model/json/JSONModel"], function (Log, deepClone, deepEqual, isPlainObject, BindingToolkit, CommonUtils, KeepAliveHelper, toES6Promise, SemanticObjectHelper, FieldHelper, FieldRuntime, SelectionVariant, Fragment, Library, XMLTemplateProcessor, XMLPreprocessor, QuickViewHeaderOptions, LinkDelegate, LinkType, Factory, LinkItem, SemanticObjectMapping, SemanticObjectMappingItem, SemanticObjectUnavailableAction, JSONModel) {
  "use strict";

  var getDynamicPathFromSemanticObject = SemanticObjectHelper.getDynamicPathFromSemanticObject;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  //FIXME: only necessary due to the access of private sap.ui.mdc.Link methods

  const SimpleLinkDelegate = Object.assign({}, LinkDelegate);
  SimpleLinkDelegate.apiVersion = 2;
  const CONSTANTS = {
    iLinksShownInPopup: 3,
    sapmLink: "sap.m.Link",
    sapuimdcLink: "sap.ui.mdc.Link",
    sapuimdclinkLinkItem: "sap.ui.mdc.link.LinkItem",
    sapmObjectIdentifier: "sap.m.ObjectIdentifier",
    sapmObjectStatus: "sap.m.ObjectStatus"
  };
  SimpleLinkDelegate.getConstants = function () {
    return CONSTANTS;
  };

  /**
   * This will return an array of the SemanticObjects as strings given by the payload.
   * @private
   * @param oPayload The payload defined by the application
   * @param oMetaModel The ODataMetaModel received from the Link
   * @returns The context pointing to the current EntityType.
   */
  SimpleLinkDelegate._getEntityType = function (oPayload, oMetaModel) {
    if (oMetaModel) {
      return oMetaModel.createBindingContext(oPayload.entityType) ?? undefined;
    } else {
      return undefined;
    }
  };
  /**
   * This will return an array of the SemanticObjects as strings given by the payload.
   * @private
   * @param oPayload The payload defined by the application
   * @param oMetaModel The ODataMetaModel received from the Link
   * @returns A model containing the payload information
   */
  SimpleLinkDelegate._getSemanticsModel = function (oPayload, oMetaModel) {
    if (oMetaModel) {
      return new JSONModel(oPayload);
    } else {
      return undefined;
    }
  };
  /**
   * This will return an array of the SemanticObjects as strings given by the payload.
   * @private
   * @param oPayload The payload defined by the application
   * @param oMetaModel The ODataMetaModel received from the Link
   * @returns An array containing SemanticObjects based of the payload
   */
  SimpleLinkDelegate._getDataField = function (oPayload, oMetaModel) {
    return oMetaModel.createBindingContext(oPayload.dataField) ?? undefined;
  };
  /**
   * This will return an array of the SemanticObjects as strings given by the payload.
   * @private
   * @param oPayload The payload defined by the application
   * @param oMetaModel The ODataMetaModel received from the Link
   * @returns Ancontaining SemanticObjects based of the payload
   */
  SimpleLinkDelegate._getContact = function (oPayload, oMetaModel) {
    return oMetaModel.createBindingContext(oPayload.contact) ?? undefined;
  };
  SimpleLinkDelegate.preparePayload = function (link) {
    // payload has been modified by fetching Semantic Objects names with path
    const payload = SimpleLinkDelegate.calculatePayloadWithDynamicSemanticObjectsResolved(link);
    if (!payload.LinkId) {
      payload.LinkId = this.oControl?.isA(CONSTANTS.sapuimdcLink) ? this.oControl.getId() : undefined;
    }
    if (payload.LinkId) {
      payload.titleLink = this.oControl.getModel("$sapuimdcLink")?.getProperty("/titleLinkHref");
    }
    return payload;
  };
  SimpleLinkDelegate.fnTemplateFragment = async function (link) {
    const containingView = CommonUtils.getTargetView(link);
    const appComponent = CommonUtils.getAppComponent(containingView);
    let fragmentName = "";
    const preProcessorSettings = {
      bindingContexts: {},
      models: {},
      appComponent
    };
    const oPayloadToUse = SimpleLinkDelegate.preparePayload(link);
    const oSemanticsModel = this._getSemanticsModel(oPayloadToUse, this.oMetaModel);
    this.semanticModel = oSemanticsModel;
    let contextPath;
    if (oPayloadToUse.entityType && this._getEntityType(oPayloadToUse, this.oMetaModel) && oSemanticsModel) {
      fragmentName = "sap.fe.macros.quickView.fragments.QuickViewForEntity";
      preProcessorSettings.bindingContexts = {
        entityType: this._getEntityType(oPayloadToUse, this.oMetaModel),
        semantic: oSemanticsModel.createBindingContext("/")
      };
      contextPath = this._getEntityType(oPayloadToUse, this.oMetaModel)?.getPath();
      preProcessorSettings.models = {
        entityType: this.oMetaModel,
        semantic: oSemanticsModel
      };
    } else if (oPayloadToUse.dataField && this._getDataField(oPayloadToUse, this.oMetaModel) && oSemanticsModel) {
      fragmentName = "sap.fe.macros.quickView.fragments.QuickViewForDataField";
      contextPath = this._getDataField(oPayloadToUse, this.oMetaModel)?.getPath();
      preProcessorSettings.bindingContexts = {
        dataField: this._getDataField(oPayloadToUse, this.oMetaModel),
        semantic: oSemanticsModel.createBindingContext("/")
      };
      preProcessorSettings.models = {
        dataField: this.oMetaModel,
        semantic: oSemanticsModel
      };
    }
    preProcessorSettings.models.entitySet = this.oMetaModel;
    preProcessorSettings.models.metaModel = this.oMetaModel;
    preProcessorSettings.models.converterContext = containingView.getModel("_pageModel");
    preProcessorSettings.bindingContexts.converterContext = preProcessorSettings.models.converterContext.createBindingContext("/");
    if (this.oControl && this.oControl.getModel("viewData")) {
      preProcessorSettings.models.viewData = this.oControl.getModel("viewData");
      preProcessorSettings.bindingContexts.viewData = this.oControl.getModel("viewData")?.createBindingContext("/");
    }
    const fragment = XMLTemplateProcessor.loadTemplate(fragmentName, "fragment");
    const templatedFragment = await XMLPreprocessor.process(fragment, {
      name: fragmentName
    }, preProcessorSettings);
    const templateComponent = containingView.getController().getOwnerComponent();
    const popoverContent = await templateComponent.runAsOwner(async () => {
      return await Fragment.load({
        definition: templatedFragment,
        controller: containingView.getController()
      });
    });
    if (contextPath && popoverContent.isA("sap.m.VBox")) {
      const quickViewHeader = new QuickViewHeaderOptions({
        contextPath: oPayloadToUse.contextPath,
        metaPath: contextPath,
        semanticPayload: oSemanticsModel?.getObject("/")
      });
      popoverContent.insertItem(quickViewHeader, 0);
    }
    popoverContent.setModel(oSemanticsModel, "semantic");
    if (popoverContent) {
      if (preProcessorSettings.models && preProcessorSettings.models.semantic) {
        popoverContent.setModel(preProcessorSettings.models.semantic, "semantic");
        popoverContent.setBindingContext(preProcessorSettings.bindingContexts.semantic, "semantic");
      }
      if (preProcessorSettings.bindingContexts && preProcessorSettings.bindingContexts.entityType) {
        popoverContent.setModel(preProcessorSettings.models.entityType, "entityType");
        popoverContent.setBindingContext(preProcessorSettings.bindingContexts.entityType, "entityType");
      }
    }
    return popoverContent;
  };

  /**
   * Retrieves and returns the relevant <code>additionalContent</code> for the <code>Link</code> control as an array.
   * @public
   * @param mdcLinkControl Instance of the <code>Link</code> control
   * @returns Once the promise resolves, an array of {@link sap.ui.core.Control} is returned
   */
  SimpleLinkDelegate.fetchAdditionalContent = async function (mdcLinkControl) {
    const payLoad = mdcLinkControl.getPayload();
    this.oControl = mdcLinkControl;
    const aNavigateRegexpMatch = payLoad?.navigationPath?.match(/{(.*?)}/);
    const listBinding = mdcLinkControl.getBindingContext()?.getBinding();
    const aggregation = listBinding?.getAggregation && listBinding.getAggregation();
    const isListBindingAnalytical = aggregation !== undefined && !aggregation.hierarchyQualifier;
    const modelParameters = isListBindingAnalytical ? {
      $$ownRequest: true
    } : undefined;
    const bindingContext = aNavigateRegexpMatch && aNavigateRegexpMatch.length > 1 && aNavigateRegexpMatch[1] ? mdcLinkControl.getModel()?.bindContext(aNavigateRegexpMatch[1], mdcLinkControl.getBindingContext() || undefined, modelParameters) : null;
    this.payload = payLoad;
    this.oMetaModel = mdcLinkControl.getModel()?.getMetaModel();
    const popoverContent = await this.fnTemplateFragment(mdcLinkControl);
    if (bindingContext) {
      const boundContext = bindingContext.getBoundContext();
      if (boundContext) {
        popoverContent.setBindingContext(boundContext);
      }
    }
    return [popoverContent];
  };
  SimpleLinkDelegate._fetchLinkCustomData = function (_oLink) {
    if (_oLink.getParent() && _oLink.isA(CONSTANTS.sapuimdcLink) && (_oLink.getParent()?.isA(CONSTANTS.sapmLink) || _oLink.getParent()?.isA(CONSTANTS.sapmObjectIdentifier) || _oLink.getParent()?.isA(CONSTANTS.sapmObjectStatus) || _oLink.getParent()?.isA("sap.fe.macros.controls.TextLink"))) {
      return _oLink.getCustomData();
    } else {
      return undefined;
    }
  };
  /**
   * Fetches the relevant {@link sap.ui.mdc.link.LinkItem} for the Link and returns them.
   * @public
   * @param oLink The Payload of the Link given by the application
   * @param oBindingContext The ContextObject of the Link
   * @param oInfoLog The InfoLog of the Link
   * @returns Once the promise resolves an array of {@link sap.ui.mdc.link.LinkItem} is returned
   */
  SimpleLinkDelegate.fetchLinkItems = async function (oLink, oBindingContext, oInfoLog) {
    const oPayload = oLink.getPayload();
    if (oBindingContext && SimpleLinkDelegate._getSemanticObjects(oPayload)) {
      if (oInfoLog) {
        oInfoLog.initialize(SimpleLinkDelegate._getSemanticObjects(oPayload));
      }
      const _oLinkCustomData = this._link && this._fetchLinkCustomData(this._link);
      this.aLinkCustomData = _oLinkCustomData && this._fetchLinkCustomData(this._link)?.map(function (linkItem) {
        return linkItem.getValue();
      });

      //here oContext is the context of the link
      const oSemanticAttributesResolved = SimpleLinkDelegate._calculateSemanticAttributes(oBindingContext, oPayload, oInfoLog, oLink);
      const oSemanticAttributes = oSemanticAttributesResolved.results;
      const oPayloadResolved = oSemanticAttributesResolved.payload;
      return SimpleLinkDelegate._retrieveNavigationTargets("", oSemanticAttributes, oPayloadResolved, oInfoLog, this._link).then(function (aLinks) {
        return aLinks.length === 0 ? null : aLinks;
      });
    } else {
      return Promise.resolve(null);
    }
  };

  /**
   * Find the type of the link.
   * @param payload The payload of the mdc link.
   * @param aLinkItems Links returned by call to mdc _retrieveUnmodifiedLinkItems.
   * @returns The type of the link as defined by mdc.
   */
  SimpleLinkDelegate._findLinkType = function (payload, aLinkItems) {
    let nLinkType, oLinkItem;
    if (aLinkItems?.length === 1) {
      oLinkItem = new LinkItem({
        text: aLinkItems[0].getText(),
        href: aLinkItems[0].getHref()
      });
      nLinkType = payload.hasQuickViewFacets === "false" ? LinkType.DirectLink : LinkType.Popover;
    } else if (payload.hasQuickViewFacets === "false" && aLinkItems?.length === 0) {
      nLinkType = LinkType.Text;
    } else {
      nLinkType = LinkType.Popover;
    }
    return {
      linkType: nLinkType,
      linkItem: oLinkItem
    };
  };

  /**
   * Calculates and returns the type of link that is displayed.
   * @public
   * @param oLink Instance of the <code>Link</code>
   * @returns Once the promise resolves, an object containing an initial {@link sap.ui.mdc.link.LinkType} and an optional <code>Promise</code> are returned.
   * The optional <code>Promise</code> also returns a {@link sap.ui.mdc.link.LinkType} object.
   * Once the optional <code>Promise</code> has been resolved, the returned {@link sap.ui.mdc.link.LinkType} overwrites the <code>initialType</code>.
   */
  SimpleLinkDelegate.fetchLinkType = async function (oLink) {
    const _oCurrentLink = oLink;
    const _oPayload = Object.assign({}, oLink.getPayload());
    let oDefaultInitialType = {
      initialType: {
        type: LinkType.Popover,
        directLink: undefined
      },
      runtimeType: undefined
    };
    // clean appStateKeyMap storage
    if (!this.appStateKeyMap) {
      this.appStateKeyMap = {};
    }
    try {
      if (_oPayload?.semanticObjects) {
        this._link = oLink;
        let aLinkItems = await _oCurrentLink._retrieveUnmodifiedLinkItems();
        if (aLinkItems.length === 1) {
          // This is the direct navigation use case so we need to perform the appropriate checks / transformations
          aLinkItems = await _oCurrentLink.retrieveLinkItems();
        }
        const _LinkType = SimpleLinkDelegate._findLinkType(_oPayload, aLinkItems);
        return {
          initialType: {
            type: _LinkType.linkType,
            directLink: _LinkType.linkItem ? _LinkType.linkItem : undefined // Yes stupid type somewhere
          },
          runtimeType: undefined
        };
      } else if (_oPayload?.contact?.length && _oPayload?.contact?.length > 0) {
        return oDefaultInitialType;
      } else if (_oPayload?.entityType && _oPayload?.navigationPath) {
        return oDefaultInitialType;
      }
      oDefaultInitialType = undefined;
      throw new Error("no payload or semanticObjects found");
    } catch (oError) {
      Log.error("Error in SimpleLinkDelegate.fetchLinkType: ", oError);
    }
    return oDefaultInitialType;
  };
  SimpleLinkDelegate._RemoveTitleLinkFromTargets = function (mdcLink, linkItems, titleHasLink, titleIntent) {
    let titleLinkHref;
    let result = false;
    if (titleHasLink && titleIntent && linkItems.length) {
      const linkIntentWithoutParameters = `#${linkItems[0].getProperty("key")}`;
      const titleIntentWithoutParameters = titleIntent.split("?")[0];
      const linkIsPrimaryAction = titleIntentWithoutParameters === linkIntentWithoutParameters;
      if (linkIsPrimaryAction) {
        titleLinkHref = linkItems[0].getProperty("href");
        this.payload.titleLinkhref = titleLinkHref;
        const mdcLinkModel = mdcLink.getModel("$sapuimdcLink");
        mdcLinkModel.setProperty("/titleLinkHref", titleLinkHref);
        const aMLinkItems = mdcLinkModel?.getProperty("/linkItems").filter(function (linkItemFromMdc) {
          if (`#${linkItemFromMdc.key}` !== linkIntentWithoutParameters) {
            return linkItemFromMdc;
          }
        });
        if (aMLinkItems && aMLinkItems.length > 0) {
          mdcLinkModel.setProperty("/linkItems/", aMLinkItems);
        }
        result = true;
      }
    }
    return result;
  };
  SimpleLinkDelegate._IsSemanticObjectDynamic = function (aNewLinkCustomData, oThis) {
    if (aNewLinkCustomData && oThis.aLinkCustomData) {
      return oThis.aLinkCustomData.filter(function (link) {
        return aNewLinkCustomData.filter(function (otherLink) {
          return otherLink !== link;
        }).length > 0;
      }).length > 0;
    } else {
      return false;
    }
  };
  SimpleLinkDelegate._getLineContext = function (oView, mLineContext) {
    if (!mLineContext) {
      if (oView.getAggregation("content")[0] && oView.getAggregation("content")[0].getBindingContext()) {
        return oView.getAggregation("content")[0].getBindingContext();
      }
    }
    return mLineContext;
  };
  SimpleLinkDelegate._setFilterContextUrlForSelectionVariant = function (oView, oSelectionVariant, oNavigationService) {
    if (oView.getViewData().entitySet && oSelectionVariant) {
      const sContextUrl = oNavigationService.constructContextUrl(oView.getViewData().entitySet, oView.getModel());
      oSelectionVariant.setFilterContextUrl(sContextUrl);
    }
    return oSelectionVariant;
  };
  SimpleLinkDelegate._setObjectMappings = function (sSemanticObject, oParams, aSemanticObjectMappings, oSelectionVariant) {
    let hasChanged = false;
    const modifiedSelectionVariant = new SelectionVariant(oSelectionVariant.toJSONObject());
    // if semanticObjectMappings has items with dynamic semanticObjects we need to resolve them using oParams
    aSemanticObjectMappings.forEach(function (mapping) {
      let mappingSemanticObject = mapping.semanticObject;
      const mappingSemanticObjectPath = getDynamicPathFromSemanticObject(mapping.semanticObject);
      if (mappingSemanticObjectPath && oParams[mappingSemanticObjectPath]) {
        mappingSemanticObject = oParams[mappingSemanticObjectPath];
      }
      if (sSemanticObject === mappingSemanticObject) {
        const oMappings = mapping.items;
        for (const i in oMappings) {
          const sLocalProperty = oMappings[i].key;
          const sSemanticObjectProperty = oMappings[i].value;
          if (sLocalProperty !== sSemanticObjectProperty) {
            if (oParams[sLocalProperty]) {
              modifiedSelectionVariant.removeParameter(sSemanticObjectProperty);
              modifiedSelectionVariant.removeSelectOption(sSemanticObjectProperty);
              modifiedSelectionVariant.renameParameter(sLocalProperty, sSemanticObjectProperty);
              modifiedSelectionVariant.renameSelectOption(sLocalProperty, sSemanticObjectProperty);
              oParams[sSemanticObjectProperty] = oParams[sLocalProperty];
              delete oParams[sLocalProperty];
              hasChanged = true;
            }
            // We remove the parameter as there is no value

            // The local property comes from a navigation property
            else if (sLocalProperty.split("/").length > 1) {
              // find the property to be removed
              //1. If the property name also exist without nav, we need to look for a select option that looks like
              // contextEntity.navProperty.property
              let localPropertySelectOptionName = modifiedSelectionVariant.getSelectOptionsPropertyNames().find(property => {
                return property.includes(sLocalProperty.replace("/", "."));
              });
              //2. there is no property named the same on the contextEntity so the selectOption is named property
              localPropertySelectOptionName = localPropertySelectOptionName ? localPropertySelectOptionName : sLocalProperty.split("/").slice(-1)[0];
              if (!oParams[localPropertySelectOptionName]) {
                // The navigation property has no value
                delete oParams[localPropertySelectOptionName];
                modifiedSelectionVariant.removeParameter(localPropertySelectOptionName);
                modifiedSelectionVariant.removeSelectOption(localPropertySelectOptionName);
              } else if (localPropertySelectOptionName !== sSemanticObjectProperty) {
                // The navigation property has a value and properties names are different
                modifiedSelectionVariant.removeParameter(sSemanticObjectProperty);
                modifiedSelectionVariant.removeSelectOption(sSemanticObjectProperty);
                modifiedSelectionVariant.renameParameter(localPropertySelectOptionName, sSemanticObjectProperty);
                modifiedSelectionVariant.renameSelectOption(localPropertySelectOptionName, sSemanticObjectProperty);
                oParams[sSemanticObjectProperty] = oParams[localPropertySelectOptionName];
                delete oParams[localPropertySelectOptionName];
              }
            } else {
              delete oParams[sLocalProperty];
              modifiedSelectionVariant.removeParameter(sSemanticObjectProperty);
              modifiedSelectionVariant.removeSelectOption(sSemanticObjectProperty);
            }
          }
        }
      }
    });
    return {
      params: oParams,
      hasChanged,
      selectionVariant: modifiedSelectionVariant
    };
  };

  /**
   * Call getAppStateKeyAndUrlParameters in navigation service and cache its results.
   * @param _this The instance of quickviewdelegate.
   * @param navigationService The navigation service.
   * @param selectionVariant The current selection variant.
   * @param semanticObject The current semanticObject.
   * @returns A promise with the semanticAttributes and appstatekey.
   */
  SimpleLinkDelegate._getAppStateKeyAndUrlParameters = async function (_this, navigationService, selectionVariant, semanticObject) {
    let aValues = [];

    // check if default cache contains already the unmodified selectionVariant
    if (deepEqual(selectionVariant, _this.appStateKeyMap[""]?.selectionVariant)) {
      const defaultCache = _this.appStateKeyMap[""];
      return [defaultCache.semanticAttributes, defaultCache.appstatekey];
    }
    // update url parameters because there is a change in selection variant
    if (_this.appStateKeyMap[`${semanticObject}`] === undefined || !deepEqual(_this.appStateKeyMap[`${semanticObject}`].selectionVariant, selectionVariant)) {
      aValues = await toES6Promise(navigationService.getAppStateKeyAndUrlParameters(selectionVariant.toJSONString()));
      _this.appStateKeyMap[`${semanticObject}`] = {
        semanticAttributes: aValues[0],
        appstatekey: aValues[1],
        selectionVariant: selectionVariant
      };
    } else {
      const cache = _this.appStateKeyMap[`${semanticObject}`];
      aValues = [cache.semanticAttributes, cache.appstatekey];
    }
    return aValues;
  };
  SimpleLinkDelegate._getLinkItemWithNewParameter = async function (services, quickViewDelegate, mdcLinkToModify, appStateKey, selectionVariant) {
    const mdcLinkItemHash = await services.shellServices.expandCompactHash(mdcLinkToModify.mdcLinkItem.getHref());
    const shellHash = services.shellServices.parseShellHash(mdcLinkItemHash);
    let titleIntent;
    // run extension code that can modify the selection variant.

    const targetInfo = {
      semanticObject: shellHash.semanticObject,
      action: shellHash.action,
      propertiesWithoutConflict: mdcLinkToModify.propertiesWithoutConflict,
      linkContextPath: mdcLinkToModify.mdcLink.getBindingContext()?.getPath()
    };
    const oView = CommonUtils.getTargetView(mdcLinkToModify.mdcLink);
    const oController = oView.getController();
    oController.intentBasedNavigation.adaptNavigationContext(selectionVariant, targetInfo);
    const linkParametersFromSelectionVariant = Object.assign({}, services.navigationService.oNavHandler._getURLParametersFromSelectionVariant(selectionVariant));
    const {
      params: oNewParams
    } = SimpleLinkDelegate._setObjectMappings(shellHash.semanticObject, linkParametersFromSelectionVariant, mdcLinkToModify.payload.semanticObjectMappings, selectionVariant);
    delete oNewParams["sap-xapp-state"];
    delete oNewParams["@odata.etag"];
    const updatedParameters = {
      semanticObject: shellHash.semanticObject,
      action: shellHash.action,
      params: oNewParams,
      appStateKey: appStateKey
    };
    const linksUpdatedWithParameters = await services.shellServices.getLinks([updatedParameters]);
    const intentModified = linksUpdatedWithParameters && linksUpdatedWithParameters[0] && linksUpdatedWithParameters[0][0].intent;
    mdcLinkToModify.mdcLinkItem.setHref(intentModified);
    // The link is removed from the target list because the title link has same target.
    if (mdcLinkToModify.payload.semanticPrimaryActions && mdcLinkToModify.payload.semanticPrimaryActions.some(action => action !== null)) {
      const {
        primaryIntentFound
      } = FieldHelper.findPrimaryActionWithinIntents(mdcLinkToModify.payload.semanticPrimaryActions, mdcLinkToModify.payload);
      titleIntent = primaryIntentFound ? primaryIntentFound.intent ?? "" : undefined;
    }
    return SimpleLinkDelegate._RemoveTitleLinkFromTargets.bind(quickViewDelegate)(mdcLinkToModify.mdcLink, [mdcLinkToModify.mdcLinkItem], mdcLinkToModify.titleHasLink, titleIntent);
  };
  SimpleLinkDelegate._removeEmptyLinkItem = function (aLinkItems) {
    return aLinkItems.filter(linkItem => {
      return linkItem !== undefined;
    });
  };

  /**
   * Update the payload with semantic object mapping if a semantic object is present with no mapping.
   * This is to ensure that the semantic object is passed with the corresponding property's value if no explicit mapping exists.
   * @private
   * @param payload The new updated payload.
   * @param propertyPath The property path for which the semantic object is mapped
   * @param lineContext Context for the row
   * @param view View
   */
  SimpleLinkDelegate._checkImplicitSemanticObjectMapping = function (payload, propertyPath, lineContext, view) {
    if (!propertyPath) {
      return;
    }
    //We ensure to remove the sensitive data so that we do not add the semanticobject mappings to the payload if they are sensitive
    //Also we have to remove these before processSemanticAttributes as semantic object mappings are used in it.
    const lineContextData = view.getController()._intentBasedNavigation.removeSensitiveData(lineContext.getObject(), view.getModel().getMetaModel().getMetaPath(lineContext?.getPath() || ""), view.getModel().getMetaModel());
    if (Object.keys(lineContextData)?.includes(propertyPath)) {
      payload.semanticObjects?.forEach(semanticObject => {
        const filteredSemanticObjectMappings = payload.semanticObjectMappings.filter(mapping => mapping.semanticObject === semanticObject);
        if (!filteredSemanticObjectMappings.length) {
          payload.semanticObjectMappings.push({
            semanticObject: semanticObject,
            items: [{
              key: propertyPath,
              value: semanticObject
            }]
          });
        }
      });
    }
  };

  /**
   * Enables the modification of LinkItems before the popover opens. This enables additional parameters
   * to be added to the link.
   * @param mdcLink The Link control
   * @param oBindingContext The binding context of the Link
   * @param aLinkItems The LinkItems of the Link that can be modified
   * @returns Once resolved, an array of {@link sap.ui.mdc.link.LinkItem} is returned
   */
  SimpleLinkDelegate.modifyLinkItems = async function (mdcLink, oBindingContext, aLinkItems) {
    if (aLinkItems.length !== 0) {
      this.payload = mdcLink.getPayload();
      const payloadResolved = SimpleLinkDelegate.calculatePayloadWithDynamicSemanticObjectsResolved(mdcLink);
      const oView = CommonUtils.getTargetView(mdcLink);
      const oAppComponent = CommonUtils.getAppComponent(oView);
      const primaryActionIsActive = await FieldHelper.checkPrimaryActions(payloadResolved, true, oAppComponent);
      const bTitleHasLink = primaryActionIsActive.hasTitleLink;
      const oShellServices = oAppComponent.getShellServices();
      if (!oShellServices.hasUShell()) {
        Log.error("QuickViewDelegate: Cannot retrieve the shell services");
        return Promise.reject();
      }
      const oMetaModel = oView.getModel().getMetaModel();
      let mLineContext = mdcLink.getBindingContext();
      try {
        const oNavigationService = oAppComponent.getNavigationService();
        const oController = oView.getController();
        let oSelectionVariant, mLineContextData;
        mLineContext = SimpleLinkDelegate._getLineContext(oView, mLineContext);
        const sMetaPath = oMetaModel.getMetaPath(mLineContext?.getPath() || "");
        mLineContextData = mLineContext?.getObject();
        if (mLineContext) {
          const propertyPath = this.payload?.dataFieldPropPath;
          const pathsToRetain = [];
          SimpleLinkDelegate._checkImplicitSemanticObjectMapping(payloadResolved, propertyPath, mLineContext, oView);
          //We ensure that all the paths that are used in the semantic object mappings are retained to apply the mappings later on
          this.payload.semanticObjectMappings.forEach(mappings => {
            mappings.items.forEach(semanticMappingDef => {
              pathsToRetain.push(semanticMappingDef.key);
            });
          });
          if (propertyPath) {
            pathsToRetain.push(propertyPath);
          }
          mLineContextData = oController._intentBasedNavigation.processSemanticAttributes(mLineContext, mLineContextData, pathsToRetain);
          mLineContextData = oController._intentBasedNavigation.removeSensitiveData(mLineContextData, sMetaPath, oMetaModel);

          //even if we retain the nav prop, this next line deltetes it
          mLineContextData = oController._intentBasedNavigation.prepareContextForExternalNavigation(mLineContextData, mLineContext);
        }
        oSelectionVariant = oNavigationService.mixAttributesAndSelectionVariant(mLineContextData.semanticAttributes, {});
        //calling this function before adaptNavigationContext to add filter context URL in selection variant
        oSelectionVariant = SimpleLinkDelegate._setFilterContextUrlForSelectionVariant(oView, oSelectionVariant, oNavigationService);
        SimpleLinkDelegate._removeTechnicalParameters(oSelectionVariant);
        const appStateKey = undefined;
        let titleLinktoBeRemove;
        aLinkItems = SimpleLinkDelegate._removeEmptyLinkItem(aLinkItems);
        for (const index in aLinkItems) {
          titleLinktoBeRemove = await SimpleLinkDelegate._getLinkItemWithNewParameter({
            shellServices: oShellServices,
            navigationService: oNavigationService
          }, this, {
            mdcLink: mdcLink,
            payload: payloadResolved,
            titleHasLink: bTitleHasLink,
            mdcLinkItem: aLinkItems[index],
            propertiesWithoutConflict: mLineContextData.propertiesWithoutConflict
          }, appStateKey, oSelectionVariant);
          // Do not remove the link if there is only one direct target application
          if (titleLinktoBeRemove === true && aLinkItems.length > 1) {
            aLinkItems[index] = undefined;
          }
        }
        return SimpleLinkDelegate._removeEmptyLinkItem(aLinkItems);
      } catch (oError) {
        Log.error("Error while getting the navigation service", oError);
        return [];
      }
    } else {
      return aLinkItems;
    }
  };
  SimpleLinkDelegate.beforeNavigationCallback = async function (mdcLink, event) {
    const source = event.getSource(),
      href = source.getHref(),
      urlParsing = await Factory.getServiceAsync("URLParsing"),
      hash = href && urlParsing.parseShellHash(href);
    KeepAliveHelper.storeControlRefreshStrategyForHash(source, hash);
    const view = CommonUtils.getTargetView(mdcLink);
    const appComponent = CommonUtils.getAppComponent(view);
    const navigationService = appComponent.getNavigationService();
    const hashToNavigate = source.getHref();
    const decomposedHash = urlParsing.parseShellHash(hashToNavigate);
    navigationService.navigate(decomposedHash && decomposedHash.semanticObject, decomposedHash && decomposedHash.action, decomposedHash && decomposedHash.params);
    return Promise.resolve(false);
  };
  SimpleLinkDelegate._removeTechnicalParameters = function (oSelectionVariant) {
    oSelectionVariant.removeSelectOption("@odata.context");
    oSelectionVariant.removeSelectOption("@odata.metadataEtag");
    oSelectionVariant.removeSelectOption("SAP__Messages");
  };
  SimpleLinkDelegate._getSemanticObjectCustomDataValue = function (aLinkCustomData, oSemanticObjectsResolved) {
    let sPropertyName, sCustomDataValue;
    for (const element of aLinkCustomData) {
      sPropertyName = element.getKey();
      sCustomDataValue = element.getValue();
      oSemanticObjectsResolved[sPropertyName] = {
        value: sCustomDataValue
      };
    }
  };

  /**
   * Check the semantic object name if it is dynamic or not.
   * @private
   * @param pathOrValue The semantic object path or name
   * @returns True if semantic object is dynamic
   */
  SimpleLinkDelegate._isDynamicPath = function (pathOrValue) {
    const expression = resolveBindingString(pathOrValue);
    if (expression._type === "EmbeddedBinding" || expression._type === "EmbeddedExpressionBinding") {
      return true;
    } else {
      return false;
    }
  };

  /**
   * Update the payload with semantic object values from custom data of Link.
   * @private
   * @param newPayload The new updated payload.
   * @param semanticObjectName The semantic object name resolved.
   */
  SimpleLinkDelegate._updatePayloadWithResolvedSemanticObjectValue = function (newPayload, semanticObjectName) {
    switch (typeof semanticObjectName) {
      case "string":
        newPayload.semanticObjectsResolved?.push(semanticObjectName);
        newPayload.semanticObjects.push(semanticObjectName);
        break;
      case "object":
        for (const j in semanticObjectName) {
          newPayload.semanticObjectsResolved?.push(semanticObjectName[j]);
          newPayload.semanticObjects.push(semanticObjectName[j]);
        }
        break;
      default:
    }
  };
  SimpleLinkDelegate._createNewPayloadWithDynamicSemanticObjectsResolved = function (payload, semanticObjectsResolved, newPayload) {
    let semanticObjectNameToResolve;
    const fnFindQualifier = function (internalQualifiers, semanticObject) {
      return Object.keys(internalQualifiers).find(key => internalQualifiers[key] === semanticObject);
    };
    for (const i in payload.semanticObjects) {
      semanticObjectNameToResolve = payload.semanticObjects[i];
      if (SimpleLinkDelegate._isDynamicPath(semanticObjectNameToResolve)) {
        const key = payload.qualifiers && fnFindQualifier(payload.qualifiers, semanticObjectNameToResolve);
        const semanticObjectNameResolved = key && semanticObjectsResolved[key].value;
        SimpleLinkDelegate._updatePayloadWithResolvedSemanticObjectValue(newPayload, semanticObjectNameResolved);
      } else {
        newPayload.semanticObjects.push(semanticObjectNameToResolve);
      }
    }
  };

  /**
   * Update the semantic object name from the resolved value for the mappings attributes.
   * @private
   * @param mdcPayload The payload given by the application.
   * @param mdcPayloadWithDynamicSemanticObjectsResolved The payload with the resolved value for the semantic object name.
   * @param newPayload The new updated payload.
   */
  SimpleLinkDelegate._updateSemanticObjectsForMappings = function (mdcPayload, mdcPayloadWithDynamicSemanticObjectsResolved, newPayload) {
    // update the semantic object name from the resolved ones in the semantic object mappings.
    mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjectMappings.forEach(function (semanticObjectMapping) {
      if (semanticObjectMapping.semanticObject && SimpleLinkDelegate._isDynamicPath(semanticObjectMapping.semanticObject)) {
        semanticObjectMapping.semanticObject = newPayload.semanticObjects[mdcPayload.semanticObjects.indexOf(semanticObjectMapping.semanticObject)];
      }
    });
  };

  /**
   * Update the semantic object name from the resolved value for the unavailable actions.
   * @private
   * @param mdcPayload The payload given by the application.
   * @param mdcPayloadSemanticObjectUnavailableActions The unavailable actions given by the application.
   * @param mdcPayloadWithDynamicSemanticObjectsResolved The updated payload with the resolved value for the semantic object name for the unavailable actions.
   */
  SimpleLinkDelegate._updateSemanticObjectsUnavailableActions = function (mdcPayload, mdcPayloadSemanticObjectUnavailableActions, mdcPayloadWithDynamicSemanticObjectsResolved) {
    let _Index;
    mdcPayloadSemanticObjectUnavailableActions.forEach(function (semanticObjectUnavailableAction) {
      // Dynamic SemanticObject has an unavailable action
      if (semanticObjectUnavailableAction?.semanticObject && SimpleLinkDelegate._isDynamicPath(semanticObjectUnavailableAction.semanticObject)) {
        _Index = mdcPayload.semanticObjects.findIndex(function (semanticObject) {
          return semanticObject === semanticObjectUnavailableAction.semanticObject;
        });
        if (_Index !== undefined) {
          // Get the SemanticObject name resolved to a value
          semanticObjectUnavailableAction.semanticObject = mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjects[_Index];
        }
      }
    });
  };

  /**
   * Remove empty semantic object mappings and if there is no semantic object name, link to it.
   * @private
   * @param mdcPayloadWithDynamicSemanticObjectsResolved The payload used to check the mappings of the semantic objects.
   */
  SimpleLinkDelegate._removeEmptySemanticObjectsMappings = function (mdcPayloadWithDynamicSemanticObjectsResolved) {
    // remove undefined Semantic Object Mapping
    for (let mappingsCount = 0; mappingsCount < mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjectMappings.length; mappingsCount++) {
      if (mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjectMappings[mappingsCount] && mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjectMappings[mappingsCount].semanticObject === undefined) {
        mdcPayloadWithDynamicSemanticObjectsResolved.semanticObjectMappings.splice(mappingsCount, 1);
      }
    }
  };
  SimpleLinkDelegate._setPayloadWithDynamicSemanticObjectsResolved = function (payload, newPayload) {
    let oPayloadWithDynamicSemanticObjectsResolved;
    if (newPayload.semanticObjectsResolved && newPayload.semanticObjectsResolved.length > 0) {
      oPayloadWithDynamicSemanticObjectsResolved = {
        qualifiers: payload.qualifiers,
        entityType: payload.entityType,
        dataField: payload.dataField,
        contact: payload.contact,
        contextPath: payload.contextPath,
        navigationPath: payload.navigationPath,
        propertyPathLabel: payload.propertyPathLabel,
        dataFieldPropPath: payload.dataFieldPropPath,
        semanticObjectMappings: deepClone(payload.semanticObjectMappings),
        semanticObjectUnavailableActions: [],
        semanticObjects: newPayload.semanticObjects
      };
      SimpleLinkDelegate._updateSemanticObjectsForMappings(payload, oPayloadWithDynamicSemanticObjectsResolved, newPayload);
      const _SemanticObjectUnavailableActions = deepClone(payload.semanticObjectUnavailableActions);
      SimpleLinkDelegate._updateSemanticObjectsUnavailableActions(payload, _SemanticObjectUnavailableActions, oPayloadWithDynamicSemanticObjectsResolved);
      oPayloadWithDynamicSemanticObjectsResolved.semanticObjectUnavailableActions = _SemanticObjectUnavailableActions;
      SimpleLinkDelegate._removeEmptySemanticObjectsMappings(oPayloadWithDynamicSemanticObjectsResolved);
      return oPayloadWithDynamicSemanticObjectsResolved;
    } else {
      return {};
    }
  };
  SimpleLinkDelegate._getPayloadWithDynamicSemanticObjectsResolved = function (payload, linkCustomData) {
    let payloadWithDynamicSemanticObjectsResolved;
    const semanticObjectsResolved = {};
    const newPayload = {
      semanticObjects: [],
      semanticObjectsResolved: [],
      semanticObjectMappings: [],
      semanticObjectUnavailableActions: [],
      qualifiers: {}
    };
    if (payload.semanticObjects) {
      // sap.m.Link has custom data with Semantic Objects names resolved
      if (linkCustomData && linkCustomData.length > 0) {
        SimpleLinkDelegate._getSemanticObjectCustomDataValue(linkCustomData, semanticObjectsResolved);
        SimpleLinkDelegate._createNewPayloadWithDynamicSemanticObjectsResolved(payload, semanticObjectsResolved, newPayload);
        payloadWithDynamicSemanticObjectsResolved = SimpleLinkDelegate._setPayloadWithDynamicSemanticObjectsResolved(payload, newPayload);
        return payloadWithDynamicSemanticObjectsResolved;
      }
    } else {
      return undefined;
    }
  };
  SimpleLinkDelegate._updatePayloadWithSemanticAttributes = function (aSemanticObjects, oInfoLog, oContextObject, oResults, mSemanticObjectMappings) {
    aSemanticObjects.forEach(function (sSemanticObject) {
      if (oInfoLog) {
        oInfoLog.addContextObject(sSemanticObject, oContextObject);
      }
      oResults[sSemanticObject] = {};
      for (const sAttributeName in oContextObject) {
        let oAttribute = null,
          oTransformationAdditional = null;
        if (oInfoLog) {
          oAttribute = oInfoLog.getSemanticObjectAttribute(sSemanticObject, sAttributeName);
          if (!oAttribute) {
            oAttribute = oInfoLog.createAttributeStructure();
            oInfoLog.addSemanticObjectAttribute(sSemanticObject, sAttributeName, oAttribute);
          }
        }
        // Ignore undefined and null values
        if (oContextObject[sAttributeName] === undefined || oContextObject[sAttributeName] === null) {
          if (oAttribute) {
            oAttribute.transformations.push({
              value: undefined,
              description: "\u2139 Undefined and null values have been removed in SimpleLinkDelegate."
            });
          }
          continue;
        }
        // Ignore plain objects (BCP 1770496639)
        if (isPlainObject(oContextObject[sAttributeName])) {
          if (mSemanticObjectMappings && mSemanticObjectMappings[sSemanticObject]) {
            const aKeys = Object.keys(mSemanticObjectMappings[sSemanticObject]);
            let sNewAttributeNameMapped, sNewAttributeName, sValue, sKey;
            for (const element of aKeys) {
              sKey = element;
              if (sKey.indexOf(sAttributeName) === 0) {
                sNewAttributeNameMapped = mSemanticObjectMappings[sSemanticObject][sKey];
                sNewAttributeName = sKey.split("/")[sKey.split("/").length - 1];
                sValue = oContextObject[sAttributeName][sNewAttributeName];
                if (sNewAttributeNameMapped && sNewAttributeName && sValue) {
                  oResults[sSemanticObject][sNewAttributeNameMapped] = sValue;
                }
              }
            }
          }
          if (oAttribute) {
            oAttribute.transformations.push({
              value: undefined,
              description: "\u2139 Plain objects has been removed in SimpleLinkDelegate."
            });
          }
          continue;
        }

        // Map the attribute name only if 'semanticObjectMapping' is defined.
        // Note: under defined 'semanticObjectMapping' we also mean an empty annotation or an annotation with empty record
        const sAttributeNameMapped = mSemanticObjectMappings && mSemanticObjectMappings[sSemanticObject] && mSemanticObjectMappings[sSemanticObject][sAttributeName] ? mSemanticObjectMappings[sSemanticObject][sAttributeName] : sAttributeName;
        if (oAttribute && sAttributeName !== sAttributeNameMapped) {
          oTransformationAdditional = {
            value: undefined,
            description: `\u2139 The attribute ${sAttributeName} has been renamed to ${sAttributeNameMapped} in SimpleLinkDelegate.`,
            reason: `\ud83d\udd34 A com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation is defined for semantic object ${sSemanticObject} with source attribute ${sAttributeName} and target attribute ${sAttributeNameMapped}. You can modify the annotation if the mapping result is not what you expected.`
          };
        }

        // If more then one local property maps to the same target property (clash situation)
        // we take the value of the last property and write an error log
        if (oResults[sSemanticObject][sAttributeNameMapped]) {
          Log.error(`SimpleLinkDelegate: The attribute ${sAttributeName} can not be renamed to the attribute ${sAttributeNameMapped} due to a clash situation. This can lead to wrong navigation later on.`);
        }

        // Copy the value replacing the attribute name by semantic object name
        oResults[sSemanticObject][sAttributeNameMapped] = oContextObject[sAttributeName];
        if (oAttribute) {
          if (oTransformationAdditional) {
            oAttribute.transformations.push(oTransformationAdditional);
            const aAttributeNew = oInfoLog.createAttributeStructure();
            aAttributeNew.transformations.push({
              value: oContextObject[sAttributeName],
              description: `\u2139 The attribute ${sAttributeNameMapped} with the value ${oContextObject[sAttributeName]} has been added due to a mapping rule regarding the attribute ${sAttributeName} in SimpleLinkDelegate.`
            });
            oInfoLog.addSemanticObjectAttribute(sSemanticObject, sAttributeNameMapped, aAttributeNew);
          }
        }
      }
    });
  };

  /**
   * Calculate the payload with the semantic objects resolved.
   * @param link The corresponding Link
   * @returns The payload resolved with the value of the semantic object
   */
  SimpleLinkDelegate.calculatePayloadWithDynamicSemanticObjectsResolved = function (link) {
    const payload = link?.getPayload();
    const linkCustomData = link && this._fetchLinkCustomData(link);
    const payloadResolved = SimpleLinkDelegate._getPayloadWithDynamicSemanticObjectsResolved(payload, linkCustomData);
    return payloadResolved ? payloadResolved : payload;
  };

  /**
   * Checks which attributes of the ContextObject belong to which SemanticObject and maps them into a two dimensional array.
   * @private
   * @param oBindingContext The BindingContext of the SourceControl of the Link / of the Link itself if not set
   * @param oPayload The payload given by the application
   * @param oInfoLog The corresponding InfoLog of the Link
   * @param oLink The corresponding Link
   * @returns An object containing the computed payload and computed semantic attributes
   */
  SimpleLinkDelegate._calculateSemanticAttributes = function (oBindingContext, oPayload, oInfoLog, oLink) {
    const oContextObject = oBindingContext.getObject();
    const oPayloadWithDynamicSemanticObjectsResolved = SimpleLinkDelegate.calculatePayloadWithDynamicSemanticObjectsResolved(oLink);
    const aSemanticObjects = SimpleLinkDelegate._getSemanticObjects(oPayloadWithDynamicSemanticObjectsResolved);
    if (!aSemanticObjects.length) {
      return {
        payload: oPayloadWithDynamicSemanticObjectsResolved,
        results: {}
      };
    }
    const oResults = {};
    const oView = CommonUtils.getTargetView(oLink);
    const propertyPath = oPayloadWithDynamicSemanticObjectsResolved?.dataFieldPropPath;
    SimpleLinkDelegate._checkImplicitSemanticObjectMapping(oPayloadWithDynamicSemanticObjectsResolved, propertyPath, oBindingContext, oView);
    const mSemanticObjectMappings = SimpleLinkDelegate._convertSemanticObjectMapping(SimpleLinkDelegate._getSemanticObjectMappings(oPayloadWithDynamicSemanticObjectsResolved));
    SimpleLinkDelegate._updatePayloadWithSemanticAttributes(aSemanticObjects, oInfoLog, oContextObject, oResults, mSemanticObjectMappings);
    return {
      payload: oPayloadWithDynamicSemanticObjectsResolved,
      results: oResults
    };
  };

  /**
   * Checks if the current hash corresponds to a primary action.
   * @param shellServices The shell services object.
   * @param navLinks An array of navigation links.
   * @param hash The parsed hash object.
   * @returns - Returns true if the hash corresponds to a primary action, otherwise false.
   */
  SimpleLinkDelegate.checkPrimaryActionForHash = function (shellServices, navLinks, hash) {
    return navLinks.some(hashs => {
      let targetHash = shellServices.constructShellHash({
        target: {
          shellHash: hashs.intent
        }
      });
      // The sandbox adds a ?sap-app-origin-hint to the hash, so we need to remove it
      if (targetHash.includes("?")) {
        targetHash = targetHash.substring(0, targetHash.indexOf("?"));
      }
      return `${hash.semanticObject}-${hash.action}` === targetHash;
    });
  };

  /**
   * Retrieves the actual targets for the navigation of the link. This uses the UShell loaded by the {@link sap.ui.mdc.link.Factory} to retrieve
   * the navigation targets from the FLP service.
   * @private
   * @param sAppStateKey Key of the appstate (not used yet)
   * @param oSemanticAttributes The calculated by _calculateSemanticAttributes
   * @param oPayload The payload given by the application
   * @param oInfoLog The corresponding InfoLog of the Link
   * @param oLink The corresponding Link
   * @returns Resolving into availableAtions and ownNavigation containing an array of {@link sap.ui.mdc.link.LinkItem}
   */
  SimpleLinkDelegate._retrieveNavigationTargets = async function (sAppStateKey, oSemanticAttributes, oPayload, oInfoLog, oLink) {
    if (!oPayload.semanticObjects) {
      return Promise.resolve([]);
    }
    const aSemanticObjects = oPayload.semanticObjects;
    const oNavigationTargets = {
      ownNavigation: undefined,
      availableActions: []
    };
    let iSuperiorActionLinksFound = 0;
    return Library.load({
      name: "sap.ui.fl"
    }).then(async () => {
      return new Promise(resolve => {
        sap.ui.require(["sap/ui/fl/Utils"], async Utils => {
          const oAppComponent = Utils.getAppComponentForControl(oLink === undefined ? this.oControl : oLink);
          const oShellServices = oAppComponent ? oAppComponent.getShellServices() : null;
          if (!oShellServices) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
            return;
          }
          if (!oShellServices?.hasUShell()) {
            Log.error("SimpleLinkDelegate: Service 'CrossApplicationNavigation' or 'URLParsing' could not be obtained");
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
          }
          const aParams = aSemanticObjects.map(function (sSemanticObject) {
            return {
              semanticObject: sSemanticObject,
              params: oSemanticAttributes ? oSemanticAttributes[sSemanticObject] : undefined,
              appStateKey: sAppStateKey,
              sortResultsBy: "text"
            };
          });
          try {
            const aLinks = await oShellServices.getLinks(aParams);
            let bHasLinks = false;
            for (const elements of aLinks) {
              if (elements.length > 0) {
                bHasLinks = true;
                break;
              }
              if (bHasLinks) {
                break;
              }
            }
            if (!aLinks || !aLinks.length || !bHasLinks) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
            }
            const aSemanticObjectUnavailableActions = SimpleLinkDelegate._getSemanticObjectUnavailableActions(oPayload);
            const oUnavailableActions = SimpleLinkDelegate._convertSemanticObjectUnavailableAction(aSemanticObjectUnavailableActions);
            let sCurrentHash = FieldRuntime._fnFixHashQueryString(oAppComponent.getShellServices().getHash());
            if (sCurrentHash) {
              // BCP 1770315035: we have to set the end-point '?' of action in order to avoid matching of "#SalesOrder-manage" in "#SalesOrder-manageFulfillment"
              sCurrentHash += "?";
            }
            const fnIsUnavailableAction = function (sSemanticObject, sAction) {
              return !!oUnavailableActions && !!oUnavailableActions[sSemanticObject] && oUnavailableActions[sSemanticObject].includes(sAction);
            };
            const primaryIntents = (await FieldHelper._getPrimaryIntents(oAppComponent, oPayload && oPayload.semanticObjects)).filter(Boolean);
            const fnAddLink = function (_oLink) {
              const oShellHash = oShellServices.parseShellHash(_oLink.intent);
              if (fnIsUnavailableAction(oShellHash.semanticObject, oShellHash.action)) {
                return;
              }
              const sHref = `#${oShellServices.constructShellHash({
                target: {
                  shellHash: _oLink.intent
                }
              })}`;
              if (_oLink.intent && _oLink.intent.indexOf(sCurrentHash) === 0) {
                // Prevent current app from being listed
                // NOTE: If the navigation target exists in
                // multiple contexts (~XXXX in hash) they will all be skipped
                oNavigationTargets.ownNavigation = new LinkItem({
                  href: sHref,
                  text: _oLink.text
                });
                return;
              }
              const oLinkItem = new LinkItem({
                // As the retrieveNavigationTargets method can be called several time we can not create the LinkItem instance with the same id
                key: oShellHash.semanticObject && oShellHash.action ? `${oShellHash.semanticObject}-${oShellHash.action}` : undefined,
                text: _oLink.text,
                description: undefined,
                href: sHref,
                // target: not supported yet
                icon: undefined,
                //_oLink.icon,
                initiallyVisible: _oLink.tags && _oLink.tags.includes("superiorAction")
              });
              if (oLinkItem.getProperty("initiallyVisible")) {
                // If the current link item is not a primary intent, add it to the list shown in the popover
                if (!SimpleLinkDelegate.checkPrimaryActionForHash(oShellServices, primaryIntents, oShellHash)) {
                  iSuperiorActionLinksFound++;
                }
              }
              oNavigationTargets.availableActions.push(oLinkItem);
              if (oInfoLog) {
                oInfoLog.addSemanticObjectIntent(oShellHash.semanticObject, {
                  intent: oLinkItem.getHref(),
                  text: oLinkItem.getText()
                });
              }
            };
            for (let n = 0; n < aSemanticObjects.length; n++) {
              aLinks[n].forEach(fnAddLink);
            }
            if (iSuperiorActionLinksFound === 0) {
              for (let iLinkItemIndex = 0; iLinkItemIndex < oNavigationTargets.availableActions.length; iLinkItemIndex++) {
                if (iLinkItemIndex < this.getConstants().iLinksShownInPopup) {
                  oNavigationTargets.availableActions[iLinkItemIndex].setProperty("initiallyVisible", true);
                } else {
                  break;
                }
              }
            }
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
          } catch (oError) {
            Log.error("SimpleLinkDelegate: '_retrieveNavigationTargets' failed executing getLinks method");
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
          }
        });
      });
    });
  };
  SimpleLinkDelegate._getSemanticObjects = function (oPayload) {
    return oPayload.semanticObjects ? oPayload.semanticObjects : [];
  };
  SimpleLinkDelegate._getSemanticObjectUnavailableActions = function (oPayload) {
    const aSemanticObjectUnavailableActions = [];
    if (oPayload.semanticObjectUnavailableActions) {
      oPayload.semanticObjectUnavailableActions.forEach(function (oSemanticObjectUnavailableAction) {
        aSemanticObjectUnavailableActions.push(new SemanticObjectUnavailableAction({
          semanticObject: oSemanticObjectUnavailableAction.semanticObject,
          actions: oSemanticObjectUnavailableAction.actions
        }));
      });
    }
    return aSemanticObjectUnavailableActions;
  };

  /**
   * This will return an array of {@link sap.ui.mdc.ushell.SemanticObjectMapping} depending on the given payload.
   * @private
   * @param oPayload The payload defined by the application
   * @returns An array of semantic object mappings.
   */
  SimpleLinkDelegate._getSemanticObjectMappings = function (oPayload) {
    const aSemanticObjectMappings = [];
    let aSemanticObjectMappingItems = [];
    if (oPayload.semanticObjectMappings) {
      oPayload.semanticObjectMappings.forEach(function (oSemanticObjectMapping) {
        aSemanticObjectMappingItems = [];
        if (oSemanticObjectMapping.items) {
          oSemanticObjectMapping.items.forEach(function (oSemanticObjectMappingItem) {
            aSemanticObjectMappingItems.push(new SemanticObjectMappingItem({
              key: oSemanticObjectMappingItem.key,
              value: oSemanticObjectMappingItem.value
            }));
          });
        }
        aSemanticObjectMappings.push(new SemanticObjectMapping({
          semanticObject: oSemanticObjectMapping.semanticObject,
          items: aSemanticObjectMappingItems
        }));
      });
    }
    return aSemanticObjectMappings;
  };
  /**
   * Converts a given array of SemanticObjectMapping into a Map containing SemanticObjects as Keys and a Map of it's corresponding SemanticObjectMappings as values.
   * @private
   * @param aSemanticObjectMappings An array of SemanticObjectMappings.
   * @returns The converterd SemanticObjectMappings
   */
  SimpleLinkDelegate._convertSemanticObjectMapping = function (aSemanticObjectMappings) {
    if (!aSemanticObjectMappings.length) {
      return undefined;
    }
    const mSemanticObjectMappings = {};
    aSemanticObjectMappings.forEach(oSemanticObjectMapping => {
      if (!oSemanticObjectMapping.getSemanticObject()) {
        throw Error(`SimpleLinkDelegate: 'semanticObject' property with value '${oSemanticObjectMapping.getSemanticObject()}' is not valid`);
      }
      mSemanticObjectMappings[oSemanticObjectMapping.getSemanticObject()] = Object.fromEntries(oSemanticObjectMapping.getItems().map(oItem => [oItem.getKey(), oItem.getValue()]));
    });
    return mSemanticObjectMappings;
  };
  /**
   * Converts a given array of SemanticObjectUnavailableActions into a map containing SemanticObjects as keys and a map of its corresponding SemanticObjectUnavailableActions as values.
   * @private
   * @param aSemanticObjectUnavailableActions The SemanticObjectUnavailableActions converted
   * @returns The map containing the converted SemanticObjectUnavailableActions
   */
  SimpleLinkDelegate._convertSemanticObjectUnavailableAction = function (aSemanticObjectUnavailableActions) {
    let _SemanticObjectName;
    let _SemanticObjectHasAlreadyUnavailableActions;
    let _UnavailableActions = [];
    if (!aSemanticObjectUnavailableActions.length) {
      return undefined;
    }
    const mSemanticObjectUnavailableActions = {};
    aSemanticObjectUnavailableActions.forEach(function (oSemanticObjectUnavailableActions) {
      _SemanticObjectName = oSemanticObjectUnavailableActions.getSemanticObject();
      if (!_SemanticObjectName) {
        throw Error(`SimpleLinkDelegate: 'semanticObject' property with value '${_SemanticObjectName}' is not valid`);
      }
      _UnavailableActions = oSemanticObjectUnavailableActions.getActions();
      if (mSemanticObjectUnavailableActions[_SemanticObjectName] === undefined) {
        mSemanticObjectUnavailableActions[_SemanticObjectName] = _UnavailableActions;
      } else {
        _SemanticObjectHasAlreadyUnavailableActions = mSemanticObjectUnavailableActions[_SemanticObjectName];
        _UnavailableActions.forEach(function (UnavailableAction) {
          _SemanticObjectHasAlreadyUnavailableActions.push(UnavailableAction);
        });
        mSemanticObjectUnavailableActions[_SemanticObjectName] = _SemanticObjectHasAlreadyUnavailableActions;
      }
    });
    return mSemanticObjectUnavailableActions;
  };
  /**
   * Delegate method to fetch popover title and labelledBy control.
   * @param oLink
   * @param oPanel
   * @returns A title and a labelledBy control.
   */
  SimpleLinkDelegate.fetchPopoverTitle = async function (oLink, oPanel) {
    const sTitle = "";
    if (!oLink || !oPanel) {
      return {
        sTitle,
        oLabelledByControl: undefined
      };
    }
    const oLabelledByControl = SimpleLinkDelegate?._getLabelledByControl(oPanel);
    return Promise.resolve({
      sTitle,
      oLabelledByControl
    });
  };
  return SimpleLinkDelegate;
}, false);
//# sourceMappingURL=QuickViewDelegate-dbg.js.map
