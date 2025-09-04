import type { Property } from "@sap-ux/vocabularies-types";
import formatMessage from "sap/base/strings/formatMessage";
import type { BindingToolkitExpression, PrimitiveType } from "sap/fe/base/BindingToolkit";
import { and, ifElse, isEmpty, not, or, pathInModel } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineUI5Class, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import type { HiddenDraft } from "sap/fe/core/converters/ManifestSettings";
import { Entity, UI } from "sap/fe/core/helpers/BindingHelper";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Button from "sap/m/Button";
import type { ObjectMarker$PressEvent } from "sap/m/ObjectMarker";
import ObjectMarker from "sap/m/ObjectMarker";
import Popover from "sap/m/Popover";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import { ObjectMarkerType, ObjectMarkerVisibility } from "sap/m/library";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import Library from "sap/ui/core/Lib";
import type ODataV4Context from "sap/ui/model/odata/v4/Context";

/**
 * Building block for creating a DraftIndicator based on the metadata provided by OData V4.
 *
 * Usage example:
 * <pre>
 * &lt;macros:DraftIndicator
 * id="SomeID"
 * /&gt;
 * </pre>
 * @private
 */
@defineUI5Class("sap.fe.macros.draftIndicator.DraftIndicator")
export default class DraftIndicator extends BuildingBlock<Control> {
	/**
	 * ID of the DraftIndicator
	 */
	@property({
		type: "string"
	})
	public id?: string;

	@property({
		type: "string"
	})
	public draftIndicatorType?: ObjectMarkerVisibility.IconOnly | ObjectMarkerVisibility.IconAndText = ObjectMarkerVisibility.IconAndText;

	@property({
		type: "string",
		required: true
	})
	contextPath!: string;

	@property({
		type: "string"
	})
	public class = "";

	@property({
		type: "boolean"
	})
	public usedInTable?: boolean;

	@property({
		type: "boolean"
	})
	public usedInAnalyticalTable?: boolean;

	draftPopover?: Popover;

	private isHiddenDraftEnabled?: boolean;

	constructor(properties: $ControlSettings & PropertiesOf<DraftIndicator>, others?: $ControlSettings) {
		super(properties, others);
	}

	setDraftIndicatorType(
		indicator: ObjectMarkerVisibility.IconOnly | ObjectMarkerVisibility.IconAndText | ObjectMarkerVisibility.TextOnly
	): void {
		if ([ObjectMarkerVisibility.IconOnly, ObjectMarkerVisibility.IconAndText].includes(indicator)) {
			this.setProperty("draftIndicatorType", indicator);
		} else {
			throw new Error(`Allowed value ${indicator} does not match`);
		}
	}

