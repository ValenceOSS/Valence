import { Badge } from '@ValenceUI/Badge';
import { Tooltip } from '@ValenceUI/Tooltip';
import { cn } from '@ValenceUI/cn';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { regionName } from '@ValenceScreens/live/regionName';
import { say } from '@ValenceI18n/say';
import type { ChannelTagsProps } from './ChannelTags.types';

/**
 * What a channel's playlist says about its stream, as badges: that it is geo-blocked, with where it
 * most likely plays where its guide id says, and that it does not broadcast all day.
 *
 * @param channel - The channel.
 * @param className - Extra classes for the caller's own layout.
 */
const ChannelTags = ({ channel, className }: ChannelTagsProps) => {
  const tags = channelTagsOf(channel.name);

  if (!tags.isGeoBlocked && !tags.isPartTime) {
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
    </span>
  );
};

ChannelTags.displayName = 'ChannelTags';

export { ChannelTags };
