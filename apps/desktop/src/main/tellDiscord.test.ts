import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiscordLookSchema } from '@ValenceContracts/schemas/DiscordPresence';
import { aDiscordFrame, FRAME, readDiscordFrames } from './aDiscordFrame';
import { tellDiscord } from './tellDiscord';

class AFakeSocket extends EventEmitter {
  written: Buffer[] = [];

  write(chunk: Buffer): boolean {
    this.written.push(chunk);

    return true;
  }

  isDestroyed = false;

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.emit('close');
  }
}

const sockets = vi.hoisted((): { last: AFakeSocket | null } => ({ last: null }));

vi.mock('node:net', () => {
  const createConnection = () => {
    const made = new AFakeSocket();

    sockets.last = made;

    return made;
  };

  return { createConnection, default: { createConnection } };
});

vi.mock('./whereDiscordListens', () => ({ whereDiscordListens: () => ['/tmp/discord-ipc-0'] }));

const LOOK = DiscordLookSchema.parse({});

/**
 * Connects the last socket made and has Discord say it is ready, as it does after a handshake.
 *
 * @returns The socket.
 */
const readyToTalk = (): AFakeSocket => {
  const socket = sockets.last;

  if (socket === null) {
    throw new Error('Nothing tried to connect');
  }

  socket.emit('connect');
  socket.emit('data', aDiscordFrame(FRAME, JSON.stringify({ evt: 'READY' })));

  return socket;
};

/**
 * The activities written to a socket, in order, read back out of the frames.
 *
 * @param socket - The socket.
 * @returns How many status changes were sent.
 */
const statusesSent = (socket: AFakeSocket): number =>
  readDiscordFrames(Buffer.concat(socket.written)).frames.filter((frame) =>
    frame.payload.includes('SET_ACTIVITY'),
  ).length;

beforeEach(() => {
  sockets.last = null;
});

describe('tellDiscord', () => {
  it('sends a status that has changed, and not one that is the same as the last', () => {
    const discord = tellDiscord('/tmp', 1_755_000_000_000);

    discord.about({ kind: 'browsing', look: LOOK });

    const socket = readyToTalk();

    discord.about({ kind: 'browsing', look: LOOK });
    discord.about({ kind: 'browsing', look: LOOK });

    expect(statusesSent(socket)).toBe(1);

    discord.about({ kind: 'browsing', look: { ...LOOK, logo: 'dark' } });
    discord.about(null);

    expect(statusesSent(socket)).toBe(3);
  });

  it('sends the status again over a new connection, where Discord has forgotten it', () => {
    const discord = tellDiscord('/tmp', 1_755_000_000_000);

    discord.about({ kind: 'browsing', look: LOOK });
    readyToTalk().emit('close');

    discord.about({ kind: 'browsing', look: LOOK });

    expect(statusesSent(readyToTalk())).toBe(1);
  });
});
