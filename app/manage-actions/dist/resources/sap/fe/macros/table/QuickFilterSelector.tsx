import type { SelectionVariant, SelectionVariantType, SelectionVariantTypeTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import { UIAnnotationTypes } from "@sap-ux/vocabularies-types/vocabularies/UI";
import Log from "sap/base/Log";
import { notEqual, pathInModel } from "sap/fe/base/BindingToolkit";
import { defineUI5Class, property, type PropertiesOf } from "sap/fe/base/ClassSupport";
import CommonUtils from "sap/fe/core/CommonUtils";
import type PageController from "sap/fe/core/PageController";
import BuildingBlock from "sap/fe/core/buildingBlocks/BuildingBlock";
import { getInvolvedDataModelObjects } from "sap/fe/core/converters/MetaModelConverter";
import { generate } from "sap/fe/core/helpers/StableIdHelper";
import { isAnnotationOfType } from "sap/fe/core/helpers/TypeGuards";
import { enhanceDataModelPath, getTargetNavigationPath, getTargetObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import TableUtils from "sap/fe/macros/table/Utils";
import SegmentedButton from "sap/m/SegmentedButton";
import SegmentedButtonItem from "sap/m/SegmentedButtonItem";
import Select from "sap/m/Select";
import type Control from "sap/ui/core/Control";
import { type $ControlSettings } from "sap/ui/core/Control";
import InvisibleText from "sap/ui/core/InvisibleText";
import Item from "sap/ui/core/Item";
import type Table from "sap/ui/mdc/Table";
import type Context from "sap/ui/model/Context";
import type TableAPI from "./TableAPI";

/**
 * Definition of the quickVariantSelection to be used inside the table.
 */
@defineUI5Class("sap.fe.macros.table.QuickFilterSelector")
export default class QuickFilterSelector extends BuildingBlock<SegmentedButton | Select> {
	@property({ type: "string" })
	id!: string;

	/**
	 * Defines the list of paths pointing to the selection variants that should be used as quick filters
	 */
	@property({ type: "string[]" })
	paths!: string[];

	/**
	 * Defines whether the counts should be displayed next to the text
	 */
	@property({ type: "boolean" })
	showCounts = false;

	private metaPath?: string;

	private metaDataAvailable?: boolean;

	protected mdcTable?: Table;

	constructor(properties: $ControlSettings & PropertiesOf<QuickFilterSelector>, others?: $ControlSettings) {
		super(properties, others);
	}

	/**
	 * Handler for the onMetadataAvailable event.
	 */
	onMetadataAvailable(): void {
		this.metaDataAvailable = true;
		if (!this.content && this.metaPath) {
			this.initializeContent();
		}
	}

	/**
	 * Sets the metaPath.
	 * @param metaPath The metaPath
	 */
	setMetaPath(metaPath: string): void {
		this.metaPath = metaPath;
		if (!this.content && this.metaDataAvailable === true) {
			this.initializeContent();
		}
	}

	/**
	 * Handler for the selection change event.
	 */
	private onSelChange(): void {
		const tableAPI = this.getMDCTable().getParent();
		if (tableAPI?.isA<TableAPI>("sap.fe.macros.table.TableAPI")) {
			tableAPI.onQuickFilterSelectionChange();
		}
	}

	/**
	 * Generates the selector as a SegmentedButton.
	 * @param metaContext The meta context
	 * @returns  The SegmentedButton
	 */
	private getSegmentedButtonSelector(metaContext: Context): SegmentedButton {
		const items = this.paths.map((path, index) => {
			return (<SegmentedButtonItem {...this.getSelectorItemProperties(index, metaContext)} />) as SegmentedButtonItem;
		});
		return (
			<SegmentedButton
				id={`${this.id}-content`}
				enabled={notEqual(pathInModel("hasPendingFilters", "pageInternal"), true)}
				ariaLabelledBy={[this.getSelectorAriaLabelledById()]}
				selectionChange={this.onSelChange.bind(this)}
			>
				{{
					items
				}}
			</SegmentedButton>
		);
	}

	/**
	 * Generates the selector as a Select.
	 * @param metaContext The meta context
	 * @returns  The Select
	 */
	private getSelectSelector(metaContext: Context): Select {
		const items = this.paths.map((path, index) => {
			return (<Item {...this.getSelectorItemProperties(index, metaContext)} />) as Item;
		});
		return (
			<Select
				id={`${this.id}-content`}
				enabled={notEqual(pathInModel("hasPendingFilters", "pageInternal"), true)}
				ariaLabelledBy={[this.getSelectorAriaLabelledById()]}
				autoAdjustWidth={true}
				change={this.onSelChange.bind(this)}
			>
				{{
					items
				}}
			</Select>
		);
	}

	/**
	 * Gets the properties of the selector Item.
	 * @param index The index of the item into the selector
	 * @param metaContext The meta context
	 * @returns  The properties
	 */
	private getSelectorItemProperties(index: number, metaContext: Context): { key: string; text: string } {
		return {
			key: this.paths[index],
			text: this.getSelectorItemText(index, metaContext)
		};
	}

	/**
	 * Generates the Id of the InvisibleText control.
	 * @returns  The Id
	 */
	private getSelectorAriaLabelledById(): string {
		return generate([`${this.id}-content`, "AriaText"]);
	}

	/**
	 * Generates the text for the selector item.
	 * @param index The index of the item into the selector
	 * @param metaContext The meta context
	 * @returns  The text
	 */
	private getSelectorItemText(index: number, metaContext: Context): string {
		const countText = ` ({internal>quickFilters/counts/${index}})`;
		const dataTableModelPath = getInvolvedDataModelObjects(metaContext);
		const selectionVariant = enhanceDataModelPath(dataTableModelPath, this.paths[index]).targetObject as
			| SelectionVariantType
			| undefined;
		const text = selectionVariant?.Text?.toString() ?? "";
		return `${text}${this.showCounts ? countText : ""}`;
	}

	/**
	 * Registers the SideEffects control that must be executed when table cells that are related to configured filter(s) change.
	 * @param metaPath The metaPath.
	 * @param contextPath The contextPath.
	 */
	private registerSideEffectForQuickFilter(metaPath: Context, contextPath: Context): void {
		const dataVisualizationModelPath = getInvolvedDataModelObjects(metaPath, contextPath);
		const viewEntityType = dataVisualizationModelPath.contextLocation?.targetEntityType.fullyQualifiedName;
		const tableNavigationPath = getTargetNavigationPath(dataVisualizationModelPath, true);

		if (tableNavigationPath && viewEntityType) {
			const sourceProperties: Set<string> = new Set();
			for (const selectionVariantPath of this.paths) {
				const selectionVariant = enhanceDataModelPath(dataVisualizationModelPath, selectionVariantPath)
					.targetObject as Partial<SelectionVariantTypeTypes>; // We authorize SelectionVariant without SelectOptions even if it's not compliant with vocabularies
				if (
					selectionVariant.SelectOptions &&
					isAnnotationOfType<SelectionVariant>(selectionVariant, UIAnnotationTypes.SelectionVariantType)
				) {
					selectionVariant.SelectOptions.forEach((selectOption) => {
						const propertyPath = selectOption.PropertyName?.value;
						if (propertyPath) {
							const propertyModelPath = enhanceDataModelPath(dataVisualizationModelPath, propertyPath);
							sourceProperties.add(getTargetObjectPath(propertyModelPath, true));
						}
					});
				}
			}
			this.getAppComponent()!
				.getSideEffectsService()
				.addControlSideEffects(viewEntityType, {
					sourceProperties: Array.from(sourceProperties),
					targetEntities: [
						{
							$NavigationPropertyPath: tableNavigationPath
						}
					],
					sourceControlId: `${this.id}-content`
				});
		}
	}

	/**
	 * Creates the invisibleText for the accessibility compliance.
	 * @returns  The InvisibleText
	 */
	private getAccessibilityControl(): InvisibleText {
		const textBinding = `{sap.fe.i18n>M_TABLE_QUICKFILTER_ARIA}`;
		const invisibleText = (<InvisibleText text={textBinding} id={this.getSelectorAriaLabelledById()} />) as InvisibleText;

		//Adds the invisibleText into the static, hidden area UI area container.
		invisibleText.toStatic();
		return invisibleText;
	}

	private initializeContent(): void {
		if (this.metaPath) {
			const metaPathObject = this.getMetaPathObject(this.metaPath);
			if (metaPathObject) {
				const odataMetaModel = this._getOwner()?.getMetaModel();
				const metaContext = odataMetaModel?.createBindingContext(metaPathObject.getPath());
				const context = odataMetaModel?.createBindingContext(metaPathObject.getContextPath());
				if (!metaContext || !context) {
					return;
				}

				if (this.showCounts) {
					this.registerSideEffectForQuickFilter(metaContext, context);
				}
				/**
				 * The number of views defined for a table determines the UI control that lets users switch the table views:
				 *  - A segmented button for a maximum of three views
				 *  - A select control for four or more views.
				 */

				const selector = this.paths.length > 3 ? this.getSelectSelector(metaContext) : this.getSegmentedButtonSelector(metaContext);
				selector.addDependent(this.getAccessibilityControl());
				this.content = selector;
			}
		}
	}

	protected getMDCTable(): Table {
		if (!this.mdcTable) {
			let currentControl: Control | undefined = this.content;
			while (currentControl && !currentControl.isA<Table>("sap.ui.mdc.Table")) {
				currentControl = currentControl.getParent() as Control | undefined;
			}
			this.mdcTable = currentControl as Table;
			return this.mdcTable;
		} else {
			return this.mdcTable;
		}
	}

	/**
	 * Returns the key of the selected item (or the key of the first item if there's no selection).
	 * @returns The selected key
	 */
	getSelectedKey(): string {
		return this.content?.getSelectedKey() || this.content?.getItems()[0].getKey() || "";
	}

	/**
	 * Sets the selected key.
	 * @param key The key of the item to be selected
	 */
	setSelectedKey(key: string): void {
		this.content?.setSelectedKey(key);
	}

	/**
	 * Sets the count in a pending state.
	 */
	setCountsAsLoading(): void {
		const quickFilterCounts = {} as Record<string, string>;
		const internalContext = this.getBindingContext("internal") as Context;

		for (const k in this.content?.getItems()) {
			quickFilterCounts[k] = "...";
		}
		internalContext.setProperty("quickFilters", { counts: quickFilterCounts });
	}

	/**
	 * Updates the count of the selected item.
	 */
	refreshSelectedCount(): void {
		const count = this.getMDCTable().getRowBinding().getCount();

		if (this.showCounts === true && count !== undefined) {
			const itemIndex = this.content?.getItems().findIndex((selectorItem) => selectorItem.getKey() === this.getSelectedKey());
			if (itemIndex !== undefined && itemIndex > -1) {
				this.getBindingContext("internal")?.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
			}
		}
	}

	/**
	 * Updates the counts of the unselected items.
	 * @returns  Promise resolves once the count are updated
	 */
	async refreshUnSelectedCounts(): Promise<void> {
		if (!this.content) {
			return Promise.resolve();
		}
		const table = this.getMDCTable();
		const items = this.content.getItems();
		const internalContext = this.getBindingContext("internal") as Context;
		const controller = this.getPageController();
		const chart = (controller as PageController & { getChartControl?: Function }).getChartControl?.();
		const chartBlock = chart?.getParent();

		const setItemCounts = async (item: Item): Promise<void> => {
			const itemKey = item.getKey();
			const itemFilters = CommonUtils.getFiltersFromAnnotation(table, itemKey);
			const count = await TableUtils.getListBindingForCount(table, table.getBindingContext(), {
				batchGroupId: "$auto",
				additionalFilters: [...baseTableFilters, ...itemFilters]
			});
			const itemIndex = items.findIndex((selectorItem) => selectorItem.getKey() === itemKey);
			if (itemIndex > -1) {
				internalContext.setProperty(`quickFilters/counts/${itemIndex}`, TableUtils.getCountFormatted(count));
			}
		};

		const chartFilter = chartBlock?.hasSelections() && chartBlock?.getFilter();
		const baseTableFilters = TableUtils.getHiddenFilters(table);
		if (chartFilter) {
			baseTableFilters.push(chartFilter);
		}
		const bindingPromises = items.filter((item) => item.getKey() !== this.getSelectedKey()).map(async (item) => setItemCounts(item));
		try {
			await Promise.all(bindingPromises);
		} catch (error: unknown) {
			Log.error("Error while retrieving the binding promises", error as string);
		}
	}
}
