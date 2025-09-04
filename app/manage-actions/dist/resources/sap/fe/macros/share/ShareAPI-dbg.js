/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/helpers/ResourceModelHelper", "../MacroAPI"], function (Log, ClassSupport, ResourceModelHelper, MacroAPI) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  function __ui5_require_async(path) {
    return new Promise((resolve, reject) => {
      sap.ui.require([path], module => {
        if (!(module && module.__esModule)) {
          module = module === null || !(typeof module === "object" && path.endsWith("/library")) ? {
            default: module
          } : module;
          Object.defineProperty(module, "__esModule", {
            value: true
          });
        }
        resolve(module);
      }, err => {
        reject(err);
      });
    });
  }
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  /**
   * Building block used to create the ‘Share’ functionality.
   * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/features/shareDefault Overview of Building Blocks}
   * <br>
   * Please note that the 'Share in SAP Jam' option is only available on platforms that are integrated with SAP Jam.
   * <br>
   * If you are consuming this building block in an environment where the SAP Fiori launchpad is not available, then the 'Save as Tile' option is not visible.
   *
   *
   * Usage example:
   * <pre>
   * &lt;macros:Share
   * id="someID"
   * visible="true"
   * /&gt;
   * </pre>
   * @alias sap.fe.macros.ShareAPI
   * @since 1.108.0
   */
  let ShareAPI = (_dec = defineUI5Class("sap.fe.macros.share.ShareAPI", {
    interfaces: ["sap.m.IOverflowToolbarContent"]
  }), _dec2 = property({
    type: "string"
  }), _dec3 = property({
    type: "boolean",
    defaultValue: true
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_MacroAPI) {
    function ShareAPI() {
      var _this;
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      _this = _MacroAPI.call(this, ...args) || this;
      /**
       * The identifier of the 'Share' building block
       *
       */
      _initializerDefineProperty(_this, "id", _descriptor, _this);
      /**
       * Whether the 'Share' building block is visible or not.
       *
       */
      _initializerDefineProperty(_this, "visible", _descriptor2, _this);
      return _this;
    }
    _inheritsLoose(ShareAPI, _MacroAPI);
    var _proto = ShareAPI.prototype;
    /**
     * Returns properties for the interface IOverflowToolbarContent.
     * @returns Returns the configuration of IOverflowToolbarContent
     */
    _proto.getOverflowToolbarConfig = function getOverflowToolbarConfig() {
      return {
        canOverflow: true,
        onBeforeEnterOverflow: function (oControl) {
          (oControl?.getContent()).getText = function () {
            const resourceModel = getResourceModel(oControl);
            return resourceModel.getText("M_COMMON_SAPFE_ACTION_SHARE");
          };
        },
        onAfterExitOverflow: function (oControl) {
          (oControl?.getContent()).getText = function () {
            return "";
          };
        },
        priority: "High"
      };
    }

    /**
     * Sets the visibility of the 'Share' building block based on the value.
     * If the 'Share' building block is used in an application that's running in Microsoft Teams,
     * this function does not have any effect,
     * since the 'Share' building block handles the visibility on it's own in that case.
     * @param visibility The desired visibility to be set
     * @returns Promise which resolves with the instance of ShareAPI
     */;
    _proto.setVisibility = async function setVisibility(visibility) {
      const {
        default: CollaborationHelper
      } = await __ui5_require_async("sap/suite/ui/commons/collaboration/CollaborationHelper");
      const isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
      // In case of teams mode share should not be visible
      // so we do not do anything
      if (!isTeamsModeActive) {
        this.content.setVisible(visibility);
        this.visible = visibility;
      } else {
        Log.info("Share Building Block: visibility not changed since application is running in teams mode!");
      }
      return Promise.resolve(this);
    }

    /**
     * Adds style class to MenuButton. Requested by the toolbars that contain the Share Button.
     * @param style
     * @returns Returns the reference to the MenuButton
     */;
    _proto.addStyleClass = function addStyleClass(style) {
      const menuButton = this.getAggregation("content");
      menuButton.addStyleClass(style);
      return this;
    };
    return ShareAPI;
  }(MacroAPI), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "visible", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return ShareAPI;
}, false);
//# sourceMappingURL=ShareAPI-dbg.js.map
