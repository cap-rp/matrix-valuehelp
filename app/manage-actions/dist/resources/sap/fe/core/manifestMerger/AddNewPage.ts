import Log from "sap/base/Log";
import ObjectPath from "sap/base/util/ObjectPath";

export type Change = {
	getContent(): ChangeContent;
};

type ChangeContent = {
	sourcePage: {
		id: string;
		navigationSource: string;
	};
	targetPage: {
		id: string;
		type: string;
		name: string;
		routePattern: string;
		settings: object;
	};
};

type navigation = {
	navigation: Record<string, { detail: { route: string } }>;
};

type RoutingConfiguration = {
	routes?: Array<{
		pattern: string;
		name: string;
		target: string;
	}>;
	targets?: Record<
		string,
		{
			type: string;
			name: string;
			options: {
				settings: navigation;
			};
			id: string;
		}
	>;
};

type ManifestContent = {
	"sap.ui5": {
		routing?: RoutingConfiguration;
	};
};

/**
 * Apply change method.
 *
 * This method is called by the FLEX framework in case a manifest change with the change type
 * to add a new page was created for the current application. This method is not meant to be
 * called by anyone other than by the FLEX framework.
 * @param manifest The original manifest settings.
 * @param change The change content from FLEX.
 * @returns The changed or unchanged manifest.
 */
export function applyChange(manifest: ManifestContent, change: Change): ManifestContent {
	const changeContent = change.getContent();
	const sourcePage = changeContent?.sourcePage;
	const targetPage = changeContent?.targetPage;

	// return unmodified manifest in case change not valid
	if (!sourcePage?.id || !targetPage?.id) {
		Log.error("Change content is not valid, missing source or target page ID.");
		return manifest;
	}
	return changeConfiguration(manifest, sourcePage, targetPage);
}

/**
 * Adds a new object page to the manifest.
 *
 * This method enables you to add a new object page to the SAP Fiori elements application.
 * @param manifest The original manifest settings.
 * @param sourcePage The source page details for the change.
 * @param targetPage The target page details from the change.
 * @returns The changed or unchanged manifest.
 */
function changeConfiguration(
	manifest: ManifestContent,
	sourcePage: ChangeContent["sourcePage"],
	targetPage: ChangeContent["targetPage"]
): ManifestContent {
	// Validate the change content
	if (!validateChange(manifest, sourcePage, targetPage)) {
		return manifest;
	}
	// Find the targets section in the manifest
	const targets = manifest["sap.ui5"]?.routing?.targets ?? {};
	// Add the new target page to the targets
	targets[targetPage.id] = {
		type: targetPage.type,
		name: targetPage.name,
		options: {
			settings: targetPage.settings as navigation
		},
		id: targetPage.id
	};
	// Find the routes section in the manifest
	const routes = manifest["sap.ui5"]?.routing?.routes ?? [];
	// Add the new route associated with the target page
	routes.push({
		pattern: targetPage.routePattern,
		name: targetPage.id,
		target: targetPage.id
	});
	//Add the navigation in the source page to the target page
	const sourcePageTarget = targets[sourcePage.id];
	const sourcePageNavigation = sourcePageTarget.options?.settings?.navigation ?? {};
	sourcePageTarget.options.settings.navigation = {
		...sourcePageNavigation,
		[sourcePage.navigationSource]: {
			detail: {
				route: targetPage.id
			}
		}
	};

	// Update the manifest with the new routes and targets
	ObjectPath.set(["sap.ui5", "routing", "targets"], targets, manifest);
	ObjectPath.set(["sap.ui5", "routing", "routes"], routes, manifest);

	return manifest;
}

/**
 * Validate the change content.
 *
 * This method ensures that the change content is valid by performing various checks.
 * @param manifest The original manifest settings.
 * @param sourcePage The source page details from the FLEX change.
 * @param targetPage The target page details from the FLEX change.
 * @returns True if the change is valid, otherwise false.
 */
function validateChange(
	manifest: ManifestContent,
	sourcePage: ChangeContent["sourcePage"],
	targetPage: ChangeContent["targetPage"]
): boolean {
	const targets = manifest["sap.ui5"]?.routing?.targets ?? {};
	// Check if target or route ID already exists in the manifest targets object
	if (targets[targetPage.id]) {
		Log.error("Target page or route Id already exists in the manifest please check the target page Id in the manifest.");
		return false;
	}
	// Check if the source page is defined in the routes but does not exist in the targets object
	if (!targets[sourcePage.id]) {
		Log.error("Source page does not exist in the manifest targets please check the source page Id in the manifest.");
		return false;
	}
	// check if the source page is a fe application
	if (!targets[sourcePage.id].name.startsWith("sap.fe")) {
		Log.error("Source page is not a Fiori elements application please check the source page name in the manifest.");
		return false;
	}
	// Check if the source page does not already have target navigation
	if (
		targets[sourcePage.id].options.settings.navigation &&
		targets[sourcePage.id].options.settings.navigation[sourcePage.navigationSource]
	) {
		Log.error("Source page already has target navigation please check the source page navigation in the manifest.");
		return false;
	}
	// Check if the source page exists in the manifest routes
	const routes = manifest["sap.ui5"]?.routing?.routes ?? [];
	const sourcePageExists = routes.some((route: { name: string }) => route.name === sourcePage.id);
	if (!sourcePageExists) {
		Log.error("Source page does not exist in the manifest routes please check the source page name in the manifest.");
		return false;
	}
	return true;
}
