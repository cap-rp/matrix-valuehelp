/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/CriticalityFormatters", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/SemanticObjectHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/helpers/DataPointTemplating", "sap/fe/macros/quickView/QuickView", "sap/m/ObjectNumber", "sap/m/ObjectStatus", "sap/m/ProgressIndicator", "sap/m/RatingIndicator", "../field/FieldRuntimeHelper", "./DataPointFormatOptions", "sap/fe/base/jsx-runtime/jsx"], function (Log, BindingToolkit, ClassSupport, BuildingBlock, StableIdHelper, TypeGuards, CriticalityFormatters, DataModelPathHelper, PropertyHelper, SemanticObjectHelper, UIFormatters, FieldTemplating, DataPointTemplating, QuickView, ObjectNumber, ObjectStatus, ProgressIndicator, RatingIndicator, FieldRuntimeHelper, DataPointFormatOptions, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var getValueFormatted = DataPointTemplating.getValueFormatted;
  var buildFieldBindingExpression = DataPointTemplating.buildFieldBindingExpression;
  var buildExpressionForProgressIndicatorPercentValue = DataPointTemplating.buildExpressionForProgressIndicatorPercentValue;
  var buildExpressionForProgressIndicatorDisplayValue = DataPointTemplating.buildExpressionForProgressIndicatorDisplayValue;
  var isUsedInNavigationWithQuickViewFacets = FieldTemplating.isUsedInNavigationWithQuickViewFacets;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getPropertyWithSemanticObject = SemanticObjectHelper.getPropertyWithSemanticObject;
  var hasUnit = PropertyHelper.hasUnit;
  var hasCurrency = PropertyHelper.hasCurrency;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var enhanceDataModelPath = DataModelPathHelper.enhanceDataModelPath;
  var buildExpressionForCriticalityIcon = CriticalityFormatters.buildExpressionForCriticalityIcon;
  var buildExpressionForCriticalityColor = CriticalityFormatters.buildExpressionForCriticalityColor;
  var isProperty = TypeGuards.isProperty;
  var generate = StableIdHelper.generate;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var association = ClassSupport.association;
  var aggregation = ClassSupport.aggregation;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let DataPoint = (_dec = defineUI5Class("sap.fe.macros.internal.DataPoint"), _dec2 = association({
    type: "string"
  }), _dec3 = property({
    type: "string",
    required: true
  }), _dec4 = property({
    type: "string"
  }), _dec5 = aggregation({
    type: "sap.fe.macros.internal.DataPointFormatOptions",
    multiple: false,
    defaultClass: DataPointFormatOptions
  }), _dec6 = property({
    type: "string",
    isBindingInfo: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function DataPoint(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * Prefix added to the generated ID of the field
       */
      _initializerDefineProperty(_this, "idPrefix", _descriptor, _this);
      /**
       * Metadata path to the dataPoint.
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "contextPath", _descriptor3, _this);
      _initializerDefineProperty(_this, "formatOptions", _descriptor4, _this);
      /**
       * Property to set an external value that comes from a different model than the oData model
       */
      _initializerDefineProperty(_this, "value", _descriptor5, _this);
      /**
       * Property to set property if the property has a Quickview
       */
      _this.hasQuickView = false;
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = DataPoint;
    _inheritsLoose(DataPoint, _BuildingBlock);
    var _proto = DataPoint.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.getTemplatingObjects();
      this.content = this.createContent();
    }

    /**
     * Function to get the templating objects.
     */;
    _proto.getTemplatingObjects = function getTemplatingObjects() {
      const internalDataModelPath = this.getDataModelObjectForMetaPath(this.metaPath, this.contextPath);
      if (!internalDataModelPath) {
        return;
      }
      let internalValueDataModelPath;
      this.visible = getVisibleExpression(internalDataModelPath);
      if (internalDataModelPath?.targetObject?.Value?.path) {
        internalValueDataModelPath = enhanceDataModelPath(internalDataModelPath, internalDataModelPath.targetObject.Value.path);
      }
      this.dataModelPath = internalDataModelPath;
      this.valueDataModelPath = internalValueDataModelPath;
    }

    /**
     * Function that calculates the visualization type for this DataPoint.
     * @param dataModelPath
     */;
    _proto.getDataPointVisualization = function getDataPointVisualization(dataModelPath) {
      if (dataModelPath.targetObject?.Visualization === "UI.VisualizationType/Rating") {
        this.visualization = "Rating";
        return;
      }
      if (dataModelPath.targetObject?.Visualization === "UI.VisualizationType/Progress") {
        this.visualization = "Progress";
        return;
      }
      const valueProperty = this.valueDataModelPath && this.valueDataModelPath.targetObject;
      //check whether the visualization type should be an object number in case one of the if conditions met
      this.hasQuickView = (valueProperty && isUsedInNavigationWithQuickViewFacets(dataModelPath, valueProperty)) ?? false;
      if (this.valueDataModelPath && getPropertyWithSemanticObject(this.valueDataModelPath)) {
        this.hasQuickView = true;
      }
      if (this.hasQuickView !== true) {
        if (isProperty(valueProperty) && (hasUnit(valueProperty) || hasCurrency(valueProperty))) {
          // we only show an objectNumber if there is no quickview and a unit or a currency
          this.visualization = "ObjectNumber";
          return;
        }
      }

      //default case to handle this as objectStatus type
      this.visualization = "ObjectStatus";
    }

    /**
     * Gets the current enablement state of the dataPoint.
     * @returns Boolean value with the enablement state
     */;
    _proto.getEnabled = function getEnabled() {
      if (this.content?.isA("sap.m.ObjectStatus")) {
        return this.content.getActive();
      } else {
        return true;
      }
    }

    /**
     * Sets the current enablement state of the datapoint.
     * @param enabled
     * @returns The current datapoint reference
     */;
    _proto.setEnabled = function setEnabled(enabled) {
      if (this.content?.isA("sap.m.ObjectStatus")) {
        this.content.setProperty("active", enabled);
      } else {
        throw "setEnabled isn't implemented for this field type";
      }
      return this;
    }

    /**
     * Creates a RatingIndicator control.
     * @param dataModelPath
     * @returns RatingIndicator
     */;
    _proto.createRatingIndicator = function createRatingIndicator(dataModelPath) {
      const dataPointTarget = dataModelPath.targetObject;
      const targetValue = this.getTargetValueBinding(dataModelPath);
      const dataPointValue = dataPointTarget?.Value || "";
      const propertyType = dataPointValue?.$target?.type;
      let numberOfFractionalDigits;
      if (propertyType === "Edm.Decimal" && dataPointTarget?.ValueFormat) {
        if (dataPointTarget.ValueFormat.NumberOfFractionalDigits) {
          numberOfFractionalDigits = dataPointTarget.ValueFormat.NumberOfFractionalDigits;
        }
      }
      const value = getValueFormatted(this.valueDataModelPath, dataPointValue, propertyType, numberOfFractionalDigits);
      return _jsx(RatingIndicator, {
        id: this.idPrefix ? generate([this.idPrefix, "RatingIndicator-Field-display"]) : undefined,
        maxValue: targetValue,
        value: this.value ?? compileExpression(value),
        tooltip: this.getTooltipValue(dataModelPath),
        iconSize: this.formatOptions?.iconSize,
        class: this.formatOptions?.showLabels ?? false ? "sapUiTinyMarginTopBottom" : undefined,
        editable: "false",
        ariaLabelledBy: this.ariaLabelledBy
      });
    }

    /**
     * Creates a ProgressIndicator control.
     * @param dataModelPath
     * @returns ProgressIndicator
     */;
    _proto.createProgressIndicator = function createProgressIndicator(dataModelPath) {
      const criticalityColorExpression = dataModelPath.targetObject ? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath) : undefined;
      const displayValue = buildExpressionForProgressIndicatorDisplayValue(dataModelPath);
      const percentValue = buildExpressionForProgressIndicatorPercentValue(dataModelPath);
      return _jsx(ProgressIndicator, {
        id: this.idPrefix ? generate([this.idPrefix, "ProgressIndicator-Field-display"]) : undefined,
        displayValue: displayValue,
        percentValue: percentValue,
        state: criticalityColorExpression,
        tooltip: this.getTooltipValue(dataModelPath),
        ariaLabelledBy: this.ariaLabelledBy
      });
    }

    /**
     * Creates an ObjectNumber control.
     * @param dataModelPath
     * @returns ObjectNumber
     */;
    _proto.createObjectNumber = function createObjectNumber(dataModelPath) {
      const criticalityColorExpression = dataModelPath.targetObject ? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath) : undefined;
      const emptyIndicatorMode = this.formatOptions?.showEmptyIndicator ?? false ? "On" : undefined;
      const objectStatusNumber = buildFieldBindingExpression(dataModelPath, this.formatOptions, true);
      const limitShowDecimals = this.getManifestWrapper()?.getSapFeManifestConfiguration()?.app?.showOnlyUnitDecimals === true;
      const unit = this.formatOptions?.measureDisplayMode === "Hidden" ? undefined : compileExpression(UIFormatters.getBindingForUnitOrCurrency(this.valueDataModelPath, true, limitShowDecimals));
      return _jsx(ObjectNumber, {
        id: this.idPrefix ? generate([this.idPrefix, "ObjectNumber-Field-display"]) : undefined,
        state: criticalityColorExpression,
        number: this.value ?? objectStatusNumber,
        unit: unit,
        visible: this.visible,
        emphasized: "false",
        class: this.formatOptions?.dataPointStyle === "large" ? "sapMObjectNumberLarge" : undefined,
        tooltip: this.getTooltipValue(dataModelPath),
        emptyIndicatorMode: emptyIndicatorMode
      });
    }

    /**
     * Returns the dependent.
     * @returns Dependent either with the QuickView or an empty string.
     */;
    _proto.createDependents = function createDependents() {
      if (this.hasQuickView) {
        return new QuickView(this.valueDataModelPath, this.metaPath, this.contextPath ?? "").createContent();
      }
      return undefined;
    }

    /**
     * Creates an ObjectStatus control.
     * @param dataModelPath
     * @returns ObjectStatus
     */;
    _proto.createObjectStatus = function createObjectStatus(dataModelPath) {
      let criticalityColorExpression = dataModelPath.targetObject ? buildExpressionForCriticalityColor(dataModelPath.targetObject, dataModelPath) : undefined;
      if (criticalityColorExpression === "None" && this.valueDataModelPath) {
        criticalityColorExpression = this.hasQuickView ? "Information" : "None";
      }
      const emptyIndicatorMode = this.formatOptions?.showEmptyIndicator ?? false ? "On" : undefined;
      const objectStatusText = buildFieldBindingExpression(dataModelPath, this.formatOptions, false);
      const iconExpression = this.formatOptions?.dataPointStyle === "large" || !dataModelPath.targetObject ? undefined : buildExpressionForCriticalityIcon(dataModelPath.targetObject, dataModelPath);
      return _jsx(ObjectStatus, {
        id: this.idPrefix ? generate([this.idPrefix, "ObjectStatus-Field-display"]) : undefined,
        class: this.formatOptions?.dataPointStyle === "large" ? "sapMObjectStatusLarge sapMObjectStatusLongText" : undefined,
        icon: iconExpression,
        tooltip: this.getTooltipValue(dataModelPath),
        state: criticalityColorExpression,
        text: this.value ?? objectStatusText,
        emptyIndicatorMode: emptyIndicatorMode,
        active: this.hasQuickView,
        press: FieldRuntimeHelper.pressLink,
        ariaLabelledBy: this.ariaLabelledBy,
        children: {
          dependents: this.createDependents()
        }
      });
    }

    /**
     * The helper method to get a possible tooltip text.
     * @param dataModelPath
     * @returns BindingToolkitExpression
     */;
    _proto.getTooltipValue = function getTooltipValue(dataModelPath) {
      return dataModelPath.targetObject?.annotations?.Common?.QuickInfo ? getExpressionFromAnnotation(dataModelPath.targetObject?.annotations?.Common?.QuickInfo, getRelativePaths(dataModelPath)) : undefined;
    }

    /**
     * The helper method to get a possible target value binding.
     * @param dataModelPath
     * @returns BindingToolkitExpression
     */;
    _proto.getTargetValueBinding = function getTargetValueBinding(dataModelPath) {
      return dataModelPath.targetObject?.TargetValue ? getExpressionFromAnnotation(dataModelPath.targetObject?.TargetValue, getRelativePaths(dataModelPath)) : undefined;
    };
    _proto.createContent = function createContent() {
      if (!this.dataModelPath) {
        return undefined;
      }
      this.getDataPointVisualization(this.dataModelPath);
      switch (this.visualization) {
        case "Rating":
          {
            return this.createRatingIndicator(this.dataModelPath);
          }
        case "Progress":
          {
            return this.createProgressIndicator(this.dataModelPath);
          }
        case "ObjectNumber":
          {
            return this.createObjectNumber(this.dataModelPath);
          }
        default:
          {
            return this.createObjectStatus(this.dataModelPath);
          }
      }
    }

    /**
     * Retrieves the current value of the datapoint.
     * @returns The current value of the datapoint
     */;
    _proto.getValue = function getValue() {
      if (this.content?.isA("sap.m.ObjectStatus")) {
        return this.content.getText();
      } else if (this.content?.isA("sap.m.ObjectNumber")) {
        return this.content.getNumber();
      } else if (this.content?.isA("sap.m.ProgressIndicator")) {
        return this.content.getDisplayValue();
      } else if (this.content?.isA("sap.m.RatingIndicator")) {
        return this.content.getValue().toString();
      } else {
        this.getProperty("value");
      }
    }

    /**
     * Sets the current value of the field.
     * @param value
     * @returns The current field reference
     */;
    _proto.setValue = function setValue(value) {
      this.setProperty("value", value);
      if (this.content?.isA("sap.m.ObjectStatus")) {
        this.content.setText(value);
      } else if (this.content?.isA("sap.m.ObjectNumber")) {
        this.content.setNumber(value);
      } else if (this.content?.isA("sap.m.ProgressIndicator")) {
        Log.error("setValue isn't implemented for this field type yet");
      } else if (this.content?.isA("sap.m.RatingIndicator")) {
        this.content.setValue(value);
      }
      return this;
    };
    return DataPoint;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "idPrefix", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formatOptions", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = DataPoint;
  return _exports;
}, false);
//# sourceMappingURL=DataPoint-dbg.js.map
