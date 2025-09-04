import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import extend from "sap/base/util/extend";
import { defineUI5Class, extensible, finalExtension, methodOverride, publicExtension } from "sap/fe/base/ClassSupport";
import type ActionSheet from "sap/m/ActionSheet";
import type Dialog from "sap/m/Dialog";
import library from "sap/m/library";
import type { $ComponentSettings } from "sap/ui/core/Component";
import Component from "sap/ui/core/Component";
import type Control from "sap/ui/core/Control";
import Element from "sap/ui/core/Element";
import Fragment from "sap/ui/core/Fragment";
import type Item from "sap/ui/core/Item";
import Library from "sap/ui/core/Lib";
import XMLTemplateProcessor from "sap/ui/core/XMLTemplateProcessor";
import ControllerExtension from "sap/ui/core/mvc/ControllerExtension";
import OverrideExecution from "sap/ui/core/mvc/OverrideExecution";
import HashChanger from "sap/ui/core/routing/HashChanger";
import XMLPreprocessor from "sap/ui/core/util/XMLPreprocessor";
import JSONModel from "sap/ui/model/json/JSONModel";
import type AddBookmarkButton from "sap/ushell/ui/footerbar/AddBookmarkButton";
import type { IAdaptiveCard } from "types/adaptiveCard_types";
import type PageController from "../PageController";

let oLastFocusedControl: Control;

export type ShareMetadata = {
	url: string;
	title: string;
	email: { url: string; title: string };
	jam: { url?: string; title: string };
	tile: { url?: string; title: string; subtitle: string; icon?: string; queryUrl?: string };
};

/**
 * A controller extension offering hooks into the routing flow of the application
 * @hideconstructor
 * @public
 * @since 1.86.0
 */
@defineUI5Class("sap.fe.core.controllerextensions.Share")
class ShareUtils extends ControllerExtension {
	protected base!: PageController;

	constructor() {
		super();
	}

