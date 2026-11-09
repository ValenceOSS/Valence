import { Badge } from '@ValenceUI/Badge';
import type { BadgeTone } from '@ValenceUI/Badge.types';
import type { PlanAxisProps } from './PlanAxis.types';
import { say } from '@ValenceI18n/say';

const TONES: Record<string, BadgeTone> = {
  passthrough: 'success',
  remux: 'accent',
  sidecar: 'accent',
  transcode: 'warning',
  burnIn: 'warning',
  none: 'outline',
};

const WORDS: Record<string, string> = {
  burnIn: say('screens.streamStats.planAxis.burnIn'),
};

/**
 * One axis of the playback plan: what was decided, as a short badge coloured by how much work it
 * costs, with the negotiator's reason underneath in quieter type and any ceiling being encoded to.
 *
 * @param name - Which axis, such as video.
 * @param kind - What was decided, or null while the plan is still being worked out.
 * @param reason - Why, in the negotiator's words.
 * @param ceiling - The size or bitrate being encoded to, where one applies.
 */
const PlanAxis = ({ name, kind, reason, ceiling = null }: PlanAxisProps) => (
  <>
    <dt className="text-[0.6875rem] leading-5 text-text-muted">{name}</dt>
    <dd className="flex min-w-0 items-center justify-end gap-1.5">
      {kind === null ? (
        <span className="text-[0.75rem] leading-5 text-text-muted">{say('common.deciding')}</span>
      ) : (
        <>
          {ceiling === null ? null : (
            <span className="text-[0.6875rem] tabular-nums text-text-muted">{ceiling}</span>
          )}
          <Badge tone={TONES[kind] ?? 'quiet'} size="sm">
            {WORDS[kind] ?? kind}
          </Badge>
        </>
      )}
    </dd>
    {reason === null ? null : (
      <dd className="col-span-2 -mt-1 mb-1 text-[0.6875rem] leading-4 text-text-muted">{reason}</dd>
    )}
  </>
);

PlanAxis.displayName = 'PlanAxis';

export { PlanAxis };
