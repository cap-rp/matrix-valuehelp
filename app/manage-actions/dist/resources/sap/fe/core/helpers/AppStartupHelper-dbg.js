/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/model/Filter", "sap/ui/model/FilterOperator", "../converters/MetaModelConverter", "./ModelHelper", "./SemanticKeyHelper"], function (Filter, FilterOperator, MetaModelConverter, ModelHelper, SemanticKeyHelper) {
  "use strict";

  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  const AppStartupHelper = {
    /**
     * Retrieves a set of key values from startup parameters.
     * @param aKeyNames The array of key names
     * @param oStartupParameters The startup parameters
     * @returns An array of pairs \{name, value\} if all key values could be found in the startup parameters, undefined otherwise
     */
    _getKeysFromStartupParams: function (aKeyNames, oStartupParameters) {
      let bAllFound = true;
      const aKeys = aKeyNames.map(name => {
        if (oStartupParameters?.[name] && oStartupParameters[name].length === 1) {
          return {
            name,
            value: oStartupParameters[name][0]
          };
        } else {
          // A unique key value couldn't be found in the startup parameters
          bAllFound = false;
          return {
            name,
            value: ""
          };
        }
      });
      return bAllFound ? aKeys : undefined;
    },
    /**
     * Creates a filter from a list of key values.
     * @param aKeys Array of semantic keys or technical keys (with values)
     * @param bDraftMode True if the entity supports draft mode
     * @param oMetaModel The metamodel
     * @returns The filter
     */
    _createFilterFromKeys: function (aKeys, bDraftMode, oMetaModel) {
      const bFilterCaseSensitive = ModelHelper.isFilteringCaseSensitive(oMetaModel);
      let bFilterOnActiveEntity = false;
      const aFilters = aKeys.map(key => {
        if (key.name === "IsActiveEntity") {
          bFilterOnActiveEntity = true;
        }
        return new Filter({
          path: key.name,
          operator: FilterOperator.EQ,
          value1: key.value,
          caseSensitive: bFilterCaseSensitive
        });
      });
      if (bDraftMode && !bFilterOnActiveEntity) {
        const oDraftFilter = new Filter({
          filters: [new Filter("IsActiveEntity", "EQ", false), new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
          and: false
        });
        aFilters.push(oDraftFilter);
      }
      return new Filter(aFilters, true);
    },
    /**
     * Makes sure key values have the correct format.
     * This is to handle special cases, for example, where Boolean values are 'X' or '', or guid values have the following format: guid'00000000-0000-0000-0000-000000000000'.".
     * @param keys
     * @param entityType
     */
    _sanitizeKeys: function (keys, entityType) {
      keys.forEach(key => {
        const propertyType = entityType[key.name].$Type;
        switch (propertyType) {
          case "Edm.Boolean":
            if (key.value !== "true" && key.value !== "false") {
              // If the value is neither "true" nor "false", it's considered as false if it contains only whitespaces (e.g. to handle 'X'/'' for true/false values)
              key.value = key.value.trim().length ? "true" : "false";
            }
            break;
          case "Edm.Guid":
            {
              const match = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.exec(key.value);
              key.value = match ? match[0] : key.value;
              break;
            }
          default:
          // Do nothing
        }
      });
    },
    /**
     * Loads all contexts for a list of page infos.
     * @param aStartupPages The list of page infos
     * @param oModel The model used to load the contexts
     * @returns A Promise for all contexts
     */
    _requestObjectsFromParameters: async function (aStartupPages, oModel) {
      // Load the respective objects for all object pages found in aExternallyNavigablePages
      const aContextPromises = aStartupPages.map(async pageInfo => {
        const entityType = oModel.getMetaModel().getObject(`${pageInfo.contextPath}/`);
        if (pageInfo.technicalKeys) {
          this._sanitizeKeys(pageInfo.technicalKeys, entityType);
          // Create a context with the proper path
          const path = `${pageInfo.contextPath}(${SemanticKeyHelper.getPathContent(pageInfo.technicalKeys, entityType)})`;
          const context = oModel.bindContext(path).getBoundContext();
          return Promise.resolve([context]);
        } else {
          const aKeys = pageInfo.semanticKeys ?? [];
          this._sanitizeKeys(aKeys, entityType);
          const oFilter = this._createFilterFromKeys(aKeys, pageInfo.draftMode, oModel.getMetaModel());

          // only request a minimum of fields to boost backend performance since this is only used to check if an object exists
          const oListBind = oModel.bindList(pageInfo.contextPath, undefined, undefined, oFilter, {
            $select: aKeys.map(key => {
              return key.name;
            }).join(",")
          });
          return oListBind.requestContexts(0, 2);
        }
      });
      return Promise.all(aContextPromises);
    },
    /**
     * Returns the rightmost target name for a given route.
     * @param route
     * @param manifestRouting
     * @returns The target name (or undefined if no valid target was found)
     */
    _getRightMostTargetName(route, manifestRouting) {
      if (Array.isArray(route.target)) {
        // Get the rightmost target for this route (ignore targets corresponding to reuse components)
        const reverseTargets = [...route.target].reverse();
        return reverseTargets.find(targetID => {
          const currentTarget = manifestRouting?.targets?.[targetID];
          return currentTarget?.name && ["sap.fe.templates.ListReport", "sap.fe.templates.ObjectPage", "sap.fe.core.fpm"].includes(currentTarget.name);
        });
      } else {
        return route.target;
      }
    },
    /**
     * Creates a PageInfo from a route if it's reachable from the startup parameters.
     * @param oRoute The route
     * @param oManifestRouting The app manifest routing section
     * @param oStartupParameters The startup parameters
     * @param oMetaModel The app metamodel
     * @returns A page info if the page is reachable, undefined otherwise
     */
    _getReachablePageInfoFromRoute: function (oRoute, oManifestRouting, oStartupParameters, oMetaModel) {
      // Remove trailing ':?query:' and '/'
      let sPattern = oRoute.pattern.replace(":?query:", "");
      sPattern = sPattern.replace(/\/$/, "");
      if (!sPattern || !sPattern.endsWith(")")) {
        // Ignore level-0 routes (ListReport) or routes corresponding to a 1-1 relation (no keys in the URL in this case)
        return undefined;
      }
      sPattern = sPattern.replace(/\(\{[^}]*\}\)/g, "(#)"); // Replace keys with #

      const sTargetName = this._getRightMostTargetName(oRoute, oManifestRouting);
      if (!sTargetName) {
        // No target found for this route
        return undefined;
      }
      const oTarget = oManifestRouting?.targets?.[sTargetName];
      const aPatternSegments = sPattern.split("/");
      const pageLevel = aPatternSegments.length - 1;
      if (pageLevel !== 0 && oTarget?.options?.settings?.allowDeepLinking !== true) {
        // The first level of object page allows deep linking by default.
        // Otherwise, the target must allow deep linking explicitely in the manifest
        return undefined;
      }
      let sContextPath = "";
      if (oTarget?.options?.settings?.entitySet) {
        sContextPath = `/${oTarget.options.settings.entitySet}`;
      } else if (oTarget?.options?.settings?.contextPath) {
        const metaContext = oMetaModel.createBindingContext(oTarget.options.settings.contextPath);
        const objectPath = getInvolvedDataModelObjects(metaContext);
        if (objectPath.targetEntitySet) {
          sContextPath = `/${objectPath.targetEntitySet.name}`;
        }
      }
      if (!sContextPath) {
        return undefined;
      }
      const oEntityType = sContextPath && oMetaModel.getObject(`/$EntityContainer${sContextPath}/`);
      if (!oEntityType) {
        return undefined;
      }

      // Get the semantic key values for the entity
      let semanticKeyNames = oMetaModel.getObject(`/$EntityContainer${sContextPath}/@com.sap.vocabularies.Common.v1.SemanticKey`)?.map(semKey => {
        return semKey.$PropertyPath;
      });

      // If we're on a first level object page and the semantic keys are the same as the technical keys, we use technical keys directly,
      // to avoid the additional query used to load the object from its semantic keys in _requestObjectsFromParameters
      const technicalKeyNames = oEntityType["$Key"];
      if (pageLevel === 0 && semanticKeyNames && semanticKeyNames.length === technicalKeyNames.length && semanticKeyNames.every(key => technicalKeyNames.includes(key))) {
        semanticKeyNames = undefined;
      }
      const aSemantickKeys = semanticKeyNames ? this._getKeysFromStartupParams(semanticKeyNames, oStartupParameters) : undefined;

      // Get the technical keys only if we couldn't find the semantic key values, and on first level OP
      const aTechnicalKeys = !aSemantickKeys && pageLevel === 0 ? this._getKeysFromStartupParams(technicalKeyNames, oStartupParameters) : undefined;
      if (aSemantickKeys === undefined && aTechnicalKeys === undefined) {
        // We couldn't find the semantic/technical keys in the startup parameters
        return undefined;
      }

      // The startup parameters contain values for all semantic keys (or technical keys) --> we can store the page info in the corresponding level
      const draftMode = oMetaModel.getObject(`/$EntityContainer${sContextPath}@com.sap.vocabularies.Common.v1.DraftRoot`) || oMetaModel.getObject(`/$EntityContainer${sContextPath}@com.sap.vocabularies.Common.v1.DraftNode`) ? true : false;
      return {
        pattern: sPattern,
        contextPath: sContextPath,
        draftMode,
        technicalKeys: aTechnicalKeys,
        semanticKeys: aSemantickKeys,
        target: sTargetName,
        pageLevel
      };
    },
    /**
     * Returns the list of all pages that allow deeplink and that can be reached using the startup parameters.
     * @param oManifestRouting The routing information from the app manifest
     * @param oStartupParameters The startup parameters
     * @param oMetaModel The metamodel
     * @returns The reachable pages
     */
    _getReachablePages: function (oManifestRouting, oStartupParameters, oMetaModel) {
      const aRoutes = oManifestRouting?.routes ?? [];
      const mPagesByLevel = {};
      aRoutes.forEach(oRoute => {
        const oPageInfo = this._getReachablePageInfoFromRoute(oRoute, oManifestRouting, oStartupParameters, oMetaModel);
        if (oPageInfo) {
          if (!mPagesByLevel[oPageInfo.pageLevel]) {
            mPagesByLevel[oPageInfo.pageLevel] = [];
          }
          mPagesByLevel[oPageInfo.pageLevel].push(oPageInfo);
        }
      });

      // A page is reachable only if all its parents are also reachable
      // So if we couldn't find any pages for a given level, all pages with a higher level won't be reachable anyway
      const aReachablePages = [];
      let level = 0;
      while (mPagesByLevel[level]) {
        aReachablePages.push(mPagesByLevel[level]);
        level++;
      }
      return aReachablePages;
    },
    /**
     * Get the list of startup pages.
     * @param oManifestRouting The routing information from the app manifest
     * @param oStartupParameters The startup parameters
     * @param oMetaModel The metamodel
     * @returns An array of startup page infos
     */
    _getStartupPagesFromStartupParams: function (oManifestRouting, oStartupParameters, oMetaModel) {
      // Find all pages that can be reached with the startup parameters
      const aReachablePages = this._getReachablePages(oManifestRouting, oStartupParameters, oMetaModel);
      if (aReachablePages.length === 0) {
        return [];
      }

      // Find the longest sequence of pages that can be reached (recursively)
      let result = [];
      const current = [];
      function findRecursive(level) {
        const aCurrentLevelPages = aReachablePages[level];
        const lastPage = current.length ? current[current.length - 1] : undefined;
        if (aCurrentLevelPages) {
          aCurrentLevelPages.forEach(function (nextPage) {
            if (!lastPage || nextPage.pattern.indexOf(lastPage.pattern) === 0) {
              // We only consider pages that can be reached from the page at the previous level,
              // --> their pattern must be the pattern of the previous page with another segment appended
              current.push(nextPage);
              findRecursive(level + 1);
              current.pop();
            }
          });
        }
        if (current.length > result.length) {
          result = current.slice(); // We have found a sequence longer than our previous best --> store it as the new longest
        }
      }
      findRecursive(0);
      return result;
    },
    /**
     * Creates the startup object from the list of pages and contexts.
     * @param aStartupPages The pages
     * @param aContexts The contexts
     * @returns An object containing either a hash or a context to navigate to, or an empty object if no deep link was found
     */
    _getDeepLinkObject: function (aStartupPages, aContexts) {
      if (aContexts.length === 1) {
        return {
          context: aContexts[0]
        };
      } else if (aContexts.length > 1) {
        // Navigation to a deeper level --> use the pattern of the deepest object page
        // and replace the parameters by the ID from the contexts
        let hash = aStartupPages[aStartupPages.length - 1].pattern;
        aContexts.forEach(function (oContext) {
          hash = hash.replace("(#)", `(${oContext.getPath().split("(")[1]}`);
        });
        return {
          hash
        };
      } else {
        return {};
      }
    },
    /**
     * Calculates startup parameters for a deeplink case, from startup parameters and routing information.
     * @param oManifestRouting The routing information from the app manifest
     * @param oStartupParameters The startup parameters
     * @param oModel The OData model
     * @returns An object containing either a hash or a context to navigate to, or an empty object if no deep link was found
     */
    getDeepLinkStartupHash: async function (oManifestRouting, oStartupParameters, oModel) {
      await oModel.getMetaModel().requestObject("/$EntityContainer/");

      // Check if semantic keys are present in url parameters for every object page at each level
      const startupPages = this._getStartupPagesFromStartupParams(oManifestRouting, oStartupParameters, oModel.getMetaModel());

      // Load the contexts
      const allContexts = await this._requestObjectsFromParameters(startupPages, oModel);
      if (allContexts.length) {
        // Make sure we only get 1 context per promise, and flatten the array
        const contextsForStartup = [];
        allContexts.forEach(function (foundContexts) {
          if (foundContexts.length === 1) {
            contextsForStartup.push(foundContexts[0]);
          }
        });
        return contextsForStartup.length === allContexts.length ? this._getDeepLinkObject(startupPages, contextsForStartup) : {};
      } else {
        return {};
      }
    },
    /**
     * Calculates the new hash based on the startup parameters.
     * @param oStartupParameters The startup parameter values (map parameter name -> array of values)
     * @param sContextPath The context path for the startup of the app (generally the path to the main entity set)
     * @param oRouter The router instance
     * @param oMetaModel The meta model
     * @returns A promise containing the hash to navigate to, or an empty string if there's no need to navigate
     */
    getCreateStartupHash: async function (oStartupParameters, sContextPath, oRouter, oMetaModel) {
      return oMetaModel.requestObject(`${sContextPath}@`).then(oEntitySetAnnotations => {
        let sMetaPath = "";
        let bCreatable = true;
        if (oEntitySetAnnotations["@com.sap.vocabularies.Common.v1.DraftRoot"] && oEntitySetAnnotations["@com.sap.vocabularies.Common.v1.DraftRoot"]["NewAction"]) {
          sMetaPath = `${sContextPath}@com.sap.vocabularies.Common.v1.DraftRoot/NewAction@Org.OData.Core.V1.OperationAvailable`;
        } else if (oEntitySetAnnotations["@com.sap.vocabularies.Session.v1.StickySessionSupported"] && oEntitySetAnnotations["@com.sap.vocabularies.Session.v1.StickySessionSupported"]["NewAction"]) {
          sMetaPath = `${sContextPath}@com.sap.vocabularies.Session.v1.StickySessionSupported/NewAction@Org.OData.Core.V1.OperationAvailable`;
        }
        if (sMetaPath) {
          const bNewActionOperationAvailable = oMetaModel.getObject(sMetaPath);
          if (bNewActionOperationAvailable === false) {
            bCreatable = false;
          }
        } else {
          const oInsertRestrictions = oEntitySetAnnotations["@Org.OData.Capabilities.V1.InsertRestrictions"];
          if (oInsertRestrictions && oInsertRestrictions.Insertable === false) {
            bCreatable = false;
          }
        }
        if (bCreatable) {
          return this.getDefaultCreateHash(oStartupParameters, sContextPath, oRouter);
        } else {
          return "";
        }
      });
    },
    /**
     * Calculates the hash to create a new object.
     * @param oStartupParameters The startup parameter values (map parameter name -> array of values)
     * @param sContextPath The context path of the entity set to be used for the creation
     * @param oRouter The router instance
     * @returns The hash
     */
    getDefaultCreateHash: function (oStartupParameters, sContextPath, oRouter) {
      let sDefaultCreateHash = oStartupParameters && oStartupParameters.preferredMode ? oStartupParameters.preferredMode[0] : "create";
      let sHash = "";
      sDefaultCreateHash = sDefaultCreateHash.includes(":") && sDefaultCreateHash.length > sDefaultCreateHash.indexOf(":") + 1 ? sDefaultCreateHash.substring(0, sDefaultCreateHash.indexOf(":")) : "create";
      sHash = `${sContextPath.substring(1)}(...)?i-action=${sDefaultCreateHash}`;
      if (oRouter.getRouteInfoByHash(sHash)) {
        return sHash;
      } else {
        throw new Error(`No route match for creating a new ${sContextPath.substring(1)}`);
      }
    },
    /**
     * Verifies whether the entity in the given context path is editable by looking at the following annotations:
     *
     * - @Core.OperationAvailable of the edit action
     * - @UI.UpdateHidden
     *
     * Only static values (true/false) are considered here as we don't have the actual binding context to evaluate dynamic bindings.
     * @param contextPath
     * @param metaModel
     * @returns Whether the entity is editable or not
     */
    verifyEditAnnotations: async function (contextPath, metaModel) {
      const entitySetAnnotations = await metaModel.requestObject(`${contextPath}@`);
      const updateHidden = entitySetAnnotations?.["@com.sap.vocabularies.UI.v1.UpdateHidden"];
      let operationAvailable = true;
      if (entitySetAnnotations?.["@com.sap.vocabularies.Common.v1.DraftRoot"]?.["EditAction"]) {
        operationAvailable = metaModel.getObject(`${contextPath}@com.sap.vocabularies.Common.v1.DraftRoot/EditAction@Org.OData.Core.V1.OperationAvailable`);
      }
      return operationAvailable !== false && updateHidden !== true;
    }
  };
  return AppStartupHelper;
}, false);
//# sourceMappingURL=AppStartupHelper-dbg.js.map
