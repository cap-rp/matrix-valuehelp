import type { Property } from "@sap-ux/vocabularies-types";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression } from "sap/fe/base/BindingToolkit";
import type { PropertiesOf } from "sap/fe/base/ClassSupport";
import { aggregation, defineUI5Class, property } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import type SideEffectsControllerExtension from "sap/fe/core/controllerextensions/SideEffects";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import { getResourceModel } from "sap/fe/core/helpers/ResourceModelHelper";
import type { SideEffectsEntityType } from "sap/fe/core/services/SideEffectsServiceFactory";
import * as UIFormatters from "sap/fe/core/templating/UIFormatters";
import type Avatar from "sap/m/Avatar";
import BusyDialog from "sap/m/BusyDialog";
import type Button from "sap/m/Button";
import type Link from "sap/m/Link";
import type Text from "sap/m/Text";
import type ManagedObject from "sap/ui/base/ManagedObject";
import type Control from "sap/ui/core/Control";
import type { $ControlSettings } from "sap/ui/core/Control";
import type Icon from "sap/ui/core/Icon";
import type RenderManager from "sap/ui/core/RenderManager";
import type { URI } from "sap/ui/core/library";
import type Context from "sap/ui/model/odata/v4/Context";
import type FileUploader from "sap/ui/unified/FileUploader";
import FieldWrapper from "./FieldWrapper";
type ControlWithAccessibility = Control & { addAriaLabelledBy?: (id: string) => void };

@defineUI5Class("sap.fe.macros.controls.FileWrapper")
class FileWrapper extends FieldWrapper {
	@property({ type: "sap.ui.core.URI" })
	uploadUrl!: URI;

	@property({ type: "string" })
	propertyPath!: string;

	@property({ type: "string" })
	filename!: string;

	@property({ type: "string" })
	mediaType!: string;

	@aggregation({ type: "sap.m.Avatar", multiple: false })
	avatar: Avatar | undefined;

	@aggregation({ type: "sap.ui.core.Icon", multiple: false })
	icon!: Icon;

	@aggregation({ type: "sap.m.Link", multiple: false })
	link!: Link;

	@aggregation({ type: "sap.m.Text", multiple: false })
	text!: Text;

	@aggregation({ type: "sap.ui.unified.FileUploader", multiple: false })
	fileUploader!: FileUploader;

	@aggregation({ type: "sap.m.Button", multiple: false })
	deleteButton!: Button;

	private requiredExpression?: string;

	private _fileUploaderMandatory?: Control;

	private _busy = false;

	private avatarCacheBustingInitialized = false;

	private busyDialog?: BusyDialog;

	constructor(
		id?: string | undefined | (PropertiesOf<FileWrapper> & $ControlSettings),
		settings?: PropertiesOf<FileWrapper> & $ControlSettings
	) {
		super(id as string, settings);
	}

	enhanceAccessibilityState(oElement: object, mAriaProps: object): object {
		// We do not want to pass aria-labelledby to all child controls, only use it once as a label on the wrapper with role group.
		return mAriaProps;
	}

	onBeforeRendering(): void {
		this._setAriaLabelledBy();
		this._setAriaRequired();
		this._addSideEffects();
		this._refreshAvatar();
	}

	_setAriaLabelledBy(): void {
		if (this.link) {
			const oParent = this.getParent();
			const mAriaProps: { labelledby: undefined | string } = { labelledby: undefined };

			if (oParent && (oParent as ManagedObject & { enhanceAccessibilityState?: Function }).enhanceAccessibilityState) {
				(oParent as ManagedObject & { enhanceAccessibilityState: Function }).enhanceAccessibilityState(this.link, mAriaProps);
			}

			if (mAriaProps.labelledby) {
				(this as ControlWithAccessibility).addAriaLabelledBy!(mAriaProps.labelledby);
			}
		}
	}

