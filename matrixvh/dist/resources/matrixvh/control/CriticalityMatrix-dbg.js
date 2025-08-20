sap.ui.define([
    "sap/ui/core/Control"
], function (Control) {
    "use strict";
    return Control.extend("matrixvh.control.CriticalityMatrix", {
         metadata: {
            properties: {
                values: { type: "object", defaultValue: {} },
                titles: { type: "object", defaultValue: {} },
                cellSize: { type: "int", defaultValue: 56 },
                // NEW: OData binding config
                cellsPath: { type: "string", defaultValue: null },   // e.g. "/CriticalityCells"
                modelName: { type: "string", defaultValue: "odata" } // model name to read from
            },
            events: {
                cellPress: { parameters: { key: { type: "string" }, color: { type: "string" } } },
                cellChange: { parameters: { key: { type: "string" }, color: { type: "string" }, values: { type: "object" } } }
            }
        },

        init: function () {
            this._loading = false;
            this._filter = "";
            this._selectedKey = null;
        },

        // NEW: load cells from OData V4 model when cellsPath provided
        _loadCellsFromModel: function () {
            var sPath = this.getCellsPath();
            if (!sPath || this._loading) { return Promise.resolve(); }
            var sModel = this.getModelName();
            var oModel = this.getModel(sModel);
            if (!oModel || typeof oModel.bindList !== "function") { return Promise.resolve(); }

            this._loading = true;
            var oList = oModel.bindList(sPath);
            return oList.requestContexts(0, 1000).then(function (aContexts) {
                var vals = {}, titles = {};
                aContexts.forEach(function (oCtx) {
                    var oObj = oCtx.getObject();
                    if (!oObj) { return; }
                    // adapt property names to your CAP model
                    var key = oObj.Key || oObj.ID || oObj.key;
                    if (!key) { return; }
                    vals[key] = (oObj.Color || "white").toString();
                    titles[key] = oObj.Title || "";
                });
                this.setProperty("values", vals, true);
                this.setProperty("titles", titles, true);
                this.invalidate();
            }.bind(this)).catch(function (err) {
                console.error("CriticalityMatrix: failed to load cells from model", err);
            }).finally(function () {
                this._loading = false;
            }.bind(this));
        },

        onBeforeRendering: function () {
            // ensure model-driven load happens before render when cellsPath set
            if (this.getCellsPath()) {
                // load async; rendering will re-run after invalidate from loader
                this._loadCellsFromModel();
            }
        },

        // public API for filtering from outside
        applyFilter: function (sText) {
            this._filter = (sText || "").toString().trim().toLowerCase();
            this.invalidate();
        },

        renderer: function (oRM, oControl) {
            // simple HTML escaper for attributes/tooltips
            var escapeHtml = function (s) {
                return String(s || "")
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#39;");
            };

            var values = oControl.getValues() || {};
            var titles = oControl.getTitles() || {}; // NEW: read titles mapping
            var letters = ["A", "B", "C", "D"];
            var cellSize = oControl.getCellSize();
            var allowed = { white: "#ffffff", green: "#92d050", orange: "#f4b084", red: "#ff5c5c" };
            var selected = oControl._selectedKey;
            var filter = oControl._filter || "";

            oRM.write("<div");
            oRM.writeControlData(oControl);
            oRM.addStyle("font-family", "Arial, Helvetica, sans-serif");
            oRM.writeStyles();
            oRM.write(">");

            oRM.write("<table style='border-collapse:collapse;'>");
            // header
            oRM.write("<thead><tr><th></th>");
            letters.forEach(function (l) {
                oRM.write("<th style='padding:6px 10px;text-align:center;'>" + l + "</th>");
            });
            oRM.write("</tr></thead>");
            // body
            oRM.write("<tbody>");
            for (var r = 1; r <= 5; r++) {
                oRM.write("<tr>");
                oRM.write("<td style='padding:6px 10px;text-align:center;font-weight:600;'>" + r + "</td>");
                letters.forEach(function (l) {
                    var key = r + l;
                    var colorName = (values[key] || "white").toString();
                    var titleText = titles[key] || ""; // NEW: title text for cell
                    var bg = allowed[colorName] || colorName || allowed.white;
                    // filter logic: show if key or color or title includes filter text
                    var show = true;
                    if (filter) {
                        var matchKey = key.toLowerCase().indexOf(filter) !== -1;
                        var matchColor = (colorName || "").toLowerCase().indexOf(filter) !== -1;
                        var matchTitle = (titleText || "").toLowerCase().indexOf(filter) !== -1;
                        show = matchKey || matchColor || matchTitle;
                    }
                    var displayStyle = show ? "" : "display:none;";
                    var selStyle = (selected === key) ? "box-shadow:0 0 0 3px rgba(0,120,210,0.25);" : "";
                    // add title and aria-label for tooltip / accessibility
                    var tooltip = key + " - " + colorName + (titleText ? " : " + titleText : "");
                    oRM.write("<td role='button' data-key='" + escapeHtml(key) + "' data-color='" + escapeHtml(colorName) + "' class='cm-cell' " +
                        "title='" + escapeHtml(tooltip) + "' aria-label='" + escapeHtml(tooltip) + "' " +
                        "style='width:" + cellSize + "px;height:" + cellSize + "px;border:1px solid #ddd;padding:0;margin:0;vertical-align:middle;background:" + bg + ";cursor:pointer;" + displayStyle + selStyle + "'>");
                    // content: key on first line, small subtitle below
                    oRM.write("<div style='width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;'>");
                    oRM.write("<div style='font-weight:600;line-height:1;'>" + escapeHtml(key) + "</div>");
                    oRM.write("<div style='font-size:10px;color:#333;opacity:0.85;line-height:1;margin-top:3px;'>" + escapeHtml(titleText) + "</div>");
                    oRM.write("</div>");
                    oRM.write("</td>");
                });
                oRM.write("</tr>");
            }
            oRM.write("</tbody>");
            oRM.write("</table>");

            oRM.write("</div>");
        },

        onAfterRendering: function () {
            var $root = this.$();
            if (!$root || !$root.length) { return; }

            var that = this;

            // remove previous handlers to avoid duplicates
            $root.off(".cm");

            // click selects a cell and fires cellPress
            $root.on("click.cm", "td[data-key]", function (e) {
                var td = this;
                var key = td.getAttribute("data-key");
                var color = td.getAttribute("data-color") || "white";
                that._selectedKey = key;
                // mark selected visually by invalidating so renderer adds selection style
                that.invalidate();
                that.fireCellPress({ key: key, color: color });
            });

            // double-click cycles color: white -> green -> orange -> red -> white
            $root.on("dblclick.cm", "td[data-key]", function (e) {
                var td = this;
                var key = td.getAttribute("data-key");
                var current = td.getAttribute("data-color") || "white";
                var cycle = ["white", "green", "orange", "red"];
                var idx = cycle.indexOf(current);
                var next = cycle[(idx + 1) % cycle.length];
                // update internal values object safely
                var vals = Object.assign({}, that.getValues() || {});
                vals[key] = next;
                // update property without suppressing invalidation, then re-render
                that.setProperty("values", vals, true); // don't auto invalidate by UI5; we control
                // Refresh rendering to show new color and data-color attr
                that._selectedKey = key;
                that.invalidate();
                that.fireCellChange({ key: key, color: next, values: vals });
            });
        },

        exit: function () {
            var $root = this.$();
            if ($root && $root.off) {
                $root.off(".cm");
            }
        }
    });
});