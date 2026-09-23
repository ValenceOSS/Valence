type SystemsControls = {
  metadata: MediaMetadataInit;
  handlers: readonly (readonly [MediaSessionAction, MediaSessionActionHandler])[];
};

type Claim = {
  setPlaying: (isPlaying: boolean) => void;
  release: () => void;
};

type Held = { controls: SystemsControls; isPlaying: boolean };

const claims: Held[] = [];

/**
 * The system's media controls, where this browser offers them.
 *
 * @returns The media session, or nothing.
 */
const theSystemsControls = (): MediaSession | null =>
  typeof navigator.mediaSession === 'object' && typeof MediaMetadata === 'function'
    ? navigator.mediaSession
    : null;

/**
 * Hands a set of handlers to the system, or takes them back, skipping any it does not know.
 *
 * @param session - The system's controls.
 * @param held - Whose handlers.
 * @param isTaking - Whether to hand them over rather than take them back.
 */
const wire = (session: MediaSession, held: Held, isTaking: boolean): void => {
  for (const [action, handler] of held.controls.handlers) {
    try {
      session.setActionHandler(action, isTaking ? handler : null);
    } catch {
      continue;
    }
  }
};

/**
 * Puts a claim's words and handlers on the system's controls.
 *
 * @param session - The system's controls.
 * @param held - The claim.
 */
const show = (session: MediaSession, held: Held): void => {
  session.metadata = new MediaMetadata(held.controls.metadata);
  session.playbackState = held.isPlaying ? 'playing' : 'paused';
  wire(session, held, true);
};

/**
 * Takes the system's media controls — the lock screen, the media keys, the system's own Now Playing —
 * for one of the window's players, and gives them back when it lets go.
 *
 * The music and an audiobook both want them, and a handler set by one quietly replaced the other's.
 * So the latest claim holds them, a claim that starts playing takes them back to the top, and letting
 * go hands them back to whichever claim is beneath, with its own words, buttons and whether it is
 * playing, rather than leaving nothing there.
 *
 * @param controls - What to show and which buttons do what.
 * @returns The claim, to say whether it is playing, which takes the controls back as it starts, and
 *   to let go.
 */
const claimTheSystemsControls = (controls: SystemsControls): Claim => {
  const session = theSystemsControls();
  const held: Held = { controls, isPlaying: false };
  const top = claims.at(-1);

  if (session !== null && top !== undefined) {
    wire(session, top, false);
  }

  claims.push(held);

  if (session !== null) {
    show(session, held);
  }

  return {
    setPlaying: (isPlaying) => {
      held.isPlaying = isPlaying;

      const on = claims.at(-1);

      if (on === held) {
        if (session !== null) {
          session.playbackState = isPlaying ? 'playing' : 'paused';
        }

        return;
      }

      if (isPlaying && claims.includes(held)) {
        claims.splice(claims.indexOf(held), 1);
        claims.push(held);

        if (session !== null) {
          if (on !== undefined) {
            wire(session, on, false);
          }

          show(session, held);
        }
      }
    },

    release: () => {
      const at = claims.indexOf(held);

      if (at === -1) {
        return;
      }

      const wasOnTop = at === claims.length - 1;

      claims.splice(at, 1);

      if (session === null || !wasOnTop) {
        return;
      }

      wire(session, held, false);

      const beneath = claims.at(-1);

      if (beneath === undefined) {
        session.metadata = null;
        session.playbackState = 'none';
      } else {
        show(session, beneath);
      }
    },
  };
};

export type { Claim, SystemsControls };

export { claimTheSystemsControls };
