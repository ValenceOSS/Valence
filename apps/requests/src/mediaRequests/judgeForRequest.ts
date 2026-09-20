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

type JudgeForRequestOptions = {
  request: Pick<
    MediaRequestRecord,
    'kind' | 'title' | 'artistName' | 'aliases' | 'year' | 'runtimeMinutes'
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
  const judged = releases.flatMap((release) => {
    const parsed = parseReleaseName(release.title);
    const covered = isMusicRequest(request.kind)
      ? albumsInRelease(request, items, parsed.title, isTitleChecked)
      : matchRelease(
          isTitleChecked ? request : { ...request, title: parsed.title, aliases: [] },
          items,
          isTitleChecked ? parsed : { ...parsed, year: null },
        );

    if (covered.length === 0) {
      return [];
    }

    const fetched = covered.filter(isFetching);
    const judgement = judgeRelease(release, parsed, profile, request.runtimeMinutes ?? undefined);
    const reason = blockedBecause.get(release.title);
    const rejections = [
      ...judgement.rejections,
      ...(reason === undefined ? [] : [`It failed before: ${reason}`]),
      ...(fetched.length === 0 ? ['Everything it holds is here or on its way already'] : []),
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
