/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/helpers/TypeGuards"],function(r){"use strict";var e={};var t=r.isProperty;function o(r,e){const t=p(e);return t&&r?.propertyInfo.hasOwnProperty(t)?r.propertyInfo[t].filterable:e.filterable??true}e.isFilterableProperty=o;function n(r,e){const t=p(e);return t&&r.propertyInfo[t]?r.propertyInfo[t].sortable:e.sortable??true}e.isSortableProperty=n;function p(r){return t(r)?r.name:r.path}e.getPath=p;return e},false);
//# sourceMappingURL=TableDelegateHelper.js.map