import { describe, expect, it } from 'vitest';
import { aSetup } from './aSetup';

describe('aSetup', () => {
  it('reads a recorded app’s setup under the name given', async () => {
    const setup = await aSetup('radarr-v5', 'radarr', 'http://radarr:7878', 'Films');

    expect(setup.source.name).toBe('Films');
    expect(setup.movies).toHaveLength(3);
  });
});
