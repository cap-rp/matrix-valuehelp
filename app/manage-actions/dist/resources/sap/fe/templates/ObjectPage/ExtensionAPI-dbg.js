/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/ExtensionAPI", "sap/fe/core/converters/helpers/ID", "sap/fe/core/helpers/RecommendationHelper", "sap/fe/core/helpers/ResourceModelHelper", "sap/ui/core/InvisibleMessage", "sap/ui/core/library", "sap/ui/core/message/Message", "sap/ui/core/message/MessageType"], function (Log, ClassSupport, CommonUtils, ExtensionAPI, ID, RecommendationHelper, ResourceModelHelper, InvisibleMessage, library, Message, MessageType) {
  "use strict";

  var _dec, _class;
  var InvisibleMessageMode = library.InvisibleMessageMode;
  var recommendationHelper = RecommendationHelper.recommendationHelper;
  var getSideContentLayoutID = ID.getSideContentLayoutID;
  var defineUI5Class = ClassSupport.defineUI5Class;
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  /**
   * Extension API for object pages on SAP Fiori elements for OData V4.
   *
   * To correctly integrate your app extension coding with SAP Fiori elements, use only the extensionAPI of SAP Fiori elements. Don't access or manipulate controls, properties, models, or other internal objects created by the SAP Fiori elements framework.
   * @public
   * @hideconstructor
   * @final
   * @since 1.79.0
   */
  let ObjectPageExtensionAPI = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.ExtensionAPI"), _dec(_class = /*#__PURE__*/function (_ExtensionAPI) {
    function ObjectPageExtensionAPI() {
      return _ExtensionAPI.apply(this, arguments) || this;
    }
    _inheritsLoose(ObjectPageExtensionAPI, _ExtensionAPI);
    var _proto = ObjectPageExtensionAPI.prototype;
    /**
     * Refreshes either the whole object page or only parts of it.
     * @param [vPath] Path or array of paths referring to entities or properties to be refreshed.
     * If omitted, the whole object page is refreshed. The path "" refreshes the entity assigned to the object page
     * without navigations
     * @returns Resolved once the data is refreshed or rejected if the request failed
     * @public
     */
    _proto.refresh = async function refresh(vPath) {
      const oBindingContext = this._view.getBindingContext();
      if (!oBindingContext) {
        // nothing to be refreshed - do not block the app!
        return Promise.resolve();
      }
      const oAppComponent = CommonUtils.getAppComponent(this._view),
        oSideEffectsService = oAppComponent.getSideEffectsService(),
        oMetaModel = oBindingContext.getModel().getMetaModel(),
        oSideEffects = {
          targetProperties: [],
          targetEntities: []
        };
      if (vPath === undefined || vPath === null) {
        // we just add an empty path which should refresh the page with all dependent bindings
        oSideEffects.targetEntities.push({
          $NavigationPropertyPath: ""
        });
      } else {
        const allPaths = Array.isArray(vPath) ? vPath : [vPath];
        const ownerComponent = this._controller.getOwnerComponent();
        const contextPath = ownerComponent.getContextPath() || `/${ownerComponent.getEntitySet()}`;
        for (const path of allPaths) {
          if (path === "") {
            // an empty path shall refresh the entity without dependencies which means * for the model
            oSideEffects.targetProperties.push("*");
          } else {
            const kind = oMetaModel.getObject(`${contextPath}/${path}/$kind`);
            if (kind === "NavigationProperty") {
              oSideEffects.targetEntities.push({
                $NavigationPropertyPath: path
              });
            } else if (kind) {
              oSideEffects.targetProperties.push(path);
            } else {
              return Promise.reject(`${path} is not a valid path to be refreshed`);
            }
          }
        }
      }
      return oSideEffectsService.requestSideEffects([...oSideEffects.targetEntities, ...oSideEffects.targetProperties], oBindingContext);
    }

    /**
     * Gets the list entries currently selected for the table.
     * @param sTableId The ID identifying the table the selected context is requested for
     * @returns Array containing the selected contexts
     * @public
     */;
    _proto.getSelectedContexts = function getSelectedContexts(sTableId) {
      let table = this._view.byId(sTableId);
      if (table?.isA("sap.ui.mdc.Table")) {
        table = table.getParent();
      }
      if (table?.isA("sap.fe.macros.table.TableAPI")) {
        return table.getSelectedContexts();
      }
      return [];
    }

    /**
     * Displays or hides the side content of an object page.
     * @param sSubSectionKey Key of the side content fragment as defined in the manifest.json
     * @param [bShow] Optional Boolean flag to show or hide the side content
     * @public
     */;
    _proto.showSideContent = function showSideContent(sSubSectionKey, bShow) {
      const sBlockID = getSideContentLayoutID(sSubSectionKey),
        oBlock = this._view.byId(sBlockID),
        bBlockState = bShow === undefined ? !oBlock.getShowSideContent() : bShow;
      oBlock.setShowSideContent(bBlockState, false);
    }

    /**
     * Gets the bound context of the current object page.
     * @returns Context bound to the object page
     * @public
     */;
    _proto.getBindingContext = function getBindingContext() {
      return this._view.getBindingContext();
    }

    /**
     * Build the internal context path of the MessageStrip control.
     * @returns The internal binding context path for the messageStrip
     */;
    _proto._getMessageStripBindingContextPath = function _getMessageStripBindingContextPath() {
      const internalModelContextPath = this._view.getBindingContext("internal")?.getPath();
      const viewContextPath = this._view.getBindingContext()?.getPath();
      return internalModelContextPath && viewContextPath ? `${internalModelContextPath}/MessageStrip/${viewContextPath.replace(/\//g, "-")}` : "";
    }

    /**
     * Displays the message strip between the title and the header of the ObjectPage.
     * @param  messages The message to be displayed
     * @public
     */;
    _proto.showMessages = function showMessages(messages) {
      this._showMessages(messages);
    }

    /**
     * Displays the message strip between the title and the header of the ObjectPage.
     * @param messages The message to be displayed
     * @param origin The origin of the message . It may come from a backend message or a custom message
     */;
    _proto._showMessages = function _showMessages(messages) {
      let origin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "Custom";
      try {
        const view = this._view;
        const internalModel = view.getModel("internal");
        const messagestripInternalModelContext = internalModel.bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
        if (!messagestripInternalModelContext) {
          return;
        }
        const resourceModel = ResourceModelHelper.getResourceModel(view);
        let message = null;
        messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
        switch (messages.length) {
          case 0:
            break;
          case 1:
            message = messages[0];
            messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
            break;
          default:
            const messageStats = {
              Error: {
                id: 2,
                count: 0
              },
              Warning: {
                id: 1,
                count: 0
              },
              Information: {
                id: 0,
                count: 0
              }
            };
            message = messages.reduce((acc, currentValue) => {
              const currentType = currentValue.getType();
              acc.setType(messageStats[currentType].id > messageStats[acc.getType()].id ? currentType : acc.getType());
              messageStats[currentType].count++;
              return acc;
            }, new Message({
              type: MessageType.Information
            }));
            if (origin === "Backend" && !CommonUtils.getIsEditable(view)) {
              messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, false);
            } else {
              messagestripInternalModelContext.setProperty(`OP${origin}MessageVisible`, !!message);
            }
            if (messageStats.Error.count > 0) {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_ERROR"));
            } else if (messageStats.Warning.count > 0) {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_WARNING"));
            } else {
              message.setMessage(resourceModel.getText("OBJECTPAGESTATE_INFORMATION"));
            }
        }
        messagestripInternalModelContext.setProperty(`OP${origin}MessageText`, message ? message.getMessage() : null);
        messagestripInternalModelContext.setProperty(`OP${origin}MessageType`, message ? message.getType() : null);
        if (message) {
          InvisibleMessage.getInstance().announce(message.getMessage(), InvisibleMessageMode.Assertive);
        }
      } catch (err) {
        Log.error("Cannot display ObjectPage message");
      }
    }

    /**
     * Hides the message strip below the anchor bar.
     * @public
     */;
    _proto.hideMessage = function hideMessage() {
      const internalModel = this._view.getModel("internal");
      const messagestripInternalModelContext = internalModel.bindContext(this._getMessageStripBindingContextPath()).getBoundContext();
      messagestripInternalModelContext.setProperty(`OPCustomMessageVisible`, false);
    }

    /**
     * This function will take the recommendation data details, transform it and update internal model with that.
     * @param data Recommendation data for the app
     */;
    _proto.setRecommendations = function setRecommendations(data) {
      recommendationHelper.transformRecommendationsForInternalStorage(data);
      this._view.getModel("internal").setProperty("/recommendationsData", data);
    }

    /**
     * Defines a control to be the title owner of its section/subsection. As the title owners of standard subsections are determined automatically, it is recommended to use this function for custom section/subsection.
     * The title owner can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
     * The framework adapts the value of these properties to be aligned with the title that is shown in the anchor bar (or icon tab bar) for the section. Moreover, the title of the subsection (and if applicable also of the section) is hidden in order to prevent redundant titles, if the subsection possesses a title owner.
     * Hint: If you choose to set sap.m.Title as the title owner, styling adjustments may be required in the custom view. For example, if sap.m.Title is set as title owner which belongs to sap.m.OverflowToolbar or to sap.m.Toolbar, then the ‘design’ property of the toolbar control is to be set to ‘Transparent’.
     * @param control The single content control can be either one of the standard building blocks (Form, Chart, Table), or reuse components, or sap.m.Title.
     * @public
     */;
    _proto.setAsSectionTitleOwner = function setAsSectionTitleOwner(control) {
      let section;
      const originalControl = control;
      while (control) {
        if (control.isA("sap.fe.macros.controls.Section")) {
          section = control;
          break;
        }
        if (control.isA("sap.fe.core.ReuseComponent")) {
          control = control.container.getParent();
        }
        const controlParent = control.getParent();
        if (controlParent) {
          control = controlParent;
        } else {
          break;
        }
      }
      if (section) {
        section.adjustForSingleContent(originalControl);
      }
    };
    return ObjectPageExtensionAPI;
  }(ExtensionAPI)) || _class);
  return ObjectPageExtensionAPI;
}, false);
//# sourceMappingURL=ExtensionAPI-dbg.js.map
