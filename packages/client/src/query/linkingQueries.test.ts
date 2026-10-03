import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { aLinkedServerFace } from '@ValenceClient/testing/aLinkedServerFace';
import { linkingQueries } from './linkingQueries';

vi.mock('@ValenceClient/linking/fetchLinkedServerFaces', () => ({
  fetchLinkedServerFaces: () => Promise.resolve([aLinkedServerFace()]),
}));

vi.mock('@ValenceClient/linking/fetchAskableElsewhere', () => ({
  fetchAskableElsewhere: () => Promise.resolve([{ id: 'peer~films~kai', name: 'Kai from Films' }]),
}));

describe('linkingQueries', () => {
  it('reads the servers this one is linked with', async () => {
    expect(await new QueryClient().fetchQuery(linkingQueries.faces())).toEqual([
      aLinkedServerFace(),
    ]);
  });

  it('reads the people from linked servers who can be asked along', async () => {
    expect(await new QueryClient().fetchQuery(linkingQueries.askableElsewhere())).toEqual([
      { id: 'peer~films~kai', name: 'Kai from Films' },
    ]);
  });

  it('keeps both under the linking key, so either is read again with the rest', () => {
    expect(linkingQueries.faces().queryKey[0]).toBe('linking');
    expect(linkingQueries.askableElsewhere().queryKey[0]).toBe('linking');
  });
});
