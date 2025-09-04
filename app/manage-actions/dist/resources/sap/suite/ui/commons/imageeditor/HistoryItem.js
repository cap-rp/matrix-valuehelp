/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/base/Object"],function(t){"use strict";var e=t.extend("sap.suite.ui.commons.imageeditor.HistoryItem",{metadata:{abstract:true}});e.prototype._isSameClass=function(t){return this.getMetadata().getName()===t.getMetadata().getName()};e.prototype._compare=function(t,e){var a=this;return this._isSameClass(t)&&e.reduce(function(e,r){return a[r]()===t[r]()},true)};return e});
//# sourceMappingURL=HistoryItem.js.map