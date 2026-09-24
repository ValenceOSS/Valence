import { useCallback, useMemo } from 'react';
import { StyleSheet, TVFocusGuideView, View } from 'react-native';
import { Image } from 'expo-image';
import { Search } from '@keyline-icons/react-native';
import { Film, Headphones, Home, Monitor, MusicNote } from '@keyline-icons/react-native/fill';
import { Face } from '@ValenceTv/components/Face/Face';
import { Glass } from '@ValenceTv/components/Glass/Glass';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { TabBar } from '@ValenceTv/components/TabBar/TabBar';
import { useReportSpot } from '@ValenceTv/layout/useReportSpot';
import { tokens } from '@ValenceTv/theme/tokens';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { Tab } from '@ValenceTv/navigation/Tab';
import type { TopBarProps } from './TopBar.types';

const TABS: readonly { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'films', label: 'Films', icon: Film },
  { id: 'shows', label: 'Shows', icon: Monitor },
];

const MUSIC: (typeof TABS)[number] = { id: 'music', label: 'Music', icon: MusicNote };

const BOOKS: (typeof TABS)[number] = { id: 'books', label: 'Books', icon: Headphones };

const MARK = { width: 54, height: 40 };

const FACE_SIZE = 52;

const ROUND_SIZE = 60;

/**
 * The bar that floats over the top of every part, as the television's own apps float theirs: a
 * capsule of Liquid Glass over whatever is behind it, holding the way to search, the parts there
 * are, and the face of whoever is watching, which opens their profile. Valence's mark sits apart at
 * the left.
 *
 * Landing on an item opens its part, search included, as the television's own tab bars do. The
 * search screen does not take the remote as it opens; it waits for somebody to press down into it.
 *
 * @param current - The part showing.
 * @param onChoose - Told which part to show.
 * @param profile - Who is watching, whose face ends the capsule.
 * @param itemRef - Handed each of the capsule's items by name — a tab, search or the face — for
 *   anything below to send the remote straight up to the one it belongs under.
 * @param onTabFocus - Told when the remote comes onto a tab and when it leaves one.
 * @param isArriving - Whether the face and the mark are still flying into place, and so not yet
 *   drawn here.
 * @param onFaceAt - Told where the face sits, for it to fly to as somebody signs in.
 * @param onMarkAt - Told where Valence's mark sits, for it to fly to as somebody signs in.
 * @param hasMusic - Whether there is music to listen to, which adds its part to the capsule.
 * @param hasBooks - Whether there are audiobooks to listen to, which adds their part to the capsule.
 */
const TopBar = ({
  current,
  onChoose,
  profile,
  itemRef,
  onTabFocus,
  isArriving,
  onFaceAt,
  onMarkAt,
  hasMusic,
  hasBooks,
}: TopBarProps) => {
  const tabs = useMemo(
    () => [...TABS, ...(hasMusic ? [MUSIC] : []), ...(hasBooks ? [BOOKS] : [])],
    [hasMusic, hasBooks],
  );
  const { ref: holdFace, onLayout: faceLaidOut } = useReportSpot(onFaceAt);
  const { ref: holdMark, onLayout: markLaidOut } = useReportSpot(onMarkAt);
  const searchRef = useCallback(
    (element: View | null) => {
      itemRef('search', element);
    },
    [itemRef],
  );
  const faceRef = useCallback(
    (element: View | null) => {
      itemRef('account', element);
    },
    [itemRef],
  );

  return (
    <View style={styles.bar} pointerEvents="box-none">
      <View
        ref={holdMark}
        collapsable={false}
        style={[styles.mark, isArriving && styles.hidden]}
        onLayout={markLaidOut}
      >
        <Image source={mark} style={MARK} contentFit="contain" />
      </View>

      <Glass cornerRadius={tokens.radii.round} style={styles.glass}>
        <TVFocusGuideView autoFocus style={styles.capsule}>
          <Focusable
            ref={searchRef}
            label="Search"
            scale={1.08}
            onFocus={() => {
              onChoose('search');
            }}
            onPress={() => {
              onChoose('search');
            }}
          >
            {(isFocused) => (
              <View
                style={[
                  styles.round,
                  current === 'search' && styles.current,
                  isFocused && styles.focused,
                ]}
              >
                <Icon
                  of={Search}
                  size={30}
                  colour={isFocused ? tokens.colours.onWhite : tokens.colours.text}
                />
              </View>
            )}
          </Focusable>

          <TabBar
            tabs={tabs}
            current={current}
            onChoose={onChoose}
            isStartingHere
            onFocusChange={onTabFocus}
            itemRef={itemRef}
          />

          {profile === null ? null : (
            <Focusable
              ref={faceRef}
              label={`${profile.name}'s profile`}
              scale={1.08}
              onFocus={() => {
                onChoose('account');
              }}
              onPress={() => {
                onChoose('account');
              }}
            >
              {(isFocused) => (
                <View
                  ref={holdFace}
                  collapsable={false}
                  style={[styles.face, isArriving && styles.hidden]}
                  onLayout={faceLaidOut}
                >
                  <Face profile={profile} size={FACE_SIZE} isFocused={isFocused} isRound />
                </View>
              )}
            </Focusable>
          )}
        </TVFocusGuideView>
      </Glass>
    </View>
  );
};

TopBar.displayName = 'TopBar';

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: tokens.space.md,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mark: { position: 'absolute', left: tokens.space.edge, top: tokens.space.sm },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.xs,
    padding: tokens.space.xs,
  },
  glass: { borderRadius: tokens.radii.round },
  round: {
    width: ROUND_SIZE,
    height: ROUND_SIZE,
    borderRadius: ROUND_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  current: { backgroundColor: 'rgba(255,255,255,0.16)' },
  focused: { backgroundColor: '#ffffff' },
  face: { paddingHorizontal: 4 },
  hidden: { opacity: 0 },
});

export { TopBar };
