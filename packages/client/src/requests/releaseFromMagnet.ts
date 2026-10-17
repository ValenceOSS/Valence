import type { Release } from '@ValenceContracts/schemas/Indexer';
import { say } from '@ValenceI18n/say';

const ADDED_BY_HAND = '00000000-0000-4000-8000-000000000000';

const HASH = /^urn:btih:(?<hash>[0-9a-f]{40}|[a-z2-7]{32})$/i;

/**
 * A magnet link somebody pasted, as a release a request can be given: named as given, or by the
 * name the link carries where none was given, since its name is what says which episodes it holds.
 *
 * @param magnet - The link.
 * @param name - What it holds, as a release would be named, or empty for the name in the link.
 * @returns The release, or null where it is not a magnet link to one torrent.
 */
const releaseFromMagnet = (magnet: string, name: string): Release | null => {
  const link = magnet.trim();

  if (!link.toLowerCase().startsWith('magnet:?')) {
    return null;
  }

  const parameters = new URLSearchParams(link.slice('magnet:?'.length));
  const hash = parameters
    .getAll('xt')
    .map((topic) => HASH.exec(topic)?.groups?.['hash'])
    .find((found) => found !== undefined);
  const title = name.trim() === '' ? (parameters.get('dn') ?? '').trim() : name.trim();

  if (hash === undefined || title === '') {
    return null;
  }

  return {
    id: `magnet:${hash.toLowerCase()}`,
    title,
    indexerId: ADDED_BY_HAND,
    indexerName: say('client.requests.releaseFromMagnet.addedByHand'),
    protocol: 'torrent',
    sizeBytes: null,
    seeders: null,
    leechers: null,
    grabs: null,
    publishedAt: null,
    categories: [],
    downloadUrl: null,
    magnetUrl: link,
    infoUrl: null,
    infoHash: hash.length === 40 ? hash.toLowerCase() : null,
    downloadFactor: null,
    uploadFactor: null,
    minimumRatio: null,
    minimumSeedSeconds: null,
  };
};

export { releaseFromMagnet };
