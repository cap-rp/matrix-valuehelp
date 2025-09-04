import merge from "sap/base/util/merge";
import type AppComponent from "sap/fe/core/AppComponent";
import type {
	BaseManifestSettings,
	CombinedViewPathConfiguration,
	ContentDensitiesType,
	ControlManifestConfiguration,
	CustomViewTemplateConfiguration,
	FilterManifestConfiguration,
	FormManifestConfiguration,
	KPIConfiguration,
	ListReportManifestSettings,
	ManifestAction,
	ManifestHeaderFacet,
	ManifestSection,
	MultipleViewsConfiguration,
	NavigationSettingsConfiguration,
	ObjectPageManifestSettings,
	SingleViewPathConfiguration,
	TableManifestConfiguration,
	TemplateType,
	TransportSelectionDefinition,
	ViewConfiguration
} from "sap/fe/core/converters/ManifestSettings";
import { VariantManagementType } from "sap/fe/core/converters/ManifestSettings";
import type { ConfigurableRecord } from "sap/fe/core/converters/helpers/ConfigurableObject";
import Device from "sap/ui/Device";
import type { ManifestContent, ManifestOutboundEntry } from "sap/ui/core/Manifest";

function ensureAnnotationPath<T extends object>(obj: T | undefined, property: keyof T): void {
	const propertyValue = obj?.[property];
	if (Array.isArray(propertyValue)) {
		propertyValue.forEach((entry) => ensureAnnotationPath(entry, "annotationPath"));
	} else if (propertyValue && typeof propertyValue === "string" && !propertyValue.includes("@")) {
		obj[property] = ("@" + propertyValue) as T[keyof T];
	}
}

/**
 *
 */
class ManifestWrapper {
	/**
	 * Creates a wrapper object to ensure the data returned from the manifest is consistent and everything is merged correctly.
	 * @param oManifestSettings The manifest settings for the current page
	 * @param appComponent The app component
	 * @returns The manifest wrapper object
	 */
	constructor(
		private oManifestSettings: BaseManifestSettings,
		private appComponent?: AppComponent
	) {
		// Ensure that properties which are meant to contain an *annotation* path contain a '@'
		ensureAnnotationPath(this.oManifestSettings, "defaultTemplateAnnotationPath");

		(this.oManifestSettings as ListReportManifestSettings).views?.paths.forEach((path) => {
			ensureAnnotationPath(path as SingleViewPathConfiguration, "annotationPath");
			ensureAnnotationPath(path as CombinedViewPathConfiguration, "primary");
			ensureAnnotationPath(path as CombinedViewPathConfiguration, "secondary");
		});

		if (this.oManifestSettings.controlConfiguration) {
			for (const controlConfiguration of Object.values(this.oManifestSettings.controlConfiguration)) {
				const quickVariantSelection = (controlConfiguration as TableManifestConfiguration).tableSettings?.quickVariantSelection;
				ensureAnnotationPath(quickVariantSelection, "paths");
			}
		}
	}

	/**
	 * Returns the global manifest content sap.fe.
	 * @returns The Object manifest sap.fe
	 */
	getSapFeManifestConfiguration(): ManifestContent["sap.fe"] | undefined {
		return this.oManifestSettings.sapFeManifestConfiguration;
	}

	/**
	 * Returns the current template type.
	 * @returns The type of the current template
	 */
	getTemplateType(): TemplateType {
		return this.oManifestSettings.converterType;
	}

	/**
	 * Checks whether the current template should display the filter bar.
	 * @returns `true` if the filter bar should be hidden
	 */
	isFilterBarHidden(): boolean {
		return !!(this.oManifestSettings as ListReportManifestSettings)?.hideFilterBar;
	}

	useHiddenFilterBar(): boolean {
		return !!(this.oManifestSettings as ListReportManifestSettings)?.useHiddenFilterBar;
	}

	getCollapsedHeaderFragment(): string | undefined {
		return (this.oManifestSettings as ListReportManifestSettings)?.content?.header?.customHeader?.collapsedHeaderFragment;
	}

	getExpandedHeaderFragment(): string | undefined {
		return (this.oManifestSettings as ListReportManifestSettings)?.content?.header?.customHeader?.expandedHeaderFragment;
	}

	/**
	 * Checks whether the current environment is a desktop or not.
	 * @returns `true` if we are on a desktop
	 */
	isDesktop(): boolean {
		return !!this.oManifestSettings.isDesktop;
	}

	/**
	 * Checks whether the current environment is a mobile phone or not.
	 * @returns `true` if we are on a mobile phone
	 */
	isPhone(): boolean {
		return !!this.oManifestSettings.isPhone;
	}

