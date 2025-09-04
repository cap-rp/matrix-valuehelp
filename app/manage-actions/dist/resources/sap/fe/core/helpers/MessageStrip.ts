import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import CommonUtils from "sap/fe/core/CommonUtils";
import { getLocalizedText } from "sap/fe/core/helpers/ResourceModelHelper";
import type ResourceModel from "sap/fe/core/ResourceModel";
import type Control from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import Device from "sap/ui/Device";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";

function getLabels(aIgnoredFields: string[], sEntityTypePath: string, oFilterControl: Control, resourceModel: ResourceModel): string[] {
	const oMetaModel = (oFilterControl.getModel() as ODataModel).getMetaModel(),
		aIgnoredLabels = aIgnoredFields.map(function (sProperty) {
			if (sProperty === "$search") {
				return resourceModel.getText("M_FILTERBAR_SEARCH") || "";
			}
			if (sProperty === "$editState") {
				return resourceModel.getText("FILTERBAR_EDITING_STATUS") || "";
			}
			const sLabel = oMetaModel.getObject(`${sEntityTypePath}${sProperty}@com.sap.vocabularies.Common.v1.Label`) ?? sProperty;
			return getLocalizedText(sLabel, oFilterControl);
		});
	return aIgnoredLabels;
}
function getALPText(aIgnoredLabels: string[], oFilterBar: Control, bIsSearchIgnored: boolean): string {
	let sResourceKey = "";
	let aParameters: string[] = [];
	const oResourceBundle = _getResourceBundle();

	if (!oResourceBundle) {
		return "";
	}

	const view = CommonUtils.getTargetView(oFilterBar);
	const oChart = (view.getController() as { getChartControl?: Function }).getChartControl?.();
	const bIsDraftSupported = oChart?.data("draftSupported") === "true";
	const oMacroResourceBundle = Library.getResourceBundleFor("sap.fe.macros")!;
	bIsSearchIgnored = bIsSearchIgnored && aIgnoredLabels.includes(oMacroResourceBundle.getText("M_FILTERBAR_SEARCH"));
	const sDefaultResourceKey = `C_LR_MULTIVIZ_CHART_${_getArgumentSize(aIgnoredLabels)}_IGNORED_FILTER_${_getSizeText()}`;

	if (bIsDraftSupported && ((aIgnoredLabels.length === 2 && bIsSearchIgnored) || aIgnoredLabels.length === 1)) {
		sResourceKey =
			aIgnoredLabels.length === 1
				? "C_MULTIVIZ_CHART_IGNORED_FILTER_DRAFT_DATA"
				: "C_LR_MULTIVIZ_CHART_IGNORED_FILTER_DRAFT_DATA_AND_SEARCH";
	} else {
		sResourceKey = sDefaultResourceKey;
		aParameters = [aIgnoredLabels.join(", ")];
	}
	return oResourceBundle.getText(sResourceKey, aParameters);
}

function getText(aIgnoredLabels: string[], oFilterBar: Control, sTabTitle: string): string {
	const oResourceBundle = _getResourceBundle();
	return oResourceBundle
		? oResourceBundle.getText(`C_LR_MULTITABLES_${_getArgumentSize(aIgnoredLabels)}_IGNORED_FILTER_${_getSizeText()}`, [
				aIgnoredLabels.join(", "),
				getLocalizedText(sTabTitle, oFilterBar)
		  ])
		: "";
}

function _getSizeText(): "LARGE" | "SMALL" {
	return Device.system.desktop ? "LARGE" : "SMALL";
}

function _getArgumentSize(aIgnoredLabels: string[]): "SINGLE" | "MULTI" {
	return aIgnoredLabels.length === 1 ? "SINGLE" : "MULTI";
}

function _getResourceBundle(): ResourceBundle | undefined {
	return Library.getResourceBundleFor("sap.fe.templates");
}

const MessageStripHelper = {
	getALPText: getALPText,
	getText: getText,
	getLabels: getLabels
};

export default MessageStripHelper;
