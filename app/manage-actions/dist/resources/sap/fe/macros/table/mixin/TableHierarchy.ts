import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import BusyLocker from "sap/fe/core/controllerextensions/BusyLocker";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import { type InternalModelContext } from "sap/fe/core/helpers/ModelHelper";
import ResourceModelHelper from "sap/fe/core/helpers/ResourceModelHelper";
import type Menu from "sap/m/Menu";
import MessageToast from "sap/m/MessageToast";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";
import type DragDropInfo from "sap/ui/core/dnd/DragDropInfo";
import type MDCTable from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import { type ITableBlock } from "../TableAPI";
import TableRuntime from "../TableRuntime";

enum DropPosition {
	On = "On",
	Between = "Between",
	OnOrBetween = "OnOrBetween"
}

type DropInformation =
	| { position: DropPosition.On; parentContext: Context | null }
	| { position: DropPosition.Between; contextBefore: Context | null; contextAfter: Context | null };

export default class TableHierarchy implements IInterfaceWithMixin {
	setupMixin(_baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
	}

	/**
	 * Handles the Cut/Copy operation.
	 * @param evt The UI5 event
	 * @param forContextMenu
	 */
	_onCopyCut(this: ITableBlock & TableHierarchy, evt: UI5Event<{}, UI5Element>, forContextMenu: boolean, action: "Copy" | "Cut"): void {
		let table: MDCTable;
		if (!forContextMenu) {
			table = evt.getSource().getParent() as MDCTable;
		} else {
			const menu = evt.getSource().getParent() as Menu;
			table = menu.getParent()?.getParent() as MDCTable;
		}
		const internalContext = table.getBindingContext("internal") as InternalModelContext;
		const selectedContexts = this.getSelectedContexts();
		if (selectedContexts.length > 1) {
			Log.error(`Multi ${action === "Cut" ? "cutting" : "copying"} is not supported`);
			return;
		}

		internalContext.setProperty("nodeUpdatesInfo/pastableContexts", selectedContexts);
		internalContext.setProperty("nodeUpdatesInfo/lastAction", action);
		MessageToast.show(ResourceModelHelper.getResourceModel(table).getText("M_CUTCOPY_READY"));
		if (!forContextMenu || internalContext.getProperty("numberOfSelectedContexts") > 0) {
			TableRuntime.clearSelection(table);
			table.fireSelectionChange();
		}

		internalContext.setProperty("nodeUpdatesInfo/cutEnablement", false);
		internalContext.setProperty("contextmenu/nodeUpdatesInfo/cutEnablement", false);
		internalContext.setProperty("nodeUpdatesInfo/copyEnablement", false);
		internalContext.setProperty("contextmenu/nodeUpdatesInfo/copyEnablement", false);
	}

