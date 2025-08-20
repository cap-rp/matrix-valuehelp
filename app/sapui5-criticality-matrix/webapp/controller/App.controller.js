sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/SearchField",
    "sap/m/VBox",
    "../control/CriticalityMatrix" // <-- no .js, relative to this controller file
], function (Controller, JSONModel, Dialog, Button, SearchField, VBox, CriticalityMatrix) {
    "use strict";
    return Controller.extend("sapui5.criticality.matrix.controller.App", {
        onInit: function () {
            // local UI model that holds transformed data for the control
            var oData = { matrixValues: {}, matrixTitles: {} };
            this.getView().setModel(new JSONModel(oData), "app");

            // load CAP data from OData V4 model and transform
            var oOData = this.getOwnerComponent().getModel("odata");
            if (oOData) {
                var oList = oOData.bindList("/CriticalityCells");
                oList.requestContexts(0, 100).then(function (aContexts) {
                    var vals = {}, titles = {};
                    aContexts.forEach(function (oCtx) {
                        var oObj = oCtx.getObject();
                        if (oObj && oObj.Key) {
                            vals[oObj.Key] = (oObj.Color || "white").toString();
                            titles[oObj.Key] = oObj.Title || "";
                        }
                    });
                    var oAppModel = this.getView().getModel("app");
                    oAppModel.setProperty("/matrixValues", vals);
                    oAppModel.setProperty("/matrixTitles", titles);
                }.bind(this)).catch(function (err) {
                    console.error("Failed to load criticality cells", err);
                });
            } else {
                console.warn("OData v4 model 'odata' not found on component.");
            }
        },

        onOpenMatrix: function () {
            var that = this;
            var oView = this.getView();
            var oAppModel = oView.getModel("app");

            if (!this._oDialog) {
                // use injected dependency CriticalityMatrix (no sap.ui.requireSync)
                var oMatrix = new CriticalityMatrix({
                    cellsPath: "/CriticalityCells",
                    modelName: "odata",
                    cellSize: 56,
                    cellPress: function (oEvt) {
                        var sKey = oEvt.getParameter("key");
                        var sColor = oEvt.getParameter("color");
                        if (that.byId("matrixField")) { that.byId("matrixField").setValue(sKey + " (" + sColor + ")"); }
                        if (that._oDialog) { that._oDialog.close(); }
                    },
                    cellChange: function (oEvt) {
                        var vals = oEvt.getParameter("values") || {};
                        oAppModel.setProperty("/matrixValues", vals);
                        // persistence logic...
                    }
                });

                var oSearch = new SearchField({
                    placeholder: "Filter by key, color or title",
                    liveChange: function (oEvt) { oMatrix.applyFilter(oEvt.getParameter("newValue") || ""); },
                    width: "100%"
                });

                var oVBox = new VBox({ items: [oSearch, oMatrix], renderType: "Bare" });

                this._oDialog = new Dialog({
                    title: "Select Criticality",
                    content: [oVBox],
                    beginButton: new Button({ text: "Close", press: function () { that._oDialog.close(); } }),
                    stretch: sap.ui.Device.system.phone
                });

                oView.addDependent(this._oDialog);
                this._oMatrix = oMatrix;
            } else {
                this._oMatrix.setProperty("values", oAppModel.getProperty("/matrixValues"), true);
                this._oMatrix.setProperty("titles", oAppModel.getProperty("/matrixTitles"), true);
                this._oMatrix.invalidate();
            }

            this._oDialog.open();
        }
    });
});