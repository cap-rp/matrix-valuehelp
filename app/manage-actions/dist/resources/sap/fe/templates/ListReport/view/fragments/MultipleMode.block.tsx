import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { blockAttribute, defineBuildingBlock } from "sap/fe/core/buildingBlocks/templating/BuildingBlockSupport";
import { xml } from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor";
import BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import type {
	CustomViewDefinition,
	ListReportDefinition,
	SingleChartViewDefinition,
	SingleTableViewDefinition
} from "sap/fe/core/converters/templates/ListReportConverter";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import type { IconTabBar$SelectEvent } from "sap/m/IconTabBar";
import IconTabBar from "sap/m/IconTabBar";
import IconTabFilter from "sap/m/IconTabFilter";
import MessageStrip from "sap/m/MessageStrip";
import MultipleModeControl from "../../controls/MultipleModeControl";

@defineBuildingBlock({ name: "MultipleMode", namespace: "sap.fe.templates.ListReport.view.fragments", isOpen: true })
export default class MultipleModeBlock extends BuildingBlockTemplatingBase {
	@blockAttribute({ type: "object" })
	converterContext?: ListReportDefinition;

	constructor(props: PropertiesOf<MultipleModeBlock>) {
		super(props);
	}

	getInnerControlsAPI(): string {
		return (
			this.converterContext?.views
				.reduce((innerControls: string[], view) => {
					const innerControlId =
						(view as SingleTableViewDefinition).tableControlId || (view as SingleChartViewDefinition).chartControlId;
					if (innerControlId) {
						innerControls.push(`${innerControlId}::${(view as SingleTableViewDefinition).tableControlId ? "Table" : "Chart"}`);
					}
					return innerControls;
				}, [])
				.join(",") || ""
		);
	}

	getItems(): string {
		return this.converterContext!.views.map((view, viewIdx) => {
			return xml`<template:with path="converterContext>views/${viewIdx}/" var="view"
						template:require="{
							ID: 'sap/fe/core/helpers/StableIdHelper'
						}"
						xmlns:core="sap.ui.core"
						xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1">
				<template:with path="view>presentation" var="presentationContext">
				${(
					<IconTabFilter
						text={view.title}
						key={generate([
							(view as SingleTableViewDefinition).tableControlId ||
								(view as CustomViewDefinition).customTabId ||
								(view as SingleChartViewDefinition).chartControlId
						])}
						visible={view.visible}
					>
						{view.viewType === "Custom"
							? xml`<core:Fragment fragmentName="sap.fe.templates.ListReport.view.fragments.CustomView" type="XML" />`
							: xml`
							 ${(
									<MessageStrip
										text={
											"{tabsInternal>/" +
											((view as SingleTableViewDefinition).tableControlId ||
												(view as SingleChartViewDefinition).chartControlId) +
											"/notApplicable/title}"
										}
										type="Information"
										showIcon="true"
										showCloseButton="true"
										class="sapUiTinyMargin"
										visible={
											"{= (${tabsInternal>/" +
											((view as SingleTableViewDefinition).tableControlId ||
												(view as SingleChartViewDefinition).chartControlId) +
											"/notApplicable/fields} || []).length>0 }"
										}
									/>
								)}
							<core:Fragment fragmentName="sap.fe.templates.ListReport.view.fragments.CollectionVisualization" type="XML" />
							`}
					</IconTabFilter>
				)}
			</template:with></template:with>`;
		}).join("");
	}

	getTemplate(): string {
		return (
			<MultipleModeControl
				id={generate([this.converterContext!.multiViewsControl?.id, "Control"])}
				innerControls={this.getInnerControlsAPI() as unknown as string[]}
				filterControl={this.converterContext!.filterBarId}
				showCounts={this.converterContext!.multiViewsControl?.showTabCounts}
				freezeContent={!!this.converterContext!.filterBarId}
			>
				<IconTabBar
					core:require="{
						MULTICONTROL: 'sap/fe/templates/ListReport/controls/MultipleModeControl'
					}"
					expandable="false"
					headerMode="Inline"
					id={this.converterContext!.multiViewsControl?.id}
					stretchContentHeight="true"
					select={"MULTICONTROL.handleTabChange($event)" as unknown as (ev: IconTabBar$SelectEvent) => void}
				>
					{{
						items: this.getItems()
					}}
				</IconTabBar>
			</MultipleModeControl>
		);
	}
}