	/**
	 * Returns the DOMNode ID to be used for the "labelFor" attribute.
	 *
	 * We forward the call of this method to the content control.
	 * @returns ID to be used for the <code>labelFor</code>
	 */
	getIdForLabel(): string {
		// We either have a link to download the file, a text indicating an empty file, or an avatar and no link or text
		const oContent = this.link || this.text || this.avatar;
		return (oContent as Control).getIdForLabel();
	}

	/**
	 * If in the collaborative draft, send a request to reload the file.
	 */
	_refreshAvatar(): void {
		const view = CommonUtils.getTargetView(this as Control);
		const collaborativeDraft = view.getController().collaborativeDraft;
		if (collaborativeDraft.isCollaborationEnabled()) {
			const avatarBinding = this.avatar?.getBindingInfo("src").binding;
			if (avatarBinding && !this.avatarCacheBustingInitialized) {
				avatarBinding.attachEvent("change", () => {
					this.avatar?.refreshAvatarCacheBusting();
				});
				this.avatarCacheBustingInitialized = true;
			}
		}
	}

	_setAriaRequired(): void {
		const view = CommonUtils.getTargetView(this as Control),
			viewDataFullContextPath = view.getViewData().fullContextPath,
			metaModel = view.getModel().getMetaModel(),
			metaContext = metaModel.getContext(viewDataFullContextPath),
			metaPathContext = metaModel.createBindingContext(this.propertyPath, metaContext),
			dataViewModelPath = MetaModelConverter.getInvolvedDataModelObjects(metaPathContext, metaContext);

		const streamProperty = dataViewModelPath.targetObject as Property;
		this.requiredExpression = UIFormatters.getRequiredExpression(
			streamProperty,
			undefined,
			false,
			false,
			{},
			dataViewModelPath
		) as CompiledBindingToolkitExpression;
	}

	_addSideEffects(): void {
		// add control SideEffects for stream content, filename and mediatype
		const navigationProperties: SideEffectsEntityType[] = [],
			view = CommonUtils.getTargetView(this as Control),
			viewDataFullContextPath = view.getViewData().fullContextPath,
			metaModel = view.getModel().getMetaModel(),
			metaModelPath = metaModel.getMetaPath(viewDataFullContextPath),
			viewContext = metaModel.getContext(viewDataFullContextPath),
			dataViewModelPath = MetaModelConverter.getInvolvedDataModelObjects(viewContext),
			sourcePath = this.data("sourcePath") as string,
			fieldPath = sourcePath.replace(`${metaModelPath}`, ""),
			path = fieldPath.replace(this.propertyPath, "");

		navigationProperties.push({ $NavigationPropertyPath: fieldPath });
		if (this.filename) {
			navigationProperties.push({ $NavigationPropertyPath: path + this.filename });
		}
		if (this.mediaType) {
			navigationProperties.push({ $NavigationPropertyPath: path + this.mediaType });
		}
		this._getSideEffectController()?.addControlSideEffects(dataViewModelPath.targetEntityType.fullyQualifiedName, {
			sourceProperties: [fieldPath],
			targetEntities: navigationProperties,
			sourceControlId: this.getId()
		});
	}

	_getSideEffectController(): SideEffectsControllerExtension | undefined {
		const controller = this._getViewController() as PageController | undefined;
		return controller ? controller._sideEffects : undefined;
	}

	_getViewController(): PageController {
		const view = CommonUtils.getTargetView(this as Control);
		return view && view.getController();
	}

	getUploadUrl(): string {
		// set upload url as canonical url for NavigationProperties
		// this is a workaround as some backends cannot resolve NavigationsProperties for stream types
		const context = this.getBindingContext() as Context;
		return context && this.uploadUrl ? this.uploadUrl.replace(context.getPath(), context.getCanonicalPath()) : "";
	}

