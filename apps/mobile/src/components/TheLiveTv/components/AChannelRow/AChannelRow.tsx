import { Star } from '@keyline-icons/react-native';
import { Star as StarFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { liveChannelLogoUrl } from '@ValenceClient/live/liveChannelLogoUrl';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';
import type { AChannelRowProps } from './AChannelRow.types';
import { say } from '@ValenceI18n/say';

const LOGO = 52;

const styles = StyleSheet.create({
  bar: { borderRadius: 2, height: 3, overflow: 'hidden' },
  barFilled: { height: '100%' },
  dot: { borderRadius: 5, bottom: -2, height: 10, position: 'absolute', right: -2, width: 10 },
  logo: {
    alignItems: 'center',
    borderRadius: 12,
    height: LOGO,
    justifyContent: 'center',
    width: LOGO,
  },
  logoPicture: { height: LOGO - 14, width: LOGO - 14 },
  middle: { flex: 1, gap: 3 },
  name: { fontFamily: FONTS.sans.bold, fontSize: 15 },
  next: { fontFamily: FONTS.sans.medium, fontSize: 12 },
  onNow: { fontFamily: FONTS.sans.semibold, fontSize: 13 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 14, paddingVertical: 10 },
  star: { padding: 8 },
});

/**
 * One channel in the list: its logo with a dot for whether it is on air, its number and name, what
 * it is showing now with how far through it is, what follows, and a star to keep it as a favourite.
 * The whole row plays it.
 *
 * @param channel - The channel.
 * @param onNow - What it is showing now, where the guide says.
 * @param upNext - What follows, where the guide says.
 * @param now - The time now, to say how far through the programme it is.
 * @param onWatch - Told to play it.
 * @param onToggleFavourite - Told to keep it as a favourite, or let it go.
 */
const AChannelRow = ({
  channel,
  onNow,
  upNext,
  now,
  onWatch,
  onToggleFavourite,
}: AChannelRowProps) => {
  const colours = useTheColours();
  const [isLogoMissing, setIsLogoMissing] = useState(false);
  const { name } = channelTagsOf(channel.name);
  const through =
    onNow === null
      ? null
      : Math.min(
          1,
          Math.max(
            0,
            (now - Date.parse(onNow.startsAt)) /
              Math.max(1, Date.parse(onNow.endsAt) - Date.parse(onNow.startsAt)),
          ),
        );
  const health =
    channel.health === 'onAir'
      ? '#3fb950'
      : channel.health === null || channel.health === 'offAir'
        ? withAlpha(colours.textMuted, 0.6)
        : colours.danger;

  return (
    <View style={styles.row}>
      <View style={styles.middle}>
        <Button
          tone="bare"
          isWide
          label={say('screens.liveTvPage.watchName', { name })}
          onPress={onWatch}
        >
          <View style={[styles.row, { paddingVertical: 0 }]}>
            <View style={[styles.logo, { backgroundColor: colours.surfaceRaised }]}>
              {channel.hasLogo && !isLogoMissing ? (
                <ARemotePicture
                  style={styles.logoPicture}
                  fit="contain"
                  uri={onThisServer(liveChannelLogoUrl(channel.id))}
                  onMissing={() => {
                    setIsLogoMissing(true);
                  }}
                />
              ) : (
                <Text style={[styles.name, { color: colours.textMuted }]}>
                  {(channel.number ?? name.slice(0, 2)).toUpperCase()}
                </Text>
              )}
              <View
                style={[
                  styles.dot,
                  { backgroundColor: health, borderColor: colours.surface, borderWidth: 2 },
                ]}
              />
            </View>

            <View style={styles.middle}>
              <Text style={[styles.name, { color: colours.text }]} numberOfLines={1}>
                {channel.number === null ? name : `${channel.number} · ${name}`}
              </Text>

              <Text style={[styles.onNow, { color: colours.text }]} numberOfLines={1}>
                {onNow === null
                  ? say('screens.liveTvPage.liveNowNoGuide')
                  : `${onNow.title} · ${liveClockTime(onNow.startsAt)} – ${liveClockTime(onNow.endsAt)}`}
              </Text>

              {through === null ? null : (
                <View style={[styles.bar, { backgroundColor: withAlpha(colours.text, 0.15) }]}>
                  <View
                    style={[
                      styles.barFilled,
                      { backgroundColor: colours.text, width: `${(through * 100).toFixed(1)}%` },
                    ]}
                  />
                </View>
              )}

              {upNext === null ? null : (
                <Text style={[styles.next, { color: colours.textMuted }]} numberOfLines={1}>
                  {say('screens.liveTvPage.nextTimeTitle', {
                    time: liveClockTime(upNext.startsAt),
                    title: upNext.title,
                  })}
                </Text>
              )}
            </View>
          </View>
        </Button>
      </View>

      <Button
        tone="bare"
        isChosen={channel.isFavourite}
        label={
          channel.isFavourite
            ? say('screens.liveTvPage.stopKeepingName', { name })
            : say('screens.liveTvPage.keepName', { name })
        }
        onPress={onToggleFavourite}
      >
        <View style={styles.star}>
          <Icon
            of={channel.isFavourite ? StarFilled : Star}
            size={22}
            colour={channel.isFavourite ? colours.highlight : colours.textMuted}
          />
        </View>
      </Button>
    </View>
  );
};

AChannelRow.displayName = 'AChannelRow';

export { AChannelRow };
