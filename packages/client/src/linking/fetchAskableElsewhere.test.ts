import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { fetchAskableElsewhere } from './fetchAskableElsewhere';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchAskableElsewhere', () => {
  it('reads the people from linked servers who can be asked along', async () => {
    const people = [{ id: 'peer~films~kai', name: 'Kai from Films' }];
    const asked = aServerAnswering({ people });

    expect(await fetchAskableElsewhere()).toEqual(people);
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/people');
  });
});
