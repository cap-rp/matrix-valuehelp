/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define(["./InfoTileRenderer","sap/ui/core/Renderer","sap/base/i18n/Localization"],function(e,t,r){"use strict";var o=t.extend(e);o._getFooterText=function(e,t){var o=t.getFooter();var i=t.getUnit();return i?r.getRTL()?(o?o+" ,":"")+i:i+(o?", "+o:""):o};o.renderFooterTooltip=function(e,t){e.writeAttributeEscaped("title",this._getFooterText(e,t))};o.renderFooterText=function(e,t){e.writeEscaped(this._getFooterText(e,t))};return o},true);
//# sourceMappingURL=NumericTileRenderer.js.map