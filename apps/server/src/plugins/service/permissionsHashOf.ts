import { createHash } from 'node:crypto';
import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';

/**
 * A short fingerprint of exactly the permissions an administrator was shown, which the install
 * request has to repeat, so a plugin cannot be installed with permissions nobody looked at.
 *
 * @param permissions - The permissions as the package declares them.
 * @returns The fingerprint.
 */
const permissionsHashOf = (permissions: readonly Permission[]): string =>
  createHash('sha256').update(JSON.stringify(permissions)).digest('hex').slice(0, 32);

export { permissionsHashOf };
