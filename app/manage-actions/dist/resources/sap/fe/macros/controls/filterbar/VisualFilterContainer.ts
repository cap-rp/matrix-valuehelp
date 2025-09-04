import { aggregation, defineUI5Class } from "sap/fe/base/ClassSupport";
import type VisualFilter from "sap/fe/macros/controls/filterbar/VisualFilter";
import type Button from "sap/m/Button";
import FlexBox from "sap/m/FlexBox";
import HeaderContainer from "sap/m/HeaderContainer";
import Device from "sap/ui/Device";
import type Control from "sap/ui/core/Control";
import coreLibrabry from "sap/ui/core/library";
import type FilterField from "sap/ui/mdc/FilterField";
import IFilterContainer from "sap/ui/mdc/filterbar/IFilterContainer";
/**
 * Constructor for a new Visual Filter Container.
 * Used for visual filters.
 *
 */
@defineUI5Class("sap.fe.macros.controls.filterbar.VisualFilterContainer")
class VisualFilterContainer extends IFilterContainer {
	@aggregation({
		type: "sap.ui.core.Control",
		multiple: false,
		visibility: "hidden"
	})
	/**
	 * Internal hidden aggregation to hold the inner layout.
	 */
	_layout!: Control;

	oHeaderContainer?: HeaderContainer;

	oButtonFlexBox?: FlexBox;

	oLayout!: FlexBox;

	aAllFilterFields!: FilterField[];

	aVisualFilterFields?: Record<string, VisualFilter> = {};

	init(): void {
		super.init();
		const Orientation = coreLibrabry.Orientation;

		const sOrientation = Device.system.phone ? Orientation.Vertical : undefined;
		const sDirection = Device.system.phone ? "ColumnReverse" : "Column";

		this.oHeaderContainer = new HeaderContainer({
			orientation: sOrientation
		});
		this.oButtonFlexBox = new FlexBox({
			alignItems: "End",
			justifyContent: "End"
		});

		this.oLayout = new FlexBox({
			direction: sDirection, // Direction is Column Reverse for Phone
			items: [this.oHeaderContainer, this.oButtonFlexBox]
		});
		this.oLayout.setParent(this);

		this.aAllFilterFields = [];
		this.aVisualFilterFields = {};
	}

	exit(): void {
		// destroy layout
		super.exit();
		// destroy all filter fields which are not in the layout
		const aAllFilterFields = this.getAllFilterFields();
		aAllFilterFields.forEach(function (oFilterField: FilterField) {
			oFilterField.destroy();
		});
		this.oHeaderContainer = undefined;
		this.oButtonFlexBox = undefined;
		this.aAllFilterFields = [];
	}

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	insertFilterField(
		oControl: Omit<FilterField, "getContent"> & {
			_fnGetContentCopy?: Function;
			_oFilterField: FilterField;
			getContent: () => Control[];
		},
		iIndex: number
	): void {
		const oFilterItemLayoutEventDelegate = {
			onBeforeRendering: function (): void {
				// visual filter does not need to render a label
				// hence override the getContent of the FilterItemLayout
				// and store the original getContent for later usage in the compact filters
				if (!oControl._fnGetContentCopy) {
					oControl._fnGetContentCopy = oControl.getContent;
				}
				// override getContent of FilterItemLayout
				// to add only filterField and not label
				oControl.getContent = function (): Control[] {
					const aContent = [];
					aContent.push(oControl._oFilterField);
					return aContent;
				};
				oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
			}
		};
		oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

		// Setting VF control for the Filterfield.
		const oVisualFilters = this.aVisualFilterFields;
		oControl.getContent().some((oInnerControl: Control) => {
			const sFFId = oInnerControl.getId();
			if (oVisualFilters && oVisualFilters[sFFId] && oInnerControl.isA<FilterField>("sap.ui.mdc.FilterField")) {
				oInnerControl.setContent(oVisualFilters[sFFId]);
				this.oHeaderContainer!.insertContent(oControl, iIndex);
			}
		});
	}

	removeFilterField(oControl: FilterField): void {
		this.oHeaderContainer!.removeContent(oControl);
	}

	removeAllFilterFields(): void {
		this.aAllFilterFields = [];
		this.aVisualFilterFields = {};
		this.oHeaderContainer!.removeAllContent();
	}

	getFilterFields(): FilterField[] {
		return this.oHeaderContainer!.getContent() as FilterField[];
	}

	addButton(oControl: Button): void {
		this.oButtonFlexBox!.addItem(oControl);
	}

	getAllButtons(): Button[] {
		return this.oButtonFlexBox!.getItems().reverse() as Button[];
	}

	removeButton(oControl: Button): void {
		this.oButtonFlexBox!.removeItem(oControl);
	}

	getAllFilterFields(): FilterField[] {
		return this.aAllFilterFields.filter((filterFieldLayout) => !filterFieldLayout.isDestroyed());
	}

	setAllFilterFields(aFilterFields: FilterField[], aVisualFilterFields?: Record<string, VisualFilter>): void {
		this.aAllFilterFields = aFilterFields;
		this.aVisualFilterFields = aVisualFilterFields;
	}
}

export default VisualFilterContainer;
