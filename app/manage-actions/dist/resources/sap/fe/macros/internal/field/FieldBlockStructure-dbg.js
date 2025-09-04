/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/field/FieldFormatOptions", "../../Field", "sap/fe/base/jsx-runtime/jsx"], function (StableIdHelper, FieldFormatOptions, Field, _jsx) {
  "use strict";

  var _exports = {};
  var generate = StableIdHelper.generate;
  function createField(field, id) {
    return _jsx(Field, {
      "core:require": "{TableAPI: 'sap/fe/macros/table/TableAPI'}",
      change: field.change,
      liveChange: field.onLiveChange,
      focusin: ".collaborativeDraft.handleContentFocusIn",
      id: id || field.id,
      _flexId: field._flexId,
      idPrefix: field.idPrefix,
      vhIdPrefix: field.vhIdPrefix,
      contextPath: field.contextPath?.getPath(),
      metaPath: field.metaPath.getPath(),
      metaModel: field.metaModel,
      navigateAfterAction: field.navigateAfterAction,
      editMode: field.editMode ?? field.computedEditMode,
      wrap: field.wrap,
      class: field.class,
      ariaLabelledBy: field.ariaLabelledBy,
      textAlign: field.textAlign,
      semanticObject: field.semanticObject,
      showErrorObjectStatus: field.showErrorObjectStatus,
      readOnly: field.readOnly,
      value: field.value,
      description: field.description,
      required: field.requiredExpression,
      editable: field.editableExpression,
      collaborationEnabled: field.collaborationEnabled,
      visible: field.visible,
      mainPropertyRelativePath: field.mainPropertyRelativePath,
      customValueBinding: field.value?.slice(0, 1) === "{" ? field.value : undefined // we don't need the customValueBinding set if field.value is not a binding as this is only used to enable binding refreshes
      ,
      children: {
        formatOptions: new FieldFormatOptions(field.formatOptions).serialize()
      }
    });
  }
  function getTemplateWithField(field) {
    let id;
    if (field._apiId) {
      id = field._apiId;
    } else if (field.idPrefix) {
      id = generate([field.idPrefix, "Field"]);
    } else if (field.id) {
      id = field.id;
    } else {
      id = undefined;
    }
    if (field.change === null || field.change === "null") {
      field.change = undefined;
    }
    return createField(field, id);
  }
  _exports.getTemplateWithField = getTemplateWithField;
  return _exports;
}, false);
//# sourceMappingURL=FieldBlockStructure-dbg.js.map
