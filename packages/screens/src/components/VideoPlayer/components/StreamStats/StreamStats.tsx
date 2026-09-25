import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { AnimatedNumber } from '@ValenceUI/AnimatedNumber';
import { Icon } from '@ValenceUI/Icon';
import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import {
  describeAxis as axis,
  describeVideoAxis as videoAxis,
  describeAudioAxis as audioAxis,
} from '@ValenceCore/functions/describePlaybackAxis';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import type { StreamStatsProps } from './StreamStats.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

/**
 * Rounds a number of seconds for the statistics panel, to one decimal place — buffer and encode
 * figures move constantly, and more digits than that read as noise rather than as detail.
 *
 * @param value - The number of seconds.
 * @returns It, rounded, with its unit.
 */
const seconds = (value: number): ReactNode => (
  <AnimatedNumber
    value={value}
    format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
    suffix="s"
  />
);

type RowProps = {
  name: string;
  children: ReactNode;
};

/**
 * One labelled fact in the statistics panel, with figures set in tabular numerals so they do not
 * shift about as they change.
 *
 * @param name - What the fact is.
 * @param children - The fact itself.
 */
const Row = ({ name, children }: RowProps) => (
  <div className="flex gap-3 rounded-md px-1 py-1 transition-colors hover:bg-[var(--surface-hover)]">
    <dt className="w-40 shrink-0 text-text-muted">{name}</dt>
    <dd className="min-w-0 break-words font-medium tabular-nums text-text">{children}</dd>
  </div>
);

Row.displayName = 'Row';

type GroupProps = {
  name: string;
  children: React.ReactNode;
};

/**
 * A titled run of related facts.
 *
 * The panel reads top to bottom as the stream's own journey — what it is, what arrived, what was
 * decided, what came out, how it is faring — and the headings are what make that order legible
 * rather than a list of everything Valence happens to know.
 *
 * @param name - What this group of facts is about.
 * @param children - The facts.
 */
const Group = ({ name, children }: GroupProps) => (
  <div className="mb-3 last:mb-0">
    <h4 className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-text/35">
      {name}
    </h4>
    <dl className="flex flex-col">{children}</dl>
  </div>
);

Group.displayName = 'Group';

/**
 * Describes a picture's size, or says nothing is known yet.
 *
 * @param width - How wide.
 * @param height - How tall.
 * @returns The size, or a note that there is not one to report.
 */
const size = (width: number | null, height: number | null): string =>
  width === null || height === null || width === 0
    ? say('screens.streamStats.notReported')
    : `${width.toString()}x${height.toString()}`;

/**
 * Everything Valence knows about what is on screen and how it got there: what the file is, what the
 * session did to it, how the machine is coping, and how far ahead the buffer runs. For anybody
 * working out why a stream looks or behaves as it does, which is a different question from anything
 * the ordinary controls answer.
 *
 * @param positionSeconds - Where the viewer is.
 * @param bufferedAheadSeconds - How much is ready beyond that.
 * @param encodedSeconds - How far the transcoder has got, where one is running.
 * @param droppedFrames - Frames the browser gave up on, where it reports them.
 * @param decodedFrames - Frames it decoded, where it reports them.
 * @param presentedWidth - How wide the picture is being drawn.
 * @param presentedHeight - How tall it is being drawn.
 * @param media - What is playing.
 * @param session - The session serving it, where one was started.
 * @param detail - What the catalogue holds about the item.
 * @param health - How the stream is faring.
 * @param delivered - What the engine is actually being sent, where it has chosen a variant.
 * @param sessionStartSeconds - Where the session itself began, which is not always where the viewer
 *   is now.
 * @param party - How the watch party is faring, where this viewing is part of one.
 * @param onClose - Called to close the panel.
 * @param onGrab - Told when somebody takes hold of the panel's head, so whatever holds the panel can
 *   let it be dragged. The close button is not a handle.
 */
