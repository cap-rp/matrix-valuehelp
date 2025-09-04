/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/UIFormatters", "sap/ui/core/Lib", "../../helpers/BindingHelper", "../ManifestSettings"], function (BindingToolkit, Action, ConfigurableObject, Key, ModelHelper, TypeGuards, DataModelPathHelper, UIFormatters, Library, BindingHelper, ManifestSettings) {
  "use strict";

  var _exports = {};
  var ActionType = ManifestSettings.ActionType;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var UI = BindingHelper.UI;
  var Draft = BindingHelper.Draft;
  var isVisible = UIFormatters.isVisible;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var isEntitySet = TypeGuards.isEntitySet;
  var KeyHelper = Key.KeyHelper;
  var Placement = ConfigurableObject.Placement;
  var isMenuAIOperation = Action.isMenuAIOperation;
  var isActionAIOperation = Action.isActionAIOperation;
  var getSemanticObjectMapping = Action.getSemanticObjectMapping;
  var getEnabledForAnnotationAction = Action.getEnabledForAnnotationAction;
  var getCopyAction = Action.getCopyAction;
  var dataFieldIsCopyAction = Action.dataFieldIsCopyAction;
  var ButtonType = Action.ButtonType;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Retrieves all the DataFieldForActions from the Identification annotation
   * They must be
   * - Either linked to an unbound action or to an action which has an OperationAvailable that is not set to false statically.
   * @param entityType The current entity type
   * @param isDeterminingAction The flag which denotes whether or not the action is a determining action
   * @returns An array of DataFieldForAction respecting the input parameter 'isDeterminingAction'
   */
  function getIdentificationDataFieldForActions(entityType, isDeterminingAction) {
    return entityType.annotations?.UI?.Identification?.filter(identificationDataField => {
      return identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && Boolean(identificationDataField.Determining?.valueOf()) === isDeterminingAction && (identificationDataField.ActionTarget?.isBound?.valueOf() !== true || identificationDataField?.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false) ? true : false;
    }) || [];
  }

  /**
   * Retrieves all the data field for actions for the identification annotation
   * They must be
   * - Either linked to an Unbound action or to an action which has an OperationAvailable that is not set to false statically.
   * @param entityType The current entity type
   * @param isDeterminingAction The flag which denotes whether or not the action is a determining action
   * @returns An array of DataField for action respecting the input parameter 'isDeterminingAction'
   */
  _exports.getIdentificationDataFieldForActions = getIdentificationDataFieldForActions;
  function getIdentificationDataFieldForActionsOrGroups(entityType, isDeterminingAction) {
    return entityType.annotations?.UI?.Identification?.filter(identificationDataField => {
      return identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" && Boolean(identificationDataField.Determining?.valueOf()) === isDeterminingAction && (identificationDataField.ActionTarget?.isBound?.valueOf() !== true || identificationDataField?.ActionTarget?.annotations?.Core?.OperationAvailable?.valueOf() !== false) || identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForActionGroup" ? true : false;
    }) || [];
  }

  /**
   * Retrieve all the IBN actions for the identification annotation.
   * @param entityType The current entitytype
   * @param isDeterminingAction Whether or not the action should be determining
   * @returns An array of data field for action respecting the isDeterminingAction property.
   */
  _exports.getIdentificationDataFieldForActionsOrGroups = getIdentificationDataFieldForActionsOrGroups;
  function getIdentificationDataFieldForIBNActions(entityType, isDeterminingAction) {
    return entityType.annotations?.UI?.Identification?.filter(identificationDataField => {
      return identificationDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && Boolean(identificationDataField.Determining?.valueOf()) === isDeterminingAction ? true : false;
    }) || [];
  }
  const IMPORTANT_CRITICALITIES = ["UI.CriticalityType/VeryPositive", "UI.CriticalityType/Positive", "UI.CriticalityType/Negative", "UI.CriticalityType/VeryNegative"];

  /**
   * Method to determine the 'visible' property binding for the Delete button on an object page.
   * @param converterContext Instance of the converter context.
   * @param deleteHidden The value of the UI.DeleteHidden annotation on the entity set / type.
   * @returns The binding expression for the 'visible' property of the Delete button.
   */
  _exports.IMPORTANT_CRITICALITIES = IMPORTANT_CRITICALITIES;
  function getDeleteButtonVisibility(converterContext, deleteHidden) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath(),
      visitedNavigationPaths = dataModelObjectPath.navigationProperties.map(navProp => navProp.name),
      // Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
      // For e.g. /com.sap.namespace.EntityContainer/Singleton/Property to /Singleton/Property
      deleteHiddenExpression = getExpressionFromAnnotation(deleteHidden, visitedNavigationPaths, false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), [])),
      // default to false
      manifestWrapper = converterContext.getManifestWrapper(),
      viewLevel = manifestWrapper.getViewLevel(),
      // Delete button is visible
      // In OP 		-->  when not in edit mode
      // In sub-OP 	-->  when in edit mode
      editableExpression = viewLevel > 1 ? UI.IsEditable : not(UI.IsEditable);

    // If UI.DeleteHidden annotation on entity set or type is either not defined or explicitly set to false,
    // Delete button is visible based on editableExpression.
    // else,
    // Delete button is visible based on both annotation path and editableExpression.
    return ifElse(deleteHidden === undefined || deleteHidden.valueOf() === false, editableExpression, and(editableExpression, equal(deleteHiddenExpression, false)));
  }

  /**
   * Method to determine the 'enabled' property binding for the Delete button on an object page.
   * @param isDeletable The delete restriction configured
   * @param isParentDeletable The delete restriction configured on the parent entity
   * @param converterContext
   * @returns The binding expression for the 'enabled' property of the Delete button
   */
  _exports.getDeleteButtonVisibility = getDeleteButtonVisibility;
  function getDeleteButtonEnabled(isDeletable, isParentDeletable, converterContext) {
    const entitySet = converterContext.getEntitySet(),
      isDraftRoot = ModelHelper.isDraftRoot(entitySet);
    let ret = ifElse(isParentDeletable !== undefined, isParentDeletable, ifElse(isDeletable !== undefined, equal(getExpressionFromAnnotation(isDeletable), true), constant(true)));

    // delete should be disabled for Locked objects
    ret = isDraftRoot ? and(ret, not(pathInModel("DraftAdministrativeData/InProcessByUser"))) : ret;
    return ret;
  }

  /**
   * Method to determine the 'visible' property binding for the Edit button on an object page.
   * @param converterContext Instance of the converter context.
   * @param rootUpdateHidden The value of the UI.UpdateHidden annotation on the entity set / type.
   * @param rootConverterContext
   * @param updateHidden
   * @param viewLevel
   * @param capabilities
   * @returns The binding expression for the 'visible' property of the Edit button.
   */
  _exports.getDeleteButtonEnabled = getDeleteButtonEnabled;
  function getEditButtonVisibility(converterContext, rootUpdateHidden, rootConverterContext, updateHidden, viewLevel, capabilities) {
    const rootEntitySet = rootConverterContext?.getEntitySet(),
      entitySet = converterContext.getEntitySet(),
      isFCLEnabled = converterContext.getManifestWrapper().isFclEnabled();
    let isDraftEnabled;
    const rootUpdateHiddenExpression = getHiddenExpression(rootConverterContext, rootUpdateHidden);
    const hiddenDraft = capabilities?.HiddenDraft?.enabled;
    if (viewLevel && viewLevel > 1) {
      // if viewlevel > 1 check if node is draft enabled
      isDraftEnabled = ModelHelper.isDraftNode(entitySet);
    } else {
      isDraftEnabled = ModelHelper.isDraftRoot(rootEntitySet);
    }
    const updateHiddenExpression = getHiddenExpression(rootConverterContext, updateHidden);
    const notEditableExpression = not(UI.IsEditable);

    // If UI.UpdateHidden annotation on entity set or type is either not defined or explicitly set to false,
    // Edit button is visible in display mode.
    // else,
    // Edit button is visible based on both annotation path and in display mode.
    const resultantExpression = ifElse(viewLevel > 1 || hiddenDraft, ifElse(updateHidden === undefined || updateHidden.valueOf() === false, and(notEditableExpression, equal(pathInModel("rootEditVisible", "internal"), true), ifElse(isFCLEnabled, equal(pathInModel("/showEditButton", "fclhelper"), true), true)), and(notEditableExpression, equal(updateHiddenExpression, false), equal(pathInModel("rootEditVisible", "internal"), true), ifElse(isFCLEnabled, equal(pathInModel("/showEditButton", "fclhelper"), true), true))), ifElse(rootUpdateHidden === undefined || rootUpdateHidden.valueOf() === false, notEditableExpression, and(notEditableExpression, equal(rootUpdateHiddenExpression, false))));
    return ifElse(isDraftEnabled, and(resultantExpression, Draft.HasNoDraftForCurrentUser), resultantExpression);
  }
  _exports.getEditButtonVisibility = getEditButtonVisibility;
  function getHiddenExpression(converterContext, updateHidden) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath(),
      visitedNavigationPaths = dataModelObjectPath.navigationProperties.map(navProp => navProp.name),
      // Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
      // For e.g. /com.sap.namespace.EntityContainer/Singleton/Property to /Singleton/Property
      updateHiddenExpression = getExpressionFromAnnotation(updateHidden, visitedNavigationPaths, false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), visitedNavigationPaths));
    return updateHiddenExpression;
  }
  /**
   * Method to determine the 'enabled' property binding for the Edit button on an object page.
   * @param converterContext Instance of the converter context.
   * @param updateRestrictions
   * @param viewLevel
   * @returns The binding expression for the 'enabled' property of the Edit button.
   */
  _exports.getHiddenExpression = getHiddenExpression;
  function getEditButtonEnabled(converterContext, updateRestrictions, viewLevel) {
    const entitySet = converterContext.getEntitySet(),
      isDraftRoot = ModelHelper.isDraftRoot(entitySet),
      isSticky = ModelHelper.isSticky(entitySet);
    let editActionName;
    if (isDraftRoot && isEntitySet(entitySet)) {
      editActionName = entitySet.annotations.Common?.DraftRoot?.EditAction;
    } else if (isSticky && isEntitySet(entitySet)) {
      editActionName = entitySet.annotations.Session?.StickySessionSupported?.EditAction;
    }
    if (editActionName) {
      const editActionAnnotationPath = converterContext.getAbsoluteAnnotationPath(editActionName);
      const editAction = converterContext.resolveAbsolutePath(editActionAnnotationPath).target;
      if (editAction?.annotations?.Core?.OperationAvailable === null) {
        // We disabled action advertisement but kept it in the code for the time being
        //return "{= ${#" + editActionName + "} ? true : false }";
      } else if (viewLevel > 1) {
        // Edit button is enabled based on the update restrictions of the sub-OP
        if (updateRestrictions !== undefined) {
          return compileExpression(and(equal(getExpressionFromAnnotation(updateRestrictions), true), equal(pathInModel("rootEditEnabled", "internal"), true)));
        } else {
          return compileExpression(equal(pathInModel("rootEditEnabled", "internal"), true));
        }
      } else {
        return getEnabledForAnnotationAction(converterContext, editAction ?? undefined);
      }
    }
    return "true";
  }
  _exports.getEditButtonEnabled = getEditButtonEnabled;
  function getHeaderDefaultActions(converterContext, capabilities) {
    const sContextPath = converterContext.getContextPath();
    const rootEntitySetPath = ModelHelper.getRootEntitySetPath(sContextPath);
    const rootConverterContext = converterContext.getConverterContextFor("/" + rootEntitySetPath);
    const entitySet = converterContext.getEntitySet(),
      entityType = converterContext.getEntityType(),
      rootEntitySet = rootConverterContext.getEntitySet(),
      rootEntityType = rootConverterContext.getEntityType(),
      stickySessionSupported = ModelHelper.getStickySession(rootEntitySet),
      //for sticky app
      draftRoot = ModelHelper.getDraftRoot(rootEntitySet),
      //entitySet && entitySet.annotations.Common?.DraftRoot,
      collaborationOnRoot = ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) && draftRoot,
      draftNode = ModelHelper.getDraftNode(rootEntitySet),
      entityDeleteRestrictions = entitySet && entitySet.annotations?.Capabilities?.DeleteRestrictions,
      rootUpdateHidden = ModelHelper.isUpdateHidden(rootEntitySet, rootEntityType),
      updateHidden = rootEntitySet && isEntitySet(rootEntitySet) && rootUpdateHidden?.valueOf(),
      dataModelObjectPath = converterContext.getDataModelObjectPath(),
      isParentDeletable = isPathDeletable(dataModelObjectPath, {
        pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, converterContext.getConvertedTypes(), navigationPaths)
      }),
      parentEntitySetDeletable = isParentDeletable ? compileExpression(isParentDeletable) : isParentDeletable,
      identificationDataFieldForActions = getIdentificationDataFieldForActionsOrGroups(converterContext.getEntityType(), false);
    const copyDataField = converterContext.getManifestWrapper().getViewLevel() === 1 ? getCopyAction(identificationDataFieldForActions.filter(dataField => {
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
        return dataFieldIsCopyAction(dataField);
      }
    })) : undefined;
    const headerDataFieldForActions = identificationDataFieldForActions.filter(dataField => {
      return !dataFieldIsCopyAction(dataField);
    });

    // Initialize actions and start with draft actions if available since they should appear in the first
    // leftmost position in the actions area of the OP header
    // This is more like a placeholder than a single action, since this controls not only the templating of
    // the button for switching between draft and active document versions but also the controls for
    // the collaborative draft fragment.
    const headerActions = [];
    if (isEntitySet(entitySet) && draftRoot?.EditAction && updateHidden !== true) {
      headerActions.push({
        type: ActionType.DraftActions,
        key: "DraftActions"
      });
    }
    const viewLevel = converterContext.getManifestWrapper().getViewLevel();
    const updatablePropertyPath = viewLevel > 1 ? entitySet?.annotations.Capabilities?.UpdateRestrictions?.Updatable : undefined;
    if (draftRoot || draftNode) {
      headerActions.push({
        type: ActionType.CollaborationAvatars,
        key: "CollaborationAvatars"
      });
    }
    // Then add the "Critical" DataFieldForActions and DataFieldForActionGroups
    // Prioritizes actions and action groups that have the Criticality annotation, placing them before those without the annotation
    computeActionsAndActionGroups(headerActions, true, headerDataFieldForActions, converterContext);

    // Then the edit action if it exists
    if ((draftRoot?.EditAction || stickySessionSupported?.EditAction) && updateHidden !== true) {
      let visible = getEditButtonVisibility(converterContext, rootUpdateHidden, rootConverterContext, ModelHelper.isUpdateHidden(entitySet, entityType), viewLevel, capabilities);
      if (collaborationOnRoot) {
        visible = and(visible, not(equal(UI.hasCollaborationAuthorization, false)));
      }
      headerActions.push({
        type: ActionType.Primary,
        key: "EditAction",
        visible: compileExpression(visible),
        enabled: getEditButtonEnabled(rootConverterContext, updatablePropertyPath, viewLevel)
      });
    }
    // Then the delete action if we're not statically not deletable
    if (parentEntitySetDeletable && parentEntitySetDeletable !== "false" || entityDeleteRestrictions?.Deletable?.valueOf() !== false && parentEntitySetDeletable !== "false") {
      const deleteHidden = ModelHelper.getDeleteHidden(entitySet, entityType);
      let visible = getDeleteButtonVisibility(converterContext, deleteHidden);
      if (collaborationOnRoot) {
        visible = and(visible, not(equal(UI.hasCollaborationAuthorization, false)));
      }
      headerActions.push({
        type: ActionType.Secondary,
        key: "DeleteAction",
        visible: compileExpression(visible),
        enabled: compileExpression(getDeleteButtonEnabled(entityDeleteRestrictions?.Deletable, isParentDeletable, converterContext)),
        parentEntityDeleteEnabled: parentEntitySetDeletable
      });
    }
    if (copyDataField) {
      headerActions.push({
        ...getDataFieldAnnotationAction(copyDataField, converterContext),
        type: ActionType.Copy,
        text: copyDataField.Label?.toString() ?? Library.getResourceBundleFor("sap.fe.core").getText("C_COMMON_COPY")
      });
    }
    const headerDataFieldForIBNActions = getIdentificationDataFieldForIBNActions(converterContext.getEntityType(), false);
    headerDataFieldForIBNActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField?.Criticality));
      return !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      if (dataField.RequiresContext?.valueOf() === true) {
        throw new Error(`RequiresContext property should not be true for header IBN action : ${dataField.Label}`);
      }
      if (dataField.Inline?.valueOf() === true) {
        throw new Error(`Inline property should not be true for header IBN action : ${dataField.Label}`);
      }
      const oNavigationParams = {
        semanticObjectMapping: getSemanticObjectMapping(dataField.Mapping)
      };
      headerActions.push({
        type: ActionType.DataFieldForIntentBasedNavigation,
        text: dataField.Label?.toString(),
        annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
        buttonType: ButtonType.Ghost,
        visible: compileExpression(and(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true)), not(equal(pathInModel("shellNavigationNotAvailable", "internal"), true)))),
        enabled: dataField.NavigationAvailable !== undefined ? compileExpression(equal(getExpressionFromAnnotation(dataField.NavigationAvailable), true)) : true,
        key: KeyHelper.generateKeyFromDataField(dataField),
        isNavigable: true,
        press: compileExpression(fn("._intentBasedNavigation.navigate", [getExpressionFromAnnotation(dataField.SemanticObject), getExpressionFromAnnotation(dataField.Action), oNavigationParams])),
        customData: compileExpression({
          semanticObject: getExpressionFromAnnotation(dataField.SemanticObject),
          action: getExpressionFromAnnotation(dataField.Action)
        })
      });
    });
    // Finally the non critical DataFieldForActions and DataFieldForActionGroups
    computeActionsAndActionGroups(headerActions, false, headerDataFieldForActions, converterContext);
    return headerActions;
  }
  _exports.getHeaderDefaultActions = getHeaderDefaultActions;
  function getHiddenHeaderActions(converterContext) {
    const entityType = converterContext.getEntityType();
    const hiddenActions = entityType.annotations?.UI?.Identification?.filter(identificationDataField => {
      return identificationDataField?.annotations?.UI?.Hidden?.valueOf() === true;
    }) || [];
    return hiddenActions.map(dataField => {
      return {
        type: ActionType.Default,
        key: KeyHelper.generateKeyFromDataField(dataField)
      };
    });
  }
  _exports.getHiddenHeaderActions = getHiddenHeaderActions;
  function getFooterDefaultActions(viewLevel, converterContext, capabilities) {
    const entitySet = converterContext.getEntitySet();
    const entityType = converterContext.getEntityType();
    const stickySessionSupported = ModelHelper.getStickySession(entitySet),
      //for sticky app
      entitySetDraftRoot = isEntitySet(entitySet) && (entitySet.annotations.Common?.DraftRoot?.term ?? entitySet.annotations.Session?.StickySessionSupported?.term),
      conditionSave = Boolean(entitySetDraftRoot === "com.sap.vocabularies.Common.v1.DraftRoot" || capabilities?.HiddenDraft?.enabled || stickySessionSupported && stickySessionSupported?.SaveAction),
      conditionApply = viewLevel > 1 && !capabilities?.HiddenDraft?.enabled,
      conditionCancel = Boolean(entitySetDraftRoot === "com.sap.vocabularies.Common.v1.DraftRoot" || capabilities?.HiddenDraft?.enabled || stickySessionSupported && stickySessionSupported?.DiscardAction),
      conditionCreateNext = viewLevel > 1 && capabilities?.HiddenDraft?.enabled && !capabilities?.HiddenDraft?.hideCreateNext;

    // Retrieve all determining actions
    const footerDataFieldForActions = getIdentificationDataFieldForActions(converterContext.getEntityType(), true);

    // First add the "Critical" DataFieldForActions
    const footerActions = footerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField?.Criticality));
      return criticality && IMPORTANT_CRITICALITIES.includes(criticality);
    }).map(dataField => {
      return getDataFieldAnnotationAction(dataField, converterContext);
    });
    if (conditionCreateNext) {
      footerActions.push({
        type: ActionType.CreateNext,
        key: "CreateNextAction"
      });
    }
    // Then the save action if it exists
    if (entitySet?.entityTypeName === entityType?.fullyQualifiedName && conditionSave) {
      footerActions.push({
        type: ActionType.Primary,
        key: "SaveAction"
      });
    }

    // Then the apply action if it exists
    if (conditionApply) {
      footerActions.push({
        type: ActionType.DefaultApply,
        key: "ApplyAction"
      });
    }
    // Then the non critical DataFieldForActions
    footerDataFieldForActions.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField?.Criticality));
      return criticality && !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      footerActions.push(getDataFieldAnnotationAction(dataField, converterContext));
    });

    // Then the cancel action if it exists
    if (conditionCancel) {
      footerActions.push({
        type: ActionType.Secondary,
        key: "CancelAction",
        position: {
          placement: Placement.End
        }
      });
    }
    return footerActions;
  }
  _exports.getFooterDefaultActions = getFooterDefaultActions;
  function getDataFieldAnnotationAction(dataField, converterContext) {
    let isVisibleExp = isVisible(dataField);
    const collaborationOnRoot = ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) && ModelHelper.getDraftRoot(converterContext.getEntitySet());
    if (collaborationOnRoot) {
      isVisibleExp = and(isVisibleExp, not(equal(UI.hasCollaborationAuthorization, false)));
    }
    return {
      type: ActionType.DataFieldForAction,
      annotationPath: converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName),
      key: KeyHelper.generateKeyFromDataField(dataField),
      visible: compileExpression(isVisibleExp),
      enabled: getEnabledForAnnotationAction(converterContext, dataField.ActionTarget),
      isNavigable: true,
      isAIOperation: isActionAIOperation(dataField) === true || undefined
    };
  }

  /**
   * Adds actions and action groups to the headerActions array, prioritizing them according to their criticality.
   * @param headerActions Array with all the current header actions in it
   * @param prioritizeCriticality Flag to determine the priority of the criticality action or actionGroups inside headerActions
   * @param headerDataFieldForActionsOrGroups All actions and action groups from the identification annotation with CopyAction filtered out
   * @param converterContext Instance of the converter context
   */
  function computeActionsAndActionGroups(headerActions, prioritizeCriticality, headerDataFieldForActionsOrGroups, converterContext) {
    headerDataFieldForActionsOrGroups.filter(dataField => {
      const criticality = compileExpression(getExpressionFromAnnotation(dataField?.Criticality));
      return prioritizeCriticality ? IMPORTANT_CRITICALITIES.includes(criticality) : !IMPORTANT_CRITICALITIES.includes(criticality);
    }).forEach(dataField => {
      if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
        headerActions.push(getDataFieldAnnotationAction(dataField, converterContext));
      } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForActionGroup") {
        let isVisibleExp = not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true));
        const collaborationOnRoot = ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) && ModelHelper.getDraftRoot(converterContext.getEntitySet());
        if (collaborationOnRoot) {
          isVisibleExp = and(isVisibleExp, not(equal(UI.hasCollaborationAuthorization, false)));
        }
        headerActions.push({
          type: ActionType.Menu,
          text: dataField.Label,
          key: KeyHelper.generateKeyFromDataField(dataField),
          id: KeyHelper.generateKeyFromDataField(dataField),
          visible: compileExpression(isVisibleExp),
          menu: dataField.Actions.map(action => getDataFieldAnnotationAction(action, converterContext)),
          isAIOperation: isMenuAIOperation(dataField.Actions) === true || undefined
        });
      }
    });
  }
  return _exports;
}, false);
//# sourceMappingURL=HeaderAndFooterAction-dbg.js.map
