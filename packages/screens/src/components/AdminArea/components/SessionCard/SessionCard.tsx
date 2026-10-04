import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Icon } from '@ValenceUI/Icon';
import {
  BookOpen as BookOpenIcon,
  Headphones as HeadphonesIcon,
  Info as InfoIcon,
  MessageSquare as MessageSquareIcon,
  MusicNote as MusicNoteIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
  Stop as StopIcon,
} from '@keyline-icons/react/fill';
import { useState } from 'react';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Card } from '@ValenceUI/Card';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { deviceIconFor } from './deviceIcon';
import { brandMarksOf } from './brandMarksOf';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { SessionStatsDialog } from '@ValenceScreens/components/AdminArea/components/SessionStatsDialog/SessionStatsDialog';
import type { SessionCardProps } from './SessionCard.types';
import { say } from '@ValenceI18n/say';

/**
 * One open session: who has it, on what device, what they are watching, hearing or reading, how far through they are, and
 * how the stream is faring. Carries the controls for intervening in it, and a way through to
 * everything the server knows about the stream for anybody asking why it is struggling.
 *
 * @param session - The session.
 * @param isBusy - Whether an instruction for it is in flight.
 * @param onStop - Called to stop it.
 * @param onPause - Called to pause it.
 * @param onResume - Called to let it carry on.
 * @param onMessage - Called to tell the viewer something, without touching their playback.
 */
