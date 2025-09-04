/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/CommonHelper", "sap/fe/macros/field/FieldTemplating", "sap/fe/macros/internal/helpers/DataPointTemplating"], function (BindingToolkit, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter, StableIdHelper, DataModelPathHelper, CommonHelper, FieldTemplating, DataPointTemplating) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _HeaderDataPointBlock;
  var _exports = {};
  var getHeaderRatingIndicatorText = DataPointTemplating.getHeaderRatingIndicatorText;
  var getVisibleExpression = FieldTemplating.getVisibleExpression;
  var getRelativePaths = DataModelPathHelper.getRelativePaths;
  var generate = StableIdHelper.generate;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var pathInModel = BindingToolkit.pathInModel;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let HeaderDataPointBlock = (_dec = defineBuildingBlock({
    name: "HeaderDataPoint",
    namespace: "sap.fe.macros.internal"
  }), _dec2 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec4 = blockAttribute({
    type: "object",
    required: true
  }), _dec5 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true
  }), _dec(_class = (_class2 = (_HeaderDataPointBlock = /*#__PURE__*/function (_BuildingBlockTemplat) {
    /**
     * Constructor method of the building block.
     * @param properties The HeaderDataPoint properties
     * @param controlConfiguration
     * @param settings
     */
    function HeaderDataPointBlock(properties, controlConfiguration, settings) {
      var _this;
      //setup initial default property settings
      _this = _BuildingBlockTemplat.call(this, properties, controlConfiguration, settings) || this;
      /**
       * Metadata path to the dataPoint.
       * This property is usually a metadataContext pointing to a DataPoint having
       * $Type = "com.sap.vocabularies.UI.v1.DataPointType"
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor, _this);
      /**
       * Metadata path to the entitySet
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
      Header facet from annotations
       */
      _initializerDefineProperty(_this, "converterHeaderFacet", _descriptor3, _this);
      /**
      Context of the Header facet
       */
      _initializerDefineProperty(_this, "headerFacet", _descriptor4, _this);
      _this.viewData = settings.models.viewData;
      _this.manifest = settings.models.manifest;
      return _this;
    }

    /*
     * Gets the 'Press' event expression for the external and internal data point link.
     *
     * @function
     * @param {object} [navigation] navigation object from Control configuration in manifest
     * @param {object} [manifestOutbound] outbounds parameter from manifest
     * returns {string} The runtime binding of the 'Press' event
     */
    _exports = HeaderDataPointBlock;
    _inheritsLoose(HeaderDataPointBlock, _BuildingBlockTemplat);
    var _proto = HeaderDataPointBlock.prototype;
    /**
     * The building block template function.
     * @returns An XML-based string
     */
    _proto.getTemplate = function getTemplate() {
      const dataModelPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
      const dataPointVisible = getVisibleExpression(dataModelPath);
      const vBoxId = generate(["fe", "HeaderFacet", this.converterHeaderFacet.headerDataPointData?.type !== "Content" ? this.converterHeaderFacet?.headerDataPointData?.type : "KeyFigure", getInvolvedDataModelObjects(this.headerFacet)]);
      const pressLink = HeaderDataPointBlock.getPressExpressionForLink(this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation, this.manifest.getProperty("/sap.app/crossNavigation/outbounds"));
      if (this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation?.targetOutbound?.outbound) {
        return this.getDataPointTitleWithExternalLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink);
      } else if (this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation?.targetSections) {
        return this.getDataPointTitleWithInPageLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink);
      }
      return this.getDataPointTitleWithoutLinkTemplate(vBoxId, dataModelPath, dataPointVisible);
    }

    /**
     * The building block template for the data point title with an external link part.
     * @returns An XML-based string with the definition of the data point title with an external link template
     */;
    _proto.getDataPointTitleWithExternalLinkTemplate = function getDataPointTitleWithExternalLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink) {
      const showTitleAsLink = CommonHelper.getHeaderDataPointLinkVisibility(generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue]), true);
      const showTitleAsText = CommonHelper.getHeaderDataPointLinkVisibility(generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue]), false);
      return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<core:InvisibleText
				id="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
				text="${this.getTranslatedText("T_HEADER_DATAPOINT_TITLE_LINK_EXTERNAL_ARIA")}"
				/>
				<Title
				xmlns="sap.m"
				level="H3"
				visible="${showTitleAsLink}"
				>
					<content>
						<Link
							id="${generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue])}"
							text="${dataModelPath.targetObject?.Title}"
							press="${pressLink}"
							ariaDescribedBy="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
							class="sapUiTinyMarginBottom"
							customData:ValuePropertyPath="${dataModelPath.targetObject?.Value?.path}"
						/>
					</content>
				</Title>
				<Title
				xmlns="sap.m"
				id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
				level="H3"
				text="${dataModelPath.targetObject?.Title}"
				class="sapUiTinyMarginBottom"
				visible="${showTitleAsText}"
				/>
				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
    }

    /**
     * The building block template for the data point title with an inPage link part.
     * @param vBoxId
     * @param dataModelPath
     * @param dataPointVisible
     * @param pressLink
     * @returns An XML-based string with the definition of the data point title with an inPage link template
     */;
    _proto.getDataPointTitleWithInPageLinkTemplate = function getDataPointTitleWithInPageLinkTemplate(vBoxId, dataModelPath, dataPointVisible, pressLink) {
      return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<core:InvisibleText
					text="${this.getTranslatedText("T_COMMON_HEADERDP_TITLE_LINK_INPAGE_ARIA")}"
					id="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
				/>
				<core:InvisibleText
					text="${dataModelPath.targetObject?.Title}"
					id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
				/>
				<Title xmlns="sap.m" level="H3" ${this.attr("visible", !!dataModelPath.targetObject?.Title)}>
					<content>
						<Link
							id="${generate(["fe", "HeaderDPLink", this.converterHeaderFacet.targetAnnotationValue])}"
							text="${dataModelPath.targetObject?.Title}"
							press="${pressLink}"
							ariaDescribedBy="${generate(["fe", this.converterHeaderFacet.targetAnnotationValue, "AriaText"])}"
							class="sapUiTinyMarginBottom"
						/>
					</content>
				</Title>
				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
    }

    /**
     * The building block template for the data point title that is non-clickable.
     * @param vBoxId
     * @param dataModelPath
     * @param dataPointVisible
     * @returns An XML-based string with the definition of the data point non-clickable title template
     */;
    _proto.getDataPointTitleWithoutLinkTemplate = function getDataPointTitleWithoutLinkTemplate(vBoxId, dataModelPath, dataPointVisible) {
      return xml`
			<VBox
				xmlns="sap.m"
				id="${vBoxId}"
				visible="${dataPointVisible}"
			>
				<Title
				xmlns="sap.m"
				id="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
					level="H3"
					text="${dataModelPath.targetObject?.Title}"
					class="sapUiTinyMarginBottom"
				/>

				${this.getDataPointTemplate(dataModelPath)}
			</VBox>`;
    }

    /**
     * Gets the template for the data point.
     * @param dataModelPath
     * @returns An XML-based string with the definition of the data point template and its labels
     */;
    _proto.getDataPointTemplate = function getDataPointTemplate(dataModelPath) {
      return xml`
			${this.getDataPointFirstLabel(dataModelPath)}
			<internalMacro:DataPoint
				xmlns:internalMacro="sap.fe.macros.internal"
				metaPath="${this.metaPath.getPath()}"
				contextPath="${this.contextPath.getPath()}"
				ariaLabelledBy="${generate(["fe", "HeaderDPTitle", this.converterHeaderFacet.targetAnnotationValue])}"
			>
				<internalMacro:formatOptions>
  					 <internalMacro:DataPointFormatOptions dataPointStyle="large" showLabels="true" iconSize="1.375rem" showEmptyIndicator="true" />
				</internalMacro:formatOptions>
			</internalMacro:DataPoint>
			${this.getDataPointSecondLabel(dataModelPath)}`;
    }

    /**
     * Gets the first label for the data point.
     * @param dataModelPath
     * @returns An XML-based string with the definition of the first label for the data point
     */;
    _proto.getDataPointFirstLabel = function getDataPointFirstLabel(dataModelPath) {
      switch (dataModelPath.targetObject?.Visualization) {
        case "UI.VisualizationType/Rating":
          const text = getHeaderRatingIndicatorText(this.metaPath, dataModelPath.targetObject);
          return xml` <Label text="${text}" visible="${!!(dataModelPath.targetObject?.SampleSize || dataModelPath.targetObject?.Description)}"/>`;
        case "UI.VisualizationType/Progress":
          return xml`<Label text="${dataModelPath.targetObject?.Description}" visible="${!!dataModelPath.targetObject?.Description}"/>`;
        default:
          return "";
      }
    }

    /**
     * Gets the second label for the data point.
     * @param dataModelPath
     * @returns An XML-based string with the definition of the second label for the data point
     */;
    _proto.getDataPointSecondLabel = function getDataPointSecondLabel(dataModelPath) {
      switch (dataModelPath.targetObject?.Visualization) {
        case "UI.VisualizationType/Rating":
          const targetLabelExpression = compileExpression(formatResult([pathInModel("T_HEADER_RATING_INDICATOR_FOOTER", "sap.fe.i18n"), getExpressionFromAnnotation(dataModelPath.targetObject?.Value, getRelativePaths(dataModelPath)), dataModelPath.targetObject?.TargetValue ? getExpressionFromAnnotation(dataModelPath.targetObject?.TargetValue, getRelativePaths(dataModelPath)) : "5"], "MESSAGE"));
          return xml`<Label core:require="{MESSAGE: 'sap/base/strings/formatMessage' }" text="${targetLabelExpression}" visible="true"/>`;
        case "UI.VisualizationType/Progress":
          const secondLabelExpression = dataModelPath.targetObject?.Value?.$target?.annotations?.Common?.Label?.toString();
          return secondLabelExpression ? xml`<Label text="${secondLabelExpression}"/>` : "";
        default:
          return "";
      }
    };
    return HeaderDataPointBlock;
  }(BuildingBlockTemplatingBase), _HeaderDataPointBlock.getPressExpressionForLink = function (navigation, manifestOutbound) {
    if (navigation?.targetOutbound && "outbound" in navigation.targetOutbound) {
      return ".handlers.onDataPointTitlePressed($controller, ${$source>}, " + JSON.stringify(manifestOutbound) + "," + JSON.stringify(navigation.targetOutbound.outbound) + ")";
    } else if (navigation && navigation["targetSections"]) {
      return ".handlers.navigateToSubSection($controller, '" + JSON.stringify(navigation["targetSections"]) + "')";
    } else {
      return undefined;
    }
  }, _HeaderDataPointBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "converterHeaderFacet", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "headerFacet", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = HeaderDataPointBlock;
  return _exports;
}, false);
//# sourceMappingURL=HeaderDataPoint.block-dbg.js.map
