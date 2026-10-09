import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { readService } from '@ValenceCore/releases/readService';
import { spacedName } from '@ValenceCore/releases/spacedName';
import type { ReleaseParts } from './ReleaseParts';

/**
 * Reads the parts of a release name a subtitle can be matched on: who released it, where from, at
 * what resolution, in which video and audio codecs, from which streaming service, and which cut.
 *
 * @param name - A release name, or the names a file goes by, best first.
 * @returns The parts each name gives, the first name's winning where two say different things.
 */
const releasePartsOf = (...names: readonly string[]): ReleaseParts => {
  const read = names.map((name) => ({ parsed: parseReleaseName(name), spaced: spacedName(name) }));
  const first = <T>(pick: (one: (typeof read)[number]) => T | null): T | null =>
    read.map(pick).find((value) => value !== null) ?? null;

  return {
    group: first((one) => one.parsed.group?.toLowerCase() ?? null),
    source: first((one) => one.parsed.source),
    resolution: first((one) => one.parsed.resolution),
    videoCodec: first((one) => one.parsed.codec),
    audioCodec: first((one) => one.parsed.audio[0] ?? null),
    service: first((one) => readService(one.spaced)),
    edition: first((one) => one.parsed.edition?.toLowerCase() ?? null),
  };
};

export { releasePartsOf };
