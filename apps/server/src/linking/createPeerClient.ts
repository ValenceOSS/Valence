import { z } from 'zod';
import { PairAnswerSchema, ServerIdentitySchema } from '@ValenceContracts/schemas/LinkedServer';
import {
  FederationActivityListSchema,
  SharedLibrariesSchema,
} from '@ValenceContracts/schemas/LinkSharing';
import { FEDERATION_PATH } from './FEDERATION_PATH';
import type { FederationActivity, SharedLibrary } from '@ValenceContracts/schemas/LinkSharing';
import { CataloguePageSchema } from './catalogue/CataloguePageSchema';
import type { CataloguePage } from './catalogue/CataloguePageSchema';
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
  libraries: (
    address: string,
    token: string,
  ) => Promise<
    PeerAnswer<{ libraries: SharedLibrary[]; allowsDownloads: boolean; takesRequests: boolean }>
  >;
  activity: (
    address: string,
    token: string,
    since?: Date,
  ) => Promise<PeerAnswer<FederationActivity[]>>;
  catalogue: (
    address: string,
    token: string,
    libraryId: string,
    after: string | null,
  ) => Promise<PeerAnswer<CataloguePage>>;
  passThrough: (
    address: string,
    token: string,
    route: string,
    init: { method: string; headers: Headers; body?: ArrayBuffer },
  ) => Promise<Response | null>;
};

/**
 * How this server talks to another Valence it is linking with. Every call gives up after a few
 * seconds, since a server that is asleep should not hold an admin's page open, and nothing the
 * other server answers is believed until it has been read through its schema — except what is
 * passed through for somebody watching, reading or listening, which is a picture, a page or a
 * stream handed back as it comes, and runs as long as it is watched.
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
    libraries: async (address, token) => {
      const answered = await send(
        address,
        '/libraries',
        { method: 'GET', headers: { authorization: `Bearer ${token}` } },
        SharedLibrariesSchema,
      );

      return answered;
    },
    activity: async (address, token, since) => {
      const answered = await send(
        address,
        `/activity${since === undefined ? '' : `?since=${encodeURIComponent(since.toISOString())}`}`,
        { method: 'GET', headers: { authorization: `Bearer ${token}` } },
        FederationActivityListSchema,
      );

      return answered.kind === 'answered'
        ? { kind: 'answered', answer: answered.answer.entries }
        : answered;
    },
    catalogue: (address, token, libraryId, after) =>
      send(
        address,
        `/catalogue/${encodeURIComponent(libraryId)}${after === null ? '' : `?after=${encodeURIComponent(after)}`}`,
        { method: 'GET', headers: { authorization: `Bearer ${token}` } },
        CataloguePageSchema,
      ),
    passThrough: async (address, token, route, init) => {
      const headers = new Headers(init.headers);

      headers.set('authorization', `Bearer ${token}`);

      return fetcher(`${address}${FEDERATION_PATH}${route}`, {
        method: init.method,
        headers,
        ...(init.body === undefined ? {} : { body: init.body }),
      }).catch(() => null);
    },
  };
};

export type { PeerAnswer, PeerClient };

export { createPeerClient };
