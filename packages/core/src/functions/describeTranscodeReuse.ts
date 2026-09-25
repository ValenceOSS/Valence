import type { TranscodeReuse } from '@ValenceContracts/schemas/TranscodeReuse';
import { say } from '@ValenceI18n/say';

/**
 * Writes what a session found already made when it started, for a viewer's statistics panel and an
 * operator's session list alike — both are asking the same question, which is whether the server is
 * working for this stream or handing back something it had already done.
 *
 * `partial` is a resumed session rather than a finished one: the run starts where the segments on
 * disk stop being trustworthy, so the work behind them is not done twice, but an encoder is still
 * busy on the rest. An operator reading it should expect load, which is why it does not read as a
 * transcode that costs nothing.
 *
 * `shared` counts only devices still holding the session, so a viewer who has closed their tab is
 * not somebody the next arrival is told they are sharing with.
 *
 * @param reuse - What the media service reported, or null where it was never asked — direct play,
 *   the one mode with no transcode to reuse.
 * @returns The sentence to show.
 */
const describeTranscodeReuse = (reuse: TranscodeReuse | null): string => {
  if (reuse === null) {
    return say('core.describeTranscodeReuse.none');
  }

  switch (reuse) {
    case 'whole':
      return say('core.describeTranscodeReuse.whole');
    case 'shared':
      return say('core.describeTranscodeReuse.shared');
    case 'partial':
      return say('core.describeTranscodeReuse.partial');
    case 'none':
      return say('core.describeTranscodeReuse.fresh');
  }
};

export { describeTranscodeReuse };
