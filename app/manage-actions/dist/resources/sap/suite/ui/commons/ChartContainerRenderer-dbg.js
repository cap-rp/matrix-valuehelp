/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define(function() {
	"use strict";

	/**
	 * ChartContainer renderer.
	 * @namespace
	 */
	var ChartContainerRenderer = {
		apiVersion: 2    // enable semantic rendering
	};

	/**
	 * Renders the HTML for the given control, using the provided
	 * {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	ChartContainerRenderer.render = function(oRm, oControl) {
		var selectedChart = oControl.getSelectedContent();
		var bchildTable = false;
		if(oControl.getContent().length > 0) {
			for(var i = 0; i < oControl.getContent().length; i++) {
				if (oControl.getContent()[i].getContent().isA('sap.ui.table.Table')) {
				bchildTable = true;
				break;
				}
			}
		}
		oRm.openStart("div",oControl);
		oRm.class("sapSuiteUiCommonsChartContainer");
		oRm.style("width", oControl.getWidth());
		oRm.openEnd();

		// wrapper
		oRm.openStart("div",oControl.getId() + "-wrapper");
		oRm.class("sapSuiteUiCommonsChartContainerWrapper");
		if (bchildTable === true) {
			oRm.style("height", '100%');
		}
		oRm.openEnd();

		oRm.openStart("div");
		oRm.class("sapSuiteUiCommonsChartContainerToolBarArea");
		oRm.openEnd();
		// toolbar
		oRm.renderControl(oControl.getToolbar());
		oRm.close("div");// end toolbar

		// chart part
		oRm.openStart("div",oControl.getId() + "-chartArea");
		oRm.class("sapSuiteUiCommonsChartContainerChartArea");
		if (bchildTable === true) {
			oRm.style("height", '100%');
			oRm.style("Width", '100%');
		}
		oRm.openEnd();

		if (selectedChart !== null) {
			oRm.renderControl(selectedChart);
		} else if (oControl.getContent().length > 0) {
			selectedChart = oControl.getContent()[0];
			oRm.renderControl(selectedChart);
		}

		oRm.close("div");// end chartArea
		oRm.close("div"); // end wrapper

		oRm.close("div"); // end container
	};

	return ChartContainerRenderer;
}, /* bExport= */ true);
