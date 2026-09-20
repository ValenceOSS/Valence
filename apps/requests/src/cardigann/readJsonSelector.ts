import { applyFilters } from '@ValenceRequests/cardigann/applyFilters';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import { selectJson } from '@ValenceRequests/cardigann/selectJson';
import { SelectorMiss } from '@ValenceRequests/cardigann/SelectorMiss';
import type { CardigannSelector } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { FilterContext } from '@ValenceRequests/cardigann/FilterContext';
import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';

/**
 * Writes a JSON value as the text a field reads: a list as its items joined by commas, an object as
 * JSON, and anything else as itself.
 *
 * @param value - The value.
 * @returns The text, or null for null.
 */
const asText = (value: JsonNode): string | null => {
  if (value === null) {
    return null;
  }

  if (typeof value === 'object') {
    return Array.isArray(value)
      ? value
          .map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item)))
          .join(',')
      : JSON.stringify(value);
  }

  return String(value);
};

/**
 * Reads one value out of a JSON result the way a definition's field describes it: fixed text, or
 * what a selector finds — then the first `case` equal to it, `*` matching anything — with the
 * filters applied.
 *
 * @param from - The row, or the whole answer, to read from.
 * @param block - What to read.
 * @param context - The variables, character set and clock the templates and filters need.
 * @param isRequired - Whether finding nothing is a failure or simply nothing.
 * @returns The value, or null where it was not there and is not required.
 * @throws SelectorMiss where it was required and not there.
 */
const readJsonSelector = (
  from: JsonNode,
  block: CardigannSelector,
  context: FilterContext,
  isRequired = true,
): string | null => {
  if (block.text !== undefined) {
    return applyFilters(renderTemplate(block.text, context.variables), block.filters, context);
  }

  let value: string | null = null;

  if (block.selector !== undefined) {
    const selector = renderTemplate(block.selector.replace(/^\.+/, ''), context.variables);
    const selected = selectJson(from, selector);

    if (selected === undefined) {
      if (isRequired) {
        throw new SelectorMiss(selector);
      }

      return null;
    }

    value = asText(selected);
  }

  if (block.case !== undefined) {
    const matched = Object.entries(block.case).find(([key]) => key === value || key === '*');

    if (matched === undefined) {
      if (isRequired) {
        throw new SelectorMiss('any case');
      }

      return null;
    }

    value = renderTemplate(matched[1], context.variables);
  }

  return value === null ? null : applyFilters(value.trim(), block.filters, context);
};

export { readJsonSelector };
