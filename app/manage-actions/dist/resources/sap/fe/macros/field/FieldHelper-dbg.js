/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/helpers/Key", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/templating/FieldControlHelper", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/CommonHelper", "sap/fe/macros/internal/valuehelp/ValueListHelper", "sap/ui/model/odata/v4/AnnotationHelper"], function (Log, BindingToolkit, CommonUtils, MetaModelConverter, Key, BindingHelper, ModelHelper, StableIdHelper, FieldControlHelper, PropertyHelper, UIFormatters, CommonHelper, ValueListHelper, AnnotationHelper) {
  "use strict";

  var getAlignmentExpression = UIFormatters.getAlignmentExpression;
  var hasValueListForValidation = PropertyHelper.hasValueListForValidation;
  var isRequiredExpression = FieldControlHelper.isRequiredExpression;
  var generate = StableIdHelper.generate;
  var UI = BindingHelper.UI;
  var KeyHelper = Key.KeyHelper;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  const ISOCurrency = "@Org.OData.Measures.V1.ISOCurrency",
    Unit = "@Org.OData.Measures.V1.Unit";
  const FieldHelper = {
    getActionParameterVisibility: function (oParam, oContext) {
      // To use the UI.Hidden annotation for controlling visibility the value needs to be negated
      if (typeof oParam === "object") {
        const oParamIf = oParam;
        if (oParamIf && oParamIf.$If && oParamIf.$If.length === 3) {
          // In case the UI.Hidden contains a dynamic expression we do this
          // by just switching the "then" and "else" part of the erpression
          // oParam.$If[0] <== Condition part
          // oParam.$If[1] <== Then part
          // oParam.$If[2] <== Else part
          const oNegParam = {
            $If: []
          };
          oNegParam.$If[0] = oParamIf.$If[0];
          oNegParam.$If[1] = oParamIf.$If[2];
          oNegParam.$If[2] = oParamIf.$If[1];
          return AnnotationHelper.value(oNegParam, oContext);
        } else {
          return "{= !%{" + oParam.$Path + "} }";
        }
      } else if (typeof oParam === "boolean") {
        return AnnotationHelper.value(!oParam, oContext);
      } else {
        return undefined;
      }
    },
    /**
     * Computed annotation that returns vProperty for a string and @sapui.name for an object.
     * @param vProperty The property
     * @param oInterface The interface instance
     * @returns The property name
     */
    propertyName: function (vProperty, oInterface) {
      let sPropertyName;
      if (typeof vProperty === "string") {
        if (oInterface.context.getPath().includes("$Path") || oInterface.context.getPath().includes("$PropertyPath")) {
          // We could end up with a pure string property (no $Path), and this is not a real property in that case
          sPropertyName = vProperty;
        }
      } else if (vProperty.$Path || vProperty.$PropertyPath) {
        const sPath = vProperty.$Path ? "/$Path" : "/$PropertyPath";
        const sContextPath = oInterface.context.getPath();
        sPropertyName = oInterface.context.getObject(`${sContextPath + sPath}/$@sapui.name`);
      } else if (vProperty.Value && vProperty.Value.$Path) {
        sPropertyName = vProperty.Value.$Path;
      } else {
        sPropertyName = oInterface.context.getObject("@sapui.name");
      }
      return sPropertyName;
    },
    fieldControl: function (sPropertyPath, oInterface) {
      // editable header facet
      const oModel = oInterface && oInterface.context.getModel();
      const sPath = oInterface && oInterface.context.getPath();
      const oFieldControlContext = oModel && oModel.createBindingContext(`${sPath}@com.sap.vocabularies.Common.v1.FieldControl`);
      const oFieldControl = oFieldControlContext && oFieldControlContext.getProperty();
      if (oFieldControl) {
        if (oFieldControl.hasOwnProperty("$EnumMember")) {
          return oFieldControl.$EnumMember;
        } else if (oFieldControl.hasOwnProperty("$Path")) {
          return AnnotationHelper.value(oFieldControl, {
            context: oFieldControlContext
          });
        }
      } else {
        return undefined;
      }
    },
    /**
     * Method to get the value help property from a DataField or a PropertyPath (in case a SelectionField is used)
     * Priority from where to get the property value of the field (examples are "Name" and "Supplier"):
     * 1. If oPropertyContext.getObject() has key '$Path', then we take the value at '$Path'.
     * 2. Else, value at oPropertyContext.getObject().
     * If there is an ISOCurrency or if there are Unit annotations for the field property,
     * then the Path at the ISOCurrency or Unit annotations of the field property is considered.
     * @param oPropertyContext The context from which value help property need to be extracted.
     * @param bInFilterField Whether or not we're in the filter field and should ignore
     * @returns The value help property path
     */
    valueHelpProperty: function (oPropertyContext, bInFilterField) {
      /* For currency (and later Unit) we need to forward the value help to the annotated field */
      const sContextPath = oPropertyContext.getPath();
      const oContent = oPropertyContext.getObject() || {};
      let sPath = oContent.$Path ? `${sContextPath}/$Path` : sContextPath;
      const sAnnoPath = `${sPath}@`;
      const oPropertyAnnotations = oPropertyContext.getObject(sAnnoPath);
      let sAnnotation;
      if (oPropertyAnnotations) {
        sAnnotation = oPropertyAnnotations.hasOwnProperty(ISOCurrency) && ISOCurrency || oPropertyAnnotations.hasOwnProperty(Unit) && Unit;
        if (sAnnotation && !bInFilterField) {
          const sUnitOrCurrencyPath = `${sPath + sAnnotation}/$Path`;
          // we check that the currency or unit is a Property and not a fixed value
          if (oPropertyContext.getObject(sUnitOrCurrencyPath)) {
            sPath = sUnitOrCurrencyPath;
          }
        }
      }
      return sPath;
    },
    /**
     * Dedicated method to avoid looking for unit properties.
     * @param oPropertyContext
     * @returns The value help property path
     */
    valueHelpPropertyForFilterField: function (oPropertyContext) {
      return FieldHelper.valueHelpProperty(oPropertyContext, true);
    },
    /**
     * Method to generate the ID for Value Help.
     * @param sFlexId Flex ID of the current object
     * @param sIdPrefix Prefix for the ValueHelp ID
     * @param sOriginalPropertyName Name of the property
     * @param sPropertyName Name of the ValueHelp Property
     * @returns The ID generated for the ValueHelp
     */
    getIDForFieldValueHelp: function (sFlexId, sIdPrefix, sOriginalPropertyName, sPropertyName) {
      if (sFlexId) {
        return sFlexId;
      }
      let sProperty = sPropertyName;
      if (sOriginalPropertyName !== sPropertyName) {
        sProperty = `${sOriginalPropertyName}::${sPropertyName}`;
      }
      return generate([sIdPrefix, sProperty]);
    },
    /*
     * Method to get the valueHelp property of the FilterField.
     *
     * @function
     * @name getValueHelpPropertyForFilterField
     * @memberof sap.fe.macros.field.FieldHelper.js
     * @param propertyContext Property context for filter field
     * @param oProperty The object of the ValueHelp property
     * @param sPropertyType The $Type of the property
     * @param sVhIdPrefix The ID prefix of the value help
     * @param sPropertyName The name of the property
     * @param sValueHelpPropertyName The property name of the value help
     * @param bHasValueListWithFixedValues `true` if there is a value list with a fixed value annotation
     * @param bUseSemanticDateRange `true` if the semantic date range is set to 'true' in the manifest
     * @returns The field help property of the value help
     */
    getValueHelpPropertyForFilterField: function (propertyContext, oProperty, sPropertyType, sVhIdPrefix, sEntityType, sPropertyName, sValueHelpPropertyName, bHasValueListWithFixedValues, bUseSemanticDateRange) {
      const sProperty = FieldHelper.propertyName(oProperty, {
          context: propertyContext
        }),
        bSemanticDateRange = bUseSemanticDateRange === "true" || bUseSemanticDateRange === true;
      const oModel = propertyContext.getModel(),
        sPropertyPath = propertyContext.getPath(),
        sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
        oFilterRestrictions = CommonUtils.getFilterRestrictionsByPath(sPropertyLocationPath, oModel);
      if ((sPropertyType === "Edm.DateTimeOffset" || sPropertyType === "Edm.Date" || sPropertyType === "Edm.TimeOfDay") && bSemanticDateRange && oFilterRestrictions && oFilterRestrictions.FilterAllowedExpressions && oFilterRestrictions.FilterAllowedExpressions[sProperty] && (oFilterRestrictions.FilterAllowedExpressions[sProperty].includes("SingleRange") || oFilterRestrictions.FilterAllowedExpressions[sProperty].includes("SingleValue")) || sPropertyType === "Edm.Boolean" && !bHasValueListWithFixedValues) {
        return undefined;
      }
      return FieldHelper.getIDForFieldValueHelp(null, sVhIdPrefix || "FilterFieldValueHelp", sPropertyName, sValueHelpPropertyName);
    },
    /*
     * Method to compute the delegate with payload
     * @function
     * @param {object} delegateName - name of the delegate methode
     * @param {boolean} retrieveTextFromValueList - added to the payload of the delegate methode
     * @return {object} - returns the delegate with payload
     */
    computeFieldBaseDelegate: function (delegateName, retrieveTextFromValueList) {
      if (retrieveTextFromValueList) {
        return {
          name: delegateName,
          payload: {
            retrieveTextFromValueList: retrieveTextFromValueList
          }
        };
      }
      return {
        name: delegateName
      };
    },
    _getPrimaryIntents: async function (appComponent, semanticObjectsList) {
      const promises = [];
      const navigationService = appComponent.getShellServices();
      semanticObjectsList.forEach(function (semObject) {
        promises.push(navigationService.getPrimaryIntent(semObject));
      });
      return Promise.all(promises).then(function (semanticObjectPrimaryActions) {
        return semanticObjectPrimaryActions;
      }).catch(function (oError) {
        Log.error("Error fetching primary intents", oError);
        return [];
      });
    },
    /**
     * Finds the primary action within intents based on the provided parameters.
     * @param primaryIntentsFromNavigationService The registered primary intents from the navigation service.
     * @param payload The registered payload.
     * @returns
     *
     *
     *  An object containing information about the primary action within intents.
     */
    findPrimaryActionWithinIntents: function (primaryIntentsFromNavigationService, payload) {
      const firstPrimaryActionIndex = primaryIntentsFromNavigationService.findIndex(action => !!action);
      const primaryIntentFound = primaryIntentsFromNavigationService[firstPrimaryActionIndex];
      const semanticObjectWithPrimaryAction = payload.semanticObjects[firstPrimaryActionIndex];
      return {
        semanticObjectWithPrimaryAction: semanticObjectWithPrimaryAction,
        primaryIntentFound: primaryIntentFound
      };
    },
    _checkIfSemanticObjectsHasPrimaryAction: function (payload, primaryIntentsFromNavigationService, appComponent) {
      const _fnIsSemanticObjectActionUnavailable = function (payloadResolved, primaryIntent, _index) {
        for (const unavailableActionsIndex in payloadResolved.semanticObjectUnavailableActions[_index].actions) {
          if (primaryIntent.intent.split("-")[1].indexOf(payloadResolved.semanticObjectUnavailableActions[_index].actions[unavailableActionsIndex]) === 0) {
            return false;
          }
        }
        return true;
      };
      payload.semanticPrimaryActions = primaryIntentsFromNavigationService;
      const {
        semanticObjectWithPrimaryAction,
        primaryIntentFound
      } = this.findPrimaryActionWithinIntents(primaryIntentsFromNavigationService, payload);
      const currentHash = appComponent.getShellServices().getHash();
      // Remove the intent parameters before checking with the current hash
      if (!!primaryIntentFound && primaryIntentFound.intent.split("?")[0] !== currentHash) {
        for (let index = 0; index < payload.semanticObjectUnavailableActions.length; index++) {
          if (payload.semanticObjectUnavailableActions[index].semanticObject === semanticObjectWithPrimaryAction) {
            return _fnIsSemanticObjectActionUnavailable(payload, primaryIntentFound, index);
          }
        }
        return true;
      }
      return false;
    },
    checkPrimaryActions: async function (payload, bGetTitleLink, appComponent) {
      return this._getPrimaryIntents(appComponent, payload && payload.semanticObjects).then(aSemanticObjectsPrimaryActions => {
        return bGetTitleLink ? {
          titleLink: aSemanticObjectsPrimaryActions,
          hasTitleLink: this._checkIfSemanticObjectsHasPrimaryAction(payload, aSemanticObjectsPrimaryActions, appComponent),
          payload: payload
        } : this._checkIfSemanticObjectsHasPrimaryAction(payload, aSemanticObjectsPrimaryActions, appComponent);
      }).catch(function (oError) {
        Log.error("Error in checkPrimaryActions", oError);
      });
    },
    _getTitleLinkWithParameters: function (semanticObjectModel, _linkIntent) {
      if (semanticObjectModel && semanticObjectModel.titleLink) {
        return semanticObjectModel.titleLink;
      } else {
        return _linkIntent;
      }
    },
    getPrimaryAction: function (payload) {
      const primaryIntent = payload.semanticPrimaryActions?.find(primaryAction => !!primaryAction);
      return FieldHelper._getTitleLinkWithParameters(payload, primaryIntent?.intent);
    },
    /**
     * Method to fetch the filter restrictions. Filter restrictions can be annotated on an entity set or a navigation property.
     * Depending on the path to which the control is bound, we check for filter restrictions on the context path of the control,
     * or on the navigation property (if there is a navigation).
     * Eg. If the table is bound to '/EntitySet', for property path '/EntitySet/_Association/PropertyName', the filter restrictions
     * on '/EntitySet' win over filter restrictions on '/EntitySet/_Association'.
     * If the table is bound to '/EntitySet/_Association', the filter restrictions on '/EntitySet/_Association' win over filter
     * retrictions on '/AssociationEntitySet'.
     * @param oContext Property Context
     * @param oProperty Property object in the metadata
     * @param bUseSemanticDateRange Boolean Suggests if semantic date range should be used
     * @param sSettings Stringified object of the property settings
     * @param contextPath Path to which the parent control (the table or the filter bar) is bound
     * @returns String containing comma-separated list of operators for filtering
     */
    operators: function (oContext, oProperty, bUseSemanticDateRange, sSettings, contextPath) {
      // this is used in FilterField.block
      if (!oProperty || !contextPath) {
        return undefined;
      }
      let operators;
      const sProperty = FieldHelper.propertyName(oProperty, {
        context: oContext
      });
      const oModel = oContext.getModel(),
        sPropertyPath = oContext.getPath(),
        sPropertyLocationPath = CommonHelper.getLocationForPropertyPath(oModel, sPropertyPath),
        propertyType = oProperty.$Type;
      if (propertyType === "Edm.Guid") {
        return CommonUtils.getOperatorsForGuidProperty();
      }

      // remove '/'
      contextPath = contextPath.slice(0, -1);
      const isTableBoundToNavigation = contextPath.lastIndexOf("/") > 0;
      const isNavigationPath = isTableBoundToNavigation && contextPath !== sPropertyLocationPath || !isTableBoundToNavigation && sPropertyLocationPath.lastIndexOf("/") > 0;
      const navigationPath = isNavigationPath && sPropertyLocationPath.substring(sPropertyLocationPath.indexOf(contextPath) + contextPath.length + 1) || "";
      const propertyPath = isNavigationPath && navigationPath + "/" + sProperty || sProperty;
      if (!isTableBoundToNavigation) {
        if (!isNavigationPath) {
          // /SalesOrderManage/ID
          operators = CommonHelper.getOperatorsForProperty(sProperty, sPropertyLocationPath, oModel, propertyType, bUseSemanticDateRange, sSettings);
        } else {
          // /SalesOrderManange/_Item/Material
          //let operators
          operators = CommonHelper.getOperatorsForProperty(propertyPath, contextPath, oModel, propertyType, bUseSemanticDateRange, sSettings);
          if (operators.length === 0) {
            operators = CommonHelper.getOperatorsForProperty(sProperty, sPropertyLocationPath, oModel, propertyType, bUseSemanticDateRange, sSettings);
          }
        }
      } else if (!isNavigationPath) {
        // /SalesOrderManage/_Item/Material
        operators = CommonHelper.getOperatorsForProperty(propertyPath, contextPath, oModel, propertyType, bUseSemanticDateRange, sSettings);
        if (operators.length === 0) {
          operators = CommonHelper.getOperatorsForProperty(sProperty, ModelHelper.getEntitySetPath(contextPath), oModel, propertyType, bUseSemanticDateRange, sSettings);
        }
        return operators?.length > 0 ? operators.toString() : undefined;
      } else {
        // /SalesOrderManage/_Item/_Association/PropertyName
        // This is currently not supported for tables
        operators = CommonHelper.getOperatorsForProperty(propertyPath, contextPath, oModel, propertyType, bUseSemanticDateRange, sSettings);
        if (operators.length === 0) {
          operators = CommonHelper.getOperatorsForProperty(propertyPath, ModelHelper.getEntitySetPath(contextPath), oModel, propertyType, bUseSemanticDateRange, sSettings);
        }
      }
      if ((!operators || operators.length === 0) && (propertyType === "Edm.Date" || propertyType === "Edm.DateTimeOffset")) {
        operators = CommonHelper.getOperatorsForDateProperty(propertyType);
      }
      return operators.length > 0 ? operators.toString() : undefined;
    },
    /**
     * Return the path of the DaFieldDefault (if any). Otherwise, the DataField path is returned.
     * @param oDataFieldContext Context of the DataField
     * @returns Object path
     */
    getDataFieldDefault: function (oDataFieldContext) {
      // this is used in column.fragment
      const oDataFieldDefault = oDataFieldContext.getModel().getObject(`${oDataFieldContext.getPath()}@com.sap.vocabularies.UI.v1.DataFieldDefault`);
      return oDataFieldDefault ? `${oDataFieldContext.getPath()}@com.sap.vocabularies.UI.v1.DataFieldDefault` : oDataFieldContext.getPath();
    },
    /*
     * Method to get visible expression for DataFieldActionButton
     * @function
     * @name isDataFieldActionButtonVisible
     * @param {object} oThis - Current Object
     * @param {object} oDataField - DataPoint's Value
     * @param {boolean} bIsBound - DataPoint action bound
     * @param {object} oActionContext - ActionContext Value
     * @return {boolean} - returns boolean
     */
    isDataFieldActionButtonVisible: function (oDataField, bIsBound, oActionContext) {
      return oDataField.annotations?.UI?.Hidden?.valueOf() !== true && (bIsBound !== true || oActionContext !== false);
    },
    /**
     * Method to get press event for DataFieldActionButton.
     * @param oThis Current Object
     * @param oDataField DataPoint's Value
     * @returns The binding expression for the DataFieldActionButton press event
     */
    getPressEventForDataFieldActionButton: function (oThis, oDataField) {
      if (!oDataField) {
        return "";
      }
      let sInvocationGrouping = "Isolated";
      if (oDataField.InvocationGrouping && oDataField.InvocationGrouping.$EnumMember === "com.sap.vocabularies.UI.v1.OperationGroupingType/ChangeSet") {
        sInvocationGrouping = "ChangeSet";
      }
      let bIsNavigable = oThis.navigateAfterAction;
      bIsNavigable = bIsNavigable === "false" ? false : true;
      const entities = oThis?.contextPath?.getPath().split("/");
      const entitySetName = entities[entities.length - 1];
      const oParams = {
        contexts: "${$source>/}.getBindingContext()",
        invocationGrouping: CommonHelper.addSingleQuotes(sInvocationGrouping),
        model: "${$source>/}.getModel()",
        label: typeof oDataField?.Label === "string" ? CommonHelper.addSingleQuotes(oDataField.Label, true) : "",
        isNavigable: bIsNavigable,
        entitySetName: CommonHelper.addSingleQuotes(entitySetName),
        feFrameworkCall: true
      };
      return CommonHelper.generateFunction(".editFlow.invokeAction", CommonHelper.addSingleQuotes(oDataField.Action), CommonHelper.objectToString(oParams));
    },
    isNumericDataType: function (sDataFieldType) {
      const _sDataFieldType = sDataFieldType;
      if (_sDataFieldType !== undefined) {
        const aNumericDataTypes = ["Edm.Int16", "Edm.Int32", "Edm.Int64", "Edm.Byte", "Edm.SByte", "Edm.Single", "Edm.Decimal", "Edm.Double"];
        return !aNumericDataTypes.includes(_sDataFieldType) ? false : true;
      } else {
        return false;
      }
    },
    isDateOrTimeDataType: function (sPropertyType) {
      if (sPropertyType !== undefined) {
        const aDateTimeDataTypes = ["Edm.DateTimeOffset", "Edm.DateTime", "Edm.Date", "Edm.TimeOfDay", "Edm.Time"];
        return aDateTimeDataTypes.includes(sPropertyType);
      } else {
        return false;
      }
    },
    isDateTimeDataType: function (sPropertyType) {
      if (sPropertyType !== undefined) {
        const aDateDataTypes = ["Edm.DateTimeOffset", "Edm.DateTime"];
        return aDateDataTypes.includes(sPropertyType);
      } else {
        return false;
      }
    },
    isDateDataType: function (sPropertyType) {
      return sPropertyType === "Edm.Date";
    },
    isTimeDataType: function (sPropertyType) {
      if (sPropertyType !== undefined) {
        const aDateDataTypes = ["Edm.TimeOfDay", "Edm.Time"];
        return aDateDataTypes.includes(sPropertyType);
      } else {
        return false;
      }
    },
    /**
     * To display a text arrangement showing text and id, we need a string field on the UI.
     * @param oAnnotations All the annotations of a property
     * @param sType The property data type
     * @returns The type to be used on the UI for the alignment
     * @private
     */
    getDataTypeForVisualization: function (oAnnotations, sType) {
      const sTextAnnotation = "@com.sap.vocabularies.Common.v1.Text",
        sTextArrangementAnnotation = "@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement";

      /*
        In case of TextSeparate, the returned is used for the filed itself only showing
         the value of the original property, thus also the type of the property needs to be used.
        In case of TextOnly, we consider it to be Edm.String according to the definition
         in the vocabulary, even if it's not.
        In other cases, we return Edm.String, as the value is build using a text template.
       */
      return oAnnotations?.[sTextArrangementAnnotation]?.$EnumMember !== "com.sap.vocabularies.UI.v1.TextArrangementType/TextSeparate" && oAnnotations?.[sTextAnnotation]?.$Path ? "Edm.String" : sType;
    },
    getColumnAlignment: function (oDataField, oTable) {
      const sEntityPath = oTable.collection.getPath(),
        oModel = oTable.collection.getModel();
      if ((oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") && oDataField.Inline && oDataField.IconUrl) {
        return "Center";
      }
      // Columns containing a Semantic Key must be Begin aligned
      const aSemanticKeys = oModel.getObject(`${sEntityPath}/@com.sap.vocabularies.Common.v1.SemanticKey`);
      if (oDataField["$Type"] === "com.sap.vocabularies.UI.v1.DataField") {
        const sPropertyPath = oDataField.Value.$Path;
        const bIsSemanticKey = aSemanticKeys && !aSemanticKeys.every(function (oKey) {
          return oKey.$PropertyPath !== sPropertyPath;
        });
        if (bIsSemanticKey) {
          return "Begin";
        }
      }
      return FieldHelper.getDataFieldAlignment(oDataField, oModel, sEntityPath);
    },
    getPropertyAlignment: function (sType, oFormatOptions, oComputedEditMode) {
      let sDefaultAlignment = "Begin";
      const sTextAlignment = oFormatOptions ? oFormatOptions.textAlignMode : "";
      if (sTextAlignment === "Form") {
        if (this.isNumericDataType(sType)) {
          sDefaultAlignment = "Begin";
          if (oComputedEditMode) {
            sDefaultAlignment = getAlignmentExpression(oComputedEditMode, "Begin", "End");
          }
        }
      } else if (this.isNumericDataType(sType) || this.isDateOrTimeDataType(sType)) {
        sDefaultAlignment = "Right";
      }
      return sDefaultAlignment;
    },
    /**
     * Get alignment based on the dataField.
     * @param dataField The dataField being processed
     * @param model The OData model
     * @param entityPath The path to the entity
     * @param [formatOptions] The Object that defines the dataField's format options
     * @param formatOptions.displayMode Display format
     * @param formatOptions.textAlignMode Text alignment of the dataField
     * @param [computedEditMode] The computed Edit mode of the dataField
     * @returns The dataField alignment
     */
    getDataFieldAlignment: function (dataField, model, entityPath, formatOptions, computedEditMode) {
      let dataFieldPath,
        defaultAlignment = "Begin",
        type,
        annotations;
      if (dataField?.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
        dataFieldPath = dataField.Target?.$AnnotationPath;
        if (dataFieldPath && dataFieldPath.includes("com.sap.vocabularies.UI.v1.FieldGroup")) {
          const fieldGroup = model.getObject(`${entityPath}/${dataFieldPath}`);
          for (let i = 0; i < fieldGroup.Data.length; i++) {
            type = model.getObject(`${entityPath}/${dataFieldPath}/Data/${i.toString()}/Value/$Path/$Type`);
            annotations = model.getObject(`${entityPath}/${dataFieldPath}/Data/${i.toString()}/Value/$Path@`);
            type = this.getDataTypeForVisualization(annotations, type);
            defaultAlignment = this.getPropertyAlignment(type, formatOptions, computedEditMode);
            if (defaultAlignment === "Begin") {
              break;
            }
          }
          return defaultAlignment;
        } else if (dataFieldPath && dataFieldPath.includes("com.sap.vocabularies.UI.v1.DataPoint") && (model.getObject(`${entityPath}/${dataFieldPath}/Visualization/$EnumMember`) === "com.sap.vocabularies.UI.v1.VisualizationType/Rating" || model.getObject(`${entityPath}/${dataFieldPath}/Visualization/$EnumMember`) === "com.sap.vocabularies.UI.v1.VisualizationType/Progress")) {
          return defaultAlignment;
        } else {
          type = model.getObject(`${entityPath}/${dataFieldPath}/$Type`);
          if (type === "com.sap.vocabularies.UI.v1.DataPointType") {
            type = model.getObject(`${entityPath}/${dataFieldPath}/Value/$Path/$Type`);
            annotations = model.getObject(`${entityPath}/${dataFieldPath}/Value/$Path@`);
            type = this.getDataTypeForVisualization(annotations, type);
          }
          defaultAlignment = this.getPropertyAlignment(type, formatOptions, computedEditMode);
        }
      } else {
        dataFieldPath = dataField.Value?.$Path;
        type = model.getObject(`${entityPath}/${dataFieldPath}/$Type`);
        annotations = model.getObject(`${entityPath}/${dataFieldPath}@`);
        type = this.getDataTypeForVisualization(annotations, type);
        const keys = model.getObject(`${entityPath}/`)["$Key"];
        if (keys && keys.indexOf(dataFieldPath) !== 0) {
          defaultAlignment = this.getPropertyAlignment(type, formatOptions, computedEditMode);
        }
      }
      return defaultAlignment;
    },
    /**
     * Method to get enabled expression for DataFieldActionButton.
     * @param oDataField DataPoint's Value
     * @param bIsBound DataPoint action bound
     * @param oActionContext ActionContext Value
     * @param sActionContextFormat Formatted value of ActionContext
     * @returns A boolean or string expression for enabled property
     */
    isDataFieldActionButtonEnabled: function (oDataField, bIsBound, oActionContext, sActionContextFormat) {
      if (bIsBound !== true) {
        return "true";
      }
      return (oActionContext === null ? "{= !${#" + oDataField.Action + "} ? false : true }" : oActionContext) ? sActionContextFormat : "true";
    },
    /**
     * Method to compute the label for a DataField.
     * If the DataField's label is an empty string, it's not rendered even if a fallback exists.
     * @param {object} oDataField The DataField being processed
     * @param {object} oInterface The interface for context instance
     * @returns {string} The computed text for the DataField label.
     */

    computeLabelText: function (oDataField, oInterface) {
      const oModel = oInterface.context.getModel();
      let sContextPath = oInterface.context.getPath();
      if (sContextPath.endsWith("/")) {
        sContextPath = sContextPath.slice(0, sContextPath.lastIndexOf("/"));
      }
      const sDataFieldLabel = oModel.getObject(`${sContextPath}/Label`);
      //We do not show an additional label text for a button:
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
        return undefined;
      }
      if (sDataFieldLabel) {
        return sDataFieldLabel;
      } else if (sDataFieldLabel === "") {
        return "";
      }
      let sDataFieldTargetTitle;
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
        if (oDataField?.Target?.$AnnotationPath.includes("@com.sap.vocabularies.UI.v1.DataPoint") || oDataField?.Target?.$AnnotationPath.includes("@com.sap.vocabularies.UI.v1.Chart")) {
          sDataFieldTargetTitle = oModel.getObject(`${sContextPath}/Target/$AnnotationPath@/Title`);
        }
        if (oDataField?.Target?.$AnnotationPath.includes("@com.sap.vocabularies.Communication.v1.Contact")) {
          sDataFieldTargetTitle = oModel.getObject(`${sContextPath}/Target/$AnnotationPath@/fn/$Path@com.sap.vocabularies.Common.v1.Label`);
        }
      }
      if (sDataFieldTargetTitle) {
        return sDataFieldTargetTitle;
      }
      let sDataFieldTargetLabel;
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
        sDataFieldTargetLabel = oModel.getObject(`${sContextPath}/Target/$AnnotationPath@/Label`);
      }
      if (sDataFieldTargetLabel) {
        return sDataFieldTargetLabel;
      }
      const sDataFieldValueLabel = oModel.getObject(`${sContextPath}/Value/$Path@com.sap.vocabularies.Common.v1.Label`);
      if (sDataFieldValueLabel) {
        return sDataFieldValueLabel;
      }
      let sDataFieldTargetValueLabel;
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
        sDataFieldTargetValueLabel = oModel.getObject(`${sContextPath}/Target/$AnnotationPath/Value/$Path@com.sap.vocabularies.Common.v1.Label`);
      }
      if (sDataFieldTargetValueLabel) {
        return sDataFieldTargetValueLabel;
      }
      return "";
    },
    /**
     * Method to align the data fields with their label.
     * @param sVisualization
     * @returns Expression binding for alignItems property
     */
    buildExpressionForAlignItems: function (sVisualization) {
      const fieldVisualizationBindingExpression = constant(sVisualization);
      const progressVisualizationBindingExpression = constant("com.sap.vocabularies.UI.v1.VisualizationType/Progress");
      const ratingVisualizationBindingExpression = constant("com.sap.vocabularies.UI.v1.VisualizationType/Rating");
      return compileExpression(ifElse(or(equal(fieldVisualizationBindingExpression, progressVisualizationBindingExpression), equal(fieldVisualizationBindingExpression, ratingVisualizationBindingExpression)), constant("Center"), ifElse(UI.IsEditable, constant("Center"), constant("Stretch"))));
    },
    /**
     * Method to check ValueListReferences, ValueListMapping and ValueList inside ActionParameters for ValueHelp.
     * @param oPropertyAnnotations Action parameter object
     * @returns `true` if there is a ValueList* annotation defined
     */
    hasValueHelpAnnotation: function (oPropertyAnnotations) {
      if (oPropertyAnnotations) {
        return !!(oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueListReferences"] || oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueListMapping"] || oPropertyAnnotations["@com.sap.vocabularies.Common.v1.ValueList"]);
      }
      return false;
    },
    /**
     * Method to get display property for ActionParameter dialog.
     * @param oProperty The action parameter instance
     * @param oInterface The interface for the context instance
     * @returns The display format  for an action parameter Field
     */
    getAPDialogDisplayFormat: async function (oProperty, oInterface) {
      let oAnnotation;
      const oModel = oInterface.context.getModel();
      const sContextPath = oInterface.context.getPath();
      const sPropertyName = oProperty.$Name || oInterface.context.getProperty(`${sContextPath}@sapui.name`);
      const oActionParameterAnnotations = oModel.getObject(`${sContextPath}@`);
      const oValueHelpAnnotation = oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueList"] || oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueListMapping"] || oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.ValueListReferences"];
      const getValueListPropertyName = function (oValueList) {
        const oValueListParameter = oValueList.Parameters.find(function (oParameter) {
          return oParameter.LocalDataProperty && oParameter.LocalDataProperty.$PropertyPath === sPropertyName;
        });
        return oValueListParameter && oValueListParameter.ValueListProperty;
      };
      let sValueListPropertyName;
      if (oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.TextArrangement"] || oActionParameterAnnotations["@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement"]) {
        return CommonUtils.computeDisplayMode(oActionParameterAnnotations, undefined);
      } else if (oValueHelpAnnotation) {
        if (oValueHelpAnnotation.CollectionPath) {
          // get the name of the corresponding property in value list collection
          sValueListPropertyName = getValueListPropertyName(oValueHelpAnnotation);
          if (!sValueListPropertyName) {
            return "Value";
          }
          // get text for this property
          oAnnotation = oModel.getObject(`/${oValueHelpAnnotation.CollectionPath}/${sValueListPropertyName}@`);
          return oAnnotation && oAnnotation["@com.sap.vocabularies.Common.v1.Text"] ? CommonUtils.computeDisplayMode(oAnnotation, undefined) : "Value";
        } else {
          return oModel.requestValueListInfo(sContextPath, true).then(function (oValueListInfo) {
            const qualifer = FieldHelper.getValueListQuliferForParameterDisplayFormat(oModel, sContextPath, oValueListInfo);
            // get the name of the corresponding property in value list collection
            sValueListPropertyName = getValueListPropertyName(oValueListInfo[qualifer]);
            if (!sValueListPropertyName) {
              return "Value";
            }
            // get text for this property
            oAnnotation = oValueListInfo[qualifer].$model.getMetaModel().getObject(`/${oValueListInfo[qualifer]["CollectionPath"]}/${sValueListPropertyName}@`);
            return oAnnotation && oAnnotation["@com.sap.vocabularies.Common.v1.Text"] ? CommonUtils.computeDisplayMode(oAnnotation, undefined) : "Value";
          });
        }
      } else {
        return "Value";
      }
    },
    /**
     * Method to get the value list qualifier for determining the display format of an action parameter.
     * @param metaModel MetaModel.
     * @param propertyPath Property path of the action parameter.
     * @param valueListInfo Value list information.
     * @returns Value list qualifier in String format.
     */
    getValueListQuliferForParameterDisplayFormat: function (metaModel, propertyPath, valueListInfo) {
      const valueHelpQualifiers = ValueListHelper.putDefaultQualifierFirst(Object.keys(valueListInfo));
      let qualifer = valueHelpQualifiers[0];
      try {
        const parameterContext = metaModel.createBindingContext(`${propertyPath}`);
        const convertedProperty = getInvolvedDataModelObjects(parameterContext).targetObject;
        const isValueListForValidation = hasValueListForValidation(convertedProperty);
        qualifer = isValueListForValidation ? compileExpression(getExpressionFromAnnotation(convertedProperty.annotations?.Common?.ValueListForValidation)) ?? "" : qualifer;
      } catch (err) {
        Log.warning(`Couldn't finding qualifer for value list of action parameter ${propertyPath}`);
      }
      return qualifer;
    },
    /*
     * Method to get display property for ActionParameter dialog ValueHelp.
     *
     * @function
     * @name getActionParameterDialogValueHelp
     * @param oActionParameter Action parameter object
     * @param sSapUIName Action sapui name
     * @param sParamName The parameter name
     * @returns The ID of the fieldHelp used by this action parameter
     */
    getActionParameterDialogValueHelp: function (oActionParameter, sSapUIName, sParamName) {
      return this.hasValueHelpAnnotation(oActionParameter) ? generate([sSapUIName, sParamName]) : undefined;
    },
    /**
     * Method to get the delegate configuration for ActionParameter dialog.
     * @param isBound Action is bound
     * @param entityTypePath The EntityType Path
     * @param sapUIName The name of the Action
     * @param paramName The name of the ActionParameter
     * @returns The delegate configuration object as a string
     */
    getValueHelpDelegate: function (isBound, entityTypePath, sapUIName, paramName) {
      const delegateConfiguration = {
        name: CommonHelper.addSingleQuotes("sap/fe/macros/valuehelp/ValueHelpDelegate"),
        payload: {
          propertyPath: CommonHelper.addSingleQuotes(ValueListHelper.getPropertyPath({
            UnboundAction: !isBound,
            EntityTypePath: entityTypePath,
            Action: sapUIName,
            Property: paramName
          })),
          qualifiers: {},
          valueHelpQualifier: CommonHelper.addSingleQuotes(""),
          isActionParameterDialog: true
        }
      };
      return CommonHelper.objectToString(delegateConfiguration);
    },
    /**
     * Method to get the delegate configuration for NonComputedVisibleKeyField dialog.
     * @param propertyPath The current property path
     * @returns The delegate configuration object as a string
     */
    getValueHelpDelegateForNonComputedVisibleKeyField: function (propertyPath) {
      const delegateConfiguration = {
        name: CommonHelper.addSingleQuotes("sap/fe/macros/valuehelp/ValueHelpDelegate"),
        payload: {
          propertyPath: CommonHelper.addSingleQuotes(propertyPath),
          qualifiers: {},
          valueHelpQualifier: CommonHelper.addSingleQuotes("")
        }
      };
      return CommonHelper.objectToString(delegateConfiguration);
    },
    /**
     * Method to fetch entity from a path containing multiple associations.
     * @param oContext The context whose path is to be checked
     * @param sPath The path from which entity has to be fetched
     * @param sSourceEntity The entity path in which nav entity exists
     * @param iStart The start index : beginning parts of the path to be ignored
     * @param iDiff The diff index : end parts of the path to be ignored
     * @returns The path of the entity set
     */
    _getEntitySetFromMultiLevel: function (oContext, sPath, sSourceEntity, iStart, iDiff) {
      let aNavParts = sPath.split("/").filter(Boolean);
      aNavParts = aNavParts.filter(function (sPart) {
        return sPart !== "$NavigationPropertyBinding";
      });
      if (aNavParts.length > 0) {
        for (let i = iStart; i < aNavParts.length - iDiff; i++) {
          sSourceEntity = "/" + oContext.getObject(`${sSourceEntity}/$NavigationPropertyBinding/${aNavParts[i]}`);
        }
      }
      return sSourceEntity;
    },
    getPathForIconSource: function (sPropertyPath) {
      return compileExpression(formatResult([pathInModel(`${sPropertyPath}@odata.mediaContentType`)], "sap.fe.core.formatters.ValueFormatter#getIconForMimeType"));
    },
    getFilenameExpr: function (sFilename, sNoFilenameText) {
      if (sFilename) {
        if (sFilename.indexOf("{") === 0) {
          // filename is referenced via path, i.e. @Core.ContentDisposition.Filename : path
          return "{= $" + sFilename + " ? $" + sFilename + " : $" + sNoFilenameText + "}";
        }
        // static filename, i.e. @Core.ContentDisposition.Filename : 'someStaticName'
        return sFilename;
      }
      // no @Core.ContentDisposition.Filename
      return sNoFilenameText;
    },
    calculateMBfromByte: function (iByte) {
      return iByte ? (iByte / (1024 * 1024)).toFixed(6) : undefined;
    },
    getDownloadUrl: function (propertyPath) {
      return propertyPath + "{= ${internal>/stickySessionToken} ? ('?SAP-ContextId=' + ${internal>/stickySessionToken}) : '' }";
    },
    getMarginClass: function (compactSemanticKey) {
      return compactSemanticKey === "true" || compactSemanticKey === true ? "sapMTableContentMargin" : undefined;
    },
    getRequired: function (immutableKey, target, requiredProperties) {
      let targetRequiredExpression = constant(false);
      if (target !== null) {
        targetRequiredExpression = isRequiredExpression(target?.targetObject);
      }
      return compileExpression(or(targetRequiredExpression, requiredProperties.includes(immutableKey)));
    },
    /**
     * The method checks if the field is already part of a form.
     * @param dataFieldCollection The list of the fields of the form
     * @param dataFieldObjectPath The data model object path of the field which needs to be checked in the form
     * @returns `true` if the field is already part of the form, `false` otherwise
     */
    isFieldPartOfForm: function (dataFieldCollection, dataFieldObjectPath) {
      //generating key for the received data field
      const connectedDataFieldKey = KeyHelper.generateKeyFromDataField(dataFieldObjectPath.targetObject);
      // trying to find the generated key in already existing form elements
      const isFieldFound = dataFieldCollection.find(field => {
        return field.key === connectedDataFieldKey;
      });
      return isFieldFound ? true : false;
    }
  };
  FieldHelper.fieldControl.requiresIContext = true;
  FieldHelper.getAPDialogDisplayFormat.requiresIContext = true;
  FieldHelper.computeLabelText.requiresIContext = true;
  FieldHelper.getActionParameterVisibility.requiresIContext = true;
  return FieldHelper;
}, false);
//# sourceMappingURL=FieldHelper-dbg.js.map
