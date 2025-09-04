/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/designtime/AnnotationBasedChanges","sap/ui/fl/write/api/FeaturesAPI"],function(e,n){"use strict";var t=e.getTextArrangementChangeAction;var a=e.getTargetPropertyFromFormElement;var r=e.getRenameAction;return{actions:{annotation:e=>{let o;const i=a(e);if(i&&n.areAnnotationChangesEnabled()){o=r(true)}const s={textArrangement:t()};if(o){s.rename=o}return s},rename:e=>{const t=a(e);if(t&&n.areAnnotationChangesEnabled()){return undefined}return{changeType:"renameField",domRef:function(e){return e.getLabelControl()?.getDomRef()}}}}}},false);
//# sourceMappingURL=FormElement.designtime.js.map