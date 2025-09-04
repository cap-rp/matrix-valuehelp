import Log from "sap/base/Log";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type MenuButton from "sap/m/MenuButton";

import type { EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type OverflowToolbarMenuButton from "sap/m/OverflowToolbarMenuButton";
import type Control from "sap/ui/core/Control";
import MacroAPI from "../MacroAPI";
/**
 * Building block used to create the ‘Share’ functionality.
 * {@link demo:sap/fe/core/fpmExplorer/index.html#/buildingBlocks/features/shareDefault Overview of Building Blocks}
 * <br>
 * Please note that the 'Share in SAP Jam' option is only available on platforms that are integrated with SAP Jam.
 * <br>
 * If you are consuming this building block in an environment where the SAP Fiori launchpad is not available, then the 'Save as Tile' option is not visible.
 *
 *
 * Usage example:
 * <pre>
 * &lt;macros:Share
 * id="someID"
 * visible="true"
 * /&gt;
 * </pre>
 * @alias sap.fe.macros.ShareAPI
 * @since 1.108.0
 */
@defineUI5Class("sap.fe.macros.share.ShareAPI", {
	interfaces: ["sap.m.IOverflowToolbarContent"]
})
class ShareAPI extends MacroAPI {
	/**
	 * The identifier of the 'Share' building block
	 *
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Whether the 'Share' building block is visible or not.
	 *
	 */
	@property({ type: "boolean", defaultValue: true })
	visible!: boolean;

	/**
	 * Returns properties for the interface IOverflowToolbarContent.
	 * @returns Returns the configuration of IOverflowToolbarContent
	 */
	getOverflowToolbarConfig(): object {
		return {
			canOverflow: true,
			onBeforeEnterOverflow: function (oControl: Object): void {
				((oControl as EnhanceWithUI5<FormElementWrapper>)?.getContent() as OverflowToolbarMenuButton).getText =
					function (): string {
						const resourceModel = getResourceModel(oControl as Control);
						return resourceModel.getText("M_COMMON_SAPFE_ACTION_SHARE");
					};
			},
			onAfterExitOverflow: function (oControl: Object): void {
				((oControl as EnhanceWithUI5<FormElementWrapper>)?.getContent() as OverflowToolbarMenuButton).getText =
					function (): string {
						return "";
					};
			},
			priority: "High"
		};
	}

	/**
	 * Sets the visibility of the 'Share' building block based on the value.
	 * If the 'Share' building block is used in an application that's running in Microsoft Teams,
	 * this function does not have any effect,
	 * since the 'Share' building block handles the visibility on it's own in that case.
	 * @param visibility The desired visibility to be set
	 * @returns Promise which resolves with the instance of ShareAPI
	 */
	async setVisibility(visibility: boolean): Promise<this> {
		const { default: CollaborationHelper } = await import("sap/suite/ui/commons/collaboration/CollaborationHelper");
		const isTeamsModeActive = await CollaborationHelper.isTeamsModeActive();
		// In case of teams mode share should not be visible
		// so we do not do anything
		if (!isTeamsModeActive) {
			this.content.setVisible(visibility);
			this.visible = visibility;
		} else {
			Log.info("Share Building Block: visibility not changed since application is running in teams mode!");
		}
		return Promise.resolve(this);
	}

	/**
	 * Adds style class to MenuButton. Requested by the toolbars that contain the Share Button.
	 * @param style
	 * @returns Returns the reference to the MenuButton
	 */
	addStyleClass(style: string): this {
		const menuButton = this.getAggregation("content") as MenuButton;
		menuButton.addStyleClass(style);
		return this;
	}
}
export default ShareAPI;
