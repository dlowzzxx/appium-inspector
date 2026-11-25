export const MAX_LOCATOR_SEARCH_HISTORY = 20;

export const LOCATOR_GROUP_MODE = {
  ALL: 'all',
  ANY: 'any',
  CHAIN: 'chain',
};

/**
 * Resolve a group of locators using the driver's own selector semantics.
 * Results are deduplicated by WebDriver element ID in discovery order.
 */
export async function findElementsByLocatorGroup(driver, locators, mode) {
  const [first, ...rest] = locators;
  const byId = (elements) => new Map(elements.map((element) => [element.elementId, element]));
  let matches = byId(await driver.findElements(first.strategy, first.selector));

  for (const {strategy, selector} of rest) {
    if (matches.size === 0 && mode !== LOCATOR_GROUP_MODE.ANY) {
      break;
    }
    if (mode === LOCATOR_GROUP_MODE.CHAIN) {
      const descendants = [];
      for (const parent of matches.values()) {
        descendants.push(...(await parent.findElements(strategy, selector)));
      }
      matches = byId(descendants);
    } else {
      const found = byId(await driver.findElements(strategy, selector));
      if (mode === LOCATOR_GROUP_MODE.ANY) {
        for (const [id, element] of found) {
          matches.set(id, element);
        }
      } else {
        for (const id of matches.keys()) {
          if (!found.has(id)) {
            matches.delete(id);
          }
        }
      }
    }
  }
  return [...matches.values()];
}

/**
 * Prepends a strategy and selector pair to the search history,
 * deduplicating matching entries and capping the list length.
 */
export function addLocatorSearchHistoryEntry(
  searchHistory = [],
  {strategy, selector} = {},
  maxEntries = MAX_LOCATOR_SEARCH_HISTORY,
) {
  const currentHistory = Array.isArray(searchHistory) ? searchHistory : [];
  if (!strategy || !selector) {
    return currentHistory;
  }
  const key = JSON.stringify([strategy, selector]);
  const filteredHistory = currentHistory.filter((entry) => entry.key !== key);
  return [{key, strategy, selector}, ...filteredHistory].slice(0, maxEntries);
}
