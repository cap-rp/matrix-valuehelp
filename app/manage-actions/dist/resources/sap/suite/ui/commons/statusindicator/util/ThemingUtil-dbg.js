/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/core/theming/Parameters",
	"sap/m/library",
	"sap/ui/core/library",
	"../../library"
], function (Parameters, mobileLibrary, coreLibrary, library) {
	"use strict";

	// shortcut for sap.m.ValueColor
	var ValueColor = mobileLibrary.ValueColor;
	var oSemanticColorType = library.SemanticColorType;

	// shortcut for sap.ui.core.CSSColor
	var CSSColor = coreLibrary.CSSColor;

	var ThemingUtil = function() {
		throw new Error();
	};

	ThemingUtil.resolveColor = function (sColor) {
		if (CSSColor.isValid(sColor)) {
			return sColor;
		}

		switch (sColor) {
			case ValueColor.Good:
				/**
				* @deprecated As of version 1.120
				*/
				if (Parameters.get("sapPositiveColor")) {
					return Parameters.get("sapPositiveColor");
				}
				return sColor;
			case ValueColor.Error:
				/**
				* @deprecated As of version 1.120
				*/
				if (Parameters.get("sapNegativeColor")) {
					return Parameters.get("sapNegativeColor");
				}
				return sColor;
			case ValueColor.Critical:
				/**
				* @deprecated As of version 1.120
				*/
				if (Parameters.get("sapCriticalColor")) {
					return Parameters.get("sapCriticalColor");
				}
				return sColor;
			case ValueColor.Neutral:
				/**
				* @deprecated As of version 1.120
				*/
				if (Parameters.get("sapNeutralColor")) {
					return Parameters.get("sapNeutralColor");
				}
				return sColor;
			default:
				if (oSemanticColorType.hasOwnProperty(sColor)) {
					return sColor;
				} else {
					/**
					* @deprecated As of version 1.120
					*/
					return Parameters.get(sColor);
				}
		}
	};

	return ThemingUtil;
}, true);
