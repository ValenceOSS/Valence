import { describe, expect, it, vi } from 'vitest';
import { relayDownloads } from './relayDownloads';
import type {
  ServiceEvent,
  DownloadQueue,
  DownloadStreamFrame,
} from '@ValenceContracts/schemas/DownloadQueue';

const QUEUE: DownloadQueue = { clients: [], downloads: [], checkedAt: null };

/**
 * An event with the id given.
 */
const anEvent = (id: number): ServiceEvent => ({
  id,
  kind: 'started',
  title: 'Dune',
  clientName: 'qBittorrent',
  at: '2026-09-19T00:00:00.000Z',
});

/**
 * A relay over streams that each say the frames given, then end.
 */
const aRelay = (streams: DownloadStreamFrame[][]) => {
  let opened = 0;
  const heard: {
    queues: DownloadQueue[];
    events: ServiceEvent[];
    acknowledged: number[][];
    connected: number;
    lost: string[];
    waited: number[];
  } = { queues: [], events: [], acknowledged: [], connected: 0, lost: [], waited: [] };

  const relaying = relayDownloads({
    stream: (onFrame) => {
      for (const frame of streams[opened] ?? []) {
        onFrame(frame);
      }

      opened += 1;

      return Promise.resolve(`stream ${opened.toString()} ended`);
    },
    onQueue: (queue) => heard.queues.push(queue),
    onEvent: (event) => heard.events.push(event),
    acknowledge: (ids) => {
      heard.acknowledged.push(ids);

      return Promise.resolve();
    },
    onConnected: () => {
      heard.connected += 1;
    },
    onLost: (reason) => heard.lost.push(reason),
    wait: (afterMs) => {
      heard.waited.push(afterMs);

      return Promise.resolve();
    },
    retryMs: 5000,
    keepGoing: () => opened < streams.length,
  });

  return { relaying, heard };
};

describe('relayDownloads', () => {
  it('hands on the queue, and each event once, acknowledging every time it is seen', async () => {
    const { relaying, heard } = aRelay([
      [
        { kind: 'queue', queue: QUEUE },
        { kind: 'events', events: [anEvent(1)] },
        { kind: 'events', events: [anEvent(1), anEvent(2)] },
      ],
      [{ kind: 'events', events: [anEvent(2)] }],
    ]);

    await relaying;

    expect(heard.queues).toStrictEqual([QUEUE]);
    expect(heard.events.map((event) => event.id)).toStrictEqual([1, 2]);
    expect(heard.acknowledged).toStrictEqual([[1], [1, 2], [2]]);
  });

  it('reopens a stream that ends, saying why and waiting first, and says when it is back', async () => {
    const { relaying, heard } = aRelay([
      [{ kind: 'queue', queue: QUEUE }],
      [],
      [{ kind: 'queue', queue: QUEUE }],
    ]);

    await relaying;

    expect(heard.lost).toStrictEqual(['stream 1 ended', 'stream 2 ended', 'stream 3 ended']);
    expect(heard.waited).toStrictEqual([5000, 5000]);
    expect(heard.connected).toBe(2);
  });

  it('remembers only the last thousand events it handed on', async () => {
    const many = Array.from({ length: 1001 }, (_, index) => anEvent(index + 1));
    const onEvent = vi.fn();
    let opened = 0;

    await relayDownloads({
      stream: (onFrame) => {
        onFrame({ kind: 'events', events: opened === 0 ? many : [anEvent(1), anEvent(1001)] });
        opened += 1;

        return Promise.resolve('ended');
      },
      onQueue: () => undefined,
      onEvent,
      acknowledge: () => Promise.resolve(),
      onConnected: () => undefined,
      onLost: () => undefined,
      wait: () => Promise.resolve(),
      retryMs: 0,
      keepGoing: () => opened < 2,
    });

    expect(onEvent).toHaveBeenCalledTimes(1002);
  });
});
