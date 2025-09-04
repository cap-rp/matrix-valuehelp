/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
 *      (c) Copyright 2009-2025 SAP SE. All rights reserved
 */
sap.ui.define(["sap/base/Log"], function (Log) {
  "use strict";

  var _exports = {};
  let Placement = /*#__PURE__*/function (Placement) {
    Placement["After"] = "After";
    Placement["Before"] = "Before";
    Placement["End"] = "End";
    return Placement;
  }({});
  _exports.Placement = Placement;
  /**
   * Determine the first anchor among delayedPositioningItems. If multiple items are 'Before' positioned,
   * find one that does not reference another positioning item in the list. If only one is 'Before' positioned,
   * make it the first anchor. If none are 'Before' positioned, use the first item in the list. The selected
   * first anchor is added to the sorted list.
   * @param sorted List of sorted items. The determined first anchor is added to this list.
   * @param delayedPositioningItems Key-value pair where the key is the item and the value is its position.
   * @returns The key of the determined first anchor of the delayedPositioningItems-list.
   * @example
   *   const sorted = [];
   *   const delayedPositioningItems = {
   *     "item1": { placement: Placement.Before, anchor: "item2" },
   *     "item2": { placement: Placement.After, anchor: "item1" }
   *   };
   *   setFirstAnchor(sorted, delayedPositioningItems);
   *   ==>
   *   sorted: ["item1"]
   */
  const setFirstAnchor = function (sorted, delayedPositioningItems) {
    let firstAnchor;
    // If all custom elements reference each other, take
    // a) a before placed custom element, which is not referencing any other "before"-set one,
    // b) the first before placed custom element
    // c) the first overall custom element
    const beforePositioningItems = Object.keys(delayedPositioningItems).filter(delayedPositioningItemKey => delayedPositioningItems[delayedPositioningItemKey].placement === Placement.Before);
    if (beforePositioningItems.length > 1) {
      // Find positioningItem which does not reference another positioningItem in the list
      const firstPositioningItem = beforePositioningItems.find(delayedPositioningItemKey => !beforePositioningItems.includes(delayedPositioningItems[delayedPositioningItemKey].anchor));
      firstAnchor = firstPositioningItem || beforePositioningItems[0];
    } else if (beforePositioningItems.length) {
      firstAnchor = beforePositioningItems[0];
    } else {
      firstAnchor = Object.keys(delayedPositioningItems)[0];
    }
    sorted.push(firstAnchor);
    return firstAnchor;
  };

  /**
   * Checks if a given anchor string is already present in a sorted array.
   * @param anchor The anchor string related to the item.
   * @param sorted The array of sorted keys.
   * @returns Returns whether the anchor was already positioned.
   */
  const isAlreadyPositioned = (anchor, sorted) => {
    return sorted.includes(anchor);
  };

  /**
   * Checks if an item can be positioned based on its insert index and presence in a sorted array.
   * @param insertIndex The index where an item is intended to be inserted.
   * @param anchor The anchor string related to the item.
   * @param sorted The array of sorted keys.
   * @returns Returns whether the anchor can already be positioned.
   */
  const isPositionable = (insertIndex, anchor, sorted) => {
    if (insertIndex === -1) {
      return false;
    }
    return !isAlreadyPositioned(anchor, sorted);
  };

  /**
   * Checks if any item in the delayedPositioningItems object can be positioned based on the presence of its anchor in a sorted array or the fact that all remaining items self reference.
   * @param delayedPositioningItems Key-value pair where the key is the item and the value is its position.
   * @param sorted The array of sorted keys.
   * @param positioningItems
   * @param possibleAnchors
   * @returns Returns whether any delayedPositioningItem can be positioned.
   */
  const isDelayedItemPositionable = (delayedPositioningItems, sorted, positioningItems, possibleAnchors) => {
    return !!(Object.keys(delayedPositioningItems).length && Object.keys(delayedPositioningItems).map(itemKey => delayedPositioningItems[itemKey].anchor).some(delayedAnchorKey => sorted.includes(delayedAnchorKey))) ||
    // First recursive loop only
    Object.keys(positioningItems).length === possibleAnchors.length &&
    // Only if all others were handled
    possibleAnchors.length - sorted.length === Object.keys(delayedPositioningItems).length &&
    // Check for circular dependency
    Object.keys(delayedPositioningItems).every(itemKey => Object.keys(delayedPositioningItems).includes(delayedPositioningItems[itemKey].anchor));
  };

  /**
   * Reorders a given array of elements based on a predefined positioning map.
   * @template T A type that extends the ConfigurableObject.
   * @param rootElements The initial array of elements to reorder.
   * @param itemsPerKey A map of elements to reorder, keyed by an identifier.
   * @param positioningItems A map defining the order of elements, keyed by an identifier.
   * @param endElement Only one element can have position end as of now, only used for StandardAction::Cancel
   * @returns A new array of elements, reordered according to the given positioning map. No default positioning is kept, only the rootElements position configuration is kept
   */
  const reorderPositioningItems = (rootElements, itemsPerKey, positioningItems, endElement) => {
    const sortedKeys = [];

    // Calculate initial default anchors to place elements without explicit anchors
    const defaultAnchors = {
      first: undefined,
      last: undefined
    };
    defaultAnchors.first = rootElements.length ? rootElements[0].key : undefined;
    defaultAnchors.last = rootElements.length ? rootElements[rootElements.length - 1].key : undefined;
    const delayedPositioningItems = {};
    Object.keys(positioningItems).forEach(positionItemKey => {
      orderPositioningItemRecursively(positioningItems, positionItemKey, sortedKeys, defaultAnchors, delayedPositioningItems, []);
    });
    const outElements = sortedKeys.map(key => itemsPerKey[key]);
    // Only keep explicitly set positions, needed for using the output of insertCustomElements as next input
    outElements.forEach((element, index) => {
      if (element.position && !itemsPerKey[element.key]?.position) {
        delete outElements[index].position;
      }
    });
    if (endElement) {
      outElements.push(endElement);
    }
    return outElements;
  };

  /**
   * Determines the insertion index for an item in a sorted array, or delays its positioning if necessary.
   * @param sorted The array of sorted keys.
   * @param anchor The anchor string related to the item.
   * @param anchorItem The position metadata for the item to insert.
   * @param delayedPositioningItems Key-value pair where the key is the item and the value is its position.
   * @param positioningItems A map defining the order of elements, keyed by an identifier.
   * @param possibleAnchors
   * @returns The index at which the item should be inserted in the sorted array, or -1 if the item's positioning should be delayed.
   */
  const getInsertIndexOrDelayItem = (sorted, anchor, anchorItem, delayedPositioningItems, positioningItems, possibleAnchors) => {
    let insertIndex = sorted.indexOf(anchor);

    // Take out anchor, if it's currently worked on
    if (Object.keys(delayedPositioningItems).includes(anchor)) {
      delete delayedPositioningItems[anchor];
    }
    if (anchorItem && anchorItem.anchor && anchor !== anchorItem.anchor && !sorted.includes(anchorItem.anchor)) {
      delayedPositioningItems[anchor] = positioningItems[anchor];
      // Solve circular dependency
      if (Object.keys(delayedPositioningItems).length && !Object.keys(delayedPositioningItems).some(itemKey => sorted.includes(delayedPositioningItems[itemKey].anchor)) && possibleAnchors.length - sorted.length === Object.keys(delayedPositioningItems).length) {
        const addedAnchor = setFirstAnchor(sorted, delayedPositioningItems);
        delete delayedPositioningItems[addedAnchor];
      } else {
        return -1;
      }
    } else if (anchor === anchorItem.anchor) {
      // Anchor references itself
      insertIndex = sorted.length;
    } else {
      insertIndex = sorted.indexOf(anchorItem.anchor);
      if (anchorItem.placement === Placement.After) {
        insertIndex++;
      }
    }
    return insertIndex;
  };

  /**
   * Recursive method that order the keys based on a position information.
   * @param positioningItems A map defining the order of elements, keyed by an identifier.
   * @param anchor The anchor string related to the item.
   * @param sorted The array of sorted keys.
   * @param defaultAnchors Default anchors used to place elements without explicit anchors
   * @param defaultAnchors.first
   * @param defaultAnchors.last
   * @param delayedPositioningItems Key-value pair where the key is the item and the value is its position.
   * @param possibleAnchors For recursive addition of delayed custom elements
   */
  const orderPositioningItemRecursively = (positioningItems, anchor, sorted, defaultAnchors, delayedPositioningItems, possibleAnchors) => {
    if (isAlreadyPositioned(anchor, sorted)) {
      return;
    }
    const anchorItem = positioningItems[anchor];
    possibleAnchors = possibleAnchors.length ? possibleAnchors : Object.keys(positioningItems); // Pass in all possible anchors independent of recursion level

    // Configuration mistakes
    if (anchorItem.anchor && !Object.keys(positioningItems).includes(anchorItem.anchor) && !possibleAnchors.includes(anchorItem.anchor)) {
      Log.warning(`Position anchor '${anchorItem.anchor}' not found for item '${anchor}'. Please check settings. Defaulting as if no Anchor was set.`);
      //Defaulting in case of misconfiguration
      positioningItems[anchor].anchor = anchor;
      anchorItem.anchor = anchor;
    }

    // General defaulting
    if (!anchorItem.anchor) {
      anchorItem.anchor = anchorItem.placement === Placement.After ? defaultAnchors.last : defaultAnchors.first;
      // There is no possible reference anchor yet to align to
      if (anchorItem.anchor === undefined) {
        setFirstAnchor(sorted, {
          [anchor]: anchorItem
        });
      }
    }

    // If anchor item cannot be assigned yet, delay it, otherwise get insertIndex according to configuration
    const insertIndex = getInsertIndexOrDelayItem(sorted, anchor, anchorItem, delayedPositioningItems, positioningItems, possibleAnchors);
    if (isPositionable(insertIndex, anchor, sorted)) {
      sorted.splice(insertIndex, 0, anchor);
    }

    // Make sure that the next element without an anchor is placed after the new last one to prevent reversing the list order
    defaultAnchors.last = sorted[sorted.length - 1];

    // Every time we successfully added on item we check for those we could not add so far, and add them if they have a reference now
    if (Object.keys(delayedPositioningItems).length && isDelayedItemPositionable(delayedPositioningItems, sorted, positioningItems, possibleAnchors)) {
      Object.keys(delayedPositioningItems).forEach(positionItemKey => {
        orderPositioningItemRecursively({
          ...delayedPositioningItems
        }, positionItemKey, sorted, defaultAnchors, delayedPositioningItems, possibleAnchors);
      });
    }
  };
  let OverrideType = /*#__PURE__*/function (OverrideType) {
    OverrideType["merge"] = "merge";
    OverrideType["overwrite"] = "overwrite";
    OverrideType["ignore"] = "ignore";
    return OverrideType;
  }({});
  _exports.OverrideType = OverrideType;
  function isArrayConfig(config) {
    return typeof config === "object";
  }
  function applyOverride(overwritableKeys, sourceItem, customElement) {
    const outItem = sourceItem || customElement;
    for (const overwritableKey in overwritableKeys) {
      if (Object.hasOwnProperty.call(overwritableKeys, overwritableKey)) {
        const overrideConfig = overwritableKeys[overwritableKey];
        if (sourceItem !== null) {
          switch (overrideConfig) {
            case "overwrite":
              if (customElement.hasOwnProperty(overwritableKey) && customElement[overwritableKey] !== undefined) {
                sourceItem[overwritableKey] = customElement[overwritableKey];
              }
              break;
            case "merge":
            default:
              const subItem = sourceItem[overwritableKey] || [];
              let subConfig = {};
              if (isArrayConfig(overrideConfig)) {
                subConfig = overrideConfig;
              }
              if (Array.isArray(subItem)) {
                sourceItem[overwritableKey] = insertCustomElements(subItem, customElement && customElement[overwritableKey] || {}, subConfig);
              }
              break;
          }
        } else {
          switch (overrideConfig) {
            case "overwrite":
              if (customElement.hasOwnProperty(overwritableKey) && customElement[overwritableKey] !== undefined) {
                outItem[overwritableKey] = customElement[overwritableKey];
              }
              break;
            case "merge":
            default:
              let subConfig = {};
              if (isArrayConfig(overrideConfig)) {
                subConfig = overrideConfig;
              }
              outItem[overwritableKey] = insertCustomElements([], customElement && customElement[overwritableKey] || {}, subConfig);
              break;
          }
        }
      }
    }
    return outItem;
  }

  /**
   * Insert a set of custom elements in the right position in an original collection.
   *
   * Parameters for overwritableKeys and their implications:
   * "overwrite": The whole object gets overwritten - if the customElements include a default, this will overrule the whole rootElements configuration.
   * "merge": This is similar to calling insertCustomElements itself. You must include the
   * full CustomElement syntax within the customElements, including anchors, for example.
   * "ignore": There are no additions and no combinations. Only the rootElements object is used.
   *
   * Note - Proceed as follows in case you have defined customElements and do not want to overwrite their values with defaults:
   * Hand the rootElements into the creation function of the customElement.
   * Depending on the existence of both rootElement-configuration and customElement-configuration,
   * you must set the customElements property, for which the "overwrite"-property is set, explicitly to undefined.
   * @template T
   * @param rootElements A list of "ConfigurableObject" which means object that have a unique "key"
   * @param customElements An object containing extra object to add, they are indexed by a key and have a "position" object
   * @param overwritableKeys The list of keys from the original object that can be overwritten in case a custom element has the same "key"
   * @returns An ordered array of elements including the custom ones
   */
  function insertCustomElements(rootElements, customElements) {
    let overwritableKeys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    let endElement;
    const positioningItems = {};
    const itemsPerKey = {};

    // Creation of initial list
    rootElements.forEach(rootElement => {
      if (rootElement.position?.placement === Placement.End && !endElement) {
        endElement = rootElement;
      } else {
        positioningItems[rootElement.key] = {
          anchor: rootElement.position?.anchor || rootElement.key,
          placement: rootElement.position?.placement || Placement.After
        };
      }
      itemsPerKey[rootElement.key] = rootElement;
    });

    // Overriding of properties through customElements, depending on overwritableKeys
    Object.keys(customElements).forEach(customElementKey => {
      const customElement = customElements[customElementKey];
      const anchor = customElement.position.anchor;
      // If no placement defined we are After
      if (!customElement.position.placement) {
        customElement.position.placement = Placement.After;
      }
      const adjustedCustomElementKey = customElement.key;
      if (itemsPerKey[adjustedCustomElementKey]) {
        itemsPerKey[adjustedCustomElementKey] = applyOverride(overwritableKeys, itemsPerKey[adjustedCustomElementKey], customElement);

        //Position is overwritten for filter fields if there is a change in manifest
        if (anchor && customElement.position && overwritableKeys.position && overwritableKeys.position === "overwrite") {
          positioningItems[adjustedCustomElementKey] = itemsPerKey[adjustedCustomElementKey].position;
        }
        /**
         * anchor check is added to make sure change in properties in the manifest does not affect the position of the field.
         * Otherwise, when no position is mentioned in manifest for an altered field, the position is changed as
         * per the potential anchor
         */
      } else {
        itemsPerKey[adjustedCustomElementKey] = applyOverride(overwritableKeys, null, customElement);
        positioningItems[adjustedCustomElementKey] = customElement.position;
      }
    });
    return reorderPositioningItems(rootElements, itemsPerKey, positioningItems, endElement);
  }
  _exports.insertCustomElements = insertCustomElements;
  return _exports;
}, false);
//# sourceMappingURL=ConfigurableObject-dbg.js.map
