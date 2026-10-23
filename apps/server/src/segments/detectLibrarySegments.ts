import type { Said } from '@ValenceI18n/SaidSchema';
import { resolveSegments } from './SegmentProvider';
import type { SegmentCandidate, SegmentProvider } from './SegmentProvider';
import type { SegmentService } from './SegmentService';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';

type GroupedCandidate = SegmentCandidate & {
  seriesId: string | null;
  seasonNumber: number | null;
  isExtra?: boolean;
};

type DetectLibrarySegmentsOptions = {
  libraryId: string;
  correlationId?: string;
  providers: SegmentProvider[];
  creditProviders?: SegmentProvider[];
  segments: SegmentService;
  listCandidates: (libraryId: string) => Promise<GroupedCandidate[]>;
  markComplete: (mediaId: string) => Promise<void>;
  markCreditsComplete?: (mediaId: string) => Promise<void>;
  onProblem?: (provider: string, reason: Said) => void;
  onProgress?: (processed: number, total: number) => void;
  isCancelled?: () => boolean;
};

/**
 * Sorts a library's files into the groups worth comparing — episodes of the same season of the same
 * programme, which is where a shared intro would be. Comparing across programmes would be work spent
 * to find nothing, and a film has no intro or outro worth skipping, so films are left out.
 *
 * @param candidates - The library's items.
 * @returns The episodes grouped, one group per season.
 */
const groupBySeason = (candidates: GroupedCandidate[]): Map<string, GroupedCandidate[]> => {
  const groups = new Map<string, GroupedCandidate[]>();

  for (const candidate of candidates) {
    if (candidate.seriesId === null || candidate.seasonNumber === null) {
      continue;
    }

    const key = `${candidate.seriesId}:${candidate.seasonNumber.toString()}`;

    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }

  return groups;
};

/**
 * Sorts a library's files into the groups worth looking for credits in: each season together, so
 * their endings can be held against each other, and each film alone. Extras are left out.
 *
 * @param candidates - The library's items.
 * @returns The groups, seasons first.
 */
const groupForCredits = (candidates: GroupedCandidate[]): GroupedCandidate[][] => [
  ...groupBySeason(candidates).values(),
  ...candidates.filter((one) => one.seriesId === null && one.isExtra !== true).map((one) => [one]),
];

/**
 * Keeps what somebody marked or another server told Valence beside what detection just found,
 * replacing only what detection found before, and never adding a stretch of a kind already marked
 * by other means.
 *
 * @param existing - The item's segments now.
 * @param detected - What detection found.
 * @returns The segments to keep.
 */
const mergeDetected = (
  existing: readonly MediaSegment[],
  detected: readonly MediaSegment[],
): MediaSegment[] => {
  const found = new Set(detected.map((segment) => segment.kind));
  const marked = new Set(
    existing.filter((segment) => segment.source !== 'fingerprint').map((segment) => segment.kind),
  );

  return [
    ...existing.filter((segment) => segment.source !== 'fingerprint' || !found.has(segment.kind)),
    ...detected.filter((segment) => !marked.has(segment.kind)),
  ];
};

/**
 * Finds and records the intros, recaps and credits across a library: intros by listening to the
 * episodes of each season, credits in every season and film. Each is done once per item and marked
 * so, apart, so a library whose intros were found long ago still has its credits looked for.
 * Reports progress as it goes, since reading a season is minutes of work.
 *
 * @param options - The library to work through, the providers to ask, where to record what is
 *   found, and where to report progress.
 * @returns How many items were marked.
 */
const detectLibrarySegments = async ({
  libraryId,
  correlationId,
  providers,
  creditProviders = [],
  segments,
  listCandidates,
  markComplete,
  markCreditsComplete,
  onProblem,
  onProgress,
  isCancelled,
}: DetectLibrarySegmentsOptions): Promise<number> => {
  const candidates = await listCandidates(libraryId);
  const phases = [
    {
      asking: providers,
      mark: markComplete,
      groups: [...groupBySeason(candidates).values()].filter((group) =>
        group.some((candidate) => !candidate.isComplete),
      ),
    },
    {
      asking: creditProviders,
      mark: markCreditsComplete,
      groups:
        creditProviders.length === 0
          ? []
          : groupForCredits(candidates).filter((group) =>
              group.some((candidate) => !candidate.isCreditsComplete),
            ),
    },
  ];
  const total = phases.reduce(
    (sum, phase) => sum + phase.groups.reduce((count, group) => count + group.length, 0),
    0,
  );
  const marked = new Set<string>();
  let processed = 0;

  onProgress?.(processed, total);

  for (const { asking, mark, groups } of phases) {
    for (const group of groups) {
      if (isCancelled?.() === true) {
        return marked.size;
      }

      const baseline = processed;

      const { segments: found, wasAsked } = await resolveSegments(
        asking,
        group,
        onProblem,
        () => {
          processed += 1;
          onProgress?.(Math.min(processed, baseline + group.length), total);
        },
        correlationId,
      );

      for (const [mediaId, detected] of found) {
        await segments.replace(mediaId, mergeDetected(await segments.list(mediaId), detected));
        marked.add(mediaId);
      }

      if (wasAsked && mark !== undefined) {
        for (const candidate of group) {
          await mark(candidate.mediaId);
        }
      }

      processed = baseline + group.length;
      onProgress?.(processed, total);
    }
  }

  return marked.size;
};

export type { GroupedCandidate };

export { detectLibrarySegments, groupBySeason, groupForCredits, mergeDetected };
