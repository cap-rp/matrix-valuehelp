/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define(
	[
		"sap/suite/ui/commons/util/HtmlElement",
		"sap/suite/ui/commons/statusindicator/SimpleShape",
		"sap/suite/ui/commons/statusindicator/SimpleShapeRenderer",
		"../library",
		"sap/m/library"
	],
	function (HtmlElement, SimpleShape, SimpleShapeRenderer, lib, MobileLibrary) {
		"use strict";
		var oSemanticColorType = lib.SemanticColorType;
		/** @deprecated since 1.135 */
		var ValueCssColor = MobileLibrary.ValueCSSColor;
		/**
		 * Constructor for a new Rectangle.
		 *
		 * @param {string} [sId] id for the new control, generated automatically if no id is given
		 * @param {object} [mSettings] initial settings for the new control
		 *
		 * @class
		 * Status indicator shape in the form of a rectangle.
		 * @extends sap.suite.ui.commons.statusindicator.SimpleShape
		 *
		 * @author SAP SE
		 * @version 1.136.0
		 * @since 1.50
		 *
		 * @constructor
		 * @public
		 * @alias sap.suite.ui.commons.statusindicator.Rectangle
		 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel.
		 */
		var Rectangle = SimpleShape.extend("sap.suite.ui.commons.statusindicator.Rectangle",
			/** @lends sap.suite.ui.commons.statusindicator.Rectangle.prototype */ {

				metadata: {
					library: "sap.suite.ui.commons",
					properties: {

						/**
						 * Defines the x coordinate of the upper-left corner of the rectangle.
						 */
						x: {type: "int", defaultValue: 0},

						/**
						 * Defines the y coordinate of the upper-left corner of the rectangle.
						 */
						y: {type: "int", defaultValue: 0},

						/**
						 * Defines the horizontal corner radius of the rectangle. If set to 0, the corners
						 * are not rounded.
						 */
						rx: {type: "int", defaultValue: 0},

						/**
						 * Defines the vertical corner radius of the rectangle. If set to 0, the corners
						 * are not rounded.
						 */
						ry: {type: "int", defaultValue: 0},

						/**
						 * Defines the width of the rectangle.
						 */
						width: {type: "int", defaultValue: 0},

						/**
						 * Defines the height of the rectangle.
						 */
						height: {type: "int", defaultValue: 0}
					}
				},
				renderer: SimpleShapeRenderer
			});

		Rectangle.prototype._getSimpleShapeElement = function (sRectId) {
			var oRectElement = new HtmlElement("rect");
			var sStrokeColor = this._getCssStrokeColor();

			oRectElement.setId(this._buildIdString(sRectId));

			oRectElement.setAttribute("x", this.getX());
			oRectElement.setAttribute("y", this.getY());
			oRectElement.setAttribute("width", this.getWidth());
			oRectElement.setAttribute("height", this.getHeight());
			oRectElement.setAttribute("rx", this.getRx());
			oRectElement.setAttribute("ry", this.getRy());
			oRectElement.setAttribute("stroke-width", this.getStrokeWidth());

			if (oSemanticColorType.hasOwnProperty(sStrokeColor)) {
				oRectElement.addClass("strokeSemanticColor" + sStrokeColor);
			}
			/** @deprecated since 1.135 */
			if (ValueCssColor.isValid(sStrokeColor)){
				oRectElement.setAttribute("stroke", sStrokeColor);
			}

			return oRectElement;
		};

		return Rectangle;
	});
