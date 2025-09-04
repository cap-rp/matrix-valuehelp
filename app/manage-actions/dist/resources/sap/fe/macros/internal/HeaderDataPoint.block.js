/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/fe/base/BindingToolkit","sap/fe/core/buildingBlocks/templating/BuildingBlockSupport","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplateProcessor","sap/fe/core/buildingBlocks/templating/BuildingBlockTemplatingBase","sap/fe/core/converters/MetaModelConverter","sap/fe/core/helpers/StableIdHelper","sap/fe/core/templating/DataModelPathHelper","sap/fe/macros/CommonHelper","sap/fe/macros/field/FieldTemplating","sap/fe/macros/internal/helpers/DataPointTemplating"],function(e,t,a,i,r,n,o,l,s,c){"use strict";var u,g,p,d,b,f,m,h,v,T,P,D;var x={};var $=c.getHeaderRatingIndicatorText;var y=s.getVisibleExpression;var O=o.getRelativePaths;var H=n.generate;var A=r.getInvolvedDataModelObjects;var V=a.xml;var F=t.defineBuildingBlock;var L=t.blockAttribute;var j=e.pathInModel;var k=e.getExpressionFromAnnotation;var B=e.formatResult;var E=e.compileExpression;function I(e,t,a,i){a&&Object.defineProperty(e,t,{enumerable:a.enumerable,configurable:a.configurable,writable:a.writable,value:a.initializer?a.initializer.call(i):void 0})}function S(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,z(e,t)}function z(e,t){return z=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e},z(e,t)}function M(e,t,a,i,r){var n={};return Object.keys(i).forEach(function(e){n[e]=i[e]}),n.enumerable=!!n.enumerable,n.configurable=!!n.configurable,("value"in n||n.initializer)&&(n.writable=!0),n=a.slice().reverse().reduce(function(a,i){return i(e,t,a)||a},n),r&&void 0!==n.initializer&&(n.value=n.initializer?n.initializer.call(r):void 0,n.initializer=void 0),void 0===n.initializer?(Object.defineProperty(e,t,n),null):n}function _(e,t){throw Error("Decorating class property failed. Please ensure that transform-class-properties is enabled and runs after the decorators transform.")}let w=(u=F({name:"HeaderDataPoint",namespace:"sap.fe.macros.internal"}),g=L({type:"sap.ui.model.Context",required:true}),p=L({type:"sap.ui.model.Context",required:true}),d=L({type:"object",required:true}),b=L({type:"sap.ui.model.Context",required:true}),u(f=(m=(D=function(e){function t(t,a,i){var r;r=e.call(this,t,a,i)||this;I(r,"metaPath",h,r);I(r,"contextPath",v,r);I(r,"converterHeaderFacet",T,r);I(r,"headerFacet",P,r);r.viewData=i.models.viewData;r.manifest=i.models.manifest;return r}x=t;S(t,e);var a=t.prototype;a.getTemplate=function e(){const a=A(this.metaPath,this.contextPath);const i=y(a);const r=H(["fe","HeaderFacet",this.converterHeaderFacet.headerDataPointData?.type!=="Content"?this.converterHeaderFacet?.headerDataPointData?.type:"KeyFigure",A(this.headerFacet)]);const n=t.getPressExpressionForLink(this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation,this.manifest.getProperty("/sap.app/crossNavigation/outbounds"));if(this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation?.targetOutbound?.outbound){return this.getDataPointTitleWithExternalLinkTemplate(r,a,i,n)}else if(this.viewData.getProperty("/controlConfiguration")?.[this.converterHeaderFacet.targetAnnotationValue]?.navigation?.targetSections){return this.getDataPointTitleWithInPageLinkTemplate(r,a,i,n)}return this.getDataPointTitleWithoutLinkTemplate(r,a,i)};a.getDataPointTitleWithExternalLinkTemplate=function e(t,a,i,r){const n=l.getHeaderDataPointLinkVisibility(H(["fe","HeaderDPLink",this.converterHeaderFacet.targetAnnotationValue]),true);const o=l.getHeaderDataPointLinkVisibility(H(["fe","HeaderDPLink",this.converterHeaderFacet.targetAnnotationValue]),false);return V`
			<VBox
				xmlns="sap.m"
				id="${t}"
				visible="${i}"
			>
				<core:InvisibleText
				id="${H(["fe",this.converterHeaderFacet.targetAnnotationValue,"AriaText"])}"
				text="${this.getTranslatedText("T_HEADER_DATAPOINT_TITLE_LINK_EXTERNAL_ARIA")}"
				/>
				<Title
				xmlns="sap.m"
				level="H3"
				visible="${n}"
				>
					<content>
						<Link
							id="${H(["fe","HeaderDPLink",this.converterHeaderFacet.targetAnnotationValue])}"
							text="${a.targetObject?.Title}"
							press="${r}"
							ariaDescribedBy="${H(["fe",this.converterHeaderFacet.targetAnnotationValue,"AriaText"])}"
							class="sapUiTinyMarginBottom"
							customData:ValuePropertyPath="${a.targetObject?.Value?.path}"
						/>
					</content>
				</Title>
				<Title
				xmlns="sap.m"
				id="${H(["fe","HeaderDPTitle",this.converterHeaderFacet.targetAnnotationValue])}"
				level="H3"
				text="${a.targetObject?.Title}"
				class="sapUiTinyMarginBottom"
				visible="${o}"
				/>
				${this.getDataPointTemplate(a)}
			</VBox>`};a.getDataPointTitleWithInPageLinkTemplate=function e(t,a,i,r){return V`
			<VBox
				xmlns="sap.m"
				id="${t}"
				visible="${i}"
			>
				<core:InvisibleText
					text="${this.getTranslatedText("T_COMMON_HEADERDP_TITLE_LINK_INPAGE_ARIA")}"
					id="${H(["fe",this.converterHeaderFacet.targetAnnotationValue,"AriaText"])}"
				/>
				<core:InvisibleText
					text="${a.targetObject?.Title}"
					id="${H(["fe","HeaderDPTitle",this.converterHeaderFacet.targetAnnotationValue])}"
				/>
				<Title xmlns="sap.m" level="H3" ${this.attr("visible",!!a.targetObject?.Title)}>
					<content>
						<Link
							id="${H(["fe","HeaderDPLink",this.converterHeaderFacet.targetAnnotationValue])}"
							text="${a.targetObject?.Title}"
							press="${r}"
							ariaDescribedBy="${H(["fe",this.converterHeaderFacet.targetAnnotationValue,"AriaText"])}"
							class="sapUiTinyMarginBottom"
						/>
					</content>
				</Title>
				${this.getDataPointTemplate(a)}
			</VBox>`};a.getDataPointTitleWithoutLinkTemplate=function e(t,a,i){return V`
			<VBox
				xmlns="sap.m"
				id="${t}"
				visible="${i}"
			>
				<Title
				xmlns="sap.m"
				id="${H(["fe","HeaderDPTitle",this.converterHeaderFacet.targetAnnotationValue])}"
					level="H3"
					text="${a.targetObject?.Title}"
					class="sapUiTinyMarginBottom"
				/>

				${this.getDataPointTemplate(a)}
			</VBox>`};a.getDataPointTemplate=function e(t){return V`
			${this.getDataPointFirstLabel(t)}
			<internalMacro:DataPoint
				xmlns:internalMacro="sap.fe.macros.internal"
				metaPath="${this.metaPath.getPath()}"
				contextPath="${this.contextPath.getPath()}"
				ariaLabelledBy="${H(["fe","HeaderDPTitle",this.converterHeaderFacet.targetAnnotationValue])}"
			>
				<internalMacro:formatOptions>
  					 <internalMacro:DataPointFormatOptions dataPointStyle="large" showLabels="true" iconSize="1.375rem" showEmptyIndicator="true" />
				</internalMacro:formatOptions>
			</internalMacro:DataPoint>
			${this.getDataPointSecondLabel(t)}`};a.getDataPointFirstLabel=function e(t){switch(t.targetObject?.Visualization){case"UI.VisualizationType/Rating":const e=$(this.metaPath,t.targetObject);return V` <Label text="${e}" visible="${!!(t.targetObject?.SampleSize||t.targetObject?.Description)}"/>`;case"UI.VisualizationType/Progress":return V`<Label text="${t.targetObject?.Description}" visible="${!!t.targetObject?.Description}"/>`;default:return""}};a.getDataPointSecondLabel=function e(t){switch(t.targetObject?.Visualization){case"UI.VisualizationType/Rating":const e=E(B([j("T_HEADER_RATING_INDICATOR_FOOTER","sap.fe.i18n"),k(t.targetObject?.Value,O(t)),t.targetObject?.TargetValue?k(t.targetObject?.TargetValue,O(t)):"5"],"MESSAGE"));return V`<Label core:require="{MESSAGE: 'sap/base/strings/formatMessage' }" text="${e}" visible="true"/>`;case"UI.VisualizationType/Progress":const a=t.targetObject?.Value?.$target?.annotations?.Common?.Label?.toString();return a?V`<Label text="${a}"/>`:"";default:return""}};return t}(i),D.getPressExpressionForLink=function(e,t){if(e?.targetOutbound&&"outbound"in e.targetOutbound){return".handlers.onDataPointTitlePressed($controller, ${$source>}, "+JSON.stringify(t)+","+JSON.stringify(e.targetOutbound.outbound)+")"}else if(e&&e["targetSections"]){return".handlers.navigateToSubSection($controller, '"+JSON.stringify(e["targetSections"])+"')"}else{return undefined}},D),h=M(m.prototype,"metaPath",[g],{configurable:true,enumerable:true,writable:true,initializer:null}),v=M(m.prototype,"contextPath",[p],{configurable:true,enumerable:true,writable:true,initializer:null}),T=M(m.prototype,"converterHeaderFacet",[d],{configurable:true,enumerable:true,writable:true,initializer:null}),P=M(m.prototype,"headerFacet",[b],{configurable:true,enumerable:true,writable:true,initializer:null}),m))||f);x=w;return x},false);
//# sourceMappingURL=HeaderDataPoint.block.js.map