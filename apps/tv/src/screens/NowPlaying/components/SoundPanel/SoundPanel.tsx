import { ScrollView, StyleSheet, Text } from 'react-native';
import { Check } from '@keyline-icons/react-native';
import { crossfadeChoices } from '@ValenceClient/music/crossfadeChoices';
import { describeAudioQuality } from '@ValenceClient/music/describeAudioQuality';
import { levellingChoices } from '@ValenceClient/music/levellingChoices';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { whatTheFileHolds } from '@ValenceClient/music/whatTheFileHolds';
import { AUDIO_QUALITIES } from '@ValenceContracts/schemas/Music';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';

const WIDTH = 820;

/**
 * How the music sounds on this television, in a panel down the right of the screen as the web's
 * menu and the phone's sheet offer it: the quality it streams at — the song's own file, or one of
 * the smaller ones made from it, each saying what it sends — with what the song's own file holds
 * beneath, then whether songs are levelled to one loudness, each on its own or each album as a
 * whole, and how many seconds one song fades into the next. A quality is heard at once, from where
 * the song has got to, and every choice is kept on this television; the panel stays open so
 * another can be tried, and Menu closes it.
 */
const SoundPanel = () => {
  const { state, player } = useMusicPlayer(theMusicPlayer());
  const track = state.current;

  return (
    <FocusGuide style={styles.panel} trapsLeft trapsRight trapsUp trapsDown>
      <FadeIn>
        <Text style={styles.title}>{say('common.quality')}</Text>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{say('screens.nowPlayingBar.streamingQuality')}</Text>

          {AUDIO_QUALITIES.map((quality) => {
            const choice = describeAudioQuality(quality, track);
            const isChosen = quality === state.quality;

            return (
              <ActionRow
                key={quality}
                label={choice.label}
                detail={choice.detail}
                {...(isChosen ? { icon: Check } : {})}
                hasPreferredFocus={isChosen}
                onPress={() => {
                  player.setQuality(quality);
                }}
              />
            );
          })}

          {track === null ? null : <Text style={styles.file}>{whatTheFileHolds(track)}</Text>}

          <Text style={styles.heading}>{say('client.music.levellingChoices.volumeLevelling')}</Text>

          {levellingChoices().map((choice) => (
            <ActionRow
              key={choice.id}
              label={choice.label}
              detail={choice.detail}
              {...(choice.id === state.levelling ? { icon: Check } : {})}
              onPress={() => {
                player.setLevelling(choice.id);
              }}
            />
          ))}

          <Text style={styles.heading}>{say('client.music.crossfadeChoices.crossfade')}</Text>

          {crossfadeChoices().map((choice) => (
            <ActionRow
              key={choice.seconds}
              label={choice.label}
              {...(choice.detail === undefined ? {} : { detail: choice.detail })}
              {...(choice.seconds === state.crossfadeSeconds ? { icon: Check } : {})}
              onPress={() => {
                player.setCrossfade(choice.seconds);
              }}
            />
          ))}
        </ScrollView>
      </FadeIn>
    </FocusGuide>
  );
};

SoundPanel.displayName = 'SoundPanel';

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: WIDTH,
    paddingTop: tokens.space.xl,
    paddingHorizontal: tokens.space.lg,
    backgroundColor: 'rgba(12,12,12,0.92)',
  },
  title: {
    color: tokens.colours.text,
    fontSize: tokens.type.heading,
    fontWeight: '700',
    marginBottom: tokens.space.md,
    paddingHorizontal: tokens.space.md,
  },
  heading: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: tokens.space.lg,
    paddingHorizontal: tokens.space.md,
  },
  file: {
    color: tokens.colours.muted,
    fontSize: tokens.type.small,
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.xs,
  },
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { SoundPanel };
