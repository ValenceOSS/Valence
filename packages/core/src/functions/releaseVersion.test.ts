import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { releaseVersion } from './releaseVersion';

describe('releaseVersion', () => {
  it('reads the version release-please last set', () => {
    const manifest = z
      .object({ '.': z.string() })
      .parse(
        JSON.parse(
          readFileSync(
            join(__dirname, '..', '..', '..', '..', '.release-please-manifest.json'),
            'utf8',
          ),
        ),
      );

    expect(releaseVersion()).toBe(manifest['.']);
  });
});
