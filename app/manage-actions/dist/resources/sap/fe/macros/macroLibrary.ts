import type BuildingBlockTemplatingBase from "sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase";
import SemanticDateOperators from "sap/fe/macros/filterBar/SemanticDateOperators";
import FormElementBlock from "sap/fe/macros/form/FormElement.block";
import NotesBuildingBlock from "sap/fe/macros/notes/Notes.block";
import FlexibleColumnLayoutActionsBlock from "./fcl/FlexibleColumnLayoutActions.block";
import FilterBarBlock from "./filterBar/FilterBar.block";
import FormBlock from "./form/Form.block";
import FormContainerBlock from "./form/FormContainer.block";
import CustomFragmentBlock from "./fpm/CustomFragment.block";
import ActionCommandBlock from "./internal/ActionCommand.block";
import FilterFieldBlock from "./internal/FilterField.block";
import HeaderDataPointBlock from "./internal/HeaderDataPoint.block";
import TableBlock from "./table/Table.block";
import TreeTableBlock from "./table/TreeTable.block";
import ValueHelpFilterBarBlock from "./valuehelp/ValueHelpFilterBar.block";

const buildingBlocks: (typeof BuildingBlockTemplatingBase)[] = [
	ActionCommandBlock,
	CustomFragmentBlock,
	HeaderDataPointBlock,
	FilterBarBlock,
	FilterFieldBlock,
	FlexibleColumnLayoutActionsBlock,
	FormBlock,
	FormContainerBlock,
	FormElementBlock,
	TableBlock,
	TreeTableBlock,
	ValueHelpFilterBarBlock,
	NotesBuildingBlock
];

function registerAll(): void {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.register();
	}
}

//This is needed in for templating test utils
function unregisterAll(): void {
	for (const buildingBlock of buildingBlocks) {
		buildingBlock.unregister();
	}
}

// Adding Semantic Date Operators
SemanticDateOperators.addSemanticDateOperators();

//Always register when loaded for compatibility
registerAll();

export default {
	register: registerAll,
	unregister: unregisterAll
};
