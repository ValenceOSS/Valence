import { StyleSheet, Text, View } from 'react-native';
import { Star } from '@keyline-icons/react-native/fill';
import { ChannelLogo } from '@ValenceTv/components/ChannelLogo/ChannelLogo';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { Shade } from '@ValenceTv/components/Shade/Shade';
import { channelTagsOf } from '@ValenceClient/live/channelTagsOf';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';
import { tokens } from '@ValenceTv/theme/tokens';
import type { NowAndNextProps } from './NowAndNext.types';
import { say } from '@ValenceI18n/say';

const LOGO = { width: 144, height: 88 };

/**
 * What is on the channel being watched and what follows it, over the bottom of the picture: the
 * channel's logo, number and name, the programme on now with its times and how far through it is,
 * and the next programme with when it starts. Where the channel will not play, why is said in place
 * of the programme.
 *
 * @param channel - The channel.
 * @param onNow - The programme on it now, if the guide knows.
 * @param upNext - The programme after, if the guide knows.
 * @param now - The time now, in milliseconds.
 * @param problem - Why the channel will not play, if it will not.
 */
const NowAndNext = ({ channel, onNow, upNext, now, problem }: NowAndNextProps) => {
  const { name } = channelTagsOf(channel.name);
  const starts = onNow === null ? null : Date.parse(onNow.startsAt);
  const ends = onNow === null ? null : Date.parse(onNow.endsAt);
  const through =
    starts === null || ends === null || ends <= starts
      ? null
      : Math.min(Math.max((now - starts) / (ends - starts), 0), 1);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Shade
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.92)']}
        locations={[0, 0.45, 1]}
        flat="rgba(0,0,0,0.5)"
        style={StyleSheet.absoluteFill}
      />

      <Text style={styles.hint}>{say('tv.livePlayer.changeChannelHint')}</Text>

      <View style={styles.panel}>
        <ChannelLogo
          channelId={channel.id}
          name={name}
          hasLogo={channel.hasLogo}
          width={LOGO.width}
          height={LOGO.height}
        />

        <View style={styles.words}>
          <View style={styles.channelLine}>
            {channel.number === null ? null : <Text style={styles.number}>{channel.number}</Text>}
            <Text numberOfLines={1} style={styles.channel}>
              {name}
            </Text>
            {channel.isFavourite ? (
              <Icon of={Star} size={28} colour={tokens.colours.accent} />
            ) : null}
          </View>

          {problem === null ? (
            <>
              <Text numberOfLines={1} style={styles.title}>
                {onNow?.title ?? say('screens.liveTvPage.liveNowNoGuide')}
              </Text>

              {onNow === null || through === null ? null : (
                <View style={styles.timeLine}>
                  <Text style={styles.time}>{liveClockTime(onNow.startsAt)}</Text>
                  <View style={styles.track}>
                    <View style={[styles.through, { flex: through }]} />
                    <View style={{ flex: 1 - through }} />
                  </View>
                  <Text style={styles.time}>{liveClockTime(onNow.endsAt)}</Text>
                </View>
              )}

              {upNext === null ? null : (
                <Text numberOfLines={1} style={styles.next}>
                  {say('screens.liveTvPage.nextTimeTitle', {
                    time: liveClockTime(upNext.startsAt),
                    title: upNext.title,
                  })}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.problem}>{problem}</Text>
          )}
        </View>
      </View>
    </View>
  );
};

NowAndNext.displayName = 'NowAndNext';

const styles = StyleSheet.create({
  hint: {
    position: 'absolute',
    top: tokens.space.xl,
    right: tokens.space.edge,
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
  },
  panel: {
    position: 'absolute',
    left: tokens.space.edge,
    right: tokens.space.edge,
    bottom: tokens.space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.lg,
  },
  words: { flex: 1, gap: tokens.space.xs },
  channelLine: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  number: { color: tokens.colours.muted, fontSize: tokens.type.body, fontWeight: '700' },
  channel: {
    flexShrink: 1,
    color: tokens.colours.muted,
    fontSize: tokens.type.body,
    fontWeight: '600',
  },
  title: { color: tokens.colours.text, fontSize: tokens.type.title, fontWeight: '700' },
  timeLine: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  time: { color: tokens.colours.muted, fontSize: tokens.type.small, fontVariant: ['tabular-nums'] },
  track: {
    flex: 1,
    flexDirection: 'row',
    height: 6,
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  through: { backgroundColor: tokens.colours.text },
  next: { color: tokens.colours.muted, fontSize: tokens.type.body },
  problem: { color: tokens.colours.text, fontSize: tokens.type.heading, fontWeight: '600' },
});

export { NowAndNext };
