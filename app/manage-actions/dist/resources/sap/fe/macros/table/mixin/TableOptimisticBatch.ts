import Log from "sap/base/Log";
import { type IInterfaceWithMixin } from "sap/fe/base/ClassSupport";
import type PromiseKeeper from "sap/fe/core/helpers/PromiseKeeper";
import TableDelegate from "sap/fe/macros/table/delegates/TableDelegate";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
import type Control from "sap/ui/core/Control";
import UI5Element from "sap/ui/core/Element";
import type FilterBarAPI from "../../filterBar/FilterBarAPI";
import { type ITableBlock } from "../TableAPI";

export default class TableOptimisticBatch implements IInterfaceWithMixin {
	private optimisticBatchEnablerPromise?: PromiseKeeper<boolean>;

	setupMixin(_baseClass: Function): void {
		// This method is needed to implement interface IInterfaceWithMixin
	}

	/**
	 * Method to enable the optimistic batch mode for the table.
	 */
	enableOptimisticBatchMode(this: ITableBlock): void {
		try {
			const controller = this.getPageController();
			TableDelegate.setOptimisticBatchPromiseForModel(controller, this);
			TableDelegate.enableOptimisticBatchMode(controller, this.getContent());
		} catch (e: unknown) {
			Log.warning(e as string);
			// An exception will be thrown when the user clicks go and the table data has already been loaded
			// (setOptimisticBatchPromiseForModel is not supposed to be called once a batch has laready been sent)
			// We just ignore this exception
		}
	}

	/**
	 * Method to setup the optimistic batch mode for the table.
	 * It attaches the search event to the filter bar and enables the optimistic batch mode before the initial load of the table.
	 * @param this The table block
	 */
	async setupOptimisticBatch(this: ITableBlock): Promise<void> {
		const table = this.getContent();
		const controller = this.getPageController();
		if (!table || !controller) {
			return;
		}
		const filterBar = UI5Element.getElementById(table?.getFilter()) as Control | undefined;
		const filterBarAPI = controller.getView().getViewData()?.hideFilterBar !== true ? (filterBar?.getParent() as FilterBarAPI) : null;
		const controllerExtension = controller.extension;

		filterBarAPI?.attachEvent("search", () => {
			const internalBindingContext = table.getBindingContext("internal");
			internalBindingContext?.setProperty("searchFired", true);
		});

		if (
			filterBar &&
			controller.isA<ListReportController>("sap.fe.templates.ListReport.ListReportController") &&
			(controllerExtension === undefined || this.getTableDefinition().control?.disableRequestCache === false)
		) {
			if (filterBarAPI) {
				//The handler above will be triggered only in case of a search event during the initialisation of the page.
				// it will be removed once the page is ready
				filterBarAPI.attachEventOnce("search", this.enableOptimisticBatchMode, this);
				await controller.pageReady.waitPageReady();
				filterBarAPI.detachEvent("search", this.enableOptimisticBatchMode, this);
			} else {
				this.enableOptimisticBatchMode();
			}
		}
	}

	/**
	 * Setter for the optimisticBatchEnablerPromise property.
	 * @param optimisticBatchEnablerPromiseObject The Promise that is to be resolved by the V4 model
	 */
	setOptimisticBatchEnablerPromise(optimisticBatchEnablerPromiseObject: PromiseKeeper<boolean>): void {
		this.optimisticBatchEnablerPromise = optimisticBatchEnablerPromiseObject;
	}

	/**
	 * Getter for the optimisticBatchEnablerPromise property.
	 * @returns The optimisticBatchEnablerPromise property.
	 */
	getOptimisticBatchEnablerPromise(): PromiseKeeper<boolean> | undefined {
		return this.optimisticBatchEnablerPromise;
	}

	/**
	 * Method to know if ListReport is configured with Optimistic batch mode disabled.
	 * @returns Is Optimistic batch mode disabled
	 */
	isOptimisticBatchDisabled(this: ITableBlock): boolean {
		return this.getTableDefinition().control.disableRequestCache || false;
	}
}
