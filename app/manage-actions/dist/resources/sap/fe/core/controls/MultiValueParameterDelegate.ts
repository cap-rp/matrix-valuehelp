import type MultiValueField from "sap/ui/mdc/MultiValueField";
import type { ConditionObject } from "sap/ui/mdc/condition/Condition";
// This is a special case as it only will happen when using the action parameter dialog so at a point where the MDC library will have been loaded anyway
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import MultiValueFieldDelegate from "sap/ui/mdc/field/MultiValueFieldDelegate";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";

const oMultiValueFieldDelegate = Object.assign({}, MultiValueFieldDelegate, {
	_transformConditions: function (aConditions: ConditionObject[], sKeyPath: string, sDescriptionPath: string) {
		const aTransformedItems = [];
		for (const condition of aConditions) {
			const oItem: Record<string, unknown> = {};
			oItem[sKeyPath] = condition.values[0];
			if (sDescriptionPath) {
				oItem[sDescriptionPath] = condition.values[1];
			}
			aTransformedItems.push(oItem);
		}
		return aTransformedItems;
	},
	updateItems: function (oPayload: unknown, aConditions: ConditionObject[], oMultiValueField: MultiValueField) {
		const oListBinding = oMultiValueField.getBinding("items") as ODataListBinding;
		const oBindingInfo = oMultiValueField.getBindingInfo("items");
		const sItemPath = oBindingInfo.path;
		const oTemplate = oBindingInfo.template;
		const oKeyBindingInfo = oTemplate.getBindingInfo("key");
		const sKeyPath = oKeyBindingInfo && oKeyBindingInfo.parts[0].path;
		const oDescriptionBindingInfo = oTemplate.getBindingInfo("description");
		const sDescriptionPath = oDescriptionBindingInfo && oDescriptionBindingInfo.parts[0].path;
		const oModel = oListBinding.getModel();

		oModel.setProperty(sItemPath, this._transformConditions(aConditions, sKeyPath, sDescriptionPath));
	}
});

export default oMultiValueFieldDelegate;
