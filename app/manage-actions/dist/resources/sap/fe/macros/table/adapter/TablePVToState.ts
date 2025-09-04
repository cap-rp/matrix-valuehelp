import type PresentationVariant from "sap/fe/navigation/PresentationVariant";
import type { Aggregation, PvProperties, SortOrder, VisContentType } from "sap/fe/navigation/PresentationVariant";
import type { AppState, GroupLevels, Items, Sorters } from "sap/ui/mdc/p13n/StateUtil";

/**
 * Override the group levels for new state to be set on the table.
 * @param newGroupLevels
 * @param oldGroupLevels
 * @param propertyInfoNames
 * @returns Overridden group levels to be set on the table
 */
const overridePVGroupLevels = function (newGroupLevels: string[], oldGroupLevels: string[], propertyInfoNames: string[]): GroupLevels[] {
	const groupsInNewVariant = newGroupLevels.map((group) => {
		return group;
	});

	const groupLevels =
		newGroupLevels.map((group) => {
			return {
				name: propertyInfoNames.includes(`Property::${group}`) ? `Property::${group}` : group
			};
		}) || [];

	groupLevels.push(
		...oldGroupLevels
			.filter((group) => {
				return !groupsInNewVariant.includes(group);
			})
			.map((group) => {
				return {
					name: propertyInfoNames.includes(`Property::${group}`) ? `Property::${group}` : group,
					grouped: false
				};
			})
	);

	return groupLevels;
};

/**
 * Override the sorters for new state to be set on the table.
 * @param newSortOrder
 * @param oldSortOrder
 * @param propertyInfoNames
 * @returns Overridden sorters to be set on the table
 */
const overridePVSorters = function (newSortOrder: SortOrder[], oldSortOrder: SortOrder[], propertyInfoNames: string[]): Sorters[] {
	const sortersInNewVariant = newSortOrder.map((sorter) => {
		return sorter.Property;
	});

	const sorters = newSortOrder.map((sorter) => {
		return {
			name: propertyInfoNames.includes(`Property::${sorter.Property}`) ? `Property::${sorter.Property}` : sorter.Property,
			descending: sorter.Descending
		};
	});

	sorters.push(
		...oldSortOrder
			.filter((sorter) => {
				return !sortersInNewVariant.includes(sorter.Property);
			})
			.map((sorter) => {
				return {
					name: propertyInfoNames.includes(`Property::${sorter.Property}`) ? `Property::${sorter.Property}` : sorter.Property,
					descending: sorter.Descending,
					sorted: false
				};
			})
	);

	return sorters;
};

/**
 * Override the Aggregations for the new state to be set on the table.
 * @param newAggregations
 * @param oldAggregations
 * @param propertyInfoNames
 * @returns Overridden Aggregations to be set on the table
 */
const overridePVAggregations = function (
	newAggregations: Aggregation,
	oldAggregations: Aggregation,
	propertyInfoNames: string[]
): Aggregation {
	const newAggregationsKeys = Object.keys(newAggregations);

	// Return object
	const mixedAggregates: Aggregation = {};

	// Put the new keys in the return object.
	for (const singleNewAggregate in newAggregations) {
		let newAggregate = singleNewAggregate;
		if (propertyInfoNames.includes(`Property::${singleNewAggregate}`)) {
			newAggregate = `Property::${singleNewAggregate}`;
		}
		mixedAggregates[newAggregate] = newAggregations[singleNewAggregate];
	}

	// Hide the old aggregates if they are not present in the new Variant
	for (const singleOldAggregate in oldAggregations) {
		if (!newAggregationsKeys.includes(singleOldAggregate)) {
			let oldAggregate = singleOldAggregate;
			if (propertyInfoNames.includes(`Property::${singleOldAggregate}`)) {
				oldAggregate = `Property::${singleOldAggregate}`;
			}
			mixedAggregates[oldAggregate] = { aggregated: false };
		}
	}

	return mixedAggregates;
};

/**
 * Override the column content for new state to be set on the table.
 * @param newPVContent
 * @param oldPVContent
 * @returns Overridden column content to be set on the table
 */
const overridePVContent = function (newPVContent: VisContentType[], oldPVContent: VisContentType[]): Items[] {
	const itemsInNewVariant =
		newPVContent.map((item) => {
			return item["Value"];
		}) || [];

	const items: Items[] =
		newPVContent?.map((item, itemIndex: number) => {
			return {
				name: item.Value,
				visible: true,
				position: itemIndex
			};
		}) || [];

	items.push(
		...oldPVContent
			.filter((item) => {
				return !itemsInNewVariant.includes(item.Value);
			})
			.map((item) => {
				return {
					name: item.Value,
					visible: false
				} as Items;
			})
	);

	return items;
};

/**
 * Convert the presentation variant to state format.
 *
 * When a new presentation variant is to be applied on the table,
 * properties that are conflicting with the existing presentation variant
 * must be handled appropriately.
 * @param pvToSet The presentation variant that is to be applied on the table.
 * @param pvToReplace The existing presentation variant set on the table.
 * @param propertyInfoNames
 * @returns The app state that must be set on the table
 */
export const convertPVToState = function (
	pvToSet: PresentationVariant,
	pvToReplace: PresentationVariant,
	propertyInfoNames: string[]
): AppState {
	const newPVProps = pvToSet.getProperties() ?? {};
	const oldPVProps = (pvToReplace.getProperties() as PvProperties) ?? {};

	const newPVContent = (pvToSet.getTableVisualization()?.Content || []) as VisContentType[];
	const oldPVContent = (pvToReplace.getTableVisualization()?.Content || []) as VisContentType[];

	const overriddenProps: AppState = {
		items: overridePVContent(newPVContent, oldPVContent),
		groupLevels: overridePVGroupLevels(newPVProps.GroupBy ?? [], oldPVProps.GroupBy ?? [], propertyInfoNames),
		sorters: overridePVSorters(newPVProps.SortOrder ?? [], oldPVProps.SortOrder ?? [], propertyInfoNames)
	};
	const overriddenAggregation = overridePVAggregations(newPVProps.Aggregations ?? {}, oldPVProps.Aggregations ?? {}, propertyInfoNames);
	if (Object.keys(overriddenAggregation).length > 0) {
		overriddenProps.aggregations = overriddenAggregation;
	}
	return overriddenProps;
};
