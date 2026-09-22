import { describe, expect, it, vi } from 'vitest';
import { listenForValences, whereItAnswers } from './listenForValences';
import type { Announced, Browsing } from './listenForValences';
import type { NearbyValence } from '@ValenceContracts/schemas/NearbyValence';

const THIS_MACHINE = '192.168.1.10';

/**
 * A network that announces only what a test tells it to.
 *
 * @returns The network to browse, and a way to make servers on it arrive and leave.
 */
const aNetwork = () => {
  let up: (service: Announced) => void = () => undefined;
  let down: (service: Announced) => void = () => undefined;
  const stop = vi.fn();

  const browsing: Browsing = {
    whenUp: (listener) => {
      up = listener;
    },
    whenDown: (listener) => {
      down = listener;
    },
    stop,
  };

  return {
    browse: () => browsing,
    stop,
    arrives: (service: Announced) => {
      up(service);
    },
    leaves: (service: Announced) => {
      down(service);
    },
  };
};

/**
 * Starts listening on a network, keeping what it is told.
 *
 * @param reach - How to ask whether a Valence answers.
 * @returns The network, and what was offered from it and from this machine.
 */
const listening = (reach: (address: string) => Promise<boolean> = () => Promise.resolve(true)) => {
  const network = aNetwork();
  const told: NearbyValence[][] = [];
  const here: string[] = [];

  const stop = listenForValences({
    onChange: (nearby) => {
      told.push(nearby);
    },
    onThisMachine: (address) => {
      here.push(address);
    },
    reach,
    ownAddresses: () => new Set([THIS_MACHINE, '127.0.0.1']),
    browse: network.browse,
  });

  return { network, told, here, stop };
};

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

const ACROSS_THE_ROOM: Announced = {
  name: 'Valence on media-box',
  port: 8420,
  addresses: ['fe80::1', '192.168.1.224'],
};

describe('whereItAnswers', () => {
  it('asks where the announcement came from before anything it listed', () => {
    expect(whereItAnswers({ ...ACROSS_THE_ROOM, referer: { address: '192.168.1.99' } })).toBe(
      '192.168.1.99',
    );
  });

  it('passes over an IPv6 address nobody would type', () => {
    expect(whereItAnswers(ACROSS_THE_ROOM)).toBe('192.168.1.224');
  });

  it('passes over an address a machine gave itself for want of a network', () => {
    expect(whereItAnswers({ ...ACROSS_THE_ROOM, addresses: ['169.254.3.4'] })).toBeNull();
  });
});

describe('listenForValences', () => {
  it('offers a server announced elsewhere on the network, once it has answered', async () => {
    const { network, told } = listening();

    network.arrives(ACROSS_THE_ROOM);
    await settled();

    expect(told.at(-1)).toEqual([
      { address: 'http://192.168.1.224:8420', name: 'Valence on media-box' },
    ]);
  });

  it('offers nothing that announced itself but does not answer', async () => {
    const { network, told } = listening(() => Promise.resolve(false));

    network.arrives(ACROSS_THE_ROOM);
    await settled();

    expect(told).toEqual([]);
  });

  it('takes a server off once it says goodbye', async () => {
    const { network, told } = listening();

    network.arrives(ACROSS_THE_ROOM);
    await settled();
    network.leaves(ACROSS_THE_ROOM);

    expect(told.at(-1)).toEqual([]);
  });

  it('does not offer a server that left while it was still being asked about', async () => {
    let answer: (answered: boolean) => void = () => undefined;
    const { network, told } = listening(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );

    network.arrives(ACROSS_THE_ROOM);
    network.leaves(ACROSS_THE_ROOM);
    answer(true);
    await settled();

    expect(told).toEqual([]);
  });

  it('offers a server this machine announced as this machine’s own, at localhost', async () => {
    const { network, told, here } = listening();

    network.arrives({ name: 'Valence on this-mac', port: 9000, addresses: [THIS_MACHINE] });
    await settled();

    expect(here).toEqual(['http://localhost:9000']);
    expect(told).toEqual([]);
  });

  it('asks this machine’s own server where somebody at it would reach it', async () => {
    const reach = vi.fn().mockResolvedValue(true);
    const { network } = listening(reach);

    network.arrives({ name: 'Valence on this-mac', port: 8420, addresses: [THIS_MACHINE] });
    await settled();

    expect(reach).toHaveBeenCalledWith('http://localhost:8420');
  });

  it('stops listening once told to', () => {
    const { network, stop } = listening();

    stop();

    expect(network.stop).toHaveBeenCalledOnce();
  });
});
