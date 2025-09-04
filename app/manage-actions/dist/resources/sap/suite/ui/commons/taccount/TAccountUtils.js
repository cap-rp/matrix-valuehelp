/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/core/format/NumberFormat","sap/ui/core/Core","sap/base/i18n/Localization","sap/ui/core/Locale"],function(r,e,t,a){"use strict";var o={};o._oCurrencyFormatter=null;o.formatCurrency=function(r,e,t){return o._getCurrencyFormatter(t).format(r,e)||""};o._getCurrencyFormatter=function(e){o._oCurrencyFormatter=r.getCurrencyInstance({showMeasure:false,maxFractionDigits:e});return o._oCurrencyFormatter};return o},true);
//# sourceMappingURL=TAccountUtils.js.map