/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/base/HookSupport", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/FPMHelper", "sap/fe/macros/controls/section/mixin/SectionStateHandler", "sap/ui/core/Component", "sap/uxap/ObjectPageSection"], function (Log, ClassSupport, HookSupport, CommonUtils, FPMHelper, SectionStateHandler, Component, ObjectPageSection) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4;
  var property = ClassSupport.property;
  var mixin = ClassSupport.mixin;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  let Section = (_dec = defineUI5Class("sap.fe.macros.controls.Section", {
    designtime: "sap/uxap/designtime/ObjectPageSection.designtime"
  }), _dec2 = mixin(SectionStateHandler), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec(_class = _dec2(_class = (_class2 = /*#__PURE__*/function (_ObjectPageSection) {
    function Section(properties, others) {
      var _this;
      _this = _ObjectPageSection.call(this, properties, others) || this;
      // TODO: this probably makes sense to be an event. But we can address this later.
      _initializerDefineProperty(_this, "onSectionLoaded", _descriptor, _this);
      _initializerDefineProperty(_this, "useSingleTextAreaFieldAsNotes", _descriptor2, _this);
      /**
       * Path to the apply state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "applyStateHandler", _descriptor3, _this);
      /**
       * Path to the retrieve state handler to be called during state interactions.
       */
      _initializerDefineProperty(_this, "retrieveStateHandler", _descriptor4, _this);
      _this.registerDelegate();
      return _this;
    }
    _inheritsLoose(Section, _ObjectPageSection);
    var _proto = Section.prototype;
    _proto.registerDelegate = function registerDelegate() {
      const eventDelegates = {
        onAfterRendering: () => {
          const view = CommonUtils.getTargetView(this);
          let subSections = this.getSubSections();
          subSections = subSections.filter(subSection => {
            const blocks = subSection.getBlocks();
            return blocks.length === 0;
          });
          if (subSections.length) {
            subSections.forEach(subSection => {
              const subSectionEventDelegate = {
                onBeforeRendering: () => {
                  if (this.useSingleTextAreaFieldAsNotes) {
                    this.checkAndAdjustSectionContentForTextArea();
                  }
                  this.checkAndAdjustForSingleContent(view);
                  subSection.removeEventDelegate(subSectionEventDelegate);
                }
              };
              subSection.addEventDelegate(subSectionEventDelegate);
            });
          } else {
            if (this.useSingleTextAreaFieldAsNotes) {
              this.checkAndAdjustSectionContentForTextArea();
            }
            this.checkAndAdjustForSingleContent(view);
          }
        }
      };
      this.addEventDelegate(eventDelegates);
    };
    _proto.setOnSectionLoaded = function setOnSectionLoaded(onSectionLoaded) {
      const loadSplit = onSectionLoaded.split(".");
      this._sectionLoadMethodName = loadSplit?.pop();
      this._sectionLoadModuleName = loadSplit?.join("/");
      this.setProperty("onSectionLoaded", onSectionLoaded);
    }

    // TODO: Check if onAfterRendering can be used instead of applySettings.
    ;
    _proto.applySettings = function applySettings(mSettings, oScope) {
      _ObjectPageSection.prototype.applySettings.call(this, mSettings, oScope);
      const templateComponent = Component.getOwnerComponentFor(this);
      const pageController = templateComponent.getRootController();
      if (pageController) {
        HookSupport.initControllerExtensionHookHandlers(this, pageController);
      }
      return this;
    }

    /**
     * Update subsection background class based on table adjustments made.
     * @param adjustmentResults Array of adjustment results
     */;
    _proto.updateNonTableSubSectionBackground = function updateNonTableSubSectionBackground(adjustmentResults) {
      if (this.hasStyleClass("sapUiTableOnObjectPageAdjustmentsForSection")) {
        adjustmentResults.forEach(_ref => {
          let {
            subSection,
            tablesAdjusted
          } = _ref;
          if (tablesAdjusted) {
            subSection.removeStyleClass("sapUiAdjustedSectionSubsectionWithoutTable");
          } else {
            subSection.addStyleClass("sapUiAdjustedSectionSubsectionWithoutTable");
          }
        });
      }
    }

    /**
     * This method loops through all the visible subsections and triggers the text area flow if thats the only single control within the section.
     */;
    _proto.checkAndAdjustSectionContentForTextArea = function checkAndAdjustSectionContentForTextArea() {
      const visibleSubSections = this.getVisibleSubSections();
      const adjustmentResults = visibleSubSections.reduce((results, subSection) => {
        let tablesAdjusted;
        const content = this.getSingleContent([subSection]);
        if (content) {
          tablesAdjusted = this.adjustForSingleContent(content).tablesAdjusted;
        }
        results.push({
          subSection,
          tablesAdjusted
        });
        return results;
      }, []);
      this.updateNonTableSubSectionBackground(adjustmentResults);
    };
    _proto.checkAndAdjustForSingleContent = function checkAndAdjustForSingleContent(view) {
      if (view?.getViewData()?.sectionLayout === "Page") {
        const singleContent = this.getSingleContent();
        if (singleContent && (singleContent.isA("sap.fe.macros.controls.section.ISingleSectionContributor") || this.checkIfNotesReuseComponent(singleContent))) {
          const {
            tablesAdjusted: singleContentTableAdjusted
          } = this.adjustForSingleContent(singleContent);
          const subSections = this.getVisibleSubSections();
          this.updateNonTableSubSectionBackground([{
            subSection: subSections[0],
            tablesAdjusted: singleContentTableAdjusted
          }]);
        } else if (this._sectionLoadModuleName && this._sectionLoadMethodName) {
          return FPMHelper.loadModuleAndCallMethod(this._sectionLoadModuleName, this._sectionLoadMethodName, view, this);
        } else if (this.getSubSections().length > 1) {
          // call merge title logic for subsections
          this.checkAndAdjustTitles();
        } else {
          Log.debug("Section cannot be adjusted for single content : Interface 'ISingleSectionContributor' is not implemented");
        }
      } else {
        this.checkAndAdjustTitles();
      }
    }

    /**
     *
     * @param singleContent Object of the content present within the section.
     * @returns True if the content present is a notes reuse component
     */;
    _proto.checkIfNotesReuseComponent = function checkIfNotesReuseComponent(singleContent) {
      if (singleContent.isA("sap.m.VBox") && singleContent.getId().includes("NoteSection")) {
        return true;
      }
      return false;
    }

    /**
     * This function checks for the visible subsections and checks for the collection facet label, If present then we merge the title and this function handles the DynamicSideConent as well.
     */;
    _proto.checkAndAdjustTitles = function checkAndAdjustTitles() {
      const visibleSubSections = this.getVisibleSubSections();
      if (visibleSubSections.length === 1) {
        const {
          tablesAdjusted: singleSubSectionTableAdjusted
        } = this.adjustSectionContentWithTitle(visibleSubSections[0]);
        this.updateNonTableSubSectionBackground([{
          subSection: visibleSubSections[0],
          tablesAdjusted: singleSubSectionTableAdjusted
        }]);
      } else {
        const adjustmentResults = visibleSubSections.reduce((results, subsection) => {
          let tablesAdjusted;
          let content;
          const blocks = subsection.getBlocks();
          // In case of Tab layout, we need to check if the section has only one subsection and that subsection has only one control
          // In case of collection Facet, the first block will be Title and the second block will be SubSectionBlock
          if (blocks.length === 2 && blocks[1]?.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
            tablesAdjusted = this.adjustSectionContentWithTitle(subsection).tablesAdjusted;
          }
          // In case of Reference Facet, the first block will be SubSectionBlock
          else if (blocks.length === 1 && blocks[0]?.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
            content = blocks[0].getAggregation("content");
            if (content.isA("sap.fe.macros.controls.section.ISingleSectionContributor")) {
              tablesAdjusted = this.adjustForSingleContent(content, {
                sectionFromReferenceFacet: true,
                SubSection: subsection,
                showTitle: this.getVisibleSubSections().length > 1
              }).tablesAdjusted;
            } else if (content?.isA("sap.ui.layout.DynamicSideContent")) {
              content = content.getMainContent instanceof Function && content?.getMainContent();
              if (content && content.length === 1) {
                content = content[0];
                tablesAdjusted = this.adjustForSingleContent(content, {
                  sectionFromReferenceFacet: true,
                  SubSection: subsection
                }).tablesAdjusted;
              }
            }
          }
          results.push({
            subSection: subsection,
            tablesAdjusted
          });
          return results;
        }, []);
        this.updateNonTableSubSectionBackground(adjustmentResults);
      }
    }

    /**
     * This function checks for the for the collection facet label,If present then we merge the title.
     * @param subsection ObjectPage SubSection
     */;
    _proto.adjustSectionContentWithTitle = function adjustSectionContentWithTitle(subsection) {
      let adjustmentProps = {};
      const blocks = subsection.getBlocks();
      let content;
      if (blocks.length === 2 && blocks[1].isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
        content = blocks[1].getAggregation("content");
        if (content && content.isA("sap.fe.macros.controls.section.ISingleSectionContributor") && blocks[0].isA("sap.m.Title")) {
          adjustmentProps = this.adjustForSingleContent(content, {
            sectionfromCollectionFacet: true,
            Title: blocks[0],
            SubSection: subsection,
            showTitle: this.getVisibleSubSections().length > 1
          });
        } else if (content && content.isA("sap.ui.layout.DynamicSideContent")) {
          content = content.getMainContent instanceof Function && content?.getMainContent();
          if (content && content.length === 1) {
            content = content[0];
            adjustmentProps = this.adjustForSingleContent(content, {
              sectionfromCollectionFacet: true,
              Title: blocks[0],
              SubSection: subsection
            });
          }
        }
      }
      return {
        subSection: subsection,
        tablesAdjusted: adjustmentProps.tablesAdjusted
      };
    };
    _proto.getSingleContent = function getSingleContent(visibleSubSections) {
      const subSections = visibleSubSections ?? this.getVisibleSubSections();
      if (subSections.length === 1) {
        const blocks = subSections[0].getBlocks();
        if (blocks.length === 1 && blocks[0].isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
          return blocks[0].getAggregation("content");
        }
        //If there is an invisible text before a standard building block, then also the merge title logic should be applied as its still a single content
        else if (blocks.length === 2 && blocks[0].isA("sap.ui.core.InvisibleText") && blocks[1].isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) return blocks[1].getAggregation("content");
      }
    };
    _proto.getVisibleSubSections = function getVisibleSubSections() {
      const subSections = this.getSubSections();
      return subSections.reduce((visibleSubSections, subSection) => {
        if (subSection.getVisible()) {
          visibleSubSections.push(subSection);
        }
        return visibleSubSections;
      }, []);
    };
    _proto.getSectionTitle = function getSectionTitle() {
      let title = this.getTitle();
      if (this.getVisibleSubSections().length === 1) {
        title = this.getVisibleSubSections()[0].getTitle();
      }
      return title;
    }

    /**
     * Adjust the section and subsection based on the available content.
     * @param singleContent Content
     * @param sectionDetails Details
     * @returns Is the section adjusted.
     */;
    _proto.adjustForSingleContent = function adjustForSingleContent(singleContent, sectionDetails) {
      // sapUiTableOnObjectPageAdjustmentsForSection class at level makes background of subsection titles transparent.
      // This transparent background is propagated to contents that are expected to show opaque backgrounds by default.
      // We need to add exclusion class "sapUiAdjustedSectionSubsectionWithoutTable" to the subsection that doesn't need
      const classesToAdd = new Set();
      const sectionOnlyContent = singleContent;
      // This function will also be called from the extensionAPI along with some controls by the application developer, the below check is added to cover the cases where the controls passed like sap.m.Title are not implementing the interface
      const contentRole = sectionOnlyContent.getSectionContentRole && sectionOnlyContent.getSectionContentRole();
      if (contentRole === "provider") {
        const infoFromProvider = sectionOnlyContent.getDataFromProvider && sectionOnlyContent.getDataFromProvider(this.useSingleTextAreaFieldAsNotes);
        if (infoFromProvider && this.getTitle() === infoFromProvider.title) {
          this.setTitle(infoFromProvider.title);
          this.setShowTitle(true);
          // TODO: Check if this is really needed?
          classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
        }
      } else if (contentRole === "consumer") {
        let title = this.getSectionTitle();
        if (sectionDetails?.sectionfromCollectionFacet) {
          title = sectionDetails?.Title?.getText();
          sectionDetails?.Title?.setVisible(false);
          sectionDetails?.SubSection?.setShowTitle(false);
        } else if (sectionDetails?.sectionFromReferenceFacet) {
          title = sectionDetails?.SubSection?.getTitle();
          sectionDetails?.SubSection?.setShowTitle(false);
        }
        if (title === "" && sectionDetails?.SubSection) {
          title = (sectionDetails?.SubSection).getTitle();
        }
        if (sectionOnlyContent.sendDataToConsumer) {
          const subSections = this.getSubSections();
          const hasMultipleSubsections = !!(subSections?.length > 1);
          sectionOnlyContent.sendDataToConsumer({
            titleLevel: this.getTitleLevel(),
            title: title,
            headerStyle: hasMultipleSubsections ? "H5" : "H4"
          });
          this.setShowTitle(!!sectionDetails?.showTitle);
          classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");

          // if the section has only sub section, then the sub section's title should not be displayed
          if (!hasMultipleSubsections) subSections[0].setShowTitle(false);
        }
      } else if (singleContent?.isA("sap.m.Title")) {
        const title = singleContent;
        title.setText(this.getTitle());
        title.setTitleStyle("H4");
        title.setLevel(this.getTitleLevel());
        this.setShowTitle(false);
        classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
      } else if (this.checkIfNotesReuseComponent(singleContent)) {
        /**
         * Notes Reuse component has the following structure :
         * <VBox id="NoteSection">
         * <MessageStrip id="notesDebugProperties">
         * <List id="NotesList">
         * <headerToolbar>
         * <OverflowToolbar id="noteHeaderOverflowToolbar" style="Standard">
         *       <Title id="noteHeaderOverflowToolbarTitle"/>
         *		......
         *	</OverflowToolbar>
         *	</headerToolbar>
         *	......
         *	</List>
         *	</VBox>
         *	.....
         *
         * We are applying the title merge logic for the title within the overflow toolbar
         * in the following code
         *
         */
        const vBoxItems = singleContent.getItems();
        vBoxItems.forEach(vBoxItem => {
          const headerToolbar = vBoxItem.getAggregation("headerToolbar");
          if (headerToolbar) {
            headerToolbar?.getContent().forEach(control => {
              if (control.isA("sap.m.Title")) {
                const notesTitle = control;
                notesTitle.setText(this.getTitle());
                notesTitle.setTitleStyle("H4");
                notesTitle.setLevel(this.getTitleLevel());
              }
            });
          }
        });
        this.setShowTitle(false);
        classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
      }
      this.addStyleClass(Array.from(classesToAdd).join(" "));
      return {
        tablesAdjusted: classesToAdd.has("sapUiTableOnObjectPageAdjustmentsForSection")
      };
    };
    return Section;
  }(ObjectPageSection), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "onSectionLoaded", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "useSingleTextAreaFieldAsNotes", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "applyStateHandler", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "retrieveStateHandler", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class) || _class);
  return Section;
}, false);
//# sourceMappingURL=Section-dbg.js.map
