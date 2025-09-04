import { defineUI5Class } from "sap/fe/base/ClassSupport";
import type VisualFilter from "sap/fe/macros/controls/filterbar/VisualFilter";
import type Button from "sap/m/Button";
import type OverflowToolbar from "sap/m/OverflowToolbar";
import type Control from "sap/ui/core/Control";
import type AlignedFlowLayout from "sap/ui/layout/AlignedFlowLayout";
import type FilterField from "sap/ui/mdc/FilterField";
import type IFilterContainer from "sap/ui/mdc/filterbar/IFilterContainer";
import MdcFilterContainer from "sap/ui/mdc/filterbar/aligned/FilterContainer";

/**
 * Constructor for a new FE filter container.
 *
 */
@defineUI5Class("sap.fe.macros.controls.filterbar.FilterContainer")
class FilterContainer extends MdcFilterContainer implements IFilterContainer {
	aAllFilterFields!: Control[];

	aAllVisualFilters!: Record<string, VisualFilter>;

	oLayout!: AlignedFlowLayout;

	init(): void {
		this.aAllFilterFields = [];
		this.aAllVisualFilters = {};
		super.init();
		this.oLayout.setParent(this);
	}

	exit(): void {
		// destroy layout
		super.exit();
		// destroy all filter fields which are not in the layout
		this.aAllFilterFields.forEach(function (oFilterField: Control) {
			oFilterField.destroy();
		});
		Object.keys(this.aAllVisualFilters).forEach((sKey: string) => {
			this.aAllVisualFilters[sKey].destroy();
		});
	}

	insertFilterField(oControl: Control & { _fnGetContentCopy?: Function; getContent: Function }, iIndex: number): void {
		const oFilterItemLayoutEventDelegate = {
			onBeforeRendering: function (): void {
				// For compact filters the item layout needs to render both label and filter field.
				// hence use the original getContent of the FilterItemLayout
				if (oControl._fnGetContentCopy) {
					oControl.getContent = oControl._fnGetContentCopy;
				}
				oControl.removeEventDelegate(oFilterItemLayoutEventDelegate);
			}
		};
		oControl.addEventDelegate(oFilterItemLayoutEventDelegate);

		// In this layout there is no need to render visual filter
		// hence find the filter field from the layout and remove it's content aggregation
		oControl.getContent().forEach((oInnerControl: Control) => {
			if (oInnerControl.isA<FilterField>("sap.ui.mdc.FilterField")) {
				const oContent = oInnerControl.getContent && (oInnerControl.getContent() as unknown as Control);
				if (oContent && oContent.isA<VisualFilter>("sap.fe.macros.visualfilters.VisualFilter")) {
					// store the visual filter for later use.
					const oVFId = oInnerControl.getId();
					this.aAllVisualFilters[oVFId] = oContent;
					// remove the content aggregation to render internal content of the field
					oInnerControl.setContent(null as unknown as Control);
				}
			}
		});

		// store filter fields to refer to when switching between layout
		this.aAllFilterFields.push(oControl);
		super.insertFilterField(oControl, iIndex);
	}

	removeFilterField(oControl: Control & { getContent: Function }): void {
		const oFilterFieldIndex = this.aAllFilterFields.findIndex(function (oFilterField: Control) {
			return oFilterField.getId() === oControl.getId();
		});

		// Setting VF content for Fillterfield before removing
		oControl.getContent().forEach((oInnerControl: Control) => {
			if (oInnerControl.isA<FilterField>("sap.ui.mdc.FilterField") && !oInnerControl.getContent()) {
				const oVFId = oInnerControl.getId();
				if (this.aAllVisualFilters[oVFId]) {
					oInnerControl.setContent(this.aAllVisualFilters[oVFId]);
				}
			}
		});

		this.aAllFilterFields.splice(oFilterFieldIndex, 1);

		super.removeFilterField(oControl);
	}

	removeAllFilterFields(): void {
		this.aAllFilterFields = [];
		this.aAllVisualFilters = {};
		this.oLayout.removeAllContent();
	}

	getAllButtons(): Button[] {
		const buttonLayout = this.oLayout.getEndContent();
		return (
			(buttonLayout?.[0] as OverflowToolbar | undefined)?.getContent()?.[1] as OverflowToolbar | undefined
		)?.getContent() as Button[];
	}

	removeButton(oControl: Button): void {
		this.oLayout.removeEndContent(oControl);
	}

	getAllFilterFields(): FilterField[] {
		return this.aAllFilterFields.filter((filterFieldLayout) => !filterFieldLayout.isDestroyed()) as FilterField[];
	}

	getAllVisualFilterFields(): Record<string, Control> {
		return this.aAllVisualFilters;
	}

	setAllFilterFields(aFilterFields: FilterField[]): void {
		this.aAllFilterFields = aFilterFields;
	}
}
export default FilterContainer;
