import { isDirectPlay } from '@ValenceCore/functions/isDirectPlay';
import { negotiatePlayback } from '@ValenceCore/functions/negotiatePlayback';
import { resolveQualityStep } from '@ValenceCore/functions/resolveQualityStep';
import type { QualityClamp } from '@ValenceCore/functions/resolveQualityStep';
import type { DeviceProfile } from '@ValenceContracts/schemas/DeviceProfile';
import type { MediaItem } from '@ValenceContracts/schemas/MediaItem';
import type { PlaybackPlan } from '@ValenceContracts/schemas/PlaybackPlan';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';

type PlayableSource = {
  id: string;
  isOriginal: boolean;
  item: MediaItem;
  path: string;
};

type ChosenSource = {
  source: PlayableSource;
  plan: PlaybackPlan;
  qualityClamp: QualityClamp | null;
  isDirectPlay: boolean;
};

type ChooseSourceOptions = {
  sources: readonly PlayableSource[];
  profile: DeviceProfile;
  requestedQuality?: QualityStepId | 'original';
  preferredAudioLanguage?: string | null;
  chosenSubtitleStreamIndex?: number | null;
  pinnedSourceId?: string | null;
  neverSmaller?: boolean;
};

/**
 * Negotiates one source, so every candidate is judged by the same reasoning that would have been
 * applied had it been the only file there is.
 *
 * @param source - The file being weighed.
 * @param options - The device asking, the rung it asked for, and the tracks it wants.
 * @returns What playing that source would involve.
 */
const weigh = (
  source: PlayableSource,
  {
    profile,
    requestedQuality = 'original',
    preferredAudioLanguage = null,
    chosenSubtitleStreamIndex = null,
  }: Omit<ChooseSourceOptions, 'sources' | 'pinnedSourceId' | 'neverSmaller'>,
): ChosenSource => {
  const qualityClamp = resolveQualityStep(source.item, requestedQuality);
  const plan = negotiatePlayback(
    source.item,
    profile,
    qualityClamp,
    preferredAudioLanguage,
    chosenSubtitleStreamIndex,
  );

  return { source, plan, qualityClamp, isDirectPlay: isDirectPlay(plan, source.item) };
};

/**
 * Orders two candidates that both avoid encoding, best first.
 *
 * The larger picture wins, because a rendition only exists to be played when it is the best thing
 * the device can take without work. Where two are the same size, the one that needs no session at
 * all beats the one that needs a copy, and a higher bitrate beats a lower one — both are the same
 * question asked with less to go on.
 *
 * @param left - One candidate.
 * @param right - The other.
 * @returns Which of them to prefer, as a comparator.
 */
const betterFirst = (left: ChosenSource, right: ChosenSource): number => {
  const area =
    right.source.item.width * right.source.item.height -
    left.source.item.width * left.source.item.height;

  if (area !== 0) {
    return area;
  }

  if (left.isDirectPlay !== right.isDirectPlay) {
    return left.isDirectPlay ? -1 : 1;
  }

  return right.source.item.bitrateKbps - left.source.item.bitrateKbps;
};

/**
 * The picture the request would have come back with had the original been the only file there is.
 *
 * @param weighed - Every candidate, already negotiated.
 * @returns The height asked for, or zero where there is nothing to ask about.
 */
const pictureAsked = (weighed: readonly ChosenSource[]): number => {
  const original = weighed.find((candidate) => candidate.source.isOriginal) ?? weighed[0];

  if (original === undefined) {
    return 0;
  }

  return original.qualityClamp === null
    ? original.source.item.height
    : Math.min(original.source.item.height, original.qualityClamp.maxHeight);
};

/**
 * Picks which of an item's files to play: the original, or one of the renditions somebody chose to
 * keep beside it.
 *
 * The whole point of keeping a rendition is that the box does not encode at seven o'clock on a
 * Sunday, so the rule follows from that and from nothing else: prefer the largest picture the
 * device can take **without the video being encoded**. A remux the television plays is better than
 * a 1080p copy of it; a 1080p copy the phone plays is better than encoding the remux for it.
 *
 * Video passthrough rather than direct play is the test, deliberately. Direct play additionally
 * means the bytes are handed over untouched, and an HEVC file that a session has to retag is not
 * handed over untouched. That session copies the picture rather than encoding it, so such a
 * rendition still buys exactly what it was made to buy, and judging it on direct play would refuse
 * it for a cost it does not carry.
 *
 * Where nothing avoids encoding, the original is what gets encoded. A rendition is already a
 * generation down, and encoding from it would stack one loss on another to save nothing.
 *
 * `neverSmaller` bars a rendition from standing in where it would shrink the picture the request
 * asked for. Streaming does not want that — a phone is better served a 1080p copy than a 4K encode,
 * and nobody is promised anything. A download is: somebody who chose the original and was quoted
 * its size should not quietly receive half the picture in a file they then carry around.
 *
 * @param options - The files available, the device asking, and anything it asked for by name.
 * @returns The file to play and what playing it involves, or nothing where there are no files.
 */
const chooseSource = ({
  sources,
  pinnedSourceId = null,
  neverSmaller = false,
  ...asked
}: ChooseSourceOptions): ChosenSource | null => {
  if (sources.length === 0) {
    return null;
  }

  const pinned = sources.find((source) => source.id === pinnedSourceId);

  if (pinned !== undefined) {
    return weigh(pinned, asked);
  }

  const weighed = sources.map((source) => weigh(source, asked));
  const floor = neverSmaller ? pictureAsked(weighed) : 0;
  const withoutEncoding = weighed.filter(
    (candidate) =>
      candidate.plan.video.kind === 'passthrough' && candidate.source.item.height >= floor,
  );
  const best = [...withoutEncoding].sort(betterFirst)[0];

  if (best !== undefined) {
    return best;
  }

  return weighed.find((candidate) => candidate.source.isOriginal) ?? weighed[0] ?? null;
};

export type { ChooseSourceOptions, ChosenSource, PlayableSource };

export { chooseSource };
