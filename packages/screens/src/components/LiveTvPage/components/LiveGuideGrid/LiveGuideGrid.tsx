import { Star as StarIcon } from '@keyline-icons/react';
import { Star as StarFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { liveChannelLogoUrl } from '@ValenceClient/live/liveChannelLogoUrl';
import { say } from '@ValenceI18n/say';
import type { LiveProgramme } from '@ValenceContracts/schemas/LiveTv';
import type { LiveGuideGridProps } from './LiveGuideGrid.types';

const HALF_HOUR_MS = 30 * 60 * 1000;

const HOUR_MS = 60 * 60 * 1000;

const REM_AN_HOUR = 16;

/**
 * A clock time as the viewer reads it, such as `19:30`.
 *
 * @param at - The moment, in milliseconds.
 * @returns The time.
 */
const timeOf = (at: number): string =>
  new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

/**
 * The guide as a grid: a row for each channel, in order, with what is on it laid along a timeline
 * of the hours shown, a line at now, and a star to keep the channel. Choosing a channel's name or
 * anywhere on its row plays it. A channel the guide knows nothing of says so along its row, and
 * rows far down the list are left undrawn until they are scrolled to, so a playlist of thousands of
 * channels stays quick.
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
  const span = until - from;
  const width = `${((span / HOUR_MS) * REM_AN_HOUR).toString()}rem`;
  const slots = Array.from(
    { length: Math.ceil(span / HALF_HOUR_MS) },
    (_, at) => from + at * HALF_HOUR_MS,
  );
  const byChannel = new Map<string, LiveProgramme[]>();

  for (const programme of programmes) {
    byChannel.set(programme.channelId, [...(byChannel.get(programme.channelId) ?? []), programme]);
  }

  const placeOf = (start: number, end: number) => {
    const left = Math.max(start, from) - from;
    const right = Math.min(end, until) - from;

    return {
      left: `${((left / span) * 100).toString()}%`,
      width: `${(((right - left) / span) * 100).toString()}%`,
    };
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--surface-line)] bg-[var(--card-shell)]">
      <div className="min-w-max">
        <div className="flex border-b border-[var(--surface-line)] text-xs text-text-muted">
          <div className="sticky left-0 z-10 w-56 shrink-0 bg-[var(--card-shell)]" />
          <div className="relative h-9" style={{ width }}>
            {slots.map((slot) => (
              <span
                key={slot}
                className="absolute top-0 flex h-full items-center border-l border-[var(--surface-line)] pl-2 tabular-nums"
                style={{ left: placeOf(slot, slot).left }}
              >
                {timeOf(slot)}
              </span>
            ))}
          </div>
        </div>

        {channels.map((channel) => {
          const shown = byChannel.get(channel.id) ?? [];
          const isChosen = channel.id === chosenId;

          return (
            <div
              key={channel.id}
              className={cn(
                'flex h-16 border-b border-[var(--surface-line)] [contain-intrinsic-size:auto_4rem] [content-visibility:auto] last:border-b-0',
                isChosen ? 'bg-[var(--surface-active)]' : '',
              )}
            >
              <div className="sticky left-0 z-[1] flex w-56 shrink-0 items-center gap-2 bg-[var(--card-shell)] px-3">
                <Button
                  variant="bare"
                  size="none"
                  label={say('screens.liveTvPage.watchName', { name: channel.name })}
                  onClick={() => {
                    onChoose(channel.id);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                >
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-text-muted">
                    {channel.number ?? ''}
                  </span>
                  <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-raised)]">
                    {channel.hasLogo ? (
                      <img
                        src={liveChannelLogoUrl(channel.id)}
                        alt=""
                        loading="lazy"
                        className="size-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-text-muted">
                        {channel.name.slice(0, 2)}
                      </span>
                    )}
                  </span>
                  <span className="truncate text-sm font-medium text-text">{channel.name}</span>
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
                    'size-7 shrink-0',
                    channel.isFavourite ? 'text-warning' : 'text-text-muted',
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
                style={{ width }}
              >
                {shown.length === 0 ? (
                  <span className="absolute inset-y-2 left-1 right-1 flex items-center rounded-lg px-3 text-xs text-text-muted">
                    {say('screens.liveTvPage.noGuideForThisChannel')}
                  </span>
                ) : (
                  shown.map((programme) => {
                    const start = Date.parse(programme.startsAt);
                    const end = Date.parse(programme.endsAt);
                    const isOn = start <= now && now < end;

                    return (
                      <span
                        key={`${programme.startsAt}-${programme.title}`}
                        className={cn(
                          'absolute inset-y-2 flex min-w-0 flex-col justify-center overflow-hidden rounded-lg border border-[var(--surface-line)] px-3',
                          isOn ? 'bg-[var(--surface-raised)]' : '',
                        )}
                        style={placeOf(start, end)}
                      >
                        <span className="truncate text-xs font-medium text-text">
                          {programme.title}
                        </span>
                        <span className="truncate text-[0.6875rem] tabular-nums text-text-muted">
                          {timeOf(start)} – {timeOf(end)}
                        </span>
                      </span>
                    );
                  })
                )}
                {now < from || now > until ? null : (
                  <span
                    aria-hidden
                    className="absolute inset-y-0 w-px bg-[var(--accent)]"
                    style={{ left: placeOf(now, now).left }}
                  />
                )}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

LiveGuideGrid.displayName = 'LiveGuideGrid';

export { LiveGuideGrid };
