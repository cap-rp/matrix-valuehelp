sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/odata/v4/ODataModel"
], function (UIComponent, ODataModel) {
    "use strict";
    return UIComponent.extend("sapui5.criticality.matrix.Component", {
        metadata: { manifest: "json" },
        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // create OData v4 model from manifest dataSource
            var sService = this.getManifestEntry("/sap.app/dataSources/mainService/uri") || "/odata/v4/criticality/";
            var oODataModel = new ODataModel({ serviceUrl: sService });
            this.setModel(oODataModel, "odata");
        }
    });
});