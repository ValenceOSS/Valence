import { say } from '@ValenceI18n/say';
import type { SegmentKind } from '@ValenceContracts/schemas/MediaSegment';

/**
 * Names a kind of marked stretch the way a viewer would, for labelling it on the timeline.
 *
 * @param kind - Which kind of stretch.
 * @returns What to call it.
 */
const nameOfSegment = (kind: SegmentKind): string => {
  if (kind === 'intro') {
    return say('client.playback.nameOfSegment.intro');
  }

  if (kind === 'recap') {
    return say('client.playback.nameOfSegment.recap');
  }

  if (kind === 'credits') {
    return say('client.playback.nameOfSegment.credits');
  }

  return say('client.playback.nameOfSegment.preview');
};

export { nameOfSegment };
