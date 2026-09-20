import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';

/**
 * Finds the first element a selector picks out, starting from an element: the element itself where
 * it matches, otherwise the first element inside it that does. A selector beginning `:root` starts
 * from the top of the page instead, which is how a row reads something written once above the table.
 *
 * A selector the engine cannot run finds nothing rather than failing the row.
 *
 * @param $ - The page.
 * @param from - Where to start.
 * @param selector - The CSS selector, with `:contains()` and `:has()` as definitions use them.
 * @returns What it found, which is empty where nothing matched.
 */
const findInHtml = ($: CheerioAPI, from: Cheerio<AnyNode>, selector: string): Cheerio<AnyNode> => {
  try {
    if (selector.startsWith(':root')) {
      return $.root().find(selector.slice(5).trim()).first();
    }

    return from.is(selector) ? from.first() : from.find(selector).first();
  } catch {
    return from.filter(() => false);
  }
};

export { findInHtml };
