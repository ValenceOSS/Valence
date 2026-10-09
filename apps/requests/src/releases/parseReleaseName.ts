import { readAudio } from '@ValenceRequests/releases/readAudio';
import { readCodec } from '@ValenceRequests/releases/readCodec';
import { readEdition } from '@ValenceRequests/releases/readEdition';
import { readEpisodes } from '@ValenceRequests/releases/readEpisodes';
import { readHdr } from '@ValenceRequests/releases/readHdr';
import { readLanguages } from '@ValenceRequests/releases/readLanguages';
import { readMusicQuality } from '@ValenceRequests/releases/readMusicQuality';
import { readReleaseGroup } from '@ValenceRequests/releases/readReleaseGroup';
import { readResolution } from '@ValenceRequests/releases/readResolution';
import { readRevision } from '@ValenceRequests/releases/readRevision';
import { readSource } from '@ValenceRequests/releases/readSource';
import { readTitle } from '@ValenceRequests/releases/readTitle';
import { spacedName } from '@ValenceRequests/releases/spacedName';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';

/**
 * What a name says after its title, where its title can be found in it, and otherwise all of it.
 *
 * @param spaced - The name, with its words spaced.
 * @param title - The title read from it.
 * @returns The rest of the name.
 */
const afterTheTitle = (spaced: string, title: string): string => {
  const at = title === '' ? -1 : spaced.toLowerCase().indexOf(title.toLowerCase());

  return at === -1 ? spaced : spaced.slice(at + title.length);
};

/**
 * Reads a release name into what it is: its title and year or its seasons and episodes, how it was
 * made — resolution, source, codec, HDR, audio and the languages it says it carries — who put it
 * out, whether it is a proper or a repack, and for music how it was encoded.
 *
 * Release names follow habits rather than rules, so each part is read on its own and a part a name
 * does not give is left empty rather than guessed. Languages are read only after the title, so a
 * title with a word such as Dan, Fin or English in it is not taken for a language.
 *
 * @param name - The release name.
 * @returns What it is.
 */
const parseReleaseName = (name: string): ParsedRelease => {
  const spaced = spacedName(name);
  const named = readTitle(spaced);

  return {
    ...named,
    ...readEpisodes(spaced),
    resolution: readResolution(spaced),
    source: readSource(spaced),
    codec: readCodec(spaced),
    hdr: readHdr(spaced),
    ...readAudio(name, spaced),
    musicQuality: readMusicQuality(spaced),
    languages: readLanguages(afterTheTitle(spaced, named.title)),
    edition: readEdition(spaced),
    group: readReleaseGroup(name),
    ...readRevision(spaced),
  };
};

export { parseReleaseName };
