
sap.ui.define([
	"sap/base/util/ObjectPath",
	"sap/ui/core/library"
], function (ObjectPath) {
	"use strict";

	// delegate further initialization of this library to the Core
	// Hint: sap.ui.getCore() must still be used to support preload with sync bootstrap!
	sap.ui.getCore().initLibrary({
		name: "matrix",
		version: "0.0.1",
		dependencies: [ // keep in sync with the ui5.yaml and .library files
			"sap.ui.core",
			"sap.m"
		],
		types: [
			
		],
		interfaces: [],
		controls: [
			"matrix.control.CriticalityMatrix",
            "matrix.control.CriticalityField"
		],
		elements: [],
		noLibraryCSS: false // if no CSS is provided, you can disable the library.css load here
	});

	
	const thisLib = ObjectPath.get("matrix");


	

	return thisLib;

});