	addAriaLabelledByForDraftIndicator(element: string): void {
		const ariaLabelledBys = (this.content as unknown as ObjectMarker)?.getAriaLabelledBy() ?? [];
		if (!ariaLabelledBys.includes(element)) {
			(this.content as unknown as ObjectMarker)?.addAriaLabelledBy(element);
		}
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
	 * Runtime formatter function to format the correct text that displays the owner of a draft.
	 *
	 * This is used in case the DraftIndicator is shown for an active entity that has a draft of another user.
	 * @param hasDraftEntity
	 * @param draftInProcessByUser
	 * @param draftLastChangedByUser
	 * @param draftInProcessByUserDesc
	 * @param draftLastChangedByUserDesc
	 * @returns Text to display
	 */
	static formatDraftOwnerTextInPopover(
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		this: void,
		hasDraftEntity: boolean,
		draftInProcessByUser: string,
		draftLastChangedByUser: string,
		draftInProcessByUserDesc: string,
		draftLastChangedByUserDesc: string
	): string {
		const macroResourceBundle = Library.getResourceBundleFor("sap.fe.macros");
		if (!macroResourceBundle) {
			return "";
		}
		if (hasDraftEntity) {
			const userDescription =
				draftInProcessByUserDesc || draftInProcessByUser || draftLastChangedByUserDesc || draftLastChangedByUser;

			if (!userDescription) {
				return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_UNKNOWN");
			} else {
				return draftInProcessByUser
					? macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_LOCKED_BY_KNOWN", [userDescription])
					: macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_UNSAVED_CHANGES_BY_KNOWN", [userDescription]);
			}
		} else {
			return macroResourceBundle.getText("M_FIELD_RUNTIME_DRAFT_POPOVER_NO_DATA_TEXT");
		}
	}

	/***
	 * Gets the properties of the DraftAdministrativeData entity connected to the given entity set
	 *
	 * @returns List of property names
	 */
	getDraftAdministrativeDataProperties(): string[] | undefined {
		const metaData: DataModelObjectPath<Property> | undefined = this.getDataModelObjectPath(this.contextPath);
		const draftAdminElement = metaData?.targetEntityType.navigationProperties.find((a) => a.name === "DraftAdministrativeData");
		const draftAdminProperties = draftAdminElement?.targetType.entityProperties;
		return draftAdminProperties?.map((oDraftAdminProperty) => oDraftAdminProperty.name);
	}

	/**
	 * Constructs the binding expression for the text displayed as title of the popup.
	 * @returns The binding expression
	 */
	getPopoverTitleBindingExpression(): BindingToolkitExpression<PrimitiveType> {
		return ifElse(
			not(Entity.IsActive),
			this.isHiddenDraftEnabled
				? pathInModel("M_DRAFT_POPOVER_ADMIN_UNSAVED_OBJECT", "sap.fe.i18n")
				: pathInModel("M_COMMON_DRAFT_OBJECT", "sap.fe.i18n"),
			ifElse(
				Entity.HasDraft,
				ifElse(
					not(isEmpty(pathInModel("DraftAdministrativeData/InProcessByUser"))),
					pathInModel("M_COMMON_DRAFT_LOCKED_OBJECT", "sap.fe.i18n"),
					pathInModel("M_DRAFT_POPOVER_ADMIN_UNSAVED_OBJECT", "sap.fe.i18n")
				),
				this.draftIndicatorType === ObjectMarkerVisibility.IconAndText
					? " "
					: pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_FLAGGED_OBJECT", "sap.fe.i18n")
			)
		);
	}

	/**
	 * Constructs the binding expression for the text displayed to identify the draft owner in the popup.
	 * This binding is configured to call formatDraftOwnerTextInPopover at runtime.
	 *
	 * We cannot reference formatDraftOwnerTextInPopover directly as we need to conditionally pass properties that might exist or not,
	 * and referring to non-existing properties fails the binding.
	 * @returns The binding expression
	 */
	getDraftOwnerTextBindingExpression(): {
		parts: unknown[];
		formatter: (
			hasDraftEntity: boolean,
			draftInProcessByUser: string,
			draftLastChangedByUser: string,
			draftInProcessByUserDesc: string,
			draftLastChangedByUserDesc: string
		) => string;
	} {
		const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();

		const parts = [
			{ path: "HasDraftEntity", targetType: "any" },
			{ path: "DraftAdministrativeData/InProcessByUser" },
			{ path: "DraftAdministrativeData/LastChangedByUser" }
		];
		if (draftAdministrativeDataProperties?.includes("InProcessByUserDescription")) {
			parts.push({ path: "DraftAdministrativeData/InProcessByUserDescription" });
		}
		if (draftAdministrativeDataProperties?.includes("LastChangedByUserDescription")) {
			parts.push({ path: "DraftAdministrativeData/LastChangedByUserDescription" });
		}

		//parts.push({path: "sap.fe.i18n>"})

		return { parts, formatter: DraftIndicator.formatDraftOwnerTextInPopover };
	}

	/**
	 * Creates a popover control to display draft information.
	 * @param control Control that the popover is to be created for
	 * @returns The created popover control
	 */
	createPopover(control: Control): Popover {
		const isDraftWithNoChangesBinding = and(not(Entity.IsActive), isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime")));
		const draftWithNoChangesTextBinding =
			this.draftIndicatorType === ObjectMarkerVisibility.IconAndText
				? pathInModel("M_DRAFT_POPOVER_ADMIN_GENERIC_LOCKED_OBJECT_POPOVER_TEXT", "sap.fe.i18n")
				: pathInModel("C_DRAFT_POPOVER_ADMIN_DATA_DRAFTINFO_POPOVER_NO_DATA_TEXT", "sap.fe.i18n");

		const isDraftWithChangesBinding = and(
			not(Entity.IsActive),
			not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime")))
		);
		const draftWithChangesTextBinding = {
			parts: [
				{ path: "M_DRAFT_POPOVER_ADMIN_LAST_CHANGE_TEXT", model: "sap.fe.i18n" },
				{ path: "DraftAdministrativeData/LastChangeDateTime" }
			],
			formatter: formatMessage
		};

		const isActiveInstanceBinding = and(Entity.IsActive, not(isEmpty(pathInModel("DraftAdministrativeData/LastChangeDateTime"))));
		const activeInstanceTextBinding = { ...draftWithChangesTextBinding };

		const popover: Popover = (
			<Popover
				title={this.getPopoverTitleBindingExpression()}
				showHeader={true}
				verticalScrolling={false}
				class={"sapUiContentPadding"}
				placement={"Auto"}
				endButton={
					(
						<Button
							icon={"sap-icon://decline"}
							press={(): void => {
								this.draftPopover?.close();
							}}
						/>
					) as Button
				}
			>
				<VBox class={"sapUiContentPadding"}>
					<VBox visible={isDraftWithNoChangesBinding}>
						<Text text={draftWithNoChangesTextBinding} />
					</VBox>
					<VBox visible={isDraftWithChangesBinding}>
						<Text text={draftWithChangesTextBinding} />
					</VBox>
					<VBox visible={isActiveInstanceBinding}>
						<Text text={this.getDraftOwnerTextBindingExpression()} />
						<Text class={"sapUiSmallMarginTop"} text={activeInstanceTextBinding} />
					</VBox>
				</VBox>
			</Popover>
		) as Popover;

		CommonUtils.getTargetView(control).addDependent(popover);
		return popover;
	}

	/**
	 * Handles pressing of the object marker by opening a corresponding popover.
	 * @param event Event object passed from the press event
	 */
	onObjectMarkerPressed(event: ObjectMarker$PressEvent): void {
		const source = event.getSource();
		const bindingContext = source.getBindingContext() as ODataV4Context;

		this.draftPopover ??= this.createPopover(source);

		this.draftPopover.setBindingContext(bindingContext);
		this.draftPopover.openBy(source, false);
	}

	/**
	 * Constructs the binding expression for the "additionalInfo" attribute in the "IconAndText" case.
	 * @returns The binding expression
	 */
	getIconAndTextAdditionalInfoBindingExpression(): BindingToolkitExpression<string> {
		const draftAdministrativeDataProperties = this.getDraftAdministrativeDataProperties();

		const orBindings = [];
		if (draftAdministrativeDataProperties?.includes("InProcessByUserDescription")) {
			orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUserDescription"));
		}
		orBindings.push(pathInModel("DraftAdministrativeData/InProcessByUser"));
		if (draftAdministrativeDataProperties?.includes("LastChangedByUserDescription")) {
			orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUserDescription"));
		}
		orBindings.push(pathInModel("DraftAdministrativeData/LastChangedByUser"));

		return ifElse<string>(Entity.HasDraft, or(...orBindings) as BindingToolkitExpression<string>, "");
	}

	/**
	 * Returns the content of this building block for the "IconAndText" type.
	 * @returns The control tree
	 */
	getIconAndTextContent(): ObjectMarker {
		this.isHiddenDraftEnabled = (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().HiddenDraft as HiddenDraft)
			?.enabled;
		const objMarkerType = this.isHiddenDraftEnabled ? ObjectMarkerType.Unsaved : ObjectMarkerType.Draft;
		const type = ifElse(
			not(Entity.IsActive),
			objMarkerType,
			ifElse(
				Entity.HasDraft,
				ifElse(
					pathInModel("DraftAdministrativeData/InProcessByUser"),
					ObjectMarkerType.LockedBy,
					ifElse(pathInModel("DraftAdministrativeData/LastChangedByUser"), ObjectMarkerType.UnsavedBy, ObjectMarkerType.Unsaved)
				),
				ObjectMarkerType.Flagged
			)
		);

		const visibility = ifElse(not(Entity.HasDraft), ObjectMarkerVisibility.TextOnly, ObjectMarkerVisibility.IconAndText);

		return (
			<ObjectMarker
				type={type}
				press={this.onObjectMarkerPressed.bind(this)}
				visibility={visibility}
				additionalInfo={this.getIconAndTextAdditionalInfoBindingExpression()}
				ariaLabelledBy={this.ariaLabelledBy ? this.ariaLabelledBy : []}
				class={this.class}
			/>
		) as ObjectMarker;
	}

	/**
	 * Returns the content of this building block for the "IconOnly" type.
	 * @returns The control tree
	 */
	getIconOnlyContent(): ObjectMarker {
		const type = ifElse(
			not(Entity.IsActive),
			ObjectMarkerType.Draft,
			ifElse(
				Entity.HasDraft,
				ifElse(
					!!this.usedInAnalyticalTable,
					ObjectMarkerType.Locked,
					ifElse(pathInModel("DraftAdministrativeData/InProcessByUser"), ObjectMarkerType.Locked, ObjectMarkerType.Unsaved)
				),
				ObjectMarkerType.Flagged
			)
		);

		let visible;
		if (this.usedInTable === true) {
			visible = or(not(Entity.IsActive), and(Entity.IsActive, Entity.HasDraft));
		} else {
			// If Entity.HasDraft is empty, there is no context at all, so don't show the indicator
			visible = and(
				not(isEmpty(Entity.HasDraft)),
				not(UI.IsEditable),
				Entity.HasDraft,
				not(pathInModel("DraftAdministrativeData/DraftIsCreatedByMe"))
			);
		}

		return (
			<ObjectMarker
				type={type}
				press={!this.usedInAnalyticalTable ? this.onObjectMarkerPressed.bind(this) : undefined}
				visibility={ObjectMarkerVisibility.IconOnly}
				visible={visible}
				ariaLabelledBy={this.ariaLabelledBy ? this.ariaLabelledBy : []}
				class={this.class}
			/>
		) as ObjectMarker;
	}

	/**
	 * Returns the content of this building block.
	 * @returns The control tree
	 */
	createContent(): ObjectMarker | undefined {
		if (this.draftIndicatorType === ObjectMarkerVisibility.IconAndText) {
			return this.getIconAndTextContent();
		} else {
			return this.getIconOnlyContent();
		}
	}
}
