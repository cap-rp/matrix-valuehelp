import type { Property } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { BaseTreeModifier, PreprocessorSettings } from "sap/fe/core/CommonUtils";
import CommonUtils from "sap/fe/core/CommonUtils";
import type ExtensionAPI from "sap/fe/core/ExtensionAPI";
import type PageController from "sap/fe/core/PageController";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import type {
	AnnotationTableColumn,
	ColumnExportSettings,
	CustomBasedTableColumn,
	ExtensionForAnalytics,
	PropertyTypeConfig
} from "sap/fe/core/converters/controls/Common/table/Columns";
import type { CustomElement } from "sap/fe/core/converters/helpers/ConfigurableObject";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { enhanceDataModelPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import type { DisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import { getRelativePropertyPath } from "sap/fe/core/templating/PropertyFormatters";
import { getAssociatedCurrencyPropertyPath, getAssociatedUnitPropertyPath } from "sap/fe/core/templating/PropertyHelper";
import type ValueHelp from "sap/fe/macros/ValueHelp";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import { generateID } from "sap/fe/macros/internal/valuehelp/ValueHelpTemplating";
import type UI5Element from "sap/ui/core/Element";
import type View from "sap/ui/core/mvc/View";
import type { MDCTablePropertyInfo } from "sap/ui/mdc/Table";
import type MDCValueHelp from "sap/ui/mdc/ValueHelp";
import type Model from "sap/ui/model/Model";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

const NS_MACRODATA = "http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1";

export type tableDelegateModel = {
	enableAutoColumnWidth: boolean;
	readOnly: boolean;
	tableType: string;
	onChange: Function;
	id: string;
	navigationPropertyPath: string;
	columnInfo: CustomElement<CustomBasedTableColumn>;
	collection: {
		sPath: string;
		oModel: string;
	};
	widthIncludingColumnHeader: boolean;
};

export type PropertyInfo = {
	additionalLabels?: string[];
	caseSensitive?: boolean;
	description?: string;
	descriptionProperty?: string;
	exportSettings?: ColumnExportSettings | null;
	clipboardSettings?: Object | null;
	formatOptions?: Object | null;
	filterable?: boolean;
	group?: string;
	groupable?: boolean;
	filterExpression?: string;
	groupLabel?: string;
	isKey?: boolean;
	label?: string;
	maxConditions?: number;
	metadataPath?: string;
	mode?: DisplayMode;
	name: string;
	key?: string;
	path?: string;
	propertyInfos?: string[];
	relativePath?: string;
	sortable?: boolean;
	sortDirection?: string;
	text?: string;
	tooltip?: string;
	typeConfig?: PropertyTypeConfig;
	type?: string;
	unit?: string;
	valueProperty?: string;
	visible?: boolean;
	visualSettings?: MDCTablePropertyInfo["visualSettings"];
	exportDataPointTargetValue?: string;
	isParameter?: boolean;
	aggregatable?: boolean;
	required?: boolean;
	extension?: ExtensionForAnalytics;
};

function _retrieveModel(this: {
	modelName: string | undefined;
	control: UI5Element & { getDelegate: () => { payload?: { modelName: string } } };
	resolve: Function;
}): void {
	this.control.detachModelContextChange(_retrieveModel, this);
	const sModelName = this.modelName,
		oModel = this.control.getModel(sModelName);

	if (oModel) {
		this.resolve(oModel);
	} else {
		this.control.attachModelContextChange(_retrieveModel, this);
	}
}

export type Modifier = {
	getAggregation: Function;
	getProperty: Function;
	setProperty: Function;
	insertAggregation: Function;
};

const DelegateUtil = {
	FETCHED_PROPERTIES_DATA_KEY: "sap_fe_ControlDelegate_propertyInfoMap",
	setCachedProperties(control: Element | UI5Element, fetchedProperties: PropertyInfo[]): void {
		// do not cache during templating, else it becomes part of the cached view
		if (control instanceof window.Element) {
			return;
		}
		const key = DelegateUtil.FETCHED_PROPERTIES_DATA_KEY;
		DelegateUtil.setCustomData(control, key, fetchedProperties as unknown as string);
	},
	getCachedProperties(control: Element | UI5Element): PropertyInfo[] | undefined {
		// properties are not cached during templating
		if (control instanceof window.Element) {
			return undefined;
		}
		const key = DelegateUtil.FETCHED_PROPERTIES_DATA_KEY;
		return DelegateUtil.getCustomData<PropertyInfo[]>(control, key);
	},
	async getCustomDataWithModifier<T = unknown>(
		control: Element | UI5Element,
		property: string,
		modifier?: BaseTreeModifier
	): Promise<T | undefined> {
		if (!modifier) {
			return Promise.resolve(DelegateUtil.getCustomData<T>(control, property));
		}
		const customData = await DelegateUtil.retrieveCustomDataNode(control, property, modifier);
		if (customData.length === 1) {
			return modifier.getProperty(customData[0], "value");
		} else {
			return undefined;
		}
	},

	getCustomData<T = unknown>(oControl: Element | UI5Element, sProperty: string): T | undefined {
		// Delegate invoked from a non-flex change - FilterBarDelegate._addP13nItem for OP table filtering, FilterBarDelegate.fetchProperties etc.
		if (oControl && sProperty) {
			if (oControl instanceof window.Element) {
				return oControl.getAttributeNS(NS_MACRODATA, sProperty) as T;
			}
			if (oControl.data instanceof Function) {
				return oControl.data(sProperty);
			}
		}
		return undefined;
	},

	setCustomData(oControl: Element | UI5Element, sProperty: string, vValue: unknown): void {
		if (oControl && sProperty) {
			if (oControl instanceof window.Element) {
				return oControl.setAttributeNS(NS_MACRODATA, `customData:${sProperty}`, vValue as string);
			}
			if (oControl.data instanceof Function) {
				return oControl.data(sProperty, vValue);
			}
		}
	},
	fetchPropertiesForEntity(sEntitySet: string, oMetaModel: ODataMetaModel): unknown {
		return oMetaModel.requestObject(`${sEntitySet}/`);
	},
	fetchAnnotationsForEntity(sEntitySet: string, oMetaModel: ODataMetaModel): unknown {
		return oMetaModel.requestObject(`${sEntitySet}@`);
	},
	async fetchModel(oControl: UI5Element & { getDelegate: () => { payload?: { modelName: string } } }): Promise<Model> {
		return new Promise((resolve) => {
			const sModelName = oControl.getDelegate().payload && oControl.getDelegate().payload?.modelName,
				oContext = { modelName: sModelName, control: oControl, resolve: resolve };
			_retrieveModel.call(oContext);
		});
	},
	async templateControlFragment(
		sFragmentName: string | Element | null,
		oPreprocessorSettings: PreprocessorSettings,
		oOptions?: { view?: View; isXML?: boolean; id?: string; controller?: PageController | ExtensionAPI; containingView?: View },
		oModifier?: BaseTreeModifier
	): Promise<Element | UI5Element | Element[] | UI5Element[]> {
		return CommonUtils.templateControlFragment(sFragmentName, oPreprocessorSettings, oOptions, oModifier);
	},

	async doesValueHelpExist(mParameters: {
		sPropertyName: string;
		sValueHelpType: string;
		oMetaModel: ODataMetaModel;
		metaPath?: string;
		oModifier?: BaseTreeModifier;
		sBindingPath: string;
		flexId?: string;
		oControl: Element | UI5Element;
	}): Promise<boolean> {
		const sPropertyName = mParameters.sPropertyName || "";
		const sValueHelpType = mParameters.sValueHelpType || "";
		const oMetaModel = mParameters.oMetaModel;
		const oModifier = mParameters.oModifier;
		const sOriginalProperty = `${mParameters.sBindingPath}/${sPropertyName}`;
		const propertyContext = oMetaModel.createBindingContext(sOriginalProperty)!;
		let valueHelpPropertyPath = FieldHelper.valueHelpProperty(propertyContext);
		const bIsAbsolute = mParameters.sBindingPath && mParameters.sBindingPath.indexOf("/") === 0;

		// unit/currency
		if (valueHelpPropertyPath.includes("$Path")) {
			valueHelpPropertyPath = oMetaModel.getObject(valueHelpPropertyPath);
		}
		const propertyDataModel = getInvolvedDataModelObjects(propertyContext);
		if (bIsAbsolute && valueHelpPropertyPath.indexOf("/") !== 0) {
			const unitOrCurrencyPropertyPath =
				getAssociatedCurrencyPropertyPath(propertyDataModel.targetObject as Property) ||
				getAssociatedUnitPropertyPath(propertyDataModel.targetObject as Property);
			const unitOrCurrencyDataModel = enhanceDataModelPath(propertyDataModel, unitOrCurrencyPropertyPath);
			valueHelpPropertyPath = getTargetObjectPath(unitOrCurrencyDataModel);
		}

		const sGeneratedId = generateID(
			mParameters.flexId,
			generate([oModifier ? oModifier.getId(mParameters.oControl) : (mParameters.oControl as UI5Element).getId(), sValueHelpType]),
			undefined,
			getRelativePropertyPath(propertyContext.getProperty(sOriginalProperty), {
				context: {
					getModel: () => {
						return mParameters.oMetaModel;
					},
					getPath: () => {
						return sOriginalProperty;
					}
				} as unknown as Context
			}),
			getRelativePropertyPath(propertyContext.getProperty(valueHelpPropertyPath), {
				context: {
					getModel: () => {
						return mParameters.oMetaModel;
					},
					getPath: () => {
						return valueHelpPropertyPath;
					}
				} as unknown as Context
			})
		);

		return Promise.resolve()
			.then(async function () {
				if (oModifier) {
					return oModifier.getAggregation(mParameters.oControl, "dependents");
				}
				return (mParameters.oControl as UI5Element).getAggregation("dependents") as UI5Element[];
			})
			.then(async function (aDependents: Element[] | UI5Element[]) {
				if (aDependents) {
					for (const oDependent of aDependents) {
						let oTargetDependent: UI5Element | Element | undefined = oDependent;
						if (oModifier) {
							if (
								oModifier.getControlType(oDependent) === "sap.fe.macros.ValueHelp" &&
								(await oModifier.getProperty(oDependent, "metaPath")) === mParameters.metaPath
							) {
								// in xml validate against the metaPath of the ValueHelp
								return true;
							} else if (
								oModifier.getControlType(oDependent) === "sap.fe.macros.ValueHelp" &&
								oModifier.targets !== "xmlTree"
							) {
								// in xml validate against the metaPath of the ValueHelp
								oTargetDependent = (oDependent as ValueHelp).getContent();
							} else if (
								oModifier.getControlType(oDependent) === "sap.ui.mdc.ValueHelp" &&
								oModifier.targets !== "xmlTree" &&
								oModifier.getId(oTargetDependent).includes("::FilterFieldValueHelp::")
							) {
								const payload = (oDependent as MDCValueHelp).getPayload() as { propertyPath?: string };
								if (payload?.propertyPath && payload?.propertyPath === mParameters.metaPath) {
									// specific case of the OVP
									return true;
								} else if (!payload?.propertyPath) {
									// sometimes propertyPath is not filled
									const targetId = oModifier.getId(oTargetDependent);
									const lastIDPart = targetId.split("::FilterFieldValueHelp::")[1];
									const generatedIdLastPart = sGeneratedId.split("::FilterFieldValueHelp::")[1];
									if (lastIDPart === generatedIdLastPart) {
										return true;
									}
								}
							}
							if (oTargetDependent && oModifier.getId(oTargetDependent) === sGeneratedId) {
								return true;
							}
						} else {
							const oDependentAsUi5Element = oDependent as UI5Element;
							if (oDependentAsUi5Element.isA<ValueHelp>("sap.fe.macros.ValueHelp")) {
								oTargetDependent = oDependentAsUi5Element.getContent();
							}
							if ((oTargetDependent as UI5Element)?.getId() === sGeneratedId) {
								return true;
							}
						}
					}
				}
				return false;
			});
	},
	async isValueHelpRequired(
		mParameters: {
			sPropertyName: string;
			oMetaModel: ODataMetaModel;
			sBindingPath: string;
			oControl: Element | UI5Element;
			oModifier: BaseTreeModifier;
		},
		bInFilterField?: boolean
	): Promise<boolean> {
		const sPropertyName = mParameters.sPropertyName || "",
			oMetaModel = mParameters.oMetaModel,
			sProperty = `${mParameters.sBindingPath}/${sPropertyName}`,
			oPropertyContext = oMetaModel.createBindingContext(sProperty)!,
			sValueHelpProperty = FieldHelper.valueHelpProperty(oPropertyContext, bInFilterField);

		return this.getCustomDataWithModifier<string | boolean>(mParameters.oControl, "displayModePropertyBinding", mParameters.oModifier)
			.then(async function (bReadOnly: string | boolean | undefined) {
				// Check whether the control is read-only. If yes, no need of a value help.
				bReadOnly = typeof bReadOnly === "boolean" ? bReadOnly : bReadOnly === "true";
				if (bReadOnly) {
					return false;
				}
				// Else, check whether Value Help relevant annotation exists for the property.
				// TODO use PropertyFormatter.hasValueHelp () => if doing so, QUnit tests fail due to mocked model implementation
				return Promise.all([
					oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListWithFixedValues`),
					oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListReferences`),
					oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueListMapping`),
					oMetaModel.requestObject(`${sValueHelpProperty}@com.sap.vocabularies.Common.v1.ValueList`)
				]);
			})
			.then(function (aResults: boolean | [object, object, object, object]) {
				if (!Array.isArray(aResults)) {
					return aResults;
				}
				return !!aResults[0] || !!aResults[1] || !!aResults[2] || !!aResults[3];
			})
			.catch(function (oError) {
				Log.warning("Error while retrieving custom data / value list annotation values", oError as string);
				return false;
			});
	},
	isMultiValue(property: AnnotationTableColumn): boolean {
		let isMultiValue = true;
		if (property.dataType && property.dataType?.indexOf("Boolean") > 0) {
			isMultiValue = false;
		}
		return isMultiValue;
	},
	/**
	 * Retrieves a custom data node from the control.
	 * @param control The control from which to retrieve the custom data node
	 * @param propertyKey The key of the custom data node to retrieve
	 * @param modifier The modifier for the control
	 * @returns - The custom data node
	 */
	async retrieveCustomDataNode(control: Element | UI5Element, propertyKey: string, modifier: BaseTreeModifier): Promise<Element[]> {
		const customData: Element[] = [];
		const aRetrievedCustomData = await Promise.resolve().then(
			modifier.getAggregation.bind(modifier, control, "customData") as () => Promise<Element[]>
		);

		// Process each retrieved custom data element
		for (const oCustomData of aRetrievedCustomData) {
			const key = await modifier.getProperty(oCustomData, "key");
			if (key === propertyKey) {
				customData.push(oCustomData);
			}
		}

		return customData;
	}
};
export default DelegateUtil;
