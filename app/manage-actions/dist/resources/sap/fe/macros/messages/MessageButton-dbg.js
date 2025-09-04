/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log", "sap/fe/base/ClassSupport", "sap/fe/core/CommonUtils", "sap/fe/core/controllerextensions/messageHandler/messageHandling", "sap/fe/core/helpers/ResourceModelHelper", "sap/fe/macros/messages/MessagePopover", "sap/m/Button", "sap/m/ColumnListItem", "sap/m/FormattedText", "sap/m/library", "sap/ui/core/CustomData", "sap/ui/core/Element", "sap/ui/core/Lib", "sap/ui/core/Messaging", "sap/ui/core/message/MessageType", "sap/ui/core/mvc/View", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/Sorter", "sap/ui/thirdparty/jquery", "./MessageButtonHelper"], function (Log, ClassSupport, CommonUtils, messageHandling, ResourceModelHelper, MessagePopover, Button, ColumnListItem, FormattedText, library, CustomData, UI5Element, Library, Messaging, MessageType, View, Filter, FilterOperator, Sorter, jQuery, messageButtonHelper) {
  "use strict";

  var _dec, _dec2, _dec3, _class, _class2, _descriptor, _descriptor2;
  var ButtonType = library.ButtonType;
  var getResourceModel = ResourceModelHelper.getResourceModel;
  var event = ClassSupport.event;
  var defineUI5Class = ClassSupport.defineUI5Class;
  var aggregation = ClassSupport.aggregation;
  function _initializerDefineProperty(e, i, r, l) { r && Object.defineProperty(e, i, { enumerable: r.enumerable, configurable: r.configurable, writable: r.writable, value: r.initializer ? r.initializer.call(l) : void 0 }); }
  function _inheritsLoose(t, o) { t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o); }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _applyDecoratedDescriptor(i, e, r, n, l) { var a = {}; return Object.keys(n).forEach(function (i) { a[i] = n[i]; }), a.enumerable = !!a.enumerable, a.configurable = !!a.configurable, ("value" in a || a.initializer) && (a.writable = !0), a = r.slice().reverse().reduce(function (r, n) { return n(i, e, r) || r; }, a), l && void 0 !== a.initializer && (a.value = a.initializer ? a.initializer.call(l) : void 0, a.initializer = void 0), void 0 === a.initializer ? (Object.defineProperty(i, e, a), null) : a; }
  function _initializerWarningHelper(r, e) { throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform."); }
  let MessageButton = (_dec = defineUI5Class("sap.fe.macros.messages.MessageButton"), _dec2 = aggregation({
    type: "sap.fe.macros.messages.MessageFilter",
    multiple: true,
    singularName: "customFilter"
  }), _dec3 = event(), _dec(_class = (_class2 = /*#__PURE__*/function (_Button) {
    function MessageButton(id, settings) {
      var _this;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      _this = _Button.call(this, id, settings) || this;
      _initializerDefineProperty(_this, "customFilters", _descriptor, _this);
      _initializerDefineProperty(_this, "messageChange", _descriptor2, _this);
      _this.sGeneralGroupText = "";
      _this.sViewId = "";
      _this.sLastActionText = "";
      return _this;
    }
    _inheritsLoose(MessageButton, _Button);
    var _proto = MessageButton.prototype;
    _proto.init = function init() {
      Button.prototype.init.apply(this);
      this.isHiddenDraftEnabled = CommonUtils.getAppComponent(this)?.getEnvironmentCapabilities()?.getCapabilities()?.HiddenDraft?.enabled;
      //press event handler attached to open the message popover
      this.attachPress(this.handleMessagePopoverPress, this);
      this.oMessagePopover = new MessagePopover();
      this.oItemBinding = this.oMessagePopover.getBinding("items");
      this.oItemBinding.attachChange(this._setMessageData, this);
      const messageButtonId = this.getId();
      if (messageButtonId) {
        this.oMessagePopover.addCustomData(new CustomData({
          key: "messageButtonId",
          value: messageButtonId
        })); // TODO check for custom data type
      }
      this.attachModelContextChange(this._applyFiltersAndSort.bind(this));
      this.oMessagePopover.attachActiveTitlePress(this._activeTitlePress.bind(this));
    }

    /**
     * The method that is called when a user clicks on the MessageButton control.
     * @param oEvent Event object
     */;
    _proto.handleMessagePopoverPress = function handleMessagePopoverPress(oEvent) {
      this.oMessagePopover.toggle(oEvent.getSource());
    }

    /**
     * The method that groups the messages based on the section or subsection they belong to.
     * This method force the loading of contexts for all tables before to apply the grouping.
     * @param oView Current view.
     * @returns Return promise.
     * @private
     */;
    _proto._applyGroupingAsync = async function _applyGroupingAsync(oView) {
      const aWaitForData = [];
      const oViewBindingContext = oView.getBindingContext();
      const _findTablesRelatedToMessages = view => {
        const oRes = [];
        const aMessages = this.oItemBinding.getContexts().map(function (oContext) {
          return oContext.getObject();
        });
        const oViewContext = view.getBindingContext();
        if (oViewContext) {
          const oObjectPage = view.getContent()[0];
          messageHandling.getVisibleSectionsFromObjectPageLayout(oObjectPage).forEach(function (oSection) {
            oSection.getSubSections().forEach(function (oSubSection) {
              oSubSection.findElements(true).forEach(function (oElem) {
                if (oElem.isA("sap.ui.mdc.Table")) {
                  for (let i = 0; i < aMessages.length; i++) {
                    const oRowBinding = oElem.getRowBinding();
                    if (oRowBinding) {
                      const sElemeBindingPath = `${oViewContext.getPath()}/${oElem.getRowBinding().getPath()}`;
                      if (aMessages[i].target.indexOf(sElemeBindingPath) === 0) {
                        oRes.push({
                          table: oElem,
                          subsection: oSubSection
                        });
                        break;
                      }
                    }
                  }
                }
              });
            });
          });
        }
        return oRes;
      };
      // Search for table related to Messages and initialize the binding context of the parent subsection to retrieve the data
      const oTables = _findTablesRelatedToMessages.bind(this)(oView);
      oTables.forEach(function (_oTable) {
        const oMDCTable = _oTable.table,
          oSubsection = _oTable.subsection;
        if (!oMDCTable.getBindingContext() || oMDCTable.getBindingContext()?.getPath() !== oViewBindingContext?.getPath()) {
          oSubsection.setBindingContext(oViewBindingContext);
          if (!oMDCTable.getRowBinding().isLengthFinal()) {
            aWaitForData.push(new Promise(function (resolve) {
              oMDCTable.getRowBinding().attachEventOnce("dataReceived", function () {
                resolve();
              });
            }));
          }
        }
      });
      const waitForGroupingApplied = new Promise(resolve => {
        setTimeout(() => {
          this._applyGrouping();
          resolve();
        }, 0);
      });
      try {
        await Promise.all(aWaitForData);
        oView.getModel().checkMessages();
        await waitForGroupingApplied;
      } catch (err) {
        Log.error("Error while grouping the messages in the messagePopOver");
      }
    }

    /**
     * The method that groups the messages based on the section or subsection they belong to.
     * @private
     */;
    _proto._applyGrouping = function _applyGrouping() {
      this.oObjectPageLayout = this._getObjectPageLayout(this, this.oObjectPageLayout);
      if (!this.oObjectPageLayout) {
        return;
      }
      const messages = this.oMessagePopover.getItems();
      const section = messageHandling.getVisibleSectionsFromObjectPageLayout(this.oObjectPageLayout);
      const enableBinding = this._checkControlIdInSections(messages, false);
      if (enableBinding) {
        this._fnEnableBindings(section);
      }
      //Clear messageTargetProperty
      const viewId = this._getViewId(this.getId());
      const view = UI5Element.getElementById(viewId);
      const uIModel = view?.getModel("internal");
      uIModel?.setProperty("/messageTargetProperty", undefined);
    }

    /**
     * The method retrieves the binding context for the refError object.
     * The refError contains a map to store the indexes of the rows with errors.
     * @param oTable The table for which we want to get the refError Object.
     * @returns Context of the refError.
     * @private
     */;
    _proto._getTableRefErrorContext = function _getTableRefErrorContext(oTable) {
      const oModel = oTable.getModel("internal");
      //initialize the refError property if it doesn't exist
      if (!oTable.getBindingContext("internal")?.getProperty("refError")) {
        oModel.setProperty("refError", {}, oTable.getBindingContext("internal"));
      }
      const sRefErrorContextPath = oTable.getBindingContext("internal")?.getPath() + "/refError/" + oTable.getBindingContext()?.getPath().replace("/", "$") + "$" + oTable.getRowBinding().getPath().replace("/", "$");
      const oContext = oModel.getContext(sRefErrorContextPath);
      if (!oContext.getProperty("")) {
        oModel.setProperty("", {}, oContext);
      }
      return oContext;
    };
    _proto._updateInternalModel = function _updateInternalModel(tableRowContext, rowIndex, tableTargetColProperty, table, messageObject, isCreationRow) {
      let temp;
      if (isCreationRow) {
        temp = {
          rowIndex: "CreationRow",
          targetColProperty: tableTargetColProperty ? tableTargetColProperty : ""
        };
      } else {
        temp = {
          rowIndex: tableRowContext ? rowIndex : "",
          targetColProperty: tableTargetColProperty ? tableTargetColProperty : ""
        };
      }
      const model = table.getModel("internal"),
        context = this._getTableRefErrorContext(table);
      //we first remove the entries with obsolete message ids from the internal model before inserting the new error info :
      const aValidMessageIds = Messaging.getMessageModel().getData().map(function (message) {
        return message.getId();
      });
      let aObsoleteMessagelIds;
      if (context?.getProperty("")) {
        aObsoleteMessagelIds = Object.keys(context?.getProperty("")).filter(function (internalMessageId) {
          return aValidMessageIds.indexOf(internalMessageId) === -1;
        });
        aObsoleteMessagelIds.forEach(function (obsoleteId) {
          delete context?.getProperty("")[obsoleteId];
        });
      }
      model?.setProperty(messageObject.getId(), Object.assign({}, context?.getProperty(messageObject.getId()) ? context.getProperty(messageObject.getId()) : {}, temp), context);
    }

    /**
     * The method that sets groups for transient messages.
     * @param message The transient message for which we want to compute and set group.
     * @param sActionName The action name.
     * @private
     */;
    _proto._setGroupLabelForTransientMsg = function _setGroupLabelForTransientMsg(message, sActionName) {
      this.sLastActionText = this.sLastActionText ? this.sLastActionText : Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_LAST_ACTION");
      message.setGroupName(`${this.sLastActionText}: ${sActionName}`);
    }

    /**
     * The method that groups messages and adds the subtitle.
     * @param message The message we use to compute the group and subtitle.
     * @param section The section containing the controls.
     * @param subSection The subsection containing the controls.
     * @param elements List of controls from a subsection related to a message.
     * @param hasMultipleSubSections True if there is more than 1 subsection in the section.
     * @param actionName The action name, if any.
     * @returns Return the control targeted by the message.
     * @private
     */;
    _proto._computeMessageGroupAndSubTitle = function _computeMessageGroupAndSubTitle(message, section, subSection, elements, hasMultipleSubSections, actionName) {
      const resourceModel = getResourceModel(section);
      this.oItemBinding.detachChange(this._setMessageData, this);
      const messageObject = message.getBindingContext("message")?.getObject();
      const setSectionNameInGroup = true;
      let element,
        table,
        targetTableInfo = {},
        l,
        rowIndex,
        targetedControl,
        isCreationRow;
      const isBackEndMessage = new RegExp("^/").test(messageObject?.getTargets()[0]);
      if (isBackEndMessage) {
        for (l = 0; l < elements.length; l++) {
          element = elements[l];
          targetedControl = element;
          if (element.isA("sap.m.Table") || element.isA("sap.ui.table.Table")) {
            table = element.getParent();
            const rowBinding = table.getRowBinding();
            const fnCallbackSetGroupName = () => {
              this._setGroupLabelForTransientMsg(message, actionName);
            };
            if (rowBinding && rowBinding.isLengthFinal() && table.getBindingContext()) {
              const obj = messageHandling.getTableColumnDataAndSetSubtile(messageObject, table, element, rowBinding, actionName, setSectionNameInGroup, fnCallbackSetGroupName);
              targetTableInfo = obj.oTargetTableInfo;
              if (obj.subTitle) {
                message.setSubtitle(obj.subTitle);
              }
              message.setActiveTitle(!!targetTableInfo.oTableRowContext && !targetTableInfo.oTableRowContext?.isInactive() &&
              // check if the rowcontext is active
              targetTableInfo.oTableRowContext.getPath() !== message.getBindingContext("message")?.getProperty("target").replace(/\/$/, "") // check if the target of the message is not the row itself (remove the last / if presents)
              );
              if (targetTableInfo.oTableRowContext && !targetTableInfo.oTableRowContext.isInactive()) {
                this._formatMessageDescription(message, targetTableInfo.oTableRowContext, targetTableInfo.sTableTargetColName, table);
              }
              rowIndex = targetTableInfo.oTableRowContext && targetTableInfo.oTableRowContext.getIndex();
              this._updateInternalModel(targetTableInfo.oTableRowContext, rowIndex, targetTableInfo.sTableTargetColProperty, table, messageObject);
            }
          } else {
            message.setActiveTitle(true);
            if (message.getSubtitle() === "") {
              let formElement;
              let parent = targetedControl.getParent();
              while (parent) {
                if (parent && parent.isA("sap.ui.layout.form.FormElement")) {
                  formElement = parent;
                  break;
                }
                parent = parent.getParent();
              }
              if (formElement) {
                message.setSubtitle(formElement.getLabel());
              }
            }

            //check if the targeted control is a child of one of the other controls
            const isTargetedControlOrphan = messageHandling.bIsOrphanElement(targetedControl, elements);
            if (isTargetedControlOrphan) {
              break;
            }
          }
        }
      } else {
        //There is only one elt as this is a frontEnd message
        targetedControl = elements[0];
        table = this._getMdcTable(targetedControl);
        targetTableInfo = {};
        if (table) {
          targetTableInfo.tableHeader = table.getHeader();
          const targetColumnIndex = this._getTableColumnIndex(targetedControl);
          targetTableInfo.sTableTargetColProperty = targetColumnIndex !== undefined && targetColumnIndex > -1 ? table.getColumns()[targetColumnIndex].getPropertyKey() : undefined;
          targetTableInfo.sTableTargetColName = targetTableInfo.sTableTargetColProperty && targetColumnIndex !== undefined && targetColumnIndex > -1 ? table.getColumns()[targetColumnIndex].getHeader() : undefined;
          isCreationRow = this._getTableRow(targetedControl)?.isA("sap.ui.table.CreationRow") ?? false;
          if (!isCreationRow) {
            rowIndex = this._getTableRowIndex(targetedControl);
            targetTableInfo.oTableRowBindingContexts = table.getRowBinding().getCurrentContexts();
            targetTableInfo.oTableRowContext = rowIndex !== undefined ? targetTableInfo.oTableRowBindingContexts[rowIndex] : undefined;
          }
          const messageSubtitle = messageHandling.getMessageSubtitle(messageObject, targetTableInfo.oTableRowBindingContexts, targetTableInfo.oTableRowContext, targetTableInfo.sTableTargetColName, table, isCreationRow, targetColumnIndex === 0 && targetedControl.getValueState() === "Error" ? targetedControl : undefined);
          //set the subtitle
          if (messageSubtitle) {
            message.setSubtitle(messageSubtitle);
          }
          message.setActiveTitle(!!targetTableInfo.oTableRowContext);
          if (targetTableInfo.oTableRowContext) {
            this._formatMessageDescription(message, targetTableInfo.oTableRowContext, targetTableInfo.sTableTargetColName, table);
          }
          this._updateInternalModel(targetTableInfo.oTableRowContext, rowIndex, targetTableInfo.sTableTargetColProperty, table, messageObject, isCreationRow);
        }
      }
      if (setSectionNameInGroup) {
        const includeTableGroupName = this._checkMergeLogicForMessageGrouping(section, subSection, hasMultipleSubSections);
        const sectionBasedGroupName = messageHandling.createSectionGroupName(section, subSection, hasMultipleSubSections, targetTableInfo, resourceModel, includeTableGroupName);
        message.setGroupName(sectionBasedGroupName);
        const viewId = this._getViewId(this.getId());
        const view = UI5Element.getElementById(viewId);
        const messageTargetProperty = messageObject.getTargets()[0] && messageObject.getTargets()[0].split("/").pop();
        const uIModel = view?.getModel("internal");
        if (uIModel && uIModel.getProperty("/messageTargetProperty") && messageTargetProperty && messageTargetProperty === uIModel.getProperty("/messageTargetProperty")) {
          this.oMessagePopover.fireActiveTitlePress({
            item: message
          });
          uIModel.setProperty("/messageTargetProperty", false);
        }
      }
      this.oItemBinding.attachChange(this._setMessageData, this);
      return targetedControl;
    }

    /**
     * The method to check if the section and subsection has single table control.
     * @param section ObjectPage section.
     * @param subSection ObjectPage sub section.
     * @param hasMultipleSubSections True if there is more than 1 subsection in the section.
     * @returns Returns boolean value for the single control inside the section, by default it is true.
     * @private
     */;
    _proto._checkMergeLogicForMessageGrouping = function _checkMergeLogicForMessageGrouping(section, subSection, hasMultipleSubSections) {
      const viewId = this._getViewId(this.getId());
      const view = viewId ? UI5Element.getElementById(viewId) : undefined;
      let bIncludeTableGroupName = true;
      const singleSubsectionInPageLayout = !hasMultipleSubSections && view?.getViewData()?.sectionLayout === "Page";
      const multiSubsectionInTabLayout = hasMultipleSubSections && view?.getViewData()?.sectionLayout === "Tabs";
      if (singleSubsectionInPageLayout) {
        const block = subSection.getBlocks();
        const content = block.length === 1 ? block[0].getAggregation("content") : undefined;
        if (content?.isA("sap.fe.macros.table.TableAPI")) {
          bIncludeTableGroupName = false;
        }
      } else if (multiSubsectionInTabLayout) {
        let content;
        const blocks = subSection.getBlocks();
        // In case of Reference Facet, the first block will be SubSectionBlock
        if (blocks.length === 1 && blocks[0]?.isA("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
          content = blocks[0].getAggregation("content");
          if (content?.isA("sap.fe.macros.table.TableAPI")) {
            bIncludeTableGroupName = false;
          } else if (content?.isA("sap.ui.layout.DynamicSideContent")) {
            content = content.getMainContent instanceof Function && content?.getMainContent();
            if (content && content.length === 1 && content[0]?.isA("sap.fe.macros.table.TableAPI")) {
              bIncludeTableGroupName = false;
            }
          }
        }
      }
      return bIncludeTableGroupName;
    };
    _proto._checkControlIdInSections = function _checkControlIdInSections(messages, enableBinding) {
      let section, aSubSections, message, i, j, k;
      this.sGeneralGroupText = this.sGeneralGroupText ? this.sGeneralGroupText : Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
      //Get all sections from the object page layout
      const aVisibleSections = messageHandling.getVisibleSectionsFromObjectPageLayout(this.oObjectPageLayout);
      if (aVisibleSections) {
        const viewId = this._getViewId(this.getId());
        const oView = viewId ? UI5Element.getElementById(viewId) : undefined;
        const sActionName = oView?.getBindingContext("internal")?.getProperty("sActionName");
        if (sActionName) {
          (oView?.getBindingContext("internal")).setProperty("sActionName", null);
        }
        for (i = messages.length - 1; i >= 0; --i) {
          // Loop over all messages
          message = messages[i];
          let bIsGeneralGroupName = true;
          for (j = aVisibleSections.length - 1; j >= 0; --j) {
            let shouldBreak = false;
            // Loop over all visible sections
            section = aVisibleSections[j];
            aSubSections = section.getSubSections();
            for (k = aSubSections.length - 1; k >= 0; --k) {
              // Loop over all sub-sections
              const subSection = aSubSections[k];
              const oMessageObject = message?.getBindingContext("message")?.getObject();
              this.sGeneralGroupText = this._getGeneralGroupText(oView, oMessageObject);
              const aControls = messageHandling.getControlFromMessageRelatingToSubSection(subSection, oMessageObject);
              if (aControls.length > 0) {
                const oTargetedControl = this._computeMessageGroupAndSubTitle(message, section, subSection, aControls, aSubSections.length > 1, sActionName);
                bIsGeneralGroupName = false;
                // if we found table that matches with the message, we don't stop the loop
                // in case we find an additional control (eg mdc field) that also match with the message
                if (oTargetedControl && !oTargetedControl.isA("sap.m.Table") && !oTargetedControl.isA("sap.ui.table.Table")) {
                  shouldBreak = true;
                  break;
                }
              }
            }
            if (shouldBreak) {
              break;
            }
          }
          if (bIsGeneralGroupName) {
            const oMessageObject = message.getBindingContext("message")?.getObject();
            if (this.isHiddenDraftEnabled) {
              message.setActiveTitle(true);
            } else {
              message.setActiveTitle(false);
            }
            if (oMessageObject.persistent && sActionName) {
              this._setGroupLabelForTransientMsg(message, sActionName);
            } else {
              message.setGroupName(this.sGeneralGroupText);
            }
          }
          if (!enableBinding && message.getGroupName() === this.sGeneralGroupText && this._findTargetForMessage(message)) {
            // when the section is not available in the view port
            return true;
          }
        }
      }
    }

    //Fetches the group name of the message based on enabledment of hidden draft and page where error is present(current page/other page)
    ;
    _proto._getGeneralGroupText = function _getGeneralGroupText(oView, oMessageObject) {
      const viewPath = oView?.getBindingContext()?.getPath();
      const messageTargetPath = oMessageObject?.getTargets()[0];
      if (this.isHiddenDraftEnabled && viewPath && !messageTargetPath.includes(viewPath)) {
        return Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_OTHER_PAGES");
      } else {
        return Library.getResourceBundleFor("sap.fe.core").getText("T_MESSAGE_BUTTON_SAPFE_MESSAGE_GROUP_GENERAL");
      }
    };
    _proto._findTargetForMessage = function _findTargetForMessage(message) {
      const messageObject = message.getBindingContext("message") && message.getBindingContext("message")?.getObject();
      if (messageObject && messageObject.target) {
        const oMetaModel = this.oObjectPageLayout?.getModel()?.getMetaModel(),
          contextPath = oMetaModel && oMetaModel.getMetaPath(messageObject.target),
          oContextPathMetadata = oMetaModel && oMetaModel.getObject(contextPath);
        if (oContextPathMetadata && oContextPathMetadata.$kind === "Property") {
          return true;
        }
      }
      return false;
    }

    /**
     * Enable bindings of sub section content (blocks, more blocks, and actions).
     * @param subSection Object page sub section
     */;
    _proto._fnEnableSubSectionBinding = function _fnEnableSubSectionBinding(subSection) {
      subSection.getBlocks().forEach(block => block.setBindingContext(undefined));
      subSection.getMoreBlocks().forEach(subBlock => subBlock.setBindingContext(undefined));
      subSection.getActions().forEach(actions => actions.setBindingContext(undefined));
    };
    _proto._fnEnableBindings = function _fnEnableBindings(aSections) {
      for (let iSection = 0; iSection < aSections.length; iSection++) {
        const oSection = aSections[iSection];
        const aSubSections = oSection.getSubSections();
        for (let iSubSection = 0; iSubSection < aSubSections.length; iSubSection++) {
          const oSubSection = aSubSections[iSubSection];
          const oAllBlocks = oSubSection.getBlocks();
          if (oAllBlocks) {
            this._fnEnableSubSectionBinding(oSubSection);
          }
          if (oSubSection.getBindingContext()) {
            this._findMessageGroupAfterRebinding();
            oSubSection.getBindingContext().getBinding().attachDataReceived(this._findMessageGroupAfterRebinding.bind(this));
          }
        }
      }
    };
    _proto._findMessageGroupAfterRebinding = function _findMessageGroupAfterRebinding() {
      const aMessages = this.oMessagePopover.getItems();
      this._checkControlIdInSections(aMessages, true);
    }

    /**
     * The method that retrieves the view ID (HTMLView/XMLView/JSONview/JSView/Templateview) of any control.
     * @param sControlId ID of the control needed to retrieve the view ID
     * @returns The view ID of the control
     */;
    _proto._getViewId = function _getViewId(sControlId) {
      let sViewId,
        oControl = UI5Element.getElementById(sControlId);
      while (oControl) {
        if (oControl instanceof View) {
          sViewId = oControl.getId();
          break;
        }
        oControl = oControl.getParent();
      }
      return sViewId;
    };
    _proto._setLongtextUrlDescription = function _setLongtextUrlDescription(oDiagnosisTitle) {
      this.oMessagePopover.setAsyncDescriptionHandler(function (config) {
        // Here we can fetch the data and concatenate it to the old one
        // By default, the longtextUrl fetching will overwrite the description (with the default behaviour)
        // Here as we have overwritten the default async handler, which fetches and replaces the description of the item
        // we can manually modify it to include whatever needed.
        const sLongTextUrl = config.item.getLongtextUrl();
        if (sLongTextUrl) {
          jQuery.ajax({
            type: "GET",
            url: sLongTextUrl,
            success: function (data) {
              const sDiagnosisText = oDiagnosisTitle.getHtmlText() + data;
              const oldDescription = config.item.getDescription() ?? "";
              config.item.setDescription(`${oldDescription}${sDiagnosisText}`);
              config.promise.resolve();
            },
            error: function () {
              const sError = `A request has failed for long text data. URL: ${sLongTextUrl}`;
              Log.error(sError);
              config.promise.reject(sError);
            }
          });
        }
      });
    }

    /**
     * It displays the row information of the error existing in the table.
     * @param table
     * @param tableRowContext
     * @param tableColProperty
     * @returns rowInformation
     */;
    _proto.processTableColumnProperties = function processTableColumnProperties(table, tableRowContext, tableColProperty) {
      let rowInformation = "";
      const tableColBindingContextTextAnnotation = messageHandling.getTableColBindingContextForTextAnnotation(table, tableRowContext, tableColProperty);
      const tableColTextAnnotationPath = tableColBindingContextTextAnnotation ? tableColBindingContextTextAnnotation.getObject("$Path") : undefined;
      const tableColTextArrangement = tableColTextAnnotationPath && tableColBindingContextTextAnnotation ? tableColBindingContextTextAnnotation.getObject("@com.sap.vocabularies.UI.v1.TextArrangement/$EnumMember") : undefined;
      const labelWithValue = table.getParent()?.getTableColValue(tableRowContext, tableColTextAnnotationPath, tableColTextArrangement, tableColProperty);
      rowInformation += `${labelWithValue}`;
      return rowInformation;
    }

    /**
     * It computes the column information.
     * @param message
     * @param tableTargetColName
     * @param rowInformation
     * @param table
     * @returns columnInfo
     */;
    _proto.computeColumnInfo = function computeColumnInfo(message, tableTargetColName, rowInformation, table) {
      const resourceModel = getResourceModel(table);
      const msgObj = message.getBindingContext("message")?.getObject();
      const colFromTableSettings = messageHandling.fetchColumnInfo(msgObj, table);
      let columnInfo = "";
      if (tableTargetColName) {
        // if column in present in table definition
        columnInfo = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN")}: ${tableTargetColName}`;
      } else if (colFromTableSettings) {
        if (colFromTableSettings.availability === "Hidden") {
          // if column in neither in table definition nor personalization
          if (message.getType() === "Error") {
            columnInfo = rowInformation.length > 0 ? `${resourceModel.getText("T_COLUMN_AVAILABLE_DIAGNOSIS_MSGDESC_ERROR")} ${rowInformation.join(", ")}` + "." : `${resourceModel.getText("T_COLUMN_AVAILABLE_DIAGNOSIS_MSGDESC_ERROR")}` + ".";
          } else {
            columnInfo = rowInformation.length > 0 ? `${resourceModel.getText("T_COLUMN_AVAILABLE_DIAGNOSIS_MSGDESC")} ${rowInformation.join(", ")}` + "." : `${resourceModel.getText("T_COLUMN_AVAILABLE_DIAGNOSIS_MSGDESC")}` + ".";
          }
        } else {
          // if column is not in table definition but in personalization
          //if no navigation to sub op then remove link to error field BCP : 2280168899
          if (!this._navigationConfigured(table)) {
            message.setActiveTitle(false);
          }
          columnInfo = `${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_COLUMN")}: ${colFromTableSettings.label} (${resourceModel.getText("T_COLUMN_INDICATOR_IN_TABLE_DEFINITION")})`;
        }
      }
      return columnInfo;
    }

    /**
     * It displays the row information of the error existing in the table.
     * @param message
     * @param tableRowContext
     * @param tableTargetColName
     * @param table
     */;
    _proto._formatMessageDescription = function _formatMessageDescription(message, tableRowContext, tableTargetColName, table) {
      const resourceModel = getResourceModel(table);
      const tableColProperty = table.getParent()?.getTableColumnVisibilityInfo(tableRowContext);
      const rowInformation = [];
      tableColProperty?.forEach(_ref => {
        let {
          key,
          visibility
        } = _ref;
        rowInformation.push(this.processTableColumnProperties(table, tableRowContext, [{
          key,
          visibility
        }]));
      });
      const columnInfo = this.computeColumnInfo(message, tableTargetColName, rowInformation, table);
      const fieldsAffectedTitle = new FormattedText({
        htmlText: `<html><body><strong>${resourceModel.getText("T_FIELDS_AFFECTED_TITLE")}</strong></body></html><br>`
      });
      let fieldAffectedText;
      if (Array.isArray(rowInformation) && rowInformation.length > 0) {
        if (rowInformation.length === 1) {
          // If there’s only one column in the table, display it in a single line.
          fieldAffectedText = `${fieldsAffectedTitle.getHtmlText()}<br>${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${table.getHeader()}<br>${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW")}: ${rowInformation}<br>${columnInfo}<br>`;
        } else {
          // If there are multiple columns in the table, display them in multiple lines.
          fieldAffectedText = `${fieldsAffectedTitle.getHtmlText()}<br>${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${table.getHeader()}<br>${resourceModel.getText("T_MESSAGE_GROUP_DESCRIPTION_TABLE_ROW")}:<br>&emsp; ${rowInformation.join("<br>&emsp; ")}<br>${columnInfo}<br>`;
        }
      } else if (columnInfo == "" || !columnInfo) {
        fieldAffectedText = "";
      } else {
        fieldAffectedText = `${fieldsAffectedTitle.getHtmlText()}<br>${resourceModel.getText("T_MESSAGE_GROUP_TITLE_TABLE_DENOMINATOR")}: ${table.getHeader()}<br>${columnInfo}<br>`;
      }
      const diagnosisTitle = new FormattedText({
        htmlText: `<html><body><strong>${resourceModel.getText("T_DIAGNOSIS_TITLE")}</strong></body></html><br>`
      });
      // get the UI messages from the message context to set it to Diagnosis section
      const uIMessageDescription = message.getBindingContext("message")?.getObject().description;
      //set the description to undefined to reset it below
      message.setDescription(undefined);
      let diagnosisText = "";
      let messageDescriptionContent = "";
      if (message.getLongtextUrl()) {
        messageDescriptionContent = fieldAffectedText ? `${fieldAffectedText}<br>` : "";
        message.setDescription(messageDescriptionContent);
        this._setLongtextUrlDescription(diagnosisTitle);
      } else if (uIMessageDescription) {
        diagnosisText = `${diagnosisTitle.getHtmlText()}<br>${uIMessageDescription}`;
        messageDescriptionContent = `${fieldAffectedText}<br>${diagnosisText}`;
        message.setDescription(messageDescriptionContent);
      } else {
        message.setDescription(fieldAffectedText);
      }
    }

    /**
     * When there are no messages to show in the Message Box.
     */;
    _proto.handleNoMessages = function handleNoMessages() {
      this.setVisible(false);
      this.fireEvent("messageChange", {
        iMessageLength: 0
      });
      const view = UI5Element.getElementById(this.sViewId);
      if (view) {
        // If there are no messages to show, we reset 'messageTargetProperty'.
        view.getModel("internal").setProperty("/messageTargetProperty", undefined);
      }
    }

    /**
     * Method to set the button text, count and icon property based upon the message items
     * ButtonType:  Possible settings for warning and error messages are 'critical' and 'negative'.
     * @private
     */;
    _proto._setMessageData = function _setMessageData() {
      clearTimeout(this._setMessageDataTimeout);
      this._setMessageDataTimeout = setTimeout(async () => {
        const sIcon = "",
          oMessages = this.oMessagePopover.getItems(),
          oMessageCount = {
            Error: 0,
            Warning: 0,
            Success: 0,
            Information: 0
          },
          oResourceBundle = Library.getResourceBundleFor("sap.fe.core"),
          iMessageLength = oMessages.length;
        let sButtonType = ButtonType.Default,
          sMessageKey = "",
          sTooltipText = "",
          sMessageText = "";
        if (iMessageLength > 0) {
          for (let i = 0; i < iMessageLength; i++) {
            if (!oMessages[i].getType() || oMessages[i].getType().toString() === "") {
              ++oMessageCount["Information"];
            } else {
              ++oMessageCount[oMessages[i].getType()];
            }
          }
          if (oMessageCount[MessageType.Error] > 0) {
            sButtonType = ButtonType.Negative;
          } else if (oMessageCount[MessageType.Warning] > 0) {
            sButtonType = ButtonType.Critical;
          } else if (oMessageCount[MessageType.Success] > 0) {
            sButtonType = ButtonType.Success;
          } else if (oMessageCount[MessageType.Information] > 0) {
            sButtonType = ButtonType.Neutral;
          }
          const totalNumberOfMessages = oMessageCount[MessageType.Error] + oMessageCount[MessageType.Warning] + oMessageCount[MessageType.Success] + oMessageCount[MessageType.Information];
          this.setText(totalNumberOfMessages.toString());
          if (oMessageCount.Error === 1) {
            sMessageKey = "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_TITLE_ERROR";
          } else if (oMessageCount.Error > 1) {
            sMessageKey = "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_MULTIPLE_ERROR_TOOLTIP";
          } else if (!oMessageCount.Error && oMessageCount.Warning) {
            sMessageKey = "C_COMMON_SAPFE_ERROR_MESSAGES_PAGE_WARNING_TOOLTIP";
          } else if (!oMessageCount.Error && !oMessageCount.Warning && oMessageCount.Information) {
            sMessageKey = "C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_INFO";
          } else if (!oMessageCount.Error && !oMessageCount.Warning && !oMessageCount.Information && oMessageCount.Success) {
            sMessageKey = "C_MESSAGE_HANDLING_SAPFE_ERROR_MESSAGES_PAGE_TITLE_SUCCESS";
          }
          if (sMessageKey) {
            sMessageText = oResourceBundle.getText(sMessageKey);
            sTooltipText = oMessageCount.Error ? `${oMessageCount.Error} ${sMessageText}` : sMessageText;
            this.setTooltip(sTooltipText);
          }
          this.setIcon(sIcon);
          this.setType(sButtonType);
          this.setVisible(true);
          const oView = UI5Element.getElementById(this.sViewId);
          if (oView) {
            const oPageReady = oView.getController().pageReady;
            try {
              await oPageReady.waitPageReady();
              await this._applyGroupingAsync(oView);
            } catch (err) {
              Log.error("fail grouping messages");
            }
            this.fireEvent("messageChange", {
              iMessageLength: iMessageLength
            });
          }
          if (iMessageLength > 1) {
            this.oMessagePopover.navigateBack();
          }
        } else {
          this.handleNoMessages();
        }
      }, 100);
    }

    /**
     * The method that is called when a user clicks on the title of the message.
     * @private
     * @param oEvent Event object passed from the handler
     */;
    _proto._activeTitlePress = async function _activeTitlePress(oEvent) {
      const oInternalModelContext = this.getBindingContext("pageInternal");
      oInternalModelContext.setProperty("errorNavigationSectionFlag", true);
      const oItem = oEvent.getParameter("item"),
        oMessage = oItem?.getBindingContext("message")?.getObject(),
        bIsBackendMessage = new RegExp("^/").test(oMessage.getTargets()[0]),
        oView = UI5Element.getElementById(this.sViewId);
      if (!oItem) {
        return;
      }
      let oControl, sSectionTitle;
      const _defaultFocus = function (message, mdcTable) {
        const focusInfo = {
          preventScroll: true,
          targetInfo: message
        };
        mdcTable.focus(focusInfo);
      };
      let bIsGeneralGroupName = true;
      let section, subSections, message, i, j, k;
      const visibleSections = messageHandling.getVisibleSectionsFromObjectPageLayout(this.oObjectPageLayout);
      if (visibleSections) {
        const messages = this.oMessagePopover.getItems();
        for (i = messages.length - 1; i >= 0; --i) {
          // Loop over all messages
          message = messages[i];
          for (j = visibleSections.length - 1; j >= 0; --j) {
            // Loop over all visible sections
            section = visibleSections[j];
            subSections = section.getSubSections();
            for (k = subSections.length - 1; k >= 0; --k) {
              // Loop over all sub-sections
              const subSection = subSections[k];
              const messageObject = message?.getBindingContext("message")?.getObject();
              const controls = messageHandling.getControlFromMessageRelatingToSubSection(subSection, messageObject);
              if (controls.length > 0) {
                bIsGeneralGroupName = false;
              }
            }
          }
        }
      }
      const oTargetMdcTable = oMessage.controlIds.map(controlId => {
        const control = UI5Element.getElementById(controlId);
        const parentControl = control && control.getParent();
        if (this.isHiddenDraftEnabled) {
          return parentControl?.isA("sap.ui.mdc.Table") ? parentControl : undefined;
        }
        return parentControl && parentControl.isA("sap.ui.mdc.Table") && oItem.getGroupName().includes(parentControl.getHeader()) ? parentControl : null;
      }).reduce(function (acc, val) {
        return val ? val : acc;
      });

      //check if the pressed item is related to a table control
      if (oTargetMdcTable) {
        if (bIsBackendMessage) {
          sSectionTitle = oItem.getGroupName().split(", ")[0];
          try {
            if (this.isHiddenDraftEnabled && (oTargetMdcTable.getId() !== this.sViewId || bIsGeneralGroupName)) {
              const viewId = this._getViewId(oTargetMdcTable.getId());
              UI5Element.getElementById(viewId).getController()._routing.navigateToContext(oTargetMdcTable.getBindingContext());
            } else {
              await this._navigateFromMessageToSectionTableInIconTabBarMode(oTargetMdcTable, this.oObjectPageLayout, sSectionTitle);
            }
            const oRefErrorContext = this._getTableRefErrorContext(oTargetMdcTable);
            const oRefError = oRefErrorContext?.getProperty(oItem.getBindingContext("message")?.getObject().getId());
            const _setFocusOnTargetField = async (targetMdcTable, iRowIndex) => {
              const aTargetMdcTableRow = this._getMdcTableRows(targetMdcTable),
                iFirstVisibleRow = this._getGridTable(targetMdcTable)?.getFirstVisibleRow() ?? 0;
              if (aTargetMdcTableRow.length > 0 && aTargetMdcTableRow[0]) {
                const oTargetRow = aTargetMdcTableRow[iRowIndex - iFirstVisibleRow],
                  oTargetCell = this.getTargetCell(oTargetRow, oMessage);
                if (oTargetCell) {
                  this.setFocusToControl(oTargetCell);
                  return undefined;
                } else {
                  // control not found on table
                  const errorProperty = oMessage.getTargets()[0].split("/").pop();
                  if (errorProperty) {
                    oView.getModel("internal").setProperty("/messageTargetProperty", errorProperty);
                  }
                  if (this._navigationConfigured(targetMdcTable)) {
                    return oView.getController()._routing.navigateForwardToContext(oTargetRow.getBindingContext());
                  } else {
                    return false;
                  }
                }
              }
              return undefined;
            };
            if (oTargetMdcTable.data("tableType") === "GridTable" && oRefError.rowIndex !== "") {
              try {
                await oTargetMdcTable.scrollToIndex(oRefError.rowIndex);
                setTimeout(async function () {
                  const focusOnTargetField = await _setFocusOnTargetField(oTargetMdcTable, oRefError.rowIndex);
                  if (focusOnTargetField === false) {
                    _defaultFocus(oMessage, oTargetMdcTable);
                  }
                }, 0);
              } catch (err) {
                Log.error("Error while focusing on error");
              }
            } else if (oTargetMdcTable.data("tableType") === "ResponsiveTable" && oRefError) {
              const focusOnMessageTargetControl = await this.focusOnMessageTargetControl(oView, oMessage, oTargetMdcTable, oRefError.rowIndex);
              if (focusOnMessageTargetControl === false) {
                _defaultFocus(oMessage, oTargetMdcTable);
              }
            } else {
              this.focusOnMessageTargetControl(oView, oMessage);
            }
          } catch (err) {
            Log.error("Fail to navigate to Error control");
          }
        } else {
          oControl = UI5Element.getElementById(oMessage.controlIds[0]);
          if (oControl) {
            //If the control underlying the frontEnd message is not within the current section, we first go into the target section:
            const sections = this.oObjectPageLayout.getSections();
            const sectionWithTheControl = sections.find(section => section.findElements(true).includes(oControl));
            if (sectionWithTheControl) {
              sSectionTitle = oItem.getGroupName().split(", ")[0];
              this._navigateFromMessageToSectionInIconTabBarMode(this.oObjectPageLayout, sSectionTitle);
            }
          }
          this.setFocusToControl(oControl);
        }
      } else {
        // Call the function wherever needed
        this.handleMessageNavigation(oItem, visibleSections, oMessage, oView);
      }
    }

    /**
     * Handles the message navigation by finding the associated subsection, expanding it,
     * and navigating to the correct section in the Object Page Layout.
     * @param oItem The message item containing the group name.
     * @param visibleSections The list of visible sections in the Object Page.
     * @param oMessage The message object containing control IDs.
     * @param oView The current UI5 view.
     */;
    _proto.handleMessageNavigation = function handleMessageNavigation(oItem, visibleSections, oMessage, oView) {
      // Get control if it is inside a hidden subsection
      const oControl = UI5Element.getElementById(oMessage.getControlIds()[0]);
      const oSubSection = this.findSubSection(oItem, visibleSections, oControl);

      // If subsection found, expand it
      if (oSubSection) {
        oSubSection.setMode("Expanded");
      }

      // Navigate to the section based on the message's group name
      const sSectionTitle = oItem.getGroupName().split(", ")[0];
      this._navigateFromMessageToSectionInIconTabBarMode(this.oObjectPageLayout, sSectionTitle);

      // Focus on the target control
      this.focusOnMessageTargetControl(oView, oMessage);
    }

    /**
     * Finds the corresponding subsection based on the provided message item's group name
     * or by checking if the given control exists inside the subsection's MoreBlocks.
     * @param oItem The message item containing the group name.
     * @param visibleSections The list of visible sections in the Object Page.
     * @param oControl The UI5 control to check for inside MoreBlocks.
     * @returns - The found subsection, section, or null if not found.
     */;
    _proto.findSubSection = function findSubSection(oItem, visibleSections, oControl) {
      const groupNames = oItem.getGroupName().split(", ");
      return this.findSubSectionByTitleOrControl(visibleSections, groupNames[1], oControl);
    }

    /**
     * Searches for a subsection based on the given title or by checking
     * if the specified control is present inside the subsection's MoreBlocks.
     * @private
     * @param visibleSections The list of visible sections.
     * @param title The title to match against subsection titles.
     * @param oControl The UI5 control to search for within MoreBlocks.
     * @returns - The found subsection or null if no match is found.
     */;
    _proto.findSubSectionByTitleOrControl = function findSubSectionByTitleOrControl(visibleSections, title, oControl) {
      for (const section of visibleSections) {
        for (const subSection of section.getSubSections()) {
          // Check if subsection title matches
          if (subSection.getTitle() === title) {
            return subSection;
          }

          // Check if control exists inside MoreBlocks
          if (subSection.getMoreBlocks().some(block => block.getContent()?.findElements(true).includes(oControl))) {
            return subSection;
          }
        }
      }
      return null;
    }

    /**
     * Retrieves a table cell targeted by a message, ensuring the cell is editable.
     * @param targetRow A table row
     * @param message Message targeting a cell
     * @returns Returns the editable cell or null/undefined if none is found
     * @private
     */;
    _proto.getTargetCell = function getTargetCell(targetRow, message) {
      const controlIds = message.getControlIds();
      const hasNonEditableField = controlIds.some(id => {
        const control = UI5Element.getElementById(id);
        return control?.isA("sap.ui.mdc.Field") && control.getEditable && !control.getEditable();
      });
      return controlIds.length > 0 ? controlIds.map(function (controlId) {
        const isControlInTable = targetRow.findElements(true, function (elem) {
          return elem.getId() === controlId;
        });
        if (isControlInTable.length > 0) {
          const element = UI5Element.getElementById(controlId);
          if (hasNonEditableField) {
            if (element?.isA("sap.ui.mdc.Field")) {
              if (element.getEditable && !element.getEditable()) {
                return null;
              }
              return element;
            }
          } else {
            return element;
          }
        }
        return null;
      }).reduce(function (acc, val) {
        return val ? val : acc;
      }, null) : null;
    }

    /**
     * Focus on the control targeted by a message.
     * @param view The current view
     * @param message The message targeting the control on which we want to set the focus
     * @param targetMdcTable The table targeted by the message (optional)
     * @param rowIndex The row index of the table targeted by the message (optional)
     * @returns Promise
     * @private
     */;
    _proto.focusOnMessageTargetControl = async function focusOnMessageTargetControl(view, message, targetMdcTable, rowIndex) {
      const aAllViewElements = view.findElements(true);
      const aErroneousControls = message.getControlIds().filter(function (sControlId) {
        return aAllViewElements.some(function (oElem) {
          return oElem.getId() === sControlId && oElem.getDomRef();
        });
      }).map(function (sControlId) {
        return UI5Element.getElementById(sControlId);
      });
      const aNotTableErroneousControls = aErroneousControls.filter(function (oElem) {
        return !oElem?.isA("sap.m.Table") && !oElem?.isA("sap.ui.table.Table");
      });
      //The focus is set on Not Table control in priority
      if (aNotTableErroneousControls.length > 0) {
        this.setFocusToControl(aNotTableErroneousControls[0]);
        return undefined;
      } else if (aErroneousControls.length > 0) {
        const aTargetMdcTableRow = targetMdcTable ? targetMdcTable.findElements(true, elem => elem.isA(ColumnListItem.getMetadata().getName()) && elem.getParent()?.getParent() === targetMdcTable) : [];
        if (aTargetMdcTableRow.length > 0 && aTargetMdcTableRow[0]) {
          const oTargetRow = aTargetMdcTableRow[rowIndex];
          const oTargetCell = this.getTargetCell(oTargetRow, message);
          if (oTargetCell) {
            const oTargetField = oTargetCell.isA("sap.fe.macros.Field") ? oTargetCell.getContent().getContentEdit()[0] : oTargetCell.getItems()[0].getContent().getContentEdit()[0];
            this.setFocusToControl(oTargetField);
            return undefined;
          } else {
            const errorProperty = message.getTargets()[0].split("/").pop();
            if (errorProperty) {
              view.getModel("internal").setProperty("/messageTargetProperty", errorProperty);
            }
            if (targetMdcTable && this._navigationConfigured(targetMdcTable)) {
              return view.getController()._routing.navigateForwardToContext(oTargetRow.getBindingContext());
            } else {
              return false;
            }
          }
        }
        return undefined;
      }
      return undefined;
    }

    /**
     *
     * @param obj The message object
     * @param aSections The array of sections in the object page
     * @returns The rank of the message
     */;
    _proto._getMessageRank = function _getMessageRank(obj, aSections) {
      if (aSections) {
        let section, aSubSections, subSection, j, k, aElements, aAllElements, sectionRank;
        for (j = aSections.length - 1; j >= 0; --j) {
          // Loop over all sections
          section = aSections[j];
          aSubSections = section.getSubSections();
          for (k = aSubSections.length - 1; k >= 0; --k) {
            // Loop over all sub-sections
            subSection = aSubSections[k];
            aAllElements = subSection.findElements(true); // Get all elements inside a sub-section
            //Try to find the control 1 inside the sub section
            aElements = aAllElements.filter(this._fnFilterUponId.bind(this, obj.getControlId()));
            sectionRank = j + 1;
            if (aElements.length > 0) {
              if (section.getVisible() && subSection.getVisible()) {
                if (!obj.hasOwnProperty("sectionName")) {
                  obj.sectionName = section.getTitle();
                }
                if (!obj.hasOwnProperty("subSectionName")) {
                  obj.subSectionName = subSection.getTitle();
                }
                return sectionRank * 10 + (k + 1);
              } else {
                // if section or subsection is invisible then group name would be Last Action
                // so ranking should be lower
                return 1;
              }
            }
          }
        }
        //if sub section title is Other messages, we return a high number(rank), which ensures
        //that messages belonging to this sub section always come later in messagePopover
        if (!obj.sectionName && !obj.subSectionName && obj.getPersistent()) {
          return 1;
        }
        return 999;
      }
      return 999;
    }

    /**
     * Get Filter to hide messages from the dialog.
     * @returns Filter
     */;
    _proto._filterOutMessagesInDialog = function _filterOutMessagesInDialog() {
      const fnTest = aControlIds => {
        return messageHandling.isMessageOutOfParameterDialog(aControlIds);
      };
      return new Filter({
        path: "controlIds",
        test: fnTest,
        caseSensitive: true
      });
    }

    /**
     * Filter function to hide back-end messages if the control has error validation.
     * @returns Filter
     */;
    _proto._getFilterToHideBackendMessageOnErrorValidation = function _getFilterToHideBackendMessageOnErrorValidation() {
      const getIdsOfFielsdWithErrorValidation = function () {
        return Messaging.getMessageModel().getData().filter(message => message.validation === true && message.getControlId()?.match(/field.*-inner$/i))
        //the error point to the inner control, so we need to remove the -inner to get the field id
        .map(message => message.getControlId()?.replace("-inner", ""));
      };
      const fnTest = function (aControlIds) {
        // filtering out the backend messages if the control has error validation
        return !aControlIds.some(controlId => getIdsOfFielsdWithErrorValidation().includes(controlId));
      };
      return new Filter({
        filters: [new Filter({
          filters: [new Filter({
            path: "validation",
            operator: FilterOperator.EQ,
            value1: false
          }), new Filter({
            path: "controlIds",
            test: fnTest,
            caseSensitive: true
          })],
          and: true
        }), new Filter({
          path: "validation",
          operator: FilterOperator.EQ,
          value1: true
        })],
        and: false
      });
    }

    /**
     * Method to set the filters based upon the message items
     * The desired filter operation is:
     * ( filters provided by user && ( validation = true && Control should be present in view ) || messages for the current matching context ).
     * @private
     */;
    _proto._applyFiltersAndSort = async function _applyFiltersAndSort() {
      let oValidationFilters, hiddenDraftFilter, oValidationAndContextFilter, oFilters, sPath, oSorter, oDialogFilter, objectPageLayoutSections;
      const aUserDefinedFilter = [];
      this.sViewId = this.sViewId ? this.sViewId : this._getViewId(this.getId());
      //Add the filters provided by the user
      const aCustomFilters = this.getAggregation("customFilters");
      if (aCustomFilters) {
        aCustomFilters.forEach(function (filter) {
          aUserDefinedFilter.push(new Filter({
            path: filter.getProperty("path"),
            operator: filter.getProperty("operator"),
            value1: filter.getProperty("value1"),
            value2: filter.getProperty("value2")
          }));
        });
      }
      const oBindingContext = this.getBindingContext();
      if (!oBindingContext) {
        this.setVisible(false);
        return;
      } else {
        sPath = oBindingContext.getPath();
        //Filter for filtering out only validation messages which are currently present in the view
        oValidationFilters = new Filter({
          filters: [new Filter({
            path: "validation",
            operator: FilterOperator.EQ,
            value1: true
          }), messageButtonHelper.getCheckControlInViewFilter(this.sViewId)],
          and: true
        });
        oDialogFilter = new Filter({
          filters: [this._filterOutMessagesInDialog()]
        });
        let filterArray;
        if (this.isHiddenDraftEnabled) {
          const viewId = this._getViewId(this.getId());
          const view = UI5Element.getElementById(viewId);
          const viewContext = view?.getBindingContext();
          const contextPath = (await view.getController()?.editFlow.getRootContext(viewContext))?.getPath();
          hiddenDraftFilter = messageButtonHelper.getHiddenDraftUseCaseFilter(contextPath);
          filterArray = [hiddenDraftFilter, oDialogFilter, this._getFilterToHideBackendMessageOnErrorValidation()];
        } else {
          oValidationAndContextFilter = new Filter({
            filters: [oValidationFilters, new Filter({
              path: "target",
              operator: FilterOperator.StartsWith,
              value1: sPath
            })],
            and: false
          });
          filterArray = [oValidationAndContextFilter, oDialogFilter, this._getFilterToHideBackendMessageOnErrorValidation()];
          //Filter for filtering out the bound messages i.e target starts with the context path
        }
        const oValidationContextDialogFilters = new Filter({
          filters: filterArray,
          and: true
        });
        // and finally - if there any - add custom filter (via OR)
        if (aUserDefinedFilter.length > 0) {
          oFilters = new Filter({
            filters: [aUserDefinedFilter, oValidationContextDialogFilters],
            // TODO incorrect,
            and: false
          });
        } else {
          oFilters = oValidationContextDialogFilters;
        }
        this.oItemBinding.filter(oFilters);
        this.oObjectPageLayout = this._getObjectPageLayout(this, this.oObjectPageLayout);
        // We support sorting only for ObjectPageLayout use-case.
        if (this.oObjectPageLayout) {
          oSorter = new Sorter("", undefined, undefined, (obj1, obj2) => {
            if (!objectPageLayoutSections) {
              objectPageLayoutSections = this.oObjectPageLayout && this.oObjectPageLayout.getSections();
            }
            const rankA = this._getMessageRank(obj1, objectPageLayoutSections);
            const rankB = this._getMessageRank(obj2, objectPageLayoutSections);
            if (rankA < rankB) {
              return -1;
            }
            if (rankA > rankB) {
              return 1;
            }
            return 0;
          });
          this.oItemBinding.sort(oSorter);
        }
      }
    }

    /**
     *
     * @param sControlId
     * @param oItem
     * @returns True if the control ID matches the item ID
     */;
    _proto._fnFilterUponId = function _fnFilterUponId(sControlId, oItem) {
      return sControlId === oItem.getId();
    }

    /**
     * Retrieves the section based on section title and visibility.
     * @param oObjectPage Object page.
     * @param sSectionTitle Section title.
     * @returns The section
     * @private
     */;
    _proto._getSectionBySectionTitle = function _getSectionBySectionTitle(oObjectPage, sSectionTitle) {
      let oSection;
      if (sSectionTitle) {
        const aSections = oObjectPage.getSections();
        for (let i = 0; i < aSections.length; i++) {
          if (aSections[i].getVisible() && aSections[i].getTitle() === sSectionTitle) {
            oSection = aSections[i];
            break;
          }
        }
      }
      return oSection;
    }

    /**
     * Navigates to the section if the object page uses an IconTabBar and if the current section is not the target of the navigation.
     * @param oObjectPage Object page.
     * @param sSectionTitle Section title.
     * @private
     */;
    _proto._navigateFromMessageToSectionInIconTabBarMode = function _navigateFromMessageToSectionInIconTabBarMode(oObjectPage, sSectionTitle) {
      const bUseIconTabBar = oObjectPage.getUseIconTabBar();
      if (bUseIconTabBar) {
        const oSection = this._getSectionBySectionTitle(oObjectPage, sSectionTitle);
        const sSelectedSectionId = oObjectPage.getSelectedSection();
        if (oSection && sSelectedSectionId !== oSection.getId()) {
          oObjectPage.setSelectedSection(oSection.getId());
        }
      }
    };
    _proto._navigateFromMessageToSectionTableInIconTabBarMode = async function _navigateFromMessageToSectionTableInIconTabBarMode(oTable, oObjectPage, sSectionTitle) {
      const oRowBinding = oTable.getRowBinding();
      const oTableContext = oTable.getBindingContext();
      const oOPContext = oObjectPage.getBindingContext();
      const bShouldWaitForTableRefresh = !(oTableContext === oOPContext);
      this._navigateFromMessageToSectionInIconTabBarMode(oObjectPage, sSectionTitle);
      return new Promise(function (resolve) {
        if (bShouldWaitForTableRefresh) {
          oRowBinding.attachEventOnce("change", function () {
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    /**
     * Retrieves the MdcTable if it is found among any of the parent elements.
     * @param oElement Control
     * @returns MDC table || undefined
     * @private
     */;
    _proto._getMdcTable = function _getMdcTable(oElement) {
      //check if the element has a table within any of its parents
      let oParentElement = oElement.getParent();
      while (oParentElement && !oParentElement.isA("sap.ui.mdc.Table")) {
        oParentElement = oParentElement.getParent();
      }
      return oParentElement && oParentElement.isA("sap.ui.mdc.Table") ? oParentElement : undefined;
    };
    _proto._getGridTable = function _getGridTable(oMdcTable) {
      return oMdcTable.findElements(true, function (oElem) {
        return oElem.isA("sap.ui.table.Table") && /** We check the element belongs to the MdcTable :*/
        oElem.getParent() === oMdcTable;
      })[0];
    }

    /**
     * Retrieves the table row (if available) containing the element.
     * @param oElement Control
     * @returns Table row || undefined
     * @private
     */;
    _proto._getTableRow = function _getTableRow(oElement) {
      let oParentElement = oElement.getParent();
      while (oParentElement && !oParentElement.isA("sap.ui.table.Row") && !oParentElement.isA("sap.ui.table.CreationRow") && !oParentElement.isA(ColumnListItem.getMetadata().getName())) {
        oParentElement = oParentElement.getParent();
      }
      return oParentElement && (oParentElement.isA("sap.ui.table.Row") || oParentElement.isA("sap.ui.table.CreationRow") || oParentElement.isA(ColumnListItem.getMetadata().getName())) ? oParentElement : undefined;
    }

    /**
     * Retrieves the index of the table row containing the element.
     * @param oElement Control
     * @returns Row index || undefined
     * @private
     */;
    _proto._getTableRowIndex = function _getTableRowIndex(oElement) {
      const oTableRow = this._getTableRow(oElement);
      let iRowIndex;
      if (oTableRow?.isA("sap.ui.table.Row")) {
        iRowIndex = oTableRow.getIndex();
      } else {
        iRowIndex = oTableRow?.getTable?.().getItems().findIndex(function (element) {
          return element.getId() === oTableRow?.getId();
        });
      }
      return iRowIndex ?? -1;
    }

    /**
     * Retrieves the index of the table column containing the element.
     * @param element Control
     * @returns Column index || undefined
     * @private
     */;
    _proto._getTableColumnIndex = function _getTableColumnIndex(element) {
      const getTargetCellIndex = function (elt, targetRow) {
        return targetRow?.getCells().findIndex(function (cell) {
          return cell.getId() === elt.getId();
        });
      };
      const getTargetColumnIndex = function (elt, targetRow) {
        let targetElement = elt.getParent(),
          targetCellIndex = getTargetCellIndex(targetElement, targetRow);
        while (targetElement && targetCellIndex && targetCellIndex < 0) {
          targetElement = targetElement.getParent();
          targetCellIndex = getTargetCellIndex(targetElement, targetRow);
        }
        return targetCellIndex;
      };
      const targetRow = this._getTableRow(element);
      let targetColumnIndex = getTargetColumnIndex(element, targetRow);
      if (targetRow?.isA("sap.ui.table.CreationRow")) {
        const targetCellId = targetColumnIndex ? targetRow.getCells()[targetColumnIndex].getId() : undefined,
          tableColumns = targetRow.getTable()?.getColumns();
        targetColumnIndex = tableColumns?.findIndex(function (column) {
          if (column.getCreationTemplate() && targetCellId) {
            return targetCellId.search(column.getCreationTemplate().getId()) > -1 ? true : false;
          } else {
            return false;
          }
        });
      }
      return targetColumnIndex;
    };
    _proto._getMdcTableRows = function _getMdcTableRows(oMdcTable) {
      return oMdcTable.findElements(true, function (oElem) {
        return oElem.isA("sap.ui.table.Row") && /** We check the element belongs to the Mdc Table :*/
        oElem.getTable?.().getParent() === oMdcTable;
      });
    };
    _proto._getObjectPageLayout = function _getObjectPageLayout(oElement, oObjectPageLayout) {
      if (oObjectPageLayout) {
        return oObjectPageLayout;
      }
      let targetElement = oElement;
      //Iterate over parent till you have not reached the object page layout
      while (targetElement && !targetElement.isA("sap.uxap.ObjectPageLayout")) {
        targetElement = targetElement.getParent() ?? undefined;
      }
      return targetElement;
    }

    /**
     * The method that is called to check if a navigation is configured from the table to a sub object page.
     * @private
     * @param table MdcTable
     * @returns Either true or false
     */;
    _proto._navigationConfigured = function _navigationConfigured(table) {
      // TODO: this logic would be moved to check the same at the template time to avoid the same check happening multiple times.
      const component = sap.ui.require("sap/ui/core/Component"),
        navObject = table && component.getOwnerComponentFor(table) && component.getOwnerComponentFor(table).getNavigation();
      let subOPConfigured = false,
        navConfigured = false;
      if (navObject && Object.keys(navObject).includes(table.getRowBinding().getPath())) {
        subOPConfigured = navObject[table?.getRowBinding().getPath()] && navObject[table?.getRowBinding().getPath()].detail && navObject[table?.getRowBinding().getPath()].detail.route ? true : false;
      }
      navConfigured = subOPConfigured && table?.getRowSettings().getRowActions() && table?.getRowSettings().getRowActions()[0].getType().includes("Navigation");
      return navConfigured;
    };
    _proto.setFocusToControl = function setFocusToControl(control) {
      const messagePopover = this.oMessagePopover;
      if (messagePopover && control && control.focus) {
        const fnFocus = () => {
          control.focus();
        };
        if (!messagePopover.isOpen()) {
          // when navigating to parent page to child page (on click of message), the child page might have a focus logic that might use a timeout.
          // we use the below timeouts to override this focus so that we focus on the target control of the message in the child page.
          setTimeout(fnFocus, 0);
        } else {
          const fnOnClose = () => {
            setTimeout(fnFocus, 0);
            messagePopover.detachEvent("afterClose", fnOnClose);
          };
          messagePopover.attachEvent("afterClose", fnOnClose);
          messagePopover.close();
        }
      } else {
        Log.warning("FE V4 : MessageButton : element doesn't have focus method for focusing.");
      }
    };
    _proto.escape = function escape(value) {
      return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };
    return MessageButton;
  }(Button), _descriptor = _applyDecoratedDescriptor(_class2.prototype, "customFilters", [_dec2], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, "messageChange", [_dec3], {
    configurable: true,
    enumerable: true,
    writable: true,
    initializer: null
  }), _class2)) || _class);
  return MessageButton;
}, false);
//# sourceMappingURL=MessageButton-dbg.js.map