	/**
	 * Retrieves the form containers (field groups or identification) defined in the manifest.
	 * @param facetTarget The target annotation path for this form
	 * @returns A set of form containers defined in the manifest indexed by an iterable key
	 */
	getFormContainer(facetTarget: string): FormManifestConfiguration {
		return this.oManifestSettings.controlConfiguration?.[facetTarget] as FormManifestConfiguration;
	}

	/**
	 * Retrieves the header facets defined in the manifest.
	 * @returns A set of header facets defined in the manifest indexed by an iterable key
	 */
	getHeaderFacets(): ConfigurableRecord<ManifestHeaderFacet> {
		return merge(
			{},
			this.oManifestSettings.controlConfiguration?.["@com.sap.vocabularies.UI.v1.HeaderFacets"]?.facets ?? {},
			(this.oManifestSettings as ObjectPageManifestSettings).content?.header?.facets ?? {}
		) as unknown as ConfigurableRecord<ManifestHeaderFacet>;
	}

	/**
	 * Retrieves the header actions defined in the manifest.
	 * @returns A set of actions defined in the manifest indexed by an iterable key
	 */
	getHeaderActions(): ConfigurableRecord<ManifestAction> {
		return this.oManifestSettings.content?.header?.actions || {};
	}

	/**
	 * Retrieves the footer actions defined in the manifest.
	 * @returns A set of actions defined in the manifest indexed by an iterable key
	 */
	getFooterActions(): ConfigurableRecord<ManifestAction> {
		return this.oManifestSettings.content?.footer?.actions || {};
	}

	/**
	 * Retrieves the variant management as defined in the manifest.
	 * @returns A type of variant management
	 */
	getVariantManagement(): VariantManagementType {
		return this.oManifestSettings.variantManagement || VariantManagementType.None;
	}

	/**
	 * Retrieves the annotation Path for the SPV in the manifest.
	 * @returns The annotation path for the default SPV or undefined.
	 */
	getDefaultTemplateAnnotationPath(): string | undefined {
		return this.oManifestSettings.defaultTemplateAnnotationPath;
	}

	/**
	 * Retrieves the control configuration as defined in the manifest for a specific annotation path.
	 * @param sAnnotationPath The relative annotation path
	 * @returns The control configuration
	 */
	getControlConfiguration<T = ControlManifestConfiguration>(sAnnotationPath: string): T {
		return (this.oManifestSettings?.controlConfiguration?.[sAnnotationPath] || {}) as T;
	}

	/**
	 * Retrieves the configured settings for a given navigation target.
	 * @param navigationOrCollectionName The name of the navigation to check
	 * @returns The navigation settings configuration
	 */
	getNavigationConfiguration(navigationOrCollectionName: string): NavigationSettingsConfiguration {
		return this.oManifestSettings?.navigation?.[navigationOrCollectionName] || {};
	}

	/**
	 * Retrieves the view level.
	 * @returns The current view level
	 */
	getViewLevel(): number {
		return this.oManifestSettings?.viewLevel || -1;
	}

	/**
	 * Retrieves the contentDensities setting of the application.
	 * @returns The current content density
	 */
	getContentDensities(): ContentDensitiesType {
		return (
			this.oManifestSettings?.contentDensities || {
				cozy: false,
				compact: false
			}
		);
	}

	/**
	 * Checks whether we are in FCL mode or not.
	 * @returns `true` if we are in FCL
	 */
	isFclEnabled(): boolean {
		return !!this.oManifestSettings?.fclEnabled;
	}

	/**
	 * Checks whether the current settings (application / shell) allows us to use condensed layout.
	 * @returns `true` if we can use the condensed layout, false otherwise
	 */
	isCondensedLayoutCompliant(): boolean {
		const manifestContentDensity = this.oManifestSettings?.contentDensities || {
			cozy: false,
			compact: false
		};
		const shellContentDensity = this.oManifestSettings?.shellContentDensity || "compact";
		let isCondensedLayoutCompliant = true;
		const isSmallDevice = !Device.system.desktop || Device.resize.width <= 320;
		if (
			(manifestContentDensity?.cozy === true && manifestContentDensity?.compact !== true) ||
			shellContentDensity === "cozy" ||
			isSmallDevice
		) {
			isCondensedLayoutCompliant = false;
		}
		return isCondensedLayoutCompliant;
	}

