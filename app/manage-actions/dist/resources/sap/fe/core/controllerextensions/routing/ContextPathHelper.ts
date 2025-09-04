import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import ModelHelper from "sap/fe/core/helpers/ModelHelper";
import SemanticKeyHelper from "sap/fe/core/helpers/SemanticKeyHelper";
import type { RoutingService } from "sap/fe/core/services/RoutingServiceFactory";
import type Router from "sap/ui/core/routing/Router";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

/**
 * Checks if a path refers to a draft root path.
 * @param path The path to test
 * @param metaModel The associated metadata model
 * @returns `true` if the path is a draft root path
 */
export function isPathOnDraftRoot(path: string, metaModel: ODataMetaModel): boolean {
	// Check if the path follows the pattern '/aaa(bbb)'
	const matches = /^[/]?(\w+)\([^/]+\)$/.exec(path);
	if (!matches) {
		return false;
	}

	// Check if the entity set supports draft
	const entitySetPath = `/${matches[1]}`;
	return metaModel.getObject(`${entitySetPath}@com.sap.vocabularies.Common.v1.DraftRoot`) ? true : false;
}

/**
 * Creates the filter to retrieve the draft or active instance from a path.
 * @param path The semantic or technical path
 * @param keys The semantic or technical keys for the path
 * @param metaModel The instance of the metamodel
 * @returns The filter
 */
export function createFilterFromPath(path: string, keys: string[], metaModel: ODataMetaModel): Filter | null {
	const unquoteAndDecode = function (value: string): string {
		if (value.indexOf("'") === 0 && value.lastIndexOf("'") === value.length - 1) {
			// Remove the quotes from the value and decode special chars
			value = decodeURIComponent(value.substring(1, value.length - 1));
		}
		return value;
	};
	const keyValues = path.substring(path.indexOf("(") + 1, path.length - 1).split(",");

	let finalKeys = keys;
	let finalKeyValues = keyValues;
	// If we have technical keys, IsActiveEntity will be present. We need to remove it as we're already adding them at the end.
	if (keys.includes("IsActiveEntity")) {
		finalKeys = keys.filter((singleKey) => !singleKey.includes("IsActiveEntity"));
		finalKeyValues = keyValues.filter((element) => !element.startsWith("IsActiveEntity"));
	}

	if (finalKeys.length != finalKeyValues.length) {
		return null;
	}

	const filteringCaseSensitive = ModelHelper.isFilteringCaseSensitive(metaModel);
	let filters: Filter[];
	if (finalKeys.length === 1) {
		// If this is a technical key, the equal is present because there's at least 2 parameters, a technical key and IsActiveEntity
		if (finalKeyValues[0].indexOf("=") > 0) {
			const keyPart = finalKeyValues[0].split("=");
			finalKeyValues[0] = keyPart[1];
		}
		// Take the first key value
		const keyValue = unquoteAndDecode(finalKeyValues[0]);
		filters = [
			new Filter({
				path: finalKeys[0],
				operator: FilterOperator.EQ,
				value1: keyValue,
				caseSensitive: filteringCaseSensitive
			})
		];
	} else {
		const mKeyValues: Record<string, unknown> = {};
		// Create a map of all key values
		finalKeyValues.forEach(function (sKeyAssignment: string) {
			const aParts = sKeyAssignment.split("="),
				keyValue = unquoteAndDecode(aParts[1]);

			mKeyValues[aParts[0]] = keyValue;
		});

		let failed = false;
		filters = finalKeys.map(function (semanticKey) {
			const key = semanticKey,
				value = mKeyValues[key];

			if (value !== undefined) {
				return new Filter({
					path: key,
					operator: FilterOperator.EQ,
					value1: value,
					caseSensitive: filteringCaseSensitive
				});
			} else {
				failed = true;
				return new Filter({
					path: "XX"
				}); // will be ignored anyway since we return after
			}
		});

		if (failed) {
			return null;
		}
	}

	// Add a draft filter to make sure we take the draft entity if there is one
	// Or the active entity otherwise
	const draftFilter = new Filter({
		filters: [new Filter("IsActiveEntity", "EQ", false), new Filter("SiblingEntity/IsActiveEntity", "EQ", null)],
		and: false
	});
	filters.push(draftFilter);

	return new Filter(filters, true);
}

