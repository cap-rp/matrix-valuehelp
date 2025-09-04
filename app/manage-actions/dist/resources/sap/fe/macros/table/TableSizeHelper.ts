import type { Property, ServiceObject } from "@sap-ux/vocabularies-types";
import type { ConvertedMetadata } from "@sap-ux/vocabularies-types/Edm";
import type { ContactType } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import { CommunicationAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/Communication";
import type {
	DataField,
	DataFieldForAction,
	DataFieldForAnnotation,
	DataFieldForIntentBasedNavigation,
	DataPointType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import SizeHelper from "sap/fe/core/helpers/SizeHelper";
import { isAnnotationOfType, isPathAnnotationExpression } from "sap/fe/core/helpers/TypeGuards";
import { getDisplayMode } from "sap/fe/core/templating/DisplayModeFormatter";
import type { EnhancedFEPropertyInfo } from "sap/fe/macros/table/TableAPI";
import TableUtil from "sap/m/table/Util";
import type TypeConfig from "sap/ui/mdc/TypeConfig";
import TypeMap from "sap/ui/mdc/odata/v4/TypeMap";

const TableSizeHelper = {
	/**
	 * Method to calculate the width of the MDCColumn.
	 * @param dataField The Property or PropertyInfo Object for which the width will be calculated.
	 * @param properties An array containing all property definitions (optional)
	 * @param convertedMetaData
	 * @param widthIncludingColumnHeader Indicates if the label should be a part of the width calculation
	 * @private
	 * @alias sap.fe.macros.TableSizeHelper
	 * @returns The width of the column.
	 */
	getMDCColumnWidthFromDataField: function (
		dataField: DataField | Property | undefined,
		properties: EnhancedFEPropertyInfo[],
		convertedMetaData: ConvertedMetadata,
		widthIncludingColumnHeader = false
	): number {
		const property = properties.find(
			(prop) =>
				prop.annotationPath &&
				convertedMetaData.resolvePath<ServiceObject>(prop.annotationPath)?.target?.fullyQualifiedName ===
					dataField?.fullyQualifiedName
		);
		return property ? this.getMDCColumnWidthFromProperty(property, properties, widthIncludingColumnHeader) : 0;
	},

	/**
	 *  Method to calculate the width of the MDCColumn.
	 * @param property The PropertyInfo object for which the width is calculated
	 * @param properties  An array containing all property definitions (optional)
	 * @param widthIncludingColumnHeader Indicates if the label is part of the width calculation
	 * @param isSortableColumn Indicates if the column is sortable
	 * @param isColumnRequired Indicates if the column is required
	 * @returns The width of the column.
	 */
	getMDCColumnWidthFromProperty: function (
		property: EnhancedFEPropertyInfo,
		properties: EnhancedFEPropertyInfo[],
		widthIncludingColumnHeader = false,
		isSortableColumn = false,
		isColumnRequired = false
	): number {
		const mWidthCalculation = Object.assign(
			{
				headerGap: widthIncludingColumnHeader && isSortableColumn,
				gap: 0,
				truncateLabel: !widthIncludingColumnHeader,
				excludeProperties: [],
				required: isColumnRequired
			},
			property.visualSettings?.widthCalculation
		);

		let types,
			propertyTypeConfig: TypeConfig | null = null;
		//add the typeConfig to the properties as it's not available in the table value help
		if (property.dataType && !property.typeConfig) {
			propertyTypeConfig = TypeMap.getTypeConfig(property.dataType, property.formatOptions, property.constraints);
		}
		if (property.propertyInfos?.length) {
			types = property.propertyInfos
				.map((propName) => {
					const prop = properties.find((_property) => _property.key === propName);
					return propertyTypeConfig ? propertyTypeConfig.typeInstance : prop?.typeConfig?.typeInstance;
				})
				.filter((item) => item);
		} else if (property.typeConfig?.typeInstance || propertyTypeConfig) {
			types = propertyTypeConfig ? [propertyTypeConfig.typeInstance] : [property.typeConfig?.typeInstance];
		}
		const size = types ? TableUtil.calcColumnWidth(types, property.label, mWidthCalculation) : null;
		if (!size) {
			Log.error(`Cannot compute the column width for property: ${property.key}`);
		}
		return size ? parseFloat(size.replace("Rem", "")) : 0;
	},

	/**
	 * Method to calculate the  width of a DataFieldAnnotation object contained in a fieldGroup.
	 * @param dataField DataFieldAnnotation object.
	 * @param widthIncludingColumnHeader Indicates if the column header should be a part of the width calculation.
	 * @param properties Array containing all PropertyInfo objects.
	 * @param convertedMetaData
	 * @param showDataFieldsLabel Label is displayed inside the field
	 * @private
	 * @alias sap.fe.macros.TableSizeHelper
	 * @returns Object containing the width of the label and the width of the property.
	 */
	getWidthForDataFieldForAnnotation: function (
		dataField: DataFieldForAnnotation | DataFieldForAction | DataFieldForIntentBasedNavigation | undefined,
		widthIncludingColumnHeader?: boolean,
		properties?: EnhancedFEPropertyInfo[],
		convertedMetaData?: ConvertedMetadata,
		showDataFieldsLabel = false
	): { labelWidth: number; propertyWidth: number } {
		const oTargetedProperty = isAnnotationOfType<DataFieldForAnnotation>(dataField, UIAnnotationTypes.DataFieldForAnnotation)
			? (dataField?.Target?.$target as DataPointType | ContactType | undefined)
			: undefined;
		let nPropertyWidth = 0,
			fLabelWidth = 0;
		if (isAnnotationOfType<DataPointType>(oTargetedProperty, UIAnnotationTypes.DataPointType) && oTargetedProperty?.Visualization) {
			switch (oTargetedProperty.Visualization) {
				case "UI.VisualizationType/Rating":
					const nbStars = oTargetedProperty.TargetValue;
					nPropertyWidth = parseInt(nbStars, 10) * 1.375;
					break;
				case "UI.VisualizationType/Progress":
				default:
					nPropertyWidth = 5;
			}
			const sLabel = oTargetedProperty ? (oTargetedProperty as { label?: string }).label : dataField?.Label?.toString() || "";
			fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
		} else if (
			convertedMetaData &&
			properties &&
			isAnnotationOfType<ContactType>(oTargetedProperty, CommunicationAnnotationTypes.ContactType) &&
			isPathAnnotationExpression(oTargetedProperty.fn)
		) {
			nPropertyWidth = this.getMDCColumnWidthFromDataField(
				oTargetedProperty.fn.$target,
				properties,
				convertedMetaData,
				widthIncludingColumnHeader
			);
		}
		return { labelWidth: fLabelWidth, propertyWidth: nPropertyWidth };
	},

	/**
	 * Method to calculate the width of a DataField object.
	 * @param dataField DataFieldAnnotation object.
	 * @param showDataFieldsLabel Label is displayed inside the field.
	 * @param properties Array containing all PropertyInfo objects.
	 * @param convertedMetaData Context Object of the parent property.
	 * @private
	 * @alias sap.fe.macros.TableSizeHelper
	 * @returns {object} Object containing the width of the label and the width of the property.
	 */

	getWidthForDataField: function (
		dataField: DataField,
		showDataFieldsLabel: boolean,
		properties: EnhancedFEPropertyInfo[],
		convertedMetaData: ConvertedMetadata,
		widthIncludingColumnHeader: boolean
	): { labelWidth: number; propertyWidth: number } {
		const oTargetedProperty = dataField.Value?.$target,
			oTextArrangementTarget = oTargetedProperty?.annotations?.Common?.Text,
			displayMode = getDisplayMode(dataField.Value?.$target);

		let nPropertyWidth = 0,
			fLabelWidth = 0;
		if (oTargetedProperty) {
			switch (displayMode) {
				case "Description":
					nPropertyWidth =
						this.getMDCColumnWidthFromDataField(
							oTextArrangementTarget.$target,
							properties,
							convertedMetaData,
							widthIncludingColumnHeader
						) - 1;
					break;
				case "DescriptionValue":
				case "ValueDescription":
				case "Value":
				default:
					nPropertyWidth =
						this.getMDCColumnWidthFromDataField(oTargetedProperty, properties, convertedMetaData, widthIncludingColumnHeader) -
						1;
			}
			const sLabel = dataField.Label ? dataField.Label : oTargetedProperty.label;
			fLabelWidth = showDataFieldsLabel && sLabel ? SizeHelper.getButtonWidth(sLabel) : 0;
		} else {
			Log.error(`Cannot compute width for type object: ${dataField.$Type}`);
		}
		return { labelWidth: fLabelWidth, propertyWidth: nPropertyWidth };
	}
};

export default TableSizeHelper;
