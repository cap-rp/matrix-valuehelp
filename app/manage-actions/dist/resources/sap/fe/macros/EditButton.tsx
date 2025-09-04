import type { EntityType } from "@sap-ux/vocabularies-types";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { and, compileExpression, constant, equal, getExpressionFromAnnotation, ifElse, not, or } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, property, type EnhanceWithUI5 } from "sap/fe/base/ClassSupport";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import CommandExecution from "sap/fe/core/controls/CommandExecution";
import type MetaPath from "sap/fe/core/helpers/MetaPath";
import type Field from "sap/fe/macros/Field";
import EasyFillDialog from "sap/fe/macros/ai/EasyFillDialog";
import Button from "sap/m/Button";
import Menu from "sap/m/Menu";
import MenuButton from "sap/m/MenuButton";
import MenuItem from "sap/m/MenuItem";
import { ButtonType } from "sap/m/library";
import type ManagedObject from "sap/ui/base/ManagedObject";

@defineUI5Class("sap.fe.macros.EditButton")
export default class EditButton extends BuildingBlock<Button, { enabled: boolean }> {
	@property({ type: "string" })
	text?: string;

	@property({ type: "boolean", bindToState: true })
	enabled?: boolean;

	onMetadataAvailable(_ownerComponent: TemplateComponent): void {
		super.onMetadataAvailable(_ownerComponent);
		this.content = this.createContent();
	}

	buildEmphasizedButtonExpression(metaPath: MetaPath<EntityType> | null): CompiledBindingToolkitExpression {
		const identification = metaPath?.getTarget()?.annotations?.UI?.Identification;
		const dataFieldsWithCriticality =
			identification?.filter((dataField) => dataField.$Type === UIAnnotationTypes.DataFieldForAction && dataField.Criticality) || [];

		const dataFieldsBindingExpressions = dataFieldsWithCriticality.length
			? dataFieldsWithCriticality.map((dataField) => {
					const criticalityVisibleBindingExpression = getExpressionFromAnnotation(dataField.Criticality);
					return and(
						not(equal(getExpressionFromAnnotation(dataField.annotations?.UI?.Hidden), true)),
						or(
							equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Negative"),
							equal(criticalityVisibleBindingExpression, "1"),
							equal(criticalityVisibleBindingExpression as BindingToolkitExpression<number>, 1),
							equal(criticalityVisibleBindingExpression, "UI.CriticalityType/Positive"),
							equal(criticalityVisibleBindingExpression, "3"),
							equal(criticalityVisibleBindingExpression as BindingToolkitExpression<number>, 3)
						)
					);
			  })
			: ([constant(false)] as BindingToolkitExpression<boolean>[]);

		// If there is at least one visible dataField with criticality negative or positive, the type is set as Ghost
		// else it is emphasized
		return compileExpression(ifElse(or(...dataFieldsBindingExpressions), ButtonType.Ghost, ButtonType.Emphasized));
	}

	async _easyEditDocument(): Promise<void> {
		if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
			const controller = this.getPageController();
			const view = controller.getView();
			if (!this.getPageController()?.getModel("ui").getProperty("/isEditable")) {
				await controller.editFlow.editDocument.apply(controller.editFlow, [view?.getBindingContext()]);
			}
			// Open easy create dialog
			const easyEditDialog = this.getPageController()
				.getOwnerComponent()
				?.runAsOwner(() => {
					return new EasyFillDialog({ getEditableFields: this._getEditableFields.bind(this) });
				});

			easyEditDialog.open();
			view?.addDependent(easyEditDialog);
		}
	}

	async _getEditableFields(): Promise<unknown> {
		// Connect all sections
		const allFields = this.getPageController()
			.getView()
			?.findAggregatedObjects(true, (control: ManagedObject): boolean => {
				return control.isA("sap.fe.macros.Field");
			}) as EnhanceWithUI5<Field>[];
		const editableFields: Record<string, { isEditable: boolean }> = {};
		allFields.forEach((field) => {
			const propertyRelativePath = field.getMainPropertyRelativePath();
			if (propertyRelativePath) {
				editableFields[propertyRelativePath] = { isEditable: field.getEditable() };
			}
		});
		return Promise.resolve(editableFields);
	}

	_createId(id: string): string {
		return this.getPageController().getView().createId(id);
	}

	createContent(): Button {
		const metaPathObject = this.getMetaPathObject<EntityType>(this.getOwnerContextPath()!);
		if (this.getAppComponent()?.getEnvironmentCapabilities().getCapabilities().EasyEdit) {
			this.getPageController()
				.getView()
				?.addDependent(<CommandExecution execute={this._easyEditDocument.bind(this)} command="EasyEdit" />);
			return (
				<MenuButton
					id={this._createId("fe::StandardAction::EditMenu")}
					enabled={this.bindState("enabled")}
					type={this.buildEmphasizedButtonExpression(metaPathObject)}
					dt:designtime="not-adaptable"
					text={this.text}
					jsx:command={"cmd:Edit|defaultAction"}
					buttonMode="Split"
					useDefaultActionOnly="true"
				>
					<Menu>
						<MenuItem
							id={this._createId("fe::StandardAction::Edit")}
							icon="sap-icon://edit"
							text="{sap.fe.i18n>C_COMMON_OBJECT_PAGE_EDIT}"
							jsx:command="cmd:Edit|press"
						/>
						<MenuItem
							id={this._createId("fe::StandardAction::EasyEdit")}
							icon="sap-icon://ai"
							jsx:command="cmd:EasyEdit|press"
							text={this.getTranslatedText("C_EASYEDIT_BUTTON")}
						/>
					</Menu>
				</MenuButton>
			);
		} else {
			return (
				<Button
					id={this._createId("fe::StandardAction::Edit")}
					dt:designtime="not-adaptable"
					text={this.text}
					type={this.buildEmphasizedButtonExpression(metaPathObject)}
					jsx:command="cmd:Edit|press"
					enabled={this.bindState("enabled")}
				/>
			) as Button;
		}
	}
}
