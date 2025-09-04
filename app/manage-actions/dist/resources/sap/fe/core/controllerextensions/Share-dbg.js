/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/base/util/ObjectPath", "sap/base/util/extend", "sap/fe/base/ClassSupport", "sap/m/library", "sap/ui/core/Component", "sap/ui/core/Element", "sap/ui/core/Fragment", "sap/ui/core/Lib", "sap/ui/core/XMLTemplateProcessor", "sap/ui/core/mvc/ControllerExtension", "sap/ui/core/mvc/OverrideExecution", "sap/ui/core/routing/HashChanger", "sap/ui/core/util/XMLPreprocessor", "sap/ui/model/json/JSONModel"], function (Log, ObjectPath, extend, ClassSupport, library, Component, Element, Fragment, Library, XMLTemplateProcessor, ControllerExtension, OverrideExecution, HashChanger, XMLPreprocessor, JSONModel) {
  "use strict";

  var _dec, _dec2, _dec3, _dec4, _dec5, _dec6, _dec7, _dec8, _dec9, _dec10, _dec11, _dec12, _dec13, _dec14, _dec15, _dec16, _dec17, _class, _class2;
  var publicExtension = ClassSupport.publicExtension;
  var methodOverride = ClassSupport.methodOverride;
  var finalExtension = ClassSupport.finalExtension;
  var extensible = ClassSupport.extensible;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  let oLastFocusedControl;
  /**
   * A controller extension offering hooks into the routing flow of the application
   * @hideconstructor
   * @public
   * @since 1.86.0
   */
  let ShareUtils = (_dec = defineUI5Class("sap.fe.core.controllerextensions.Share"), _dec2 = methodOverride(), _dec3 = methodOverride(), _dec4 = publicExtension(), _dec5 = finalExtension(), _dec6 = publicExtension(), _dec7 = extensible("AfterAsync"), _dec8 = publicExtension(), _dec9 = extensible(OverrideExecution.After), _dec10 = publicExtension(), _dec11 = finalExtension(), _dec12 = publicExtension(), _dec13 = finalExtension(), _dec14 = publicExtension(), _dec15 = finalExtension(), _dec16 = publicExtension(), _dec17 = finalExtension(), _dec(_class = (_class2 = /*#__PURE__*/function (_ControllerExtension) {
    function ShareUtils() {
      return _ControllerExtension.call(this) || this;
    }
    _inheritsLoose(ShareUtils, _ControllerExtension);
    var _proto = ShareUtils.prototype;
    _proto.onInit = function onInit() {
      const shareInfoModel = new JSONModel({
        saveAsTileClicked: false,
        collaborationInfo: {
          url: "",
          appTitle: "",
          subTitle: "",
          minifyUrlForChat: true,
          appId: ""
        }
      });
      this.base.getView().setModel(shareInfoModel, "shareInfo");
    };
    _proto.onExit = function onExit() {
      const shareInfoModel = this.base?.getView()?.getModel("shareInfo");
      if (shareInfoModel) {
        shareInfoModel.destroy();
      }
    }

    /**
     * Opens the share sheet.
     * @param oControl The control to which the ActionSheet is opened.
     * @public
     * @since 1.93.0
     */;
    _proto.openShareSheet = function openShareSheet(oControl) {
      this._openShareSheetImpl(oControl);
    }

    /**
     * Get adaptive card definition.
     * @returns Adaptive card definition or a Promise resolving the Adaptive card definition
     */;
    _proto.getCardDefinition = async function getCardDefinition() {
      return Promise.resolve(undefined);
    }

    /**
     * Adapts the metadata used while sharing the page URL via 'Send Email', 'Share in SAP Jam', and 'Save as Tile'.
     * @param oShareMetadata Object containing the share metadata.
     * @param oShareMetadata.url Default URL that will be used via 'Send Email', 'Share in SAP Jam', and 'Save as Tile'
     * @param oShareMetadata.title Default title that will be used as 'email subject' in 'Send Email', 'share text' in 'Share in SAP Jam' and 'title' in 'Save as Tile'
     * @param oShareMetadata.email Email-specific metadata.
     * @param oShareMetadata.email.url URL that will be used specifically for 'Send Email'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.email.title Title that will be used as "email subject" in 'Send Email'. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.jam SAP Jam-specific metadata.
     * @param oShareMetadata.jam.url URL that will be used specifically for 'Share in SAP Jam'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.jam.title Title that will be used as 'share text' in 'Share in SAP Jam'. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.tile Save as Tile-specific metadata.
     * @param oShareMetadata.tile.url URL that will be used specifically for 'Save as Tile'. This takes precedence over oShareMetadata.url.
     * @param oShareMetadata.tile.title Title to be used for the tile. This takes precedence over oShareMetadata.title.
     * @param oShareMetadata.tile.subtitle Subtitle to be used for the tile.
     * @param oShareMetadata.tile.icon Icon to be used for the tile.
     * @param oShareMetadata.tile.queryUrl Query URL of an OData service from which data for a dynamic tile is read.
     * @returns Share Metadata or a Promise resolving the Share Metadata
     * @public
     * @since 1.93.0
     */;
    _proto.adaptShareMetadata = function adaptShareMetadata(oShareMetadata) {
      const shareInfoModel = this.base?.getView()?.getModel("shareInfo");
      const manifest = this.base.getAppComponent().getManifest();
      const appId = manifest?.["sap.app"]?.id;
      const appTitle = manifest?.["sap.app"]?.title || document.title;
      if (shareInfoModel) {
        shareInfoModel.setProperty("/collaborationInfo/appId", appId);
        shareInfoModel.setProperty("/collaborationInfo/url", oShareMetadata.url);
        shareInfoModel.setProperty("/collaborationInfo/appTitle", appTitle);
      }
      return oShareMetadata;
    };
    _proto._openShareSheetImpl = async function _openShareSheetImpl(by) {
      let oShareActionSheet;
      const hashChangerInstance = HashChanger.getInstance();
      const sHash = hashChangerInstance.getHash();
      const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
      const oShareMetadata = {
        url: window.location.origin + window.location.pathname + window.location.search + (sHash ? sBasePath + sHash : window.location.hash),
        title: await this.base.getAppComponent()?.getShellServices()?.getTitle(),
        email: {
          url: "",
          title: ""
        },
        jam: {
          url: "",
          title: ""
        },
        tile: {
          url: "",
          title: "",
          subtitle: "",
          icon: "",
          queryUrl: ""
        }
      };
      oLastFocusedControl = by;
      const setShareEmailData = function (shareActionSheet, oModelData) {
        const oShareMailModel = shareActionSheet.getModel("shareData");
        const oNewMailData = extend(oShareMailModel.getData(), oModelData);
        oShareMailModel.setData(oNewMailData);
      };
      try {
        const oModelData = await this.base.getView().getController()?.share?.adaptShareMetadata(oShareMetadata);
        const fragmentController = {
          shareEmailPressed: function () {
            const oMailModel = oShareActionSheet.getModel("shareData");
            const oMailData = oMailModel.getData();
            const oResource = Library.getResourceBundleFor("sap.fe.core");
            const sEmailSubject = oMailData.email.title ? oMailData.email.title : oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [oMailData.title]);
            library.URLHelper.triggerEmail(undefined, sEmailSubject, oMailData.email.url ? oMailData.email.url : oMailData.url);
          },
          shareMSTeamsPressed: function () {
            const msTeamsModel = oShareActionSheet.getModel("shareData");
            const msTeamsData = msTeamsModel.getData();
            const message = msTeamsData.email.title ? msTeamsData.email.title : msTeamsData.title;
            const url = msTeamsData.email.url ? msTeamsData.email.url : msTeamsData.url;
            const newWindowOpen = window.open("", "ms-teams-share-popup", "width=700,height=600");
            newWindowOpen.opener = null;
            newWindowOpen.location = `https://teams.microsoft.com/share?msgText=${encodeURIComponent(message)}&href=${encodeURIComponent(url)}`;
          },
          onSaveTilePress: function () {
            // TODO it seems that the press event is executed before the dialog is available - adding a timeout is a cheap workaround
            setTimeout(function () {
              Element.getElementById("bookmarkDialog")?.attachAfterClose(function () {
                oLastFocusedControl.focus();
              });
            }, 0);
          },
          shareJamPressed: async () => {
            await this._doOpenJamShareDialog(oModelData?.jam?.title ? oModelData.jam.title : oModelData.title, oModelData?.jam?.url ? oModelData.jam.url : oModelData.url);
          }
        };
        fragmentController.onCancelPressed = function () {
          oShareActionSheet.close();
        };
        fragmentController.setShareSheet = function (oShareSheet) {
          by.shareSheet = oShareSheet;
        };
        const oThis = new JSONModel({});
        const oPreprocessorSettings = {
          bindingContexts: {
            this: oThis.createBindingContext("/")
          },
          models: {
            this: oThis
          }
        };
        const oTileData = {
          title: oModelData?.tile?.title ? oModelData.tile.title : oModelData.title,
          subtitle: oModelData?.tile?.subtitle,
          icon: oModelData?.tile?.icon,
          url: oModelData?.tile?.url ? oModelData.tile.url : oModelData.url.substring(oModelData.url.indexOf("#")),
          queryUrl: oModelData?.tile?.queryUrl
        };
        if (by.shareSheet) {
          oShareActionSheet = by.shareSheet;
          const oShareModel = oShareActionSheet.getModel("share");
          this._setStaticShareData(oShareModel);
          const oNewData = extend(oShareModel.getData(), oTileData);
          oShareModel.setData(oNewData);
          setShareEmailData(oShareActionSheet, oModelData);
          oShareActionSheet.openBy(by);
        } else {
          const sFragmentName = "sap.fe.macros.share.ShareSheet";
          const oPopoverFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment");
          try {
            const oFragment = await XMLPreprocessor.process(oPopoverFragment, {
              name: sFragmentName
            }, oPreprocessorSettings);
            oShareActionSheet = await Fragment.load({
              definition: oFragment,
              controller: fragmentController
            });
            oShareActionSheet.setModel(new JSONModel(oTileData || {}), "share");
            const oShareModel = oShareActionSheet.getModel("share");
            this._setStaticShareData(oShareModel);
            const oNewData = extend(oShareModel.getData(), oTileData);
            oShareModel.setData(oNewData);
            oShareActionSheet.setModel(new JSONModel(oModelData || {}), "shareData");
            setShareEmailData(oShareActionSheet, oModelData);
            by.addDependent(oShareActionSheet);
            oShareActionSheet.openBy(by);
            fragmentController.setShareSheet(oShareActionSheet);
          } catch (oError) {
            Log.error("Error while opening the share fragment", oError);
          }
        }
      } catch (oError) {
        Log.error("Error while fetching the share model data", oError);
      }
    }

    /**
     * This function returns the url based on iframe and non-iframe applications.
     * @param shareUrl The url to be shared.
     * @returns Url.
     */;
    _proto.getTeamsUrl = async function getTeamsUrl(shareUrl) {
      const appUrl = await this.base.getAppComponent()?.getShellServices().getInframeUrl();
      return appUrl ? appUrl : shareUrl;
    };
    _proto._setStaticShareData = function _setStaticShareData(shareModel) {
      const oResource = Library.getResourceBundleFor("sap.fe.core");
      shareModel.setProperty("/jamButtonText", oResource.getText("T_COMMON_SAPFE_SHARE_JAM"));
      shareModel.setProperty("/emailButtonText", oResource.getText("T_SEMANTIC_CONTROL_SEND_EMAIL"));
      shareModel.setProperty("/msTeamsShareButtonText", oResource.getText("T_COMMON_SAPFE_SHARE_MSTEAMS"));
      // Share to Microsoft Teams is feature which for now only gets enabled for selected customers.
      // The switch "sapHorizonEnabled" and check for it was aligned with the Fiori launchpad team.
      if (ObjectPath.get("sap-ushell-config.renderers.fiori2.componentData.config.sapHorizonEnabled") === true) {
        shareModel.setProperty("/msTeamsVisible", true);
      } else {
        shareModel.setProperty("/msTeamsVisible", false);
      }
      const fnGetUser = ObjectPath.get("sap.ushell.Container.getUser");
      shareModel.setProperty("/jamVisible", !!fnGetUser && fnGetUser().isJamActive());
      shareModel.setProperty("/saveAsTileVisible", !!sap.ui.require("sap/ushell/Container"));
    }

    //the actual opening of the JAM share dialog
    ;
    _proto._doOpenJamShareDialog = async function _doOpenJamShareDialog(text, sUrl) {
      const oShareDialog = await Component.create({
        name: "sap.collaboration.components.fiori.sharing.dialog",
        settings: {
          object: {
            id: sUrl,
            share: text
          }
        }
      });
      oShareDialog.open();
    }

    /**
     * Triggers the email flow.
     *
     */;
    _proto._triggerEmail = async function _triggerEmail() {
      const shareMetadata = await this._adaptShareMetadata();
      const oResource = Library.getResourceBundleFor("sap.fe.core");
      const sEmailSubject = shareMetadata.email.title ? shareMetadata.email.title : oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [shareMetadata.title]);
      library.URLHelper.triggerEmail(undefined, sEmailSubject, shareMetadata.email.url ? shareMetadata.email.url : shareMetadata.url);
    }

    /**
     * Triggers the share to jam flow.
     *
     */;
    _proto._triggerShareToJam = async function _triggerShareToJam() {
      const shareMetadata = await this._adaptShareMetadata();
      await this._doOpenJamShareDialog(shareMetadata.jam.title ? shareMetadata.jam.title : shareMetadata.title, shareMetadata.jam.url ? shareMetadata.jam.url : window.location.origin + window.location.pathname + shareMetadata.url);
    }

    /**
     * Triggers the save as tile flow.
     * @param [source]
     */;
    _proto._saveAsTile = async function _saveAsTile(source) {
      const shareInfoModel = this.base?.getView()?.getModel("shareInfo");
      if (shareInfoModel) {
        // set the saveAsTileClicked flag to true when save as tile is clicked
        shareInfoModel.setProperty("/saveAsTileClicked", true);
      }
      const shareMetadata = await this._adaptShareMetadata(),
        internalAddBookmarkButton = source.getDependents()[0],
        hashChangerInstance = HashChanger.getInstance(),
        sHash = hashChangerInstance.getHash(),
        sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
      shareMetadata.url = sHash ? sBasePath + sHash : window.location.hash;

      // set AddBookmarkButton properties
      internalAddBookmarkButton.setTitle(shareMetadata.tile.title ? shareMetadata.tile.title : shareMetadata.title);
      internalAddBookmarkButton.setSubtitle(shareMetadata.tile.subtitle);
      internalAddBookmarkButton.setTileIcon(shareMetadata.tile.icon);
      internalAddBookmarkButton.setCustomUrl(shareMetadata.tile.url ? shareMetadata.tile.url : shareMetadata.url);
      internalAddBookmarkButton.setServiceUrl(shareMetadata.tile.queryUrl);
      internalAddBookmarkButton.setDataSource({
        type: "OData",
        settings: {
          odataVersion: "4.0"
        }
      });

      // once the service url is read, set the saveAsTileClicked flag to false
      if (shareInfoModel) {
        shareInfoModel.setProperty("/saveAsTileClicked", false);
      }

      // addBookmarkButton fire press
      internalAddBookmarkButton.firePress();
    }

    /**
     * Call the adaptShareMetadata extension.
     * @returns Share Metadata
     */;
    _proto._adaptShareMetadata = async function _adaptShareMetadata() {
      const hashChangerInstance = HashChanger.getInstance();
      const sHash = encodeURIComponent(hashChangerInstance.getHash());
      const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
      const oShareMetadata = {
        url: window.location.origin + window.location.pathname + window.location.search + (sHash ? sBasePath + sHash : window.location.hash),
        title: await this.base.getAppComponent()?.getShellServices()?.getTitle(),
        email: {
          url: "",
          title: ""
        },
        jam: {
          url: "",
          title: ""
        },
        tile: {
          url: "",
          title: "",
          subtitle: "",
          icon: "",
          queryUrl: ""
        }
      };
      return this.base.getView().getController().share.adaptShareMetadata(oShareMetadata);
    };
    return ShareUtils;
  }(ControllerExtension), _applyDecoratedDescriptor(_class2.prototype, "onInit", [_dec2], Object.getOwnPropertyDescriptor(_class2.prototype, "onInit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "onExit", [_dec3], Object.getOwnPropertyDescriptor(_class2.prototype, "onExit"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "openShareSheet", [_dec4, _dec5], Object.getOwnPropertyDescriptor(_class2.prototype, "openShareSheet"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "getCardDefinition", [_dec6, _dec7], Object.getOwnPropertyDescriptor(_class2.prototype, "getCardDefinition"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "adaptShareMetadata", [_dec8, _dec9], Object.getOwnPropertyDescriptor(_class2.prototype, "adaptShareMetadata"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_triggerEmail", [_dec10, _dec11], Object.getOwnPropertyDescriptor(_class2.prototype, "_triggerEmail"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_triggerShareToJam", [_dec12, _dec13], Object.getOwnPropertyDescriptor(_class2.prototype, "_triggerShareToJam"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_saveAsTile", [_dec14, _dec15], Object.getOwnPropertyDescriptor(_class2.prototype, "_saveAsTile"), _class2.prototype), _applyDecoratedDescriptor(_class2.prototype, "_adaptShareMetadata", [_dec16, _dec17], Object.getOwnPropertyDescriptor(_class2.prototype, "_adaptShareMetadata"), _class2.prototype), _class2)) || _class);
  return ShareUtils;
}, false);
//# sourceMappingURL=Share-dbg.js.map
