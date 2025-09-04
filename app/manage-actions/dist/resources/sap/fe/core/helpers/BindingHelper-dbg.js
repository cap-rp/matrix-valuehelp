/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit"], function (BindingToolkit) {
  "use strict";

  var _exports = {};
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var not = BindingToolkit.not;
  var equal = BindingToolkit.equal;
  var and = BindingToolkit.and;
  const UI = {
    IsCreateMode: pathInModel("createMode", "pageInternal"),
    IsEditable: pathInModel("isEditable", "ui"),
    IsTransientBinding: equal(pathInModel("@$ui5.context.isTransient"), true),
    IsTotal: equal(pathInModel("@$ui5.node.isTotal"), true),
    IsExpanded: equal(pathInModel("@$ui5.node.isExpanded"), true),
    NodeLevel: pathInModel("@$ui5.node.level"),
    IsInactive: pathInModel("@$ui5.context.isInactive"),
    isNodeLevelNavigable: pathInModel("isNodeLevelNavigable", "internal"),
    hasCollaborationAuthorization: pathInModel("hasCollaborationAuthorization", "ui")
  };
  _exports.UI = UI;
  const Entity = {
    HasDraft: pathInModel("HasDraftEntity"),
    HasActive: pathInModel("HasActiveEntity"),
    IsActive: pathInModel("IsActiveEntity")
  };
  _exports.Entity = Entity;
  const Draft = {
    IsNewObject: and(not(Entity.HasActive), not(Entity.IsActive)),
    HasNoDraftForCurrentUser: or(not(Entity.HasDraft), and(Entity.HasDraft, not(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"))))
  };

  /**
   * Gets a singleton based on the fully qualified name.
   * @param convertedTypes The converted types
   * @param fullyQualifiedName The fully qualified name of the singleton
   * @returns The singleton instance.
   */
  _exports.Draft = Draft;
  function getSingleton(convertedTypes, fullyQualifiedName) {
    return convertedTypes.singletons.find(singleton => singleton.fullyQualifiedName === fullyQualifiedName);
  }

  /**
   * Function to adjust singleton paths in the annotation.
   * The absolute path via EntityContainer needs to be shortened to /SingletonName/PropertyName.
   * @param path The path configured in the annotation
   * @param convertedTypes The instance of the converter context
   * @param visitedNavigationPaths The array of visited navigation paths
   * @returns The adjusted path for the reference of the singleton property, otherwise the input path itself.
   */
  const singletonPathVisitor = function (path, convertedTypes, visitedNavigationPaths) {
    // Determine whether the path is absolute and whether it points to a singleton.
    if (path.indexOf("/") === 0) {
      const parts = path.split("/").filter(Boolean),
        propertyName = parts.pop(),
        entitySetName = parts.join("/"),
        singleton = getSingleton(convertedTypes, entitySetName);
      if (singleton) {
        // Set the absolute binding path to access the singleton property
        path = `/${singleton.name}/${propertyName}`;
      }
    } else {
      // Not a singleton reference.
      // Prefix the navigation path to the property path
      const localPath = visitedNavigationPaths.concat();
      localPath.push(path);
      path = localPath.join("/");
    }
    return path;
  };

  /**
   * Function to adjust property paths defined in the binding of an action.
   *
   * The binding parameter name needs to be removed. Singleton paths need to be resolved.
   * @param path The path configured in the annotation
   * @param convertedTypes Convertered metadata
   * @param bindingParameterFullName The fully qualified name of the binding parameter
   * @returns The adjusted property path
   */
  _exports.singletonPathVisitor = singletonPathVisitor;
  function bindingContextPathVisitor(path, convertedTypes, bindingParameterFullName) {
    if (bindingParameterFullName) {
      const bindingParameterPrefix = `${bindingParameterFullName?.substring(bindingParameterFullName.lastIndexOf("/") + 1)}/`;
      // Strip the binding parameter name from OperationAvailable path
      // For e.g. _it/property1 --> property1
      if (path.startsWith(bindingParameterPrefix)) {
        return path.substring(bindingParameterPrefix.length);
      }
    }
    return singletonPathVisitor(path, convertedTypes, []);
  }
  _exports.bindingContextPathVisitor = bindingContextPathVisitor;
  return _exports;
}, false);
//# sourceMappingURL=BindingHelper-dbg.js.map
