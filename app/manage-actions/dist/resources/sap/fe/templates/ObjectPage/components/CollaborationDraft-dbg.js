/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit", "sap/fe/base/ClassSupport", "sap/fe/core/buildingBlocks/BuildingBlock", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/formatters/CollaborationFormatter", "sap/fe/core/helpers/ModelHelper", "sap/fe/core/helpers/PromiseKeeper", "sap/fe/core/helpers/TypeGuards", "sap/fe/macros/CommonHelper", "sap/m/Avatar", "sap/m/Button", "sap/m/Dialog", "sap/m/HBox", "sap/m/Label", "sap/m/MessageStrip", "sap/m/MessageToast", "sap/m/ObjectStatus", "sap/m/ResponsivePopover", "sap/m/Text", "sap/m/VBox", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/mdc/Field", "sap/ui/mdc/ValueHelp", "sap/ui/mdc/valuehelp/Dialog", "sap/ui/mdc/valuehelp/Popover", "sap/ui/mdc/valuehelp/content/MTable", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/jsxs", "sap/fe/base/jsx-runtime/Fragment"], function (BindingToolkit, ClassSupport, BuildingBlock, CollaborationCommon, collaborationFormatter, ModelHelper, PromiseKeeper, TypeGuards, CommonHelper, Avatar, Button, Dialog, HBox, Label, MessageStrip, MessageToast, ObjectStatus, ResponsivePopover, Text, VBox, Lib, library, Field, ValueHelp, MDCDialog, MDCPopover, MTable, _jsx, _jsxs, _Fragment) {
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
  var _exports = {};
  var ValueState = library.ValueState;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var shareObject = CollaborationCommon.shareObject;
  var UserStatus = CollaborationCommon.UserStatus;
  var UserEditingState = CollaborationCommon.UserEditingState;
  var CollaborationUtils = CollaborationCommon.CollaborationUtils;
  var property = ClassSupport.property;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var getExpressionFromAnnotation = BindingToolkit.getExpressionFromAnnotation;
  var formatResult = BindingToolkit.formatResult;
  var compileExpression = BindingToolkit.compileExpression;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  const USERS_PARAMETERS = "Users";
  const USER_ID_PARAMETER = "UserID";
  let CollaborationDraft = (_dec = defineUI5Class("sap.fe.templates.ObjectPage.components.CollaborationDraft"), _dec2 = property({
    type: "string",
    required: true
  }), _dec3 = property({
    type: "string"
  }), _dec(_class = (_class2 = /*#__PURE__*/function (_BuildingBlock) {
    function CollaborationDraft(props, others) {
      var _this;
      _this = _BuildingBlock.call(this, props, others) || this;
      _initializerDefineProperty(_this, "contextPath", _descriptor, _this);
      _initializerDefineProperty(_this, "id", _descriptor2, _this);
      /**
       * Event handler to create and show the user details popover.
       * @param event The event object
       */
      _this.showCollaborationUserDetails = event => {
        const source = event.getSource();
        if (!_this.userDetailsPopover) {
          _this.userDetailsPopover = _this.getUserDetailsPopover();
        }
        _this.userDetailsPopover?.setBindingContext(source.getBindingContext("internal"), "internal");
        _this.userDetailsPopover?.openBy(source);
      };
      /**
       * Event handler to create and open the manage dialog.
       *
       */
      _this.manageCollaboration = () => {
        if (!_this.manageDialog) {
          _this.manageDialog = _this.getManageDialog();
        }
        _this.readInvitedUsers();
        _this.manageDialog?.open();
      };
      /**
       * Formatter to set the user status depending on the editing status.
       * @param userStatus The editing status of the user
       * @returns The user status
       */
      _this.formatUserStatus = userStatus => {
        switch (userStatus) {
          case UserStatus.CurrentlyEditing:
            return _this.getTranslatedText("C_COLLABORATIONDRAFT_USER_CURRENTLY_EDITING");
          case UserStatus.ChangesMade:
            return _this.getTranslatedText("C_COLLABORATIONDRAFT_USER_CHANGES_MADE");
          case UserStatus.NoChangesMade:
            return _this.getTranslatedText("C_COLLABORATIONDRAFT_USER_NO_CHANGES_MADE");
          case UserStatus.NotYetInvited:
          default:
            return _this.getTranslatedText("C_COLLABORATIONDRAFT_USER_NOT_YET_INVITED");
        }
      };
      /**
       * Sets the value state of the user field whenever changed.
       * @param event The event object of the user input
       * @returns Promise that is resolved once the value state was set.
       */
      _this.addUserFieldChanged = async event => {
        const userInput = event.getSource();
        return event.getParameter("promise")?.then(function (newUserId) {
          const internalModelContext = userInput.getBindingContext("internal");
          const invitedUsers = internalModelContext.getProperty("invitedUsers") || [];
          const newUser = {
            id: internalModelContext?.getProperty("UserID"),
            name: internalModelContext?.getProperty("UserDescription")
          };
          if (invitedUsers.findIndex(user => user.id === newUserId) > -1) {
            userInput.setValueState("Error");
            userInput.setValueStateText(this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_USER_ERROR"));
          } else if (!(invitedUsers.findIndex(user => user.id === newUser.id) > -1 || newUser.id === newUser.name && newUser.id === "")) {
            this.addUser(userInput, invitedUsers, newUser);
            userInput.setValueState("None");
            userInput.setValueStateText("");
          }
        }.bind(_this)).catch(function () {
          userInput.setValueState("Warning");
          userInput.setValueStateText(this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_USER_NOT_FOUND"));
        }.bind(_this));
      };
      /**
       * Call the share action to update the list of invited users.
       * @param event The event object of the invite button
       */
      _this.inviteUser = async event => {
        const users = [];
        const source = event.getSource();
        const bindingContext = source.getBindingContext();
        const contexts = (_this.manageDialogUserTable?.getBinding("rows")).getContexts();
        let numberOfNewInvitedUsers = 0;
        contexts.forEach(function (context) {
          users.push({
            UserID: context.getProperty("id"),
            UserAccessRole: "O" // For now according to UX every user retrieves the owner role
          });
          if (context.getObject().status === 0) {
            numberOfNewInvitedUsers++;
          }
        });
        try {
          // We request the number of invited users after the share action to see how many users were really invited
          const results = await Promise.all([shareObject(bindingContext, users), _this.requestInvitedUsersInDraft()]);
          const numberOfNonInvitedUsers = contexts.length - results[1].length;
          numberOfNewInvitedUsers -= numberOfNonInvitedUsers;
          const messageHandler = _this.getPageController().messageHandler;
          await messageHandler.showMessageDialog();
          switch (numberOfNewInvitedUsers) {
            case 0:
              MessageToast.show(_this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_SUCCESS_TOAST_NO_USER", [_this.getSharedItemName(bindingContext)]));
              break;
            case 1:
              MessageToast.show(_this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_SUCCESS_TOAST", [_this.getSharedItemName(bindingContext)]));
              break;
            default:
              MessageToast.show(_this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_SUCCESS_TOAST_PLURAL", [numberOfNewInvitedUsers.toString(), _this.getSharedItemName(bindingContext)]));
          }
        } catch {
          MessageToast.show(_this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_FAILED_TOAST"));
        }
        _this.closeManageDialog();
      };
      /**
       * Reads the currently invited user and store it in the internal model.
       * @returns Promise that is resolved once the users are read.
       */
      _this.readInvitedUsers = async () => {
        const internalModelContext = _this.getBindingContext("internal");
        try {
          const currentUserList = await _this.requestInvitedUsersInDraft();
          const invitedUsers = [];
          const activeUsers = _this.getModel("internal")?.getProperty("/collaboration/activeUsers") || [];
          const me = CollaborationUtils.getMe(_this.getAppComponent());
          let userStatus;
          if (currentUserList.length > 0) {
            currentUserList.forEach(userContext => {
              const userData = userContext.getObject();
              const isMe = me?.id === userData.UserID;
              const isActive = activeUsers.find(u => u.id === userData.UserID);
              let userDescription = userData.UserDescription || userData.UserID;
              const initials = CollaborationUtils.formatInitials(userDescription);
              userDescription = isMe ? `${CollaborationUtils.getText("C_COLLABORATIONDRAFT_ME", userDescription)}` : userDescription;
              if (isActive) {
                userStatus = UserStatus.CurrentlyEditing;
              } else if (userData.UserEditingState === UserEditingState.InProgress) {
                userStatus = UserStatus.ChangesMade;
              } else {
                userStatus = UserStatus.NoChangesMade;
              }
              const user = {
                id: userData.UserID,
                name: userDescription,
                status: userStatus,
                color: CollaborationUtils.getUserColor(userData.UserID, activeUsers, invitedUsers),
                initials: initials,
                me: isMe
              };
              invitedUsers.push(user);
            });
          } else {
            //not yet shared, just add me
            invitedUsers.push(me);
          }
          internalModelContext.setProperty("collaboration/UserID", "");
          internalModelContext.setProperty("collaboration/UserDescription", "");
          internalModelContext.setProperty("collaboration/invitedUsers", invitedUsers);
        } catch (e) {
          MessageToast.show(_this.getTranslatedText("C_COLLABORATIONDRAFT_READING_USER_FAILED"));
        }
      };
      /**
       * Event handler to close the manage dialog.
       *
       */
      _this.closeManageDialog = () => {
        _this.manageDialog?.close();
        _this.manageDialog?.destroy();
        delete _this.manageDialog;
      };
      return _this;
    }
    _exports = CollaborationDraft;
    _inheritsLoose(CollaborationDraft, _BuildingBlock);
    var _proto = CollaborationDraft.prototype;
    _proto.onMetadataAvailable = async function onMetadataAvailable(_ownerComponent) {
      this._controlLoaded = new PromiseKeeper();
      if (CollaborationDraft.GridTableControl === undefined) {
        await Lib.load({
          name: "sap.ui.table"
        });
        const {
          default: GridTableControl
        } = await __ui5_require_async("sap/ui/table/Table");
        CollaborationDraft.GridTableControl = GridTableControl;
        const {
          default: GridTableColumnControl
        } = await __ui5_require_async("sap/ui/table/Column");
        CollaborationDraft.GridTableColumnControl = GridTableColumnControl;
      }
      this.contextObject = this.getDataModelObjectPath(this.contextPath);
      this.content = this.createContent();
      this._controlLoaded.resolve();
    };
    /**
     * Returns the user details popover.
     * @returns The control tree
     */
    _proto.getUserDetailsPopover = function getUserDetailsPopover() {
      const userDetailsPopover = _jsx(ResponsivePopover, {
        showHeader: false,
        class: "sapUiContentPadding",
        placement: "Bottom",
        children: _jsxs(HBox, {
          children: [_jsx(Avatar, {
            initials: "{internal>initials}",
            displaySize: "S",
            backgroundColor: "{internal>color}"
          }), _jsxs(VBox, {
            children: [_jsx(Label, {
              class: "sapUiMediumMarginBegin",
              text: "{internal>name}"
            }), _jsx(Label, {
              class: "sapUiMediumMarginBegin",
              text: "{internal>id}"
            })]
          })]
        })
      });
      this.addDependent(userDetailsPopover);
      return userDetailsPopover;
    };
    /**
     * Returns the manage dialog used to invite further users.
     * @returns The control tree
     */
    _proto.getManageDialog = function getManageDialog() {
      const manageDialog = _jsx(Dialog, {
        title: this.getInvitationDialogTitleExpBinding(),
        horizontalScrolling: "False",
        verticalScrolling: "False",
        contentWidth: "35em",
        stretch: CommonHelper.isDesktop() ? "false" : "true",
        children: {
          beginButton: _jsx(Button, {
            text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_DIALOG_CONFIRMATION"),
            press: this.inviteUser,
            type: "Emphasized",
            enabled: {
              parts: [{
                path: "internal>invitedUsers/length"
              }, {
                path: "internal>invitedUsers"
              }],
              formatter: this.formatInviteButton
            }
          }),
          endButton: _jsx(Button, {
            text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_DIALOG_CANCEL"),
            press: this.closeManageDialog
          }),
          content: _jsxs(VBox, {
            class: "sapUiSmallMargin",
            children: [_jsx(VBox, {
              width: "100%",
              children: _jsx(MessageStrip, {
                text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_MESSAGESTRIP"),
                type: "Information",
                showIcon: true,
                showCloseButton: false,
                class: "sapUiMediumMarginBottom"
              })
            }), _jsx(Label, {
              text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_INPUT_LABEL"),
              required: true
            }), this.getManageDialogAddUserSection(), this.getManageDialogUserTable()]
          })
        }
      });
      this.addDependent(manageDialog);
      manageDialog.bindElement({
        model: "internal",
        path: "collaboration"
      });
      return manageDialog;
    }

    /**
     * Returning the table column with the list of invited users.
     * @returns The control tree
     */;
    _proto.getManageDialogUserTableColumns = function getManageDialogUserTableColumns() {
      return _jsxs(_Fragment, {
        children: [_jsx(CollaborationDraft.GridTableColumnControl, {
          width: CommonHelper.isDesktop() ? "10%" : "3em",
          children: {
            template: _jsx(HBox, {
              alignItems: "Center",
              justifyContent: "SpaceBetween",
              children: _jsx(Avatar, {
                displaySize: "XS",
                backgroundColor: "{internal>color}",
                initials: "{internal>initials}"
              })
            })
          }
        }), _jsx(CollaborationDraft.GridTableColumnControl, {
          width: CommonHelper.isDesktop() ? "35%" : "6em",
          children: {
            label: _jsx(Text, {
              text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_TABLE_USER_COLUMN")
            }),
            template: _jsx(Text, {
              text: "{internal>name}"
            })
          }
        }), _jsx(CollaborationDraft.GridTableColumnControl, {
          width: CommonHelper.isDesktop() ? "46%" : "9em",
          children: {
            label: _jsx(Text, {
              text: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_TABLE_USER_STATUS_COLUMN")
            }),
            template: _jsx(ObjectStatus, {
              state: {
                path: "internal>status",
                formatter: this.formatUserStatusColor
              },
              text: {
                path: "internal>status",
                formatter: this.formatUserStatus
              }
            })
          }
        }), _jsx(CollaborationDraft.GridTableColumnControl, {
          width: CommonHelper.isDesktop() ? "8%" : "3em",
          children: {
            template: _jsx(HBox, {
              children: _jsx(Button, {
                icon: "sap-icon://decline",
                type: "Transparent",
                press: this.removeUser,
                visible: "{= !!${internal>transient} }"
              })
            })
          }
        })]
      });
    }

    /**
     * Returns the table with the list of invited users.
     * @returns The control tree
     */;
    _proto.getManageDialogUserTable = function getManageDialogUserTable() {
      this.manageDialogUserTable = _jsx(CollaborationDraft.GridTableControl, {
        width: "100%",
        rows: {
          path: "internal>invitedUsers"
        },
        visibleRowCount: CommonHelper.isDesktop() ? "5" : "3",
        visibleRowCountMode: "Fixed",
        selectionMode: "None",
        children: {
          columns: this.getManageDialogUserTableColumns()
        }
      });
      return this.manageDialogUserTable;
    }

    /**
     * Returns the section on the dialog related to the user field.
     * @returns The control tree
     */;
    _proto.getManageDialogAddUserSection = function getManageDialogAddUserSection() {
      return _jsx(HBox, {
        class: "sapUiMediumMarginBottom",
        width: "100%",
        children: _jsx(Field, {
          value: "{internal>UserID}",
          additionalValue: "{internal>UserDescription}",
          display: "DescriptionValue",
          width: "20em",
          required: true,
          valueHelp: "userValueHelp",
          placeholder: this.getTranslatedText("C_COLLABORATIONDRAFT_INVITATION_INPUT_PLACEHOLDER"),
          change: this.addUserFieldChanged,
          children: {
            dependents: _jsx(ValueHelp, {
              id: "userValueHelp",
              delegate: this.getValueHelpDelegate(),
              validateInput: true,
              children: {
                typeahead: _jsx(MDCPopover, {
                  children: _jsx(MTable, {
                    caseSensitive: "true",
                    useAsValueHelp: "false"
                  })
                }),
                dialog: _jsx(MDCDialog, {})
              }
            })
          }
        })
      });
    };
    /**
     * Formatter to set the user color depending on the editing status.
     * @param userStatus The editing status of the user
     * @returns The user status color
     */
    _proto.formatUserStatusColor = function formatUserStatusColor(userStatus) {
      switch (userStatus) {
        case UserStatus.CurrentlyEditing:
          return ValueState.Success;
        case UserStatus.ChangesMade:
          return ValueState.Warning;
        case UserStatus.NoChangesMade:
        case UserStatus.NotYetInvited:
        default:
          return ValueState.Information;
      }
    }

    /**
     * Formatter to enable the invite button depending on the invited users status.
     * @param nbUsers Number of users
     * @param invitedUsers List of the invited users
     * @returns True or False
     */;
    _proto.formatInviteButton = function formatInviteButton(nbUsers, invitedUsers) {
      if (!nbUsers) {
        return false;
      }
      return !!invitedUsers?.some(user => user.status === 0);
    }

    /**
     * Add the added user to the list of invited users.
     * @param userInput The user to be invited
     * @param invitedUsers The users already invited
     * @param newUser The user to be invited
     */;
    _proto.addUser = function addUser(userInput, invitedUsers, newUser) {
      const internalModelContext = userInput.getBindingContext("internal");
      const activeUsers = userInput.getModel("internal").getProperty("/collaboration/activeUsers");
      newUser.name = newUser.name || newUser.id;
      newUser.initials = CollaborationUtils.formatInitials(newUser.name);
      newUser.color = CollaborationUtils.getUserColor(newUser.id, activeUsers, invitedUsers);
      newUser.transient = true;
      newUser.status = UserStatus.NotYetInvited;
      invitedUsers.push(newUser);
      internalModelContext.setProperty("invitedUsers", invitedUsers);
      internalModelContext.setProperty("UserID", "");
      internalModelContext.setProperty("UserDescription", "");
    };
    /**
     * Event handler to remove a user from the list of invited user.
     * @param event The event object of the remove button
     */
    _proto.removeUser = function removeUser(event) {
      const item = event.getSource();
      const internalModelContext = item?.getBindingContext("pageInternal");
      const deleteUserID = item?.getBindingContext("internal")?.getProperty("id");
      let invitedUsers = internalModelContext?.getProperty("collaboration/invitedUsers");
      invitedUsers = invitedUsers.filter(user => user.id !== deleteUserID);
      internalModelContext?.setProperty("collaboration/invitedUsers", invitedUsers);
    };
    /**
     * Fetches the list of users that are already invited in the draft.
     * @returns Promise with the list of user contexts.
     */
    _proto.requestInvitedUsersInDraft = async function requestInvitedUsersInDraft() {
      const model = this.getModel();
      const parameters = {
        $select: "UserID,UserDescription,UserEditingState"
      };
      const invitedUserList = model?.bindList("DraftAdministrativeData/DraftAdministrativeUser", this.getBindingContext(), [], [], parameters);

      // for now we set a limit to 100. there shouldn't be more than a few
      return invitedUserList.requestContexts(0, 100);
    };
    /**
     * Get the name of the object to be shared.
     * @param bindingContext The context of the page.
     * @returns The name of the object to be shared.
     */
    _proto.getSharedItemName = function getSharedItemName(bindingContext) {
      const headerInfo = this.contextObject?.targetEntityType.annotations.UI?.HeaderInfo;
      let sharedItemName = "";
      const title = headerInfo?.Title;
      if (title && isAnnotationOfType(title, ["com.sap.vocabularies.UI.v1.DataField", "com.sap.vocabularies.UI.v1.DataFieldWithAction", "com.sap.vocabularies.UI.v1.DataFieldWithActionGroup", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath", "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation", "com.sap.vocabularies.UI.v1.DataFieldWithUrl", "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath"])) {
        sharedItemName = isPathAnnotationExpression(title.Value) ? bindingContext.getProperty(title.Value.path) : title.Value;
      }
      return sharedItemName || headerInfo?.TypeName || "";
    }

    /**
     * Generates the delegate payload for the user field value help.
     * @returns The value help delegate payload
     */;
    _proto.getValueHelpDelegate = function getValueHelpDelegate() {
      // The non null assertion is safe here, because the action is only available if the annotation is present
      const actionName = (this.contextObject?.targetEntitySet.annotations.Common).DraftRoot.ShareAction.toString();
      // We are also sure that the action exist
      const action = this.contextObject?.targetEntityType.resolvePath(actionName);
      // By definition the action has a parameter with the name "Users"
      const userParameters = action.parameters.find(param => param.name === USERS_PARAMETERS);
      return {
        name: "sap/fe/macros/valuehelp/ValueHelpDelegate",
        payload: {
          propertyPath: `/${userParameters.type}/${USER_ID_PARAMETER}`,
          qualifiers: {},
          valueHelpQualifier: "",
          isActionParameterDialog: true
        }
      };
    }

    /**
     * Generate the expression binding of the Invitation dialog.
     * @returns The dialog title binding expression
     */;
    _proto.getInvitationDialogTitleExpBinding = function getInvitationDialogTitleExpBinding() {
      const headerInfo = this.contextObject?.targetEntityType.annotations.UI?.HeaderInfo;
      const title = getExpressionFromAnnotation(headerInfo?.Title?.Value, [], "");
      const params = ["C_COLLABORATIONDRAFT_INVITATION_DIALOG", headerInfo?.TypeName.toString(), title];
      const titleExpression = formatResult(params, collaborationFormatter.getFormattedText);
      return compileExpression(titleExpression);
    };
    /**
     * Returns the invite button if there's a share action on root level.
     * @returns The control tree
     */
    _proto.getInviteButton = function getInviteButton() {
      if (this.contextObject?.targetEntitySet?.annotations.Common?.DraftRoot?.ShareAction) {
        return _jsx(HBox, {
          visible: "{ui>/isEditable}",
          alignItems: "Center",
          justifyContent: "Start",
          children: _jsx(Avatar, {
            backgroundColor: "TileIcon",
            src: "sap-icon://add-employee",
            displaySize: "XS",
            press: this.manageCollaboration
          })
        });
      } else {
        return _jsx(HBox, {});
      }
    }

    /**
     * Returns the content of the collaboration draft building block.
     * @returns The control tree
     */;
    _proto.createContent = function createContent() {
      if (this._getOwner()?.getMetaModel() && ModelHelper.isCollaborationDraftSupported(this._getOwner().getMetaModel())) {
        return _jsxs(HBox, {
          children: [_jsx(HBox, {
            items: {
              path: "internal>/collaboration/activeUsers"
            },
            class: "sapUiTinyMarginBegin",
            visible: "{= ${ui>/isEditable} && ${internal>/collaboration/connected} }",
            alignItems: "Center",
            justifyContent: "Start",
            children: _jsx(Avatar, {
              initials: "{internal>initials}",
              displaySize: "XS",
              backgroundColor: "{internal>color}",
              press: this.showCollaborationUserDetails
            })
          }), this.getInviteButton()]
        });
      }
    };
    return CollaborationDraft;
  }(BuildingBlock), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "contextPath", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "id", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports = CollaborationDraft;
  return _exports;
}, false);
//# sourceMappingURL=CollaborationDraft-dbg.js.map
