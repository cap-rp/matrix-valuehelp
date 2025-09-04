/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase"],function(e,t,o){"use strict";var n,i;var r={};var l=t.xml;var c=e.defineBuildingBlock;function s(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,a(e,t)}function a(e,t){return a=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},a(e,t)}let p=(n=c({name:"FlexibleColumnLayoutActions",namespace:"sap.fe.macros.fcl",publicNamespace:"sap.fe.macros",returnTypes:["sap.m.OverflowToolbarButton"]}),n(i=function(e){function t(){return e.apply(this,arguments)||this}r=t;s(t,e);var o=t.prototype;o.getTemplate=function e(){return l`
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
            />`};return t}(o))||i);r=p;return r},false);
//# sourceMappingURL=FlexibleColumnLayoutActions.block.js.map