/**
 * Loads a context from a list of keys (semantic or technical).
 * @param keys The keys
 * @param keyValues The key values in a string, e.g. /entity(aa=xx,bb=xx,...)
 * @param model
 * @returns The context (or null if none could be found)
 */
async function getContextFromKeys(keys: string[], keyValues: string, model: ODataModel): Promise<Context | null> {
	const metaModel = model.getMetaModel();
	if (!keys || keys.length === 0) {
		// No semantic/technical keys
		return null;
	}

	// Create a set of filters corresponding to all keys
	const filter = createFilterFromPath(keyValues, keys, metaModel);
	if (filter === null) {
		// Couldn't interpret the path as a semantic one
		return null;
	}

	// Retrieve the entity keys to add them in the $select query parameter
	const absolutePath = keyValues.startsWith("/") ? keyValues : `/${keyValues}`;
	const metaContext = metaModel.getMetaContext(absolutePath);
	const objectPath = getInvolvedDataModelObjects(metaContext);
	const technicalKeys = objectPath.targetEntityType.keys.map((property) => property.name);

	// Load the corresponding object
	const listBinding = model.bindList(metaContext.getPath(), undefined, undefined, filter, {
		$select: technicalKeys.join(","),
		$$groupId: "$auto.Heroes"
	});

	const contexts = await listBinding.requestContexts(0, 2);
	if (contexts.length) {
		return contexts[0];
	} else {
		// No data could be loaded
		return null;
	}
}

/**
 * Get the draft (if it exists) or the active context for a given draft-root context.
 * @param context
 * @returns The draft context if there's one, the active context otherwise
 */
export async function getDraftOrActiveContext(context: Context): Promise<Context | null> {
	const model = context.getModel();
	const metaModel = model.getMetaModel();
	const objectPath = getInvolvedDataModelObjects(metaModel.getMetaContext(context.getPath()));
	const keys = objectPath.targetEntityType.keys.map((property) => property.name);

	return getContextFromKeys(keys, context.getPath(), model);
}

/**
 * Transforms a patch (semantic or not) into a technical path.
 * @param pathToResolve The path (semantic or not)
 * @param model
 * @param routingService
 * @param router
 * @returns The technical path corresponding to the pathToResolve
 */
export async function resolvePath(
	pathToResolve: string,
	model: ODataModel,
	routingService: RoutingService,
	router: Router
): Promise<string> {
	const metaModel = model.getMetaModel();
	let currentHashNoParams = router.getHashChanger().getHash().split("?")[0];
	if (currentHashNoParams?.lastIndexOf("/") === currentHashNoParams?.length - 1) {
		// Remove trailing '/'
		currentHashNoParams = currentHashNoParams.substring(0, currentHashNoParams.length - 1);
	}

	// If the app is displaying a sub-OP (or below), then we just return the original path
	if (!isPathOnDraftRoot(currentHashNoParams, metaModel)) {
		return pathToResolve;
	}

	let rootEntityName = currentHashNoParams?.substring(0, currentHashNoParams.indexOf("("));
	if (rootEntityName[0] === "/") {
		rootEntityName = rootEntityName.substring(1);
	}

	const semanticKeys = SemanticKeyHelper.getSemanticKeys(metaModel, rootEntityName)?.map((key) => key.$PropertyPath);
	if (semanticKeys === undefined) {
		// If we don't have semantic keys, the path we have is technical and can be used as is.
		return pathToResolve;
	}

	const lastSemanticMapping = routingService.getLastSemanticMapping();

	if (lastSemanticMapping?.semanticPath === pathToResolve) {
		// This semantic path has been resolved previously
		return lastSemanticMapping.technicalPath;
	}

	// We need resolve the semantic path to get the technical keys
	const context = await getContextFromKeys(semanticKeys, currentHashNoParams, model);
	const technicalPath = context?.getPath();

	if (technicalPath && technicalPath !== pathToResolve) {
		// The semantic path was resolved (otherwise keep the original value for target)
		routingService.setLastSemanticMapping({
			technicalPath: technicalPath,
			semanticPath: pathToResolve
		});
		return technicalPath;
	}

	return pathToResolve;
}
