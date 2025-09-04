/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/base/EventDelegateHook", "../CommonUtils"], function (ClassSupport, EventDelegateHook, CommonUtils) {
  "use strict";

  var _dec, _class;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let HideFormGroupAutomatically = (_dec = defineUI5Class("sap.fe.core.controls.HideFormGroupAutomatically"), _dec(_class = /*#__PURE__*/function (_EventDelegateHook) {
    function HideFormGroupAutomatically() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _EventDelegateHook.call(this, ...args) || this;
      _this.appComponent = null;
      return _this;
    }
    _inheritsLoose(HideFormGroupAutomatically, _EventDelegateHook);
    var _proto = HideFormGroupAutomatically.prototype;
    _proto.onBeforeRendering = function onBeforeRendering() {
      this.appComponent = CommonUtils.getAppComponent(this.getParent());
      this.hideSubsectionsFormContainer();
      this.hideHeaderContainer();
    }

    /**
     * Checks whether all the form elements are hidden, and then hides the form container.
     */;
    _proto.hideSubsectionsFormContainer = function hideSubsectionsFormContainer() {
      const parent = this?.getParent();
      if (parent?.isA("sap.ui.layout.form.Form")) {
        const formContainers = parent?.getFormContainers();
        this.hideFormContainers(formContainers);
      }
    }

    /**
     * Checks whether all the form elements within an editable header are hidden, and then hides the form container.
     */;
    _proto.hideHeaderContainer = function hideHeaderContainer() {
      const op = this.fetchObjectPage();
      /**
       * Get the sections of the object page
       */
      const sections = op?.getSections?.();
      if (!Array.isArray(sections)) {
        return;
      }
      for (const section of sections) {
        /**
         * Navigate through the subsections within the sections.
         */
        const subSections = section?.getSubSections();
        for (const subSection of subSections) {
          /**
           * Get the subsection blocks.
           */
          const subSectionBlocks = subSection?.getBlocks();
          /**
           * Checks if there is a form inside the block.
           */
          const isEditableHeader = subSectionBlocks?.some(headerBlock => headerBlock.isA("sap.ui.layout.form.Form"));
          if (!Array.isArray(subSectionBlocks) || !isEditableHeader) {
            continue;
          }
          for (const subSectionBlock of subSectionBlocks) {
            /**
             * Get the form containers within the subsection.
             */
            if (subSectionBlock.isA("sap.ui.layout.form.Form")) {
              const formContainers = subSectionBlock?.getFormContainers?.();
              if (Array.isArray(formContainers)) {
                this.hideFormContainers(formContainers);
              }
            }
          }
        }
      }
    };
    _proto.hideFormContainers = function hideFormContainers(formContainers) {
      if (!Array.isArray(formContainers)) return;
      for (const formContainer of formContainers) {
        const formElements = formContainer?.getFormElements();
        const isThereAnyVisibleItem = formElements?.some(fe => fe?.getVisible());
        const isUsingPartOfPreviewAnnotation = formElements.some(formElement => {
          const bindingInfo = formElement?.getBindingInfo?.("visible");
          if (Array.isArray(bindingInfo?.parts)) return bindingInfo.parts.some(bindingInfoPart => bindingInfoPart.path === "showDetails");
          return false;
        });

        /**
         * This condition ignores the form container when a new group is created using the Adapt UI.
         * If the group is empty, we should not hide it, as it is required to be there to add additional form elements.
         * If the form container itself is marked as UI.Hidden, then we should not hide it.
         */
        if (this.appComponent?.isAdaptationMode() === true && formElements?.length === 0 || isUsingPartOfPreviewAnnotation || formContainer.data("UiHiddenPresent") === "true") {
          continue;
        }

        /**
         * Since this function is called every time there's a change in the form, we need to consider two scenarios.
         * First, if the form container is hidden, we must determine whether it should be shown again.
         * Second, if the form container is currently displayed, we need to assess whether it should be hidden.
         */
        if (isThereAnyVisibleItem === false) {
          formContainer.setVisible(false);
        } else if (!formContainer.getVisible()) {
          formContainer.setVisible(true);
        }
      }
    };
    _proto.fetchObjectPage = function fetchObjectPage() {
      let parent = this.getParent();
      while (!(parent?.isA("sap.uxap.ObjectPageLayout") ?? false) && typeof parent?.getParent === "function") {
        parent = parent.getParent();
      }
      return parent?.isA("sap.uxap.ObjectPageLayout") === true ? parent : null;
    };
    return HideFormGroupAutomatically;
  }(EventDelegateHook)) || _class);
  return HideFormGroupAutomatically;
}, false);
//# sourceMappingURL=HideFormGroupAutomatically-dbg.js.map
