/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/helpers/StableIdHelper", "sap/m/IconTabBar", "sap/m/IconTabFilter", "sap/m/MessageStrip", "../../controls/MultipleModeControl", "sap/fe/base/jsx-runtime/jsx"], function (BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, StableIdHelper, IconTabBar, IconTabFilter, MessageStrip, MultipleModeControl, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var generate = StableIdHelper.generate;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let MultipleModeBlock = (_dec = defineBuildingBlock({
    name: "MultipleMode",
    namespace: "sap.fe.templates.ListReport.view.fragments",
    isOpen: true
  }), _dec2 = blockAttribute({
    type: "object"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function MultipleModeBlock(props) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props) || this;
      _initializerDefineProperty(_this, "converterContext", _descriptor, _this);
      return _this;
    }
    _exports = MultipleModeBlock;
    _inheritsLoose(MultipleModeBlock, _BuildingBlockTemplat);
    var _proto = MultipleModeBlock.prototype;
    _proto.getInnerControlsAPI = function getInnerControlsAPI() {
      return this.converterContext?.views.reduce((innerControls, view) => {
        const innerControlId = view.tableControlId || view.chartControlId;
        if (innerControlId) {
          innerControls.push(`${innerControlId}::${view.tableControlId ? "Table" : "Chart"}`);
        }
        return innerControls;
      }, []).join(",") || "";
    };
    _proto.getItems = function getItems() {
      return this.converterContext.views.map((view, viewIdx) => {
        return xml`<template:with path="converterContext>views/${viewIdx}/" var="view"
						template:require="{
							ID: 'sap/fe/core/helpers/StableIdHelper'
						}"
						xmlns:core="sap.ui.core"
						xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1">
				<template:with path="view>presentation" var="presentationContext">
				${_jsx(IconTabFilter, {
          text: view.title,
          visible: view.visible,
          children: view.viewType === "Custom" ? xml`<core:Fragment fragmentName="sap.fe.templates.ListReport.view.fragments.CustomView" type="XML" />` : xml`
							 ${_jsx(MessageStrip, {
            text: "{tabsInternal>/" + (view.tableControlId || view.chartControlId) + "/notApplicable/title}",
            type: "Information",
            showIcon: "true",
            showCloseButton: "true",
            class: "sapUiTinyMargin",
            visible: "{= (${tabsInternal>/" + (view.tableControlId || view.chartControlId) + "/notApplicable/fields} || []).length>0 }"
          })}
							<core:Fragment fragmentName="sap.fe.templates.ListReport.view.fragments.CollectionVisualization" type="XML" />
							`
        }, generate([view.tableControlId || view.customTabId || view.chartControlId]))}
			</template:with></template:with>`;
      }).join("");
    };
    _proto.getTemplate = function getTemplate() {
      return _jsx(MultipleModeControl, {
        id: generate([this.converterContext.multiViewsControl?.id, "Control"]),
        innerControls: this.getInnerControlsAPI(),
        filterControl: this.converterContext.filterBarId,
        showCounts: this.converterContext.multiViewsControl?.showTabCounts,
        freezeContent: !!this.converterContext.filterBarId,
        children: _jsx(IconTabBar, {
          "core:require": "{ MULTICONTROL: 'sap/fe/templates/ListReport/controls/MultipleModeControl' }",
          expandable: "false",
          headerMode: "Inline",
          id: this.converterContext.multiViewsControl?.id,
          stretchContentHeight: "true",
          select: "MULTICONTROL.handleTabChange($event)",
          children: {
            items: this.getItems()
          }
        })
      });
    };
    return MultipleModeBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "converterContext", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = MultipleModeBlock;
  return _exports;
}, false);
//# sourceMappingURL=MultipleMode.block-dbg.js.map
