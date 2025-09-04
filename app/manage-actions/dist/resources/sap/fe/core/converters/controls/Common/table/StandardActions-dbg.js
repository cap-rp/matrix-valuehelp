/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/formatters/TableFormatter", "../../../../helpers/BindingHelper", "../../../ManifestSettings", "../../../helpers/InsightsHelpers"], function (BindingToolkit, ModelHelper, TypeGuards, DataModelPathHelper, tableFormatters, BindingHelper, ManifestSettings, InsightsHelpers) {
  "use strict";

  var _exports = {};
  var getInsightsVisibility = InsightsHelpers.getInsightsVisibility;
  var getInsightsEnablement = InsightsHelpers.getInsightsEnablement;
  var TemplateType = ManifestSettings.TemplateType;
  var CreationMode = ManifestSettings.CreationMode;
  var ActionType = ManifestSettings.ActionType;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var UI = BindingHelper.UI;
  var isPathUpdatable = DataModelPathHelper.isPathUpdatable;
  var isPathInsertable = DataModelPathHelper.isPathInsertable;
  var isPathDeletable = DataModelPathHelper.isPathDeletable;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var isSingleton = TypeGuards.isSingleton;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isEntitySet = TypeGuards.isEntitySet;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var not = BindingToolkit.not;
  var lessOrEqual = BindingToolkit.lessOrEqual;
  var length = BindingToolkit.length;
  var isPathInModelExpression = BindingToolkit.isPathInModelExpression;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var greaterThan = BindingToolkit.greaterThan;
  var greaterOrEqual = BindingToolkit.greaterOrEqual;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  const StandardActionKeys = {
    Cut: "StandardAction::Cut",
    Copy: "StandardAction::Copy",
    Create: "StandardAction::Create",
    Delete: "StandardAction::Delete",
    CreationRow: "StandardAction::CreationRow",
    Paste: "StandardAction::Paste",
    MassEdit: "StandardAction::MassEdit",
    Insights: "StandardAction::Insights",
    MoveUp: "StandardAction::MoveUp",
    MoveDown: "StandardAction::MoveDown"
  };

  /**
   * Generates context for the standard actions.
   * @param converterContext
   * @param creationMode
   * @param tableManifestConfiguration
   * @returns  The context for table actions
   */
  _exports.StandardActionKeys = StandardActionKeys;
  function generateStandardActionsContext(converterContext, creationMode, tableManifestConfiguration) {
    return {
      collectionPath: getTargetObjectPath(converterContext.getDataModelObjectPath()),
      hiddenAnnotation: {
        create: isActionAnnotatedHidden(converterContext, "CreateHidden"),
        delete: isActionAnnotatedHidden(converterContext, "DeleteHidden"),
        update: isActionAnnotatedHidden(converterContext, "UpdateHidden")
      },
      creationMode: creationMode,
      isDraftOrStickySupported: isDraftOrStickySupported(converterContext),
      newAction: getNewAction(converterContext),
      tableManifestConfiguration: tableManifestConfiguration,
      restrictions: getRestrictions(converterContext)
    };
  }

  /**
   * Checks if sticky or draft is supported.
   * @param converterContext
   * @returns `true` if it is supported
   */
  _exports.generateStandardActionsContext = generateStandardActionsContext;
  function isDraftOrStickySupported(converterContext) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const bIsDraftSupported = ModelHelper.isObjectPathDraftSupported(dataModelObjectPath);
    const bIsStickySessionSupported = dataModelObjectPath.startingEntitySet?.annotations?.Session?.StickySessionSupported ? true : false;
    return bIsDraftSupported || bIsStickySessionSupported;
  }

  /**
   * Gets the configured newAction into annotation.
   * @param converterContext
   * @returns The new action info
   */
  _exports.isDraftOrStickySupported = isDraftOrStickySupported;
  function getNewAction(converterContext) {
    const currentEntitySet = converterContext.getEntitySet();
    const newAction = isEntitySet(currentEntitySet) ? currentEntitySet.annotations.Common?.DraftRoot?.NewAction ?? currentEntitySet.annotations.Session?.StickySessionSupported?.NewAction : undefined;
    const newActionName = newAction?.toString();
    if (newActionName) {
      const availableProperty = converterContext?.getEntityType().actions[newActionName]?.annotations?.Core?.OperationAvailable;
      return {
        name: newActionName,
        available: getExpressionFromAnnotation(availableProperty, [], true)
      };
    }
    return undefined;
  }

  /**
   * Gets the binding expression for the action visibility configured into annotation.
   * @param converterContext
   * @param sAnnotationTerm
   * @param bWithNavigationPath
   * @returns The binding expression for the action visibility
   */
  _exports.getNewAction = getNewAction;
  function isActionAnnotatedHidden(converterContext, sAnnotationTerm) {
    let bWithNavigationPath = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    // The annotations in question (CreateHidden, DeleteHidden, UpdateHidden) most specifically can be defined on EntitySet.
    // In several cases, fallback to EntityType needs to be checked:
    // - In case of singleton (annotations do not apply)
    // - EntitySet cannot be determined (containment or no navigationPropertyBinding)
    // - EntitySet can be determined, but the annotation is not defined there

    const currentEntitySet = converterContext.getEntitySet();
    const actionAnnotationValue = !isSingleton(currentEntitySet) && currentEntitySet?.annotations.UI?.[sAnnotationTerm] || converterContext.getEntityType().annotations.UI?.[sAnnotationTerm];
    if (!actionAnnotationValue) {
      return constant(false);
    }
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const visitedNavigationPaths = getRelativePaths(dataModelObjectPath);
    return getExpressionFromAnnotation(actionAnnotationValue, visitedNavigationPaths, undefined, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), visitedNavigationPaths));
  }

  /**
   * Gets the annotated restrictions for the actions.
   * @param converterContext
   * @returns The restriction information
   */
  _exports.isActionAnnotatedHidden = isActionAnnotatedHidden;
  function getRestrictions(converterContext) {
    const dataModelObjectPath = converterContext.getDataModelObjectPath();
    const restrictionsDef = [{
      key: "isInsertable",
      function: isPathInsertable
    }, {
      key: "isUpdatable",
      function: isPathUpdatable
    }, {
      key: "isDeletable",
      function: isPathDeletable
    }];
    const result = {};
    restrictionsDef.forEach(function (def) {
      const defFunction = def["function"];
      result[def.key] = {
        expression: defFunction.apply(null, [dataModelObjectPath, {
          pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, converterContext.getConvertedTypes(), navigationPaths)
        }]),
        navigationExpression: defFunction.apply(null, [dataModelObjectPath, {
          ignoreTargetCollection: true,
          authorizeUnresolvable: true,
          pathVisitor: (path, navigationPaths) => singletonPathVisitor(path, converterContext.getConvertedTypes(), navigationPaths)
        }])
      };
    });
    return result;
  }

  /**
   * Checks if templating for insert/update actions is mandatory.
   * @param standardActionsContext
   * @param isDraftOrSticky
   * @returns True if we need to template insert or update actions, false otherwise
   */
  _exports.getRestrictions = getRestrictions;
  function getInsertUpdateActionsTemplating(standardActionsContext, isDraftOrSticky) {
    return isDraftOrSticky || standardActionsContext.creationMode === CreationMode.External;
  }

  /**
   * Gets the binding expressions for the properties of the 'Create' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The standard action info
   */
  _exports.getInsertUpdateActionsTemplating = getInsertUpdateActionsTemplating;
  function getStandardActionCreate(converterContext, standardActionsContext) {
    const createVisibility = getCreateVisibility(converterContext, standardActionsContext);
    return {
      isTemplated: compileExpression(getCreateTemplating(standardActionsContext, createVisibility)),
      visible: compileExpression(createVisibility),
      visibleExpression: createVisibility,
      enabled: compileExpression(getCreateEnablement(converterContext, standardActionsContext, createVisibility)),
      enabledForContextMenu: compileExpression(getCreateEnablement(converterContext, standardActionsContext, createVisibility, true)),
      key: StandardActionKeys.Create,
      type: ActionType.Standard
    };
  }
  /**
   * Gets the binding expressions for the properties of the 'Cut' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The standard action info
   */
  _exports.getStandardActionCreate = getStandardActionCreate;
  function getStandardActionCut(converterContext, standardActionsContext) {
    const cutVisibility = getCutVisibility(converterContext, standardActionsContext);
    return {
      isTemplated: compileExpression(getDefaultTemplating(cutVisibility)),
      visible: compileExpression(cutVisibility),
      enabled: compileExpression(getCutEnablement(cutVisibility, standardActionsContext, false)),
      enabledForContextMenu: compileExpression(getCutEnablement(cutVisibility, standardActionsContext, true)),
      key: StandardActionKeys.Cut,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'Copy' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The standard action info
   */
  _exports.getStandardActionCut = getStandardActionCut;
  function getStandardActionCopy(converterContext, standardActionsContext) {
    const copyVisibility = getCopyVisibility(converterContext, standardActionsContext);
    return {
      isTemplated: compileExpression(getDefaultTemplating(copyVisibility)),
      visible: compileExpression(copyVisibility),
      enabled: compileExpression(getCopyEnablement(copyVisibility, false)),
      enabledForContextMenu: compileExpression(getCopyEnablement(copyVisibility, true)),
      key: StandardActionKeys.Copy,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'Move up' and 'Move down' actions.
   * @param converterContext
   * @param standardActionsContext
   * @param forUp
   * @returns The standard action info
   */
  _exports.getStandardActionCopy = getStandardActionCopy;
  function getStandardActionMoveUpDown(converterContext, standardActionsContext, forUp) {
    const canChangeSibling = converterContext.getEntityType().annotations.Hierarchy?.[`RecursiveHierarchyActions#${standardActionsContext.tableManifestConfiguration.hierarchyQualifier ?? ""}`]?.ChangeNextSiblingAction !== undefined;
    const moveVisibility = and(getCutVisibility(converterContext, standardActionsContext), canChangeSibling);
    return {
      isTemplated: compileExpression(getDefaultTemplating(moveVisibility)),
      visible: compileExpression(moveVisibility),
      enabled: compileExpression(getMoveUpDownEnablement(moveVisibility, standardActionsContext, forUp)),
      enabledForContextMenu: compileExpression(getMoveUpDownEnablement(moveVisibility, standardActionsContext, forUp, true)),
      key: forUp ? StandardActionKeys.MoveUp : StandardActionKeys.MoveDown,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'Delete' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expressions for the properties of the 'Delete' action.
   */
  _exports.getStandardActionMoveUpDown = getStandardActionMoveUpDown;
  function getStandardActionDelete(converterContext, standardActionsContext) {
    const deleteVisibility = getDeleteVisibility(converterContext, standardActionsContext);
    return {
      isTemplated: compileExpression(getDefaultTemplating(deleteVisibility)),
      visible: compileExpression(deleteVisibility),
      enabled: compileExpression(getDeleteEnablement(converterContext, standardActionsContext, deleteVisibility, false)),
      enabledForContextMenu: compileExpression(getDeleteEnablement(converterContext, standardActionsContext, deleteVisibility, true)),
      key: StandardActionKeys.Delete,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'CreationRow' action.
   *
   * Note that this is not actually an action that is templated as a button but its properties are used to configure an MDC feature.
   * @param converterContext
   * @param standardActionsContext
   * @returns StandardAction
   */
  _exports.getStandardActionDelete = getStandardActionDelete;
  function getCreationRow(converterContext, standardActionsContext) {
    const creationRowVisibility = getCreateVisibility(converterContext, standardActionsContext, true);
    return {
      isTemplated: compileExpression(getCreateTemplating(standardActionsContext, creationRowVisibility, true)),
      visible: compileExpression(creationRowVisibility),
      enabled: compileExpression(getCreationRowEnablement(converterContext, standardActionsContext, creationRowVisibility)),
      key: StandardActionKeys.CreationRow,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'Cut' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expression for the 'visible' property of the 'Cut' action.
   */
  _exports.getCreationRow = getCreationRow;
  function getCutVisibility(converterContext, standardActionsContext) {
    const pathUpdatableExpression = standardActionsContext.restrictions?.isUpdatable?.expression;
    const templateBindingExpression = converterContext.getTemplateType() !== TemplateType.ListReport ? UI.IsEditable : converterContext.getEntitySet()?.annotations.Common?.DraftRoot !== undefined; // To allow cut/paste for a draft TreeTable in a ListReport
    return ifElse(equal(standardActionsContext.tableManifestConfiguration?.type, "TreeTable"), and(standardActionsContext.tableManifestConfiguration.isHierarchyParentNodeUpdatable, not(and(isConstant(pathUpdatableExpression), equal(pathUpdatableExpression, false))), templateBindingExpression), false);
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'Copy' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expression for the 'visible' property of the 'Copy' action.
   */
  _exports.getCutVisibility = getCutVisibility;
  function getCopyVisibility(converterContext, standardActionsContext) {
    const availableCopyAction = converterContext?.getEntityType().annotations.Hierarchy?.[`RecursiveHierarchyActions#${standardActionsContext.tableManifestConfiguration.hierarchyQualifier ?? ""}`]?.CopyAction;
    if (!availableCopyAction) {
      return constant(false);
    }
    const templateBindingExpression = converterContext.getTemplateType() !== TemplateType.ListReport ? UI.IsEditable : converterContext.getEntitySet()?.annotations.Common?.DraftRoot !== undefined; // To allow cut/paste for a draft TreeTable in a ListReport
    return ifElse(equal(standardActionsContext.tableManifestConfiguration?.type, "TreeTable"), templateBindingExpression, false);
  }

  /**
   * Gets the binding expressions for the properties of the 'Paste' action.
   *
   * Note that this is not actually an action that is displayed as a button but its properties are used to configure an MDC feature.
   * @param converterContext
   * @param standardActionsContext
   * @param isInsertUpdateActionsTemplated
   * @returns The binding expressions for the properties of the 'Paste' action.
   */
  _exports.getCopyVisibility = getCopyVisibility;
  function getStandardActionPaste(converterContext, standardActionsContext, isInsertUpdateActionsTemplated) {
    const cutVisibility = getCutVisibility(converterContext, standardActionsContext);
    const copyVisibility = getCopyVisibility(converterContext, standardActionsContext);
    const createVisibility = getCreateVisibility(converterContext, standardActionsContext, false, true);
    const pasteVisibility = getPasteVisibility(converterContext, standardActionsContext, createVisibility, cutVisibility, copyVisibility, isInsertUpdateActionsTemplated);
    const pasteEnablement = getPasteEnablement(pasteVisibility, standardActionsContext, false);
    const pasteEnablementForContextMenu = getPasteEnablement(pasteVisibility, standardActionsContext, true);
    return {
      visible: compileExpression(pasteVisibility),
      enabled: compileExpression(pasteEnablement),
      enabledForContextMenu: compileExpression(pasteEnablementForContextMenu),
      key: StandardActionKeys.Paste,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'MassEdit' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expressions for the properties of the 'MassEdit' action.
   */
  _exports.getStandardActionPaste = getStandardActionPaste;
  function getStandardActionMassEdit(converterContext, standardActionsContext) {
    const massEditVisibility = getMassEditVisibility(converterContext, standardActionsContext);
    return {
      isTemplated: compileExpression(getDefaultTemplating(massEditVisibility)),
      visible: compileExpression(massEditVisibility),
      // For the context menu, the visibility should also consider the 'inactiveContext' property:
      // only when at least one selected context is active (i.e. "contextmenu/inactiveContext" is false), the action should be visible in the context menu
      // This is only relevant when the table manifest setting "creationMode" is "InlineCreationRows"
      visibleForContextMenu: compileExpression(and(massEditVisibility, equal(pathInModel("contextmenu/inactiveContext", "internal"), false))),
      enabled: compileExpression(getMassEditEnablement(converterContext, standardActionsContext, massEditVisibility)),
      enabledForContextMenu: compileExpression(getMassEditEnablement(converterContext, standardActionsContext, massEditVisibility, true)),
      key: StandardActionKeys.MassEdit,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expressions for the properties of the 'AddCardsToInsights' action.
   * @param converterContext
   * @param standardActionsContext
   * @param visualizationPath
   * @returns The binding expressions for the properties of the 'AddCardsToInsights' action.
   */
  _exports.getStandardActionMassEdit = getStandardActionMassEdit;
  function getStandardActionInsights(converterContext, standardActionsContext, visualizationPath) {
    const insightsVisibility = getInsightsVisibility("Table", converterContext, visualizationPath, standardActionsContext);
    const insightsEnablement = and(insightsVisibility, getInsightsEnablement());
    return {
      isTemplated: compileExpression(getDefaultTemplating(insightsVisibility)),
      visible: compileExpression(insightsVisibility),
      enabled: compileExpression(insightsEnablement),
      key: StandardActionKeys.Insights,
      type: ActionType.Standard
    };
  }

  /**
   * Gets the binding expression for the templating of the 'Create' action.
   * @param standardActionsContext
   * @param createVisibility
   * @param isForCreationRow
   * @returns The create binding expression
   */
  _exports.getStandardActionInsights = getStandardActionInsights;
  function getCreateTemplating(standardActionsContext, createVisibility) {
    let isForCreationRow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    //Templating of Create Button is not done:
    // 	 - If Button is never visible(covered the External create button, new Action)
    //	 - or CreationMode is on CreationRow for Create Button
    //	 - or CreationMode is not on CreationRow for CreationRow Button

    return and(
    //XNOR gate
    or(and(isForCreationRow, standardActionsContext.creationMode === CreationMode.CreationRow), and(!isForCreationRow, standardActionsContext.creationMode !== CreationMode.CreationRow)), or(not(isConstant(createVisibility)), createVisibility));
  }

  /**
   * Gets the binding expression for the templating of the non-Create actions.
   * @param actionVisibility
   * @returns The binding expression for the templating of the non-Create actions.
   */
  _exports.getCreateTemplating = getCreateTemplating;
  function getDefaultTemplating(actionVisibility) {
    return or(not(isConstant(actionVisibility)), actionVisibility);
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'Create' action.
   * @param converterContext
   * @param standardActionsContext
   * @param isForCreationRow
   * @param isForPaste
   * @returns The binding expression for the 'visible' property of the 'Create' action.
   */
  _exports.getDefaultTemplating = getDefaultTemplating;
  function getCreateVisibility(converterContext, standardActionsContext) {
    let isForCreationRow = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    let isForPaste = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const isInsertable = standardActionsContext.restrictions.isInsertable.expression;
    const isCreateHidden = isForCreationRow ? isActionAnnotatedHidden(converterContext, "CreateHidden", false) : standardActionsContext.hiddenAnnotation.create;
    const newAction = standardActionsContext.newAction;
    //Create Button is visible:
    // 	 - If the creation mode is external
    //      - If we're on the list report and create is not hidden
    //		- Otherwise this depends on the value of the UI.IsEditable
    //	 - Otherwise
    //		- If any of the following conditions is valid then create button isn't visible
    //			- no newAction available
    //			- It's not insertable and there is not a new action
    //			- create is hidden
    //			- There are multiple visualizations
    //			- It's an Analytical List Page
    //			- Uses InlineCreationRows mode and a Responsive table type, with the parameter inlineCreationRowsHiddenInEditMode to true while not in create mode
    //          	- when calculating paste button visibility,  we force the condition to false with the isForPaste property
    //   - Otherwise
    // 	 	- If we're on the list report ->
    // 	 		- If UI.CreateHidden points to a property path -> provide a negated binding to this path
    // 	 		- Otherwise, create is visible
    // 	 	- Otherwise
    // 	  	 - This depends on the value of the UI.IsEditable
    return ifElse(standardActionsContext.creationMode === CreationMode.External, and(not(isCreateHidden), or(converterContext.getTemplateType() === TemplateType.ListReport, UI.IsEditable)), ifElse(or(and(isConstant(newAction?.available), equal(newAction?.available, false)), and(isConstant(isInsertable), equal(isInsertable, false), !newAction), and(isConstant(isCreateHidden), equal(isCreateHidden, true)), and(standardActionsContext.creationMode === CreationMode.InlineCreationRows, standardActionsContext.tableManifestConfiguration?.type === "ResponsiveTable", ifElse(and(standardActionsContext?.tableManifestConfiguration?.inlineCreationRowsHiddenInEditMode === false, not(isForPaste)), true, UI.IsCreateMode))), false, ifElse(converterContext.getTemplateType() === TemplateType.ListReport, or(not(isPathInModelExpression(isCreateHidden)), not(isCreateHidden)), and(not(isCreateHidden), UI.IsEditable))));
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'Delete' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expression for the 'visible' property of the 'Delete' action.
   */
  _exports.getCreateVisibility = getCreateVisibility;
  function getDeleteVisibility(converterContext, standardActionsContext) {
    const isDeleteHidden = standardActionsContext.hiddenAnnotation.delete;
    const pathDeletableExpression = standardActionsContext.restrictions.isDeletable.expression;

    //Delete Button is visible:
    // 	 Prerequisites:
    //	 - If we're not on ALP
    //   - If restrictions on deletable set to false -> not visible
    //   - Otherwise
    //			- If UI.DeleteHidden is true -> not visible
    //			- Otherwise
    // 	 			- If we're on OP -> depending if UI is editable and restrictions on deletable
    //				- Otherwise
    //				 	- If UI.DeleteHidden points to a property path -> provide a negated binding to this path
    //	 	 		 	- Otherwise, delete is visible

    return ifElse(converterContext.getTemplateType() === TemplateType.AnalyticalListPage, false, ifElse(and(isConstant(pathDeletableExpression), equal(pathDeletableExpression, false)), false, ifElse(and(isConstant(isDeleteHidden), equal(isDeleteHidden, constant(true))), false, ifElse(converterContext.getTemplateType() !== TemplateType.ListReport, and(not(isDeleteHidden), UI.IsEditable), not(and(isPathInModelExpression(isDeleteHidden), isDeleteHidden))))));
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'Paste' action.
   * @param converterContext
   * @param standardActionsContext
   * @param createVisibility
   * @param cutVisibility
   * @param isInsertUpdateActionsTemplated
   * @returns The binding expression for the 'visible' property of the 'Paste' action.
   */
  _exports.getDeleteVisibility = getDeleteVisibility;
  function getPasteVisibility(converterContext, standardActionsContext, createVisibility, cutVisibility, copyVisibility, isInsertUpdateActionsTemplated) {
    //If it isn't deactivated within the manifest and we're operating in OP/blocks outside Fiori elements templates,
    //the treeTable's visibility relies on the cutvisibility,
    //while the visibility of the other table is determined by insertable restrictions and create visibility.
    let updateOnNavigation = standardActionsContext.restrictions?.isUpdatable?.navigationExpression;
    if (updateOnNavigation?._type === "Unresolvable") {
      updateOnNavigation = constant(true);
    }
    return and(standardActionsContext.tableManifestConfiguration.type === "TreeTable" ? or(cutVisibility, copyVisibility) : and(or(and(createVisibility, standardActionsContext.restrictions.isInsertable.expression), and(UI.IsEditable, updateOnNavigation)), notEqual(standardActionsContext.tableManifestConfiguration.enablePaste, false), ![TemplateType.ListReport, TemplateType.AnalyticalListPage].includes(converterContext.getTemplateType())), isInsertUpdateActionsTemplated);
  }

  /**
   * Gets the binding expression for the 'visible' property of the 'MassEdit' action.
   * @param converterContext
   * @param standardActionsContext
   * @returns The binding expression for the 'visible' property of the 'MassEdit' action.
   */
  _exports.getPasteVisibility = getPasteVisibility;
  function getMassEditVisibility(converterContext, standardActionsContext) {
    const isUpdateHidden = standardActionsContext.hiddenAnnotation.update,
      pathUpdatableExpression = standardActionsContext.restrictions.isUpdatable.expression,
      massEditEnabledInManifest = standardActionsContext.tableManifestConfiguration?.massEdit.enabled || false;
    const templateBindingExpression = converterContext.getTemplateType() === TemplateType.ObjectPage ? UI.IsEditable : [TemplateType.ListReport, TemplateType.FreeStylePage].includes(converterContext.getTemplateType());
    //MassEdit is visible
    // If
    //		- there is no static restrictions set to false
    //		- and enableMassEdit is not set to false into the manifest
    //		- and the selectionMode is relevant
    //	Then MassEdit is always visible in LR or dynamically visible in OP according to ui>Editable and hiddenAnnotation
    //  Button is hidden for all other cases
    return and(not(and(isConstant(pathUpdatableExpression), equal(pathUpdatableExpression, false))), massEditEnabledInManifest, templateBindingExpression, not(isUpdateHidden));
  }

  /**
   * Gets the binding expression for the 'enabled' property of the creationRow.
   * @param converterContext
   * @param standardActionsContext
   * @param creationRowVisibility
   * @returns The binding expression for the 'enabled' property of the creationRow.
   */
  _exports.getMassEditVisibility = getMassEditVisibility;
  function getCreationRowEnablement(converterContext, standardActionsContext, creationRowVisibility) {
    const restrictionsInsertable = isPathInsertable(converterContext.getDataModelObjectPath(), {
      ignoreTargetCollection: true,
      authorizeUnresolvable: true,
      pathVisitor: (path, navigationPaths) => {
        if (path.indexOf("/") === 0) {
          path = singletonPathVisitor(path, converterContext.getConvertedTypes(), navigationPaths);
          return path;
        }
        const navigationProperties = converterContext.getDataModelObjectPath().navigationProperties;
        if (navigationProperties) {
          const lastNav = navigationProperties[navigationProperties.length - 1];
          const partner = isNavigationProperty(lastNav) && lastNav.partner;
          if (partner) {
            path = `${partner}/${path}`;
          }
        }
        return path;
      }
    });
    const isInsertable = restrictionsInsertable._type === "Unresolvable" ? isPathInsertable(converterContext.getDataModelObjectPath(), {
      pathVisitor: path => singletonPathVisitor(path, converterContext.getConvertedTypes(), [])
    }) : restrictionsInsertable;
    return and(creationRowVisibility, isInsertable, or(!standardActionsContext.tableManifestConfiguration.disableAddRowButtonForEmptyData, formatResult([pathInModel("creationRowFieldValidity", "internal")], tableFormatters.validateCreationRowFields)));
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Create' action.
   * @param converterContext
   * @param standardActionsContext
   * @param createVisibility
   * @param forContextMenu
   * @returns The binding expression for the 'enabled' property of the 'Create' action.
   */
  _exports.getCreationRowEnablement = getCreationRowEnablement;
  function getCreateEnablement(converterContext, standardActionsContext, createVisibility) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const conditions = [];
    const contextPath = !forContextMenu ? "" : "contextmenu/";
    if (standardActionsContext.creationMode === CreationMode.InlineCreationRows) {
      // for Inline creation rows create can be hidden via manifest and this should not impact its enablement
      conditions.push(and(not(standardActionsContext.hiddenAnnotation.create), UI.IsEditable));
    } else {
      conditions.push(createVisibility);
    }
    const isInsertable = standardActionsContext.restrictions.isInsertable.expression;
    const CollectionType = converterContext.resolveAbsolutePath(standardActionsContext.collectionPath).target;
    conditions.push(or(isEntitySet(CollectionType), and(isInsertable, or(converterContext.getTemplateType() !== TemplateType.ObjectPage, UI.IsEditable))));
    if (standardActionsContext.tableManifestConfiguration.type === "TreeTable") {
      // In case of a TreeTable, the create button shall be active only if 0 or 1 items are selected (parent node)
      // We do not need this condition on the ContextMenu, as we only create on the selected node
      conditions.push(lessOrEqual(pathInModel(contextPath + "numberOfSelectedContexts", "internal"), 1));
      if (standardActionsContext.tableManifestConfiguration.createEnablement) {
        // There's a createEnablement callback function for additionnal conditions
        // These conditions will be reflected in the internal model
        conditions.push(notEqual(pathInModel(contextPath + "createEnablement/Create", "internal"), false));
      }
    }
    return and(...conditions);
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Delete' action.
   * @param converterContext
   * @param standardActionsContext
   * @param deleteVisibility
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @returns The binding expression for the 'enabled' property of the 'Delete' action.
   */
  _exports.getCreateEnablement = getCreateEnablement;
  function getDeleteEnablement(converterContext, standardActionsContext, deleteVisibility) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    // The following contexts are filled at runtime when a user selects one or more items from a list.
    // Checks are then made in function updateDeleteInfoForSelectedContexts in file DeleteHelper to see if there
    // are items that can be deleted, thus the delete button should be enabled in these cases.
    const contextPath = !forContextMenu ? "" : "contextmenu/";
    const deletableContexts = pathInModel(contextPath + "deletableContexts", "internal");
    const unSavedContexts = pathInModel(contextPath + "unSavedContexts", "internal");
    const draftsWithDeletableActive = pathInModel(contextPath + "draftsWithDeletableActive", "internal");
    const draftsWithNonDeletableActive = pathInModel(contextPath + "draftsWithNonDeletableActive", "internal");

    // "Unresolvable" in navigationExpression is interpreted to mean that there are no navigationExpressions
    // defined.
    // standardActionsContext.restrictions.isDeletable.expression is a binding expression that comes
    // from the Delete restrictions defined in NavigationRestrictions for this entity. In order to
    // be deletable, the item must also be allowed to be deletable according to the Delete Restrictions
    // on the entity itself.
    return and(deleteVisibility, or(standardActionsContext.restrictions.isDeletable.navigationExpression._type === "Unresolvable", standardActionsContext.restrictions.isDeletable.expression), or(greaterThan(length(deletableContexts, true), 0), greaterThan(length(draftsWithDeletableActive, true), 0), greaterThan(length(draftsWithNonDeletableActive, true), 0), greaterThan(length(unSavedContexts, true), 0)));
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Paste' action.
   * @param pasteVisibility
   * @param standardActionsContext
   * @param forContextMenu
   * @returns The binding expression for the 'enabled' property of the 'Paste' action.
   */
  _exports.getDeleteEnablement = getDeleteEnablement;
  function getPasteEnablement(pasteVisibility, standardActionsContext, forContextMenu) {
    const selectedContextsPath = !forContextMenu ? "selectedContexts" : "contextmenu/selectedContexts";
    const pasteEnablementPath = !forContextMenu ? "nodeUpdatesInfo/pasteEnablement" : "contextmenu/nodeUpdatesInfo/pasteEnablement";
    if (standardActionsContext.tableManifestConfiguration.type === "TreeTable") {
      return and(pasteVisibility, or(standardActionsContext.restrictions.isUpdatable.navigationExpression._type === "Unresolvable", standardActionsContext.restrictions.isUpdatable.expression), ifElse(lessOrEqual(length(pathInModel(selectedContextsPath, "internal")), 1), equal(pathInModel(pasteEnablementPath, "internal"), true), false));
    }
    let updateOnNavigation = standardActionsContext.restrictions?.isUpdatable?.navigationExpression;
    if (updateOnNavigation?._type === "Unresolvable") {
      updateOnNavigation = constant(true);
    }
    return and(updateOnNavigation, pasteVisibility);
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'MassEdit' action.
   * @param converterContext
   * @param standardActionsContext
   * @param massEditVisibility
   * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
   * @returns The binding expression for the 'enabled' property of the 'MassEdit' action.
   */
  _exports.getPasteEnablement = getPasteEnablement;
  function getMassEditEnablement(converterContext, standardActionsContext, massEditVisibility) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const pathUpdatableExpression = standardActionsContext.restrictions.isUpdatable.expression;
    const isOnlyDynamicOnCurrentEntity = !isConstant(pathUpdatableExpression) && standardActionsContext.restrictions.isUpdatable.navigationExpression._type === "Unresolvable";
    const numberOfSelectedContextProperty = !forContextMenu ? "numberOfSelectedContexts" : "contextmenu/numberOfSelectedContexts";
    const updatableContextProperty = !forContextMenu ? "updatableContexts" : "contextmenu/updatableContexts";
    const numberOfSelectedContexts = greaterOrEqual(pathInModel(numberOfSelectedContextProperty, "internal"), 1);
    const numberOfUpdatableContexts = greaterOrEqual(length(pathInModel(updatableContextProperty, "internal")), 1);
    const bIsDraftSupported = ModelHelper.isObjectPathDraftSupported(converterContext.getDataModelObjectPath());
    const bDisplayMode = isInDisplayMode(converterContext);

    // numberOfUpdatableContexts needs to be added to the binding in case
    // 1. Update is dependent on current entity property (isOnlyDynamicOnCurrentEntity is true).
    // 2. The table is read only and draft enabled(like LR), in this case only active contexts can be mass edited.
    //    So, update depends on 'IsActiveEntity' value which needs to be checked runtime.
    const runtimeBinding = ifElse(or(and(bDisplayMode, bIsDraftSupported), isOnlyDynamicOnCurrentEntity), and(numberOfSelectedContexts, numberOfUpdatableContexts), and(numberOfSelectedContexts));
    return and(massEditVisibility, ifElse(isOnlyDynamicOnCurrentEntity, runtimeBinding, and(runtimeBinding, pathUpdatableExpression)));
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Cut' action.
   * @param cutVisibility
   * @param standardActionsContext
   * @param forContextMenu
   * @returns The binding expression for the 'enabled' property of the 'MassEdit' action.
   */
  _exports.getMassEditEnablement = getMassEditEnablement;
  function getCutEnablement(cutVisibility, standardActionsContext, forContextMenu) {
    const cutableContextsPath = !forContextMenu ? "nodeUpdatesInfo/cutEnablement" : "contextmenu/nodeUpdatesInfo/cutEnablement";
    const runtimeBinding = pathInModel(cutableContextsPath, "internal");
    return and(cutVisibility, or(standardActionsContext.restrictions.isUpdatable.navigationExpression._type === "Unresolvable", standardActionsContext.restrictions.isUpdatable.expression), runtimeBinding);
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Copy' action.
   * @param copyVisibility
   * @param forContextMenu
   * @returns The binding expression for the 'enabled' property of the 'Copy' action.
   */
  _exports.getCutEnablement = getCutEnablement;
  function getCopyEnablement(copyVisibility, forContextMenu) {
    const copyableContextsPath = !forContextMenu ? "nodeUpdatesInfo/copyEnablement" : "contextmenu/nodeUpdatesInfo/copyEnablement";
    const runtimeBinding = pathInModel(copyableContextsPath, "internal");
    return and(copyVisibility, runtimeBinding);
  }

  /**
   * Gets the binding expression for the 'enabled' property of the 'Move up' and 'Move down' actions.
   * @param moveUpDownVisibility
   * @param standardActionsContext
   * @param forUp
   * @param forContextMenu
   * @returns The binding expression
   */
  _exports.getCopyEnablement = getCopyEnablement;
  function getMoveUpDownEnablement(moveUpDownVisibility, standardActionsContext, forUp) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    const singleContextMovableUp = !forContextMenu ? "singleContextMovableUp" : "contextmenu/singleContextMovableUp";
    const singleContextMovableDown = !forContextMenu ? "singleContextMovableDown" : "contextmenu/singleContextMovableDown";
    const runtimeBinding = forUp ? equal(pathInModel(singleContextMovableUp, "internal"), true) : equal(pathInModel(singleContextMovableDown, "internal"), true);
    return and(moveUpDownVisibility, or(standardActionsContext.restrictions.isUpdatable.navigationExpression._type === "Unresolvable", standardActionsContext.restrictions.isUpdatable.expression), runtimeBinding);
  }

  /**
   * Tells if the table in template is in display mode.
   * @param converterContext
   * @param checkMultipleVisualization
   * @returns `true` if the table is in display mode
   */
  function isInDisplayMode(converterContext) {
    let checkMultipleVisualization = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (converterContext.getManifestWrapper().hasInlineEdit()) {
      //if there is inline edit in the page we cannot force the table to display based on the template type
      return false;
    }
    const templateType = converterContext.getTemplateType();
    if (templateType === TemplateType.ListReport || templateType === TemplateType.AnalyticalListPage || checkMultipleVisualization && converterContext.getManifestWrapper().hasMultipleVisualizations()) {
      return true;
    }
    // updatable will be handled at the property level
    return false;
  }
  _exports.isInDisplayMode = isInDisplayMode;
  return _exports;
}, false);
//# sourceMappingURL=StandardActions-dbg.js.map
