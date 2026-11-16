import { createHash } from 'node:crypto';

const ELECTRON_BUILDERS_NAMESPACE = '50e065bc-3134-11e6-9bab-38c9862bdaf3';

/**
 * The GUID electron-builder named an app's Windows install by: a version 5 UUID of the app's id in
 * electron-builder's own namespace. The Electron app's uninstaller and install folder are found in
 * the registry under it.
 *
 * @param appId - The app's id, as electron-builder was given it.
 */
const electronBuildersGuid = (appId: string): string => {
  const digest = createHash('sha1')
    .update(Buffer.from(ELECTRON_BUILDERS_NAMESPACE.replaceAll('-', ''), 'hex'))
    .update(appId)
    .digest();

  digest.writeUInt8((digest.readUInt8(6) & 0x0f) | 0x50, 6);
  digest.writeUInt8((digest.readUInt8(8) & 0x3f) | 0x80, 8);

  const hex = digest.subarray(0, 16).toString('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
};

export { electronBuildersGuid };
