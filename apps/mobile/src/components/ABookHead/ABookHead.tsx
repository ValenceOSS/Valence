import { BookOpen } from '@keyline-icons/react-native';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { ARemotePicture } from '@ValenceMobile/components/ARemotePicture/ARemotePicture';
import { ATitleHead } from '@ValenceMobile/components/ATitleHead/ATitleHead';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import type { ABookHeadProps } from './ABookHead.types';

const COVER_WIDTH = 0.46;

const COVER_AT_MOST_OF_THE_HEIGHT = 0.28;

const styles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    borderRadius: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fills: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  lifted: {
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { height: 14, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
  },
  middle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    paddingTop: 36,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  whole: { height: '100%', width: '100%' },
});

/**
 * The head of a book's page, drawn as a film's is: its cover blurred edge to edge behind, the cover
 * itself standing in the middle, lifted off it, and all of it fading into the page's colour. The
 * cover is a share of the screen's width, but never more than a share of its height, so it stays a
 * cover on the wide inside of a folding phone.
 *
 * @param title - The book's title, for somebody who cannot see the cover.
 * @param cover - Where its cover is, or nothing where it has none.
 * @param ground - The colour the page fades into.
 */
const ABookHead = ({ title, cover, ground }: ABookHeadProps) => {
  const colours = useTheColours();
  const { width, height } = useWindowDimensions();
  const wide = Math.min(width * COVER_WIDTH, height * COVER_AT_MOST_OF_THE_HEIGHT);

  return (
    <ATitleHead
      title={title}
      backdrop={null}
      lettering={null}
      {...(ground === undefined ? {} : { ground })}
      drawn={
        <View style={[styles.whole, { backgroundColor: ground ?? colours.surfaceRaised }]}>
          {cover === null ? null : <ARemotePicture style={styles.fills} uri={cover} blur={40} />}
          <View style={styles.middle}>
            <View style={[styles.lifted, { borderRadius: 10 }]}>
              <View style={[styles.cover, { backgroundColor: colours.surfaceRaised, width: wide }]}>
                {cover === null ? (
                  <Icon of={BookOpen} size={44} colour={colours.textMuted} />
                ) : (
                  <ARemotePicture style={styles.fills} uri={cover} />
                )}
              </View>
            </View>
          </View>
        </View>
      }
    />
  );
};

ABookHead.displayName = 'ABookHead';

export { ABookHead };