	/**
	 * Checks whether the current settings (application / shell) uses compact mode as content density.
	 * @returns `true` if compact mode is set as content density, false otherwise
	 */
	isCompactType(): boolean {
		const manifestContentDensity = this.getContentDensities();
		const shellContentDensity = this.oManifestSettings?.shellContentDensity || "compact";
		return manifestContentDensity.compact !== false || shellContentDensity === "compact" ? true : false;
	}

	/**
	 * Retrieves the outbound navigation entries defined in the cross-navigation section of the application manifest.
	 * @returns The entries if they exist, otherwise undefined
	 */
	getOutboundNavigationEntries(): Record<string, ManifestOutboundEntry> | undefined {
		return this.appComponent?.getManifestEntry("sap.app")?.crossNavigation?.outbounds;
	}

	//region OP Specific

	/**
	 * Retrieves the section layout defined in the manifest.
	 * @returns The type of section layout of the object page
	 */
	getSectionLayout(): string {
		return (this.oManifestSettings as ObjectPageManifestSettings).sectionLayout ?? "Tabs";
	}

	/**
	 * Retrieves the sections defined in the manifest.
	 * @returns A set of manifest sections indexed by an iterable key
	 */
	getSections(): ConfigurableRecord<ManifestSection> {
		return merge(
			{},
			this.oManifestSettings.controlConfiguration?.["@com.sap.vocabularies.UI.v1.Facets"]?.sections ?? {},
			(this.oManifestSettings as ObjectPageManifestSettings).content?.body?.sections ?? {}
		) as unknown as ConfigurableRecord<ManifestSection>;
	}

	/**
	 * Returns true of the header of the application is editable and should appear in the facets.
	 * @returns `true` if the header if editable
	 */
	isHeaderEditable(): boolean {
		return this.getShowObjectPageHeader() && !!(this.oManifestSettings as ObjectPageManifestSettings).editableHeaderContent;
	}

	/**
	 * Returns true if we should use text instead of IllustratedMessage for the noData aggregation in the whole page.
	 * @returns `true` if we should use text for noData aggregation
	 */
	getUseTextForNoDataMessages(): boolean {
		return (this.oManifestSettings as ObjectPageManifestSettings).useTextForNoDataMessages ?? false;
	}

	/**
	 * Returns true if we should show the object page header.
	 * @returns `true` if the header should be displayed
	 */
	getShowAnchorBar(): boolean {
		return (this.oManifestSettings as ObjectPageManifestSettings).content?.header?.anchorBarVisible !== undefined
			? !!(this.oManifestSettings as ObjectPageManifestSettings).content?.header?.anchorBarVisible
			: true;
	}

	/**
	 * Defines whether or not the section will be displayed in different tabs.
	 * @returns `true` if the icon tab bar should be used instead of scrolling
	 */
	useIconTabBar(): boolean {
		return this.getShowAnchorBar() && (this.oManifestSettings as ObjectPageManifestSettings).sectionLayout === "Tabs";
	}

	/**
	 * Returns true if the object page header is to be shown.
	 * @returns `true` if the object page header is to be displayed
	 */
	getShowObjectPageHeader(): boolean {
		return (this.oManifestSettings as ObjectPageManifestSettings).content?.header?.visible !== undefined
			? !!(this.oManifestSettings as ObjectPageManifestSettings).content?.header?.visible
			: true;
	}

	/**
	 * Returns whether the lazy loader should be enabled for this page or not.
	 * @returns `true` if the lazy loader should be enabled
	 */
	getEnableLazyLoading(): boolean {
		return this.oManifestSettings.enableLazyLoading ?? false;
	}

	/**
	 * Returns the transport selection definition.
	 * @returns Definition with transport property and select action
	 */
	getTransportSelection(): TransportSelectionDefinition | undefined {
		return (this.oManifestSettings as ObjectPageManifestSettings).content?.transportSelection;
	}

	//endregion OP Specific

	//region LR Specific

	/**
	 * Retrieves the multiple view configuration from the manifest.
	 * @returns The views that represent the manifest object
	 */
	getViewConfiguration(): MultipleViewsConfiguration | undefined {
		return (this.oManifestSettings as ListReportManifestSettings).views;
	}

	/**
	 * Retrieves the stickyMultiTabHeader configuration from the manifest.
	 * @returns Returns True if stickyMultiTabHeader is enabled or undefined
	 */
	getStickyMultiTabHeaderConfiguration(): boolean {
		const bStickyMultiTabHeader = (this.oManifestSettings as ListReportManifestSettings).stickyMultiTabHeader;
		return bStickyMultiTabHeader !== undefined ? bStickyMultiTabHeader : true;
	}

