import { defineUI5Class, xmlEventHandler, type PropertiesOf } from "sap/fe/base/ClassSupport";

import type PageController from "sap/fe/core/PageController";
import { convertBuildingBlockMetadata } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import BuildingBlockWithTemplating from "sap/fe/macros/controls/BuildingBlockWithTemplating";
import FilterBarBlock from "sap/fe/macros/filterBar/FilterBar.block";
import type UI5Event from "sap/ui/base/Event";
import type { $ControlSettings } from "sap/ui/mdc/Control";

/**
 * Usage example:
 * <pre>
 * sap.ui.require(["sap/fe/macros/filterBar/FilterBar"], function(FilterBar) {
 * 	 ...
 * 	 new FilterBar("MyFilterBar", {metaPath:"@com.sap.vocabularies.UI.v1.SelectionFields"})
 * })
 * </pre>
 *
 * This is currently an experimental API because the structure of the generated content will change to come closer to the FilterBar that you get out of templates.
 * The public method and property will not change but the internal structure will so be careful on your usage.
 * @public
 * @experimental
 * @mixes sap.fe.macros.FilterBar
 */
@defineUI5Class("sap.fe.macros.filterBar.FilterBar", convertBuildingBlockMetadata(FilterBarBlock))
export default class FilterBar extends BuildingBlockWithTemplating {
	constructor(props?: PropertiesOf<FilterBarBlock> & $ControlSettings, others?: $ControlSettings) {
		super(props, others);
		this.createProxyMethods([
			"setFilterValues",
			"getActiveFiltersText",
			"getFilters",
			"triggerSearch",
			"getSelectionVariant",
			"setFilterFieldVisible",
			"getFilterFieldVisible",
			"getCurrentVariantKey",
			"setCurrentVariantKey",
			"setFilterFieldEnabled",
			"getFilterFieldEnabled",
			"setSelectionVariant"
		]);
	}

	@xmlEventHandler()
	_fireEvent(ui5Event: UI5Event, _controller: PageController, eventId: string): void {
		this.fireEvent(eventId, ui5Event.getParameters());
	}
}
