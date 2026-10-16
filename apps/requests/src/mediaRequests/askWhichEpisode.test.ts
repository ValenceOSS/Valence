import { describe, expect, it } from 'vitest';
import { aRelease } from '@ValenceRequests/testing/aRelease';
import { askWhichEpisode } from './askWhichEpisode';

const unsettled = {
  readings: [
    { numbering: 'aired' as const, episodes: [{ season: 2, episode: 1 }] },
    { numbering: 'perCour' as const, episodes: [{ season: 1, episode: 13 }] },
  ],
  guess: 'perCour' as const,
};

describe('askWhichEpisode', () => {
  it('asks about a release with each way it could be read', () => {
    const release = aRelease('[Group] Show S2 - 01');

    expect(
      askWhichEpisode(null, release, unsettled, 'Group', 'q1', '2026-10-14T00:00:00.000Z'),
    ).toEqual([
      {
        id: 'q1',
        release,
        group: 'Group',
        readings: unsettled.readings,
        guess: 'perCour',
        at: '2026-10-14T00:00:00.000Z',
      },
    ]);
  });

  it('asks about a release once, and keeps only the latest', () => {
    const at = '2026-10-14T00:00:00.000Z';
    const first = askWhichEpisode(null, aRelease('A'), unsettled, null, 'q1', at);
    const again = askWhichEpisode(first, aRelease('A'), unsettled, null, 'q2', at);

    expect(again.map((question) => question.id)).toEqual(['q2']);

    const many = Array.from({ length: 25 }, (_unused, at2) => at2).reduce(
      (asked, number) =>
        askWhichEpisode(
          asked,
          aRelease(`R${number.toString()}`),
          unsettled,
          null,
          `q${number.toString()}`,
          at,
        ),
      again,
    );

    expect(many).toHaveLength(20);
    expect(many.at(-1)?.id).toBe('q24');
  });
});
