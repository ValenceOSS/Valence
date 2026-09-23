import { vi } from 'vitest';

type Handler = ((details: { seekTime?: number; seekOffset?: number }) => void) | null;

type FakeSession = {
  metadata: MediaMetadataInit | null;
  playbackState: string;
  handlers: Map<string, Handler>;
  press: (action: string, details?: { seekTime?: number; seekOffset?: number }) => void;
};

/**
 * Stands in for the system's media controls, which jsdom does not have, so what a player puts on
 * them can be read and their buttons pressed. Undone by `vi.unstubAllGlobals`, for the metadata,
 * and by deleting `navigator.mediaSession`.
 *
 * @returns The controls.
 */
const aFakeMediaSession = (): FakeSession => {
  const handlers = new Map<string, Handler>();
  const session: FakeSession & {
    setActionHandler: (action: string, handler: Handler) => void;
    setPositionState: ReturnType<typeof vi.fn>;
  } = {
    metadata: null,
    playbackState: 'none',
    handlers,
    setActionHandler: (action: string, handler: Handler) => {
      if (handler === null) {
        handlers.delete(action);
      } else {
        handlers.set(action, handler);
      }
    },
    setPositionState: vi.fn(),
    press: (action: string, details: { seekTime?: number; seekOffset?: number } = {}) => {
      handlers.get(action)?.(details);
    },
  };

  vi.stubGlobal(
    'MediaMetadata',
    class {
      title: string;
      artist: string;
      album: string;

      constructor(init: MediaMetadataInit) {
        this.title = init.title ?? '';
        this.artist = init.artist ?? '';
        this.album = init.album ?? '';
      }
    },
  );
  Object.defineProperty(navigator, 'mediaSession', { value: session, configurable: true });

  return session;
};

export { aFakeMediaSession };
