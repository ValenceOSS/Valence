import { createRoute, z } from '@hono/zod-openapi';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  PairAnswerSchema,
  PairRequestSchema,
  ServerIdentitySchema,
} from '@ValenceContracts/schemas/LinkedServer';

const FederationError = RefusalSchema.openapi('FederationError');

const ServerIdentity = ServerIdentitySchema.openapi('ServerIdentity');

const PairAnswer = PairAnswerSchema.openapi('PairAnswer');

const SignedByAPeer = z.object({ authorization: z.string().startsWith('Bearer ') });

/**
 * Describes a refusal one of these routes answers with.
 *
 * @param description - What the refusal means.
 * @returns The response's description.
 */
const refused = (description: string) => ({
  description,
  content: { 'application/json': { schema: FederationError } },
});

const serverRoute = createRoute({
  method: 'get',
  path: '/api/federation/v1/server',
  tags: ['Federation'],
  summary: 'Say who this server is, for another Valence linking with it',
  responses: {
    200: {
      description: 'Its name, colour, protocols, public key and fingerprint',
      content: { 'application/json': { schema: ServerIdentity } },
    },
  },
});

const pairRoute = createRoute({
  method: 'post',
  path: '/api/federation/v1/pair',
  tags: ['Federation'],
  summary: 'Ask to link, with an invite this server made',
  request: { body: { content: { 'application/json': { schema: PairRequestSchema } } } },
  responses: {
    201: {
      description: 'The request, waiting for this server’s admin to approve it',
      content: { 'application/json': { schema: PairAnswer } },
    },
    400: refused('The invite is not one this server has open'),
    409: refused('The asking server is already linked, or is this one'),
  },
});

const pairingStateRoute = createRoute({
  method: 'get',
  path: '/api/federation/v1/pair/{pairingId}',
  tags: ['Federation'],
  summary: 'Ask whether a request to link has been answered',
  request: { params: z.object({ pairingId: z.string().uuid() }), headers: SignedByAPeer },
  responses: {
    200: {
      description: 'Where the request stands, from the asking server’s side',
      content: { 'application/json': { schema: PairAnswer } },
    },
    404: refused('No such request from the server that signed the question'),
  },
});

const unlinkRoute = createRoute({
  method: 'post',
  path: '/api/federation/v1/unlink',
  tags: ['Federation'],
  summary: 'Say the signing server has unlinked from this one',
  request: { headers: SignedByAPeer },
  responses: {
    200: {
      description: 'Heard',
      content: { 'application/json': { schema: z.object({ isUnlinked: z.boolean() }) } },
    },
    404: refused('This server does not know the server that signed it'),
  },
});

export { pairRoute, pairingStateRoute, serverRoute, unlinkRoute };
