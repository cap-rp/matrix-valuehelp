/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Button", "sap/m/Dialog", "sap/m/MessageToast", "sap/m/Text", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "../CommonUtils", "sap/ui/core/Component"], function (Log, ClassSupport, MetaModelConverter, ResourceModelHelper, Button, Dialog, MessageToast, Text, ControllerExtension, OverrideExecution, CommonUtils, Component) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _dec33, _dec34, _dec35, _dec36, _dec37, _dec38, _dec39, _dec40, _dec41, _dec42, _dec43, _dec44, _dec45, _dec46, _dec47, _dec48, _dec49, _dec50, _class, _class2;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var getInvolvedDataModelObjectsForTargetPath = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath;
  var publicExtension = ClassSupport.publicExtension;
  var privateExtension = ClassSupport.privateExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  const IMMEDIATE_REQUEST = "$$ImmediateRequest";
  let SideEffectsControllerExtension = (_dec = defineUI5Class("sap.fe.core.controllerextensions.SideEffects"), _dec2 = methodOverride(), _dec3 = publicExtension(), _dec4 = finalExtension(), _dec5 = publicExtension(), _dec6 = finalExtension(), _dec7 = publicExtension(), _dec8 = finalExtension(), _dec9 = publicExtension(), _dec10 = finalExtension(), _dec11 = publicExtension(), _dec12 = finalExtension(), _dec13 = publicExtension(), _dec14 = finalExtension(), _dec15 = publicExtension(), _dec16 = finalExtension(), _dec17 = publicExtension(), _dec18 = finalExtension(), _dec19 = publicExtension(), _dec20 = finalExtension(), _dec21 = publicExtension(), _dec22 = finalExtension(), _dec23 = publicExtension(), _dec24 = finalExtension(), _dec25 = publicExtension(), _dec26 = finalExtension(), _dec27 = publicExtension(), _dec28 = finalExtension(), _dec29 = publicExtension(), _dec30 = finalExtension(), _dec31 = publicExtension(), _dec32 = extensible(OverrideExecution.Instead), _dec33 = publicExtension(), _dec34 = extensible(OverrideExecution.Instead), _dec35 = publicExtension(), _dec36 = finalExtension(), _dec37 = privateExtension(), _dec38 = finalExtension(), _dec39 = publicExtension(), _dec40 = finalExtension(), _dec41 = publicExtension(), _dec42 = finalExtension(), _dec43 = privateExtension(), _dec44 = finalExtension(), _dec45 = privateExtension(), _dec46 = finalExtension(), _dec47 = publicExtension(), _dec48 = finalExtension(), _dec49 = publicExtension(), _dec50 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function SideEffectsControllerExtension() {
      var _this;
      _this = _ControllerExtension.call(this) || this;
      _this.requestExecutions = [];
      return _this;
    }
    _inheritsLoose(SideEffectsControllerExtension, _ControllerExtension);
    var _proto = SideEffectsControllerExtension.prototype;
    _proto.onInit = function onInit() {
      this._view = this.base.getView();
      this._pageComponent = Component.getOwnerComponentFor(this._view);
      this._sideEffectsService = CommonUtils.getAppComponent(this._view).getSideEffectsService();
      this._registeredFieldGroupMap = {};
      this._fieldGroupInvalidity = {};
      this._registeredFailedSideEffects = {};
    }

    /**
     * Adds a SideEffects control.
     * @param entityType Name of the entity where the SideEffects control will be registered
     * @param controlSideEffects SideEffects to register. Ensure the sourceControlId matches the associated SAPUI5 control ID.
     */;
    _proto.addControlSideEffects = function addControlSideEffects(entityType, controlSideEffects) {
      this._sideEffectsService.addControlSideEffects(entityType, controlSideEffects);
    }

    /**
     * Removes SideEffects created by a control.
     * @param control SAPUI5 Control
     */;
    _proto.removeControlSideEffects = function removeControlSideEffects(control) {
      const controlId = control.isA?.("sap.ui.base.ManagedObject") && control.getId();
      if (controlId) {
        this._sideEffectsService.removeControlSideEffects(controlId);
      }
    }

    /**
     * Gets the appropriate context on which SideEffects can be requested.
     * The correct one must have the binding parameter $$patchWithoutSideEffects.
     * @param bindingContext Initial binding context
     * @param sideEffectEntityType EntityType of the sideEffects
     * @returns SAPUI5 Context or undefined
     */;
    _proto.getContextForSideEffects = function getContextForSideEffects(bindingContext, sideEffectEntityType) {
      let contextForSideEffects = bindingContext,
        entityType = this._sideEffectsService.getEntityTypeFromContext(bindingContext);
      if (sideEffectEntityType !== entityType) {
        contextForSideEffects = bindingContext.getBinding().getContext();
        if (contextForSideEffects) {
          entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
          if (sideEffectEntityType !== entityType) {
            contextForSideEffects = contextForSideEffects.getBinding().getContext();
            if (contextForSideEffects) {
              entityType = this._sideEffectsService.getEntityTypeFromContext(contextForSideEffects);
              if (sideEffectEntityType !== entityType) {
                return undefined;
              }
            }
          }
        }
      }
      return contextForSideEffects || undefined;
    }

    /**
     * Wait For all sideEffects execution to be completed.
     *
     */;
    _proto.waitForSideEffectExecutions = async function waitForSideEffectExecutions() {
      await Promise.allSettled(this.requestExecutions);
    }

    /**
     * Gets the SideEffects map for a field
     * These SideEffects are
     * - listed into FieldGroupIds (coming from an OData Service)
     * - generated by a control or controls and that configure this field as SourceProperties.
     * @param field Field control
     * @returns SideEffects map
     */;
    _proto.getFieldSideEffectsMap = function getFieldSideEffectsMap(field) {
      let sideEffectsMap = {};
      if (this._pageComponent) {
        const entitySet = this._pageComponent.getEntitySet?.();
        const contextPath = this._pageComponent.getContextPath?.() || entitySet && `/${entitySet}`;
        if (contextPath) {
          const fieldGroupIds = field.getFieldGroupIds(),
            contextDataModelObject = getInvolvedDataModelObjectsForTargetPath(contextPath, this._view.getModel().getMetaModel());

          // SideEffects coming from an OData Service
          sideEffectsMap = this.getSideEffectsMapForFieldGroups(fieldGroupIds, field.getBindingContext());

          // SideEffects coming from control(s)
          if (contextDataModelObject) {
            const viewEntityType = contextDataModelObject.targetEntityType.fullyQualifiedName,
              fieldPath = this.getTargetProperty(field),
              context = this.getContextForSideEffects(field.getBindingContext(), viewEntityType);
            if (fieldPath && context) {
              const controlSideEffectsEntityType = this._sideEffectsService.getControlEntitySideEffects(viewEntityType);
              Object.keys(controlSideEffectsEntityType).forEach(sideEffectsName => {
                const oControlSideEffects = controlSideEffectsEntityType[sideEffectsName];
                if (oControlSideEffects.sourceProperties.includes(fieldPath)) {
                  const name = `${sideEffectsName}::${viewEntityType}`;
                  sideEffectsMap[name] = {
                    name: name,
                    immediate: true,
                    sideEffects: oControlSideEffects,
                    context: context
                  };
                }
              });
            }
          }
        }
      }
      return sideEffectsMap;
    }

    /**
     * Gets the sideEffects map for fieldGroups.
     * @param fieldGroupIds Field group ids
     * @param fieldContext Field binding context
     * @returns SideEffects map
     */;
    _proto.getSideEffectsMapForFieldGroups = function getSideEffectsMapForFieldGroups(fieldGroupIds, fieldContext) {
      const mSideEffectsMap = {};
      fieldGroupIds.forEach(fieldGroupId => {
        const {
          name,
          immediate,
          sideEffects,
          sideEffectEntityType
        } = this._getSideEffectsPropertyForFieldGroup(fieldGroupId);
        const oContext = fieldContext ? this.getContextForSideEffects(fieldContext, sideEffectEntityType) : undefined;
        if (sideEffects && (!fieldContext || fieldContext && oContext)) {
          mSideEffectsMap[name] = {
            name,
            immediate,
            sideEffects
          };
          if (fieldContext) {
            mSideEffectsMap[name].context = oContext;
          }
        }
      });
      return mSideEffectsMap;
    }

    /**
     * Clear recorded validation status for all properties.
     *
     */;
    _proto.clearFieldGroupsValidity = function clearFieldGroupsValidity() {
      this._fieldGroupInvalidity = {};
    }

    /**
     * Clear recorded validation status for all properties.
     * @param fieldGroupId Field group id
     * @param context Context
     * @returns SAPUI5 Context or undefined
     */;
    _proto.isFieldGroupValid = function isFieldGroupValid(fieldGroupId, context) {
      const id = this._getFieldGroupIndex(fieldGroupId, context);
      return Object.keys(this._fieldGroupInvalidity[id] ?? {}).length === 0;
    }

    /**
     * Gets the relative target property related to the Field.
     * @param field Field control
     * @returns Relative target property
     */;
    _proto.getTargetProperty = function getTargetProperty(field) {
      const fieldPath = field.data("sourcePath");
      const metaModel = this._view.getModel().getMetaModel();
      const viewBindingPath = this._view.getBindingContext()?.getPath();
      const viewMetaModelPath = viewBindingPath ? `${metaModel.getMetaPath(viewBindingPath)}/` : "";
      return fieldPath?.replace(viewMetaModelPath, "");
    }

    /**
     * Caches deferred SideEffects that will be executed when the FieldGroup is unfocused.
     * @param event SAPUI5 event that comes from a field change
     * @param fieldValidity
     * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
     */;
    _proto.prepareDeferredSideEffectsForField = function prepareDeferredSideEffectsForField(event, fieldValidity, fieldGroupPreRequisite) {
      const field = event.getSource();
      this._saveFieldPropertiesStatus(field, fieldValidity);
      if (!fieldValidity) {
        return;
      }
      const sideEffectsMap = this.getFieldSideEffectsMap(field);

      // register field group SideEffects
      Object.keys(sideEffectsMap).filter(sideEffectsName => sideEffectsMap[sideEffectsName].immediate !== true).forEach(sideEffectsName => {
        const sideEffectsProperties = sideEffectsMap[sideEffectsName];
        this.registerFieldGroupSideEffects(sideEffectsProperties, fieldGroupPreRequisite);
      });
    }

    /**
     * Manages the workflow for SideEffects with related changes to a field
     * The following scenarios are managed:
     * - Register: caches deferred SideEffects that will be executed when the FieldGroup is unfocused
     * - Execute: triggers immediate SideEffects requests if the promise for the field event is fulfilled.
     * @param event SAPUI5 event that comes from a field change
     * @param fieldValidity
     * @param fieldGroupPreRequisite Promise to be fulfilled before executing deferred SideEffects
     * @param skipDeferredRegistration If true then deferred side effects are not registered. This is useful when the registration of deferred side effects and triggering needs to be done separately.
     * @returns  Promise on SideEffects request(s)
     */;
    _proto.handleFieldChange = async function handleFieldChange(event, fieldValidity, fieldGroupPreRequisite) {
      let skipDeferredRegistration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      const field = event.getSource();
      if (!skipDeferredRegistration) {
        this.prepareDeferredSideEffectsForField(event, fieldValidity, fieldGroupPreRequisite);
      } else {
        this._saveFieldPropertiesStatus(field, fieldValidity);
        if (!fieldValidity) {
          return;
        }
      }
      return this._manageSideEffectsFromField(field);
    }

    /**
     * Manages SideEffects with a related 'focus out' to a field group.
     * @param event SAPUI5 Event
     * @returns Promise returning true if the SideEffects have been successfully executed
     */;
    _proto.handleFieldGroupChange = async function handleFieldGroupChange(event) {
      const field = event.getSource(),
        fieldGroupIds = event.getParameter("fieldGroupIds") ?? [],
        customSideEffectHandling = fieldGroupIds.some(fieldGroupId => fieldGroupId.startsWith("fe_sideEffectHandling_"));
      let sideEffectRequestPromises = [];
      if (customSideEffectHandling) {
        const customImmediateSideEffectPromises = this.handleCustomFieldFieldGroupChange(event);
        if (customImmediateSideEffectPromises) {
          sideEffectRequestPromises.push(customImmediateSideEffectPromises.then(() => {
            return;
          }));
        }
      }
      const fieldGroupsSideEffects = fieldGroupIds.reduce((results, fieldGroupId) => {
        return results.concat(this.getRegisteredSideEffectsForFieldGroup(fieldGroupId));
      }, []);
      sideEffectRequestPromises = sideEffectRequestPromises.concat(fieldGroupsSideEffects.map(async fieldGroupSideEffects => {
        return this._requestFieldGroupSideEffects(fieldGroupSideEffects);
      }));
      return Promise.all(sideEffectRequestPromises).catch(error => {
        const contextPath = field.getBindingContext()?.getPath();
        Log.debug(`Error while processing FieldGroup SideEffects on context ${contextPath}`, error);
      });
    }

    /**
     * Manages SideEffects when the fieldGroupChange event is fired for a custom field.
     * @param event
     * @returns Promise of the immediate side effects request if there are any
     */;
    _proto.handleCustomFieldFieldGroupChange = function handleCustomFieldFieldGroupChange(event) {
      const field = event.getSource();
      const controlSideEffects = Object.values(this.getFieldSideEffectsMap(field));

      // register the non immediate side effects
      controlSideEffects.filter(sideEffectDef => sideEffectDef.immediate !== true).forEach(sideEffectDef => {
        this.registerFieldGroupSideEffects(sideEffectDef, Promise.resolve());
      });

      // execute the immediate side effects of the control
      const immediateSideEffects = controlSideEffects.filter(sideEffectDef => sideEffectDef.immediate === true).map(sideEffectDef => sideEffectDef.sideEffects);
      const context = field.getBindingContext();
      if (immediateSideEffects.length && context) {
        return this.requestMultipleSideEffects(immediateSideEffects, context);
      }
      return null;
    }

    /* Manages the deferred SideEffects which have to be executed when the context of the page changes (saving a document).
     *
     * @param context The context of the page
     * @returns Promise returning true if the SideEffects have been successfully executed
     */;
    _proto.handlePageChangeContext = async function handlePageChangeContext(context) {
      await this.waitForSideEffectExecutions();
      const sideEffectsFieldGroupOnPage = this.getRegisteredSideEffectsForContext(context);
      return Promise.all(sideEffectsFieldGroupOnPage.map(async fieldGroupSideEffects => {
        return this._requestFieldGroupSideEffects(fieldGroupSideEffects);
      })).catch(error => {
        Log.debug(`Error while processing on page context ${context.getPath()}`, error);
      });
    }

    /**
     * Request SideEffects on a specific context.
     * @param sideEffects SideEffects to be executed
     * @param context Context where SideEffects need to be executed
     * @param groupId
     * @param fnGetTargets The callback function which will give us the targets and actions if it was coming through some specific handling.
     * @param ignoreTriggerActions If true, we do not trigger actions defined in the side effect
     * @returns SideEffects request on SAPUI5 context
     */;
    _proto.requestSideEffects = async function requestSideEffects(sideEffects, context, groupId, fnGetTargets) {
      let ignoreTriggerActions = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      const fnTriggerCallbacks = this.triggerCallbacks.bind(this);
      const {
        targets,
        triggerAction
      } = fnGetTargets ? fnGetTargets(sideEffects) : {
        targets: [...(sideEffects.targetEntities ?? []), ...(sideEffects.targetProperties ?? [])],
        triggerAction: !this._sideEffectsService.isControlSideEffects(sideEffects) ? sideEffects.triggerAction : undefined
      };
      if (triggerAction && !ignoreTriggerActions) {
        this.requestExecutions.push(this._sideEffectsService.executeAction(triggerAction, context, groupId));
      }
      if (targets.length) {
        const requestTargets = this._sideEffectsService.requestSideEffects(targets, context, groupId).then(async function async() {
          return fnTriggerCallbacks(sideEffects.targetEntities?.map(target => target.$NavigationPropertyPath) || []);
        }).catch(error => {
          this.registerFailedSideEffects([sideEffects], context);
          throw error;
        });
        this.requestExecutions.push(requestTargets);
        return requestTargets;
      }
    }

    /**
     * Requests the SideEffects for a sideEffect event.
     *
     * The default implementation is to execute the side effect on the page's context, but pages (like the LR) might override this method.
     * @param eventName The SideEffects event that is triggered
     * @param path The path for which this event was triggered
     * @returns Promise on SideEffects request
     */;
    _proto.requestSideEffectsForEvent = async function requestSideEffectsForEvent(eventName, path) {
      if (this.isDataPathRelevant(path, eventName)) {
        // use the default implementation from the SideEffects Service
        const context = this._findRelevantContext(path, this.getView().getBindingContext());
        if (context) {
          return this._sideEffectsService.requestSideEffectsForEvent(eventName, context);
        }
      }
    }

    /**
     * Checks whether a specific data path is visible on the page.
     * @param path The path to be checked
     * @param _eventName SideEffects event which was triggered
     * @returns True if the data path is shown on the UI
     */;
    _proto.isDataPathRelevant = function isDataPathRelevant(path, _eventName) {
      const context = this.getView().getBindingContext();
      if (this._contextIsRelevant(path, context)) {
        return true;
      }
      return !!this._findRelevantContext(path, context);
    }

    /**
     * Checks if a given context fits to a given path.
     *
     * This is done by checking both the navigation path and the canonical path.
     * We also check dependent property bindings if they follow a navigation path to the given path.
     * @param path The path to be checked
     * @param context The context to be checked
     * @returns True if the context fits to the given path
     */;
    _proto._contextIsRelevant = function _contextIsRelevant(path, context) {
      if (context?.getPath() === path || context?.getCanonicalPath() === path) {
        return true;
      }

      // check if a dependent binding follows a navigation path and fits to this path
      const model = context.getModel();
      const metaModel = model.getMetaModel();
      const dependentBindings = model.getDependentBindings(context);
      for (const binding of dependentBindings) {
        const bindingPath = binding.getPath() ?? "";
        if (bindingPath.startsWith("@$ui5") ||
        // ignore UI5 internal bindings
        context.getProperty("IsActiveEntity") === true &&
        // ignore DraftAdministrativeData on active version
        bindingPath.includes("DraftAdministrativeData/")) {
          continue;
        }
        try {
          const propertyTarget = metaModel.fetchUpdateData(bindingPath, context).getResult();
          if (propertyTarget?.entityPath === path || "/" + propertyTarget?.editUrl === path) {
            return true;
          }
        } catch (error) {
          Log.debug(`Error while checking ${bindingPath} on page context `, error);
        }
      }
      return false;
    }

    /**
     * Find context for a given path by checking dependent bindings.
     * @param path The path to be checked
     * @param context The parent context
     * @returns Context if found, otherwise returns undefined
     */;
    _proto._findRelevantContext = function _findRelevantContext(path, context) {
      if (this._contextIsRelevant(path, context)) {
        return context;
      }
      const dependentBindings = context.getModel().getDependentBindings(context);
      for (const binding of dependentBindings) {
        if (binding.isA("sap.ui.model.odata.v4.ODataContextBinding")) {
          if (this._contextIsRelevant(path, binding.getBoundContext())) {
            return binding.getBoundContext();
          }
        } else if (binding.isA("sap.ui.model.odata.v4.ODataListBinding")) {
          const listContexts = binding.getAllCurrentContexts();
          for (const listContext of listContexts) {
            if (this._contextIsRelevant(path, listContext)) {
              return listContext;
            }
          }
        }
      }
    }

    /**
     * Get text to be shown for user to indicate data refresh.
     *
     * This is currently only used by SideEffects events. Pages (like the LR) might override this method.
     * @returns Text to be shown to the user in case of a data refresh
     */;
    _proto.getDataRefreshText = function getDataRefreshText() {
      const resourceModel = getResourceModel(this.getView());
      return resourceModel.getText("C_SERVER_EVENTS_NEW_DATA_ITEM");
    }

    /**
     * Notify the user that data was refreshed.
     *
     * This is currently only used by SideEffects events.
     */;
    _proto.notifyDataRefresh = function notifyDataRefresh() {
      MessageToast.show(this.base.getView().getController()._sideEffects.getDataRefreshText());
    }

    /**
     * Ask the user for confirmation of a data refresh.
     *
     * This is currently only used by SideEffects events.
     * @returns Promise that is resolved if the user confirms and rejects if the user cancels.
     */;
    _proto.confirmDataRefresh = async function confirmDataRefresh() {
      if (!this.isConfirmationDialogOpen) {
        return new Promise((resolve, reject) => {
          const text = this.getDataRefreshText();
          const resourceModel = getResourceModel(this.getView());
          const confirmationDialog = new Dialog({
            title: resourceModel.getText("WARNING"),
            state: "Warning",
            content: new Text({
              text: text
            }),
            beginButton: new Button({
              text: resourceModel.getText("C_COMMON_SAPFE_REFRESH"),
              press: () => {
                confirmationDialog.close();
                resolve();
              }
            }),
            endButton: new Button({
              text: resourceModel.getText("C_COMMON_DIALOG_CANCEL"),
              press: () => {
                confirmationDialog.close();
                reject();
              }
            }),
            afterClose: () => {
              confirmationDialog.destroy();
              this.isConfirmationDialogOpen = false;
            }
          });
          confirmationDialog.addStyleClass("sapUiContentPadding");
          this.isConfirmationDialogOpen = true;
          confirmationDialog.open();
        });
      }
      return Promise.reject();
    }

    /**
     * Request multiple SideEffects on a specific context.
     * @param multiSideEffects SideEffects to be executed
     * @param context Context where SideEffects need to be executed
     * @param groupId The group id of the batch
     * @returns SideEffects request on SAPUI5 context
     */;
    _proto.requestMultipleSideEffects = async function requestMultipleSideEffects(multiSideEffects, context, groupId) {
      let properties = new Set();
      let navigationProperties = new Set();
      const actions = multiSideEffects.reduce((actions, sideEffects) => {
        const sideEffectAction = sideEffects.triggerAction;
        if (sideEffectAction) {
          actions.push(sideEffectAction);
        }
        return actions;
      }, []);
      const fntriggerCallbacks = this.triggerCallbacks.bind(this);
      for (const action of actions) {
        this._sideEffectsService.executeAction(action, context, groupId);
      }
      for (const sideEffects of multiSideEffects) {
        properties = (sideEffects.targetProperties ?? []).reduce((mySet, property) => mySet.add(property), properties);
        navigationProperties = (sideEffects.targetEntities ?? []).reduce((mySet, navigationProperty) => mySet.add(navigationProperty.$NavigationPropertyPath), navigationProperties);
      }
      return this._sideEffectsService.requestSideEffects([...Array.from(properties), ...Array.from(navigationProperties).map(navigationProperty => {
        return {
          $NavigationPropertyPath: navigationProperty
        };
      })], context, groupId).then(async function async() {
        return fntriggerCallbacks(Array.from(navigationProperties));
      }).catch(error => {
        this.registerFailedSideEffects(multiSideEffects, context);
        throw error;
      });
    }

    /**
     * Gets failed SideEffects.
     * @returns Registered SideEffects requests that have failed
     */;
    _proto.getRegisteredFailedRequests = function getRegisteredFailedRequests() {
      return this._registeredFailedSideEffects;
    }

    /**
     * Adds SideEffects to the queue of the failed SideEffects
     * The SideEffects are retriggered on the next request on the same context.
     * @param multiSideEffects SideEffects that need to be retriggered
     * @param context Context where SideEffects have failed
     */;
    _proto.registerFailedSideEffects = function registerFailedSideEffects(multiSideEffects, context) {
      const contextPath = context.getPath();
      this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath] ?? [];
      for (const sideEffects of multiSideEffects) {
        const isNotAlreadyListed = this._registeredFailedSideEffects[contextPath].every(mFailedSideEffects => sideEffects.fullyQualifiedName !== mFailedSideEffects.fullyQualifiedName);
        if (isNotAlreadyListed) {
          this._registeredFailedSideEffects[contextPath].push(sideEffects);
        }
      }
    }

    /**
     * Deletes SideEffects in the queue of the failed SideEffects for a context.
     * @param contextPath Context path where SideEffects have failed
     */;
    _proto.unregisterFailedSideEffectsForAContext = function unregisterFailedSideEffectsForAContext(contextPath) {
      delete this._registeredFailedSideEffects[contextPath];
    }

    /**
     * Deletes SideEffects to the queue of the failed SideEffects.
     * @param sideEffectsFullyQualifiedName SideEffects that need to be retriggered
     * @param context Context where SideEffects have failed
     */;
    _proto.unregisterFailedSideEffects = function unregisterFailedSideEffects(sideEffectsFullyQualifiedName, context) {
      const contextPath = context.getPath();
      if (this._registeredFailedSideEffects[contextPath]?.length) {
        this._registeredFailedSideEffects[contextPath] = this._registeredFailedSideEffects[contextPath].filter(sideEffects => sideEffects.fullyQualifiedName !== sideEffectsFullyQualifiedName);
      }
    }

    /**
     * Adds SideEffects to the queue of a FieldGroup
     * The SideEffects are triggered when event related to the field group change is fired.
     * @param sideEffectsProperties SideEffects properties
     * @param fieldGroupPreRequisite Promise to fullfil before executing the SideEffects
     */;
    _proto.registerFieldGroupSideEffects = function registerFieldGroupSideEffects(sideEffectsProperties, fieldGroupPreRequisite) {
      const id = this._getFieldGroupIndex(sideEffectsProperties.name, sideEffectsProperties.context);
      if (!this._registeredFieldGroupMap[id]) {
        this._registeredFieldGroupMap[id] = {
          promise: fieldGroupPreRequisite ?? Promise.resolve(),
          sideEffectProperty: sideEffectsProperties
        };
      }
    }

    /**
     * Deletes SideEffects to the queue of a FieldGroup.
     * @param sideEffectsProperties SideEffects properties
     */;
    _proto.unregisterFieldGroupSideEffects = function unregisterFieldGroupSideEffects(sideEffectsProperties) {
      const {
        context,
        name
      } = sideEffectsProperties;
      const id = this._getFieldGroupIndex(name, context);
      delete this._registeredFieldGroupMap[id];
    }

    /**
     * Gets the registered SideEffects into the queue for a field group id.
     * @param fieldGroupId Field group id
     * @returns Array of registered SideEffects and their promise
     */;
    _proto.getRegisteredSideEffectsForFieldGroup = function getRegisteredSideEffectsForFieldGroup(fieldGroupId) {
      const sideEffects = [];
      for (const registryIndex of Object.keys(this._registeredFieldGroupMap)) {
        if (registryIndex.startsWith(`${fieldGroupId}_`)) {
          sideEffects.push(this._registeredFieldGroupMap[registryIndex]);
        }
      }
      return sideEffects;
    }

    /**
     * Gets the registered SideEffects into the queue for a context and its children.
     * @param context The context
     * @returns Array of registered SideEffects and their promise
     */;
    _proto.getRegisteredSideEffectsForContext = function getRegisteredSideEffectsForContext(context) {
      const sideEffects = [];
      for (const registryIndex of Object.keys(this._registeredFieldGroupMap)) {
        if (this._registeredFieldGroupMap) if (registryIndex.includes(`_${context.getPath()}`)) {
          sideEffects.push(this._registeredFieldGroupMap[registryIndex]);
        }
      }
      return sideEffects;
    }

    /**
     * Gets a status index.
     * @param fieldGroupId The field group id
     * @param context SAPUI5 Context
     * @returns Index
     */;
    _proto._getFieldGroupIndex = function _getFieldGroupIndex(fieldGroupId, context) {
      return `${fieldGroupId}_${context.getPath()}`;
    }

    /**
     * Gets sideEffects properties from a field group id
     * The properties are:
     * - name
     * - sideEffects definition
     * - sideEffects entity type
     * - immediate sideEffects.
     * @param fieldGroupId
     * @returns SideEffects properties
     */;
    _proto._getSideEffectsPropertyForFieldGroup = function _getSideEffectsPropertyForFieldGroup(fieldGroupId) {
      /**
       * string "$$ImmediateRequest" is added to the SideEffects name during templating to know
       * if this SideEffects must be immediately executed requested (on field change) or must
       * be deferred (on field group focus out)
       *
       */
      const immediate = fieldGroupId.includes(IMMEDIATE_REQUEST),
        name = fieldGroupId.replace(IMMEDIATE_REQUEST, ""),
        sideEffectParts = name.split("#"),
        sideEffectEntityType = sideEffectParts[0],
        sideEffectPath = `${sideEffectEntityType}@com.sap.vocabularies.Common.v1.SideEffects${sideEffectParts.length === 2 ? `#${sideEffectParts[1]}` : ""}`,
        sideEffects = this._sideEffectsService.getODataEntitySideEffects(sideEffectEntityType)?.[sideEffectPath];
      return {
        name,
        immediate,
        sideEffects,
        sideEffectEntityType
      };
    }

    /**
     * Manages the SideEffects for a field.
     * @param field Field control
     * @returns Promise related to the requested immediate sideEffects
     */;
    _proto._manageSideEffectsFromField = async function _manageSideEffectsFromField(field) {
      const sideEffectsMap = this.getFieldSideEffectsMap(field);
      try {
        const sideEffectsToExecute = {};
        const addSideEffects = (context, sideEffects) => {
          const contextPath = context.getPath();
          if (sideEffectsToExecute[contextPath]) {
            sideEffectsToExecute[contextPath].sideEffects.push(sideEffects);
          } else {
            sideEffectsToExecute[contextPath] = {
              context,
              sideEffects: [sideEffects]
            };
          }
        };

        //Get Immediate SideEffects
        for (const sideEffectsProperties of Object.values(sideEffectsMap).filter(sideEffectsProperties => sideEffectsProperties.immediate === true)) {
          // if this SideEffects is recorded as failed SideEffects, need to remove it.
          this.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, sideEffectsProperties.context);
          addSideEffects(sideEffectsProperties.context, sideEffectsProperties.sideEffects);
        }

        //Replay failed SideEffects related to the view or Field
        for (const context of [field.getBindingContext(), this._view.getBindingContext()].filter(context => !!context)) {
          const contextPath = context.getPath();
          const failedSideEffects = this._registeredFailedSideEffects[contextPath] ?? [];
          this.unregisterFailedSideEffectsForAContext(contextPath);
          for (const failedSideEffect of failedSideEffects) {
            addSideEffects(context, failedSideEffect);
          }
        }
        await Promise.all(Object.values(sideEffectsToExecute).map(async sideEffectsProperties => sideEffectsProperties.sideEffects.length === 1 ? this.requestSideEffects(sideEffectsProperties.sideEffects[0], sideEffectsProperties.context) : this.requestMultipleSideEffects(sideEffectsProperties.sideEffects, sideEffectsProperties.context)));
      } catch (e) {
        Log.debug(`Error while managing Field SideEffects`, e);
      }
    };
    _proto.triggerCallbacks = async function triggerCallbacks(navigation) {
      await Promise.all(navigation.map(nav => {
        const registerCallBack = this._sideEffectsService.getRegisteredCallback(nav);
        if (registerCallBack) {
          return registerCallBack();
        }
        return Promise.resolve();
      }));
    }

    /**
     * Requests the SideEffects for a fieldGroup.
     * @param fieldGroupSideEffects Field group sideEffects with its promise
     * @returns Promise returning true if the SideEffects have been successfully executed
     */;
    _proto._requestFieldGroupSideEffects = async function _requestFieldGroupSideEffects(fieldGroupSideEffects) {
      this.unregisterFieldGroupSideEffects(fieldGroupSideEffects.sideEffectProperty);
      try {
        await fieldGroupSideEffects.promise;
      } catch (e) {
        Log.debug(`Error while processing FieldGroup SideEffects`, e);
        return;
      }
      try {
        const {
          sideEffects,
          context,
          name
        } = fieldGroupSideEffects.sideEffectProperty;
        if (this.isFieldGroupValid(name, context)) {
          await this.requestSideEffects(sideEffects, context);
        }
      } catch (e) {
        Log.debug(`Error while executing FieldGroup SideEffects`, e);
      }
    }

    /**
     * Saves the validation status of properties related to a field control.
     * @param field The field control
     * @param success Status of the field validation
     */;
    _proto._saveFieldPropertiesStatus = function _saveFieldPropertiesStatus(field, success) {
      const sideEffectsMap = this.getFieldSideEffectsMap(field);
      Object.keys(sideEffectsMap).forEach(key => {
        const {
          name,
          immediate,
          context
        } = sideEffectsMap[key];
        if (!immediate) {
          const id = this._getFieldGroupIndex(name, context);
          if (success) {
            delete this._fieldGroupInvalidity[id]?.[field.getId()];
          } else {
            this._fieldGroupInvalidity[id] = {
              ...this._fieldGroupInvalidity[id],
              ...{
                [field.getId()]: true
              }
            };
          }
        }
      });
    };
    return SideEffectsControllerExtension;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "addControlSideEffects", [_dec3, _dec4], Object.getOwnPropertyDescriptor(_class2.prototype, "addControlSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "removeControlSideEffects", [_dec5, _dec6], Object.getOwnPropertyDescriptor(_class2.prototype, "removeControlSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getContextForSideEffects", [_dec7, _dec8], Object.getOwnPropertyDescriptor(_class2.prototype, "getContextForSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "waitForSideEffectExecutions", [_dec9, _dec10], Object.getOwnPropertyDescriptor(_class2.prototype, "waitForSideEffectExecutions"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getFieldSideEffectsMap", [_dec11, _dec12], Object.getOwnPropertyDescriptor(_class2.prototype, "getFieldSideEffectsMap"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getSideEffectsMapForFieldGroups", [_dec13, _dec14], Object.getOwnPropertyDescriptor(_class2.prototype, "getSideEffectsMapForFieldGroups"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "clearFieldGroupsValidity", [_dec15, _dec16], Object.getOwnPropertyDescriptor(_class2.prototype, "clearFieldGroupsValidity"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "isFieldGroupValid", [_dec17, _dec18], Object.getOwnPropertyDescriptor(_class2.prototype, "isFieldGroupValid"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getTargetProperty", [_dec19, _dec20], Object.getOwnPropertyDescriptor(_class2.prototype, "getTargetProperty"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "prepareDeferredSideEffectsForField", [_dec21, _dec22], Object.getOwnPropertyDescriptor(_class2.prototype, "prepareDeferredSideEffectsForField"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleFieldChange", [_dec23, _dec24], Object.getOwnPropertyDescriptor(_class2.prototype, "handleFieldChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handleFieldGroupChange", [_dec25, _dec26], Object.getOwnPropertyDescriptor(_class2.prototype, "handleFieldGroupChange"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "handlePageChangeContext", [_dec27, _dec28], Object.getOwnPropertyDescriptor(_class2.prototype, "handlePageChangeContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "requestSideEffects", [_dec29, _dec30], Object.getOwnPropertyDescriptor(_class2.prototype, "requestSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "requestSideEffectsForEvent", [_dec31, _dec32], Object.getOwnPropertyDescriptor(_class2.prototype, "requestSideEffectsForEvent"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getDataRefreshText", [_dec33, _dec34], Object.getOwnPropertyDescriptor(_class2.prototype, "getDataRefreshText"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRegisteredFailedRequests", [_dec35, _dec36], Object.getOwnPropertyDescriptor(_class2.prototype, "getRegisteredFailedRequests"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "registerFailedSideEffects", [_dec37, _dec38], Object.getOwnPropertyDescriptor(_class2.prototype, "registerFailedSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFailedSideEffectsForAContext", [_dec39, _dec40], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFailedSideEffectsForAContext"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFailedSideEffects", [_dec41, _dec42], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFailedSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "registerFieldGroupSideEffects", [_dec43, _dec44], Object.getOwnPropertyDescriptor(_class2.prototype, "registerFieldGroupSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "unregisterFieldGroupSideEffects", [_dec45, _dec46], Object.getOwnPropertyDescriptor(_class2.prototype, "unregisterFieldGroupSideEffects"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRegisteredSideEffectsForFieldGroup", [_dec47, _dec48], Object.getOwnPropertyDescriptor(_class2.prototype, "getRegisteredSideEffectsForFieldGroup"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getRegisteredSideEffectsForContext", [_dec49, _dec50], Object.getOwnPropertyDescriptor(_class2.prototype, "getRegisteredSideEffectsForContext"), _class2.prototype), _class2)) || _class);
  return SideEffectsControllerExtension;
}, false);
//# sourceMappingURL=SideEffects-dbg.js.map
