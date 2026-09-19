import { z } from 'zod';
import { isMap, isNode, isScalar, parseDocument } from 'yaml';
import { CardigannDefinitionSchema } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import { JsonNodeSchema } from '@ValenceRequests/cardigann/JsonNodeSchema';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';

const OuterSchema = z.looseObject({ search: z.looseObject({}) });

/**
 * Reads one Cardigann definition, the YAML that describes how to log in to a site, search it and
 * read what it found.
 *
 * The fields of a search are kept as pairs, in order and with any name repeated, because that is
 * what the format means: a later field reads an earlier one through `.Result`, and a field can be
 * given twice.
 *
 * @param yaml - The definition as written.
 * @returns The definition, or null where it is not one this engine can run.
 */
const readDefinition = (yaml: string): CardigannDefinition | null => {
  try {
    const document = parseDocument(yaml, { uniqueKeys: false });
    const fields = document.getIn(['search', 'fields'], true);
    const pairs = isMap(fields)
      ? fields.items.map((pair) => [
          isScalar(pair.key) ? String(pair.key.value) : '',
          isNode(pair.value) ? JsonNodeSchema.parse(pair.value.toJSON()) : null,
        ])
      : [];
    const outer = OuterSchema.safeParse(document.toJS());

    if (!outer.success) {
      return null;
    }

    const read = CardigannDefinitionSchema.safeParse({
      ...outer.data,
      search: { ...outer.data.search, fields: pairs },
    });

    return read.success ? read.data : null;
  } catch {
    return null;
  }
};

export { readDefinition };
