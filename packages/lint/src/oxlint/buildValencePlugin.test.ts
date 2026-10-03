import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { buildValencePlugin } from './buildValencePlugin';

const BundleSchema = z.object({
  default: z.object({
    meta: z.object({ name: z.string() }),
    rules: z.record(z.string(), z.object({})),
  }),
});

describe('buildValencePlugin', () => {
  it('bundles every rule into one file oxlint can load', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'valence-oxlint-'));

    try {
      const bundle = BundleSchema.parse(
        await import(pathToFileURL(await buildValencePlugin(join(folder, 'plugin.js'))).href),
      );

      expect(bundle.default.meta.name).toBe('valence');
      expect(Object.keys(bundle.default.rules).toSorted()).toEqual([
        'banned-syntax',
        'neutral-queries',
        'no-comments',
        'no-hard-coded-strings',
        'no-raw-colours',
      ]);
    } finally {
      await rm(folder, { recursive: true, force: true });
    }
  });
});
