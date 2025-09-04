import BindingParser from "sap/ui/base/BindingParser";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

function getObject(oObject: Record<string, unknown>, sPath: string): unknown {
	if (!oObject) {
		return null;
	}
	const sPathSplit = sPath.split("/");
	if (sPathSplit.length === 1) {
		return oObject[sPath];
	} else {
		return getObject(oObject[sPathSplit[0]] as Record<string, unknown>, sPathSplit.splice(1).join("/"));
	}
}
/**
 * Resolve a dynamic annotation path down to a standard annotation path.
 * @param sAnnotationPath
 * @param oMetaModel
 * @returns The non dynamic version of the annotation path
 */
export function resolveDynamicExpression(sAnnotationPath: string, oMetaModel: ODataMetaModel): string {
	if (sAnnotationPath.includes("[")) {
		const firstBracket = sAnnotationPath.indexOf("[");
		const sStableBracket = sAnnotationPath.substring(0, firstBracket);
		const sRest = sAnnotationPath.substring(firstBracket + 1);
		const lastBracket = sRest.indexOf("]");
		const aValue = oMetaModel.getObject(sStableBracket);
		const oExpression = BindingParser.parseExpression(sRest.substring(0, lastBracket));
		if (
			Array.isArray(aValue) &&
			oExpression &&
			oExpression.result &&
			oExpression.result.parts &&
			oExpression.result.parts[0] &&
			oExpression.result.parts[0].path
		) {
			let i;
			let bFound = false;
			for (i = 0; i < aValue.length && !bFound; i++) {
				const oObjectValue = getObject(aValue[i], oExpression.result.parts[0].path);
				const bResult = oExpression.result.formatter(oObjectValue);
				if (bResult) {
					bFound = true;
				}
			}
			if (bFound) {
				sAnnotationPath = resolveDynamicExpression(sStableBracket + (i - 1) + sRest.substring(lastBracket + 1), oMetaModel);
			}
		}
	}
	return sAnnotationPath;
}
