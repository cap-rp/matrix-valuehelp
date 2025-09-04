import type MdcTable from "sap/ui/mdc/Table";
const TableScroller = {
	/**
	 * Scrolls an MDCTable to a given row, identified by its context path.
	 * If the row with the path can't be found, the table stays unchanged.
	 * @param table The table that is being scrolled through
	 * @param rowPath The path identifying the row to scroll to
	 */
	scrollTableToRow: function (table: MdcTable, rowPath: string): void {
		const tableRowBinding = table.getRowBinding();
		const findAndScroll = function (): void {
			const tableRow = tableRowBinding.getAllCurrentContexts().find((item) => item.getPath() === rowPath);
			if (tableRow && tableRow.getIndex() !== undefined) {
				table.scrollToIndex(tableRow.getIndex() as number);
			}
		};
		if (
			(table.getGroupConditions() === undefined ||
				(table.getGroupConditions() as { groupLevels?: object[] })?.groupLevels?.length === 0) &&
			tableRowBinding
		) {
			// we only scroll if there are no grouping otherwise scrollToIndex doesn't behave as expected
			const tableRowBindingContexts = tableRowBinding.getAllCurrentContexts();
			if (
				(tableRowBindingContexts.length === 0 && tableRowBinding.getLength() > 0) ||
				tableRowBindingContexts.some(function (context) {
					return context === undefined;
				})
			) {
				// The contexts are not loaded yet --> wait for a change event before scrolling
				tableRowBinding.attachEventOnce("dataReceived", findAndScroll);
			} else {
				// Contexts are already loaded --> we can try to scroll immediately
				findAndScroll();
			}
		}
	}
};

export default TableScroller;
