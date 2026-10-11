import { useEffect, useRef, useState } from 'react';
import { Star as StarIcon } from '@keyline-icons/react';
import { Star as StarFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { groupsOf } from '@ValenceClient/live/groupsOf';
import { TABLE_LOOKS } from '@ValenceUI/tokens/tableLooks';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { ChannelLogo } from '@ValenceScreens/components/LiveTvPage/components/ChannelLogo/ChannelLogo';
import { say } from '@ValenceI18n/say';
import type { LiveHealth, LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import type { LiveGuideGridProps } from './LiveGuideGrid.types';

const HALF_HOUR_MS = 30 * 60 * 1000;

/**
 * Whether a channel was found not to play when last checked.
 *
 * @param health - How it was.
 * @returns Whether it would not play.
 */
const isUnplayable = (health: LiveHealth | null): boolean =>
  health !== null && health !== 'onAir' && health !== 'unsure';

const HOUR_MS = 60 * 60 * 1000;

const REM_AN_HOUR = 20;

const CHANNELS_REM = 16;

const LOOKS_BACK_MS = 20 * 60 * 1000;

const LABEL_CLEARS_MS = 14 * 60 * 1000;

const ROW_REM = 4.5;

const ROWS_BEYOND = 6;

/**
 * A clock time as the viewer reads it, such as `19:30`.
 *
 * @param at - The moment, in milliseconds.
 * @returns The time.
 */
const timeOf = (at: number): string =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * The guide, laid out as a television's is: the channels down the side, held in place as the hours
 * scroll past, a time bar along the top held in place as the channels scroll, and one line through
 * every row at the time now, labelled with it. What is on now is lit with how far through it is,
 * what has finished is dimmed, and a channel the guide knows nothing of shows a quiet band rather
 * than a programme. Choosing a channel, or anywhere along its row, plays it; the star keeps it.
 * Only the rows in view, and a few either side, are drawn at all — and so only their logos asked
 * for — so a playlist of thousands of channels opens as quickly as one of ten.
 *
 * @param channels - The channels, in order.
 * @param programmes - What is on them.
 * @param from - The start of the hours shown, in milliseconds.
 * @param until - The end of the hours shown, in milliseconds.
 * @param now - The time now, in milliseconds.
 * @param chosenId - The channel playing, if any.
 * @param onChoose - Told which channel to play.
 * @param onToggleFavourite - Told which channel to keep, or stop keeping.
 */
const LiveGuideGrid = ({
  channels,
  programmes,
  from,
  until,
  now,
  chosenId,
  onChoose,
  onToggleFavourite,
}: LiveGuideGridProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [remPx] = useState(
    () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
  );
  const [view, setView] = useState({ top: 0, height: 800 });
  const span = until - from;
  const timelineRem = (span / HOUR_MS) * REM_AN_HOUR;
  const remOf = (at: number) =>
    ((Math.min(Math.max(at, from), until) - from) / HOUR_MS) * REM_AN_HOUR;
  const slots = Array.from(
    { length: Math.ceil(span / HALF_HOUR_MS) },
    (_, at) => from + at * HALF_HOUR_MS,
  );
  const byChannel = new Map<string, LiveProgramme[]>();
  const isNowShown = now >= from && now <= until;
  const nowLeft = `${(CHANNELS_REM + remOf(now)).toString()}rem`;

  for (const programme of programmes) {
    const held = byChannel.get(programme.channelId);

    if (held === undefined) {
      byChannel.set(programme.channelId, [programme]);
    } else {
      held.push(programme);
    }
  }

  const rowPx = ROW_REM * remPx;
  const first = Math.max(Math.floor(view.top / rowPx) - ROWS_BEYOND, 0);
  const last = Math.min(Math.ceil((view.top + view.height) / rowPx) + ROWS_BEYOND, channels.length);
  const drawn = channels.slice(first, last);

  const jumpToNow = () => {
    scrollerRef.current?.scrollTo({
      left: Math.max(remOf(now - LOOKS_BACK_MS), 0) * remPx,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const scroller = scrollerRef.current;

    if (scroller === null) {
      return;
    }

    setView({ top: scroller.scrollTop, height: scroller.clientHeight });
    scroller.scrollLeft = Math.max(remOf(now - LOOKS_BACK_MS), 0) * remPx;
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- placed once, as the guide opens; the viewer scrolls it from there
  }, []);

  return (
    <div className={TABLE_LOOKS.well}>
      <div
        ref={scrollerRef}
        onScroll={(event) => {
          setView({ top: event.currentTarget.scrollTop, height: event.currentTarget.clientHeight });
        }}
        className="relative max-h-[70vh] overflow-auto"
      >
        <div
          className="relative"
          style={{ width: `${(CHANNELS_REM + timelineRem).toString()}rem` }}
        >
          <div
            className={cn(
              'sticky top-0 z-20 flex h-11 border-b border-[var(--surface-line)] text-xs font-medium text-text-muted',
              TABLE_LOOKS.band,
            )}
          >
            <div
              className={cn(
                'sticky left-0 z-20 flex shrink-0 items-center border-r border-[var(--surface-line)] px-3',
                TABLE_LOOKS.band,
              )}
              style={{ width: `${CHANNELS_REM.toString()}rem` }}
            >
              <Button variant="soft" size="xs" isPill onClick={jumpToNow}>
                {say('screens.liveTvPage.jumpToNow')}
              </Button>
            </div>
            <div
              className="relative h-full shrink-0"
              style={{ width: `${timelineRem.toString()}rem` }}
            >
              {slots.map((slot) => (
                <span
                  key={slot}
                  className="absolute bottom-0 top-0 flex items-center border-l border-[var(--surface-line)] pl-2 tabular-nums"
                  style={{ left: `${remOf(slot).toString()}rem` }}
                >
                  {isNowShown && Math.abs(slot - now) < LABEL_CLEARS_MS ? '' : timeOf(slot)}
                </span>
              ))}
            </div>
            {isNowShown ? (
              <span
                className="absolute top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent px-2 py-0.5 text-[0.6875rem] font-semibold tabular-nums text-accent-contrast"
                style={{ left: nowLeft }}
              >
                {timeOf(now)}
              </span>
            ) : null}
          </div>

          <div aria-hidden style={{ height: `${(first * ROW_REM).toString()}rem` }} />

          {drawn.map((channel) => {
            const shown = byChannel.get(channel.id) ?? [];
            const isChosen = channel.id === chosenId;

            return (
              <div
                key={channel.id}
                className={cn(
                  'group box-border flex h-[4.5rem] border-b border-[var(--surface-line)]',
                  isChosen ? 'bg-[var(--surface-active)]' : 'hover:bg-[var(--surface-hover)]',
                )}
              >
                <div
                  className={cn(
                    'sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-[var(--surface-line)] px-3',
                    TABLE_LOOKS.body,
                  )}
                  style={{ width: `${CHANNELS_REM.toString()}rem` }}
                >
                  {isChosen ? (
                    <span
                      aria-hidden
                      className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-accent"
                    />
                  ) : null}
                  <Button
                    variant="bare"
                    size="none"
                    label={say('screens.liveTvPage.watchName', { name: channel.name })}
                    onClick={() => {
                      onChoose(channel.id);
                    }}
                    className={cn(
                      'flex min-w-0 flex-1 items-center gap-3 text-left',
                      isUnplayable(channel.health) ? 'opacity-55' : '',
                    )}
                  >
                    <ChannelLogo
                      channelId={channel.id}
                      name={channel.name}
                      hasLogo={channel.hasLogo}
                      health={channel.health}
                      className="size-11"
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="flex min-w-0 items-baseline gap-1.5">
                        {channel.number === null ? null : (
                          <span className="shrink-0 text-xs tabular-nums text-text-muted">
                            {channel.number}
                          </span>
                        )}
                        <span className="truncate text-sm font-medium leading-tight text-text">
                          {channelTagsOf(channel.name).name}
                        </span>
                      </span>
                      {channel.group === null ? null : (
                        <span className="truncate text-[0.6875rem] text-text-muted">
                          {groupsOf(channel.group).join(' · ')}
                        </span>
                      )}
                    </span>
                  </Button>
                  <Button
                    variant="bare"
                    size="none"
                    isIconOnly
                    label={
                      channel.isFavourite
                        ? say('screens.liveTvPage.stopKeepingName', { name: channel.name })
                        : say('screens.liveTvPage.keepName', { name: channel.name })
                    }
                    aria-pressed={channel.isFavourite}
                    onClick={() => {
                      onToggleFavourite(channel);
                    }}
                    className={cn(
                      'size-7 shrink-0 transition-opacity duration-[var(--duration-fast)] motion-reduce:transition-none',
                      channel.isFavourite
                        ? 'text-warning'
                        : 'text-text-muted opacity-0 focus-visible:opacity-100 group-hover:opacity-100',
                    )}
                  >
                    <Icon of={channel.isFavourite ? StarFilledIcon : StarIcon} size={14} />
                  </Button>
                </div>

                <Button
                  variant="bare"
                  size="none"
                  label={say('screens.liveTvPage.watchName', { name: channel.name })}
                  onClick={() => {
                    onChoose(channel.id);
                  }}
                  className="relative block h-full shrink-0 text-left"
                  style={{ width: `${timelineRem.toString()}rem` }}
                >
                  {shown.length === 0 ? (
                    <span
                      className="absolute inset-y-2 flex items-center rounded-xl bg-[var(--surface-hover)] px-3 text-xs text-text-muted"
                      style={{
                        left: `calc(${(isNowShown ? remOf(now) : 0).toString()}rem + 0.5rem)`,
                        right: '0.375rem',
                      }}
                    >
                      {say('screens.liveTvPage.liveNowNoGuide')}
                    </span>
                  ) : (
                    shown.map((programme) => {
                      const start = Date.parse(programme.startsAt);
                      const end = Date.parse(programme.endsAt);
                      const isOn = start <= now && now < end;
                      const isOver = end <= now;
                      const left = remOf(start);
                      const width = remOf(end) - left;

                      return (
                        <span
                          key={`${programme.startsAt}-${programme.title}`}
                          className={cn(
                            'absolute inset-y-2 flex min-w-0 flex-col justify-center overflow-hidden rounded-xl border px-3',
                            isOn
                              ? 'border-accent bg-surface-raised'
                              : 'border-[var(--surface-line)]',
                            isOver ? 'opacity-50' : '',
                          )}
                          style={{
                            left: `calc(${left.toString()}rem + 0.125rem)`,
                            width: `calc(${width.toString()}rem - 0.25rem)`,
                          }}
                        >
                          <span className="truncate text-xs font-medium text-text">
                            {programme.title}
                          </span>
                          <span className="truncate text-[0.6875rem] tabular-nums text-text-muted">
                            {timeOf(start)} – {timeOf(end)}
                            {programme.category === null ? '' : ` · ${programme.category}`}
                          </span>
                          {isOn ? (
                            <span
                              aria-hidden
                              className="absolute bottom-0 left-0 h-0.5 bg-accent"
                              style={{
                                width: `${(((now - start) / (end - start)) * 100).toString()}%`,
                              }}
                            />
                          ) : null}
                        </span>
                      );
                    })
                  )}
                </Button>
              </div>
            );
          })}

          <div
            aria-hidden
            style={{ height: `${((channels.length - last) * ROW_REM).toString()}rem` }}
          />

          {isNowShown ? (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 top-11 z-[5] w-px -translate-x-1/2 bg-accent/80"
              style={{ left: nowLeft }}
            >
              <span className="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-accent" />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

LiveGuideGrid.displayName = 'LiveGuideGrid';

export { LiveGuideGrid };
