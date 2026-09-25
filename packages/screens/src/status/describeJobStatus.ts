import { say } from '@ValenceI18n/say';
import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import type { BadgeTone } from '@ValenceUI/Badge.types';

/**
 * Says how a piece of background work stands, in the words and colour every other status uses. The
 * queue and the run history name finishing differently, so both spellings are accepted rather than
 * one place saying finished and the other completed to somebody reading either.
 *
 * @param status - Where the work is.
 * @returns The words and the tone to paint them in.
 */
const describeJobStatus = (
  status: 'queued' | 'running' | 'stopping' | 'finished' | 'completed' | 'failed',
): { label: string; tone: BadgeTone } => {
  switch (status) {
    case 'queued':
      return STATUS_LOOK.queued;
    case 'running':
      return { ...STATUS_LOOK.working, label: say('screens.describeJobStatus.running') };
    case 'stopping':
      return { ...STATUS_LOOK.attention, label: say('screens.describeJobStatus.stopping') };
    case 'finished':
    case 'completed':
      return STATUS_LOOK.done;
    case 'failed':
      return STATUS_LOOK.failed;
  }
};

export { describeJobStatus };
