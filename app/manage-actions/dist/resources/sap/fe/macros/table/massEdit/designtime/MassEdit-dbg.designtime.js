/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/designtime/Designtime.helper", "sap/ui/core/Lib", "../../designtime/Table.designtime.helper", "./MassEditDesignDialog"], function (Designtime_helper, Library, Table_designtime_helper, MassEditDesignDialog) {
  "use strict";

  var getPropertyPath = Table_designtime_helper.getPropertyPath;
  var extractChanges = Designtime_helper.extractChanges;
  const massEditRtaPath = "rta/massEditConfigSettings/visibleFields";
  const MassEditDesignTime = {
    actions: {
      rename: () => null,
      // Remove the rename action of the sap.m.dialog
      settings: {
        fe: {
          name: Library.getResourceBundleFor("sap.fe.macros").getText("C_MASS_EDIT_DESIGN_CONFIGURATION"),
          icon: "sap-icon://developer-settings",
          /**
           * Handles the changes for the mass edit configuration.
           * @param dialog The dialog that is opened
           * @returns The changes
           */
          handler: async dialog => {
            let element = dialog;
            while (element && !element.isA("sap.fe.macros.table.TableAPI")) {
              element = element.getParent();
            }
            const massEditDialogHelper = element?.getMassEditDialogHelper();
            if (!element || !massEditDialogHelper) {
              return [];
            }
            try {
              const configContext = element.getBindingContext("internal");
              const rtaSelectedItems = configContext.getProperty(massEditRtaPath);
              const originalFields = rtaSelectedItems ?? massEditDialogHelper.getFieldProperties().map(field => field.propertyInfo.relativePath).join(",");
              const result = await new MassEditDesignDialog(element).openDialog(dialog, originalFields);
              const isChangeObserved = result !== originalFields;
              const initialIgnoredFields = element.getTableDefinition().control.massEdit.ignoredFields.join(",");
              if (isChangeObserved) {
                configContext.setProperty(massEditRtaPath, result);
              }
              return extractChanges([{
                id: "visibleFields",
                name: "visible fields",
                description: "Visible fields for the mass edit dialog",
                type: "string",
                value: originalFields
              }, {
                id: "ignoredFields",
                name: "ignored fields",
                description: "Ignored fields for the mass edit dialog",
                type: "string",
                value: initialIgnoredFields
              }], {
                visibleFields: originalFields,
                ignoredFields: initialIgnoredFields
              }, {
                visibleFields: result,
                ignoredFields: !isChangeObserved ? initialIgnoredFields : ""
              }, `${getPropertyPath(element)}/enableMassEdit`, element.getContent());
            } catch (error) {
              return [];
            }
          }
        }
      }
    },
    properties: {},
    aggregations: {}
  };
  return MassEditDesignTime;
}, false);
//# sourceMappingURL=MassEdit-dbg.designtime.js.map
