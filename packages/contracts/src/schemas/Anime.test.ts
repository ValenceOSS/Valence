import { describe, expect, it } from 'vitest';
import { AnimeAnswerSchema, AnimeFactsSchema, CourOrderSchema } from './Anime';

describe('Anime', () => {
  it('takes a cour order by name or by an episode group', () => {
    expect(CourOrderSchema.parse('auto')).toBe('auto');
    expect(CourOrderSchema.parse('group:5f0e5b1d6e2b5c0034a0b1c2')).toBe(
      'group:5f0e5b1d6e2b5c0034a0b1c2',
    );
    expect(CourOrderSchema.safeParse('group:nope').success).toBe(false);
  });

  it('reads anime facts with their defaults', () => {
    const facts = AnimeFactsSchema.parse({
      anilistId: 1,
      malId: 2,
      names: { english: 'Show', romaji: 'Shou', native: null },
      cours: [
        {
          cour: 1,
          name: 'Show',
          anilistId: 1,
          malId: 2,
          season: 1,
          firstAired: '2020-01-01',
          episodeCount: 12,
        },
      ],
      episodes: [{ season: 1, episode: 1, absolute: 1, cour: 1 }],
      courSource: 'seasons',
    });

    expect(facts).toMatchObject({ groupId: null, groups: [], films: [] });
    expect(facts.names.others).toEqual([]);
    expect(facts.cours[0]?.names).toEqual([]);
  });

  it('remembers nothing unless told to', () => {
    expect(AnimeAnswerSchema.parse({ numbering: 'perCour' })).toEqual({
      numbering: 'perCour',
      isRemembered: false,
    });
  });
});
