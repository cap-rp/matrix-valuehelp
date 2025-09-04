/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/macros/filterBar/SemanticDateOperators","sap/fe/macros/form/FormElement.block","sap/fe/macros/notes/Notes.block","./fcl/FlexibleColumnLayoutActions.block","./filterBar/FilterBar.block","./form/Form.block","./form/FormContainer.block","./fpm/CustomFragment.block","./internal/ActionCommand.block","./internal/FilterField.block","./internal/HeaderDataPoint.block","./table/Table.block","./table/TreeTable.block","./valuehelp/ValueHelpFilterBar.block"],function(e,o,r,t,l,a,n,c,i,s,f,b,m,k){"use strict";const u=[i,c,f,l,s,t,a,n,o,b,m,k,r];function p(){for(const e of u){e.register()}}function F(){for(const e of u){e.unregister()}}e.addSemanticDateOperators();p();return{register:p,unregister:F}},false);
//# sourceMappingURL=macroLibrary.js.map