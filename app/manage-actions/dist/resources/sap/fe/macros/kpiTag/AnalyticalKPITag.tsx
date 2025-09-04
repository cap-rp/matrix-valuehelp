import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { formatResult, pathInModel, resolveBindingString } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import kpiFormatters from "sap/fe/core/formatters/KPIFormatter";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type Event from "sap/ui/base/Event";
import type { PropertyBindingInfo } from "sap/ui/base/ManagedObject";
import type { $ControlSettings } from "sap/ui/core/Control";
import type View from "sap/ui/core/mvc/View";
import type MetaDataModel from "sap/ui/model/odata/v4/ODataModel";
import KPITag from "../KPITag";

/**
 * A building block used to display a KPI in the Analytical List Page
 *
 */
@defineUI5Class("sap.fe.macros.kpiTag.AnalyticalKPITag")
export default class AnalyticalKPITag extends BuildingBlock<KPITag> {
	/**
	 * The ID of the KPI
	 */
	@property({ type: "string", required: true })
	public id!: string;

	/**
	 * Path to the DataPoint annotation of the KPI
	 */
	@property({ type: "string", required: true })
	public metaPath!: string;

	/**
	 * The name of the runtime model from where we fetch the KPI properties
	 */
	@property({ type: "string", required: true })
	public kpiModelName!: string;

	/**
	 * Set it to `true` if the KPI value has an associated currency or unit of measure
	 */
	@property({ type: "boolean", required: false })
	public hasUnit?: boolean;

	constructor(properties: $ControlSettings & PropertiesOf<AnalyticalKPITag>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		if (!this.content) {
			this.content = this.createContent();
		}
	}

	/**
	 * Creates a binding expression for a specific property in the KPI model.
	 * @param view
	 * @param propertyName This is the name of the property that finds the KPI data in the associated KPI model.
	 * @returns A binding expression
	 */
	getKpiPropertyExpression(view: View, propertyName: string): BindingToolkitExpression<string> {
		return pathInModel(`/${view.getLocalId(this.id) ?? this.id}/manifest/sap.card/data/json/${propertyName}`, this.kpiModelName);
	}

	/**
	 * Creates binding expressions for the KPITag's text and tooltip.
	 * @param view
	 * @returns Object containing the binding expressions for the text and the tooltip
	 */
	getBindingExpressions(view: View): { text?: PropertyBindingInfo; tooltip?: PropertyBindingInfo } {
		const owner = this._getOwner();
		const metaModel = owner?.preprocessorContext?.models.metaModel as MetaDataModel;
		const context = metaModel.getContext(this.metaPath);
		const kpiTitle = context.getProperty("Title");

		if (!kpiTitle) {
			return { text: undefined, tooltip: undefined };
		}

		const titleExpression = resolveBindingString<string>(kpiTitle);
		return {
			text: formatResult([titleExpression], kpiFormatters.labelFormat) as PropertyBindingInfo,
			tooltip: formatResult(
				[
					titleExpression,
					this.getKpiPropertyExpression(view, "mainValueUnscaled"),
					this.getKpiPropertyExpression(view, "mainUnit"),
					this.getKpiPropertyExpression(view, "mainCriticality"),
					String(this.hasUnit)
				],
				kpiFormatters.tooltipFormat
			) as PropertyBindingInfo
		};
	}

	createContent(): KPITag {
		const owner = this._getOwner();
		const controller = owner?.getRootController() as ListReportController;
		const view = controller?.getView() as View;
		const { text, tooltip } = this.getBindingExpressions(view);
		const kpiTag: KPITag = (
			<KPITag
				id={this.createId("_akt")}
				text={text}
				status={this.getKpiPropertyExpression(view, "mainCriticality") as PropertyBindingInfo}
				tooltip={tooltip}
				press={async (event: Event): Promise<void> =>
					controller.kpiManagement.onKPIPressed(event.getSource(), view.getLocalId(this.id) ?? this.id)
				}
				number={this.getKpiPropertyExpression(view, "mainValue") as PropertyBindingInfo}
				unit={this.getKpiPropertyExpression(view, "mainUnit") as PropertyBindingInfo}
			/>
		);
		return kpiTag;
	}
}
