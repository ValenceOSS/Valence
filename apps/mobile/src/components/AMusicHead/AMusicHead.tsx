import { Shuffle } from '@keyline-icons/react-native';
import { Children } from 'react';
import { StyleSheet, View } from 'react-native';
import { APlayButton } from '@ValenceMobile/components/APlayButton/APlayButton';
import { ARising } from '@ValenceMobile/components/ARising/ARising';
import { Words } from '@ValenceMobile/components/Words/Words';
import type { AMusicHeadProps } from './AMusicHead.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-evenly' },
  said: { alignItems: 'center', gap: 6 },
  whole: { gap: 18 },
});

/**
 * What sits beneath the cover of an album's, an artist's, a playlist's, a mix's or liked songs'
 * page, as a title's page has it: what kind of thing it is and a line about it, one wide button
 * to play it with shuffling it joined to its end as a split button does, and round buttons
 * beneath for whatever else there is to do with it.
 *
 * @param kind - What kind of thing it is.
 * @param detail - A line about it, where there is one.
 * @param about - What its owner wrote about it, where they did.
 * @param canPlay - Whether there is anything to play.
 * @param onPlay - Told to play it from the start.
 * @param onShuffle - Told to play it shuffled.
 * @param children - The round buttons beneath, each an `ARoundAction` or one drawn as one.
 */
const AMusicHead = ({
  kind,
  detail,
  about = null,
  canPlay,
  onPlay,
  onShuffle,
  children,
}: AMusicHeadProps) => (
  <View style={styles.whole}>
    <ARising>
      <View style={styles.said}>
        <Words size="lead" tone="muted" isCentred>
          {[kind, detail].filter((part) => part !== null && part !== '').join(' · ')}
        </Words>
        {about === null ? null : (
          <Words tone="muted" isCentred lines={3}>
            {about}
          </Words>
        )}
      </View>
    </ARising>

    {canPlay ? (
      <ARising turn={1}>
        <APlayButton
          says={say('common.play')}
          onPress={onPlay}
          aside={{ icon: Shuffle, label: say('common.shuffle'), onPress: onShuffle }}
        />
      </ARising>
    ) : null}

    {Children.count(children) === 0 ? null : (
      <ARising turn={2}>
        <View style={styles.actions}>{children}</View>
      </ARising>
    )}
  </View>
);

AMusicHead.displayName = 'AMusicHead';

export { AMusicHead };
