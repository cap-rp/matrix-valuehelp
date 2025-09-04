import type SubSection from "sap/fe/macros/controls/section/SubSection";
import BaseStateHandler from "sap/fe/macros/controls/section/mixin/BaseStateHandler";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import BlockBase from "sap/uxap/BlockBase";

export type SubSectionState = unknown;

export default class SubSectionStateHandler extends BaseStateHandler<SubSectionState> {
	/**
	 * Listen to subsections rendering to enable state interactions.
	 */
	setupStateInteractionsForLazyRendering(this: SubSection & SubSectionStateHandler): void {
		if (!this.checkForStateInteractions()) {
			this.registerSubSectionDelegate(this);
		}
	}

	/**
	 * Check if blocks are available for state interactions.
	 * @returns Boolean.
	 */
	isBlocksAvailable(this: SubSection & SubSectionStateHandler): boolean {
		const blocks = this.getBlocks().filter((block) => block instanceof BlockBase);
		return blocks.length > 0;
	}
}
