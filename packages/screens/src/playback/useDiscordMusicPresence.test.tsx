import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { z } from 'zod';
import { useDiscordMusicPresence } from './useDiscordMusicPresence';
import type { DiscordMusicPresence } from './useDiscordMusicPresence';
import type { WhatIsPlaying } from '@ValenceClient/music/useWhatIsPlaying';

const ListenedSchema = z.object({
  title: z.string(),
  artists: z.array(z.string()),
  startedAt: z.number(),
  endsAt: z.number().nullable(),
  isPaused: z.boolean(),
});

type Listened = z.infer<typeof ListenedSchema> | null;

const KindSchema = z.object({ kind: z.string() }).nullable().catch(null);

const seen: Listened[] = [];

const heard = (event: Event) => {
  seen.push(
    event instanceof CustomEvent ? ListenedSchema.nullable().catch(null).parse(event.detail) : null,
  );
};

const A_TRACK: WhatIsPlaying = {
  trackId: 'a-track',
  title: 'How Not To Drown',
  artists: [
    { id: 'chvrches', name: 'CHVRCHES' },
    { id: null, name: 'Robert Smith' },
  ],
  albumId: 'an-album',
  albumTitle: 'Screen Violence',
  hasArtwork: true,
  positionSeconds: 0,
  durationSeconds: 331,
  isPlaying: true,
  isLoading: false,
  volume: 1,
  remote: null,
};

const said = (): Listened | undefined => seen.at(-1);

const listening = (overrides: Partial<DiscordMusicPresence> = {}) => {
  const Showing = () => {
    useDiscordMusicPresence({ playing: A_TRACK, isAllowed: true, ...overrides });

    return null;
  };

  return render(<Showing />);
};

beforeEach(() => {
  seen.length = 0;
  document.documentElement.dataset['valenceDesktop'] = 'true';
  document.addEventListener('valence:now-watching', heard);
});

afterEach(() => {
  document.removeEventListener('valence:now-watching', heard);
  delete document.documentElement.dataset['valenceDesktop'];
});

describe('useDiscordMusicPresence', () => {
  it('says what is playing where the profile asked for it', () => {
    listening();

    expect(said()).toMatchObject({
      title: 'How Not To Drown',
      artists: ['CHVRCHES', 'Robert Smith'],
    });
  });

  it('spans the whole track, so the bar reads as a place in it rather than time spent listening', () => {
    listening();

    const detail = said();

    expect((detail?.endsAt ?? 0) - (detail?.startedAt ?? 0)).toBe(331_000);
  });

  it('says nothing at all where the profile did not ask, which is the default', () => {
    listening({ isAllowed: false });

    expect(said()).toBeNull();
  });

  it('keeps saying what is open while paused, since a pause is not stopping', () => {
    listening({ playing: { ...A_TRACK, isPlaying: false } });

    expect(said()?.title).toBe('How Not To Drown');
    expect(said()?.isPaused).toBe(true);
  });

  it('says nothing in a browser, which has no window to publish it', () => {
    delete document.documentElement.dataset['valenceDesktop'];

    listening();

    expect(said()).toBeNull();
  });

  it('goes to browsing once nothing is playing, rather than leaving the last track up', () => {
    const raw: (string | null)[] = [];
    const listen = (event: Event) => {
      const heardKind = event instanceof CustomEvent ? KindSchema.parse(event.detail) : null;

      raw.push(heardKind === null ? null : heardKind.kind);
    };

    document.addEventListener('valence:now-watching', listen);

    const Showing = ({ playing }: { playing: WhatIsPlaying | null }) => {
      useDiscordMusicPresence({ playing, isAllowed: true });

      return null;
    };

    const { rerender } = render(<Showing playing={A_TRACK} />);

    raw.length = 0;
    rerender(<Showing playing={null} />);

    document.removeEventListener('valence:now-watching', listen);

    expect(raw).toContain('browsing');
  });

  it('clears when the bar goes, rather than leaving somebody shown as listening', () => {
    const { unmount } = listening();

    unmount();

    expect(said()).toBeNull();
  });

  it('does not clear and re-say the status as the position moves', () => {
    const AtPosition = ({ positionSeconds }: { positionSeconds: number }) => {
      useDiscordMusicPresence({
        playing: { ...A_TRACK, positionSeconds },
        isAllowed: true,
      });

      return null;
    };

    const { rerender } = render(<AtPosition positionSeconds={10} />);

    seen.length = 0;

    for (let second = 11; second <= 24; second += 1) {
      rerender(<AtPosition positionSeconds={second} />);
    }

    expect(seen.length).toBeLessThanOrEqual(1);
  });

  it('sends a listening party as company beside the track', () => {
    listening({ party: { id: 'a-party', size: 2 } });

    expect(said()).not.toBeNull();
  });
});
