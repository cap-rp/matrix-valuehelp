/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/m/MenuItem", "sap/ui/fl/util/ManagedObjectModel", "sap/ui/performance/trace/FESRHelper", "../TableRuntime"], function (ActionRuntime, CommonUtils, deleteHelper, ModelHelper, StableIdHelper, MenuItem, ManagedObjectModel, FESRHelper, TableRuntime) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  let ContextMenuHandler = /*#__PURE__*/function () {
    function ContextMenuHandler() {
      this.contextMenuActive = false;
    }
    _exports = ContextMenuHandler;
    var _proto = ContextMenuHandler.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    }

    /**
     * Align context menu with the table actions by RTA changes in table toolbar.
     * @param table The table with bound table actions
     */;
    _proto.alignContextMenuWithTableToolbarChanges = function alignContextMenuWithTableToolbarChanges(table) {
      const contextMenu = table.getContextMenu();
      const sortHelperForMenuItems = [];
      const tableActions = table.getActions();
      tableActions?.forEach(tableAction => {
        const tableActionItem = tableAction.getAggregation("action");
        // Check if the action item has been split by RTA
        if (this._isActionSplit(tableActionItem)) {
          // Remove original menu item and add sub items as new menu items
          this._splitActionsInContextMenu(tableActionItem, contextMenu);
        }
        // Check if the action item has been created by combining the two actions
        if (this._isActionCombined(tableActionItem)) {
          this._combineActionInContextMenu(tableActionItem, contextMenu, table);
        }
        const contextMenuItem = this._getCorrespondingContextMenuAction(tableActionItem, contextMenu);
        if (contextMenuItem) {
          this._alignTextAndVisiblityInContextMenu(tableActionItem, contextMenuItem, tableAction);
          sortHelperForMenuItems.push(contextMenuItem);
        }
      });
      // Align the order of context-menuItems with bound table actions
      if (sortHelperForMenuItems.length) {
        sortHelperForMenuItems.forEach((menuItem, sortIndex) => {
          const indexOfContextMenu = contextMenu.indexOfItem(menuItem);
          if (indexOfContextMenu !== sortIndex) {
            contextMenu.removeItem(menuItem);
            contextMenu.insertItem(menuItem, sortIndex);
          }
        });
      }
    }

    /**
     * Check if the action item has been created by a Combine RTA changes in the table toolbar.
     * @param actionItem The action to check
     * @returns True if the action item has been created by a Combine RTA changes in the table toolbar
     */;
    _proto._isActionCombined = function _isActionCombined(actionItem) {
      if (actionItem.getMetadata().getName() === "sap.m.MenuButton") {
        // We don't have custom data attribute on the MenuButton created by RTA combine change
        const dependents = actionItem.getDependents();
        // find all the dependents which are a Flex ManagedObjectModel
        const flexManagedObjectModels = dependents.filter(dependent => dependent instanceof ManagedObjectModel);
        // check if the name of one of them includes "$sap.m.flexibility.MenuButtonModel"
        return flexManagedObjectModels.some(model => model.getName().includes("$sap.m.flexibility.MenuButtonModel"));
      }
      return false;
    }

    /**
     * Combine the actions in the context menu to align with the table action toolbar.
     * @param actionItem The action item to split
     * @param contextMenu The context menu
     * @param table The MDCTable
     */;
    _proto._combineActionInContextMenu = function _combineActionInContextMenu(actionItem, contextMenu, table) {
      const contextMenuItems = contextMenu.getItems();
      // Create a new menu button in the context menu if it does not exist
      const menuButton = this._findOrCreateMenuButtonInContextMenu(actionItem, table);
      const actionItems = actionItem.getMenu().getItems();
      for (const action of actionItems) {
        const toolBarAction = action;
        // now find the action in the context menu and remove it from the context menu
        for (const menuItem of contextMenuItems) {
          const actionIdInContextMenu = menuItem.data("actionId");
          const actionIdInToolbar = toolBarAction.data("actionId");
          if (actionIdInContextMenu === actionIdInToolbar + "::ContextMenu" || actionIdInContextMenu === actionIdInToolbar.replace("::ActionMenu", "::ContextMenu")) {
            menuItem.setText(toolBarAction.getText());
            // Add the action to the menu button
            contextMenu.removeItem(menuItem);
            menuButton.addItem(menuItem);
          }
          // If we find another menu in the context menu we check if the action is in the sub menu
          if (menuItem.getItems().length > 0 && !menuItem.getId().includes(actionItem.getId())) {
            const actionInSubMenu = this._findActionInSubMenu(menuItem.getItems(), toolBarAction);
            if (actionInSubMenu) {
              actionInSubMenu.setText(toolBarAction.getText());
              menuButton.addItem(actionInSubMenu);
              if (menuItem.getItems().length === 0) {
                menuItem.destroy();
              }
            }
          }
        }
      }
    }

    /**
     * Finds the action in an action menu in the context menu, it return the action if found and removes it from the menu.
     * @param subMenu The array of actions in the menu
     * @param actionItem The action we are searching for
     * @returns The action if found, otherwise undefined
     */;
    _proto._findActionInSubMenu = function _findActionInSubMenu(subMenu, actionItem) {
      for (const menuItem of subMenu) {
        if (menuItem.data("actionId") === actionItem.data("actionId").replace("::ActionMenu", "::ContextMenu") || menuItem.data("actionId") === actionItem.data("actionId") + "::ContextMenu") {
          const action = menuItem;
          subMenu.splice(subMenu.indexOf(menuItem), 1);
          return action;
        }
      }
      return undefined;
    }

    /**
     * Check's if a particular menu button exists in the context menu, if not creates a new menu button and adds it to the context menu.
     * @param actionItem The menu button to find or create
     * @param table The MDCTable
     * @returns The MenuItem if found, otherwise a new MenuItem
     */;
    _proto._findOrCreateMenuButtonInContextMenu = function _findOrCreateMenuButtonInContextMenu(actionItem, table) {
      const contextMenu = table.getContextMenu();
      const contextMenuItems = contextMenu.getItems();
      //loop over contextMenuItems and check if the required menu button already exists
      for (const menuItem of contextMenuItems) {
        if (menuItem.getId().includes(actionItem.getId())) {
          return menuItem;
        }
      }
      // if the required menu button does not exist, create a new menu button and add it to the contextMenu
      const newMenuButton = new MenuItem({
        id: generate([table.getId(), actionItem.getId(), "::ContextMenu"]),
        text: actionItem.getText()
      });
      contextMenu.addItem(newMenuButton);
      return newMenuButton;
    }

    /**
     * Split the action items in the context menu.
     * @param actionItem The action item to split
     * @param contextMenu The context menu
     */;
    _proto._splitActionsInContextMenu = function _splitActionsInContextMenu(actionItem, contextMenu) {
      const menuItems = contextMenu.getItems();
      for (let i = 0; i < menuItems.length; i++) {
        //check if the menu item is a Menu
        if (menuItems[i].getItems().length > 0) {
          if (menuItems[i].getItems().some(item => item.data("actionId") === actionItem.data("actionId").replace("::ActionMenu", "::ContextMenu"))) {
            const menuItem = menuItems[i];
            const subItems = menuItem.getItems();
            // Remove the menuItem from the context menu
            contextMenu.removeItem(menuItem);
            // Insert these sub-items into the contextMenu starting from the original index
            subItems.forEach((subItem, index) => {
              contextMenu.insertItem(subItem, i + index);
            });
          }
        }
      }
    }

    /**
     * Gets the corresponding context menu action for the table action.
     * @param tableAction The action item to split
     * @param contextMenu The context menu
     * @returns  MenuItem|null the corresponding context menu action or null if not found
     */;
    _proto._getCorrespondingContextMenuAction = function _getCorrespondingContextMenuAction(tableAction, contextMenu) {
      const menuItems = contextMenu.getItems();
      for (const item of menuItems) {
        // the corresponding context menu action is either an item with an additional "::ContextMenu" text at the end of the id
        // or it is a splitted menu item where the "::ContextMenu" part is in the middle of the id
        if (tableAction.getId() + "::ContextMenu" === item.getId() || item.data("actionId") === tableAction.data("actionId")?.replace("::ActionMenu", "::ContextMenu")) {
          return item;
        }
        // for combined actions, the context menu action is the one with the same text
        if (item.getId().includes(tableAction.getId())) {
          return item;
        }
      }
      return null;
    }

    /**
     * Adjust the text and visibility of the action items in the context menu.
     * @param actionItem The action item to split
     * @param contextMenuItem The context menu
     * @param tableAction The array of table actions
     */;
    _proto._alignTextAndVisiblityInContextMenu = function _alignTextAndVisiblityInContextMenu(actionItem, contextMenuItem, tableAction) {
      // change the text of the menu item as the text of action item
      contextMenuItem.setText(actionItem.getText());
      // change the visibility of the contextMenu action as the visibility of table action
      const tableActionVisibility = actionItem.getVisible() && tableAction.getVisible();
      if (tableActionVisibility !== contextMenuItem.getVisible()) {
        contextMenuItem.setVisible(tableActionVisibility);
      }
    }

    /**
     * Check if an action has been split by RTA.
     * @param actionItem The original action item
     * @returns Boolean indicating if the action has been split
     */;
    _proto._isActionSplit = function _isActionSplit(actionItem) {
      if (actionItem.getMetadata().getName() === "sap.m.MenuButton") {
        return false;
      }
      const dependents = actionItem.getDependents();
      // find all the dependents which are a Flex ManagedObjectModel
      const flexManagedObjectModels = dependents.filter(dependent => dependent instanceof ManagedObjectModel);
      // check if one of them has the name "$sap.m.flexibility.SplitButtonsModel"
      return flexManagedObjectModels.some(model => model.getName() === "$sap.m.flexibility.SplitButtonsModel");
    }

    /**
     * Sets a flag to indicate that a context menu item has been pressed.
     * @param active
     */;
    _proto.setContextMenuActive = function setContextMenuActive(active) {
      this.contextMenuActive = active;
    };
    _proto.isContextMenuActive = function isContextMenuActive() {
      return this.contextMenuActive;
    }

    /**
     * Make the menu item of SAP Collaboration Manager visible if it is supported.
     * @param table
     * @param contexts
     */;
    _proto.setCollaborationManagerMenuItemVisibility = function setCollaborationManagerMenuItemVisibility(table, contexts) {
      // get collaboration menu item from context menu
      const contextMenu = table.getContextMenu();
      const menuItems = contextMenu.getItems();
      const collaborationManagerMenuItem = menuItems?.find(menuItem => menuItem.getId().includes("ContextMenu::CollaborationManager"));
      if (collaborationManagerMenuItem) {
        // get collaboration option from collaborative tools service
        const appComponent = CommonUtils.getAppComponent(table);
        const collaborativeToolsService = appComponent?.getCollaborativeToolsService();
        const collaborationOption = collaborativeToolsService?.collaborationService.cmHelperService?.getOptions();
        // get navigation info from table definition
        const tableDefinition = table?.getParent()?.getTableDefinition();
        const navigationType = tableDefinition?.annotation?.row?.navigationInfo?.type;
        if (collaborationOption && navigationType === "Navigation" && contexts.length > 0) {
          // Items to share needs to have an active entity, if it's not Collaborative Draft or a non draft programming model
          const view = CommonUtils.getTargetView(table);
          const collaborativeDraft = view.getController().collaborativeDraft;
          const metaModel = contexts[0].getModel()?.getMetaModel();
          const isDraft = ModelHelper.isDraftSupported(metaModel, contexts[0].getPath());
          // If we are in Collaborative Draft or in an non-draft app, we set visible to true.
          // Otherwise we only set visible to true, if at least one of the selected contexts is or has an active version.
          const visible = collaborativeDraft.isCollaborationEnabled() || !isDraft ? true : contexts.some(context => context.getObject().IsActiveEntity || context.getObject().HasActiveEntity);
          collaborationManagerMenuItem.setVisible(visible);
          FESRHelper.setSemanticStepname(collaborationManagerMenuItem, "press", "CM:ShareLink");
        } else {
          collaborationManagerMenuItem.setVisible(false);
        }
      }
    }

    /**
     * Handler when an item in the context menu is pressed.
     * @param oEvent
     */;
    _proto._onContextMenuPress = function _onContextMenuPress(oEvent) {
      const table = oEvent.getSource(),
        tableContexts = table.getSelectedContexts(),
        // selected items in the table
        contextMenuContext = oEvent.getParameter("bindingContext"),
        // row clicked for context menu
        internalModelContext = this.getBindingContext("internal");
      const contextMenuSelection = this.getRelevantSelection(tableContexts, contextMenuContext);

      // Check if all contexts in contextMenuSelection are inactive
      // if so, set the inactiveContext property in the internal model to true
      // if just one context is not inactive, set the inactiveContext property to false
      let oneContextIsActive = true;
      oneContextIsActive = contextMenuSelection.some(context => !context.isInactive());
      internalModelContext?.setProperty("contextmenu/inactiveContext", !oneContextIsActive);

      // Do not consider empty rows as selected context, for other actions than delete
      const activeSelectedContexts = contextMenuSelection.filter(function (oContext) {
        return !oContext.isInactive();
      });
      internalModelContext?.setProperty("contextmenu/selectedContexts", activeSelectedContexts);
      internalModelContext?.setProperty("contextmenu/numberOfSelectedContexts", activeSelectedContexts.length);
      internalModelContext?.setProperty("contextmenu/numberOfSelectedContextsForDelete", contextMenuSelection.length);
      if (activeSelectedContexts.length > 0) {
        /* Align context menu with RTA changes in table toolbar */
        this.alignContextMenuWithTableToolbarChanges(table);
      }

      // Set the visibility of the MenuItem for Collaboration Manager
      this.setCollaborationManagerMenuItemVisibility(table, activeSelectedContexts);

      // Check if the context menu contains only not visible items
      // in that case prevent the context menu from opening
      const contextMenu = table.getContextMenu();
      const menuItems = contextMenu.getItems();
      const visibleMenuItems = menuItems.filter(menuItem => menuItem.getVisible());
      if (visibleMenuItems.length === 0) {
        oEvent.preventDefault();
      }

      // Enablement of the Expand/Collapse buttons
      const isExpandable = contextMenuSelection.some(singleContext => singleContext.isExpanded() !== undefined);
      const isCollapsable = contextMenuSelection.some(singleContext => singleContext.isExpanded());
      internalModelContext?.setProperty("contextmenu/isExpandable", isExpandable);
      internalModelContext?.setProperty("contextmenu/isCollapsable", isCollapsable);

      // Action enablement for Delete
      internalModelContext?.setProperty("controlId", table.getId());
      deleteHelper.updateDeleteInfoForSelectedContexts(internalModelContext, contextMenuSelection, true);

      // Action enablement for IBN
      if (!table.data("enableAnalytics")) {
        const navigationAvailableMap = table?.data("navigationAvailableMap");
        TableRuntime.setIntentBasedNavigationEnablement(internalModelContext, navigationAvailableMap, activeSelectedContexts, true);
      }

      // Action enablement for Mass Edit
      const updatablePropertyPath = table?.data("updatablePropertyPath");
      const draft = table?.data("draft");
      const readOnlyDraftEnabled = table.data("displayModePropertyBinding") === "true" && draft !== "undefined";
      const updatableContexts = [];
      for (const selectedContext of activeSelectedContexts) {
        if (TableRuntime.isUpdatableContext(updatablePropertyPath, selectedContext, readOnlyDraftEnabled)) {
          updatableContexts.push(selectedContext);
        }
      }
      internalModelContext?.setProperty("contextmenu/updatableContexts", updatableContexts);
      const tableDefinition = this.getTableDefinition();
      if (tableDefinition.control.createEnablement && contextMenuSelection.length === 1) {
        TableRuntime._updateCreateEnablement(internalModelContext, tableDefinition.control.createEnablement, table, contextMenuSelection[0], tableDefinition.control.nodeType, true);
      }
      TableRuntime.updateCutCopyPasteEnablement(internalModelContext.getObject(), table, true);
      TableRuntime.updateMoveUpDownEnablement(internalModelContext.getObject(), table, true);

      // Other action enablement
      ActionRuntime.setActionEnablement(internalModelContext, JSON.parse(tableDefinition.operationAvailableMap), activeSelectedContexts, "table", true);
    };
    _proto.getRelevantSelection = function getRelevantSelection(tableContexts, contextMenuContext) {
      let contextMenuSelection;
      if (tableContexts.includes(contextMenuContext)) {
        contextMenuSelection = tableContexts;
      } else {
        contextMenuSelection = [contextMenuContext];
      }
      return contextMenuSelection;
    };
    return ContextMenuHandler;
  }();
  _exports = ContextMenuHandler;
  return _exports;
}, false);
//# sourceMappingURL=ContextMenuHandler-dbg.js.map
