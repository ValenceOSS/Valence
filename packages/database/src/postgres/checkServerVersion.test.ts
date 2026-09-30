import { describe, expect, it } from 'vitest';
import { aPlayground } from './aPlayground';
import { checkServerVersion } from './checkServerVersion';

describe('checkServerVersion', () => {
  it('lets Valence start on a Postgres new enough for it', async () => {
    await expect(checkServerVersion(await aPlayground())).resolves.toBeUndefined();
  }, 30_000);
});
