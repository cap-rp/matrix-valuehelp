/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "./Operation"], function (MetaModelConverter, Operation) {
  "use strict";

  var convertTypes = MetaModelConverter.convertTypes;
  /**
   * Calls an action import.
   * @param actionName The name of the action import to be called
   * @param model An instance of an OData V4 model
   * @param appComponent The AppComponent
   * @param [parameters] Optional, can contain the following attributes:
   * @param [parameters.parameterValues] A map of action parameter names and provided values
   * @param [parameters.label] A human-readable label for the action
   * @param [parameters.showActionParameterDialog] If set and if parameters exist the user retrieves a dialog to fill in parameters, if actionParameters are passed they are shown to the user
   * @param [parameters.onSubmitted] Function which is called once the actions are submitted with an array of promises
   * @param [parameters.defaultParameters] Can contain default parameters from FLP user defaults
   * @param [parameters.ignoreETag] If specified, the action is called without ETag handling
   * @returns Promise resolves with an array of response objects
   */
  async function callActionImport(actionName, model, appComponent, parameters) {
    const metaModel = model.getMetaModel();
    const actionPath = `/${actionName}`;
    const convertedTypes = convertTypes(metaModel);
    const convertedActionImport = convertedTypes.resolvePath(actionPath).target,
      convertedAction = convertedActionImport?.action;
    if (!convertedAction) {
      throw new Error("Unknown action import");
    }
    return new Operation(appComponent, model, convertedActionImport.action, parameters).execute();
  }
  async function callBoundFunction(sFunctionName, context, oModel) {
    if (!context) {
      return Promise.reject("Bound functions always requires a context");
    }
    const oMetaModel = oModel.getMetaModel(),
      sFunctionPath = `${oMetaModel.getMetaPath(context.getPath())}/${sFunctionName}`,
      oBoundFunction = oMetaModel.createBindingContext(sFunctionPath);
    return _executeFunction(sFunctionName, oModel, oBoundFunction, context);
  }

  /**
   * Calls a function import.
   * @param sFunctionName The name of the function to be called
   * @param oModel An instance of an OData v4 model
   * @returns Promise resolves
   */
  async function callFunctionImport(sFunctionName, oModel) {
    const oMetaModel = oModel.getMetaModel(),
      sFunctionPath = oModel.bindContext(`/${sFunctionName}`).getPath(),
      oFunctionImport = oMetaModel.createBindingContext(`/${oMetaModel.createBindingContext(sFunctionPath).getObject("$Function")}/0`);
    return _executeFunction(sFunctionName, oModel, oFunctionImport);
  }
  async function _executeFunction(sFunctionName, oModel, oFunction, context) {
    if (!oFunction?.getObject()) {
      return Promise.reject(new Error(`Function ${sFunctionName} not found`));
    }
    const functionToCall = oModel.bindContext(`${context?.getPath() ?? ""}/${sFunctionName}(...)`);
    const groupId = context ? "functionGroup" : "functionImport";
    const executionPromise = functionToCall.invoke(groupId);
    oModel.submitBatch(groupId);
    await executionPromise;
    return functionToCall.getBoundContext();
  }

  /**
   * Static functions to call OData actions (bound/import) and functions (bound/import)
   * @namespace
   * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
   * @since 1.56.0
   */
  const operations = {
    callActionImport: callActionImport,
    callBoundFunction: callBoundFunction,
    callFunctionImport: callFunctionImport
  };
  return operations;
}, false);
//# sourceMappingURL=facade-dbg.js.map
