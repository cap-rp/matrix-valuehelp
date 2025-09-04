/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/core/helpers/MetaPath", "sap/fe/templates/ObjectPage/card/AdaptiveCardContent", "sap/fe/templates/ObjectPage/card/BaseCardContentProvider"], function (Log, MetaPath, AdaptiveCardContent, BaseCardContentProvider) {
  "use strict";

  var _exports = {};
  var getTextBlock = AdaptiveCardContent.getTextBlock;
  var getColumnSet = AdaptiveCardContent.getColumnSet;
  var getColumn = AdaptiveCardContent.getColumn;
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Get image and title for card.
   * @param convertedTypes Converted Metadata.
   * @param config Card Configuration.
   * @experimental
   */
  let HeaderTitle = /*#__PURE__*/function (_BaseCardContentProvi) {
    function HeaderTitle(convertedTypes, config) {
      var _this;
      _this = _BaseCardContentProvi.call(this, convertedTypes, config) || this;
      const {
        contextPath
      } = _this.getCardConfigurationByKey("contextInfo");
      let headerInfo;
      try {
        const headerInfoMetaPath = new MetaPath(convertedTypes, `${contextPath}@${"com.sap.vocabularies.UI.v1.HeaderInfo"}`, contextPath);
        const headerDetails = _this.getHeaderTitleandDescription(headerInfoMetaPath);
        headerInfo = {
          headerTitle: headerDetails?.headerTitle,
          description: headerDetails?.description,
          appTitle: _this.getCardConfigurationByKey("objectTitle"),
          appUrl: _this.getCardConfigurationByKey("appUrl")
        };
        _this.cardColumnSet = _this.createHeaderTitle(headerInfo);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        Log.error("Error while creating the card defintion", message);
      }
      return _this || _assertThisInitialized(_this);
    }

    /**
     * Generates Header title for adaptive card.
     * @param headerInfoMetaPath HeaderInfo MetaPath
     * @returns Returns Header Title of the object page
     */
    _exports = HeaderTitle;
    _inheritsLoose(HeaderTitle, _BaseCardContentProvi);
    var _proto = HeaderTitle.prototype;
    /**
     * Get image and title in column set.
     * @returns Column set.
     */
    _proto.getTitle = function getTitle() {
      return this.cardColumnSet;
    };
    _proto.getHeaderTitleandDescription = function getHeaderTitleandDescription(headerInfoMetaPath) {
      const headerInfoTarget = headerInfoMetaPath?.getTarget();
      const headerInfoTitle = headerInfoTarget?.Title;
      const headerInfoDescription = headerInfoTarget?.Description;
      let title, headerTitle, textProperty, textpropertyAnnotation, description, descriptiontextpropertyAnnotation, descriptiontextProperty, headerDescription;
      if (headerInfoTitle) {
        switch (headerInfoTitle.$Type) {
          case "com.sap.vocabularies.UI.v1.DataField":
            title = headerInfoMetaPath?.getMetaPathForObject(headerInfoTitle?.Value);
            textpropertyAnnotation = title?.getTarget()?.annotations?.Common?.Text;
            textProperty = textpropertyAnnotation && headerInfoMetaPath?.getMetaPathForObject(textpropertyAnnotation);
            break;
          case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
            title = headerInfoTarget?.TypeName.toString();
            break;
        }
      }
      if (title) {
        const titleValueBinding = this.getValueBinding(title, textProperty);
        headerTitle = titleValueBinding;
      }
      if (headerInfoDescription) {
        switch (headerInfoDescription.$Type) {
          case "com.sap.vocabularies.UI.v1.DataField":
            description = headerInfoMetaPath?.getMetaPathForObject(headerInfoDescription?.Value);
            descriptiontextpropertyAnnotation = description?.getTarget()?.annotations?.Common?.Text;
            descriptiontextProperty = descriptiontextpropertyAnnotation && headerInfoMetaPath?.getMetaPathForObject(descriptiontextpropertyAnnotation);
            break;
          default:
            break;
        }
      }
      if (description) {
        const descriptionValueBinding = this.getValueBinding(description, descriptiontextProperty);
        headerDescription = descriptionValueBinding;
      }
      return {
        headerTitle: headerTitle,
        description: headerDescription
      };
    }

    /**
     * Generates Header Image and Title column sets.
     * @param headerInfo HeaderInfo with title and header description information.
     * @returns An Array of ColumnSets for Image and Title.
     */;
    _proto.createHeaderTitle = function createHeaderTitle(headerInfo) {
      let appTitle, headerTitle, subTitle;
      const items = [];
      const columns = [];
      if (headerInfo?.appTitle) {
        appTitle = getTextBlock({
          size: "Medium",
          weight: "Bolder",
          text: headerInfo?.appTitle,
          maxLines: 3,
          wrap: true
        });
        items.push(appTitle);
      }
      if (headerInfo?.headerTitle) {
        headerTitle = getTextBlock({
          size: "Default",
          weight: "Bolder",
          text: `[ ${headerInfo?.headerTitle} ](${headerInfo?.appUrl})`,
          maxLines: 1,
          spacing: "None"
        });
        items.push(headerTitle);
      }
      if (headerInfo?.description) {
        subTitle = getTextBlock({
          size: "Default",
          text: headerInfo?.description,
          maxLines: 1,
          spacing: "None"
        });
        items.push(subTitle);
      }
      columns.push(getColumn({
        items: [...items]
      }));
      return getColumnSet(columns) ?? undefined;
    };
    return HeaderTitle;
  }(BaseCardContentProvider);
  _exports = HeaderTitle;
  return _exports;
}, false);
//# sourceMappingURL=HeaderTitle-dbg.js.map
