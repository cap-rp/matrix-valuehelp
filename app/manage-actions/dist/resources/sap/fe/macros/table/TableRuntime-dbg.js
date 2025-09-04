/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/ActionRuntime", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/DeleteHelper", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/library", "sap/fe/macros/table/Utils", "sap/ui/core/Messaging", "../field/FieldRuntimeHelper"], function (Log, ActionRuntime, CommonUtils, BusyLocker, MetaModelConverter, deleteHelper, FPMHelper, FELibrary, TableUtils, Messaging, FieldRuntimeHelper) {
  "use strict";

  const CreationMode = FELibrary.CreationMode;
  /**
   * Static class used by Table building block during runtime
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const TableRuntime = {
    executeConditionalActionShortcut: function (sButtonMatcher, oSource) {
      // Get the button related to keyboard shortcut
      const oMdcTable = oSource.getParent();
      if (sButtonMatcher !== CreationMode.CreationRow) {
        const oButton = oMdcTable.getActions().reduce(function (aActionButtons, oActionToolbarAction) {
          return aActionButtons.concat(oActionToolbarAction.getAction());
        }, []).find(function (oActionButton) {
          return oActionButton.getId().endsWith(sButtonMatcher);
        });
        CommonUtils.fireButtonPress(oButton);
      } else {
        const oCreationRow = oMdcTable.getAggregation("creationRow");
        if (oCreationRow && oCreationRow.getApplyEnabled() && oCreationRow.getVisible()) {
          oCreationRow.fireApply();
        }
      }
    },
    setContexts: async function (event) {
      const source = event.getSource();
      const table = source;
      BusyLocker.lock(table);
      try {
        await TableRuntime.setContextsAsync(table);
      } catch (error) {
        Log.error(error);
      } finally {
        BusyLocker.unlock(table);
      }
    },
    setContextsAsync: async function (table) {
      const metaModel = table.getModel()?.getMetaModel();
      const tableAPI = table.getParent();
      if (!tableAPI || !metaModel) {
        return;
      }
      const tableDefinition = tableAPI.tableDefinition;
      const collectionEntity = MetaModelConverter.convertTypes(metaModel).resolvePath(tableDefinition.annotation.collection).target;
      const sUpdatablePath = tableDefinition.annotation.updatablePropertyPath;
      const aActionsMultiselectDisabled = table.data("actionsMultiselectDisabled")?.split(",") ?? [];
      const oActionOperationAvailableMap = JSON.parse(tableDefinition.operationAvailableMap || "{}");
      const oNavigationAvailableMap = table.data("navigationAvailableMap");
      const aSelectedContexts = table.getSelectedContexts();
      const aDeletableContexts = [];
      const bReadOnlyDraftEnabled = table.data("displayModePropertyBinding") === "true" && !!collectionEntity?.annotations.Common?.DraftRoot;
      const aUpdatableContexts = [];
      // oDynamicActions are bound actions that are available according to some property
      // in each item
      const oDynamicActions = {};
      const oIBN = {};
      const oInternalModelContext = table.getBindingContext("internal");
      if (!oInternalModelContext) {
        return;
      }
      // for the delete we consider the inactive contexts as potentially part of the selected contexts
      deleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);

      //do not consider empty rows as selected context, for the other actions
      const activeSelectedContexts = aSelectedContexts.filter(function (oContext) {
        return !oContext.isInactive();
      });
      const oModelObject = Object.assign(oInternalModelContext.getObject() || {}, {
        selectedContexts: activeSelectedContexts,
        selectedContextsIncludingInactive: aSelectedContexts,
        numberOfSelectedContexts: activeSelectedContexts.length,
        dynamicActions: oDynamicActions,
        ibn: oIBN,
        deleteEnabled: true,
        deletableContexts: aDeletableContexts,
        unSavedContexts: [],
        lockedContexts: [],
        draftsWithNonDeletableActive: [],
        draftsWithDeletableActive: [],
        controlId: "",
        updatableContexts: aUpdatableContexts,
        pasteAuthorized: true,
        pasteFromCopyAutorized: true,
        semanticKeyHasDraftIndicator: oInternalModelContext.getProperty("semanticKeyHasDraftIndicator") ? oInternalModelContext.getProperty("semanticKeyHasDraftIndicator") : undefined
      });
      oModelObject.nodeUpdatesInfo = oModelObject.nodeUpdatesInfo || {};
      for (const oSelectedContext of activeSelectedContexts) {
        const oContextData = oSelectedContext.getObject();
        for (const key in oContextData) {
          if (key.indexOf("#") === 0) {
            let sActionPath = key;
            sActionPath = sActionPath.substring(1, sActionPath.length);
            oModelObject.dynamicActions[sActionPath] = {
              enabled: true
            };
            oInternalModelContext.setProperty("", oModelObject);
          }
        }
        if (this.isUpdatableContext(sUpdatablePath, oSelectedContext, bReadOnlyDraftEnabled)) {
          aUpdatableContexts.push(oSelectedContext);
        }
      }
      if (!table.data("enableAnalytics")) {
        TableRuntime.setIntentBasedNavigationEnablement(oInternalModelContext, oNavigationAvailableMap, activeSelectedContexts);
      }
      if (activeSelectedContexts.length > 1) {
        this.disableAction(aActionsMultiselectDisabled, oDynamicActions);
      }
      if (oModelObject) {
        oModelObject["updatableContexts"] = aUpdatableContexts;
        oModelObject["controlId"] = table.getId();
        oInternalModelContext.setProperty("", oModelObject);
      }

      // Manage a potential callback to enable/disable the create button/menu for a TreeTable
      if (activeSelectedContexts.length <= 1 && tableDefinition.control.createEnablement) {
        const parentContext = activeSelectedContexts.length ? activeSelectedContexts[0] : null;
        this._updateCreateEnablement(oInternalModelContext, tableDefinition.control.createEnablement, table, parentContext, tableDefinition.control.nodeType);
      }
      this.updateCutCopyPasteEnablement(oModelObject, table);
      this.updateMoveUpDownEnablement(oModelObject, table);
      return ActionRuntime.setActionEnablement(oInternalModelContext, oActionOperationAvailableMap, activeSelectedContexts, "table");
    },
    /**
     * Checks, if the selected context is updatable for Mass Edit.
     * @param updatablePropertyPath The updatablePropertyPath from the table annotation
     * @param selectedContext The selected context
     * @param readOnlyDraftEnabled Indicates, if the table is read only and draft enabled
     * @returns Boolean Indicating context is updatable
     */
    isUpdatableContext: function (updatablePropertyPath, selectedContext, readOnlyDraftEnabled) {
      /* The updatable contexts with mass edit depend on the following:
       	1. Update is dependent on current entity property (updatablePath).
       	2. The table is read only and draft enabled (like LR), in this case only active contexts can be mass edited (not draft contexts).
          So, update depends on 'IsActiveEntity' value which needs to be checked. */
      const contextData = selectedContext.getObject();
      const updatableByPath = updatablePropertyPath.length === 0 || !!selectedContext.getProperty(updatablePropertyPath);
      const notDraftInReadOnlyMode = !readOnlyDraftEnabled || contextData.IsActiveEntity;
      if (updatableByPath && notDraftInReadOnlyMode) {
        return true;
      }
      return false;
    },
    /**
     * Checks if the node is movable according to the custom logic (if any).
     * @param node
     * @param table
     * @returns True if the custom logic allows the node to be moved (or if there's no custom logic), false otherwise
     */
    checkIfNodeIsMovable: function (node, table) {
      const isNodeMovableFunction = table.getParent().getTableDefinition().control.isNodeMovable;
      const nodeMovableCustomFunction = isNodeMovableFunction ? FPMHelper.getCustomFunction(isNodeMovableFunction.moduleName, isNodeMovableFunction.methodName, table) : undefined;
      try {
        return nodeMovableCustomFunction === undefined || nodeMovableCustomFunction(node);
      } catch (error) {
        Log.warning(`Error in custom function for isNodeMovable: ${error}`);
        return true;
      }
    },
    /**
     * Checks whether the node can be copied according to the custom logic, if any.
     * @param node
     * @param table
     * @returns True if custom logic allows the node to be copied (or if no custom logic is defined); false otherwise.
     */
    checkIfNodeIsCopyable: function (node, table) {
      const isNodeCopyableFunction = table.getParent().getTableDefinition().control.isNodeCopyable;
      const nodeMovableCustomFunction = isNodeCopyableFunction ? FPMHelper.getCustomFunction(isNodeCopyableFunction.moduleName, isNodeCopyableFunction.methodName, table) : undefined;
      try {
        return nodeMovableCustomFunction === undefined || nodeMovableCustomFunction(node);
      } catch (error) {
        Log.warning(`Error in custom function for isNodeMovable: ${error}`);
        return true;
      }
    },
    /**
     * Updates the internal context to enable/disable the Cut and Paste buttons.
     * @param modelObject Internal context object of the table
     * @param table Instance of the Table
     * @param forContextMenu
     */
    updateCutCopyPasteEnablement: function (modelObject, table) {
      let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const tableDefinition = table.getParent().getTableDefinition();
      if (tableDefinition.control.type !== "TreeTable") {
        // The logic below only makes sense for a Tree Table
        return;
      }
      const checkDraftInstance = !table.getRowBinding().isRelative();
      if (forContextMenu) {
        modelObject.contextmenu.nodeUpdatesInfo = {};
      }
      const nodeUpdatesInfo = modelObject.nodeUpdatesInfo;
      const copyCutPasteEnablementInfo = (!forContextMenu ? modelObject : modelObject.contextmenu).nodeUpdatesInfo;
      const dataModelsrc = !forContextMenu ? modelObject : modelObject.contextmenu;
      const cutableContexts = dataModelsrc.updatableContexts.filter(context => TableRuntime.checkIfNodeIsMovable(context, table) && (!checkDraftInstance || context.getProperty("HasDraftEntity") !== true));
      const copyableContexts = dataModelsrc.selectedContexts.filter(context => TableRuntime.checkIfNodeIsCopyable(context, table));
      copyCutPasteEnablementInfo.cutEnablement = cutableContexts.length === 1;
      copyCutPasteEnablementInfo.copyEnablement = copyableContexts.length === 1;
      if (nodeUpdatesInfo.lastAction && nodeUpdatesInfo.pastableContexts.length > 0) {
        let contextsforPastableEnablement;
        const extensionPoint = nodeUpdatesInfo.lastAction === "Cut" ? tableDefinition.control.isMoveToPositionAllowed : tableDefinition.control.isCopyToPositionAllowed;

        //remove contexts depending of the custom function
        if (extensionPoint) {
          contextsforPastableEnablement = [...dataModelsrc.selectedContexts].filter(targetContext => FPMHelper.getCustomFunction(extensionPoint.moduleName, extensionPoint.methodName, table)(nodeUpdatesInfo.pastableContexts[0], targetContext) //nodeUpdatesInfo.pastableContexts has been the last time the user pressed the cut/copy button
          );
        } else {
          contextsforPastableEnablement = [...dataModelsrc.selectedContexts];
        }

        //the paste cannot be done if several contexts are selected
        copyCutPasteEnablementInfo.pasteEnablement = dataModelsrc.selectedContexts.length <= 1 && contextsforPastableEnablement.length === dataModelsrc.selectedContexts.length;
      }
    },
    /**
     *  Updates the internal context to enable/disable the move up/move down buttons.
     * @param modelObject
     * @param table
     * @param forContextMenu
     */
    updateMoveUpDownEnablement: function (modelObject, table) {
      let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      const modelObjectPath = !forContextMenu ? modelObject : modelObject.contextmenu;
      const selectedContexts = modelObjectPath.selectedContexts;
      const tableDefinition = table.getParent().getTableDefinition();
      const changeSiblingForRootsSupported = tableDefinition.annotation.changeSiblingForRootsSupported;
      // Disable the move up/move down buttons if there are no selected contexts, if the table is not a TreeTable, or if the table is sorted
      if (selectedContexts.length !== 1 || tableDefinition.control.type !== "TreeTable" || table.getBindingContext("internal")?.getProperty("isSorted") === true || selectedContexts[0].getProperty("@$ui5.node.level") === 1 && !changeSiblingForRootsSupported // Disable move up/down for roots
      ) {
        modelObjectPath.singleContextMovableUp = false;
        modelObjectPath.singleContextMovableDown = false;
      } else {
        const movedContext = selectedContexts[0];

        // Check if the selected context can be moved according to the custom logic (if any) and if it doesn't have a draft instance if we're in a ListReport,
        // and if it's not out-of-place (i.e. it must be displayed at its 'real' position)
        const movableDraft = table.getRowBinding().isRelative() || movedContext.getProperty("HasDraftEntity") !== true;
        const outOfPlaceContext = movedContext.isTransient() !== undefined;
        const customMovable = TableRuntime.checkIfNodeIsMovable(movedContext, table);
        modelObjectPath.singleContextMovableUp = movableDraft && customMovable && !outOfPlaceContext && movedContext.getSibling(-1) !== null;
        modelObjectPath.singleContextMovableDown = movableDraft && customMovable && !outOfPlaceContext && movedContext.getSibling(1) !== null;
      }
    },
    /**
     * Updates the internal context to enable/disable the Create button / menu / menu items.
     * @param internalContext
     * @param createEnablementCallback
     * @param createEnablementCallback.moduleName
     * @param createEnablementCallback.methodName
     * @param table
     * @param parentContext
     * @param nodeTypeParameters
     * @param nodeTypeParameters.propertyName
     * @param nodeTypeParameters.values
     * @param forContextMenu
     */
    _updateCreateEnablement: function (internalContext, createEnablementCallback, table, parentContext, nodeTypeParameters) {
      let forContextMenu = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      let possibleValues;
      if (nodeTypeParameters !== undefined) {
        // Push all possible values in the menu
        possibleValues = nodeTypeParameters.values.map(option => option.value);
      } else {
        // No menu --> Only 'undefined' value that corresponds to the 'Create' button
        possibleValues = [undefined];
      }
      const enablementFunction = FPMHelper.getCustomFunction(createEnablementCallback.moduleName, createEnablementCallback.methodName, table);
      if (!enablementFunction) {
        return;
      }
      const enabledFlags = possibleValues.map(value => {
        let enabled = false;
        try {
          enabled = !!(enablementFunction(value, parentContext) ?? true);
        } catch (_error) {
          enabled = true;
        }
        return enabled;
      });
      // enableFlags[i] is true <=> possibleValues[i] is allowed for creation

      const enablementMap = {};
      enablementMap["Create"] = enabledFlags.some(flag => flag); // Enable the Menu (or the button) if at least one option is possible
      enabledFlags.forEach((enabled, index) => {
        enablementMap[`Create_${index}`] = enabled;
      });
      const contextPath = forContextMenu ? "contextmenu/" : "";
      internalContext.setProperty(contextPath + "createEnablement", enablementMap);
    },
    /**
     * Clears the table selection, and enables/disables the 'Create' button/menu if necessary.
     * @param table The table
     */
    clearSelection: function (table) {
      // Clear the selection in the control
      table.clearSelection();

      // Update the selection-related information in the internal model
      const internalModelContext = table.getBindingContext("internal");
      if (internalModelContext) {
        internalModelContext.setProperty("deleteEnabled", false);
        internalModelContext.setProperty("numberOfSelectedContexts", 0);
        internalModelContext.setProperty("selectedContexts", []);
        internalModelContext.setProperty("deletableContexts", []);
      }

      // Enable/disable the 'Create' button/menu if necessary
      const tableAPI = table.getParent();
      if (tableAPI.tableDefinition.control.createEnablement) {
        this._updateCreateEnablement(internalModelContext, tableAPI.tableDefinition.control.createEnablement, table, null, tableAPI.tableDefinition.control.nodeType);
      }
    },
    disableAction: function (aActionsMultiselectDisabled, oDynamicActions) {
      aActionsMultiselectDisabled.forEach(function (sAction) {
        oDynamicActions[sAction] = {
          bEnabled: false
        };
      });
    },
    onFieldChangeInCreationRow: function (oEvent, withCustomValidationFunction) {
      // CREATION ROW CASE
      const mField = FieldRuntimeHelper.getFieldStateOnChange(oEvent),
        oSourceField = mField.field,
        sFieldId = oSourceField.getId();
      const oInternalModelContext = oSourceField.getBindingContext("internal"),
        mFieldValidity = oInternalModelContext.getProperty("creationRowFieldValidity"),
        mNewFieldValidity = Object.assign({}, mFieldValidity);
      mNewFieldValidity[sFieldId] = mField.state;
      oInternalModelContext.setProperty("creationRowFieldValidity", mNewFieldValidity);

      // prepare Custom Validation
      if (withCustomValidationFunction) {
        const mCustomValidity = oInternalModelContext.getProperty("creationRowCustomValidity"),
          mNewCustomValidity = Object.assign({}, mCustomValidity);
        mNewCustomValidity[oSourceField.getBinding("value").getPath()] = {
          fieldId: oSourceField.getId()
        };
        oInternalModelContext.setProperty("creationRowCustomValidity", mNewCustomValidity);
        // Remove existing CustomValidation message
        const sTarget = `${oSourceField.getBindingContext()?.getPath()}/${oSourceField.getBindingPath("value")}`;
        Messaging.getMessageModel().getData().forEach(function (oMessage) {
          if (oMessage.getTargets()[0] === sTarget) {
            Messaging.removeMessages(oMessage);
          }
        });
      }
    },
    onTreeTableContextChanged: function (event, initialExpansionLevel) {
      // When the context of a TreeTable changes, we want to restore its expansion state to the default:
      //   - all expanded if there's a search parameter coming from the filterBar
      //   - otherwise initial expansion state coming from the PV (stored in the payload)
      //   - otherwise no expansion at all

      const source = event.getSource();
      const table = source;
      const tableAPI = table.getParent();
      const rowBinding = table.getRowBinding();
      if (!rowBinding?.getContext() || tableAPI.getIgnoreContextChangeEvent()) {
        // The table is not bound, or we're in the middle of switching between normal and fullscreen, so we don't want to change the expansion state
        return;
      }
      const aggregation = rowBinding.getAggregation() ?? {};
      const filterInfo = TableUtils.getAllFilterInfo(table);
      aggregation.expandTo = filterInfo.search ? Number.MAX_SAFE_INTEGER : initialExpansionLevel;
      rowBinding.setAggregation(aggregation);
    },
    /**
     * Called when an item in a 'Create' menu is clicked. It creates a document with the corresponding initial data.
     * @param event
     * @param valueIndex The index of the item in the menu
     * @param selectedContexts The selected contexts in the table for this 'Create' menu
     */
    onCreateMenuItemPress: async function (event, valueIndex, selectedContexts) {
      const mdcTable = FPMHelper.getMdcTable(event.getSource());
      const tableAPI = mdcTable?.getParent();

      // Some checks to be on the safe side
      if (!tableAPI || !mdcTable) {
        return;
      }
      const nodeType = tableAPI.tableDefinition.control.nodeType;
      if (!nodeType) {
        return;
      }
      const view = CommonUtils.getTargetView(tableAPI);
      const creationData = {};
      creationData[nodeType.propertyName] = nodeType.values[valueIndex].value;
      const creationParameters = {
        selectedContexts,
        creationMode: tableAPI.tableDefinition.annotation.create.mode,
        data: creationData,
        tableId: mdcTable?.getId()
      };
      if (creationParameters.creationMode === CreationMode.CreationDialog) {
        creationParameters.creationDialogFields = nodeType.values[valueIndex].creationDialogFields;
        if (!creationParameters.creationDialogFields || creationParameters.creationDialogFields.length === 0) {
          // Use the default value if no creation fields are specified for this menu item
          creationParameters.creationDialogFields = tableAPI.tableDefinition.control.creationDialogFields;
        }
        if (!mdcTable.getRowBinding()) {
          // In creation dialog mode, we force the table data to be loaded before creating the document
          // (to overcome the case in a ListReport where no data is loaded yet)
          await mdcTable.rebind();
        }
      }
      view.getController().editFlow.createDocument(tableAPI.getRowBinding(), creationParameters).catch(error => {
        Log.error(`Failed to create new document: ${error}`);
      });
    },
    /**
     * Called when the 'Create' button is pressed, or the 'Create' command invoked.
     * @param event
     * @param selectedContexts The selected contexts in the table for this 'Create' button
     */
    onCreateButtonPress: async function (event, selectedContexts) {
      const mdcTable = FPMHelper.getMdcTable(event.getSource());
      const tableAPI = mdcTable?.getParent();

      // Some checks to be on the safe side
      if (!tableAPI || !mdcTable) {
        return;
      }
      const creationParameters = {
        creationMode: tableAPI.tableDefinition.annotation.create.mode
      };
      switch (creationParameters.creationMode) {
        case CreationMode.External:
          creationParameters.outbound = tableAPI.tableDefinition.annotation.create.outbound;
          break;
        case CreationMode.CreationRow:
          creationParameters.creationRow = event.getSource();
          creationParameters.createAtEnd = tableAPI.tableDefinition.control.createAtEnd ?? false;
          break;
        case CreationMode.NewPage:
        case CreationMode.Inline:
        case CreationMode.CreationDialog:
          creationParameters.createAtEnd = tableAPI.tableDefinition.control.createAtEnd ?? false;
          creationParameters.tableId = mdcTable?.getId();
          creationParameters.selectedContexts = selectedContexts;
          break;
        case CreationMode.InlineCreationRows:
          // Nothing
          break;
        default:
          // Other modes are not supported
          return;
      }
      if (creationParameters.creationMode === CreationMode.CreationDialog) {
        creationParameters.creationDialogFields = tableAPI.tableDefinition.control.creationDialogFields;
        if (!mdcTable.getRowBinding()) {
          // In creation dialog mode, we force the table data to be loaded before creating the document
          // (to overcome the case in a ListReport where no data is loaded yet)
          await mdcTable.rebind();
        }
      }
      const view = CommonUtils.getTargetView(tableAPI);
      if (creationParameters.creationMode === CreationMode.InlineCreationRows) {
        view.getController().editFlow.createEmptyRowsAndFocus(mdcTable).catch(error => {
          Log.error(`Failed to create new empty row: ${error}`);
        });
      } else {
        view.getController().editFlow.createDocument(tableAPI.getRowBinding(), creationParameters).catch(error => {
          Log.error(`Failed to create new document: ${error}`);
        });
      }
    },
    /**
     * Method to manage the IntentBased Navigation enablement.
     * @param internalModelContext
     * @param navigationAvailableMap
     * @param selectedContexts
     * @param forContextMenu
     */
    setIntentBasedNavigationEnablement: function (internalModelContext, navigationAvailableMap, selectedContexts) {
      let forContextMenu = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
      for (const sKey in navigationAvailableMap) {
        if (!forContextMenu) {
          internalModelContext.setProperty(`ibn/${sKey}`, {
            bEnabled: false,
            aApplicable: [],
            aNotApplicable: []
          });
        } else {
          internalModelContext.setProperty(`ibn/${sKey}`, {
            // Do not change enabled, aApplicable and aNotApplicable property in case of context menu calculation
            bEnabled: internalModelContext.getProperty(`${internalModelContext.getPath()}/ibn/${sKey}/bEnabled`),
            aApplicable: internalModelContext.getProperty(`${internalModelContext.getPath()}/ibn/${sKey}/aApplicable`),
            aNotApplicable: internalModelContext.getProperty(`${internalModelContext.getPath()}/ibn/${sKey}/aNotApplicable`),
            bEnabledForContextMenu: false,
            aApplicableForContextMenu: [],
            aNotApplicableForContextMenu: []
          });
        }
        const aApplicable = [],
          aNotApplicable = [];
        const sProperty = navigationAvailableMap[sKey];
        for (const selectedContext of selectedContexts) {
          if (selectedContext.getObject(sProperty)) {
            const enabledProperty = !forContextMenu ? "bEnabled" : "bEnabledForContextMenu";
            internalModelContext.getModel().setProperty(`${internalModelContext.getPath()}/ibn/${sKey}/${enabledProperty}`, true);
            aApplicable.push(selectedContext);
          } else {
            aNotApplicable.push(selectedContext);
          }
        }
        const applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
        const notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
        internalModelContext.getModel().setProperty(`${internalModelContext.getPath()}/ibn/${sKey}/${applicableProperty}`, aApplicable);
        internalModelContext.getModel().setProperty(`${internalModelContext.getPath()}/ibn/${sKey}/${notApplicableProperty}`, aNotApplicable);
      }
    },
    /**
     * Called when a context menu item is pressed.
     * @param event
     */
    onContextMenuItemSelected: function (event) {
      const mdcTable = FPMHelper.getMdcTable(event.getSource());
      const tableAPI = mdcTable?.getParent();

      // Set the flag on the tableAPI so that getSelectedContexts returns the correct value
      tableAPI?.setContextMenuActive(true);

      // After a short delay (once the corresponding action has been triggered), we need to reset the flag on the table
      setTimeout(() => {
        tableAPI?.setContextMenuActive(false);
      }, 0);
    },
    /**
     * Handles the MDC DataStateIndicator plugin to display messageStrip on a table.
     * @param message
     * @param control
     * @returns Whether to render the messageStrip visible
     */
    dataStateIndicatorFilter: function (message, control) {
      const tableAPI = control.getParent();
      return tableAPI.dataStateIndicatorFilter(message, control);
    }
  };
  return TableRuntime;
}, false);
//# sourceMappingURL=TableRuntime-dbg.js.map
