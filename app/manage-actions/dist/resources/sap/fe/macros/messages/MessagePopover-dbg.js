/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/m/Link", "sap/m/MessageItem", "sap/m/MessagePopover", "sap/ui/core/CustomData", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/performance/trace/FESRHelper"], function (Log, ClassSupport, CommonUtils, Link, MessageItem, MessagePopover, CustomData, Library, Messaging, FESRHelper) {
  "use strict";

  var _dec, _class;
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
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  let FeMessagePopover = (_dec = defineUI5Class("sap.fe.macros.messages.MessagePopover"), _dec(_class = /*#__PURE__*/function (_MessagePopover) {
    function FeMessagePopover() {
      return _MessagePopover.apply(this, arguments) || this;
    }
    _inheritsLoose(FeMessagePopover, _MessagePopover);
    var _proto = FeMessagePopover.prototype;
    _proto.init = function init() {
      MessagePopover.prototype.init.apply(this);
      this.setModel(Messaging.getMessageModel(), "message");
      this.bindAggregation("items", {
        path: "message>/",
        length: 9999,
        template: new MessageItem({
          type: "{message>type}",
          title: "{message>message}",
          description: "{message>description}",
          markupDescription: true,
          longtextUrl: "{message>descriptionUrl}",
          subtitle: "{message>additionalText}",
          activeTitle: "{= ${message>controlIds}.length > 0 ? true : false}",
          link: this.getLinkForErrorExplanation(this) || undefined
        })
      });
      this.setGroupItems(true);
    };
    _proto.getLinkForErrorExplanation = function getLinkForErrorExplanation(messagePopoverInstance) {
      const appComponent = CommonUtils.getAppComponent(messagePopoverInstance);
      const environmentService = appComponent.getEnvironmentCapabilities();
      if (environmentService.environmentCapabilities.ErrorExplanation) {
        const link = new Link({
          text: Library.getResourceBundleFor("sap.fe.macros").getText("C_GENERATE_EXPLANATION"),
          icon: "sap-icon://ai",
          customData: [new CustomData({
            key: "message",
            value: "{message>message}"
          }), new CustomData({
            key: "description",
            value: "{message>description}"
          }), new CustomData({
            key: "descriptionUrl",
            value: "{message>descriptionUrl}"
          }), new CustomData({
            key: "code",
            value: "{message>code}"
          })],
          press: async function () {
            try {
              await environmentService.prepareFeature("ErrorExplanation");
              const {
                explain
              } = await __ui5_require_async("ux/eng/fioriai/reuse/errorExplanation/ErrorExplanation");
              const registrationIds = appComponent.getManifestEntry("sap.fiori")?.registrationIds;
              const registrationIdsString = registrationIds && registrationIds.length > 0 ? registrationIds.join(",") : "";
              const errorExplanationMetadata = {
                version: 1,
                fioriId: registrationIdsString,
                appName: appComponent.getManifestEntry("sap.app")?.title || undefined,
                componentName: appComponent.getManifestEntry("sap.app")?.id || undefined
              };
              const errorExplanationData = {
                version: 1,
                message: this.data("message"),
                code: this.data("code"),
                description: this.data("description"),
                descriptionUrl: this.data("descriptionUrl")
              };
              await explain(errorExplanationMetadata, errorExplanationData);
            } catch (error) {
              Log.error("Error explanation failed", error);
            }
          }
        });
        FESRHelper.setSemanticStepname(link, "press", "fe4:ee:explain");
        return link;
      } else {
        return null;
      }
    };
    return FeMessagePopover;
  }(MessagePopover)) || _class);
  return FeMessagePopover;
}, false);
//# sourceMappingURL=MessagePopover-dbg.js.map
