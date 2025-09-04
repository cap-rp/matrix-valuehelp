/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/macros/filterBar/FilterHelper", "sap/ui/core/format/NumberFormat", "sap/ui/mdc/condition/Condition", "sap/ui/model/odata/type/DateTimeOffset"], function (Log, FilterHelper, NumberFormat, Condition, DateTimeOffset) {
  "use strict";

  var getTypeCompliantValue = FilterHelper.getTypeCompliantValue;
  var getRangeProperty = FilterHelper.getRangeProperty;
  const VisualFilterUtils = {
    /**
     * Applies the median scale to the chart data.
     * @param oInteractiveChart InteractiveChart in the VisualFilter control
     * @param oView Instance of the view
     * @param sVFId VisualFilter control ID
     * @param sInfoPath Internal model context path to store info.
     */
    applyMedianScaleToChartData: function (oInteractiveChart, oView, sVFId, sInfoPath) {
      const oData = [];
      const sMeasure = oInteractiveChart.data("measure");
      const oInternalModelContext = oView.getBindingContext("internal");
      const aAggregation = oInteractiveChart.getPoints && oInteractiveChart.getPoints() || oInteractiveChart.getBars && oInteractiveChart.getBars() || oInteractiveChart.getSegments && oInteractiveChart.getSegments();
      for (const item of aAggregation) {
        oData.push(item.getBindingContext().getObject());
      }
      const scaleFactor = this._getMedianScaleFactor(oData, sMeasure);
      if (scaleFactor && scaleFactor.iShortRefNumber && scaleFactor.scale) {
        oInternalModelContext.setProperty(`scalefactor/${sInfoPath}`, scaleFactor.scale);
        oInternalModelContext.setProperty(`scalefactorNumber/${sInfoPath}`, scaleFactor.iShortRefNumber);
      } else {
        oInternalModelContext.setProperty(`scalefactor/${sInfoPath}`, "");
        oInternalModelContext.setProperty(`scalefactorNumber/${sInfoPath}`, "");
        const oScaleTitle = oView.byId(`${sVFId}::ScaleUoMTitle`);
        const oMeasureDimensionTitle = oView.byId(`${sVFId}::MeasureDimensionTitle`);
        const sText = oScaleTitle.getText();
        if (sText === " | ") {
          oScaleTitle.setText("");
          oMeasureDimensionTitle.setTooltip(oMeasureDimensionTitle.getText());
        }
      }
    },
    /**
     * Returns the median scale factor.
     * @param oData VisualFilter data
     * @param sMeasureField Path of the measure
     * @returns Object containing scale and iShortRefNumber
     */
    _getMedianScaleFactor: function (oData, sMeasureField) {
      let i;
      let scaleFactor;
      oData.sort(function (a, b) {
        if (Number(a[sMeasureField]) < Number(b[sMeasureField])) {
          return -1;
        }
        if (Number(a[sMeasureField]) > Number(b[sMeasureField])) {
          return 1;
        }
        return 0;
      });
      if (oData.length > 0) {
        // get median index
        const iMid = oData.length / 2,
          // get mid of array
          // if iMid is whole number, array length is even, calculate median
          // if iMid is not whole number, array length is odd, take median as iMid - 1
          iMedian = iMid % 1 === 0 ? (parseFloat(oData[iMid - 1][sMeasureField]) + parseFloat(oData[iMid][sMeasureField])) / 2 : parseFloat(oData[Math.floor(iMid)][sMeasureField]),
          // get scale factor on median
          val = iMedian;
        for (i = 0; i < 14; i++) {
          scaleFactor = Math.pow(10, i);
          if (Math.round(Math.abs(val) / scaleFactor) < 10) {
            break;
          }
        }
      }
      const fixedInteger = NumberFormat.getIntegerInstance({
        style: "short",
        showScale: false,
        shortRefNumber: scaleFactor
      });

      // apply scale factor to other values and check
      for (i = 0; i < oData.length; i++) {
        const aData = oData[i],
          sScaledValue = fixedInteger.format(aData[sMeasureField]),
          aScaledValueParts = sScaledValue.split(".");
        // if scaled value has only 0 before decimal or 0 after decimal (example: 0.02)
        // then ignore this scale factor else proceed with this scale factor
        // if scaled value divided by 1000 is >= 1000 then also ignore scale factor
        if (!aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0 || aScaledValueParts[1] && parseInt(aScaledValueParts[0], 10) === 0 && aScaledValueParts[1].indexOf("0") === 0 || Number(sScaledValue) / 1000 >= 1000) {
          scaleFactor = undefined;
          break;
        }
      }
      return {
        iShortRefNumber: scaleFactor,
        scale: scaleFactor ? fixedInteger.getScale() : ""
      };
    },
    /**
     * Returns the formatted number according to the rules of VisualChartFilters.
     * @param inValue Value which needs to be formatted
     * @param scaleFactor ScaleFactor to which the value needs to be scaled
     * @param numberOfFractionalDigits NumberOfFractionalDigits digits in the decimals according to scale
     * @param currency Currency code
     * @returns The formatted number
     */
    getFormattedNumber: function (inValue, scaleFactor, numberOfFractionalDigits, currency) {
      let fixedInteger;
      const value = typeof inValue === "string" ? Number(inValue.replace(/,/g, "")) : inValue;
      if (currency) {
        const currencyFormat = NumberFormat.getCurrencyInstance({
          showMeasure: false
        });
        return currencyFormat.format(value, currency);
        // parseFloat(value) is required otherwise -ve value are wrongly rounded off
        // Example: "-1.9" rounds off to -1 instead of -2. however -1.9 rounds off to -2
      } else if (scaleFactor) {
        fixedInteger = NumberFormat.getFloatInstance({
          style: "short",
          showScale: false,
          shortRefNumber: scaleFactor,
          shortDecimals: numberOfFractionalDigits
        });
        return fixedInteger.format(value);
      } else {
        fixedInteger = NumberFormat.getFloatInstance({
          decimals: numberOfFractionalDigits
        });
        return fixedInteger.format(value);
      }
    },
    /**
     * Applies the UOM to the title of the visual filter control.
     * @param oInteractiveChart InteractiveChart in the VisualFilter control
     * @param oContextData Data of the VisualFilter
     * @param oView Instance of the view
     * @param sInfoPath Internal model context path to store info.
     */
    applyUOMToTitle: function (oInteractiveChart, oContextData, oView, sInfoPath) {
      const vUOM = oInteractiveChart.data("uom");
      let sUOM;
      let sCurrency;
      if (vUOM && vUOM["ISOCurrency"]) {
        sUOM = vUOM["ISOCurrency"];
        sCurrency = sUOM.$Path ? oContextData[sUOM.$Path] : sUOM;
      } else if (vUOM && vUOM["Unit"]) {
        sUOM = vUOM["Unit"];
      }
      if (sUOM) {
        const sUOMValue = sUOM.$Path ? oContextData[sUOM.$Path] : sUOM;
        const oInternalModelContext = oView.getBindingContext("internal");
        oInternalModelContext.setProperty(`uom/${sInfoPath}`, sUOMValue);
        if (sCurrency) {
          oInternalModelContext.setProperty(`currency/${sInfoPath}`, sUOMValue);
        }
      }
    },
    /**
     * Updates the scale factor in the title of the visual filter.
     * @param oInteractiveChart InteractiveChart in the VisualFilter control
     * @param oView Instance of the view
     * @param sVFId VisualFilter control ID
     * @param sInfoPath Internal model context path to store info.
     */
    updateChartScaleFactorTitle: function (oInteractiveChart, oView, sVFId, sInfoPath) {
      if (!oInteractiveChart.data("scalefactor")) {
        this.applyMedianScaleToChartData(oInteractiveChart, oView, sVFId, sInfoPath);
      } else {
        const fixedInteger = NumberFormat.getIntegerInstance({
          style: "short",
          showScale: false,
          shortRefNumber: oInteractiveChart.data("scalefactor")
        });
        const oInternalModelContext = oView.getBindingContext("internal");
        const scale = fixedInteger.getScale() ? fixedInteger.getScale() : "";
        oInternalModelContext.setProperty(`scalefactor/${sInfoPath}`, scale);
      }
    },
    /**
     *
     * @param s18nMessageTitle Text of the error message title.
     * @param s18nMessage Text of the error message description.
     * @param sInfoPath Internal model context path to store info.
     * @param oView Instance of the view.
     */
    applyErrorMessageAndTitle: function (s18nMessageTitle, s18nMessage, sInfoPath, oView) {
      const oInternalModelContext = oView.getBindingContext("internal");
      oInternalModelContext.setProperty(sInfoPath, {});
      oInternalModelContext.setProperty(sInfoPath, {
        errorMessageTitle: s18nMessageTitle,
        errorMessage: s18nMessage,
        showError: true
      });
    },
    /**
     * Checks if multiple units are present.
     * @param oContexts Contexts of the VisualFilter
     * @param sUnitfield The path of the unit field
     * @returns Returns if multiple units are configured or not
     */
    checkMulitUnit: function (oContexts, sUnitfield) {
      const aData = [];
      if (oContexts && sUnitfield) {
        for (const item of oContexts) {
          const aContextData = item && item.getObject();
          aData.push(aContextData[sUnitfield]);
        }
      }
      return !!aData.reduce(function (data, key) {
        return data === key ? data : NaN;
      });
    },
    /**
     * Sets an error message if multiple UOM are present.
     * @param oData Data of the VisualFilter control
     * @param oInteractiveChart InteractiveChart in the VisualFilter control
     * @param sInfoPath Internal model context path to store info.
     * @param oResourceBundle The resource bundle
     * @param oView Instance of the view
     */
    setMultiUOMMessage: function (oData, oInteractiveChart, sInfoPath, oResourceBundle, oView) {
      const vUOM = oInteractiveChart.data("uom");
      const sIsCurrency = vUOM && vUOM["ISOCurrency"] && vUOM["ISOCurrency"].$Path;
      const sIsUnit = vUOM && vUOM["Unit"] && vUOM["Unit"].$Path;
      const sUnitfield = sIsCurrency || sIsUnit;
      let s18nMessageTitle, s18nMessage;
      if (sUnitfield) {
        if (!this.checkMulitUnit(oData, sUnitfield)) {
          if (sIsCurrency) {
            s18nMessageTitle = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE");
            s18nMessage = oResourceBundle.getText("M_VISUAL_FILTERS_MULTIPLE_CURRENCY", sUnitfield);
            this.applyErrorMessageAndTitle(s18nMessageTitle, s18nMessage, sInfoPath, oView);
            Log.warning(`Filter is set for multiple Currency for${sUnitfield}`);
          } else if (sIsUnit) {
            s18nMessageTitle = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE");
            s18nMessage = oResourceBundle.getText("M_VISUAL_FILTERS_MULTIPLE_UNIT", sUnitfield);
            this.applyErrorMessageAndTitle(s18nMessageTitle, s18nMessage, sInfoPath, oView);
            Log.warning(`Filter is set for multiple UOMs for${sUnitfield}`);
          }
        }
      }
    },
    /**
     * Sets an error message if response data is empty.
     * @param sInfoPath Internal model context path to store info.
     * @param oResourceBundle The resource bundle
     * @param oView Instance of the view
     */
    setNoDataMessage: function (sInfoPath, oResourceBundle, oView) {
      const s18nMessageTitle = oResourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE");
      const s18nMessage = oResourceBundle.getText("M_VISUAL_FILTER_NO_DATA_TEXT");
      this.applyErrorMessageAndTitle(s18nMessageTitle, s18nMessage, sInfoPath, oView);
    },
    convertFilterCondions: function (oFilterConditions) {
      const oConvertedConditions = {};
      Object.keys(oFilterConditions).forEach(function (sKey) {
        const aConvertedConditions = [];
        const aConditions = oFilterConditions[sKey];
        for (const item of aConditions) {
          const values = item.value2 ? [item.value1, item.value2] : [item.value1];
          aConvertedConditions.push(Condition.createCondition(item.operator, values, null, null, "Validated"));
        }
        if (aConvertedConditions.length) {
          oConvertedConditions[sKey] = aConvertedConditions;
        }
      });
      return oConvertedConditions;
    },
    getCustomConditions: function (Range, oValidProperty, sPropertyName) {
      let value1, value2;
      if (oValidProperty.$Type === "Edm.DateTimeOffset") {
        value1 = this._parseDateTime(getTypeCompliantValue(this._formatDateTime(Range.Low), oValidProperty.$Type, Range.Option));
        value2 = Range.High ? this._parseDateTime(getTypeCompliantValue(this._formatDateTime(Range.High), oValidProperty.$Type, Range.Option)) : null;
      } else {
        value1 = Range.Low;
        value2 = Range.High ? Range.High : null;
      }
      return {
        operator: Range.Option ? getRangeProperty(Range.Option.$EnumMember || Range.Option) : null,
        value1: value1,
        value2: value2,
        path: sPropertyName
      };
    },
    _parseDateTime: function (sValue) {
      return this._getDateTimeTypeInstance().parseValue(sValue, "string");
    },
    _formatDateTime: function (sValue) {
      return this._getDateTimeTypeInstance().formatValue(sValue, "string");
    },
    _getDateTimeTypeInstance: function () {
      return new DateTimeOffset({
        pattern: "yyyy-MM-ddTHH:mm:ssZ",
        calendarType: "Gregorian"
      }, {
        V4: true
      });
    },
    /**
     * Get error info when required inParameters or required filters are not available.
     * @param notMatchedConditions Property names(inParameters or required filters) for which values are not available .
     * @param resourceBundle ResourceBundle for translated texts.
     * @param entitySetPath EntitySet Path for property label annotation.
     * @param metaModel Default metamodel.
     * @returns Error info containing texts for title and message.
     */
    getErrorInfoForNoInitialOverlay: function (notMatchedConditions, resourceBundle, entitySetPath, metaModel) {
      let ret;
      if (notMatchedConditions.length > 1) {
        ret = {
          showError: true,
          errorMessageTitle: resourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
          errorMessage: resourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_MULTIPLEVF")
        };
      } else if (notMatchedConditions.length === 1) {
        const label = metaModel.getObject(`${entitySetPath}/${notMatchedConditions[0]}@com.sap.vocabularies.Common.v1.Label`) || notMatchedConditions[0];
        ret = {
          showError: true,
          errorMessageTitle: resourceBundle.getText("M_VISUAL_FILTERS_ERROR_MESSAGE_TITLE"),
          errorMessage: resourceBundle.getText("M_VISUAL_FILTERS_PROVIDE_FILTER_VAL_SINGLEVF", [label])
        };
      }
      return ret;
    }
  };
  return VisualFilterUtils;
}, false);
//# sourceMappingURL=VisualFilterUtils-dbg.js.map
