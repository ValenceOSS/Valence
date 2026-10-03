import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aLinkIdentity } from '@ValenceClient/testing/aLinkIdentity';
import { changeLinkIdentity } from './changeLinkIdentity';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('changeLinkIdentity', () => {
  it('changes this server’s name', async () => {
    const asked = aServerAnswering(aLinkIdentity({ name: 'Kai’s Valence' }));

    expect((await changeLinkIdentity({ name: 'Kai’s Valence' })).value?.name).toBe('Kai’s Valence');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'PATCH' });
  });
});
