/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"], function (Log) {
  "use strict";

  const SemanticKeyHelper = {
    getSemanticKeys: function (oMetaModel, sEntitySetName) {
      return oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticKey`);
    },
    getSemanticObjectInformation: function (oMetaModel, sEntitySetName) {
      const oSemanticObject = oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticObject`);
      const aSemanticKeys = this.getSemanticKeys(oMetaModel, sEntitySetName);
      return {
        semanticObject: oSemanticObject,
        semanticKeys: aSemanticKeys
      };
    },
    /**
     * Returns a stringified version of a list of key values, e.g. [{name:"aa", value:1}, {name:"bb", value:"foo"}] --> "aa=1,bb='foo'".
     * @param valuePairs
     * @param typeMetadata
     * @returns String
     */
    getPathContent(valuePairs, typeMetadata) {
      const singleKey = valuePairs.length === 1;
      return valuePairs.map(valuePair => {
        const keyValue = valuePair.value;
        const encodedKeyValue = typeMetadata[valuePair.name].$Type === "Edm.String" ? `'${encodeURIComponent(keyValue)}'` : keyValue;
        return singleKey ? encodedKeyValue : `${valuePair.name}=${encodedKeyValue}`;
      }).join(",");
    },
    getSemanticPath: function (oContext) {
      let bStrict = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      const oMetaModel = oContext.getModel().getMetaModel(),
        sEntitySetName = oMetaModel.getMetaContext(oContext.getPath()).getObject("@sapui.name"),
        oSemanticObjectInformation = this.getSemanticObjectInformation(oMetaModel, sEntitySetName);
      let sTechnicalPath, sSemanticPath;
      if (oContext.isA("sap.ui.model.odata.v4.ODataListBinding") && oContext.isRelative()) {
        sTechnicalPath = oContext.getHeaderContext().getPath();
      } else {
        sTechnicalPath = oContext.getPath();
      }
      if (this._isPathForSemantic(sTechnicalPath) && oSemanticObjectInformation.semanticKeys && oSemanticObjectInformation.semanticKeys.length !== 0) {
        const aSemanticKeys = oSemanticObjectInformation.semanticKeys;
        const oEntityType = oMetaModel.getObject("/" + oMetaModel.getObject(`/${sEntitySetName}`).$Type);
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const keyValues = aSemanticKeys.map(semanticKey => {
            const keyName = semanticKey.$PropertyPath;
            const keyValue = oContext.getProperty(keyName);
            if (keyValue === undefined || keyValue === null) {
              throw new Error(`Couldn't resolve semantic key value for ${keyName}`);
            }
            return {
              name: keyName,
              value: keyValue
            };
          });
          const semanticKeysPart = this.getPathContent(keyValues, oEntityType);
          sSemanticPath = `/${sEntitySetName}(${semanticKeysPart})`;
        } catch (e) {
          Log.info(e);
        }
      }
      return bStrict ? sSemanticPath : sSemanticPath || sTechnicalPath;
    },
    // ==============================
    // INTERNAL METHODS
    // ==============================

    _isPathForSemantic: function (sPath) {
      // Only path on root objects allow semantic keys, i.e. sPath = xxx(yyy)
      return /^[^()]+\([^()]+\)$/.test(sPath);
    }
  };
  return SemanticKeyHelper;
}, false);
//# sourceMappingURL=SemanticKeyHelper-dbg.js.map
