import { sayAgain } from '@ValenceI18n/sayAgain';
import { FormattedNumber } from '@ValenceUI/FormattedNumber';
import { Icon } from '@ValenceUI/Icon';
import { GripVertical as GripIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { cn } from '@ValenceUI/cn';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { describeTranscodeReuse } from '@ValenceCore/functions/describeTranscodeReuse';
import { StatsCard } from './components/StatsCard/StatsCard';
import { StatsFact } from './components/StatsFact/StatsFact';
import { StatsSummary } from './components/StatsSummary/StatsSummary';
import { StatsSeconds } from './components/StatsSeconds/StatsSeconds';
import { PlanAxis } from './components/PlanAxis/PlanAxis';
import { describeSize } from './describeSize';
import type { StreamStatsProps } from './StreamStats.types';
import { say } from '@ValenceI18n/say';

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
 * @param engine - How the browser's own player is keeping up — the GPU drawing, the decoder, how
 *   the sound reaches the element, and the frames decoded, drawn and skipped — where it is the one
 *   playing. It plays the file itself, so the file's own bitrate is what it is being sent.
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
  engine = null,
  sessionStartSeconds,
  party,
  onClose,
  onGrab,
}: StreamStatsProps) => {
  const audio = detail?.audioStreams[0] ?? null;
  const plan = session?.plan ?? null;
  const address =
    session === null
      ? null
      : session.delivery.kind === 'hls'
        ? session.delivery.manifestUrl
        : session.delivery.url;
  const picture =
    describeSize(delivered?.width ?? null, delivered?.height ?? null) ??
    describeSize(health.presentedWidth, health.presentedHeight);
  const videoCodec = delivered?.videoCodec ?? detail?.videoCodec ?? null;
  const audioCodec = delivered?.audioCodec ?? audio?.codec ?? null;
  const channels = delivered?.audioChannels ?? audio?.channels ?? null;
  const bitrateKbps =
    delivered?.bitrateKbps ?? (engine === null ? null : (detail?.bitrateKbps ?? null));
  const isHdrScreen =
    typeof window !== 'undefined' && window.matchMedia('(dynamic-range: high)').matches === true;

  return (
    <section
      aria-label={say('common.statsForNerds')}
      className="valence-rail valence-solid pointer-events-auto max-h-[calc(100svh-11rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-lg p-3 text-xs text-text"
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
          'mb-2.5 flex items-center justify-between gap-4 pl-1',
          onGrab === undefined ? '' : 'cursor-grab touch-none select-none active:cursor-grabbing',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {onGrab === undefined ? null : (
            <span className="shrink-0 text-text-muted">
              <Icon of={GripIcon} size={16} />
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <h3 className="text-sm font-medium tracking-tight">{say('common.statsForNerds')}</h3>
            <span className="truncate text-[0.6875rem] text-text-muted">{media.title}</span>
          </span>
        </span>

        <Button
          isIconOnly
          variant="ghost"
          label={say('screens.videoPlayer.streamStats.closeStats')}
          size="sm"
          onClick={onClose}
        >
          <Icon of={XIcon} size={16} />
        </Button>
      </header>

      <div className="flex flex-col gap-2">
        <StatsSummary
          items={[
            { label: say('common.mode'), value: session?.mode ?? null },
            { label: say('common.picture'), value: picture },
            { label: say('common.video'), value: videoCodec },
            {
              label: say('common.audio'),
              value:
                audioCodec === null
                  ? null
                  : `${audioCodec}${channels === null ? '' : ` ${channels.toString()}ch`}`,
            },
            {
              label: say('common.bitrate'),
              value:
                bitrateKbps === null ? null : (
                  <FormattedNumber value={bitrateKbps} suffix=" kbps" />
                ),
            },
            { label: say('common.position'), value: formatDuration(health.positionSeconds) },
          ]}
        />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatsCard name="Source">
            <StatsFact
              name="Video"
              value={
                detail === null
                  ? null
                  : `${detail.videoCodec} ${detail.width.toString()}×${detail.height.toString()}`.trim()
              }
            />
            <StatsFact name="Range" value={detail?.videoRange ?? null} />
            <StatsFact
              name="Audio"
              value={
                audio === null
                  ? null
                  : `${audio.codec} ${audio.channels.toString()}ch ${audio.language ?? ''}`.trim()
              }
            />
            <StatsFact
              name="Subtitles"
              value={
                detail === null || detail.subtitleStreams.length === 0
                  ? null
                  : `${detail.subtitleStreams.length.toString()} · ${detail.subtitleStreams[0]?.format ?? ''}`
              }
            />
          </StatsCard>

          <StatsCard name="Output">
            <StatsFact
              name="Video"
              value={
                delivered === null
                  ? null
                  : `${delivered.videoCodec ?? '?'} ${describeSize(delivered.width, delivered.height) ?? ''}`.trim()
              }
            />
            <StatsFact
              name="Frame rate"
              value={
                delivered?.frameRate === null || delivered === null
                  ? null
                  : `${delivered.frameRate.toFixed(3)} fps`
              }
            />
            <StatsFact
              name="Audio"
              value={
                delivered === null
                  ? null
                  : `${delivered.audioCodec ?? '?'}${
                      delivered.audioChannels === null
                        ? ''
                        : ` ${delivered.audioChannels.toString()}ch`
                    }${
                      delivered.audioSampleRate === null
                        ? ''
                        : ` ${(delivered.audioSampleRate / 1000).toString()}kHz`
                    }`
              }
            />
            <StatsFact name="Container" value={delivered?.mimeType ?? null} />
            <StatsFact
              name="Drawn at"
              value={describeSize(health.presentedWidth, health.presentedHeight)}
            />
          </StatsCard>
        </div>

        {engine === null ? null : (
          <StatsCard name="Browser player">
            {engine.route === 'webgpu' ? (
              <>
                <StatsFact name="Renderer" value="WebGPU" />
                <StatsFact name="GPU" value={engine.gpu} />
                <StatsFact name="Decoder" value="WebCodecs" />
              </>
            ) : (
              <>
                <StatsFact name="Renderer" value="HTMLVideoElement" />
                <StatsFact
                  name="Repackaged by"
                  value={say('screens.videoPlayer.streamStats.mediabunny')}
                />
                <StatsFact
                  name="Container"
                  value={
                    engine.container === null
                      ? null
                      : `${engine.container.split(';')[0] ?? engine.container} → video/mp4`
                  }
                />
              </>
            )}
            {engine.isHdrFilm ? (
              <StatsFact
                name="Tone mapping"
                value={
                  engine.hdrSignal !== null
                    ? say('screens.videoPlayer.streamStats.signalToSdr', {
                        signal: engine.hdrSignal.toUpperCase(),
                      })
                    : isHdrScreen
                      ? say('screens.videoPlayer.streamStats.noneShownAsHdr')
                      : say('screens.videoPlayer.streamStats.byTheBrowser')
                }
              />
            ) : null}
            <StatsFact
              name="Sound"
              value={
                engine.sound === 'carried'
                  ? say('screens.videoPlayer.streamStats.carriedAsItIs')
                  : say('screens.videoPlayer.streamStats.encodedAgainAsCodec', {
                      codec: engine.sound,
                      channels: (engine.soundChannels ?? 2).toString(),
                    })
              }
            />
            {engine.route === 'webgpu' ? (
              <>
                <StatsFact
                  name="Frames drawn"
                  value={<FormattedNumber value={engine.drawnFrames} />}
                />
                <StatsFact
                  name="Decoded ahead"
                  value={
                    engine.decodedAheadSeconds === null ? null : (
                      <StatsSeconds value={engine.decodedAheadSeconds} />
                    )
                  }
                />
              </>
            ) : null}
          </StatsCard>
        )}

        <StatsCard name="Plan">
          <PlanAxis
            name="Container"
            kind={plan?.container.kind ?? null}
            reason={plan === null ? null : sayAgain(plan.container.reason.detail)}
          />
          <PlanAxis
            name="Video"
            kind={plan?.video.kind ?? null}
            reason={plan === null ? null : sayAgain(plan.video.reason.detail)}
            ceiling={
              plan === null || plan.video.kind === 'passthrough'
                ? null
                : say('screens.videoPlayer.streamStats.widthByHeightAtKbps', {
                    width: plan.video.maxWidth.toString(),
                    height: plan.video.maxHeight.toString(),
                    kbps: plan.video.maxBitrateKbps.toString(),
                  })
            }
          />
          <PlanAxis
            name="Audio"
            kind={plan?.audio.kind ?? null}
            reason={plan === null ? null : sayAgain(plan.audio.reason.detail)}
            ceiling={
              plan === null || plan.audio.kind === 'passthrough'
                ? null
                : say('common.valueKbps', {
                    value: plan.audio.maxBitrateKbps.toString(),
                  })
            }
          />
          <PlanAxis
            name="Subtitles"
            kind={plan?.subtitles.kind ?? null}
            reason={plan === null ? null : sayAgain(plan.subtitles.reason.detail)}
          />
        </StatsCard>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <StatsCard name="Playback">
            <StatsFact name="Frame on screen" value={formatDuration(health.frameSeconds)} />
            <StatsFact name="Stream starts" value={formatDuration(health.streamFromSeconds)} />
            <StatsFact
              name="Buffered ahead"
              value={<StatsSeconds value={health.bufferedAheadSeconds} />}
            />
            <StatsFact name="Encoded" value={<StatsSeconds value={health.encodedSeconds} />} />
            <StatsFact
              name="Dropped"
              value={
                engine !== null && engine.route === 'webgpu' ? (
                  <>
                    <FormattedNumber value={engine.skippedFrames} /> /{' '}
                    <FormattedNumber value={engine.decodedFrames} />
                  </>
                ) : health.droppedFrames === null || health.decodedFrames === null ? null : (
                  <>
                    <FormattedNumber value={health.droppedFrames} /> /{' '}
                    <FormattedNumber value={health.decodedFrames} />
                  </>
                )
              }
            />
          </StatsCard>

          <StatsCard name="Session">
            <StatsFact
              name="Reused"
              value={
                session === null || session.reuse === null
                  ? null
                  : describeTranscodeReuse(session.reuse)
              }
            />
            <StatsFact
              name="Player"
              value={
                engine?.route === 'webgpu'
                  ? say('screens.videoPlayer.streamStats.valencesWebGpuPlayer')
                  : engine?.route === 'remux'
                    ? say('screens.videoPlayer.streamStats.repackagedInTheBrowser')
                    : session === null
                      ? null
                      : session.delivery.kind === 'hls'
                        ? say('screens.videoPlayer.streamStats.shakaPlayingHls')
                        : say('screens.videoPlayer.streamStats.theBrowsersMediaElement')
              }
            />
            <StatsFact name="Starts at" value={formatDuration(sessionStartSeconds)} />
            <StatsFact
              name="Delivery"
              value={
                session === null
                  ? null
                  : session.delivery.kind === 'hls'
                    ? 'HLS'
                    : say('common.direct')
              }
            />
            <StatsFact name="Address" value={address} isCode />
            <StatsFact name="Session" value={session?.sessionId ?? null} isCode />
            <StatsFact name="Media" value={media.id} isCode />
          </StatsCard>
        </div>

        {party === undefined ? null : (
          <StatsCard name="Watch party">
            <StatsFact name="Watching" value={<FormattedNumber value={party.members} />} />
            <StatsFact
              name="Room"
              value={party.isHeld ? 'held' : party.isPlaying ? 'playing' : 'paused'}
            />
            <StatsFact
              name="Waiting for"
              value={party.waitingFor.length === 0 ? null : party.waitingFor.join(', ')}
            />
            <StatsFact
              name="Room position"
              value={
                party.referenceSeconds === null
                  ? say('screens.videoPlayer.streamStats.thisTabKeepsTime')
                  : formatDuration(party.referenceSeconds)
              }
            />
            <StatsFact
              name="Out by"
              value={
                party.referenceSeconds === null ? null : (
                  <StatsSeconds value={party.referenceSeconds - health.positionSeconds} />
                )
              }
            />
            <StatsFact
              name="Clock jitter"
              value={<FormattedNumber value={Math.round(party.jitterMs)} suffix="ms" />}
            />
          </StatsCard>
        )}

        {session === null || session.warnings.length === 0 ? null : (
          <StatsCard name="Warnings">
            {session.warnings.map((warning) => (
              <StatsFact key={warning.message} name="Server" value={sayAgain(warning)} />
            ))}
          </StatsCard>
        )}
      </div>
    </section>
  );
};

StreamStats.displayName = 'StreamStats';

export { StreamStats };
