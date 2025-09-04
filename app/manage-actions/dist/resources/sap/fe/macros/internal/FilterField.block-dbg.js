/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/controls/ListReport/FilterField", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyFormatters", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldHelper", "sap/fe/macros/filter/FilterFieldHelper", "sap/fe/macros/filter/FilterFieldTemplating", "sap/fe/macros/filterBar/ExtendedSemanticDateOperators"], function (Log, BindingToolkit, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter, FilterField, StableIdHelper, DataModelPathHelper, PropertyFormatters, PropertyHelper, UIFormatters, CommonHelper, FieldHelper, FilterFieldHelper, FilterFieldTemplating, ExtendedSemanticDateOperators) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
  var getFilterFieldDisplayFormat = FilterFieldTemplating.getFilterFieldDisplayFormat;
  var isRequiredInFilter = FilterFieldHelper.isRequiredInFilter;
  var getPlaceholder = FilterFieldHelper.getPlaceholder;
  var getDataType = FilterFieldHelper.getDataType;
  var getConditionsBinding = FilterFieldHelper.getConditionsBinding;
  var formatOptions = FilterFieldHelper.formatOptions;
  var constraints = FilterFieldHelper.constraints;
  var getDisplayMode = UIFormatters.getDisplayMode;
  var getAssociatedExternalIdPropertyPath = PropertyHelper.getAssociatedExternalIdPropertyPath;
  var getRelativePropertyPath = PropertyFormatters.getRelativePropertyPath;
  var getTargetObjectPath = DataModelPathHelper.getTargetObjectPath;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var generate = StableIdHelper.generate;
  var getMaxConditions = FilterField.getMaxConditions;
  var xml = BuildingBlockTemplateProcessor.xml;
  var SAP_UI_MODEL_CONTEXT = BuildingBlockTemplateProcessor.SAP_UI_MODEL_CONTEXT;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var formatResult = BindingToolkit.formatResult;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a Filter Field based on the metadata provided by OData V4.
   * <br>
   * It is designed to work based on a property context(property) pointing to an entity type property
   * needed to be used as filterfield and entityType context(contextPath) to consider the relativity of
   * the propertyPath of the property wrt entityType.
   *
   * Usage example:
   * <pre>
   * &lt;macros:FilterField id="MyFilterField" property="CompanyName" /&gt;
   * </pre>
   * @private
   */
  let FilterFieldBlock = (_dec = defineBuildingBlock({
    name: "FilterField",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true
  }), _dec5 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec6 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec7 = blockAttribute({
    type: "boolean",
    isPublic: true
  }), _dec8 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "string",
    isPublic: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    /***********************************************
     *            INTERNAL ATTRIBUTES              *
     **********************************************/

    /**
     * Control Id for MDC filter field used inside.
     */

    /**
     * Property key for filter field.
     */

    /**
     * Source annotation path of the property.
     */

    /**
     * Source annotation path of the property.
     */

    /**
     * Label for filterfield.
     */

    /**
     * Data Type of the filter field.
     */

    /**
     * Maximum conditions that can be added to the filter field.
     */

    /**
     * Value Help id as association for the filter field.
     */

    /**
     * Binding path for conditions added to filter field.
     */

    /**
     * Datatype constraints of the filter field.
     */

    /**
     * Datatype format options of the filter field.
     */

    /**
     * To specify filter field is mandatory for filtering.
     */

    /**
     * Valid operators for the filter field.
     */

    /**
     * Visual Filter id to be used.
     */

    /**
     * Visual Filter building block id to be used.
     */

    /**
     * Visual Filter is expected.
     */

    /**
     * Property used is filterable
     */

    /**
     * Property for placeholder
     */

    /**
     * Property to hold promise for display
     */

    function FilterFieldBlock(props, configuration, settings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, configuration, settings) || this;
      /**
       * Defines the metadata path to the property.
       */
      _initializerDefineProperty(_this, "property", _descriptor, _this);
      /**
       * Metadata path to the entitySet or navigationProperty
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       * Visual filter settings for filter field.
       */
      _initializerDefineProperty(_this, "visualFilter", _descriptor3, _this);
      /**
       * A prefix that is added to the generated ID of the filter field.
       */
      _initializerDefineProperty(_this, "idPrefix", _descriptor4, _this);
      /**
       * A prefix that is added to the generated ID of the value help used for the filter field.
       */
      _initializerDefineProperty(_this, "vhIdPrefix", _descriptor5, _this);
      /**
       * Specifies the Sematic Date Range option for the filter field.
       */
      _initializerDefineProperty(_this, "useSemanticDateRange", _descriptor6, _this);
      /**
       * Settings from the manifest.
       */
      _initializerDefineProperty(_this, "settings", _descriptor7, _this);
      /**
       * Speficies the enablement of the filter field.
       */
      _initializerDefineProperty(_this, "editMode", _descriptor8, _this);
      const propertyConverted = MetaModelConverter.convertMetaModelContext(_this.property);
      const externalIdPropertyPath = getAssociatedExternalIdPropertyPath(propertyConverted);
      if (externalIdPropertyPath) {
        _this.propertyExternalId = _this.property.getModel().createBindingContext(_this.property.getPath().replace(propertyConverted.name, externalIdPropertyPath), _this.property);
      }
      const propertyConvertedExternalId = _this.propertyExternalId ? MetaModelConverter.convertMetaModelContext(_this.propertyExternalId) : undefined;
      const dataModelPath = MetaModelConverter.getInvolvedDataModelObjects(_this.property, _this.contextPath);

      // Property settings
      const propertyName = propertyConverted.name,
        originalPropertyName = propertyConverted.name,
        fixedValues = !!propertyConvertedExternalId?.annotations?.Common?.ValueListWithFixedValues || !!propertyConverted.annotations?.Common?.ValueListWithFixedValues;
      _this.controlId = _this.idPrefix && generate([_this.idPrefix, originalPropertyName]);
      _this.sourcePath = getTargetObjectPath(dataModelPath);
      _this.documentRefText = dataModelPath.targetObject?.annotations.Common?.DocumentationRef?.toString();
      _this.dataType = getDataType(propertyConvertedExternalId || propertyConverted); // data type for LR-FilterBar condition of the value help
      const labelTerm = propertyConverted?.annotations?.Common?.Label;
      const labelExpression = labelTerm?.toString() ?? constant(propertyName);
      _this.label = compileExpression(labelExpression) || propertyName;
      _this.conditionsBinding = getConditionsBinding(dataModelPath) || "";
      _this.placeholder = getPlaceholder(propertyConverted);
      _this.propertyKey = getContextRelativeTargetObjectPath(dataModelPath, false, true) || propertyName;
      // Visual Filter settings
      _this.vfEnabled = !!_this.visualFilter && !(_this.idPrefix && _this.idPrefix.includes("Adaptation"));
      _this.vfId = _this.vfEnabled ? generate([_this.idPrefix, propertyName, "VisualFilter"]) : undefined;
      _this.vfRuntimeId = _this.vfEnabled ? generate([_this.idPrefix, propertyName, "VisualFilterContainer"]) : undefined;

      //-----------------------------------------------------------------------------------------------------//
      // TODO: need to change operations from MetaModel to Converters.
      // This mainly included changing changing getFilterRestrictions operations from metaModel to converters
      const propertyContext = _this.property,
        model = propertyContext.getModel(),
        vhPropertyPath = FieldHelper.valueHelpPropertyForFilterField(propertyContext),
        filterable = CommonHelper.isPropertyFilterable(propertyContext),
        propertyObject = propertyContext.getObject(),
        propertyInterface = {
          context: propertyContext
        };
      _this.display = getFilterFieldDisplayFormat(dataModelPath, propertyConverted, propertyInterface);
      _this.isFilterable = !(filterable === false || filterable === "false");
      _this.maxConditions = getMaxConditions(dataModelPath);
      _this.dataTypeConstraints = constraints(propertyObject, propertyInterface);
      _this.dataTypeFormatOptions = formatOptions(propertyObject, propertyInterface);
      _this.required = isRequiredInFilter(propertyObject, propertyInterface);
      _this.operators = FieldHelper.operators(propertyContext, propertyObject, _this.useSemanticDateRange, _this.settings || "", _this.contextPath.getPath());
      if (_this.operators) {
        // Extended operators are not added by default.
        // We add them to MDC filter environment.
        ExtendedSemanticDateOperators.addExtendedFilterOperators(_this.operators.split(","));
      }
      // Value Help settings
      // TODO: This needs to be updated when VH macro is converted to 2.0
      const vhProperty = model.createBindingContext(vhPropertyPath);
      const vhPropertyObject = vhProperty.getObject(),
        vhPropertyInterface = {
          context: vhProperty
        },
        relativeVhPropertyPath = getRelativePropertyPath(vhPropertyObject, vhPropertyInterface),
        relativePropertyPath = getRelativePropertyPath(propertyObject, propertyInterface);
      _this.valueHelpProperty = FieldHelper.getValueHelpPropertyForFilterField(propertyContext, propertyObject, propertyObject.$Type, _this.vhIdPrefix, dataModelPath.targetEntityType.name, relativePropertyPath, relativeVhPropertyPath, fixedValues, _this.useSemanticDateRange);

      //-----------------------------------------------------------------------------------------------------//
      return _this;
    }
    _exports = FilterFieldBlock;
    _inheritsLoose(FilterFieldBlock, _BuildingBlockTemplat);
    var _proto = FilterFieldBlock.prototype;
    _proto.getVisualFilterContent = function getVisualFilterContent() {
      let visualFilterObject = this.visualFilter,
        vfXML = "";
      if (!this.vfEnabled || !visualFilterObject) {
        return vfXML;
      }
      if (visualFilterObject?.isA?.(SAP_UI_MODEL_CONTEXT)) {
        visualFilterObject = visualFilterObject.getObject();
      }
      const {
        contextPath,
        presentationAnnotation,
        outParameter,
        inParameters,
        valuelistProperty,
        selectionVariantAnnotation,
        multipleSelectionAllowed,
        required,
        requiredProperties = [],
        showOverlayInitially,
        renderLineChart,
        isValueListWithFixedValues
      } = visualFilterObject;
      vfXML = xml`
				<visualFilter:VisualFilter
				    xmlns:visualFilter= "sap.fe.macros.visualfilters"
					id="${this.vfRuntimeId}"
					_contentId="${this.vfId}"
					contextPath="${contextPath}"
					metaPath="${presentationAnnotation}"
					outParameter="${outParameter}"
					inParameters="${CommonHelper.stringifyCustomData(inParameters)}"
					valuelistProperty="${valuelistProperty}"
					selectionVariantAnnotation="${selectionVariantAnnotation}"
					multipleSelectionAllowed="${multipleSelectionAllowed}"
					required="${required}"
					requiredProperties="${CommonHelper.stringifyCustomData(requiredProperties)}"
					showOverlayInitially="${showOverlayInitially}"
					renderLineChart="${renderLineChart}"
					isValueListWithFixedValues="${isValueListWithFixedValues}"
					filterBarEntityType="${contextPath}"
				/>
			`;
      return vfXML;
    };
    _proto.getTemplate = async function getTemplate() {
      let xmlRet = ``;
      if (this.isFilterable) {
        let display;
        const companionTextAvailable = this.documentRefText === undefined || null ? false : true;
        const formattedResult = compileExpression(formatResult([this.documentRefText], "sap.fe.core.formatters.StandardFormatter#asArray"));
        try {
          const dataModelPathExternalId = this.propertyExternalId && MetaModelConverter.getInvolvedDataModelObjects(this.propertyExternalId, this.contextPath);
          display = dataModelPathExternalId ? getDisplayMode(dataModelPathExternalId) : await this.display;
        } catch (err) {
          Log.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${err}`);
        }
        xmlRet = xml`
				<mdc:FilterField
					xmlns:mdc="sap.ui.mdc"
					xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
					xmlns:macro="sap.fe.macros"
					xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:fieldhelp="sap.ui.core.fieldhelp"
					customData:sourcePath="${this.sourcePath}"
					id="${this.controlId}"
					delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate', payload:{isFilterField:true}}"
					propertyKey="${this.propertyKey}"
					label="${this.label}"
					dataType="${this.dataType}"
					display="${display}"
					maxConditions="${this.maxConditions}"
					valueHelp="${this.valueHelpProperty}"
					conditions="${this.conditionsBinding}"
					dataTypeConstraints="${this.dataTypeConstraints}"
					dataTypeFormatOptions="${this.dataTypeFormatOptions}"
					required="${this.required}"
					operators="${this.operators}"
					placeholder="${this.placeholder}"
					${this.attr("editMode", this.editMode)}
				>
					${companionTextAvailable ? xml`
						<mdc:customData>
							<fieldhelp:FieldHelpCustomData
								${this.attr("value", formattedResult)}
							/>
						</mdc:customData>
					` : ""}
					${this.vfEnabled ? this.getVisualFilterContent() : ""}
				</mdc:FilterField>
			`;
      }
      return xmlRet;
    };
    return FilterFieldBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "property", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "visualFilter", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FilterField";
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "vhIdPrefix", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "FilterFieldValueHelp";
    }
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "useSemanticDateRange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "settings", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "";
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "editMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = FilterFieldBlock;
  return _exports;
}, false);
//# sourceMappingURL=FilterField.block-dbg.js.map
