import { defineUI5Class, implementInterface, property } from "sap/fe/base/ClassSupport";
import type ISingleSectionContributor from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type { ProviderData } from "sap/fe/macros/controls/section/ISingleSectionContributor";
import type OverflowToolbar from "sap/m/OverflowToolbar";
import MTitle from "sap/m/Title";
import type Control from "sap/ui/core/Control";
import type Title from "sap/ui/core/Title";
import type Form from "sap/ui/layout/form/Form";
import type FormContainer from "sap/ui/layout/form/FormContainer";
import MacroAPI from "../MacroAPI";
import FormContainerAPI from "./FormContainerAPI";

@defineUI5Class("sap.fe.macros.form.FormAPI")
class FormAPI extends MacroAPI implements ISingleSectionContributor {
	@implementInterface("sap.fe.macros.controls.section.ISingleSectionContributor")
	__implements__sap_fe_macros_controls_section_ISingleSectionContributor = true;

	getSectionContentRole(): "provider" | "consumer" {
		return "provider";
	}

	/**
	 * Implementation of the getDataFromProvider method which is a part of the ISingleSectionContributor
	 *
	 * Will be called from the sap.fe.macros.controls.Section control when there is a Form building block rendered within a section
	 * and the form's title would be provided to the Section and accordingly adjusted here.
	 *
	 */

	getDataFromProvider(useSingleTextAreaFieldAsNotes: boolean): ProviderData {
		const formContent = this.content as Form;
		const formContainers = formContent.getFormContainers();
		if (useSingleTextAreaFieldAsNotes && formContainers.length) {
			formContainers.forEach((formContainer: FormContainer) => {
				FormContainerAPI.setTextAreaLabelVisibility(formContainer);
			});
		}
		// if the form's content directly has a title
		let formTitle = "";
		if (formContainers.length === 1) {
			const formContentTitle = (formContent.getTitle() as Title)?.getText();
			if (formContentTitle) {
				formTitle = formContentTitle;
				formContent.setTitle("");
				return {
					title: formTitle
				};
			}

			const formContainerTitle = (formContainers[0]?.getTitle() as Title)?.getText();
			//if the title from the formContainer needs to be fetched
			if (formContainerTitle && formContainerTitle !== "") {
				formTitle = formContainerTitle;
			}

			// if the title needs to be fetched from the toolbar aggregation's content of form container
			let formActionToolbarTitleControl;
			(formContainers[0].getAggregation("toolbar") as OverflowToolbar)?.getContent().forEach(function (innerControl: Control) {
				if (innerControl.isA<MTitle>("sap.m.Title")) {
					formActionToolbarTitleControl = innerControl;
					const formActionToolbarTitle = innerControl.getText();
					if (formActionToolbarTitle && formActionToolbarTitle != "") {
						formTitle = innerControl.getText();
					}
				}
			});

			if (formTitle && formTitle !== "") {
				formContainers[0]?.setTitle("");
				//this is needed to handle cases where title is present for both formContainer and the form action toolbar, but the title rendered on the UI is the one coming from one of those
				(formActionToolbarTitleControl as unknown as MTitle)?.setTitle(new MTitle(""));
				return {
					title: formTitle
				};
			}
		}
		return {
			title: formTitle
		};
	}

	/**
	 * The identifier of the form control.
	 * @public
	 */
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the relative path of the property in the metamodel, based on the current contextPath.
	 * @public
	 */
	@property({
		type: "string",
		expectedAnnotations: [
			"@com.sap.vocabularies.UI.v1.FieldGroup",
			"@com.sap.vocabularies.UI.v1.CollectionFacet",
			"@com.sap.vocabularies.UI.v1.ReferenceFacet"
		],
		expectedTypes: ["EntitySet", "EntityType", "Singleton", "NavigationProperty"]
	})
	metaPath!: string;

	/**
	 * The title of the form control.
	 * @public
	 */
	@property({ type: "string" })
	title!: string;
}

export default FormAPI;
