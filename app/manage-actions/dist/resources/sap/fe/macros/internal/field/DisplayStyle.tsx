import type { Action, PathAnnotationExpression, Property, PropertyAnnotationValue } from "@sap-ux/vocabularies-types";
import type {
	DataField,
	DataFieldAbstractTypes,
	DataFieldForAction,
	DataFieldTypes,
	DataFieldWithUrl,
	DataPointType
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import uid from "sap/base/util/uid";
import type { BindingToolkitExpression, CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import {
	and,
	compileExpression,
	constant,
	equal,
	formatResult,
	getExpressionFromAnnotation,
	ifElse,
	isPathInModelExpression,
	not,
	pathInModel,
	resolveBindingString
} from "sap/fe/base/BindingToolkit";
import FormElementWrapper from "sap/fe/core/controls/FormElementWrapper";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import valueFormatters from "sap/fe/core/formatters/ValueFormatter";
import { UI } from "sap/fe/core/helpers/BindingHelper";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import {
	buildExpressionForCriticalityButtonType,
	buildExpressionForCriticalityColor,
	buildExpressionForCriticalityIcon
} from "sap/fe/core/templating/CriticalityFormatters";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { enhanceDataModelPath, getContextRelativeTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { hasValidAnalyticalCurrencyOrUnit } from "sap/fe/core/templating/UIFormatters";
import FieldHelper from "sap/fe/macros/field/FieldHelper";
import * as FieldTemplating from "sap/fe/macros/field/FieldTemplating";
import type { FieldBlockProperties } from "sap/fe/macros/internal/field/FieldStructureHelper";
import QuickView from "sap/fe/macros/quickView/QuickView";
import Avatar from "sap/m/Avatar";
import Button from "sap/m/Button";
import ExpandableText from "sap/m/ExpandableText";
import HBox from "sap/m/HBox";
import ImageCustomData from "sap/m/ImageCustomData";
import Label from "sap/m/Label";
import type { Link$PressEvent } from "sap/m/Link";
import Link from "sap/m/Link";
import ObjectIdentifier from "sap/m/ObjectIdentifier";
import ObjectStatus from "sap/m/ObjectStatus";
import Text from "sap/m/Text";
import VBox from "sap/m/VBox";
import { LinkAccessibleRole, ObjectMarkerVisibility } from "sap/m/library";
import type Event from "sap/ui/base/Event";
import type EventProvider from "sap/ui/base/EventProvider";
import type Control from "sap/ui/core/Control";
import type { Control$ValidateFieldGroupEvent } from "sap/ui/core/Control";
import CustomData from "sap/ui/core/CustomData";
import Icon from "sap/ui/core/Icon";
import type MdcLink from "sap/ui/mdc/Link";
import FieldEditMode from "sap/ui/mdc/enums/FieldEditMode";
import type Context from "sap/ui/model/odata/v4/Context";
import type {
	FileUploader$ChangeEvent,
	FileUploader$FileSizeExceedEvent,
	FileUploader$TypeMissmatchEvent,
	FileUploader$UploadCompleteEvent,
	FileUploader$UploadStartEvent
} from "sap/ui/unified/FileUploader";
import FileUploader from "sap/ui/unified/FileUploader";
import FileUploaderHttpRequestMethod from "sap/ui/unified/FileUploaderHttpRequestMethod";
import Contact from "../../contact/Contact";
import Email from "../../contact/Email";
import ConditionalWrapper from "../../controls/ConditionalWrapper";
import FileWrapper from "../../controls/FileWrapper";
import TextLink from "../../controls/TextLink";
import DraftIndicator from "../../draftIndicator/DraftIndicator";
import SituationsIndicator from "../../situations/SituationsIndicator";
import DataPoint from "../DataPoint";
import type { DisplayStyle as DisplayStyleType } from "./FieldStyles";

const DisplayStyle = {
	getPrecisionForCurrency(field: FieldBlockProperties): number {
		let scale = field.property.scale ?? 5;
		if (typeof scale !== "number") {
			// Scale can be "variable" but it's not typed as such. In this case, Scale equals the precision
			scale = field.property.precision ?? 5;
		}
		return Math.min(scale, 5);
	},

	getCurrencyOrUnitControl(
		field: FieldBlockProperties,
		currencyOrUnit: string | Control,
		visibleExpression?: BindingToolkitExpression<boolean>
	): Control {
		return (
			<Link
				core:require="{FIELDRUNTIME: 'sap/fe/macros/field/FieldRuntime'}"
				text="{sap.fe.i18n>M_TABLE_SHOW_DETAILS}"
				press={field.eventHandlers.displayAggregationDetails}
				visible={visibleExpression}
			>
				{{
					dependents: (currencyOrUnit as Control)?.clone ? (currencyOrUnit as Control).clone() : currencyOrUnit
				}}
			</Link>
		);
	},

	/**
	 * Generates the NumberWithUnitOrCurrencyAligned template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getNumberWithUnitOrCurrencyAlignedTemplate(field: FieldBlockProperties): string {
		// We don't display anything if the value is undefined
		const relativePropertyPath = getContextRelativeTargetObjectPath(field.dataModelPath);
		const overallVisible = not(equal(pathInModel(relativePropertyPath), undefined));
		const currency = (
			<HBox renderType="Bare" justifyContent="End" class="sapFeControlsUnitCurrencyHbox">
				<Text
					textDirection="LTR"
					wrapping="false"
					textAlign="End"
					class="sapUiTinyMarginEnd"
					text={field.valueAsStringBindingExpression}
				></Text>
				<Text textDirection="LTR" wrapping="false" textAlign="End" text={field.unitBindingExpression} width="3.3em"></Text>
			</HBox>
		);
		if (field.formatOptions.isAnalytics) {
			return (
				<ConditionalWrapper visible={field.displayVisible} condition={field.hasValidAnalyticalCurrencyOrUnit as unknown as boolean}>
					{{
						contentTrue: currency,
						contentFalse: this.getCurrencyOrUnitControl(field, currency, overallVisible)
					}}
				</ConditionalWrapper>
			);
		} else {
			return currency;
		}
	},

	/**
	 * Generates the Avatar template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getAvatarTemplate(field: FieldBlockProperties): string {
		let avatarId;
		if (field._flexId) {
			avatarId = field._flexId;
		} else if (field.idPrefix) {
			avatarId = generate([field.idPrefix, "Field-content"]);
		}

		const avatarVisible = FieldTemplating.getVisibleExpression(field.dataModelPath as DataModelObjectPath<DataPointType>);

		const avatarSrc = FieldTemplating.getValueBinding(field.dataModelPath, {});
		const avatarDisplayShape = FieldTemplating.getAvatarShape(field.dataModelPath);

		return (
			<FormElementWrapper visible={avatarVisible}>
				<Avatar
					id={avatarId}
					src={avatarSrc}
					displaySize="S"
					class="sapUiSmallMarginEnd"
					imageFitType="Cover"
					displayShape={avatarDisplayShape}
				/>
			</FormElementWrapper>
		);
	},

	/**
	 * Generates the button template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getButtonTemplate: (field: FieldBlockProperties): string => {
		const icon = field.formatOptions?.showIconUrl ?? false ? (field.convertedMetaPath as DataFieldTypes).IconUrl : undefined;
		const text = !(field.formatOptions?.showIconUrl ?? false) ? (field.convertedMetaPath as DataFieldTypes).Label : undefined;
		const tooltip = field.formatOptions?.showIconUrl ?? false ? (field.convertedMetaPath as DataFieldTypes).Label : undefined;

		let buttonPress;
		let buttonIsBound;
		let buttonOperationAvailable;
		let buttonOperationAvailableFormatted;
		let navigationAvailable;

		if (field.convertedMetaPath.$Type === UIAnnotationTypes.DataFieldForAction) {
			buttonPress = field.eventHandlers.onDataFieldActionButton;

			buttonIsBound = field.convertedMetaPath.ActionTarget ? field.convertedMetaPath.ActionTarget.isBound : true;
			buttonOperationAvailable = field.convertedMetaPath.ActionTarget
				? field.convertedMetaPath.ActionTarget.annotations?.Core?.OperationAvailable
				: "false";
			buttonOperationAvailableFormatted = field.convertedMetaPath.ActionTarget ? undefined : "false";

			if (buttonOperationAvailable && buttonOperationAvailable !== "false") {
				const actionTarget = field.convertedMetaPath.ActionTarget as Action;
				const bindingParamName = actionTarget.parameters[0].name;
				//QUALMS, needs to be checked whether this makes sense at that place, might be good in a dedicated helper function
				buttonOperationAvailableFormatted = compileExpression(
					getExpressionFromAnnotation(
						buttonOperationAvailable as PropertyAnnotationValue<boolean>,
						[],
						undefined,
						(path: string) => {
							if (path.startsWith(bindingParamName)) {
								return path.replace(bindingParamName + "/", "");
							}
							return path;
						}
					)
				);
			}
		}

		if (field.convertedMetaPath.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) {
			buttonPress = field.eventHandlers.onDataFieldWithIBN;
			navigationAvailable = true;
			if (
				field.convertedMetaPath?.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation &&
				field.convertedMetaPath.NavigationAvailable !== undefined &&
				String(field.formatOptions.ignoreNavigationAvailable) !== "true"
			) {
				navigationAvailable = compileExpression(getExpressionFromAnnotation(field.convertedMetaPath.NavigationAvailable));
			}
		}

		let button = "";
		if (field.convertedMetaPath.$Type === UIAnnotationTypes.DataFieldForIntentBasedNavigation) {
			button = (
				<Button
					visible={field.visible}
					text={text}
					icon={icon}
					enabled={navigationAvailable}
					tooltip={tooltip}
					press={buttonPress as unknown as ((oEvent: Event<object, EventProvider>) => void) | undefined}
				/>
			);
		} else if (
			FieldHelper.isDataFieldActionButtonVisible(
				field.convertedMetaPath,
				buttonIsBound,
				buttonOperationAvailable as boolean | undefined
			)
		) {
			let enabled: string | CompiledBindingToolkitExpression = FieldHelper.isDataFieldActionButtonEnabled(
				field.convertedMetaPath as DataFieldForAction,
				buttonIsBound as unknown as boolean,
				buttonOperationAvailable,
				buttonOperationAvailableFormatted as string
			);

			if (field.formatOptions.isAnalyticalAggregatedRow) {
				enabled = compileExpression(and(resolveBindingString(enabled), UI.isNodeLevelNavigable));
			}

			const type = buildExpressionForCriticalityButtonType(field.dataModelPath as DataModelObjectPath<DataPointType>);

			button = (
				<Button
					class={field.class}
					text={text}
					icon={icon}
					tooltip={tooltip}
					press={buttonPress as unknown as ((oEvent: Event<object, EventProvider>) => void) | undefined}
					enabled={enabled}
					visible={field.visible}
					type={type}
				/>
			);
		}
		return button;
	},

	/**
	 * Generates the Contact template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getContactTemplate(field: FieldBlockProperties): string {
		const contactMetaPath = field.metaPath.getModel().createBindingContext("Target/$AnnotationPath", field.metaPath);
		const contactVisible = FieldTemplating.getVisibleExpression(field.dataModelPath as DataModelObjectPath<DataPointType>);

		return (
			<Contact
				idPrefix={field.idPrefix}
				ariaLabelledBy={field.ariaLabelledBy}
				metaPath={contactMetaPath.getPath()}
				contextPath={field.contextPath.getPath()}
				_flexId={field._flexId}
				visible={contactVisible}
				showEmptyIndicator={field.formatOptions.showEmptyIndicator}
			/>
		);
	},

	/**
	 * Generates the innerpart of the data point to be used in getDataPointTemplate.
	 * @param field Reference to the current field instance
	 * @param withConditionalWrapper Boolean value to determine whether the DataPoint
	 * 					  			shall be generated for the conditional wrapper case
	 * @returns An XML-based string with the definition of the field control
	 */
	getDataPointInnerPart(field: FieldBlockProperties, withConditionalWrapper: boolean): string {
		const convertedDataField = MetaModelConverter.convertMetaModelContext(field.metaPath) as DataFieldAbstractTypes;

		const metaPath =
			convertedDataField.$Type === UIAnnotationTypes.DataFieldForAnnotation
				? field.metaPath.getModel().createBindingContext("Target/$AnnotationPath", field.metaPath)
				: field.metaPath;

		const formatOptions = {
			measureDisplayMode: field.formatOptions.measureDisplayMode,
			showEmptyIndicator: field.formatOptions.showEmptyIndicator
		};

		return (
			<DataPoint
				idPrefix={withConditionalWrapper ? undefined : field.idPrefix}
				visible={(!withConditionalWrapper ? field.displayVisible : undefined) as unknown as string | undefined}
				ariaLabelledBy={field.ariaLabelledBy ? field.ariaLabelledBy : undefined}
				metaPath={metaPath.getPath()}
				contextPath={field.contextPath?.getPath()}
				value={field.value}
			>
				{{
					formatOptions: { formatOptions }
				}}
			</DataPoint>
		);
	},

	/**
	 * Generates the DataPoint template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getDataPointTemplate(field: FieldBlockProperties): string {
		if ((field.formatOptions.isAnalytics ?? false) && (field.hasUnitOrCurrency ?? false)) {
			return (
				<ConditionalWrapper visible={field.displayVisible} condition={field.hasValidAnalyticalCurrencyOrUnit as unknown as boolean}>
					{{
						contentTrue: this.getDataPointInnerPart(field, true),
						contentFalse: this.getCurrencyOrUnitControl(field, this.getDataPointInnerPart(field, true))
					}}
				</ConditionalWrapper>
			);
		} else {
			return this.getDataPointInnerPart(field, false);
		}
	},

	/**
	 * Generates the ExpandableText template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getExpandableText(field: FieldBlockProperties): string {
		return (
			<ExpandableText
				id={field?.displayStyleId}
				visible={field?.displayVisible}
				text={field.text}
				overflowMode={field?.formatOptions?.textExpandBehaviorDisplay}
				maxCharacters={field?.formatOptions?.textMaxCharactersDisplay}
				emptyIndicatorMode={field?.emptyIndicatorMode}
			/>
		);
	},

	/**
	 * Generates the File template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getFileTemplate(field: FieldBlockProperties): string {
		let innerFilePart;

		const fileStreamNotEmpty = compileExpression(
			not(equal(pathInModel(`${field.fileRelativePropertyPath}@odata.mediaContentType`), null))
		);

		const fileFilenameExpression = field.fileFilenameExpression ? "{ path: '" + field.fileFilenameExpression + "' }" : "";

		// FileWrapper
		const fileUploadUrl = FieldTemplating.getValueBinding(field.dataModelPath, {});
		const fileFilenamePath = (field.property.annotations.Core?.ContentDisposition?.Filename as PathAnnotationExpression<string>)?.path;
		const fileMediaType =
			field.property.annotations.Core?.MediaType &&
			compileExpression(getExpressionFromAnnotation(field.property.annotations.Core?.MediaType));

		// template:if
		const fileIsImage =
			!!field.property.annotations.UI?.IsImageURL ||
			!!field.property.annotations.UI?.IsImage ||
			/image\//i.test(field.property.annotations.Core?.MediaType?.toString() ?? "");

		// Avatar
		const fileAvatarSrc = FieldTemplating.getValueBinding(field.dataModelPath, {});
		const fileAvatarDisplayShape = FieldTemplating.getAvatarShape(field.dataModelPath);

		// Icon
		const fileIconSrc = FieldHelper.getPathForIconSource(field.fileRelativePropertyPath);

		// Link
		const fileLinkText = FieldHelper.getFilenameExpr(fileFilenameExpression, "{sap.fe.i18n>M_FIELD_FILEUPLOADER_NOFILENAME_TEXT}");
		const fileLinkHref = FieldHelper.getDownloadUrl(fileUploadUrl ?? "");

		// Text
		const fileTextVisible = compileExpression(equal(pathInModel(`${field.fileRelativePropertyPath}@odata.mediaContentType`), null));

		let fileAcceptableMediaTypes;
		// FileUploader
		if (field.property.annotations.Core?.AcceptableMediaTypes) {
			const acceptedTypes = Array.from(field.property.annotations.Core.AcceptableMediaTypes as unknown as string[]).map(
				(type) => `'${type}'`
			);
			fileAcceptableMediaTypes = `{=odata.collection([${acceptedTypes.join(",")}])}`; // This does not feel right, but follows the logic of AnnotationHelper#value
		}
		const fileMaximumSize = FieldHelper.calculateMBfromByte(field.property.maxLength);

		if (fileIsImage) {
			innerFilePart = {
				avatar: (
					<Avatar
						visible={field.displayVisible}
						src={fileAvatarSrc}
						displaySize="S"
						class="sapUiSmallMarginEnd"
						imageFitType="Cover"
						displayShape={fileAvatarDisplayShape}
					>
						{{
							customData: <ImageCustomData paramName="xcache" />
						}}
					</Avatar>
				)
			};
		} else {
			innerFilePart = {
				icon: <Icon src={fileIconSrc} class="sapUiSmallMarginEnd" visible={fileStreamNotEmpty} />,
				link: <Link text={fileLinkText} target="_blank" href={fileLinkHref} visible={fileStreamNotEmpty} wrapping="true" />,
				text: <Text emptyIndicatorMode={field.emptyIndicatorMode} text="" visible={fileTextVisible} />
			};
		}

		if ((field.editMode ?? field.computedEditMode) !== FieldEditMode.Display) {
			const beforeDialogOpen = field.collaborationEnabled ? field.eventHandlers.handleOpenUploader : undefined;
			const afterDialogOpen = field.collaborationEnabled ? field.eventHandlers.handleCloseUploader : undefined;

			innerFilePart = {
				...innerFilePart,
				fileUploader: (
					<FileUploader
						name="FEV4FileUpload"
						visible={field.editableExpression}
						buttonOnly="true"
						iconOnly="true"
						multiple="false"
						tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_UPLOAD_BUTTON_TOOLTIP}"
						icon="sap-icon://upload"
						style="Transparent"
						sendXHR="true"
						useMultipart="false"
						sameFilenameAllowed="true"
						mimeType={fileAcceptableMediaTypes}
						typeMissmatch={
							field.eventHandlers.handleTypeMissmatch as unknown as (oEvent: FileUploader$TypeMissmatchEvent) => void
						}
						maximumFileSize={fileMaximumSize}
						fileSizeExceed={
							field.eventHandlers.handleFileSizeExceed as unknown as (oEvent: FileUploader$FileSizeExceedEvent) => void
						}
						uploadOnChange="false"
						uploadComplete={
							field.eventHandlers.handleUploadComplete as unknown as (oEvent: FileUploader$UploadCompleteEvent) => void
						}
						httpRequestMethod={field.isDynamicInstantiation ? FileUploaderHttpRequestMethod.Put : "Put"}
						change={field.eventHandlers.uploadStream as unknown as (oEvent: FileUploader$ChangeEvent) => void}
						beforeDialogOpen={beforeDialogOpen as unknown as (oEvent: Event) => void}
						afterDialogClose={afterDialogOpen as unknown as (oEvent: Event) => void}
						uploadStart={field.eventHandlers.handleOpenUploader as unknown as (oEvent: FileUploader$UploadStartEvent) => void}
					/>
				),
				deleteButton: (
					<Button
						icon="sap-icon://sys-cancel"
						type="Transparent"
						press={field.eventHandlers.removeStream as unknown as (oEvent: Event) => void}
						tooltip="{sap.fe.i18n>M_FIELD_FILEUPLOADER_DELETE_BUTTON_TOOLTIP}"
						visible={field.editableExpression}
						enabled={fileStreamNotEmpty}
					/>
				)
			};
		}

		return (
			<FileWrapper
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				visible={field.visible}
				uploadUrl={fileUploadUrl}
				propertyPath={field.fileRelativePropertyPath}
				filename={fileFilenamePath}
				mediaType={fileMediaType}
				fieldGroupIds={field.fieldGroupIds}
				validateFieldGroup={field.eventHandlers.validateFieldGroup as (oEvent: Control$ValidateFieldGroupEvent) => void}
			>
				{{
					customData: <CustomData key="sourcePath" value={field.dataSourcePath} />,
					innerFilePart
				}}
			</FileWrapper>
		);
	},

	/**
	 * Generates the Link template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLinkTemplate(field: FieldBlockProperties): string {
		let linkUrl;
		let iconUrl;
		let linkActived;
		type LinkTarget = "_blank" | "_self" | "_top" | "_parent";
		let linkTarget: LinkTarget | undefined;

		switch (field.convertedMetaPath.$Type as string) {
			case UIAnnotationTypes.DataFieldWithIntentBasedNavigation:
				return (
					<Link
						id={field.displayStyleId}
						visible={field.displayVisible}
						text={DisplayStyle.computeTextWithWhiteSpace(field)}
						press={field.eventHandlers.onDataFieldWithIBN as unknown as (oEvent: Link$PressEvent) => void}
						ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
						emptyIndicatorMode={field.emptyIndicatorMode}
						class="sapMTextRenderWhitespaceWrap"
						accessibleRole={LinkAccessibleRole.Button}
					/>
				);
			case UIAnnotationTypes.DataFieldWithNavigationPath:
				return (
					<Link
						id={field.displayStyleId}
						core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
						visible={field.displayVisible}
						text={field.text}
						press={field.eventHandlers.onDataFieldWithNavigationPath as unknown as (oEvent: Link$PressEvent) => void}
						enabled={field.formatOptions.isAnalyticalAggregatedRow ? UI.isNodeLevelNavigable : undefined}
						ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
						emptyIndicatorMode={field.emptyIndicatorMode}
						class="sapMTextRenderWhitespaceWrap"
					/>
				);
			case UIAnnotationTypes.DataFieldWithAction:
				return (
					<Link
						id={field.displayStyleId}
						visible={field.displayVisible}
						text={field.text}
						press={field.eventHandlers.onDataFieldActionButton as unknown as (oEvent: Link$PressEvent) => void}
						enabled={field.formatOptions.isAnalyticalAggregatedRow ? UI.isNodeLevelNavigable : undefined}
						ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
						emptyIndicatorMode={field.emptyIndicatorMode}
						class="sapMTextRenderWhitespaceWrap"
						accessibleRole={LinkAccessibleRole.Button}
					/>
				);
			case UIAnnotationTypes.DataFieldWithUrl:
				const html5LinkTarget = field.property.annotations.HTML5?.LinkTarget;
				field.text = DisplayStyle.computeTextWithWhiteSpace(field);
				iconUrl = (field.convertedMetaPath as DataFieldTypes).IconUrl
					? compileExpression(
							getExpressionFromAnnotation(
								(field.convertedMetaPath as DataFieldTypes).IconUrl as unknown as PropertyAnnotationValue<String>
							)
					  )
					: undefined;
				const linkBinding = getExpressionFromAnnotation(
					(field.convertedMetaPath as DataFieldWithUrl).Url as unknown as PropertyAnnotationValue<String>
				);
				linkUrl = compileExpression(linkBinding);
				linkActived = compileExpression(not(equal(linkBinding, "")));
				linkTarget = html5LinkTarget && (html5LinkTarget.toString() as LinkTarget);
		}

		if (field.property.annotations?.Communication?.IsEmailAddress || field.property.annotations?.Communication?.IsPhoneNumber) {
			const linkIsEmailAddress = field.property.annotations.Communication?.IsEmailAddress !== undefined;
			const linkIsPhoneNumber = field.property.annotations.Communication?.IsPhoneNumber !== undefined;
			const propertyValueBinding = FieldTemplating.getValueBinding(field.dataModelPath, {});
			const mailBlockId = field.displayStyleId ? field.displayStyleId : `mailBlock${uid()}`;
			if (linkIsEmailAddress) {
				linkUrl = `mailto:${propertyValueBinding}`;
				return (
					<Email
						id={mailBlockId}
						visible={field.displayVisible}
						text={field.text}
						mail={propertyValueBinding}
						ariaLabelledBy={field.ariaLabelledBy ? field.ariaLabelledBy : undefined}
						emptyIndicatorMode={field.emptyIndicatorMode}
					/>
				);
			}
			if (linkIsPhoneNumber) {
				linkUrl = `tel:${propertyValueBinding}`;
				return (
					<Link
						id={field.displayStyleId}
						visible={field.displayVisible}
						text={DisplayStyle.computeTextWithWhiteSpace(field)}
						href={linkUrl}
						enabled={linkActived}
						ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
						emptyIndicatorMode={field.emptyIndicatorMode}
						class="sapMTextRenderWhitespaceWrap"
					/>
				);
			}
		}

		if (iconUrl) {
			return (
				<ObjectStatus
					core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
					id={field.displayStyleId}
					icon={iconUrl}
					visible={field.displayVisible}
					text={field.text}
					press={field.eventHandlers.openExternalLink as unknown as (oEvent: Event) => void}
					active={linkActived}
					emptyIndicatorMode={field.emptyIndicatorMode}
					ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				>
					{{
						customData: <CustomData key={"url"} value={linkUrl} />
					}}
				</ObjectStatus>
			);
		} else {
			return (
				<Link
					id={field.displayStyleId}
					visible={field.displayVisible}
					text={field.text}
					href={linkUrl}
					enabled={linkActived}
					target={linkTarget === undefined ? "_top" : linkTarget}
					wrapping={field.wrap === undefined ? true : field.wrap}
					ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
					emptyIndicatorMode={field.emptyIndicatorMode}
				/>
			);
		}
	},

	/**
	 * Find the foreign key of target entity which quick view Facets we want to display.
	 * @param field Reference to the current field instance
	 * @returns The key of the target entity
	 */
	getForeignKeyForCustomData(field: FieldBlockProperties): string | undefined {
		const relativePathToQuickViewEntity = QuickView.getRelativePathToQuickViewEntity(field.dataModelPath);
		if (relativePathToQuickViewEntity) {
			const targetNavigationProperties = field.dataModelPath.targetEntityType.navigationProperties;
			const targetNavProp = targetNavigationProperties.find((navProp) => navProp.name === relativePathToQuickViewEntity);
			const refConstraint = targetNavProp?.referentialConstraint;
			const key = refConstraint?.length && typeof refConstraint[0] === "object" && refConstraint[0].targetProperty;
			const keyToFetch = key ? `${relativePathToQuickViewEntity}/${key}` : undefined;
			if (keyToFetch !== undefined) {
				return keyToFetch;
			}
		}
		return undefined;
	},

	/**
	 * Generates the check expression for displaying or not a quickview.
	 * @param field Reference to the current field instance
	 * @returns The key of the target entity
	 */
	getForeignKeyValueExpression(field: FieldBlockProperties): string {
		const foreignKeyRelativePath = QuickView.getRelativePathToQuickViewEntity(field.dataModelPath)
			? this.getForeignKeyForCustomData(field)
			: undefined;
		const expression: BindingToolkitExpression<string> = {
			path: `${foreignKeyRelativePath}`,
			_type: "PathInModel"
		};
		return `${compileExpression(ifElse(equal(foreignKeyRelativePath, undefined), constant(true), not(equal(null, expression))))}`;
	},

	/**
	 * Generates the StandardLinkWithQuickView template.
	 * @param field Reference to the current field instance
	 * @param text The text to display
	 * @returns An XML-based string with the definition of the field control
	 */
	getStandardLinkWithQuickViewTemplate(field: FieldBlockProperties, text: CompiledBindingToolkitExpression): string {
		return (
			<Link
				id={field.displayStyleId}
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				text={text}
				visible={field.displayVisible}
				wrapping={field.wrap === undefined ? true : field.wrap}
				press={field.eventHandlers.linkPressed}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				emptyIndicatorMode={field.emptyIndicatorMode}
				accessibleRole={LinkAccessibleRole.Button}
			>
				{{
					customData: [<CustomData key={"loadValue"} value={field.valueAsStringBindingExpression} />],
					dependents: DisplayStyle.getMdcLinkForQuickView(field)
				}}
			</Link>
		);
	},

	/**
	 * Generates the ConditionalLinkTemplate template.
	 * @param field Reference to the current field instance
	 * @param condition Condition to display a Link or a Text
	 * @param text The text to display
	 * @returns An XML-based string with the definition of the field control
	 */
	getConditionalLinkWithQuickViewTemplate(
		field: FieldBlockProperties,
		condition: CompiledBindingToolkitExpression,
		text: CompiledBindingToolkitExpression
	): string {
		const semanticObject = field.semanticObject?.bindingString ?? field.semanticObject;
		return (
			<TextLink
				id={field.displayStyleId}
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				showAsLink={condition as unknown as boolean}
				semanticObject={semanticObject}
				text={text}
				visible={field.displayVisible}
				wrapping={field.wrap === undefined ? true : field.wrap}
				press={field.eventHandlers.linkPressed}
				ariaLabelledBy={field.ariaLabelledBy}
				emptyIndicatorMode={field.emptyIndicatorMode}
			>
				{{
					customData: [<CustomData key={"loadValue"} value={field.valueAsStringBindingExpression} />],
					dependents: DisplayStyle.getMdcLinkForQuickView(field)
				}}
			</TextLink>
		);
	},

	/**
	 * Generates the ConditionalLinkTemplate template.
	 * @param field Reference to the current field instance
	 * @param condition Condition to display a Link or a Text
	 * @param contentTrue The Control to display in case condition is true
	 * @param contentFalse The Control to display in case condition is false
	 * @returns An XML-based string with the definition of the field control
	 */
	getConditionalWrapperForQuickViewTemplate(
		field: FieldBlockProperties,
		condition: string,
		contentTrue: string,
		contentFalse: string
	): string {
		return (
			<ConditionalWrapper visible={field.displayVisible} condition={condition as unknown as boolean}>
				{{
					contentTrue: contentTrue,
					contentFalse: contentFalse
				}}
			</ConditionalWrapper>
		);
	},

	/**
	 * Generates the LinkWithQuickView template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLinkWithQuickViewTemplate(field: FieldBlockProperties): string {
		const text = field.formatOptions.retrieveTextFromValueList
			? field.textFromValueList
			: DisplayStyle.computeTextWithWhiteSpace(field);
		const condition = this.getQuickViewCondition(field);
		if (condition === "true") {
			return this.getStandardLinkWithQuickViewTemplate(field, text);
		}
		return this.getConditionalLinkWithQuickViewTemplate(field, condition, text);
	},

	/**
	 * Generates the Text template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTextTemplate(field: FieldBlockProperties): string {
		if (field.formatOptions.retrieveTextFromValueList) {
			return (
				<Text
					id={field.displayStyleId}
					visible={field.displayVisible}
					text={field.textFromValueList}
					core:require="{FieldRuntime: 'sap/fe/macros/field/FieldRuntime'}"
					emptyIndicatorMode={field.emptyIndicatorMode}
					renderWhitespace="true"
				/>
			);
		} else {
			// When having a TextArrangement with TextOnly, RTA can only find the binding for the text, but not for the field.
			// To prevent that such a field can be added twice via RTA, we need to provide the field binding as a dummy custom binding.
			let customdata;
			if (field.formatOptions.displayMode === "Description" && field.valueAsStringBindingExpression) {
				customdata = <CustomData key="fieldBinding" value={field.valueAsStringBindingExpression} />;
			}
			return (
				<Text
					id={field.displayStyleId}
					visible={field.displayVisible}
					text={field.text}
					wrapping={field.wrap}
					emptyIndicatorMode={field.emptyIndicatorMode}
					renderWhitespace="true"
				>
					{customdata}
				</Text>
			);
		}
	},

	/**
	 * Gets template for the password field.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getPasswordTemplate(field: FieldBlockProperties): string {
		const textBinding = FieldTemplating.getTextBinding(field.dataModelPath, field.formatOptions, true);
		const textExpression =
			isPathInModelExpression(textBinding) || typeof textBinding === "string"
				? compileExpression(formatResult([textBinding], valueFormatters.formatPasswordText))
				: compileExpression(textBinding);
		return (
			<Text
				core:require="{valueFormatters: 'sap/fe/core/formatters/ValueFormatter'}"
				id={field.displayStyleId}
				visible={field.displayVisible}
				text={textExpression}
				wrapping={field.wrap}
				renderWhitespace="true"
			></Text>
		);
	},

	/**
	 * Generates the ObjectIdentifier template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getObjectIdentifier(field: FieldBlockProperties): string {
		let dependents: MdcLink | undefined;
		let titleActive;
		if (field.hasQuickView) {
			titleActive = this.getQuickViewCondition(field);
			dependents = DisplayStyle.getMdcLinkForQuickView(field);
		} else {
			titleActive = false;
		}

		let identifier = (
			<ObjectIdentifier
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				id={field.displayStyleId}
				title={field.identifierTitle}
				text={field.identifierText}
				titleActive={titleActive}
				titlePress={field.eventHandlers.linkPressed}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				emptyIndicatorMode={field.emptyIndicatorMode}
			>
				{{
					customData: [<CustomData key={"loadValue"} value={field.valueAsStringBindingExpression} />],
					dependents: dependents
				}}
			</ObjectIdentifier>
		);
		if (field.hasSituationsIndicator) {
			identifier = (
				<HBox alignItems="Center" justifyContent="SpaceBetween" width="100%">
					{identifier}
					<SituationsIndicator contextPath={field.contextPath.getPath()} propertyPath={field.situationsIndicatorPropertyPath} />
				</HBox>
			);
		}
		if (field.showErrorIndicator && field.showErrorObjectStatus) {
			identifier = (
				<VBox>
					{identifier}
					<ObjectStatus
						visible={field.showErrorObjectStatus}
						class="sapUiSmallMarginBottom"
						text="{sap.fe.i18n>Contains_Errors}"
						state="Error"
					/>
				</VBox>
			);
		}

		return identifier;
	},

	/**
	 * Generates the ObjectStatus template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getObjectStatus(field: FieldBlockProperties): string {
		let objectStatus;
		let requiredHelper = {
			"core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
		};
		const dataModelObjectPath = MetaModelConverter.getInvolvedDataModelObjects<DataField>(field.metaPath, field.contextPath);
		const enhancedValueDataModelPath = enhanceDataModelPath<Property>(
			dataModelObjectPath,
			dataModelObjectPath.targetObject?.Value.path
		);
		const condition = hasValidAnalyticalCurrencyOrUnit(enhancedValueDataModelPath);
		const convertedDataField = MetaModelConverter.getInvolvedDataModelObjects<DataPointType>(field.metaPath);
		const criticalityIcon = buildExpressionForCriticalityIcon(convertedDataField);
		const state = buildExpressionForCriticalityColor(convertedDataField);

		const linkUrl = (field.convertedMetaPath as DataFieldWithUrl).Url
			? compileExpression(
					getExpressionFromAnnotation(
						(field.convertedMetaPath as DataFieldWithUrl).Url as unknown as PropertyAnnotationValue<String>
					)
			  )
			: undefined;

		if (field.formatOptions.isAnalytics && field.hasUnitOrCurrency) {
			const content = DisplayStyle.getCurrencyOrUnitControl(field, <Text text={field.text} textAlign="End"></Text>);
			objectStatus = (
				<ConditionalWrapper id={field.displayStyleId} condition={condition as unknown as boolean}>
					{{
						contentTrue: (
							<ObjectStatus
								icon={criticalityIcon}
								state={state}
								visible={field.displayVisible}
								text={field.text}
								emptyIndicatorMode={field.emptyIndicatorMode}
								class="sapMTextRenderWhitespaceWrap"
							/>
						),
						contentFalse: content
					}}
				</ConditionalWrapper>
			);
		} else {
			let dependents: MdcLink | undefined;
			let active = false;
			let isActive;
			let pressAction;
			if (field.hasQuickView) {
				dependents = DisplayStyle.getMdcLinkForQuickView(field);
				isActive = this.getQuickViewCondition(field);
				pressAction = "FieldRuntimeHelper.pressLink";
			}
			if (linkUrl) {
				active = true;
				requiredHelper = {
					"core:require": "{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				};
				pressAction = field.eventHandlers.openExternalLink;
			}

			objectStatus = (
				<ObjectStatus
					id={field.displayStyleId}
					icon={criticalityIcon}
					state={state}
					text={field.text}
					visible={field.displayVisible}
					emptyIndicatorMode={field.emptyIndicatorMode}
					{...requiredHelper}
					active={isActive ? isActive : active}
					press={pressAction as unknown as (oEvent: Event) => void}
					ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				>
					{{
						customData: [
							<CustomData key={"loadValue"} value={field.valueAsStringBindingExpression} />,
							<CustomData key={"url"} value={linkUrl} />
						],
						dependents: dependents
					}}
				</ObjectStatus>
			);
		}

		return objectStatus;
	},

	getMdcLinkForQuickView(field: FieldBlockProperties): MdcLink {
		const semanticObject = field.semanticObject?.bindingString ?? field.semanticObject;
		return new QuickView(
			field.dataModelPath,
			field.metaPath.getPath(),
			field.contextPath.getPath(),
			semanticObject
		).createContent() as MdcLink;
	},

	/**
	 * Generates the LabelSemantickey template.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getLabelSemanticKey(field: FieldBlockProperties): string {
		const contentTrue = (
			<Link
				text={field.text}
				wrapping="true"
				core:require="{FieldRuntimeHelper: 'sap/fe/macros/field/FieldRuntimeHelper'}"
				press={field.eventHandlers.linkPressed}
				ariaLabelledBy={field.ariaLabelledBy as unknown as Array<Control | string>}
				emptyIndicatorMode={field.emptyIndicatorMode}
				accessibleRole={LinkAccessibleRole.Button}
			>
				{{
					customData: [<CustomData key={"loadValue"} value={field.valueAsStringBindingExpression} />],
					dependents: DisplayStyle.getMdcLinkForQuickView(field)
				}}
			</Link>
		);
		const contentFalse = <Label id={field.displayStyleId} visible={field.displayVisible} text={field.identifierTitle} design="Bold" />;
		if (field.hasQuickView) {
			const hasQuickview = this.getQuickViewCondition(field);
			if (hasQuickview === "true") {
				return contentTrue;
			} else {
				return this.getConditionalWrapperForQuickViewTemplate(field, hasQuickview as string, contentTrue, contentFalse);
			}
		}
		return <Label id={field.displayStyleId} visible={field.displayVisible} text={field.identifierTitle} design="Bold" />;
	},
	/**
	 * Gets the template for the semantic key with draft indicator.
	 * @param semanticKeyTemplate The template result without draft indicator
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	addDraftIndicator(semanticKeyTemplate: string, field: FieldBlockProperties): string {
		if (!field.formatOptions.fieldGroupDraftIndicatorPropertyPath) {
			// if the draftIndicator is not handled at the fieldGroup level
			//TODO could this be a boolean no draftIndicator
			semanticKeyTemplate = (
				<FormElementWrapper visible={field.displayVisible}>
					<VBox class={FieldHelper.getMarginClass(field.formatOptions.compactSemanticKey)}>
						{semanticKeyTemplate}
						<DraftIndicator
							draftIndicatorType={ObjectMarkerVisibility.IconAndText}
							contextPath={field.contextPath.getPath()}
							visible={field.draftIndicatorVisible}
							ariaLabelledBy={field.ariaLabelledBy ? field.ariaLabelledBy : []}
						/>
					</VBox>
				</FormElementWrapper>
			);
		}
		return semanticKeyTemplate;
	},

	/**
	 * Computes the text property with the appropriate white space handling.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	computeTextWithWhiteSpace(field: FieldBlockProperties): CompiledBindingToolkitExpression {
		const text = FieldTemplating.getTextBinding(
			(field.dataModelPathExternalID as DataModelObjectPath<Property>) ?? field.dataModelPath,
			field.formatOptions,
			true
		);
		return isPathInModelExpression(text) || typeof text === "string"
			? compileExpression(formatResult([text], valueFormatters.replaceWhitespace))
			: compileExpression(text);
	},
	/**
	 * Gets the condition for having an active link that opens the quick view.
	 * @param field
	 * @returns A compile binding expression for the condition.
	 */
	getQuickViewCondition(field: FieldBlockProperties): CompiledBindingToolkitExpression {
		switch (field.quickViewType) {
			case "Facets":
				//there is quick viewFacets annotation only then we check if the navigation is reachable
				return this.getForeignKeyValueExpression(field);

			case "SemanticLinks":
				if (field.dynamicSemanticObjects) {
					const listOfDynamicSemanticObjects: BindingToolkitExpression<string>[] = [];
					if (field.semanticObject) {
						// If we see a dynamic expression with a formatter, we return false. The condition will be resolved later in TextLink control.
						return compileExpression(constant(false));
					}
					for (const semanticObjectExpression of field.dynamicSemanticObjects) {
						if (semanticObjectExpression._type === "PathInModel" || semanticObjectExpression._type === "Constant") {
							listOfDynamicSemanticObjects.push(semanticObjectExpression);
						} else {
							// If we see a dynamic expression ($edmJson), we return true.
							return compileExpression(constant(true));
						}
					}
					const semanticObjectsPath = [
						pathInModel<Context[]>("/semanticObjects", "internal") as BindingToolkitExpression<string>
					].concat(listOfDynamicSemanticObjects);
					return compileExpression(formatResult(semanticObjectsPath, valueFormatters.hasSemanticObjects));
				}
				return "true";
			default:
				// "facetsAndSemanticLinks"
				// if there is both facets and semantic links, we do not check if the navigation is reachable
				return "true";
		}
	},

	/**
	 * Entry point for further templating processings.
	 * @param field Reference to the current field instance
	 * @returns An XML-based string with the definition of the field control
	 */
	getTemplate: (field: FieldBlockProperties): string => {
		let innerFieldContent;
		switch (field.displayStyle as DisplayStyleType) {
			case "NumberWithUnitOrCurrencyAligned":
				innerFieldContent = DisplayStyle.getNumberWithUnitOrCurrencyAlignedTemplate(field);
				break;
			case "Avatar":
				innerFieldContent = DisplayStyle.getAvatarTemplate(field);
				break;
			case "Button":
				innerFieldContent = DisplayStyle.getButtonTemplate(field);
				break;
			case "Contact":
				innerFieldContent = DisplayStyle.getContactTemplate(field);
				break;
			case "DataPoint":
				innerFieldContent = DisplayStyle.getDataPointTemplate(field);
				break;
			case "ExpandableText":
				innerFieldContent = DisplayStyle.getExpandableText(field);
				break;
			case "File":
				innerFieldContent = DisplayStyle.getFileTemplate(field);
				break;
			case "Link":
				innerFieldContent = DisplayStyle.getLinkTemplate(field);
				break;
			case "LinkWithQuickView":
				innerFieldContent = DisplayStyle.getLinkWithQuickViewTemplate(field);
				break;
			case "ObjectIdentifier":
				innerFieldContent = DisplayStyle.getObjectIdentifier(field);
				break;
			case "ObjectStatus": {
				innerFieldContent = DisplayStyle.getObjectStatus(field);
				break;
			}
			case "LabelSemanticKey":
				innerFieldContent = DisplayStyle.getLabelSemanticKey(field);
				break;
			case "Text":
				innerFieldContent = DisplayStyle.getTextTemplate(field);
				break;
			case "Masked":
				innerFieldContent = DisplayStyle.getPasswordTemplate(field);
				break;
			default:
				innerFieldContent = "";
		}
		if (field.addDraftIndicator && innerFieldContent) {
			innerFieldContent = DisplayStyle.addDraftIndicator(innerFieldContent, field);
		}

		return innerFieldContent;
	}
};

export default DisplayStyle;
