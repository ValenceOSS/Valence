type SystemsControls = {
  metadata: MediaMetadataInit;
  handlers: readonly (readonly [MediaSessionAction, MediaSessionActionHandler])[];
};

type Claim = {
  setPlaying: (isPlaying: boolean) => void;
  setPosition: (position: MediaPositionState) => void;
  update: (controls: SystemsControls) => void;
  release: () => void;
};

type Held = { controls: SystemsControls; isPlaying: boolean; position: MediaPositionState | null };

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
 * Tells the system where a claim is up to, or that it says nothing of where it is.
 *
 * @param session - The system's controls.
 * @param position - Where it is up to, or nothing.
 */
const place = (session: MediaSession, position: MediaPositionState | null): void => {
  try {
    session.setPositionState(position ?? undefined);
  } catch {
    return;
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
  place(session, held.position);
  wire(session, held, true);
};

/**
 * Takes the system's media controls — the lock screen, the media keys, the system's own Now Playing —
 * for one of the window's players, and gives them back when it lets go.
 *
 * The music and an audiobook both want them, and a handler set by one quietly replaced the other's.
 * So the latest claim holds them, a claim that starts playing takes them back to the top, and letting
 * go hands them back to whichever claim is beneath, with its own words, buttons, position and
 * whether it is playing, rather than leaving nothing there. A film is a claim like any other, so a
 * headset's next button during a film does not start the next song over it.
 *
 * @param controls - What to show and which buttons do what.
 * @returns The claim, to say whether it is playing, which takes the controls back as it starts, where
 *   it is up to, what to show instead, and to let go.
 */
const claimTheSystemsControls = (controls: SystemsControls): Claim => {
  const session = theSystemsControls();
  const held: Held = { controls, isPlaying: false, position: null };
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

    setPosition: (position) => {
      held.position = position;

      if (session !== null && claims.at(-1) === held) {
        place(session, position);
      }
    },

    update: (next) => {
      const isOnTop = session !== null && claims.at(-1) === held;

      if (isOnTop) {
        wire(session, held, false);
      }

      held.controls = next;

      if (isOnTop) {
        show(session, held);
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
        place(session, null);
      } else {
        show(session, beneath);
      }
    },
  };
};

export type { Claim, SystemsControls };

export { claimTheSystemsControls };
