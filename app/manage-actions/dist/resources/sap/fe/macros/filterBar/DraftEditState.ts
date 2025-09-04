import Library from "sap/ui/core/Lib";
import type Context from "sap/ui/model/Context";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";

const feBundle = Library.getResourceBundleFor("sap.fe.core")!;
/**
 * Enum for edit state of a document in an draft enabled service collection.
 * Allows to simplify filtering on a set of documents as described by the
 * individual state
 * @readonly
 * @enum {string}
 */
const EDITSTATE = {
	/**
	 * Active documents that don't have a corresponding draft and all own draft documents
	 */
	ALL: {
		id: "",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_FILTER")
	},
	/**
	 * Active documents that don't have a draft document
	 */
	UNCHANGED: {
		id: "UNCHANGED",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_UNCHANGED_FILTER")
	},
	/**
	 * Own draft documents
	 */
	OWN_DRAFT: {
		id: "OWN_DRAFT",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_OWN_DRAFT_FILTER")
	},
	/**
	 * Active documents that are locked by other users
	 */
	LOCKED: {
		id: "LOCKED",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_LOCKED_FILTER")
	},
	/**
	 * Active documents that have draft documents by other users
	 *
	 */
	UNSAVED_CHANGES: {
		id: "UNSAVED_CHANGES",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_UNSAVED_CHANGES_FILTER")
	},
	/**
	 * Active documents only
	 */
	ALL_HIDING_DRAFTS: {
		id: "ALL_HIDING_DRAFTS",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_ALL_HIDING_DRAFTS_FILTER")
	},
	/**
	 * Active documents only (with collaborative draft)
	 */
	SAVED_ONLY: {
		id: "SAVED_ONLY",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_SAVED_ONLY_FILTER")
	},
	/**
	 * My drafts, i.e. the drafts I have created, have been invited to or have made a change in (with collaborative draft)
	 */
	MY_DRAFTS: {
		id: "MY_DRAFTS",
		display: feBundle.getText("C_DRAFT_EDIT_STATE_DRAFT_MY_DRAFTS_FILTER")
	},

	getEditStates: function (isDraftCollaborative: boolean): Record<string, string>[] {
		if (isDraftCollaborative) {
			return [this.ALL, this.MY_DRAFTS, this.SAVED_ONLY];
		} else {
			return [this.ALL, this.ALL_HIDING_DRAFTS, this.UNCHANGED, this.OWN_DRAFT, this.LOCKED, this.UNSAVED_CHANGES];
		}
	},

	/**
	 * Determines the context of the edit state of the document.
	 * @param macroProps The macro properties
	 * @returns The bound context.
	 */
	getEditStatesContext: function (macroProps: Context): Context {
		let availableEditStates: Record<string, string>[];
		if (macroProps.getProperty("isDraftCollaborative")) {
			availableEditStates = [EDITSTATE.ALL, EDITSTATE.MY_DRAFTS, EDITSTATE.SAVED_ONLY];
		} else {
			availableEditStates = [
				EDITSTATE.ALL,
				EDITSTATE.ALL_HIDING_DRAFTS,
				EDITSTATE.UNCHANGED,
				EDITSTATE.OWN_DRAFT,
				EDITSTATE.LOCKED,
				EDITSTATE.UNSAVED_CHANGES
			];
		}

		return new JSONModel(availableEditStates).bindContext("/").getBoundContext()!;
	},

	/**
	 * Determines the current user id.
	 * @returns The id of the current user.
	 */
	getCurrentUserID: function (): string | undefined {
		// in case no shell is available (e.g. in standalone mode), we use the user id from the adt object
		const ushellContainer = sap.ui.require("sap/ushell/Container");
		return ushellContainer?.getUser()?.getId() ?? window.adt?.userID;
	},

	/**
	 * Determines the filter of the current edit state of the document.
	 * @param editState The current editState
	 * @returns The associated filter.
	 */
	getFilterForEditState: function (editState: string): Filter {
		switch (editState) {
			case EDITSTATE.UNCHANGED.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({ path: "HasDraftEntity", operator: FilterOperator.EQ, value1: false })
					],
					and: true
				});
			case EDITSTATE.OWN_DRAFT.id:
				return new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false });
			case EDITSTATE.LOCKED.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.NE,
							value1: ""
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.NE,
							value1: null
						})
					],
					and: true
				});
			case EDITSTATE.UNSAVED_CHANGES.id:
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						}),
						new Filter({
							path: "DraftAdministrativeData/InProcessByUser",
							operator: FilterOperator.EQ,
							value1: ""
						})
					],
					and: true
				});
			case EDITSTATE.ALL_HIDING_DRAFTS.id:
			case EDITSTATE.SAVED_ONLY.id:
				return new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: true });
			case EDITSTATE.MY_DRAFTS.id:
				const currentUserID = this.getCurrentUserID();
				return currentUserID
					? new Filter({
							filters: [
								new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }),
								new Filter({
									path: "DraftAdministrativeData/DraftAdministrativeUser",
									operator: FilterOperator.Any,
									variable: "user",
									condition: new Filter({
										path: "user/UserID",
										operator: FilterOperator.EQ,
										value1: this.getCurrentUserID()
									})
								})
							],
							and: true
					  })
					: new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }); // Couldn't find current user (e.g. no shell) --> show all drafts
			default:
				// ALL
				return new Filter({
					filters: [
						new Filter({ path: "IsActiveEntity", operator: FilterOperator.EQ, value1: false }),
						new Filter({
							path: "SiblingEntity/IsActiveEntity",
							operator: FilterOperator.EQ,
							value1: null
						})
					],
					and: false
				});
		}
	}
};

export default EDITSTATE;
