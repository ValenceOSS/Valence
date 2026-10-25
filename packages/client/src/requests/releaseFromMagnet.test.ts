import { describe, expect, it } from 'vitest';
import { releaseFromMagnet } from './releaseFromMagnet';

const HASH = 'D058BE67D8EAAE6880A434600D2131684CDDF85B';

const MAGNET = `magnet:?xt=urn:btih:${HASH}&dn=%5BVictor1139%5D%20The%20Melancholy%20of%20Haruhi%20Suzumiya%20(2006)%20%5BSeason%201%20COMPLETE%5D&tr=udp%3A%2F%2Fopen.example%3A1337`;

describe('releaseFromMagnet', () => {
  it('names a magnet link by the name it carries, keeping the link to download', () => {
    expect(releaseFromMagnet(MAGNET, '')).toMatchObject({
      id: `magnet:${HASH.toLowerCase()}`,
      title: '[Victor1139] The Melancholy of Haruhi Suzumiya (2006) [Season 1 COMPLETE]',
      protocol: 'torrent',
      magnetUrl: MAGNET,
      infoHash: HASH.toLowerCase(),
      indexerName: 'Added by hand',
    });
  });

  it('names it as given, where somebody said what it holds', () => {
    expect(releaseFromMagnet(MAGNET, ' Show S01E03 ')?.title).toBe('Show S01E03');
  });

  it('takes a hash written in base 32', () => {
    expect(
      releaseFromMagnet('magnet:?xt=urn:btih:ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', 'Show S01'),
    ).toMatchObject({ id: 'magnet:abcdefghijklmnopqrstuvwxyz234567', infoHash: null });
  });

  it('refuses what is not a magnet link to one torrent, or holds nothing it can name', () => {
    expect(releaseFromMagnet('https://animetracker.example/view/1', 'Show S01')).toBeNull();
    expect(releaseFromMagnet('magnet:?dn=Show', 'Show S01')).toBeNull();
    expect(releaseFromMagnet(`magnet:?xt=urn:btih:${HASH}`, '')).toBeNull();
  });
});
