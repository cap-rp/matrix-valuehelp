/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/BindingToolkit", "sap/fe/core/CommonUtils", "sap/fe/core/helpers/BindingHelper", "sap/fe/core/helpers/SizeHelper", "sap/fe/core/helpers/StableIdHelper", "sap/fe/core/helpers/TypeGuards", "sap/fe/core/templating/PropertyHelper", "sap/fe/core/templating/UIFormatters", "sap/fe/macros/formatters/TableFormatter", "sap/fe/macros/internal/helpers/ActionHelper", "sap/fe/macros/table/TableSizeHelper", "sap/ui/mdc/enums/FieldEditMode"], function (Log, BindingToolkit, CommonUtils, BindingHelper, SizeHelper, StableIdHelper, TypeGuards, PropertyHelper, UIFormatters, TableFormatter, ActionHelper, TableSizeHelper, FieldEditMode) {
  "use strict";

  var getEditMode = UIFormatters.getEditMode;
  var isImageURL = PropertyHelper.isImageURL;
  var hasText = PropertyHelper.hasText;
  var isPathAnnotationExpression = TypeGuards.isPathAnnotationExpression;
  var isAnnotationOfType = TypeGuards.isAnnotationOfType;
  var generate = StableIdHelper.generate;
  var UI = BindingHelper.UI;
  var resolveBindingString = BindingToolkit.resolveBindingString;
  var ref = BindingToolkit.ref;
  var pathInModel = BindingToolkit.pathInModel;
  var or = BindingToolkit.or;
  var ifElse = BindingToolkit.ifElse;
  var formatResult = BindingToolkit.formatResult;
  var fn = BindingToolkit.fn;
  var equal = BindingToolkit.equal;
  var constant = BindingToolkit.constant;
  var compileExpression = BindingToolkit.compileExpression;
  var and = BindingToolkit.and;
  /**
   * Helper class used by the control library for OData-specific handling (OData V4)
   * @private
   * @experimental This module is only for internal/experimental use!
   */
  const TableHelper = {
    /**
     * Check if a given action is static.
     * @param actionObject The instance or the path of the action
     * @param actionName The name of the action
     * @returns Returns 'true' if action is static, else 'false'
     * @private
     */
    _isStaticAction: function (actionObject, actionName) {
      let action;
      if (actionObject) {
        if (Array.isArray(actionObject)) {
          const entityType = this._getActionOverloadEntityType(actionName.toString());
          if (entityType) {
            action = actionObject.find(function (_action) {
              return _action.$IsBound && _action.$Parameter[0].$Type === entityType;
            });
          } else {
            // if this is just one - OK we take it. If it's more it's actually a wrong usage by the app
            // as we used the first one all the time we keep it as it is
            action = actionObject[0];
          }
        } else {
          action = actionObject;
        }
      }
      return !!action && typeof action !== "string" && action.$IsBound && !!action.$Parameter[0].$isCollection;
    },
    /**
     * Get the entity type of an action overload.
     * @param sActionName The name of the action.
     * @returns The entity type used in the action overload.
     * @private
     */
    _getActionOverloadEntityType: function (sActionName) {
      if (sActionName && sActionName.includes("(")) {
        const aParts = sActionName.split("(");
        return aParts[aParts.length - 1].replaceAll(")", "");
      }
      return undefined;
    },
    /**
     * Checks whether the action is overloaded on a different entity type.
     * @param sActionName The name of the action.
     * @param sAnnotationTargetEntityType The entity type of the annotation target.
     * @returns Returns 'true' if the action is overloaded with a different entity type, else 'false'.
     * @private
     */
    _isActionOverloadOnDifferentType: function (sActionName, sAnnotationTargetEntityType) {
      const sEntityType = this._getActionOverloadEntityType(sActionName);
      return !!sEntityType && sAnnotationTargetEntityType !== sEntityType;
    },
    getNavigationAvailableMap: function (lineItemCollection) {
      const oIBNNavigationAvailableMap = {};
      lineItemCollection?.forEach(record => {
        if ("SemanticObject" in record) {
          const sKey = `${record.SemanticObject}-${record.Action}`;
          if (record.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" && !record.Inline && record.RequiresContext) {
            if (record.NavigationAvailable !== undefined) {
              oIBNNavigationAvailableMap[sKey] = isPathAnnotationExpression(record.NavigationAvailable) ? record.NavigationAvailable.path : record.NavigationAvailable;
            }
          }
        }
      });
      return Object.keys(oIBNNavigationAvailableMap).length > 0 ? oIBNNavigationAvailableMap : undefined;
    },
    getUiLineItemObject: function (lineItemOrPresentationContext, convertedMetaData) {
      const lineItemOrPresentationObject = convertedMetaData.resolvePath(lineItemOrPresentationContext.getPath()).target;
      if (!lineItemOrPresentationObject) return undefined;
      const visualizations = convertedMetaData.resolvePath(lineItemOrPresentationContext.getPath()).target.Visualizations;
      const lineItemObject = visualizations ? visualizations?.find(item => item.value.indexOf("@" + "com.sap.vocabularies.UI.v1.LineItem") === 0)?.$target : lineItemOrPresentationObject;
      return lineItemObject?.term === "com.sap.vocabularies.UI.v1.LineItem" ? lineItemObject : undefined;
    },
    /**
     * Creates and returns the binding expression to load a given list of properties.
     * @param properties List of properties used on a custom column
     * @returns The binding expression to load the given list of properties
     */
    createBindingToLoadProperties: function (properties) {
      if (properties === undefined || properties.length === 0) {
        return undefined;
      }
      const propertyBindings = properties?.map(prop => pathInModel(prop)) ?? [];
      return compileExpression(formatResult(propertyBindings, "sap.fe.core.formatters.StandardFormatter#loadProperties"));
    },
    /**
     * Method to get column's width if defined from manifest or from customization via annotations.
     * @param oThis The instance of the inner model of the Table building block
     * @param oThis.enableAutoColumnWidth Indicates if the column width should be calculated automatically
     * @param oThis.widthIncludingColumnHeader Indicates if the column width should include the header
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField DataField definition object
     * @param dataFieldActionText DataField's text from button
     * @param dataModelObjectPath The object path of the data model
     * @param useRemUnit Indicates if the rem unit must be concatenated with the column width result
     * @param microChartTitle The object containing title and description of the MicroChart
     * @param microChartTitle.title The title of the microchart
     * @param microChartTitle.description The description of the microchart
     * @returns - Column width if defined, otherwise width is set to auto
     */
    getColumnWidth: function (oThis, column, dataField, dataFieldActionText, dataModelObjectPath, useRemUnit, microChartTitle) {
      if (column.width) {
        return column.width;
      }
      if (oThis.enableAutoColumnWidth === true) {
        let width;
        width = this.getColumnWidthForImage(dataModelObjectPath) || this.getColumnWidthForDataField(oThis, column, dataField, dataFieldActionText, dataModelObjectPath, microChartTitle) || undefined;
        if (width) {
          return useRemUnit ? `${width}rem` : width;
        }
        width = compileExpression(formatResult([pathInModel("/editMode", "ui"), pathInModel("tablePropertiesAvailable", "internal"), column.name, useRemUnit, this._shouldIncludeHeaderInColumnwidhCalculation(oThis, column), column.sortable ?? false, resolveBindingString(column.required ?? false, "boolean")], TableFormatter.getColumnWidth));
        return width;
      }
      return undefined;
    },
    /**
     * Method to get the width of the column containing an image.
     * @param dataModelObjectPath The data model object path
     * @returns - Column width if defined, otherwise null (the width is treated as a rem value)
     */
    getColumnWidthForImage: function (dataModelObjectPath) {
      let width = null;
      const annotations = dataModelObjectPath.targetObject?.Value?.$target?.annotations;
      const dataType = dataModelObjectPath.targetObject?.Value?.$target?.type;
      if (dataModelObjectPath.targetObject?.Value && getEditMode(dataModelObjectPath.targetObject.Value?.$target, dataModelObjectPath, false, false, dataModelObjectPath.targetObject) === FieldEditMode.Display && dataModelObjectPath.targetObject.Value?.$target) {
        const hasTextAnnotation = hasText(dataModelObjectPath.targetObject.Value.$target);
        if (dataType === "Edm.Stream" && !hasTextAnnotation && annotations?.Core?.MediaType?.includes?.("image/")) {
          width = 6.2;
        }
      } else if (annotations && (isImageURL(dataModelObjectPath.targetObject?.Value?.$target) || annotations?.Core?.MediaType?.includes?.("image/"))) {
        width = 6.2;
      }
      return width;
    },
    /**
     * Check if the column header should be included in the column width.
     * @param table The table configuration object
     * @param table.widthIncludingColumnHeader Indicates if the column width should include the header
     * @param column The column configuration
     * @returns Returns true if the column width should include the header
     */
    _shouldIncludeHeaderInColumnwidhCalculation(table, column) {
      return column.widthIncludingColumnHeader !== undefined ? column.widthIncludingColumnHeader : table.widthIncludingColumnHeader;
    },
    /**
     * Method to get the width of the column containing the DataField.
     * @param oThis The instance of the inner model of the Table building block
     * @param oThis.widthIncludingColumnHeader Indicates if the column width should include the header
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField Data Field
     * @param dataFieldActionText DataField's text from button
     * @param dataModelObjectPath The data model object path
     * @param microChartTitle The object containing the title and description of the MicroChart
     * @returns - Column width if defined, otherwise null ( the width is treated as a rem value)
     */
    getColumnWidthForDataField: function (oThis, column, dataField, dataFieldActionText, dataModelObjectPath, microChartTitle) {
      const annotations = dataModelObjectPath.targetObject?.annotations;
      const dataType = dataModelObjectPath.targetObject?.$Type;
      let width = null;
      if (dataType === "com.sap.vocabularies.UI.v1.DataFieldForAction" || dataType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || dataType === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && !dataField.Target?.$AnnotationPath.includes(`@${"com.sap.vocabularies.UI.v1.FieldGroup"}`)) {
        let nTmpTextWidth;
        nTmpTextWidth = SizeHelper.getButtonWidth(dataFieldActionText) || SizeHelper.getButtonWidth(dataField?.Label?.toString()) || SizeHelper.getButtonWidth(annotations?.Label); // REVIEW : This makes no sense :)

        // get width for rating or progress bar datafield
        const nTmpVisualizationWidth = TableSizeHelper.getWidthForDataFieldForAnnotation(dataModelObjectPath.targetObject, this._shouldIncludeHeaderInColumnwidhCalculation(oThis, column)).propertyWidth;
        if (nTmpVisualizationWidth > nTmpTextWidth) {
          width = nTmpVisualizationWidth;
        } else if (dataFieldActionText || annotations && (isAnnotationOfType(annotations, "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") || isAnnotationOfType(annotations, "com.sap.vocabularies.UI.v1.DataFieldForAction"))) {
          // Add additional 1.8 rem to avoid showing ellipsis in some cases.
          nTmpTextWidth += 1.8;
          width = nTmpTextWidth;
        }
        width = width ?? this.getColumnWidthForChart(oThis, column, dataField, nTmpTextWidth, microChartTitle);
      }
      return width;
    },
    /**
     * Method to get the width of the column containing the Chart.
     * @param oThis The instance of the inner model of the Table building block
     * @param column Defined width of the column, which is taken with priority if not null, undefined or empty
     * @param dataField Data Field
     * @param columnLabelWidth The width of the column label or button label
     * @param microChartTitle The object containing the title and the description of the MicroChart
     * @returns - Column width if defined, otherwise null (the width is treated as a rem value)
     */
    getColumnWidthForChart(oThis, column, dataField, columnLabelWidth, microChartTitle) {
      let chartSize,
        width = null;
      if (dataField.Target?.$AnnotationPath?.includes(`@${"com.sap.vocabularies.UI.v1.Chart"}`)) {
        switch (this.getChartSize(oThis, column)) {
          case "XS":
            chartSize = 4.4;
            break;
          case "S":
            chartSize = 4.6;
            break;
          case "M":
            chartSize = 5.5;
            break;
          case "L":
            chartSize = 6.9;
            break;
          default:
            chartSize = 5.3;
        }
        columnLabelWidth += 1.8;
        if (!this.getShowOnlyChart(oThis, column) && (microChartTitle?.title.length || microChartTitle?.description.length)) {
          const tmpText = microChartTitle.title.length > microChartTitle.description.length ? microChartTitle.title : microChartTitle.description;
          const titleSize = SizeHelper.getButtonWidth(tmpText) + 7;
          const tmpWidth = titleSize > columnLabelWidth ? titleSize : columnLabelWidth;
          width = tmpWidth;
        } else if (columnLabelWidth > chartSize) {
          width = columnLabelWidth;
        } else {
          width = chartSize;
        }
      }
      return width;
    },
    /**
     * Method to add a margin class at the control.
     * @param sVisualization
     * @param isLastField Indicates if the field is the last field in the field group
     * @returns Adjusting the margin
     */
    getMarginClass: function (sVisualization, isLastField) {
      let sClass = "";
      if (isLastField) {
        //If rating indicator is last element in fieldgroup, then the 0.5rem margin added by sapMRI class of interactive rating indicator on top and bottom must be nullified.
        if (sVisualization == "com.sap.vocabularies.UI.v1.VisualizationType/Rating") {
          sClass = "sapUiNoMarginBottom sapUiNoMarginTop";
        }
      } else if (sVisualization === "com.sap.vocabularies.UI.v1.VisualizationType/Rating") {
        //If rating indicator is NOT the last element in fieldgroup, then to maintain the 0.5rem spacing between cogetMarginClassntrols (as per UX spec),
        //only the top margin added by sapMRI class of interactive rating indicator must be nullified.

        sClass = "sapUiNoMarginTop";
      } else {
        sClass = "sapUiTinyMarginBottom";
      }
      return sClass;
    },
    /**
     * Method to get VBox visibility.
     * @param collection Collection of data fields in VBox
     * @param fieldGroupHiddenExpressions Hidden expression contained in FieldGroup
     * @param fieldGroup Data field containing the VBox
     * @returns Visibility expression
     */
    getVBoxVisibility: function (collection, fieldGroupHiddenExpressions, fieldGroup) {
      let allStatic = true;
      const hiddenPaths = [];
      if (fieldGroup[`@${"com.sap.vocabularies.UI.v1.Hidden"}`]) {
        return fieldGroupHiddenExpressions;
      }
      for (const dataField of collection) {
        const hiddenAnnotationValue = dataField[`@${"com.sap.vocabularies.UI.v1.Hidden"}`];
        if (hiddenAnnotationValue === undefined || hiddenAnnotationValue === false) {
          hiddenPaths.push(false);
          continue;
        }
        if (hiddenAnnotationValue === true) {
          hiddenPaths.push(true);
          continue;
        }
        if (hiddenAnnotationValue.$Path) {
          hiddenPaths.push(pathInModel(hiddenAnnotationValue.$Path));
          allStatic = false;
          continue;
        }
        if (typeof hiddenAnnotationValue === "object") {
          // Dynamic expression found in a field
          return fieldGroupHiddenExpressions;
        }
      }
      const hasAnyPathExpressions = constant(hiddenPaths.length > 0 && allStatic !== true);
      const hasAllHiddenStaticExpressions = constant(hiddenPaths.length > 0 && !hiddenPaths.includes(false) && allStatic);
      return compileExpression(ifElse(hasAnyPathExpressions, formatResult(hiddenPaths, TableFormatter.getVBoxVisibility), ifElse(hasAllHiddenStaticExpressions, constant(false), constant(true))));
    },
    /**
     * Method to get the stable ID of a table element (column or FieldGroup label).
     * @param tableId Current object ID
     * @param elementId Element Id or suffix
     * @param dataModelObjectPath DataModelObjectPath of the dataField
     * @returns The stable ID for a given column
     */
    getElementStableId: function (tableId, elementId, dataModelObjectPath) {
      if (!tableId) {
        return undefined;
      }
      const dataField = dataModelObjectPath.targetObject;
      let dataFieldPart;
      switch (dataField?.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAnnotation":
          dataFieldPart = dataField.Target.value;
          break;
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
        case "com.sap.vocabularies.UI.v1.DataFieldWithUrl":
          dataFieldPart = dataField;
          break;
        default:
          dataFieldPart = dataField.Value?.path ?? "";
          break;
      }
      return generate([tableId, elementId, dataFieldPart]);
    },
    /**
     * Method to get the stable ID of the column.
     * @param id Current object ID
     * @param dataModelObjectPath DataModelObjectPath of the dataField
     * @returns The stable ID for a given column
     */
    getColumnStableId: function (id, dataModelObjectPath) {
      return TableHelper.getElementStableId(id, "C", dataModelObjectPath);
    },
    getFieldGroupLabelStableId: function (id, dataModelObjectPath) {
      return TableHelper.getElementStableId(id, "FGLabel", dataModelObjectPath);
    },
    /**
     * Method to get the expression for the 'press' event for the DataFieldForActionButton.
     * @param tableProperties The properties of the table control
     * @param tableProperties.contextObjectPath The datamodel object path for the table
     * @param tableProperties.contentId The id of the MDC table control
     * @param dataField Value of the DataPoint
     * @param entitySetName Name of the EntitySet
     * @param operationAvailableMap OperationAvailableMap as stringified JSON object
     * @param actionObject
     * @param isNavigable Action either triggers navigation or not
     * @param enableAutoScroll Action either triggers scrolling to the newly created items in the related table or not
     * @param defaultValuesExtensionFunction Function name to prefill dialog parameters
     * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
     * @returns The binding expression
     */
    pressEventDataFieldForActionButton: function (tableProperties, dataField, entitySetName, operationAvailableMap, actionObject) {
      let isNavigable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;
      let enableAutoScroll = arguments.length > 6 ? arguments[6] : undefined;
      let defaultValuesExtensionFunction = arguments.length > 7 ? arguments[7] : undefined;
      let forContextMenu = arguments.length > 8 ? arguments[8] : undefined;
      if (!dataField) return undefined;
      const sActionName = dataField.Action,
        targetEntityTypeName = tableProperties.contextObjectPath.targetEntityType.fullyQualifiedName,
        staticAction = typeof actionObject !== "string" && (this._isStaticAction(actionObject, sActionName) || this._isActionOverloadOnDifferentType(sActionName.toString(), targetEntityTypeName)),
        applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu",
        notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu",
        contextMenuPath = !forContextMenu ? "" : "contextmenu/",
        context = pathInModel(`${contextMenuPath}selectedContexts`, "internal"),
        params = {
          contexts: !staticAction ? context : null,
          bStaticAction: staticAction ? staticAction : undefined,
          entitySetName: entitySetName,
          applicableContexts: !staticAction ? pathInModel(`dynamicActions/${dataField.Action}/${applicableProperty}/`, "internal") : null,
          notApplicableContexts: !staticAction ? pathInModel(`dynamicActions/${dataField.Action}/${notApplicableProperty}/`, "internal") : null,
          isNavigable: isNavigable,
          enableAutoScroll: enableAutoScroll,
          defaultValuesExtensionFunction: defaultValuesExtensionFunction,
          invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
          controlId: tableProperties.contentId,
          operationAvailableMap: operationAvailableMap,
          label: dataField.Label
        };
      return compileExpression(fn("API.onActionPress", [ref("$event"), ref("$controller"), dataField.Action, params]));
      //return ActionHelper.getPressEventDataFieldForActionButton(table.id!, dataField, params, operationAvailableMap);
    },
    /**
     * Method to determine the binding expression for 'enabled' property of DataFieldForAction actions.
     * @param tableDefinition The table definition from the table converter
     * @param actionName The name of the action
     * @param isBound IsBound for Action
     * @param actionObject
     * @param enableOnSelect Define the enabling of the action (single or multiselect)
     * @param annotationTargetEntityType The entity type of the annotation target
     * @param forContextMenu Indicates if the action appears in the context menu. If false, the action appears in the table toolbar
     * @param isCopy
     * @returns A binding expression to define the 'enabled' property of the action
     */
    isDataFieldForActionEnabled: function (tableDefinition, actionName, isBound, actionObject, enableOnSelect, annotationTargetEntityType, forContextMenu, isCopy) {
      if (!annotationTargetEntityType) return false;
      const isStaticAction = this._isStaticAction(actionObject, actionName);

      // Check for action overload on a different Entity type.
      // If yes, table row selection is not required to enable this action.
      if (this._isActionOverloadOnDifferentType(actionName.toString(), annotationTargetEntityType.fullyQualifiedName)) {
        // Action overload defined on different entity type
        const oOperationAvailableMap = tableDefinition && JSON.parse(tableDefinition.operationAvailableMap);
        if (oOperationAvailableMap?.hasOwnProperty(actionName)) {
          // Core.OperationAvailable annotation defined for the action.
          // Need to refer to internal model for enabled property of the dynamic action.
          // return compileBinding(bindingExpression("dynamicActions/" + sActionName + "/bEnabled", "internal"), true);
          return !forContextMenu ? `{= \${internal>dynamicActions/${actionName}/bEnabled} }` : `{= \${internal>dynamicActions/${actionName}/bEnabledForContextMenu} }`;
        }
        // Consider the action just like any other static DataFieldForAction.
        return true;
      }
      if (!isBound || isStaticAction) {
        return true;
      }
      const numberOfSelectedContexts = isCopy ? ActionHelper.getNumberOfContextsExpression("single", forContextMenu) : ActionHelper.getNumberOfContextsExpression(enableOnSelect ?? "multiselect", forContextMenu);
      let dataFieldForActionEnabledExpression = "";
      const action = !forContextMenu ? `\${internal>dynamicActions/${actionName}/bEnabled}` : `\${internal>dynamicActions/${actionName}/bEnabledForContextMenu}`;
      dataFieldForActionEnabledExpression = `${numberOfSelectedContexts} && ${action}`;
      return `{= ${dataFieldForActionEnabledExpression}}`;
    },
    /**
     * Method to determine the binding expression for 'enabled' property of DataFieldForIBN actions.
     * @param tableProperties The properties of the table control
     * @param tableProperties.collection  The collection context to be used
     * @param tableProperties.tableDefinition The table definition from the table converter
     * @param dataField The value of the data field
     * @param requiresContext RequiresContext for IBN
     * @param isNavigationAvailable Define if the navigation is available
     * @param forContextMenu
     * @returns A binding expression to define the 'enabled' property of the action
     */
    isDataFieldForIBNEnabled: function (tableProperties, dataField, requiresContext, isNavigationAvailable, forContextMenu) {
      let isNavigationAvailablePath = null;
      if (isPathAnnotationExpression(isNavigationAvailable)) {
        isNavigationAvailablePath = isNavigationAvailable.path;
      }
      const isAnalyticalTable = tableProperties?.tableDefinition?.enableAnalytics;
      if (!requiresContext) {
        const entitySet = tableProperties.collection.getPath();
        const metaModel = tableProperties.collection.getModel();
        if (isNavigationAvailable === false && !isAnalyticalTable) {
          Log.warning("NavigationAvailable as false is incorrect usage");
          return false;
        } else if (isNavigationAvailablePath && !isAnalyticalTable && isPathAnnotationExpression(dataField?.NavigationAvailable) && metaModel.getObject(entitySet + "/$Partner") === dataField.NavigationAvailable.path.split("/")[0]) {
          return `{= \${${isNavigationAvailablePath.substring(isNavigationAvailablePath.indexOf("/") + 1, isNavigationAvailablePath.length)}}}`;
        }
        return true;
      }
      let dataFieldForIBNEnabledExpression = "",
        numberOfSelectedContexts,
        action;
      if (isNavigationAvailable === true || isAnalyticalTable) {
        dataFieldForIBNEnabledExpression = !(forContextMenu ?? false) ? "%{internal>numberOfSelectedContexts} >= 1" : "%{internal>contextmenu/numberOfSelectedContexts} >= 1";
      } else if (isNavigationAvailable === false) {
        Log.warning("NavigationAvailable as false is incorrect usage");
        return false;
      } else {
        numberOfSelectedContexts = !(forContextMenu ?? false) ? "%{internal>numberOfSelectedContexts} >= 1" : "%{internal>contextmenu/numberOfSelectedContexts} >= 1";
        action = !(forContextMenu ?? false) ? `\${internal>ibn/${dataField.SemanticObject}-${dataField.Action}/bEnabled}` : `\${internal>ibn/${dataField.SemanticObject}-${dataField.Action}/bEnabledForContextMenu}`;
        dataFieldForIBNEnabledExpression = numberOfSelectedContexts + " && " + action;
      }
      return `{= ${dataFieldForIBNEnabledExpression}}`;
    },
    buildExpressionForMultiValueFieldReadOnly: function (table) {
      return compileExpression(ifElse(or(table.readOnly === true, and(UI.IsInactive, table.creationMode.name === "InlineCreationRows")), constant(true), equal(table.fieldMode, "nowrapper")));
    },
    /**
     * Method to set the visibility of the label for the column header.
     * @param datafield DataField
     * @param dataFieldCollection List of items inside a fieldgroup (if any)
     * @returns `true` if the header label needs to be visible else false.
     */
    setHeaderLabelVisibility: function (datafield, dataFieldCollection) {
      // If Inline button/navigation action, return false, else true;
      if (!dataFieldCollection) {
        if (datafield.$Type?.includes("DataFieldForAction") && datafield.Inline) {
          return false;
        }
        if (datafield.$Type?.includes("DataFieldForIntentBasedNavigation") && datafield.Inline) {
          return false;
        }
        return true;
      }

      // In Fieldgroup, If NOT all datafield/datafieldForAnnotation exists with hidden, return true;
      return dataFieldCollection.some(function (oDC) {
        if ((oDC.$Type === "com.sap.vocabularies.UI.v1.DataField" || oDC.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") && oDC[`@${"com.sap.vocabularies.UI.v1.Hidden"}`] !== true) {
          return true;
        }
      });
    },
    /**
     * Method to get the text from the DataFieldForAnnotation into the column.
     * @param oDataField DataPoint's Value
     * @param oContext Context object of the LineItem
     * @param oContext.context Context object of the LineItem
     * @returns String from label referring to action text
     */
    getTextOnActionField: function (oDataField, oContext) {
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
        return oDataField.Label;
      }
      // for FieldGroup containing DataFieldForAnnotation
      if (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation" && oContext.context.getObject("Target/$AnnotationPath").indexOf("@" + "com.sap.vocabularies.UI.v1.FieldGroup") > -1) {
        const sPathDataFields = "Target/$AnnotationPath/Data/";
        const aMultipleLabels = [];
        for (const i in oContext.context.getObject(sPathDataFields)) {
          if (oContext.context.getObject(`${sPathDataFields + i}/$Type`) === "com.sap.vocabularies.UI.v1.DataFieldForAction" || oContext.context.getObject(`${sPathDataFields + i}/$Type`) === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
            aMultipleLabels.push(oContext.context.getObject(`${sPathDataFields + i}/Label`));
          }
        }
        // In case there are multiple actions inside a Field Group select the largest Action Label
        if (aMultipleLabels.length > 1) {
          return aMultipleLabels.reduce(function (a, b) {
            return a.length > b.length ? a : b;
          });
        } else {
          return aMultipleLabels.length === 0 ? undefined : aMultipleLabels.toString();
        }
      }
      return undefined;
    },
    _getResponsiveTableColumnSettings: function (oThis, oColumn) {
      if (oThis.tableType === "ResponsiveTable") {
        return oColumn.settings;
      }
      return undefined;
    },
    getChartSize: function (oThis, oColumn) {
      const settings = this._getResponsiveTableColumnSettings(oThis, oColumn);
      if (settings && settings.microChartSize) {
        return settings.microChartSize;
      }
      return "XS";
    },
    getShowOnlyChart: function (oThis, oColumn) {
      const settings = this._getResponsiveTableColumnSettings(oThis, oColumn);
      if (settings && settings.showMicroChartLabel) {
        return !settings.showMicroChartLabel;
      }
      return true;
    },
    getDelegate: function (table, isALP, entityName, filterOnActiveEntities) {
      let delegate;
      if (isALP) {
        // We don't support TreeTable in ALP
        if (table.control.type === "TreeTable") {
          throw new Error("TreeTable not supported in Analytical ListPage");
        }
        delegate = {
          name: "sap/fe/macros/table/delegates/ALPTableDelegate",
          payload: {
            collectionName: entityName
          }
        };
        if (table.enableAnalytics && filterOnActiveEntities) {
          delegate.payload.filterOnActiveEntities = true;
        }
      } else if (table.control.type === "TreeTable") {
        if (!table.control.hierarchyQualifier) {
          throw new Error("A hierarchy qualifier is mandatory with a TreeTable");
        }
        delegate = {
          name: "sap/fe/macros/table/delegates/TreeTableDelegate",
          payload: {
            hierarchyQualifier: table.control.hierarchyQualifier,
            initialExpansionLevel: table.annotation.initialExpansionLevel,
            filterOnActiveEntities,
            createInPlace: table.control.createInPlace === true
          }
        };
      } else {
        delegate = {
          name: "sap/fe/macros/table/delegates/TableDelegate"
        };
        if (table.enableAnalytics && filterOnActiveEntities) {
          delegate.payload = {
            filterOnActiveEntities
          };
        }
      }
      if (table.enableAnalytics === true && table.control.analyticalConfiguration?.aggregationOnLeafLevel === true) {
        delegate.payload = {
          ...delegate.payload,
          ...{
            aggregationConfiguration: {
              leafLevel: true
            }
          }
        };
      }
      return JSON.stringify(delegate);
    },
    /**
     * @param oFastCreationRow
     * @param sPath
     * @param oContext
     * @param oModel
     * @param oFinalUIState
     */
    enableFastCreationRow: async function (oFastCreationRow, sPath, oContext, oModel, oFinalUIState) {
      let oFastCreationListBinding, oFastCreationContext;
      if (oFastCreationRow) {
        try {
          await oFinalUIState;
          // If a draft is discarded while a message strip filter is active on the table there is a table rebind caused by the DataStateIndicator
          // To prevent a new creation row binding being created at that moment we check if the context is already deleted
          if (CommonUtils.getIsEditable(oFastCreationRow) && !oContext.isDeleted()) {
            oFastCreationListBinding = oModel.bindList(sPath, oContext, [], [], {
              $$updateGroupId: "doNotSubmit",
              $$groupId: "doNotSubmit"
            });
            // Workaround suggested by OData model v4 colleagues
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            oFastCreationListBinding.refreshInternal = function () {
              /* do nothing */
            };
            oFastCreationContext = oFastCreationListBinding.create();
            oFastCreationRow.setBindingContext(oFastCreationContext);

            // this is needed to avoid console error
            try {
              await oFastCreationContext.created();
            } catch (e) {
              Log.trace("transient fast creation context deleted");
            }
          }
        } catch (oError) {
          Log.error("Error while computing the final UI state", oError);
        }
      }
    },
    /**
     * Evaluates, if action should be shown in the table context menu.
     * Show action only for bound actions, when requiresSelection is set for custom actions or when context is required for IBN actions.
     * @param action The instance of the action
     * @param contextObjectPath The data model object path
     * @returns Returns true, if action should be displayed in context menu, false otherwise
     */
    isActionShownInContextMenu: function (action, contextObjectPath) {
      const dataField = action.annotationPath ? contextObjectPath.convertedTypes.resolvePath(action.annotationPath).target : undefined;
      switch (dataField?.$Type) {
        case "com.sap.vocabularies.UI.v1.DataFieldForAction":
          {
            const actionTarget = dataField.ActionTarget;
            return actionTarget?.isBound === true && !actionTarget.parameters[0].isCollection && actionTarget.sourceEntityType === contextObjectPath.targetEntityType;
          }
        case "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation":
          return dataField.RequiresContext?.valueOf() === true;
        default:
          if (action.type === "Default") {
            return action.requiresSelection === true;
          }
      }
      return false;
    }
  };
  TableHelper.getNavigationAvailableMap.requiresIContext = true;
  TableHelper.getTextOnActionField.requiresIContext = true;
  return TableHelper;
}, false);
//# sourceMappingURL=TableHelper-dbg.js.map
