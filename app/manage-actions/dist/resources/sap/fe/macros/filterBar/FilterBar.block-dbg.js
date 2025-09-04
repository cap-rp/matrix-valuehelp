/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/jsx-runtime/jsx", "sap/fe/core/CommonUtils", "sap/fe/core/TemplateModel", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/Common/DataVisualization", "sap/fe/core/converters/controls/ListReport/FilterBar", "sap/fe/core/helpers/MetaModelFunction", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/DraftEditState", "sap/fe/macros/filterBar/FilterHelper", "sap/fe/macros/fpm/CustomFragment.block", "sap/fe/macros/internal/FilterField.block", "sap/m/Select", "sap/ui/core/CustomData", "sap/ui/core/ListItem", "sap/ui/core/fieldhelp/FieldHelpCustomData", "sap/ui/mdc/FilterField", "sap/ui/mdc/p13n/PersistenceProvider", "../ValueHelp", "../controls/CustomFilterFieldContentWrapper", "../controls/FilterBar", "../table/SlotColumn", "./FilterBarAPI", "sap/fe/base/jsx-runtime/jsx"], function (Log, jsx, CommonUtils, TemplateModel, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter, DataVisualization, FilterBar, MetaModelFunction, ModelHelper, StableIdHelper, CommonHelper, FieldHelper, FilterFieldHelper, FilterUtils, DraftEditState, FilterHelper, CustomFragmentBlock, InternalFilterField, Select, CustomData, ListItem, FieldHelpCustomData, MDCFilterField, PersistenceProvider, ValueHelp, CustomFilterFieldContentWrapper, FEFilterBar, SlotColumn, FilterBarAPI, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _dec18, _dec19, _dec20, _dec21, _dec22, _dec23, _dec24, _dec25, _dec26, _dec27, _dec28, _dec29, _dec30, _dec31, _dec32, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14, _descriptor15, _descriptor16, _descriptor17, _descriptor18, _descriptor19, _descriptor20, _descriptor21, _descriptor22, _descriptor23, _descriptor24, _descriptor25, _descriptor26, _descriptor27, _descriptor28, _descriptor29, _descriptor30, _descriptor31;
  var _exports = {};
  var getFilterConditions = FilterHelper.getFilterConditions;
  var maxConditions = FilterFieldHelper.maxConditions;
  var generate = StableIdHelper.generate;
  var getSearchRestrictions = MetaModelFunction.getSearchRestrictions;
  var getSelectionFields = FilterBar.getSelectionFields;
  var getSelectionVariant = DataVisualization.getSelectionVariant;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var storeObjectValue = BuildingBlockTemplateProcessor.storeObjectValue;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const setCustomFilterFieldProperties = function (childFilterField, aggregationObject) {
    aggregationObject.slotName = aggregationObject.key;
    aggregationObject.key = aggregationObject.key.replace("InlineXML_", "");
    aggregationObject.property = childFilterField.getAttribute("property");
    aggregationObject.label = childFilterField.getAttribute("label");
    aggregationObject.required = childFilterField.getAttribute("required") === "true";
    aggregationObject.template = childFilterField.getAttribute("template"); // But it's a string;
    return aggregationObject;
  };

  /**
   * Building block for creating a FilterBar based on the metadata provided by OData V4.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:FilterBar
   * id="SomeID"
   * showAdaptFiltersButton="true"
   * p13nMode=["Item","Value"]
   * listBindingNames = "sap.fe.tableBinding"
   * liveMode="true"
   * search=".handlers.onSearch"
   * filterChanged=".handlers.onFiltersChanged"
   * /&gt;
   * </pre>
   *
   * Building block for creating a FilterBar based on the metadata provided by OData V4.
   * @since 1.94.0
   */
  let FilterBarBlock = (_dec = defineBuildingBlock({
    name: "FilterBar",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.filterBar.FilterBarAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context"
  }), _dec5 = blockAttribute({
    type: "string"
  }), _dec6 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "string"
  }), _dec10 = blockAttribute({
    type: "boolean"
  }), _dec11 = blockAttribute({
    type: "boolean"
  }), _dec12 = blockAttribute({
    type: "boolean"
  }), _dec13 = blockAttribute({
    type: "string[]"
  }), _dec14 = blockAttribute({
    type: "string"
  }), _dec15 = blockAttribute({
    type: "boolean"
  }), _dec16 = blockAttribute({
    type: "string[]"
  }), _dec17 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec18 = blockAttribute({
    type: "string",
    required: false
  }), _dec19 = blockAttribute({
    type: "boolean"
  }), _dec20 = blockAttribute({
    type: "boolean"
  }), _dec21 = blockAttribute({
    type: "string"
  }), _dec22 = blockAttribute({
    type: "string"
  }), _dec23 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec24 = blockAttribute({
    type: "boolean"
  }), _dec25 = blockAttribute({
    type: "boolean"
  }), _dec26 = blockEvent(), _dec27 = blockEvent(), _dec28 = blockEvent(), _dec29 = blockEvent(), _dec30 = blockEvent(), _dec31 = blockAggregation({
    type: "sap.fe.macros.filterBar.FilterField",
    isPublic: true,
    hasVirtualNode: true,
    processAggregations: setCustomFilterFieldProperties
  }), _dec32 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function FilterBarBlock(props, configuration, mSettings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, configuration, mSettings) || this;
      /**
       * ID of the FilterBar
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      _initializerDefineProperty(_this, "visible", _descriptor2, _this);
      /**
       * selectionFields to be displayed
       */
      _initializerDefineProperty(_this, "selectionFields", _descriptor3, _this);
      _initializerDefineProperty(_this, "filterBarDelegate", _descriptor4, _this);
      _initializerDefineProperty(_this, "metaPath", _descriptor5, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor6, _this);
      /**
       * Displays possible errors during the search in a message box
       */
      _initializerDefineProperty(_this, "showMessages", _descriptor7, _this);
      /**
       * ID of the assigned variant management
       */
      _initializerDefineProperty(_this, "variantBackreference", _descriptor8, _this);
      /**
       * Don't show the basic search field
       */
      _initializerDefineProperty(_this, "hideBasicSearch", _descriptor9, _this);
      /**
       * Enables the fallback to show all fields of the EntityType as filter fields if com.sap.vocabularies.UI.v1.SelectionFields are not present
       */
      _initializerDefineProperty(_this, "enableFallback", _descriptor10, _this);
      /**
       * Handles visibility of the 'Adapt Filters' button on the FilterBar
       */
      _initializerDefineProperty(_this, "showAdaptFiltersButton", _descriptor11, _this);
      /**
       * Specifies the personalization options for the filter bar.
       */
      _initializerDefineProperty(_this, "p13nMode", _descriptor12, _this);
      _initializerDefineProperty(_this, "propertyInfo", _descriptor13, _this);
      /**
       * Specifies the Sematic Date Range option for the filter bar.
       */
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor14, _this);
      /**
       * Specifies the navigation properties option for the filter bar.
       */
      _initializerDefineProperty(_this, "navigationProperties", _descriptor15, _this);
      /**
       * If set, the search is automatically triggered when a filter value is changed.
       */
      _initializerDefineProperty(_this, "liveMode", _descriptor16, _this);
      /**
       * Filter conditions to be applied to the filter bar
       */
      _initializerDefineProperty(_this, "filterConditions", _descriptor17, _this);
      /**
       * If set to <code>true</code>, all search requests are ignored. Once it has been set to <code>false</code>,
       * a search is triggered immediately if one or more search requests have been triggered in the meantime
       * but were ignored based on the setting.
       */
      _initializerDefineProperty(_this, "suspendSelection", _descriptor18, _this);
      _initializerDefineProperty(_this, "isDraftCollaborative", _descriptor19, _this);
      /**
       * Id of control that will allow for switching between normal and visual filter
       */
      _initializerDefineProperty(_this, "toggleControlId", _descriptor20, _this);
      _initializerDefineProperty(_this, "initialLayout", _descriptor21, _this);
      /**
       * Handles the visibility of the 'Clear' button on the FilterBar.
       */
      _initializerDefineProperty(_this, "showClearButton", _descriptor22, _this);
      _initializerDefineProperty(_this, "_applyIdToContent", _descriptor23, _this);
      _initializerDefineProperty(_this, "disableDraftEditStateFilter", _descriptor24, _this);
      /**
       * Event handler to react to the search event of the FilterBar
       */
      _initializerDefineProperty(_this, "search", _descriptor25, _this);
      /**
       * Event handler to react to the filterChange event of the FilterBar
       */
      _initializerDefineProperty(_this, "filterChanged", _descriptor26, _this);
      /**
       * Event handler to react to the filterChanged event of the FilterBar. Exposes parameters from the MDC filter bar
       */
      _initializerDefineProperty(_this, "internalFilterChanged", _descriptor27, _this);
      /**
       * Event handler to react to the search event of the FilterBar. Exposes parameteres from the MDC filter bar
       */
      _initializerDefineProperty(_this, "internalSearch", _descriptor28, _this);
      /**
       * Event handler to react to the afterClear event of the FilterBar
       */
      _initializerDefineProperty(_this, "afterClear", _descriptor29, _this);
      _initializerDefineProperty(_this, "filterFields", _descriptor30, _this);
      _this.showDraftEditState = false;
      /**
       * This mode must be used when it is certain that a control must not persist it´s personalization state upon initialization.
       * @experimental
       * @since 1.136.0
       */
      _initializerDefineProperty(_this, "ignorePersonalizationChanges", _descriptor31, _this);
      _this.checkIfEditingFilterIsDisabled = targetEntitySet => {
        if (targetEntitySet.annotations?.Capabilities?.NavigationRestrictions?.RestrictedProperties?.some(r => r.NavigationProperty?.value === "DraftAdministrativeData" && r.FilterRestrictions?.Filterable === false) === true) {
          _this.showDraftEditState = false;
        }
      };
      _this.checkIfCollaborationDraftSupported = oMetaModel => {
        if (ModelHelper.isCollaborationDraftSupported(oMetaModel)) {
          _this.isDraftCollaborative = true;
        }
      };
      _this.getEntityTypePath = metaPathParts => {
        return metaPathParts[0].endsWith("/") ? metaPathParts[0] : metaPathParts[0] + "/";
      };
      _this.getSearch = () => {
        if (!_this.hideBasicSearch) {
          return _jsx(MDCFilterField, {
            id: generate([_this.id, "BasicSearchField"]),
            placeholder: "{sap.fe.i18n>M_FILTERBAR_SEARCH}",
            propertyKey: "$search",
            conditions: "{$filters>/conditions/$search}",
            dataType: "sap.ui.model.odata.type.String",
            maxConditions: "1",
            dataTypeConstraints: "{'maxLength':1000}"
          });
        }
        return "";
      };
      _this.processSelectionFields = () => {
        let draftEditState = "";
        if (_this.showDraftEditState) {
          const draftStates = DraftEditState.getEditStates(_this.isDraftCollaborative);
          const label = _this.getTranslatedText("FILTERBAR_EDITING_STATUS");
          draftEditState = _jsx(MDCFilterField, {
            label: label,
            conditions: "{$filters>/conditions/$editState}",
            maxConditions: "1",
            id: generate([_this.id, "FilterField", "DraftEditingStatus"]),
            operators: "EQ",
            dataType: "sap.ui.model.odata.type.String",
            propertyKey: "$editState",
            display: "Description",
            children: {
              contentEdit: _jsx(Select, {
                id: generate([_this.id, "FilterField", "DraftEditingStatusSelect"]),
                width: "100%",
                forceSelection: "true",
                selectedKey: "{path: '$field>/conditions', type: 'sap.ui.mdc.field.ConditionsType'}",
                children: {
                  items: draftStates.map(state => _jsx(ListItem, {
                    text: state.display
                  }, state.id))
                }
              })
            }
          });
        }
        _this._valueHelps = [];
        _this._filterFields = [];
        _this._filterFields?.push(draftEditState);
        if (!Array.isArray(_this.selectionFields)) {
          _this.selectionFields = _this.selectionFields.getObject();
        }
        _this.selectionFields?.forEach(selectionField => {
          if (selectionField.availability === "Default") {
            _this.setFilterFieldsAndValueHelps(selectionField);
          }
        });
        _this._filterFields = _this._filterFields?.length > 0 ? _this._filterFields : "";
        _this._valueHelps = _this._valueHelps?.length > 0 ? _this._valueHelps : "";
      };
      _this.setFilterFieldsAndValueHelps = selectionField => {
        if (selectionField.template === undefined && selectionField.type !== "Slot") {
          _this.pushFilterFieldsAndValueHelps(selectionField);
        } else if (Array.isArray(_this._filterFields)) {
          const property = selectionField.annotationPath;
          const propertyContext = _this.metaPath.getModel().createBindingContext(property);
          const propertyObject = propertyContext?.getObject();
          let filterContent;
          if (selectionField.type === "Slot") {
            filterContent = _jsx(SlotColumn, {
              templateId: selectionField.template,
              children: _jsx("slot", {
                name: selectionField.slotName
              })
            });
          } else if (selectionField.template) {
            filterContent = _jsx(CustomFragmentBlock, {
              fragmentName: selectionField.template,
              id: generate([_this.id, "CustomFilterField", selectionField.key]),
              contextPath: "{contextPath>}"
            });
          }
          let maxConditionValue = -1;
          if (propertyContext) {
            maxConditionValue = maxConditions(selectionField.annotationPath, {
              context: propertyContext
            }) ?? -1;
          }
          _this._filterFields?.push(_jsx(MDCFilterField, {
            id: generate([_this.id, "CustomFilterField", selectionField.key]),
            delegate: {
              name: "sap/fe/macros/field/FieldBaseDelegate"
            },
            propertyKey: selectionField.conditionPath,
            label: selectionField.label,
            dataType: "Edm.String",
            maxConditions: maxConditionValue,
            conditions: `{$filters>/conditions/${selectionField.conditionPath}}`,
            operators: FieldHelper.operators(propertyContext, propertyObject, _this.useSemanticDateRange, selectionField.settings, _this.contextPath.getPath()),
            dataTypeConstraints: selectionField.constraints,
            dataTypeFormatOptions: selectionField.formatOptions,
            valueHelp: "undefined",
            required: selectionField.required,
            children: {
              content: _jsx(CustomFilterFieldContentWrapper, {
                "core:require": "{handler: 'sap/fe/macros/filter/FilterUtils'}",
                id: generate([_this.id, "FilterFieldContentWrapper", selectionField.key]),
                binding: `{filterValues>/'${FilterUtils.conditionToModelPath(selectionField.conditionPath)}}`,
                conditions: "{path: '$field>/conditions'}",
                children: {
                  content: filterContent
                }
              }),
              customData: [_jsx(CustomData, {
                value: selectionField.type === "Slot"
              }, "isSlot"), _jsx(FieldHelpCustomData, {
                value: `{parts: [{value: 'asArray'}, {value: '${selectionField.documentRefText}'}], formatter: 'sap.fe.core.formatters.StandardFormatter'}`
              }, "sap-ui-DocumentationRef")]
            }
          }));
        }
      };
      _this.pushFilterFieldsAndValueHelps = selectionField => {
        if (Array.isArray(_this._filterFields)) {
          _this._filterFields?.push(_jsx(InternalFilterField, {
            idPrefix: generate([_this.id, "FilterField", CommonHelper.getNavigationPath(selectionField.annotationPath)]),
            vhIdPrefix: generate([_this.id, "FilterFieldValueHelp"]),
            property: selectionField.annotationPath,
            contextPath: _this._getContextPathForFilterField(selectionField, _this._internalContextPath),
            useSemanticDateRange: _this.useSemanticDateRange,
            settings: CommonHelper.stringifyCustomData(selectionField.settings),
            visualFilter: selectionField.visualFilter !== undefined ? storeObjectValue(selectionField.visualFilter) : undefined,
            editMode: `{internal>/${_this.id}/filterFields/${selectionField.conditionPath}/editMode}`
          }));
        }
        if (Array.isArray(_this._valueHelps)) {
          _this._valueHelps?.push(_jsx(ValueHelp, {
            idPrefix: generate([_this.id, "FilterFieldValueHelp"]),
            conditionModel: "$filters",
            metaPath: selectionField.annotationPath,
            contextPath: _this._getContextPathForFilterField(selectionField, _this._internalContextPath),
            filterFieldValueHelp: true,
            useSemanticDateRange: _this.useSemanticDateRange
          }));
        }
      };
      if (!_this.metaPath) {
        Log.error("Context Path not available for FilterBar Macro.");
        return _assertThisInitialized(_this);
      }
      const sMetaPath = _this.metaPath.getPath();
      let entityTypePath = "";
      const _metaPathParts = sMetaPath?.split("/@com.sap.vocabularies.UI.v1.SelectionFields") || []; // [0]: entityTypePath, [1]: SF Qualifier.
      if (_metaPathParts.length > 0) {
        entityTypePath = _this.getEntityTypePath(_metaPathParts);
      }
      const sEntitySetPath = ModelHelper.getEntitySetPath(entityTypePath);
      const _oMetaModel = _this.contextPath?.getModel();
      _this._internalContextPath = _oMetaModel?.createBindingContext(entityTypePath);
      const annotationPath = "@com.sap.vocabularies.UI.v1.SelectionFields" + (_metaPathParts.length && _metaPathParts[1] || "");
      const parentContextPath = mSettings?.fullContextPath;
      let sObjectPath = annotationPath;
      if (parentContextPath !== "" && _this._internalContextPath.getPath()?.startsWith(parentContextPath)) {
        sObjectPath = sMetaPath.replace(parentContextPath, "");
      }
      _this._annotationPath = annotationPath;
      const oExtraParams = {};
      if (_this.filterFields) {
        oExtraParams[sObjectPath] = {
          filterFields: _this.filterFields
        };
      }
      const oVisualizationObjectPath = getInvolvedDataModelObjects(_this._internalContextPath);
      const oConverterContext = _this.getConverterContext(oVisualizationObjectPath, undefined, mSettings, oExtraParams);
      if (!_this.propertyInfo) {
        _this.propertyInfo = getSelectionFields(oConverterContext, [], annotationPath).sPropertyInfo;
      }
      const _targetEntitySet = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath).targetEntitySet;
      if (_targetEntitySet?.annotations?.Common?.DraftRoot && !_this.disableDraftEditStateFilter) {
        _this.showDraftEditState = true;
        _this.checkIfEditingFilterIsDisabled(_targetEntitySet);
        _this.checkIfCollaborationDraftSupported(_oMetaModel);
      }

      //Filter Fields and values to the field are filled based on the selectionFields and this would be empty in case of macro outside the FE template
      if (!_this.selectionFields) {
        const oSelectionFields = getSelectionFields(oConverterContext, [], annotationPath).selectionFields;
        _this.selectionFields = new TemplateModel(oSelectionFields, _oMetaModel).createBindingContext("/");
        const viewData = mSettings?.models?.viewData?.getData();
        const oEntityType = oConverterContext.getEntityType(),
          oSelectionVariant = getSelectionVariant(oEntityType, oConverterContext),
          oEntitySetContext = _oMetaModel.getContext(sEntitySetPath),
          oFilterConditions = getFilterConditions(oEntitySetContext,
          // Wrong but somehow works ?,
          {
            selectionVariant: oSelectionVariant
          }, oEntitySetContext.getObject(), viewData, _this.showDraftEditState);
        _this.filterConditions = oFilterConditions;
      }
      _this._processPropertyInfos(_this.propertyInfo, _oMetaModel);
      if (_this._applyIdToContent) {
        _this._apiId = _this.id + "::FilterBar";
        _this._contentId = _this.id;
      } else {
        _this._apiId = _this.id;
        _this._contentId = _this.getContentId(_this.id + "");
      }
      if (_this.hideBasicSearch !== true) {
        const oSearchRestrictionAnnotation = getSearchRestrictions(sEntitySetPath, _oMetaModel);
        _this.hideBasicSearch = Boolean(oSearchRestrictionAnnotation && !oSearchRestrictionAnnotation.Searchable);
      }
      jsx.renderAsXML(() => _this.processSelectionFields());
      _this.designtime = _this.getDesigntime();
      return _this;
    }
    _exports = FilterBarBlock;
    _inheritsLoose(FilterBarBlock, _BuildingBlockTemplat);
    var _proto = FilterBarBlock.prototype;
    _proto._processPropertyInfos = function _processPropertyInfos(propertyInfo, model) {
      const aParameterFields = [];
      if (propertyInfo) {
        const sFetchedProperties = propertyInfo.replace(/\\{/g, "{").replace(/\\}/g, "}");
        const aFetchedProperties = JSON.parse(sFetchedProperties);
        const editStateLabel = this.getTranslatedText("FILTERBAR_EDITING_STATUS");
        aFetchedProperties.forEach(function (propInfo) {
          propInfo.key = propInfo.name;
          if (propInfo.isParameter) {
            aParameterFields.push(propInfo.name);
          }
          if (propInfo.path === "$editState") {
            propInfo.label = editStateLabel;
          }
          if (propInfo.key?.includes("/")) {
            //TO DO: Need to place this logic in common place when we cover filterRetrictions with this BLI FIORITECHP1-25080
            const annotationPath = propInfo.annotationPath;
            const propertyLocationPath = CommonHelper.getLocationForPropertyPath(model, annotationPath);
            const propertyPath = annotationPath.replace(`${propertyLocationPath}/`, "");
            propInfo.required = CommonUtils.getFilterRestrictionsByPath(propertyLocationPath, model)?.RequiredProperties?.includes(propertyPath);
          }
        });
        this.propertyInfo = JSON.stringify(aFetchedProperties).replace(/\{/g, "\\{").replace(/\}/g, "\\}");
      }
      this._parameters = JSON.stringify(aParameterFields);
    };
    _proto.getPersistenceProvider = function getPersistenceProvider(filterBarId) {
      if (this.ignorePersonalizationChanges) {
        return _jsx(PersistenceProvider, {
          id: generate([filterBarId, "PersistenceProvider"]),
          for: filterBarId,
          mode: "Transient"
        });
      }
      return undefined;
    };
    _proto._getContextPathForFilterField = function _getContextPathForFilterField(selectionField, filterBarContextPath) {
      let contextPath = filterBarContextPath?.getPath();
      if (selectionField.isParameter) {
        // Example:
        // FilterBarContextPath: /Customer/Set
        // ParameterPropertyPath: /Customer/P_CC
        // ContextPathForFilterField: /Customer
        const annoPath = selectionField.annotationPath;
        contextPath = annoPath.substring(0, annoPath.lastIndexOf("/") + 1);
      }
      return contextPath;
    };
    /**
     * Determines the design time for the MDC FilterBar.
     * @returns The value to be assigned to dt:designtime
     */
    _proto.getDesigntime = function getDesigntime() {
      return "sap/fe/macros/filterBar/designtime/FilterBar.designtime";
    };
    _proto.getTemplate = function getTemplate() {
      const internalContextPath = this._internalContextPath?.getPath();
      let filterDelegate = "";
      if (this.filterBarDelegate) {
        filterDelegate = this.filterBarDelegate;
      } else {
        filterDelegate = "{name:'sap/fe/macros/filterBar/FilterBarDelegate', payload: {entityTypePath: '" + internalContextPath + "'}}";
      }
      // after removing the unwanted properties PropertyInfo is added to the control, and we also save the full version as custom data for FE internal use
      const _propertyInfoControl = FilterUtils.formatPropertyInfo(this.propertyInfo);
      return _jsx(FilterBarAPI, {
        id: this._apiId,
        metaPath: this.metaPath.getPath(),
        search: this.search,
        filterChanged: this.filterChanged,
        afterClear: this.afterClear,
        internalSearch: this.internalSearch,
        internalFilterChanged: this.internalFilterChanged,
        children: {
          content: _jsx(FEFilterBar, {
            "core:require": "{API: 'sap/fe/macros/filterBar/FilterBarAPI'}",
            id: this._contentId,
            liveMode: this.liveMode,
            delegate: filterDelegate,
            variantBackreference: this.liveMode ? undefined : this.variantBackreference,
            showAdaptFiltersButton: this.showAdaptFiltersButton,
            showClearButton: this.showClearButton,
            p13nMode: this.p13nMode,
            search: "API.handleSearch($event)",
            filtersChanged: "API.handleFilterChanged($event)",
            filterConditions: this.filterConditions,
            suspendSelection: this.suspendSelection,
            showMessages: this.showMessages,
            toggleControl: this.toggleControlId,
            initialLayout: this.initialLayout,
            propertyInfo: _propertyInfoControl,
            visible: this.visible,
            "dt:designtime": this.designtime,
            "customData:entityType": internalContextPath,
            children: {
              customData: [_jsx(CustomData, {
                value: this.id
              }, "localId"), _jsx(CustomData, {
                value: this.hideBasicSearch
              }, "hideBasicSearch"), _jsx(CustomData, {
                value: this.showDraftEditState
              }, "showDraftEditState"), _jsx(CustomData, {
                value: this.useSemanticDateRange
              }, "useSemanticDateRange"), _jsx(CustomData, {
                value: this._parameters
              }, "parameters"), _jsx(CustomData, {
                value: this.propertyInfo
              }, "feFilterInfo"), _jsx(CustomData, {
                value: this._annotationPath
              }, "annotationPath")],
              dependents: [this._valueHelps, this.getPersistenceProvider(this._contentId)],
              basicSearchField: this.getSearch(),
              filterItems: this._filterFields
            }
          })
        }
      });
    };
    return FilterBarBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "selectionFields", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "filterBarDelegate", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "showMessages", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "variantBackreference", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "hideBasicSearch", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "enableFallback", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "showAdaptFiltersButton", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "p13nMode", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Item,Value";
    }
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "propertyInfo", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor15 = _applyDecoratedDescriptor(_class2.prototype, "navigationProperties", [_dec16], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor16 = _applyDecoratedDescriptor(_class2.prototype, "liveMode", [_dec17], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor17 = _applyDecoratedDescriptor(_class2.prototype, "filterConditions", [_dec18], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor18 = _applyDecoratedDescriptor(_class2.prototype, "suspendSelection", [_dec19], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor19 = _applyDecoratedDescriptor(_class2.prototype, "isDraftCollaborative", [_dec20], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor20 = _applyDecoratedDescriptor(_class2.prototype, "toggleControlId", [_dec21], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor21 = _applyDecoratedDescriptor(_class2.prototype, "initialLayout", [_dec22], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "compact";
    }
  }), _descriptor22 = _applyDecoratedDescriptor(_class2.prototype, "showClearButton", [_dec23], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor23 = _applyDecoratedDescriptor(_class2.prototype, "_applyIdToContent", [_dec24], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor24 = _applyDecoratedDescriptor(_class2.prototype, "disableDraftEditStateFilter", [_dec25], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor25 = _applyDecoratedDescriptor(_class2.prototype, "search", [_dec26], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor26 = _applyDecoratedDescriptor(_class2.prototype, "filterChanged", [_dec27], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor27 = _applyDecoratedDescriptor(_class2.prototype, "internalFilterChanged", [_dec28], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor28 = _applyDecoratedDescriptor(_class2.prototype, "internalSearch", [_dec29], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor29 = _applyDecoratedDescriptor(_class2.prototype, "afterClear", [_dec30], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor30 = _applyDecoratedDescriptor(_class2.prototype, "filterFields", [_dec31], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor31 = _applyDecoratedDescriptor(_class2.prototype, "ignorePersonalizationChanges", [_dec32], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  _exports = FilterBarBlock;
  return _exports;
}, false);
//# sourceMappingURL=FilterBar.block-dbg.js.map
