import { type NavigationProperty } from "@sap-ux/vocabularies-types";
import Log from "sap/base/Log";
import type IntentBasedNavigation from "sap/fe/core/controllerextensions/IntentBasedNavigation";
import type { SelectOption } from "sap/fe/navigation/SelectionVariant";
import SelectionVariant from "sap/fe/navigation/SelectionVariant";
import type ListReportController from "sap/fe/templates/ListReport/ListReportController.controller";
type ExternalNavigationInfo = {
	targetInfo: Record<string, unknown>;
	selectionVariant: SelectionVariant;
};

type FilterInfoOfExternalNav = {
	updatedSelectionVariant: SelectionVariant;
	filterPropertiesWithoutConflict: Record<string, string>;
};

const IntentBasedNavigationOverride = {
	adaptNavigationContext: function (
		this: IntentBasedNavigation,
		selectionVariant: SelectionVariant,
		targetInfo: {
			propertiesWithoutConflict?: Record<string, string>;
		}
	): void {
		try {
			const view = this.base.getView(),
				controller = view.getController() as ListReportController,
				filterBar = controller._getFilterBarControl(),
				metaModel = view.getModel().getMetaModel();
			let preparedSV, updatedValues;
			const keepNavigationProperties = controller._intentBasedNavigation.keepNavigationPropertiesForNavigation();
			// Adding filter bar values to the navigation does not make sense if no context has been selected.
			// Hence only consider filter bar values when SelectionVariant is not empty
			if (filterBar && !selectionVariant.isEmpty()) {
				const oData = {
					selectionVariant: controller.getFilterBarSelectionVariant().toJSONObject()
				};
				let modifiedOData = {
					selectionVariant: {}
				};
				modifiedOData = this.base
					.getAppComponent()
					.getNavigationService()
					.checkIsPotentiallySensitive(oData) as typeof modifiedOData;

				let filterBarSelectionVariant = new SelectionVariant(modifiedOData?.selectionVariant);
				const viewData = view.getViewData(),
					rootPath = viewData.fullContextPath;
				if (!keepNavigationProperties) {
					const navProperties = controller._intentBasedNavigation.getNavigationPropertiesFromEntityType(metaModel, rootPath);
					filterBarSelectionVariant = IntentBasedNavigationOverride.removeNavigationPropertiesFromSV(
						filterBarSelectionVariant,
						navProperties
					);
				}
				preparedSV = IntentBasedNavigationOverride.prepareFiltersForExternalNavigation(filterBarSelectionVariant, rootPath);
				IntentBasedNavigationOverride.handleMultiModeControl(controller, filterBarSelectionVariant);
				updatedValues = IntentBasedNavigationOverride.updateNonConflictingFilterProperties(
					targetInfo,
					filterBarSelectionVariant,
					selectionVariant,
					preparedSV.filterPropertiesWithoutConflict
				);
				targetInfo = updatedValues.targetInfo;
				delete targetInfo.propertiesWithoutConflict;
			}
		} catch (exception: unknown) {
			const message = exception instanceof Error ? exception.message : String(exception);
			Log.error(`Failed to process navigation context - ${message}`);
		}
	},
	/**
	 * Handle multi mode control in external navigation.
	 * @param controller This is listReportController.
	 * @param filterBarSelectionVariant Selection variant format of filter conditions.
	 */
	handleMultiModeControl: function (controller: ListReportController, filterBarSelectionVariant: SelectionVariant): void {
		const multipleModeControl = controller._getMultiModeControl();
		if (multipleModeControl) {
			// Do we need to exclude Fields (multi tables mode with multi entity sets)?
			const tabsModel = multipleModeControl.getTabsModel();
			if (tabsModel) {
				const aIgnoredFieldsForTab = tabsModel.getProperty(
					`/${multipleModeControl.content?.getSelectedKey()}/notApplicable/fields`
				);
				if (Array.isArray(aIgnoredFieldsForTab) && aIgnoredFieldsForTab.length > 0) {
					aIgnoredFieldsForTab.forEach(function (sProperty: string) {
						filterBarSelectionVariant.removeSelectOption(sProperty);
					});
				}
			}
		}
	},
	/**
	 * Prepare SV to be passed to external navigation.
	 * @param filterBarSelectionVariant Selection variant format of filter conditions.
	 * @param rootPath Root path of the application.
	 * @returns Object of prepared SV for external navigation and no conflict filters.
	 */
	prepareFiltersForExternalNavigation(filterBarSelectionVariant: SelectionVariant, rootPath: string): FilterInfoOfExternalNav {
		let path;
		const distinctKeysObject: Record<string, unknown[]> = {};
		const filterPropertiesWithoutConflict: Record<string, string> = {};
		let mainEntityValuePath = "",
			currentValuePath = "",
			fullContextPath: string,
			winnerValuePath: string,
			pathInContext: string;
		function _findDistinctKeysInObject(LookUpObject: Record<string, SelectOption[]>): void {
			let lookUpObjectMetaPath;
			for (const key in LookUpObject) {
				let keyInContext = key;
				if (LookUpObject[keyInContext]) {
					if (keyInContext.includes("/")) {
						lookUpObjectMetaPath = keyInContext; // "/SalesOrdermanage/_Item/Material"
						const pathParts = keyInContext.split("/");
						keyInContext = pathParts[pathParts.length - 1];
					} else {
						lookUpObjectMetaPath = rootPath;
					}
					if (!distinctKeysObject[keyInContext]) {
						// if key is found for the first time then create array
						distinctKeysObject[keyInContext] = [];
					}
					// push path to array
					distinctKeysObject[keyInContext].push(lookUpObjectMetaPath);
				}
			}
		}
		const selectOptionsPropertyNames = filterBarSelectionVariant.getSelectOptionsPropertyNames();
		const selectOptionsObject: Record<string, SelectOption[]> = {};
		selectOptionsPropertyNames.forEach((propertyName: string) => {
			const selectOption = filterBarSelectionVariant.getSelectOption(propertyName);
			if (selectOption) {
				selectOptionsObject[`${propertyName}`] = selectOption;
			}
		});
		_findDistinctKeysInObject(selectOptionsObject);
		for (const distinctKey in distinctKeysObject) {
			const conflictingPaths = distinctKeysObject[distinctKey];
			if (conflictingPaths.length > 1) {
				// conflict
				for (let i = 0; i <= conflictingPaths.length - 1; i++) {
					path = conflictingPaths[i];
					if (path === rootPath) {
						fullContextPath = `${rootPath}/${distinctKey}`;
						pathInContext = distinctKey;
						mainEntityValuePath = distinctKey;
					} else {
						pathInContext = path as string;
						fullContextPath = `${rootPath}/${path}`.replaceAll(/\*/g, "");
						currentValuePath = path as string;
					}
					selectOptionsObject[
						fullContextPath
							.split("/")
							.filter(function (sValue: string) {
								return sValue != "";
							})
							.join(".")
					] = selectOptionsObject[pathInContext];
					delete selectOptionsObject[path as string];
				}
				winnerValuePath = mainEntityValuePath || currentValuePath;
				selectOptionsObject[distinctKey] = selectOptionsObject[winnerValuePath];
			} else {
				// no conflict, add distinct key without adding paths
				path = conflictingPaths[0];
				fullContextPath =
					path === rootPath ? `${rootPath}/${distinctKey}` : (`${rootPath}/${path}` as unknown as string).replaceAll("*", "");
				filterPropertiesWithoutConflict[distinctKey] = fullContextPath
					.split("/")
					.filter(function (sValue: string) {
						return sValue != "";
					})
					.join(".");
			}
		}
		//now we loop through object and update existing SV with updated selection options
		const updatedSV = new SelectionVariant();
		for (const sProperty in selectOptionsObject) {
			updatedSV.massAddSelectOption(sProperty, selectOptionsObject[sProperty]);
		}
		return {
			updatedSelectionVariant: updatedSV,
			filterPropertiesWithoutConflict: filterPropertiesWithoutConflict
		};
	},

	/**
	 * Remove navigation properties from SV.
	 * @param selectionVariant Selection variant.
	 * @param navProperties Navigation properties.
	 * @returns Object of prepared SV for external navigation and no conflict filters.
	 */
	removeNavigationPropertiesFromSV(selectionVariant: SelectionVariant, navProperties: NavigationProperty[]): SelectionVariant {
		const navPropNames = navProperties ? navProperties.map((navProp: NavigationProperty) => navProp.name) : [];
		const selectOptionsPropertyNames = selectionVariant.getSelectOptionsPropertyNames();
		return selectOptionsPropertyNames.reduce((sv: SelectionVariant, propertyName: string) => {
			if (navPropNames.length > 0) {
				const firstNavPart = propertyName.split(".")[0];
				if (firstNavPart && navPropNames.includes(firstNavPart)) {
					return sv;
				}
			}
			const selectOptions = selectionVariant.getSelectOption(propertyName);
			if (selectOptions) {
				sv.massAddSelectOption(propertyName, selectOptions);
			}

			return sv;
		}, new SelectionVariant());
	},

	/**
	 * Method to add non conflicting filter conditions to SV.
	 * @param targetInfo Target context
	 * @param targetInfo.propertiesWithoutConflict Table properties without conflict
	 * @param filterBarSelectionVariant Conditions from filterbar has been converted to SV and sent here
	 * @param selectionVariant SV which is finally formed after all the calculations
	 * @param filterPropertiesWithoutConflict Filter bar conditions without conflict
	 * @returns The updated targetInfo and selection variant
	 */
	updateNonConflictingFilterProperties: function (
		targetInfo: {
			propertiesWithoutConflict?: Record<string, string>;
		},
		filterBarSelectionVariant: SelectionVariant,
		selectionVariant: SelectionVariant,
		filterPropertiesWithoutConflict?: Record<string, string>
	): ExternalNavigationInfo {
		const tablePropertiesWithoutConflict = targetInfo.propertiesWithoutConflict;
		const filterBarPropertiesWithoutConflict = filterPropertiesWithoutConflict;
		filterBarSelectionVariant.getSelectOptionsPropertyNames().forEach(function (selectOptionPropertyName) {
			const filterBarSelectOption = filterBarSelectionVariant.getSelectOption(selectOptionPropertyName);
			if (filterBarSelectOption && filterBarSelectOption.length) {
				const navigationSelectOptionNames = selectionVariant.getSelectOptionsPropertyNames();
				if (!navigationSelectOptionNames.includes(selectOptionPropertyName)) {
					// First add all the filterbar SV if they don't exist in navigation SV
					selectionVariant.massAddSelectOption(selectOptionPropertyName, filterBarSelectOption);
				} else {
					// Now if navigation path is present add it here
					// Select option paths from table (with navigation path added to the string name) that don't create conflicts with filter bar select option names
					if (tablePropertiesWithoutConflict && selectOptionPropertyName in tablePropertiesWithoutConflict) {
						selectionVariant.massAddSelectOption(
							tablePropertiesWithoutConflict[selectOptionPropertyName],
							filterBarSelectOption
						);
					}
					if (filterBarPropertiesWithoutConflict && selectOptionPropertyName in filterBarPropertiesWithoutConflict) {
						selectionVariant.massAddSelectOption(
							filterBarPropertiesWithoutConflict[selectOptionPropertyName],
							filterBarSelectOption
						);
					}
				}
			}
		});
		return { targetInfo, selectionVariant };
	},
	getEntitySet: function (this: IntentBasedNavigation): string {
		return (this.base as ListReportController).getCurrentEntitySet();
	}
};

export default IntentBasedNavigationOverride;
