/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/formatters/StandardFormatter", "sap/fe/macros/situations/SituationsPopover", "sap/m/Button", "sap/m/library", "sap/fe/base/jsx-runtime/jsx"], function (Log, BindingToolkit, ClassSupport, BuildingBlock, standardFormatter, SituationsPopover, Button, library, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var _exports = {};
  var ButtonType = library.ButtonType;
  var showPopover = SituationsPopover.showPopover;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var pathInModel = BindingToolkit.pathInModel;
  var ifElse = BindingToolkit.ifElse;
  var greaterThan = BindingToolkit.greaterThan;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let SituationsIndicator = (_dec = defineUI5Class("sap.fe.macros.situations.SituationsIndicator"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string",
    required: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function SituationsIndicator(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      _initializerDefineProperty(_this, "propertyPath", _descriptor2, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = SituationsIndicator;
    _inheritsLoose(SituationsIndicator, _BuildingBlock);
    var _proto = SituationsIndicator.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.content = this.createContent();
    }

    /**
     * Get path to the SAP Situations for the entity type that is situation-enabled.
     * @param context Context
     * @returns The situations navigation property
     */;
    SituationsIndicator.getSituationsNavigationProperty = function getSituationsNavigationProperty(context) {
      let navigationProperties;
      switch (context._type) {
        case "NavigationProperty":
          navigationProperties = context.targetType.navigationProperties;
          break;
        case "EntityType":
          navigationProperties = context.navigationProperties;
          break;
        default:
          navigationProperties = context.entityType.navigationProperties;
      }
      const situationsNavProps = navigationProperties.filter(navigationProperty => !navigationProperty.isCollection && navigationProperty.targetType.annotations.Common?.SAPObjectNodeType?.Name === "BusinessSituation");
      const situationsNavProp = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;

      // only one navigation property may lead to an entity tagged as "BusinessSituation"
      if (situationsNavProps.length > 1) {
        const navPropNames = situationsNavProps.map(prop => `'${prop.name}'`).join(", ");
        let name;
        switch (context._type) {
          case "NavigationProperty":
            name = context.targetType.name;
            break;
          case "EntityType":
            name = context.name;
            break;
          default:
            name = context.entityType.name;
        }
        Log.error(`Entity type '${name}' has multiple paths to SAP Situations (${navPropNames}). Using '${situationsNavProp?.name}'.
Hint: Make sure there is at most one navigation property whose target entity type is annotated with
<Annotation Term="com.sap.vocabularies.Common.v1.SAPObjectNodeType">
  <Record>
    <PropertyValue Property="Name" String="BusinessSituation" />
  </Record>
</Annotation>.`);
      }
      return situationsNavProp;
    }

    /**
     * Handler for the press event to open popover with the situations.
     * @param event Button press event
     * @param name Situation navigation property name
     */;
    _proto.onPress = function onPress(event, name) {
      const pageController = this.getPageController();
      if (pageController) {
        showPopover(pageController, event, name);
      }
    }

    /**
     * Creates the content.
     * @returns The content of the building block.
     */;
    _proto.createContent = function createContent() {
      const targetEntityType = this.getDataModelObjectForMetaPath(this.contextPath)?.targetEntityType;
      if (!targetEntityType) {
        // We weren't able to find the targetEntityType object, unlikely but could happen
        return;
      }
      const situationsNavProp = SituationsIndicator.getSituationsNavigationProperty(targetEntityType);
      if (!situationsNavProp) {
        // No path to SAP Situations. That is, the entity type is not situation-enabled. Ignore this fragment.
        return undefined;
      }
      const numberOfSituations = pathInModel(`${situationsNavProp.name}/SitnNumberOfInstances`);

      // Indicator visibility
      let visible;
      if (!this.propertyPath) {
        // no propertyPath --> visibility depends on the number of situations only
        visible = greaterThan(numberOfSituations, 0);
      } else {
        // propertyPath --> visibility depends on the number of situations and on the semantic key used for showing indicators
        visible = and(greaterThan(numberOfSituations, 0), equal(pathInModel("semanticKeyHasDraftIndicator", "internal"), this.propertyPath));
      }

      // Button text: the number of situations if there are multiple, the empty string otherwise
      const text = ifElse(greaterThan(numberOfSituations, 1), numberOfSituations, "");

      // Button tooltip: "There is one situation" / "There are <n> situations"
      const tooltip = formatResult([this.getTranslatedText("situationsTooltipSingular"), this.getTranslatedText("situationsTooltipPlural"), numberOfSituations], standardFormatter.formatPluralMessageConditionally);
      return _jsx(Button, {
        type: ButtonType.Attention,
        icon: "sap-icon://alert",
        text: text,
        tooltip: compileExpression(tooltip),
        visible: visible,
        press: oEvent => this.onPress(oEvent, situationsNavProp.name)
      });
    };
    return SituationsIndicator;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "propertyPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = SituationsIndicator;
  return _exports;
}, false);
//# sourceMappingURL=SituationsIndicator-dbg.js.map
