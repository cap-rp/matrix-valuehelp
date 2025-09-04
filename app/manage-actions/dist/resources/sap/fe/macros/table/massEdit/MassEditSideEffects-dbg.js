/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/table/TableHelper"], function (CommonUtils, MetaModelConverter, TypeGuards, DataModelPathHelper, TableHelper) {
  "use strict";

  var _exports = {};
  var getTargetEntitySetInfo = DataModelPathHelper.getTargetEntitySetInfo;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var isProperty = TypeGuards.isProperty;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  let MassEditSideEffects = /*#__PURE__*/function () {
    function MassEditSideEffects(massEditDialog) {
      this.immediateActionExecution = new Set();
      this.massEditDialog = massEditDialog;
      this.massEditDialog = massEditDialog;
      this.referenceRowContext = massEditDialog.contexts[0];
      this.table = massEditDialog.table;
      this.view = CommonUtils.getTargetView(this.table);
      this.sideEffectsDefinition = this.generateSideEffectsDefinition();
    }

    /**
     * Manages the refresh of the description
     * When a field is changed and this field has a text arrangement annotation, then description must be updated by the SideEffect
     * if no SideEffect is configured to refresh the entire table (named genericField).
     * @param fieldControl The field
     * @param context The row context
     * @param groupId The batch group id
     * @returns Promise related to the SideEffects.
     */
    _exports = MassEditSideEffects;
    var _proto = MassEditSideEffects.prototype;
    _proto.refreshDescription = async function refreshDescription(fieldControl, context, groupId) {
      const propertyPath = fieldControl.properties.descriptionPath;
      if (propertyPath && !this.sideEffectsDefinition["genericField"]) {
        return CommonUtils.getAppComponent(this.table).getSideEffectsService().requestSideEffects(propertyPath.includes("/") ? [{
          $NavigationPropertyPath: propertyPath.substring(0, propertyPath.lastIndexOf("/"))
        }] : [propertyPath], context, groupId);
      }
    }

    /**
     * Generates the SideEffects execution definition
     * This dictionary is used by the dialog to execute immediate and deferred SideEffects on the relevant contexts.
     * @returns The SideEffects execution properties.
     */;
    _proto.generateSideEffectsDefinition = function generateSideEffectsDefinition() {
      const sideEffectsMap = this.getSideEffectsMap();
      const sideEffectsDefinition = {};
      const tableDefinition = this.table.getParent().getTableDefinition();
      const view = CommonUtils.getTargetView(this.table);
      for (const key in sideEffectsMap) {
        const keySideEffects = sideEffectsMap[key];
        for (const sideEffectsName in keySideEffects) {
          const sideEffectsProperties = keySideEffects[sideEffectsName];
          const sideEffectsEntityType = sideEffectsName.split("#")[0];
          const sideEffectsContext = view.getController()._sideEffects.getContextForSideEffects(this.referenceRowContext, sideEffectsEntityType);
          if (sideEffectsContext) {
            const massSideEffectsProperties = this.getSpecificTargetsAndActions(sideEffectsProperties.sideEffects, sideEffectsContext, this.table.getModel().getMetaModel().getContext(tableDefinition.annotation.collection), CommonUtils.getAppComponent(this.table).getSideEffectsService());
            const massSideEffectsExecutionProperties = {
              ...massSideEffectsProperties,
              ...{
                onRowContext: this.referenceRowContext === sideEffectsContext
              }
            };
            sideEffectsDefinition[key] = sideEffectsDefinition[key] || [];
            sideEffectsDefinition[key].push(massSideEffectsExecutionProperties);
            if (!sideEffectsDefinition["genericField"] && massSideEffectsProperties.tableRefresh.isRequested) {
              sideEffectsDefinition["genericField"] = [massSideEffectsExecutionProperties];
            }
          }
        }
      }
      return sideEffectsDefinition;
    }

    /**
     * Gets the SideEffects information
     *  This information is
     * - immediateTargets: contains the immediate targets which must be executed on each row
     * - isImmediateTriggerAction: is the action is immediate or deferred
     * - isRequestingTableEntityRefresh: is the refresh is requested on the table entity by a TargetEntity
     * - tableTargetEntity: the target entity which requests the refresh on the table.
     * @param oDataSideEffect The SideEffect
     * @param sideEffectsContext The context where the SideEffects is executed
     * @param entitySetContext  The entitySet context of the dialog
     * @param sideEffectsService The SideEffects service
     * @returns The SideEffects information.
     */;
    _proto.getSideEffectsInformation = function getSideEffectsInformation(oDataSideEffect, sideEffectsContext, entitySetContext, sideEffectsService) {
      const metaModel = entitySetContext.getModel();
      const targetProperties = oDataSideEffect.targetProperties ?? [];
      const targetEntities = oDataSideEffect.targetEntities ?? [];
      const actionName = !sideEffectsService.isControlSideEffects(oDataSideEffect) ? oDataSideEffect.triggerAction : undefined;
      let immediateTargets = [];
      const entitySetDataModelPath = getInvolvedDataModelObjects(entitySetContext);
      const sideEffectsDataModelPath = getInvolvedDataModelObjects(metaModel.getContext(metaModel.getMetaPath(sideEffectsContext.getPath())));
      const {
        parentEntitySet
      } = getTargetEntitySetInfo(entitySetDataModelPath);
      let isRequestingTableEntityRefresh = false;
      let tableTargetEntity;
      immediateTargets = targetEntities.reduce((entities, targetEntity) => {
        const target = sideEffectsDataModelPath.targetEntityType.resolvePath(targetEntity.$NavigationPropertyPath);
        if (isNavigationProperty(target)) {
          if (target.targetType == entitySetDataModelPath.targetEntityType) {
            //The refresh is requested on the table entity
            isRequestingTableEntityRefresh = true;
            tableTargetEntity = targetEntity;
            return entities;
          }
          if (sideEffectsDataModelPath.targetEntityType === parentEntitySet?.entityType) {
            // The side effects context is the parent entity (the entitySet of the view)
            return entities;
          }
          if (target.targetType !== parentEntitySet?.entityType) {
            //The refresh is not requested on the parent entity (the entitySet of the view)
            entities.push(targetEntity);
          }
        }
        return entities;
      }, []);
      for (const targetProperty of targetProperties) {
        const propertyDataModelPath = enhanceDataModelPath(sideEffectsDataModelPath, targetProperty);
        if (isProperty(propertyDataModelPath.targetObject) || targetProperty === "*") {
          // if target entity is not from the parent
          if (parentEntitySet?.entityType !== propertyDataModelPath.targetEntityType) {
            immediateTargets.push(targetProperty);
          }
        }
      }
      // if entity is other than items table then action is deferred or the static action is on collection
      const isImmediateTriggerAction = !!actionName && sideEffectsDataModelPath.targetEntityType === entitySetDataModelPath.targetEntityType && !TableHelper._isStaticAction(metaModel.getObject(`/${actionName}`), actionName);
      return {
        immediateTargets,
        isImmediateTriggerAction,
        isRequestingTableEntityRefresh,
        tableTargetEntity
      };
    }

    /**
     * Gets the properties of the SideEffects
     * These properties are
     * - tableRefresh: is the whole table is refreshed by the SideEffects
     * - immediate: contains the immediate targets and action. They are immediate when these properties must be executed
     * on each row
     * - deferred: contains the deferred targets and action. They are deferred when these properties must be executed
     * only once even if multiple rows has been processed.
     * @param oDataSideEffect The SideEffect
     * @param sideEffectsContext The context where the SideEffects is executed
     * @param entitySetContext  The entitySet context of the dialog
     * @param sideEffectsService The SideEffects service
     * @returns The SideEffects properties.
     */;
    _proto.getSpecificTargetsAndActions = function getSpecificTargetsAndActions(oDataSideEffect, sideEffectsContext, entitySetContext, sideEffectsService) {
      const sideEffectsInformation = this.getSideEffectsInformation(oDataSideEffect, sideEffectsContext, entitySetContext, sideEffectsService);
      const actionName = !sideEffectsService.isControlSideEffects(oDataSideEffect) ? oDataSideEffect.triggerAction : undefined;
      const deferredTargets = [...(oDataSideEffect.targetProperties ?? []), ...(oDataSideEffect.targetEntities ?? [])].filter(target => !sideEffectsInformation.immediateTargets.includes(target) && target !== sideEffectsInformation.tableTargetEntity);
      return {
        sideEffects: oDataSideEffect,
        tableRefresh: {
          isRequested: sideEffectsInformation.isRequestingTableEntityRefresh,
          targetEntity: sideEffectsInformation.tableTargetEntity
        },
        immediate: {
          targets: sideEffectsInformation.isRequestingTableEntityRefresh ? [] : sideEffectsInformation.immediateTargets,
          triggerAction: sideEffectsInformation.isImmediateTriggerAction ? actionName : undefined
        },
        deferred: {
          targets: deferredTargets,
          triggerAction: !sideEffectsInformation.isImmediateTriggerAction ? actionName : undefined
        }
      };
    }

    /**
     * Generates the side effects map according to the fields into the dialog.
     * @returns The SideEffects map.
     */;
    _proto.getSideEffectsMap = function getSideEffectsMap() {
      const model = this.table.getModel(),
        metaModel = model.getMetaModel(),
        metaPath = metaModel.getMetaPath(this.massEditDialog.bindingContext.getPath()),
        entitySetContext = metaModel.getContext(metaPath);
      const entitySetDataModelPath = getInvolvedDataModelObjects(entitySetContext);
      const baseSideEffectsMapArray = {};
      const appComponent = CommonUtils.getAppComponent(this.view);
      const properties = this.massEditDialog.fieldProperties.filter(field => field.visible).map(property => [property.propertyInfo.relativePath, property.propertyInfo.unitOrCurrencyPropertyPath]).flat().filter(property => !!property);
      for (const property of properties) {
        const propertyDataModel = enhanceDataModelPath(entitySetDataModelPath, property);
        const fieldGroupIds = appComponent.getSideEffectsService().computeFieldGroupIds(entitySetDataModelPath.targetEntityType.fullyQualifiedName, propertyDataModel.targetObject.fullyQualifiedName) ?? [];
        baseSideEffectsMapArray[property] = this.view.getController()._sideEffects.getSideEffectsMapForFieldGroups(fieldGroupIds);
      }
      return baseSideEffectsMapArray;
    }

    /**
     * Executes the immediate SideEffects.
     * These sideEffects are
     * - The ones registered as immediate into the SideEffects dictionary
     * - The previous failed SideEffects on the row context or view bindingContext.
     * If there are any generic SideEffects (sideEffects which refresh the whole table) stored in the SideEffects
     * dictionary, the targets of all immediate SideEffects are ignored (no need to execute them since the table
     * is going to be refreshed by the generic SideEffects).
     * @param rowContext The context of the row
     * @param field  The property name of the field
     * @param groupId The groupId for the batch request
     * @returns A promise containing all SideEffects requests
     */;
    _proto.executeImmediateSideEffects = async function executeImmediateSideEffects(rowContext, field, groupId) {
      const sideEffectsPromises = [];
      const controller = this.view.getController();
      //Execute the SideEffects defined into the annotations
      for (const sideEffectsProperties of (this.sideEffectsDefinition[field] ?? []).filter(sideEffects => sideEffects.immediate.targets.length || sideEffects.immediate.triggerAction)) {
        const context = sideEffectsProperties.onRowContext ? rowContext : controller._sideEffects.getContextForSideEffects(rowContext, sideEffectsProperties.sideEffects.fullyQualifiedName.split("@")[0]);
        if (context) {
          const action = sideEffectsProperties.immediate.triggerAction;
          const contextPath = context.getPath();
          sideEffectsPromises.push(controller._sideEffects.requestSideEffects(sideEffectsProperties.sideEffects, context, groupId, () => {
            let isActionAlreadyTriggered = false;
            if (action) {
              isActionAlreadyTriggered = this.immediateActionExecution.has(`${contextPath}_${action}`);
              this.immediateActionExecution.add(`${contextPath}_${action}`);
            }
            return {
              targets: this.sideEffectsDefinition["genericField"] ? [] : sideEffectsProperties.immediate.targets,
              triggerAction: action && !isActionAlreadyTriggered ? sideEffectsProperties.immediate.triggerAction : undefined
            };
          }));
          controller._sideEffects.unregisterFailedSideEffects(sideEffectsProperties.sideEffects.fullyQualifiedName, context);
        }
      }

      //Execute the previous failed SideEffects requests
      const allFailedSideEffects = controller._sideEffects.getRegisteredFailedRequests();
      for (const context of [rowContext, this.view.getBindingContext()]) {
        if (context) {
          const contextPath = context.getPath();
          const failedSideEffects = allFailedSideEffects[contextPath] ?? [];
          controller._sideEffects.unregisterFailedSideEffectsForAContext(contextPath);
          for (const failedSideEffect of failedSideEffects) {
            sideEffectsPromises.push(controller._sideEffects.requestSideEffects(failedSideEffect, context));
          }
        }
      }
      return Promise.allSettled(sideEffectsPromises);
    }

    /**
     * Executes the deferred SideEffects
     * These sideEffects are
     * - The ones registered as deferred into the SideEffects dictionary
     * - The one registered as generic since the whole table is refreshed.
     * @param updatedFields All the updated fields by the MassEdit
     */;
    _proto.executeDeferredSideEffects = function executeDeferredSideEffects(updatedFields) {
      const genericSideEffects = this.sideEffectsDefinition["genericField"]?.[0];
      const genericTargetEntity = genericSideEffects?.tableRefresh.targetEntity;
      const sideEffectsExecuted = new Set();
      const controller = this.view.getController();
      for (const sourceProperty of Object.keys(this.sideEffectsDefinition).filter(propertyName => updatedFields.has(propertyName))) {
        for (const sideEffectsProperties of this.sideEffectsDefinition[sourceProperty].filter(sideEffects => sideEffects.deferred.targets.length || sideEffects.deferred.triggerAction)) {
          const context = sideEffectsProperties.onRowContext ? this.referenceRowContext : controller._sideEffects.getContextForSideEffects(this.referenceRowContext, sideEffectsProperties.sideEffects.fullyQualifiedName.split("@")[0]);
          if (context && !sideEffectsExecuted.has(sideEffectsProperties.sideEffects.fullyQualifiedName)) {
            sideEffectsExecuted.add(sideEffectsProperties.sideEffects.fullyQualifiedName);
            controller._sideEffects.requestSideEffects(sideEffectsProperties.sideEffects, context, "$auto.massEditDeferred", () => {
              return {
                targets: genericTargetEntity ? sideEffectsProperties.deferred.targets.filter(target => typeof target === "string" || target !== genericTargetEntity) : sideEffectsProperties.deferred.targets,
                triggerAction: sideEffectsProperties.deferred.triggerAction
              };
            });
          }
        }
      }
      if (genericSideEffects && genericTargetEntity) {
        const context = controller._sideEffects.getContextForSideEffects(this.referenceRowContext, genericSideEffects.sideEffects.fullyQualifiedName.split("@")[0]);
        if (context) {
          controller._sideEffects.requestSideEffects(genericSideEffects.sideEffects, context, "$auto.massEditDeferred", () => {
            return {
              targets: [genericTargetEntity],
              triggerAction: undefined
            };
          });
        }
      }
    };
    return MassEditSideEffects;
  }();
  _exports = MassEditSideEffects;
  return _exports;
}, false);
//# sourceMappingURL=MassEditSideEffects-dbg.js.map
