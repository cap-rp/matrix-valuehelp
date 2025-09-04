/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Avatar", "sap/m/AvatarShape", "sap/m/HBox", "sap/m/Text", "sap/m/Title", "sap/m/VBox", "sap/ui/performance/trace/FESRHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs"], function (ClassSupport, BuildingBlock, Avatar, AvatarShape, HBox, Text, Title, VBox, FESRHelper, _jsx, _jsxs) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _class, _class2, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let CollaborativeHeader = (_dec = defineUI5Class("sap.fe.macros.contact.CollaborativeHeader"), _dec2 = property({
    type: "string",
    isBindingInfo: true
  }), _dec3 = property({
    type: "string",
    isBindingInfo: true
  }), _dec4 = property({
    type: "string",
    isBindingInfo: true
  }), _dec5 = property({
    type: "string"
  }), _dec6 = property({
    type: "boolean",
    defaultValue: false
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function CollaborativeHeader(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "fullName", _descriptor, _this);
      _initializerDefineProperty(_this, "role", _descriptor2, _this);
      _initializerDefineProperty(_this, "photoSrc", _descriptor3, _this);
      _initializerDefineProperty(_this, "mail", _descriptor4, _this);
      _initializerDefineProperty(_this, "isNaturalPerson", _descriptor5, _this);
      return _this;
    }

    /**
     * Handler for the onMetadataAvailable event.
     */
    _exports = CollaborativeHeader;
    _inheritsLoose(CollaborativeHeader, _BuildingBlock);
    var _proto = CollaborativeHeader.prototype;
    _proto.onMetadataAvailable = function onMetadataAvailable() {
      this.createContent();
    }

    /**
     * Retrieve the profile status from the collaborative tools service.
     * @param mail
     */;
    _proto.addProfileStatus = async function addProfileStatus(mail) {
      const appComponent = this.getAppComponent();
      if (appComponent) {
        const contactStatus = await appComponent.getCollaborativeToolsService().getTeamContactStatus(mail);
        const chatContactOption = await appComponent.getCollaborativeToolsService().getTeamContactOption("chat");
        // The badge info used for contact status on the Avatar is shown directly without waiting for a click event
        if (contactStatus && chatContactOption) {
          contactStatus.forEach(element => {
            if (element.key === "profileStatus") {
              // add custom data to be used by teams helper to trigger collaboration
              if (this.avatar) {
                this.avatar.data("type", chatContactOption.key);
                this.avatar.data("email", this.mail);
                this.avatar.setBadgeIcon(element.badgeIcon);
                this.avatar.setBadgeValueState(element.badgeValueState);
                this.avatar.setTooltip(element.badgeTooltip);
                this.avatar.setBadgeTooltip(element.badgeTooltip);
                FESRHelper.setSemanticStepname(this.avatar, "press", chatContactOption.fesrStepName);
              }
            }
          });
        }
      }
    }

    /**
     * Setter for the mail that additionally adds the status to the header.
     * @param mail
     */;
    _proto.setMail = function setMail(mail) {
      this.mail = mail;
      this.addProfileStatus(mail);
    }

    /**
     * Create the content.
     */;
    _proto.createContent = function createContent() {
      this.avatar = _jsx(Avatar, {
        src: this.photoSrc,
        displaySize: "M",
        displayShape: this.isNaturalPerson ? AvatarShape.Circle : AvatarShape.Square,
        class: "sapUiTinyMarginEnd"
      });
      const header = _jsxs(HBox, {
        children: [this.avatar, _jsxs(VBox, {
          class: "sapUiTinyMarginBegin",
          children: [_jsx(Title, {
            text: this.fullName,
            level: "H3",
            wrapping: "true"
          }), _jsx(Text, {
            text: this.role
          })]
        })]
      });
      this.content = header;
    };
    return CollaborativeHeader;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "fullName", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "role", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor3 = _applyDecoratedDescriptor(_class2.prototype, "photoSrc", [_dec4], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor4 = _applyDecoratedDescriptor(_class2.prototype, "mail", [_dec5], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor5 = _applyDecoratedDescriptor(_class2.prototype, "isNaturalPerson", [_dec6], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CollaborativeHeader;
  return _exports;
}, false);
//# sourceMappingURL=CollaborativeHeader-dbg.js.map
