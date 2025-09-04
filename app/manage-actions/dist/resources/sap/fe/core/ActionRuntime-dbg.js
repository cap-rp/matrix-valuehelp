/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/ui/core/Messaging", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType", "./controls/AnyElement", "./converters/ConverterContext", "./converters/objectPage/HeaderAndFooterAction"], function (merge, BindingToolkit, CommonUtils, ModelHelper, TypeGuards, Messaging, Message, MessageType, AnyElement, ConverterContext, HeaderAndFooterAction) {
  "use strict";

  var getHiddenExpression = HeaderAndFooterAction.getHiddenExpression;
  var getEditButtonEnabled = HeaderAndFooterAction.getEditButtonEnabled;
  var isEntitySet = TypeGuards.isEntitySet;
  var transformRecursively = BindingToolkit.transformRecursively;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const ActionRuntime = {
    /**
     * Adds error messages for an action parameter field to the message manager.
     * @param messageParameters Information identifying an action parameter and messages referring to this parameter
     */
    _addMessageForActionParameter: function (messageParameters) {
      Messaging.addMessages(messageParameters.map(messageParameter => {
        const binding = messageParameter.actionParameterInfo.field.getBinding(messageParameter.actionParameterInfo.isMultiValue ? "items" : "value");
        return new Message({
          message: messageParameter.message,
          type: MessageType.Error,
          processor: binding?.getModel() ?? undefined,
          // getModel(): null | Model ~~> processor?: MessageProcessor
          persistent: true,
          target: binding?.getResolvedPath()
        });
      }));
    },
    /**
     * Checks if all required action parameters contain data and checks for all action parameters if the
     * contained data is valid.
     * @param actionParameterInfos Information identifying an action parameter
     * @param resourceModel The model to load text resources
     * @returns The validation result can be true or false
     */
    validateProperties: async function (actionParameterInfos, resourceModel) {
      await Promise.allSettled(actionParameterInfos.map(actionParameterInfo => actionParameterInfo.validationPromise));
      const requiredParameterInfos = actionParameterInfos.filter(parameterInfo => parameterInfo.field.getRequired && parameterInfo.field.getRequired());
      const allMessages = Messaging.getMessageModel().getData();
      const emptyRequiredFields = requiredParameterInfos.filter(requiredParameterInfo => {
        const fieldId = requiredParameterInfo.field.getId();
        const relevantMessages = allMessages.filter(msg => msg.getControlIds().some(controlId => controlId.includes(fieldId)));
        if (relevantMessages.length > 0) {
          return false;
        } else if (requiredParameterInfo.isMultiValue) {
          return requiredParameterInfo.value === undefined || !requiredParameterInfo.value.length;
        } else {
          const fieldValue = requiredParameterInfo.field.getValue();
          const isFieldArray = Array.isArray(requiredParameterInfo.field.getValue());
          if (isFieldArray) {
            // only first value check is enough as the field value comes on [0] rest of the array includes currency and currency code
            // both of which can or cannot be null, so we shall check only the field value
            return fieldValue[0] === null || fieldValue[0] === "";
          }
          return fieldValue === undefined || fieldValue === null || fieldValue === "";
        }
      });
      /* Message for missing mandatory value of the action parameter */
      if (emptyRequiredFields.length) {
        this._addMessageForActionParameter(emptyRequiredFields.map(actionParameterInfo => ({
          actionParameterInfo: actionParameterInfo,
          message: resourceModel.getText("C_OPERATIONS_ACTION_PARAMETER_DIALOG_MISSING_MANDATORY_MSG", [(actionParameterInfo.field.getParent()?.getAggregation("label")).getText()])
        })));
      }
      /* Check value state of all parameters */
      const firstInvalidParameter = actionParameterInfos.find(parameterInfo => parameterInfo.field.getVisible() && (parameterInfo.hasError || parameterInfo.field.getValueState() === "Error" || emptyRequiredFields.includes(parameterInfo)));
      if (firstInvalidParameter) {
        firstInvalidParameter.field.setVisible(true);
        firstInvalidParameter.field.focus();
        return false;
      } else {
        return true;
      }
    },
    /**
     * Sets the action enablement.
     * @param oInternalModelContext Object containing the context model
     * @param oActionOperationAvailableMap Map containing the operation availability of actions
     * @param aSelectedContexts Array containing selected contexts of the chart
     * @param sControl Control name
     * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
     * @returns The action enablement promises
     */
    setActionEnablement: async function (oInternalModelContext, oActionOperationAvailableMap, aSelectedContexts, sControl) {
      let forContextMenu = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;
      const aPromises = [];
      for (const sAction in oActionOperationAvailableMap) {
        let aRequestPromises = [];
        oInternalModelContext.setProperty(sAction, false);
        if (sControl === "table") {
          oInternalModelContext.setProperty(`dynamicActions/${sAction}/aApplicable`, []);
          oInternalModelContext.setProperty(`dynamicActions/${sAction}/aNotApplicable`, []);
          if (forContextMenu) {
            oInternalModelContext.setProperty(`dynamicActions/${sAction}/bEnabledForContextMenu`, false);
          } else {
            oInternalModelContext.setProperty(`dynamicActions/${sAction}/bEnabled`, false);
          }
        }
        const sProperty = oActionOperationAvailableMap[sAction];
        for (const element of aSelectedContexts) {
          const oSelectedContext = element;
          if (oSelectedContext) {
            const oContextData = oSelectedContext.getObject();
            if (sControl === "chart") {
              if (sProperty === null && !!oContextData[`#${sAction}`] || oSelectedContext.getObject(sProperty)) {
                //look for action advertisement if present and its value is not null
                oInternalModelContext.setProperty(sAction, true);
                break;
              }
            } else if (sControl === "table") {
              aRequestPromises = this._setActionEnablementForTable(oSelectedContext, oInternalModelContext, sAction, sProperty, aRequestPromises, forContextMenu);
            }
          }
        }
        if (sControl === "table") {
          if (!aSelectedContexts.length) {
            oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
              bEnabled: false,
              aApplicable: [],
              aNotApplicable: []
            });
            aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, [], forContextMenu));
          } else if (aSelectedContexts.length && typeof sProperty === "string") {
            // When all property values have been retrieved, set
            // The applicable and not-applicable selected contexts for each action and
            // The enabled property of the dynamic action in internal model context.
            aPromises.push(CommonUtils.setContextsBasedOnOperationAvailable(oInternalModelContext, aRequestPromises, forContextMenu));
          }
        }
      }
      return Promise.all(aPromises);
    },
    setActionEnablementAfterPatch: function (oView, oListBinding, oInternalModelContext) {
      const oInternalModelContextData = oInternalModelContext?.getObject();
      const oControls = oInternalModelContextData?.controls || {};
      for (const sKey in oControls) {
        if (oControls[sKey] && oControls[sKey].controlId) {
          const oTable = oView.byId(sKey);
          if (oTable && oTable.isA("sap.ui.mdc.Table")) {
            const oRowBinding = oTable.getRowBinding();
            if (oRowBinding == oListBinding) {
              const tableAPI = oTable.getParent();
              ActionRuntime.setActionEnablement(oTable.getBindingContext("internal"), JSON.parse(tableAPI.tableDefinition.operationAvailableMap), oTable.getSelectedContexts(), "table");
            }
          }
        }
      }
    },
    updateEditButtonVisibilityAndEnablement(oView) {
      const iViewLevel = oView.getViewData()?.viewLevel,
        isEditable = CommonUtils.getIsEditable(oView);
      if (iViewLevel > 1 && isEditable !== true) {
        const oContext = oView.getBindingContext();
        const oAppComponent = CommonUtils.getAppComponent(oView);
        const sMetaPath = ModelHelper.getMetaPathForContext(oContext);
        const sEntitySet = ModelHelper.getRootEntitySetPath(sMetaPath);
        const metaContext = oContext?.getModel().getMetaModel()?.getContext(oContext?.getPath());
        const converterContext = ConverterContext?.createConverterContextForMacro(sEntitySet, metaContext, oAppComponent.getDiagnostics(), merge);
        const entitySet = converterContext.getEntitySet();
        const entityType = converterContext.getEntityType();
        let updateHidden;
        //Find the Update Hidden of the root entity set and bind the property to AnyElement, any changes in the path of the root UpdateHidden will be updated via the property, internal model context is updated based on the property
        const bUpdateHidden = isEntitySet(entitySet) && entitySet.annotations.UI?.UpdateHidden?.valueOf();
        if (bUpdateHidden !== true) {
          updateHidden = ModelHelper.isUpdateHidden(entitySet, entityType);
        }
        //Find the operation available property of the root edit configuration and fetch the property using AnyElement
        const sEditEnableBinding = getEditButtonEnabled(converterContext);
        const draftRootPath = ModelHelper.getDraftRootPath(oContext);
        const sStickyRootPath = ModelHelper.getStickyRootPath(oContext);
        const sPath = draftRootPath || sStickyRootPath;
        const oInternalModelContext = oView.getBindingContext("internal");
        if (sPath) {
          const oRootContext = oView.getModel().bindContext(sPath).getBoundContext();
          if (updateHidden !== undefined) {
            const sHiddenExpression = compileExpression(equal(getHiddenExpression(converterContext, updateHidden), false));
            this.updateEditModelContext(sHiddenExpression, oView, oRootContext, "rootEditVisible", oInternalModelContext);
          }
          if (sEditEnableBinding) {
            this.updateEditModelContext(sEditEnableBinding, oView, oRootContext, "rootEditEnabled", oInternalModelContext);
          }
        }
      }
    },
    updateEditModelContext: function (sBindingExpression, oView, oRootContext, sProperty, oInternalModelContext) {
      if (sBindingExpression) {
        const oHiddenElement = new AnyElement({
          anyText: sBindingExpression
        });
        oHiddenElement.setBindingContext(null);
        oView.addDependent(oHiddenElement);
        oHiddenElement.getBinding("anyText");
        const oContext = oHiddenElement.getModel()?.bindContext(oRootContext.getPath(), oRootContext, {
          $$groupId: "$auto.Heroes"
        })?.getBoundContext();
        oHiddenElement.setBindingContext(oContext);
        oHiddenElement?.getBinding("anyText")?.attachChange(oEvent => {
          const oNewValue = oEvent.getSource().getExternalValue();
          oInternalModelContext.setProperty(sProperty, oNewValue);
        });
      }
    },
    _setActionEnablementForTable: function (oSelectedContext, oInternalModelContext, sAction, sProperty, aRequestPromises) {
      let forContextMenu = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      // Retrieve previously checked contexts in case of !forContextMenu
      const sEnablementFieldName = forContextMenu ? "bEnabledForContextMenu" : "bEnabled",
        aApplicable = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`) || [],
        aNotApplicable = oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`) || [];
      let bActionEnabled = oInternalModelContext.getProperty(`dynamicActions/${sAction}/${sEnablementFieldName}`) || false;
      if (!forContextMenu) {
        oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
          bEnabled: false,
          aApplicable: [],
          aNotApplicable: []
        });
      } else {
        oInternalModelContext.setProperty(`dynamicActions/${sAction}`, {
          // Do not change enabled, aApplicable and aNotApplicable property in case of context menu calculation
          // in case of context menu, only the clicked context goes into the processing - other selected contexts must be kept in the model
          bEnabled: oInternalModelContext.getProperty(`dynamicActions/${sAction}/bEnabled`),
          aApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aApplicable`),
          aNotApplicable: oInternalModelContext.getProperty(`dynamicActions/${sAction}/aNotApplicable`),
          bEnabledForContextMenu: false,
          aApplicableForContextMenu: [],
          aNotApplicableForContextMenu: []
        });
      }
      // Note that non dynamic actions are not processed here. They are enabled because
      // one or more are selected and the second part of the condition in the templating
      // is then undefined and thus the button takes the default enabling, which is true!
      const sDynamicActionEnabledPath = `${oInternalModelContext.getPath()}/dynamicActions/${sAction}/${sEnablementFieldName}`;
      if (typeof sProperty === "object" && sProperty !== null && sProperty !== undefined) {
        if (oSelectedContext) {
          const oContextData = oSelectedContext.getObject();
          const oTransformedBinding = transformRecursively(sProperty, "PathInModel",
          // eslint-disable-next-line no-loop-func
          function (oBindingExpression) {
            return oContextData ? constant(oContextData[oBindingExpression.path]) : constant(false);
          }, true);
          const sResult = compileExpression(oTransformedBinding);
          bActionEnabled = bActionEnabled || sResult === "true";
          oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, bActionEnabled);
          (sResult === "true" ? aApplicable : aNotApplicable).push(oSelectedContext);
        }
        CommonUtils.setDynamicActionContexts(oInternalModelContext, sAction, aApplicable, aNotApplicable, forContextMenu);
      } else {
        const oContextData = oSelectedContext?.getObject();
        if (sProperty === null && !!oContextData[`#${sAction}`]) {
          //look for action advertisement if present and its value is not null
          oInternalModelContext.getModel().setProperty(sDynamicActionEnabledPath, true);
        } else if (oSelectedContext !== undefined) {
          // Collect promises to retrieve singleton or normal property value asynchronously
          aRequestPromises.push(CommonUtils.requestProperty(oSelectedContext, sAction, sProperty, sDynamicActionEnabledPath));
        }
      }
      return aRequestPromises;
    }
  };
  return ActionRuntime;
}, false);
//# sourceMappingURL=ActionRuntime-dbg.js.map
