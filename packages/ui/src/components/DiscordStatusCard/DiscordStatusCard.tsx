import { cn } from '@ValenceUI/cn';
import { DISCORD_PICTURES } from './DISCORD_PICTURES';
import type { DiscordStatusCardProps } from './DiscordStatusCard.types';

/**
 * A Discord status as Discord's profile card lays it out: what it is doing and in what over the
 * top, then the large picture with the small badge over its corner, the two lines beside it in
 * bold and plain, the time, and the buttons.
 *
 * It draws what it is given and decides nothing. A picture named by its Rich Presence key, such as
 * `valence-desktop`, is drawn from the copy of that asset kept here; anything else is an address.
 * The buttons are drawn but do nothing, since this only shows what somebody else would see.
 *
 * @param heading - What the status is doing and in what, such as "Watching Valence".
 * @param details - The bold first line beside the picture.
 * @param state - The line beneath it.
 * @param largeImage - The large picture, as a Rich Presence key or an address.
 * @param largeImageLabel - What the large picture shows, for anybody who cannot see it.
 * @param smallImage - The badge over its corner, as a key or an address.
 * @param smallImageLabel - What the badge shows.
 * @param time - How far through it is, or how long it has been going.
 * @param buttons - The labels of the buttons beneath.
 * @param className - Extra classes for the caller's own layout.
 */
const DiscordStatusCard = ({
  heading,
  details,
  state,
  largeImage,
  largeImageLabel,
  smallImage,
  smallImageLabel,
  time,
  buttons = [],
  className,
}: DiscordStatusCardProps) => (
  <div className={cn('flex flex-col gap-3 rounded-lg bg-surface-raised p-3', className)}>
    <p className="text-sm font-semibold text-text">{heading}</p>

    <div className="flex gap-3">
      <div className="relative size-24 shrink-0">
        <img
          src={DISCORD_PICTURES[largeImage] ?? largeImage}
          alt={largeImageLabel}
          className="size-24 rounded-lg object-cover"
        />

        {smallImage === undefined ? null : (
          <img
            src={DISCORD_PICTURES[smallImage] ?? smallImage}
            alt={smallImageLabel ?? ''}
            className="absolute -bottom-1 -right-1 size-7 rounded-full border-2 border-surface-raised bg-surface-raised object-cover"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <p className="truncate text-base font-semibold text-text">{details}</p>
        {state === undefined ? null : <p className="truncate text-sm text-text-muted">{state}</p>}

        {time === undefined ? null : time.kind === 'elapsed' ? (
          <p className="font-mono text-sm text-text-muted">{time.elapsed}</p>
        ) : (
          <div className="mt-1 flex items-center gap-2 font-mono text-sm text-text-muted">
            <span>{time.elapsed}</span>
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-track">
              <span
                className="block h-full rounded-full bg-text"
                style={{ width: `${(Math.min(Math.max(time.fraction, 0), 1) * 100).toString()}%` }}
              />
            </span>
            <span>{time.total}</span>
          </div>
        )}
      </div>
    </div>

    {buttons.map((label) => (
      <span
        key={label}
        className="rounded-md bg-surface px-3 py-1.5 text-center text-sm font-medium text-text"
      >
        {label}
      </span>
    ))}
  </div>
);

DiscordStatusCard.displayName = 'DiscordStatusCard';

export { DiscordStatusCard };
