/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/helpers/TypeGuards", "../../ManifestSettings", "./Chart", "./Table"], function (MetaModelConverter, IssueManager, TypeGuards, ManifestSettings, Chart, Table) {
  "use strict";

  var _exports = {};
  var createChartVisualizationForTemplating = Chart.createChartVisualizationForTemplating;
  var createChartVisualization = Chart.createChartVisualization;
  var createBlankChartVisualization = Chart.createBlankChartVisualization;
  var VisualizationType = ManifestSettings.VisualizationType;
  var TemplateType = ManifestSettings.TemplateType;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  const getVisualizationsFromAnnotation = function (annotation, visualizationPath, converterContext, isMacroOrMultipleView) {
    const {
      presentation,
      selectionVariant
    } = isAnnotationOfType(annotation, "com.sap.vocabularies.UI.v1.PresentationVariantType") ? {
      presentation: annotation,
      selectionVariant: undefined
    } : {
      presentation: annotation.PresentationVariant,
      selectionVariant: annotation.SelectionVariant
    };
    const visualizationAnnotations = [];
    const isALP = isAlpAnnotation(converterContext);
    const finalSelectionVariant = !isALP &&
    // Don't add the SelectionVariant on ALP -> will be managed by FIORITECHP1-26237
    !(converterContext.getTemplateType() === TemplateType.ListReport && !isMacroOrMultipleView) //On ListReport with single view the SelectionVariant is managed by FilterBar
    ? selectionVariant : undefined;
    const baseVisualizationPath = visualizationPath.split("@")[0];
    if ((isMacroOrMultipleView === true || isALP) && !isPresentationCompliant(presentation, isALP)) {
      if (!annotationExistsInPresentationVariant(presentation, "com.sap.vocabularies.UI.v1.LineItem")) {
        const defaultLineItemAnnotation = prepareDefaultVisualization("com.sap.vocabularies.UI.v1.LineItem", baseVisualizationPath, converterContext);
        if (defaultLineItemAnnotation) {
          visualizationAnnotations.push({
            ...defaultLineItemAnnotation,
            ...{
              selectionVariant: finalSelectionVariant
            }
          });
        }
      }
      if (!annotationExistsInPresentationVariant(presentation, "com.sap.vocabularies.UI.v1.Chart")) {
        const defaultChartAnnotation = prepareDefaultVisualization("com.sap.vocabularies.UI.v1.Chart", baseVisualizationPath, converterContext);
        if (defaultChartAnnotation) {
          visualizationAnnotations.push(defaultChartAnnotation);
        }
      }
    }
    const visualizations = presentation.Visualizations;
    const pushFirstVizOfType = function (allowedTerms) {
      const firstViz = visualizations?.find(viz => viz.$target !== undefined && allowedTerms.includes(viz.$target.term));
      if (firstViz) {
        visualizationAnnotations.push({
          visualization: firstViz.$target,
          annotationPath: `${baseVisualizationPath}${firstViz.value}`,
          converterContext: converterContext,
          selectionVariant: finalSelectionVariant
        });
      }
    };
    if (isALP) {
      // In case of ALP, we use the first LineItem and the first Chart
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.LineItem"]);
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.Chart"]);
    } else {
      // Otherwise, we use the first viz only (Chart or LineItem)
      pushFirstVizOfType(["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.Chart"]);
    }
    return visualizationAnnotations;
  };
  _exports.getVisualizationsFromAnnotation = getVisualizationsFromAnnotation;
  function getSelectionPresentationVariant(entityType, annotationPath, converterContext) {
    if (annotationPath) {
      const resolvedTarget = converterContext.getEntityTypeAnnotation(annotationPath);
      const selectionPresentationVariant = resolvedTarget.annotation;
      if (selectionPresentationVariant) {
        if (selectionPresentationVariant.term === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
          return selectionPresentationVariant;
        }
      } else {
        throw new Error("Annotation Path for the SPV mentioned in the manifest is not found, Please add the SPV in the annotation");
      }
    } else {
      return entityType.annotations?.UI?.SelectionPresentationVariant;
    }
  }
  _exports.getSelectionPresentationVariant = getSelectionPresentationVariant;
  function isSelectionPresentationCompliant(selectionPresentationVariant, isALP) {
    const presentationVariant = selectionPresentationVariant && selectionPresentationVariant.PresentationVariant;
    if (presentationVariant) {
      return isPresentationCompliant(presentationVariant, isALP);
    } else {
      throw new Error("Presentation Variant is not present in the SPV annotation");
    }
  }
  _exports.isSelectionPresentationCompliant = isSelectionPresentationCompliant;
  function isPresentationCompliant(presentationVariant) {
    let isALP = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    let hasTable = false,
      hasChart = false;
    if (isALP) {
      if (presentationVariant?.Visualizations) {
        const visualizations = presentationVariant.Visualizations;
        visualizations.forEach(visualization => {
          if (visualization.$target?.term === "com.sap.vocabularies.UI.v1.LineItem") {
            hasTable = true;
          }
          if (visualization.$target?.term === "com.sap.vocabularies.UI.v1.Chart") {
            hasChart = true;
          }
        });
      }
      return hasChart && hasTable;
    } else {
      return presentationVariant?.Visualizations && !!presentationVariant.Visualizations.find(visualization => {
        return visualization.$target?.term === "com.sap.vocabularies.UI.v1.LineItem" || visualization.$target?.term === "com.sap.vocabularies.UI.v1.Chart";
      });
    }
  }
  _exports.isPresentationCompliant = isPresentationCompliant;
  function getDefaultLineItem(entityType) {
    return entityType.annotations.UI?.LineItem;
  }
  _exports.getDefaultLineItem = getDefaultLineItem;
  function getDefaultChart(entityType) {
    return entityType.annotations.UI?.Chart;
  }
  _exports.getDefaultChart = getDefaultChart;
  function getDefaultSelectionVariant(entityType) {
    return entityType.annotations?.UI?.SelectionVariant;
  }
  _exports.getDefaultSelectionVariant = getDefaultSelectionVariant;
  function getSelectionVariant(entityType, converterContext) {
    const annotationPath = converterContext.getManifestWrapper().getDefaultTemplateAnnotationPath();
    const selectionPresentationVariant = getSelectionPresentationVariant(entityType, annotationPath, converterContext);
    let selectionVariant;
    if (selectionPresentationVariant) {
      selectionVariant = selectionPresentationVariant.SelectionVariant;
      if (selectionVariant) {
        return selectionVariant;
      }
    } else {
      selectionVariant = getDefaultSelectionVariant(entityType);
      return selectionVariant;
    }
  }

  /**
   * Gets the configuration of the visualizations related to an annotation.
   * @param resolvedTarget The annotation
   * @param visualizationPath The path to the visualization annotation
   * @param isMacroOrMultipleView True if it's for a building block or a multiple views configuration
   * @returns The visualizations with their configuration
   */
  _exports.getSelectionVariant = getSelectionVariant;
  function getVisualizationsAndPaths(resolvedTarget, visualizationPath, isMacroOrMultipleView) {
    const {
      annotation,
      converterContext
    } = resolvedTarget;
    const term = annotation?.term;
    let visualizationAnnotations = [];
    if (term) {
      switch (term) {
        case "com.sap.vocabularies.UI.v1.LineItem":
        case "com.sap.vocabularies.UI.v1.Chart":
          visualizationAnnotations.push({
            visualization: annotation,
            annotationPath: visualizationPath,
            converterContext: converterContext
          });
          break;
        case "com.sap.vocabularies.UI.v1.PresentationVariant":
        case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
          visualizationAnnotations = visualizationAnnotations.concat(getVisualizationsFromAnnotation(annotation, visualizationPath, converterContext, isMacroOrMultipleView));
          break;
        default:
          break;
      }
    }
    return visualizationAnnotations;
  }

  /**
   * Gets the presentation of the visualizations related to a visualizationPath.
   * @param visualizationPath The path to the visualization annotation
   * @param inConverterContext The converted context
   * @returns The presentation variant
   */
  function getDataVisualizationPresentation(visualizationPath, inConverterContext) {
    if (visualizationPath === "") {
      return undefined;
    }
    const annotation = inConverterContext.getEntityTypeAnnotation(visualizationPath).annotation;
    if (isAnnotationOfType(annotation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType")) {
      return annotation.PresentationVariant;
    } else if (annotation.term === "com.sap.vocabularies.UI.v1.PresentationVariant") {
      return annotation;
    }
    return undefined;
  }

  /**
   * Gets the presentation of the visualizations related to a visualizationPath.
   * @param visualizationPath The path to the visualization annotation
   * @param inConverterContext The converted context
   * @param params
   * @param params.isCondensedTableLayoutCompliant True if it's for a condensed layout
   * @param params.viewConfiguration The view configuration
   * @param params.doNotCheckApplySupported True if the check to "ApplySupported" is skipped
   * @param params.associatedPresentationVariantPath The path of the presentation to apply
   * @param params.isMacroOrMultipleView True if it's for a building block or a multiple views configuration
   * @param params.shouldCreateTemplateChartVisualization True if we need to create chart visualization for templating
   * @returns The definition of the data visualizations
   */
  function getDataVisualizationConfiguration(visualizationPath, inConverterContext, params) {
    const {
      isCondensedTableLayoutCompliant,
      doNotCheckApplySupported,
      associatedSelectionVariant,
      isMacroOrMultipleView,
      shouldCreateTemplateChartVisualization
    } = params;
    const resolvedTarget = visualizationPath !== "" ? inConverterContext.getEntityTypeAnnotation(visualizationPath) : {
      annotation: undefined,
      converterContext: inConverterContext
    };
    const resolvedVisualization = resolvedTarget.annotation;
    let chartVisualization, tableVisualization;
    const term = resolvedVisualization?.term;
    for (const visualizationAndPath of getVisualizationsAndPaths(resolvedTarget, visualizationPath, isMacroOrMultipleView)) {
      const {
        visualization,
        annotationPath,
        converterContext,
        selectionVariant
      } = visualizationAndPath;
      switch (visualization.term) {
        case "com.sap.vocabularies.UI.v1.Chart":
          chartVisualization = shouldCreateTemplateChartVisualization ? createChartVisualizationForTemplating(converterContext, annotationPath, visualization) : createChartVisualization(visualization, annotationPath, converterContext, doNotCheckApplySupported, isAnnotationOfType(resolvedVisualization, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") ? visualizationPath : undefined);
          break;
        case "com.sap.vocabularies.UI.v1.LineItem":
        default:
          tableVisualization = Table.createTableVisualization(visualization, annotationPath, converterContext, {
            presentationVariantAnnotation: getDataVisualizationPresentation(visualizationPath, inConverterContext),
            selectionVariantAnnotation: associatedSelectionVariant ?? selectionVariant,
            isCondensedTableLayoutCompliant
          });
          break;
      }
    }
    inConverterContext = resolvedTarget.converterContext;
    const isALP = isAlpAnnotation(inConverterContext);
    if (!term || isALP && tableVisualization === undefined) {
      tableVisualization = Table.createDefaultTableVisualization(inConverterContext, isMacroOrMultipleView !== true);
      inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_LINEITEM);
    }
    if (isALP && chartVisualization === undefined) {
      chartVisualization = createBlankChartVisualization(inConverterContext);
      inConverterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Medium, IssueType.MISSING_CHART);
    }
    return {
      visualizations: [chartVisualization, tableVisualization].filter(isVisualization),
      annotationPath: inConverterContext.getEntitySetBasedAnnotationPath(resolvedVisualization?.fullyQualifiedName ?? "/"),
      associatedSelectionVariantPath: params.associatedSelectionVariant ? inConverterContext.getEntitySetBasedAnnotationPath(params.associatedSelectionVariant.fullyQualifiedName) : undefined
    };
  }
  _exports.getDataVisualizationConfiguration = getDataVisualizationConfiguration;
  function isVisualization(visualization) {
    return [VisualizationType.Table, VisualizationType.Chart].includes(visualization?.type);
  }
  function validatePresentationMetaPath(metaPath, objectTerm) {
    // perform validation only if annotation set (to avoid backwards compatibility issues for test without annotations)
    if (metaPath.includes(objectTerm.slice(0, objectTerm.lastIndexOf(".")))) {
      const allowedTerms = ["com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant", objectTerm];
      if (!allowedTerms.some(term => {
        return metaPath.search(new RegExp(`${term}(#|/|$)`)) > -1;
      })) {
        throw new Error(`Annotation Path ${metaPath} mentioned in the manifest is not valid for ${objectTerm}`);
      }
    }
  }
  /**
   * Returns the context of the UI controls (either a UI.LineItem, or a UI.Chart).
   * @param presentationContext Object of the presentation context (either a presentation variant, or a UI.LineItem, or a UI.Chart)
   * @param controlPath Control path
   * @returns The context of the control (either a UI.LineItem, or a UI.Chart)
   */
  _exports.validatePresentationMetaPath = validatePresentationMetaPath;
  function getUiControl(presentationContext, controlPath) {
    validatePresentationMetaPath(presentationContext.getPath(), controlPath);
    const presentation = MetaModelConverter.convertMetaModelContext(presentationContext),
      model = presentationContext.getModel();
    if (presentation) {
      if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") || isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.PresentationVariantType")) {
        let visualizations;
        if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") && presentation.PresentationVariant) {
          visualizations = presentation.PresentationVariant.Visualizations;
        } else if (isAnnotationOfType(presentation, "com.sap.vocabularies.UI.v1.PresentationVariantType")) {
          visualizations = presentation.Visualizations;
        }
        if (Array.isArray(visualizations)) {
          for (const visualization of visualizations) {
            if (visualization.type == "AnnotationPath" && visualization.value.includes(controlPath) &&
            // check if object exists for PresentationVariant visualization
            !!model.getMetaContext(presentationContext.getPath().split("@")[0] + visualization.value).getObject()) {
              controlPath = visualization.value;
              break;
            }
          }
        }
      } else {
        return presentationContext;
      }
    }
    return model.getMetaContext(presentationContext.getPath().split("@")[0] + controlPath);
  }
  _exports.getUiControl = getUiControl;
  const annotationExistsInPresentationVariant = function (presentationVariantAnnotation, annotationTerm) {
    return presentationVariantAnnotation.Visualizations?.some(visualization => visualization.value.includes(annotationTerm)) ?? false;
  };
  _exports.annotationExistsInPresentationVariant = annotationExistsInPresentationVariant;
  const prepareDefaultVisualization = function (visualizationType, baseVisualizationPath, converterContext) {
    const entityType = converterContext.getEntityType();
    const defaultAnnotation = visualizationType === "com.sap.vocabularies.UI.v1.LineItem" ? getDefaultLineItem(entityType) : getDefaultChart(entityType);
    if (defaultAnnotation) {
      return {
        visualization: defaultAnnotation,
        annotationPath: `${baseVisualizationPath}${converterContext.getRelativeAnnotationPath(defaultAnnotation.fullyQualifiedName, entityType)}`,
        converterContext: converterContext
      };
    }
    return undefined;
  };
  const isAlpAnnotation = function (converterContext) {
    return converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
  };
  _exports.isAlpAnnotation = isAlpAnnotation;
  return _exports;
}, false);
//# sourceMappingURL=DataVisualization-dbg.js.map
