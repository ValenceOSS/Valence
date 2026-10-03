import { vi } from 'vitest';
import { readLinkedAddress } from '@ValenceServer/linking/catalogue/readLinkedAddress';
import type { Asking, LinkedAsker } from '@ValenceServer/linking/content/createLinkedAsker';

type Asked = { serverId: string; route: string; asking: Asking };

/**
 * Stands in for asking linked servers, answering each request with whatever the test says for its
 * route, and recording what it was asked.
 *
 * @param answer - What to answer a server and route with: a response, or nothing for a server that
 *   could not be reached.
 * @returns The asker, and what it was asked.
 */
const aLinkedAskerAnswering = (
  answer: (serverId: string, route: string, asking: Asking) => Response | null,
): LinkedAsker & { asked: Asked[] } => {
  const asked: Asked[] = [];
  const ask = vi.fn((serverId: string, route: string, asking: Asking = {}) => {
    asked.push({ serverId, route, asking });

    return Promise.resolve(answer(serverId, route, asking));
  });

  return {
    asked,
    ask,
    askAt: (address, asking = {}) => {
      const linked = readLinkedAddress(address);

      return linked === null ? Promise.resolve(null) : ask(linked.serverId, linked.route, asking);
    },
  };
};

export { aLinkedAskerAnswering };
