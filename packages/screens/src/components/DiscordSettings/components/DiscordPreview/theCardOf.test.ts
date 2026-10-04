import { describe, expect, it } from 'vitest';
import { theCardOf } from './theCardOf';
import type { DiscordActivity } from '@ValenceClient/discord/aDiscordActivity';

const NOW = 1_755_000_000_000;

const WATCHING: DiscordActivity = {
  type: 3,
  details: 'A Programme',
  state: 'Series 4, Episode 9',
  timestamps: { start: NOW / 1000 - 17, end: NOW / 1000 - 17 + 2568 },
  assets: { large_image: 'valence-desktop', large_text: 'Valence' },
  buttons: [{ label: 'View on TMDB', url: 'https://www.themoviedb.org/tv/1' }],
};

describe('theCardOf', () => {
  it('heads the card with what it is doing and in what, as Discord does', () => {
    expect(theCardOf(WATCHING, NOW).heading).toBe('Watching Valence');
    expect(theCardOf({ ...WATCHING, type: 2, name: 'A Band' }, NOW).heading).toBe(
      'Listening to A Band',
    );
  });

  it('writes the time the way Discord does, minutes in two figures', () => {
    expect(theCardOf(WATCHING, NOW).time).toEqual({
      kind: 'progress',
      elapsed: '00:17',
      total: '42:48',
      fraction: 17 / 2568,
    });
  });

  it('counts up where there is no end', () => {
    const { timestamps: _gone, ...rest } = WATCHING;

    expect(theCardOf({ ...rest, timestamps: { start: NOW / 1000 - 75 } }, NOW).time).toEqual({
      kind: 'elapsed',
      elapsed: '01:15 elapsed',
    });
  });

  it('carries the lines, the pictures and the buttons across', () => {
    expect(theCardOf(WATCHING, NOW)).toMatchObject({
      details: 'A Programme',
      state: 'Series 4, Episode 9',
      largeImage: 'valence-desktop',
      buttons: ['View on TMDB'],
    });
  });
});
