/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/helpers/BindingHelper", "sap/fe/macros/richtexteditor/ButtonGroup", "sap/fe/macros/richtexteditor/Plugin", "sap/m/FormattedText", "sap/ui/richtexteditor/RichTextEditor", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, BindingHelper, ButtonGroup, PluginDefinition, FormattedText, RichTextEditor, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7, _descriptor8;
  var _exports = {};
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
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  /**
   * Building block that exposes the RichTextEditor UI5 control.
   *
   * It's used to enter formatted text, and uses the third-party component called TinyMCE.
   * @public
   * @since 1.117.0
   */
  let RichTextEditorBlock = (_dec = defineUI5Class("sap.fe.macros.RichTextEditor"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "any",
    isBindingInfo: true
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = aggregation({
    type: "sap.fe.macros.richtexteditor.ButtonGroup",
    multiple: true,
    defaultClass: ButtonGroup
  }), _dec6 = aggregation({
    type: "sap.fe.macros.richtexteditor.Plugin",
    multiple: true,
    defaultClass: PluginDefinition
  }), _dec7 = property({
    type: "boolean"
  }), _dec8 = property({
    type: "any",
    bindable: false
  }), _dec9 = property({
    type: "boolean"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function RichTextEditorBlock(properties, others) {
      var _this;
      properties._isInEditMode = compileExpression(UI.IsEditable);
      _this = _BuildingBlock.call(this, properties, others) || this;
      /**
       * ID of the editor
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * The value contained in the editor. You can use this attribute to set a default value.
       * @public
       */
      _initializerDefineProperty(_this, "value", _descriptor2, _this);
      /**
       * Use the readOnly attribute to override the edit flow of the page.
       * By setting 'readOnly' to true, a FormattedText will be displayed instead of the editor.
       * @public
       */
      _initializerDefineProperty(_this, "readOnly", _descriptor3, _this);
      /**
       * With the 'buttonGroups' attribute you can customize the buttons that are displayed on the toolbar of the editor.
       * @public
       */
      _initializerDefineProperty(_this, "buttonGroups", _descriptor4, _this);
      /**
       * With the 'plugins' attribute you can customize the plugins that will be loaded by the editor.
       * @public
       */
      _initializerDefineProperty(_this, "plugins", _descriptor5, _this);
      /**
       * With the 'excludeDefaultPlugins' you can ask to remove the plugins that will be added by default
       * The default plugins are "emoticons" "directionality" "image" "table" "link" "powerpaste".
       * @public
       */
      _initializerDefineProperty(_this, "excludeDefaultPlugins", _descriptor6, _this);
      /**
       * Use the 'required' attribute to make sure that the editor is filled with some text.
       * @public
       */
      _initializerDefineProperty(_this, "required", _descriptor7, _this);
      _initializerDefineProperty(_this, "_isInEditMode", _descriptor8, _this);
      /**
       * Method that returns the button customizations for the editor toolbar.
       * Because all values come as strings from XML, some parsing needs to be done to get attributes with the correct type.
       * @returns The button groups.
       */
      _this.getPlugins = () => {
        let pluginsArray;
        if (_this.excludeDefaultPlugins) {
          pluginsArray = [];
        } else {
          pluginsArray = ["emoticons", "directionality", "image", "table", "link", "powerpaste"].map(name => {
            return {
              name: name
            };
          });
        }
        if (_this.plugins?.length) {
          for (const plugin of _this.plugins) {
            pluginsArray.push(plugin);
          }
        }
        return {
          plugins: pluginsArray
        };
      };
      /**
       * Method that returns the button customizations for the editor toolbar.
       * Because all values come as strings from XML, some parsing needs to be done to get attributes with the correct type.
       * @returns The button groups.
       */
      _this.getButtonGroups = () => {
        if (_this.buttonGroups && _this.buttonGroups.length > 0) {
          return _this.buttonGroups.map(buttonGroup => ({
            name: buttonGroup.name ?? "",
            visible: buttonGroup.visible === "true",
            priority: buttonGroup.priority,
            row: buttonGroup.row,
            customToolbarPriority: buttonGroup.customToolbarPriority,
            buttons: buttonGroup.buttons?.split(",") || []
          }));
        }
        return [];
      };
      _this.getEditContent = () => {
        if (_this._editContent) {
          // It's better to destroy the rich text editor as in some case with slow machine switching between edit and display may break it
          _this._editContent.destroy();
        }
        _this._editContent = _jsx(RichTextEditor, {
          id: _this.createId("_rte"),
          value: _this.value,
          visible: true,
          customToolbar: true,
          editable: true,
          editorType: "TinyMCE6",
          showGroupFontStyle: true,
          showGroupTextAlign: true,
          showGroupStructure: true,
          showGroupFont: false,
          showGroupClipboard: true,
          showGroupInsert: false,
          showGroupLink: false,
          showGroupUndo: false,
          sanitizeValue: true,
          wrapping: true,
          width: "100%",
          required: _this.required,
          ..._this.getPlugins(),
          buttonGroups: _this.buttonGroups.length > 0 ? [] : undefined
        });
        _this._editContent.attachReady(_this.addButtonGroups, _this);
        return _this._editContent;
      };
      return _this;
    }
    _exports = RichTextEditorBlock;
    _inheritsLoose(RichTextEditorBlock, _BuildingBlock);
    var _proto = RichTextEditorBlock.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable(_ownerComponent) {
      _BuildingBlock.prototype.onMetadataAvailable.call(this, _ownerComponent);
      this.content = this.createContent();
    };
    _proto.createContentDebounced = function createContentDebounced() {
      if (this._contentTimer) {
        clearTimeout(this._contentTimer);
      }
      this._contentTimer = setTimeout(() => {
        this.content = this.createContent();
      }, 200);
    };
    _proto.exit = function exit() {
      this._displayContent?.destroy();
      this._editContent?.destroy();
    };
    _proto.set_isInEditMode = function set_isInEditMode(inEditMode) {
      _BuildingBlock.prototype.setProperty.call(this, "_isInEditMode", inEditMode);
      this.createContentDebounced();
    };
    _proto.setReadOnly = function setReadOnly(readOnly) {
      _BuildingBlock.prototype.setProperty.call(this, "readOnly", readOnly);
      this.createContentDebounced();
    };
    /**
     * Buttons groups need to be added when the RTE is ready, otherwise some of them are not available.
     */
    _proto.addButtonGroups = function addButtonGroups() {
      const lateButtonGroups = this.getButtonGroups().reverse();
      // They also somehow need to be added in reverse because they also get added in the first place :D
      for (const lateButtonGroup of lateButtonGroups) {
        this._editContent?.addButtonGroup(lateButtonGroup);
      }
      this._editContent?.detachReady(this.addButtonGroups, this);
    };
    _proto.getDisplayContent = function getDisplayContent() {
      if (this._displayContent) {
        this._displayContent.destroy();
      }
      this._displayContent = _jsx(FormattedText, {
        htmlText: this.value
      });
      return this._displayContent;
    };
    _proto.createContent = function createContent() {
      if (this._isInEditMode && !this.readOnly) {
        return this.getEditContent();
      } else {
        return this.getDisplayContent();
      }
    };
    return RichTextEditorBlock;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "value", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "readOnly", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "buttonGroups", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return [];
    }
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "plugins", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor6 = _applyDecoratedDescriptor(_class2.prototype, "excludeDefaultPlugins", [_dec7], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor7 = _applyDecoratedDescriptor(_class2.prototype, "required", [_dec8], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _descriptor8 = _applyDecoratedDescriptor(_class2.prototype, "_isInEditMode", [_dec9], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return false;
    }
  }), _class2)) || _class);
  _exports = RichTextEditorBlock;
  return _exports;
}, false);
//# sourceMappingURL=RichTextEditor-dbg.js.map
