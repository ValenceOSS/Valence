import { describe, expect, it, vi } from 'vitest';
import { announceOnTheNetwork, nameOnTheNetwork } from './announceOnTheNetwork';
import type { Announcer } from './announceOnTheNetwork';

type Heard = {
  announcer: Announcer;
  published: { name: string; type: string; port: number }[];
  failWith: (error: Error) => void;
  failAnnouncement: (error: Error) => void;
  unpublished: () => boolean;
  destroyed: () => boolean;
};

/**
 * An announcer that remembers what it was asked to say, and can be made to fail either way the real
 * one does: its socket, or the announcement itself.
 *
 * @returns The announcer, and what it heard.
 */
const anAnnouncer = (): { make: (onError: (error: Error) => void) => Announcer; heard: Heard } => {
  const published: Heard['published'] = [];
  let socketFailed: (error: Error) => void = () => undefined;
  let announcementFailed: (error: Error) => void = () => undefined;
  let isUnpublished = false;
  let isDestroyed = false;

  const announcer: Announcer = {
    publish: (config) => {
      published.push(config);

      return {
        on: (_event, listener) => {
          announcementFailed = listener;
        },
      };
    },
    unpublishAll: (done) => {
      isUnpublished = true;
      done?.();
    },
    destroy: (done) => {
      isDestroyed = true;
      done?.();
    },
  };

  return {
    make: (onError) => {
      socketFailed = onError;

      return announcer;
    },
    heard: {
      announcer,
      published,
      failWith: (error) => {
        socketFailed(error);
      },
      failAnnouncement: (error) => {
        announcementFailed(error);
      },
      unpublished: () => isUnpublished,
      destroyed: () => isDestroyed,
    },
  };
};

describe('nameOnTheNetwork', () => {
  it('names the machine it runs on', () => {
    expect(nameOnTheNetwork('media-box')).toBe('Valence on media-box');
  });

  it('leaves off whatever domain the network gave the machine', () => {
    expect(nameOnTheNetwork('Marquess-Mac-mini.local')).toBe('Valence on Marquess-Mac-mini');
    expect(nameOnTheNetwork('Mac.localdomain')).toBe('Valence on Mac');
    expect(nameOnTheNetwork('media-box.home.arpa')).toBe('Valence on media-box');
  });
});

describe('announceOnTheNetwork', () => {
  it('announces a Valence on the port the server listens on', () => {
    const { make, heard } = anAnnouncer();

    announceOnTheNetwork(8420, () => undefined, make);

    expect(heard.published).toHaveLength(1);
    expect(heard.published[0]?.type).toBe('valence');
    expect(heard.published[0]?.port).toBe(8420);
    expect(heard.published[0]?.name).toMatch(/^Valence on /u);
  });

  it('says what went wrong rather than taking the server down when the socket fails', () => {
    const { make, heard } = anAnnouncer();
    const warn = vi.fn();

    announceOnTheNetwork(8420, warn, make);
    heard.failWith(new Error('no multicast route'));

    expect(warn).toHaveBeenCalledWith(
      'Could not announce this server on the network: no multicast route',
    );
  });

  it('says what went wrong when another Valence already holds the name', () => {
    const { make, heard } = anAnnouncer();
    const warn = vi.fn();

    announceOnTheNetwork(8420, warn, make);
    heard.failAnnouncement(new Error('Service name is already in use on the network'));

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('already in use'));
  });

  it('says goodbye and lets go of the socket once told to stop, then says it is done', () => {
    const { make, heard } = anAnnouncer();
    const done = vi.fn();

    const stop = announceOnTheNetwork(8420, () => undefined, make);

    expect(heard.unpublished()).toBe(false);

    stop(done);

    expect(heard.unpublished()).toBe(true);
    expect(heard.destroyed()).toBe(true);
    expect(done).toHaveBeenCalledOnce();
  });
});
