import { z } from 'zod';
import { PairAnswerSchema, ServerIdentitySchema } from '@ValenceContracts/schemas/LinkedServer';
import { FEDERATION_PATH } from './FEDERATION_PATH';
import type {
  PairAnswer,
  PairRequest,
  ServerIdentity,
} from '@ValenceContracts/schemas/LinkedServer';

const WAITS_MS = 8000;

const PairRefusalSchema = z.object({ code: z.string() });

type PeerAnswer<Answer> =
  | { kind: 'answered'; answer: Answer }
  | { kind: 'refused'; code: string }
  | { kind: 'unreachable' };

type PeerClient = {
  identityAt: (address: string) => Promise<ServerIdentity | null>;
  pair: (address: string, request: PairRequest) => Promise<PeerAnswer<PairAnswer>>;
  pairingState: (
    address: string,
    pairingId: string,
    token: string,
  ) => Promise<PeerAnswer<PairAnswer>>;
  tellUnlinked: (address: string, token: string) => Promise<boolean>;
};

/**
 * How this server talks to another Valence it is linking with. Every call gives up after a few
 * seconds, since a server that is asleep should not hold an admin's page open, and nothing the
 * other server answers is believed until it has been read through its schema.
 *
 * @param fetcher - How a request is sent, injectable for tests.
 * @returns The client.
 */
const createPeerClient = (fetcher: typeof fetch = fetch): PeerClient => {
  const send = async <Answer>(
    address: string,
    path: string,
    init: RequestInit,
    schema: z.ZodType<Answer>,
  ): Promise<PeerAnswer<Answer>> => {
    try {
      const response = await fetcher(`${address}${FEDERATION_PATH}${path}`, {
        ...init,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          ...init.headers,
        },
        signal: AbortSignal.timeout(WAITS_MS),
      });
      const body = await response.json();

      if (!response.ok) {
        const refusal = PairRefusalSchema.safeParse(body);

        return {
          kind: 'refused',
          code: refusal.success ? refusal.data.code : `${response.status}`,
        };
      }

      const read = schema.safeParse(body);

      return read.success ? { kind: 'answered', answer: read.data } : { kind: 'unreachable' };
    } catch {
      return { kind: 'unreachable' };
    }
  };

  return {
    identityAt: async (address) => {
      const answered = await send(address, '/server', { method: 'GET' }, ServerIdentitySchema);

      return answered.kind === 'answered' ? answered.answer : null;
    },
    pair: (address, request) =>
      send(address, '/pair', { method: 'POST', body: JSON.stringify(request) }, PairAnswerSchema),
    pairingState: (address, pairingId, token) =>
      send(
        address,
        `/pair/${encodeURIComponent(pairingId)}`,
        { method: 'GET', headers: { authorization: `Bearer ${token}` } },
        PairAnswerSchema,
      ),
    tellUnlinked: async (address, token) => {
      const answered = await send(
        address,
        '/unlink',
        { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: '{}' },
        z.object({ isUnlinked: z.boolean() }),
      );

      return answered.kind === 'answered';
    },
  };
};

export type { PeerAnswer, PeerClient };

export { createPeerClient };
