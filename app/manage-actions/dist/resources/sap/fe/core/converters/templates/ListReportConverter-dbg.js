/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/helpers/StableIdHelper", "../../helpers/TypeGuards", "../ManifestSettings", "../controls/Common/DataVisualization", "../controls/Common/KPI", "../helpers/ID"], function (BindingToolkit, Action, FilterBar, ConfigurableObject, StableIdHelper, TypeGuards, ManifestSettings, DataVisualization, KPI, ID) {
  "use strict";

  var _exports = {};
  var getTableID = ID.getTableID;
  var getIconTabBarID = ID.getIconTabBarID;
  var getFilterVariantManagementID = ID.getFilterVariantManagementID;
  var getFilterBarID = ID.getFilterBarID;
  var getDynamicListReportID = ID.getDynamicListReportID;
  var getCustomTabID = ID.getCustomTabID;
  var getChartID = ID.getChartID;
  var getKPIDefinitions = KPI.getKPIDefinitions;
  var isSelectionPresentationCompliant = DataVisualization.isSelectionPresentationCompliant;
  var isPresentationCompliant = DataVisualization.isPresentationCompliant;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  var getSelectionPresentationVariant = DataVisualization.getSelectionPresentationVariant;
  var getDefaultLineItem = DataVisualization.getDefaultLineItem;
  var getDefaultChart = DataVisualization.getDefaultChart;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var VisualizationType = ManifestSettings.VisualizationType;
  var VariantManagementType = ManifestSettings.VariantManagementType;
  var TemplateType = ManifestSettings.TemplateType;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var generate = StableIdHelper.generate;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var showDraftEditStatus = FilterBar.showDraftEditStatus;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getManifestFilterFields = FilterBar.getManifestFilterFields;
  var getFilterBarHideBasicSearch = FilterBar.getFilterBarHideBasicSearch;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  var ViewSettingsType = /*#__PURE__*/function (ViewSettingsType) {
    ViewSettingsType["Multi"] = "Multi";
    ViewSettingsType["Combined"] = "Combined";
    ViewSettingsType["Custom"] = "Custom";
    ViewSettingsType["Default"] = "Default";
    return ViewSettingsType;
  }(ViewSettingsType || {});
  var ViewDefinitionType = /*#__PURE__*/function (ViewDefinitionType) {
    ViewDefinitionType["SingleTable"] = "SingleTable";
    ViewDefinitionType["SingleChart"] = "SingleChart";
    ViewDefinitionType["Combined"] = "Combined";
    ViewDefinitionType["Custom"] = "Custom";
    return ViewDefinitionType;
  }(ViewDefinitionType || {});
  /**
   * Returns true if the view settings matches the provided type.
   * @param potentialViewSettings The view settings
   * @param type The type to match
   * @returns `true` if the view settings matches the provided type
   */
  const isViewSettingsOfType = function (potentialViewSettings, type) {
    return potentialViewSettings.type === type;
  };

  /**
   * Returns true if the view definition matches the provided type.
   * @param potentialViewDefinition The view definition
   * @param type The type to match
   * @returns `true` if the view definition matches the provided type
   */
  const isViewDefinitionOfType = function (potentialViewDefinition, type) {
    return potentialViewDefinition.viewType === type;
  };

  /**
   * Retrieves all list report tables.
   * @param views The list report views configured in the manifest
   * @returns The list report tables
   */
  function getTableVisualizations(views) {
    const tables = [];
    views.forEach(function (view) {
      if (!isViewDefinitionOfType(view, ViewDefinitionType.Custom)) {
        const visualizations = isViewDefinitionOfType(view, ViewDefinitionType.Combined) ? view.secondaryVisualization.visualizations : view.presentation.visualizations;
        visualizations.forEach(function (visualization) {
          if (visualization.type === VisualizationType.Table) {
            tables.push(visualization);
          }
        });
      }
    });
    return tables;
  }

  /**
   * Retrieves all list report charts.
   * @param views The list report views configured in the manifest
   * @returns The list report charts
   */
  function getChartVisualizations(views) {
    const charts = [];
    views.forEach(function (view) {
      if (!isViewDefinitionOfType(view, ViewDefinitionType.Custom)) {
        const visualizations = isViewDefinitionOfType(view, ViewDefinitionType.Combined) ? view.primaryVisualization.visualizations : view.presentation.visualizations;
        visualizations.forEach(function (visualization) {
          if (visualization.type === VisualizationType.Chart) {
            charts.push(visualization);
          }
        });
      }
    });
    return charts;
  }
  const getDefaultSemanticDates = function (filterFields) {
    const defaultSemanticDates = {};
    for (const filterField in filterFields) {
      if (filterFields[filterField]?.settings?.defaultValues?.length) {
        defaultSemanticDates[filterField] = filterFields[filterField]?.settings?.defaultValues;
      }
    }
    return defaultSemanticDates;
  };
  /**
   * Find a visualization annotation that can be used for rendering the list report.
   * @param entityType The current EntityType
   * @param converterContext
   * @param isALP
   * @returns A compliant annotation for rendering the list report
   */
  function getCompliantVisualizationAnnotation(entityType, converterContext, isALP) {
    const annotationPath = converterContext.getManifestWrapper().getDefaultTemplateAnnotationPath();
    const selectionPresentationVariant = getSelectionPresentationVariant(entityType, annotationPath, converterContext);
    const errorMessageForALP = "ALP flavor needs both chart and table to load the application";
    if (selectionPresentationVariant) {
      if (annotationPath) {
        const presentationVariant = selectionPresentationVariant.PresentationVariant;
        if (!presentationVariant) {
          throw new Error("Presentation Variant is not configured in the SPV mentioned in the manifest");
        }
        if (!isPresentationCompliant(presentationVariant, isALP)) {
          if (isALP) {
            throw new Error(errorMessageForALP);
          }
          return undefined;
        }
      }
      if (isSelectionPresentationCompliant(selectionPresentationVariant, isALP) === true) {
        return selectionPresentationVariant;
      } else if (isALP) {
        throw new Error(errorMessageForALP);
      }
    }
    const presentationVariant = entityType.annotations?.UI?.PresentationVariant;
    if (presentationVariant) {
      if (isPresentationCompliant(presentationVariant, isALP)) {
        return presentationVariant;
      } else if (isALP) {
        throw new Error(errorMessageForALP);
      }
    }
    if (!isALP) {
      return getDefaultLineItem(entityType);
    }
    return undefined;
  }

  /**
   * Creates the view for the analytical list page.
   * @param presentations The data visualizations to configure
   * @param defaultPath The default path of the page
   * @param viewSettings The settings of the view
   * @returns The ALP view definition
   */
  const createAlpView = function (presentations, defaultPath, viewSettings) {
    const primaryVisualization = createAlpVisualization(presentations[0], true);
    const secondaryVisualization = createAlpVisualization(presentations[1] ? presentations[1] : presentations[0], false);
    if (primaryVisualization && secondaryVisualization) {
      const view = {
        primaryVisualization,
        secondaryVisualization,
        tableControlId: secondaryVisualization.visualizations[0]?.type === VisualizationType.Table ? secondaryVisualization.visualizations[0].annotation?.id : "",
        chartControlId: primaryVisualization.visualizations[0]?.type === VisualizationType.Chart ? primaryVisualization.visualizations[0].id : "",
        defaultPath,
        viewType: ViewDefinitionType.Combined,
        visible: isViewSettingsOfType(viewSettings, ViewSettingsType.Multi) ? viewSettings.visible : undefined
      };
      return view;
    }
  };

  /**
   * Creates the visualizations for a single visualization view.
   * @param converterContext The converted context
   * @param presentation The presentation to configure
   * @param viewSettings The settings of the view
   * @returns The ALP visualization definition
   */
  const createSingleVisualizationView = function (converterContext, presentation, viewSettings) {
    const tableId = getViewControl(presentation, VisualizationType.Table)?.annotation.id;
    const baseSettings = {
      presentation,
      title: getViewTitle(converterContext, viewSettings),
      selectionVariantPath: getViewSelectionVariant(viewSettings),
      visible: isViewSettingsOfType(viewSettings, ViewSettingsType.Multi) ? viewSettings.visible : undefined
    };
    if (tableId) {
      return {
        ...baseSettings,
        ...{
          tableControlId: tableId,
          viewType: ViewDefinitionType.SingleTable
        }
      };
    }
    return {
      ...baseSettings,
      ...{
        chartControlId: getViewControl(presentation, VisualizationType.Chart)?.id,
        viewType: ViewDefinitionType.SingleChart
      }
    };
  };

  /**
   * Creates the visualizations for the analytical list page.
   * @param presentation The presentation to configure
   * @param isPrimary Is a primary presentation
   * @returns The ALP visualization definition
   */
  const createAlpVisualization = function (presentation, isPrimary) {
    const presentationCreated = Object.assign({}, presentation);
    const defaultVisualization = presentation.visualizations.find(visualization => !!isPrimary && visualization.type === VisualizationType.Chart || !isPrimary && visualization.type === VisualizationType.Table);
    if (defaultVisualization) {
      presentationCreated.visualizations = [defaultVisualization];
    } else {
      const messageInfo = isPrimary ? {
        visualization: "Primary",
        type: "chart"
      } : {
        visualization: "Secondary",
        type: "table"
      };
      throw new Error(`${messageInfo.visualization} visualization needs valid ${messageInfo.type}`);
    }
    return presentationCreated;
  };

  /**
   * Gets the presentation of the analytical list page.
   * @param converterContext The converted context
   * @param item The item configuration
   * @param isPrimary Is a primary presentation
   * @returns The ALP presentation definition
   */
  const getAlpPresentation = function (converterContext, item, isPrimary) {
    const resolvedTarget = converterContext.getEntityTypeAnnotation(item.annotationPath);
    const targetAnnotation = resolvedTarget.annotation;
    converterContext = resolvedTarget.converterContext;
    const annotation = targetAnnotation;
    if (annotation || converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
      return getDataVisualizationConfiguration(annotation ? converterContext.getRelativeAnnotationPath(annotation.fullyQualifiedName, converterContext.getEntityType()) : "", converterContext, {
        isCondensedTableLayoutCompliant: true,
        shouldCreateTemplateChartVisualization: true
      });
    } else {
      throw new Error(`Annotation Path for the ${isPrimary ? "primary" : "secondary"} visualization mentioned in the manifest is not found`);
    }
  };

  /**
   * Configures the multi view configuration with additional keys.
   * @param presentation The presentation to configure
   * @param viewSettings The settings of the view
   */
  const configureMultiViews = function (presentation, viewSettings) {
    // Need to loop on table into views since multi table mode get specific configuration (hidden filters or Table Id)
    for (const visualization of presentation.visualizations) {
      switch (visualization.type) {
        case VisualizationType.Table:
          const filters = visualization.control.filters || {};
          filters.hiddenFilters = filters.hiddenFilters || {
            paths: []
          };
          if (!viewSettings.keepPreviousPersonalization) {
            // Need to override Table Id to match with Tab Key (currently only table is managed in multiple view mode)
            visualization.annotation.id = getTableID(viewSettings.key ?? "", "LineItem");
            visualization.annotation.apiId = generate([visualization.annotation.id, "Table"]);
          }
          break;
        case VisualizationType.Chart:
          visualization.id = getChartID(viewSettings.key || "", "Chart");
          visualization.multiViews = true;
          break;
        default:
          break;
      }
    }
  };

  /**
   * Gets the custom view configuration.
   * @param viewSettings The settings of the view
   * @returns The custom view definition
   */
  const getCustomView = function (viewSettings) {
    return {
      title: viewSettings.label,
      fragment: viewSettings.template,
      type: viewSettings.type,
      customTabId: getCustomTabID(viewSettings.key ?? ""),
      visible: viewSettings.visible,
      viewType: ViewDefinitionType.Custom
    };
  };

  /**
   * Gets the configured control of the view.
   * @param presentation The presentation of the view
   * @param visualizationType The type of the visualization to find
   * @returns The visualization if the type matches, undefined otherwise
   */
  const getViewControl = function (presentation, visualizationType) {
    return presentation.visualizations.find(visualization => visualization.type === visualizationType);
  };

  /**
   * Gets the title of the view.
   * @param converterContext The converted context
   * @param viewSettings The settings of the view
   * @returns The title
   */
  const getViewTitle = function (converterContext, viewSettings) {
    if (isViewSettingsOfType(viewSettings, ViewSettingsType.Multi)) {
      const viewAnnotation = converterContext.getEntityTypeAnnotation(viewSettings.annotationPath).annotation;
      return compileExpression(getExpressionFromAnnotation(viewAnnotation.Text));
    }
    return "";
  };

  /**
   * Gets the configured SelectionVariant  of the view.
   * @param viewSettings The settings of the view
   * @returns The SelectionVariant if there is one, undefined otherwise
   */
  const getViewSelectionVariant = function (viewSettings) {
    if (isViewSettingsOfType(viewSettings, ViewSettingsType.Multi)) {
      return viewSettings.annotation && isAnnotationOfType(viewSettings.annotation, "com.sap.vocabularies.UI.v1.SelectionPresentationVariantType") ? `@${viewSettings.annotation.SelectionVariant?.fullyQualifiedName.split("@")[1]}` : viewSettings.annotationPath;
    }
    return undefined;
  };

  /**
   * Gets the visualization path of the view.
   * @param viewSettings The settings of the view
   * @returns The SelectionVariant if there is one, undefined otherwise
   */
  const getViewVisualizationPath = function (viewSettings) {
    if (!isViewSettingsOfType(viewSettings, ViewSettingsType.Custom)) {
      return !isViewSettingsOfType(viewSettings, ViewSettingsType.Combined) && viewSettings.annotation ? viewSettings.converterContext.getRelativeAnnotationPath(viewSettings.annotation.fullyQualifiedName, viewSettings.converterContext.getEntityType()) : "";
    }
    return "";
  };

  /**
   * Gets the list report view definition.
   * @param viewSettings The settings of the view
   * @returns The  definition
   */
  const getView = function (viewSettings) {
    if (!isViewSettingsOfType(viewSettings, ViewSettingsType.Custom)) {
      const converterContext = viewSettings.converterContext;
      const multiViewSettings = isViewSettingsOfType(viewSettings, ViewSettingsType.Multi) ? {
        associatedSelectionVariant: viewSettings.selectionVariant,
        isMacroOrMultipleView: true
      } : {};
      const presentation = getDataVisualizationConfiguration(getViewVisualizationPath(viewSettings), converterContext, {
        ...{
          isCondensedTableLayoutCompliant: true
        },
        ...multiViewSettings
      });
      if (!isViewSettingsOfType(viewSettings, ViewSettingsType.Combined) && presentation.visualizations.length === 2 && converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
        const view = createAlpView([presentation], "both", viewSettings);
        if (view) {
          return view;
        }
      } else if (isViewSettingsOfType(viewSettings, ViewSettingsType.Combined)) {
        const {
          primary,
          secondary
        } = viewSettings;
        if (primary?.length && secondary?.length) {
          const view = createAlpView([getAlpPresentation(converterContext, primary[0], true), getAlpPresentation(converterContext, secondary[0], false)], viewSettings.defaultPath, viewSettings);
          if (view) {
            return view;
          }
        } else if (converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
          throw new Error("SecondaryItems in the Views is not present");
        }
      } else if (isViewSettingsOfType(viewSettings, ViewSettingsType.Multi)) {
        configureMultiViews(presentation, viewSettings);
      }
      const view = createSingleVisualizationView(converterContext, presentation, viewSettings);
      view.presentation.inMultiView = !!multiViewSettings.isMacroOrMultipleView;
      return view;
    } else {
      return getCustomView(viewSettings);
    }
  };

  /**
   * Gets the list report view definitions.
   * @param converterContext The converted context
   * @param multipleViewConfig The manifest configuration related of the multi views
   * @returns The  definitions
   */
  const getViews = function (converterContext, multipleViewConfig) {
    let viewConverterConfigs = [];
    const manifestWrapper = converterContext.getManifestWrapper();
    if (multipleViewConfig) {
      multipleViewConfig.paths.forEach(path => {
        if (manifestWrapper.isCombinedViewConfiguration(path)) {
          if (multipleViewConfig.paths.length > 1) {
            throw new Error("ALP flavor cannot have multiple views");
          } else {
            viewConverterConfigs.push({
              converterContext: converterContext,
              primary: path.primary,
              secondary: path.secondary,
              defaultPath: path.defaultPath,
              type: ViewSettingsType.Combined
            });
          }
        } else if (manifestWrapper.isCustomViewConfiguration(path)) {
          viewConverterConfigs.push({
            key: path.key,
            label: path.label,
            template: path.template,
            type: ViewSettingsType.Custom,
            visible: path.visible
          });
        } else {
          const viewConverterContext = converterContext.getConverterContextFor(path.contextPath || path.entitySet && `/${path.entitySet}` || converterContext.getContextPath()),
            entityType = viewConverterContext.getEntityType();
          if (entityType && viewConverterContext) {
            let annotation;
            const resolvedTarget = viewConverterContext.getEntityTypeAnnotation(path.annotationPath);
            const targetAnnotation = resolvedTarget.annotation;
            if (targetAnnotation) {
              annotation = targetAnnotation.term === "com.sap.vocabularies.UI.v1.SelectionVariant" ? getCompliantVisualizationAnnotation(entityType, viewConverterContext, false) : targetAnnotation;
              viewConverterConfigs.push({
                selectionVariant: targetAnnotation.term === "com.sap.vocabularies.UI.v1.SelectionVariant" ? targetAnnotation : undefined,
                converterContext: viewConverterContext,
                annotation,
                annotationPath: path.annotationPath,
                keepPreviousPersonalization: path.keepPreviousPersonalization,
                key: path.key,
                visible: path.visible,
                type: ViewSettingsType.Multi
              });
            }
          } else {
            // TODO Diagnostics message
          }
        }
      });
    } else {
      const entityType = converterContext.getEntityType();
      if (converterContext.getTemplateType() === TemplateType.AnalyticalListPage) {
        viewConverterConfigs = createAlpViewSettings(converterContext, viewConverterConfigs);
      } else {
        viewConverterConfigs.push({
          annotation: getCompliantVisualizationAnnotation(entityType, converterContext, false),
          converterContext: converterContext,
          type: ViewSettingsType.Default
        });
      }
    }
    return viewConverterConfigs.map(viewConverterConfig => {
      return getView(viewConverterConfig);
    });
  };
  const getMultiViewsControl = function (converterContext, views) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const viewsDefinition = manifestWrapper.getViewConfiguration();
    if (views.length > 1 && !hasMultiVisualizations(converterContext)) {
      return {
        showTabCounts: viewsDefinition ? viewsDefinition.showCounts ?? manifestWrapper.hasMultipleEntitySets() : undefined,
        // with multi EntitySets, tab counts are displayed by default
        id: getIconTabBarID()
      };
    }
    return undefined;
  };

  /**
   * Creates the settings related to an ALP view.
   * @param converterContext The converted context
   * @param viewConfigs The configs of the other list report views
   * @returns The configs of the list report views
   */
  function createAlpViewSettings(converterContext, viewConfigs) {
    const entityType = converterContext.getEntityType();
    const annotation = getCompliantVisualizationAnnotation(entityType, converterContext, true);
    let chart, table;
    if (annotation) {
      viewConfigs.push({
        annotation: annotation,
        converterContext,
        type: ViewSettingsType.Default
      });
    } else {
      chart = getDefaultChart(entityType);
      table = getDefaultLineItem(entityType);
      if (chart && table) {
        const primary = [{
          annotationPath: "@" + chart.term
        }];
        const secondary = [{
          annotationPath: "@" + table.term
        }];
        viewConfigs.push({
          converterContext: converterContext,
          primary: primary,
          secondary: secondary,
          defaultPath: "both",
          type: ViewSettingsType.Combined
        });
      } else {
        throw new Error("ALP flavor needs both chart and table to load the application");
      }
    }
    return viewConfigs;
  }
  function hasMultiVisualizations(converterContext) {
    return converterContext.getManifestWrapper().hasMultipleVisualizations() || converterContext.getTemplateType() === TemplateType.AnalyticalListPage;
  }
  const getHeaderActions = function (converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    return insertCustomElements([], getActionsFromManifest(manifestWrapper.getHeaderActions(), converterContext).actions);
  };

  /**
   * Sets the filterBarId on the scenario with multi entity sets.
   * @param views The definition of the list report views
   * @param filterBarId
   */
  _exports.getHeaderActions = getHeaderActions;
  const checkChartFilterBarId = function (views, filterBarId) {
    views.forEach(view => {
      if (!isViewDefinitionOfType(view, ViewDefinitionType.Custom) && !isViewDefinitionOfType(view, ViewDefinitionType.Combined)) {
        view.presentation.visualizations.forEach(visualizationDefinition => {
          if (visualizationDefinition.type === VisualizationType.Chart && visualizationDefinition.filterId !== filterBarId) {
            visualizationDefinition.filterId = filterBarId;
          }
        });
      }
    });
  };

  /**
   * Creates the ListReportDefinition for multiple entity sets (multiple table mode).
   * @param converterContext The converter context
   * @param capabilities The predefined environment capabilities
   * @returns The list report definition based on annotation + manifest
   */
  const convertPage = function (converterContext, capabilities) {
    const entityType = converterContext.getEntityType();
    const sContextPath = converterContext.getContextPath();
    if (!sContextPath) {
      // If we don't have an entitySet at this point we have an issue I'd say
      throw new Error("An EntitySet is required to be able to display a ListReport, please adjust your `entitySet` property to point to one.");
    }
    const manifestWrapper = converterContext.getManifestWrapper();
    const viewsDefinition = manifestWrapper.getViewConfiguration();
    const hasMultipleEntitySets = manifestWrapper.hasMultipleEntitySets();
    const views = getViews(converterContext, viewsDefinition);
    const lrTableVisualizations = getTableVisualizations(views);
    const lrChartVisualizations = getChartVisualizations(views);
    const showPinnableToggle = lrTableVisualizations.some(table => table.control.type === "ResponsiveTable");
    let singleTableId = "";
    let singleChartId = "";
    const dynamicListReportId = getDynamicListReportID();
    const filterBarId = getFilterBarID(sContextPath);
    const filterVariantManagementID = getFilterVariantManagementID(filterBarId);
    const fbConfig = manifestWrapper.getFilterConfiguration();
    const filterInitialLayout = fbConfig?.initialLayout !== undefined ? fbConfig?.initialLayout.toLowerCase() : "compact";
    const filterLayout = fbConfig?.layout !== undefined ? fbConfig?.layout.toLowerCase() : "compact";
    const useSemanticDateRange = fbConfig.useSemanticDateRange !== undefined ? fbConfig.useSemanticDateRange : true;
    const showClearButton = fbConfig.showClearButton !== undefined ? fbConfig.showClearButton : false;
    const config = getContentAreaId(views);
    if (config) {
      singleChartId = config.chartId;
      singleTableId = config.tableId;
    }
    const useHiddenFilterBar = manifestWrapper.useHiddenFilterBar();
    // Chart has a dependency to filter bar (issue with loading data). Once resolved, the check for chart should be removed here.
    // Until then, hiding filter bar is now allowed if a chart is being used on LR.
    const hideFilterBar = (manifestWrapper.isFilterBarHidden() || useHiddenFilterBar) && singleChartId === "";
    const lrFilterProperties = getSelectionFields(converterContext, lrTableVisualizations);
    const selectionFields = lrFilterProperties.selectionFields;
    const propertyInfoFields = lrFilterProperties.sPropertyInfo;
    const hideBasicSearch = getFilterBarHideBasicSearch(lrTableVisualizations, lrChartVisualizations, converterContext);
    const multiViewControl = getMultiViewsControl(converterContext, views);
    const selectionVariant = multiViewControl ? undefined : getSelectionVariant(entityType, converterContext);
    const defaultSemanticDates = useSemanticDateRange ? getDefaultSemanticDates(getManifestFilterFields(entityType, converterContext)) : {};
    // Sort header actions according to position attributes in manifest
    const headerActions = getHeaderActions(converterContext);
    if (hasMultipleEntitySets) {
      checkChartFilterBarId(views, filterBarId);
    }
    const visualizationIds = lrTableVisualizations.map(visualization => {
      //pick up the table API id for the table, since that is the external control.
      // variant management still works because it can handle a control where the child has flex changes.
      return visualization.annotation.apiId;
    }).concat(lrChartVisualizations.map(visualization => {
      return visualization.apiId;
    }));
    const targetControlIds = [...(hideFilterBar && !useHiddenFilterBar ? [] : [filterBarId]), ...(manifestWrapper.getVariantManagement() !== VariantManagementType.Control ? visualizationIds : []), ...(multiViewControl ? [multiViewControl.id] : [])];
    const stickySubheaderProvider = multiViewControl && manifestWrapper.getStickyMultiTabHeaderConfiguration() ? multiViewControl.id : undefined;

    // Check if all tables on the main entity set are Tree or analytical tables. If that's the case, the draft editState filter shall not be shown
    const disableDraftEditStateFilter = capabilities?.HiddenDraft?.enabled || lrTableVisualizations.every(tableVisualization => {
      return tableVisualization.control.type === "TreeTable" || tableVisualization.enableAnalytics || tableVisualization.annotation.collection !== sContextPath;
    });
    return {
      mainEntitySet: sContextPath,
      mainEntityType: `${sContextPath}/`,
      multiViewsControl: multiViewControl,
      stickySubheaderProvider,
      singleTableId,
      singleChartId,
      dynamicListReportId,
      headerActions,
      easyFilterEnabled: !hideFilterBar && capabilities?.MagicFiltering,
      showPinnableToggle: showPinnableToggle,
      filterBar: {
        propertyInfo: propertyInfoFields,
        selectionFields,
        hideBasicSearch,
        showClearButton,
        disableDraftEditStateFilter,
        showDraftEditStatus: showDraftEditStatus(converterContext)
      },
      views: views,
      filterBarId: hideFilterBar && !useHiddenFilterBar ? "" : filterBarId,
      filterConditions: {
        selectionVariant: selectionVariant,
        defaultSemanticDates: defaultSemanticDates
      },
      variantManagement: {
        id: filterVariantManagementID,
        targetControlIds: targetControlIds.join(",")
      },
      hasMultiVisualizations: hasMultiVisualizations(converterContext),
      templateType: manifestWrapper.getTemplateType(),
      useSemanticDateRange,
      filterInitialLayout,
      filterLayout,
      kpiDefinitions: getKPIDefinitions(converterContext),
      hideFilterBar,
      useHiddenFilterBar,
      collapsedHeaderFragment: manifestWrapper.getCollapsedHeaderFragment(),
      expandedHeaderFragment: manifestWrapper.getExpandedHeaderFragment()
    };
  };

  /**
   * Gets the content area ids of the list report.
   * @param views The definitions of the list report views
   * @returns The content area ids
   */
  _exports.convertPage = convertPage;
  function getContentAreaId(views) {
    const singleTableId = views.find(view => (isViewDefinitionOfType(view, ViewDefinitionType.Combined) || isViewDefinitionOfType(view, ViewDefinitionType.SingleTable)) && !!view.tableControlId)?.tableControlId ?? "",
      singleChartId = views.find(view => (isViewDefinitionOfType(view, ViewDefinitionType.Combined) || isViewDefinitionOfType(view, ViewDefinitionType.SingleChart)) && !!view.chartControlId)?.chartControlId ?? "";
    if (singleTableId || singleChartId) {
      return {
        chartId: singleChartId,
        tableId: singleTableId
      };
    }
    return undefined;
  }
  return _exports;
}, false);
//# sourceMappingURL=ListReportConverter-dbg.js.map
