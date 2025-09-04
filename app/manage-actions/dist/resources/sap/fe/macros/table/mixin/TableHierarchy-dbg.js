/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/FPMHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/MessageToast", "../TableRuntime"], function (Log, CommonUtils, BusyLocker, MetaModelConverter, FPMHelper, ResourceModelHelper, MessageToast, TableRuntime) {
  "use strict";

  var _exports = {};
  var DropPosition = /*#__PURE__*/function (DropPosition) {
    DropPosition["On"] = "On";
    DropPosition["Between"] = "Between";
    DropPosition["OnOrBetween"] = "OnOrBetween";
    return DropPosition;
  }(DropPosition || {});
  let TableHierarchy = /*#__PURE__*/function () {
    function TableHierarchy() {}
    _exports = TableHierarchy;
    var _proto = TableHierarchy.prototype;
    _proto.setupMixin = function setupMixin(_baseClass) {
      // This method is needed to implement interface IInterfaceWithMixin
    }

    /**
     * Handles the Cut/Copy operation.
     * @param evt The UI5 event
     * @param forContextMenu
     */;
    _proto._onCopyCut = function _onCopyCut(evt, forContextMenu, action) {
      let table;
      if (!forContextMenu) {
        table = evt.getSource().getParent();
      } else {
        const menu = evt.getSource().getParent();
        table = menu.getParent()?.getParent();
      }
      const internalContext = table.getBindingContext("internal");
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
     */;
    _proto._onDragEnterDocument = function _onDragEnterDocument(ui5Event) {
      const draggedContext = ui5Event.getParameter("dragSource");
      if (this.getContent().getRowBinding() !== draggedContext.getBinding()) {
        // The drag is done on a different table -> not authorized
        ui5Event.preventDefault();
        return;
      }
      const targetContext = ui5Event.getParameter("bindingContext");
      if (draggedContext.isAncestorOf(targetContext)) {
        // The ancestor is dropped on a descendant -> not authorized
        ui5Event.preventDefault();
        return;
      }
      let disabledBetween = false;
      let disabledOn = false;
      const tableDefinition = this.getTableDefinition();
      const isMoveAllowedInfo = tableDefinition.control.isMoveToPositionAllowed;
      const customFunction = isMoveAllowedInfo ? FPMHelper.getCustomFunction(isMoveAllowedInfo.moduleName, isMoveAllowedInfo.methodName, ui5Event.getSource().getParent()) : undefined;
      if (targetContext === this.getContent().getBindingContext()) {
        // The drag is done on the table itself -> drop as root node)
        disabledOn = !this.safeIsMoveAllowed(customFunction, draggedContext, null);
        disabledBetween = true;
      } else {
        disabledOn = !this.safeIsMoveAllowed(customFunction, draggedContext, targetContext);
        disabledBetween = tableDefinition.annotation.allowDropBetweenNodes !== true;
        if (Math.abs(targetContext.getIndex() - draggedContext.getIndex()) === 1 && !(targetContext.getIndex() === 0 && ui5Event.getParameter("dropPosition") === "Before") && !(targetContext.getIndex() === this.getContent().getRowBinding().getLength() - 1 && ui5Event.getParameter("dropPosition") === "After")) {
          //
          disabledBetween = true;
        }

        // If the drop between node is allowed, we need to check if the target is a root node and if the table supports changeSiblingForRoots
        if (!disabledBetween && !tableDefinition.annotation.changeSiblingForRootsSupported && targetContext.getProperty("@$ui5.node.level") === 1) {
          disabledBetween = true;
        }

        // Check custom logic for drop between if there's some, and if it's not already disabled at the table level
        if (customFunction && !disabledBetween) {
          disabledBetween = !this.isDropBetweenAllowedForDrag(customFunction, draggedContext, targetContext);
        }
      }
      let allowedDropPosition = DropPosition.OnOrBetween;
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
     */;
    _proto._onDragStartDocument = function _onDragStartDocument(ui5Event) {
      const context = ui5Event.getParameter("bindingContext");
      const updatablePropertyPath = this.getTableDefinition().annotation.updatablePropertyPath;

      // Check if the context can be updated according to update restrictions
      let disableDrag = !!updatablePropertyPath && !context.getProperty(updatablePropertyPath);

      // In case of a TreeTable in a ListReport with draft, check that the context has no associated draft
      if (!disableDrag && !context.getBinding().isRelative()) {
        disableDrag = context.getProperty("HasDraftEntity") === true;
      }

      // Apply custom logic if there's one
      const isMovableInfo = this.getTableDefinition().control.isNodeMovable;
      try {
        if (isMovableInfo && !disableDrag) {
          disableDrag = FPMHelper.getCustomFunction(isMovableInfo.moduleName, isMovableInfo.methodName, ui5Event.getSource())(context) === false;
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
     */;
    _proto._onDropDocument = async function _onDropDocument(ui5Event) {
      BusyLocker.lock(this.getContent());
      try {
        const droppedOnContext = ui5Event.getParameter("bindingContext");
        let dropInfo;
        if (droppedOnContext === this.getContent().getBindingContext()) {
          // The drop is done on the table itself -> drop as root node)
          dropInfo = {
            position: DropPosition.On,
            parentContext: null
          };
        } else if (ui5Event.getParameter("dropPosition") === DropPosition.On) {
          // Drop on a node
          dropInfo = {
            position: DropPosition.On,
            parentContext: droppedOnContext
          };
        } else {
          // Drop between 2 nodes
          let contextBefore;
          let contextAfter;
          if (ui5Event.getParameter("dropPosition") === "After") {
            contextBefore = droppedOnContext;
            contextAfter = this.getContextAfter(droppedOnContext);
          } else {
            contextBefore = this.getContextBefore(droppedOnContext);
            contextAfter = droppedOnContext;
          }
          dropInfo = {
            position: DropPosition.Between,
            contextAfter,
            contextBefore
          };
        }
        const movedContext = ui5Event.getParameter("dragSource");
        await Promise.all([this.dropContext(movedContext, dropInfo), this.requestSideEffectsForChangeNextSiblingAction(movedContext)]);
      } catch (error) {
        MessageToast.show(this.getTranslatedText("M_TABLEDROP_FAILED", [error.message ?? ""]));
      } finally {
        BusyLocker.unlock(this.getContent());
      }
    }

    /**
     * Handler for collapse/expand from the context menu.
     * @param this
     * @param _ui5Event
     * @param expand
     */;
    _proto._onCollapseExpandNode = async function _onCollapseExpandNode(_ui5Event, expand) {
      const selectedContexts = this.getSelectedContexts();
      if (expand) {
        const promiseArray = selectedContexts.map(async singleContext => {
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
        await Promise.all(selectedContexts.map(async singleContext => {
          if (singleContext.isExpanded() === true) {
            return singleContext.collapse(true);
          }
        }));
      }
    }

    /**
     * Internal method to move a row up or down in a Tree table.
     * @param _ui5Event
     * @param moveUp True for move up, false for move down
     * @param forContextMenu
     */;
    _proto._onMoveUpDown = async function _onMoveUpDown(_ui5Event, moveUp) {
      let forContextMenu = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
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
          movePromise = movedContext.move({
            nextSibling: previousSibling,
            parent: parentContext
          });
          contextMoved = true;
        }
      } else {
        const nextSibling = await movedContext.requestSibling(1);
        if (nextSibling) {
          movePromise = nextSibling.move({
            nextSibling: movedContext,
            parent: parentContext
          });
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
     */;
    _proto.requestSideEffectsForChangeNextSiblingAction = async function requestSideEffectsForChangeNextSiblingAction(movedContext) {
      return this._requestSideEffectsForHierarchyActions(movedContext, "ChangeNextSiblingAction");
    }

    /**
     * Requests the side effect for the CopyAction.
     * @param movedContext The context that has been moved
     * @returns A Promise
     */;
    _proto.requestSideEffectsForCopyAction = async function requestSideEffectsForCopyAction(movedContext) {
      return this._requestSideEffectsForHierarchyActions(movedContext, "CopyAction");
    }

    /**
     * Requests the side effect for the CopyAction or ChangeNextSiblingAction.
     * @param movedContext The context that has been moved
     * @param action
     * @returns A Promise
     */;
    _proto._requestSideEffectsForHierarchyActions = async function _requestSideEffectsForHierarchyActions(movedContext, action) {
      const entityPath = this.getContent().data("metaPath");
      const metaModel = movedContext.getModel().getMetaModel();
      const targetObject = metaModel.getContext(entityPath);
      const convertMetaModelContext = MetaModelConverter.convertMetaModelContext(targetObject);
      const entityType = convertMetaModelContext.targetType ?? convertMetaModelContext.entityType;
      const actionName = entityType.annotations.Hierarchy?.[`RecursiveHierarchyActions#${this.getTableDefinition().control.hierarchyQualifier ?? ""}`]?.[action];
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
     */;
    _proto.safeIsMoveAllowed = function safeIsMoveAllowed(customFunction, movedContext, parentContext) {
      if (!customFunction) {
        return true;
      }
      let allowed = true;
      try {
        allowed = customFunction(movedContext, parentContext) === true;
      } catch (error) {
        Log.error("Cannot execute function related to isMoveToPositionAllowed", error);
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
     */;
    _proto.isDropBetweenAllowedForDrag = function isDropBetweenAllowedForDrag(customFunction, draggedContext, targetContext) {
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
          isAllowed = this.safeIsMoveAllowed(customFunction, draggedContext, paramsBefore.parent) || this.safeIsMoveAllowed(customFunction, draggedContext, paramsAfter.parent);
        }
      }
      return isAllowed;
    }

    /**
     * Returns the context that is placed before a given context in a ListBinding.
     * @param context
     * @returns The context before, or null
     */;
    _proto.getContextBefore = function getContextBefore(context) {
      const contextIndex = context.getIndex();
      if (contextIndex === undefined) {
        throw new Error("Unexpected error");
      }
      const listBinding = context.getBinding();
      return contextIndex === 0 ? null : listBinding.getAllCurrentContexts().find(ctx => {
        return ctx.getIndex() === contextIndex - 1;
      }) ?? null;
    }

    /**
     * Returns the context that is placed after a given context in a ListBinding.
     * @param context
     * @returns The context after, or null
     */;
    _proto.getContextAfter = function getContextAfter(context) {
      const contextIndex = context.getIndex();
      if (contextIndex === undefined) {
        throw new Error("Unexpected error");
      }
      const listBinding = context.getBinding();
      return listBinding.getAllCurrentContexts().find(ctx => {
        return ctx.getIndex() === contextIndex + 1;
      }) ?? null;
    }

    /**
     * Returns information to perform a drop between 2 nodes: the new parent and the next sibling.
     * @param contextBefore Context after which the drop is done
     * @param parentBefore Parent of contextBefore (undefined if not known)
     * @param contextAfter Context before which the drop is done
     * @param parentAfter Parent of contextAfter (undefined if not known)
     * @returns The new parent and the next sibling, or undefined if it cannot be determined
     */;
    _proto.getDropBetweenParameters = function getDropBetweenParameters(contextBefore, parentBefore, contextAfter, parentAfter) {
      if (contextBefore === null) {
        // Drop before first node --> move as first root node
        return {
          parent: null,
          nextSibling: contextAfter
        };
      } else if (contextAfter === null) {
        // Drop after last node --> move as next sibling of the last node
        return parentBefore !== undefined ? {
          parent: parentBefore,
          nextSibling: null
        } : undefined;
      } else if (parentAfter === contextBefore) {
        // Drop between a parent and its first child --> move as first child of the parent
        return {
          parent: contextBefore,
          nextSibling: contextAfter
        };
      } else if (parentBefore === undefined || parentAfter === undefined) {
        // If one of the parent is not known, we don't know what to do
        return undefined;
      } else if (parentBefore === parentAfter) {
        // Drop between 2 siblings
        return {
          parent: parentBefore,
          nextSibling: contextAfter
        };
      } else {
        // NodeX
        //  ....
        //     |-- contextBefore
        // contextAfter
        // --> Move as the next sibling of contextBefore
        return {
          parent: parentBefore,
          nextSibling: null
        };
      }
    }

    /**
     * Internal method to drop a context on or between 2 nodes.
     * @param context
     * @param info
     * @returns The move Promise
     */;
    _proto.dropContext = async function dropContext(context, info) {
      const isMoveAllowedInfo = this.getTableDefinition().control.isMoveToPositionAllowed;
      const customFunction = isMoveAllowedInfo ? FPMHelper.getCustomFunction(isMoveAllowedInfo.moduleName, isMoveAllowedInfo.methodName, this.getContent()) : undefined;
      const internalModelContext = this.getContent().getBindingContext("internal");
      const isTableSorted = internalModelContext.getProperty("isSorted") === true;
      const moveContext = async (parent, nextSibling) => {
        // We check if the move is allowed by custom logic (if any), as this check might
        // not have been done in onDragEnterDocument if the parent was not loaded yet.
        if (this.safeIsMoveAllowed(customFunction, context, parent)) {
          // If the table is sorted, we ignore the sibling as the position shall be determined by the server
          return context.move({
            parent,
            nextSibling: isTableSorted ? undefined : nextSibling
          });
        } else {
          MessageToast.show(this.getTranslatedText("M_TABLE_DROP_NOT_ALLOWED"));
        }
      };
      if (info.position === DropPosition.On) {
        // Drop on a node
        return moveContext(info.parentContext);
      } else {
        // Drop between 2 nodes
        const [parentBefore, parentAfter] = await Promise.all([info.contextBefore?.requestParent() ?? null, info.contextAfter?.requestParent() ?? null]);
        const params = this.getDropBetweenParameters(info.contextBefore, parentBefore, info.contextAfter, parentAfter);
        return moveContext(params.parent, params.nextSibling);
      }
    };
    return TableHierarchy;
  }();
  _exports = TableHierarchy;
  return _exports;
}, false);
//# sourceMappingURL=TableHierarchy-dbg.js.map
