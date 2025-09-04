/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Link", "sap/m/library", "sap/fe/base/jsx-runtime/jsx"], function (BindingToolkit, ClassSupport, BuildingBlock, Link, MLibrary, _jsx) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var constant = BindingToolkit.constant;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let Email = (_dec = defineUI5Class("sap.fe.macros.contact.Email"), _dec2 = property({
    type: "any",
    isBindingInfo: true
  }), _dec3 = property({
    type: "any",
    isBindingInfo: true
  }), _dec4 = property({
    type: "boolean"
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function Email(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "visible", _descriptor, _this);
      _initializerDefineProperty(_this, "text", _descriptor2, _this);
      _initializerDefineProperty(_this, "linkEnabled", _descriptor3, _this);
      _initializerDefineProperty(_this, "mail", _descriptor4, _this);
      _initializerDefineProperty(_this, "emptyIndicatorMode", _descriptor5, _this);
      if (_this.visible === undefined || typeof _this.visible === "object" && Object.keys(_this.visible).length === 0) {
        _this.visible = constant(true);
      }
      if (!_this.linkEnabled) _this.linkEnabled = true;
      return _this;
    }

    /**
     * Checks if the Teams connection is active.
     * @returns Boolean value
     */
    _exports = Email;
    _inheritsLoose(Email, _BuildingBlock);
    var _proto = Email.prototype;
    _proto.isTeamsConnectionActive = async function isTeamsConnectionActive() {
      const appComponent = this.getAppComponent();
      if (appComponent) {
        return appComponent.getCollaborativeToolsService().isContactsCollaborationSupported();
      } else {
        return false;
      }
    }

    /**
     * Get the mail Popover from the Teams integration.
     * @param mail
     * @returns Popover or undefined
     */;
    _proto.getMailPopoverFromMsTeamsIntegration = function getMailPopoverFromMsTeamsIntegration(mail) {
      const appComponent = this.getAppComponent();
      if (appComponent) {
        return appComponent.getCollaborativeToolsService().getMailPopoverFromMsTeamsIntegration(mail);
      } else {
        return undefined;
      }
    }

    /**
     * Setter for the linkEnabled property.
     * @param enabled
     */;
    _proto.setLinkEnabled = function setLinkEnabled(enabled) {
      this.linkEnabled = enabled;
      this.content?.setEnabled(enabled);
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      if (!this.content) {
        if (this.visible === undefined || typeof this.visible === "object" && Object.keys(this.visible).length === 0) {
          this.visible = constant(true);
        }
        if (!this.linkEnabled) this.linkEnabled = true;
        this.content = this.createContent();
      }
    }

    /**
     * Open a popover if the Teams connection is active or a classic mail.
     * @param event
     */;
    _proto.openPopover = async function openPopover(event) {
      event.preventDefault(); // stop default behavior based on href
      let revertToDefaultBehaviour = false;
      const link = event.getSource();
      // "this" doesn't contain the Email instance corresponding to the link so we need to retrieve it in order to read the mail
      const mailBBv4 = link.getParent();

      // we need to check if the teams connection is active now because at templating the teamshelper service might not have been initialized yet
      if (await this.isTeamsConnectionActive()) {
        if (mailBBv4.mail) {
          const popover = await this.getMailPopoverFromMsTeamsIntegration(mailBBv4.mail);
          if (popover) {
            popover.openBy(link);
          } else {
            revertToDefaultBehaviour = true;
          }
        }
      } else {
        revertToDefaultBehaviour = true;
      }
      if (revertToDefaultBehaviour) {
        MLibrary.URLHelper.redirect(`mailto:${mailBBv4.mail}`);
      }
    }

    /**
     * Retrieves the current value of the Link.
     * @returns The current value of the Link
     */;
    _proto.getValue = function getValue() {
      return this.content?.getText();
    }

    /**
     * Sets the current value of the Link.
     * @param value
     * @returns The current Email reference
     */;
    _proto.setValue = function setValue(value) {
      this.setProperty("text", value);
      this.content?.setText(value);
      return this;
    }

    /**
     * Create the content.
     * @returns The Link
     */;
    _proto.createContent = function createContent() {
      return _jsx(Link, {
        visible: this.visible,
        text: this.text,
        enabled: this.linkEnabled,
        emptyIndicatorMode: this.emptyIndicatorMode,
        class: "sapMTextRenderWhitespaceWrap",
        press: async event => this.openPopover(event),
        ariaLabelledBy: this.ariaLabelledBy,
        wrapping: true
      });
    };
    return Email;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return constant(true);
    }
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "text", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "linkEnabled", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return true;
    }
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "mail", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "emptyIndicatorMode", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: function () {
      return "Off";
    }
  }), _class2)) || _class);
  _exports = Email;
  return _exports;
}, false);
//# sourceMappingURL=Email-dbg.js.map
