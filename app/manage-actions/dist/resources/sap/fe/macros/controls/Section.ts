import Log from "sap/base/Log";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, mixin, property } from "sap/fe/base/ClassSupport";
import * as HookSupport from "sap/fe/base/HookSupport";
import type { FEView } from "sap/fe/core/BaseController";
import CommonUtils from "sap/fe/core/CommonUtils";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import type { ObjectPageManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import SectionStateHandler from "sap/fe/macros/controls/section/mixin/SectionStateHandler";
import type SubSectionBlock from "sap/fe/templates/ObjectPage/controls/SubSectionBlock";
import type OverflowToolbar from "sap/m/OverflowToolbar";
import type Title from "sap/m/Title";
import type VBox from "sap/m/VBox";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type { $ManagedObjectSettings } from "sap/ui/base/ManagedObject";
import Component from "sap/ui/core/Component";
import type DynamicSideContent from "sap/ui/layout/DynamicSideContent";
import type { $ObjectPageSectionSettings } from "sap/uxap/ObjectPageSection";
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import ObjectPageSection from "sap/uxap/ObjectPageSection";
import type ObjectPageSubSection from "sap/uxap/ObjectPageSubSection";
import type SubSection from "./section/SubSection";

type AdjustmentProps = {
	tablesAdjusted?: boolean;
};

type AdjustmentResults = {
	subSection: ObjectPageSubSection;
} & AdjustmentProps;

@defineUI5Class("sap.fe.macros.controls.Section", { designtime: "sap/uxap/designtime/ObjectPageSection.designtime" })
@mixin(SectionStateHandler)
class Section extends ObjectPageSection {
	// TODO: this probably makes sense to be an event. But we can address this later.
	@property({ type: "string" })
	onSectionLoaded!: string;

	@property({ type: "boolean" })
	useSingleTextAreaFieldAsNotes!: boolean;

	/**
	 * Path to the apply state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	applyStateHandler?: string;

	/**
	 * Path to the retrieve state handler to be called during state interactions.
	 */
	@property({ type: "string" })
	retrieveStateHandler?: string;

	constructor(properties: $ObjectPageSectionSettings & PropertiesOf<Section>, others?: $ObjectPageSectionSettings) {
		super(properties as unknown as string, others);
		this.registerDelegate();
	}

	_sectionLoadMethodName: string | undefined;

	_sectionLoadModuleName: string | undefined;

	private registerDelegate(): void {
		const eventDelegates = {
			onAfterRendering: (): void => {
				const view = CommonUtils.getTargetView(this);
				let subSections = this.getSubSections();
				subSections = subSections.filter((subSection: SubSection) => {
					const blocks = subSection.getBlocks();
					return blocks.length === 0;
				});
				if (subSections.length) {
					subSections.forEach((subSection: SubSection) => {
						const subSectionEventDelegate = {
							onBeforeRendering: (): void => {
								if (this.useSingleTextAreaFieldAsNotes) {
									this.checkAndAdjustSectionContentForTextArea();
								}
								this.checkAndAdjustForSingleContent(view);
								subSection.removeEventDelegate(subSectionEventDelegate);
							}
						};
						subSection.addEventDelegate(subSectionEventDelegate);
					});
				} else {
					if (this.useSingleTextAreaFieldAsNotes) {
						this.checkAndAdjustSectionContentForTextArea();
					}
					this.checkAndAdjustForSingleContent(view);
				}
			}
		};

		this.addEventDelegate(eventDelegates);
	}

	setOnSectionLoaded(onSectionLoaded: string): void {
		const loadSplit = onSectionLoaded.split(".");
		this._sectionLoadMethodName = loadSplit?.pop();
		this._sectionLoadModuleName = loadSplit?.join("/");
		this.setProperty("onSectionLoaded", onSectionLoaded);
	}

	// TODO: Check if onAfterRendering can be used instead of applySettings.
	applySettings(mSettings: $ManagedObjectSettings, oScope?: object): this {
		super.applySettings(mSettings, oScope);
		const templateComponent = Component.getOwnerComponentFor(this) as TemplateComponent;
		const pageController = templateComponent.getRootController();
		if (pageController) {
			HookSupport.initControllerExtensionHookHandlers(this, pageController);
		}
		return this;
	}

	/**
	 * Update subsection background class based on table adjustments made.
	 * @param adjustmentResults Array of adjustment results
	 */
	updateNonTableSubSectionBackground(adjustmentResults: AdjustmentResults[]): void {
		if (this.hasStyleClass("sapUiTableOnObjectPageAdjustmentsForSection")) {
			adjustmentResults.forEach(({ subSection, tablesAdjusted }) => {
				if (tablesAdjusted) {
					subSection.removeStyleClass("sapUiAdjustedSectionSubsectionWithoutTable");
				} else {
					subSection.addStyleClass("sapUiAdjustedSectionSubsectionWithoutTable");
				}
			});
		}
	}

	/**
	 * This method loops through all the visible subsections and triggers the text area flow if thats the only single control within the section.
	 */
	checkAndAdjustSectionContentForTextArea(): void {
		const visibleSubSections = this.getVisibleSubSections();
		const adjustmentResults = visibleSubSections.reduce((results: AdjustmentResults[], subSection: ObjectPageSubSection) => {
			let tablesAdjusted;
			const content = this.getSingleContent([subSection]);
			if (content) {
				tablesAdjusted = this.adjustForSingleContent(content).tablesAdjusted;
			}
			results.push({ subSection, tablesAdjusted });
			return results;
		}, []);
		this.updateNonTableSubSectionBackground(adjustmentResults);
	}

	checkAndAdjustForSingleContent(view: FEView): void | Promise<unknown> {
		if ((view?.getViewData() as ObjectPageManifestSettings)?.sectionLayout === "Page") {
			const singleContent = this.getSingleContent();
			if (
				singleContent &&
				(singleContent.isA("sap.fe.macros.controls.section.ISingleSectionContributor") ||
					this.checkIfNotesReuseComponent(singleContent))
			) {
				const { tablesAdjusted: singleContentTableAdjusted } = this.adjustForSingleContent(singleContent);
				const subSections = this.getVisibleSubSections();
				this.updateNonTableSubSectionBackground([{ subSection: subSections[0], tablesAdjusted: singleContentTableAdjusted }]);
			} else if (this._sectionLoadModuleName && this._sectionLoadMethodName) {
				return FPMHelper.loadModuleAndCallMethod(this._sectionLoadModuleName, this._sectionLoadMethodName, view, this);
			} else if (this.getSubSections().length > 1) {
				// call merge title logic for subsections
				this.checkAndAdjustTitles();
			} else {
				Log.debug("Section cannot be adjusted for single content : Interface 'ISingleSectionContributor' is not implemented");
			}
		} else {
			this.checkAndAdjustTitles();
		}
	}

	/**
	 *
	 * @param singleContent Object of the content present within the section.
	 * @returns True if the content present is a notes reuse component
	 */
	checkIfNotesReuseComponent(singleContent: ManagedObject): boolean {
		if (singleContent.isA("sap.m.VBox") && singleContent.getId().includes("NoteSection")) {
			return true;
		}
		return false;
	}

	/**
	 * This function checks for the visible subsections and checks for the collection facet label, If present then we merge the title and this function handles the DynamicSideConent as well.
	 */
	checkAndAdjustTitles(): void {
		const visibleSubSections = this.getVisibleSubSections();
		if (visibleSubSections.length === 1) {
			const { tablesAdjusted: singleSubSectionTableAdjusted } = this.adjustSectionContentWithTitle(visibleSubSections[0]);
			this.updateNonTableSubSectionBackground([{ subSection: visibleSubSections[0], tablesAdjusted: singleSubSectionTableAdjusted }]);
		} else {
			const adjustmentResults = visibleSubSections.reduce((results: AdjustmentResults[], subsection: ObjectPageSubSection) => {
				let tablesAdjusted;
				let content;
				const blocks = subsection.getBlocks();
				// In case of Tab layout, we need to check if the section has only one subsection and that subsection has only one control
				// In case of collection Facet, the first block will be Title and the second block will be SubSectionBlock
				if (blocks.length === 2 && blocks[1]?.isA<SubSectionBlock>("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
					tablesAdjusted = this.adjustSectionContentWithTitle(subsection).tablesAdjusted;
				}
				// In case of Reference Facet, the first block will be SubSectionBlock
				else if (blocks.length === 1 && blocks[0]?.isA<SubSectionBlock>("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
					content = blocks[0].getAggregation("content") as ManagedObject;
					if (content.isA("sap.fe.macros.controls.section.ISingleSectionContributor")) {
						tablesAdjusted = this.adjustForSingleContent(content, {
							sectionFromReferenceFacet: true,
							SubSection: subsection,
							showTitle: this.getVisibleSubSections().length > 1
						}).tablesAdjusted;
					} else if ((content as DynamicSideContent)?.isA("sap.ui.layout.DynamicSideContent")) {
						content =
							(content as DynamicSideContent).getMainContent instanceof Function &&
							(content as DynamicSideContent)?.getMainContent();
						if (content && content.length === 1) {
							content = content[0];
							tablesAdjusted = this.adjustForSingleContent(content, {
								sectionFromReferenceFacet: true,
								SubSection: subsection
							}).tablesAdjusted;
						}
					}
				}
				results.push({ subSection: subsection, tablesAdjusted });
				return results;
			}, []);
			this.updateNonTableSubSectionBackground(adjustmentResults);
		}
	}

	/**
	 * This function checks for the for the collection facet label,If present then we merge the title.
	 * @param subsection ObjectPage SubSection
	 */
	adjustSectionContentWithTitle(subsection: ObjectPageSubSection): AdjustmentResults {
		let adjustmentProps: AdjustmentProps = {};
		const blocks = subsection.getBlocks();
		let content;
		if (blocks.length === 2 && blocks[1].isA<SubSectionBlock>("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
			content = blocks[1].getAggregation("content") as ManagedObject;
			if (content && content.isA("sap.fe.macros.controls.section.ISingleSectionContributor") && blocks[0].isA<Title>("sap.m.Title")) {
				adjustmentProps = this.adjustForSingleContent(content, {
					sectionfromCollectionFacet: true,
					Title: blocks[0],
					SubSection: subsection,
					showTitle: this.getVisibleSubSections().length > 1
				});
			} else if (content && content.isA<DynamicSideContent>("sap.ui.layout.DynamicSideContent")) {
				content = content.getMainContent instanceof Function && content?.getMainContent();
				if (content && content.length === 1) {
					content = content[0];
					adjustmentProps = this.adjustForSingleContent(content, {
						sectionfromCollectionFacet: true,
						Title: blocks[0] as Title,
						SubSection: subsection
					});
				}
			}
		}
		return { subSection: subsection, tablesAdjusted: adjustmentProps.tablesAdjusted };
	}

	getSingleContent(visibleSubSections?: ObjectPageSubSection[]): ManagedObject | undefined {
		const subSections = visibleSubSections ?? this.getVisibleSubSections();
		if (subSections.length === 1) {
			const blocks = subSections[0].getBlocks();
			if (blocks.length === 1 && blocks[0].isA<SubSectionBlock>("sap.fe.templates.ObjectPage.controls.SubSectionBlock")) {
				return blocks[0].getAggregation("content") as ManagedObject;
			}
			//If there is an invisible text before a standard building block, then also the merge title logic should be applied as its still a single content
			else if (
				blocks.length === 2 &&
				blocks[0].isA("sap.ui.core.InvisibleText") &&
				blocks[1].isA<SubSectionBlock>("sap.fe.templates.ObjectPage.controls.SubSectionBlock")
			)
				return blocks[1].getAggregation("content") as ManagedObject;
		}
	}

	getVisibleSubSections(): ObjectPageSubSection[] {
		const subSections = this.getSubSections();
		return subSections.reduce((visibleSubSections: ObjectPageSubSection[], subSection) => {
			if (subSection.getVisible()) {
				visibleSubSections.push(subSection);
			}
			return visibleSubSections;
		}, [] as ObjectPageSubSection[]);
	}

	getSectionTitle(): string {
		let title = this.getTitle();
		if (this.getVisibleSubSections().length === 1) {
			title = this.getVisibleSubSections()[0].getTitle();
		}
		return title;
	}

	/**
	 * Adjust the section and subsection based on the available content.
	 * @param singleContent Content
	 * @param sectionDetails Details
	 * @returns Is the section adjusted.
	 */
	adjustForSingleContent(
		singleContent: ManagedObject,
		sectionDetails?: Record<string, ObjectPageSubSection | Title | boolean>
	): AdjustmentProps {
		// sapUiTableOnObjectPageAdjustmentsForSection class at level makes background of subsection titles transparent.
		// This transparent background is propagated to contents that are expected to show opaque backgrounds by default.
		// We need to add exclusion class "sapUiAdjustedSectionSubsectionWithoutTable" to the subsection that doesn't need
		const classesToAdd: Set<string> = new Set();
		const sectionOnlyContent = singleContent as unknown as ISingleSectionContributor;
		// This function will also be called from the extensionAPI along with some controls by the application developer, the below check is added to cover the cases where the controls passed like sap.m.Title are not implementing the interface
		const contentRole = sectionOnlyContent.getSectionContentRole && sectionOnlyContent.getSectionContentRole();
		if (contentRole === "provider") {
			const infoFromProvider =
				sectionOnlyContent.getDataFromProvider && sectionOnlyContent.getDataFromProvider(this.useSingleTextAreaFieldAsNotes);
			if (infoFromProvider && this.getTitle() === infoFromProvider.title) {
				this.setTitle(infoFromProvider.title);
				this.setShowTitle(true);
				// TODO: Check if this is really needed?
				classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
			}
		} else if (contentRole === "consumer") {
			let title = this.getSectionTitle();
			if (sectionDetails?.sectionfromCollectionFacet) {
				title = (sectionDetails?.Title as Title)?.getText();
				(sectionDetails?.Title as Title)?.setVisible(false);
				(sectionDetails?.SubSection as ObjectPageSubSection)?.setShowTitle(false);
			} else if (sectionDetails?.sectionFromReferenceFacet) {
				title = (sectionDetails?.SubSection as ObjectPageSubSection)?.getTitle();
				(sectionDetails?.SubSection as ObjectPageSubSection)?.setShowTitle(false);
			}
			if (title === "" && sectionDetails?.SubSection) {
				title = (sectionDetails?.SubSection as ObjectPageSubSection).getTitle();
			}
			if (sectionOnlyContent.sendDataToConsumer) {
				const subSections = this.getSubSections();
				const hasMultipleSubsections = !!(subSections?.length > 1);

				sectionOnlyContent.sendDataToConsumer({
					titleLevel: this.getTitleLevel(),
					title: title,
					headerStyle: hasMultipleSubsections ? "H5" : "H4"
				});
				this.setShowTitle(!!sectionDetails?.showTitle);
				classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");

				// if the section has only sub section, then the sub section's title should not be displayed
				if (!hasMultipleSubsections) subSections[0].setShowTitle(false);
			}
		} else if (singleContent?.isA("sap.m.Title")) {
			const title = singleContent as Title;
			title.setText(this.getTitle());
			title.setTitleStyle("H4");
			title.setLevel(this.getTitleLevel());
			this.setShowTitle(false);
			classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
		} else if (this.checkIfNotesReuseComponent(singleContent)) {
			/**
			 * Notes Reuse component has the following structure :
			 * <VBox id="NoteSection">
			 * <MessageStrip id="notesDebugProperties">
			 * <List id="NotesList">
			 * <headerToolbar>
			 * <OverflowToolbar id="noteHeaderOverflowToolbar" style="Standard">
			 *       <Title id="noteHeaderOverflowToolbarTitle"/>
			 *		......
			 *	</OverflowToolbar>
			 *	</headerToolbar>
			 *	......
			 *	</List>
			 *	</VBox>
			 *	.....
			 *
			 * We are applying the title merge logic for the title within the overflow toolbar
			 * in the following code
			 *
			 */
			const vBoxItems = (singleContent as VBox).getItems();
			vBoxItems.forEach((vBoxItem) => {
				const headerToolbar = vBoxItem.getAggregation("headerToolbar");
				if (headerToolbar) {
					(headerToolbar as OverflowToolbar)?.getContent().forEach((control) => {
						if (control.isA("sap.m.Title")) {
							const notesTitle = control as Title;
							notesTitle.setText(this.getTitle());
							notesTitle.setTitleStyle("H4");
							notesTitle.setLevel(this.getTitleLevel());
						}
					});
				}
			});
			this.setShowTitle(false);
			classesToAdd.add("sapUiTableOnObjectPageAdjustmentsForSection");
		}
		this.addStyleClass(Array.from(classesToAdd).join(" "));
		return { tablesAdjusted: classesToAdd.has("sapUiTableOnObjectPageAdjustmentsForSection") };
	}
}

export default Section;
