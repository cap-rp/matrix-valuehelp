/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/converters/MetaModelConverter", "sap/fe/core/helpers/ResourceModelHelper", "sap/m/Button", "sap/m/CustomListItem", "sap/m/Dialog", "sap/m/FlexItemData", "sap/m/HBox", "sap/m/List", "sap/m/Text", "sap/m/Toolbar", "sap/m/ToolbarSpacer", "sap/ui/base/ManagedObject", "sap/ui/core/library", "sap/ui/model/Sorter", "sap/ui/model/json/JSONModel", "../../formatters/ValueFormatter", "../../helpers/StandardRecommendationHelper", "sap/fe/base/jsx-runtime/jsx", "sap/fe/base/jsx-runtime/Fragment", "sap/fe/base/jsx-runtime/jsxs"], function (Log, ClassSupport, MetaModelConverter, ResourceModelHelper, Button, CustomListItem, Dialog, FlexItemData, HBox, List, Text, Toolbar, ToolbarSpacer, ManagedObject, library, Sorter, JSONModel, valueFormatters, StandardRecommendationHelper, _jsx, _Fragment, _jsxs) {
  "use strict";

  var _dec, _dec2, _class, _class2, _descriptor;
  var _exports = {};
  var standardRecommendationHelper = StandardRecommendationHelper.standardRecommendationHelper;
  var ValueState = library.ValueState;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var defineReference = ClassSupport.defineReference;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let RecommendationDialogDecision = /*#__PURE__*/function (RecommendationDialogDecision) {
    RecommendationDialogDecision["Accept"] = "Accept_Recommendations";
    RecommendationDialogDecision["Ignore"] = "Ignore_Recommendations";
    RecommendationDialogDecision["Continue"] = "Continue_Editing";
    RecommendationDialogDecision["Skipped"] = "Skipped";
    return RecommendationDialogDecision;
  }({});
  _exports.RecommendationDialogDecision = RecommendationDialogDecision;
  let ConfirmRecommendationDialog = (_dec = defineUI5Class("sap.fe.core.controls.Recommendations.ConfirmRecommendationDialog"), _dec2 = defineReference(), _dec(_class = (_class2 = /*#__PURE__*/function (_ManagedObject) {
    function ConfirmRecommendationDialog(props) {
      var _this;
      _this = _ManagedObject.call(this, props) || this;
      _initializerDefineProperty(_this, "confirmRecommendationDialog", _descriptor, _this);
      _this.view = props.view;
      _this.confirmRecommendationDialogResourceModel = getResourceModel(_this.view);
      return _this;
    }
    _exports.ConfirmRecommendationDialog = ConfirmRecommendationDialog;
    _inheritsLoose(ConfirmRecommendationDialog, _ManagedObject);
    var _proto = ConfirmRecommendationDialog.prototype;
    /**
     * Resolves the promise with the selected dialog list option
     */
    /**
     * Rejects the promise of open dialog
     */
    /**
     *
     * @returns Recommendation Data
     */
    _proto.getOpenRecommendations = function getOpenRecommendations() {
      const visibleContextPaths = this.getVisiblePageContextPaths();
      const openRecommendations = this.getOpenRecommendationsForVisibleContextPaths(visibleContextPaths);
      const recommendations = [];
      if (openRecommendations.length > 0) {
        openRecommendations.forEach(recommendation => {
          const context = this.view.getBindingContext();
          const propertyPath = recommendation.propertyPath ? recommendation.propertyPath : "";
          if (context?.getProperty(propertyPath) === null || context?.getProperty(propertyPath) === undefined || context?.getProperty(propertyPath) == "") {
            recommendations.push(recommendation);
          }
        });
      }
      return recommendations;
      // check if we have recommendations from the current page in the localAnnotationModel
      // return open recommendations.
    }

    /**
     *
     * @returns Collection of context paths
     */;
    _proto.getVisiblePageContextPaths = function getVisiblePageContextPaths() {
      const visiblePageContextPaths = [this.view.getBindingContext()?.getPath()];
      const controller = this.view.getController();
      const fclController = controller.getAppComponent().getRootViewController();
      const isFclEnabled = controller.getAppComponent()._isFclEnabled();
      const isFullScreen = isFclEnabled ? fclController.getHelper().getCurrentUIState().isFullScreen : true;
      if (isFclEnabled && !isFullScreen) {
        const rightMostContext = fclController.getRightmostContext();
        visiblePageContextPaths.push(rightMostContext?.getPath());
      }
      return visiblePageContextPaths;
    }

    /**
     *
     * @param contextPaths Paths of the contexts
     * @returns RecommendationData for visible contexts
     */;
    _proto.getOpenRecommendationsForVisibleContextPaths = function getOpenRecommendationsForVisibleContextPaths(contextPaths) {
      const openRecommendations = [];
      if (contextPaths.length > 0) {
        const localAnnotationModel = this.view.getModel().getLocalAnnotationModel();
        // check context paths in local annotation models which match to
        // 1. current page and
        // 2. immediate children of the current page
        // Need to consider also immediate children
        // iterate over all keys
        contextPaths.forEach(contextPath => {
          if (contextPath !== undefined) {
            const localAnnotationObject = localAnnotationModel.getObject(contextPath);
            if (localAnnotationObject) {
              const annotationObject = localAnnotationObject;
              /**
               * The local annotation object will be of the following structure :
               * {
               * "PropertyName@$ui5.fe.recommendations.placeholderDescription": Value
               * "PropertyName@$ui5.fe.recommendations.placeholderValue": Value
               * "PropertyName@$ui5.fe.recommendations.typeAheadValues": Value
               * PropertyName: {
               * 		"PropertyName@$ui5.fe.recommendations.placeholderDescription": Value
               * 		"PropertyName@$ui5.fe.recommendations.placeholderValue": Value
               * 		"PropertyName@$ui5.fe.recommendations.typeAheadValues": Value
               * 		recommendationContext:{ context }
               * 	 }
               * recommendationContext:{ context }
               * }
               *
               * so in order to get the recommendations as per each context - for parent/child entities we need to iterate over each keys recursively in the fetchLocalAnnotationObject function,
               * form the corresponding structure and then send it for getting the recommendations accordingly.
               */
              this.fetchLocalAnnotationObject(annotationObject, openRecommendations);
            }
          }
        });
      }
      return openRecommendations;
    }

    /**
     *
     * @param annotationObject
     * @param openRecommendations Recommendation Data
     */;
    _proto.fetchLocalAnnotationObject = function fetchLocalAnnotationObject(annotationObject, openRecommendations) {
      if (annotationObject["recommendationContext"]) {
        const recommendationObject = {};
        recommendationObject["recommendationContext"] = annotationObject["recommendationContext"];
        for (const currentKey in annotationObject) {
          const currentValue = annotationObject[currentKey];
          if (currentValue) {
            if (currentValue["recommendationContext"]) {
              this.fetchLocalAnnotationObject(annotationObject[currentKey], openRecommendations);
            } else if (currentKey.includes("@$ui5.fe.recommendations.placeholderValue") || currentKey.includes("@$ui5.fe.recommendations.placeholderDescription") || currentKey.includes("@$ui5.fe.recommendations.typeAheadValues")) {
              recommendationObject[currentKey] = currentValue;
            }
          }
        }
        const keys = MetaModelConverter.getInvolvedDataModelObjectEntityKeys(recommendationObject["recommendationContext"]);
        recommendationObject["recommendationContext"].contextIdentifier = keys["semanticKeys"] ? keys["semanticKeys"] : keys["technicalKeys"];
        this.getOpenRecommendationsForContext(recommendationObject, recommendationObject["recommendationContext"], openRecommendations);
      }
    }
    /**
     *
     * @param contextData The context data object for recommendations
     * @param recommendationContext The recommendation context
     * @param openRecommendations RecommendationData
     * @param contextKey Context Key
     */;
    _proto.getOpenRecommendationsForContext = function getOpenRecommendationsForContext(contextData, recommendationContext, openRecommendations) {
      let contextKey = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : "";
      for (const currentKey in contextData) {
        const currentValue = contextData[currentKey];
        if (currentValue) {
          const currentValueIsContext = currentValue.isA && currentValue.isA("sap.ui.model.odata.v4.Context");
          if (currentKey.includes("@$ui5.fe.recommendations.placeholderValue")) {
            const propertyPath = currentKey.split("@$ui5.fe.recommendations.placeholderValue")[0];
            const openRecommendation = {
              context: recommendationContext,
              propertyPath: contextKey ? `${contextKey}/${propertyPath}` : propertyPath,
              value: currentValue,
              contextIdentifier: recommendationContext.contextIdentifier,
              contextIdentifierText: []
            };
            const description = contextData[`${propertyPath}@$ui5.fe.recommendations.placeholderDescription`];
            if (description) {
              openRecommendation.text = description;
            }
            openRecommendations.push(openRecommendation);
          } else if (typeof currentValue === "object" && !Array.isArray(currentValue) && !currentValueIsContext) {
            this.getOpenRecommendationsForContext(currentValue, recommendationContext, openRecommendations, currentKey);
          }
        }
      }
    }

    /**
     * Opens the confirm recommendations dialog.
     * @param isSave Boolean flag which would be set to true if we are saving the document and would be false if we do apply changes
     * @returns Promise which would resolve with RecommendationDialogDecision (Accept, Ignore, Continue, Skipped)
     */;
    _proto.open = async function open(isSave) {
      // check for built-in recommendations
      const openRecommendations = this.getOpenRecommendations();
      if (openRecommendations.length > 0) {
        standardRecommendationHelper.addContextIdentifierText({
          recommendationData: openRecommendations
        }, this.view.getBindingContext()?.getPath());
        this.acceptAllParams = {
          recommendationData: openRecommendations
        };
      } else {
        // if built-in recommendations are not found then check for legacy recommendations.
        const legacyRecommendationsExist = (this.view?.getController()).recommendations.checkIfRecommendationsExist();
        if (legacyRecommendationsExist) {
          this.acceptAllParams = await (this.view?.getController()).recommendations.fetchAcceptAllParams();
        } else {
          return undefined;
        }
      }
      const acceptModel = this.getAcceptAllModel();
      this.view.setModel(acceptModel, "_acceptDialogModel");
      if (!acceptModel.getData().items?.length) {
        return RecommendationDialogDecision.Skipped;
      }
      this.isSave = isSave;
      const dialog = this.getContent();
      dialog?.setEscapeHandler(this.onContinueEditing.bind(this));
      this.view.addDependent(dialog);
      dialog?.open();
      return new Promise((resolve, reject) => {
        this.promiseResolve = resolve;
        this.promiseReject = reject;
      });
    }

    /**
     * Handler to close the confirmRecommendation dialog.
     *
     */;
    _proto.close = function close() {
      this.confirmRecommendationDialog.current?.close();
      this.confirmRecommendationDialog.current?.destroy();
    }

    /**
     * Handler for Accept and Save button.
     */;
    _proto.onAcceptAndSave = async function onAcceptAndSave() {
      try {
        const isAccepted = await (this.view?.getController()).recommendations.acceptRecommendations(this.acceptAllParams);
        if (!isAccepted) {
          this.promiseReject("Accept Failed");
        }
        this.promiseResolve(RecommendationDialogDecision.Accept);
      } catch {
        Log.error("Accept Recommendations Failed");
        this.promiseReject("Accept Failed");
      } finally {
        this.close();
      }
    }

    /**
     * Handler for Ignore and Save button.
     */;
    _proto.onIgnoreAndSave = function onIgnoreAndSave() {
      (this.view?.getController()).recommendations.ignoreRecommendationForContexts();
      this.promiseResolve(RecommendationDialogDecision.Ignore);
      this.close();
    }

    /**
     * Handler for Continue Editing button.
     */;
    _proto.onContinueEditing = function onContinueEditing() {
      this.promiseResolve(RecommendationDialogDecision.Continue);
      this.close();
    }

    /**
     * Gets the label or name of the Field based on its property path.
     * @param targetPath
     * @returns Returns the label of the Field.
     */;
    _proto.getFieldName = function getFieldName(targetPath) {
      const involvedDataModelObject = MetaModelConverter.getInvolvedDataModelObjectsForTargetPath(targetPath, this.view?.getBindingContext()?.getModel()?.getMetaModel());
      return involvedDataModelObject?.targetObject?.annotations?.Common?.Label?.toString() || targetPath.split("/")[targetPath.split("/").length - 1];
    }

    /**
     * Fetches text for recommendation based on display mode.
     * @param recommendation
     * @param displayMode
     * @returns Text for a recommendation
     */;
    _proto.getText = function getText(recommendation, displayMode) {
      if (recommendation.text || recommendation.value) {
        switch (displayMode) {
          case "Description":
            return recommendation.text;
          case "DescriptionValue":
            return valueFormatters.formatWithBrackets(recommendation.text, recommendation.value);
          case "ValueDescription":
            return valueFormatters.formatWithBrackets(recommendation.value, recommendation.text);
          case "Value":
            return recommendation.value;
        }
      }
      return recommendation.value || "";
    }

    /**
     * Returns Button with given text, type and pressHandler.
     * @param text Text for the button
     * @param type Type of the button
     * @param pressHandler Press Handler for the button
     * @returns Button with the given settings
     */;
    _proto.getButton = function getButton(text, type, pressHandler) {
      return _jsx(Button, {
        text: text,
        type: type,
        width: "auto",
        press: pressHandler,
        children: {
          layoutData: _jsx(_Fragment, {
            children: _jsx(FlexItemData, {
              minWidth: "100%"
            })
          })
        }
      });
    }

    /**
     * Returns Footer with Buttons.
     * @returns Footer
     */;
    _proto.getFooter = function getFooter() {
      return _jsx(Toolbar, {
        children: {
          content: _jsxs(_Fragment, {
            children: [_jsx(ToolbarSpacer, {}), this.getButton(this._getDialogButtonText(this.isSave, RecommendationDialogDecision.Accept), "Emphasized", this.onAcceptAndSave.bind(this)), this.getButton(this._getDialogButtonText(this.isSave, RecommendationDialogDecision.Ignore), "Ghost", this.onIgnoreAndSave.bind(this)), this.getButton(this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_CONTINUE_EDITING"), "Ghost", this.onContinueEditing.bind(this))]
          })
        }
      });
    };
    _proto._getDialogButtonText = function _getDialogButtonText(save, recommendationDialogDecision) {
      const isAcceptButton = recommendationDialogDecision === RecommendationDialogDecision.Accept;
      if (save) {
        if (!this.view.getBindingContext()?.getObject().HasActiveEntity) {
          return isAcceptButton ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_CREATE") : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_CREATE");
        }
        return isAcceptButton ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT_AND_SAVE") : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE_AND_SAVE");
      } else {
        return isAcceptButton ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_ACCEPT") : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_IGNORE");
      }
    }

    /**
     * This method created a JSON Model for the accept all dialog data.
     * @returns The JSON Model for accept all dialog.
     */;
    _proto.getAcceptAllModel = function getAcceptAllModel() {
      const acceptModel = new JSONModel();
      const items = [];
      for (const recommendationData of this.acceptAllParams?.recommendationData || []) {
        const entityNameLabel = standardRecommendationHelper.getEntityName(recommendationData.context) || "";
        const identifierTexts = recommendationData.contextIdentifierText && recommendationData.contextIdentifierText.length > 0 ? `${entityNameLabel} (${recommendationData.contextIdentifierText})` : entityNameLabel;
        if (recommendationData.value || recommendationData.text) {
          const targetPath = recommendationData.context?.getPath() + "/" + recommendationData.propertyPath;
          const displayMode = standardRecommendationHelper.getDisplayModeForTargetPath(targetPath, this.view?.getBindingContext()?.getModel()?.getMetaModel());
          const listData = {
            fieldName: this.getFieldName(targetPath).valueOf(),
            fieldValue: this.getText(recommendationData, displayMode),
            identifierTexts: identifierTexts
          };
          items.push(listData);
        }
      }
      acceptModel.setData({
        items: items
      });
      return acceptModel;
    }

    /**
     * This method groups the contexts according to the identifier texts.
     * @param context The context of the item
     * @returns The text of the group
     */;
    _proto.getGroup = function getGroup(context) {
      return context.getProperty("identifierTexts");
    }

    /**
     * This function returns the message to be shown in the accept dialog.
     * @returns A message with the desired text.
     */;
    _proto.getMessage = function getMessage() {
      const acceptAllData = this.view.getModel("_acceptDialogModel")?.getData()?.items;
      const messageText = acceptAllData.length > 1 ? this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT", [acceptAllData.length]) : this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TEXT_SINGULAR");
      return _jsx(Text, {
        text: messageText
      });
    }

    /**
     * This method creates the content for the dialog.
     * @returns A list as content of the dialog.
     */;
    _proto.getDialogContent = function getDialogContent() {
      return _jsx(List, {
        items: {
          model: "_acceptDialogModel",
          path: "/items",
          sorter: new Sorter("identifierTexts", false, this.getGroup)
        },
        children: _jsx(CustomListItem, {
          children: _jsx(HBox, {
            class: "sapUiSmallMarginBegin sapUiTinyMargin",
            children: _jsx(Text, {
              text: "{_acceptDialogModel>fieldName}: {_acceptDialogModel>fieldValue}"
            })
          })
        })
      });
    }

    /**
     * The building block render function.
     * @returns An XML-based string
     */;
    _proto.getContent = function getContent() {
      return _jsx(Dialog, {
        title: this.confirmRecommendationDialogResourceModel.getText("C_RECOMMENDATION_DIALOG_TITLE"),
        state: ValueState.Information,
        type: "Message",
        ref: this.confirmRecommendationDialog,
        resizable: "true",
        contentWidth: "35rem",
        children: {
          content: _jsxs(_Fragment, {
            children: [this.getMessage(), this.getDialogContent()]
          }),
          footer: _jsx(_Fragment, {
            children: this.getFooter()
          })
        }
      });
    };
    return ConfirmRecommendationDialog;
  }(ManagedObject), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "confirmRecommendationDialog", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  _exports.ConfirmRecommendationDialog = ConfirmRecommendationDialog;
  return _exports;
}, false);
//# sourceMappingURL=ConfirmRecommendationDialog-dbg.js.map
