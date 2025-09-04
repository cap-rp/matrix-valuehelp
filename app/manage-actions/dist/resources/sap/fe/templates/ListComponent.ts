import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import TemplateComponent from "sap/fe/core/TemplateComponent";
import type { ListReportDefinition } from "sap/fe/core/converters/templates/ListReportConverter";
import CoreLibrary from "sap/fe/core/library";
import type { FinalPageDefinition } from "sap/fe/templates/ListReport/ExtendPageDefinition";
import { extendListReportPageDefinition } from "sap/fe/templates/ListReport/ExtendPageDefinition";
const VariantManagement = CoreLibrary.VariantManagement,
	InitialLoadMode = CoreLibrary.InitialLoadMode;

@defineUI5Class("sap.fe.templates.ListComponent", {
	manifest: {
		"sap.ui": {
			technology: "UI5",
			deviceTypes: {
				desktop: true,
				tablet: true,
				phone: true
			},
			supportedThemes: ["sap_fiori_3", "sap_hcb", "sap_bluecrystal", "sap_belize", "sap_belize_plus", "sap_belize_hcw"]
		},
		"sap.app": {
			i18n: "messagebundle.properties"
		},
		"sap.ui5": {
			services: {
				templatedViewService: {
					factoryName: "sap.fe.core.services.TemplatedViewService",
					startup: "waitFor",
					settings: {
						viewName: "sap.fe.templates.ListReport.ListReport",
						converterType: "ListReport",
						errorViewName: "sap.fe.core.services.view.TemplatingErrorPage"
					}
				},
				asyncComponentService: {
					factoryName: "sap.fe.core.services.AsyncComponentService",
					startup: "waitFor"
				}
			},
			commands: {
				Create: {
					name: "Create",
					shortcut: "Ctrl+Enter",
					description: "{{CREATE_OBJECT_SHORTCUT_DESCRIPTION}}"
				},
				DeleteEntry: {
					name: "DeleteEntry",
					shortcut: "Ctrl+D",
					description: "{{DELETE_OBJECT_SHORTCUT_DESCRIPTION}}"
				},
				Share: {
					name: "Share",
					shortcut: "Shift+Ctrl+S",
					description: "{{SHARE_SHORTCUT_DESCRIPTION}}"
				},
				FE_FilterSearch: {
					name: "FE_FilterSearch",
					shortcut: "Ctrl+Enter",
					description: "{{FILTER_SEARCH_SHORTCUT_DESCRIPTION}}"
				},
				Cut: {
					name: "Cut",
					shortcut: "Ctrl+X",
					description: "{{CUT_SHORTCUT_DESCRIPTION}}"
				},
				Copy: {
					name: "Copy",
					shortcut: "Ctrl+C"
				},
				Paste: {
					name: "Paste",
					shortcut: "Ctrl+V",
					description: "{{PASTE_SHORTCUT_DESCRIPTION}}"
				},
				TableMoveElementUp: {
					name: "TableMoveElementUp",
					shortcut: "Ctrl+Alt+ArrowUp",
					description: "{{TABLE_MOVE_ELEMENT_UP_DESCRIPTION}}"
				},
				TableMoveElementDown: {
					name: "TableMoveElementDown",
					shortcut: "Ctrl+Alt+ArrowDown",
					description: "{{TABLE_MOVE_ELEMENT_DOWN_DESCRIPTION}}"
				}
			},
			handleValidation: true,
			dependencies: {
				minUI5Version: "${sap.ui5.core.version}",
				libs: {
					"sap.f": {},
					"sap.fe.macros": {
						lazy: true
					},
					"sap.m": {},
					"sap.suite.ui.microchart": {
						lazy: true
					},
					"sap.ui.core": {},
					"sap.ui.layout": {},
					"sap.ui.mdc": {},
					"sap.ushell": {
						lazy: true
					},
					"sap.ui.fl": {}
				}
			},
			contentDensities: {
				compact: true,
				cozy: true
			}
		}
	},
	library: "sap.fe.templates"
})
class ListBasedComponent extends TemplateComponent {
	@property({
		type: "sap.fe.core.InitialLoadMode",
		defaultValue: InitialLoadMode.Auto
	})
	initialLoad!: typeof InitialLoadMode;

	@property({
		type: "sap.fe.core.VariantManagement",
		defaultValue: VariantManagement.Page
	})
	variantManagement!: typeof VariantManagement;

	@property({
		type: "string",
		defaultValue: undefined
	})
	defaultTemplateAnnotationPath!: string;

	@property({
		type: "boolean",
		defaultValue: false
	})
	liveMode!: boolean;

	extendPageDefinition(pageDefinition: ListReportDefinition): FinalPageDefinition {
		return extendListReportPageDefinition(pageDefinition);
	}
}

export default ListBasedComponent;
