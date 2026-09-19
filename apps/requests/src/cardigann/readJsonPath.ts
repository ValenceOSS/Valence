import { isJsonList } from '@ValenceRequests/cardigann/isJsonList';
import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';

/**
 * Follows a path into JSON the way definitions write one: `data.torrents`, `results[0].name`,
 * `['odd key']`, and `$` or nothing for the value itself.
 *
 * @param value - Where to start.
 * @param path - Where to go.
 * @returns What is there, or undefined where the path leads nowhere.
 */
const readJsonPath = (value: JsonNode, path: string): JsonNode | undefined => {
  const steps = [
    ...path.replace(/^\$/, '').matchAll(/\[(\d+)\]|\['([^']*)'\]|\["([^"]*)"\]|([^.[\]]+)/g),
  ].map(([, index, single, double, name]) => index ?? single ?? double ?? name ?? '');
  let here: JsonNode | undefined = value;

  for (const step of steps) {
    if (here === undefined || here === null || typeof here !== 'object') {
      return undefined;
    }

    if (isJsonList(here)) {
      here = /^\d+$/.test(step) ? here[Number(step)] : undefined;
    } else {
      here = Object.hasOwn(here, step) ? here[step] : undefined;
    }
  }

  return here;
};

export { readJsonPath };