	/**
	 * The dragged element enters a table row.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	_onDragEnterDocument(
		this: ITableBlock & TableHierarchy,
		ui5Event: UI5Event<{ bindingContext: Context; dragSource: Context; dropPosition: "Before" | "After" | "On" }, DragDropInfo>
	): void {
		const draggedContext = ui5Event.getParameter("dragSource");
		if (this.getContent().getRowBinding() !== draggedContext.getBinding()) {
			// The drag is done on a different table -> not authorized
			ui5Event.preventDefault();
			return;
		}

		const targetContext: Context | null = ui5Event.getParameter("bindingContext");
		if (draggedContext.isAncestorOf(targetContext)) {
			// The ancestor is dropped on a descendant -> not authorized
			ui5Event.preventDefault();
			return;
		}

		let disabledBetween = false;
		let disabledOn = false;
		const tableDefinition = this.getTableDefinition();
		const isMoveAllowedInfo = tableDefinition.control.isMoveToPositionAllowed;
		const customFunction = isMoveAllowedInfo
			? FPMHelper.getCustomFunction<(node: Context, parent: Context | null) => boolean>(
					isMoveAllowedInfo.moduleName,
					isMoveAllowedInfo.methodName,
					ui5Event.getSource().getParent() as Control
			  )
			: undefined;

		if (targetContext === this.getContent().getBindingContext()) {
			// The drag is done on the table itself -> drop as root node)
			disabledOn = !this.safeIsMoveAllowed(customFunction, draggedContext, null);
			disabledBetween = true;
		} else {
			disabledOn = !this.safeIsMoveAllowed(customFunction, draggedContext, targetContext);
			disabledBetween = tableDefinition.annotation.allowDropBetweenNodes !== true;

			if (
				Math.abs(targetContext.getIndex()! - draggedContext.getIndex()!) === 1 &&
				!(targetContext.getIndex() === 0 && ui5Event.getParameter("dropPosition") === "Before") &&
				!(
					targetContext.getIndex() === this.getContent().getRowBinding().getLength() - 1 &&
					ui5Event.getParameter("dropPosition") === "After"
				)
			) {
				//
				disabledBetween = true;
			}

			// If the drop between node is allowed, we need to check if the target is a root node and if the table supports changeSiblingForRoots
			if (
				!disabledBetween &&
				!tableDefinition.annotation.changeSiblingForRootsSupported &&
				targetContext.getProperty("@$ui5.node.level") === 1
			) {
				disabledBetween = true;
			}

			// Check custom logic for drop between if there's some, and if it's not already disabled at the table level
			if (customFunction && !disabledBetween) {
				disabledBetween = !this.isDropBetweenAllowedForDrag(customFunction, draggedContext, targetContext);
			}
		}

		let allowedDropPosition: DropPosition = DropPosition.OnOrBetween;
		if (disabledBetween && disabledOn) {
			//Set the element as non droppable
			ui5Event.preventDefault();
			return;
		}
		if (disabledBetween) {
			allowedDropPosition = DropPosition.On;
		} else if (disabledOn) {
			allowedDropPosition = DropPosition.Between;
		}
		ui5Event.getSource().setDropPosition(allowedDropPosition);
	}

	/**
	 * Starts the drag of the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 */
	_onDragStartDocument(this: ITableBlock & TableHierarchy, ui5Event: UI5Event<{ bindingContext: Context }, Control>): void {
		const context = ui5Event.getParameter("bindingContext");
		const updatablePropertyPath = this.getTableDefinition().annotation.updatablePropertyPath;

		// Check if the context can be updated according to update restrictions
		let disableDrag = !!updatablePropertyPath && !context.getProperty(updatablePropertyPath);

		// In case of a TreeTable in a ListReport with draft, check that the context has no associated draft
		if (!disableDrag && !(context.getBinding() as ODataListBinding).isRelative()) {
			disableDrag = context.getProperty("HasDraftEntity") === true;
		}

		// Apply custom logic if there's one
		const isMovableInfo = this.getTableDefinition().control.isNodeMovable;
		try {
			if (isMovableInfo && !disableDrag) {
				disableDrag =
					(
						FPMHelper.getCustomFunction<(contexts: Context[]) => boolean>(
							isMovableInfo.moduleName,
							isMovableInfo.methodName,
							ui5Event.getSource()
						) as Function
					)(context) === false;
			}
		} catch (_error) {
			disableDrag = false;
		}
		if (disableDrag) {
			//Set the element as non draggable
			ui5Event.preventDefault();
		}
	}

	/**
	 * Drops the document.
	 * @param ui5Event UI5 event coming from the MDC drag and drop config
	 * @returns The Promise
	 */
	async _onDropDocument(
		this: ITableBlock & TableHierarchy,
		ui5Event: UI5Event<{
			bindingContext: Context;
			dragSource: Context;
			dropPosition: string;
		}>
	): Promise<void> {
		BusyLocker.lock(this.getContent());

		try {
			const droppedOnContext = ui5Event.getParameter("bindingContext");
			let dropInfo: DropInformation;
			if (droppedOnContext === this.getContent().getBindingContext()) {
				// The drop is done on the table itself -> drop as root node)
				dropInfo = { position: DropPosition.On, parentContext: null };
			} else if (ui5Event.getParameter("dropPosition") === DropPosition.On) {
				// Drop on a node
				dropInfo = { position: DropPosition.On, parentContext: droppedOnContext };
			} else {
				// Drop between 2 nodes
				let contextBefore: Context | null;
				let contextAfter: Context | null;
				if (ui5Event.getParameter("dropPosition") === "After") {
					contextBefore = droppedOnContext;
					contextAfter = this.getContextAfter(droppedOnContext);
				} else {
					contextBefore = this.getContextBefore(droppedOnContext);
					contextAfter = droppedOnContext;
				}
				dropInfo = { position: DropPosition.Between, contextAfter, contextBefore };
			}

			const movedContext = ui5Event.getParameter("dragSource");
			await Promise.all([this.dropContext(movedContext, dropInfo), this.requestSideEffectsForChangeNextSiblingAction(movedContext)]);
		} catch (error) {
			MessageToast.show(this.getTranslatedText("M_TABLEDROP_FAILED", [(error as Error).message ?? ""]));
		} finally {
			BusyLocker.unlock(this.getContent());
		}
	}

