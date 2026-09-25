import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RotateCcw, RotateCw, Settings, SkipForward } from '@keyline-icons/react-native';
import { Pause, Play } from '@keyline-icons/react-native/fill';
import { Badges } from '@ValenceTv/components/Badges/Badges';
import { Button } from '@ValenceTv/components/Button/Button';
import { Scrubber } from '@ValenceTv/screens/Player/components/Scrubber/Scrubber';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { PlayerControlsProps } from './PlayerControls.types';

const SKIPS_BY = 10;

/**
 * What lies over the picture while somebody is using the remote, as the web's player lays it out:
 * at the top, what is playing with its year and its age rating beside it, and the episode beneath
 * for a programme; at the foot, the bar to scrub along, with the picture at the moment scrubbed to
 * above it, and a row of what can be done — pause or play, go back or forward ten seconds, and on
 * the right the settings and the next episode.
 *
 * The remote starts on pause or play, since that is what somebody reaching for it most often wants.
 *
 * @param title - What is playing.
 * @param year - The year it came out, where known.
 * @param certification - Its age rating where the server keeps one for its region, such as 15.
 * @param subtitle - Which episode it is, for a programme.
 * @param position - Where playing has reached, in seconds.
 * @param duration - How long it is, in seconds.
 * @param isPlaying - Whether it is playing.
 * @param scrubAt - Where the scrub cursor has been moved to, while scrubbing.
 * @param trickplay - The thumbnails to show while scrubbing, where there are any.
 * @param onToggle - Told to pause or play.
 * @param onSeekBy - Told to jump forward or back by some seconds.
 * @param onScrubFocus - Told when the remote lands on the bar.
 * @param onScrubBlur - Told when it leaves the bar.
 * @param onScrubPress - Told when the bar is pressed, to jump to the cursor.
 * @param onSettings - Told to open the settings: quality, sound, subtitles and speed.
 * @param onNext - Told to move on to the next episode, where there is one.
 * @param onTouched - Told whenever something is pressed, so the controls stay up.
 */
const PlayerControls = ({
  title,
  year,
  certification,
  subtitle,
  position,
  duration,
  isPlaying,
  scrubAt,
  trickplay,
  onToggle,
  onSeekBy,
  onScrubFocus,
  onScrubBlur,
  onScrubPress,
  onSettings,
  onNext,
  onTouched,
}: PlayerControlsProps) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
    <LinearGradient
      colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.9)']}
      locations={[0, 0.28, 0.5, 1]}
      style={StyleSheet.absoluteFill}
    />

    <View style={styles.top}>
      <View style={styles.titleLine}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {year === null ? null : <Text style={styles.year}>{year}</Text>}
        {certification === null ? null : <Badges badges={[certification]} />}
      </View>

      {subtitle === null ? null : (
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      )}
    </View>

    <View style={styles.bottom}>
      <Scrubber
        position={position}
        duration={duration}
        scrubAt={scrubAt}
        trickplay={trickplay}
        onFocus={onScrubFocus}
        onBlur={onScrubBlur}
        onPress={onScrubPress}
      />

      <View style={styles.buttons}>
        <Button
          label={isPlaying ? say('tv.playerControls.pause') : say('tv.playerControls.play')}
          icon={isPlaying ? Pause : Play}
          variant="overlay"
          size="md"
          hasPreferredFocus
          onPress={() => {
            onTouched();
            onToggle();
          }}
        />
        <Button
          label={say('tv.playerControls.skipSeconds', { seconds: SKIPS_BY })}
          icon={RotateCcw}
          variant="overlay"
          size="md"
          onPress={() => {
            onTouched();
            onSeekBy(-SKIPS_BY);
          }}
        />
        <Button
          label={say('tv.playerControls.skipSeconds', { seconds: SKIPS_BY })}
          icon={RotateCw}
          variant="overlay"
          size="md"
          onPress={() => {
            onTouched();
            onSeekBy(SKIPS_BY);
          }}
        />

        <View style={styles.spring} />

        <Button
          label={say('tv.playerControls.settings')}
          icon={Settings}
          variant="overlay"
          size="md"
          onPress={onSettings}
        />
        {onNext === null ? null : (
          <Button
            label={say('tv.playerControls.nextEpisode')}
            icon={SkipForward}
            variant="overlay"
            size="md"
            onPress={onNext}
          />
        )}
      </View>
    </View>
  </View>
);

PlayerControls.displayName = 'PlayerControls';

const styles = StyleSheet.create({
  top: { paddingHorizontal: tokens.space.edge, paddingTop: tokens.space.xl, gap: 6 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    flexShrink: 1,
  },
  year: { color: tokens.colours.muted, fontSize: tokens.type.body, fontWeight: '500' },
  subtitle: { color: tokens.colours.muted, fontSize: tokens.type.body },
  bottom: {
    position: 'absolute',
    left: tokens.space.edge,
    right: tokens.space.edge,
    bottom: tokens.space.xl,
    gap: tokens.space.md,
  },
  buttons: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  spring: { flex: 1 },
});

export { PlayerControls };
