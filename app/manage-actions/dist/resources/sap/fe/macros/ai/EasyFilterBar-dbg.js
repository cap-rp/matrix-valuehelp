/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/controls/easyFilter/EasyFilterBarContainer", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/BusyLocker", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/PropertyHelper", "sap/fe/macros/ai/EasyFilterDataFetcher", "sap/fe/macros/filter/FilterUtils", "sap/fe/macros/filterBar/DraftEditState", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/ui/core/Element", "sap/ui/model/FilterOperator", "sap/ui/model/json/JSONModel", "sap/ui/model/odata/type/Date", "sap/ui/model/odata/type/DateTimeOffset", "sap/ui/model/odata/type/TimeOfDay", "sap/fe/base/jsx-runtime/jsx"], function (Log, ClassSupport, EasyFilterBarContainer, BuildingBlock, BusyLocker, ModelHelper, TypeGuards, PropertyHelper, EasyFilterDataFetcher, FilterUtils, DraftEditState, ValueListHelper, UI5Element, FilterOperator, JSONModel, Date1, DateTimeOffset, TimeOfDay, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6;
  var _exports = {};
  var unresolvedResult = EasyFilterDataFetcher.unresolvedResult;
  var resolveTokenValue = EasyFilterDataFetcher.resolveTokenValue;
  var mapValueListToCodeList = EasyFilterDataFetcher.mapValueListToCodeList;
  var generateSelectParameter = EasyFilterDataFetcher.generateSelectParameter;
  var hasValueHelpWithFixedValues = PropertyHelper.hasValueHelpWithFixedValues;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Delivery for beta release for the easy filter feature.
   * @experimental
   */
  let EasyFilterBar = (_dec = defineUI5Class("sap.fe.macros.EasyFilterBar"), _dec2 = implementInterface("sap.fe.core.controllerextensions.viewState.IViewStateContributor"), _dec3 = association({
    type: "sap.fe.macros.filterBar.FilterBarAPI"
  }), _dec4 = association({
    type: "sap.fe.macros.contentSwitcher.ContentSwitcher"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec7 = aggregation({
    type: "sap.fe.controls.easyFilter.EasyFilterBarContainer"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function EasyFilterBar(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", _descriptor, _this);
      _initializerDefineProperty(_this, "filterBar", _descriptor2, _this);
      _initializerDefineProperty(_this, "contentSwitcher", _descriptor3, _this);
      _initializerDefineProperty(_this, "contentSwitcherKey", _descriptor4, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor5, _this);
      _initializerDefineProperty(_this, "content", _descriptor6, _this);
      _this.getAppComponent()?.getEnvironmentCapabilities().prepareFeature("MagicFiltering").then(() => {
        _this.easyFilterPath = "ux/eng/fioriai/reuse/easyfilter/EasyFilter";
        _this.content?.setEasyFilterLib(_this.easyFilterPath);
        return;
      }).catch(error => {
        Log.debug("Error while loading EasyFilter", error);
        return undefined;
      });
      return _this;
    }
    _exports = EasyFilterBar;
    _inheritsLoose(EasyFilterBar, _BuildingBlock);
    var _proto = EasyFilterBar.prototype;
    _proto.applyLegacyState = async function applyLegacyState(getContrilState, oNavParameters, _shouldApplyDiffState, _skipMerge) {
      if (oNavParameters?.selectionVariant) {
        const selectOptionsNames = oNavParameters.selectionVariant.getSelectOptionsPropertyNames();
        this.filterBarMetadata.forEach(field => {
          if (selectOptionsNames.includes(field.name)) {
            field.defaultValue = oNavParameters.selectionVariant.getSelectOption(field.name)?.map(option => {
              if (option.Sign === "I") {
                if (option.Option === "BT") {
                  return {
                    operator: FilterOperator.BT,
                    selectedValues: [{
                      value1: option.Low,
                      value2: option.High
                    }]
                  };
                } else {
                  return {
                    operator: option.Option,
                    selectedValues: [option.Low]
                  };
                }
              } else {
                return {
                  operator: FilterOperator.NE,
                  selectedValues: [option.Low]
                };
              }
            });
          }
        });
        this.content?.resetState(false);
      }
      return Promise.resolve(undefined);
    };
    _proto.applyState = function applyState(_state, _oNavParameters) {
      return undefined;
    };
    _proto.retrieveState = function retrieveState() {
      return {};
    };
    _proto.getApplicationId = function getApplicationId() {
      return this.getAppComponent()?.getManifestEntry("sap.app").id ?? "<unknownID>";
    };
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this._fetchedCodeList ??= {};
      this.filterBarMetadata = this.prepareFilterBarMetadata();
      this.recommendedQueries = this.getAppComponent()?.getManifestEntry("sap.fe")?.macros?.easyFilter?.recommendedQueries ?? [];
      this.content = this.createContent();
      this.content.filterBarMetadata = this.filterBarMetadata;
    };
    _proto.prepareFilterBarMetadata = function prepareFilterBarMetadata() {
      const owner = this._getOwner();
      const definitionForPage = owner.preprocessorContext?.getDefinitionForPage();
      let filterBarDef;
      if (definitionForPage) {
        filterBarDef = definitionForPage.getFilterBarDefinition({});
        const metaModel = owner.preprocessorContext?.models.metaModel;
        const getType = (edmType, codeList) => {
          if (codeList) {
            return "MenuWithCheckBox";
          }
          switch (edmType) {
            case "Edm.Date":
              return "Calendar";
            case "Edm.TimeOfDay":
              return "Time";
            default:
              return "ValueHelp";
          }
        };
        const startupParameters = owner.getAppComponent().getComponentData()?.startupParameters ?? {};
        const filterFields = filterBarDef.getFilterFields();
        const result = filterFields.map(field => {
          // Exclude hidden filter fields. It is not possible to set a value for hidden filters, and users would not understand anyway as they cannot see these values.
          const propertyObject = field.getTarget();
          let codeList;
          const hasCodeList = hasValueHelpWithFixedValues(propertyObject);
          if (hasCodeList) {
            codeList = this._fetchedCodeList[field.name];
            if (!codeList) {
              codeList = async () => this.getCodeListForProperty(field.name, field.annotationPath);
            }
          }

          // Check if the filter field's target property has a currency or a unit. If so, look for the corresponding filter field (the
          // annotation has to be a path for that) and set the 'unit' property.
          const unitAnnotation = propertyObject.annotations.Measures?.ISOCurrency ?? propertyObject.annotations.Measures?.Unit;
          const unitProperty = isPathAnnotationExpression(unitAnnotation) ? unitAnnotation.$target : undefined;
          const unit = unitProperty ? filterFields.find(f => f.getTarget() === unitProperty)?.name : undefined;
          let defaultValue;
          if (startupParameters.hasOwnProperty(field.name)) {
            defaultValue = [{
              operator: FilterOperator.EQ,
              selectedValues: startupParameters[field.name]
            }];
          } else if (field.isParameter && startupParameters.hasOwnProperty(field.name.substring(2))) {
            defaultValue = [{
              operator: FilterOperator.EQ,
              selectedValues: startupParameters[field.name.substring(2)]
            }];
          }
          return {
            name: field.name,
            path: field.annotationPath,
            label: field.label,
            dataType: propertyObject.type,
            required: field.required ?? false,
            defaultValue: defaultValue,
            filterable: true,
            sortable: !field.isParameter,
            codeList: codeList,
            type: getType(propertyObject.type, codeList),
            unit: unit
          };
        });

        // [Editing Status]

        if (ModelHelper.isMetaPathDraftSupported(definitionForPage.getMetaPath())) {
          // Assemble the code list for the editing status filter values:
          const props = new JSONModel({
            isDraftCollaborative: ModelHelper.isCollaborationDraftSupported(metaModel)
          }).createBindingContext("/");
          const editingStatusCodeList = DraftEditState.getEditStatesContext(props).getObject("/").map(state => ({
            value: state.id,
            description: state.display
          }));
          result.push({
            name: "$editState",
            label: this.getTranslatedText("FILTERBAR_EDITING_STATUS"),
            dataType: "Edm.String",
            required: false,
            filterable: true,
            sortable: false,
            codeList: editingStatusCodeList,
            type: "MenuWithCheckBox"
          });
        }
        return result;
      }
      return [];
    };
    _proto.getCodeListForProperty = async function getCodeListForProperty(key, propertyPath) {
      const defaultValueList = await this.getValueList(propertyPath);
      if (!defaultValueList) {
        return [];
      }
      const valueListInfo = defaultValueList.valueListInfo;
      const listBinding = valueListInfo.$model.bindList(`/${valueListInfo.CollectionPath}`, undefined, undefined, undefined, {
        $select: generateSelectParameter(defaultValueList)
      });
      const data = await listBinding.requestContexts();
      const filterGroupValues = data.map(mapValueListToCodeList(defaultValueList));
      this._fetchedCodeList[key] = filterGroupValues;
      const codeListProperty = this.filterBarMetadata.find(field => field.name === key);
      if (codeListProperty) {
        codeListProperty.codeList = filterGroupValues;
      }
      return filterGroupValues;
    };
    _proto.resolveTokenValuesForField = async function resolveTokenValuesForField(fieldName, values) {
      const field = this.filterBarMetadata.find(_ref => {
        let {
          name
        } = _ref;
        return name === fieldName;
      });
      if (field?.path) {
        const valueList = await this.getValueList(field.path);
        if (valueList && ValueListHelper.isValueListSearchable(field.path, valueList)) {
          const resolvedTokenValues = await Promise.all(values.map(async value => resolveTokenValue(valueList, value)));
          return resolvedTokenValues.flat();
        }
      }

      // return original values converted to the expected format
      return unresolvedResult(values);
    };
    _proto.getValueList = async function getValueList(propertyPath) {
      const metaModel = this.getMetaModel();
      const valueLists = await ValueListHelper.getValueListInfo(undefined, propertyPath, undefined, metaModel);
      return valueLists[0];
    };
    _proto.onTokensChanged = async function onTokensChanged(e) {
      const filterBar = UI5Element.getElementById(this.filterBar);
      const filterBarAPI = filterBar.getParent();
      const tokens = e.getParameter("tokens");
      const clearEditFilter = tokens.some(tokenDefinition => tokenDefinition.key === "$editState");
      await filterBarAPI._clearFilterValuesWithOptions(filterBar, {
        clearEditFilter
      });
      this.formateDataTypes(tokens);
      for (const token of tokens) {
        if (token.key === "$editState") {
          // convert the $editState filter condition
          for (const tokenKeySpecification of token.keySpecificSelectedValues) {
            await FilterUtils.addFilterValues(filterBarAPI.content, token.key, "DRAFT_EDIT_STATE", tokenKeySpecification.selectedValues);
          }
        } else {
          //BT and NB case to be handled in future, currently its crashing
          for (const tokenKeySpecification of token.keySpecificSelectedValues) {
            const {
              operator,
              selectedValues
            } = tokenKeySpecification;
            await FilterUtils.addFilterValues(filterBarAPI.content, token.key, operator, selectedValues);
          }
        }
      }
      await filterBarAPI.triggerSearch();
    }

    //We need the below function so that the date objects and dateTimeOffsets would be converted to string type as the date object is not a valid type in V4 world
    ;
    _proto.formateDataTypes = function formateDataTypes(tokens) {
      const dateType = new Date1(),
        dateTimeOffsetType = new DateTimeOffset(undefined, {
          V4: true
        }),
        timeOfDayType = new TimeOfDay();
      tokens.forEach(token => {
        const edmType = this.filterBarMetadata.find(data => data.name === token.key)?.dataType;
        token.keySpecificSelectedValues.forEach(keySpecificSelectedValue => {
          let requiredConverter;
          switch (edmType) {
            case "Edm.Date":
              requiredConverter = dateType;
              break;
            case "Edm.TimeOfDay":
              requiredConverter = timeOfDayType;
              break;
            case "Edm.DateTimeOffset":
              requiredConverter = dateTimeOffsetType;
              break;
            default:
              return;
          }
          keySpecificSelectedValue.selectedValues.forEach((value, idx) => {
            keySpecificSelectedValue.selectedValues[idx] = requiredConverter.parseValue(value, "object");
          });
        });
      });
    };
    _proto.showValueHelpForKey = async function showValueHelpForKey(key, _currentValue, fnCallback) {
      const filterBar = UI5Element.getElementById(this.filterBar);
      const filterBarAPI = filterBar.getParent();
      await filterBarAPI.showFilterField(key);
      filterBarAPI.openValueHelpForFilterField(key, undefined, fnCallback);
    };
    _proto.onBeforeQueryProcessing = function onBeforeQueryProcessing() {
      const uiModel = this.getModel("ui");
      BusyLocker.lock(uiModel);
    };
    _proto.onAfterQueryProcessing = function onAfterQueryProcessing() {
      const uiModel = this.getModel("ui");
      BusyLocker.unlock(uiModel);
    };
    _proto.onClearFilters = async function onClearFilters() {
      // Empty input: clear the filters and refresh the list
      const filterBar = UI5Element.getElementById(this.filterBar);
      const filterBarAPI = filterBar.getParent();
      await filterBarAPI._clearFilterValuesWithOptions(filterBar);
      await filterBarAPI.triggerSearch();
    };
    _proto.onQueryChanged = function onQueryChanged() {
      const filterBar = UI5Element.getElementById(this.filterBar);
      filterBar.fireFiltersChanged({
        conditionsBased: true
      });
    };
    _proto.createContent = function createContent() {
      return _jsx(EasyFilterBarContainer, {
        contextPath: this.getOwnerContextPath(),
        appId: this.getApplicationId(),
        filterBarMetadata: this.filterBarMetadata,
        easyFilterLib: this.easyFilterPath,
        showValueHelp: e => {
          this.showValueHelpForKey(e.getParameter("key"), e.getParameter("values"), selectedConditions => {
            const tokenSelectedValues = selectedConditions.map(condition => {
              if (condition.operator === FilterOperator.BT || condition.operator === FilterOperator.NB) {
                return {
                  operator: condition.operator,
                  selectedValues: condition.values
                };
              } else {
                return {
                  operator: condition.operator,
                  selectedValues: condition.values
                };
              }
            });
            e.getParameter("resolve")(tokenSelectedValues);
          });
        },
        dataFetcher: this.resolveTokenValuesForField.bind(this),
        recommendedValues: this.recommendedQueries,
        queryChanged: this.onQueryChanged.bind(this),
        tokensChanged: this.onTokensChanged.bind(this),
        beforeQueryProcessing: this.onBeforeQueryProcessing.bind(this),
        afterQueryProcessing: this.onAfterQueryProcessing.bind(this),
        clearFilters: this.onClearFilters.bind(this)
      });
    };
    return EasyFilterBar;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_core_controllerextensions_viewState_IViewStateContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "filterBar", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contentSwitcher", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "contentSwitcherKey", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = EasyFilterBar;
  return _exports;
}, false);
//# sourceMappingURL=EasyFilterBar-dbg.js.map