	setUIBusy(busy: boolean): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		this._busy = busy;
		if (busy) {
			if (!this.busyDialog) {
				this.busyDialog = new BusyDialog({
					text: getResourceModel(this).getText("M_FILEWRAPPER_BUSY_DIALOG_TITLE"),
					showCancelButton: false
				});
			}
			setTimeout(function () {
				if (that._busy) {
					that.busyDialog?.open();
				}
			}, 1000);
		} else {
			this.busyDialog?.close(false);
		}
	}

	getUIBusy(): boolean {
		return this._busy;
	}

	static render(renderManager: RenderManager, fileWrapper: FileWrapper): void {
		let innerDivMaxWidth, innerDivMinWidth;
		if (fileWrapper.avatar) {
			// The avatar has a fixed width (3rem) therefore the inner div can have a lower min width than icon and link
			innerDivMaxWidth = "100%";
			innerDivMinWidth = "3rem";
		} else {
			// Depending on display or edit mode we have to reserve some space for the file upload and delete button (2rem each + 1rem margin)
			innerDivMaxWidth = CommonUtils.getIsEditable(fileWrapper as unknown as ManagedObject) ? "calc(100% - 5rem)" : "100%";
			innerDivMinWidth = "4.5rem";
		}

		renderManager.openStart("div", fileWrapper); // FileWrapper control div
		renderManager.style("width", fileWrapper.width);
		renderManager.openEnd();

		// Outer Box
		renderManager.openStart("div"); // div for all controls
		renderManager.style("display", "flex");
		renderManager.style("box-sizing", "border-box");
		renderManager.style("justify-content", "space-between");
		renderManager.style("align-items", "center");
		renderManager.style("flex-wrap", "wrap");
		renderManager.style("align-content", "stretch");
		renderManager.style("width", "100%");
		renderManager.openEnd();

		// Display Mode
		renderManager.openStart("div"); // div for controls shown in Display mode
		renderManager.style("display", "flex");
		renderManager.style("align-items", "center");
		renderManager.style("max-width", innerDivMaxWidth);
		renderManager.style("min-width", innerDivMinWidth);
		renderManager.openEnd();

		if (fileWrapper.avatar) {
			renderManager.renderControl(fileWrapper.avatar); // render the Avatar Control
		} else {
			renderManager.renderControl(fileWrapper.icon); // render the Icon Control
			renderManager.renderControl(fileWrapper.link);
			if (
				fileWrapper.requiredExpression &&
				fileWrapper.requiredExpression === compileExpression(UI.IsEditable) &&
				CommonUtils.getIsEditable(fileWrapper as unknown as ManagedObject)
			) {
				renderManager.accessibilityState(fileWrapper.link, { required: true, labelledby: fileWrapper.ariaLabelledBy[0] });
			} else {
				renderManager.accessibilityState(fileWrapper.link, { labelledby: fileWrapper.ariaLabelledBy[0] });
			}
			renderManager.renderControl(fileWrapper.text); // render the Text Control for empty file indication
		}
		renderManager.close("div"); // div for controls shown in Display mode

		// Additional content for Edit Mode
		renderManager.openStart("div"); // div for controls shown in Display + Edit mode
		renderManager.style("display", "flex");
		renderManager.style("align-items", "center");
		renderManager.openEnd();
		renderManager.renderControl(fileWrapper.fileUploader); // render the FileUploader Control
		renderManager.renderControl(fileWrapper.deleteButton); // render the Delete Button Control
		renderManager.close("div"); // div for controls shown in Display + Edit mode

		renderManager.close("div"); // div for all controls

		renderManager.close("div"); // end of the complete Control
	}

	destroy(bSuppressInvalidate: boolean): void {
		const oSideEffects = this._getSideEffectController();
		if (oSideEffects) {
			oSideEffects.removeControlSideEffects(this);
		}
		delete this.busyDialog;
		FieldWrapper.prototype.destroy.apply(this, [bSuppressInvalidate]);
	}
}

export default FileWrapper;
