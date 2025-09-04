/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/ManifestSettings", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/ID", "sap/fe/core/formatters/FPMFormatter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/UIFormatters"], function (Log, BindingToolkit, ManifestSettings, ConfigurableObject, ID, fpmFormatter, BindingHelper, ModelHelper, StableIdHelper, UIFormatters) {
  "use strict";

  var _exports = {};
  var getActionEnabledExpression = UIFormatters.getActionEnabledExpression;
  var replaceSpecialChars = StableIdHelper.replaceSpecialChars;
  var UI = BindingHelper.UI;
  var getCustomActionID = ID.getCustomActionID;
  var Placement = ConfigurableObject.Placement;
  var ActionType = ManifestSettings.ActionType;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var greaterOrEqual = BindingToolkit.greaterOrEqual;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  let ButtonType = /*#__PURE__*/function (ButtonType) {
    ButtonType["Accept"] = "Accept";
    ButtonType["Attention"] = "Attention";
    ButtonType["Back"] = "Back";
    ButtonType["Critical"] = "Critical";
    ButtonType["Default"] = "Default";
    ButtonType["Emphasized"] = "Emphasized";
    ButtonType["Ghost"] = "Ghost";
    ButtonType["Negative"] = "Negative";
    ButtonType["Neutral"] = "Neutral";
    ButtonType["Reject"] = "Reject";
    ButtonType["Success"] = "Success";
    ButtonType["Transparent"] = "Transparent";
    ButtonType["Unstyled"] = "Unstyled";
    ButtonType["Up"] = "Up";
    return ButtonType;
  }({});
  _exports.ButtonType = ButtonType;
  const aiIcon = "sap-icon://ai";
  _exports.aiIcon = aiIcon;
  /**
   * Method provides actions collection after calculating the visible setting for all actions of type menu depending on its visible setting and its menu items visible settings.
   * @param actions Collection of actions
   * @returns Collection of actions with visible setting set for actions of type menu
   */
  const getVisibilityEnablementMenuActions = actions => {
    let menuActionNotVisible, menuActionVisiblePaths, atleastOneMenuItemsVisible, menuItemsVisiblePaths;
    actions.forEach(menuAction => {
      menuActionNotVisible = menuAction.visible?.valueOf() === "false";
      atleastOneMenuItemsVisible = false;
      menuItemsVisiblePaths = [];
      menuActionVisiblePaths = [];
      if (menuAction.visible && !(menuAction.visible.valueOf() === "true" || menuAction.visible.valueOf() === "false")) {
        menuActionVisiblePaths.push(menuAction.visible);
      }
      if (menuAction?.menu?.length) {
        menuAction?.menu?.forEach(menuItem => {
          const menuItemVisible = menuItem.visible;
          if (menuItemVisible && (typeof menuItemVisible === "boolean" || menuItemVisible.valueOf() === "true")) {
            atleastOneMenuItemsVisible = true;
          } else if (menuItemVisible && menuItemVisible.valueOf() !== "false") {
            menuItemsVisiblePaths.push(menuItemVisible.valueOf());
          }
        });
        if (menuActionNotVisible) {
          // if menu is statically visible false
          menuAction.visible = false.toString();
        } else if (!atleastOneMenuItemsVisible && !menuItemsVisiblePaths.length) {
          // if all menu items are statically visible false
          menuAction.visible = false.toString();
        } else if (atleastOneMenuItemsVisible && !menuActionVisiblePaths.length) {
          // if at least one menu item is statically visible true and no visible setting for menu
          menuAction.visible = true.toString();
        } else if (menuActionVisiblePaths.length || menuItemsVisiblePaths.length) {
          // If the menu is set to invisible, it should be invisible, otherwise the visibility should be calculated from the items
          const visibleExpressions = menuItemsVisiblePaths.map(menuItemVisiblePath => resolveBindingString(menuItemVisiblePath, "boolean"));
          menuAction.visible = compileExpression(and(resolveBindingString(menuAction.visible || true, "boolean"), or(...visibleExpressions)));
        } else {
          menuAction.visible = (!menuActionNotVisible).toString();
        }
      }
    });
    return actions;
  };

  /**
   * Adds the collaboration condition to all actions with type ForAction.
   * This disables the actions if the collaboration is enabled, but the user doesn't have the authorization from the back end.
   * @param actions The list of definitions of the table actions.
   */
  _exports.getVisibilityEnablementMenuActions = getVisibilityEnablementMenuActions;
  function addCollaborationCondition(actions) {
    actions.forEach(action => {
      if (action.visible?.valueOf() === "false") {
        return;
      }
      if (action.type === "ForAction") {
        action.visible = compileExpression(and(resolveBindingString(action.visible, "boolean"), not(equal(UI.hasCollaborationAuthorization, false))));
      }
    });
  }

  /**
   * Maps an action by its key, based on the given annotation actions and manifest configuration. The result already represents the
   * merged action from both configuration sources.
   *
   * This function also returns an indication whether the action can be a menu item, saying whether it is visible or of a specific type
   * that allows this.
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param actionKey Action Key to look up
   * @returns Merged action and indicator whether it can be a menu item
   */
  _exports.addCollaborationCondition = addCollaborationCondition;
  function mapActionByKey(manifestActions, annotationActions, actionKey) {
    const annotationAction = annotationActions.find(action => action.key === actionKey);
    const manifestAction = manifestActions[actionKey];
    let resultAction = {
      ...(annotationAction ?? manifestAction)
    };

    // actions inside menus can't be found on top level, so assign actions from menu to it
    if (Object.keys(resultAction).length === 0) {
      annotationActions.filter(actionAnnotation => {
        return actionAnnotation.type === ActionType.Menu;
      }).forEach(menuAction => {
        menuAction.menu?.forEach(menuItem => {
          if (menuItem.key === actionKey) {
            resultAction = menuItem;
          }
        });
      });
    }

    // Annotation action and manifest configuration already has to be merged here as insertCustomElements only considers top-level actions
    if (annotationAction) {
      // If enabled or visible is not set in the manifest, use the annotation value and hence do not overwrite
      resultAction.enabled = manifestAction?.enabled ?? annotationAction.enabled;
      resultAction.visible = manifestAction?.visible ?? annotationAction.visible;
      for (const prop in manifestAction || {}) {
        const propKey = prop;
        if (!annotationAction[propKey] && propKey !== "menu") {
          resultAction[propKey] = manifestAction[propKey];
        }
      }
    }
    const canBeMenuItem = resultAction?.visible || resultAction?.type === ActionType.DataFieldForAction || resultAction?.type === ActionType.DataFieldForIntentBasedNavigation;
    return {
      action: resultAction,
      canBeMenuItem
    };
  }

  /**
   * Map the default action key of a menu to its actual action configuration and identify whether this default action is a command.
   * @param menuAction Menu action to map the default action for
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param commandActions Array of command actions to push the default action to if applicable
   */
  function mapMenuDefaultAction(menuAction, manifestActions, annotationActions, commandActions) {
    const {
      action,
      canBeMenuItem
    } = mapActionByKey(manifestActions, annotationActions, menuAction.defaultAction);
    if (canBeMenuItem) {
      menuAction.defaultAction = action;
    }
    if (action.command) {
      commandActions[action.key] = action;
    }
  }

  /**
   * Map the menu item keys of a menu to their actual action configurations and identify whether they are commands.
   * @param menuAction Menu action to map the menu items for
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @param commandActions Array of command actions to push the menu item actions to if applicable
   */
  function mapMenuItems(menuAction, manifestActions, annotationActions, commandActions) {
    const mappedMenuItems = [];
    const matchingAnnotationAction = annotationActions.find(annotationAction => annotationAction.key === menuAction.key);
    if (menuAction.menu?.length !== 0) {
      for (const menuItemKey of menuAction.menu ?? []) {
        const {
          action,
          canBeMenuItem
        } = mapActionByKey(manifestActions, annotationActions, menuItemKey);
        if (canBeMenuItem) {
          mappedMenuItems.push(action);
        }
        if (action.command) {
          commandActions[menuItemKey] = action;
        }
      }
    }

    // If no menu items are assigned to the manifest-override-menu, it inherits the items from the previous menu
    else if (matchingAnnotationAction) {
      matchingAnnotationAction.menu?.forEach(menuItem => mappedMenuItems.push(menuItem));
    }
    const mappedMenuAction = menuAction;
    mappedMenuAction.menu = mappedMenuItems;

    // If the menu is set to invisible, it should be invisible, otherwise the visibility should be calculated from the items
    const visibleExpressions = mappedMenuItems.map(menuItem => resolveBindingString(menuItem.visible, "boolean"));
    mappedMenuAction.visible = compileExpression(and(resolveBindingString(menuAction.visible, "boolean"), or(...visibleExpressions)));
  }

  /**
   * Transforms the flat collection of actions into a nested structures of menus. The result is a record of actions that are either menus or
   * ones that do not appear in menus as menu items. It also returns a list of actions that have an assigned command.
   *
   * Note that menu items are already the merged result of annotation actions and their manifest configuration, as {@link insertCustomElements}
   * only considers root-level actions.
   * @param manifestActions Actions defined in the manifest
   * @param annotationActions Actions defined through annotations
   * @returns The transformed actions from the manifest and a list of command actions
   */
  function transformMenuActionsAndIdentifyCommands(manifestActions, annotationActions) {
    const allActions = {};
    const actionKeysToDelete = [];
    const commandActions = {};
    for (const actionKey in manifestActions) {
      const manifestAction = manifestActions[actionKey];
      if (manifestAction.defaultAction !== undefined) {
        mapMenuDefaultAction(manifestAction, manifestActions, annotationActions, commandActions);
      }
      if (manifestAction.type === ActionType.Menu) {
        mapMenuItems(manifestAction, manifestActions, annotationActions, commandActions);

        // Menu has no visible items, so remove it
        if (!manifestAction.menu?.length) {
          actionKeysToDelete.push(manifestAction.key);
        }
      }
      if (manifestAction.command) {
        commandActions[actionKey] = manifestAction;
      }
      allActions[actionKey] = manifestAction;
    }
    actionKeysToDelete.forEach(actionKey => delete allActions[actionKey]);
    return {
      actions: allActions,
      commandActions: commandActions
    };
  }

  /**
   * Gets the binding expression for the enablement of a manifest action.
   * @param manifestAction The action configured in the manifest
   * @param isAnnotationAction Whether the action, defined in manifest, corresponds to an existing annotation action.
   * @param converterContext
   * @param forContextMenu
   * @returns Determined property value for the enablement
   */
  const _getManifestEnabled = function (manifestAction, isAnnotationAction, converterContext) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (isAnnotationAction && manifestAction.enabled === undefined) {
      // If annotation action has no property defined in manifest,
      // do not overwrite it with manifest action's default value.
      return undefined;
    }
    const result = getManifestActionBooleanPropertyWithFormatter(manifestAction.enabled, converterContext);

    // Consider requiresSelection property to include selectedContexts in the binding expression
    const internalModelProperty = !forContextMenu ? "numberOfSelectedContexts" : "contextmenu/numberOfSelectedContexts";
    return compileExpression(ifElse(manifestAction.requiresSelection === true, ifElse(manifestAction.enableOnSelect === "single", and(equal(pathInModel(internalModelProperty, "internal"), 1), result), and(greaterOrEqual(pathInModel(internalModelProperty, "internal"), 1), result)), result));
  };

  /**
   * Gets the binding expression for the visibility of a manifest action.
   * @param manifestAction The action configured in the manifest
   * @param isAnnotationAction Whether the action, defined in the manifest, corresponds to an existing annotation action.
   * @param converterContext
   * @param forContextMenu
   * @returns Determined property value for the visibility
   */
  const _getManifestVisible = function (manifestAction, isAnnotationAction, converterContext) {
    let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    if (isAnnotationAction && manifestAction.visible === undefined) {
      // If annotation action has no property defined in manifest,
      // do not overwrite it with manifest action's default value.
      return undefined;
    }
    let result = getManifestActionBooleanPropertyWithFormatter(manifestAction.visible, converterContext);
    // For the context menu, the visibility should also consider the 'inactiveContext' property:
    // only when at least one selected context is active (i.e. "contextmenu/inactiveContext" is false), the action should be visible in the context menu
    // This is only relevant when the table manifest setting "creationMode" is "InlineCreationRows"
    result = forContextMenu ? and(result, equal(pathInModel("contextmenu/inactiveContext", "internal"), false)) : result;
    return compileExpression(result);
  };
  /**
   * As some properties should not be overridable by the manifest, make sure that the manifest configuration gets the annotation values for these.
   * @param manifestAction Action defined in the manifest
   * @param annotationAction Action defined through annotations
   */
  function overrideManifestConfigurationWithAnnotation(manifestAction, annotationAction) {
    if (!annotationAction) {
      return;
    }

    // Do not override the 'type' given in an annotation action
    manifestAction.type = annotationAction.type;
    manifestAction.annotationPath = annotationAction.annotationPath;
    manifestAction.press = annotationAction.press;

    // Only use the annotation values for enablement and visibility if not set in the manifest
    manifestAction.enabled = manifestAction.enabled ?? annotationAction.enabled;
    manifestAction.visible = manifestAction.visible ?? annotationAction.visible;
    manifestAction.visibleForContextMenu = manifestAction.visibleForContextMenu ?? annotationAction.visibleForContextMenu;
  }

  /**
   * Creates the action configuration based on the manifest settings.
   * @param manifestActions The manifest actions
   * @param converterContext The converter context
   * @param annotationActions The annotation actions definition
   * @param navigationSettings The navigation settings
   * @param considerNavigationSettings The navigation settings to be considered
   * @param hiddenActions Actions that are configured as hidden (additional to the visible property)
   * @param facetName The facet where an action is displayed if it is inline
   * @returns The actions from the manifest
   */
  function getActionsFromManifest(manifestActions, converterContext, annotationActions, navigationSettings, considerNavigationSettings, hiddenActions, facetName) {
    const actions = {};
    for (const actionKey in manifestActions) {
      const manifestAction = manifestActions[actionKey];
      const lastDotIndex = manifestAction.press?.lastIndexOf(".") || -1;
      let annotationAction;
      if (annotationActions) {
        for (const action of annotationActions) {
          // SubSection.ts#createFormActionReducer uses insertCustomElements which results in annotation actions mixing up with manifest action
          // this is why we may find an action that has a CustomAction prefix
          if (action.id?.startsWith("CustomAction::")) {
            continue;
          }
          if (action.key === actionKey) {
            annotationAction = action;
            break;
          } else if (action.type === "Menu") {
            // If not found, check inside menus
            annotationAction = action.menu?.find(menuItem => {
              return menuItem.key === actionKey;
            });
            if (annotationAction) {
              break;
            }
          }
        }
      }

      // To identify the annotation action property overwrite via manifest use-case.
      const isAnnotationAction = !!annotationAction;
      if (manifestAction.facetName) {
        facetName = manifestAction.facetName;
      }
      actions[actionKey] = {
        id: annotationAction ? actionKey : getCustomActionID(actionKey),
        type: manifestAction.menu ? ActionType.Menu : ActionType.Default,
        visible: _getManifestVisible(manifestAction, isAnnotationAction, converterContext),
        visibleForContextMenu: _getManifestVisible(manifestAction, isAnnotationAction, converterContext, true),
        enabled: _getManifestEnabled(manifestAction, isAnnotationAction, converterContext),
        enabledForContextMenu: _getManifestEnabled(manifestAction, isAnnotationAction, converterContext, true),
        handlerModule: manifestAction.press && manifestAction.press.substring(0, lastDotIndex).replace(/\./gi, "/"),
        handlerMethod: manifestAction.press && manifestAction.press.substring(lastDotIndex + 1),
        press: manifestAction.press,
        text: manifestAction.text,
        noWrap: manifestAction.__noWrap,
        key: replaceSpecialChars(actionKey),
        enableOnSelect: manifestAction.enableOnSelect,
        defaultValuesExtensionFunction: manifestAction.defaultValuesFunction,
        position: {
          anchor: manifestAction.position?.anchor,
          placement: manifestAction.position === undefined ? Placement.After : manifestAction.position.placement
        },
        isNavigable: isActionNavigable(manifestAction, navigationSettings, considerNavigationSettings),
        command: manifestAction.command,
        requiresSelection: manifestAction.requiresSelection === undefined ? false : manifestAction.requiresSelection,
        enableAutoScroll: enableAutoScroll(manifestAction),
        menu: manifestAction.menu ?? (annotationAction?.type === ActionType.Menu ? [] : undefined),
        facetName: manifestAction.inline ? facetName : undefined,
        defaultAction: manifestAction.defaultAction,
        isAIOperation: manifestAction?.isAIOperation ?? undefined
      };
      overrideManifestConfigurationWithAnnotation(actions[actionKey], annotationAction);
    }
    return transformMenuActionsAndIdentifyCommands(actions, annotationActions ?? []);
  }

  /**
   * Gets a binding expression representing a Boolean manifest property that can either be represented by a static value, a binding string,
   * or a runtime formatter function.
   * @param propertyValue String representing the configured property value
   * @param converterContext
   * @returns A binding expression representing the property
   */
  _exports.getActionsFromManifest = getActionsFromManifest;
  function getManifestActionBooleanPropertyWithFormatter(propertyValue, converterContext) {
    const resolvedBinding = resolveBindingString(propertyValue, "boolean");
    let result;
    if (isConstant(resolvedBinding) && resolvedBinding.value === undefined) {
      // No property value configured in manifest for the custom action --> default value is true
      result = constant(true);
    } else if (isConstant(resolvedBinding) && typeof resolvedBinding.value === "string") {
      // Then it's a module-method reference "sap.xxx.yyy.doSomething"
      const methodPath = resolvedBinding.value;
      // FIXME: The custom "isEnabled" check does not trigger (because none of the bound values changes)
      result = formatResult([pathInModel("/", "$view"), methodPath, pathInModel("selectedContexts", "internal")], fpmFormatter.customBooleanPropertyCheck, converterContext.getDataModelObjectPath().contextLocation?.targetEntityType || converterContext.getEntityType());
    } else {
      // then it's a binding
      result = resolvedBinding;
    }
    return result;
  }
  const removeDuplicateActions = actions => {
    let oMenuItemKeys = {};
    actions.forEach(action => {
      if (action?.menu?.length) {
        const actionMenu = action.menu;
        oMenuItemKeys = actionMenu.reduce((item, _ref) => {
          let {
            key
          } = _ref;
          if (key && !item[key]) {
            item[key] = true;
          }
          return item;
        }, oMenuItemKeys);
      }
    });
    return actions.filter(action => !oMenuItemKeys[action.key]);
  };

  /**
   * Method to determine the value of the 'enabled' property of an annotation-based action.
   * @param converterContext The instance of the converter context
   * @param actionTarget The instance of the action
   * @param pathFromContextLocation Is the binding path calculated  from the converter context location
   * @returns The binding expression for the 'enabled' property of the action button.
   */
  _exports.removeDuplicateActions = removeDuplicateActions;
  function getEnabledForAnnotationAction(converterContext, actionTarget) {
    let pathFromContextLocation = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (actionTarget?.annotations.Core?.OperationAvailable) {
      const dataModelObjectPath = converterContext.getDataModelObjectPath();
      let isEnabledExp = getActionEnabledExpression(actionTarget, converterContext.getConvertedTypes(), dataModelObjectPath, pathFromContextLocation);
      const collaborationOnRoot = ModelHelper.isCollaborationDraftSupportedFromConverterContext(converterContext) && ModelHelper.getDraftRoot(converterContext.getEntitySet());
      if (collaborationOnRoot) {
        isEnabledExp = and(isEnabledExp, UI.hasCollaborationAuthorization);
      }
      return compileExpression(isEnabledExp);
    }
    return "true";
  }
  _exports.getEnabledForAnnotationAction = getEnabledForAnnotationAction;
  function getSemanticObjectMapping(mappings) {
    return mappings ? mappings.map(mapping => {
      return {
        LocalProperty: {
          $PropertyPath: mapping.LocalProperty.value
        },
        SemanticObjectProperty: mapping.SemanticObjectProperty.toString()
      };
    }) : [];
  }
  _exports.getSemanticObjectMapping = getSemanticObjectMapping;
  function isActionNavigable(action, navigationSettings, considerNavigationSettings) {
    let bIsNavigationConfigured = true;
    if (considerNavigationSettings) {
      const detailOrDisplay = navigationSettings && (navigationSettings.detail || navigationSettings.display);
      bIsNavigationConfigured = detailOrDisplay?.route ? true : false;
    }
    // when enableAutoScroll is true the navigateToInstance feature is disabled
    if (action && action.afterExecution && (action.afterExecution?.navigateToInstance === false || action.afterExecution?.enableAutoScroll === true) || !bIsNavigationConfigured) {
      return false;
    }
    return true;
  }
  _exports.isActionNavigable = isActionNavigable;
  function enableAutoScroll(action) {
    return action?.afterExecution?.enableAutoScroll === true;
  }
  _exports.enableAutoScroll = enableAutoScroll;
  function dataFieldIsCopyAction(dataField) {
    return dataField.annotations?.UI?.IsCopyAction?.valueOf() === true && dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction";
  }
  _exports.dataFieldIsCopyAction = dataFieldIsCopyAction;
  function getCopyAction(copyDataFields) {
    if (copyDataFields.length === 1) {
      return copyDataFields[0];
    }
    if (copyDataFields.length > 1) {
      Log.error("Multiple actions are annotated with isCopyAction. There can be only one standard copy action.");
    }
    return undefined;
  }

  /**
   * Method to extract menu items from actions of type menus.
   * @param annotationActions Collection of annotation based actions
   * @returns Collection of actions which are menu items in one of the annotation based menus
   */
  _exports.getCopyAction = getCopyAction;
  function getAnnotationMenuActionItems(annotationActions) {
    const menuActionItems = [];
    annotationActions.forEach(action => {
      if (action.type === "Menu" && !action.id?.startsWith("CustomAction::") && action.menu) {
        menuActionItems.push(...action.menu);
      }
    });
    return menuActionItems;
  }

  /**
   * Method to find the matching manifest actions which override the annotation menu items.
   * @param annotationMenuItems Collection of annotation based menu items
   * @param manifestActions Collection of manifest based actions
   * @returns Collection of actions which are menu items in one of the annotation based menus
   */
  _exports.getAnnotationMenuActionItems = getAnnotationMenuActionItems;
  function getMatchingManifestAction(annotationMenuItems, manifestActions) {
    const matchingManifestActions = {};
    for (const manifestAction in manifestActions) {
      if (manifestAction.startsWith("DataFieldForAction::") && annotationMenuItems.find(menuActionItems => {
        return menuActionItems.key === manifestAction;
      })) {
        matchingManifestActions[manifestAction] = manifestActions[manifestAction];
      }
    }
    return matchingManifestActions;
  }

  /**
   * Method to transform the menus by replacing the menu items with their overriding actions.
   * @param unpreparedActions Collection of all actions after merging manifest and annotation actions
   * @param overrideMenuActions Collection of all overriden menu items
   */
  _exports.getMatchingManifestAction = getMatchingManifestAction;
  function prepareMenuActions(unpreparedActions, overrideMenuActions) {
    let foundAction;
    unpreparedActions.forEach(action => {
      if (action.type === ActionType.Menu) {
        action.menu?.forEach((menuItem, menuItemIndex) => {
          foundAction = overrideMenuActions.find(overrideMenuAction => {
            return overrideMenuAction.key === menuItem.key;
          });
          if (foundAction) {
            action.menu?.splice(menuItemIndex, 1, foundAction);
          }
        });
      }
    });
  }

  /**
   * Method to determine if the menu consists of all AI operation actions.
   * @param annotationActions Collection of DataFieldForActions or DataFieldForIntentBasedNavigations in the menu
   * @returns A boolean true if all records in the menu are AI operations, false otherwise
   */
  _exports.prepareMenuActions = prepareMenuActions;
  function isMenuAIOperation(annotationActions) {
    return annotationActions.every(isActionAIOperation);
  }

  /**
   * Method to determine if the given record is an AI operation.
   * @param dataField The record of type DataFieldForAction or DataFieldForIntentBasedNavigation
   * @returns A boolean true if the given record is an AI operation, false otherwise
   */
  _exports.isMenuAIOperation = isMenuAIOperation;
  function isActionAIOperation(dataField) {
    if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
      return dataField.ActionTarget?.annotations.UI?.IsAIOperation?.valueOf() === true;
    }
    return false;
  }
  _exports.isActionAIOperation = isActionAIOperation;
  return _exports;
}, false);
//# sourceMappingURL=Action-dbg.js.map
