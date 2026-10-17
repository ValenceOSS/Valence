import type { ReleaseSearchOutcome } from '@ValenceContracts/schemas/Indexer';

const UNNAMED = 'requests.mediaRequests.judgeForRequest.itsNameDoesNotSayItIs';

/**
 * A search's releases without the ones whose names are not this title at all, which an indexer
 * returns for a loose search and which only bury the ones worth reading.
 *
 * @param found - What the search found.
 * @returns It without them, and how many were left out.
 */
const leaveOutTheUnnamed = (
  found: ReleaseSearchOutcome,
): { found: ReleaseSearchOutcome; leftOut: number } => {
  const unnamed = new Set(
    found.judgements
      .filter((judgement) => judgement.rejections.some((said) => said.code === UNNAMED))
      .map((judgement) => judgement.releaseId),
  );

  return {
    found: {
      ...found,
      releases: found.releases.filter((release) => !unnamed.has(release.id)),
      judgements: found.judgements.filter((judgement) => !unnamed.has(judgement.releaseId)),
    },
    leftOut: unnamed.size,
  };
};

export { leaveOutTheUnnamed };
