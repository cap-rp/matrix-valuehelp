import type ResourceBundle from "sap/base/i18n/ResourceBundle";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, event, property } from "sap/fe/base/ClassSupport";
import jsx from "sap/fe/base/jsx-runtime/jsx";
import Button from "sap/m/Button";
import { ButtonType } from "sap/m/library";
import Control from "sap/ui/core/Control";
import Lib from "sap/ui/core/Lib";
import type RenderManager from "sap/ui/core/RenderManager";
import type { EventHandler } from "types/extension_types";

/**
 * Control to indicate the possibility to edit an element inline, and to save or discard the changes after editing.
 * @experimental This class is experimental and provides only limited functionality. Also the API might be changed in future.
 */
@defineUI5Class("sap.fe.controls.inlineEdit.InlineEditIndicator")
export default class InlineEditIndicator extends Control {
	@aggregation({ type: "sap.m.Button" })
	private editButton: Button;

	@aggregation({ type: "sap.m.Button" })
	private saveButton: Button;

	@aggregation({ type: "sap.m.Button" })
	private discardButton: Button;

	@property({ type: "boolean" })
	editMode = false;

	@event()
	pressEdit?: EventHandler;

	@event()
	mouseout?: EventHandler;

	private width?: number;

	private resourceBundle?: ResourceBundle;

	constructor(idOrSettings?: PropertiesOf<InlineEditIndicator> | string, settings?: PropertiesOf<InlineEditIndicator>) {
		super(idOrSettings as string | undefined, settings);
		this.resourceBundle = Lib.getResourceBundleFor("sap.fe.controls")!;
		this.editButton = (
			<Button
				icon="sap-icon://edit"
				type={ButtonType.Transparent}
				press={(_ev): void => {
					this.fireEvent("pressEdit");
				}}
				tooltip={this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_EDIT")}
			/>
		);

		this.saveButton = (
			<Button
				icon="sap-icon://accept"
				type={ButtonType.Transparent}
				jsx:command="cmd:Save|press"
				fieldGroupIds="InlineEdit"
				tooltip={this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_SAVE")}
			/>
		);

		this.discardButton = (
			<Button
				icon="sap-icon://decline"
				type={ButtonType.Transparent}
				jsx:command="cmd:Cancel|press"
				tooltip={this.resourceBundle.getText("M_INLINE_EDIT_TOOLTIP_CANCEL")}
				fieldGroupIds="InlineEdit"
			/>
		);
		//IntervalTrigger.addListener(this.onAfterRendering, this)
	}

	/*
	 * Add aria-describedBy element to the edit button
	 * @param ariaDescribedByElement - Element to be added as ariaDescribedBy
	 * */
	addEditButtonAriaDescribedBy(ariaDescribedByElement: string | Control): void {
		if (ariaDescribedByElement !== undefined && ariaDescribedByElement !== null && ariaDescribedByElement !== "") {
			this.editButton.addAriaDescribedBy(ariaDescribedByElement);
		}
	}

	/*
	 * Remove all aria-describedBy elements from the edit button
	 * */
	removeAllEditButtonAriaDescribedBy(): void {
		this.editButton.removeAllAriaDescribedBy();
	}

	onmouseout(mouseEvent: MouseEvent): void {
		if (!(mouseEvent.currentTarget as Element)?.contains(mouseEvent.relatedTarget as Element)) {
			this.fireEvent("mouseout", { relatedTarget: mouseEvent.relatedTarget });
		}
	}

	onkeydown(e: KeyboardEvent): void {
		if (e.key === "Tab" && !e.shiftKey) {
			e.preventDefault();
			this.fireEvent("pressTab");
		} else if (e.key === "Tab" && e.shiftKey) {
			e.preventDefault();
			this.fireEvent("pressShiftTab");
		}
	}

	setWidth(width: number): void {
		this.width = width;
		this.$().css("width", `${width}px`);
	}

	getDiscardButton(): Button {
		return this.discardButton;
	}

	getSaveButton(): Button {
		return this.saveButton;
	}

	getEditButton(): Button {
		return this.editButton;
	}

	static render(rm: RenderManager, control: InlineEditIndicator): void {
		jsx.renderUsingRenderManager(rm, control, function () {
			const classes = ["sapFeInlineEditIndicator"];
			if (control.editMode) {
				classes.push("sapFeInlineEditIndicatorEditMode");
			}
			return (
				<span class={classes.join(" ")} ref={control}>
					{!control.editMode ? (
						<span class={"sapFeInlineEditIndicatorIcon"}>{control.editButton}</span>
					) : (
						<span class={"sapFeInlineEditIndicatorAcceptDeclineIcon sapFeInlineEditIndicatorIcon"}>
							{control.saveButton}
							{control.discardButton}
						</span>
					)}
				</span>
			);
		});
	}
}
