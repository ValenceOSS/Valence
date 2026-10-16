import { describe, expect, it, vi } from 'vitest';
import { searchAniList } from './searchAniList';
import type { QueryWeb } from '@ValenceServer/music/web/createMusicWeb';

const media = (id: number, extra: Record<string, string | number | object | null> = {}) => ({
  id,
  idMal: id + 1000,
  format: 'TV',
  episodes: 12,
  status: 'FINISHED',
  type: 'ANIME',
  title: { romaji: `Romaji ${id.toString()}`, english: `English ${id.toString()}`, native: null },
  synonyms: ['Other'],
  startDate: { year: 2020, month: 1, day: 5 },
  ...extra,
});

describe('searchAniList', () => {
  it('reads each entry and the anime it names as related, once each', async () => {
    const post = vi.fn<QueryWeb['post']>(() =>
      Promise.resolve({
        data: {
          Page: {
            media: [
              {
                ...media(1),
                relations: {
                  edges: [
                    {
                      relationType: 'SEQUEL',
                      node: media(2, { status: 'RELEASING', episodes: null }),
                    },
                    { relationType: 'ADAPTATION', node: media(3, { type: 'MANGA' }) },
                    { relationType: 'CHARACTER', node: media(4) },
                  ],
                },
              },
              { ...media(2), relations: null },
            ],
          },
        },
      }),
    );

    const found = await searchAniList({ post }, 'Show');

    expect(found.map((entry) => entry.id)).toEqual([1, 2]);
    expect(found[0]).toEqual({
      id: 1,
      malId: 1001,
      format: 'TV',
      english: 'English 1',
      romaji: 'Romaji 1',
      native: null,
      synonyms: ['Other'],
      startDate: '2020-01-05',
      episodes: 12,
      isAiring: false,
    });
    expect(found[1]).toMatchObject({ isAiring: true, episodes: null });
    expect(post.mock.calls[0]?.[1]).toMatchObject({ variables: { search: 'Show' } });
  });

  it('answers nothing where AniList does not', async () => {
    expect(await searchAniList({ post: () => Promise.resolve(null) }, 'Show')).toEqual([]);
  });

  it('takes no day it is not given whole', async () => {
    const post = () =>
      Promise.resolve({
        data: {
          Page: { media: [media(1, { startDate: { year: 2020, month: null, day: null } })] },
        },
      });

    expect((await searchAniList({ post }, 'Show'))[0]?.startDate).toBeNull();
  });
});
