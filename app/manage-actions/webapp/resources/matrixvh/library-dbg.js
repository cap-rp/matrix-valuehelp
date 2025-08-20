sap.ui.define([], function () {
    "use strict";
    return sap.ui.getCore().initLibrary({
        name: "matrixvh",
        version: "1.0.2",
        dependencies: ["sap.m"],
        types: [],
        interfaces: [],
        controls: [
            "matrixvh.control.CriticalityMatrix",
            "matrixvh.control.CriticalityField"
        ],
        elements: []
    });
});