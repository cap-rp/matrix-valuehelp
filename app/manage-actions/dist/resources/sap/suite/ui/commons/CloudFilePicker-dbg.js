/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

// Provides control sap.suite.ui.commons.CloudFilePicker.
sap.ui.define([
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/DialogRenderer",
	"sap/m/HBox",
	"sap/m/Table",
	"sap/m/ColumnListItem",
	"sap/m/Column",
	"sap/ui/model/odata/v4/ODataModel",
	"sap/m/Select",
	"sap/m/Label",
	"sap/m/Input",
	"sap/ui/layout/form/SimpleForm",
	"sap/ui/core/IconPool",
	"sap/ui/core/Icon",
	"sap/m/Page",
	"sap/m/Breadcrumbs",
	"sap/m/Link",
	"sap/m/Text",
	"./CloudFileInfo",
	"./library",
	"sap/m/library",
	"sap/ui/core/library",
	"sap/ui/layout/FixFlex",
	"sap/m/OverflowToolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/Title",
	"sap/m/ColumnPopoverSelectListItem",
	"sap/m/ColumnHeaderPopover",
	"sap/ui/core/CustomData",
	"sap/ui/model/Sorter",
	"sap/m/SearchField",
	"sap/m/OverflowToolbarLayoutData",
	"sap/ui/Device",
	"sap/base/Log",
	"sap/ui/model/odata/type/DateTimeOffset",
	"sap/ui/core/Item",
	"sap/m/IllustratedMessage",
	"sap/m/IllustratedMessageType",
	"sap/m/IllustratedMessageSize",
	"sap/ui/core/format/FileSizeFormat",
	"sap/m/MessageToast",
	"sap/m/CheckBox",
	"sap/ui/core/Lib"
], function (
	Button,
	Dialog,
	DialogRenderer,
	HBox,
	Table,
	ColumnListItem,
	Column,
	ODataModel,
	Select,
	Label,
	Input,
	SimpleForm,
	IconPool,
	Icon,
	Page,
	Breadcrumbs,
	Link,
	Text,
	CloudFileInfo,
	library,
	mLibrary,
	coreLibrary,
	FixFlex,
	OverflowToolbar,
	ToolbarSpacer,
	Title,
	ColumnPopoverSelectListItem,
	ColumnHeaderPopover,
	CustomData,
	Sorter,
	SearchField,
	OverflowToolbarLayoutData,
	Device,
	Log,
	DateTimeOffset,
	Item,
	IllustratedMessage,
	IllustratedMessageType,
	IllustratedMessageSize,
	FileSizeFormat,
	MessageToast,
	CheckBox,
	Lib
) {
	"use strict";

	var DialogType = mLibrary.DialogType;
	var ButtonType = mLibrary.ButtonType;
	var SortOrder = coreLibrary.SortOrder;
	var ValueState = coreLibrary.ValueState;
	var FilePickerModes = library.FilePickerModes;
	var FilePickerType = library.FilePickerType;
	var SelectionMode = library.SelectionModes;

	var oResourceBundle = Lib.getResourceBundleFor("sap.suite.ui.commons");

	/**
	 * Constructor of the CloudFilePicker
         *
         * @extends sap.m.Dialog
         *
	 * @namespace sap.suite.ui.commons.CloudFilePicker
	 * @experimental
	 * @since 1.101
	 * @class
	 * @public
	 * @internal
	 * @version 1.136.0
	*/
	var CloudFilePicker = Dialog.extend("sap.suite.ui.commons.CloudFilePicker", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Url of the FileShare OData V4 service.
				 */
				serviceUrl: {
					type: "sap.ui.core.URI",
					group: "Data",
					defaultValue: ""
				},
				/**
				 * Model shared from export as dialog
				 */
				 sharedModel: {
					type: "object",
					group: "Misc",
					defaultValue: null
				},
				/**
				 * Overwrites the default text for the confirmation button.
				 */
				confirmButtonText: {
					type: "string",
					group: "Data",
					defaultValue: oResourceBundle.getText(
						"CFP_BUTTON_SELECT"
					)
				},
				/**
				 * Allow the type of resources that can be selected.
				 */
				filePickerMode: {
					type: "sap.suite.ui.commons.FilePickerModes",
					group: "Data",
					defaultValue: "All"
				},
				/**
				 * Specifies the text for selectButton.
				 */
				title: {
					type: "string",
					group: "Data"
				},
				/**
				 * Specifies whether duplicate file check logic is needed.
				 */
				enableDuplicateCheck: {
					type: "boolean",
					group: "Data",
					defaultValue: false
				},
				/**
				 * Overwrites the default text for the duplicate message popup.
				 * It is relevant only if "enableDuplicateCheck" is set to true.
				 */
				duplicateMessage: {
					type: "string",
					group: "Data"
				},
				/**
				 * File name could be provided in case File picker control is
				 * used for Export/Save As scenario for selecting the location.
				 * Value will be displayed in the File Name control on the dialog.
				 */
				suggestedFileName: {
					type: "string",
					group: "Data"
				},
				/**
				 * Specifies whether file name is mandatory to perform confirmation action
				 */
				fileNameMandatory: {
					type: "boolean",
					group: "Data",
					defaultValue: false
				},
				/**
				 * Specifies the mode in which the control is running
				 */
				filePickerType: {
					type: "sap.suite.ui.commons.FilePickerType",
					group: "Data",
					defaultValue: "Export"
				},
				/**
				 * Specifies the MIME type of the file during Export
				 */
				MIMEType: {
					type: "string",
					group: "Data"
				},
				/**
				 * Specifies the Selection mode of the table
				 */
				selectionMode: {
					type: "sap.suite.ui.commons.SelectionModes",
					group: "Data",
					defaultValue: "SingleSelectMaster"
				}
			},
			events: {
				/**
				 * Event is fired when the selection is made
				 */
				select: {
					parameters: {
						/**
						 * Specifies whether an existing file is being overwritten in a file share.
						 */
						replaceExistingFile: "boolean",
						/**
						 * Specifies the name of the selected file.
						 */
						selectedFileName: "string",
						/**
						 * Specifies the details of the seleced file.
						 */
						selectedFiles: { type: "sap.suite.ui.commons.CloudFileInfo[]" },
						/**
						 * Specifies the details of the folder of a selected file.
						 */
						selectedFolder: { type: "sap.suite.ui.commons.CloudFileInfo" }
					}
				},

				/**
				 * Event is fired when the cancel button is pressed
				 *
				 *
				 */
				cancel: {}
			}
		},
		constructor: function () {
			Dialog.prototype.constructor.apply(this, arguments);
			this.oTableControl = null;
			this.oSelectControl = null;
			this.oBreadcrumbLinkControl = null;
			this.oFileNameControl = null;
			this.aVisibleLinks = null;
			this.oNavigationMap = null;
			this.oConfirmationButton = null;
			this.oNewFolderButton = null;
			this.oNewFolderColumnListItem = null;
			this.oCurrentParentData = null;
			this.oSelectedFiles = [];
			this.setResizable(true);
			this.setDraggable(true);
			this._createDialogContent();
			this._createButton();

			if (!this.getTitle()){
				this.setTitle(this.getFilePickerType() ===  "Export" ? oResourceBundle.getText("CFP_EXPORT") : oResourceBundle.getText("CFP_UPLOAD"));
			}

			if (Device.system.phone) {
				this.setStretch(true);
			} else {
				this.setStretch(false);
				this.setContentWidth("780px");
				this.setContentHeight("48.75rem");
			}

			this.setHorizontalScrolling(false);
			this.setVerticalScrolling(false);
			this.setTitle(this.getTitle());
			this.setBusyIndicatorDelay(0);
			this.setBusy(true);
		},
		renderer: DialogRenderer
	});

	CloudFilePicker.prototype._createDialogContent = function () {
		var sServiceURL = this.getServiceUrl(), oModel = this.getSharedModel();
		if (!sServiceURL && !oModel) {
			Log.error("Invalid Configuration");
		}
		if (!oModel && sServiceURL) {
			oModel = new ODataModel({
				serviceUrl: sServiceURL,
				earlyRequests: true
			});
		}
		if (oModel) {
			oModel.setSizeLimit(200);
		}
		this.setModel(oModel);
		// Adding Select for cloud spaces
		var oSimpleForm = this._createCloudDropdownAndFileNameField();
		this.oBreadcrumbLinkControl = this._createBreadcrumbLinks();
		// Adding table to show the files and folders
		var oTableContent = this._createTableContent();
		var oFlexContainer = new FixFlex({
			fixContent: [oSimpleForm, this.oBreadcrumbLinkControl],
			flexContent: oTableContent
		});
		this.addContent(oFlexContainer);
	};

	CloudFilePicker.prototype._createCloudDropdownAndFileNameField = function () {
		var oLocationLabel = new Label({
			text: oResourceBundle.getText("CFP_LOCATION"),
			showColon: true,
			labelFor: this.getId() + "-cloudSpaceSelect"
		}).addStyleClass(Device.system.desktop ? "sapUiTinyMarginTop" : '');

		this.oSelectControl = new Select({
			id: this.getId() + "-cloudSpaceSelect",
			forceSelection: false,
			change: function (oControlEvent) {
				this.oTableControl.setBusyIndicatorDelay(0);
				this.oTableControl.setNoDataText(" ");
				this.oFileNameControl.setValue(this.getSuggestedFileName());
				// Confirmation button if disabled already should be re enabled if fileNameControl is set with a value during drive location change
				// and the Confirmation button should be kept disabled when drive location changes
				this.oBreadcrumbLinkControl.destroyLinks();
				this._initializeVisibleLinks();

				var oSelectedItem = oControlEvent.getParameters().selectedItem;
				this._loadFileShareRootFolder(oSelectedItem.getKey());
			}.bind(this)
		}).bindItems({
			path: "/FileShares",
			events:{
				dataReceived: function (oEvent) {
					var mParameters = oEvent.getParameters();
					if (mParameters.error || (!Object.keys(mParameters.data).length && !oEvent.getSource().getCurrentContexts().length)) {
						this.setBusy(false);
						var oMessage = new IllustratedMessage({
							illustrationType: IllustratedMessageType.UnableToUpload,
							illustrationSize: IllustratedMessageSize.Small,
							enableVerticalResponsiveness: true,
							title: oResourceBundle.getText("CFP_NO_FILESHARE_FOUND"),
							description: oResourceBundle.getText("CFP_NO_FILESHARE_FOUND_RELOAD"),
							additionalContent: [
								new Button({
									text: oResourceBundle.getText("CFP_BUTTON_RELOAD"),
									press: function () {
										this.oSelectControl.getBinding("items").refresh();
									}
								})
							]
						});
						this.oTableControl.setNoData(oMessage);
					} else if (oEvent.getSource() && oEvent.getSource().getContexts() && oEvent.getSource().getContexts().length) {
							var sPath = oEvent.getSource().getContexts()[0].sPath;
							var sKey = sPath.split(/[']/)[1];
							this.oSelectControl.setSelectedKey(sKey);
							setTimeout(function(){
								this._initializeVisibleLinks();
							}.bind(this));
							this._loadFileShareRootFolder(this.oSelectControl.getSelectedKey());
						}
				}.bind(this)
			},
			template: new Item({
				key: "{FileShare}",
				text: {
					parts: ["FileShare", "FileShareDescription"],
					formatter: function (
						sFileShare,
						sFileShareDescription
					) {
						return sFileShareDescription ? sFileShareDescription : sFileShare;
					}
				}
			})
		});

		var oSimpleForm = new SimpleForm({
			layout: "ResponsiveGridLayout",
			singleContainerFullSize: false
		});
		oSimpleForm.addContent(oLocationLabel);
		oSimpleForm.addContent(this.oSelectControl);

		var oLabel = new Label({
			text: oResourceBundle.getText("CFP_FILENAME"),
			showColon: true,
			labelFor: this.getId() + "-fileName"
		}).addStyleClass(Device.system.desktop ? "sapUiTinyMarginTop" : '');

		this.oFileNameControl = new Input({
			id: this.getId() + "-fileName",
			liveChange: function (oControlEvent) {
				this.oTableControl.removeSelections();
				var oSelectedFolderInfo = this.oNavigationMap.get(
					this.aVisibleLinks[this.aVisibleLinks.length - 1].fileShareItemId
				);
				this._setConfirmationButtonEnabled(null, oSelectedFolderInfo, true);
			}.bind(this)
		});
		oSimpleForm.addContent(oLabel);
		oSimpleForm.addContent(this.oFileNameControl);

		if (this.getFilePickerMode() === FilePickerModes.FileOnly) {
			this.oFileNameControl.setVisible(false);
		} else {
			this.oFileNameControl.setValue(this.getSuggestedFileName());
		}

		return oSimpleForm;
	};

	CloudFilePicker.prototype._createBreadcrumbLinks = function () {
		this.oBreadcrumbLinkControl = new Breadcrumbs(this.getId() + "-breadcrumbs").addStyleClass(
			"sapUiSmallMarginBegin sapUiSmallMarginEnd"
		);

		this.oNavigationMap = new Map();
		this._initializeVisibleLinks();

		return this.oBreadcrumbLinkControl;
	};

	CloudFilePicker.prototype._initializeVisibleLinks = function () {
		var sCurrentFileShare = this.oSelectControl.getSelectedItem() ? this.oSelectControl.getSelectedItem().getText() : '';
		var oRoot = {
			fileShareItemId: "Root",
			title: sCurrentFileShare
		};
		this.aVisibleLinks = [oRoot];
		this.oBreadcrumbLinkControl.setCurrentLocationText(sCurrentFileShare);
		this.oNavigationMap.clear();
	};

	CloudFilePicker.prototype._createTableContent = function () {
		var sFilePickerType = this.getFilePickerType();
		var sFileSelectionMode = this.getSelectionMode();
		var oMessage = new IllustratedMessage({
			illustrationType: IllustratedMessageType.NoSearchResults,
			illustrationSize: IllustratedMessageSize.Small,
			enableVerticalResponsiveness: true,
			title: oResourceBundle.getText("CFP_EMPTY_FOLDER_TEXT"),
			description: oResourceBundle.getText("CFP_EMPTY_FOLDER_DESCRIPTION")
		});
		this.oNewFolderButton = new Button({
			text: oResourceBundle.getText("CFP_TITLE_NEWFOLDER"),
			type: ButtonType.Transparent,
			enabled: false,
			visible: sFilePickerType === FilePickerType.Upload ? false : true,
			tooltip: oResourceBundle.getText("CFP_TITLE_NEWFOLDER"),
			press: function () {
				this._createNewFolderInline();
			}.bind(this)
		});
		this.oTableControl = new Table({
			headerToolbar: new OverflowToolbar({
				content:[
					new Title({text: oResourceBundle.getText("CFP_LIST_HEADER")}),
					new ToolbarSpacer(),
					new SearchField({
						layoutData: new OverflowToolbarLayoutData({
							minWidth: "200px",
							maxWidth: "300px",
							shrinkable: true,
							priority: "NeverOverflow"
						}),
						visible:false
					}),
					this.oNewFolderButton
				],
				design: 'Transparent'
			}),
			columns: [
				new Column({
					header: new Text({text: oResourceBundle.getText("CFP_NAME"), tooltip: oResourceBundle.getText("CFP_NAME")}),
					customData: [new CustomData({
						key: "bindingProperty",
						value: 'FileShareItemName'
					})],
					width: "auto",
					importance: "High"
				}),
				new Column({
					hAlign: "Left",
					header: new Text({text: oResourceBundle.getText("CFP_TYPE"), wrapping:false, tooltip: oResourceBundle.getText("CFP_TYPE")}),
					customData: [new CustomData({
						key: "bindingProperty",
						value: 'FileShareItemContentType'
					})],
					width: "17%",
					importance: "High"
				}),
				new Column({
					header: new Text({text: oResourceBundle.getText("CFP_OWNER"), wrapping:false, tooltip: oResourceBundle.getText("CFP_OWNER")}),
					customData: [new CustomData({
						key: "bindingProperty",
						value: 'CreatedByUser'
					})],
					width: "17%",
					importance: "Low",
					visible: Device.system.phone ? false : true
				}),
				new Column({
					hAlign: "End",
					header: new Text({text: oResourceBundle.getText("CFP_TITLE_LAST_CHANGED_ON"),wrapping:false, tooltip: oResourceBundle.getText("CFP_TITLE_LAST_CHANGED_ON")}),
					customData: [new CustomData({
						key: "bindingProperty",
						value: 'LastChangeDateTime'
					})],
					width: "17%",
					importance: "Low",
					visible: Device.system.phone ? false : true
				}),
				new Column({
					hAlign: "End",
					header: new Text({text: oResourceBundle.getText("CFP_FILESIZE"),wrapping:false, tooltip: oResourceBundle.getText("CFP_FILESIZE")}),
					customData: [new CustomData({
						key: "bindingProperty",
						value: 'FileShareItemContentSize'
					})],
					width: "10%",
					importance: "Low",
					visible: Device.system.phone ? false : true
				})
			],
			autoPopinMode: true,
			sticky:["HeaderToolbar","ColumnHeaders"],
			noDataText: " ", // UX reccomends to show no text and table shows "No Data" by default
			mode: sFilePickerType === FilePickerType.Upload && sFileSelectionMode === SelectionMode.MultiSelect ? "None" : "SingleSelectMaster",
			growing:true,
			growingScrollToLoad:true,
			itemPress: function(oControlEvent){
				this.oTableControl.setBusyIndicatorDelay(0);
				var oSelectedItem = oControlEvent.getParameters().listItem;
				var oContext = oSelectedItem.getBindingContext();
				var bIsFolder = oContext.getObject("FileShareItemKind") === "folder";
				if (bIsFolder) {
					this._clearCheckboxFileSelections();
					var oSelectedFolderInfo = this._createSelectionParameter(oSelectedItem);
					var sFileShareItemId = oSelectedFolderInfo.getFileShareItemId();
					oSelectedFolderInfo.path = oContext.getCanonicalPath();
					this.oCurrentParentData = oSelectedFolderInfo;
					this.oNavigationMap.set(sFileShareItemId, oSelectedFolderInfo);
					var oNewContext = oContext
						.getModel()
						.createBindingContext(oSelectedFolderInfo.path);
					this.aVisibleLinks.push({
						fileShareItemId: sFileShareItemId,
						title: this.getFilePickerType() === FilePickerType.Upload && this.getSelectionMode() === SelectionMode.MultiSelect ? oSelectedItem.getCells()[1].getItems()[1].getText() : oSelectedItem.getCells()[0].getItems()[1].getText()
					});
					this._updateBreadcrumbLinks();
					this.oTableControl.setBindingContext(oNewContext);
				} else if (!bIsFolder && sFilePickerType === FilePickerType.Upload && sFileSelectionMode === SelectionMode.MultiSelect) {
					return;
				} else {
					var sFieldValue = oContext.getProperty("FileShareItemName");
					this.oFileNameControl.setValue(sFieldValue);
					if (sFilePickerType === FilePickerType.Upload) {
						this._setConfirmationButtonEnabled(true);
					}
				}
			}.bind(this),
			items: {
				path : "_Children",
				parameters : {
					$$operationMode : 'Server'
				},
				sorter : [
					new Sorter({
						path : 'FileShareItemKind',
						descending : true
					}),
					new Sorter({
						path : 'FileShareItemName',
						descending : false
					})
				],
				events:{
					dataReceived: function () {
						this.oTableControl.setNoData(oMessage);
						this.oTableControl.setBusy(false);
						this.setBusy(false);
					}.bind(this)
				},
				template : new ColumnListItem({
					cells: [
						new HBox({
							items: [
								new Icon({src:{
									parts: ["FileShareItemKind", "FileShareItemContentType", "isDocumentCreationAllowed", "FileShareItem"],
									formatter: function (
										sFileShareItemKind,
										sFileShareItemContentType,
										sIsDocumentCreationAllowed,
										sFileShareItem
									) {
										var oFolderIcons = {
											"Recent": "sap-icon://history",
											"Starred": "sap-icon://unfavorite"
										};
										if (sFileShareItemKind === "folder") {
											if (sIsDocumentCreationAllowed === "No") {
												if (oFolderIcons[sFileShareItem]) {
													return oFolderIcons[sFileShareItem];
												} else if (sFilePickerType !== FilePickerType.Upload) {
													return "sap-icon://locked";
												} else {
													return "sap-icon://folder-full";
												}
											} else {
												return "sap-icon://folder-full";
											}
										} else {
											return IconPool.getIconForMimeType(sFileShareItemContentType);
										}
									}
								}, tooltip: {
									parts: ["FileShareItemKind", "isDocumentCreationAllowed"],
									formatter: function(sFileShareItemKind, sIsDocumentCreationAllowed) {
										if (sFileShareItemKind === "folder" && sIsDocumentCreationAllowed === "No" && sFilePickerType === FilePickerType.Export) {
											return oResourceBundle.getText("CFP_LOCKED_FOLDER_INFO");
										} else {
											return "";
										}
									}
								}
								}).addStyleClass("sapUiTinyMarginEnd"),
								new Text({text: "{FileShareItemName}"})
							]
						}),
						new Text({text: "{FileShareItemHumanContentType}"}),
						new Text({text: "{= ${FileShareItemKind} === 'folder' ? '' : ${CreatedByUser}}"}),
						new Text({text:{
							parts: ["FileShareItemKind", "LastChangeDateTime"],
							formatter: function (sFileShareItemKind, sLastChangeDateTime) {
								if (sFileShareItemKind === 'folder') {
									return '';
								} else {
									var oDTOffset = new DateTimeOffset({style: "short"});
									return oDTOffset.formatValue(new Date(sLastChangeDateTime), "string");
								}
							}
							}
						}),
						new Text({text:{
							parts: ["FileShareItemKind", "FileShareItemContentSize"],
							formatter: function (sFileShareItemKind, sFileShareItemContentSize) {
								if (sFileShareItemKind !== "folder" && !!sFileShareItemContentSize && sFileShareItemContentSize !== "0") {
									var sFileSize = FileSizeFormat.getInstance({
										binaryFilesize: false,
										maxFractionDigits: 1,
										maxIntegerDigits: 3
									}).format(sFileShareItemContentSize.split(",").join(""));
									return sFileSize;
								} else {
									return '';
								}
							}
						}})
					],
					type: "{= ${FileShareItemKind} === 'folder' ? 'Navigation' : 'Active'}",
					visible: {
						path: "FileShareItem",
						targetType: "any",
						formatter: function(sFileShareItem) {
							if ((sFilePickerType === FilePickerType.Export) && (sFileShareItem === "Recent" || sFileShareItem === "Starred")){
								return false;
							} else {
								return true;
							}
						}
					}
				})
			},
			updateFinished: function (oEvent) {
				this._checkListForFiles();
				if (!this.oTableControl.getBusy()) {
					if (this.oCurrentParentData && Object.keys(this.oCurrentParentData).length !== 0) {
						if (sFilePickerType === FilePickerType.Export){
							this._setConfirmationButtonEnabled(this.oCurrentParentData.getProperty("isDocumentCreationAllowed"));
						}
						this._enableDisableNewFolderBtn();
					}
				}
			}.bind(this)
		});

		this.oTableControl.bActiveHeaders = true;
		this.oTableControl.attachEvent("columnPress", function(oEvent) {
			var oColumn = oEvent.getParameter("column"), sColumnType = oColumn.getCustomData()[0].getValue();
			if (sColumnType === "CreatedByUser" || sColumnType === "FileShareItemContentSize" || sColumnType === "FileShareItemContentType") {
				return;
			}
			var _aSortButton = [
				new ColumnPopoverSelectListItem({
					icon: "sap-icon://sort-ascending",
					action: function() {
						this._fHandleSorting(oColumn, true);
					}.bind(this)
				}),
				new ColumnPopoverSelectListItem({
					icon: "sap-icon://sort-descending",
					action: function() {
						this._fHandleSorting(oColumn, false);
					}.bind(this)
				})
			];
			var oHeaderPopOver = new ColumnHeaderPopover({
				items: [_aSortButton]
			});
			oHeaderPopOver.openBy(oColumn);
		}.bind(this));

		if (this.getFilePickerType() === FilePickerType.Upload && this.getSelectionMode() === SelectionMode.MultiSelect) {
			var oColumn = new Column({
				width: "10%",
				importance: "High"
			})
			this.oTableControl.insertColumn(oColumn, 0);
			var oTemplate = this.oTableControl.getBindingInfo("items").template;
			oTemplate.insertCell(
				new CheckBox({
					visible: {
						path: "FileShareItemKind" ,
						targetType: "any",
						formatter: function (
							sFileShareItemKind
							) {
								return sFileShareItemKind !== "folder";
							}
					},
					select: function(oEvent) {
						var oCurrentRow = oEvent.getSource().getParent();
						if (oEvent.getSource().getSelected()) {
							this.oSelectedFiles.push(oCurrentRow);
							this._setConfirmationButtonEnabled(true);
						} else {
							this.oSelectedFiles.splice(this.oSelectedFiles.indexOf(oCurrentRow),1);
							if (!this.oSelectedFiles.length) {
								this._setConfirmationButtonEnabled(false);
							}
						}
					}.bind(this)
				}), 0);
		}

		var oPage = new Page({
			showHeader:false,
			content: [this.oTableControl],
			enableScrolling: true
		});
		return oPage;
	};

	CloudFilePicker.prototype._createNewFolderInline = function () {
		var oNewFolderInput = new Input({
			placeholder: "Enter Folder Name",
			width: "100%",
			visible: true
		});
		var sFileShareKey = this.oSelectControl.getSelectedKey();
		var sDocumentType = "folder";
		this.setBusy(true);
		this._checkForDuplicateFileAndFolder(oResourceBundle.getText("CFP_TITLE_NEWFOLDER"), sFileShareKey, sDocumentType, "", true)
		.then( function(oSuccess) {
			this.setBusy(false);
			var regex = /\d+/g ;
			var fcount = 0;
			if (oSuccess.value.length) {
				oSuccess.value.forEach(function(oItem) {
					if (oItem.FileShareItemName.includes('(')) {
						var match = oItem.FileShareItemName.match(regex);
						var counter = Number(match[0]);
						if(counter > fcount) {
							fcount = counter;
						}
					}
				});
				if (fcount) {
					fcount = fcount + 1;
				} else{
					fcount = fcount + 2;
				}
				oNewFolderInput.setValue(oResourceBundle.getText("CFP_TITLE_NEWFOLDER") + '(' + fcount + ')');
			} else {
				oNewFolderInput.setValue(oResourceBundle.getText("CFP_TITLE_NEWFOLDER"));
			}
		}.bind(this));
		oNewFolderInput.attachBrowserEvent("click", function() {
			oNewFolderInput.selectText(0, oNewFolderInput.getValue().length);
		});
		var _createFolder = function(oEvent) {
			if (oNewFolderInput && oNewFolderInput.getValue() !== "") {
				// Check for duplicate folder by making a backend call - Create if returns true else show error
				var sSearchText = oEvent.target.value;
				var sSpecialCharacters = /[!@#$%^&*+\-=\[\]{};':"\\|,.<>\/?]/;
				if (sSpecialCharacters.test(sSearchText)) {
					oNewFolderInput.setValueState(ValueState.Error);
					oNewFolderInput.setValueStateText(oResourceBundle.getText("CFP_FOLDERNAME_VALUESTATEMSG"));
				} else {
					this.setBusy(true);
					this._checkForDuplicateFileAndFolder(sSearchText, sFileShareKey, sDocumentType,"",false)
					.then(function (oSuccess) {
						this.setBusy(false);
						if (oSuccess.value.length) {
							oNewFolderInput.setValueState(ValueState.Error);
							oNewFolderInput.setValueStateText(oResourceBundle.getText("CFP_FOLDER_EXIST"));
						} else {
							oNewFolderInput.setValueState(ValueState.None);
							oNewFolderInput.setValueStateText("");
							this._makeNewFolderEntry(oEvent.target.value);
						}
					}.bind(this));
				}
			}
		}.bind(this);
		oNewFolderInput.attachBrowserEvent("focusout", function(oEvent) {
			_createFolder(oEvent);
		});
		oNewFolderInput.attachBrowserEvent("keypress", function(oEvent) {
			if (oEvent.keyCode === 13){
				_createFolder(oEvent);
			}
		});
		this.oNewFolderColumnListItem = new ColumnListItem({
			cells: [
					new HBox({
						items: [oNewFolderInput]
					}),
					new Text({text: "{= ${FileShareItemKind} === 'folder' ? '' : ${FileShareItemContentType}}"}),
					new Text({text: "{= ${FileShareItemKind} === 'folder' ? '' : ${CreatedByUser}}"}),
					new Text({text: {
						parts: ["FileShareItemKind", "LastChangeDateTime"],
						formatter: function (sFileShareItemKind, sLastChangeDateTime) {
							if (sFileShareItemKind === 'folder') {
								return '';
							} else {
								if (sLastChangeDateTime) {
									var oDTOffset = new DateTimeOffset({style: "short"});
									return oDTOffset.formatValue(new Date(sLastChangeDateTime), "string");
								}
							}
						}
					}}),
					new Text({text: "{= ${FileShareItemKind} === 'folder' ? '' : ${FileShareItemContentSize}}"})
			]
		});
		this._setConfirmationButtonEnabled(false);
		this.oNewFolderButton.setEnabled(false);
		this.oTableControl.insertItem(this.oNewFolderColumnListItem);
		setTimeout(function () {
			oNewFolderInput.focus();
		});
	};

	CloudFilePicker.prototype._checkForDuplicateFileAndFolder = function (sSearchText, sFileShareKey, sDocumentType, sContentType,bNewFolderName) {
		if(bNewFolderName) {
			var filter = "startswith(FileShareItemName,\'" + sSearchText + "\') and FileShareItemKind eq \'" + sDocumentType + "\'and FileShareItemContentType eq \'" + sContentType + "\'";
		} else {
			filter = "FileShareItemName eq \'" + sSearchText + "\'and FileShareItemKind eq \'" + sDocumentType + "\'and FileShareItemContentType eq \'" + sContentType + "\'";
		}
		var sFileShareItem = this.aVisibleLinks[this.aVisibleLinks.length - 1].fileShareItemId;
		var sPath = "/FileShareQuery(FileShare='" + sFileShareKey + "',FileShareItem='" + sFileShareItem + "')/_Query";
		var oContextBinding = this.getModel().bindContext(sPath, "", {"$filter": filter});
		return oContextBinding.requestObject();
	};

	CloudFilePicker.prototype._enableDisableNewFolderBtn = function () {
		// New folder creation to be allowed only at child level of a particular drive
		if (this.oNavigationMap.size && this.oCurrentParentData.getProperty("isDocumentCreationAllowed")) {
			this.oNewFolderButton.setEnabled(true);
		} else {
			this.oNewFolderButton.setEnabled(false);
		}
	};

	CloudFilePicker.prototype._makeNewFolderEntry = function (sFolderName) {
		this.setBusy(true);
		var oBinding = this.oTableControl.getBinding("items"), fnResolve, oPromise = new Promise(function (resolve) {
				fnResolve = resolve;
			});

		this.oTableControl.removeItem(this.oNewFolderColumnListItem);
		this.oNewFolderColumnListItem.destroy();

		//handle success/failure of GET request triggered for a #create on this binding
		var oNewFolderContext = oBinding.create({
				FileShareItemName: sFolderName,
				FileShareItemKind: 'folder'
		}, false, false, false);

		// handle success/failure of POST request triggered for a #create on this binding
		var fnCreateCompleted = function(oEvent) {
		var oContext = oEvent.getParameter("context"), bSuccess = oEvent.getParameter("success");
		if (oContext === oNewFolderContext) {
				oBinding.detachCreateCompleted(fnCreateCompleted, this); // don't accumulate handlers
				fnResolve(bSuccess);
			}
		};

		oBinding.attachCreateCompleted(fnCreateCompleted, this);

		// Handle error when adding a new item
		var fnSafeContextCreated = function() {
			oNewFolderContext
			.created()
			.then(undefined, function (contextError) {
				Log.trace("transient creation context deleted");
			})
			.catch(function (contextError) {
				Log.trace("transient creation context deletion error", contextError);
			});
		};

		oPromise.then(function(bSuccess) {
			if (!bSuccess) {
				fnSafeContextCreated();
				oBinding.resetChanges();
				this.setBusy(false);
			} else {
				oNewFolderContext.created()
				.then(function() {
					this.oTableControl.fireItemPress({listItem: this.oTableControl.getItems()[0]});
				}.bind(this));
				this.oTableControl.setSelectedItem(this.oTableControl.getItems().length > 0 ? this.oTableControl.getItems()[0] : null);
				this.setBusy(false);
				new MessageToast.show(oResourceBundle.getText("CFP_FOLDERCREATION_MSG"));
			}
		}.bind(this));
	};

	CloudFilePicker.prototype._warningMessageDialog = function (sDisplayMessage) {
		var oApproveDialog = new Dialog({
			type: DialogType.Message,
			title: oResourceBundle.getText("CFP_TITLE_WARNING"),
			state: ValueState.Warning,
			content: new Text({ text: sDisplayMessage }),
			beginButton: new Button({
				type: ButtonType.Emphasized,
				text: oResourceBundle.getText("CFP_BUTTON_OK"),
				press: function () {
					oApproveDialog.close();
				}
			})
		});
		oApproveDialog.open();
	};

	CloudFilePicker.prototype._fHandleSorting = function(oColumn, bIsAsc) {
		this._clearCheckboxFileSelections();
		var sNewSort = bIsAsc ? SortOrder.Ascending : SortOrder.Descending;
		if (sNewSort === oColumn.getSortIndicator()) {
			sNewSort = SortOrder.None;
		}
		this.oTableControl.getColumns().forEach(function(oColumn){
			oColumn.setSortIndicator("None");
		});
		oColumn.setSortIndicator(sNewSort);
		var sSortProperty = oColumn.data("bindingProperty");
		var oItemBinding = this.oTableControl.getBinding("items");
		oItemBinding.sort([
			new Sorter("FileShareItemKind", true),
			new Sorter(sSortProperty , !bIsAsc)
		]);
	};

	CloudFilePicker.prototype._resetAndApplyDefaultSorting = function() {
		this.oTableControl.getColumns().forEach(function(oColumn){
			oColumn.setSortIndicator("None");
		});
		var oItemBinding = this.oTableControl.getBinding("items");
		oItemBinding.sort([
			new Sorter("FileShareItemKind", true),
			new Sorter("FileShareItemName" , false)
		]);
	};

	CloudFilePicker.prototype._updateBreadcrumbLinks = function () {
		if (this.aVisibleLinks && this.aVisibleLinks.length > 1) {
			var aVisibleLinksRev = this.aVisibleLinks.slice().reverse();
			var newLinks = [];
			aVisibleLinksRev.forEach(
				function (oVisibleLink, index, array) {
					// Set current drill position in breadcrumb control
					if (index == 0) {
						this.oBreadcrumbLinkControl.setCurrentLocationText(oVisibleLink.title);
					} else {
						var oCrumb = new Link({
							text: oVisibleLink.title,
							press: function (oEvent) {
								this._clearCheckboxFileSelections();
								if (this.oNewFolderColumnListItem && this.oTableControl.indexOfItem(this.oNewFolderColumnListItem) > -1) {
									this.oTableControl.removeItem(this.oNewFolderColumnListItem);
									this.oNewFolderColumnListItem.destroy();
								}
								var iLinkIndex = this.oBreadcrumbLinkControl.indexOfLink(
									oEvent.getSource()
								);
								var aRemovedLinks = this.aVisibleLinks.splice(iLinkIndex + 1);
								var oSelectedFolderInfo, oNewContext;
								this._updateBreadcrumbLinks();
								oSelectedFolderInfo = this.oNavigationMap.get(
									this.aVisibleLinks[this.aVisibleLinks.length - 1].fileShareItemId
								);
								this.oCurrentParentData = oSelectedFolderInfo;
								if (this.aVisibleLinks.length > 1) {
									for (var sKey in aRemovedLinks) {
										this.oNavigationMap.delete(aRemovedLinks[sKey].fileShareItemId);
									}
									this._setConfirmationButtonEnabled(null, oSelectedFolderInfo);
									oNewContext = this.getModel().createBindingContext(oSelectedFolderInfo.path);
									this.oTableControl.setBindingContext(oNewContext);
								} else {
									this._setConfirmationButtonEnabled(null, oSelectedFolderInfo);
									this._loadFileShareRootFolder(this.oSelectControl.getSelectedKey());
								}
							}.bind(this)
						});
						newLinks.push(oCrumb); //note the links are added in an incorrect order need to reverse
					}
				}.bind(this)
			);

			newLinks.reverse();
			// Clear aggregation before we rebuild it
			if (this.oBreadcrumbLinkControl.getLinks()) {
				this.oBreadcrumbLinkControl.removeAllLinks();
			}
			for (var i = 0; i < newLinks.length; i++) {
				this.oBreadcrumbLinkControl.addLink(newLinks[i]);
			}
		} else {
			this.oBreadcrumbLinkControl.destroyLinks();
			this._initializeVisibleLinks();
			this._enableDisableNewFolderBtn();
		}
		this._setConfirmationButtonEnabled(false);
	};

	CloudFilePicker.prototype._loadFileShareRootFolder = function (sFileShareKey) {
		// update binding context for root
		this.oNavigationMap.clear();
		var sPath = "/FileShares(" + "'" + sFileShareKey + "'" + ")/_Root";
		var oContextBinding = this.getModel().bindContext(sPath);
		oContextBinding.requestObject().then(function (oValue) {
			var oSelectedFolderInfo = this._createSelectionParameter(oValue, oContextBinding.getBoundContext(oValue));
			this._setConfirmationButtonEnabled(null, oSelectedFolderInfo);
		}.bind(this));
		var oContext = this.getModel().createBindingContext(sPath);
		this.oTableControl.setBindingContext(oContext);
	};

	CloudFilePicker.prototype._createButton = function () {
		this.oConfirmationButton = new Button({
			text: this.getConfirmButtonText(),
			type: ButtonType.Emphasized,
			enabled: false,
			tooltip: this.getConfirmButtonText(),
			press: function () {
				this.setBusy(true);
				var sCurrentItemInputName = this.oFileNameControl.getValue();
				//Appending MIME type only for Excel as it is not necessary for Google Sheets
				if (this.getMIMEType() && this.getMIMEType() === ".xlsx" && sCurrentItemInputName.indexOf(".xlsx") < 0) {
					sCurrentItemInputName = sCurrentItemInputName + this.getMIMEType();
				}
				if ((this.getFilePickerMode() === FilePickerModes.FileOnly) || sCurrentItemInputName) {
					if (this.getEnableDuplicateCheck()) {
						var sDocumentType = "document";
						var oFileMIMETypes = {
							".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
							".gsheet": "application/vnd.google-apps.spreadsheet"
						};
						var sCurrentFileMIMEType = oFileMIMETypes[this.getMIMEType()];
						this._checkForDuplicateFileAndFolder(sCurrentItemInputName, this.oSelectControl.getSelectedKey(), sDocumentType, sCurrentFileMIMEType ? sCurrentFileMIMEType : '',false)
						.then(function (oSuccess) {
							this.setBusy(false);
							var sExportingMIMEType = this.getMIMEType() ? oFileMIMETypes[this.getMIMEType()] : oFileMIMETypes[".gsheet"];
							this.oReturnedDupFileInfo = oSuccess.value.find(function(oValue) {
								return oValue.FileShareItemContentType === sExportingMIMEType;
							});
							if (this.oReturnedDupFileInfo) {
								this._showOverwriteMessage(sCurrentItemInputName);
							} else {
								this.oFileNameControl.setValue(sCurrentItemInputName);
								this._closeDialog();
							}
						}.bind(this))
						.catch(function (oError) {
							this._closeDialog();
						}.bind(this));
					} else {
						this.oFileNameControl.setValue(sCurrentItemInputName);
						this._closeDialog();
					}
				}
			}.bind(this)
		});
		this.addButton(
			this.oConfirmationButton
		);
		this.addButton(
			new Button({
				text: oResourceBundle.getText("CFP_BUTTON_CANCEL"),
				tooltip: oResourceBundle.getText("CFP_BUTTON_CANCEL"),
				press: function () {
					this.fireCancel();
					this.close();
					setTimeout(function () {
						this.destroy();
					}.bind(this));
				}.bind(this)
			})
		);
		this._setConfirmationButtonEnabled(false);
	};

	CloudFilePicker.prototype._setConfirmationButtonEnabled = function (bEnabled, oSelectedFolderInfo, bFileNameEdit) {
		var bIsFileNameExist = false;
		if (this.oFileNameControl && this.oFileNameControl.getValue()) {
			bIsFileNameExist = this.oFileNameControl.getValue() !== '';
		}
		// Document creation not checked, considered only for export scenarios
		if (this.getFilePickerMode() === FilePickerModes.FileOnly) {
			this.oConfirmationButton.setEnabled(!!bEnabled);
		} else if (oSelectedFolderInfo && oSelectedFolderInfo.getIsDocumentCreationAllowed()) {
			if (this.getFileNameMandatory()) {
				bIsFileNameExist || bEnabled ? this.oConfirmationButton.setEnabled(true) : this.oConfirmationButton.setEnabled(false);
			} else {
				this.oConfirmationButton.setEnabled(true);
			}
		} else if (bFileNameEdit) {
			if (this.getFileNameMandatory()) {
				this.oConfirmationButton.setEnabled((oSelectedFolderInfo && oSelectedFolderInfo.getIsDocumentCreationAllowed()) ? bIsFileNameExist : false);
			}
		} else {
			this.oConfirmationButton.setEnabled(bEnabled ? bEnabled : false);
		}
	};

	CloudFilePicker.prototype._showOverwriteMessage = function (sFileShareItemName) {
		var sDuplicateMessage = this.getDuplicateMessage();
		if (!sDuplicateMessage) {
			sDuplicateMessage = oResourceBundle.getText("CFP_MESSAGE_DUPLICATE", [sFileShareItemName]);
		}

		var oApproveDialog = new Dialog({
			type: DialogType.Message,
			title: oResourceBundle.getText("CFP_TITLE_WARNING"),
			state: ValueState.Warning,
			content: new Text({ text: sDuplicateMessage }),
			beginButton: new Button({
				type: ButtonType.Emphasized,
				text: oResourceBundle.getText("CFP_BUTTON_YES"),
				press: function () {
					oApproveDialog.close();
					this._closeDialog(true);
				}.bind(this)
			}),
			endButton: new Button({
				text: oResourceBundle.getText("CFP_BUTTON_NO"),
				press: function () {
					oApproveDialog.close();
				}
			})
		});
		oApproveDialog.open();
	};

	CloudFilePicker.prototype._closeDialog = function (bReplaceExistingFile) {
		var mParameters = {};

		if (this.aVisibleLinks.length > 1) {
			mParameters.selectedFolder = this.oNavigationMap.get(this.aVisibleLinks[this.aVisibleLinks.length - 1].fileShareItemId);
		} else {
			mParameters.selectedFolder = new CloudFileInfo();
			mParameters.selectedFolder.setFileShareId(this.oSelectControl.getSelectedKey());
		}

		mParameters.selectedFileName = this.oFileNameControl.getValue();
		mParameters.replaceExistingFile = !!bReplaceExistingFile;

		mParameters.selectedFiles = [];
		var oSelectedItem = this.oTableControl.getSelectedItem();
		if (oSelectedItem) {
			mParameters.selectedFiles.push(this._createSelectionParameter(oSelectedItem));
		} else if (bReplaceExistingFile) {
			mParameters.selectedFiles.push(this._createFileParameters(this.oReturnedDupFileInfo));
		} else {
			this.oSelectedFiles.forEach(function(oItem) {
				mParameters.selectedFiles.push(this._createSelectionParameter(oItem));
			}.bind(this));
		}

		this.fireEvent("select", mParameters);

		this.close();
		setTimeout(function () {
			this.destroy();
		}.bind(this));
	};

	CloudFilePicker.prototype._checkListForFiles = function () {
		var bIsFileAvailable = this.oTableControl.getItems().some(function (oTableItem) {
			return oTableItem.getBindingContext().getProperty("FileShareItemKind") !== "folder";
		});
		var oColumns = this.oTableControl.getColumns();
		if (this.getFilePickerType() === FilePickerType.Upload && this.getSelectionMode() === SelectionMode.MultiSelect) {
			oColumns[0].setVisible(bIsFileAvailable);
        }
		for (var i = oColumns.length - 4; i < oColumns.length; i++) {
			oColumns[i].setVisible(bIsFileAvailable);
		}
	};

	CloudFilePicker.prototype._clearCheckboxFileSelections = function() {
		if (this.getFilePickerType() === FilePickerType.Upload && this.getSelectionMode() === SelectionMode.MultiSelect) {
			this.oSelectedFiles.length = 0;
			this.oTableControl.getItems().forEach(function(oItem) {
				oItem.getCells()[0].setSelected(false);
			});
			this._setConfirmationButtonEnabled(false);
		}
	};

	CloudFilePicker.prototype._createFileParameters = function(oValue) {
		var oCloudFileInfo = new CloudFileInfo();
		oCloudFileInfo.setFileShareId(oValue.FileShare);
		oCloudFileInfo.setFileShareItemId(oValue.FileShareItem);
		oCloudFileInfo.setParentFileShareItemId(oValue.ParentFileShareItem);
		oCloudFileInfo.setIsFolder(oValue.FileShareItemKind === "folder");
		oCloudFileInfo.setFileShareItemName(oValue.FileShareItemName);
		oCloudFileInfo.setCreatedByUser(oValue.CreatedByUser);
		oCloudFileInfo.setCreationDateTime(oValue.CreationDateTime);
		oCloudFileInfo.setLastChangedByUser(oValue.LastChangedByUser);
		oCloudFileInfo.setLastChangeDateTime(oValue.LastChangeDateTime);
		oCloudFileInfo.setFileShareItemContentType(oValue.FileShareItemContentType);
		oCloudFileInfo.setFileShareItemContentSize(oValue.FileShareItemContentSize);
		oCloudFileInfo.setFileShareItemContentLink(oValue.FileShareItemContentLink);
		oCloudFileInfo.setFileShareItemHumanContentType(oValue.FileShareItemHumanContentType);
		return oCloudFileInfo;
	};

	CloudFilePicker.prototype._createSelectionParameter = function (oSelectedItem, oContextBinding) {
		var oCloudFileInfo = new CloudFileInfo();
		var oContext;
		if (!oContextBinding) {
			oContext = oSelectedItem.getBindingContext();
		} else {
			oContext = oContextBinding;
		}
		oCloudFileInfo.setFileShareId(oContext.getObject("FileShare"));
		oCloudFileInfo.setFileShareItemId(oContext.getObject("FileShareItem"));
		oCloudFileInfo.setParentFileShareItemId(
			oContext.getObject("ParentFileShareItem")
		);
		oCloudFileInfo.setIsFolder(
			oContext.getObject("FileShareItemKind") === "folder"
		);
		oCloudFileInfo.setFileShareItemName(
			oContext.getObject("FileShareItemName")
		);
		oCloudFileInfo.setCreatedByUser(oContext.getObject("CreatedByUser"));
		oCloudFileInfo.setCreationDateTime(
			oContext.getObject("CreationDateTime")
		);
		oCloudFileInfo.setLastChangedByUser(
			oContext.getObject("LastChangedByUser")
		);
		oCloudFileInfo.setLastChangeDateTime(
			oContext.getObject("LastChangeDateTime")
		);
		oCloudFileInfo.setFileShareItemContent(
			oContext.getObject("FileShareItemContent")
		);
		oCloudFileInfo.setFileShareItemContentType(
			oContext.getObject("FileShareItemContentType")
		);
		oCloudFileInfo.setFileShareItemContentSize(
			oContext.getObject("FileShareItemContentSize")
		);
		oCloudFileInfo.setFileShareItemContentLink(
			oContext.getObject("FileShareItemContentLink")
		);
		oCloudFileInfo.setIsDocumentCreationAllowed(
			oContext.getObject("isDocumentCreationAllowed")
		);
		oCloudFileInfo.setFileShareItemHumanContentType(
                        oContext.getObject("FileShareItemHumanContentType")
                );

		return oCloudFileInfo;
	};

	return CloudFilePicker;
});
