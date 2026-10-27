import { describe, expect, it } from 'vitest';
import { protocolOfClient } from './protocolOfClient';

describe('protocolOfClient', () => {
  it('says what a built-in client always takes', () => {
    expect(protocolOfClient({ kind: 'qbittorrent', plugin: null })).toBe('torrent');
    expect(protocolOfClient({ kind: 'nzbget', plugin: null })).toBe('usenet');
  });

  it('says what a plugin’s download client said it takes, and nothing when it names no plugin', () => {
    expect(
      protocolOfClient({
        kind: 'plugin',
        plugin: { id: 'example-files', clientId: 'files', protocol: 'usenet' },
      }),
    ).toBe('usenet');
    expect(protocolOfClient({ kind: 'plugin', plugin: null })).toBeNull();
  });
});
