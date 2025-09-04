import type { Property } from "@sap-ux/vocabularies-types";
import {
	UIAnnotationTerms,
	UIAnnotationTypes,
	type DataField,
	type DataFieldAbstractTypes,
	type DataFieldForAnnotation,
	type FieldGroup,
	type Identification,
	type LineItem
} from "@sap-ux/vocabularies-types/vocabularies/UI";
import { type BaseManifestSettings } from "sap/fe/core/converters/ManifestSettings";
import ManifestWrapper from "sap/fe/core/converters/ManifestWrapper";
import * as MetaModelConverter from "sap/fe/core/converters/MetaModelConverter";
import { isProperty } from "sap/fe/core/helpers/TypeGuards";
import type { DataModelObjectPath } from "sap/fe/core/templating/DataModelPathHelper";
import Service from "sap/ui/core/service/Service";
import ServiceFactory from "sap/ui/core/service/ServiceFactory";
import type Context from "sap/ui/model/Context";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";
import type ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type { ServiceContext } from "types/metamodel_types";
import type AppComponent from "../AppComponent";

type PageConfiguration = {
	active: boolean;
	enabledProperties: string[];
	disabledProperties: string[];
	connectedProperties: string[][];
};

export class InlineEditService extends Service<InlineEditServiceFactory> {
	initPromise!: Promise<InlineEditService>;

	private appComponent!: AppComponent;

	pageConfigurations: Map<string, PageConfiguration> = new Map();

	init(): void {
		this.initPromise = new Promise(async (resolve) => {
			this.appComponent = super.getContext.bind(this)().scopeObject as AppComponent;
			await this.computePageConfigurations();
			resolve(this);
		});
	}

	/**
	 * Compute the page configurations for inline edit for all the pages in the app.
	 * @returns A promise that resolves when the page configurations are computed
	 */
	private async computePageConfigurations(): Promise<void> {
		const model = this.appComponent.getModel();
		if (model?.isA?.<ODataModel>("sap.ui.model.odata.v4.ODataModel")) {
			// We need to wait for the MetaModel to be requested
			await model.getMetaModel().requestObject("/$EntityContainer/");
			const targets = (this.appComponent.getManifestEntry("sap.ui5")?.routing?.targets ?? {}) as unknown as Record<
				string,
				Partial<{ options: Partial<{ settings: BaseManifestSettings }> }>
			>;
			for (const pageKey in targets) {
				const pageConfiguration = this.getPageConfiguration(
					(targets[pageKey].options?.settings as BaseManifestSettings) || undefined,
					model.getMetaModel()
				);
				if (pageConfiguration) {
					this.pageConfigurations.set(pageKey, pageConfiguration);
				}
			}
		}
	}

	/**
	 * Get the connected properties to the given target property.
	 * @param pageKey
	 * @param targetProperty
	 * @returns The connected properties to the given target property
	 */
	public getInlineConnectedProperties(pageKey: string, targetProperty: string): string[] | undefined {
		const connectedProperties = this.pageConfigurations.get(pageKey)?.connectedProperties;
		if (!connectedProperties) {
			return [];
		}
		for (const properties of connectedProperties) {
			if (properties.includes(targetProperty)) {
				// sort the properties for the targetProperty to be always in first position. That ensures the focus to be set on this property
				properties.sort((propertyA: string, propertyB: string) => {
					if (propertyA === targetProperty) return -1;
					if (propertyB === targetProperty) return 1;
					return 0;
				});
				return properties;
			}
		}
		return [];
	}

	/**
	 * Get the data model object associated with the given annotation path.
	 * @param metaModel
	 * @param annotationPath
	 * @param pageContextPath
	 * @returns The data model object associated with the given annotation path
	 */
	private getAssociatedDataModelObject(
		metaModel: ODataMetaModel,
		annotationPath: string,
		pageContextPath: string
	): DataModelObjectPath<unknown> | undefined {
		const pageMetaContext = metaModel.createBindingContext(pageContextPath);
		if (annotationPath.includes(UIAnnotationTerms.FieldGroup)) {
			annotationPath = annotationPath.replace(`@${UIAnnotationTerms.FieldGroup}`, `$Type/@${UIAnnotationTerms.FieldGroup}`);
		} else if (annotationPath.includes(UIAnnotationTerms.Identification)) {
			annotationPath = annotationPath.replace(`@${UIAnnotationTerms.Identification}`, `$Type/@${UIAnnotationTerms.Identification}`);
		} else if (annotationPath.includes(UIAnnotationTerms.LineItem)) {
			annotationPath = annotationPath.replace(`@${UIAnnotationTerms.LineItem}`, `$Type/@${UIAnnotationTerms.LineItem}`);
		}
		const targetContext = pageMetaContext ? metaModel.createBindingContext(annotationPath, pageMetaContext) : null;
		return targetContext
			? MetaModelConverter.getInvolvedDataModelObjects<unknown>(targetContext, pageMetaContext as Context)
			: undefined;
	}

