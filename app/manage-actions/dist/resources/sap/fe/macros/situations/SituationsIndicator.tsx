import type { EntitySet, EntityType, NavigationProperty, Singleton } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type { BindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, equal, formatResult, greaterThan, ifElse, pathInModel } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import standardFormatter from "sap/fe/core/formatters/StandardFormatter";
import { showPopover } from "sap/fe/macros/situations/SituationsPopover";
import type { Button$PressEvent } from "sap/m/Button";
import Button from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import type Control from "sap/ui/mdc/Control";
import type { $ControlSettings } from "sap/ui/mdc/Control";

@defineUI5Class("sap.fe.macros.situations.SituationsIndicator")
export default class SituationsIndicator extends BuildingBlock<Control> {
	@property({
		type: "string",
		required: true
	})
	contextPath!: string;

	@property({
		type: "string",
		required: false
	})
	propertyPath?: string;

	constructor(properties: $ControlSettings & PropertiesOf<SituationsIndicator>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		this.content = this.createContent();
	}

	/**
	 * Get path to the SAP Situations for the entity type that is situation-enabled.
	 * @param context Context
	 * @returns The situations navigation property
	 */
	static getSituationsNavigationProperty(
		context: EntitySet | Singleton | EntityType | NavigationProperty
	): NavigationProperty | undefined {
		let navigationProperties: NavigationProperty[];
		switch (context._type) {
			case "NavigationProperty":
				navigationProperties = context.targetType.navigationProperties;
				break;
			case "EntityType":
				navigationProperties = context.navigationProperties;
				break;
			default:
				navigationProperties = context.entityType.navigationProperties;
		}

		const situationsNavProps = navigationProperties.filter(
			(navigationProperty) =>
				!navigationProperty.isCollection &&
				navigationProperty.targetType.annotations.Common?.SAPObjectNodeType?.Name === "BusinessSituation"
		);

		const situationsNavProp: NavigationProperty | undefined = situationsNavProps.length >= 1 ? situationsNavProps[0] : undefined;

		// only one navigation property may lead to an entity tagged as "BusinessSituation"
		if (situationsNavProps.length > 1) {
			const navPropNames = situationsNavProps.map((prop) => `'${prop.name}'`).join(", ");

			let name: string;
			switch (context._type) {
				case "NavigationProperty":
					name = context.targetType.name;
					break;
				case "EntityType":
					name = context.name;
					break;
				default:
					name = context.entityType.name;
			}

			Log.error(`Entity type '${name}' has multiple paths to SAP Situations (${navPropNames}). Using '${situationsNavProp?.name}'.
Hint: Make sure there is at most one navigation property whose target entity type is annotated with
<Annotation Term="com.sap.vocabularies.Common.v1.SAPObjectNodeType">
  <Record>
    <PropertyValue Property="Name" String="BusinessSituation" />
  </Record>
</Annotation>.`);
		}

		return situationsNavProp;
	}

	/**
	 * Handler for the press event to open popover with the situations.
	 * @param event Button press event
	 * @param name Situation navigation property name
	 */
	private onPress(event: Button$PressEvent, name: string): void {
		const pageController = this.getPageController();
		if (pageController) {
			showPopover(pageController, event, name);
		}
	}

	/**
	 * Creates the content.
	 * @returns The content of the building block.
	 */
	createContent(): Control | undefined {
		const targetEntityType = this.getDataModelObjectForMetaPath(this.contextPath)?.targetEntityType;
		if (!targetEntityType) {
			// We weren't able to find the targetEntityType object, unlikely but could happen
			return;
		}
		const situationsNavProp = SituationsIndicator.getSituationsNavigationProperty(targetEntityType);
		if (!situationsNavProp) {
			// No path to SAP Situations. That is, the entity type is not situation-enabled. Ignore this fragment.
			return undefined;
		}

		const numberOfSituations = pathInModel(`${situationsNavProp.name}/SitnNumberOfInstances`);

		// Indicator visibility
		let visible: BindingToolkitExpression<boolean>;
		if (!this.propertyPath) {
			// no propertyPath --> visibility depends on the number of situations only
			visible = greaterThan(numberOfSituations, 0);
		} else {
			// propertyPath --> visibility depends on the number of situations and on the semantic key used for showing indicators
			visible = and(
				greaterThan(numberOfSituations, 0),
				equal(pathInModel("semanticKeyHasDraftIndicator", "internal"), this.propertyPath)
			);
		}

		// Button text: the number of situations if there are multiple, the empty string otherwise
		const text = ifElse(greaterThan(numberOfSituations, 1), numberOfSituations, "");

		// Button tooltip: "There is one situation" / "There are <n> situations"
		const tooltip = formatResult(
			[this.getTranslatedText("situationsTooltipSingular"), this.getTranslatedText("situationsTooltipPlural"), numberOfSituations],
			standardFormatter.formatPluralMessageConditionally
		);

		return (
			<Button
				type={ButtonType.Attention}
				icon="sap-icon://alert"
				text={text}
				tooltip={compileExpression(tooltip)}
				visible={visible}
				press={(oEvent: Button$PressEvent): void => this.onPress(oEvent, situationsNavProp.name)}
			/>
		);
	}
}
