import type Section from "sap/fe/macros/controls/Section";
import BaseStateHandler from "sap/fe/macros/controls/section/mixin/BaseStateHandler";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import BlockBase from "sap/uxap/BlockBase";

export type SectionState = unknown;

export default class SectionStateHandler extends BaseStateHandler<SectionState> {
	/**
	 * Listen to subsections rendering to enable state interactions.
	 */
	setupStateInteractionsForLazyRendering(this: Section & SectionStateHandler): void {
		if (this.isSubSectionsAvailable()) {
			this.checkForSectionStateInteractions();
		} else {
			// Subsections are not available yet, so we hook to onBeforeRendering event delegate.
			const sectionEventDelegate = {
				onBeforeRendering: (): void => {
					if (this.isSubSectionsAvailable()) {
						// once subsections are avialable, we detach event delegate.
						this.checkForSectionStateInteractions();
						this.removeEventDelegate(sectionEventDelegate);
					}
				}
			};
			this.addEventDelegate(sectionEventDelegate);
		}
	}

	/**
	 * Check for state interactions for the section.
	 */
	checkForSectionStateInteractions(this: Section & SectionStateHandler): void {
		if (!this.checkForStateInteractions()) {
			// Blocks are not avialable yet, so we hook to onBeforeRendering event delegate.
			const subSections = this.getSubSections();
			subSections.forEach(this.registerSubSectionDelegate.bind(this));
		}
	}

	/**
	 * Check if subsections are available.
	 * @returns Boolean.
	 */
	isSubSectionsAvailable(this: Section & SectionStateHandler): boolean {
		return this.getSubSections().length > 0;
	}

	/**
	 * Check if blocks are available for state interactions.
	 * @returns Boolean.
	 */
	isBlocksAvailable(this: Section & SectionStateHandler): boolean {
		const subSections = this.getSubSections();
		return subSections.some((subSection) => {
			const blocks = subSection.getBlocks().filter((block) => block instanceof BlockBase);
			return blocks.length > 0;
		});
	}
}