	/**
	 * Get the page configuration for the given manifest entry.
	 * @param manifestEntry
	 * @param metaModel
	 * @returns The page configuration
	 */
	private getPageConfiguration(manifestEntry: BaseManifestSettings | undefined, metaModel: ODataMetaModel): PageConfiguration | null {
		if (!manifestEntry) {
			return null;
		}
		const manifestWrapper = new ManifestWrapper(manifestEntry);
		if (!manifestWrapper.hasInlineEdit()) {
			return {
				active: false,
				enabledProperties: [],
				disabledProperties: [],
				connectedProperties: []
			};
		}
		let pageContextPath = manifestEntry.contextPath;
		if (!pageContextPath) {
			pageContextPath = manifestEntry.entitySet ? `/${manifestEntry.entitySet}` : undefined;
		}
		return {
			active: true,
			enabledProperties: this.getTargetPropertiesForInlineEdit(
				manifestWrapper.getInlineEditEnabledFields(),
				pageContextPath,
				metaModel
			),
			disabledProperties: this.getTargetPropertiesForInlineEdit(
				manifestWrapper.getInlineEditDisabledFields(),
				pageContextPath,
				metaModel
			),
			connectedProperties: this.getConnectedPropertiesForPage(manifestWrapper.getInlineConnectedFields(), pageContextPath, metaModel)
		};
	}

	/**
	 * Get the connected properties for a given page .
	 * @param targetPaths
	 * @param pageContextPath
	 * @param metaModel
	 * @returns The connected properties for the given page
	 */
	private getConnectedPropertiesForPage(
		targetPaths: (string | string[])[],
		pageContextPath: string | undefined,
		metaModel: ODataMetaModel
	): string[][] {
		const connectedPropertiesForPage = [];
		for (const targetPath of targetPaths) {
			const connectedTargets = Array.isArray(targetPath) ? targetPath : [targetPath];

			connectedPropertiesForPage.push(this.getTargetPropertiesForInlineEdit(connectedTargets, pageContextPath, metaModel));
		}
		return connectedPropertiesForPage;
	}

	/**
	 * Get the properties that are considered in edition for the given target paths.
	 * @param targetPaths
	 * @param pageContextPath
	 * @param metaModel
	 * @returns The properties that are considered in edition for the given target paths
	 */
	private getTargetPropertiesForInlineEdit(
		targetPaths: string[],
		pageContextPath: string | undefined,
		metaModel: ODataMetaModel
	): string[] {
		if (!pageContextPath) {
			return [];
		}
		let targetProperties: string[] = [];
		for (const targetPath of targetPaths) {
			const dataModelObject = this.getAssociatedDataModelObject(metaModel, targetPath, pageContextPath);
			if (dataModelObject && dataModelObject.targetObject) {
				targetProperties = targetProperties.concat(InlineEditService.getPropertiesForInlineEdit(dataModelObject.targetObject));
			}
		}
		return targetProperties;
	}

	/**
	 * Gets the properties that can be edited for the given target object.
	 * @param targetObject
	 * @returns The properties that are considered in edition for the given target object
	 */
	private static getPropertiesForInlineEdit(targetObject: undefined | Property | Partial<{ $Type: string; term: string }>): string[] {
		if (!targetObject) {
			return [];
		}
		if (isProperty(targetObject)) {
			return [targetObject.fullyQualifiedName];
		}
		if (targetObject.$Type) {
			switch (targetObject.$Type) {
				case UIAnnotationTypes.DataField:
				case UIAnnotationTypes.DataFieldWithUrl:
				case UIAnnotationTypes.DataPointType:
					return InlineEditService.getPropertiesForInlineEdit((targetObject as DataField).Value?.$target);
				case UIAnnotationTypes.DataFieldForAnnotation:
					return InlineEditService.getPropertiesForInlineEdit((targetObject as DataFieldForAnnotation).Target?.$target);
			}
		}
		if (targetObject.term) {
			switch (targetObject.term) {
				case UIAnnotationTerms.FieldGroup:
					return (targetObject as FieldGroup).Data.reduce(
						(acc: string[], dataField: DataFieldAbstractTypes) =>
							acc.concat(InlineEditService.getPropertiesForInlineEdit(dataField)),
						[]
					);
				case UIAnnotationTerms.Identification:
				case UIAnnotationTerms.LineItem:
					return (targetObject as Identification | LineItem).reduce(
						(acc: string[], dataField: DataFieldAbstractTypes) =>
							acc.concat(InlineEditService.getPropertiesForInlineEdit(dataField)),
						[]
					);
			}
		}
		return [];
	}

	/**
	 * Check if the given page has inline edit enabled.
	 * @param pageKey
	 * @returns Whether the given page has inline edit enabled
	 */
	public doesPageHaveInlineEdit(pageKey: string): boolean {
		return this.pageConfigurations.get(pageKey)?.active ?? false;
	}

	/**
	 * Check if the given property is considered for inline edit on the given page.
	 * @param pageKey
	 * @param propertyFullyQualifiedName
	 * @returns Whether the given property is considered for inline edit on the given page
	 */
	public isPropertyConsideredForInlineEdit(pageKey: string, propertyFullyQualifiedName: string): boolean {
		if (propertyFullyQualifiedName === "") {
			return false;
		}
		const pageConfiguration = this.pageConfigurations.get(pageKey);
		if (pageConfiguration) {
			return (
				(pageConfiguration.enabledProperties.includes(propertyFullyQualifiedName) ||
					pageConfiguration.enabledProperties.length === 0) &&
				!pageConfiguration.disabledProperties.includes(propertyFullyQualifiedName)
			);
		}
		return false;
	}
}

export default class InlineEditServiceFactory extends ServiceFactory<InlineEditServiceFactory> {
	public async createInstance(oServiceContext: ServiceContext<InlineEditServiceFactory>): Promise<InlineEditService> {
		const inlineEditService = new InlineEditService(oServiceContext);
		return inlineEditService.initPromise;
	}
}