const SessionCard = ({
  session,
  isBusy,
  onStop,
  onPause,
  onResume,
  onMessage,
}: SessionCardProps) => {
  const { playback, listening, bookListening, reading } = session;
  const book = bookListening ?? reading;
  const deviceGlyph = deviceIconFor(session.deviceLabel, session.clientKind);
  const marks = brandMarksOf(session.deviceLabel);
  const isBrowser = session.clientKind === 'browser';
  const [isShowingStats, setIsShowingStats] = useState(false);

  const heard = listening ?? bookListening;
  const health =
    playback?.health ??
    (heard === null
      ? null
      : {
          positionSeconds: heard.positionSeconds,
          durationSeconds: heard.durationSeconds,
          bufferedAheadSeconds: 0,
        });
  const hasProgress = health !== null && health.durationSeconds > 0;
  const isActive = playback !== null || heard !== null;
  const isPlaying = playback?.isPlaying ?? heard?.isPlaying ?? false;
  const fallbackGlyph =
    listening !== null
      ? MusicNoteIcon
      : bookListening !== null
        ? HeadphonesIcon
        : reading !== null
          ? BookOpenIcon
          : deviceGlyph;

  return (
    <Card as="article" padding="sm" radius="md" className="flex w-full min-w-0 items-center gap-3">
      <span className="relative flex aspect-video w-24 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[var(--surface-hover)]">
        {playback !== null && (playback.hasBackdrop || playback.hasPoster) ? (
          <img
            src={artworkUrl(playback.mediaId, playback.hasBackdrop ? 'backdrop' : 'poster')}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : listening !== null && listening.hasArtwork ? (
          <img
            src={albumArtworkUrl(listening.albumId)}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : book !== null && book.hasCover ? (
          <img src={bookCoverUrl(book.bookId)} alt="" className="h-full w-full object-cover" />
        ) : fallbackGlyph === deviceGlyph && marks.system !== null ? (
          <BrandGlyph of={marks.system} size={22} className="text-text-muted" />
        ) : (
          <Icon of={fallbackGlyph} size={20} tone="muted" />
        )}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-text">
            {playback?.mediaTitle ??
              (listening !== null
                ? `${listening.title} · ${listening.artists.join(', ')}`
                : book !== null
                  ? [book.title, ...book.authors].join(' · ')
                  : say('screens.adminArea.sessionCard.notWatchingAnything'))}
          </span>

          {listening === null || playback !== null ? null : (
            <Badge size="sm">
              {listening.delivery === 'encoded' ? say('common.encoding') : say('common.direct')}
            </Badge>
          )}

          {playback === null ? null : (
            <Badge size="sm">{describeSessionDelivery(playback).label}</Badge>
          )}

          {playback === null ||
          (playback.reuse !== 'whole' && playback.reuse !== 'shared') ? null : (
            <Badge size="sm">
              {playback.reuse === 'whole'
                ? say('screens.adminArea.sessionCard.cached')
                : say('screens.adminArea.sessionCard.shared')}
            </Badge>
          )}
        </span>

        <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-muted">
          {isBrowser && marks.browser !== null ? (
            <BrandGlyph of={marks.browser} size={13} />
          ) : (
            <Icon of={deviceGlyph} size={14} className="shrink-0" />
          )}
          <span className="truncate" title={session.deviceLabel}>
            {session.deviceLabel}
          </span>

          {!isActive ? null : (
            <span className="shrink-0">
              · {isPlaying ? say('common.playing') : say('common.paused')}
            </span>
          )}

          {reading === null || isActive ? null : (
            <span className="shrink-0">
              · {say('common.reading')}
              {reading.fraction !== null
                ? ` · ${say('common.percentRead', { percent: Math.round(reading.fraction * 100) })}`
                : reading.pageNumber !== null
                  ? ` · ${say('common.pageValue', { value: reading.pageNumber + 1 })}`
                  : null}
            </span>
          )}

          {listening === null || playback !== null ? null : (
            <span className="shrink-0 uppercase">
              ·{' '}
              {[
                listening.codec,
                listening.kbps === null ? null : `${listening.kbps.toString()} kbps`,
              ]
                .filter((part) => part !== null)
                .join(' ')}
            </span>
          )}
        </span>

        {!hasProgress ? null : (
          <span className="flex items-center gap-2">
            <span className="relative block h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--surface-hover)]">
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-text/25"
                style={{
                  width: `${(
                    Math.min(
                      (health.positionSeconds + health.bufferedAheadSeconds) /
                        health.durationSeconds,
                      1,
                    ) * 100
                  ).toString()}%`,
                }}
              />

              <span
                role="presentation"
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{
                  width: `${(
                    Math.min(health.positionSeconds / health.durationSeconds, 1) * 100
                  ).toString()}%`,
                }}
              />
            </span>

            <span className="shrink-0 text-xs tabular-nums text-text-muted">
              {formatDuration(health.positionSeconds)} / {formatDuration(health.durationSeconds)}
            </span>
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isActive ? null : (
          <>
            {isPlaying ? (
              <Button
                isIconOnly
                variant="ghost"
                label={say('common.pause')}
                size="sm"
                disabled={isBusy}
                onClick={onPause}
              >
                <Icon of={PauseFilledIcon} size={15} />
              </Button>
            ) : (
              <Button
                isIconOnly
                variant="ghost"
                label={say('common.play')}
                size="sm"
                disabled={isBusy}
                onClick={onResume}
              >
                <Icon of={PlayFilledIcon} size={15} />
              </Button>
            )}

            <Button
              isIconOnly
              variant="ghost"
              label={say('common.stop')}
              size="sm"
              disabled={isBusy}
              onClick={onStop}
            >
              <Icon of={StopIcon} size={15} />
            </Button>

            <Button
              isIconOnly
              variant="ghost"
              label={say('screens.adminArea.sessionCard.message')}
              size="sm"
              disabled={isBusy}
              onClick={onMessage}
            >
              <Icon of={MessageSquareIcon} size={15} />
            </Button>
          </>
        )}

        {playback === null ? null : (
          <Button
            isIconOnly
            variant="ghost"
            label={say('common.streamStats')}
            size="sm"
            onClick={() => {
              setIsShowingStats(true);
            }}
          >
            <Icon of={InfoIcon} size={15} />
          </Button>
        )}
      </div>

      <SessionStatsDialog
        session={session}
        isOpen={isShowingStats}
        onClose={() => {
          setIsShowingStats(false);
        }}
      />
    </Card>
  );
};

SessionCard.displayName = 'SessionCard';

export { SessionCard };
