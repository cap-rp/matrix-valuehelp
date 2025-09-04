/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/DataModelPathHelper", "../../../helpers/StableIdHelper", "../../ManifestSettings", "../../helpers/ConfigurableObject", "../../helpers/DataFieldHelper", "../../helpers/ID", "../../helpers/Key"], function (BindingToolkit, DataField, TypeGuards, DataModelPathHelper, StableIdHelper, ManifestSettings, ConfigurableObject, DataFieldHelper, ID, Key) {
  "use strict";

  var _exports = {};
  var KeyHelper = Key.KeyHelper;
  var getFormStandardActionButtonID = ID.getFormStandardActionButtonID;
  var getFormID = ID.getFormID;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var ActionType = ManifestSettings.ActionType;
  var createIdForAnnotation = StableIdHelper.createIdForAnnotation;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getTargetEntitySetPath = DataModelPathHelper.getTargetEntitySetPath;
  var isSingleton = TypeGuards.isSingleton;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  var pathInModel = BindingToolkit.pathInModel;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  let FormElementType = /*#__PURE__*/function (FormElementType) {
    FormElementType["Default"] = "Default";
    FormElementType["Slot"] = "Slot";
    FormElementType["Annotation"] = "Annotation";
    return FormElementType;
  }({});
  _exports.FormElementType = FormElementType;
  /**
   * Returns default format options for text fields on a form.
   * @returns Collection of format options with default values
   */
  function getDefaultFormatOptionsForForm() {
    return {
      textLinesEdit: 4
    };
  }
  function isFieldPartOfPreview(field, formPartOfPreview) {
    // Both each form and field can have the PartOfPreview annotation. Only if the form is not hidden (not partOfPreview) we allow toggling on field level
    return formPartOfPreview?.valueOf() === false || field.annotations?.UI?.PartOfPreview === undefined || field.annotations?.UI?.PartOfPreview.valueOf() === true;
  }
  function getFormElementsFromAnnotations(facetDefinition, converterContext) {
    const formElements = [];
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const formAnnotation = resolvedTarget.annotation;
    converterContext = resolvedTarget.converterContext;
    function getDataFieldsFromAnnotations(field, formPartOfPreview) {
      const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, field);
      if (field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForAction" && field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && field.$Type !== "com.sap.vocabularies.UI.v1.DataFieldForActionGroup" && !isReferencePropertyStaticallyHidden(field)) {
        const formElement = {
          key: KeyHelper.generateKeyFromDataField(field),
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(field.fullyQualifiedName)}/`,
          semanticObjectPath: semanticObjectAnnotationPath,
          formatOptions: getDefaultFormatOptionsForForm(),
          isPartOfPreview: isFieldPartOfPreview(field, formPartOfPreview)
        };
        if (field.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && field.Target.$target?.$Type === "com.sap.vocabularies.UI.v1.ConnectedFieldsType") {
          const connectedFields = Object.values(field.Target.$target.Data).filter(connectedField => connectedField?.hasOwnProperty("Value"));
          formElement.connectedFields = connectedFields.map(connnectedFieldElement => {
            return {
              semanticObjectPath: getSemanticObjectPath(converterContext, connnectedFieldElement)
            };
          });
        }
        formElements.push(formElement);
      }
    }
    switch (formAnnotation?.term) {
      case "com.sap.vocabularies.UI.v1.FieldGroup":
        formAnnotation.Data.forEach(field => getDataFieldsFromAnnotations(field, facetDefinition.annotations?.UI?.PartOfPreview));
        break;
      case "com.sap.vocabularies.UI.v1.Identification":
        formAnnotation.forEach(field => getDataFieldsFromAnnotations(field, facetDefinition.annotations?.UI?.PartOfPreview));
        break;
      case "com.sap.vocabularies.UI.v1.DataPoint":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `DataPoint::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.UI.v1.InputMask":
        formElements.push({
          key: `MaskedInput::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.Common.v1.Masked":
        formElements.push({
          key: `Masked::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      case "com.sap.vocabularies.Communication.v1.Contact":
        formElements.push({
          // key: KeyHelper.generateKeyFromDataField(formAnnotation),
          key: `Contact::${formAnnotation.qualifier ? formAnnotation.qualifier : ""}`,
          type: FormElementType.Annotation,
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(formAnnotation.fullyQualifiedName)}/`
        });
        break;
      default:
        break;
    }
    return formElements;
  }
  function getFormElementsFromManifest(facetDefinition, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const manifestFormContainer = manifestWrapper.getFormContainer(facetDefinition.Target.value);
    const formElements = {};
    if (manifestFormContainer?.fields) {
      Object.keys(manifestFormContainer?.fields).forEach(fieldId => {
        formElements[fieldId] = {
          key: fieldId,
          id: `CustomFormElement::${fieldId}`,
          type: manifestFormContainer.fields[fieldId].type || FormElementType.Default,
          template: manifestFormContainer.fields[fieldId].template,
          propertyPath: manifestFormContainer.fields[fieldId]?.property,
          label: converterContext.fetchTextFromMetaModel(manifestFormContainer.fields[fieldId].label),
          position: manifestFormContainer.fields[fieldId].position || {
            placement: Placement.After
          },
          formatOptions: {
            ...getDefaultFormatOptionsForForm(),
            ...manifestFormContainer.fields[fieldId].formatOptions
          },
          ...(manifestFormContainer.fields[fieldId].readOnly !== undefined && {
            readOnly: manifestFormContainer.fields[fieldId].readOnly
          }),
          ...(manifestFormContainer.fields[fieldId].semanticObject !== undefined && {
            semanticObject: manifestFormContainer.fields[fieldId].semanticObject
          })
        };
      });
    }
    return formElements;
  }
  _exports.getFormElementsFromManifest = getFormElementsFromManifest;
  function getFormContainer(facetDefinition, converterContext, actions, additionalSettings) {
    const sFormContainerId = createIdForAnnotation(facetDefinition);
    const sAnnotationPath = converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName);
    const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
    const isVisible = compileExpression(not(equal(true, getExpressionFromAnnotation(facetDefinition.annotations?.UI?.Hidden))));
    let sEntitySetPath;
    // resolvedTarget doesn't have a entitySet in case Containments and Paramterized services.
    const entitySet = resolvedTarget.converterContext.getEntitySet();
    const dataModelObjectPathTarget = resolvedTarget.converterContext.getDataModelObjectPath().targetObject;
    if (entitySet && entitySet !== converterContext.getEntitySet()) {
      sEntitySetPath = getTargetEntitySetPath(resolvedTarget.converterContext.getDataModelObjectPath());
    } else if (isNavigationProperty(dataModelObjectPathTarget) && dataModelObjectPathTarget?.containsTarget === true) {
      sEntitySetPath = getTargetObjectPath(resolvedTarget.converterContext.getDataModelObjectPath(), false);
    } else if (entitySet && !sEntitySetPath && isSingleton(entitySet)) {
      sEntitySetPath = entitySet.fullyQualifiedName;
    } else if (!entitySet && isNavigationProperty(dataModelObjectPathTarget) && dataModelObjectPathTarget?.containsTarget === false) {
      sEntitySetPath = getTargetObjectPath(resolvedTarget.converterContext.getDataModelObjectPath(), false);
    }
    const aFormElements = insertCustomElements(getFormElementsFromAnnotations(facetDefinition, converterContext), getFormElementsFromManifest(facetDefinition, converterContext), {
      formatOptions: OverrideType.overwrite,
      readOnly: OverrideType.overwrite,
      semanticObject: OverrideType.overwrite
    });
    actions = actions !== undefined ? actions.filter(action => action.facetName == facetDefinition.fullyQualifiedName) : [];
    if (actions.length === 0) {
      actions = undefined;
    }
    const oActionShowDetails = {
      id: getFormStandardActionButtonID(sFormContainerId, "ShowHideDetails"),
      key: "StandardAction::ShowHideDetails",
      text: compileExpression(ifElse(equal(pathInModel("showDetails", "internal"), true), pathInModel("T_COMMON_OBJECT_PAGE_HIDE_FORM_CONTAINER_DETAILS", "sap.fe.i18n"), pathInModel("T_COMMON_OBJECT_PAGE_SHOW_FORM_CONTAINER_DETAILS", "sap.fe.i18n"))),
      type: ActionType.ShowFormDetails,
      press: "FormContainerRuntime.toggleDetails"
    };
    if (facetDefinition.annotations?.UI?.PartOfPreview?.valueOf() !== false && aFormElements.some(oFormElement => oFormElement.isPartOfPreview === false)) {
      if (actions !== undefined) {
        actions.push(oActionShowDetails);
      } else {
        actions = [oActionShowDetails];
      }
    }
    return {
      id: sFormContainerId,
      formElements: aFormElements,
      annotationPath: sAnnotationPath,
      isVisible: isVisible,
      entitySet: sEntitySetPath,
      actions: actions,
      useSingleTextAreaFieldAsNotes: additionalSettings?.useSingleTextAreaFieldAsNotes,
      annotationHidden: facetDefinition.annotations?.UI?.Hidden ? true : false
    };
  }
  _exports.getFormContainer = getFormContainer;
  function getFormContainersForCollection(facetDefinition, converterContext, actions, additionalSettings) {
    const formContainers = [];
    const formContainerSettings = {
      useSingleTextAreaFieldAsNotes: additionalSettings?.useSingleTextAreaFieldAsNotes
    };
    facetDefinition.Facets?.forEach(facet => {
      // Ignore level 3 collection facet
      if (facet.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
        return;
      }
      formContainers.push(getFormContainer(facet, converterContext, actions, formContainerSettings));
    });
    return formContainers;
  }
  function isReferenceFacet(facetDefinition) {
    return facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet";
  }
  _exports.isReferenceFacet = isReferenceFacet;
  function createFormDefinition(facetDefinition, isVisible, converterContext, actions, additionalSettings) {
    switch (facetDefinition?.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        // Keep only valid children
        return {
          id: getFormID(facetDefinition),
          useFormContainerLabels: true,
          hasFacetsNotPartOfPreview: facetDefinition.Facets.some(childFacet => childFacet.annotations?.UI?.PartOfPreview?.valueOf() === false),
          formContainers: getFormContainersForCollection(facetDefinition, converterContext, actions, additionalSettings),
          isVisible: isVisible
        };
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        return {
          id: getFormID(facetDefinition),
          useFormContainerLabels: false,
          hasFacetsNotPartOfPreview: facetDefinition.annotations?.UI?.PartOfPreview?.valueOf() === false,
          formContainers: [getFormContainer(facetDefinition, converterContext, actions, additionalSettings)],
          isVisible: isVisible
        };
      default:
        throw new Error("Cannot create form based on ReferenceURLFacet");
    }
  }
  _exports.createFormDefinition = createFormDefinition;
  return _exports;
}, false);
//# sourceMappingURL=Form-dbg.js.map
