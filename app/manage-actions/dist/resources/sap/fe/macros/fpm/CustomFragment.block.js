/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase"],function(e,t,r){"use strict";var i,n,a,o,l,u,c,s,m,p,f;var g={};var b=t.xml;var d=e.defineBuildingBlock;var h=e.blockAttribute;var y=e.blockAggregation;function v(e,t,r,i){r&&Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function C(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,k(e,t)}function k(e,t){return k=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},k(e,t)}function z(e,t,r,i,n){var a={};return Object.keys(i).forEach(function(e){a[e]=i[e]}),a.enumerable=!!a.enumerable,a.configurable=!!a.configurable,("value"in a||a.initializer)&&(a.writable=!0),a=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},a),n&&void 0!==a.initializer&&(a.value=a.initializer?a.initializer.call(n):void 0,a.initializer=void 0),void 0===a.initializer?(Object.defineProperty(e,t,a),null):a}function B(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let x=(i=d({name:"CustomFragment",namespace:"sap.fe.macros.fpm"}),n=h({type:"string",required:true}),a=h({type:"sap.ui.model.Context",required:false}),o=h({type:"string",required:true}),l=y({type:"sap.ui.core.CustomData",slot:"childCustomData"}),i(u=(c=function(e){function t(t,r,i){var n;n=e.call(this,t,r,i)||this;v(n,"id",s,n);v(n,"contextPath",m,n);v(n,"fragmentName",p,n);v(n,"childCustomData",f,n);return n}g=t;C(t,e);var r=t.prototype;r.getTemplate=function e(){const t=this.fragmentName+"-JS".replace(/\//g,".");const r=this.childCustomData;const i={};let n=r?.firstElementChild;while(n){const e=n.getAttribute("key");if(e!==null){i[e]=n.getAttribute("value")}n=n.nextElementSibling}return b`<macros:CustomFragmentFragment
			xmlns:compo="http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1"
			xmlns:macros="sap.fe.macros.fpm"
			fragmentName="${t}"
			${this.attr("childCustomData",Object.keys(i).length?JSON.stringify(i):undefined)}
			id="${this.id}"
			type="CUSTOM"
			contextPath="${this.contextPath?.getPath()}"
		>
			<compo:fragmentContent>
				<core:FragmentDefinition>
					<core:Fragment fragmentName="${this.fragmentName}" type="XML"/>
				</core:FragmentDefinition>
			</compo:fragmentContent>
		</macros:CustomFragmentFragment>`};return t}(r),s=z(c.prototype,"id",[n],{configurable:true,enumerable:true,writable:true,initializer:null}),m=z(c.prototype,"contextPath",[a],{configurable:true,enumerable:true,writable:true,initializer:null}),p=z(c.prototype,"fragmentName",[o],{configurable:true,enumerable:true,writable:true,initializer:null}),f=z(c.prototype,"childCustomData",[l],{configurable:true,enumerable:true,writable:true,initializer:null}),c))||u);g=x;return g},false);
//# sourceMappingURL=CustomFragment.block.js.map