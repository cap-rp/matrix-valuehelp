import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";
import type AppComponent from "sap/fe/core/AppComponent";
import type { ViewData } from "sap/fe/core/services/TemplatedViewServiceFactory";
import type { ManifestContent } from "sap/ui/core/Manifest";

export type Change = {
	getContent(): ChangeContent;
};

type ChangeContent = {
	page: string; // ID of the page to be changed
	entityPropertyChange: EntityPropertyChange;
};

type EntityPropertyChange = {
	propertyPath: string; // path to the property to be changed
	operation: string; // only UPSERT supported
	propertyValue: string | Object; //what to be changed
};

/**
 * Apply change method.
 *
 * This method is being called by the FLEX framework in case a manifest change with the change type
 * 'appdescr_fe_changePageConfiguration' was created for the current application. This method is not meant to be
 * called by anyone else but the FLEX framework.
 * @param manifest The original manifest.
 * @param change The change content.
 * @returns The changed or unchanged manifest.
 */
export function applyChange(manifest: ManifestContent, change: Change): object {
	const changeContent = change.getContent();
	const pageId = changeContent?.page;
	const propertyChange = changeContent?.entityPropertyChange;

	// return unmodified manifest in case change not valid
	if (
		propertyChange?.operation !== "UPSERT" ||
		!propertyChange?.propertyPath ||
		propertyChange?.propertyValue === undefined ||
		propertyChange?.propertyPath.startsWith("/")
	) {
		Log.error("Change content is not a valid");
		return manifest;
	}

	return changeConfiguration(manifest, pageId, propertyChange.propertyPath, propertyChange.propertyValue);
}

/**
 * Changes the page configuration of SAP Fiori elements.
 *
 * This method enables you to change the page configuration of SAP Fiori elements.
 * @param manifest The original manifest.
 * @param pageId The ID of the page for which the configuration is to be changed.
 * @param path The path in the page settings for which the configuration is to be changed.
 * @param value The new value of the configuration. This could be a plain value like a string, or a Boolean, or a structured object.
 * @param lateChange Indicates that the change was done after application startup (for example when using the feature toggle).
 * @param appComponent The appComponent, in case the change is done after application startup.
 * @returns The changed or unchanged manifest.
 */
export function changeConfiguration(
	manifest: ManifestContent,
	pageId: string,
	path: string,
	value: unknown,
	lateChange?: boolean,
	appComponent?: AppComponent
): object {
	const pageSAPfe = "sap.fe";
	let propertyPath: string[] = retrievePropertyPath(path);
	let pageSettings;
	if (pageId === pageSAPfe) {
		propertyPath = [pageSAPfe, ...propertyPath];
		pageSettings = manifest;
	} else {
		pageSettings = getPageSettings(manifest, pageId);
	}

	if (pageSettings) {
		manageSpecificFormat(propertyPath, pageSettings);
		ObjectPath.set(propertyPath, value, pageSettings);
		if (lateChange && appComponent) {
			appComponent.pageConfigurationChanges[pageId] = appComponent.pageConfigurationChanges[pageId] || [];
			appComponent.pageConfigurationChanges[pageId].push(path);
		}
	} else {
		Log.error(`No Fiori elements page with ID ${pageId} found in routing targets.`);
	}

	return manifest;
}
/**
 * Manages specific formats in the property path.
 * On some specific cases, the ancestor of the property is not an object (boolean, etc.)
 * This ancestor is changed to an object to accept children.
 * @param propertyPath The path to the property related to a change
 * @param pageSettings The page settings in the manifest
 */
function manageSpecificFormat(propertyPath: string[], pageSettings: object): void {
	if (propertyPath.length > 1) {
		for (let i = 0; i < propertyPath.length - 1; i++) {
			if (typeof ObjectPath.get(propertyPath.slice(0, i + 1), pageSettings) !== "object") {
				ObjectPath.set(propertyPath.slice(0, i + 1), {}, pageSettings);
			}
		}
	}
}

/**
 * Retrieves an array with the property path parts and consider the controlConfiguration specially.
 * @param path The given property path
 * @returns An array with the property path parts.
 */
function retrievePropertyPath(path: string): string[] {
	let propertyPath = path.split("/");
	if (propertyPath[0] === "controlConfiguration") {
		let annotationPath = "";
		// the annotation path in the control configuration has to stay together. For now rely on the fact the @ is in the last part
		for (let i = 1; i < propertyPath.length; i++) {
			annotationPath += (i > 1 ? "/" : "") + propertyPath[i];
			if (annotationPath.includes("@")) {
				propertyPath = ["controlConfiguration", annotationPath].concat(propertyPath.slice(i + 1));
				break;
			}
		}
	}
	return propertyPath;
}

/**
 * Search the page settings in the manifest for a given page ID.
 * @param manifest The manifest where the search is carried out to find the page settings.
 * @param pageId The ID of the page.
 * @returns The page settings for the page ID or undefined if not found.
 */
function getPageSettings(manifest: ManifestContent, pageId: string): object | undefined {
	let pageSettings;
	const targets = manifest["sap.ui5"]?.routing?.targets ?? {};
	for (const p in targets) {
		if (targets[p].id === pageId && targets[p].name.startsWith("sap.fe.")) {
			pageSettings = targets[p].options?.settings ?? {};
			break;
		}
	}
	return pageSettings;
}

/**
 * Applies page configuration changes to view data object.
 *
 * UI5 routing clones the manifest settings during the app init, even before the router was initialized.
 * As we allow changing the manifest in the async initializeFeatureToggle hook, the view data might not fit the current
 * manifest settings, therefore (re)applying the registered page configuration changes to the view data object.
 * @param manifest The current page manifest settings.
 * @param viewData The current viewData settings.
 * @param appComponent The app component instance.
 * @param pageId The ID of the page.
 * @returns The updated viewData settings.
 */
export function applyPageConfigurationChanges(manifest: object, viewData: ViewData, appComponent: AppComponent, pageId: string): ViewData {
	viewData = viewData ?? {};
	const pageChanges: string[] = appComponent.pageConfigurationChanges[pageId] || [];
	for (const path of pageChanges) {
		const propertyPath = retrievePropertyPath(path);
		const manifestValue = ObjectPath.get(propertyPath, manifest);
		ObjectPath.set(propertyPath, manifestValue, viewData);
	}
	return viewData;
}
