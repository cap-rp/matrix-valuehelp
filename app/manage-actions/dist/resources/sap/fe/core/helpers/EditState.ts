const enumEditState = {
	CLEAN: 0,
	PROCESSED: 1,
	DIRTY: 2
};
let currentEditState = enumEditState.CLEAN;

export default {
	/**
	 * This sets the edit state as dirty, meaning bindings have to be refreshed.
	 */
	setEditStateDirty: function (): void {
		currentEditState = enumEditState.DIRTY;
	},

	/**
	 * This sets the edit state as processed, meaning is can be reset to clean after all bindings are refreshed.
	 */
	setEditStateProcessed: function (): void {
		currentEditState = enumEditState.PROCESSED;
	},

	/**
	 * Resets the edit state to the initial state.
	 */
	resetEditState: function (): void {
		currentEditState = enumEditState.CLEAN;
	},

	/**
	 * Returns true if the edit state is not clean, meaning bindings have to be refreshed
	 */

	isEditStateDirty: function (): boolean {
		return currentEditState !== enumEditState.CLEAN;
	},

	/**
	 * Cleans the edit state if it has been processed, i.e. bindings have been properly refreshed.
	 */
	cleanProcessedEditState: function (): void {
		if (currentEditState === enumEditState.PROCESSED) {
			currentEditState = enumEditState.CLEAN;
		}
	}
};
