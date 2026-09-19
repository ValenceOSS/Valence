import { describe, expect, it } from 'vitest';
import { readTorrentHash } from './readTorrentHash';

/**
 * A torrent file as bytes, from its bencoded text.
 */
const aTorrent = (text: string) => new TextEncoder().encode(text);

const INFO = 'd6:lengthi5e4:name3:abc12:piece lengthi16384e6:pieces0:e';

describe('readTorrentHash', () => {
  it('hashes the info dictionary exactly as the file has it', () => {
    expect(readTorrentHash(aTorrent(`d8:announce3:foo4:info${INFO}e`))).toBe(
      'f697e5114ed0e822312d869e459189a9cb0124a5',
    );
  });

  it('finds the info dictionary after lists and numbers', () => {
    expect(
      readTorrentHash(
        aTorrent(`d13:announce-listll3:fooee13:creation datei1700000000e4:info${INFO}e`),
      ),
    ).toBe('f697e5114ed0e822312d869e459189a9cb0124a5');
  });

  it('refuses something that is not a torrent', () => {
    expect(readTorrentHash(aTorrent('<html>Not found</html>'))).toBeNull();
  });

  it('refuses a torrent without an info dictionary', () => {
    expect(readTorrentHash(aTorrent('d8:announce3:fooe'))).toBeNull();
  });

  it('refuses a torrent cut off partway', () => {
    expect(readTorrentHash(aTorrent('d8:announce3:foo4:infod6:lengthi5'))).toBeNull();
    expect(readTorrentHash(aTorrent('d8:announce30:foo'))).toBeNull();
    expect(readTorrentHash(aTorrent('d8:announcex'))).toBeNull();
    expect(readTorrentHash(aTorrent('d4:infol'))).toBeNull();
    expect(readTorrentHash(aTorrent('d8:announce'))).toBeNull();
    expect(readTorrentHash(aTorrent('d4:infoi5'))).toBeNull();
  });
});
