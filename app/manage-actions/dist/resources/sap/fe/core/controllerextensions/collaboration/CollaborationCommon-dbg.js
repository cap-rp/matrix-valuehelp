/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Component", "sap/ui/core/Lib"], function (Component, Library) {
  "use strict";

  var _exports = {};
  // ADT Preview provides the user name and id for collaboration draft
  let UserStatus = /*#__PURE__*/function (UserStatus) {
    UserStatus[UserStatus["NotYetInvited"] = 0] = "NotYetInvited";
    UserStatus[UserStatus["NoChangesMade"] = 1] = "NoChangesMade";
    UserStatus[UserStatus["ChangesMade"] = 2] = "ChangesMade";
    UserStatus[UserStatus["CurrentlyEditing"] = 3] = "CurrentlyEditing";
    return UserStatus;
  }({});
  _exports.UserStatus = UserStatus;
  let UserEditingState = /*#__PURE__*/function (UserEditingState) {
    UserEditingState["NoChanges"] = "N";
    UserEditingState["InProgress"] = "P";
    return UserEditingState;
  }({}); // backend representation of a user according to collaboration draft spec
  _exports.UserEditingState = UserEditingState;
  let Activity = /*#__PURE__*/function (Activity) {
    Activity["Join"] = "JOIN";
    Activity["JoinEcho"] = "JOINECHO";
    Activity["Leave"] = "LEAVE";
    Activity["Change"] = "CHANGE";
    Activity["Create"] = "CREATE";
    Activity["Delete"] = "DELETE";
    Activity["Action"] = "ACTION";
    Activity["Lock"] = "LOCK";
    Activity["Activate"] = "ACTIVATE";
    Activity["Discard"] = "DISCARD";
    Activity["Unlock"] = "UNLOCK";
    return Activity;
  }({});
  _exports.Activity = Activity;
  function formatInitials(fullName) {
    // remove titles - those are the ones from S/4 to be checked if there are others
    const academicTitles = ["Dr.", "Prof.", "Prof. Dr.", "B.A.", "MBA", "Ph.D."];
    academicTitles.forEach(function (academicTitle) {
      fullName = fullName.replace(academicTitle, "");
    });
    let initials;
    const parts = fullName.trimStart().split(" ");
    if (parts.length > 1) {
      initials = (parts?.shift()?.charAt(0) || "") + parts.pop()?.charAt(0);
    } else {
      initials = fullName.substring(0, 2);
    }
    return initials.toUpperCase();
  }
  function getUserColor(UserID, activeUsers, invitedUsers) {
    // search if user is known
    const user = activeUsers.find(u => u.id === UserID);
    if (user) {
      return user.color;
    } else {
      // search for next free color
      for (let i = 1; i <= 10; i++) {
        if (activeUsers.findIndex(u => u.color === `Accent${i}`) === -1 && invitedUsers.findIndex(u => u.color === `Accent${i}`) === -1) {
          return `Accent${i}`;
        }
      }
      // this seems to be a popular object :) for now just return 10 for all.
      // for invited we should start from 1 again so the colors are different
      return "Accent10";
    }
  }

  // copied from CommonUtils. Due to a cycle dependency I can't use CommonUtils here.
  // That's to be fixed. the discard popover thingy shouldn't be in the common utils at all
  function getAppComponent(oControl) {
    if (oControl.isA("sap.fe.core.AppComponent")) {
      return oControl;
    }
    const oOwner = Component.getOwnerComponentFor(oControl);
    if (!oOwner) {
      return oControl;
    } else {
      return getAppComponent(oOwner);
    }
  }
  function getMe(appComponent) {
    const shellServiceHelper = appComponent.getShellServices();
    let initials, id, name;
    if (shellServiceHelper?.hasUShell()) {
      initials = shellServiceHelper.getUserInitials();
      id = shellServiceHelper.getUser().getId();
      name = shellServiceHelper.getUser().getFullName();
    } else if (window.adt) {
      // check if we are in ADT preview, if so use the user provided by ADT
      id = window.adt.userID;
      name = window.adt.userName;
      initials = formatInitials(name);
    } else {
      throw "No Shell... No User";
    }
    return {
      initials: initials,
      id: id,
      name: getText("C_COLLABORATIONDRAFT_ME", name),
      initialName: name,
      color: "Accent6",
      //  same color as FLP...
      me: true,
      status: UserStatus.CurrentlyEditing
    };
  }
  function getText(textId) {
    const oResourceModel = Library.getResourceBundleFor("sap.fe.core");
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    return oResourceModel.getText(textId, args);
  }
  _exports.getText = getText;
  const CollaborationUtils = {
    formatInitials: formatInitials,
    getUserColor: getUserColor,
    getMe: getMe,
    getAppComponent: getAppComponent,
    getText: getText
  };
  _exports.CollaborationUtils = CollaborationUtils;
  async function addSelf(metaModel, contextPath, model, context) {
    const shareActionName = metaModel.getObject(`${contextPath}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`);
    const shareAction = model.bindContext(`${shareActionName}(...)`, context);
    shareAction.setParameter("Users", []);
    shareAction.setParameter("ShareAll", true);
    shareAction.setParameter("IsDeltaUpdate", true);
    shareAction.setParameter("If-Match", "*");
    return shareAction.execute("$auto.Heroes", true);
  }
  _exports.addSelf = addSelf;
  async function shareObject(bindingContext) {
    let users = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    const model = bindingContext.getModel();
    const metaModel = model.getMetaModel();
    const entitySet = metaModel.getMetaPath(bindingContext.getPath());
    if (bindingContext.getObject() === undefined) {
      // If the context is not loaded yet, we load its keys first
      // This allows to load ETag data, that is then used when executing the Share action below
      const keys = metaModel.getObject(`${entitySet}/`).$Key;
      await bindingContext.requestProperty(keys);
    }
    const shareActionName = metaModel.getObject(`${entitySet}@com.sap.vocabularies.Common.v1.DraftRoot/ShareAction`);
    const shareAction = model.bindContext(`${shareActionName}(...)`, bindingContext);
    shareAction.setParameter("Users", users);
    shareAction.setParameter("ShareAll", true);
    return shareAction.execute("$auto.Workers");
  }
  _exports.shareObject = shareObject;
  function getActivityKeyFromPath(path) {
    return path.substring(path.lastIndexOf("(") + 1, path.lastIndexOf(")"));
  }
  _exports.getActivityKeyFromPath = getActivityKeyFromPath;
  const CollaborationFieldGroupPrefix = "_CollaborationDraft_";
  _exports.CollaborationFieldGroupPrefix = CollaborationFieldGroupPrefix;
  return _exports;
}, false);
//# sourceMappingURL=CollaborationCommon-dbg.js.map
