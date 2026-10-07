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
      seasons: [1],
      state: 'downloading',
    });
  });
});
