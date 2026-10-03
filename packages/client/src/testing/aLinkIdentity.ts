import type { LinkIdentity } from '@ValenceContracts/schemas/LinkedServer';

/**
 * How this server is seen by the others, with whatever a test cares about changed.
 *
 * @param change - What differs.
 * @returns The identity.
 */
const aLinkIdentity = (change: Partial<LinkIdentity> = {}): LinkIdentity => ({
  name: 'Anime',
  colour: '#3a8ee8',
  address: 'https://anime.example',
  protocols: ['valence-link/1'],
  publicKey: { kty: 'OKP', crv: 'Ed25519', x: 'AAAA' },
  fingerprint: '0123456789abcdef',
  dropsRequestsElsewhere: false,
  ...change,
});

export { aLinkIdentity };