const StreamStats = ({
  media,
  session,
  detail,
  health,
  delivered,
  sessionStartSeconds,
  party,
  onClose,
  onGrab,
}: StreamStatsProps) => {
  const video = detail?.videoCodec ?? media.id;
  const audio = detail?.audioStreams[0] ?? null;
  const plan = session?.plan ?? null;

  return (
    <section
      aria-label={say('screens.streamStats.heading')}
      className="valence-rail valence-solid pointer-events-auto max-h-[calc(100svh-11rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-lg p-4 text-xs text-text"
    >
      <header
        onPointerDown={(event) => {
          if (
            onGrab !== undefined &&
            !(event.target instanceof Element && event.target.closest('button') !== null)
          ) {
            onGrab(event);
          }
        }}
        className={cn(
          'mb-3 flex items-center justify-between gap-4 border-b border-[var(--surface-line)] pb-2',
          onGrab === undefined ? '' : 'cursor-grab touch-none select-none active:cursor-grabbing',
        )}
      >
        <h3 className="text-sm font-medium tracking-tight">{say('screens.streamStats.heading')}</h3>

        <Button
          isIconOnly
          variant="ghost"
          label={say('screens.streamStats.close')}
          size="sm"
          onClick={onClose}
        >
          <Icon of={XIcon} size={16} />
        </Button>
      </header>

      <div className="flex flex-col">
        <Group name={say('screens.streamStats.groupSession')}>
          <Row name={say('screens.streamStats.title')}>{media.title}</Row>
          <Row name={say('screens.streamStats.mediaId')}>{media.id}</Row>
          <Row name={say('screens.streamStats.session')}>
            {session?.sessionId ?? say('screens.streamStats.notStarted')}
          </Row>
          <Row name={say('screens.streamStats.mode')}>
            {session?.mode ?? say('screens.streamStats.deciding')}
          </Row>
          <Row name={say('screens.streamStats.reused')}>
            {session === null
              ? say('screens.streamStats.deciding')
              : describeTranscodeReuse(session.reuse)}
          </Row>
          <Row name={say('screens.streamStats.startsAt')}>
            {formatDuration(sessionStartSeconds)}
          </Row>
          <Row name={say('screens.streamStats.delivery')}>
            {session === null
              ? say('screens.streamStats.none')
              : session.delivery.kind === 'hls'
                ? say('screens.streamStats.hlsDelivery', { url: session.delivery.manifestUrl })
                : say('screens.streamStats.directDelivery', { url: session.delivery.url })}
          </Row>
        </Group>

        <Group name={say('screens.streamStats.groupSource')}>
          <Row name={say('screens.streamStats.video')}>
            {detail === null
              ? say('screens.streamStats.unknown')
              : `${video} ${detail.width}x${detail.height} ${detail.videoRange}`}
          </Row>
          <Row name={say('screens.streamStats.audio')}>
            {audio === null
              ? say('screens.streamStats.none')
              : `${audio.codec} ${audio.channels}ch ${audio.language ?? ''}`}
          </Row>
          <Row name={say('screens.streamStats.subtitles')}>
            {detail === null || detail.subtitleStreams.length === 0
              ? say('screens.streamStats.none')
              : sayCount('screens.streamStats.subtitleTracks', detail.subtitleStreams.length, {
                  format: detail.subtitleStreams[0]?.format ?? '',
                })}
          </Row>
        </Group>

        <Group name={say('screens.streamStats.groupOutput')}>
          <Row name={say('screens.streamStats.video')}>
            {delivered === null
              ? say('screens.streamStats.nothingSelected')
              : `${delivered.videoCodec ?? say('screens.streamStats.unknown')} ${size(delivered.width, delivered.height)}${
                  delivered.frameRate === null ? '' : ` @ ${delivered.frameRate.toFixed(3)}fps`
                }`}
          </Row>
          <Row name={say('screens.streamStats.audio')}>
            {delivered === null
              ? say('screens.streamStats.nothingSelected')
              : `${delivered.audioCodec ?? say('screens.streamStats.unknown')}${
                  delivered.audioChannels === null ? '' : ` ${delivered.audioChannels.toString()}ch`
                }${
                  delivered.audioSampleRate === null
                    ? ''
                    : ` ${say('screens.streamStats.hertz', { rate: delivered.audioSampleRate })}`
                }`}
          </Row>
          <Row name={say('screens.streamStats.container')}>
            {delivered?.mimeType ?? say('screens.streamStats.nothingSelected')}
          </Row>
          <Row name={say('screens.streamStats.bitrate')}>
            {delivered?.bitrateKbps === null || delivered === null ? (
              say('screens.streamStats.notReported')
            ) : (
              <AnimatedNumber value={delivered.bitrateKbps} suffix="kbps" />
            )}
          </Row>
          <Row name={say('screens.streamStats.presentedSize')}>
            {size(health.presentedWidth, health.presentedHeight)}
          </Row>
        </Group>

        <Group name={say('screens.streamStats.groupPlan')}>
          <Row name={say('screens.streamStats.container')}>
            {plan === null
              ? say('screens.streamStats.deciding')
              : axis(plan.container.kind, plan.container.reason.detail)}
          </Row>
          <Row name={say('screens.streamStats.video')}>
            {plan === null ? say('screens.streamStats.deciding') : videoAxis(plan.video)}
          </Row>
          <Row name={say('screens.streamStats.audio')}>
            {plan === null ? say('screens.streamStats.deciding') : audioAxis(plan.audio)}
          </Row>
          <Row name={say('screens.streamStats.subtitles')}>
            {plan === null
              ? say('screens.streamStats.deciding')
              : axis(plan.subtitles.kind, plan.subtitles.reason.detail)}
          </Row>
        </Group>

        <Group name={say('screens.streamStats.groupPlayback')}>
          <Row name={say('screens.streamStats.position')}>
            {formatDuration(health.positionSeconds)}
          </Row>
          <Row name={say('screens.streamStats.frameOnScreen')}>
            {formatDuration(health.frameSeconds)}
          </Row>
          <Row name={say('screens.streamStats.streamStartsAt')}>
            {formatDuration(health.streamFromSeconds)}
          </Row>
          <Row name={say('screens.streamStats.bufferedAhead')}>
            {seconds(health.bufferedAheadSeconds)}
          </Row>
          <Row name={say('screens.streamStats.encodedSoFar')}>{seconds(health.encodedSeconds)}</Row>
          <Row name={say('screens.streamStats.framesDropped')}>
            {health.droppedFrames === null || health.decodedFrames === null
              ? say('screens.streamStats.notReported')
              : say('screens.streamStats.framesOf')
                  .split(/(\{dropped\}|\{decoded\})/u)
                  .map((part, at) =>
                    part === '{dropped}' ? (
                      <AnimatedNumber key={part} value={health.droppedFrames ?? 0} />
                    ) : part === '{decoded}' ? (
                      <AnimatedNumber key={part} value={health.decodedFrames ?? 0} />
                    ) : (
                      <Fragment key={`words-${at.toString()}`}>{part}</Fragment>
                    ),
                  )}
          </Row>
        </Group>

        {party === undefined ? null : (
          <Group name={say('screens.streamStats.groupWatchParty')}>
            <Row name={say('screens.streamStats.watchingTogether')}>
              <AnimatedNumber value={party.members} />
            </Row>
            <Row name={say('screens.streamStats.roomState')}>
              {party.isHeld
                ? say('screens.streamStats.held')
                : party.isPlaying
                  ? say('screens.streamStats.playing')
                  : say('screens.streamStats.paused')}
            </Row>
            <Row name={say('screens.streamStats.waitingFor')}>
              {party.waitingFor.length === 0
                ? say('screens.streamStats.nobody')
                : party.waitingFor.join(', ')}
            </Row>
            <Row name={say('screens.streamStats.roomPosition')}>
              {party.referenceSeconds === null
                ? say('screens.streamStats.tabKeepsTime')
                : formatDuration(party.referenceSeconds)}
            </Row>
            <Row name={say('screens.streamStats.outBy')}>
              {party.referenceSeconds === null
                ? say('screens.streamStats.notApplicable')
                : seconds(party.referenceSeconds - health.positionSeconds)}
            </Row>
            <Row name={say('screens.streamStats.clockJitter')}>
              <AnimatedNumber value={Math.round(party.jitterMs)} suffix="ms" />
            </Row>
          </Group>
        )}

        {session === null || session.warnings.length === 0 ? null : (
          <Group name={say('screens.streamStats.groupWarnings')}>
            <Row name={say('screens.streamStats.fromTheServer')}>
              {session.warnings.join(' · ')}
            </Row>
          </Group>
        )}
      </div>
    </section>
  );
};

StreamStats.displayName = 'StreamStats';

export { StreamStats };
