import { describe, expect, it } from 'vitest';
import {
  AuthenticateByNameSchema,
  ItemsQuerySchema,
  PlaybackInfoBodySchema,
  PlaybackReportSchema,
} from './JellyfinRequests';

describe('JellyfinRequests', () => {
  it('reads an items query’s lists, numbers and switches', () => {
    expect(
      ItemsQuerySchema.parse({
        includeitemtypes: 'Movie,Series',
        recursive: 'true',
        startindex: '20',
        limit: 'lots',
        filters: 'IsFavorite|IsResumable',
      }),
    ).toMatchObject({
      includeitemtypes: ['Movie', 'Series'],
      recursive: true,
      startindex: 20,
      limit: undefined,
      filters: ['IsFavorite', 'IsResumable'],
    });
  });

  it('reads a sign-in’s name and either password field', () => {
    expect(AuthenticateByNameSchema.parse({ username: ' marnie ', pw: 'x' })).toMatchObject({
      username: 'marnie',
      pw: 'x',
    });
    expect(AuthenticateByNameSchema.safeParse({ username: '' }).success).toBe(false);
  });

  it('reads what it can of a playback body and drops what it cannot', () => {
    expect(
      PlaybackInfoBodySchema.parse({ starttimeticks: 10, audiostreamindex: 'one' }),
    ).toMatchObject({ starttimeticks: 10, audiostreamindex: null });
    expect(PlaybackInfoBodySchema.parse('nonsense')).toMatchObject({ deviceprofile: null });
  });

  it('reads a playback report', () => {
    expect(
      PlaybackReportSchema.parse({ itemid: 'a', playsessionid: 'p', positionticks: 5 }),
    ).toMatchObject({ itemid: 'a', positionticks: 5 });
  });
});
