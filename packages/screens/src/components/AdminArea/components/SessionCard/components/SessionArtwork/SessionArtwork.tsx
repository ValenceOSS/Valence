import { useState } from 'react';
import { TruncatedText } from '@ValenceUI/TruncatedText';
import {
  BookOpen as BookOpenIcon,
  Moon as MoonIcon,
  Pause as PauseFilledIcon,
  Play as PlayFilledIcon,
} from '@keyline-icons/react/fill';
import { Cast as CastIcon } from '@keyline-icons/react';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { albumArtworkUrl } from '@ValenceClient/music/fetchMusic';
import { bookCoverUrl } from '@ValenceClient/books/fetchBooks';
import { BrandGlyph } from '@ValenceUI/BrandGlyph';
import { BRAND_OPTICS } from '@ValenceUI/tokens/BRAND_OPTICS';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { describeSessionDelivery } from '@ValenceScreens/admin/describeSessionDelivery';
import { PLAYBACK_DELIVERIES } from '@ValenceScreens/admin/PLAYBACK_DELIVERIES';
import { marksOfDevice } from '@ValenceScreens/devices/marksOfDevice';
import { episodeOfSession } from '@ValenceScreens/admin/episodeOfSession';
import { artworkColourOf } from '@ValenceScreens/library/artworkColourOf';
import { SessionPill } from '@ValenceScreens/components/AdminArea/components/SessionCard/components/SessionPill/SessionPill';
import type { SessionArtworkProps } from './SessionArtwork.types';
import { say } from '@ValenceI18n/say';

/**
 * The top of a session card: what is playing, drawn from its own artwork — a film's backdrop and
 * title logo, an album's cover, a book's — with whether it is playing and how it is delivered set
 * on it, and how far through it is along its foot. A tab with nothing playing shows the system it
 * runs on. Everything on it is sized from the card, so a logo is never larger than a small card.
 *
 * @param session - The session.
 */
