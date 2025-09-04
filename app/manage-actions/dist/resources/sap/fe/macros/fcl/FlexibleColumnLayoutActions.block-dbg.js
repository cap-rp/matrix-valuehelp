/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase"], function (BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase) {
  "use strict";

  var _dec, _class;
  var _exports = {};
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Building block for adding overflow toolbar buttons to integrate into the flexible column layout support from Fiori elements.
   *
   * Usage example:
   * <pre>
   * &lt;macros:FlexibleColumnLayoutActions /&gt;
   * </pre>
   * @public
   * @since 1.93.0
   */
  let FlexibleColumnLayoutActionsBlock = (_dec = defineBuildingBlock({
    name: "FlexibleColumnLayoutActions",
    namespace: "sap.fe.macros.fcl",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.m.OverflowToolbarButton"]
  }), _dec(_class = /*#__PURE__*/function (_BuildingBlockTemplat) {
    function FlexibleColumnLayoutActionsBlock() {
      return _BuildingBlockTemplat.apply(this, arguments) || this;
    }
    _exports = FlexibleColumnLayoutActionsBlock;
    _inheritsLoose(FlexibleColumnLayoutActionsBlock, _BuildingBlockTemplat);
    var _proto = FlexibleColumnLayoutActionsBlock.prototype;
    _proto.getTemplate = function getTemplate() {
      return xml`
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::FullScreen"
                type="Transparent"
                icon="{fclhelper>/actionButtonsInfo/switchIcon}"
                visible="{fclhelper>/actionButtonsInfo/switchVisible}"
                press="._routing.switchFullScreen()"
            />
            <m:OverflowToolbarButton
                id="fe::FCLStandardAction::Close"
                type="Transparent"
                icon="sap-icon://decline"
                tooltip="{sap.fe.i18n>C_COMMON_SAPFE_CLOSE}"
                visible="{fclhelper>/actionButtonsInfo/closeVisible}"
                press="._routing.closeColumn()"
            />`;
    };
    return FlexibleColumnLayoutActionsBlock;
  }(BuildingBlockTemplatingBase)) || _class);
  _exports = FlexibleColumnLayoutActionsBlock;
  return _exports;
}, false);
//# sourceMappingURL=FlexibleColumnLayoutActions.block-dbg.js.map
