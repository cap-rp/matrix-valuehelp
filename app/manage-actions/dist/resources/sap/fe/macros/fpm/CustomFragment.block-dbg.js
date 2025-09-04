/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase"], function (BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Content of a custom fragment
   * @private
   * @experimental
   */
  let CustomFragmentBlock = (_dec = defineBuildingBlock({
    name: "CustomFragment",
    namespace: "sap.fe.macros.fpm"
  }), _dec2 = blockAttribute({
    type: "string",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: false
  }), _dec4 = blockAttribute({
    type: "string",
    required: true
  }), _dec5 = blockAggregation({
    type: "sap.ui.core.CustomData",
    slot: "childCustomData"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function CustomFragmentBlock(props, configuration, settings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, configuration, settings) || this;
      /**
       * ID of the custom fragment
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Context Path
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       *  Name of the custom fragment
       */
      _initializerDefineProperty(_this, "fragmentName", _descriptor3, _this);
      _initializerDefineProperty(_this, "childCustomData", _descriptor4, _this);
      return _this;
    }

    /**
     * The building block template function.
     * @returns An XML-based string
     */
    _exports = CustomFragmentBlock;
    _inheritsLoose(CustomFragmentBlock, _BuildingBlockTemplat);
    var _proto = CustomFragmentBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      const fragmentInstanceName = this.fragmentName + "-JS".replace(/\//g, ".");
      const customData = this.childCustomData;
      const customDataObj = {};
      let child = customData?.firstElementChild;
      while (child) {
        const name = child.getAttribute("key");
        if (name !== null) {
          customDataObj[name] = child.getAttribute("value");
        }
        child = child.nextElementSibling;
      }
      return xml`<macros:CustomFragmentFragment
			xmlns:compo="http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1"
			xmlns:macros="sap.fe.macros.fpm"
			fragmentName="${fragmentInstanceName}"
			${this.attr("childCustomData", Object.keys(customDataObj).length ? JSON.stringify(customDataObj) : undefined)}
			id="${this.id}"
			type="CUSTOM"
			contextPath="${this.contextPath?.getPath()}"
		>
			<compo:fragmentContent>
				<core:FragmentDefinition>
					<core:Fragment fragmentName="${this.fragmentName}" type="XML"/>
				</core:FragmentDefinition>
			</compo:fragmentContent>
		</macros:CustomFragmentFragment>`;
    };
    return CustomFragmentBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "fragmentName", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "childCustomData", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CustomFragmentBlock;
  return _exports;
}, false);
//# sourceMappingURL=CustomFragment.block-dbg.js.map
