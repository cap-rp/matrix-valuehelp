/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/designtime/AnnotationBasedChanges", "sap/ui/fl/write/api/FeaturesAPI"], function (AnnotationBasedChanges, FeaturesAPI) {
  "use strict";

  var getTextArrangementChangeAction = AnnotationBasedChanges.getTextArrangementChangeAction;
  var getTargetPropertyFromFormElement = AnnotationBasedChanges.getTargetPropertyFromFormElement;
  var getRenameAction = AnnotationBasedChanges.getRenameAction;
  return {
    actions: {
      annotation: control => {
        let renameOption;
        const targetPropertyPath = getTargetPropertyFromFormElement(control);
        if (targetPropertyPath && FeaturesAPI.areAnnotationChangesEnabled()) {
          renameOption = getRenameAction(true);
        }
        const returnOptions = {
          textArrangement: getTextArrangementChangeAction()
        };
        if (renameOption) {
          returnOptions.rename = renameOption;
        }
        return returnOptions;
      },
      rename: control => {
        const targetPropertyPath = getTargetPropertyFromFormElement(control);
        if (targetPropertyPath && FeaturesAPI.areAnnotationChangesEnabled()) {
          return undefined;
        }
        return {
          changeType: "renameField",
          domRef: function (oControl) {
            return oControl.getLabelControl()?.getDomRef();
          }
        };
      }
    }
  };
}, false);
//# sourceMappingURL=FormElement-dbg.designtime.js.map
