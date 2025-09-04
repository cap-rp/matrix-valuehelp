/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/ui/mdc/field/FieldBaseDelegate", "sap/ui/mdc/field/MultiValueFieldDelegate"], function (CommonUtils, FieldBaseDelegate, MdcMultiValueFieldDelegate) {
  "use strict";

  return Object.assign({}, MdcMultiValueFieldDelegate, {
    /**
     * Determines the description for a given key.
     * @param field The <code>Field</code> instance
     * @param valueHelp Field help assigned to the <code>Field</code> or <code>FilterField</code> control
     * @param key Key value of the description
     * @param _conditionIn In parameters for the key (no longer supported)
     * @param _conditionOut Out parameters for the key (no longer supported)
     * @param bindingContext BindingContext <code>BindingContext</code> of the checked field. Inside a table, the <code>ValueHelp</code> element can be connected to a different row
     * @param _ConditionModel ConditionModel</code>, if bound to one
     * @param _conditionModelName Name of the <code>ConditionModel</code>, if bound to one
     * @param conditionPayload Additional context information for this key
     * @param control Instance of the calling control
     * @param type Type of the value
     * @returns Description for the key or object containing a description, key and payload. If the description is not available right away (it must be requested), a <code>Promise</code> is returned
     */
    getDescription: function (field, valueHelp, key, _conditionIn, _conditionOut, bindingContext, _ConditionModel, _conditionModelName, conditionPayload, control, type) {
      if (key === undefined || key === null) {
        return;
      }
      return FieldBaseDelegate.getDescription(field, valueHelp, key, _conditionIn, _conditionOut, bindingContext, undefined, undefined, conditionPayload, control, type);
    },
    /**
     * Implements the model-specific logic to update items after conditions have been updated.
     * Items can be removed, updated, or added. Use the binding information of the `MultiValueField` control
     * to update the data in the model.
     * @param _payload Additional context information for this key
     * @param conditions Current conditions
     * @param control Instance of the calling control
     * @returns Promise is returned
     */
    updateItems: async function (_payload, conditions, control) {
      const listBinding = control.getBinding("items");
      const isJsonListBinding = listBinding.isA("sap.ui.model.json.JSONListBinding");
      const isODataListBinding = listBinding.isA("sap.ui.model.odata.v4.ODataListBinding");
      const bindingInfo = control.getBindingInfo("items");
      // check if conditions are added, removed or changed
      const keyBindingInfo = bindingInfo.template.getBindingInfo("key");
      const descriptionBindingInfo = bindingInfo.template.getBindingInfo("description");
      const keyPath = keyBindingInfo && keyBindingInfo.parts[0].path;
      const descriptionPath = descriptionBindingInfo && descriptionBindingInfo.parts && descriptionBindingInfo.parts[0] && descriptionBindingInfo.parts[0].path;
      if (isODataListBinding) {
        await this._updateItemsInODataListBinding(listBinding, conditions, control, keyPath, descriptionPath);
      } else if (isJsonListBinding) {
        this._updateItemsInJsonListBinding(conditions, control, keyPath, descriptionPath);
      }
    },
    /**
     * Updates the items in an OData list binding.
     * @param listBinding
     * @param conditions
     * @param control
     * @param keyPath
     * @param descriptionPath
     * @returns Promise containing all the update promises
     */
    _updateItemsInODataListBinding: async function (listBinding, conditions, control, keyPath, descriptionPath) {
      const contexts = listBinding.getCurrentContexts();
      const dataToAdd = [];
      const controller = CommonUtils.getTargetView(control).getController();

      // Contexts to delete
      const newKeys = conditions.map(function (condition) {
        return condition.values[0];
      });
      const oldKeys = contexts.map(function (context) {
        return context.getProperty(keyPath);
      });
      const modificationPromises = [];
      for (let i = 0; i < contexts.length; i++) {
        const deleteContext = contexts[i];
        if (!newKeys.includes(deleteContext.getProperty(keyPath))) {
          modificationPromises.push(controller.editFlow.deleteMultipleDocuments([deleteContext], {
            controlId: control.getId(),
            noDialog: true
          }));
        }
      }
      // data to add
      for (const condition of conditions) {
        if (!oldKeys.includes(condition.values[0])) {
          const item = {};
          if (keyPath && !keyPath.includes("/")) {
            // we do not manage to create on a sub entity of the 1:n navigation
            item[keyPath] = condition.values[0];
            if (descriptionPath && !descriptionPath.includes("/") && descriptionPath !== keyPath) {
              item[descriptionPath] = condition.values[1];
            }
            dataToAdd.push(item);
          }
        }
      }
      if (dataToAdd.length) {
        modificationPromises.push(controller.editFlow.createMultipleDocuments(listBinding, dataToAdd, true, false));
      }
      return Promise.all(modificationPromises);
    },
    /**
     * Updates the items in a JSON list binding.
     * @param conditions
     * @param control
     * @param keyPath
     * @param descriptionPath
     */
    _updateItemsInJsonListBinding: function (conditions, control, keyPath, descriptionPath) {
      const customDataValue = control.getCustomData().find(cdv => cdv.getKey() === "forwardedItemsBinding");
      const values = customDataValue?.getValue();
      //clean all entries to keep array reference
      values.splice(0);
      for (const condition of conditions) {
        const item = {};
        item[keyPath] = condition.values[0];
        if (condition.values[1]) {
          item[descriptionPath] = condition.values[1];
        }
        values.push(item);
      }
      const modelNameForUpdate = customDataValue?.getBindingInfo("value")?.parts[0]?.model;
      customDataValue?.getModel(modelNameForUpdate)?.updateBindings(true);
    }
  });
}, false);
//# sourceMappingURL=MultiValueFieldDelegate-dbg.js.map
