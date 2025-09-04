/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/ID", "sap/fe/core/converters/helpers/Key", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "../../../helpers/StableIdHelper", "../../helpers/DataFieldHelper", "../Common/Form"], function (BindingToolkit, DataField, ConfigurableObject, ID, Key, PropertyHelper, UIFormatters, StableIdHelper, DataFieldHelper, Form) {
  "use strict";

  var _exports = {};
  var getFormElementsFromManifest = Form.getFormElementsFromManifest;
  var FormElementType = Form.FormElementType;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var isAnnotationFieldStaticallyHidden = DataFieldHelper.isAnnotationFieldStaticallyHidden;
  var createIdForAnnotation = StableIdHelper.createIdForAnnotation;
  var isVisible = UIFormatters.isVisible;
  var isMultiLineText = PropertyHelper.isMultiLineText;
  var KeyHelper = Key.KeyHelper;
  var getHeaderFacetID = ID.getHeaderFacetID;
  var getHeaderFacetFormID = ID.getHeaderFacetFormID;
  var getHeaderFacetContainerID = ID.getHeaderFacetContainerID;
  var getCustomHeaderFacetID = ID.getCustomHeaderFacetID;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var getSemanticObjectPath = DataField.getSemanticObjectPath;
  var compileExpression = BindingToolkit.compileExpression;
  // region definitions
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Definitions: Header Facet Types, Generic OP Header Facet, Manifest Properties for Custom Header Facet
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  let HeaderFacetType = /*#__PURE__*/function (HeaderFacetType) {
    HeaderFacetType["Annotation"] = "Annotation";
    HeaderFacetType["XMLFragment"] = "XMLFragment";
    return HeaderFacetType;
  }({});
  _exports.HeaderFacetType = HeaderFacetType;
  let FacetType = /*#__PURE__*/function (FacetType) {
    FacetType["Reference"] = "Reference";
    FacetType["Collection"] = "Collection";
    return FacetType;
  }({});
  _exports.FacetType = FacetType;
  let FlexDesignTimeType = /*#__PURE__*/function (FlexDesignTimeType) {
    FlexDesignTimeType["Default"] = "Default";
    FlexDesignTimeType["NotAdaptable"] = "not-adaptable";
    // disable all actions on that instance
    FlexDesignTimeType["NotAdaptableTree"] = "not-adaptable-tree";
    // disable all actions on that instance and on all children of that instance
    FlexDesignTimeType["NotAdaptableVisibility"] = "not-adaptable-visibility"; // disable all actions that influence the visibility, namely reveal and remove
    return FlexDesignTimeType;
  }({});
  _exports.FlexDesignTimeType = FlexDesignTimeType;
  var HeaderDataPointType = /*#__PURE__*/function (HeaderDataPointType) {
    HeaderDataPointType["ProgressIndicator"] = "ProgressIndicator";
    HeaderDataPointType["RatingIndicator"] = "RatingIndicator";
    HeaderDataPointType["Content"] = "Content";
    return HeaderDataPointType;
  }(HeaderDataPointType || {});
  var TargetAnnotationType = /*#__PURE__*/function (TargetAnnotationType) {
    TargetAnnotationType["None"] = "None";
    TargetAnnotationType["DataPoint"] = "DataPoint";
    TargetAnnotationType["Chart"] = "Chart";
    TargetAnnotationType["Identification"] = "Identification";
    TargetAnnotationType["Contact"] = "Contact";
    TargetAnnotationType["Address"] = "Address";
    TargetAnnotationType["FieldGroup"] = "FieldGroup";
    TargetAnnotationType["PresentationVariant"] = "PresentationVariant";
    return TargetAnnotationType;
  }(TargetAnnotationType || {});
  // endregion definitions

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Collect All Header Facets: Custom (via Manifest) and Annotation Based (via Metamodel)
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Retrieve header facets from annotations.
   * @param converterContext
   * @returns Header facets from annotations
   */
  function getHeaderFacetsFromAnnotations(converterContext) {
    const headerFacets = [];
    converterContext.getEntityType().annotations?.UI?.HeaderFacets?.forEach(facet => {
      const headerFacet = createHeaderFacet(facet, converterContext);
      if (headerFacet) {
        headerFacets.push(headerFacet);
      }
    });
    return headerFacets;
  }

  /**
   * Retrieve custom header facets from manifest.
   * @param manifestCustomHeaderFacets
   * @returns HeaderFacets from manifest
   */
  _exports.getHeaderFacetsFromAnnotations = getHeaderFacetsFromAnnotations;
  function getHeaderFacetsFromManifest(manifestCustomHeaderFacets) {
    const customHeaderFacets = {};
    Object.keys(manifestCustomHeaderFacets).forEach(manifestHeaderFacetKey => {
      const customHeaderFacet = manifestCustomHeaderFacets[manifestHeaderFacetKey];
      customHeaderFacets[manifestHeaderFacetKey] = createCustomHeaderFacet(customHeaderFacet, manifestHeaderFacetKey);
    });
    return customHeaderFacets;
  }

  /**
   * Retrieve stashed settings for header facets from manifest.
   * @param facetDefinition
   * @param collectionFacetDefinition
   * @param converterContext
   * @returns Stashed setting for header facet or false
   */
  _exports.getHeaderFacetsFromManifest = getHeaderFacetsFromManifest;
  function getStashedSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    // When a HeaderFacet is nested inside a CollectionFacet, stashing is not supported
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      return false;
    }
    const headerFacetID = createIdForAnnotation(facetDefinition) ?? "";
    const headerFacetsControlConfig = converterContext.getManifestWrapper().getHeaderFacets();
    const stashedSetting = headerFacetsControlConfig[headerFacetID]?.stashed;
    return stashedSetting === true;
  }

  /**
   * Retrieve flexibility designtime settings from manifest.
   * @param facetDefinition
   * @param collectionFacetDefinition
   * @param converterContext
   * @returns Designtime setting or default
   */
  _exports.getStashedSettingsForHeaderFacet = getStashedSettingsForHeaderFacet;
  function getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    let designTimeMetadata = FlexDesignTimeType.Default;
    const headerFacetID = createIdForAnnotation(facetDefinition);

    // For HeaderFacets nested inside CollectionFacet RTA should be disabled, therefore set to "not-adaptable-tree"
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      designTimeMetadata = FlexDesignTimeType.NotAdaptableTree;
    } else {
      const headerFacetsControlConfig = converterContext.getManifestWrapper().getHeaderFacets();
      if (headerFacetID) {
        const designTime = headerFacetsControlConfig[headerFacetID]?.flexSettings?.designtime;
        switch (designTime) {
          case FlexDesignTimeType.NotAdaptable:
          case FlexDesignTimeType.NotAdaptableTree:
          case FlexDesignTimeType.NotAdaptableVisibility:
            designTimeMetadata = designTime;
            break;
          default:
            break;
        }
      }
    }
    return designTimeMetadata;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Convert & Build Annotation Based Header Facets
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  _exports.getDesignTimeMetadataSettingsForHeaderFacet = getDesignTimeMetadataSettingsForHeaderFacet;
  function createReferenceHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext) {
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && facetDefinition.annotations?.UI?.Hidden?.valueOf() !== true) {
      const headerFacetID = getHeaderFacetID(facetDefinition),
        getHeaderFacetKey = (facetDefinitionToCheck, fallback) => {
          return facetDefinitionToCheck.ID?.toString() || facetDefinitionToCheck.Label?.toString() || fallback;
        },
        targetAnnotationValue = facetDefinition.Target.value,
        targetAnnotationType = getTargetAnnotationType(facetDefinition);
      let headerFormData;
      let headerDataPointData;
      switch (targetAnnotationType) {
        case TargetAnnotationType.FieldGroup:
          headerFormData = getFieldGroupFormData(facetDefinition, converterContext);
          break;
        case TargetAnnotationType.DataPoint:
          headerDataPointData = getDataPointData(facetDefinition, converterContext);
          break;
        // ToDo: Handle other cases
        default:
          break;
      }
      if (facetDefinition.Target?.$target?.term === "com.sap.vocabularies.UI.v1.Chart" && isAnnotationFieldStaticallyHidden(facetDefinition)) {
        return undefined;
      } else {
        return {
          type: HeaderFacetType.Annotation,
          facetType: FacetType.Reference,
          id: headerFacetID,
          containerId: getHeaderFacetContainerID(facetDefinition),
          key: getHeaderFacetKey(facetDefinition, headerFacetID),
          flexSettings: {
            designtime: getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext)
          },
          stashed: getStashedSettingsForHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext),
          visible: compileExpression(isVisible(facetDefinition)),
          annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName)}/`,
          targetAnnotationValue,
          targetAnnotationType,
          headerFormData,
          headerDataPointData
        };
      }
    }
    return undefined;
  }
  function createCollectionHeaderFacet(collectionFacetDefinition, converterContext) {
    if (collectionFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
      const facets = [],
        headerFacetID = getHeaderFacetID(collectionFacetDefinition),
        getHeaderFacetKey = (facetDefinition, fallback) => {
          return facetDefinition.ID?.toString() || facetDefinition.Label?.toString() || fallback;
        };
      collectionFacetDefinition.Facets.forEach(facetDefinition => {
        const facet = createReferenceHeaderFacet(facetDefinition, collectionFacetDefinition, converterContext);
        if (facet) {
          facets.push(facet);
        }
      });
      return {
        type: HeaderFacetType.Annotation,
        facetType: FacetType.Collection,
        id: headerFacetID,
        containerId: getHeaderFacetContainerID(collectionFacetDefinition),
        key: getHeaderFacetKey(collectionFacetDefinition, headerFacetID),
        flexSettings: {
          designtime: getDesignTimeMetadataSettingsForHeaderFacet(collectionFacetDefinition, collectionFacetDefinition, converterContext)
        },
        stashed: getStashedSettingsForHeaderFacet(collectionFacetDefinition, collectionFacetDefinition, converterContext),
        visible: compileExpression(isVisible(collectionFacetDefinition)),
        annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(collectionFacetDefinition.fullyQualifiedName)}/`,
        facets
      };
    }
    return undefined;
  }
  function getTargetAnnotationType(facetDefinition) {
    let annotationType = TargetAnnotationType.None;
    const annotationTypeMap = {
      "com.sap.vocabularies.UI.v1.DataPoint": TargetAnnotationType.DataPoint,
      "com.sap.vocabularies.UI.v1.Chart": TargetAnnotationType.Chart,
      "com.sap.vocabularies.UI.v1.Identification": TargetAnnotationType.Identification,
      "com.sap.vocabularies.Communication.v1.Contact": TargetAnnotationType.Contact,
      "com.sap.vocabularies.Communication.v1.Address": TargetAnnotationType.Address,
      "com.sap.vocabularies.UI.v1.FieldGroup": TargetAnnotationType.FieldGroup,
      "com.sap.vocabularies.UI.v1.PresentationVariant": TargetAnnotationType.PresentationVariant
    };
    // ReferenceURLFacet and CollectionFacet do not have Target property.
    if (facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.ReferenceURLFacet" && facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.CollectionFacet" && facetDefinition.Target.$target) {
      annotationType = annotationTypeMap[facetDefinition.Target.$target.term] ?? TargetAnnotationType.None;
    }
    return annotationType;
  }
  function getFieldGroupFormData(facetDefinition, converterContext) {
    // split in this from annotation + getFieldGroupFromDefault
    if (!facetDefinition) {
      throw new Error("Cannot get FieldGroup form data without facet definition");
    }
    const formElements = insertCustomElements(getFormElementsFromAnnotations(facetDefinition, converterContext), getFormElementsFromManifest(facetDefinition, converterContext));
    return {
      id: getHeaderFacetFormID(facetDefinition),
      label: facetDefinition.Label?.toString(),
      formElements
    };
  }

  /**
   * Creates an array of manifest-based FormElements.
   * @param facetDefinition The definition of the facet
   * @param converterContext The converter context for the facet
   * @returns Annotation-based FormElements
   */
  function getFormElementsFromAnnotations(facetDefinition, converterContext) {
    const annotationBasedFormElements = [];

    // ReferenceURLFacet and CollectionFacet do not have Target property.
    if (facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.ReferenceURLFacet" && facetDefinition.$Type !== "com.sap.vocabularies.UI.v1.CollectionFacet") {
      const resolvedTarget = converterContext.getEntityTypeAnnotation(facetDefinition.Target.value);
      converterContext = resolvedTarget.converterContext;
      facetDefinition.Target?.$target?.Data.forEach(dataField => {
        if (dataField.annotations?.UI?.Hidden?.valueOf() !== true) {
          const semanticObjectAnnotationPath = getSemanticObjectPath(converterContext, dataField);
          if ((dataField.$Type === "com.sap.vocabularies.UI.v1.DataField" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithUrl" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction") && !isReferencePropertyStaticallyHidden(dataField)) {
            annotationBasedFormElements.push({
              isValueMultilineText: isMultiLineText(dataField.Value?.$target),
              type: FormElementType.Annotation,
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(isVisible(dataField)),
              label: dataField.Value?.$target?.annotations?.Common?.Label || dataField.Label,
              idPrefix: getHeaderFacetFormID(facetDefinition, dataField),
              annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName)}/`,
              semanticObjectPath: semanticObjectAnnotationPath
            });
          } else if (dataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && !isReferencePropertyStaticallyHidden(dataField)) {
            annotationBasedFormElements.push({
              isValueMultilineText: false,
              // was dataField.Target?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true but that doesn't make sense as the target cannot have that annotation
              type: FormElementType.Annotation,
              key: KeyHelper.generateKeyFromDataField(dataField),
              visible: compileExpression(isVisible(dataField)),
              label: dataField.Target?.$target?.annotations?.Common?.Label?.toString() || dataField.Label?.toString(),
              idPrefix: getHeaderFacetFormID(facetDefinition, dataField),
              annotationPath: `${converterContext.getEntitySetBasedAnnotationPath(dataField.fullyQualifiedName)}/`,
              semanticObjectPath: semanticObjectAnnotationPath
            });
          }
        }
      });
    }
    return annotationBasedFormElements;
  }
  function getDataPointData(facetDefinition, converterContext) {
    let type = HeaderDataPointType.Content;
    let semanticObjectPath;
    if (facetDefinition.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && !isAnnotationFieldStaticallyHidden(facetDefinition)) {
      if (facetDefinition.Target?.$target?.Visualization === "UI.VisualizationType/Progress") {
        type = HeaderDataPointType.ProgressIndicator;
      } else if (facetDefinition.Target?.$target?.Visualization === "UI.VisualizationType/Rating") {
        type = HeaderDataPointType.RatingIndicator;
      }
      const dataPoint = facetDefinition.Target?.$target;
      if (typeof dataPoint === "object") {
        if (dataPoint?.Value?.$target) {
          const property = dataPoint.Value.$target;
          if (property?.annotations?.Common?.SemanticObject !== undefined) {
            semanticObjectPath = converterContext.getEntitySetBasedAnnotationPath(property?.fullyQualifiedName);
          }
        }
      }
    }
    return {
      type,
      semanticObjectPath
    };
  }

  /**
   * Creates an annotation-based header facet.
   * @param facetDefinition The definition of the facet
   * @param converterContext The converter context
   * @returns The created annotation-based header facet
   */
  function createHeaderFacet(facetDefinition, converterContext) {
    let headerFacet;
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        headerFacet = createReferenceHeaderFacet(facetDefinition, facetDefinition, converterContext);
        break;
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        headerFacet = createCollectionHeaderFacet(facetDefinition, converterContext);
        break;
      default:
        break;
    }
    return headerFacet;
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Convert & Build Manifest Based Header Facets
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  function generateBinding(requestGroupId) {
    if (!requestGroupId) {
      return undefined;
    }
    const groupId = ["Heroes", "Decoration", "Workers", "LongRunners"].includes(requestGroupId) ? `$auto.${requestGroupId}` : requestGroupId;
    return `{ path : '', parameters : { $$groupId : '${groupId}' } }`;
  }

  /**
   * Create a manifest based custom header facet.
   * @param customHeaderFacetDefinition
   * @param headerFacetKey
   * @returns The manifest based custom header facet created
   */
  function createCustomHeaderFacet(customHeaderFacetDefinition, headerFacetKey) {
    const customHeaderFacetID = getCustomHeaderFacetID(headerFacetKey);
    let position = customHeaderFacetDefinition.position;
    if (!position) {
      position = {
        placement: Placement.After
      };
    }
    // TODO for an non annotation fragment the name is mandatory -> Not checked
    return {
      facetType: FacetType.Reference,
      type: customHeaderFacetDefinition.type,
      id: customHeaderFacetID,
      containerId: customHeaderFacetID,
      key: headerFacetKey,
      position: position,
      visible: customHeaderFacetDefinition.visible,
      fragmentName: customHeaderFacetDefinition.template || customHeaderFacetDefinition.name,
      title: customHeaderFacetDefinition.title,
      subTitle: customHeaderFacetDefinition.subTitle,
      stashed: customHeaderFacetDefinition.stashed || false,
      flexSettings: {
        ...{
          designtime: FlexDesignTimeType.Default
        },
        ...customHeaderFacetDefinition.flexSettings
      },
      binding: generateBinding(customHeaderFacetDefinition.requestGroupId),
      templateEdit: customHeaderFacetDefinition.templateEdit
    };
  }
  return _exports;
}, false);
//# sourceMappingURL=HeaderFacet-dbg.js.map
