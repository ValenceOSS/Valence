import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { say } from '@ValenceI18n/say';
import { FocusGuide } from '@ValenceTv/components/FocusGuide/FocusGuide';

type TopTab = { id: Tab; label: string; icon: typeof Home };

const HOME: TopTab = { id: 'home', label: say('common.home'), icon: Home };

const FILMS: TopTab = { id: 'films', label: say('common.films'), icon: Film };

const SHOWS: TopTab = { id: 'shows', label: say('common.shows'), icon: Monitor };

const MUSIC: TopTab = { id: 'music', label: say('common.music'), icon: MusicNote };

const BOOKS: TopTab = { id: 'books', label: say('common.books'), icon: Headphones };

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
 * @param hasFilms - Whether there are films to watch, which adds their part to the capsule.
 * @param hasShows - Whether there are programmes to watch, which adds their part to the capsule.
 * @param hasMusic - Whether there is music to listen to, which adds its part to the capsule.
 * @param hasBooks - Whether there are audiobooks to listen to, which adds their part to the capsule.
 * @param rightOfTheBar - What sits to the right of the bar — the song or book playing — for pressing
 *   right from the face to go to; with nothing there the remote stays on the face, rather than
 *   dropping onto whatever on the page below lies furthest right.
 * @param downFromTheBar - Where pressing down from anything on the bar goes, such as the front
 *   page's Play button, which may have scrolled out of sight above the page's first shelf.
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
  hasFilms,
  hasShows,
  hasMusic,
  hasBooks,
  rightOfTheBar,
  downFromTheBar,
}: TopBarProps) => {
  const down =
    downFromTheBar === undefined || downFromTheBar === null
      ? {}
      : { nextFocusDown: downFromTheBar };
  const [face, setFace] = useState<View | null>(null);
  const tabs = useMemo(
    () => [
      HOME,
      ...(hasFilms ? [FILMS] : []),
      ...(hasShows ? [SHOWS] : []),
      ...(hasMusic ? [MUSIC] : []),
      ...(hasBooks ? [BOOKS] : []),
    ],
    [hasFilms, hasShows, hasMusic, hasBooks],
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
      setFace(element);
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
        <FocusGuide isRemembering style={styles.capsule}>
          <Focusable
            ref={searchRef}
            {...down}
            label={say('common.search')}
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
            downTo={downFromTheBar ?? null}
          />

          {profile === null ? null : (
            <Focusable
              ref={faceRef}
              nextFocusRight={rightOfTheBar ?? face}
              {...down}
              label={say('tv.topBar.nameSProfile', { name: profile.name })}
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
        </FocusGuide>
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
  current: { backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: ROUND_SIZE / 2 },
  focused: { backgroundColor: '#ffffff', borderRadius: ROUND_SIZE / 2 },
  face: { paddingHorizontal: 4 },
  hidden: { opacity: 0 },
});

export { TopBar };
