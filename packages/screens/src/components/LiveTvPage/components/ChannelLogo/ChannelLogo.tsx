import { useState } from 'react';
import { cn } from '@ValenceUI/cn';
import { liveChannelLogoUrl } from '@ValenceClient/live/liveChannelLogoUrl';
import type { ChannelLogoProps } from './ChannelLogo.types';

/**
 * A channel's logo, read through the server, or the first letters of its name where it has none
 * or the logo cannot be had — so a host that refuses to serve it leaves a tidy tile rather than a
 * broken picture.
 *
 * @param channelId - The channel.
 * @param name - What the channel is called.
 * @param hasLogo - Whether the channel names a logo at all.
 * @param className - Extra classes for the caller's own layout.
 */
const ChannelLogo = ({ channelId, name, hasLogo, className }: ChannelLogoProps) => {
  const [failedFor, setFailedFor] = useState<string | null>(null);
  const isShown = hasLogo && failedFor !== channelId;

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-raised)]',
        className,
      )}
    >
      {isShown ? (
        <img
          src={liveChannelLogoUrl(channelId)}
          alt=""
          loading="lazy"
          onError={() => {
            setFailedFor(channelId);
          }}
          className="size-full object-contain p-1"
        />
      ) : (
        <span className="text-xs font-semibold uppercase text-text-muted">
          {name.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2)}
        </span>
      )}
    </span>
  );
};

ChannelLogo.displayName = 'ChannelLogo';

export { ChannelLogo };
