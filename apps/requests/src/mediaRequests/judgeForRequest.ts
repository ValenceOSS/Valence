import { saying } from '@ValenceI18n/saying';
import { isBookRequest } from '@ValenceContracts/functions/isBookRequest';
import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { albumsInRelease } from '@ValenceRequests/mediaRequests/albumsInRelease';
import { isNearTitle } from '@ValenceRequests/mediaRequests/isNearTitle';
import { matchRelease } from '@ValenceRequests/mediaRequests/matchRelease';
import { judgeRelease } from '@ValenceRequests/profiles/judgeRelease';
import { rankReleases } from '@ValenceRequests/profiles/rankReleases';
import { hashOfRelease } from '@ValenceRequests/releases/hashOfRelease';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import type { Release, ReleaseProtocol } from '@ValenceContracts/schemas/Indexer';
import type { ParsedRelease } from '@ValenceContracts/schemas/ParsedRelease';
import type { Judgement, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { BlockedReleaseRecord } from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const WORTH_ITS_BYTES = 2 / 3;

/**
 * How much a release holds, counting seasons the request never asked for: the seasons its name
 * gives, or for a complete run every season up to the last there is, and its episodes, those it was
 * matched with and as many again for each season nobody asked for as a season that was asked for
 * has.
 *
 * @param parsed - What its name says.
 * @param covered - The request's films or episodes it was matched with.
 * @param lastSeason - The last regular season there is, where known.
 * @returns How many seasons and episodes it holds, and how many of its seasons were not asked for.
 */
const packOf = (
  parsed: Pick<ParsedRelease, 'seasons' | 'isCompleteSeries'>,
  covered: readonly Pick<RequestItemRecord, 'season'>[],
  lastSeason: number | null,
): { seasons: number; episodes: number; unasked: number } => {
  const asked = new Set(covered.flatMap((item) => (item.season === null ? [] : [item.season])));
  const last = lastSeason ?? Math.max(0, ...asked);
  const seasons =
    parsed.seasons.length > 0
      ? parsed.seasons
      : parsed.isCompleteSeries
        ? Array.from({ length: last }, (_unused, at) => at + 1)
        : [...asked];
  const unasked = seasons.filter((season) => !asked.has(season)).length;
  const perSeason = asked.size === 0 ? 0 : covered.length / asked.size;

  return {
    seasons: seasons.length,
    episodes: covered.length + Math.round(unasked * perSeason),
    unasked,
  };
};

type JudgeForRequestOptions = {
  request: Pick<
    MediaRequestRecord,
    | 'kind'
    | 'title'
    | 'artistName'
    | 'aliases'
    | 'year'
    | 'runtimeMinutes'
    | 'libraryLanguage'
    | 'followsAfter'
  >;
  items: readonly RequestItemRecord[];
  releases: readonly Release[];
  profile: QualityProfile;
  blocked: readonly (Pick<BlockedReleaseRecord, 'title' | 'reason'> &
    Partial<Pick<BlockedReleaseRecord, 'infoHash'>>)[];
  priorities: ReadonlyMap<string, number>;
  isFetching: (item: RequestItemRecord) => boolean;
  isTitleChecked?: boolean;
  keepsTheUnnamed?: boolean;
  takes?: ReadonlySet<ReleaseProtocol>;
};

type JudgedForRequest = {
  releases: Release[];
  judgements: Judgement[];
  pickedId: string | null;
  holding: ReadonlyMap<string, readonly RequestItemRecord[]>;
};

/**
 * Judges releases for one request: only those for it are kept, each judged against the request's
 * quality profile, and refused besides where it failed before, under that name or as the same
 * torrent under another, where everything it holds is here or on its way already, or where it is
 * no better than what an upgrade would replace. They come back in the order they would be chosen,
 * with the pick, and what each would fetch.
 *
 * A release picked by hand is matched by its numbers alone, or an album by its title alone, since
 * whoever picked it knows what it is better than its name does. One an indexer found by the
 * title's catalogue id is taken under a title near the one asked for too, such as "The Office US"
 * for "The Office", since the id says what it is.
 *
 * A release claiming a whole season or a whole run is credited only with the episodes that had
 * aired the day it was made, so a pack of a show that has since come back does not answer for the
 * seasons that followed it.
 *
 * A pack spanning more than one season is refused where most of what it holds is already here or
 * not asked for. What it holds counts the seasons nobody asked for too, at the episodes a season
 * asked for has, and so does the size it is judged by. Fetching nine seasons to fill the gaps in one
 * is paid for in full and used in part, and the seasons on their own are the better way round to it.
 *
 * A profile that names no preferred language takes the one its library is set to, which is what
 * makes the setting worth having: an operator who has already said their films are in German
 * should not have to say it again on every profile.
 *
 * @param request - What was asked for.
 * @param items - Its films or episodes.
 * @param releases - What the indexers found.
 * @param profile - The quality profile to judge against.
 * @param blocked - Releases that failed this request before.
 * @param priorities - Each indexer's priority, by its id.
 * @param isFetching - Whether a film or episode is one to fetch now.
 * @param isTitleChecked - Whether a release must be named for the request.
 * @param keepsTheUnnamed - Whether a release whose name does not say it is for the request is kept,
 *   refused for that, as somebody choosing by hand is shown it rather than left wondering where it
 *   went.
 * @param takes - The protocols a download client is on for, where known; a release of any other
 *   could never be sent, and is refused rather than chosen again on every search.
 * @returns The releases and their judgements in order, the pick, and what each would fetch.
 */
const judgeForRequest = ({
  request,
  items,
  releases,
  profile,
  blocked,
  priorities,
  isFetching,
  isTitleChecked = true,
  keepsTheUnnamed = false,
  takes,
}: JudgeForRequestOptions): JudgedForRequest => {
  const holding = new Map<string, RequestItemRecord[]>();
  const blockedBecause = new Map(blocked.map((block) => [block.title, block.reason]));
  const blockedHashes = new Map(
    blocked.flatMap((block) =>
      block.infoHash === undefined || block.infoHash === null
        ? []
        : [[block.infoHash, block.reason] as const],
    ),
  );
  const judgedBy: QualityProfile = {
    ...profile,
    preferredLanguage: profile.preferredLanguage ?? request.libraryLanguage,
  };
  const judged = releases.flatMap((release) => {
    const parsed = parseReleaseName(release.title);
    const named =
      release.isFoundById === true &&
      [request.title, ...request.aliases].some((title) => isNearTitle(parsed.title, title))
        ? { ...request, aliases: [...request.aliases, parsed.title] }
        : request;
    const covered = isMusicRequest(request.kind)
      ? albumsInRelease(request, items, parsed.title, isTitleChecked)
      : matchRelease(
          isTitleChecked ? named : { ...request, title: parsed.title, aliases: [] },
          items,
          isTitleChecked ? parsed : { ...parsed, year: null },
          release.publishedAt?.slice(0, 10) ?? null,
        );

    if (covered.length === 0) {
      if (!keepsTheUnnamed) {
        return [];
      }

      const unnamed = judgeRelease(
        release,
        parsed,
        judgedBy,
        request.runtimeMinutes ?? undefined,
        1,
        isBookRequest(request.kind),
      );
      const rejections = [
        saying('requests.mediaRequests.judgeForRequest.itsNameDoesNotSayItIs'),
        ...unnamed.rejections,
      ];

      holding.set(release.id, []);

      return [{ release, judgement: { ...unnamed, rejections, isRejected: true } }];
    }

    const fetched = covered.filter(isFetching);
    const pack = packOf(parsed, covered, request.followsAfter);
    const judgement = judgeRelease(
      release,
      parsed,
      judgedBy,
      request.runtimeMinutes ?? undefined,
      pack.episodes,
      isBookRequest(request.kind),
    );
    const hash = hashOfRelease(release);
    const reason =
      blockedBecause.get(release.title) ?? (hash === null ? undefined : blockedHashes.get(hash));
    const isWholeRun = parsed.isCompleteSeries || parsed.seasons.length > 1;
    const isMostlyUnwanted =
      isWholeRun && fetched.length > 0 && fetched.length / pack.episodes < WORTH_ITS_BYTES;
    const seasonsWanted = new Set(fetched.map((item) => item.season)).size;
    const rejections = [
      ...judgement.rejections,
      ...(reason === undefined
        ? []
        : [saying('requests.mediaRequests.judgeForRequest.itFailedBeforeReason', { reason })]),
      ...(fetched.length === 0
        ? [saying('requests.mediaRequests.judgeForRequest.everythingItHoldsIsHereOr')]
        : []),
      ...(takes === undefined || takes.has(release.protocol)
        ? []
        : [
            saying(
              release.protocol === 'torrent'
                ? 'requests.downloads.noTorrentClient'
                : 'requests.downloads.noUsenetClient',
            ),
          ]),
      ...(isMostlyUnwanted
        ? [
            pack.unasked > 0
              ? saying('requests.mediaRequests.judgeForRequest.onlySomeSeasonsWanted', {
                  wanted: seasonsWanted.toString(),
                  held: pack.seasons.toString(),
                })
              : saying('requests.mediaRequests.judgeForRequest.onlySomeEpisodesWanted', {
                  wanted: fetched.length.toString(),
                  held: covered.length.toString(),
                }),
          ]
        : []),
      ...(fetched.some((item) => item.score !== null && judgement.score <= item.score)
        ? [saying('requests.mediaRequests.judgeForRequest.itIsNoBetterThanWhat')]
        : []),
    ];

    holding.set(release.id, fetched);

    return [
      { release, judgement: { ...judgement, rejections, isRejected: rejections.length > 0 } },
    ];
  });

  return {
    ...rankReleases(
      judged.map((pair) => pair.release),
      judged.map((pair) => pair.judgement),
      priorities,
      new Map([...holding].map(([id, items]) => [id, items.length])),
    ),
    holding,
  };
};

export type { JudgedForRequest };

export { judgeForRequest };
