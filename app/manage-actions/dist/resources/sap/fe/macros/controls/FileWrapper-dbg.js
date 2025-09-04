/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/core/templating/UIFormatters", "sap/m/BusyDialog", "./FieldWrapper"], function (BindingToolkit, ClassSupport, CommonUtils, MetaModelConverter, BindingHelper, ResourceModelHelper, UIFormatters, BusyDialog, FieldWrapper) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8, _descriptor9, _descriptor10;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var UI = BindingHelper.UI;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let FileWrapper = (_dec = defineUI5Class("sap.fe.macros.controls.FileWrapper"), _dec2 = property({
    type: "sap.ui.core.URI"
  }), _dec3 = property({
    type: "string"
  }), _dec4 = property({
    type: "string"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = aggregation({
    type: "sap.m.Avatar",
    multiple: false
  }), _dec7 = aggregation({
    type: "sap.ui.core.Icon",
    multiple: false
  }), _dec8 = aggregation({
    type: "sap.m.Link",
    multiple: false
  }), _dec9 = aggregation({
    type: "sap.m.Text",
    multiple: false
  }), _dec10 = aggregation({
    type: "sap.ui.unified.FileUploader",
    multiple: false
  }), _dec11 = aggregation({
    type: "sap.m.Button",
    multiple: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_FieldWrapper) {
    function FileWrapper(id, settings) {
      var _this;
      _this = _FieldWrapper.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "uploadUrl", _descriptor, _this);
      _initializerDefineProperty(_this, "propertyPath", _descriptor2, _this);
      _initializerDefineProperty(_this, "filename", _descriptor3, _this);
      _initializerDefineProperty(_this, "mediaType", _descriptor4, _this);
      _initializerDefineProperty(_this, "avatar", _descriptor5, _this);
      _initializerDefineProperty(_this, "icon", _descriptor6, _this);
      _initializerDefineProperty(_this, "link", _descriptor7, _this);
      _initializerDefineProperty(_this, "text", _descriptor8, _this);
      _initializerDefineProperty(_this, "fileUploader", _descriptor9, _this);
      _initializerDefineProperty(_this, "deleteButton", _descriptor10, _this);
      _this._busy = false;
      _this.avatarCacheBustingInitialized = false;
      return _this;
    }
    _inheritsLoose(FileWrapper, _FieldWrapper);
    var _proto = FileWrapper.prototype;
    _proto.enhanceAccessibilityState = function enhanceAccessibilityState(oElement, mAriaProps) {
      // We do not want to pass aria-labelledby to all child controls, only use it once as a label on the wrapper with role group.
      return mAriaProps;
    };
    _proto.onBeforeRendering = function onBeforeRendering() {
      this._setAriaLabelledBy();
      this._setAriaRequired();
      this._addSideEffects();
      this._refreshAvatar();
    };
    _proto._setAriaLabelledBy = function _setAriaLabelledBy() {
      if (this.link) {
        const oParent = this.getParent();
        const mAriaProps = {
          labelledby: undefined
        };
        if (oParent && oParent.enhanceAccessibilityState) {
          oParent.enhanceAccessibilityState(this.link, mAriaProps);
        }
        if (mAriaProps.labelledby) {
          this.addAriaLabelledBy(mAriaProps.labelledby);
        }
      }
    }

    /**
     * Returns the DOMNode ID to be used for the "labelFor" attribute.
     *
     * We forward the call of this method to the content control.
     * @returns ID to be used for the <code>labelFor</code>
     */;
    _proto.getIdForLabel = function getIdForLabel() {
      // We either have a link to download the file, a text indicating an empty file, or an avatar and no link or text
      const oContent = this.link || this.text || this.avatar;
      return oContent.getIdForLabel();
    }

    /**
     * If in the collaborative draft, send a request to reload the file.
     */;
    _proto._refreshAvatar = function _refreshAvatar() {
      const view = CommonUtils.getTargetView(this);
      const collaborativeDraft = view.getController().collaborativeDraft;
      if (collaborativeDraft.isCollaborationEnabled()) {
        const avatarBinding = this.avatar?.getBindingInfo("src").binding;
        if (avatarBinding && !this.avatarCacheBustingInitialized) {
          avatarBinding.attachEvent("change", () => {
            this.avatar?.refreshAvatarCacheBusting();
          });
          this.avatarCacheBustingInitialized = true;
        }
      }
    };
    _proto._setAriaRequired = function _setAriaRequired() {
      const view = CommonUtils.getTargetView(this),
        viewDataFullContextPath = view.getViewData().fullContextPath,
        metaModel = view.getModel().getMetaModel(),
        metaContext = metaModel.getContext(viewDataFullContextPath),
        metaPathContext = metaModel.createBindingContext(this.propertyPath, metaContext),
        dataViewModelPath = MetaModelConverter.getInvolvedDataModelObjects(metaPathContext, metaContext);
      const streamProperty = dataViewModelPath.targetObject;
      this.requiredExpression = UIFormatters.getRequiredExpression(streamProperty, undefined, false, false, {}, dataViewModelPath);
    };
    _proto._addSideEffects = function _addSideEffects() {
      // add control SideEffects for stream content, filename and mediatype
      const navigationProperties = [],
        view = CommonUtils.getTargetView(this),
        viewDataFullContextPath = view.getViewData().fullContextPath,
        metaModel = view.getModel().getMetaModel(),
        metaModelPath = metaModel.getMetaPath(viewDataFullContextPath),
        viewContext = metaModel.getContext(viewDataFullContextPath),
        dataViewModelPath = MetaModelConverter.getInvolvedDataModelObjects(viewContext),
        sourcePath = this.data("sourcePath"),
        fieldPath = sourcePath.replace(`${metaModelPath}`, ""),
        path = fieldPath.replace(this.propertyPath, "");
      navigationProperties.push({
        $NavigationPropertyPath: fieldPath
      });
      if (this.filename) {
        navigationProperties.push({
          $NavigationPropertyPath: path + this.filename
        });
      }
      if (this.mediaType) {
        navigationProperties.push({
          $NavigationPropertyPath: path + this.mediaType
        });
      }
      this._getSideEffectController()?.addControlSideEffects(dataViewModelPath.targetEntityType.fullyQualifiedName, {
        sourceProperties: [fieldPath],
        targetEntities: navigationProperties,
        sourceControlId: this.getId()
      });
    };
    _proto._getSideEffectController = function _getSideEffectController() {
      const controller = this._getViewController();
      return controller ? controller._sideEffects : undefined;
    };
    _proto._getViewController = function _getViewController() {
      const view = CommonUtils.getTargetView(this);
      return view && view.getController();
    };
    _proto.getUploadUrl = function getUploadUrl() {
      // set upload url as canonical url for NavigationProperties
      // this is a workaround as some backends cannot resolve NavigationsProperties for stream types
      const context = this.getBindingContext();
      return context && this.uploadUrl ? this.uploadUrl.replace(context.getPath(), context.getCanonicalPath()) : "";
    };
    _proto.setUIBusy = function setUIBusy(busy) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      this._busy = busy;
      if (busy) {
        if (!this.busyDialog) {
          this.busyDialog = new BusyDialog({
            text: getResourceModel(this).getText("M_FILEWRAPPER_BUSY_DIALOG_TITLE"),
            showCancelButton: false
          });
        }
        setTimeout(function () {
          if (that._busy) {
            that.busyDialog?.open();
          }
        }, 1000);
      } else {
        this.busyDialog?.close(false);
      }
    };
    _proto.getUIBusy = function getUIBusy() {
      return this._busy;
    };
    FileWrapper.render = function render(renderManager, fileWrapper) {
      let innerDivMaxWidth, innerDivMinWidth;
      if (fileWrapper.avatar) {
        // The avatar has a fixed width (3rem) therefore the inner div can have a lower min width than icon and link
        innerDivMaxWidth = "100%";
        innerDivMinWidth = "3rem";
      } else {
        // Depending on display or edit mode we have to reserve some space for the file upload and delete button (2rem each + 1rem margin)
        innerDivMaxWidth = CommonUtils.getIsEditable(fileWrapper) ? "calc(100% - 5rem)" : "100%";
        innerDivMinWidth = "4.5rem";
      }
      renderManager.openStart("div", fileWrapper); // FileWrapper control div
      renderManager.style("width", fileWrapper.width);
      renderManager.openEnd();

      // Outer Box
      renderManager.openStart("div"); // div for all controls
      renderManager.style("display", "flex");
      renderManager.style("box-sizing", "border-box");
      renderManager.style("justify-content", "space-between");
      renderManager.style("align-items", "center");
      renderManager.style("flex-wrap", "wrap");
      renderManager.style("align-content", "stretch");
      renderManager.style("width", "100%");
      renderManager.openEnd();

      // Display Mode
      renderManager.openStart("div"); // div for controls shown in Display mode
      renderManager.style("display", "flex");
      renderManager.style("align-items", "center");
      renderManager.style("max-width", innerDivMaxWidth);
      renderManager.style("min-width", innerDivMinWidth);
      renderManager.openEnd();
      if (fileWrapper.avatar) {
        renderManager.renderControl(fileWrapper.avatar); // render the Avatar Control
      } else {
        renderManager.renderControl(fileWrapper.icon); // render the Icon Control
        renderManager.renderControl(fileWrapper.link);
        if (fileWrapper.requiredExpression && fileWrapper.requiredExpression === compileExpression(UI.IsEditable) && CommonUtils.getIsEditable(fileWrapper)) {
          renderManager.accessibilityState(fileWrapper.link, {
            required: true,
            labelledby: fileWrapper.ariaLabelledBy[0]
          });
        } else {
          renderManager.accessibilityState(fileWrapper.link, {
            labelledby: fileWrapper.ariaLabelledBy[0]
          });
        }
        renderManager.renderControl(fileWrapper.text); // render the Text Control for empty file indication
      }
      renderManager.close("div"); // div for controls shown in Display mode

      // Additional content for Edit Mode
      renderManager.openStart("div"); // div for controls shown in Display + Edit mode
      renderManager.style("display", "flex");
      renderManager.style("align-items", "center");
      renderManager.openEnd();
      renderManager.renderControl(fileWrapper.fileUploader); // render the FileUploader Control
      renderManager.renderControl(fileWrapper.deleteButton); // render the Delete Button Control
      renderManager.close("div"); // div for controls shown in Display + Edit mode

      renderManager.close("div"); // div for all controls

      renderManager.close("div"); // end of the complete Control
    };
    _proto.destroy = function destroy(bSuppressInvalidate) {
      const oSideEffects = this._getSideEffectController();
      if (oSideEffects) {
        oSideEffects.removeControlSideEffects(this);
      }
      delete this.busyDialog;
      FieldWrapper.prototype.destroy.apply(this, [bSuppressInvalidate]);
    };
    return FileWrapper;
  }(FieldWrapper), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "uploadUrl", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "propertyPath", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "filename", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "mediaType", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "avatar", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "icon", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "link", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor9 = _applyDecoratedDescriptor(_class2.prototype, "fileUploader", [_dec10], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor10 = _applyDecoratedDescriptor(_class2.prototype, "deleteButton", [_dec11], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return FileWrapper;
}, false);
//# sourceMappingURL=FileWrapper-dbg.js.map
