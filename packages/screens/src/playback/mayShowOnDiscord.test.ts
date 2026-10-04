import { describe, expect, it } from 'vitest';
import { DEFAULT_DISCORD_PRESENCE } from '@ValenceContracts/schemas/DiscordPresence';
import { mayShowOnDiscord } from './mayShowOnDiscord';

const PRIVATE = '00000000-0000-4000-8000-0000000000b1';

describe('mayShowOnDiscord', () => {
  it('shows films, episodes and music while they play, by default', () => {
    for (const kind of ['film', 'episode', 'track'] as const) {
      expect(mayShowOnDiscord({ kind, isPlaying: true }, DEFAULT_DISCORD_PRESENCE)).toBe(true);
    }
  });

  it('leaves each kind off by its own switch', () => {
    expect(
      mayShowOnDiscord(
        { kind: 'film', isPlaying: true },
        { ...DEFAULT_DISCORD_PRESENCE, sharesFilms: false },
      ),
    ).toBe(false);
    expect(
      mayShowOnDiscord(
        { kind: 'episode', isPlaying: true },
        { ...DEFAULT_DISCORD_PRESENCE, sharesShows: false },
      ),
    ).toBe(false);
    expect(
      mayShowOnDiscord(
        { kind: 'track', isPlaying: true },
        { ...DEFAULT_DISCORD_PRESENCE, sharesMusic: false },
      ),
    ).toBe(false);
  });

  it('never shows a library kept private', () => {
    const settings = { ...DEFAULT_DISCORD_PRESENCE, hiddenLibraryIds: [PRIVATE] };

    expect(mayShowOnDiscord({ kind: 'film', libraryId: PRIVATE, isPlaying: true }, settings)).toBe(
      false,
    );
    expect(mayShowOnDiscord({ kind: 'film', isPlaying: true }, settings)).toBe(true);
  });

  it('keeps a pause on the status unless asked not to', () => {
    expect(mayShowOnDiscord({ kind: 'film', isPlaying: false }, DEFAULT_DISCORD_PRESENCE)).toBe(
      true,
    );
    expect(
      mayShowOnDiscord(
        { kind: 'film', isPlaying: false },
        { ...DEFAULT_DISCORD_PRESENCE, showsWhilePaused: false },
      ),
    ).toBe(false);
  });
});