	/**
	 * Handler for collapse/expand from the context menu.
	 * @param this
	 * @param _ui5Event
	 * @param expand
	 */
	async _onCollapseExpandNode(this: ITableBlock & TableHierarchy, _ui5Event: UI5Event, expand: boolean): Promise<void> {
		const selectedContexts = this.getSelectedContexts();
		if (expand) {
			const promiseArray = selectedContexts.map(async (singleContext: Context) => {
				// Checking for false specifically; undefined means the node cannot expand/collapse
				if (singleContext.isExpanded() !== undefined) {
					// Temporary workaround due to model limitation.
					// We need to collapse a node before expanding it to ensure we expand it completely.
					// Will be changed once the model fixes the issue.
					if (singleContext.isExpanded() === true) {
						await singleContext.collapse();
					}
					return singleContext.expand(Number.MAX_SAFE_INTEGER);
				}
			});
			await Promise.all(promiseArray);
		} else {
			await Promise.all(
				selectedContexts.map(async (singleContext: Context) => {
					if (singleContext.isExpanded() === true) {
						return singleContext.collapse(true);
					}
				})
			);
		}
	}

	/**
	 * Internal method to move a row up or down in a Tree table.
	 * @param _ui5Event
	 * @param moveUp True for move up, false for move down
	 * @param forContextMenu
	 */
	async _onMoveUpDown(this: ITableBlock & TableHierarchy, _ui5Event: UI5Event, moveUp: boolean, forContextMenu = false): Promise<void> {
		const selectedContexts = this.getSelectedContexts();
		if (selectedContexts.length !== 1) {
			return;
		}

		// Move the context up or down
		const movedContext = selectedContexts[0];
		const parentContext = await movedContext.requestParent();
		let contextMoved = false;
		let movePromise = null;
		if (moveUp) {
			const previousSibling = await movedContext.requestSibling(-1);
			if (previousSibling) {
				movePromise = movedContext.move({ nextSibling: previousSibling, parent: parentContext });
				contextMoved = true;
			}
		} else {
			const nextSibling = await movedContext.requestSibling(1);
			if (nextSibling) {
				movePromise = nextSibling.move({ nextSibling: movedContext, parent: parentContext });
				contextMoved = true;
			}
		}

		await Promise.all([movePromise, this.requestSideEffectsForChangeNextSiblingAction(movedContext)]);

		// Scroll to the new position
		const newIndex = movedContext.getIndex();
		if (contextMoved && newIndex !== undefined && newIndex >= 0) {
			const mdcTable = this.getContent();
			if (!forContextMenu) {
				mdcTable.scrollToIndex(newIndex);
			} else {
				mdcTable.focusRow(newIndex);
			}
		}
	}

	/**
	 * Requests the side effect for the ChangeNextSiblingAction.
	 * @param movedContext The context that has been moved
	 * @returns A Promise
	 */
	async requestSideEffectsForChangeNextSiblingAction(this: ITableBlock & TableHierarchy, movedContext: Context): Promise<void> {
		return this._requestSideEffectsForHierarchyActions(movedContext, "ChangeNextSiblingAction");
	}

	/**
	 * Requests the side effect for the CopyAction.
	 * @param movedContext The context that has been moved
	 * @returns A Promise
	 */
	async requestSideEffectsForCopyAction(this: ITableBlock & TableHierarchy, movedContext: Context): Promise<void> {
		return this._requestSideEffectsForHierarchyActions(movedContext, "CopyAction");
	}

