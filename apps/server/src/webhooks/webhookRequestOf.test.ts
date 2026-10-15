import { describe, expect, it } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { webhookRequestOf } from './webhookRequestOf';

describe('webhookRequestOf', () => {
  it('carries what was asked for, by whom, and where it has got to', () => {
    const request = aShownRequest({
      kind: 'series',
      title: 'Carrie',
      year: 2026,
      overview: 'A teenager discovers she has telekinetic powers.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/carrie.jpg',
      seasons: [1],
      state: 'downloading',
      requestedBy: { id: 'account-1', name: 'Jess' },
    });

    expect(webhookRequestOf(request)).toEqual({
      id: request.id,
      kind: 'series',
      title: 'Carrie',
      artistName: null,
      year: 2026,
      overview: 'A teenager discovers she has telekinetic powers.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/carrie.jpg',
      requestedBy: 'Jess',
      requestedByAccountId: 'account-1',
      requestedByProfile: null,
      requestedByProfileId: null,
      alsoAskedBy: [],
      askers: [{ accountId: 'account-1', profileId: null }],
      seasons: [1],
      state: 'downloading',
    });
  });

  it('names the account and profile of everybody who asked, first asker first', () => {
    const request = aShownRequest({
      requestedBy: {
        id: 'account-1',
        name: 'The Smiths',
        askingProfile: { profileId: 'profile-mum', name: 'Mum' },
      },
      alsoAskedBy: [
        {
          id: 'account-1',
          name: 'The Smiths',
          askingProfile: { profileId: 'profile-dad', name: 'Dad' },
        },
        { id: 'account-2', name: 'The Joneses' },
      ],
    });

    expect(webhookRequestOf(request).askers).toEqual([
      { accountId: 'account-1', profileId: 'profile-mum' },
      { accountId: 'account-1', profileId: 'profile-dad' },
      { accountId: 'account-2', profileId: null },
    ]);
  });
});
