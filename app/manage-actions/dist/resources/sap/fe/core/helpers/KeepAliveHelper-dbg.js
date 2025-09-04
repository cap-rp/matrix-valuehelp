/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/KeepAliveRefreshTypes", "./ModelHelper"], function (Log, KeepAliveRefreshTypes, ModelHelper) {
  "use strict";

  var RefreshStrategyType = KeepAliveRefreshTypes.RefreshStrategyType;
  var PATH_TO_STORE = KeepAliveRefreshTypes.PATH_TO_STORE;
  // Private functions - start
  const _fnSimplifyEntitySetPath = function (metaModel, entitySetPathToUse) {
    const entitySetPath = ModelHelper.getEntitySetPath(entitySetPathToUse);
    const entitySet = entitySetPath.includes("$NavigationPropertyBinding") && metaModel.getObject(entitySetPath);
    return entitySet ? `/${entitySet}` : entitySetPathToUse;
  };
  const _fnIsApplicable = function (primaryPath, key, strategy) {
    return primaryPath === key || strategy === RefreshStrategyType.IncludingDependents && primaryPath.startsWith(key);
  };
  /**
   * Check if given path resides in the context path provided.
   * @param metaModel MetaModel to be used
   * @param contextPath Context path to be used
   * @param path Path to be used
   * @param strategy Strategy, it could be 'self' | 'includingDependents'
   * @returns Returns true if the context path is applicable.
   */
  const _isPathApplicableToContextPath = function (metaModel, contextPath, path, strategy) {
    let contextPathToCheck = contextPath.startsWith("/") ? contextPath : `/${contextPath}`,
      pathToCheck = path.startsWith("/") ? path : `/${path}`;
    if (!_fnIsApplicable(contextPathToCheck, pathToCheck, strategy)) {
      contextPathToCheck = _fnSimplifyEntitySetPath(metaModel, contextPathToCheck);
      if (!_fnIsApplicable(contextPathToCheck, pathToCheck, strategy)) {
        pathToCheck = _fnSimplifyEntitySetPath(metaModel, pathToCheck);
      } else {
        return true;
      }
    }
    return _fnIsApplicable(contextPathToCheck, pathToCheck, strategy);
  };
  // Private functions - end
  /**
   * Get controls to refresh in a view.
   * @param view View of the controls
   * @param controls Context path to be used
   * @returns Returns controls that need to be refreshed.
   */
  const getControlsForRefresh = function (view, controls) {
    const controlsForRefresh = [];
    const metaModel = view.getModel().getMetaModel();
    const internalModel = view.getModel("internal");
    const refreshStrategy = internalModel.getProperty(PATH_TO_STORE) || {};
    if (controls) {
      controls.forEach(function (control) {
        const contextPath = control.data("targetCollectionPath");
        for (const key in refreshStrategy) {
          const strategy = refreshStrategy[key];
          if (!controlsForRefresh.includes(control) && _isPathApplicableToContextPath(metaModel, contextPath, key, strategy)) {
            controlsForRefresh.push(control);
          }
        }
      });
    }
    return controlsForRefresh;
  };
  /**
   * Get refresh strategy for the control for a context path.
   * @param control Control from which refresh info is needed
   * @param contextPath ContextPath for properities
   * @returns Returns strategy for control refresh.
   */
  const getControlRefreshStrategyForContextPath = function (control, contextPath) {
    const metaModel = control.getModel().getMetaModel();
    const internalModel = control.getModel("internal");
    const refreshStrategy = internalModel.getProperty(PATH_TO_STORE) || {};
    let strategy;
    if (contextPath) {
      for (const key in refreshStrategy) {
        const strategyToCheck = refreshStrategy[key];
        if (_isPathApplicableToContextPath(metaModel, contextPath, key, strategyToCheck)) {
          strategy = strategyToCheck;
          if (strategy === "includingDependents") {
            break;
          }
        }
      }
    }
    return strategy;
  };
  /**
   * Get refresh info from view.
   * @param view View from which refresh info is needed
   * @returns Returns strategy for view refresh.
   */
  const getViewRefreshInfo = function (view) {
    const viewData = view.getViewData(),
      contextPath = viewData && (viewData?.contextPath || `/${viewData?.entitySet}`);
    return KeepAliveHelper.getControlRefreshStrategyForContextPath(view, contextPath);
  };

  /**
   * Get refresh strategy for an intent.
   * @param refreshStrategies RefreshStrategies to consider
   * @param semanticObject Outbound Semantic Object
   * @param action Outbound Action
   * @returns Returns refresh strategies to use for the intent.
   */
  const getRefreshStrategyForIntent = function (refreshStrategies, semanticObject, action) {
    const soAction = semanticObject && action && `${semanticObject}-${action}`;
    const intents = refreshStrategies.intents;
    const soActionIntentMatch = intents && soAction && intents[soAction];
    const soIntentMatch = !soActionIntentMatch && intents && semanticObject && intents[semanticObject];
    return soActionIntentMatch || soIntentMatch || refreshStrategies?.defaultBehavior || refreshStrategies?._feDefault;
  };
  /**
   * Store control refresh strategy for hash in the internal model.
   * @param control Control for the refresh strategy
   * @param hash Shell hash object
   */
  const storeControlRefreshStrategyForHash = function (control, hash) {
    if (control && control.getModel("viewData") && control.getModel("internal")) {
      const viewData = control.getModel("viewData");
      const refreshStrategies = viewData.getProperty(PATH_TO_STORE);
      if (refreshStrategies) {
        const internalModel = control.getModel("internal");
        const refreshStrategy = KeepAliveHelper.getRefreshStrategyForIntent(refreshStrategies, hash?.semanticObject, hash?.action);
        internalModel.setProperty(PATH_TO_STORE, refreshStrategy);
      }
    }
  };

  /**
   * Method to refresh and restore the view if neccessary.
   * @param view Control for the refresh strategy
   * @returns A promise after view refresh and restore are triggered
   */
  const restoreView = async function (view) {
    const internalModelContext = view.getBindingContext("internal");
    const controller = view.getController();
    const viewState = controller?.viewState;
    let refreshBindings = Promise.resolve();
    if (internalModelContext && internalModelContext.getProperty("restoreStatus") === "pending") {
      if (viewState.refreshViewBindings) {
        refreshBindings = viewState.refreshViewBindings();
        refreshBindings.then(function () {
          Log.info(`FE V4: Refresh was triggered successfull: ${view.getId()}`);
          return;
        }).catch(function (err) {
          Log.warning(`FE V4: Refresh was unsuccessfull: ${view.getId()}`, err);
        });
      }
      refreshBindings = refreshBindings.then(function () {
        viewState.onRestore();
        internalModelContext.setProperty("restoreStatus", "done");
        return;
      }).catch(function (error) {
        Log.warning(`FE V4: Restore was unsuccessfull: ${view.getId()}`, error);
      });
    }
    return refreshBindings;
  };

  /**
   * helper class for KeepAlive feature in sap.fe.
   */
  const KeepAliveHelper = {
    getControlsForRefresh,
    getControlRefreshStrategyForContextPath,
    getViewRefreshInfo,
    getRefreshStrategyForIntent,
    storeControlRefreshStrategyForHash,
    restoreView
  };
  return KeepAliveHelper;
}, false);
//# sourceMappingURL=KeepAliveHelper-dbg.js.map
