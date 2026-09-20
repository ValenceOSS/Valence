import { readJsonPath } from '@ValenceRequests/cardigann/readJsonPath';
import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';

type Condition = { name: string; argument: string };

/**
 * Splits a selector into its path and the conditions after it, such as
 * `data:has(size):not(fake):contains(1080)`, keeping brackets inside a condition's argument whole.
 *
 * @param selector - The selector.
 * @returns The path, and each condition in order.
 */
const splitSelector = (selector: string): { path: string; conditions: Condition[] } => {
  const conditions: Condition[] = [];
  const firstColon = selector.search(/:(has|not|contains)\(/);
  const path = firstColon === -1 ? selector : selector.slice(0, firstColon);
  let at = firstColon === -1 ? selector.length : firstColon;

  while (at < selector.length) {
    const name = /^:(\w+)\(/.exec(selector.slice(at))?.[1];

    if (name === undefined) {
      break;
    }

    let depth = 0;
    let end = at + name.length + 1;

    for (; end < selector.length; end += 1) {
      if (selector[end] === '(') {
        depth += 1;
      } else if (selector[end] === ')') {
        depth -= 1;

        if (depth === 0) {
          break;
        }
      }
    }

    conditions.push({ name, argument: selector.slice(at + name.length + 2, end) });
    at = end + 1;
  }

  return { path, conditions };
};

/**
 * Selects from JSON with the small selector language definitions use for JSON responses: a path,
 * then any of `:has(path)`, `:not(path)` and `:contains(text)`, each of which may itself carry
 * conditions — `name:not(:contains(DTS))` selects the name only where it does not mention DTS.
 *
 * @param value - Where to start.
 * @param selector - The selector.
 * @returns What it selected, or undefined where the path leads nowhere or a condition fails.
 */
const selectJson = (value: JsonNode, selector: string): JsonNode | undefined => {
  const { path, conditions } = splitSelector(selector.trim());
  const selected = path === '' ? value : readJsonPath(value, path);

  if (selected === undefined) {
    return undefined;
  }

  for (const { name, argument } of conditions) {
    const isFound = (text: string) =>
      (typeof selected === 'string' ? selected : JSON.stringify(selected)).includes(text);
    const holds =
      name === 'contains'
        ? isFound(argument.replace(/^["']|["']$/g, ''))
        : selectJson(selected, argument) !== undefined;

    if (name === 'not' ? holds : !holds) {
      return undefined;
    }
  }

  return selected;
};

export { selectJson };
