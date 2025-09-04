import { defineUI5Class } from "sap/fe/base/ClassSupport";
import EventDelegateHook from "sap/fe/base/EventDelegateHook";
import type Section from "sap/fe/macros/controls/Section";
import type SubSectionBlock from "sap/fe/templates/ObjectPage/controls/SubSectionBlock";
import type Form from "sap/ui/layout/form/Form";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import type Control from "sap/ui/mdc/Control";
import type ObjectPageLayout from "sap/uxap/ObjectPageLayout";
import type AppComponent from "../AppComponent";
import CommonUtils from "../CommonUtils";

@defineUI5Class("sap.fe.core.controls.HideFormGroupAutomatically")
class HideFormGroupAutomatically extends EventDelegateHook {
	appComponent: AppComponent | null = null;

	onBeforeRendering(): void {
		this.appComponent = CommonUtils.getAppComponent(this.getParent() as Control);

		this.hideSubsectionsFormContainer();
		this.hideHeaderContainer();
	}

	/**
	 * Checks whether all the form elements are hidden, and then hides the form container.
	 */
	private hideSubsectionsFormContainer(): void {
		const parent = this?.getParent();
		if (parent?.isA<Form>("sap.ui.layout.form.Form")) {
			const formContainers = parent?.getFormContainers();
			this.hideFormContainers(formContainers);
		}
	}

	/**
	 * Checks whether all the form elements within an editable header are hidden, and then hides the form container.
	 */
	private hideHeaderContainer(): void {
		const op = this.fetchObjectPage();
		/**
		 * Get the sections of the object page
		 */
		const sections = op?.getSections?.() as Section[];

		if (!Array.isArray(sections)) {
			return;
		}

		for (const section of sections) {
			/**
			 * Navigate through the subsections within the sections.
			 */
			const subSections = section?.getSubSections();

			for (const subSection of subSections) {
				/**
				 * Get the subsection blocks.
				 */
				const subSectionBlocks = subSection?.getBlocks() as SubSectionBlock[];
				/**
				 * Checks if there is a form inside the block.
				 */
				const isEditableHeader = subSectionBlocks?.some((headerBlock) => headerBlock.isA<Form>("sap.ui.layout.form.Form"));

				if (!Array.isArray(subSectionBlocks) || !isEditableHeader) {
					continue;
				}

				for (const subSectionBlock of subSectionBlocks) {
					/**
					 * Get the form containers within the subsection.
					 */
					if (subSectionBlock.isA<Form>("sap.ui.layout.form.Form")) {
						const formContainers = subSectionBlock?.getFormContainers?.();
						if (Array.isArray(formContainers)) {
							this.hideFormContainers(formContainers);
						}
					}
				}
			}
		}
	}

	private hideFormContainers(formContainers: FormContainer[]): void {
		if (!Array.isArray(formContainers)) return;

		for (const formContainer of formContainers) {
			const formElements = formContainer?.getFormElements();
			const isThereAnyVisibleItem = formElements?.some((fe) => fe?.getVisible());
			const isUsingPartOfPreviewAnnotation = formElements.some((formElement) => {
				const bindingInfo = formElement?.getBindingInfo?.("visible");
				if (Array.isArray(bindingInfo?.parts))
					return bindingInfo.parts.some((bindingInfoPart: { path: string }) => bindingInfoPart.path === "showDetails");
				return false;
			});

			/**
			 * This condition ignores the form container when a new group is created using the Adapt UI.
			 * If the group is empty, we should not hide it, as it is required to be there to add additional form elements.
			 * If the form container itself is marked as UI.Hidden, then we should not hide it.
			 */
			if (
				(this.appComponent?.isAdaptationMode() === true && formElements?.length === 0) ||
				isUsingPartOfPreviewAnnotation ||
				formContainer.data("UiHiddenPresent") === "true"
			) {
				continue;
			}

			/**
			 * Since this function is called every time there's a change in the form, we need to consider two scenarios.
			 * First, if the form container is hidden, we must determine whether it should be shown again.
			 * Second, if the form container is currently displayed, we need to assess whether it should be hidden.
			 */
			if (isThereAnyVisibleItem === false) {
				formContainer.setVisible(false);
			} else if (!formContainer.getVisible()) {
				formContainer.setVisible(true);
			}
		}
	}

	private fetchObjectPage(): ObjectPageLayout | null {
		let parent = this.getParent();

		while (!(parent?.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout") ?? false) && typeof parent?.getParent === "function") {
			parent = parent.getParent();
		}

		return parent?.isA<ObjectPageLayout>("sap.uxap.ObjectPageLayout") === true ? (parent as ObjectPageLayout) : null;
	}
}

export default HideFormGroupAutomatically;
