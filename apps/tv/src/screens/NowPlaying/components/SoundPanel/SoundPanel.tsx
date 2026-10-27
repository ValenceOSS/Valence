import { ScrollView, StyleSheet, Text } from 'react-native';
import { Check } from '@keyline-icons/react-native';
import { crossfadeChoices } from '@ValenceClient/music/crossfadeChoices';
import { levellingChoices } from '@ValenceClient/music/levellingChoices';
import { theMusicPlayer } from '@ValenceClient/music/theMusicPlayer';
import { useMusicPlayer } from '@ValenceClient/music/useMusicPlayer';
import { ActionRow } from '@ValenceTv/components/ActionRow/ActionRow';
import { FadeIn } from '@ValenceTv/components/FadeIn/FadeIn';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';

const WIDTH = 820;

/**
 * How the music sounds on this television, in a panel down the right of the screen as the web's
 * menu offers it: whether songs are levelled to one loudness, each on its own or each album as a
 * whole, and how many seconds one song fades into the next. A choice is kept on this television and
 * heard from the next song; the panel stays open so another can be tried, and Menu closes it.
 */
const SoundPanel = () => {
  const { state, player } = useMusicPlayer(theMusicPlayer());

  return (
    <FocusGuide style={styles.panel} trapsLeft trapsRight trapsUp trapsDown>
      <FadeIn>
        <Text style={styles.title}>{say('common.audio')}</Text>

        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{say('client.music.levellingChoices.volumeLevelling')}</Text>

          {levellingChoices().map((choice) => {
            const isChosen = choice.id === state.levelling;

            return (
              <ActionRow
                key={choice.id}
                label={choice.label}
                detail={choice.detail}
                {...(isChosen ? { icon: Check } : {})}
                hasPreferredFocus={isChosen}
                onPress={() => {
                  player.setLevelling(choice.id);
                }}
              />
            );
          })}

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
  list: { gap: tokens.space.xs, paddingBottom: tokens.space.xl },
});

export { SoundPanel };
