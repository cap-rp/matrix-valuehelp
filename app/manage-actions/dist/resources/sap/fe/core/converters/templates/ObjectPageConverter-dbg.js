/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/objectPage/HeaderAndFooterAction", "../../helpers/BindingHelper", "../ManifestSettings", "../controls/ObjectPage/Avatar", "../controls/ObjectPage/HeaderFacet", "../controls/ObjectPage/SubSection", "../helpers/ConfigurableObject", "../helpers/ID"], function (BindingToolkit, Action, HeaderAndFooterAction, BindingHelper, ManifestSettings, Avatar, HeaderFacet, SubSection, ConfigurableObject, ID) {
  "use strict";

  var _exports = {};
  var getSectionID = ID.getSectionID;
  var getEditableHeaderSectionID = ID.getEditableHeaderSectionID;
  var getCustomSectionID = ID.getCustomSectionID;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var createSubSections = SubSection.createSubSections;
  var createCustomSubSections = SubSection.createCustomSubSections;
  var createCustomHeaderFacetSubSections = SubSection.createCustomHeaderFacetSubSections;
  var SubSectionType = SubSection.SubSectionType;
  var getHeaderFacetsFromManifest = HeaderFacet.getHeaderFacetsFromManifest;
  var getHeaderFacetsFromAnnotations = HeaderFacet.getHeaderFacetsFromAnnotations;
  var getAvatar = Avatar.getAvatar;
  var VisualizationType = ManifestSettings.VisualizationType;
  var TemplateType = ManifestSettings.TemplateType;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var UI = BindingHelper.UI;
  var getHiddenHeaderActions = HeaderAndFooterAction.getHiddenHeaderActions;
  var getHeaderDefaultActions = HeaderAndFooterAction.getHeaderDefaultActions;
  var getFooterDefaultActions = HeaderAndFooterAction.getFooterDefaultActions;
  var removeDuplicateActions = Action.removeDuplicateActions;
  var prepareMenuActions = Action.prepareMenuActions;
  var getVisibilityEnablementMenuActions = Action.getVisibilityEnablementMenuActions;
  var getMatchingManifestAction = Action.getMatchingManifestAction;
  var getAnnotationMenuActionItems = Action.getAnnotationMenuActionItems;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var not = BindingToolkit.not;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const getSectionKey = (facetDefinition, fallback) => {
    return facetDefinition.ID?.toString() || facetDefinition.Label?.toString() || fallback;
  };

  /**
   * Creates a section that represents the editable header part; it is only visible in edit mode.
   * @param converterContext The converter context
   * @param allHeaderFacets The converter context
   * @returns The section representing the editable header parts
   */
  function createEditableHeaderSection(converterContext, allHeaderFacets) {
    const editableHeaderSectionID = getEditableHeaderSectionID();
    const headerFacets = converterContext.getEntityType().annotations?.UI?.HeaderFacets;
    const headerfacetSubSections = headerFacets ? createSubSections(headerFacets, converterContext, true) : [];
    const customHeaderFacetSubSections = createCustomHeaderFacetSubSections(converterContext);
    let allHeaderFacetsSubSections = [];
    if (customHeaderFacetSubSections.length > 0) {
      // merge annotation based header facets and custom header facets in the right order
      let i = 0;
      allHeaderFacets.forEach(function (item) {
        // hidden header facets are not included in allHeaderFacets array => add them anyway
        while (headerfacetSubSections.length > i && headerfacetSubSections[i].visible === "false") {
          allHeaderFacetsSubSections.push(headerfacetSubSections[i]);
          i++;
        }
        if (headerfacetSubSections.length > i && (item.key === headerfacetSubSections[i].key ||
        // for header facets with no id the keys of header facet and subsection are different => check only the last part
        item.key.slice(item.key.lastIndexOf("::") + 2) === headerfacetSubSections[i].key.slice(headerfacetSubSections[i].key.lastIndexOf("::") + 2))) {
          allHeaderFacetsSubSections.push(headerfacetSubSections[i]);
          i++;
        } else {
          customHeaderFacetSubSections.forEach(function (customItem) {
            if (item.key === customItem.key) {
              allHeaderFacetsSubSections.push(customItem);
            }
          });
        }
      });
    } else {
      allHeaderFacetsSubSections = headerfacetSubSections;
    }
    const headerSection = {
      id: editableHeaderSectionID,
      key: "EditableHeaderContent",
      title: "{sap.fe.i18n>T_COMMON_OBJECT_PAGE_HEADER_SECTION}",
      visible: compileExpression(UI.IsEditable),
      subSections: allHeaderFacetsSubSections
    };
    return headerSection;
  }

  /**
   * Creates a definition for a section based on the Facet annotation.
   * @param converterContext The converter context
   * @returns All sections
   */
  _exports.createEditableHeaderSection = createEditableHeaderSection;
  function getSectionsFromAnnotation(converterContext) {
    const entityType = converterContext.getEntityType();
    const objectPageSections = entityType.annotations?.UI?.Facets?.map(facetDefinition => getSectionFromAnnotation(facetDefinition, converterContext)) || [];
    return objectPageSections;
  }

  /**
   * Check manifest for setting 'useSingleTextAreaFieldAsNotes'.
   * If this setting is true, then the label of the single text-area field in a form container will be hidden.
   * @param manifestWrapper
   * @param sectionKey
   * @returns If the form element's label needs to be hidden.
   */
  function getUseSingleTextAreaFieldAsNotes(manifestWrapper, sectionKey) {
    const sectionsInManifest = manifestWrapper.getSections();
    const sectionSettings = sectionsInManifest?.[sectionKey];
    return sectionSettings?.useSingleTextAreaFieldAsNotes ?? false;
  }

  /**
   * Create an annotation based section.
   * @param facet
   * @param converterContext
   * @returns The current section
   */
  function getSectionFromAnnotation(facet, converterContext) {
    const sectionID = getSectionID(facet);
    const sectionKey = getSectionKey(facet, sectionID);
    // Set absolute binding path for Singleton references, otherwise the configured annotation path itself.
    const hiddenExpression = getExpressionFromAnnotation(facet.annotations?.UI?.Hidden, [], false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), []));
    const useSingleTextAreaFieldAsNotes = getUseSingleTextAreaFieldAsNotes(converterContext.getManifestWrapper(), sectionKey);
    const section = {
      id: sectionID,
      key: sectionKey,
      title: facet.Label ? compileExpression(getExpressionFromAnnotation(facet.Label)) : undefined,
      showTitle: !!facet.Label,
      visible: compileExpression(not(equal(hiddenExpression, true))),
      subSections: createSubSections([facet], converterContext, undefined, useSingleTextAreaFieldAsNotes),
      useSingleTextAreaFieldAsNotes: useSingleTextAreaFieldAsNotes
    };
    return section;
  }

  /**
   * Creates section definitions based on the manifest definitions.
   * @param manifestSections The sections defined in the manifest
   * @param converterContext
   * @returns The sections defined in the manifest
   */
  function getSectionsFromManifest(manifestSections, converterContext) {
    const sections = {};
    Object.keys(manifestSections).forEach(manifestSectionKey => {
      sections[manifestSectionKey] = getSectionFromManifest(manifestSections[manifestSectionKey], manifestSectionKey, converterContext);
    });
    return sections;
  }

  /**
   * Create a manifest-based custom section.
   * @param customSectionDefinition
   * @param sectionKey
   * @param converterContext
   * @returns The current custom section
   */
  function getSectionFromManifest(customSectionDefinition, sectionKey, converterContext) {
    const customSectionID = customSectionDefinition.id || getCustomSectionID(sectionKey);
    let position = customSectionDefinition.position;
    if (!position) {
      position = {
        placement: Placement.After
      };
    }
    let manifestSubSections;
    if (!customSectionDefinition.subSections) {
      // If there is no subSection defined, we add the content of the custom section as subsections
      // and make sure to set the visibility to 'true', as the actual visibility is handled by the section itself
      manifestSubSections = {
        [sectionKey]: {
          ...customSectionDefinition,
          position: undefined,
          visible: "true",
          applyState: undefined,
          retrieveState: undefined
        }
      };
    } else {
      manifestSubSections = customSectionDefinition.subSections;
    }
    const subSections = createCustomSubSections(manifestSubSections, converterContext);
    const customSection = {
      id: customSectionID,
      key: sectionKey,
      title: customSectionDefinition.title,
      showTitle: !!customSectionDefinition.title,
      visible: customSectionDefinition.visible !== undefined ? customSectionDefinition.visible : "true",
      position: position,
      subSections: subSections,
      onSectionLoaded: customSectionDefinition.onSectionLoaded,
      applyState: customSectionDefinition.applyState,
      retrieveState: customSectionDefinition.retrieveState
    };
    return customSection;
  }

  /**
   * Retrieves the ObjectPage header actions (both the default ones and the custom ones defined in the manifest).
   * @param converterContext The converter context
   * @param capabilities
   * @returns An array containing all the actions for this ObjectPage header
   */
  const getHeaderActions = function (converterContext, capabilities) {
    // 1. Get actions from annotations
    const annotationHeaderActions = getHeaderDefaultActions(converterContext, capabilities);
    const manifestWrapper = converterContext.getManifestWrapper();
    const actionOverwriteConfig = {
      isNavigable: OverrideType.overwrite,
      enabled: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      defaultValuesExtensionFunction: OverrideType.overwrite,
      command: OverrideType.overwrite,
      position: OverrideType.overwrite,
      menu: OverrideType.overwrite
    };
    // 2. Get actions from manifest
    const manifestActions = getActionsFromManifest(manifestWrapper.getHeaderActions(), converterContext, annotationHeaderActions, undefined, undefined, getHiddenHeaderActions(converterContext));
    // 3. Get all annotation menu items
    const annotationMenuActionItems = getAnnotationMenuActionItems(annotationHeaderActions);
    // 4. Find manifest actions which override any annotation menu items
    const matchingManifestActions = getMatchingManifestAction(annotationMenuActionItems, manifestActions.actions);
    // 5. Get overridden annotation menu items
    const overwrittenMenuActionItems = insertCustomElements(annotationMenuActionItems, matchingManifestActions, actionOverwriteConfig);
    // 6. Override all actions
    let headerActions = insertCustomElements(annotationHeaderActions, manifestActions.actions, actionOverwriteConfig);
    // 7. Replace original menu items with their corresponding overridden menu items
    prepareMenuActions(headerActions, overwrittenMenuActionItems);
    // 8. Remove duplicate actions which are menu items
    headerActions = removeDuplicateActions(headerActions);
    // 9. Hide menus where all menu items are hidden
    headerActions = getVisibilityEnablementMenuActions(headerActions);
    return {
      actions: headerActions,
      commandActions: manifestActions.commandActions
    };
  };

  /**
   * Retrieves the ObjectPage footer actions (both the default ones and the custom ones defined in the manifest).
   * @param converterContext The converter context
   * @param capabilities The predefined environment capabilities
   * @returns An array containing all the actions for this ObjectPage footer
   */
  _exports.getHeaderActions = getHeaderActions;
  const getFooterActions = function (converterContext, capabilities) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const aAnnotationFooterActions = getFooterDefaultActions(manifestWrapper.getViewLevel(), converterContext, capabilities);
    const manifestActions = getActionsFromManifest(manifestWrapper.getFooterActions(), converterContext, aAnnotationFooterActions);
    const actionOverwriteConfig = {
      isNavigable: OverrideType.overwrite,
      enabled: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      defaultValuesExtensionFunction: OverrideType.overwrite,
      command: OverrideType.overwrite,
      position: OverrideType.overwrite
    };
    const footerActions = insertCustomElements(aAnnotationFooterActions, manifestActions.actions, actionOverwriteConfig);
    return {
      actions: footerActions,
      commandActions: manifestActions.commandActions
    };
  };
  _exports.getFooterActions = getFooterActions;
  function _getSubSectionVisualization(subSection) {
    return subSection?.presentation?.visualizations[0] ? subSection.presentation.visualizations[0] : undefined;
  }
  function _isFacetHasNonResponsiveTableVisible(dataVisualizationSubSection, subSectionVisualization) {
    return dataVisualizationSubSection.visible === "true" && dataVisualizationSubSection?.presentation?.visualizations && subSectionVisualization?.type === "Table" && subSectionVisualization?.control?.type !== "ResponsiveTable";
  }
  function _setNonResponsiveTableVisualizationInformation(sections, dataVisualizationSubSection, subSectionVisualization, sectionLayout) {
    if (_isFacetHasNonResponsiveTableVisible(dataVisualizationSubSection, subSectionVisualization)) {
      const tableControlConfiguration = subSectionVisualization.control;
      dataVisualizationSubSection.dataVisualizationOptions ??= {};
      if (!(sectionLayout === "Page" && sections.length > 1)) {
        dataVisualizationSubSection.dataVisualizationOptions["rowCountMode"] = "Auto";
        tableControlConfiguration.rowCountMode = "Auto";
      }
      if (sectionLayout !== "Tabs") {
        dataVisualizationSubSection.dataVisualizationOptions["useCondensedTableLayout"] = false;
        tableControlConfiguration.useCondensedTableLayout = false;
      }
    }
  }
  function _setNonResponsiveTableWithMixFacetsInformation(subSection, sectionLayout) {
    const firstSection = subSection?.content?.length === 1 ? subSection.content[0] : undefined;
    if (firstSection?.type === SubSectionType.DataVisualization) {
      const tableControl = (firstSection.presentation?.visualizations[0]).control;
      if (tableControl.type !== "ResponsiveTable") {
        firstSection.dataVisualizationOptions ??= {};
        firstSection.dataVisualizationOptions["rowCountMode"] = "Auto";
        tableControl.rowCountMode = "Auto";
        if (sectionLayout !== "Tabs") {
          firstSection.dataVisualizationOptions["useCondensedTableLayout"] = false;
          tableControl.useCondensedTableLayout = false;
        }
      }
    }
  }

  /**
   * Set the NonResponsive Table (grid, tree, analytical) display information.
   * @param sections The ObjectPage sections
   * @param section The current ObjectPage section processed
   * @param sectionLayout
   */
  function _setNonResponsiveTableSubSectionControlConfiguration(sections, section, sectionLayout) {
    let subSectionVisualization;
    const subSections = section.subSections;
    if (subSections.length === 1) {
      const subSection = subSections[0];
      switch (subSection.type) {
        case "DataVisualization":
          subSectionVisualization = _getSubSectionVisualization(subSection);
          _setNonResponsiveTableVisualizationInformation(sections, subSection, subSectionVisualization, sectionLayout);
          break;
        case "Mixed":
          _setNonResponsiveTableWithMixFacetsInformation(subSection, sectionLayout);
          break;
        default:
          break;
      }
      return;
    }
    _removeCondensedFromSubSections(subSections);
  }

  /**
   * Remove the condense layout mode from the subsections.
   * @param subSections The subSections where we need to remove the condensed layout
   */
  function _removeCondensedFromSubSections(subSections) {
    let dataVisualizationSubSection;
    // We check in each subsection if there is visualizations
    subSections.forEach(subSection => {
      dataVisualizationSubSection = subSection;
      if (dataVisualizationSubSection?.presentation?.visualizations) {
        dataVisualizationSubSection?.presentation?.visualizations.forEach(singleVisualization => {
          if (singleVisualization.type === VisualizationType.Table) {
            singleVisualization.control.useCondensedTableLayout = false;
          }
        });
      }
      // Then we check the content of the subsection, and in each content we check if there is a table to set its condensed layout to false
      if (dataVisualizationSubSection?.content) {
        dataVisualizationSubSection.content.forEach(singleContent => {
          singleContent.presentation?.visualizations.forEach(singleVisualization => {
            if (singleVisualization.type === VisualizationType.Table) {
              singleVisualization.control.useCondensedTableLayout = false;
            }
          });
        });
      }
    });
  }
  /**
   * Retrieves and merges the ObjectPage sections defined in the annotation and in the manifest.
   * @param converterContext The converter context
   * @returns An array of sections.
   */

  const getSections = function (converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    const sections = insertCustomElements(getSectionsFromAnnotation(converterContext), getSectionsFromManifest(manifestWrapper.getSections(), converterContext), {
      title: OverrideType.overwrite,
      visible: OverrideType.overwrite,
      subSections: {
        actions: OverrideType.merge,
        title: OverrideType.overwrite,
        sideContent: OverrideType.overwrite,
        objectPageLazyLoaderEnabled: OverrideType.overwrite
      }
    });
    // Level Adjustment for "Mixed" Collection Facets:
    // ==============================================
    // The manifest definition of custom side contents and actions still needs to be aligned for "Mixed" collection facets:
    // Collection facets containing tables gain an extra reference facet as a table wrapper to ensure, that the table is always
    // placed in an own individual Object Page Block; this additional hierarchy level is unknown to app developers, which are
    // defining the side content and actions in the manifest at collection facet level; now, since the sideContent always needs
    // to be assigned to a block, and actions always need to be assigned to a form,
    // we need to move the sideContent and actions from a mixed collection facet to its content.
    // ==============================================
    sections.forEach(function (section) {
      _setNonResponsiveTableSubSectionControlConfiguration(sections, section, manifestWrapper.getSectionLayout());
      section.subSections?.forEach(function (subSection) {
        subSection.title = subSection.title === "undefined" ? undefined : subSection.title;
        if (subSection.type === "Mixed") {
          subSection.content?.forEach(content => {
            content.objectPageLazyLoaderEnabled = subSection.objectPageLazyLoaderEnabled;
          });
        }
        if (subSection.type === "Mixed" && subSection.content?.length) {
          const firstForm = subSection.content.find(element => element.type === SubSectionType.Form);

          // 1. Copy sideContent to the SubSection's first form; or -- if unavailable -- to its first content
          // 2. Copy actions to the first form of the SubSection's content
          // 3. Delete sideContent / actions at the (invalid) manifest level

          if (subSection.sideContent) {
            if (firstForm) {
              // If there is a form, it always needs to be attached to the form, as the form inherits the ID of the SubSection
              firstForm.sideContent = subSection.sideContent;
            } else {
              subSection.content[0].sideContent = subSection.sideContent;
            }
            subSection.sideContent = undefined;
          }
          if (firstForm && subSection.actions?.length) {
            firstForm.actions = subSection.actions;
            subSection.actions = [];
          }
        }
      });
    });
    return sections;
  };

  /**
   * Determines if the ObjectPage has header content.
   * @param converterContext The instance of the converter context
   * @returns `true` if there is at least on header facet
   */
  _exports.getSections = getSections;
  function hasHeaderContent(converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    return (converterContext.getEntityType().annotations?.UI?.HeaderFacets || []).length > 0 || Object.keys(manifestWrapper.getHeaderFacets()).length > 0;
  }

  /**
   * Gets the expression to evaluate the visibility of the header content.
   * @param converterContext The instance of the converter context
   * @returns The binding expression for the Delete button
   */
  function getShowHeaderContentExpression(converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    return ifElse(!hasHeaderContent(converterContext), constant(false), ifElse(equal(manifestWrapper.isHeaderEditable(), false), constant(true), not(UI.IsEditable)));
  }

  /**
   * Gets the binding expression to evaluate the visibility of the header content.
   * @param converterContext The instance of the converter context
   * @returns The binding expression for the Delete button
   */
  const getShowHeaderContent = function (converterContext) {
    return compileExpression(getShowHeaderContentExpression(converterContext));
  };

  /**
   * Gets the binding expression to evaluate the visibility of the avatar when the header is in expanded state.
   * @param converterContext The instance of the converter context
   * @returns The binding expression for the Delete button
   */
  _exports.getShowHeaderContent = getShowHeaderContent;
  const getExpandedImageVisible = function (converterContext) {
    return compileExpression(not(getShowHeaderContentExpression(converterContext)));
  };
  _exports.getExpandedImageVisible = getExpandedImageVisible;
  const convertPage = function (converterContext, capabilities) {
    const manifestWrapper = converterContext.getManifestWrapper();
    let headerSection;
    const entityType = converterContext.getEntityType();

    // Retrieve all header facets (from annotations & custom)
    const headerFacets = insertCustomElements(getHeaderFacetsFromAnnotations(converterContext), getHeaderFacetsFromManifest(manifestWrapper.getHeaderFacets()));

    // Retrieve the page header actions
    const headerActions = getHeaderActions(converterContext, capabilities);

    // Retrieve the page footer actions
    const footerActions = getFooterActions(converterContext, capabilities);
    if (manifestWrapper.isHeaderEditable() && (entityType.annotations.UI?.HeaderFacets || entityType.annotations.UI?.HeaderInfo)) {
      headerSection = createEditableHeaderSection(converterContext, headerFacets);
    }
    const sections = getSections(converterContext);
    return {
      template: TemplateType.ObjectPage,
      header: {
        visible: manifestWrapper.getShowObjectPageHeader(),
        section: headerSection,
        facets: headerFacets,
        actions: headerActions.actions,
        showContent: getShowHeaderContent(converterContext),
        hasContent: hasHeaderContent(converterContext),
        avatar: getAvatar(converterContext),
        title: {
          expandedImageVisible: getExpandedImageVisible(converterContext)
        }
      },
      sections: sections,
      footerActions: footerActions.actions,
      headerCommandActions: headerActions.commandActions,
      footerCommandActions: footerActions.commandActions,
      showAnchorBar: manifestWrapper.getShowAnchorBar(),
      useIconTabBar: manifestWrapper.useIconTabBar(),
      transportSelection: manifestWrapper.getTransportSelection()
    };
  };
  _exports.convertPage = convertPage;
  return _exports;
}, false);
//# sourceMappingURL=ObjectPageConverter-dbg.js.map
