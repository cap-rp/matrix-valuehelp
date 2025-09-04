/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/m/Button","sap/ui/core/StaticArea","sap/ui/core/UIArea","sap/ui/dom/units/Rem"],function(t,i,e,n){"use strict";const s={calls:0,hiddenButton:undefined,init:function(){this.calls++;this.hiddenButton=this.hiddenButton?this.hiddenButton:(new t).placeAt(i.getDomRef());this.hiddenButton.setVisible(false)},getButtonWidth:function(t){if(!t||!this.hiddenButton){return 0}this.hiddenButton.setVisible(true);this.hiddenButton.setText(t);e.rerenderControl(this.hiddenButton);const i=n.fromPx(this.hiddenButton.getDomRef()?.scrollWidth);this.hiddenButton.setVisible(false);return Math.round(i*100)/100},exit:function(){this.calls--;if(this.calls===0){this.hiddenButton?.destroy();this.hiddenButton=undefined}}};return s},false);
//# sourceMappingURL=SizeHelper.js.map