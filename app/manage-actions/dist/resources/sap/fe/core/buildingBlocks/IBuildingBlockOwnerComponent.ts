import type AppComponent from "sap/fe/core/AppComponent";
import type PageController from "sap/fe/core/PageController";
import type Model from "sap/ui/model/Model";
import type ODataMetaModel from "sap/ui/model/odata/v4/ODataMetaModel";

export interface IBuildingBlockOwnerComponent {
	__implements__sap_fe_core_buildingBlocks_IBuildingBlockOwnerComponent: boolean;

	/**
	 * Standard UI5 method to check if the current object is an instance of the given type
	 * @param type The type to check for
	 * @returns true if the current object is an instance of the given type
	 */
	isA(type: string): boolean;

	/**
	 * Retrieves the controller for the current page or undefined if none exists.
	 * @returns The controller for the current page or undefined if none exists.
	 */
	getRootController(): PageController | undefined;

	/**
	 * Retrieves the AppComponent for the current application
	 * @returns The AppComponent for the current application
	 */
	getAppComponent(): AppComponent;

	/**
	 * Retrieves the full context path for the given metaModelName.
	 * This should represent the full path to the current object displayed in the UI, or undefined if none exists.
	 * @param metaModelName The name of the metaModel to retrieve the context path for
	 * @returns The full context path for the given metaModelName
	 */
	getFullContextPath(metaModelName?: string): string | undefined;

	/**
	 * Retrieves the model for the given modelName or the default model if none is provided.
	 * @param modelName The name of the model to retrieve
	 * @returns The model for the given modelName or undefined if there is none of that name
	 */
	getModel(modelName?: string): Model | undefined;

	/**
	 * Retrieves the ODataMetaModel for the given metaModelName
	 * @param metaModelName
	 */
	getMetaModel(metaModelName?: string): ODataMetaModel | undefined;
}
