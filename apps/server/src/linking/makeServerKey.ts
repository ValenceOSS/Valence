import { generateKeyPairSync } from 'node:crypto';
import { PublicServerKeySchema } from '@ValenceContracts/schemas/LinkedServer';

/**
 * Makes this server's own key for linking with other servers: an Ed25519 pair, written as JSON Web
 * Keys so they can be kept with the settings and handed to the token library as they are.
 *
 * @returns The public and the private key, each as a JWK in a string.
 */
const makeServerKey = (): { publicKey: string; privateKey: string } => {
  const made = generateKeyPairSync('ed25519');
  const publicKey = PublicServerKeySchema.parse(made.publicKey.export({ format: 'jwk' }));

  return {
    publicKey: JSON.stringify(publicKey),
    privateKey: JSON.stringify(made.privateKey.export({ format: 'jwk' })),
  };
};

export { makeServerKey };
