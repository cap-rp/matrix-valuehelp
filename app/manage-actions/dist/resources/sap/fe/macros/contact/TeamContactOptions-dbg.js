/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/m/Button", "sap/m/FormattedText", "sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/ui/core/CustomData", "sap/ui/core/Lib", "sap/ui/performance/trace/FESRHelper", "sap/fe/base/jsx-runtime/jsx"], function (ClassSupport, BuildingBlock, Button, FormattedText, Toolbar, ToolbarSpacer, CustomData, Library, FESRHelper, _jsx) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let TeamContactOptions = (_dec = defineUI5Class("sap.fe.macros.contact.TeamContactOptions"), _dec2 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function TeamContactOptions(properties, others) {
      var _this;
      _this = _BuildingBlock.call(this, properties, others) || this;
      _initializerDefineProperty(_this, "mail", _descriptor, _this);
      _this.visible = false;
      _this.contactOptions = [];
      return _this;
    }

    /**
     * Retrieve the contact options from the collaborative tools service.
     */
    _exports = TeamContactOptions;
    _inheritsLoose(TeamContactOptions, _BuildingBlock);
    var _proto = TeamContactOptions.prototype;
    _proto.retrieveContactOptions = async function retrieveContactOptions() {
      const appComponent = this.getAppComponent();
      if (appComponent) {
        this.contactOptions = await appComponent.getCollaborativeToolsService().getTeamContactOptions();
      }
    }

    /**
     * Setter for the mail that handles the visibility of the control.
     * @param mail
     */;
    _proto.setMail = function setMail(mail) {
      this.mail = mail;
      this.visible = !!mail;
      this.setVisible(this.visible);
    }

    /**
     * Handler for the onMetadataAvailable event.
     */;
    _proto.onMetadataAvailable = async function onMetadataAvailable() {
      if (!this.content) {
        await this.retrieveContactOptions();
        this.createContent();
      }
    }

    /**
     * Get the button for the contact option.
     * @param contactOptionDef
     * @returns The button control
     */;
    _proto.getContactOptionButton = function getContactOptionButton(contactOptionDef) {
      const button = _jsx(Button, {
        icon: contactOptionDef.icon,
        class: "sapUiSmallMarginBegin",
        type: "Transparent",
        customData: [new CustomData({
          key: "type",
          value: contactOptionDef.key
        })],
        press: event => {
          // we set the mail custom data just before the callback is called, to ensure we give it the right mail value
          button.data("email", this.mail);
          contactOptionDef.callBackHandler(event);
        }
      });
      FESRHelper.setSemanticStepname(button, "press", contactOptionDef.fesrStepName);
      return button;
    }

    /**
     * Create the content.
     */;
    _proto.createContent = function createContent() {
      if (!this.contactOptions?.length) {
        return;
      }
      const toolbar = _jsx(Toolbar, {
        width: "100%",
        class: "sapUiTinyMarginBottom"
      });
      const formattedText = _jsx(FormattedText, {
        textAlign: "Left"
      });
      const msTeamsText = Library.getResourceBundleFor("sap.fe.macros").getText("M_COMMON_MS_TEAMS_TITLE");
      formattedText.setHtmlText(`<strong>${msTeamsText}</strong>`);
      toolbar.addContent(formattedText);
      toolbar.addContent(_jsx(ToolbarSpacer, {}));
      this.contactOptions.forEach(contactOptionDef => {
        toolbar.addContent(this.getContactOptionButton(contactOptionDef));
      });
      this.setVisible(this.visible);
      this.content = toolbar;
    };
    return TeamContactOptions;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "mail", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = TeamContactOptions;
  return _exports;
}, false);
//# sourceMappingURL=TeamContactOptions-dbg.js.map
