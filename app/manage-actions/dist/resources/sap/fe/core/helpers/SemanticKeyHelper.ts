import type { PropertyPath } from "@sap-ux/vocabularies-types";
import type { SemanticObject } from "@sap-ux/vocabularies-types/vocabularies/Common";
import Log from "sap/base/Log";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type { ExpandPathType, MetaModelType } from "types/metamodel_types";

type SemanticObjectInformation = {
	semanticObject?: MetaModelType<SemanticObject>;
	semanticKeys?: ExpandPathType<PropertyPath>[];
};
const SemanticKeyHelper = {
	getSemanticKeys: function (oMetaModel: ODataMetaModel, sEntitySetName: string): ExpandPathType<PropertyPath>[] | undefined {
		return oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticKey`);
	},
	getSemanticObjectInformation: function (oMetaModel: ODataMetaModel, sEntitySetName: string): SemanticObjectInformation {
		const oSemanticObject = oMetaModel.getObject(`/${sEntitySetName}/@com.sap.vocabularies.Common.v1.SemanticObject`) as
			| MetaModelType<SemanticObject>
			| undefined;
		const aSemanticKeys = this.getSemanticKeys(oMetaModel, sEntitySetName);
		return {
			semanticObject: oSemanticObject,
			semanticKeys: aSemanticKeys
		};
	},
	/**
	 * Returns a stringified version of a list of key values, e.g. [{name:"aa", value:1}, {name:"bb", value:"foo"}] --> "aa=1,bb='foo'".
	 * @param valuePairs
	 * @param typeMetadata
	 * @returns String
	 */
	getPathContent(valuePairs: { name: string; value: unknown }[], typeMetadata: Record<string, { $Type: string }>): string {
		const singleKey = valuePairs.length === 1;
		return valuePairs
			.map((valuePair) => {
				const keyValue = valuePair.value;
				const encodedKeyValue =
					typeMetadata[valuePair.name].$Type === "Edm.String" ? `'${encodeURIComponent(keyValue as string)}'` : keyValue;
				return singleKey ? encodedKeyValue : `${valuePair.name}=${encodedKeyValue}`;
			})
			.join(",");
	},
	getSemanticPath: function (oContext: ODataV4Context, bStrict = false): string | undefined {
		const oMetaModel = oContext.getModel().getMetaModel(),
			sEntitySetName = oMetaModel.getMetaContext(oContext.getPath()).getObject("@sapui.name"),
			oSemanticObjectInformation = this.getSemanticObjectInformation(oMetaModel, sEntitySetName);
		let sTechnicalPath, sSemanticPath;

		if (oContext.isA<ODataListBinding>("sap.ui.model.odata.v4.ODataListBinding") && oContext.isRelative()) {
			sTechnicalPath = oContext.getHeaderContext()!.getPath();
		} else {
			sTechnicalPath = oContext.getPath();
		}

		if (
			this._isPathForSemantic(sTechnicalPath) &&
			oSemanticObjectInformation.semanticKeys &&
			oSemanticObjectInformation.semanticKeys.length !== 0
		) {
			const aSemanticKeys = oSemanticObjectInformation.semanticKeys;
			const oEntityType = oMetaModel.getObject("/" + oMetaModel.getObject(`/${sEntitySetName}`).$Type);

			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const keyValues = aSemanticKeys.map((semanticKey) => {
					const keyName = semanticKey.$PropertyPath;
					const keyValue = oContext.getProperty(keyName);
					if (keyValue === undefined || keyValue === null) {
						throw new Error(`Couldn't resolve semantic key value for ${keyName}`);
					}
					return { name: keyName, value: keyValue };
				});
				const semanticKeysPart = this.getPathContent(keyValues, oEntityType);

				sSemanticPath = `/${sEntitySetName}(${semanticKeysPart})`;
			} catch (e) {
				Log.info(e as string);
			}
		}

		return bStrict ? sSemanticPath : sSemanticPath || sTechnicalPath;
	},

	// ==============================
	// INTERNAL METHODS
	// ==============================

	_isPathForSemantic: function (sPath: string): boolean {
		// Only path on root objects allow semantic keys, i.e. sPath = xxx(yyy)
		return /^[^()]+\([^()]+\)$/.test(sPath);
	}
};

export default SemanticKeyHelper;
