/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/ui/base/Object", "./NavError"], function (Log, BaseObject, NavError) {
  "use strict";

  var _exports = {};
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Structure of a visualization object
   * @alias sap.fe.navigation.PresentationVariant.Visualization
   * @public
   */
  /**
   * Structure of a visualization object
   * @alias sap.fe.navigation.PresentationVariant.VisChartContent
   * @public
   */
  /**
   * Structure of measure type
   * @alias sap.fe.navigation.PresentationVariant.MeasureType
   * @public
   */
  /**
   * Structure of dimension type
   * @alias sap.fe.navigation.PresentationVariant.DimensionType
   * @public
   */
  /**
   * Structure of the external plain object representation of a PresentationVariant
   * @alias sap.fe.navigation.PresentationVariant.ExternalPresentationVariant
   * @public
   */
  /**
   * Structure of the external plain object representation of a PresentationVariant
   * @alias sap.fe.navigation.PresentationVariant.VisContentType
   * @public
   */
  /**
   * This is the successor of {@link sap.ui.generic.app.navigation.service.PresentationVariant}.<br> Creates a new instance of a PresentationVariant class. If no parameter is passed, an new empty instance is created whose ID has been set to <code>""</code>. Passing a JSON-serialized string complying to the Selection Variant Specification will parse it, and the newly created instance will contain the same information.
   * @public
   * @since 1.83.0
   */
  let PresentationVariant = /*#__PURE__*/function (_BaseObject) {
    /**
     * If no parameter is passed, a new empty instance is created whose ID has been set to <code>""</code>.
     * Passing a JSON-serialized string complying to the Selection Variant Specification will parse it,
     * and the newly created instance will contain the same information.
     * @param presentationVariant If of type <code>string</code>, the selection variant is JSON-formatted;
     * if of type <code>object</code>, the object represents a selection variant
     * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
     * <table>
     * <tr><th>NavError code</th><th>Description</th></tr>
     * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that the data format of the selection variant provided is inconsistent</td></tr>
     * <tr><td>PresentationVariant.UNABLE_TO_PARSE_INPUT</td><td>Indicates that the provided string is not a JSON-formatted string</td></tr>
     * <tr><td>PresentationVariant.INPUT_DOES_NOT_CONTAIN_SELECTIONVARIANT_ID</td><td>Indicates that the PresentationVariantID cannot be retrieved</td></tr>
     * <tr><td>PresentationVariant.PARAMETER_WITHOUT_VALUE</td><td>Indicates that there was an attempt to specify a parameter, but without providing any value (not even an empty value)</td></tr>
     * <tr><td>PresentationVariant.SELECT_OPTION_WITHOUT_PROPERTY_NAME</td><td>Indicates that a selection option has been defined, but the Ranges definition is missing</td></tr>
     * <tr><td>PresentationVariant.SELECT_OPTION_RANGES_NOT_ARRAY</td><td>Indicates that the Ranges definition is not an array</td></tr>
     * </table>
     * These exceptions can only be thrown if the parameter <code>vPresentationVariant</code> has been provided.
     */
    function PresentationVariant(presentationVariant) {
      var _this;
      _this = _BaseObject.call(this) || this;
      _this.id = "";
      if (presentationVariant !== undefined) {
        if (typeof presentationVariant === "string") {
          _this.parseFromString(presentationVariant);
        } else if (typeof presentationVariant === "object") {
          _this.parseFromObject(presentationVariant);
        } else {
          throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
        }
      }
      return _this;
    }

    /**
     * Returns the identification of the selection variant.
     * @returns The identification of the selection variant as made available during construction
     * @public
     */
    _exports.PresentationVariant = PresentationVariant;
    _inheritsLoose(PresentationVariant, _BaseObject);
    var _proto = PresentationVariant.prototype;
    _proto.getID = function getID() {
      return this.id;
    }

    /**
     * Sets the identification of the selection variant.
     * @param id The new identification of the selection variant
     * @public
     */;
    _proto.setID = function setID(id) {
      this.id = id;
    }

    /**
     * Sets the text / description of the selection variant.
     * @param newText The new description to be used
     * @public
     * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
     * <table>
     * <tr><th>NavError code</th><th>Description</th></tr>
     * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that an input parameter has an invalid type</td></tr>
     * </table>
     */;
    _proto.setText = function setText(newText) {
      if (typeof newText !== "string") {
        throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
      }
      this.text = newText;
    }

    /**
     * Returns the current text / description of this selection variant.
     * @returns The current description of this selection variant.
     * @public
     */;
    _proto.getText = function getText() {
      return this.text;
    }

    /**
     * Sets the context URL.
     * @param url The URL of the context
     * @public
     * @throws An instance of {@link sap.fe.navigation.NavError} in case of input errors. Valid error codes are:
     * <table>
     * <tr><th>NavError code</th><th>Description</th></tr>
     * <tr><td>PresentationVariant.INVALID_INPUT_TYPE</td><td>Indicates that an input parameter has an invalid type</td></tr>
     * </table>
     */;
    _proto.setContextUrl = function setContextUrl(url) {
      if (typeof url !== "string") {
        throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
      }
      this.ctxUrl = url;
    }

    /**
     * Gets the current context URL intended for the query.
     * @returns The current context URL for the query
     * @public
     */;
    _proto.getContextUrl = function getContextUrl() {
      return this.ctxUrl;
    }

    /**
     * Returns <code>true</code> if the presentation variant does not contain any properties.
     * nor ranges.
     * @returns If set to <code>true</code> there are no current properties set; <code>false</code> otherwise.
     * @public
     */;
    _proto.isEmpty = function isEmpty() {
      return Object.keys(this.getTableVisualization() ?? {}).length === 0 && Object.keys(this.getChartVisualization() ?? {}).length === 0 && Object.keys(this.getProperties() ?? {}).length === 0;
    }

    /**
     * Sets the more trivial properties. Basically all properties with the exception of the Visualization.
     * @param properties The properties to be used.
     * @public
     */;
    _proto.setProperties = function setProperties(properties) {
      this.properties = Object.assign({}, properties);
    }

    /**
     * Gets the more trivial properties. Basically all properties with the exception of the Visualization.
     * @returns The current properties.
     * @public
     */;
    _proto.getProperties = function getProperties() {
      return this.properties;
    }

    /**
     * Sets the table visualization property.
     * @param properties An object containing the properties to be used for the table visualization.
     * @public
     */;
    _proto.setTableVisualization = function setTableVisualization(properties) {
      this.visTable = Object.assign({}, properties);
    }

    /**
     * Gets the table visualization property.
     * @returns An object containing the properties to be used for the table visualization.
     * @public
     */;
    _proto.getTableVisualization = function getTableVisualization() {
      return this.visTable;
    }

    /**
     * Sets the chart visualization property.
     * @param properties An object containing the properties to be used for the chart visualization.
     * @public
     */;
    _proto.setChartVisualization = function setChartVisualization(properties) {
      this.visChart = Object.assign({}, properties);
    }

    /**
     * Gets the chart visualization property.
     * @returns An object containing the properties to be used for the chart visualization.
     * @public
     */;
    _proto.getChartVisualization = function getChartVisualization() {
      return this.visChart;
    }

    /**
     * Returns the external representation of the selection variant as JSON object.
     * @returns The external representation of this instance as a JSON object
     * @public
     */;
    _proto.toJSONObject = function toJSONObject() {
      const externalPresentationVariant = {
        Version: {
          // Version attributes are not part of the official specification,
          Major: "1",
          // but could be helpful later for implementing a proper lifecycle/interoperability
          Minor: "0",
          Patch: "0"
        },
        PresentationVariantID: this.id
      };
      if (this.ctxUrl) {
        externalPresentationVariant.ContextUrl = this.ctxUrl;
      }
      if (this.text) {
        externalPresentationVariant.Text = this.text;
      } else {
        externalPresentationVariant.Text = "Presentation Variant with ID " + this.id;
      }
      this.serializeProperties(externalPresentationVariant);
      this.serializeVisualizations(externalPresentationVariant);
      return externalPresentationVariant;
    }

    /**
     * Serializes this instance into a JSON-formatted string.
     * @returns The JSON-formatted representation of this instance in stringified format
     * @public
     */;
    _proto.toJSONString = function toJSONString() {
      return JSON.stringify(this.toJSONObject());
    };
    _proto.serializeProperties = function serializeProperties(externalPresentationVariant) {
      if (this.properties) {
        Object.assign(externalPresentationVariant, this.properties);
      }
    };
    _proto.serializeVisualizations = function serializeVisualizations(externalPresentationVariant) {
      if (this.visTable) {
        if (!externalPresentationVariant.Visualizations) {
          externalPresentationVariant.Visualizations = [];
        }
        externalPresentationVariant.Visualizations.push(this.visTable);
      }
      if (this.visChart) {
        if (!externalPresentationVariant.Visualizations) {
          externalPresentationVariant.Visualizations = [];
        }
        externalPresentationVariant.Visualizations.push(this.visChart);
      }
    };
    _proto.parseFromString = function parseFromString(jsonString) {
      if (jsonString === undefined) {
        throw new NavError("PresentationVariant.UNABLE_TO_PARSE_INPUT");
      }
      if (typeof jsonString !== "string") {
        throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
      }
      this.parseFromObject(JSON.parse(jsonString));
    };
    _proto.parseFromObject = function parseFromObject(input) {
      if (input.PresentationVariantID === undefined) {
        // Do not throw an error, but only write a warning into the log.
        // The PresentationVariantID is mandatory according to the specification document version 1.0,
        // but this document is not a universally valid standard.
        // It is said that the "implementation of the SmartFilterBar" may supersede the specification.
        // Thus, also allow an initial PresentationVariantID.
        //		throw new sap.fe.navigation.NavError("PresentationVariant.INPUT_DOES_NOT_CONTAIN_SELECTIONVARIANT_ID");
        Log.warning("PresentationVariantID is not defined");
        input.PresentationVariantID = "";
      }
      const inputCopy = Object.assign({}, input);
      delete inputCopy.Version;
      this.setID(input.PresentationVariantID);
      delete inputCopy.PresentationVariantID;
      if (input.ContextUrl !== undefined && input.ContextUrl !== "") {
        this.setContextUrl(input.ContextUrl);
        delete input.ContextUrl;
      }
      if (input.Text !== undefined) {
        this.setText(input.Text);
        delete input.Text;
      }
      if (input.Visualizations) {
        this.parseVisualizations(input.Visualizations);
        delete inputCopy.Visualizations;
      }
      this.setProperties(inputCopy);
    };
    _proto.parseVisualizations = function parseVisualizations(visualizations) {
      if (!Array.isArray(visualizations)) {
        throw new NavError("PresentationVariant.INVALID_INPUT_TYPE");
      }
      for (const visualization of visualizations) {
        if (visualization?.Type && visualization.Type.includes("Chart")) {
          this.setChartVisualization(visualization);
        } else {
          this.setTableVisualization(visualization);
        }
      }
    };
    return PresentationVariant;
  }(BaseObject); // Exporting the class as properly typed UI5Class
  _exports.PresentationVariant = PresentationVariant;
  const UI5Class = BaseObject.extend("sap.fe.navigation.PresentationVariant", PresentationVariant.prototype);
  return UI5Class;
}, false);
//# sourceMappingURL=PresentationVariant-dbg.js.map
