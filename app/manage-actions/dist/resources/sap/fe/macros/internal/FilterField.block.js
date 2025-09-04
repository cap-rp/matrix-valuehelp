/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log","sap/fe/base/BindingToolkit","sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase","sap/fe/core/converters/MetaModelConverter","sap/fe/core/converters/controls/ListReport/FilterField","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/core/templating/PropertyFormatters","sap/fe/core/templating/PropertyHelper","sap/fe/core/templating/UIFormatters","sap/fe/macros/CommonHelper","sap/fe/macros/field/FieldHelper","sap/fe/macros/filter/FilterFieldHelper","sap/fe/macros/filter/FilterFieldTemplating","sap/fe/macros/filterBar/ExtendedSemanticDateOperators"],function(e,t,r,i,a,n,o,l,s,u,p,c,d,f,m,y,g){"use strict";var b,h,v,P,F,x,$,C,O,T,I,B,D,E,M,w,V,z,R;var j={};var H=y.getFilterFieldDisplayFormat;var S=m.isRequiredInFilter;var k=m.getPlaceholder;var A=m.getDataType;var q=m.getConditionsBinding;var L=m.formatOptions;var _=m.constraints;var W=c.getDisplayMode;var K=p.getAssociatedExternalIdPropertyPath;var U=u.getRelativePropertyPath;var N=s.getTargetObjectPath;var X=s.getContextRelativeTargetObjectPath;var G=l.generate;var J=o.getMaxConditions;var Q=i.xml;var Y=i.SAP_UI_MODEL_CONTEXT;var Z=r.defineBuildingBlock;var ee=r.blockAttribute;var te=t.formatResult;var re=t.constant;var ie=t.compileExpression;function ae(e,t,r,i){r&&Object.defineProperty(e,t,{enumerable:r.enumerable,configurable:r.configurable,writable:r.writable,value:r.initializer?r.initializer.call(i):void 0})}function ne(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,oe(e,t)}function oe(e,t){return oe=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},oe(e,t)}function le(e,t,r,i,a){var n={};return Object.keys(i).forEach(function(e){n[e]=i[e]}),n.enumerable=!!n.enumerable,n.configurable=!!n.configurable,("value"in n||n.initializer)&&(n.writable=!0),n=r.slice().reverse().reduce(function(r,i){return i(e,t,r)||r},n),a&&void 0!==n.initializer&&(n.value=n.initializer?n.initializer.call(a):void 0,n.initializer=void 0),void 0===n.initializer?(Object.defineProperty(e,t,n),null):n}function se(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let ue=(b=Z({name:"FilterField",namespace:"sap.fe.macros.internal"}),h=ee({type:"sap.ui.model.Context",required:true,isPublic:true}),v=ee({type:"sap.ui.model.Context",required:true,isPublic:true}),P=ee({type:"sap.ui.model.Context",isPublic:true}),F=ee({type:"string",isPublic:true}),x=ee({type:"string",isPublic:true}),$=ee({type:"boolean",isPublic:true}),C=ee({type:"string",isPublic:true}),O=ee({type:"string",isPublic:false}),b(T=(I=function(t){function r(e,r,i){var a;a=t.call(this,e,r,i)||this;ae(a,"property",B,a);ae(a,"contextPath",D,a);ae(a,"visualFilter",E,a);ae(a,"idPrefix",M,a);ae(a,"vhIdPrefix",w,a);ae(a,"useSemanticDateRange",V,a);ae(a,"settings",z,a);ae(a,"editMode",R,a);const o=n.convertMetaModelContext(a.property);const l=K(o);if(l){a.propertyExternalId=a.property.getModel().createBindingContext(a.property.getPath().replace(o.name,l),a.property)}const s=a.propertyExternalId?n.convertMetaModelContext(a.propertyExternalId):undefined;const u=n.getInvolvedDataModelObjects(a.property,a.contextPath);const p=o.name,c=o.name,m=!!s?.annotations?.Common?.ValueListWithFixedValues||!!o.annotations?.Common?.ValueListWithFixedValues;a.controlId=a.idPrefix&&G([a.idPrefix,c]);a.sourcePath=N(u);a.documentRefText=u.targetObject?.annotations.Common?.DocumentationRef?.toString();a.dataType=A(s||o);const y=o?.annotations?.Common?.Label;const b=y?.toString()??re(p);a.label=ie(b)||p;a.conditionsBinding=q(u)||"";a.placeholder=k(o);a.propertyKey=X(u,false,true)||p;a.vfEnabled=!!a.visualFilter&&!(a.idPrefix&&a.idPrefix.includes("Adaptation"));a.vfId=a.vfEnabled?G([a.idPrefix,p,"VisualFilter"]):undefined;a.vfRuntimeId=a.vfEnabled?G([a.idPrefix,p,"VisualFilterContainer"]):undefined;const h=a.property,v=h.getModel(),P=f.valueHelpPropertyForFilterField(h),F=d.isPropertyFilterable(h),x=h.getObject(),$={context:h};a.display=H(u,o,$);a.isFilterable=!(F===false||F==="false");a.maxConditions=J(u);a.dataTypeConstraints=_(x,$);a.dataTypeFormatOptions=L(x,$);a.required=S(x,$);a.operators=f.operators(h,x,a.useSemanticDateRange,a.settings||"",a.contextPath.getPath());if(a.operators){g.addExtendedFilterOperators(a.operators.split(","))}const C=v.createBindingContext(P);const O=C.getObject(),T={context:C},I=U(O,T),j=U(x,$);a.valueHelpProperty=f.getValueHelpPropertyForFilterField(h,x,x.$Type,a.vhIdPrefix,u.targetEntityType.name,j,I,m,a.useSemanticDateRange);return a}j=r;ne(r,t);var i=r.prototype;i.getVisualFilterContent=function e(){let t=this.visualFilter,r="";if(!this.vfEnabled||!t){return r}if(t?.isA?.(Y)){t=t.getObject()}const{contextPath:i,presentationAnnotation:a,outParameter:n,inParameters:o,valuelistProperty:l,selectionVariantAnnotation:s,multipleSelectionAllowed:u,required:p,requiredProperties:c=[],showOverlayInitially:f,renderLineChart:m,isValueListWithFixedValues:y}=t;r=Q`
				<visualFilter:VisualFilter
				    xmlns:visualFilter= "sap.fe.macros.visualfilters"
					id="${this.vfRuntimeId}"
					_contentId="${this.vfId}"
					contextPath="${i}"
					metaPath="${a}"
					outParameter="${n}"
					inParameters="${d.stringifyCustomData(o)}"
					valuelistProperty="${l}"
					selectionVariantAnnotation="${s}"
					multipleSelectionAllowed="${u}"
					required="${p}"
					requiredProperties="${d.stringifyCustomData(c)}"
					showOverlayInitially="${f}"
					renderLineChart="${m}"
					isValueListWithFixedValues="${y}"
					filterBarEntityType="${i}"
				/>
			`;return r};i.getTemplate=async function t(){let r=``;if(this.isFilterable){let t;const i=this.documentRefText===undefined||null?false:true;const a=ie(te([this.documentRefText],"sap.fe.core.formatters.StandardFormatter#asArray"));try{const e=this.propertyExternalId&&n.getInvolvedDataModelObjects(this.propertyExternalId,this.contextPath);t=e?W(e):await this.display}catch(t){e.error(`FE : FilterField BuildingBlock : Error fetching display property for ${this.sourcePath} : ${t}`)}r=Q`
				<mdc:FilterField
					xmlns:mdc="sap.ui.mdc"
					xmlns:template="http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1"
					xmlns:macro="sap.fe.macros"
					xmlns:customData="http://schemas.sap.com/sapui5/extension/sap.ui.core.CustomData/1"
					xmlns:fieldhelp="sap.ui.core.fieldhelp"
					customData:sourcePath="${this.sourcePath}"
					id="${this.controlId}"
					delegate="{name: 'sap/fe/macros/field/FieldBaseDelegate', payload:{isFilterField:true}}"
					propertyKey="${this.propertyKey}"
					label="${this.label}"
					dataType="${this.dataType}"
					display="${t}"
					maxConditions="${this.maxConditions}"
					valueHelp="${this.valueHelpProperty}"
					conditions="${this.conditionsBinding}"
					dataTypeConstraints="${this.dataTypeConstraints}"
					dataTypeFormatOptions="${this.dataTypeFormatOptions}"
					required="${this.required}"
					operators="${this.operators}"
					placeholder="${this.placeholder}"
					${this.attr("editMode",this.editMode)}
				>
					${i?Q`
						<mdc:customData>
							<fieldhelp:FieldHelpCustomData
								${this.attr("value",a)}
							/>
						</mdc:customData>
					`:""}
					${this.vfEnabled?this.getVisualFilterContent():""}
				</mdc:FilterField>
			`}return r};return r}(a),B=le(I.prototype,"property",[h],{configurable:true,enumerable:true,writable:true,initializer:null}),D=le(I.prototype,"contextPath",[v],{configurable:true,enumerable:true,writable:true,initializer:null}),E=le(I.prototype,"visualFilter",[P],{configurable:true,enumerable:true,writable:true,initializer:null}),M=le(I.prototype,"idPrefix",[F],{configurable:true,enumerable:true,writable:true,initializer:function(){return"FilterField"}}),w=le(I.prototype,"vhIdPrefix",[x],{configurable:true,enumerable:true,writable:true,initializer:function(){return"FilterFieldValueHelp"}}),V=le(I.prototype,"useSemanticDateRange",[$],{configurable:true,enumerable:true,writable:true,initializer:function(){return true}}),z=le(I.prototype,"settings",[C],{configurable:true,enumerable:true,writable:true,initializer:function(){return""}}),R=le(I.prototype,"editMode",[O],{configurable:true,enumerable:true,writable:true,initializer:null}),I))||T);j=ue;return j},false);
//# sourceMappingURL=FilterField.block.js.map