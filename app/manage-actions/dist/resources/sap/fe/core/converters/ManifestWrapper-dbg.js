/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/fe/core/converters/ManifestSettings", "sap/ui/Device"], function (merge, ManifestSettings, Device) {
  "use strict";

  var VariantManagementType = ManifestSettings.VariantManagementType;
  function ensureAnnotationPath(obj, property) {
    const propertyValue = obj?.[property];
    if (Array.isArray(propertyValue)) {
      propertyValue.forEach(entry => ensureAnnotationPath(entry, "annotationPath"));
    } else if (propertyValue && typeof propertyValue === "string" && !propertyValue.includes("@")) {
      obj[property] = "@" + propertyValue;
    }
  }

  /**
   *
   */
  let ManifestWrapper = /*#__PURE__*/function () {
    /**
     * Creates a wrapper object to ensure the data returned from the manifest is consistent and everything is merged correctly.
     * @param oManifestSettings The manifest settings for the current page
     * @param appComponent The app component
     * @returns The manifest wrapper object
     */
    function ManifestWrapper(oManifestSettings, appComponent) {
      this.oManifestSettings = oManifestSettings;
      this.appComponent = appComponent;
      // Ensure that properties which are meant to contain an *annotation* path contain a '@'
      ensureAnnotationPath(this.oManifestSettings, "defaultTemplateAnnotationPath");
      this.oManifestSettings.views?.paths.forEach(path => {
        ensureAnnotationPath(path, "annotationPath");
        ensureAnnotationPath(path, "primary");
        ensureAnnotationPath(path, "secondary");
      });
      if (this.oManifestSettings.controlConfiguration) {
        for (const controlConfiguration of Object.values(this.oManifestSettings.controlConfiguration)) {
          const quickVariantSelection = controlConfiguration.tableSettings?.quickVariantSelection;
          ensureAnnotationPath(quickVariantSelection, "paths");
        }
      }
    }

    /**
     * Returns the global manifest content sap.fe.
     * @returns The Object manifest sap.fe
     */
    var _proto = ManifestWrapper.prototype;
    _proto.getSapFeManifestConfiguration = function getSapFeManifestConfiguration() {
      return this.oManifestSettings.sapFeManifestConfiguration;
    }

    /**
     * Returns the current template type.
     * @returns The type of the current template
     */;
    _proto.getTemplateType = function getTemplateType() {
      return this.oManifestSettings.converterType;
    }

    /**
     * Checks whether the current template should display the filter bar.
     * @returns `true` if the filter bar should be hidden
     */;
    _proto.isFilterBarHidden = function isFilterBarHidden() {
      return !!this.oManifestSettings?.hideFilterBar;
    };
    _proto.useHiddenFilterBar = function useHiddenFilterBar() {
      return !!this.oManifestSettings?.useHiddenFilterBar;
    };
    _proto.getCollapsedHeaderFragment = function getCollapsedHeaderFragment() {
      return this.oManifestSettings?.content?.header?.customHeader?.collapsedHeaderFragment;
    };
    _proto.getExpandedHeaderFragment = function getExpandedHeaderFragment() {
      return this.oManifestSettings?.content?.header?.customHeader?.expandedHeaderFragment;
    }

    /**
     * Checks whether the current environment is a desktop or not.
     * @returns `true` if we are on a desktop
     */;
    _proto.isDesktop = function isDesktop() {
      return !!this.oManifestSettings.isDesktop;
    }

    /**
     * Checks whether the current environment is a mobile phone or not.
     * @returns `true` if we are on a mobile phone
     */;
    _proto.isPhone = function isPhone() {
      return !!this.oManifestSettings.isPhone;
    }

    /**
     * Retrieves the form containers (field groups or identification) defined in the manifest.
     * @param facetTarget The target annotation path for this form
     * @returns A set of form containers defined in the manifest indexed by an iterable key
     */;
    _proto.getFormContainer = function getFormContainer(facetTarget) {
      return this.oManifestSettings.controlConfiguration?.[facetTarget];
    }

    /**
     * Retrieves the header facets defined in the manifest.
     * @returns A set of header facets defined in the manifest indexed by an iterable key
     */;
    _proto.getHeaderFacets = function getHeaderFacets() {
      return merge({}, this.oManifestSettings.controlConfiguration?.["@com.sap.vocabularies.UI.v1.HeaderFacets"]?.facets ?? {}, this.oManifestSettings.content?.header?.facets ?? {});
    }

    /**
     * Retrieves the header actions defined in the manifest.
     * @returns A set of actions defined in the manifest indexed by an iterable key
     */;
    _proto.getHeaderActions = function getHeaderActions() {
      return this.oManifestSettings.content?.header?.actions || {};
    }

    /**
     * Retrieves the footer actions defined in the manifest.
     * @returns A set of actions defined in the manifest indexed by an iterable key
     */;
    _proto.getFooterActions = function getFooterActions() {
      return this.oManifestSettings.content?.footer?.actions || {};
    }

    /**
     * Retrieves the variant management as defined in the manifest.
     * @returns A type of variant management
     */;
    _proto.getVariantManagement = function getVariantManagement() {
      return this.oManifestSettings.variantManagement || VariantManagementType.None;
    }

    /**
     * Retrieves the annotation Path for the SPV in the manifest.
     * @returns The annotation path for the default SPV or undefined.
     */;
    _proto.getDefaultTemplateAnnotationPath = function getDefaultTemplateAnnotationPath() {
      return this.oManifestSettings.defaultTemplateAnnotationPath;
    }

    /**
     * Retrieves the control configuration as defined in the manifest for a specific annotation path.
     * @param sAnnotationPath The relative annotation path
     * @returns The control configuration
     */;
    _proto.getControlConfiguration = function getControlConfiguration(sAnnotationPath) {
      return this.oManifestSettings?.controlConfiguration?.[sAnnotationPath] || {};
    }

    /**
     * Retrieves the configured settings for a given navigation target.
     * @param navigationOrCollectionName The name of the navigation to check
     * @returns The navigation settings configuration
     */;
    _proto.getNavigationConfiguration = function getNavigationConfiguration(navigationOrCollectionName) {
      return this.oManifestSettings?.navigation?.[navigationOrCollectionName] || {};
    }

    /**
     * Retrieves the view level.
     * @returns The current view level
     */;
    _proto.getViewLevel = function getViewLevel() {
      return this.oManifestSettings?.viewLevel || -1;
    }

    /**
     * Retrieves the contentDensities setting of the application.
     * @returns The current content density
     */;
    _proto.getContentDensities = function getContentDensities() {
      return this.oManifestSettings?.contentDensities || {
        cozy: false,
        compact: false
      };
    }

    /**
     * Checks whether we are in FCL mode or not.
     * @returns `true` if we are in FCL
     */;
    _proto.isFclEnabled = function isFclEnabled() {
      return !!this.oManifestSettings?.fclEnabled;
    }

    /**
     * Checks whether the current settings (application / shell) allows us to use condensed layout.
     * @returns `true` if we can use the condensed layout, false otherwise
     */;
    _proto.isCondensedLayoutCompliant = function isCondensedLayoutCompliant() {
      const manifestContentDensity = this.oManifestSettings?.contentDensities || {
        cozy: false,
        compact: false
      };
      const shellContentDensity = this.oManifestSettings?.shellContentDensity || "compact";
      let isCondensedLayoutCompliant = true;
      const isSmallDevice = !Device.system.desktop || Device.resize.width <= 320;
      if (manifestContentDensity?.cozy === true && manifestContentDensity?.compact !== true || shellContentDensity === "cozy" || isSmallDevice) {
        isCondensedLayoutCompliant = false;
      }
      return isCondensedLayoutCompliant;
    }

    /**
     * Checks whether the current settings (application / shell) uses compact mode as content density.
     * @returns `true` if compact mode is set as content density, false otherwise
     */;
    _proto.isCompactType = function isCompactType() {
      const manifestContentDensity = this.getContentDensities();
      const shellContentDensity = this.oManifestSettings?.shellContentDensity || "compact";
      return manifestContentDensity.compact !== false || shellContentDensity === "compact" ? true : false;
    }

    /**
     * Retrieves the outbound navigation entries defined in the cross-navigation section of the application manifest.
     * @returns The entries if they exist, otherwise undefined
     */;
    _proto.getOutboundNavigationEntries = function getOutboundNavigationEntries() {
      return this.appComponent?.getManifestEntry("sap.app")?.crossNavigation?.outbounds;
    }

    //region OP Specific

    /**
     * Retrieves the section layout defined in the manifest.
     * @returns The type of section layout of the object page
     */;
    _proto.getSectionLayout = function getSectionLayout() {
      return this.oManifestSettings.sectionLayout ?? "Tabs";
    }

    /**
     * Retrieves the sections defined in the manifest.
     * @returns A set of manifest sections indexed by an iterable key
     */;
    _proto.getSections = function getSections() {
      return merge({}, this.oManifestSettings.controlConfiguration?.["@com.sap.vocabularies.UI.v1.Facets"]?.sections ?? {}, this.oManifestSettings.content?.body?.sections ?? {});
    }

    /**
     * Returns true of the header of the application is editable and should appear in the facets.
     * @returns `true` if the header if editable
     */;
    _proto.isHeaderEditable = function isHeaderEditable() {
      return this.getShowObjectPageHeader() && !!this.oManifestSettings.editableHeaderContent;
    }

    /**
     * Returns true if we should use text instead of IllustratedMessage for the noData aggregation in the whole page.
     * @returns `true` if we should use text for noData aggregation
     */;
    _proto.getUseTextForNoDataMessages = function getUseTextForNoDataMessages() {
      return this.oManifestSettings.useTextForNoDataMessages ?? false;
    }

    /**
     * Returns true if we should show the object page header.
     * @returns `true` if the header should be displayed
     */;
    _proto.getShowAnchorBar = function getShowAnchorBar() {
      return this.oManifestSettings.content?.header?.anchorBarVisible !== undefined ? !!this.oManifestSettings.content?.header?.anchorBarVisible : true;
    }

    /**
     * Defines whether or not the section will be displayed in different tabs.
     * @returns `true` if the icon tab bar should be used instead of scrolling
     */;
    _proto.useIconTabBar = function useIconTabBar() {
      return this.getShowAnchorBar() && this.oManifestSettings.sectionLayout === "Tabs";
    }

    /**
     * Returns true if the object page header is to be shown.
     * @returns `true` if the object page header is to be displayed
     */;
    _proto.getShowObjectPageHeader = function getShowObjectPageHeader() {
      return this.oManifestSettings.content?.header?.visible !== undefined ? !!this.oManifestSettings.content?.header?.visible : true;
    }

    /**
     * Returns whether the lazy loader should be enabled for this page or not.
     * @returns `true` if the lazy loader should be enabled
     */;
    _proto.getEnableLazyLoading = function getEnableLazyLoading() {
      return this.oManifestSettings.enableLazyLoading ?? false;
    }

    /**
     * Returns the transport selection definition.
     * @returns Definition with transport property and select action
     */;
    _proto.getTransportSelection = function getTransportSelection() {
      return this.oManifestSettings.content?.transportSelection;
    }

    //endregion OP Specific

    //region LR Specific

    /**
     * Retrieves the multiple view configuration from the manifest.
     * @returns The views that represent the manifest object
     */;
    _proto.getViewConfiguration = function getViewConfiguration() {
      return this.oManifestSettings.views;
    }

    /**
     * Retrieves the stickyMultiTabHeader configuration from the manifest.
     * @returns Returns True if stickyMultiTabHeader is enabled or undefined
     */;
    _proto.getStickyMultiTabHeaderConfiguration = function getStickyMultiTabHeaderConfiguration() {
      const bStickyMultiTabHeader = this.oManifestSettings.stickyMultiTabHeader;
      return bStickyMultiTabHeader !== undefined ? bStickyMultiTabHeader : true;
    }

    /**
     * Retrieves the KPI configuration from the manifest.
     * @returns Returns a map between KPI names and their respective configuration
     */;
    _proto.getKPIConfiguration = function getKPIConfiguration() {
      return this.oManifestSettings.keyPerformanceIndicators || {};
    }

    /**
     * Retrieves the filter configuration from the manifest.
     * @param configPath
     * @returns The filter configuration from the manifest
     */;
    _proto.getFilterConfiguration = function getFilterConfiguration() {
      let configPath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "@com.sap.vocabularies.UI.v1.SelectionFields";
      return this.getControlConfiguration(configPath);
    }

    /**
     * Returns true if there are multiple entity sets to be displayed.
     * @returns `true` if there are multiple entity sets
     */;
    _proto.hasMultipleEntitySets = function hasMultipleEntitySets() {
      const viewConfig = this.getViewConfiguration() || {
        paths: []
      };
      const manifestEntitySet = this.oManifestSettings.entitySet;
      return viewConfig.paths.find(path => {
        if (path?.template) {
          return undefined;
        } else if (this.hasMultipleVisualizations(path)) {
          const {
            primary,
            secondary
          } = path;
          return primary.some(primaryPath => primaryPath.entitySet && primaryPath.entitySet !== manifestEntitySet) || secondary.some(secondaryPath => secondaryPath.entitySet && secondaryPath.entitySet !== manifestEntitySet);
        } else {
          path = path;
          return path.entitySet && path.entitySet !== manifestEntitySet;
        }
      }) !== undefined;
    }

    /**
     * Returns the context path for the template if it is specified in the manifest.
     * @returns The context path for the template
     */;
    _proto.getContextPath = function getContextPath() {
      return this.oManifestSettings?.contextPath;
    }

    /**
     * Returns true if the configuration is a single path configuration.
     * @param viewConfig The view configuration
     * @returns `true` if this is a single path configuration
     */;
    _proto.isViewPathConfiguration = function isViewPathConfiguration(viewConfig) {
      return "annotationPath" in viewConfig && !("primary" in viewConfig) && !("secondary" in viewConfig);
    }

    /**
     * Returns true if the configuration is a combined configuration.
     * @param viewConfig The view configuration
     * @returns `true` if this is a combined configuration
     */;
    _proto.isCombinedViewConfiguration = function isCombinedViewConfiguration(viewConfig) {
      return !this.isCustomViewConfiguration(viewConfig) && !this.isViewPathConfiguration(viewConfig) ? viewConfig.primary?.length > 0 && viewConfig.secondary?.length > 0 : false;
    }

    /**
     * Returns true if the configuration is a custom configuration.
     * @param viewConfig The view configuration
     * @returns `true` if this is a custom configuration
     */;
    _proto.isCustomViewConfiguration = function isCustomViewConfiguration(viewConfig) {
      return "template" in viewConfig;
    }

    /**
     * Returns true if there are multiple visualizations.
     * @param viewConfig The path from the view
     * @returns `true` if there are multiple visualizations
     */;
    _proto.hasMultipleVisualizations = function hasMultipleVisualizations(viewConfig) {
      if (!viewConfig) {
        const multipleViewsConfiguration = this.getViewConfiguration() || {
          paths: []
        };
        return multipleViewsConfiguration.paths.some(path => this.isCombinedViewConfiguration(path));
      }
      return this.isCombinedViewConfiguration(viewConfig);
    }

    /**
     * Retrieves the entity set defined in the manifest.
     * @returns The entity set defined in the manifest
     */;
    _proto.getEntitySet = function getEntitySet() {
      return this.oManifestSettings.entitySet;
    };
    _proto.hasInlineEdit = function hasInlineEdit() {
      return !!this.oManifestSettings.inlineEdit?.disabledFields || (this.oManifestSettings?.inlineEdit?.enabledFields?.length ?? 0) > 0;
    };
    _proto.getInlineEditEnabledFields = function getInlineEditEnabledFields() {
      return this.oManifestSettings?.inlineEdit?.enabledFields ?? [];
    };
    _proto.getInlineEditDisabledFields = function getInlineEditDisabledFields() {
      return this.oManifestSettings?.inlineEdit?.disabledFields ?? [];
    };
    _proto.getInlineConnectedFields = function getInlineConnectedFields() {
      return this.oManifestSettings?.inlineEdit?.connectedFields ?? [];
    }
    //end region LR Specific
    ;
    return ManifestWrapper;
  }();
  return ManifestWrapper;
}, false);
//# sourceMappingURL=ManifestWrapper-dbg.js.map
