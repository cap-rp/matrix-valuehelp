/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/collaboration/CollaborationCommon", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/CommonHelper", "sap/m/Avatar", "sap/m/Button", "sap/m/Dialog", "sap/m/HBox", "sap/m/ObjectIdentifier", "sap/m/ObjectStatus", "sap/m/Text", "sap/m/VBox", "sap/ui/core/Lib", "sap/ui/core/library", "sap/ui/model/Filter", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs", "sap/fe/base/jsx-runtime/jsx"], function (CommonUtils, CollaborationCommon, ResourceModelHelper, CommonHelper, Avatar, Button, Dialog, HBox, ObjectIdentifier, ObjectStatus, Text, VBox, Lib, library, Filter, _Fragment, _jsxs, _jsx) {
  "use strict";

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
  var UserStatus = CollaborationCommon.UserStatus;
  var UserEditingState = CollaborationCommon.UserEditingState;
  var CollaborationUtils = CollaborationCommon.CollaborationUtils;
  let CollaborationDiscard = /*#__PURE__*/function () {
    function CollaborationDiscard(view, isSave) {
      /**
       * Formatter to set the user status depending on the editing status.
       * @param userStatus The editing status of the user
       * @returns The user status
       */
      this.formatUserStatus = userStatus => {
        switch (userStatus) {
          case UserStatus.CurrentlyEditing:
            return this.discardResourceModel.getText("C_COLLABORATIONDRAFT_USER_CURRENTLY_EDITING");
          case UserStatus.ChangesMade:
            return this.discardResourceModel.getText("C_COLLABORATIONDRAFT_USER_CHANGES_MADE");
          case UserStatus.NoChangesMade:
            return this.discardResourceModel.getText("C_COLLABORATIONDRAFT_USER_NO_CHANGES_MADE");
          case UserStatus.NotYetInvited:
          default:
            return this.discardResourceModel.getText("C_COLLABORATIONDRAFT_USER_NOT_YET_INVITED");
        }
      };
      /**
       * Event handler for the Save action of the manage dialog.
       *
       */
      this.saveManageDialog = () => {
        this.promiseResolve("save");
        this.manageDialog.close();
        this.manageDialog.destroy();
      };
      /**
       * Event handler for the Discard action of the manage dialog.
       *
       */
      this.discardManageDialog = () => {
        this.promiseResolve("discardConfirmed");
        this.manageDialog.close();
        this.manageDialog.destroy();
      };
      /**
       * Event handler for the Cancel action of the manage dialog.
       *
       */
      this.cancelManageDialog = () => {
        this.promiseResolve("cancel");
        this.manageDialog.close();
        this.manageDialog.destroy();
      };
      /**
       * Event handler for the Keep Draft action of the manage dialog.
       *
       */
      this.keepDraftManageDialog = () => {
        this.promiseResolve("keepDraft");
        this.manageDialog.close();
        this.manageDialog.destroy();
      };
      this.actionIsSave = isSave;
      this.containingView = view;
      this.discardResourceModel = ResourceModelHelper.getResourceModel(view);
      if (isSave) {
        this.actionButton = this.getSaveButton();
        this.topText = this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_EDITING_DRAFT");
        this.bottomText = this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_SAVE_WARNING");
      } else {
        this.actionButton = this.getDiscardButton();
        this.topText = this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_CHANGES_DRAFT");
        this.bottomText = this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_DISCARD_WARNING");
      }
    }
    _exports = CollaborationDiscard;
    CollaborationDiscard.load = async function load() {
      if (CollaborationDiscard.GridTableControl === undefined) {
        await Lib.load({
          name: "sap.ui.table"
        });
        const {
          default: GridTableControl
        } = await __ui5_require_async("sap/ui/table/Table");
        CollaborationDiscard.GridTableControl = GridTableControl;
        const {
          default: GridTableColumnControl
        } = await __ui5_require_async("sap/ui/table/Column");
        CollaborationDiscard.GridTableColumnControl = GridTableColumnControl;
      }
      return this;
    }

    /**
     * Returns the manage dialog used to invite further users.
     * @returns The control tree
     */;
    var _proto = CollaborationDiscard.prototype;
    _proto.getManageDialog = function getManageDialog() {
      this.manageDialog = _jsx(Dialog, {
        title: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_TITLE"),
        state: ValueState.Warning,
        contentWidth: "35em",
        children: {
          buttons: _jsxs(_Fragment, {
            children: ["keepDraftButton = ", this.getKeepDraftButton(), "confirmActionButton = ", this.actionButton, "cancelButton = ", this.getCancelButton()]
          }),
          content: _jsxs(VBox, {
            class: "sapUiSmallMargin",
            children: [_jsx(ObjectIdentifier, {
              class: "sapUiSmallMarginBottom",
              text: this.topText
            }), this.getManageDialogUserTable(), _jsx(Text, {
              class: "sapUiSmallMarginTop",
              text: this.bottomText
            }), _jsx(Text, {
              class: "sapUiSmallMarginTop",
              text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_QUESTION")
            })]
          })
        }
      });
      this.containingView.addDependent(this.manageDialog);
      this.manageDialog.bindElement({
        model: "internal",
        path: "collaboration"
      });
      return this.manageDialog;
    }

    /**
     * Returns the table columns of invited users.
     * @returns The control tree
     */;
    _proto.getManageDialogUserTableColumns = function getManageDialogUserTableColumns() {
      return _jsxs(_Fragment, {
        children: [_jsx(CollaborationDiscard.GridTableColumnControl, {
          width: "3em",
          children: {
            template: _jsx(HBox, {
              alignItems: "Center",
              justifyContent: "SpaceBetween",
              width: "100%",
              children: _jsx(Avatar, {
                displaySize: "XS",
                backgroundColor: "{internal>color}",
                initials: "{internal>initials}"
              })
            })
          }
        }), _jsx(CollaborationDiscard.GridTableColumnControl, {
          width: "10rem",
          children: {
            label: _jsx(Text, {
              text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_INVITATION_TABLE_USER_COLUMN")
            }),
            template: _jsx(Text, {
              text: "{internal>name}"
            })
          }
        }), _jsx(CollaborationDiscard.GridTableColumnControl, {
          width: "14em",
          children: {
            label: _jsx(Text, {
              text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_INVITATION_TABLE_USER_STATUS_COLUMN")
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
        })]
      });
    }

    /**
     * Returns the table with the list of invited users.
     * @returns The control tree
     */;
    _proto.getManageDialogUserTable = function getManageDialogUserTable() {
      const viewInternalModelContext = this.containingView.getBindingContext("internal");
      const editingUsers = viewInternalModelContext.getProperty("collaboration/currentlyEditingUsers");
      let tableRowCount;
      if (CommonHelper.isDesktop()) {
        tableRowCount = editingUsers.length < 5 ? editingUsers.length : 5;
      } else {
        tableRowCount = editingUsers.length < 3 ? editingUsers.length : 3;
      }
      return _jsx(CollaborationDiscard.GridTableControl, {
        width: "100%",
        rows: {
          path: "internal>currentlyEditingUsers"
        },
        visibleRowCount: tableRowCount,
        visibleRowCountMode: "Fixed",
        selectionMode: "None",
        children: {
          columns: this.getManageDialogUserTableColumns()
        }
      });
    }

    /**
     * Formatter to set the user color depending on the editing status.
     * @param userStatus The editing status of the user
     * @returns The user status color
     */;
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
    };
    /**
     * Reads the currently invited user and store it in the internal model.
     * @returns Promise that is resolved once the users are read.
     */
    _proto.readInvitedUsers = async function readInvitedUsers() {
      const view = this.containingView;
      const model = view.getModel();
      const parameters = {
        $select: "UserID,UserDescription,UserEditingState"
      };
      const invitedUserList = model.bindList("DraftAdministrativeData/DraftAdministrativeUser", view.getBindingContext(), [], [], parameters);
      const me = CollaborationUtils.getMe(CommonUtils.getAppComponent(view));
      const internalModelContext = view.getBindingContext("internal");
      if (me) {
        invitedUserList.filter(new Filter({
          path: "UserID",
          operator: "NE",
          value1: me.id
        }));
      }

      // for now we set a limit to 100. there shouldn't be more than a few
      const contexts = await invitedUserList.requestContexts(0, 100);
      const editingUsers = [];
      const activeUsers = view.getModel("internal").getProperty("/collaboration/activeUsers") || [];
      if (!contexts.length || contexts.length === 0) {
        internalModelContext.setProperty("collaboration/currentlyEditingUsers", []);
        return;
      }
      contexts.forEach(singleContext => {
        const userData = singleContext.getObject();
        const user = this.createUser(userData, activeUsers);
        if (user) {
          user.color = CollaborationUtils.getUserColor(userData.UserID, activeUsers, editingUsers);
          editingUsers.push(user);
        }
      });
      const sortedUsers = this.sortUser(editingUsers);
      internalModelContext.setProperty("collaboration/currentlyEditingUsers", sortedUsers);
    }

    /**
     * Reads the list of users currently editing the draft (except me) and stores it in the internal model.
     */;
    _proto.readCurrentUsers = function readCurrentUsers() {
      const view = this.containingView;
      const currentUsers = view.getModel("internal").getProperty("/collaboration/activeUsers") || [];
      const currentUsersWithoutMe = currentUsers.filter(user => user.me !== true).map(user => {
        return {
          ...user,
          status: UserStatus.CurrentlyEditing
        };
      });
      const internalModelContext = view.getBindingContext("internal");
      internalModelContext.setProperty("collaboration/currentlyEditingUsers", currentUsersWithoutMe);
    }

    /**
     * This sorts the user according the Editing Status.
     * CurrentlyEditing -> ChangesMade (Status 3 -> Status 2).
     * @param editingUsers The array of Users to sort
     * @returns The sorted array of Users
     */;
    _proto.sortUser = function sortUser(editingUsers) {
      let sortedUsers = editingUsers;
      if (editingUsers.length > 1) {
        // We define our Users just above, Status is always defined
        sortedUsers = editingUsers.sort((userA, userB) => {
          if (userA.status < userB.status) {
            return 1;
          } else if (userA.status > userB.status) {
            return -1;
          }
          return 0;
        });
      }
      return sortedUsers;
    };
    _proto.createUser = function createUser(userData, activeUsers) {
      let userStatus;
      const isActive = activeUsers.find(u => u.id === userData.UserID);
      const userDescription = userData.UserDescription ?? userData.UserID;
      const initials = CollaborationUtils.formatInitials(userDescription);
      if (isActive) {
        userStatus = UserStatus.CurrentlyEditing;
      } else if (userData.UserEditingState === UserEditingState.InProgress) {
        userStatus = UserStatus.ChangesMade;
      } else {
        // This case is for user that are just invited, but didn't make any changes
        return undefined;
      }
      const user = {
        id: userData.UserID,
        name: userDescription,
        status: userStatus,
        initials: initials
      };
      return user;
    }

    /**
     * Returns the Save button.
     * @returns A button
     */;
    _proto.getSaveButton = function getSaveButton() {
      return _jsx(Button, {
        text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_SAVE"),
        press: this.saveManageDialog
      });
    };
    /**
     * Returns the Discard button.
     * @returns A button
     */
    _proto.getDiscardButton = function getDiscardButton() {
      return _jsx(Button, {
        text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_DISCARD"),
        press: this.discardManageDialog
      });
    };
    /**
     * Returns the Cancel button.
     * @returns A button
     */
    _proto.getCancelButton = function getCancelButton() {
      return _jsx(Button, {
        text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_CANCEL"),
        press: this.cancelManageDialog
      });
    };
    /**
     * Returns the Save button.
     * @returns A button
     */
    _proto.getKeepDraftButton = function getKeepDraftButton() {
      return _jsx(Button, {
        text: this.discardResourceModel.getText("C_COLLABORATIONDRAFT_DISCARD_KEEP_DRAFT"),
        press: this.keepDraftManageDialog,
        type: "Emphasized"
      });
    };
    /**
     * Reads the users, and opens the dialog to get the user input.
     * @returns A string of the action selected by the user
     */
    _proto.getUserAction = async function getUserAction() {
      if (this.actionIsSave) {
        // In case of a Save, we only show the list of users which are currenly editing the draft
        this.readCurrentUsers();
      } else {
        await this.readInvitedUsers();
      }
      return this.open();
    }

    /**
     * Opens the discard draft from Discard/Cancel action.
     * @returns A string of the action selected by the user
     */;
    _proto.open = async function open() {
      await CollaborationDiscard.load();
      const internalModelContext = this.containingView.getBindingContext("internal");
      const editingUsers = internalModelContext.getProperty("collaboration/currentlyEditingUsers");
      if (editingUsers.length === 0) {
        return this.actionIsSave ? "save" : "discard";
      }
      // We create the dialog after reading the users
      this.manageDialog = this.getManageDialog();
      // We set up the binding context of the Dialog
      this.manageDialog.getBindingContext("internal").setProperty("currentlyEditingUsers", editingUsers);
      this.manageDialog.open();
      return new Promise(resolve => {
        this.promiseResolve = resolve;
      });
    };
    return CollaborationDiscard;
  }();
  _exports = CollaborationDiscard;
  return _exports;
}, false);
//# sourceMappingURL=CollaborationDiscardDialog-dbg.js.map
