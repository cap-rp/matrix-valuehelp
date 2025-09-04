/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/converters/helpers/IssueManager", "./ConverterContext", "./ManifestSettings", "./MetaModelConverter", "./templates/ListReportConverter", "./templates/ObjectPageConverter"], function (IssueManager, ConverterContext, ManifestSettings, MetaModelConverter, ListReportConverter, ObjectPageConverter) {
  "use strict";

  var _exports = {};
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var convertTypes = MetaModelConverter.convertTypes;
  var TemplateType = ManifestSettings.TemplateType;
  var IssueSeverity = IssueManager.IssueSeverity;
  var IssueCategoryType = IssueManager.IssueCategoryType;
  var IssueCategory = IssueManager.IssueCategory;
  // A context path for a page can either point to an EntitySet, a NavigationProperty or a Singleton

  function handleErrorForCollectionFacets(oFacets, oDiagnostics, sEntitySetName, level) {
    oFacets.forEach(oFacet => {
      let Message = `For entity set ${sEntitySetName}`;
      if (oFacet?.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet" && !oFacet?.ID) {
        Message = `${Message}, ` + `level ${level}, the collection facet does not have an ID.`;
        oDiagnostics.addIssue(IssueCategory.Facets, IssueSeverity.High, Message, IssueCategoryType, IssueCategoryType?.Facets?.MissingID);
      }
      if (oFacet?.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet" && level >= 3) {
        Message = `${Message}, collection facet ${oFacet.Label} is not supported at ` + `level ${level}`;
        oDiagnostics.addIssue(IssueCategory.Facets, IssueSeverity.Medium, Message, IssueCategoryType, IssueCategoryType?.Facets?.UnSupportedLevel);
      }
      if (oFacet?.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet" && oFacet?.Facets) {
        handleErrorForCollectionFacets(oFacet?.Facets, oDiagnostics, sEntitySetName, ++level);
        level = level - 1;
      }
    });
  }
  /**
   * Based on a template type, convert the metamodel and manifest definition into a json structure for the page.
   * @param sTemplateType The template type
   * @param oMetaModel The odata model metaModel
   * @param oManifestSettings The current manifest settings
   * @param manifestWrapper
   * @param oDiagnostics The diagnostics wrapper
   * @param sFullContextPath The context path to reach this page
   * @param oCapabilities
   * @param component The template component
   * @returns The target page definition
   */
  function convertPage(sTemplateType, oMetaModel, oManifestSettings, manifestWrapper, oDiagnostics, sFullContextPath, oCapabilities, component) {
    const oConvertedMetadata = convertTypes(oMetaModel, oCapabilities);
    // TODO: This will have incomplete information because the conversion happens lazily
    oConvertedMetadata.diagnostics.forEach(annotationErrorDetail => {
      const checkIfIssueExists = oDiagnostics.checkIfIssueExists(IssueCategory.Annotation, IssueSeverity.High, annotationErrorDetail.message);
      if (!checkIfIssueExists) {
        oDiagnostics.addIssue(IssueCategory.Annotation, IssueSeverity.High, annotationErrorDetail.message);
      }
    });
    oConvertedMetadata?.entityTypes?.forEach(oEntitySet => {
      if (oEntitySet?.annotations?.UI?.Facets) {
        handleErrorForCollectionFacets(oEntitySet?.annotations?.UI?.Facets, oDiagnostics, oEntitySet?.name, 1);
      }
    });
    const sTargetEntitySetName = oManifestSettings.entitySet;
    const sContextPath = oManifestSettings?.contextPath || (sFullContextPath === "/" ? sFullContextPath + sTargetEntitySetName : sFullContextPath);
    const oContext = oMetaModel.createBindingContext(sContextPath);
    const oFullContext = getInvolvedDataModelObjects(oContext);
    if (oFullContext) {
      let oConvertedPage = {};
      const converterContext = new ConverterContext(oConvertedMetadata, manifestWrapper, oDiagnostics, oFullContext);
      switch (sTemplateType) {
        case TemplateType.ListReport:
        case TemplateType.AnalyticalListPage:
          oConvertedPage = ListReportConverter.convertPage(converterContext, oCapabilities);
          break;
        case TemplateType.ObjectPage:
          oConvertedPage = ObjectPageConverter.convertPage(converterContext, oCapabilities);
          break;
        case TemplateType.FreeStylePage:
          break;
      }
      if (component?.extendPageDefinition) {
        oConvertedPage = component.extendPageDefinition(oConvertedPage, converterContext);
      }
      return oConvertedPage;
    }
    return undefined;
  }
  _exports.convertPage = convertPage;
  return _exports;
}, false);
//# sourceMappingURL=TemplateConverter-dbg.js.map
