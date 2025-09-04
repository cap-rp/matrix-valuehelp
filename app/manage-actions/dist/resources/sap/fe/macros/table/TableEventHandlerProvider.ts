import type { EntitySet, NavigationProperty } from "@sap-ux/vocabularies-types";
import {
	type DataFieldForAction,
	type DataFieldForIntentBasedNavigation,
	type DataFieldTypes
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import type { CompiledBindingToolkitExpression } from "sap/fe/base/BindingToolkit";
import { compileExpression, getExpressionFromAnnotation, isConstant, isPathInModelExpression } from "sap/fe/base/BindingToolkit";
import { type BaseAction, type CustomAction } from "sap/fe/core/converters/controls/Common/Action";
import FPMHelper from "sap/fe/core/helpers/FPMHelper";
import { type DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import { formatValueRecursively } from "sap/fe/macros/field/FieldTemplating";
import type UI5Event from "sap/ui/base/Event";
import type Control from "sap/ui/core/Control";
import type Message from "sap/ui/core/message/Message";
import type { Field$ChangeEvent } from "sap/ui/mdc/Field";
import type V4Context from "sap/ui/model/odata/v4/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import CommonHelper from "../CommonHelper";
import { type TableBlockProperties } from "./MdcTableTemplate";
import type TableAPI from "./TableAPI";
import TableHelper from "./TableHelper";
import TableRuntime from "./TableRuntime";
import UploadTableRuntime from "./uploadTable/UploadTableRuntime";

type EventHandlerType = (e: UI5Event) => void;

// maximum number of items to share to Collaboration Manager simultanously
const selectionLimitForShareToCollaborationManager = 1;
// maximum number of items to open in new tabs simultanously
const selectionLimitForOpenInNewTab = 10;

export default class TableEventHandlerProvider {
	addCardToInsightsPress!: EventHandlerType;

	beforeExport!: EventHandlerType;

	beforeOpenContextMenu!: EventHandlerType;

	collapseNode?: EventHandlerType;

	contextMenuItemSelected!: EventHandlerType;

	contextMenuOpenInNewTab?: EventHandlerType;

	contextMenuShareToCollaborationManager: EventHandlerType | undefined;

	dataStateChange!: EventHandlerType;

	dataStateIndicatorFilter?: (message: Message, control: Control) => boolean;

	dragStartDocument?: EventHandlerType;

	dragEnterDocument?: EventHandlerType;

	dropDocument?: EventHandlerType;

	expandNode?: EventHandlerType;

	fieldChangeInCreationRow?: EventHandlerType;

	fieldLiveChange?: EventHandlerType;

	rowPress?: EventHandlerType;

	segmentedButtonPress?: EventHandlerType;

	selectionChange!: EventHandlerType;

	tableContextChange?: EventHandlerType;

	uploadCompleted!: EventHandlerType;

	uploadFileNameLengthExceeded!: EventHandlerType;

	uploadFileSizeExceeded!: EventHandlerType;

	uploadItemValidationHandler!: Function;

	uploadMediaTypeMismatch!: EventHandlerType;

	variantSaved?: EventHandlerType;

	variantSelected?: EventHandlerType;

	private metaModel: ODataMetaModel;

	private collectionEntity: EntitySet | NavigationProperty;

	constructor(
		private tableBlockProperties: TableBlockProperties,
		settings: { collectionEntity: EntitySet | NavigationProperty; metaModel: ODataMetaModel },
		private tableAPI?: TableAPI
	) {
		this.collectionEntity = settings.collectionEntity;
		this.metaModel = settings.metaModel;

		if (tableAPI) {
			this.constructorWithFunctions(tableAPI);
		} else {
			this.constructorWithStrings();
		}
	}

	/**
	 * Initializes the event handler properties with string values.
	 */
	private constructorWithStrings(): void {
		const tableType = this.tableBlockProperties.tableDefinition?.control?.type;

		this.addCardToInsightsPress = "API.onAddCardToInsightsPressed($event, $controller)" as unknown as EventHandlerType;
		this.beforeExport = "API.onBeforeExport($event)" as unknown as EventHandlerType;
		this.beforeOpenContextMenu = "API.onContextMenuPress($event)" as unknown as EventHandlerType;
		this.collapseNode =
			tableType === "TreeTable" ? ("API.onCollapseExpandNode($event, false)" as unknown as EventHandlerType) : undefined;
		this.contextMenuItemSelected = "TableRuntime.onContextMenuItemSelected" as unknown as EventHandlerType;

		const rowNavigationInfo = this.tableBlockProperties.tableDefinition?.annotation.row?.navigationInfo;
		if (rowNavigationInfo !== undefined) {
			if (rowNavigationInfo.type === "Outbound") {
				this.contextMenuOpenInNewTab =
					`.onOpenInNewTabNavigateOutBound('${rowNavigationInfo.navigationTarget}', %{internal>contextmenu/selectedContexts}, "", ${selectionLimitForOpenInNewTab})` as unknown as EventHandlerType;
			} else {
				this.contextMenuShareToCollaborationManager =
					`API.onShareToCollaborationManagerPress($event, $controller, %{internal>contextmenu/selectedContexts}, ${selectionLimitForShareToCollaborationManager})` as unknown as EventHandlerType;
				this.contextMenuOpenInNewTab =
					`API.onOpenInNewTabPress($event, $controller, %{internal>contextmenu/selectedContexts}, { callExtension: true, targetPath: '${rowNavigationInfo.targetPath}', navMode: 'openInNewTab' }, ${selectionLimitForOpenInNewTab})` as unknown as EventHandlerType;
			}
		}

		this.dataStateChange = "API.onDataStateChange" as unknown as EventHandlerType;

		if (this.tableBlockProperties.tableDefinition?.control?.hasDataStateIndicatorFilter) {
			this.dataStateIndicatorFilter = "TableRuntime.dataStateIndicatorFilter" as unknown as (
				message: Message,
				control: Control
			) => boolean;
		}

		this.dragStartDocument = tableType === "TreeTable" ? ("API.onDragStartDocument" as unknown as EventHandlerType) : undefined;
		this.dragEnterDocument = tableType === "TreeTable" ? ("API.onDragEnterDocument" as unknown as EventHandlerType) : undefined;
		this.dropDocument = tableType === "TreeTable" ? ("API.onDropDocument" as unknown as EventHandlerType) : undefined;
		this.expandNode = tableType === "TreeTable" ? ("API.onCollapseExpandNode($event, true)" as unknown as EventHandlerType) : undefined;
		this.fieldChangeInCreationRow = `TableRuntime.onFieldChangeInCreationRow($event, ${!!this.tableBlockProperties.tableDefinition
			.control.customValidationFunction})` as unknown as EventHandlerType;
		this.fieldLiveChange =
			this.tableBlockProperties.creationMode?.name === "InlineCreationRows"
				? ("TableAPI.onFieldLiveChange($event)" as unknown as EventHandlerType)
				: undefined;
		this.rowPress = "API.onTableRowPress" as unknown as EventHandlerType;
		this.segmentedButtonPress = "API.onSegmentedButtonPressed" as unknown as EventHandlerType;
		this.selectionChange = "API.onSelectionChanged" as unknown as EventHandlerType;
		this.tableContextChange =
			tableType === "TreeTable"
				? (`TableRuntime.onTreeTableContextChanged($event, ${this.tableBlockProperties.tableDefinition?.annotation?.initialExpansionLevel})` as unknown as EventHandlerType)
				: undefined;

		this.uploadCompleted = "UploadTableRuntime.onUploadCompleted" as unknown as EventHandlerType;
		this.uploadFileNameLengthExceeded = "UploadTableRuntime.onFileNameLengthExceeded" as unknown as EventHandlerType;
		this.uploadFileSizeExceeded = "UploadTableRuntime.onFileSizeExceeded" as unknown as EventHandlerType;
		this.uploadItemValidationHandler = "UploadTableRuntime.uploadFile" as unknown as Function;
		this.uploadMediaTypeMismatch = "UploadTableRuntime.onMediaTypeMismatch" as unknown as EventHandlerType;
		this.variantSaved = "API.onVariantSaved" as unknown as EventHandlerType;
		this.variantSelected = "API.onVariantSelected" as unknown as EventHandlerType;
	}

	/**
	 * Initializes the event handler properties with functions.
	 * @param tableAPI
	 */
	private constructorWithFunctions(tableAPI: TableAPI): void {
		const tableType = this.tableBlockProperties.tableDefinition?.control?.type;

		this.addCardToInsightsPress = tableAPI.onAddCardToInsightsPressed.bind(tableAPI);
		this.beforeExport = tableAPI.onBeforeExport.bind(tableAPI);
		this.beforeOpenContextMenu = tableAPI.onContextMenuPress.bind(tableAPI);
		this.collapseNode =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						tableAPI.onCollapseExpandNode(e, false);
				  }
				: undefined;
		this.contextMenuItemSelected = TableRuntime.onContextMenuItemSelected.bind(TableRuntime);

		const rowNavigationInfo = this.tableBlockProperties.tableDefinition?.annotation.row?.navigationInfo;
		if (rowNavigationInfo !== undefined) {
			if (rowNavigationInfo.type === "Outbound") {
				this.contextMenuOpenInNewTab = (_e: UI5Event): void => {
					const controller = tableAPI.getPageController();
					const internalContext = tableAPI.getBindingContext("internal");
					controller?.onOpenInNewTabNavigateOutBound?.(
						rowNavigationInfo.navigationTarget,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						"",
						selectionLimitForOpenInNewTab
					);
				};
			} else {
				this.contextMenuShareToCollaborationManager = (e: UI5Event): void => {
					const controller = tableAPI.getPageController()!;
					const internalContext = tableAPI.getBindingContext("internal");
					tableAPI.onShareToCollaborationManagerPress(
						e,
						controller,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						selectionLimitForShareToCollaborationManager
					);
				};
				this.contextMenuOpenInNewTab = (e: UI5Event): void => {
					const controller = tableAPI.getPageController()!;
					const internalContext = tableAPI.getBindingContext("internal");
					tableAPI.onOpenInNewTabPress(
						e,
						controller,
						internalContext?.getProperty("contextmenu/selectedContexts"),
						{ callExtension: true, targetPath: rowNavigationInfo.targetPath, navMode: "openInNewTab" },
						selectionLimitForOpenInNewTab
					);
				};
			}
		}

		this.dataStateChange = tableAPI.onDataStateChange.bind(tableAPI);

		if (this.tableBlockProperties.tableDefinition?.control?.hasDataStateIndicatorFilter) {
			this.dataStateIndicatorFilter = tableAPI.dataStateIndicatorFilter.bind(tableAPI);
		}

		this.dragStartDocument = tableType === "TreeTable" ? (tableAPI.onDragStartDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.dragEnterDocument = tableType === "TreeTable" ? (tableAPI.onDragEnterDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.dropDocument = tableType === "TreeTable" ? (tableAPI.onDropDocument.bind(tableAPI) as EventHandlerType) : undefined;
		this.expandNode =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						tableAPI.onCollapseExpandNode(e, true);
				  }
				: undefined;

		this.fieldChangeInCreationRow = (e: UI5Event): void => {
			TableRuntime.onFieldChangeInCreationRow(
				e as Field$ChangeEvent & UI5Event<{ isValid: boolean }>,
				!!this.tableBlockProperties.tableDefinition.control.customValidationFunction
			);
		};
		this.fieldLiveChange =
			this.tableBlockProperties.creationMode?.name === "InlineCreationRows" ? tableAPI.onFieldLiveChange.bind(tableAPI) : undefined;
		this.rowPress = tableAPI.onTableRowPress.bind(tableAPI);
		this.segmentedButtonPress = tableAPI.onSegmentedButtonPressed.bind(tableAPI);
		this.selectionChange = tableAPI.onSelectionChanged.bind(tableAPI);
		this.tableContextChange =
			tableType === "TreeTable"
				? (e: UI5Event): void => {
						TableRuntime.onTreeTableContextChanged(
							e,
							this.tableBlockProperties.tableDefinition?.annotation?.initialExpansionLevel
						);
				  }
				: undefined;

		this.uploadCompleted = UploadTableRuntime.onUploadCompleted.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadFileNameLengthExceeded = UploadTableRuntime.onFileNameLengthExceeded.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadFileSizeExceeded = UploadTableRuntime.onFileSizeExceeded.bind(UploadTableRuntime) as EventHandlerType;
		this.uploadItemValidationHandler = UploadTableRuntime.uploadFile.bind(UploadTableRuntime);
		this.uploadMediaTypeMismatch = UploadTableRuntime.onMediaTypeMismatch.bind(UploadTableRuntime) as EventHandlerType;
		this.variantSaved = tableAPI.onVariantSaved.bind(tableAPI);
		this.variantSelected = tableAPI.onVariantSelected.bind(tableAPI);
	}

	/**
	 * Gets the press event handler for the Create button.
	 * @param forContextMenu
	 * @param forCreationRow
	 * @returns The event handler.
	 */
	getCreateButtonPressHandler(forContextMenu: boolean, forCreationRow: boolean): EventHandlerType {
		if (this.tableAPI) {
			return forCreationRow
				? TableRuntime.onCreateButtonPress.bind(TableRuntime)
				: (e: UI5Event): void => {
						const internalContext = this.tableAPI!.getBindingContext("internal");
						const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
						TableRuntime.onCreateButtonPress(e, internalContext?.getProperty(path));
				  };
		} else if (!forCreationRow) {
			return forContextMenu
				? ("TableRuntime.onCreateButtonPress($event, ${internal>contextmenu/selectedContexts})" as unknown as EventHandlerType)
				: ("TableRuntime.onCreateButtonPress($event, ${internal>selectedContexts})" as unknown as EventHandlerType);
		} else {
			return "TableRuntime.onCreateButtonPress($event)" as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the press event handler for the Create menu item.
	 * @param index
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCreateMenuItemPressHandler(index: number, forContextMenu: boolean): EventHandlerType {
		const path = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
		if (this.tableAPI) {
			return (e: UI5Event): void => {
				TableRuntime.onCreateMenuItemPress(e, index, this.tableAPI!.getBindingContext("internal")?.getProperty(path));
			};
		} else {
			return `TableRuntime.onCreateMenuItemPress($event, ${index}, \${internal>${path}})` as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the event handler for the Cut action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCutHandler(forContextMenu: boolean): EventHandlerType {
		if (this.tableAPI) {
			return (e: UI5Event): void => {
				this.tableAPI!.onCut(e, forContextMenu);
			};
		} else {
			return `API.onCut($event, ${forContextMenu})` as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the event handler for the Copy action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getCopyHandler(forContextMenu: boolean): EventHandlerType {
		if (this.tableAPI) {
			return (e: UI5Event): void => {
				this.tableAPI!.onCopy(e, forContextMenu);
			};
		} else {
			return `API.onCopy($event, ${forContextMenu})` as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the press event handler for an action button.
	 * @param dataField
	 * @param action
	 * @param parentAction
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDataFieldForActionButtonPressHandler(
		dataField: DataFieldForAction | undefined,
		action: BaseAction,
		parentAction: BaseAction | undefined,
		forContextMenu: boolean
	): EventHandlerType | undefined {
		if (!dataField) {
			return undefined;
		}

		const actionContextPath = action.annotationPath
			? CommonHelper.getActionContext(this.metaModel.createBindingContext(action.annotationPath + "/Action")!)
			: undefined;
		const actionContext = actionContextPath ? this.metaModel.createBindingContext(actionContextPath) : undefined;

		if (this.tableAPI) {
			const actionName = dataField.Action;
			const targetEntityTypeName = this.tableBlockProperties.contextObjectPath.targetEntityType.fullyQualifiedName;
			const isStaticAction =
				typeof actionContext?.getObject() !== "string" &&
				(TableHelper._isStaticAction(actionContext?.getObject(), actionName) ||
					TableHelper._isActionOverloadOnDifferentType(actionName.toString(), targetEntityTypeName));
			const applicablePropertyPath = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
			const notApplicablePropertyPath = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
			const contextMenuPath = !forContextMenu ? "" : "contextmenu/";

			return (e: UI5Event): void => {
				const internalContext = this.tableAPI!.getBindingContext("internal")!;
				const params = {
					contexts: !isStaticAction ? internalContext.getProperty(`${contextMenuPath}selectedContexts`) : null,
					bStaticAction: isStaticAction ? isStaticAction : undefined,
					entitySetName: this.collectionEntity.name,
					applicableContexts: !isStaticAction
						? internalContext.getProperty(`dynamicActions/${dataField.Action}/${applicablePropertyPath}/`)
						: null,
					notApplicableContexts: !isStaticAction
						? internalContext.getProperty(`dynamicActions/${dataField.Action}/${notApplicablePropertyPath}/`)
						: null,
					isNavigable: (parentAction ?? action).isNavigable,
					enableAutoScroll: action.enableAutoScroll,
					defaultValuesExtensionFunction: action.defaultValuesExtensionFunction,
					invocationGrouping: dataField?.InvocationGrouping === "UI.OperationGroupingType/ChangeSet" ? "ChangeSet" : "Isolated",
					controlId: this.tableBlockProperties.contentId,
					operationAvailableMap: this.tableBlockProperties.tableDefinition.operationAvailableMap,
					label: dataField.Label?.valueOf() ?? "",
					model: this.tableAPI!.getPageController()!.getModel(),
					feFrameworkCall: true
				};
				this.tableAPI?.onActionPress(e, this.tableAPI.getPageController()!, dataField.Action.valueOf(), params);
			};
		} else {
			return TableHelper.pressEventDataFieldForActionButton(
				{
					contextObjectPath: this.tableBlockProperties.contextObjectPath,
					contentId: this.tableBlockProperties.contentId
				},
				dataField,
				this.collectionEntity.name,
				this.tableBlockProperties.tableDefinition.operationAvailableMap,
				actionContext?.getObject(),
				(parentAction ?? action).isNavigable,
				action.enableAutoScroll,
				action.defaultValuesExtensionFunction,
				forContextMenu
			) as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the press event handler for an IBN action.
	 * @param action
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDataFieldForIBNPressHandler(action: BaseAction, forContextMenu: boolean): EventHandlerType | undefined {
		if (action.annotationPath === undefined) {
			return undefined;
		}
		const dataFieldContext = this.metaModel.createBindingContext(action.annotationPath);
		const dataField = dataFieldContext?.getObject() as DataFieldForIntentBasedNavigation | undefined;
		if (!dataField) {
			return undefined;
		}
		const navigateWithConfirmationDialog = this.tableBlockProperties.tableDefinition.enableAnalytics !== true;

		if (this.tableAPI) {
			return (e: UI5Event): void => {
				const internalContext = this.tableAPI!.getBindingContext("internal")!;
				const navigationParameters: {
					navigationContexts?: V4Context[];
					label?: string;
					applicableContexts?: V4Context[];
					notApplicableContexts?: V4Context[];
					semanticObjectMapping?: object;
				} = {};

				navigationParameters.navigationContexts = forContextMenu
					? internalContext.getProperty("contextmenu/selectedContexts")
					: internalContext.getProperty("selectedContexts");

				if (dataField.RequiresContext && !dataField.Inline && navigateWithConfirmationDialog) {
					const applicableProperty = !forContextMenu ? "aApplicable" : "aApplicableForContextMenu";
					const notApplicableProperty = !forContextMenu ? "aNotApplicable" : "aNotApplicableForContextMenu";
					navigationParameters.applicableContexts = internalContext.getProperty(
						`ibn/${dataField.SemanticObject}-${dataField.Action}/${applicableProperty}/`
					);
					navigationParameters.notApplicableContexts = internalContext.getProperty(
						`ibn/${dataField.SemanticObject}-${dataField.Action}/${notApplicableProperty}/`
					);
					navigationParameters.label = dataField.Label as string;
				}
				navigationParameters.semanticObjectMapping = dataField.Mapping;
				const controller = this.tableAPI!.getPageController();
				if (navigateWithConfirmationDialog) {
					controller?._intentBasedNavigation.navigateWithConfirmationDialog(
						dataField.SemanticObject as unknown as string,
						dataField.Action as unknown as string,
						navigationParameters,
						e.getSource<Control>()
					);
				} else {
					controller?._intentBasedNavigation.navigate(
						dataField.SemanticObject as unknown as string,
						dataField.Action as unknown as string,
						navigationParameters,
						e.getSource<Control>()
					);
				}
			};
		} else {
			return CommonHelper.getPressHandlerForDataFieldForIBN(
				dataField,
				forContextMenu ? "${internal>contextmenu/selectedContexts}" : "${internal>selectedContexts}",
				navigateWithConfirmationDialog,
				forContextMenu
			) as unknown as EventHandlerType;
		}
	}

	private getExpressionForDataFieldValue(
		dataField: DataFieldTypes | undefined,
		fullContextPath: DataModelObjectPath<unknown>
	): string | CompiledBindingToolkitExpression | undefined {
		const value = dataField?.Value;
		if (!value) {
			return undefined;
		}

		if (typeof value === "string") {
			return this.tableAPI ? value : CommonHelper.addSingleQuotes(value, true);
		} else {
			const expression = getExpressionFromAnnotation(value);
			if (isConstant(expression) || isPathInModelExpression(expression)) {
				const valueExpression = formatValueRecursively(expression, fullContextPath);
				return compileExpression(valueExpression);
			}
		}
	}

	/**
	 * Gets the press event handler for the Delete button.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getDeleteButtonPressHandler(forContextMenu: boolean): EventHandlerType {
		const headerInfo = ((this.collectionEntity as EntitySet)?.entityType || (this.collectionEntity as NavigationProperty)?.targetType)
			?.annotations?.UI?.HeaderInfo;

		const contextMenuPath = !forContextMenu ? "" : "contextmenu/";
		const deletableContextsPath = `${contextMenuPath}deletableContexts`;
		const selectedContextsPath = `${contextMenuPath}selectedContextsIncludingInactive`;
		const numberOfSelectedContextsPath = !forContextMenu
			? `numberOfSelectedContexts`
			: `${contextMenuPath}numberOfSelectedContextsForDelete`;
		const unSavedContextsPath = `${contextMenuPath}unSavedContexts`;
		const lockedContextsPath = `${contextMenuPath}lockedContexts`;
		const draftsWithDeletableActivePath = `${contextMenuPath}draftsWithDeletableActive`;
		const draftsWithNonDeletableActivePath = `${contextMenuPath}draftsWithNonDeletableActive`;

		const titleExpression = this.getExpressionForDataFieldValue(
			headerInfo?.Title as DataFieldTypes,
			this.tableBlockProperties.contextObjectPath
		);

		const descriptionExpression = this.getExpressionForDataFieldValue(
			headerInfo?.Description as DataFieldTypes,
			this.tableBlockProperties.contextObjectPath
		);

		if (this.tableAPI) {
			return (_e: UI5Event): void => {
				const internalContext = this.tableAPI!.getBindingContext("internal");
				const params = {
					id: this.tableBlockProperties.contentId,
					numberOfSelectedContexts: internalContext?.getProperty(numberOfSelectedContextsPath) as number,
					unSavedContexts: internalContext?.getProperty(unSavedContextsPath) as V4Context[],
					lockedContexts: internalContext?.getProperty(lockedContextsPath) as V4Context[],
					draftsWithDeletableActive: internalContext?.getProperty(draftsWithDeletableActivePath) as V4Context[],
					draftsWithNonDeletableActive: internalContext?.getProperty(draftsWithNonDeletableActivePath) as V4Context[],
					controlId: internalContext?.getProperty("controlId"),
					title: titleExpression,
					description: descriptionExpression,
					selectedContexts: internalContext?.getProperty(selectedContextsPath) as V4Context[]
				};
				this.tableAPI!.getPageController()?.editFlow.deleteMultipleDocuments(
					internalContext?.getProperty(deletableContextsPath),
					params
				);
			};
		} else {
			const params = {
				id: CommonHelper.addSingleQuotes(this.tableBlockProperties.contentId),
				numberOfSelectedContexts: `\${internal>${numberOfSelectedContextsPath}}`,
				unSavedContexts: `\${internal>${unSavedContextsPath}}`,
				lockedContexts: `\${internal>${lockedContextsPath}}`,
				draftsWithDeletableActive: `\${internal>${draftsWithDeletableActivePath}}`,
				draftsWithNonDeletableActive: `\${internal>${draftsWithNonDeletableActivePath}}`,
				controlId: "${internal>controlId}",
				title: titleExpression,
				description: descriptionExpression,
				selectedContexts: `\${internal>${selectedContextsPath}}`
			};

			return CommonHelper.generateFunction(
				".editFlow.deleteMultipleDocuments",
				`\${internal>${deletableContextsPath}}`,
				CommonHelper.objectToString(params)
			) as unknown as EventHandlerType;
		}
	}

	/**
	 * Get the press event handler for a manifest action button.
	 * @param action
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getManifestActionPressHandler(action: CustomAction, forContextMenu: boolean): EventHandlerType | undefined {
		if (this.tableAPI) {
			if (action.noWrap === true) {
				// If noWrap = true, then the action is a slot action (defined in the XML view as an aggregation of the table block)
				const relatedActionElement = this.tableAPI.findSlotActionFromKey(action.key);
				if (relatedActionElement) {
					return (e: UI5Event): void => {
						const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
						const internalContext = this.tableAPI!.getBindingContext("internal")!;
						const eventParameters = { ...e.getParameters(), contexts: internalContext.getProperty(internalModelPath) };
						relatedActionElement.fireEvent("press", eventParameters);
					};
				} else {
					Log.error("Couldn't find action with key " + action.key);
					return undefined;
				}
			} else {
				return (e: UI5Event): void => {
					const internalModelPath = forContextMenu ? "contextmenu/selectedContexts" : "selectedContexts";
					const internalContext = this.tableAPI!.getBindingContext("internal")!;
					FPMHelper.actionWrapper(e, action.handlerModule, action.handlerMethod, {
						contexts: internalContext.getProperty(internalModelPath)
					}).catch((err) => {
						Log.error("Error while executing custom action", err);
					});
				};
			}
		} else {
			return (action.noWrap === true
				? action.press
				: CommonHelper.buildActionWrapper(
						action,
						{ id: this.tableBlockProperties.contentId },
						forContextMenu
				  )) as unknown as EventHandlerType;
		}
	}

	/**
	 * Get the press event handler for the mass edit button.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getMassEditButtonPressHandler(forContextMenu: boolean): EventHandlerType {
		if (this.tableAPI) {
			return (e: UI5Event): void => {
				this.tableAPI!.onMassEditButtonPressed(e, forContextMenu);
			};
		} else {
			return `API.onMassEditButtonPressed($event, ${forContextMenu})` as unknown as EventHandlerType;
		}
	}

	/**
	 * Get the press event handler for the move up / move down buttons.
	 * @param forMoveUp
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getMoveUpDownHandler(forMoveUp: boolean, forContextMenu: boolean): EventHandlerType {
		if (this.tableAPI) {
			return (e: UI5Event): void => {
				this.tableAPI!.onMoveUpDown(e, forMoveUp, forContextMenu);
			};
		} else {
			return `API.onMoveUpDown($event, ${forMoveUp}, ${forContextMenu})` as unknown as EventHandlerType;
		}
	}

	/**
	 * Gets the event handler for the Paste action.
	 * @param forContextMenu
	 * @returns The event handler.
	 */
	getPasteHandler(forContextMenu: boolean): EventHandlerType {
		if (this.tableAPI) {
			const controller = this.tableAPI.getPageController();
			return (e: UI5Event): void => {
				this.tableAPI!.onPaste(e, controller, forContextMenu);
			};
		} else {
			return `API.onPaste($event, $controller, ${forContextMenu})` as unknown as EventHandlerType;
		}
	}
}
