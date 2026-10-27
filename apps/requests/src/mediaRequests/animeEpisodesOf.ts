import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { matchAnimeRelease } from '@ValenceRequests/mediaRequests/matchAnimeRelease';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

type Numbered = Pick<
  RequestItemRecord,
  'id' | 'season' | 'episode' | 'title' | 'airDate' | 'releaseTitle'
>;

/**
 * Which of a download's episodes one of its anime files holds, however it numbers them: read the
 * way its release as a whole was, as a batch numbers each of its files alike; as its name reads with
 * the show's or a cour's name in it, and otherwise by its numbers alone; and where its numbers could
 * still mean more than one set of episodes, the one reading that holds only episodes the download
 * was fetched for.
 *
 * @param request - What was asked for, its cours and how each release group numbers its releases.
 * @param items - The episodes the download was fetched for.
 * @param parsed - What the file's name says.
 * @param name - The file's name.
 * @returns The episodes it holds.
 */
const animeEpisodesOf = (
  request: Pick<MediaRequestRecord, 'title' | 'aliases' | 'anime' | 'numberingByGroup'>,
  items: readonly Numbered[],
  parsed: ParsedRelease,
  name: string,
): { season: number | null; episode: number | null }[] => {
  const releaseTitle = items.find((item) => item.releaseTitle !== null)?.releaseTitle ?? null;
  const readAs = (isTitleChecked: boolean) =>
    releaseTitle === null
      ? null
      : matchAnimeRelease(
          request,
          items,
          parseReleaseName(releaseTitle),
          releaseTitle,
          null,
          isTitleChecked,
        );
  const titled = readAs(true);
  const asReleased = titled === null || titled.kind === 'none' ? readAs(false) : titled;
  const numbering = asReleased?.kind === 'matched' ? asReleased.numbering : null;
  const named = matchAnimeRelease(request, items, parsed, name, null, true, numbering);
  const found =
    named.kind === 'none'
      ? matchAnimeRelease(request, items, parsed, name, null, false, numbering)
      : named;

  if (found.kind === 'matched') {
    return found.items;
  }

  if (found.kind === 'none') {
    return [];
  }

  const fitting = found.readings.filter((reading) =>
    reading.episodes.every((one) =>
      items.some((item) => item.season === one.season && item.episode === one.episode),
    ),
  );

  return fitting.length === 1 ? (fitting[0]?.episodes ?? []) : [];
};

export type { Numbered };

export { animeEpisodesOf };
