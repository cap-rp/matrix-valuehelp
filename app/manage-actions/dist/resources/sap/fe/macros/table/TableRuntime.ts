import type { EntitySet } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import ActionRuntime from "sap/fe/core/ActionRuntime";
import CommonUtils from "sap/fe/core/CommonUtils";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import type { CreateBehaviorExternal } from "sap/fe/core/converters/controls/Common/Table";
import deleteHelper from "sap/fe/core/helpers/DeleteHelper";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type { InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import FELibrary from "sap/fe/core/library";
import type TableAPI from "sap/fe/macros/table/TableAPI";
import TableUtils from "sap/fe/macros/table/Utils";
import type MenuItem from "sap/m/MenuItem";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import Messaging from "sap/ui/core/Messaging";
import type Message from "sap/ui/core/message/Message";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import type { default as MDCTable, default as Table } from "sap/ui/mdc/Table";
import type ActionToolbarAction from "sap/ui/mdc/actiontoolbar/ActionToolbarAction";
import type CreationRow from "sap/ui/mdc/table/CreationRow";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import FieldRuntimeHelper from "../field/FieldRuntimeHelper";

const CreationMode = FELibrary.CreationMode;
/**
 * Static class used by Table building block during runtime
 * @private
 * @experimental This module is only for internal/experimental use!
 */
const TableRuntime = {
	executeConditionalActionShortcut: function (sButtonMatcher: string, oSource: Control): void {
		// Get the button related to keyboard shortcut
		const oMdcTable = oSource.getParent() as MDCTable;
		if (sButtonMatcher !== CreationMode.CreationRow) {
			const oButton = oMdcTable
				.getActions()
				.reduce(function (aActionButtons: Control[], oActionToolbarAction: Control) {
					return aActionButtons.concat((oActionToolbarAction as ActionToolbarAction).getAction());
				}, [] as Control[])
				.find(function (oActionButton: Control) {
					return oActionButton.getId().endsWith(sButtonMatcher);
				});
			CommonUtils.fireButtonPress(oButton);
		} else {
			const oCreationRow = oMdcTable.getAggregation("creationRow") as CreationRow;
			if (oCreationRow && oCreationRow.getApplyEnabled() && oCreationRow.getVisible()) {
				oCreationRow.fireApply();
			}
		}
	},

	setContexts: async function (event: UI5Event<{}, Table>): Promise<void> {
		const source = event.getSource();
		const table = source;
		BusyLocker.lock(table);
		try {
			await TableRuntime.setContextsAsync(table);
		} catch (error) {
			Log.error(error as string);
		} finally {
			BusyLocker.unlock(table);
		}
	},

	setContextsAsync: async function (table: Table): Promise<void[] | undefined> {
		const metaModel = table.getModel()?.getMetaModel() as undefined | ODataMetaModel;
		const tableAPI = table.getParent() as TableAPI;
		if (!tableAPI || !metaModel) {
			return;
		}
		const tableDefinition = tableAPI.tableDefinition;
		const collectionEntity = MetaModelConverter.convertTypes(metaModel).resolvePath<EntitySet>(
			tableDefinition.annotation.collection
		).target;
		const sUpdatablePath = tableDefinition.annotation.updatablePropertyPath;

		const aActionsMultiselectDisabled = table.data("actionsMultiselectDisabled")?.split(",") ?? [];
		const oActionOperationAvailableMap = JSON.parse(tableDefinition.operationAvailableMap || "{}");
		const oNavigationAvailableMap = table.data("navigationAvailableMap");

		const aSelectedContexts = table.getSelectedContexts() as Context[];
		const aDeletableContexts: Context[] = [];
		const bReadOnlyDraftEnabled =
			table.data("displayModePropertyBinding") === "true" && !!collectionEntity?.annotations.Common?.DraftRoot;
		const aUpdatableContexts: Context[] = [];
		// oDynamicActions are bound actions that are available according to some property
		// in each item
		const oDynamicActions: Record<string, { bEnabled?: boolean }> | undefined = {};
		const oIBN = {};
		const oInternalModelContext = table.getBindingContext("internal") as InternalModelContext;

		if (!oInternalModelContext) {
			return;
		}
		// for the delete we consider the inactive contexts as potentially part of the selected contexts
		deleteHelper.updateDeleteInfoForSelectedContexts(oInternalModelContext, aSelectedContexts);

		//do not consider empty rows as selected context, for the other actions
		const activeSelectedContexts = aSelectedContexts.filter(function (oContext: Context) {
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
			semanticKeyHasDraftIndicator: oInternalModelContext.getProperty("semanticKeyHasDraftIndicator")
				? oInternalModelContext.getProperty("semanticKeyHasDraftIndicator")
				: undefined
		});
		oModelObject.nodeUpdatesInfo = oModelObject.nodeUpdatesInfo || {};

		for (const oSelectedContext of activeSelectedContexts) {
			const oContextData = oSelectedContext.getObject();
			for (const key in oContextData) {
				if (key.indexOf("#") === 0) {
					let sActionPath: string = key;
					sActionPath = sActionPath.substring(1, sActionPath.length);
					oModelObject.dynamicActions[sActionPath] = { enabled: true };
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
			this._updateCreateEnablement(
				oInternalModelContext,
				tableDefinition.control.createEnablement,
				table,
				parentContext,
				tableDefinition.control.nodeType
			);
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
	isUpdatableContext: function (updatablePropertyPath: string, selectedContext: Context, readOnlyDraftEnabled: boolean): boolean {
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
	checkIfNodeIsMovable: function (node: Context, table: Table): boolean {
		const isNodeMovableFunction = (table.getParent() as TableAPI).getTableDefinition().control.isNodeMovable;
		const nodeMovableCustomFunction = isNodeMovableFunction
			? FPMHelper.getCustomFunction<(context: Context) => boolean>(
					isNodeMovableFunction.moduleName,
					isNodeMovableFunction.methodName,
					table
			  )
			: undefined;

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
	checkIfNodeIsCopyable: function (node: Context, table: Table): boolean {
		const isNodeCopyableFunction = (table.getParent() as TableAPI).getTableDefinition().control.isNodeCopyable;
		const nodeMovableCustomFunction = isNodeCopyableFunction
			? FPMHelper.getCustomFunction<(context: Context) => boolean>(
					isNodeCopyableFunction.moduleName,
					isNodeCopyableFunction.methodName,
					table
			  )
			: undefined;

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
	updateCutCopyPasteEnablement: function (modelObject: { [key: string]: unknown }, table: Table, forContextMenu = false): void {
		const tableDefinition = (table.getParent() as TableAPI).getTableDefinition();
		if (tableDefinition.control.type !== "TreeTable") {
			// The logic below only makes sense for a Tree Table
			return;
		}
		const checkDraftInstance = !table.getRowBinding().isRelative();

		if (forContextMenu) {
			(modelObject.contextmenu as { [key: string]: unknown }).nodeUpdatesInfo = {};
		}
		const nodeUpdatesInfo = modelObject.nodeUpdatesInfo as { [key: string]: unknown };
		const copyCutPasteEnablementInfo = ((!forContextMenu ? modelObject : modelObject.contextmenu) as { [key: string]: unknown })
			.nodeUpdatesInfo as {
			[key: string]: unknown;
		};
		const dataModelsrc = (!forContextMenu ? modelObject : modelObject.contextmenu) as { [key: string]: unknown };
		const cutableContexts = (dataModelsrc.updatableContexts as Context[]).filter(
			(context) =>
				TableRuntime.checkIfNodeIsMovable(context, table) && (!checkDraftInstance || context.getProperty("HasDraftEntity") !== true)
		);
		const copyableContexts = (dataModelsrc.selectedContexts as Context[]).filter((context) =>
			TableRuntime.checkIfNodeIsCopyable(context, table)
		);
		copyCutPasteEnablementInfo.cutEnablement = cutableContexts.length === 1;
		copyCutPasteEnablementInfo.copyEnablement = copyableContexts.length === 1;

		if (nodeUpdatesInfo.lastAction && (nodeUpdatesInfo.pastableContexts as Context[]).length > 0) {
			let contextsforPastableEnablement: Context[];
			const extensionPoint =
				nodeUpdatesInfo.lastAction === "Cut"
					? tableDefinition.control.isMoveToPositionAllowed
					: tableDefinition.control.isCopyToPositionAllowed;

			//remove contexts depending of the custom function
			if (extensionPoint) {
				contextsforPastableEnablement = [...(dataModelsrc.selectedContexts as Context[])].filter(
					(targetContext) =>
						(
							FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
								extensionPoint.moduleName,
								extensionPoint.methodName,
								table
							) as Function
						)((nodeUpdatesInfo.pastableContexts as Context[])[0], targetContext) //nodeUpdatesInfo.pastableContexts has been the last time the user pressed the cut/copy button
				);
			} else {
				contextsforPastableEnablement = [...(dataModelsrc.selectedContexts as Context[])];
			}

			//the paste cannot be done if several contexts are selected
			copyCutPasteEnablementInfo.pasteEnablement =
				(dataModelsrc.selectedContexts as Context[]).length <= 1 &&
				contextsforPastableEnablement.length === (dataModelsrc.selectedContexts as Context[]).length;
		}
	},

	/**
	 *  Updates the internal context to enable/disable the move up/move down buttons.
	 * @param modelObject
	 * @param table
	 * @param forContextMenu
	 */
	updateMoveUpDownEnablement: function (modelObject: { [key: string]: unknown }, table: Table, forContextMenu = false): void {
		const modelObjectPath = !forContextMenu ? modelObject : (modelObject.contextmenu as { [key: string]: unknown });
		const selectedContexts = modelObjectPath.selectedContexts as Context[];
		const tableDefinition = (table.getParent() as TableAPI).getTableDefinition();

		const changeSiblingForRootsSupported = tableDefinition.annotation.changeSiblingForRootsSupported;
		// Disable the move up/move down buttons if there are no selected contexts, if the table is not a TreeTable, or if the table is sorted
		if (
			selectedContexts.length !== 1 ||
			tableDefinition.control.type !== "TreeTable" ||
			table.getBindingContext("internal")?.getProperty("isSorted") === true ||
			(selectedContexts[0].getProperty("@$ui5.node.level") === 1 && !changeSiblingForRootsSupported) // Disable move up/down for roots
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
			modelObjectPath.singleContextMovableUp =
				movableDraft && customMovable && !outOfPlaceContext && movedContext.getSibling(-1) !== null;
			modelObjectPath.singleContextMovableDown =
				movableDraft && customMovable && !outOfPlaceContext && movedContext.getSibling(1) !== null;
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
	_updateCreateEnablement: function (
		internalContext: InternalModelContext,
		createEnablementCallback: { moduleName: string; methodName: string },
		table: Table,
		parentContext: Context | null,
		nodeTypeParameters?: { propertyName: string; values: { value: string }[] },
		forContextMenu = false
	): void {
		let possibleValues: (string | undefined)[];
		if (nodeTypeParameters !== undefined) {
			// Push all possible values in the menu
			possibleValues = nodeTypeParameters.values.map((option) => option.value);
		} else {
			// No menu --> Only 'undefined' value that corresponds to the 'Create' button
			possibleValues = [undefined];
		}

		const enablementFunction = FPMHelper.getCustomFunction<(nodeType: string | undefined, parentContext: Context | null) => boolean>(
			createEnablementCallback.moduleName,
			createEnablementCallback.methodName,
			table
		);

		if (!enablementFunction) {
			return;
		}
		const enabledFlags = possibleValues.map((value) => {
			let enabled = false;
			try {
				enabled = !!(enablementFunction(value, parentContext) ?? true);
			} catch (_error) {
				enabled = true;
			}
			return enabled;
		});
		// enableFlags[i] is true <=> possibleValues[i] is allowed for creation

		const enablementMap: Record<string, boolean> = {};
		enablementMap["Create"] = enabledFlags.some((flag) => flag); // Enable the Menu (or the button) if at least one option is possible
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
	clearSelection: function (table: Table): void {
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
		const tableAPI = table.getParent() as TableAPI;
		if (tableAPI.tableDefinition.control.createEnablement) {
			this._updateCreateEnablement(
				internalModelContext as InternalModelContext,
				tableAPI.tableDefinition.control.createEnablement,
				table,
				null,
				tableAPI.tableDefinition.control.nodeType
			);
		}
	},

	disableAction: function (aActionsMultiselectDisabled: string[], oDynamicActions: Record<string, { bEnabled?: boolean }>): void {
		aActionsMultiselectDisabled.forEach(function (sAction: string) {
			oDynamicActions[sAction] = { bEnabled: false };
		});
	},
	onFieldChangeInCreationRow: function (
		oEvent: Field$ChangeEvent & UI5Event<{ isValid: boolean }>,
		withCustomValidationFunction: boolean
	): void {
		// CREATION ROW CASE
		const mField = FieldRuntimeHelper.getFieldStateOnChange(oEvent),
			oSourceField = mField.field,
			sFieldId = oSourceField.getId();

		const oInternalModelContext = oSourceField.getBindingContext("internal") as InternalModelContext,
			mFieldValidity = oInternalModelContext.getProperty("creationRowFieldValidity"),
			mNewFieldValidity = Object.assign({}, mFieldValidity);

		mNewFieldValidity[sFieldId] = mField.state;
		oInternalModelContext.setProperty("creationRowFieldValidity", mNewFieldValidity);

		// prepare Custom Validation
		if (withCustomValidationFunction) {
			const mCustomValidity = oInternalModelContext.getProperty("creationRowCustomValidity"),
				mNewCustomValidity = Object.assign({}, mCustomValidity);
			mNewCustomValidity[oSourceField.getBinding("value")!.getPath()] = {
				fieldId: oSourceField.getId()
			};
			oInternalModelContext.setProperty("creationRowCustomValidity", mNewCustomValidity);
			// Remove existing CustomValidation message
			const sTarget = `${oSourceField.getBindingContext()?.getPath()}/${oSourceField.getBindingPath("value")}`;
			Messaging.getMessageModel()
				.getData()
				.forEach(function (oMessage: Message) {
					if (oMessage.getTargets()[0] === sTarget) {
						Messaging.removeMessages(oMessage);
					}
				});
		}
	},
	onTreeTableContextChanged: function (event: UI5Event, initialExpansionLevel?: number): void {
		// When the context of a TreeTable changes, we want to restore its expansion state to the default:
		//   - all expanded if there's a search parameter coming from the filterBar
		//   - otherwise initial expansion state coming from the PV (stored in the payload)
		//   - otherwise no expansion at all

		const source = event.getSource();
		const table = source as Table;
		const tableAPI = table.getParent() as TableAPI;
		const rowBinding = table.getRowBinding();
		if (!rowBinding?.getContext() || tableAPI.getIgnoreContextChangeEvent()) {
			// The table is not bound, or we're in the middle of switching between normal and fullscreen, so we don't want to change the expansion state
			return;
		}

		const aggregation: {
			aggregate?: object;
			expandTo?: number;
			grandTotalAtBottomOnly?: boolean;
			group?: object;
			groupLevels?: string[];
			hierarchyQualifier?: string;
			search?: string;
			subtotalsAtBottomOnly?: boolean;
		} = rowBinding.getAggregation() ?? {};
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
	onCreateMenuItemPress: async function (event: UI5Event<{}, MenuItem>, valueIndex: number, selectedContexts: Context[]): Promise<void> {
		const mdcTable = FPMHelper.getMdcTable(event.getSource());
		const tableAPI = mdcTable?.getParent() as TableAPI | undefined;

		// Some checks to be on the safe side
		if (!tableAPI || !mdcTable) {
			return;
		}
		const nodeType = tableAPI.tableDefinition.control.nodeType;
		if (!nodeType) {
			return;
		}

		const view = CommonUtils.getTargetView(tableAPI);
		const creationData: Record<string, string> = {};
		creationData[nodeType.propertyName] = nodeType.values[valueIndex].value;

		const creationParameters: {
			creationMode: string;
			selectedContexts?: Context[];
			tableId?: string;
			creationDialogFields?: string[];
			data?: object;
		} = {
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

		view.getController()
			.editFlow.createDocument(tableAPI.getRowBinding(), creationParameters)
			.catch((error) => {
				Log.error(`Failed to create new document: ${error}`);
			});
	},

	/**
	 * Called when the 'Create' button is pressed, or the 'Create' command invoked.
	 * @param event
	 * @param selectedContexts The selected contexts in the table for this 'Create' button
	 */
	onCreateButtonPress: async function (event: UI5Event, selectedContexts?: Context[]): Promise<void> {
		const mdcTable = FPMHelper.getMdcTable(event.getSource());
		const tableAPI = mdcTable?.getParent() as TableAPI | undefined;

		// Some checks to be on the safe side
		if (!tableAPI || !mdcTable) {
			return;
		}

		const creationParameters: {
			createAtEnd?: boolean;
			creationMode: string;
			outbound?: string;
			creationRow?: CreationRow;
			selectedContexts?: Context[];
			tableId?: string;
			creationDialogFields?: string[];
		} = { creationMode: tableAPI.tableDefinition.annotation.create.mode };

		switch (creationParameters.creationMode) {
			case CreationMode.External:
				creationParameters.outbound = (tableAPI.tableDefinition.annotation.create as CreateBehaviorExternal).outbound;
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
			view.getController()
				.editFlow.createEmptyRowsAndFocus(mdcTable)
				.catch((error) => {
					Log.error(`Failed to create new empty row: ${error}`);
				});
		} else {
			view.getController()
				.editFlow.createDocument(tableAPI.getRowBinding(), creationParameters)
				.catch((error) => {
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
	setIntentBasedNavigationEnablement: function (
		internalModelContext: InternalModelContext,
		navigationAvailableMap: string[],
		selectedContexts: Context[],
		forContextMenu = false
	): void {
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
			internalModelContext
				.getModel()
				.setProperty(`${internalModelContext.getPath()}/ibn/${sKey}/${notApplicableProperty}`, aNotApplicable);
		}
	},

	/**
	 * Called when a context menu item is pressed.
	 * @param event
	 */
	onContextMenuItemSelected: function (event: UI5Event): void {
		const mdcTable = FPMHelper.getMdcTable(event.getSource());
		const tableAPI = mdcTable?.getParent() as TableAPI | undefined;

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
	dataStateIndicatorFilter: function (message: Message, control: Control): boolean {
		const tableAPI = control.getParent() as TableAPI;
		return tableAPI.dataStateIndicatorFilter(message, control);
	}
};

export default TableRuntime;