	/**
	 * Requests the side effect for the CopyAction or ChangeNextSiblingAction.
	 * @param movedContext The context that has been moved
	 * @param action
	 * @returns A Promise
	 */
	async _requestSideEffectsForHierarchyActions(
		this: ITableBlock & TableHierarchy,
		movedContext: Context,
		action: "ChangeNextSiblingAction" | "CopyAction"
	): Promise<void> {
		const entityPath = this.getContent().data("metaPath");
		const metaModel = movedContext.getModel().getMetaModel();

		const targetObject = metaModel.getContext(entityPath);
		const convertMetaModelContext = MetaModelConverter.convertMetaModelContext(targetObject) as NavigationProperty | EntitySet;
		const entityType = (convertMetaModelContext as NavigationProperty).targetType ?? (convertMetaModelContext as EntitySet).entityType;
		const actionName = entityType.annotations.Hierarchy?.[
			`RecursiveHierarchyActions#${this.getTableDefinition().control.hierarchyQualifier ?? ""}`
		]?.[action] as string | undefined;

		if (actionName) {
			const appComponent = CommonUtils.getAppComponent(this.getContent());
			const sideEffectsService = appComponent.getSideEffectsService();
			const sideEffects = sideEffectsService.getODataActionSideEffects(actionName, movedContext);
			if (sideEffects) {
				await sideEffectsService.requestSideEffectsForODataAction(sideEffects, movedContext);
			}
		}
	}

	/**
	 * Safely checks if moving a node is allowed.
	 * @param customFunction
	 * @param movedContext
	 * @param parentContext
	 * @returns True if allowed
	 */
	private safeIsMoveAllowed(
		customFunction: ((context: Context, parent: Context | null) => boolean) | undefined,
		movedContext: Context,
		parentContext: Context | null
	): boolean {
		if (!customFunction) {
			return true;
		}

		let allowed = true;
		try {
			allowed = customFunction(movedContext, parentContext) === true;
		} catch (error) {
			Log.error("Cannot execute function related to isMoveToPositionAllowed", error as string);
			allowed = true;
		}

		return allowed;
	}

	/**
	 * Checks is drop "between" is allowed by custom logic for a given targetContext.
	 * @param customFunction
	 * @param draggedContext
	 * @param targetContext
	 * @returns True if allowed
	 */
	private isDropBetweenAllowedForDrag(
		customFunction: (context: Context, parent: Context | null) => boolean,
		draggedContext: Context,
		targetContext: Context
	): boolean {
		let isAllowed = true;

		// Determine what to do if we drop before targetContext
		const contextBefore = this.getContextBefore(targetContext);
		const parentBefore = contextBefore === null ? null : contextBefore.getParent();
		const paramsBefore = this.getDropBetweenParameters(contextBefore, parentBefore, targetContext, targetContext.getParent());

		// Determine what to do if we drop after targetContext
		const contextAfter = this.getContextAfter(targetContext);
		const parentAfter = contextAfter === null ? null : contextAfter.getParent();
		const paramsAfter = this.getDropBetweenParameters(targetContext, targetContext.getParent(), contextAfter, parentAfter);

		// If paramsBefore or paramsAfter cannot be determined (because parents are not loaded), we allow drop between and do the real check in onDropDocument
		if (paramsBefore !== undefined && paramsAfter !== undefined) {
			if (paramsBefore.parent === paramsAfter.parent) {
				// Dropping before or after will move under the same parent --> we call the custom logic only once
				isAllowed = this.safeIsMoveAllowed(customFunction, draggedContext, paramsBefore.parent);
			} else {
				// As the MDC table cannot disable drop before and after separately, we disable drop between only if both drop before and after are forbidden
				isAllowed =
					this.safeIsMoveAllowed(customFunction, draggedContext, paramsBefore.parent) ||
					this.safeIsMoveAllowed(customFunction, draggedContext, paramsAfter.parent);
			}
		}

		return isAllowed;
	}

	/**
	 * Returns the context that is placed before a given context in a ListBinding.
	 * @param context
	 * @returns The context before, or null
	 */
	private getContextBefore(context: Context): Context | null {
		const contextIndex = context.getIndex();
		if (contextIndex === undefined) {
			throw new Error("Unexpected error");
		}

		const listBinding = context.getBinding() as ODataListBinding;
		return contextIndex === 0
			? null
			: listBinding.getAllCurrentContexts().find((ctx) => {
					return ctx.getIndex() === contextIndex - 1;
			  }) ?? null;
	}

