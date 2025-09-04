/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2021 SAP SE. All rights reserved
	
 */

sap.ui.define(
	[
		"sap/ui/core/Lib", // implicit dependency
		"sap/ui/core/library" // library dependency
	],
	function (Library) {
		"use strict";

		/**
		 * Fiori Elements Placeholder Library
		 * @namespace
		 * @private
		 * @experimental
		 */

		// library dependencies
		// delegate further initialization of this library to the Core
		return Library.init({
			name: "sap.fe.placeholder",
			apiVersion: 2,
			dependencies: ["sap.ui.core"],
			types: [],
			interfaces: [],
			controls: [],
			elements: [],
			// eslint-disable-next-line no-template-curly-in-string
			version: "1.136.0",
			noLibraryCSS: false,
			extensions: {}
		});
	}
);
