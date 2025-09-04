/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/m/Title", "../MacroAPI", "./FormContainerAPI"], function (ClassSupport, MTitle, MacroAPI, FormContainerAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var property = ClassSupport.property;
  var implementInterface = ClassSupport.implementInterface;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let FormAPI = (_dec = defineUI5Class("sap.fe.macros.form.FormAPI"), _dec2 = implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor"), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string",
    expectedAnnotations: ["@com.sap.vocabularies.UI.v1.FieldGroup", "@com.sap.vocabularies.UI.v1.CollectionFacet", "@com.sap.vocabularies.UI.v1.ReferenceFacet"],
    expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
  }), _dec5 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function FormAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      _initializerDefineProperty(_this, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", _descriptor, _this);
      /**
       * The identifier of the form control.
       * @public
       */
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      /**
       * Defines the relative path of the property in the metamodel, based on the current contextPath.
       * @public
       */
      _initializerDefineProperty(_this, "metaPath", _descriptor3, _this);
      /**
       * The title of the form control.
       * @public
       */
      _initializerDefineProperty(_this, "title", _descriptor4, _this);
      return _this;
    }
    _inheritsLoose(FormAPI, _MacroAPI);
    var _proto = FormAPI.prototype;
    _proto.getSectionContentRole = function getSectionContentRole() {
      return "provider";
    }

    /**
     * Implementation of the getDataFromProvider method which is a part of the ISingleSectionContributor
     *
     * Will be called from the sap.fe.macros.controls.Section control when there is a Form building block rendered within a section
     * and the form's title would be provided to the Section and accordingly adjusted here.
     *
     */;
    _proto.getDataFromProvider = function getDataFromProvider(useSingleTextAreaFieldAsNotes) {
      const formContent = this.content;
      const formContainers = formContent.getFormContainers();
      if (useSingleTextAreaFieldAsNotes && formContainers.length) {
        formContainers.forEach(formContainer => {
          FormContainerAPI.setTextAreaLabelVisibility(formContainer);
        });
      }
      // if the form's content directly has a title
      let formTitle = "";
      if (formContainers.length === 1) {
        const formContentTitle = formContent.getTitle()?.getText();
        if (formContentTitle) {
          formTitle = formContentTitle;
          formContent.setTitle("");
          return {
            title: formTitle
          };
        }
        const formContainerTitle = formContainers[0]?.getTitle()?.getText();
        //if the title from the formContainer needs to be fetched
        if (formContainerTitle && formContainerTitle !== "") {
          formTitle = formContainerTitle;
        }

        // if the title needs to be fetched from the toolbar aggregation's content of form container
        let formActionToolbarTitleControl;
        formContainers[0].getAggregation("toolbar")?.getContent().forEach(function (innerControl) {
          if (innerControl.isA("sap.m.Title")) {
            formActionToolbarTitleControl = innerControl;
            const formActionToolbarTitle = innerControl.getText();
            if (formActionToolbarTitle && formActionToolbarTitle != "") {
              formTitle = innerControl.getText();
            }
          }
        });
        if (formTitle && formTitle !== "") {
          formContainers[0]?.setTitle("");
          //this is needed to handle cases where title is present for both formContainer and the form action toolbar, but the title rendered on the UI is the one coming from one of those
          formActionToolbarTitleControl?.setTitle(new MTitle(""));
          return {
            title: formTitle
          };
        }
      }
      return {
        title: formTitle
      };
    };
    return FormAPI;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "__implements__sap_fe_macros_controls_section_ISingleSectionContributor", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "metaPath", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "title", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FormAPI;
}, false);
//# sourceMappingURL=FormAPI-dbg.js.map
