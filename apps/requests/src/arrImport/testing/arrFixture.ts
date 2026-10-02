import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

const FixtureSchema = z.record(z.string(), JsonValueSchema);

/**
 * What a recorded app answers, read from its fixture: each answer keyed by the method and path it
 * answers, such as `GET /api/v3/movie`, recorded from the shapes each app's API documents.
 *
 * @param name - The fixture, such as `radarr-v5`.
 * @returns Each answer, keyed by what it answers.
 */
const arrFixture = (name: string): Record<string, { body: JsonValue }> =>
  Object.fromEntries(
    Object.entries(
      FixtureSchema.parse(
        JSON.parse(readFileSync(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8')),
      ),
    ).map(([asked, body]) => [asked, { body }]),
  );

export { arrFixture };
