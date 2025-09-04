import type { RouteTarget } from "sap/ui/core/Manifest";

/**
 * Map a route's target property - from "sap.ui5/routing/routes/[]/target" - to a list of target names.
 * @example
 * getRouteTargetNames("myTarget");
 * // ["myTarget"]
 *
 * getRouteTargetNames(["myTarget1", "myTarget2"]);
 * // ["myTarget1", "myTarget2"]
 *
 * getRouteTargetNames(["myTarget1", { name: "myTarget2" }]);
 * // ["myTarget1", "myTarget2"]
 * @see ManifestContentUI5
 * @param target The route's "target" property value
 * @returns The target names
 */
export function getRouteTargetNames(target: RouteTarget | RouteTarget[]): string[] {
	return (Array.isArray(target) ? target : [target]).map(getRouteTargetName);
}

/**
 * Map one route target to the target name.
 * @example
 * getRouteTargetName("myTarget");
 * // "myTarget"
 *
 * getRouteTargetName({ name: "myTarget" });
 * // "myTarget"
 * @param target A route target manifest configuration entry
 * @returns The target name
 */
export function getRouteTargetName(target: RouteTarget): string {
	return typeof target === "object" ? target.name : target;
}