const SessionArtwork = ({ session }: SessionArtworkProps) => {
  const { playback, listening, bookListening, reading } = session;
  const book = bookListening ?? reading;
  const heard = listening ?? bookListening;
  const [logoMissingFor, setLogoMissingFor] = useState<string | null>(null);
  const at = playback?.health ?? heard;
  const through =
    at !== null && at.durationSeconds > 0
      ? Math.min(at.positionSeconds / at.durationSeconds, 1)
      : (reading?.fraction ?? null);
  const buffered =
    playback?.health === null || playback?.health === undefined || through === null
      ? null
      : Math.min(
          (playback.health.positionSeconds + playback.health.bufferedAheadSeconds) /
            playback.health.durationSeconds,
          1,
        );
  const isPlaying = playback?.isPlaying ?? heard?.isPlaying ?? false;
  const state =
    playback !== null || heard !== null
      ? {
          word: isPlaying ? say('common.playing') : say('common.paused'),
          glyph: isPlaying ? PlayFilledIcon : PauseFilledIcon,
        }
      : reading !== null
        ? { word: say('common.reading'), glyph: BookOpenIcon }
        : { word: say('screens.adminArea.sessionCard.nothingPlaying'), glyph: MoonIcon };
  const delivery =
    playback !== null
      ? describeSessionDelivery(playback).label
      : listening === null
        ? null
        : listening.delivery === 'encoded'
          ? PLAYBACK_DELIVERIES.Transcode.label
          : PLAYBACK_DELIVERIES.DirectPlay.label;
  const { deviceGlyph, systemMark, clientGlyph, clientMark } = marksOfDevice(
    session.identity,
    session.clientKind,
  );
  const deviceOptics = systemMark === null ? undefined : BRAND_OPTICS[systemMark];
  const clientOptics = clientMark === null ? undefined : BRAND_OPTICS[clientMark];
  const cover =
    listening !== null && listening.hasArtwork
      ? albumArtworkUrl(listening.albumId)
      : book !== null && book.hasCover
        ? bookCoverUrl(book.bookId)
        : null;
  const episode = episodeOfSession(session);
  const shown =
    playback !== null
      ? (playback.seriesTitle ?? playback.mediaTitle)
      : listening !== null
        ? listening.title
        : (book?.title ?? null);
  const by =
    listening !== null
      ? listening.artists.join(', ')
      : book === null
        ? null
        : book.authors.join(', ');

  const hasPicture = playback !== null && (playback.hasBackdrop || playback.hasPoster);
  const isOnArt = playback !== null || cover !== null;
  const tint = artworkColourOf(shown ?? playback?.mediaId ?? '');

  return (
    <div
      className={cn(
        'relative isolate aspect-[2/1] overflow-hidden',
        playback !== null ? 'bg-shade' : 'bg-[var(--surface-hover)]',
      )}
    >
      {playback !== null ? (
        <>
          {hasPicture ? (
            <img
              src={artworkUrl(playback.mediaId, playback.hasBackdrop ? 'backdrop' : 'poster', {
                isOfTitle: true,
                size: 'medium',
              })}
              alt=""
              className="absolute inset-0 -z-10 size-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="absolute inset-0 -z-10"
              style={{
                backgroundImage: [
                  `radial-gradient(circle at 85% 10%, color-mix(in oklab, ${tint} 55%, transparent), transparent 60%)`,
                  `linear-gradient(135deg, color-mix(in oklab, ${tint} 48%, var(--color-shade)), color-mix(in oklab, ${tint} 14%, var(--color-shade)))`,
                ].join(', '),
              }}
            />
          )}
          <span
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-b from-transparent from-45% to-shade/80"
          />
          <span className="absolute bottom-[6cqw] left-[4.5cqw] flex max-w-[60%] flex-col items-start text-on-scrim">
            {logoMissingFor === playback.mediaId || !hasPicture ? (
              <span className="text-[clamp(14px,5.6cqw,26px)] font-semibold leading-tight drop-shadow-[0_2px_10px_var(--color-scrim)]">
                {shown}
              </span>
            ) : (
              <img
                src={artworkUrl(playback.mediaId, 'logo', { isOfTitle: true, size: 'small' })}
                alt={shown ?? ''}
                onError={() => {
                  setLogoMissingFor(playback.mediaId);
                }}
                className={cn(
                  'w-auto max-w-full object-contain object-left drop-shadow-[0_2px_10px_var(--color-scrim)]',
                  episode === null ? 'max-h-[17cqw]' : 'mb-[1.6cqw] max-h-[11cqw]',
                )}
              />
            )}
            {episode === null ? null : (
              <span className="text-[clamp(10.5px,3.6cqw,15px)] font-semibold opacity-90">
                {episode}
              </span>
            )}
          </span>
        </>
      ) : book !== null || listening !== null ? (
        <>
          {cover === null ? null : (
            <span
              aria-hidden
              className="absolute -inset-5 -z-10 bg-cover bg-center blur-[28px] brightness-[0.7] saturate-[1.3]"
              style={{ backgroundImage: `url("${cover}")` }}
            />
          )}
          <span className="flex h-full items-center gap-[4cqw] px-[4.5cqw] pb-[5cqw] pt-[11cqw]">
            <span
              className={cn(
                'h-full shrink-0 bg-[var(--surface-hover)] bg-cover bg-center shadow-[0_8px_24px_var(--color-scrim)]',
                listening !== null ? 'aspect-square rounded-lg' : 'aspect-[2/3] rounded-sm',
              )}
              style={cover === null ? undefined : { backgroundImage: `url("${cover}")` }}
            />
            <span
              className={cn(
                'flex min-w-0 flex-col self-end pb-1.5',
                cover === null ? 'text-text' : 'text-on-scrim',
              )}
            >
              <TruncatedText
                text={shown ?? ''}
                className="text-[clamp(13px,5cqw,22px)] font-semibold leading-tight"
              />
              {by === null || by === '' ? null : (
                <TruncatedText text={by} className="text-[clamp(10.5px,3.6cqw,15px)] opacity-80" />
              )}
            </span>
          </span>
        </>
      ) : (
        <span className="flex size-full items-center justify-center text-text-muted">
          {session.remoteFor !== null ? (
            <Icon of={CastIcon} size={30} className="size-[10cqw] opacity-60" />
          ) : (
            <span className="flex items-center gap-[4cqw] opacity-55">
              <span
                className="flex size-[10cqw] items-center justify-center"
                style={{
                  marginRight: `calc(-10cqw * ${(deviceOptics?.side ?? 0).toString()})`,
                }}
              >
                {systemMark === null ? (
                  <Icon of={deviceGlyph} size={30} className="!size-full" />
                ) : (
                  <BrandGlyph of={systemMark} size={34} className="!size-full" />
                )}
              </span>
              <span aria-hidden className="h-[8cqw] w-px bg-current opacity-60" />
              <span
                className="flex size-[10cqw] items-center justify-center"
                style={{
                  marginLeft: `calc(-10cqw * ${(clientOptics?.side ?? 0).toString()})`,
                }}
              >
                {clientMark === null ? (
                  <Icon of={clientGlyph} size={30} className="!size-full" />
                ) : (
                  <BrandGlyph of={clientMark} size={34} className="!size-full" />
                )}
              </span>
            </span>
          )}
        </span>
      )}

      <SessionPill glyph={state.glyph}>{state.word}</SessionPill>
      {delivery === null ? null : <SessionPill side="right">{delivery}</SessionPill>}

      {through === null ? null : (
        <span
          role="presentation"
          className={cn(
            'absolute inset-x-0 bottom-0 z-[2] h-1',
            isOnArt ? 'bg-on-scrim/20' : 'bg-text/12',
          )}
        >
          {buffered === null ? null : (
            <span
              className={cn('absolute inset-y-0 left-0', isOnArt ? 'bg-on-scrim/35' : 'bg-text/25')}
              style={{ width: `${(buffered * 100).toString()}%` }}
            />
          )}
          <span
            className={cn('absolute inset-y-0 left-0', isOnArt ? 'bg-on-scrim' : 'bg-text')}
            style={{ width: `${(through * 100).toString()}%` }}
          />
        </span>
      )}
    </div>
  );
};

SessionArtwork.displayName = 'SessionArtwork';

export { SessionArtwork };
