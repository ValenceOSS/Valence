import { isMusicRequest } from '@ValenceContracts/functions/isMusicRequest';
import { albumsInRelease } from '@ValenceRequests/mediaRequests/albumsInRelease';
import { matchRelease } from '@ValenceRequests/mediaRequests/matchRelease';
import { judgeRelease } from '@ValenceRequests/profiles/judgeRelease';
import { rankReleases } from '@ValenceRequests/profiles/rankReleases';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement, QualityProfile } from '@ValenceContracts/schemas/QualityProfile';
import type { BlockedReleaseRecord } from '@ValenceRequests/mediaRequests/BlockedReleaseRecord';
import type { MediaRequestRecord } from '@ValenceRequests/mediaRequests/MediaRequestRecord';
import type { RequestItemRecord } from '@ValenceRequests/mediaRequests/RequestItemRecord';

const WORTH_ITS_BYTES = 2 / 3;

type JudgeForRequestOptions = {
  request: Pick<
    MediaRequestRecord,
    'kind' | 'title' | 'artistName' | 'aliases' | 'year' | 'runtimeMinutes' | 'libraryLanguage'
  >;
  items: readonly RequestItemRecord[];
  releases: readonly Release[];
  profile: QualityProfile;
  blocked: readonly Pick<BlockedReleaseRecord, 'title' | 'reason'>[];
  priorities: ReadonlyMap<string, number>;
  isFetching: (item: RequestItemRecord) => boolean;
  isTitleChecked?: boolean;
};

type JudgedForRequest = {
  releases: Release[];
  judgements: Judgement[];
  pickedId: string | null;
  holding: ReadonlyMap<string, readonly RequestItemRecord[]>;
};

/**
 * Judges releases for one request: only those for it are kept, each judged against the request's
 * quality profile, and refused besides where it failed before, where everything it holds is here or
 * on its way already, or where it is no better than what an upgrade would replace. They come back
 * in the order they would be chosen, with the pick, and what each would fetch.
 *
 * A release picked by hand is matched by its numbers alone, or an album by its title alone, since
 * whoever picked it knows what it is better than its name does.
 *
 * A release claiming a whole season or a whole run is credited only with the episodes that had
 * aired the day it was made, so a pack of a show that has since come back does not answer for the
 * seasons that followed it.
 *
 * A pack spanning more than one season is refused where most of what it holds is already here.
 * Fetching nine seasons to fill the gaps in one is paid for in full and used in part, and the
 * seasons on their own are the better way round to it.
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
}: JudgeForRequestOptions): JudgedForRequest => {
  const holding = new Map<string, RequestItemRecord[]>();
  const blockedBecause = new Map(blocked.map((block) => [block.title, block.reason]));
  const judgedBy: QualityProfile = {
    ...profile,
    preferredLanguage: profile.preferredLanguage ?? request.libraryLanguage,
  };
  const judged = releases.flatMap((release) => {
    const parsed = parseReleaseName(release.title);
    const covered = isMusicRequest(request.kind)
      ? albumsInRelease(request, items, parsed.title, isTitleChecked)
      : matchRelease(
          isTitleChecked ? request : { ...request, title: parsed.title, aliases: [] },
          items,
          isTitleChecked ? parsed : { ...parsed, year: null },
          release.publishedAt?.slice(0, 10) ?? null,
        );

    if (covered.length === 0) {
      return [];
    }

    const fetched = covered.filter(isFetching);
    const judgement = judgeRelease(
      release,
      parsed,
      judgedBy,
      request.runtimeMinutes ?? undefined,
      covered.length,
    );
    const reason = blockedBecause.get(release.title);
    const isWholeRun = parsed.isCompleteSeries || parsed.seasons.length > 1;
    const isMostlyUnwanted =
      isWholeRun && fetched.length > 0 && fetched.length / covered.length < WORTH_ITS_BYTES;
    const rejections = [
      ...judgement.rejections,
      ...(reason === undefined ? [] : [`It failed before: ${reason}`]),
      ...(fetched.length === 0 ? ['Everything it holds is here or on its way already'] : []),
      ...(isMostlyUnwanted
        ? [
            `Only ${fetched.length.toString()} of the ${covered.length.toString()} episodes it holds are wanted`,
          ]
        : []),
      ...(fetched.some((item) => item.score !== null && judgement.score <= item.score)
        ? ['It is no better than what is here already']
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
    ),
    holding,
  };
};

export type { JudgedForRequest };

export { judgeForRequest };
