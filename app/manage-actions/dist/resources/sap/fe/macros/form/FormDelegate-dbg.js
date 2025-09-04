/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/CommonHelper", "sap/fe/macros/DelegateUtil", "sap/ui/model/ListBinding", "sap/ui/model/json/JSONModel"], function (Common, DelegateUtil, ListBinding, JSONModel) {
  "use strict";

  const Delegate = {
    /**
     * @param mPropertyBag Object with parameters as properties
     * @param mPropertyBag.modifier Modifier to harmonize access, creation and manipulation to controls in XML Views and JS Controls
     * @param [mPropertyBag.appComponent] Needed to calculate the correct ID in case you provide a selector
     * @param [mPropertyBag.view] XML node of the view, required for XML case to create nodes and to find elements
     * @param [mPropertyBag.fieldSelector] Selector to calculate the ID for the control that is created
     * @param [mPropertyBag.fieldSelector.id]
     * @param [mPropertyBag.fieldSelector.isLocalId]
     * @param mPropertyBag.bindingPath Runtime binding path the control should be bound to
     * @param mPropertyBag.payload Payload parameter attached to the delegate, undefined if no payload was assigned
     * @param mPropertyBag.controlType Control type of the element the delegate is attached to
     * @param mPropertyBag.aggregationName Name of the aggregation the delegate should provide additional elements
     * @param mPropertyBag.element
     * @param mPropertyBag.parentSelector
     * @returns Map containing the controls to add
     */
    createLayout: async function (mPropertyBag) {
      const oModifier = mPropertyBag.modifier,
        oMetaModel = mPropertyBag.appComponent?.getMetaModel(),
        oForm = mPropertyBag.element;
      let sEntitySet = await DelegateUtil.getCustomDataWithModifier(oForm, "entitySet", oModifier);
      if (!sEntitySet) {
        sEntitySet = await DelegateUtil.getCustomDataWithModifier(oForm, "navigationPath", oModifier);
      }
      const sPath = sEntitySet.startsWith("/") ? `${sEntitySet}` : `/${sEntitySet}`;
      const oFormContainer = mPropertyBag.parentSelector ? mPropertyBag.modifier.bySelector(mPropertyBag.parentSelector, mPropertyBag.appComponent, mPropertyBag.view) : undefined;
      const sNavigationPath = oFormContainer ? await DelegateUtil.getCustomDataWithModifier(oFormContainer, "navigationPath", oModifier) : "";
      const sBindingPath = sNavigationPath ? `${sPath}/${sNavigationPath}` : sPath;
      const oMetaModelContext = oMetaModel?.getMetaContext(sBindingPath);
      const oPropertyContext = oMetaModel?.createBindingContext(`${sBindingPath}/${mPropertyBag.bindingPath}`);
      async function fnTemplateFormElement(sFragmentName, oView, navigationPath) {
        const sOnChangeCustomData = await DelegateUtil.getCustomDataWithModifier(oForm, "onChange", oModifier);
        const sDisplayModeCustomData = await DelegateUtil.getCustomDataWithModifier(oForm, "displayMode", oModifier);
        const oThis = new JSONModel({
          // properties and events of Field macro
          _flexId: mPropertyBag.fieldSelector?.id,
          onChange: Common.removeEscapeCharacters(sOnChangeCustomData),
          displayMode: Common.removeEscapeCharacters(sDisplayModeCustomData),
          navigationPath: navigationPath
        });
        const oPreprocessorSettings = {
          bindingContexts: {
            entitySet: oMetaModelContext,
            dataField: oPropertyContext,
            this: oThis.createBindingContext("/")
          },
          models: {
            this: oThis,
            entitySet: oMetaModel,
            metaModel: oMetaModel,
            dataField: oMetaModel
          },
          appComponent: mPropertyBag.appComponent
        };
        return DelegateUtil.templateControlFragment(sFragmentName, oPreprocessorSettings, {
          view: oView
        }, oModifier);
      }
      const oField = await fnTemplateFormElement("sap.fe.macros.form.FormElementFlexibility", mPropertyBag.view, sNavigationPath);
      return {
        control: oField
      };
    },
    // getPropertyInfo is a patched version of ODataV4ReadDelegates to dela with navigationPath
    getPropertyInfo: async function (mPropertyBag) {
      function _isComplexType(mProperty) {
        if (mProperty && mProperty.$Type) {
          if (mProperty.$Type.toLowerCase().indexOf("edm") !== 0) {
            return true;
          }
        }
        return false;
      }

      //Check if a given property path starts with a navigation property.
      function _startsWithNavigationProperty(sPropertyPath, aNavigationProperties) {
        return aNavigationProperties.some(function (sNavProp) {
          return sPropertyPath.startsWith(sNavProp);
        });
      }
      function _enrichProperty(sPropertyPath, mElement, mPropertyAnnotations, sEntityType, oElement, sAggregationName, aNavigationProperties) {
        const mProp = {
          name: sPropertyPath,
          bindingPath: sPropertyPath,
          entityType: sEntityType
        };
        // get label information, either via DataFieldDefault annotation (if exists) or Label annotation
        const mDataFieldDefaultAnnotation = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.DataFieldDefault"];
        const sLabel = mDataFieldDefaultAnnotation && mDataFieldDefaultAnnotation.Label || mPropertyAnnotations["@com.sap.vocabularies.Common.v1.Label"];
        mProp.label = sLabel || "[LABEL_MISSING: " + sPropertyPath + "]";
        // evaluate Hidden annotation
        const mHiddenAnnotation = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.Hidden"];
        mProp.hideFromReveal = mHiddenAnnotation;
        if (mHiddenAnnotation && mHiddenAnnotation.$Path) {
          mProp.hideFromReveal = oElement.getBindingContext()?.getProperty(mHiddenAnnotation.$Path);
        }
        // evaluate AdaptationHidden annotation
        if (!mProp.hideFromReveal) {
          mProp.hideFromReveal = mPropertyAnnotations["@com.sap.vocabularies.UI.v1.AdaptationHidden"];
        }
        // evaluate FieldControl annotation
        let mFieldControlAnnotation;
        if (!mProp.hideFromReveal) {
          mFieldControlAnnotation = mPropertyAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"];
          if (mFieldControlAnnotation) {
            mProp.hideFromReveal = mFieldControlAnnotation.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Hidden";
          }
        }
        // @runtime hidden by field control value = 0
        mFieldControlAnnotation = mPropertyAnnotations["@com.sap.vocabularies.Common.v1.FieldControl"];
        const sFieldControlPath = mFieldControlAnnotation && mFieldControlAnnotation.$Path;
        if (sFieldControlPath && !mProp.hideFromReveal) {
          // if the binding is a list binding, skip the check for field control
          const bListBinding = oElement.getBinding(sAggregationName) instanceof ListBinding;
          if (!bListBinding) {
            const iFieldControlValue = oElement.getBindingContext()?.getProperty(sFieldControlPath);
            mProp.hideFromReveal = iFieldControlValue === 0;
          }
        }
        // no support for DataFieldFor/WithAction and DataFieldFor/WithIntentBasedNavigation within DataFieldDefault annotation
        if (mDataFieldDefaultAnnotation && (mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithAction" || mDataFieldDefaultAnnotation.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation")) {
          mProp.unsupported = true;
        }
        // no support for navigation properties and complex properties
        if (_startsWithNavigationProperty(sPropertyPath, aNavigationProperties) || _isComplexType(mElement)) {
          mProp.unsupported = true;
        }
        return mProp;
      }

      // Convert metadata format to delegate format.
      function _convertMetadataToDelegateFormat(mODataEntityType, sEntityType, oMetaModel, oElement, sAggregationName) {
        const aProperties = [];
        let sElementName = "";
        const aNavigationProperties = [];
        let mElement;
        for (sElementName in mODataEntityType) {
          mElement = mODataEntityType[sElementName];
          if (mElement.$kind === "NavigationProperty") {
            aNavigationProperties.push(sElementName);
          }
        }
        for (sElementName in mODataEntityType) {
          mElement = mODataEntityType[sElementName];
          if (mElement.$kind === "Property") {
            const mPropAnnotations = oMetaModel.getObject("/" + sEntityType + "/" + sElementName + "@");
            const mProp = _enrichProperty(sElementName, mElement, mPropAnnotations, sEntityType, oElement, sAggregationName, aNavigationProperties);
            aProperties.push(mProp);
          }
        }
        return aProperties;
      }

      //Get binding path either from payload (if available) or the element's binding context.
      function _getBindingPath(oElement, mPayload) {
        if (mPayload.path) {
          return mPayload.path;
        }
        const vBinding = oElement.getBindingContext();
        if (vBinding) {
          if (oElement.data("navigationPath")) {
            return vBinding.getPath() + "/" + oElement.data("navigationPath");
          }
          return vBinding.getPath();
        }
      }

      //Get all properties of the element's model.
      async function _getODataPropertiesOfModel(oElement, sAggregationName, mPayload) {
        const oModel = oElement.getModel(mPayload.modelName);
        if (oModel) {
          if (oModel.isA("sap.ui.model.odata.v4.ODataModel")) {
            const oMetaModel = oModel.getMetaModel();
            const sBindingContextPath = _getBindingPath(oElement, mPayload);
            if (sBindingContextPath) {
              const oMetaModelContext = oMetaModel.getMetaContext(sBindingContextPath);
              const oMetaModelContextObject = oMetaModelContext.getObject();
              const mODataEntityType = oMetaModelContext.getObject(oMetaModelContextObject.$Type);
              return _convertMetadataToDelegateFormat(mODataEntityType, oMetaModelContextObject.$Type, oMetaModel, oElement, sAggregationName);
            }
          }
        }
        return Promise.resolve([]);
      }
      return Promise.resolve().then(async function () {
        return _getODataPropertiesOfModel(mPropertyBag.element, mPropertyBag.aggregationName, mPropertyBag.payload);
      });
    }
  };
  return Delegate;
}, false);
//# sourceMappingURL=FormDelegate-dbg.js.map
