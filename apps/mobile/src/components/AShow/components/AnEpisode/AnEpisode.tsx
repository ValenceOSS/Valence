import { Check, CircleCheck, Info } from '@keyline-icons/react-native';
import { CircleCheck as CircleCheckFilled } from '@keyline-icons/react-native/fill';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { Button } from '@ValenceMobile/components/Button/Button';
import { HowFar } from '@ValenceMobile/components/HowFar/HowFar';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Words } from '@ValenceMobile/components/Words/Words';
import { EPISODE_STILL } from '@ValenceMobile/components/AShow/components/EPISODE_STILL';
import { onThisServer } from '@ValenceMobile/platform/onThisServer';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AnEpisodeProps } from './AnEpisode.types';
import { describeEpisodeNumbers } from '@ValenceCore/functions/describeEpisodeNumbers';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  about: { padding: 10 },
  facts: { flex: 1, gap: 4 },
  howFar: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  number: { alignItems: 'center', width: 24 },
  picture: { height: '100%', width: '100%' },
  play: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  seen: {
    alignItems: 'center',
    borderRadius: 10,
    bottom: 6,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    width: 20,
  },
  whole: { alignItems: 'center', flexDirection: 'row' },
});

/**
 * One episode in a programme's list, drawn as the web's row is: its number, its still, its name,
 * how long it runs, when it aired and how far in somebody is — a line across the still while they
 * are part way, a tick once they are through. Pressing it plays it, from where they left it; the
 * button beside it opens its own page.
 *
 * @param episode - The episode.
 * @param watched - How much of it has been seen, as a fraction.
 * @param resumeSeconds - Where they left it, or null where there is nowhere to carry on from.
 * @param airs - When it aired, where the catalogue says.
 * @param onWatch - Told to play it.
 * @param onLookAt - Told to open its page.
 * @param onMarkWatched - Told to mark it watched, or unwatched again where it already is.
 */
const AnEpisode = ({
  episode,
  watched,
  resumeSeconds,
  airs,
  onWatch,
  onLookAt,
  onMarkWatched,
}: AnEpisodeProps) => {
  const colours = useTheColours();
  const [isMissing, setIsMissing] = useState(false);
  const isThrough = watched >= 1;

  return (
    <View style={styles.whole}>
      <View style={styles.play}>
        <Button
          tone="bare"
          label={
            resumeSeconds === null
              ? say('phone.anEpisode.play', { title: episode.title })
              : say('phone.anEpisode.resume', {
                  title: episode.title,
                  when: formatDuration(resumeSeconds),
                })
          }
          onPress={onWatch}
        >
          <View style={styles.row}>
            <View style={styles.number}>
              <Words size="small" tone="muted">
                {episode.episodeNumber === null || episode.episodeNumber === undefined
                  ? '—'
                  : describeEpisodeNumbers(episode.episodeNumber, episode.episodeNumberEnd)}
              </Words>
            </View>

            <View
              style={[
                EPISODE_STILL,
                { backgroundColor: colours.surfaceRaised, borderColor: colours.border },
              ]}
            >
              {!episode.hasBackdrop || isMissing ? null : (
                <Image
                  style={styles.picture}
                  source={{ uri: onThisServer(`/api/media/${episode.id}/image/backdrop`) }}
                  onError={() => {
                    setIsMissing(true);
                  }}
                  accessibilityIgnoresInvertColors
                />
              )}

              {isThrough ? (
                <View
                  style={[styles.seen, { backgroundColor: withAlpha('#000000', 0.6) }]}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={say('phone.anEpisode.watched')}
                >
                  <Icon of={Check} size={12} colour="#ffffff" />
                </View>
              ) : null}

              {watched > 0 && !isThrough ? (
                <View style={styles.howFar}>
                  <HowFar
                    fraction={watched}
                    label={say('phone.anEpisode.howFarThrough', { title: episode.title })}
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.facts}>
              <Words lines={1}>{episode.title}</Words>
              <Words size="small" tone="muted">
                {[
                  formatDuration(episode.durationSeconds),
                  airs === '' ? null : airs,
                  resumeSeconds === null
                    ? null
                    : say('phone.anEpisode.timeIn', { when: formatDuration(resumeSeconds) }),
                ]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Words>
            </View>
          </View>
        </Button>
      </View>

      {onMarkWatched === undefined ? null : (
        <Button
          tone="bare"
          label={say(isThrough ? 'phone.anEpisode.markUnwatched' : 'phone.anEpisode.markWatched', {
            title: episode.title,
          })}
          onPress={onMarkWatched}
        >
          <View style={styles.about}>
            <Icon
              of={isThrough ? CircleCheckFilled : CircleCheck}
              size={20}
              colour={isThrough ? colours.text : colours.textMuted}
            />
          </View>
        </Button>
      )}

      <Button
        tone="bare"
        label={say('phone.anEpisode.about', { title: episode.title })}
        onPress={onLookAt}
      >
        <View style={styles.about}>
          <Icon of={Info} size={20} colour={colours.textMuted} />
        </View>
      </Button>
    </View>
  );
};

AnEpisode.displayName = 'AnEpisode';

export { AnEpisode };
