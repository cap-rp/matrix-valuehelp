import { association, defineUI5Class, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type FilterBarAPI from "sap/fe/macros/filterBar/FilterBarAPI";
import Text from "sap/m/Text";
import type UI5Event from "sap/ui/base/Event";
import { bindingParser } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import type UI5Element from "sap/ui/core/Element";

@defineUI5Class("sap.fe.macros.filterBar.FilterBarSummary")
export default class FilterBarSummary extends BuildingBlock<Text> {
	@association({ type: "sap.fe.macros.filterBar.FilterBarAPI", multiple: false })
	filterBar!: string;

	constructor(properties: $ControlSettings & PropertiesOf<FilterBarSummary>, others?: $ControlSettings) {
		super(properties, others);
	}

	onMetadataAvailable(): void {
		this.content = this.createContent();
		BuildingBlock.observeBuildingBlock(this.filterBar, {
			onAvailable: (filterBar: UI5Element) => {
				filterBar?.attachEvent("filterChanged", this.onFilterChange.bind(this));
			}
		});
	}

	/**
	 * Create the content.
	 * @returns The Text control that will display the summary of the applied filters.
	 */
	createContent(): Text {
		return <Text />;
	}

	/**
	 * Event handler for the filterChanged event of the filter bar.
	 * @param event
	 */
	onFilterChange(event: UI5Event): void {
		const filterBar = event.getSource();
		const appliedFiltersText = (filterBar as FilterBarAPI).getCollapsedFiltersText();
		const appliedFilterBinding = bindingParser(appliedFiltersText);
		if (appliedFilterBinding) {
			this.content?.bindText(appliedFilterBinding);
		} else {
			this.content?.setText(appliedFiltersText);
		}
	}
}