	/**
	 * Retrieves the KPI configuration from the manifest.
	 * @returns Returns a map between KPI names and their respective configuration
	 */
	getKPIConfiguration(): { [kpiName: string]: KPIConfiguration } {
		return (this.oManifestSettings as ListReportManifestSettings).keyPerformanceIndicators || {};
	}

	/**
	 * Retrieves the filter configuration from the manifest.
	 * @param configPath
	 * @returns The filter configuration from the manifest
	 */
	getFilterConfiguration(configPath = "@com.sap.vocabularies.UI.v1.SelectionFields"): FilterManifestConfiguration {
		return this.getControlConfiguration<FilterManifestConfiguration>(configPath);
	}

	/**
	 * Returns true if there are multiple entity sets to be displayed.
	 * @returns `true` if there are multiple entity sets
	 */
	hasMultipleEntitySets(): boolean {
		const viewConfig = this.getViewConfiguration() || { paths: [] };
		const manifestEntitySet = this.oManifestSettings.entitySet;
		return (
			viewConfig.paths.find((path: ViewConfiguration) => {
				if ((path as CustomViewTemplateConfiguration)?.template) {
					return undefined;
				} else if (this.hasMultipleVisualizations(path as CombinedViewPathConfiguration)) {
					const { primary, secondary } = path as CombinedViewPathConfiguration;
					return (
						primary.some((primaryPath) => primaryPath.entitySet && primaryPath.entitySet !== manifestEntitySet) ||
						secondary.some((secondaryPath) => secondaryPath.entitySet && secondaryPath.entitySet !== manifestEntitySet)
					);
				} else {
					path = path as SingleViewPathConfiguration;
					return path.entitySet && path.entitySet !== manifestEntitySet;
				}
			}) !== undefined
		);
	}

	/**
	 * Returns the context path for the template if it is specified in the manifest.
	 * @returns The context path for the template
	 */
	getContextPath(): string | undefined {
		return this.oManifestSettings?.contextPath;
	}

	/**
	 * Returns true if the configuration is a single path configuration.
	 * @param viewConfig The view configuration
	 * @returns `true` if this is a single path configuration
	 */
	isViewPathConfiguration(viewConfig: ViewConfiguration): viewConfig is SingleViewPathConfiguration {
		return "annotationPath" in viewConfig && !("primary" in viewConfig) && !("secondary" in viewConfig);
	}

	/**
	 * Returns true if the configuration is a combined configuration.
	 * @param viewConfig The view configuration
	 * @returns `true` if this is a combined configuration
	 */
	isCombinedViewConfiguration(viewConfig: ViewConfiguration): viewConfig is CombinedViewPathConfiguration {
		return !this.isCustomViewConfiguration(viewConfig) && !this.isViewPathConfiguration(viewConfig)
			? viewConfig.primary?.length > 0 && viewConfig.secondary?.length > 0
			: false;
	}

	/**
	 * Returns true if the configuration is a custom configuration.
	 * @param viewConfig The view configuration
	 * @returns `true` if this is a custom configuration
	 */
	isCustomViewConfiguration(viewConfig: ViewConfiguration): viewConfig is CustomViewTemplateConfiguration {
		return "template" in viewConfig;
	}

	/**
	 * Returns true if there are multiple visualizations.
	 * @param viewConfig The path from the view
	 * @returns `true` if there are multiple visualizations
	 */
	hasMultipleVisualizations(viewConfig?: ViewConfiguration): boolean {
		if (!viewConfig) {
			const multipleViewsConfiguration = this.getViewConfiguration() || { paths: [] };
			return multipleViewsConfiguration.paths.some((path) => this.isCombinedViewConfiguration(path));
		}
		return this.isCombinedViewConfiguration(viewConfig);
	}

	/**
	 * Retrieves the entity set defined in the manifest.
	 * @returns The entity set defined in the manifest
	 */
	getEntitySet(): string | undefined {
		return this.oManifestSettings.entitySet;
	}

	hasInlineEdit(): boolean {
		return !!this.oManifestSettings.inlineEdit?.disabledFields || (this.oManifestSettings?.inlineEdit?.enabledFields?.length ?? 0) > 0;
	}

	getInlineEditEnabledFields(): string[] {
		return this.oManifestSettings?.inlineEdit?.enabledFields ?? [];
	}

	getInlineEditDisabledFields(): string[] {
		return this.oManifestSettings?.inlineEdit?.disabledFields ?? [];
	}

	getInlineConnectedFields(): (string | string[])[] {
		return this.oManifestSettings?.inlineEdit?.connectedFields ?? [];
	}
	//end region LR Specific
}

export default ManifestWrapper;
