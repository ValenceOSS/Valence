import { Badge } from '@ValenceUI/Badge';
import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { regionName } from '@ValenceScreens/live/regionName';
import { say } from '@ValenceI18n/say';
import type { ChannelTagsProps } from './ChannelTags.types';

/**
 * What is known of a channel's stream, as badges: that its playlist calls it geo-blocked, with where
 * it most likely plays, or not on all day; and how it was when last checked — off air, blocked from
 * here, or not working.
 *
 * @param channel - The channel.
 * @param hasProxy - Whether a refusal was tried through the proxy too.
 * @param className - Extra classes for the caller's own layout.
 */
const ChannelTags = ({ channel, hasProxy = false, className }: ChannelTagsProps) => {
  const tags = channelTagsOf(channel.name);
  const trouble =
    channel.health === null || channel.health === 'onAir' || channel.health === 'unsure'
      ? null
      : channel.health;

  if (!tags.isGeoBlocked && !tags.isPartTime && trouble === null) {
    return null;
  }

  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      {tags.isGeoBlocked ? (
        <Tooltip
          label={
            channel.region === null
              ? say('screens.liveTvPage.blockedOutsideSomeCountries')
              : say('screens.liveTvPage.likelyOnlyPlaysInCountry', {
                  country: regionName(channel.region),
                })
          }
        >
          <span>
            <Badge size="sm" tone="warning">
              {channel.region === null
                ? say('screens.liveTvPage.geoBlocked')
                : say('screens.liveTvPage.geoBlockedCountry', { country: channel.region })}
            </Badge>
          </span>
        </Tooltip>
      ) : null}
      {tags.isPartTime ? <Badge size="sm">{say('screens.liveTvPage.notAllDay')}</Badge> : null}
      {trouble === null ? null : (
        <Badge
          size="sm"
          tone={trouble === 'offAir' ? 'quiet' : trouble === 'refused' ? 'warning' : 'danger'}
        >
          {trouble === 'offAir'
            ? say('screens.liveTvPage.offAir')
            : trouble === 'refused'
              ? hasProxy
                ? say('screens.liveTvPage.blockedEvenThroughTheVpn')
                : say('screens.liveTvPage.blockedHere')
              : say('screens.liveTvPage.notWorking')}
        </Badge>
      )}
    </span>
  );
};

ChannelTags.displayName = 'ChannelTags';

export { ChannelTags };