	/**
	 * Returns the context that is placed after a given context in a ListBinding.
	 * @param context
	 * @returns The context after, or null
	 */
	private getContextAfter(context: Context): Context | null {
		const contextIndex = context.getIndex();
		if (contextIndex === undefined) {
			throw new Error("Unexpected error");
		}

		const listBinding = context.getBinding() as ODataListBinding;
		return (
			listBinding.getAllCurrentContexts().find((ctx) => {
				return ctx.getIndex() === contextIndex + 1;
			}) ?? null
		);
	}

	/**
	 * Returns information to perform a drop between 2 nodes: the new parent and the next sibling.
	 * @param contextBefore Context after which the drop is done
	 * @param parentBefore Parent of contextBefore (undefined if not known)
	 * @param contextAfter Context before which the drop is done
	 * @param parentAfter Parent of contextAfter (undefined if not known)
	 * @returns The new parent and the next sibling, or undefined if it cannot be determined
	 */
	private getDropBetweenParameters(
		contextBefore: Context | null,
		parentBefore: Context | null | undefined,
		contextAfter: Context | null,
		parentAfter: Context | null | undefined
	): { parent: Context | null; nextSibling?: Context | null } | undefined {
		if (contextBefore === null) {
			// Drop before first node --> move as first root node
			return { parent: null, nextSibling: contextAfter };
		} else if (contextAfter === null) {
			// Drop after last node --> move as next sibling of the last node
			return parentBefore !== undefined ? { parent: parentBefore, nextSibling: null } : undefined;
		} else if (parentAfter === contextBefore) {
			// Drop between a parent and its first child --> move as first child of the parent
			return { parent: contextBefore, nextSibling: contextAfter };
		} else if (parentBefore === undefined || parentAfter === undefined) {
			// If one of the parent is not known, we don't know what to do
			return undefined;
		} else if (parentBefore === parentAfter) {
			// Drop between 2 siblings
			return { parent: parentBefore, nextSibling: contextAfter };
		} else {
			// NodeX
			//  ....
			//     |-- contextBefore
			// contextAfter
			// --> Move as the next sibling of contextBefore
			return { parent: parentBefore, nextSibling: null };
		}
	}

	/**
	 * Internal method to drop a context on or between 2 nodes.
	 * @param context
	 * @param info
	 * @returns The move Promise
	 */
	private async dropContext(this: ITableBlock & TableHierarchy, context: Context, info: DropInformation): Promise<void> {
		const isMoveAllowedInfo = this.getTableDefinition().control.isMoveToPositionAllowed;
		const customFunction = isMoveAllowedInfo
			? FPMHelper.getCustomFunction<(node: Context, parent: Context | null) => boolean>(
					isMoveAllowedInfo.moduleName,
					isMoveAllowedInfo.methodName,
					this.getContent()
			  )
			: undefined;
		const internalModelContext = this.getContent().getBindingContext("internal") as InternalModelContext;
		const isTableSorted = internalModelContext.getProperty("isSorted") === true;

		const moveContext = async (parent: Context | null, nextSibling?: Context | null): Promise<void> => {
			// We check if the move is allowed by custom logic (if any), as this check might
			// not have been done in onDragEnterDocument if the parent was not loaded yet.
			if (this.safeIsMoveAllowed(customFunction, context, parent)) {
				// If the table is sorted, we ignore the sibling as the position shall be determined by the server
				return context.move({ parent, nextSibling: isTableSorted ? undefined : nextSibling });
			} else {
				MessageToast.show(this.getTranslatedText("M_TABLE_DROP_NOT_ALLOWED"));
			}
		};

		if (info.position === DropPosition.On) {
			// Drop on a node
			return moveContext(info.parentContext);
		} else {
			// Drop between 2 nodes
			const [parentBefore, parentAfter] = await Promise.all([
				info.contextBefore?.requestParent() ?? null,
				info.contextAfter?.requestParent() ?? null
			]);
			const params = this.getDropBetweenParameters(info.contextBefore, parentBefore, info.contextAfter, parentAfter)!;
			return moveContext(params.parent, params.nextSibling);
		}
	}
}
