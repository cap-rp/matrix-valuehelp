import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import type AppComponent from "sap/fe/core/AppComponent";
import TemplateComponent from "sap/fe/core/TemplateComponent";
import type Control from "sap/ui/core/Control";
import type { $UIComponentSettings } from "sap/ui/core/UIComponent";

/**
 * Component that can be used as a wrapper component for custom pages.
 *
 * The component can be used in case you want to use SAP Fiori elements Building Blocks or XML template
 * constructions. You can either extend the component and set the viewName and contextPath within your code
 * or you can use it to wrap your custom XML view directly the manifest when you define your custom page
 * under sapui5/routing/targets:
 *
 * <pre>
 * "myCustomPage": {
 *	 "type": "Component",
 *	 "id": "myCustomPage",
 *	 "name": "sap.fe.core.fpm",
 *	 "title": "My Custom Page",
 *	 "options": {
 *		"settings": {
 *			"viewName": "myNamespace.myView",
 *			"contextPath": "/MyEntitySet"
 *		}
 *	 }
 *  }
 * </pre>
 * @public
 * @experimental As of version 1.92.0
 * @since 1.92.0
 */
@defineUI5Class("sap.fe.core.fpm.Component", { manifest: "json" })
class FPMComponent extends TemplateComponent {
	/**
	 * Name of the XML view which is used for this page. The XML view can contain SAP Fiori elements Building Blocks and XML template constructions.
	 * @public
	 */
	@property({ type: "string" })
	viewName!: string;

	@property({ type: "string" })
	controllerName?: string;

	@property({ type: "string" })
	_jsxViewName = "";

	@property({ type: "any" })
	viewContent?: Control | Function;

	constructor(mSettings: PropertiesOf<FPMComponent> & Record<string, unknown>) {
		if (mSettings.viewType === "JSX") {
			mSettings._jsxViewName = mSettings.viewName;
			mSettings.viewName = "module:sap/fe/base/jsx-runtime/ViewLoader";
			// Remove the cache property from the settings as it is not supported by the ViewLoader
			delete mSettings.cache;
		}
		super(mSettings as $UIComponentSettings);
	}

	/**
	 * Returns the current AppComponent.
	 * @returns The current AppComponent
	 * @public
	 */
	getAppComponent(): AppComponent {
		return this.oAppComponent;
	}
}

export default FPMComponent;
