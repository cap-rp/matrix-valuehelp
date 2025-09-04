/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/controls/Common/Action", "sap/fe/core/converters/controls/ObjectPage/HeaderFacet", "sap/fe/core/converters/helpers/IssueManager", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/TypeGuards", "../../ManifestSettings", "../../annotations/DataField", "../../helpers/ConfigurableObject", "../../helpers/ID", "../../objectPage/FormMenuActions", "../Common/DataVisualization", "../Common/Form"], function (Log, BindingToolkit, Action, HeaderFacet, IssueManager, Key, BindingHelper, TypeGuards, ManifestSettings, DataField, ConfigurableObject, ID, FormMenuActions, DataVisualization, Form) {
  "use strict";

  var _exports = {};
  var isReferenceFacet = Form.isReferenceFacet;
  var createFormDefinition = Form.createFormDefinition;
  var getDataVisualizationConfiguration = DataVisualization.getDataVisualizationConfiguration;
  var getFormHiddenActions = FormMenuActions.getFormHiddenActions;
  var getFormActions = FormMenuActions.getFormActions;
  var getSubSectionID = ID.getSubSectionID;
  var getSideContentID = ID.getSideContentID;
  var getFormID = ID.getFormID;
  var getCustomSubSectionID = ID.getCustomSubSectionID;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var isActionWithDialog = DataField.isActionWithDialog;
  var ActionType = ManifestSettings.ActionType;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var singletonPathVisitor = BindingHelper.singletonPathVisitor;
  var KeyHelper = Key.KeyHelper;
  var IssueType = IssueManager.IssueType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategory = IssueManager.IssueCategory;
  var getStashedSettingsForHeaderFacet = HeaderFacet.getStashedSettingsForHeaderFacet;
  var getHeaderFacetsFromManifest = HeaderFacet.getHeaderFacetsFromManifest;
  var getDesignTimeMetadataSettingsForHeaderFacet = HeaderFacet.getDesignTimeMetadataSettingsForHeaderFacet;
  var removeDuplicateActions = Action.removeDuplicateActions;
  var prepareMenuActions = Action.prepareMenuActions;
  var isMenuAIOperation = Action.isMenuAIOperation;
  var isActionNavigable = Action.isActionNavigable;
  var isActionAIOperation = Action.isActionAIOperation;
  var getVisibilityEnablementMenuActions = Action.getVisibilityEnablementMenuActions;
  var getSemanticObjectMapping = Action.getSemanticObjectMapping;
  var getMatchingManifestAction = Action.getMatchingManifestAction;
  var getEnabledForAnnotationAction = Action.getEnabledForAnnotationAction;
  var getAnnotationMenuActionItems = Action.getAnnotationMenuActionItems;
  var getActionsFromManifest = Action.getActionsFromManifest;
  var ButtonType = Action.ButtonType;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var notEqual = BindingToolkit.notEqual;
  var not = BindingToolkit.not;
  var isConstant = BindingToolkit.isConstant;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  let SubSectionType = /*#__PURE__*/function (SubSectionType) {
    SubSectionType["Unknown"] = "Unknown";
    // Default Type
    SubSectionType["Form"] = "Form";
    SubSectionType["Notes"] = "Notes";
    SubSectionType["DataVisualization"] = "DataVisualization";
    SubSectionType["XMLFragment"] = "XMLFragment";
    SubSectionType["Placeholder"] = "Placeholder";
    SubSectionType["Mixed"] = "Mixed";
    SubSectionType["EmbeddedComponent"] = "EmbeddedComponent";
    return SubSectionType;
  }({});
  _exports.SubSectionType = SubSectionType;
  const visualizationTerms = ["com.sap.vocabularies.UI.v1.LineItem", "com.sap.vocabularies.UI.v1.Chart", "com.sap.vocabularies.UI.v1.PresentationVariant", "com.sap.vocabularies.UI.v1.SelectionPresentationVariant"];

  /**
   * Create subsections based on facet definition.
   * @param facetCollection Collection of facets
   * @param converterContext The converter context
   * @param isHeaderSection True if header section is generated in this iteration
   * @param useSingleTextAreaFieldAsNotes If the only field within a form container is a text-area field, the label is hidden
   * @returns The current subsections
   */
  function createSubSections(facetCollection, converterContext, isHeaderSection, useSingleTextAreaFieldAsNotes) {
    // First we determine which sub section we need to create
    const facetsToCreate = facetCollection.reduce((facetsToCreate, facetDefinition) => {
      switch (facetDefinition.$Type) {
        case "com.sap.vocabularies.UI.v1.ReferenceFacet":
          facetsToCreate.push(facetDefinition);
          break;
        case "com.sap.vocabularies.UI.v1.CollectionFacet":
          // TODO If the Collection Facet has a child of type Collection Facet we bring them up one level (Form + Table use case) ?
          // first case facet Collection is combination of collection and reference facet or not all facets are reference facets.
          if (facetDefinition.Facets.find(facetType => facetType.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet")) {
            facetsToCreate.splice(facetsToCreate.length, 0, ...facetDefinition.Facets);
          } else {
            facetsToCreate.push(facetDefinition);
          }
          break;
        case "com.sap.vocabularies.UI.v1.ReferenceURLFacet":
          // Not supported
          break;
      }
      return facetsToCreate;
    }, []);

    // Then we create the actual subsections
    return facetsToCreate.map(facet => createSubSection(facet, facetsToCreate, converterContext, 0, !facet?.Facets?.length, isHeaderSection, useSingleTextAreaFieldAsNotes));
  }

  /**
   * Creates subsections based on the definition of the custom header facet.
   * @param converterContext The converter context
   * @returns The current subsections
   */
  _exports.createSubSections = createSubSections;
  function createCustomHeaderFacetSubSections(converterContext) {
    const customHeaderFacets = getHeaderFacetsFromManifest(converterContext.getManifestWrapper().getHeaderFacets());
    const aCustomHeaderFacets = [];
    Object.keys(customHeaderFacets).forEach(function (key) {
      aCustomHeaderFacets.push(customHeaderFacets[key]);
      return aCustomHeaderFacets;
    });
    const facetsToCreate = aCustomHeaderFacets.reduce((facetsToCreate, customHeaderFacet) => {
      if (customHeaderFacet.templateEdit) {
        facetsToCreate.push(customHeaderFacet);
      }
      return facetsToCreate;
    }, []);
    return facetsToCreate.map(customHeaderFacet => createCustomHeaderFacetSubSection(customHeaderFacet));
  }

  /**
   * Creates a subsection based on a custom header facet.
   * @param customHeaderFacet A custom header facet
   * @returns A definition for a subsection
   */
  _exports.createCustomHeaderFacetSubSections = createCustomHeaderFacetSubSections;
  function createCustomHeaderFacetSubSection(customHeaderFacet) {
    const subSectionID = getCustomSubSectionID(customHeaderFacet.key);
    const subSection = {
      id: subSectionID,
      key: customHeaderFacet.key,
      title: customHeaderFacet.title,
      type: SubSectionType.XMLFragment,
      template: customHeaderFacet.templateEdit || "",
      visible: customHeaderFacet.visible,
      level: 1,
      sideContent: undefined,
      stashed: customHeaderFacet.stashed,
      flexSettings: customHeaderFacet.flexSettings,
      actions: {},
      objectPageLazyLoaderEnabled: false
    };
    return subSection;
  }
  const getSubSectionKey = (facetDefinition, fallback) => {
    return facetDefinition.ID?.toString() || facetDefinition.Label?.toString() || fallback;
  };
  /**
   * Adds Form menu action to all form actions, removes duplicate actions and hidden actions.
   * @param actions The actions involved
   * @param facetDefinition The definition for the facet
   * @param converterContext The converter context
   * @returns The form menu actions
   */
  function addFormMenuActions(actions, facetDefinition, converterContext) {
    // annotation actions possibly has CustomActions, which are added at Subsection.ts#createFormActionReducer
    // those action are incorrect and cause unwanted results, so we need to carefully remove incorrect ones here
    for (let reverseIndex = actions.length - 1; reverseIndex >= 0; reverseIndex--) {
      if (actions[reverseIndex].id?.startsWith("CustomAction::") && (actions[reverseIndex].key.startsWith("DataFieldForAction::") || actions[reverseIndex].key.startsWith("DataFieldForIntentBasedNavigation::"))) {
        actions.splice(reverseIndex, 1);
      }
    }
    const hiddenActions = getFormHiddenActions(facetDefinition, converterContext) || [],
      actionOverwriteConfig = {
        enabled: OverrideType.overwrite,
        visible: OverrideType.overwrite,
        command: OverrideType.overwrite,
        position: OverrideType.overwrite,
        menu: OverrideType.overwrite
      },
      formActions = getFormActions(facetDefinition, converterContext),
      // 1. Get actions from annotations -> actions are passed to this method
      // 2. Get actions from manifest
      manifestActions = getActionsFromManifest(formActions, converterContext, actions, undefined, undefined, hiddenActions),
      // 3. Get all annotation menu items
      annotationMenuActionItems = getAnnotationMenuActionItems(actions),
      // 4. Find manifest actions which override any annotation menu items
      matchingManifestActions = getMatchingManifestAction(annotationMenuActionItems, manifestActions.actions),
      // 5. Get overridden annotation menu items
      overwrittenMenuActionItems = insertCustomElements(annotationMenuActionItems, matchingManifestActions, actionOverwriteConfig);
    // If there is a manifest action defined for a neighbouring reference facet, it would not be part of manifest actions here
    // In this for-loop, ensuring a pure manifest action coming from another reference facet is not lost
    for (let reverseIndex = actions.length - 1; reverseIndex >= 0; reverseIndex--) {
      if (actions[reverseIndex].id?.startsWith("CustomAction::")) {
        for (const manifestAction in manifestActions.actions) {
          if (manifestAction === actions[reverseIndex].key) {
            actions.splice(reverseIndex, 1);
            break;
          }
        }
      }
    }
    // 6. Override all actions
    let formAllActions = insertCustomElements(actions, manifestActions.actions, actionOverwriteConfig);
    // 7. Replace original menu items with their corresponding overridden menu items
    prepareMenuActions(formAllActions, overwrittenMenuActionItems);
    // 8. Remove duplicate actions which are menu items
    formAllActions = removeDuplicateActions(formAllActions);
    // 9. Hide menus where all menu items are hidden
    formAllActions = getVisibilityEnablementMenuActions(formAllActions);
    // 10. (Only for this subsection UI area) defaultAction of a menu must be of type ActionType.Default
    formAllActions.forEach(action => {
      if (action.type === ActionType.Menu && !!action.defaultAction) {
        action.defaultAction.type = ActionType.Default;
      }
    });
    return {
      actions: formAllActions ?? actions,
      commandActions: manifestActions.commandActions
    };
  }

  /**
   * Retrieves the action form a facet.
   * @param facetDefinition
   * @param converterContext
   * @returns The current facet actions
   */
  function getFacetActions(facetDefinition, converterContext) {
    let actions = [];
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        actions = facetDefinition.Facets.filter(subFacetDefinition => isReferenceFacet(subFacetDefinition)).reduce((actionReducer, referenceFacet) => createFormActionReducer(actionReducer, referenceFacet, converterContext), []);
        break;
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        actions = createFormActionReducer([], facetDefinition, converterContext);
        break;
      default:
        break;
    }
    return addFormMenuActions(actions, facetDefinition, converterContext);
  }
  /**
   * Returns the button type based on @UI.Emphasized annotation.
   * @param emphasized Emphasized annotation value.
   * @returns The button type or path based expression.
   */
  function getButtonType(emphasized) {
    // Emphasized is a boolean so if it's equal to true we show the button as Ghost, otherwise as Transparent
    const buttonTypeCondition = equal(getExpressionFromAnnotation(emphasized), true);
    return compileExpression(ifElse(buttonTypeCondition, ButtonType.Ghost, ButtonType.Transparent));
  }

  /**
   * Create a subsection based on FacetTypes.
   * @param facetDefinition
   * @param facetsToCreate
   * @param converterContext
   * @param level
   * @param hasSingleContent
   * @param isHeaderSection
   * @param useSingleTextAreaFieldAsNotes If the only field within a form container is a text-area field, the label is hidden
   * @returns A subsection definition
   */
  function createSubSection(facetDefinition, facetsToCreate, converterContext, level, hasSingleContent, isHeaderSection, useSingleTextAreaFieldAsNotes) {
    const subSectionID = getSubSectionID(facetDefinition);
    const hiddenAnnotation = facetDefinition.annotations?.UI?.Hidden;
    const isVisibleExpression = not(equal(true, getExpressionFromAnnotation(hiddenAnnotation, [], false, path => singletonPathVisitor(path, converterContext.getConvertedTypes(), []))));
    const isVisibilityDynamic = !isConstant(isVisibleExpression) && !isPathAnnotationExpression(hiddenAnnotation);
    const title = facetDefinition.Label !== undefined ? compileExpression(getExpressionFromAnnotation(facetDefinition.Label)) : undefined;
    const subSection = {
      id: subSectionID,
      key: getSubSectionKey(facetDefinition, subSectionID),
      title: title,
      type: SubSectionType.Unknown,
      annotationPath: converterContext.getEntitySetBasedAnnotationPath(facetDefinition.fullyQualifiedName),
      visible: compileExpression(isVisibleExpression),
      isVisibilityDynamic: isVisibilityDynamic,
      level: level,
      sideContent: undefined,
      objectPageLazyLoaderEnabled: converterContext.getManifestWrapper().getEnableLazyLoading()
    };
    if (isHeaderSection) {
      subSection.stashed = getStashedSettingsForHeaderFacet(facetDefinition, facetDefinition, converterContext);
      subSection.flexSettings = {
        designtime: getDesignTimeMetadataSettingsForHeaderFacet(facetDefinition, facetDefinition, converterContext)
      };
    }
    let unsupportedText = "";
    level++;
    switch (facetDefinition.$Type) {
      case "com.sap.vocabularies.UI.v1.CollectionFacet":
        const facets = facetDefinition.Facets;

        // Filter for all facets of this subsection that are referring to an annotation describing a visualization (e.g. table or chart)
        const visualizationFacets = facets.map((facet, index) => ({
          index,
          facet
        })) // Remember the index assigned to each facet
        .filter(_ref => {
          let {
            facet
          } = _ref;
          return isReferenceFacet(facet) && facet.Target.$target && visualizationTerms.includes(facet.Target.$target.term);
        });

        // Filter out all visualization facets; "visualizationFacets" and "nonVisualizationFacets" are disjoint
        const nonVisualizationFacets = facets.filter(facet => !visualizationFacets.find(visualization => visualization.facet === facet));
        if (visualizationFacets.length > 0) {
          // CollectionFacets with visualizations must be handled separately as they cannot be included in forms
          const visualizationContent = [];
          const formContent = [];
          const mixedContent = [];

          // Create each visualization facet as if it was its own subsection (via recursion), and keep their relative ordering
          for (const {
            facet
          } of visualizationFacets) {
            visualizationContent.push(createSubSection(facet, [], converterContext, level, true, isHeaderSection));
          }
          if (nonVisualizationFacets.length > 0) {
            // This subsection includes visualizations and other content, so it is a "Mixed" subsection
            Log.warning(`Warning: CollectionFacet '${facetDefinition.ID}' includes a combination of either a chart or a table and other content. This can lead to rendering issues. Consider moving the chart or table into a separate CollectionFacet.`);
            const fakeFormFacet = {
              ...facetDefinition
            };
            fakeFormFacet.Facets = nonVisualizationFacets;
            // Create a joined form of all facets that are not referring to visualizations
            formContent.push(createSubSection(fakeFormFacet, [], converterContext, level, hasSingleContent, isHeaderSection));
          }

          // Merge the visualization content with the form content
          if (visualizationFacets.find(_ref2 => {
            let {
              index
            } = _ref2;
            return index === 0;
          })) {
            // If the first facet is a visualization, display the visualizations first
            mixedContent.push(...visualizationContent);
            mixedContent.push(...formContent);
          } else {
            // Otherwise, display the form first
            mixedContent.push(...formContent);
            mixedContent.push(...visualizationContent);
          }
          const mixedSubSection = {
            ...subSection,
            type: SubSectionType.Mixed,
            level: level,
            content: mixedContent
          };
          return mixedSubSection;
        } else {
          // This CollectionFacet only includes content that can be rendered in a merged form
          const facetActions = getFacetActions(facetDefinition, converterContext),
            formCollectionSubSection = {
              ...subSection,
              type: SubSectionType.Form,
              formDefinition: createFormDefinition(facetDefinition, compileExpression(isVisibleExpression), converterContext, facetActions.actions, {
                useSingleTextAreaFieldAsNotes
              }),
              level: level,
              actions: facetActions.actions.filter(action => action.facetName === undefined),
              commandActions: facetActions.commandActions
            };
          return formCollectionSubSection;
        }
      case "com.sap.vocabularies.UI.v1.ReferenceFacet":
        if (!facetDefinition.Target.$target) {
          unsupportedText = `Unable to find annotationPath ${facetDefinition.Target.value}`;
        } else {
          switch (facetDefinition.Target.$target.term) {
            case "com.sap.vocabularies.UI.v1.LineItem":
            case "com.sap.vocabularies.UI.v1.Chart":
            case "com.sap.vocabularies.UI.v1.PresentationVariant":
            case "com.sap.vocabularies.UI.v1.SelectionPresentationVariant":
              const presentation = getDataVisualizationConfiguration(facetDefinition.Target.value, converterContext, {
                isCondensedTableLayoutCompliant: getCondensedTableLayoutCompliance(facetDefinition, facetsToCreate, converterContext),
                doNotCheckApplySupported: isHeaderSection,
                shouldCreateTemplateChartVisualization: true
              });
              const subSectionTitle = subSection.title ? subSection.title : "";
              const controlTitle = presentation.visualizations[0]?.annotation?.title || presentation.visualizations[0]?.title;
              const isPartOfPreview = facetDefinition.annotations?.UI?.PartOfPreview?.valueOf() !== false;
              const showSubSectionTitle = getShowSubSectionTitle(controlTitle ?? "", subSectionTitle, hasSingleContent);

              // Either calculate the title visibility statically or dynamically
              // Additionally to checking whether a title exists,
              // we also need to check that the facet title is not the same as the control (i.e. visualization) title;
              // this is done by including "showSubSectionTitle" in the and expression
              const dataVisualizationTitleVisible = ifElse(isVisibilityDynamic, and(isVisibleExpression, not(equal(title, "undefined")), showSubSectionTitle), and(compileExpression(isVisibleExpression) !== undefined, title !== "undefined", title !== undefined, isVisibleExpression, showSubSectionTitle));
              const dataVisualizationSubSection = {
                ...subSection,
                type: SubSectionType.DataVisualization,
                level: level,
                presentation: presentation,
                isPartOfPreview,
                showSubSectionTitle: compileExpression(showSubSectionTitle),
                // This is used on the ObjectPageSubSection
                dataVisualizationTitleVisible: compileExpression(dataVisualizationTitleVisible) // This is used to hide the Title control above data visualizations
              };
              return dataVisualizationSubSection;
            case "com.sap.vocabularies.UI.v1.FieldGroup":
            case "com.sap.vocabularies.UI.v1.Identification":
            case "com.sap.vocabularies.UI.v1.DataPoint":
            case "com.sap.vocabularies.UI.v1.StatusInfo":
            case "com.sap.vocabularies.Communication.v1.Contact":
              // All those element belong to a from facet
              const facetActions = getFacetActions(facetDefinition, converterContext),
                formElementSubSection = {
                  ...subSection,
                  type: SubSectionType.Form,
                  level: level,
                  formDefinition: createFormDefinition(facetDefinition, compileExpression(isVisibleExpression), converterContext, facetActions.actions, {
                    useSingleTextAreaFieldAsNotes
                  }),
                  actions: facetActions.actions.filter(action => action.facetName === undefined),
                  commandActions: facetActions.commandActions
                };
              return formElementSubSection;
            case "com.sap.vocabularies.UI.v1.Note":
              return {
                ...subSection,
                type: SubSectionType.Notes
              };
            default:
              unsupportedText = `For ${facetDefinition.Target.$target.term} Fragment`;
              break;
          }
        }
        break;
      case "com.sap.vocabularies.UI.v1.ReferenceURLFacet":
        unsupportedText = "For Reference URL Facet";
        break;
      default:
        break;
    }
    // If we reach here we ended up with an unsupported SubSection type
    const unsupportedSubSection = {
      ...subSection,
      type: SubSectionType.Unknown,
      text: unsupportedText
    };
    return unsupportedSubSection;
  }

  /**
   * Checks whether to hide or show the subsection title.
   * @param controlTitle
   * @param subSectionTitle
   * @param hasSingleContent
   * @returns Boolean value or expression for showSubSectionTitle
   */
  _exports.createSubSection = createSubSection;
  function getShowSubSectionTitle(controlTitle, subSectionTitle, hasSingleContent) {
    // visible shall be true if there are multiple content or if the control and subsection title are different
    return or(not(hasSingleContent), notEqual(resolveBindingString(controlTitle), resolveBindingString(subSectionTitle)));
  }
  _exports.getShowSubSectionTitle = getShowSubSectionTitle;
  function createFormActionReducer(actions, facetDefinition, converterContext) {
    const referenceTarget = facetDefinition.Target.$target;
    const targetValue = facetDefinition.Target.value;
    let manifestActions = {};
    let dataFieldCollection = [];
    let navigationPropertyPath;
    [navigationPropertyPath] = targetValue.split("@");
    if (navigationPropertyPath.length > 0) {
      if (navigationPropertyPath.lastIndexOf("/") === navigationPropertyPath.length - 1) {
        navigationPropertyPath = navigationPropertyPath.substring(0, navigationPropertyPath.length - 1);
      }
    } else {
      navigationPropertyPath = undefined;
    }
    if (referenceTarget) {
      switch (referenceTarget.term) {
        case "com.sap.vocabularies.UI.v1.FieldGroup":
          dataFieldCollection = referenceTarget.Data;
          manifestActions = getActionsFromManifest(converterContext.getManifestControlConfiguration(referenceTarget).actions, converterContext, [], undefined, undefined, undefined, facetDefinition.fullyQualifiedName).actions;
          break;
        case "com.sap.vocabularies.UI.v1.Identification":
        case "com.sap.vocabularies.UI.v1.StatusInfo":
          if (referenceTarget.qualifier) {
            dataFieldCollection = referenceTarget;
          }
          break;
        default:
          break;
      }
      actions = dataFieldCollection.reduce((actionReducer, dataField) => {
        switch (dataField.$Type) {
          case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
            if (dataField.RequiresContext?.valueOf() === true) {
              converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.REQUIRESCONTEXT);
            }
            if (dataField.Inline?.valueOf() === true) {
              converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.INLINE);
            }
            if (dataField.Determining?.valueOf() === true) {
              converterContext.getDiagnostics().addIssue(IssueCategory.Annotation, IssueSeverity.Low, IssueType.MALFORMED_DATAFIELD_FOR_IBN.DETERMINING);
            }
            const mNavigationParameters = {};
            if (dataField.Mapping) {
              mNavigationParameters.semanticObjectMapping = getSemanticObjectMapping(dataField.Mapping);
            }
            actionReducer.push({
              type: ActionType.DataFieldForIntentBasedNavigation,
              id: getFormID(facetDefinition, dataField),
              key: KeyHelper.generateKeyFromDataField(dataField),
              text: dataField.Label?.toString(),
              annotationPath: "",
              enabled: dataField.NavigationAvailable !== undefined ? compileExpression(equal(getExpressionFromAnnotation(dataField.NavigationAvailable), true)) : "true",
              visible: compileExpression(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true))),
              buttonType: getButtonType(dataField.annotations?.UI?.Emphasized),
              press: compileExpression(fn("._intentBasedNavigation.navigate", [getExpressionFromAnnotation(dataField.SemanticObject), getExpressionFromAnnotation(dataField.Action), mNavigationParameters])),
              customData: compileExpression({
                semanticObject: getExpressionFromAnnotation(dataField.SemanticObject),
                action: getExpressionFromAnnotation(dataField.Action)
              })
            });
            break;
          case "com.sap.vocabularies.UI.v1.DataFieldForAction":
            const formManifestActionsConfiguration = converterContext.getManifestControlConfiguration(referenceTarget).actions;
            actionReducer.push(getDataFieldAnnotationAction(dataField, facetDefinition, converterContext, formManifestActionsConfiguration, navigationPropertyPath));
            break;
          case "com.sap.vocabularies.UI.v1.DataFieldForActionGroup":
            actionReducer.push({
              type: ActionType.Menu,
              text: dataField.Label?.toString(),
              key: KeyHelper.generateKeyFromDataField(dataField),
              id: getFormID(facetDefinition, dataField),
              visible: compileExpression(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true))),
              isAIOperation: isMenuAIOperation(dataField.Actions) === true || undefined,
              menu: dataField.Actions.map(action => {
                const formManifestMenuActionsConfiguration = converterContext.getManifestControlConfiguration(referenceTarget).actions;
                return getDataFieldAnnotationAction(action, facetDefinition, converterContext, formManifestMenuActionsConfiguration, navigationPropertyPath);
              })
            });
            break;
          default:
            break;
        }
        return actionReducer;
      }, actions);
    }

    // no overrides here, they are done in a later step in addFormMenuActions
    return insertCustomElements(actions, manifestActions);
  }
  function getDataFieldAnnotationAction(dataField, facetDefinition, converterContext, formManifestActionsConfiguration, navigationPropertyPath) {
    const key = KeyHelper.generateKeyFromDataField(dataField);
    return {
      type: ActionType.DataFieldForAction,
      id: getFormID(facetDefinition, dataField),
      key: KeyHelper.generateKeyFromDataField(dataField),
      text: dataField.Label?.toString(),
      annotationPath: "",
      enabled: getEnabledForAnnotationAction(converterContext, dataField.ActionTarget),
      binding: navigationPropertyPath && !dataField.Inline ? `{ 'path' : '${navigationPropertyPath}'}` : undefined,
      // Inline Actions don't need the binding as they are inside the Form
      visible: compileExpression(not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true))),
      requiresDialog: isActionWithDialog(dataField),
      buttonType: getButtonType(dataField.annotations?.UI?.Emphasized),
      isAIOperation: isActionAIOperation(dataField) === true || undefined,
      press: compileExpression(fn("invokeAction", [dataField.Action, {
        contexts: fn("getBindingContext", [], pathInModel("", "$source")),
        invocationGrouping: dataField.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
        label: dataField.Label?.toString(),
        model: fn("getModel", [], pathInModel("/", "$source")),
        isNavigable: isActionNavigable(formManifestActionsConfiguration && formManifestActionsConfiguration[key]),
        feFrameworkCall: true
      }], ref(".editFlow"))),
      facetName: dataField.Inline ? facetDefinition.fullyQualifiedName : undefined
    };
  }
  function isDialog(actionDefinition) {
    if (actionDefinition) {
      const bCritical = actionDefinition.annotations?.Common?.IsActionCritical;
      if (actionDefinition.parameters.length > 1 || bCritical) {
        return "Dialog";
      } else {
        return "None";
      }
    } else {
      return "None";
    }
  }
  _exports.isDialog = isDialog;
  function createCustomSubSections(manifestSubSections, converterContext) {
    const subSections = {};
    Object.keys(manifestSubSections).forEach(subSectionKey => subSections[subSectionKey] = createCustomSubSection(manifestSubSections[subSectionKey], subSectionKey, converterContext));
    return subSections;
  }
  _exports.createCustomSubSections = createCustomSubSections;
  function createCustomSubSection(manifestSubSection, subSectionKey, converterContext) {
    const sideContent = manifestSubSection.sideContent ? {
      template: manifestSubSection.sideContent.template,
      id: getSideContentID(subSectionKey),
      visible: false,
      equalSplit: manifestSubSection.sideContent.equalSplit
    } : undefined;
    let position = manifestSubSection.position;
    if (!position) {
      position = {
        placement: Placement.After
      };
    }
    const isVisible = manifestSubSection.visible !== undefined ? manifestSubSection.visible : true;
    const isDynamicExpression = isVisible && typeof isVisible === "string" && isVisible.indexOf("{=") === 0;
    const manifestActions = getActionsFromManifest(manifestSubSection.actions, converterContext);
    const subSectionDefinition = {
      type: SubSectionType.Unknown,
      id: manifestSubSection.id || getCustomSubSectionID(subSectionKey),
      actions: manifestActions.actions,
      key: subSectionKey,
      title: manifestSubSection.title,
      level: 1,
      position: position,
      visible: manifestSubSection.visible !== undefined ? manifestSubSection.visible : "true",
      sideContent: sideContent,
      isVisibilityDynamic: isDynamicExpression,
      objectPageLazyLoaderEnabled: manifestSubSection.enableLazyLoading ?? false,
      componentName: "",
      settings: "",
      applyState: manifestSubSection.applyState,
      retrieveState: manifestSubSection.retrieveState
    };
    if (manifestSubSection.template || manifestSubSection.name) {
      subSectionDefinition.type = SubSectionType.XMLFragment;
      subSectionDefinition.template = manifestSubSection.template || manifestSubSection.name || "";
    } else if (manifestSubSection.embeddedComponent !== undefined) {
      subSectionDefinition.type = SubSectionType.EmbeddedComponent;
      subSectionDefinition.componentName = manifestSubSection.embeddedComponent.name;
      if (manifestSubSection.embeddedComponent.settings !== undefined) {
        subSectionDefinition.settings = JSON.stringify(manifestSubSection.embeddedComponent.settings);
      }
    } else {
      subSectionDefinition.type = SubSectionType.Placeholder;
    }
    return subSectionDefinition;
  }

  /**
   * Evaluate if the condensed mode can be applied on the table.
   * @param currentFacet
   * @param facetsToCreateInSection
   * @param converterContext
   * @returns `true` for compliant, false otherwise
   */
  _exports.createCustomSubSection = createCustomSubSection;
  function getCondensedTableLayoutCompliance(currentFacet, facetsToCreateInSection, converterContext) {
    const manifestWrapper = converterContext.getManifestWrapper();
    if (manifestWrapper.useIconTabBar()) {
      // If the OP use the tab based we check if the facets that will be created for this section are all non visible
      return hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection);
    } else {
      const entityType = converterContext.getEntityType();
      if (entityType.annotations?.UI?.Facets?.length && entityType.annotations?.UI?.Facets?.length > 1) {
        return hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection);
      } else {
        return true;
      }
    }
  }
  function hasNoOtherVisibleTableInTargets(currentFacet, facetsToCreateInSection) {
    return facetsToCreateInSection.every(function (subFacet) {
      if (subFacet !== currentFacet) {
        if (subFacet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
          const refFacet = subFacet;
          if (refFacet.Target?.$target?.term === "com.sap.vocabularies.UI.v1.LineItem" || refFacet.Target?.$target?.term === "com.sap.vocabularies.UI.v1.PresentationVariant" || refFacet.Target.$target?.term === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
            return refFacet.annotations?.UI?.Hidden !== undefined ? refFacet.annotations?.UI?.Hidden : false;
          }
          return true;
        } else {
          const subCollectionFacet = subFacet;
          return subCollectionFacet.Facets.every(function (facet) {
            const subRefFacet = facet;
            if (subRefFacet.Target?.$target?.term === "com.sap.vocabularies.UI.v1.LineItem" || subRefFacet.Target?.$target?.term === "com.sap.vocabularies.UI.v1.PresentationVariant" || subRefFacet.Target?.$target?.term === "com.sap.vocabularies.UI.v1.SelectionPresentationVariant") {
              return subRefFacet.annotations?.UI?.Hidden !== undefined ? subRefFacet.annotations?.UI?.Hidden : false;
            }
            return true;
          });
        }
      }
      return true;
    });
  }
  return _exports;
}, false);
//# sourceMappingURL=SubSection-dbg.js.map
