import { applyFilters } from '@ValenceRequests/cardigann/applyFilters';
import { findInHtml } from '@ValenceRequests/cardigann/findInHtml';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import { SelectorMiss } from '@ValenceRequests/cardigann/SelectorMiss';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { CardigannSelector } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { FilterContext } from '@ValenceRequests/cardigann/FilterContext';

/**
 * Reads one value out of a page or a row of one, the way a definition's field describes it: fixed
 * text, or the element a selector finds — after removing anything `remove` names, and then the
 * value of the first `case` it matches, the attribute named, or its text — with the filters applied.
 *
 * What `remove` takes out stays out, as the format intends, so a later field no longer sees it.
 *
 * @param $ - The page.
 * @param from - The row, or the page, to read from.
 * @param block - What to read.
 * @param context - The variables, character set and clock the templates and filters need.
 * @param isRequired - Whether finding nothing is a failure or simply nothing.
 * @returns The value, or null where it was not there and is not required.
 * @throws SelectorMiss where it was required and not there.
 */
const readHtmlSelector = (
  $: CheerioAPI,
  from: Cheerio<AnyNode>,
  block: CardigannSelector,
  context: FilterContext,
  isRequired = true,
): string | null => {
  if (block.text !== undefined) {
    return applyFilters(renderTemplate(block.text, context.variables), block.filters, context);
  }

  let selection = from;

  if (block.selector !== undefined) {
    const selector = renderTemplate(block.selector, context.variables);

    selection = findInHtml($, from, selector);

    if (selection.length === 0) {
      if (isRequired) {
        throw new SelectorMiss(selector);
      }

      return null;
    }
  }

  if (block.remove !== undefined) {
    selection.find(block.remove).remove();
  }

  let value: string | undefined;

  if (block.case !== undefined) {
    const matched = Object.entries(block.case).find(
      ([key]) => findInHtml($, selection, key).length > 0,
    );

    value = matched === undefined ? undefined : renderTemplate(matched[1], context.variables);
  } else if (block.attribute !== undefined) {
    value = selection.attr(block.attribute);
  } else {
    value = selection.text();
  }

  if (value === undefined) {
    if (isRequired) {
      throw new SelectorMiss(block.attribute ?? 'any case');
    }

    return null;
  }

  return applyFilters(value.trim(), block.filters, context);
};

export { readHtmlSelector };