	@methodOverride()
	onInit(): void {
		const shareInfoModel: JSONModel = new JSONModel({
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
	}

	@methodOverride()
	onExit(): void {
		const shareInfoModel = this.base?.getView()?.getModel("shareInfo") as JSONModel | undefined;
		if (shareInfoModel) {
			shareInfoModel.destroy();
		}
	}

	/**
	 * Opens the share sheet.
	 * @param oControl The control to which the ActionSheet is opened.
	 * @public
	 * @since 1.93.0
	 */
	@publicExtension()
	@finalExtension()
	openShareSheet(oControl: Control): void {
		this._openShareSheetImpl(oControl);
	}

	/**
	 * Get adaptive card definition.
	 * @returns Adaptive card definition or a Promise resolving the Adaptive card definition
	 */
	@publicExtension()
	@extensible("AfterAsync")
	async getCardDefinition(): Promise<IAdaptiveCard | undefined> {
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
	 */
	@publicExtension()
	@extensible(OverrideExecution.After)
	adaptShareMetadata(oShareMetadata: {
		url: string;
		title: string;
		email: { url: string; title: string };
		jam: { url?: string; title: string };
		tile: { url?: string; title: string; subtitle: string; icon?: string; queryUrl?: string };
	}): ShareMetadata | Promise<ShareMetadata> {
		const shareInfoModel = this.base?.getView()?.getModel("shareInfo") as JSONModel | undefined;
		const manifest = this.base.getAppComponent().getManifest();
		const appId = manifest?.["sap.app"]?.id;
		const appTitle = manifest?.["sap.app"]?.title || document.title;
		if (shareInfoModel) {
			shareInfoModel.setProperty("/collaborationInfo/appId", appId);
			shareInfoModel.setProperty("/collaborationInfo/url", oShareMetadata.url);
			shareInfoModel.setProperty("/collaborationInfo/appTitle", appTitle);
		}
		return oShareMetadata;
	}

	async _openShareSheetImpl(by: Control & { shareSheet?: ActionSheet }): Promise<void> {
		let oShareActionSheet: ActionSheet;
		const hashChangerInstance = HashChanger.getInstance();
		const sHash = hashChangerInstance.getHash();
		const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";
		const oShareMetadata = {
			url:
				window.location.origin +
				window.location.pathname +
				window.location.search +
				(sHash ? sBasePath + sHash : window.location.hash),
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

		const setShareEmailData = function (shareActionSheet: ActionSheet, oModelData: object): void {
			const oShareMailModel = shareActionSheet.getModel("shareData") as JSONModel;
			const oNewMailData = extend(oShareMailModel.getData(), oModelData);
			oShareMailModel.setData(oNewMailData);
		};

		try {
			const oModelData: ShareMetadata = await this.base.getView().getController()?.share?.adaptShareMetadata(oShareMetadata);
			const fragmentController: Record<string, Function> = {
				shareEmailPressed: function (): void {
					const oMailModel = oShareActionSheet.getModel("shareData") as JSONModel;
					const oMailData = oMailModel.getData();
					const oResource = Library.getResourceBundleFor("sap.fe.core")!;
					const sEmailSubject = oMailData.email.title
						? oMailData.email.title
						: oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [oMailData.title]);
					library.URLHelper.triggerEmail(undefined, sEmailSubject, oMailData.email.url ? oMailData.email.url : oMailData.url);
				},
				shareMSTeamsPressed: function (): void {
					const msTeamsModel = oShareActionSheet.getModel("shareData") as JSONModel;
					const msTeamsData = msTeamsModel.getData();
					const message = msTeamsData.email.title ? msTeamsData.email.title : msTeamsData.title;
					const url = msTeamsData.email.url ? msTeamsData.email.url : msTeamsData.url;
					const newWindowOpen = window.open("", "ms-teams-share-popup", "width=700,height=600");
					newWindowOpen!.opener = null;
					newWindowOpen!.location = `https://teams.microsoft.com/share?msgText=${encodeURIComponent(
						message
					)}&href=${encodeURIComponent(url)}`;
				},
				onSaveTilePress: function (): void {
					// TODO it seems that the press event is executed before the dialog is available - adding a timeout is a cheap workaround
					setTimeout(function () {
						(Element.getElementById("bookmarkDialog") as Dialog | undefined)?.attachAfterClose(function () {
							oLastFocusedControl.focus();
						});
					}, 0);
				},
				shareJamPressed: async (): Promise<void> => {
					await this._doOpenJamShareDialog(
						oModelData?.jam?.title ? oModelData.jam.title : oModelData.title,
						oModelData?.jam?.url ? oModelData.jam.url : oModelData.url
					);
				}
			};

			fragmentController.onCancelPressed = function (): void {
				oShareActionSheet.close();
			};

			fragmentController.setShareSheet = function (oShareSheet: ActionSheet): void {
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

				const oShareModel = oShareActionSheet.getModel("share") as JSONModel;
				this._setStaticShareData(oShareModel);
				const oNewData = extend(oShareModel.getData(), oTileData);
				oShareModel.setData(oNewData);
				setShareEmailData(oShareActionSheet, oModelData);
				oShareActionSheet.openBy(by);
			} else {
				const sFragmentName = "sap.fe.macros.share.ShareSheet";
				const oPopoverFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, "fragment");

				try {
					const oFragment = await XMLPreprocessor.process(oPopoverFragment, { name: sFragmentName }, oPreprocessorSettings);
					oShareActionSheet = (await Fragment.load({
						definition: oFragment as unknown as string,
						controller: fragmentController
					})) as ActionSheet;

					oShareActionSheet.setModel(new JSONModel(oTileData || {}), "share");
					const oShareModel = oShareActionSheet.getModel("share") as JSONModel;
					this._setStaticShareData(oShareModel);
					const oNewData = extend(oShareModel.getData(), oTileData);
					oShareModel.setData(oNewData);

					oShareActionSheet.setModel(new JSONModel(oModelData || {}), "shareData");
					setShareEmailData(oShareActionSheet, oModelData);

					by.addDependent(oShareActionSheet);
					oShareActionSheet.openBy(by);
					fragmentController.setShareSheet(oShareActionSheet);
				} catch (oError: unknown) {
					Log.error("Error while opening the share fragment", oError as string);
				}
			}
		} catch (oError: unknown) {
			Log.error("Error while fetching the share model data", oError as string);
		}
	}

	/**
	 * This function returns the url based on iframe and non-iframe applications.
	 * @param shareUrl The url to be shared.
	 * @returns Url.
	 */
	async getTeamsUrl(shareUrl: string): Promise<string | undefined> {
		const appUrl = await this.base.getAppComponent()?.getShellServices().getInframeUrl();
		return appUrl ? appUrl : shareUrl;
	}

	_setStaticShareData(shareModel: JSONModel): void {
		const oResource = Library.getResourceBundleFor("sap.fe.core")!;
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
	async _doOpenJamShareDialog(text: string, sUrl?: string): Promise<void> {
		const oShareDialog = await Component.create({
			name: "sap.collaboration.components.fiori.sharing.dialog",
			settings: {
				object: {
					id: sUrl,
					share: text
				}
			} as $ComponentSettings
		});
		(oShareDialog as unknown as { open: Function }).open();
	}

	/**
	 * Triggers the email flow.
	 *
	 */
	@publicExtension()
	@finalExtension()
	async _triggerEmail(): Promise<void> {
		const shareMetadata: ShareMetadata = await this._adaptShareMetadata();
		const oResource = Library.getResourceBundleFor("sap.fe.core")!;
		const sEmailSubject = shareMetadata.email.title
			? shareMetadata.email.title
			: oResource.getText("T_SHARE_UTIL_HELPER_SAPFE_EMAIL_SUBJECT", [shareMetadata.title]);
		library.URLHelper.triggerEmail(undefined, sEmailSubject, shareMetadata.email.url ? shareMetadata.email.url : shareMetadata.url);
	}

	/**
	 * Triggers the share to jam flow.
	 *
	 */
	@publicExtension()
	@finalExtension()
	async _triggerShareToJam(): Promise<void> {
		const shareMetadata: ShareMetadata = await this._adaptShareMetadata();
		await this._doOpenJamShareDialog(
			shareMetadata.jam.title ? shareMetadata.jam.title : shareMetadata.title,
			shareMetadata.jam.url ? shareMetadata.jam.url : window.location.origin + window.location.pathname + shareMetadata.url
		);
	}

	/**
	 * Triggers the save as tile flow.
	 * @param [source]
	 */
	@publicExtension()
	@finalExtension()
	async _saveAsTile(source: Item): Promise<void> {
		const shareInfoModel = this.base?.getView()?.getModel("shareInfo") as JSONModel | undefined;
		if (shareInfoModel) {
			// set the saveAsTileClicked flag to true when save as tile is clicked
			shareInfoModel.setProperty("/saveAsTileClicked", true);
		}
		const shareMetadata: ShareMetadata = await this._adaptShareMetadata(),
			internalAddBookmarkButton = source.getDependents()[0] as AddBookmarkButton,
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
	 */
	@publicExtension()
	@finalExtension()
	async _adaptShareMetadata(): Promise<ShareMetadata> {
		const hashChangerInstance = HashChanger.getInstance();
		const sHash = encodeURIComponent(hashChangerInstance.getHash());
		const sBasePath = hashChangerInstance.hrefForAppSpecificHash ? hashChangerInstance.hrefForAppSpecificHash("") : "";

		const oShareMetadata: ShareMetadata = {
			url:
				window.location.origin +
				window.location.pathname +
				window.location.search +
				(sHash ? sBasePath + sHash : window.location.hash),
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
	}
}

export default ShareUtils;
