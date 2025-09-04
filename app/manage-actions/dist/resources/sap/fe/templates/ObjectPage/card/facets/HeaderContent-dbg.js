/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/converters/helpers/ConfigurableObject", "sap/fe/core/converters/helpers/DataFieldHelper", "sap/fe/core/helpers/AdaptiveCardExpressionCompiler", "sap/fe/core/helpers/MetaPath", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataFieldFormatters", "sap/fe/core/templating/UIFormatters", "sap/fe/templates/ObjectPage/card/AdaptiveCardContent", "sap/fe/templates/ObjectPage/card/BaseCardContentProvider"], function (Log, BindingToolkit, ConfigurableObject, DataFieldHelper, AdaptiveCardExpressionCompiler, MetaPath, StableIdHelper, TypeGuards, CriticalityFormatters, DataFieldFormatters, UIFormatters, AdaptiveCardContent, BaseCardContentProvider) {
  "use strict";

  var _exports = {};
  var getTextBlock = AdaptiveCardContent.getTextBlock;
  var getColumnSet = AdaptiveCardContent.getColumnSet;
  var getColumn = AdaptiveCardContent.getColumn;
  var isVisible = UIFormatters.isVisible;
  var generateVisibleExpression = DataFieldFormatters.generateVisibleExpression;
  var getCriticalityExpressionForCards = CriticalityFormatters.getCriticalityExpressionForCards;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isNavigationProperty = TypeGuards.isNavigationProperty;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var getStableIdPartFromDataField = StableIdHelper.getStableIdPartFromDataField;
  var generate = StableIdHelper.generate;
  var compileToAdaptiveExpression = AdaptiveCardExpressionCompiler.compileToAdaptiveExpression;
  var isReferencePropertyStaticallyHidden = DataFieldHelper.isReferencePropertyStaticallyHidden;
  var isPotentiallySensitive = DataFieldHelper.isPotentiallySensitive;
  var insertCustomElements = ConfigurableObject.insertCustomElements;
  var Placement = ConfigurableObject.Placement;
  var OverrideType = ConfigurableObject.OverrideType;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  // External types for header facet configuration

  // Internal types for header facet configuration

  const MAX_COLUMNS = 3;
  /**
   * Get image and title for card.
   * @param convertedTypes Converted Metadata.
   * @param config Card Configuration.
   * @experimental
   */
  let HeaderContent = /*#__PURE__*/function (_BaseCardContentProvi) {
    function HeaderContent(convertedTypes, config) {
      var _this;
      _this = _BaseCardContentProvi.call(this, convertedTypes, config) || this;
      _this.cardElements = [];
      let headerFacetsForAdaptiveCard = [];
      const {
        contextPath
      } = _this.getCardConfigurationByKey("contextInfo");
      try {
        const headerFacet = new MetaPath(convertedTypes, `${contextPath}@${"com.sap.vocabularies.UI.v1.HeaderFacets"}`, contextPath);
        const customConfigHeaderFacets = _this.getCustomConfigHeaderFacets(headerFacet);
        headerFacetsForAdaptiveCard = _this.createHeaderForms(headerFacet, customConfigHeaderFacets);
      } catch (error) {
        Log.error(`FE : V4 : Adaptive Card header facets : no EntityType found at context path: ${contextPath}`);
      }
      _this.cardElements = headerFacetsForAdaptiveCard;
      return _this || _assertThisInitialized(_this);
    }

    /**
     * Get the DataPoint Information from ReferenceFacet.
     * @param referenceFacetTargetMetaPath MetaPath pointing to FieldGroup
     * @param dataField DataFieldAbstract types
     * @param formElementConfig Field configurations
     * @returns Properties applicable for the dataPoint annotation
     */
    _exports = HeaderContent;
    _inheritsLoose(HeaderContent, _BaseCardContentProvi);
    var _proto = HeaderContent.prototype;
    /**
     * Get image and title in column set.
     * @returns Column set.
     */
    _proto.getHeaderContent = function getHeaderContent() {
      return this.cardElements;
    };
    _proto.getFieldGroupProperties = function getFieldGroupProperties(referenceFacetTargetMetaPath, dataField, formElementConfig) {
      let property,
        textProperty,
        textpropertyAnnotation,
        label = formElementConfig?.labelText,
        navigationPath,
        color;
      switch (dataField?.$Type) {
        case "com.sap.vocabularies.UI.v1.DataField":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
        case "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath":
          if (isPathAnnotationExpression(dataField.Value)) {
            property = referenceFacetTargetMetaPath.getMetaPathForObject(dataField.Value);
            navigationPath = this.getNavigationPathForExpression(referenceFacetTargetMetaPath);
            textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
            textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
          } else {
            property = dataField.Value;
          }
          label = label ?? dataField.Label ?? dataField.Value?.$target?.annotations?.Common?.Label.valueOf() ?? "";
          color = this.getCriticalityForDataPoints(dataField);
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          label = label ?? dataField.Label ?? dataField?.Value?.$target?.annotations?.Common?.Label.valueOf() ?? "";
          const dataFieldTargetPath = referenceFacetTargetMetaPath.getMetaPathForObject(dataField.Target);
          const dataFieldTarget = dataFieldTargetPath?.getTarget();
          navigationPath = this.getNavigationPathForExpression(dataFieldTargetPath);
          if (isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.UI.v1.DataPointType")) {
            if (isPathAnnotationExpression(dataFieldTarget.Value)) {
              property = dataFieldTargetPath?.getMetaPathForObject(dataFieldTarget?.Value);
              textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
              textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
            } else {
              property = dataFieldTarget.Value;
            }
            color = this.getCriticalityForDataPoints(dataFieldTarget);
          } else if (isAnnotationOfType(dataFieldTarget, "com.sap.vocabularies.Communication.v1.ContactType")) {
            const contactObject = dataFieldTarget.fn;
            if (isPathAnnotationExpression(contactObject)) {
              property = dataFieldTargetPath?.getMetaPathForObject(contactObject);
              textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
              textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
            }
          }
          break;
        default:
          break;
      }
      return {
        property,
        label,
        navigationPath,
        textProperty,
        color
      };
    }

    /**
     * Returns the visible dataFields from fieldGroup.
     * @param dataFields DataFieldAbstractTypes.
     * @returns Visible DataFields.
     */;
    _proto.getVisibleDataFields = function getVisibleDataFields(dataFields) {
      return dataFields.reduce((visibledataFields, dataField) => {
        if (!isReferencePropertyStaticallyHidden(dataField) && !isPotentiallySensitive(dataField)) {
          visibledataFields.push(dataField);
        }
        return visibledataFields;
      }, []);
    }

    /**
     * Update the columnSets for each dataFields.
     * @param dataField DataFieldAbstractTypes
     * @param properties Properties of the DataField required for adaptive card
     * @param dataPointTitle
     * @returns ColumnSets containing header facet information which is required for adaptive card
     */;
    _proto.getColumnForDataField = function getColumnForDataField(dataField, properties, dataPointTitle) {
      const items = [];
      const columns = [];
      if (!dataField) {
        columns.push(getColumn());
      } else {
        const visible = this.getVisibleForDataField(dataField);
        const {
          property,
          label,
          color,
          uom,
          textProperty
        } = properties || {};
        if (property) {
          if (label) {
            if (dataPointTitle === true) {
              items.push(getTextBlock({
                size: "Small",
                weight: "Bolder",
                text: label,
                maxLines: 2,
                wrap: true,
                spacing: "Medium",
                visible: visible
              }));
            } else {
              items.push(getTextBlock({
                size: "Small",
                text: `${label}:`,
                maxLines: 1,
                isSubtle: true
              }));
            }
          }
          const textBinding = this.getValueBinding(property, textProperty);
          const additionalValue = uom ?? textProperty;
          const dateFieldVisibleExp = this.getTextBlockVisiblityForDateField(property, typeof additionalValue !== "string" ? additionalValue : undefined);
          items.push(getTextBlock({
            size: "Small",
            $when: compileToAdaptiveExpression(dateFieldVisibleExp),
            text: uom ? `${textBinding} ${uom}` : textBinding,
            maxLines: 2,
            color: color
          }));
          items.push(getTextBlock({
            size: "Small",
            $when: compileToAdaptiveExpression(equal(dateFieldVisibleExp, constant(false))),
            text: "\\-"
          }));
          columns.push(getColumn({
            items: items,
            visible: visible ?? undefined
          }));
        }
      }
      return columns;
    }

    /**
     * Updates the column sets and gets the fieldgroup content.
     * @param referenceFacetTargetMetaPath Metapath of the reference facet fieldgroup
     * @param formHeader Form Header
     * @param visible Visible expression for the FacetHeader
     * @param formElementsConfig Fields' configurations
     * @returns ColumnSets containing header facet information which is required for adaptive card
     */;
    _proto.getFieldGroupContent = function getFieldGroupContent(referenceFacetTargetMetaPath, formHeader, visible, formElementsConfig) {
      const fieldGroup = referenceFacetTargetMetaPath.getTarget();
      const maxColumns = MAX_COLUMNS;
      const forms = [];
      if (formHeader) {
        const formTitle = getTextBlock({
          size: "Small",
          weight: "Bolder",
          text: formHeader,
          maxLines: 2,
          spacing: "Medium",
          wrap: true,
          visible: visible ?? undefined
        });
        forms.push(formTitle);
      }
      const fieldItems = this.getVisibleDataFields(fieldGroup?.Data);
      /* Column set should contain maximum of three columns
      hence check the number of datafields and decide the columns for each column set */
      const iTotalColums = Math.ceil(fieldItems.length / maxColumns);
      for (let i = 1; i <= iTotalColums; i++) {
        const iLoopEnd = i * maxColumns;
        const iLoopStart = iLoopEnd - maxColumns;
        const dataFieldcolumnset = getColumnSet([], visible ?? undefined);
        for (let j = iLoopStart; j < iLoopEnd; j++) {
          const dataField = fieldItems[j];
          const key = dataField && getStableIdPartFromDataField(dataField);
          const formElementConfig = key ? formElementsConfig?.[key] : undefined;
          const dataProperties = this.getFieldGroupProperties(referenceFacetTargetMetaPath, dataField, formElementConfig);
          const dataFieldNext = dataField && referenceFacetTargetMetaPath.getMetaPathForObject(dataField);
          const dataFieldColumns = this.getColumnForDataField(dataFieldNext, dataProperties);
          if (dataFieldColumns) {
            dataFieldcolumnset.columns.push(...dataFieldColumns);
          }
        }
        if (dataFieldcolumnset) {
          forms.push(dataFieldcolumnset);
        }
      }
      return forms;
    }

    /**
     * Get the text color for the dataPoint.
     * @param dataPoint DataPoint annotation
     * @returns Color of the Text
     */;
    _proto.getCriticalityForDataPoints = function getCriticalityForDataPoints(dataPoint) {
      let exp;
      const criticalityProperty = dataPoint.Criticality;
      if (criticalityProperty) {
        const criticalityExpression = getExpressionFromAnnotation(criticalityProperty);
        exp = getCriticalityExpressionForCards(criticalityExpression, false);
      } else {
        exp = constant("default");
      }
      return this.updatePathsAndGetCompiledExpression(exp);
    }

    /**
     * Get the uom path for the dataPoint.
     * @param referenceFacetTargetMetaPath MetaPath pointing to datapoints
     * @param propertyTargetObject DataPoint property
     * @returns Path binding for UOM
     */;
    _proto.getUomPathBinding = function getUomPathBinding(referenceFacetTargetMetaPath, propertyTargetObject) {
      const uom = propertyTargetObject?.annotations.Measures?.ISOCurrency || propertyTargetObject?.annotations.Measures?.Unit;
      if (!uom) {
        return;
      } else if (isPathAnnotationExpression(uom)) {
        const uomMetaPath = referenceFacetTargetMetaPath.getMetaPathForObject(uom);
        const targetPath = uomMetaPath?.getTarget();
        return targetPath && this.targetIsProperty(uomMetaPath) ? this.getValueBinding(uomMetaPath) : undefined;
      }
    }

    /**
     * Get the DataPoint Information from ReferenceFacet.
     * @param referenceFacetTargetMetaPath MetaPath pointing to datapoints
     * @param dataPoint DataPoint
     * @returns Properties applicable for the dataPoint annotation
     */;
    _proto.getDataPointProperties = function getDataPointProperties(referenceFacetTargetMetaPath, dataPoint) {
      const property = referenceFacetTargetMetaPath.getMetaPathForObject(dataPoint?.Value);
      const uom = this.getUomPathBinding(referenceFacetTargetMetaPath, referenceFacetTargetMetaPath.getMetaPathForObject(dataPoint?.Value)?.getTarget());
      const textpropertyAnnotation = property?.getTarget()?.annotations?.Common?.Text;
      const textProperty = textpropertyAnnotation && referenceFacetTargetMetaPath.getMetaPathForObject(textpropertyAnnotation);
      const color = this.getCriticalityForDataPoints(dataPoint);
      const navigationPath = this.getNavigationPathForExpression(referenceFacetTargetMetaPath);
      return {
        property,
        color,
        uom,
        navigationPath,
        textProperty
      };
    }

    /**
     * Get the Datapoint content from the facet.
     * @param referenceFacetTargetMetaPath MetaPath pointing to Datapoints
     * @param formHeader Title of the form header
     * @returns Title and content of the datapoint
     */;
    _proto.getDataPointContent = function getDataPointContent(referenceFacetTargetMetaPath, formHeader) {
      const columns = [];
      const dataPoint = referenceFacetTargetMetaPath.getTarget();
      if (dataPoint?.Visualization !== "UI.VisualizationType/Rating" && dataPoint?.Visualization !== "UI.VisualizationType/Progress") {
        const properties = this.getDataPointProperties(referenceFacetTargetMetaPath, dataPoint);
        properties.label = formHeader;
        const dataPointForms = this.getColumnForDataField(referenceFacetTargetMetaPath, properties, true);
        if (dataPointForms) {
          columns.push(...dataPointForms);
        }
      }
      return columns;
    }

    /**
     * Get the custom configured header facet elements.
     * @param headerFacetConfigs
     * @param annotatedReferenceFacets
     * @returns The custom configured header facet elements
     */;
    _proto.getCustomHeaderFacetConfigElements = function getCustomHeaderFacetConfigElements(headerFacetConfigs, annotatedReferenceFacets) {
      const customConfigHeaderFacetNames = Object.keys(headerFacetConfigs);
      return customConfigHeaderFacetNames.reduce((customHeaderFacetElements, customConfigHeaderFacetKey) => {
        const relevantFacetElement = annotatedReferenceFacets.find(headerFacetElement => headerFacetElement.key === customConfigHeaderFacetKey);
        if (relevantFacetElement) {
          customHeaderFacetElements[customConfigHeaderFacetKey] = {
            key: customConfigHeaderFacetKey,
            headerFacet: relevantFacetElement.headerFacet,
            position: {
              placement: Placement.After
            },
            ...headerFacetConfigs[customConfigHeaderFacetKey]
          };
        }
        return customHeaderFacetElements;
      }, {});
    }

    /**
     * Get the custom configured header facets.
     * @param headerFacetMetaPath MetaPath object of the annotated header facets
     * @returns Reference facets with overridden custom configurations
     */;
    _proto.getCustomConfigHeaderFacets = function getCustomConfigHeaderFacets(headerFacetMetaPath) {
      const referenceFacets = this.getReferenceFacetFromAnnotations(headerFacetMetaPath.getTarget());
      let annotatedReferenceFacets = referenceFacets.map(function (headerFacet) {
        return {
          key: generate([headerFacet.Target.value]),
          headerFacet
        };
      });
      // Get the UI overrides for header facets, if any
      const headerFacetConfigs = this.getCardConfigurationByKey("headerFacets");
      if (headerFacetConfigs && Object.keys(headerFacetConfigs).length > 0) {
        const customHeaderFacetConfigElements = this.getCustomHeaderFacetConfigElements(headerFacetConfigs, annotatedReferenceFacets);
        const headerFacetOverwriteConfig = {
          isVisible: OverrideType.overwrite,
          title: OverrideType.overwrite,
          position: OverrideType.overwrite,
          formElementsConfig: OverrideType.overwrite
        };

        // override the annotated header facets to reflect the UI changes on OP
        annotatedReferenceFacets = insertCustomElements(annotatedReferenceFacets, customHeaderFacetConfigElements, headerFacetOverwriteConfig);
      }
      return annotatedReferenceFacets;
    }

    /**
     * Get Header Data ColumnSets.
     * @param headerFacetMetaPath Array of header Facets
     * @param configHeaderFacets Header facets configurations
     * @returns ColumnSets containing header facet information which is required for adaptive card
     */;
    _proto.createHeaderForms = function createHeaderForms(headerFacetMetaPath, configHeaderFacets) {
      let previousCardElementIsDataPoint = false;
      return configHeaderFacets.reduce(function (headerForms, configHeaderFacet, currentIdx, allConfigHeaderFacets) {
        const FacetItem = configHeaderFacet.headerFacet;
        if (FacetItem.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && FacetItem.annotations?.UI?.Hidden?.valueOf() !== true) {
          const referenceFacetTargetMetaPath = headerFacetMetaPath.getMetaPathForObject(FacetItem.Target);
          const facetDefinition = referenceFacetTargetMetaPath?.getTarget();
          const navigationPath = this.getNavigationPathForExpression(referenceFacetTargetMetaPath);
          const visible = configHeaderFacet.isVisible ?? this.getVisibleForReferenceFacet(FacetItem, navigationPath);
          const formHeader = configHeaderFacet.title ?? FacetItem.Label?.toString();
          const formElementsConfig = configHeaderFacet.formElementsConfig;
          switch (facetDefinition?.term) {
            case "com.sap.vocabularies.UI.v1.FieldGroup":
              if (previousCardElementIsDataPoint === true) {
                // If previous header form content was a DataPoint, we add dummy columns.
                this.addEmptyColumns(headerForms[headerForms.length - 1]);
                previousCardElementIsDataPoint = false;
              }
              headerForms.push(...this.getFieldGroupContent(referenceFacetTargetMetaPath, formHeader, visible, formElementsConfig));
              break;
            case "com.sap.vocabularies.UI.v1.DataPoint":
              if (!isPotentiallySensitive(facetDefinition)) {
                const dataPointColumns = this.getDataPointContent(referenceFacetTargetMetaPath, configHeaderFacet.title ?? formHeader);
                const dataPointColumnSet = getColumnSet([], visible ?? undefined);
                if (previousCardElementIsDataPoint && headerForms[headerForms.length - 1].columns.length !== MAX_COLUMNS) {
                  headerForms[headerForms.length - 1].columns.push(...dataPointColumns);
                } else {
                  dataPointColumnSet.columns.push(...dataPointColumns);
                  headerForms.push(dataPointColumnSet);
                }
                previousCardElementIsDataPoint = true;
              }
              break;
            case "com.sap.vocabularies.Communication.v1.Address":
              if (previousCardElementIsDataPoint) {
                // If previous header form content was a DataPoint, we add dummy columns.
                this.addEmptyColumns(headerForms[headerForms.length - 1]);
                previousCardElementIsDataPoint = false;
              }
              headerForms.push(...this.getAddressContent(referenceFacetTargetMetaPath, configHeaderFacet.title ?? formHeader, visible));
              break;
            default:
              break;
          }
        }
        if (currentIdx === allConfigHeaderFacets.length - 1 && previousCardElementIsDataPoint) {
          // This is the last recursion of the reduce loop.
          // If previous header form content was a DataPoint, we add dummy columns.
          this.addEmptyColumns(headerForms[headerForms.length - 1]);
        }
        return headerForms;
      }.bind(this), []);
    }

    /**
     * Add empty columns to the end of the column set.
     *
     * Header form with less than the maximum columns need to be added with empty columns to have the consistent layout equal to MAX_COLUMNS.
     * This is needs in case of a header form contains DataPoints side by side. We fill the empty space in the layout with a dummy empty column.
     * @param cardColumnSet Equivalent of a Header Form
     */;
    _proto.addEmptyColumns = function addEmptyColumns(cardColumnSet) {
      const numColumns = cardColumnSet.columns.length;
      if (numColumns < MAX_COLUMNS && numColumns > 1) {
        // If only one column exists then we don't have problem as it can freely occupy the whole width of the row.
        const numColumnsToAdd = MAX_COLUMNS - numColumns;
        for (let i = 0; i < numColumnsToAdd; i++) {
          cardColumnSet.columns.push(...this.getColumnForDataField());
        }
      }
    }

    /**
     * Get the Address content from the facet.
     * @param referenceFacetTargetMetaPath Meta
     * @param formHeader Title of the form header
     * @param visible Visible expression for the FacetHeader
     * @returns Title and content of the address
     */;
    _proto.getAddressContent = function getAddressContent(referenceFacetTargetMetaPath, formHeader, visible) {
      const addressContent = [];
      const address = referenceFacetTargetMetaPath.getTarget();
      if (formHeader) {
        addressContent.push(getTextBlock({
          size: "Small",
          weight: "Bolder",
          text: formHeader,
          maxLines: 2,
          wrap: true,
          spacing: "Medium",
          visible: visible
        }));
      }
      const addressColumnSet = getColumnSet([], visible ?? undefined);
      const items = [];
      const columns = [];
      if (address?.label) {
        items.push(getTextBlock({
          size: "Small",
          text: `${address?.label}`,
          maxLines: 2
        }));
        columns.push(getColumn({
          items: items,
          visible: visible ?? undefined
        }));
      }
      if (columns.length > 0) {
        addressColumnSet.columns.push(...columns);
      }
      addressContent.push(addressColumnSet);
      return addressContent;
    }

    /**
     * Gets Reference facets configured in the header facet.
     * @param headerFacets HeaderFacets containing referncefacets.
     * @returns An Array of ReferenceFacets.
     */;
    _proto.getReferenceFacetFromAnnotations = function getReferenceFacetFromAnnotations(headerFacets) {
      return headerFacets ? headerFacets.filter(facet => facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") : [];
    }

    /**
     * Get referencefacet  visibility.
     * @param element Reference facet
     * @param navigationPath Visited navigation paths
     * @returns Boolean
     */;
    _proto.getVisibleForReferenceFacet = function getVisibleForReferenceFacet(element, navigationPath) {
      const visibilityExp = isVisible(element);
      return this.updatePathsAndGetCompiledExpression(visibilityExp, navigationPath);
    }

    /**
     * Get datafield visibility.
     * @param dataField DataFieldAbstract
     * @param navigationPath Visited navigation paths
     * @returns Boolean
     */;
    _proto.getVisibleForDataField = function getVisibleForDataField(dataField, navigationPath) {
      const visibilityExp = generateVisibleExpression(dataField.getDataModelObjectPath());
      return this.updatePathsAndGetCompiledExpression(visibilityExp, navigationPath);
    }

    /**
     * Get the navigation paths of the properties.
     * @param metaPathObject MetaPath of the object
     * @returns Navigation paths
     */;
    _proto.getNavigationPathForExpression = function getNavigationPathForExpression(metaPathObject) {
      const navigationProperties = metaPathObject.getNavigationProperties();
      const navigatedPaths = [];
      if (navigationProperties.length > 0) {
        navigationProperties.forEach(function (property) {
          if (isNavigationProperty(property)) {
            navigatedPaths.push(property.name);
          }
        });
      }
      return navigatedPaths?.toString()?.replaceAll(",", "/");
    };
    return HeaderContent;
  }(BaseCardContentProvider);
  _exports = HeaderContent;
  return _exports;
}, false);
//# sourceMappingURL=HeaderContent-dbg.js.map
