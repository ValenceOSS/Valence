import { readAudio } from '@ValenceRequests/releases/readAudio';
import { readCodec } from '@ValenceRequests/releases/readCodec';
import { readEdition } from '@ValenceRequests/releases/readEdition';
import { readEpisodes } from '@ValenceRequests/releases/readEpisodes';
import { readHdr } from '@ValenceRequests/releases/readHdr';
import { readMusicQuality } from '@ValenceRequests/releases/readMusicQuality';
import { readReleaseGroup } from '@ValenceRequests/releases/readReleaseGroup';
import { readResolution } from '@ValenceRequests/releases/readResolution';
import { readRevision } from '@ValenceRequests/releases/readRevision';
import { readSource } from '@ValenceRequests/releases/readSource';
import { readTitle } from '@ValenceRequests/releases/readTitle';
import { spacedName } from '@ValenceRequests/releases/spacedName';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';

/**
 * Reads a release name into what it is: its title and year or its seasons and episodes, how it was
 * made — resolution, source, codec, HDR and audio — who put it out, whether it is a proper or a
 * repack, and for music how it was encoded.
 *
 * Release names follow habits rather than rules, so each part is read on its own and a part a name
 * does not give is left empty rather than guessed.
 *
 * @param name - The release name.
 * @returns What it is.
 */
const parseReleaseName = (name: string): ParsedRelease => {
  const spaced = spacedName(name);

  return {
    ...readTitle(spaced),
    ...readEpisodes(spaced),
    resolution: readResolution(spaced),
    source: readSource(spaced),
    codec: readCodec(spaced),
    hdr: readHdr(spaced),
    ...readAudio(name, spaced),
    musicQuality: readMusicQuality(spaced),
    edition: readEdition(spaced),
    group: readReleaseGroup(name),
    ...readRevision(spaced),
  };
};

export { parseReleaseName };
