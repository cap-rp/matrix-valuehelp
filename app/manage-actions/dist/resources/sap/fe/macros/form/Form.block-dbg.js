/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor", "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/converters/annotations/DataField", "sap/fe/core/converters/controls/Common/Form", "sap/fe/core/converters/helpers/ID", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/templating/DataModelPathHelper", "sap/fe/macros/form/FormHelper", "sap/ui/core/library", "sap/ui/model/odata/v4/AnnotationHelper"], function (BindingToolkit, BuildingBlockSupport, BuildingBlockTemplateProcessor, BuildingBlockTemplatingBase, MetaModelConverter, DataField, Form, ID, BindingHelper, DataModelPathHelper, FormHelper, library, AnnotationHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10, _descriptor11, _descriptor12, _descriptor13, _descriptor14;
  var _exports = {};
  var TitleLevel = library.TitleLevel;
  var getContextRelativeTargetObjectPath = DataModelPathHelper.getContextRelativeTargetObjectPath;
  var UI = BindingHelper.UI;
  var getFormContainerID = ID.getFormContainerID;
  var createFormDefinition = Form.createFormDefinition;
  var hasIdentificationTarget = DataField.hasIdentificationTarget;
  var hasFieldGroupTarget = DataField.hasFieldGroupTarget;
  var getInvolvedDataModelObjects = MetaModelConverter.getInvolvedDataModelObjects;
  var xml = BuildingBlockTemplateProcessor.xml;
  var defineBuildingBlock = BuildingBlockSupport.defineBuildingBlock;
  var blockEvent = BuildingBlockSupport.blockEvent;
  var blockAttribute = BuildingBlockSupport.blockAttribute;
  var blockAggregation = BuildingBlockSupport.blockAggregation;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ifElse = BindingToolkit.ifElse;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var equal = BindingToolkit.equal;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block for creating a Form based on the metadata provided by OData V4.
   * <br>
   * It is designed to work based on a FieldGroup annotation but can also work if you provide a ReferenceFacet or a CollectionFacet
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:Form id="MyForm" metaPath="@com.sap.vocabularies.UI.v1.FieldGroup#GeneralInformation" /&gt;
   * </pre>
   * @alias sap.fe.macros.Form
   * @public
   */
  let FormBlock = (_dec = defineBuildingBlock({
    name: "Form",
    namespace: "sap.fe.macros.internal",
    publicNamespace: "sap.fe.macros",
    returnTypes: ["sap.fe.macros.form.FormAPI"]
  }), _dec2 = blockAttribute({
    type: "string",
    isPublic: true,
    required: true
  }), _dec3 = blockAttribute({
    type: "sap.ui.model.Context",
    required: true,
    isPublic: true,
    expectedTypes: ["EntitySet", "NavigationProperty", "Singleton", "EntityType"]
  }), _dec4 = blockAttribute({
    type: "sap.ui.model.Context",
    isPublic: true,
    required: true,
    expectedAnnotationTypes: ["com.sap.vocabularies.UI.v1.FieldGroupType", "com.sap.vocabularies.UI.v1.CollectionFacet", "com.sap.vocabularies.UI.v1.ReferenceFacet"],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec5 = blockAttribute({
    type: "array"
  }), _dec6 = blockAttribute({
    type: "boolean"
  }), _dec7 = blockAttribute({
    type: "boolean"
  }), _dec8 = blockAttribute({
    type: "string",
    isPublic: true
  }), _dec9 = blockAttribute({
    type: "sap.ui.core.TitleLevel",
    isPublic: true
  }), _dec10 = blockAttribute({
    type: "string"
  }), _dec11 = blockAttribute({
    type: "string"
  }), _dec12 = blockAttribute({
    type: "string"
  }), _dec13 = blockEvent(), _dec14 = blockAggregation({
    type: "sap.fe.macros.form.FormElement",
    isPublic: true,
    slot: "formElements",
    isDefault: true
  }), _dec15 = blockAttribute({
    type: "object",
    isPublic: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlockTemplat) {
    // Useful for our dynamic thing but also depends on the metadata -> make sure this is taken into account

    function FormBlock(props, configuration, mSettings) {
      var _this;
      _this = _BuildingBlockTemplat.call(this, props, configuration, mSettings) || this;
      /**
       * The identifier of the form control.
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Defines the path of the context used in the current page or block.
       * This setting is defined by the framework.
       * @public
       */
      _initializerDefineProperty(_this, "contextPath", _descriptor2, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _this);
      /**
       * The manifest defined form containers to be shown in the action area of the table
       */
      _initializerDefineProperty(_this, "formContainers", _descriptor4, _this);
      /**
       * Control the rendering of the form container labels
       */
      _initializerDefineProperty(_this, "useFormContainerLabels", _descriptor5, _this);
      /**
       * Toggle Preview: Part of Preview / Preview via 'Show More' Button
       */
      _initializerDefineProperty(_this, "partOfPreview", _descriptor6, _this);
      /**
       * The title of the form control.
       * @public
       */
      _initializerDefineProperty(_this, "title", _descriptor7, _this);
      /**
       * Defines the "aria-level" of the form title, titles of internally used form containers are nested subsequently
       */
      _initializerDefineProperty(_this, "titleLevel", _descriptor8, _this);
      /**
       * Property added to associate the superordinate title
       */
      _initializerDefineProperty(_this, "ariaLabelledBy", _descriptor9, _this);
      _initializerDefineProperty(_this, "displayMode", _descriptor10, _this);
      /**
       * 	If set to false, the Form is not rendered.
       */
      _initializerDefineProperty(_this, "isVisible", _descriptor11, _this);
      // Independent from the form title, can be a bit confusing in standalone usage at is not showing anything by default
      // Just proxied down to the Field may need to see if needed or not
      _initializerDefineProperty(_this, "onChange", _descriptor12, _this);
      _initializerDefineProperty(_this, "formElements", _descriptor13, _this);
      /**
       * Defines the layout to be used within the form.
       * It defaults to the ColumnLayout, but you can also use a ResponsiveGridLayout.
       * All the properties of the ResponsiveGridLayout can be added to the configuration.
       */
      _initializerDefineProperty(_this, "layout", _descriptor14, _this);
      if (_this.metaPath && _this.contextPath && (_this.formContainers === undefined || _this.formContainers === null)) {
        const oContextObjectPath = getInvolvedDataModelObjects(_this.metaPath, _this.contextPath);
        const mExtraSettings = {};
        let oFacetDefinition = oContextObjectPath.targetObject;
        let hasFieldGroup = false;
        if (oFacetDefinition && oFacetDefinition.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
          // Wrap the facet in a fake Facet annotation
          hasFieldGroup = true;
          oFacetDefinition = {
            $Type: "com.sap.vocabularies.UI.v1.ReferenceFacet",
            Label: oFacetDefinition.Label,
            Target: {
              $target: oFacetDefinition,
              fullyQualifiedName: oFacetDefinition.fullyQualifiedName,
              path: "",
              term: "",
              type: "AnnotationPath",
              value: getContextRelativeTargetObjectPath(oContextObjectPath)
            },
            annotations: {},
            fullyQualifiedName: oFacetDefinition.fullyQualifiedName
          };
          mExtraSettings[oFacetDefinition.Target.value] = {
            fields: _this.formElements
          };
        }
        const oConverterContext = _this.getConverterContext(oContextObjectPath, /*this.contextPath*/undefined, mSettings, mExtraSettings);
        const oFormDefinition = createFormDefinition(oFacetDefinition, _this.isVisible, oConverterContext);
        if (hasFieldGroup) {
          oFormDefinition.formContainers[0].annotationPath = _this.metaPath.getPath();
        }
        _this.formContainers = oFormDefinition.formContainers;
        _this.useFormContainerLabels = oFormDefinition.useFormContainerLabels;
        _this.facetType = oFacetDefinition && oFacetDefinition.$Type;
      } else {
        _this.facetType = _this.metaPath.getObject()?.$Type;
      }
      if (!_this.isPublic) {
        _this._apiId = _this.createId("Form");
        _this._contentId = _this.id;
      } else {
        _this._apiId = _this.id;
        _this._contentId = `${_this.id}-content`;
      }
      // if displayMode === true -> _editable = false
      // if displayMode === false -> _editable = true
      //  => if displayMode === {myBindingValue} -> _editable = {myBindingValue} === true ? true : false
      // if DisplayMode === undefined -> _editable = {ui>/isEditable}
      if (_this.displayMode !== undefined) {
        _this._editable = compileExpression(ifElse(equal(resolveBindingString(_this.displayMode, "boolean"), false), true, false));
      } else {
        _this._editable = compileExpression(UI.IsEditable);
      }
      return _this;
    }
    _exports = FormBlock;
    _inheritsLoose(FormBlock, _BuildingBlockTemplat);
    var _proto = FormBlock.prototype;
    _proto.getDataFieldCollection = function getDataFieldCollection(formContainer, facetContext) {
      const facet = getInvolvedDataModelObjects(facetContext).targetObject;
      let navigationPath;
      let idPart;
      if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
        navigationPath = AnnotationHelper.getNavigationPath(facet.Target.value);
        idPart = facet;
      } else {
        const contextPathPath = this.contextPath.getPath();
        let facetPath = facetContext.getPath();
        if (facetPath.startsWith(contextPathPath)) {
          facetPath = facetPath.substring(contextPathPath.length);
          if (facetPath.charAt(0) === "/") {
            facetPath = facetPath.slice(1);
          }
        }
        navigationPath = AnnotationHelper.getNavigationPath(facetPath);
        idPart = facetPath;
      }
      const titleLevel = FormHelper.getFormContainerTitleLevel(this.title, this.titleLevel);
      const title = this.useFormContainerLabels && facet.Label ? getExpressionFromAnnotation(facet.Label) : "";
      const id = this.id ? getFormContainerID(idPart) : undefined;
      return xml`
					<macro:FormContainer
					xmlns:macro="sap.fe.macros"
					${this.attr("id", id)}
					title="${title}"
					titleLevel="${titleLevel}"
					contextPath="${navigationPath ? formContainer.entitySet : this.contextPath}"
					metaPath="${facetContext}"
					dataFieldCollection="${formContainer.formElements}"
					navigationPath="${navigationPath}"
					visible="${formContainer.isVisible}"
					displayMode="${this.displayMode}"
					onChange="${this.onChange}"
					actions="${formContainer.actions}"
					useSingleTextAreaFieldAsNotes="${formContainer.useSingleTextAreaFieldAsNotes}"
					hasUiHiddenAnnotation="${formContainer.annotationHidden}"
				>
				<macro:formElements>
					<slot name="formElements" />
				</macro:formElements>
			</macro:FormContainer>`;
    };
    _proto.getFormContainers = function getFormContainers() {
      if (this.formContainers.length === 0) {
        return "";
      }
      if (this.facetType?.includes("com.sap.vocabularies.UI.v1.CollectionFacet")) {
        return this.formContainers.map((formContainer, formContainerIdx) => {
          if (formContainer.isVisible) {
            const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
            const facet = facetContext.getObject();
            if (facet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet" && FormHelper.isReferenceFacetPartOfPreview(facet, this.partOfPreview)) {
              if (facet.Target.$AnnotationPath.$Type === "com.sap.vocabularies.Communication.v1.AddressType") {
                return xml`<template:with path="formContainers>${formContainerIdx}" var="formContainer">
											<template:with path="formContainers>${formContainerIdx}/annotationPath" var="facet">
												<core:Fragment fragmentName="sap.fe.macros.form.AddressSection" type="XML" />
											</template:with>
										</template:with>`;
              }
              return this.getDataFieldCollection(formContainer, facetContext);
            }
          }
          return "";
        });
      } else if (this.facetType === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
        return this.formContainers.map(formContainer => {
          if (formContainer.isVisible) {
            const facetContext = this.contextPath.getModel().createBindingContext(formContainer.annotationPath, this.contextPath);
            return this.getDataFieldCollection(formContainer, facetContext);
          } else {
            return "";
          }
        });
      }
      return "";
    }

    /**
     * @returns True if a textarea is alone in a form
     */;
    _proto.checkIfTextAreaIsAlone = function checkIfTextAreaIsAlone() {
      if (this.formContainers.length === 1) {
        if (this.formContainers[0].formElements.length === 1) {
          const facet = getInvolvedDataModelObjects(this.contextPath.getModel().createBindingContext(this.formContainers[0].annotationPath, this.contextPath)).targetObject;
          let fieldGroup;
          let identification;
          // This is only for macros:form with a FieldGroup that contains only a TextArea
          if (facet.$Type === "com.sap.vocabularies.UI.v1.FieldGroupType") {
            fieldGroup = facet;
          } else if (hasFieldGroupTarget(facet)) {
            fieldGroup = facet?.Target?.$target;
          } else if (hasIdentificationTarget(facet)) {
            identification = facet?.Target?.$target;
          }
          if (fieldGroup?.Data.length === 1) {
            return fieldGroup.Data[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
          }
          if (identification?.length === 1) {
            return identification[0]?.Value?.$target?.annotations?.UI?.MultiLineText?.valueOf() === true;
          }
        }
      }
      return false;
    }

    /**
     * Create the proper layout information based on the `layout` property defined externally.
     * @param isTextAreaAlone Whether the section contains a lonely TextArea inside
     * @returns The layout information for the xml.
     */;
    _proto.getLayoutInformation = function getLayoutInformation(isTextAreaAlone) {
      switch (this.layout.type) {
        case "ResponsiveGridLayout":
          return xml`<f:ResponsiveGridLayout adjustLabelSpan="${this.layout.adjustLabelSpan}"
													breakpointL="${this.layout.breakpointL}"
													breakpointM="${this.layout.breakpointM}"
													breakpointXL="${this.layout.breakpointXL}"
													columnsL="${isTextAreaAlone ? 1 : this.layout.columnsL}"
													columnsM="${isTextAreaAlone ? 1 : this.layout.columnsM}"
													columnsXL="${isTextAreaAlone ? 1 : this.layout.columnsXL}"
													emptySpanL="${this.layout.emptySpanL}"
													emptySpanM="${this.layout.emptySpanM}"
													emptySpanS="${this.layout.emptySpanS}"
													emptySpanXL="${this.layout.emptySpanXL}"
													labelSpanL="${this.layout.labelSpanL}"
													labelSpanM="${this.layout.labelSpanM}"
													labelSpanS="${this.layout.labelSpanS}"
													labelSpanXL="${this.layout.labelSpanXL}"
													singleContainerFullSize="${this.layout.singleContainerFullSize}" />`;
        case "ColumnLayout":
        default:
          return xml`<f:ColumnLayout
								columnsM="${isTextAreaAlone ? 1 : this.layout.columnsM}"
								columnsL="${isTextAreaAlone ? 1 : this.layout.columnsL}"
								columnsXL="${isTextAreaAlone ? 1 : this.layout.columnsXL}"
								labelCellsLarge="${this.layout.labelCellsLarge}"
								emptyCellsLarge="${this.layout.emptyCellsLarge}" />`;
      }
    };
    _proto.getTemplate = function getTemplate() {
      const onChangeStr = this.onChange && this.onChange.replace("{", "\\{").replace("}", "\\}") || "";
      const metaPathPath = this.metaPath.getPath();
      const contextPathPath = this.contextPath.getPath();
      const contextObjectPath = getInvolvedDataModelObjects(this.metaPath, this.contextPath);
      const entitySet = contextObjectPath.contextLocation?.targetEntitySet?._type === "EntitySet" ? "{contextPath>@sapui.name}" : undefined;
      const isTextAreaAlone = this.checkIfTextAreaIsAlone();
      if (!this.isVisible) {
        return "";
      } else {
        return xml`<macro:FormAPI xmlns:macro="sap.fe.macros.form"
					xmlns:macrodata="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:f="sap.ui.layout.form"
					xmlns:fl="sap.ui.fl"
					xmlns:dt="sap.ui.dt"
					xmlns:coreControls="sap.fe.core.controls"
					id="${this._apiId}"
					metaPath="${metaPathPath}"
					contextPath="${contextPathPath}">
				<f:Form
					fl:delegate='{
						"name": "sap/fe/macros/form/FormDelegate",
						"delegateType": "complete"
					}'
					dt:designtime="sap/fe/macros/form/Form.designtime"
					id="${this._contentId}"
					editable="${this._editable}"
					macrodata:entitySet="${entitySet}"
					visible="${this.isVisible}"
					class="sapUxAPObjectPageSubSectionAlignContent"
					macrodata:navigationPath="${contextPathPath}"
					macrodata:onChange="${onChangeStr}"
					ariaLabelledBy="${this.ariaLabelledBy}"
				>
					${this.addConditionally(this.title !== undefined, xml`<f:title>
							<core:Title level="${this.titleLevel}" text="${this.title}" />
						</f:title>`)}
					<f:layout>
					${this.getLayoutInformation(isTextAreaAlone)}

					</f:layout>
					<f:formContainers>
						${this.getFormContainers()}
					</f:formContainers>
					<f:dependents>
						<coreControls:HideFormGroupAutomatically />
					</f:dependents>
				</f:Form>
			</macro:FormAPI>`;
      }
    };
    return FormBlock;
  }(BuildingBlockTemplatingBase), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "formContainers", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "useFormContainerLabels", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "partOfPreview", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "titleLevel", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return TitleLevel.Auto;
    }
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "ariaLabelledBy", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "displayMode", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor11 = _applyDecoratedDescriptor(_class2.prototype, "isVisible", [_dec12], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "true";
    }
  }), _descriptor12 = _applyDecoratedDescriptor(_class2.prototype, "onChange", [_dec13], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor13 = _applyDecoratedDescriptor(_class2.prototype, "formElements", [_dec14], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor14 = _applyDecoratedDescriptor(_class2.prototype, "layout", [_dec15], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return {
        type: "ColumnLayout",
        columnsM: 3,
        columnsXL: 6,
        columnsL: 4,
        labelCellsLarge: 12
      };
    }
  }), _class2)) || _class);
  _exports = FormBlock;
  return _exports;
}, false);
//# sourceMappingURL=Form.block-dbg.js.map
