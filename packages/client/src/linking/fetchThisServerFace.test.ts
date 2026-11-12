import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchThisServerFace } from './fetchThisServerFace';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchThisServerFace', () => {
  it('reads how this server is shown beside the ones it is linked with', async () => {
    const here = { name: 'Home', colour: '#3a8ee8', pictureAt: null };
    const asked = aServerAnswering({ servers: [], here });

    expect(await fetchThisServerFace()).toEqual(here);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/faces');
  });

  it('reads nothing from a server too old to say', async () => {
    aServerAnswering({ servers: [] });

    expect(await fetchThisServerFace()).toBeNull();
  });
});
