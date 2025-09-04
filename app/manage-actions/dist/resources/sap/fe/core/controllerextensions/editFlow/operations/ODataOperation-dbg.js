/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/deepClone", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/library", "sap/ui/model/odata/v4/SubmitMode", "../../../helpers/ModelHelper", "../../../helpers/TypeGuards", "./ODataStrictHandling", "./actionHelper"], function (Log, deepClone, MetaModelConverter, FELibrary, SubmitMode, ModelHelper, TypeGuards, ODataStrictHandling, actionHelper) {
  "use strict";

  var _exports = {};
  var isAction = TypeGuards.isAction;
  var convertTypes = MetaModelConverter.convertTypes;
  const InvocationGrouping = FELibrary.InvocationGrouping;
  let ODataOperation = /*#__PURE__*/function () {
    function ODataOperation(operation, parameters) {
      let operationProperties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      this.operationContextBindings = [];
      this.firstIterationOperations = [];
      this.apiGroupIdsToSubmit = new Set();
      this.bindingParameters = {};
      this.operationParameters = [];
      this.neverSubmitted = true;
      this.failedContexts = [];
      this.operationPromises = [];
      this.operation = operation;
      this.parameters = parameters;
      this.operationProperties = operationProperties;
      this.actionName = actionHelper.getActionName(isAction(this.operation) ? this.operation : this.operation.action);
      this.sideEffects = this.parameters.appComponent.getSideEffectsService().getODataActionSideEffects(this.actionName, this.parameters.contexts.length ? this.parameters.contexts[0] : undefined);
      if (!this.operation.isFunction && this.parameters.disableStrictHandling !== true) {
        this.oDataStrictHandling = new ODataStrictHandling({
          appComponent: this.parameters.appComponent,
          contexts: this.parameters.contexts,
          label: this.parameters.label ?? this.actionName,
          invocationGrouping: this.parameters.invocationGrouping,
          events: {
            onResponse: this.parameters.events?.onStrictResponse,
            onValidation: this.onStrictValidation.bind(this),
            onCancel: this.parameters.events?.onStrictCancel
          }
        });
      }
      this.defineOperationParameters();
      this.setBindingParameters();
    }

    /**
     * Sets the binding parameters for the operations.
     */
    _exports = ODataOperation;
    var _proto = ODataOperation.prototype;
    _proto.setBindingParameters = function setBindingParameters() {
      this.bindingParameters = deepClone(this.operationProperties.bindingParameters ?? {});
      const additionalSelectProperties = [];
      if (isAction(this.operation) && this.parameters.contexts.length && this.operationProperties.enhance$select === true) {
        const returnEntityType = this.operation.returnEntityType;
        const metaModel = this.parameters.model.getMetaModel();
        const messagesPath = ModelHelper.getMessagesPath(metaModel, this.parameters.contexts[0].getPath());
        const entitySet = convertTypes(metaModel).entitySets.filter(entity => entity.entityType === returnEntityType)?.[0];
        const isSameEntity = !this.operation.returnCollection && !!returnEntityType && this.operation.sourceEntityType === returnEntityType;
        if (isSameEntity) {
          if (ModelHelper.isDraftRoot(entitySet)) {
            additionalSelectProperties.push("HasActiveEntity");
          }
          if (
          /* The former logic checked if the messagesPath is contained into the SideEffects
                            but the check was invalid (always true)
                            To be compliant with former version we don't check the SideEffects..
             
             this.sideEffects &&
             messagesPath &&
             (this.sideEffects.pathExpressions ?? []).some((exp) => typeof exp === "string" && [messagesPath, "*"].includes(exp))*/
          messagesPath && !!returnEntityType?.entityProperties.find(property => property.name === messagesPath)) {
            additionalSelectProperties.push(messagesPath);
          }
        }
        if (additionalSelectProperties.length) {
          const selectProperties = additionalSelectProperties.join(",");
          this.bindingParameters.$select = this.bindingParameters.$select ? `${this.bindingParameters.$select},${selectProperties}` : selectProperties;
        }

        // We need to inherit the $select for the bound entity only if
        //  - the action returns the same entity
        //  - the $select has been customized
        // otherwise we need to keep the value of $$inheritExpandSelect to false
        this.bindingParameters.$$inheritExpandSelect = this.bindingParameters.$$inheritExpandSelect || !!additionalSelectProperties.length || isSameEntity;
      }
    }

    /**
     * Defines the parameters of the operation.
     */;
    _proto.defineOperationParameters = function defineOperationParameters() {
      if (!isAction(this.operation)) {
        this.operationParameters = this.operation.action.parameters;
      } else {
        //Remove the binding parameters from the parameters list
        this.operationParameters = actionHelper.getActionParameters(this.operation);
      }
    };
    _proto.clear = function clear() {
      for (const operationContextBinding of this.operationContextBindings) {
        operationContextBinding.destroy();
      }
      this.apiGroupIdsToSubmit.clear();
      this.operationContextBindings = [];
      this.failedContexts = [];
      this.operationPromises = [];
    }

    /**
     * Executes the operation.
     * @returns The promise of the operation
     */;
    _proto.execute = async function execute() {
      let result;
      try {
        if (this.parameters.contexts.length) {
          result = await (this.parameters.invocationGrouping === InvocationGrouping.ChangeSet ? this.executeChangeset() : this.executeSequentially());
        } else {
          result = await Promise.allSettled([this.executeImport()]);
        }
      } catch (error) {
        Log.error("Error while executing operation " + this.actionName, error);
        throw error;
      } finally {
        this.parameters.events?.onODataResponse?.();
      }
      return result;
    }

    /**
     * Executes the import operation.
     * @returns The promise of the operation
     */;
    _proto.executeImport = async function executeImport() {
      const operationContext = this.parameters.model.bindContext(`/${this.actionName}(...)`);
      this.operationContextBindings.push(operationContext);
      this.setParametersValue(operationContext);
      const groupId = this.operationProperties.groupId ?? "actionImport";
      const promises = [this.invoke(operationContext, groupId)];
      this.defaultSubmit(groupId);
      await Promise.allSettled(this.firstIterationOperations);
      await this.afterODataOperationExecution();
      const currentPromiseValues = await Promise.all(promises);
      return currentPromiseValues[0];
    }

    /**
     * Executes the operations on one changeset.
     * @returns The promise of the operations
     */;
    _proto.executeChangeset = async function executeChangeset() {
      this.operationPromises = this.parameters.contexts.map(async context => this.executeBoundOperation(context, this.operationProperties.groupId));
      await Promise.allSettled(this.firstIterationOperations);
      await this.afterODataOperationExecution();
      return Promise.allSettled(this.operationPromises);
    };
    _proto.afterODataOperationExecution = async function afterODataOperationExecution() {
      await this.oDataStrictHandling?.manageStrictHandlingFails();
      await this.parameters.events?.onAfterODataOperationExecution?.();
    }

    /**
     * Executes the operations sequentially.
     * @returns The promise of the operations
     */;
    _proto.executeSequentially = async function executeSequentially() {
      // serialization: executeBoundOperation to be called for each entry only after the promise returned from the one before has been resolved
      await this.parameters.contexts.reduce(async (promise, context, id) => {
        await promise;
        this.operationPromises.push(this.executeBoundOperation(context, this.operationProperties.groupId ?? `apiMode${id + 1}`));
        await Promise.allSettled(this.firstIterationOperations);
      }, Promise.resolve());
      await this.afterODataOperationExecution();
      return Promise.allSettled(this.operationPromises);
    }

    /**
     * Executes the bound operation.
     * @param context The bound context
     * @param groupId The groupId of the batch
     * @returns The promise of the operation
     */;
    _proto.executeBoundOperation = async function executeBoundOperation(context, groupId) {
      const operationContext = this.parameters.model.bindContext(`${this.actionName}(...)`, context, this.bindingParameters);
      this.operationContextBindings.push(operationContext);
      const promises = [];
      this.setParametersValue(operationContext);
      const finalGroupId = groupId ?? operationContext.getUpdateGroupId();
      const operationPromise = this.invoke(operationContext, finalGroupId);
      promises.push(operationPromise);
      this.defaultSubmit(finalGroupId);
      Promise.allSettled(promises);
      return operationPromise;
    }

    /**
     * Enhances the side effects of the operation
     *
     * When a new entity is created using a DataFieldForAction, a new
     * oDataContextBinding is created to execute the action. By default, this
     * oDataContextBinding is relative to the OdataListBinding of the table.
     *
     * Because of this dependency, when a SideEffects is executed on the
     * context into the OdataListBinding where the oDataContextBinding was bound, this SideEffects is also triggered on this
     * oDataContextBinding. We don't manage the lifecycle of the
     * oDataContextBinding. It means even if the draft related to the action
     * is removed, the odataContextBinding is still there, so if a SideEffects
     * is executed on the source target into oDataContextBinding, an error from the back end will be
     * received because we ask to refresh a property on an unknown entity.
     *
     * The SideEffects are requested only if the page is still open.
     * This avoids generating issues with ghost oDataContextBinding linked to destroyed context.
     * @param operationContextBinding The operation
     * @param returnedContext The returned context of this operation
     */;
    _proto.enhanceSideEffects = function enhanceSideEffects(operationContextBinding, returnedContext) {
      if (returnedContext && this.parameters.ghostContextBindingProtection === true) {
        const appComponent = this.parameters.appComponent;
        const origin = operationContextBinding.requestSideEffects.bind(operationContextBinding);
        operationContextBinding.requestSideEffects = async function () {
          if (appComponent.getRootViewController().getInstancedViews().find(pageView => pageView.getBindingContext() === returnedContext)) {
            return origin(...arguments);
          }
          return Promise.resolve();
        };
      }
    }

    /**
     * Invokes the operation on the context.
     * @param operationContextBinding The operation context binding
     * @param groupId The groupId of the batch
     * @returns The promise of the operation
     */;
    _proto.invoke = async function invoke(operationContextBinding, groupId) {
      let returnedContext;
      let firstIterationResolve;
      let firstIterationReject;
      const strictHandlingPromise = new Promise(function (resolve, reject) {
        firstIterationResolve = resolve;
        firstIterationReject = reject;
      });
      this.firstIterationOperations.push(strictHandlingPromise);
      if (groupId && this.isAPIMode(groupId)) {
        this.apiGroupIdsToSubmit.add(groupId);
      }
      try {
        const sideEffectsContext = operationContextBinding.getContext() ?? operationContextBinding.getBoundContext();
        const operationInvoke = operationContextBinding.invoke(groupId, this.operationProperties.ignoreETag, this.oDataStrictHandling?.handleOdataStrictHandling.bind(this.oDataStrictHandling, operationContextBinding, firstIterationResolve, () => {
          this.requestSideEffects(sideEffectsContext, groupId, []);
          this.parameters.model.submitBatch(groupId);
        }), this.operationProperties.replaceWithRVC);
        this.requestSideEffects(sideEffectsContext, groupId, [operationInvoke]);
        await Promise.race([operationInvoke, strictHandlingPromise]);
        returnedContext = await operationInvoke;
        this.enhanceSideEffects(operationContextBinding, returnedContext);
        firstIterationResolve();
      } catch (error) {
        firstIterationReject(error);
        const context = operationContextBinding.getContext();
        if (context) {
          this.failedContexts.push(context);
        }
        throw error;
      } finally {
        await this.parameters.events?.onAfterODataInvoke?.(operationContextBinding, groupId);
      }
      return {
        returnedContext,
        boundContext: operationContextBinding.getBoundContext()
      };
    }

    /**
     *  Manages the strict handling validation.
     */;
    _proto.onStrictValidation = function onStrictValidation() {
      this.parameters.events?.onStrictValidation?.();
      this.retriggerFailedContexts();
    }

    /**
     *  Triggers the failed operations in case of strict handling.
     * @returns A promise resolved when the new operations are resolved
     */;
    _proto.retriggerFailedContexts = async function retriggerFailedContexts() {
      //Retry the action execution in case of strict handling and if there is at least one failed context (give it another try to succeed)
      if (this.parameters.invocationGrouping !== InvocationGrouping.ChangeSet) {
        let index = 0;
        for (const failedContext of this.failedContexts) {
          index++;
          this.operationPromises.push(this.executeBoundOperation(failedContext, `apiRetrigger${index + 1}`));
        }
        await Promise.allSettled(this.operationPromises);
      }
    }

    /**
     * Submits the batch related to the groupId of the operation.
     */;
    _proto.submit = function submit() {
      if (!this.neverSubmitted || this.apiGroupIdsToSubmit.size === 0) {
        return;
      }
      for (const groupId of Array.from(this.apiGroupIdsToSubmit.values())) {
        this.submitOnModel(groupId);
      }
      this.parameters.events?.onODataSubmit?.();
    }

    /**
     *  Is strict handling canceled.
     * @returns True if it is canceled, otherwise false
     */;
    _proto.isStrictCanceled = function isStrictCanceled() {
      return this.oDataStrictHandling?.isCanceled() ?? false;
    }

    /**
     * Submits the batch at the model level related to the groupId of the operation.
     * @param groupId The groupId of the batch
     */;
    _proto.submitOnModel = function submitOnModel(groupId) {
      this.parameters.model.submitBatch(groupId);
      this.apiGroupIdsToSubmit.delete(groupId);
    }

    /**
     * Is the SubmitMode of the groupId set to API.
     * @param groupId The groupId of the batch
     * @returns True if the SubmitMode is set to API, false otherwise
     */;
    _proto.isAPIMode = function isAPIMode(groupId) {
      if (!groupId) {
        return false;
      }
      if (groupId.startsWith("$auto") || groupId.startsWith("$direct") || groupId.startsWith("$single")) {
        return false;
      }
      const submitMode = this.parameters.appComponent.getManifestEntry("sap.ui5")?.models[""]?.settings?.groupProperties?.[groupId]?.submit;
      if (submitMode === undefined || [SubmitMode.Auto, SubmitMode.Direct].includes(submitMode)) {
        return true;
      }
      return true;
    }

    /**
     * Executes the submit of the operation if the submitMode is on API and deferredSubmit is not set to true
     * The submitBatch is skipped if the groupId is $auto or $direct since done by the model.
     * @param groupId The groupId of the batch
     */;
    _proto.defaultSubmit = function defaultSubmit(groupId) {
      const firstSubmit = this.neverSubmitted;
      const isAPIMode = this.isAPIMode(groupId);
      if (!isAPIMode) {
        // The submitBatch is skipped if the groupId is $auto or $direct since done by the model
        this.neverSubmitted = false;
      } else if (this.operationProperties.deferredSubmit !== true && groupId) {
        this.neverSubmitted = false;
        this.submitOnModel(groupId);
      }
      if (firstSubmit && !this.neverSubmitted) {
        //Trigger the callback only once
        this.parameters.events?.onODataSubmit?.();
      }
    }

    /**
     *  Sets the default values for the parameters of the operation.
     * @param operationContextBinding The operation context binding
     */;
    _proto.setParametersValue = function setParametersValue(operationContextBinding) {
      if (this.operationParameters.length) {
        const defaultValues = this.parameters.parametersValues ?? {};
        for (const parameter of this.operationParameters) {
          const name = parameter.name;
          if (!defaultValues[name]) {
            switch (parameter.type) {
              case "Edm.String":
                defaultValues[name] = "";
                break;
              case "Edm.Boolean":
                defaultValues[name] = false;
                break;
              case "Edm.Byte":
              case "Edm.Int16":
              case "Edm.Int32":
              case "Edm.Int64":
                defaultValues[name] = 0;
                break;
              default:
                break;
            }
          }
          operationContextBinding.setParameter(name, defaultValues[name]);
        }
      }
    }

    /**
     * Requests the side effects for the action.
     * @param context  The context of the SideEffects
     * @param groupId  The groupId of the batch
     * @param localPromise The promise of the invoked action
     * @returns The promise of the side effect
     */;
    _proto.requestSideEffects = async function requestSideEffects(context, groupId, localPromise) {
      const sideEffectsService = this.parameters.appComponent.getSideEffectsService();
      let promises = localPromise ?? [];
      // trigger actions from side effects
      if (this.sideEffects && !this.parameters.disableSideEffects === true) {
        promises = promises.concat((this.sideEffects.triggerActions ?? []).map(async action => sideEffectsService.executeAction(action, context, groupId)), this.sideEffects.pathExpressions ? sideEffectsService.requestSideEffects(this.sideEffects.pathExpressions, context, groupId) : []);
        try {
          await Promise.all(promises);
          if (this.sideEffects.pathExpressions) {
            this.parameters.events?.onRequestSideEffects?.(this.sideEffects, this.operation, promises);
          }
        } catch (error) {
          Log.info("Error while requesting side effects for the operation " + this.actionName, error);
        }
      }
    };
    return ODataOperation;
  }();
  _exports = ODataOperation;
  return _exports;
}, false);
//# sourceMappingURL=ODataOperation-dbg.js.map
