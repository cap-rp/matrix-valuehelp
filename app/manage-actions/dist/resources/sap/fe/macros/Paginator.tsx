import { compileExpression, or, pathInModel, type CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { defineReference, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import { controllerExtensionHandler } from "sap/fe/base/HookSupport";
import type { Ref } from "sap/fe/base/jsx-runtime/jsx";
import type PageController from "sap/fe/core/PageController";
import type TemplateComponent from "sap/fe/core/TemplateComponent";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import HBox from "sap/m/HBox";
import type UI5Event from "sap/ui/base/Event";
import Element from "sap/ui/core/Element";
import InvisibleText from "sap/ui/core/InvisibleText";
import JSONModel from "sap/ui/model/json/JSONModel";
import type { default as Context, default as ODataV4Context } from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type ObjectPageHeaderActionButton from "sap/uxap/ObjectPageHeaderActionButton";

/**
 * Building block used to create a paginator control.
 *
 * Usage example:
 * <pre>
 * &lt;macros:Paginator /&gt;
 * </pre>
 * @hideconstructor
 * @public
 * @since 1.94.0
 */
@defineUI5Class("sap.fe.macros.Paginator")
export default class Paginator extends BuildingBlock<HBox> {
	/**
	 * The identifier of the Paginator control.
	 */
	@property({ type: "string" })
	public id = "";

	/**
	 * Title of the object that is readout by screen readers when the next/previous item is loaded via keyboard focus on the paginator button.
	 * @public
	 */
	@property({ type: "string" })
	public ariaTitle?: CompiledBindingToolkitExpression;

	@defineReference()
	upButton!: Ref<ObjectPageHeaderActionButton>;

	@defineReference()
	downButton!: Ref<ObjectPageHeaderActionButton>;

	@defineReference()
	upDescription!: Ref<InvisibleText>;

	@defineReference()
	downDescription!: Ref<InvisibleText>;

	protected base!: PageController;

	private paginatorModel = new JSONModel({
		navUpEnabled: false,
		navDownEnabled: false
	});

	private _oListBinding?: ODataListBinding;

	private _oCurrentContext?: Context;

	private _iCurrentIndex = -1;

	constructor(props?: PropertiesOf<Paginator>, others?: PropertiesOf<Paginator>) {
		super(props, others);
	}

	private static ObjectPageHeaderActionButton: typeof ObjectPageHeaderActionButton;

	static async load(): Promise<typeof Paginator> {
		if (Paginator.ObjectPageHeaderActionButton === undefined) {
			const { default: ObjectPageHeaderActionButton } = await import("sap/uxap/ObjectPageHeaderActionButton");
			Paginator.ObjectPageHeaderActionButton = ObjectPageHeaderActionButton;
		}
		return this;
	}

	async onMetadataAvailable(_ownerComponent: TemplateComponent): Promise<void> {
		await Paginator.load();
		this.content = this.createContent(_ownerComponent);
	}

	onModelContextChange(event: UI5Event): void {
		const source = event.getSource();
		if (source.isA<HBox>("sap.m.HBox") && this.upButton.current && this.downButton.current) {
			const context = source.getBindingContext();
			if (!context) {
				return;
			}
			this._updateDescriptionAndFocus(this.upButton.current, this.downButton.current);
		}
	}

	/**
	 * Initiates the paginator control.
	 * @param listBinding ODataListBinding object
	 * @param context Current context where the navigation is initiated
	 * @since 1.94.0
	 */
	@controllerExtensionHandler("paginator", "initialize")
	initialize(listBinding?: ODataListBinding, context?: Context): void {
		if (listBinding && (listBinding as { getAllCurrentContexts?: Function }).getAllCurrentContexts) {
			this._oListBinding = listBinding;
			listBinding.attachEvent("change", this._updateCurrentIndexAndButtonEnablement.bind(this));
		} else {
			this._oListBinding = undefined;
		}
		if (context) {
			this._oCurrentContext = context;
		}
		this._updateCurrentIndexAndButtonEnablement();
	}

	_updateCurrentIndexAndButtonEnablement(): void {
		if (this._oCurrentContext && this._oListBinding) {
			const sPath = this._oCurrentContext.getPath();
			// Storing the currentIndex in global variable
			this._iCurrentIndex = this._oListBinding?.getAllCurrentContexts()?.findIndex(function (oContext: ODataV4Context) {
				return oContext && oContext.getPath() === sPath;
			});
			const oCurrentIndexContext = this._oListBinding?.getAllCurrentContexts()?.[this._iCurrentIndex];
			if (
				(!this._iCurrentIndex && this._iCurrentIndex !== 0) ||
				!oCurrentIndexContext ||
				this._oCurrentContext.getPath() !== oCurrentIndexContext.getPath()
			) {
				this._updateCurrentIndex();
			}
		}
		this._handleButtonEnablement();
	}

	/**
	 * Handles the enablement of navigation buttons based on the current context and list binding.
	 * If applicable, updates the model properties to enable or disable the navigation buttons.
	 */
	_handleButtonEnablement(): void {
		//Enabling and Disabling the Buttons on change of the control context

		const mButtonEnablementModel = this.paginatorModel;
		if (this._oListBinding && this._oListBinding.getAllCurrentContexts()?.length > 1 && this._iCurrentIndex > -1) {
			if (this._iCurrentIndex === this._oListBinding.getAllCurrentContexts().length - 1) {
				mButtonEnablementModel.setProperty("/navDownEnabled", false);
			} else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex + 1].isInactive()) {
				//check the next context is not an inactive context
				mButtonEnablementModel.setProperty("/navDownEnabled", false);
			} else {
				mButtonEnablementModel.setProperty("/navDownEnabled", true);
			}
			if (this._iCurrentIndex === 0) {
				mButtonEnablementModel.setProperty("/navUpEnabled", false);
			} else if (this._oListBinding.getAllCurrentContexts()[this._iCurrentIndex - 1].isInactive()) {
				mButtonEnablementModel.setProperty("/navUpEnabled", false);
			} else {
				mButtonEnablementModel.setProperty("/navUpEnabled", true);
			}
		} else {
			// Don't show the paginator buttons
			// 1. When no listbinding is available
			// 2. Only '1' or '0' context exists in the listBinding
			// 3. The current index is -ve, i.e the currentIndex is invalid.
			mButtonEnablementModel.setProperty("/navUpEnabled", false);
			mButtonEnablementModel.setProperty("/navDownEnabled", false);
		}
	}

	_updateCurrentIndex(): void {
		if (this._oCurrentContext && this._oListBinding) {
			const sPath = this._oCurrentContext.getPath();
			// Storing the currentIndex in global variable
			this._iCurrentIndex = this._oListBinding?.getAllCurrentContexts()?.findIndex(function (oContext: ODataV4Context) {
				return oContext && oContext.getPath() === sPath;
			});
		}
	}

	async updateCurrentContext(iDeltaIndex: number): Promise<void> {
		if (!this._oListBinding) {
			return;
		}
		const oModel = this._oCurrentContext?.getModel ? this._oCurrentContext?.getModel() : undefined;
		//Submitting any pending changes that might be there before navigating to next context.
		await oModel?.submitBatch("$auto");
		const aCurrentContexts = this._oListBinding.getAllCurrentContexts();
		const iNewIndex = this._iCurrentIndex + iDeltaIndex;
		const oNewContext = aCurrentContexts[iNewIndex];

		if (oNewContext) {
			const bPreventIdxUpdate = (this.getPageController() as PageController)?.paginator.onBeforeContextUpdate(
				this._oListBinding,
				this._iCurrentIndex,
				iDeltaIndex
			);
			if (!bPreventIdxUpdate) {
				this._iCurrentIndex = iNewIndex;
				this._oCurrentContext = oNewContext;
			}
			(this.getPageController() as PageController)?.paginator.onContextUpdate(oNewContext);
		}
		this._handleButtonEnablement();
	}

	_updateDescriptionAndFocus(upButton: ObjectPageHeaderActionButton, downButton: ObjectPageHeaderActionButton): void {
		const focusControl = Element.getActiveElement();
		const upEnabled = upButton.getEnabled();
		const downEnabled = downButton.getEnabled();
		let upDescriptionText = "";
		let downDescriptionText = "";

		if (upEnabled && !downEnabled && focusControl === downButton) {
			// Last record in the list.
			upButton.focus();
			upDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_BOTTOM");
			downDescriptionText = "";
		} else if (downEnabled && !upEnabled && focusControl === upButton) {
			// First record in the list.
			downButton.focus();
			upDescriptionText = "";
			downDescriptionText = this.getTranslatedText("M_PAGINATOR_TITLE_TOP");
		}

		if (this.upDescription.current) {
			this.upDescription.current.setText(upDescriptionText);
		}
		if (this.downDescription.current) {
			this.downDescription.current.setText(downDescriptionText);
		}
	}

	/**
	 * The runtime building block template function.
	 * @param _ownerComponent
	 * @returns A JS-based string
	 */
	createContent(_ownerComponent: TemplateComponent): HBox {
		// The model name is hardcoded, as this building block can also be used transparently by application developers
		const navUpEnabledExpression = pathInModel("/navUpEnabled", "paginator");
		const navDownEnabledExpression = pathInModel("/navDownEnabled", "paginator");
		const visibleExpression = or(navUpEnabledExpression, navDownEnabledExpression);

		const navUpTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_UP", "sap.fe.i18n");
		const navDownTooltipExpression = pathInModel("T_PAGINATOR_CONTROL_PAGINATOR_TOOLTIP_DOWN", "sap.fe.i18n");
		const titleDescription = this.ariaTitle
			? this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_TITLE_LOADED", [this.ariaTitle])
			: this.getTranslatedText("M_PAGINATOR_ANNOUNCEMENT_OBJECT_LOADED");

		_ownerComponent.setModel(this.paginatorModel, "paginator");

		return (
			<HBox
				displayInline="true"
				id={this.createId("_box")}
				visible={compileExpression(visibleExpression)}
				modelContextChange={(event: UI5Event): void => {
					this.onModelContextChange(event);
				}}
			>
				<InvisibleText ref={this.upDescription} id={this.createId("upDescription")} />
				<InvisibleText ref={this.downDescription} id={this.createId("downDescription")} />
				<InvisibleText id={this.createId("titleDescription")} text={titleDescription} />
				<Paginator.ObjectPageHeaderActionButton
					id={this.createId("previousItem")}
					ref={this.upButton}
					enabled={compileExpression(navUpEnabledExpression)}
					tooltip={compileExpression(navUpTooltipExpression)}
					icon="sap-icon://navigation-up-arrow"
					press={async (): Promise<void> => this.updateCurrentContext(-1)}
					type="Transparent"
					importance="High"
					ariaDescribedBy={
						[this.createId("titleDescription"), this.createId("upDescription")].filter((val) => val !== undefined) as string[]
					}
				/>
				<Paginator.ObjectPageHeaderActionButton
					id={this.createId("nextItem")}
					ref={this.downButton}
					enabled={compileExpression(navDownEnabledExpression)}
					tooltip={compileExpression(navDownTooltipExpression)}
					icon="sap-icon://navigation-down-arrow"
					press={async (): Promise<void> => this.updateCurrentContext(1)}
					type="Transparent"
					importance="High"
					ariaDescribedBy={
						[this.createId("titleDescription"), this.createId("downDescription")].filter((val) => val !== undefined) as string[]
					}
				/>
			</HBox>
		);
	}
}
