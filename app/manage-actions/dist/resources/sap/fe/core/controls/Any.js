/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/ui/core/Element"],function(t){"use strict";const e=t.extend("sap.fe.core.controls.Any",{metadata:{properties:{any:"any",bindBackProperty:"string",anyText:"string",anyBoolean:"boolean"}},updateProperty:function(t){const e=this.getBindingInfo(t).binding.getExternalValue();if(t==="any"){this.setAny(e);const t=this.getBindingContext();if(this.getBindBackProperty()&&t){const n=this.getModel().getLocalAnnotationModel();const i=t.getPath(this.getBindBackProperty());if(n.getProperty(i)!==e){n.setProperty(i,e)}}}else{this.setAnyText(e)}}});return e},false);
//# sourceMappingURL=Any.js.map