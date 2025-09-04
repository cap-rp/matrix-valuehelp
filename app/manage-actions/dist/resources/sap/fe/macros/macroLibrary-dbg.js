/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/filterBar/SemanticDateOperators", "sap/fe/macros/form/FormElement.block", "sap/fe/macros/notes/Notes.block", "./fcl/FlexibleColumnLayoutActions.block", "./filterBar/FilterBar.block", "./form/Form.block", "./form/FormContainer.block", "./fpm/CustomFragment.block", "./internal/ActionCommand.block", "./internal/FilterField.block", "./internal/HeaderDataPoint.block", "./table/Table.block", "./table/TreeTable.block", "./valuehelp/ValueHelpFilterBar.block"], function (SemanticDateOperators, FormElementBlock, NotesBuildingBlock, FlexibleColumnLayoutActionsBlock, FilterBarBlock, FormBlock, FormContainerBlock, CustomFragmentBlock, ActionCommandBlock, FilterFieldBlock, HeaderDataPointBlock, TableBlock, TreeTableBlock, ValueHelpFilterBarBlock) {
  "use strict";

  const buildingBlocks = [ActionCommandBlock, CustomFragmentBlock, HeaderDataPointBlock, FilterBarBlock, FilterFieldBlock, FlexibleColumnLayoutActionsBlock, FormBlock, FormContainerBlock, FormElementBlock, TableBlock, TreeTableBlock, ValueHelpFilterBarBlock, NotesBuildingBlock];
  function registerAll() {
    for (const buildingBlock of buildingBlocks) {
      buildingBlock.register();
    }
  }

  //This is needed in for templating test utils
  function unregisterAll() {
    for (const buildingBlock of buildingBlocks) {
      buildingBlock.unregister();
    }
  }

  // Adding Semantic Date Operators
  SemanticDateOperators.addSemanticDateOperators();

  //Always register when loaded for compatibility
  registerAll();
  return {
    register: registerAll,
    unregister: unregisterAll
  };
}, false);
//# sourceMappingURL=macroLibrary-dbg.js.map
