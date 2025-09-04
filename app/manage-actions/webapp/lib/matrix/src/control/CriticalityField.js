sap.ui.define([
    "sap/m/Input",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/VBox",
    "sap/m/SearchField",
    "./CriticalityMatrix"
], function (Input, Dialog, Button, VBox, SearchField, CriticalityMatrix) {
    "use strict";
    return Input.extend("matrix.control.CriticalityField", {
        metadata: {
            properties: {
                cellsPath: { type: "string", defaultValue: "/CriticalityCells" },
                modelName: { type: "string", defaultValue: "odata" }
            }
        },

        init: function () {
            Input.prototype.init.apply(this, arguments);
            this.setShowValueHelp(true);
            this.attachValueHelpRequest(this._onOpenMatrix.bind(this));
        },

        _onOpenMatrix: function () {
            var that = this;
            if (!this._oDialog) {
                var oMatrix = new CriticalityMatrix({
                    cellsPath: this.getCellsPath(),
                    modelName: this.getModelName(),
                    cellPress: function (oEvt) {
                        var key = oEvt.getParameter("key");
                        var color = oEvt.getParameter("color");
                        that.setValue(key + " (" + color + ")");
                        // update bound property value (without invalidation)
                        that.setProperty("value", key, true);
                        that._oDialog.close();
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

                this.addDependent(this._oDialog);
                this._oMatrix = oMatrix;
            } else {
                // refresh if needed
                this._oMatrix.setProperty("values", this._oMatrix.getValues(), true);
                this._oMatrix.invalidate();
            }
            this._oDialog.open();
        }
    });
});