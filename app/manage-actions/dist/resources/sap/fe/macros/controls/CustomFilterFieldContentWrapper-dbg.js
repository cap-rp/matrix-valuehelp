/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/util/merge", "sap/fe/base/ClassSupport", "sap/fe/macros/filterBar/SemanticDateOperators", "sap/ui/base/ManagedObjectObserver", "sap/ui/core/Control", "sap/ui/mdc/condition/Condition", "sap/ui/mdc/enums/ConditionValidated", "sap/ui/mdc/field/ConditionsType", "sap/ui/model/json/JSONModel"], function (merge, ClassSupport, SemanticDateOperators, ManagedObjectObserver, Control, Condition, ConditionValidated, ConditionsType, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _CustomFilterFieldContentWrapper;
  var _exports = {};
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Type used for format options
   * @typedef FormatOptionsType
   */
  /**
   * Creates an <code>sap.fe.macros.controls.CustomFilterFieldContentWrapper</code> object.
   * This is used in the {@link sap.ui.mdc.FilterField FilterField} as a filter content.
   * @private
   * @alias sap.fe.core.macros.CustomFilterFieldContentWrapper
   */
  let CustomFilterFieldContentWrapper = (_dec = defineUI5Class("sap.fe.macros.controls.CustomFilterFieldContentWrapper"), _dec2 = implementInterface("sap.ui.core.IFormContent"), _dec3 = property({
    type: "sap.ui.core.CSSSize",
    defaultValue: null
  }), _dec4 = property({
    type: "boolean",
    defaultValue: false
  }), _dec5 = property({
    type: "object[]",
    defaultValue: []
  }), _dec6 = aggregation({
    type: "sap.ui.core.Control",
    multiple: false,
    isDefault: true
  }), _dec7 = event(), _dec8 = event(), _dec9 = event(), _dec(_class = (_class2 = (_CustomFilterFieldContentWrapper = /*#__PURE__*/function (_Control) {
    function CustomFilterFieldContentWrapper(idOrProps, settings) {
      var _this;
      _this = _Control.call(this, idOrProps, settings) || this;
      _initializerDefineProperty(_this, "__implements__sap_ui_core_IFormContent", _descriptor, _this);
      _initializerDefineProperty(_this, "width", _descriptor2, _this);
      _initializerDefineProperty(_this, "formDoNotAdjustWidth", _descriptor3, _this);
      _initializerDefineProperty(_this, "conditions", _descriptor4, _this);
      _initializerDefineProperty(_this, "content", _descriptor5, _this);
      _initializerDefineProperty(_this, "conditionsChange", _descriptor6, _this);
      _initializerDefineProperty(_this, "change", _descriptor7, _this);
      _initializerDefineProperty(_this, "liveChange", _descriptor8, _this);
      return _this;
    }
    // Note: FieldBase might be used as base control (instead of Control) in a later version;
    // in that case, you should add a 'change' event and bubble it to the corresponding handlers
    _exports = CustomFilterFieldContentWrapper;
    _inheritsLoose(CustomFilterFieldContentWrapper, _Control);
    CustomFilterFieldContentWrapper.render = function render(renderManager, control) {
      renderManager.openStart("div", control);
      renderManager.style("min-height", "1rem");
      renderManager.style("width", control.width);
      renderManager.openEnd();
      renderManager.renderControl(control.getContent()); // render the child Control
      renderManager.close("div"); // end of the complete Control
    }

    /**
     * Maps an array of filter values to an array of conditions.
     * @param filterValues Array of filter value bindings or a filter value string
     * @param [operator] The operator to be used (optional) - if not set, the default operator (EQ) will be used
     * @private
     * @returns Array of filter conditions
     */;
    CustomFilterFieldContentWrapper._filterValuesToConditions = function _filterValuesToConditions(filterValues, operator) {
      let formatOptions = {
          operators: []
        },
        conditions = [];
      if (operator) {
        formatOptions = {
          operators: [operator]
        };
      }
      if (filterValues === "") {
        filterValues = [];
      } else if (filterValues && typeof filterValues === "object" && filterValues.hasOwnProperty("operator") && filterValues.hasOwnProperty("values")) {
        formatOptions = {
          operators: [filterValues.operator]
        };
        filterValues = filterValues.values;
      } else if (filterValues !== undefined && typeof filterValues !== "object" && typeof filterValues !== "string") {
        throw new Error(`FilterUtils.js#_filterValuesToConditions: Unexpected type of input parameter vValues: ${typeof filterValues}`);
      }
      const conditionsType = new ConditionsType(formatOptions);
      const conditionValues = Array.isArray(filterValues) ? filterValues : [filterValues];

      // Shortcut for operator without values and semantic date operations
      if (typeof operator === "string" && SemanticDateOperators.getSemanticDateOperations().includes(operator)) {
        conditions = [Condition.createCondition(operator, conditionValues, null, null, ConditionValidated.NotValidated)];
      } else {
        conditions = conditionValues.map(conditionValue => {
          const stringValue = conditionValue?.toString(),
            parsedConditions = conditionsType.parseValue(stringValue, "any");
          return parsedConditions?.[0];
        }).filter(conditionValue => conditionValue !== undefined);
      }
      return conditions;
    }

    /**
     * Maps an array of conditions to a comma separated list of filter values.
     * @param conditions Array of filter conditions
     * @param formatOptions Format options that specifies a condition type
     * @private
     * @returns Concatenated string of filter values
     */;
    CustomFilterFieldContentWrapper._conditionsToFilterModelString = function _conditionsToFilterModelString(conditions, formatOptions) {
      const conditionsType = new ConditionsType(formatOptions);
      return conditions.map(condition => {
        return conditionsType.formatValue([condition], "any") || "";
      }).filter(stringValue => {
        return stringValue !== "";
      }).join(",");
    }

    /**
     * Listens to filter model changes and updates wrapper property "conditions".
     * @param changeEvent Event triggered by a filter model change
     * @private
     */;
    var _proto = CustomFilterFieldContentWrapper.prototype;
    _proto._handleFilterModelChange = function _handleFilterModelChange(changeEvent) {
      const propertyPath = this.getObjectBinding("filterValues").getPath(),
        values = changeEvent.getSource().getProperty(propertyPath);
      this.updateConditionsByFilterValues(values);
    }

    /**
     * Listens to "conditions" changes and updates the filter model.
     * @param conditions Event triggered by a "conditions" change
     * @private
     */;
    _proto._handleConditionsChange = function _handleConditionsChange(conditions) {
      this.updateFilterModelByConditions(conditions);
    }

    /**
     * Initialize CustomFilterFieldContentWrapper control and register observer.
     */;
    _proto.init = function init() {
      _Control.prototype.init.call(this);
      this._wrapperObserver = new ManagedObjectObserver(this._observeChanges.bind(this));
      this._wrapperObserver.observe(this, {
        properties: ["conditions"],
        aggregations: ["content"]
      });
      this._filterModel = new JSONModel();
      this._filterModel.attachPropertyChange(this._handleFilterModelChange, this);
      this.setModel(this._filterModel, CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS);
    }

    /**
     * Overrides {@link sap.ui.core.Control#clone Control.clone} to clone additional
     * internal states.
     * @param [sIdSuffix] A suffix to be appended to the cloned control id
     * @param [aLocalIds] An array of local IDs within the cloned hierarchy (internally used)
     * @returns Reference to the newly created clone
     * @protected
     */;
    _proto.clone = function clone(sIdSuffix, aLocalIds) {
      const clone = _Control.prototype.clone.call(this, sIdSuffix, aLocalIds);
      // During cloning, the old model will be copied and overwrites any new model (same alias) that
      // you introduce during init(); hence you need to overwrite it again by the new one that you've
      // created during init() (i.e. clone._filterModel); that standard behaviour of super.clone()
      // can't even be suppressed in an own constructor; for a detailed investigation of the cloning,
      // please overwrite the setModel() method and check the list of callers and steps induced by them.
      clone.setModel(clone._filterModel, CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS);
      return clone;
    }

    /**
     * Listens to property changes.
     * @param changes Property changes
     * @param changes.name
     * @param changes.current
     * @private
     */;
    _proto._observeChanges = function _observeChanges(changes) {
      const {
        name,
        current,
        child,
        mutation
      } = changes;
      if (name === "conditions") {
        this._handleConditionsChange(current);
      }
      if (name === "content" && child) {
        this._handleContentChanged.call(this, mutation, child);
      }
    }

    /**
     * Handle wrapper content change.
     * @param mutation Change type
     * @param content New content
     * @private
     */;
    _proto._handleContentChanged = function _handleContentChanged(mutation, content) {
      if (mutation === "insert") {
        this._attachContentHandlers.call(this, content);
      }
    }

    /**
     * Attach content handlers to content.
     * @param content Content
     * @private
     */;
    _proto._attachContentHandlers = function _attachContentHandlers(content) {
      if (content.getMetadata().getAllEvents().change) {
        // content has change event -> attach handler
        content.attachEvent("change", this._handleContentEvent.bind(this, "change"), this);
      }
      if (content.getMetadata().getAllEvents().liveChange) {
        // content has liveChange event -> attach handler
        content.attachEvent("liveChange", this._handleContentEvent.bind(this, "liveChange"), this);
      }
    }

    /**
     * Fire content event.
     * @param eventId Event name
     * @param eventInstance UI5 event object
     * @private
     */;
    _proto._handleContentEvent = function _handleContentEvent(eventId, eventInstance) {
      const parameters = merge({}, eventInstance.getParameters());
      this.fireEvent(eventId, parameters);
    }

    /**
     * Gets the content of this wrapper control.
     * @returns The wrapper content
     * @private
     */;
    _proto.getContent = function getContent() {
      return this.getAggregation("content");
    }

    /**
     * Gets the value for control property 'conditions'.
     * @returns Array of filter conditions
     * @private
     */;
    _proto.getConditions = function getConditions() {
      return this.getProperty("conditions");
    }

    /**
     * Sets the value for control property 'conditions'.
     * @param [conditions] Array of filter conditions
     * @returns Reference to this wrapper
     * @private
     */;
    _proto.setConditions = function setConditions(conditions) {
      this.setProperty("conditions", conditions || []);
      return this;
    }

    /**
     * Gets the filter model alias 'filterValues'.
     * @returns The filter model
     * @private
     */;
    _proto.getFilterModelAlias = function getFilterModelAlias() {
      return CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS;
    }

    /**
     * Updates the property "conditions" with filter values
     * sent by ExtensionAPI#setFilterValues().
     * @param values The filter values
     * @param [operator] The operator name
     * @private
     */;
    _proto.updateConditionsByFilterValues = function updateConditionsByFilterValues(values, operator) {
      const conditions = CustomFilterFieldContentWrapper._filterValuesToConditions(values, operator);
      this.setConditions(conditions);
    }

    /**
     * Updates filter model with conditions
     * sent by the {@link sap.ui.mdc.FilterField FilterField}.
     * @param conditions Array of filter conditions
     * @private
     */;
    _proto.updateFilterModelByConditions = function updateFilterModelByConditions(conditions) {
      const operator = conditions[0]?.operator || "";
      const formatOptions = operator !== "" ? {
        operators: [operator]
      } : {
        operators: []
      };
      if (this.getBindingContext(CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS)) {
        const stringValue = CustomFilterFieldContentWrapper._conditionsToFilterModelString(conditions, formatOptions);
        this._filterModel.setProperty(this.getBindingContext(CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS).getPath(), stringValue);
      }
    };
    _proto.getAccessibilityInfo = function getAccessibilityInfo() {
      const content = this.getContent();
      return content?.getAccessibilityInfo?.() || {};
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      const content = this.getContent();
      return content?.getIdForLabel();
    };
    return CustomFilterFieldContentWrapper;
  }(Control), _CustomFilterFieldContentWrapper.FILTER_MODEL_ALIAS = "filterValues", _CustomFilterFieldContentWrapper), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_ui_core_IFormContent", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "width", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "formDoNotAdjustWidth", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "conditions", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "content", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "conditionsChange", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "change", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "liveChange", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CustomFilterFieldContentWrapper;
  return _exports;
}, false);
//# sourceMappingURL=CustomFilterFieldContentWrapper-dbg.js.map
