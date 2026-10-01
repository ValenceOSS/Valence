import { describe, expect, it } from 'vitest';
import { aPlayground } from './aPlayground';
import { checkServerVersion } from './checkServerVersion';

describe('checkServerVersion', () => {
  it('lets Valence start on the engine the tests run against', async () => {
    await expect(checkServerVersion(await aPlayground())).resolves.toBeUndefined();
  });
});
