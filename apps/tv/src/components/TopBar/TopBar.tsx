import { StyleSheet, TVFocusGuideView, View } from 'react-native';
import { Image } from 'expo-image';
import { Search } from '@keyline-icons/react';
import { Film, Home, Monitor } from '@keyline-icons/react/fill';
import { Face } from '@ValenceTv/components/Face/Face';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { TabBar } from '@ValenceTv/components/TabBar/TabBar';
import { tokens } from '@ValenceTv/theme/tokens';
import mark from '@ValenceTv/assets/valence-mark.png';
import type { Tab } from '@ValenceTv/navigation/Tab';
import type { TopBarProps } from './TopBar.types';

const TABS: readonly { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'films', label: 'Films', icon: Film },
  { id: 'shows', label: 'Shows', icon: Monitor },
];

const MARK = { width: 54, height: 40 };

const FACE_SIZE = 52;

const ROUND_SIZE = 60;

/**
 * The bar that floats over the top of every part, as the television's own apps float theirs: a
 * capsule over whatever is behind it, holding the way to search, the parts there are, and the face
 * of whoever is watching, which opens their profile. Valence's mark sits apart at the left.
 *
 * @param current - The part showing.
 * @param onChoose - Told which part the remote moved to.
 * @param profile - Who is watching, whose face ends the capsule.
 * @param capsuleRef - Handed the capsule, for a screen that has to send the remote back up to it.
 * @param onInBar - Told when the remote comes into the capsule and when it leaves.
 */
const TopBar = ({ current, onChoose, profile, capsuleRef, onInBar }: TopBarProps) => (
  <View style={styles.bar} pointerEvents="box-none">
    <Image source={mark} style={[MARK, styles.mark]} contentFit="contain" />

    <TVFocusGuideView ref={capsuleRef} autoFocus style={styles.capsule}>
      <Focusable
        label="Search"
        scale={1.08}
        onFocus={() => {
          onChoose('search');
          onInBar(true);
        }}
        onBlur={() => {
          onInBar(false);
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
        tabs={TABS}
        current={current}
        onChoose={onChoose}
        isStartingHere
        onFocusChange={onInBar}
      />

      {profile === null ? null : (
        <Focusable
          label={`${profile.name}'s profile`}
          scale={1.08}
          onFocus={() => {
            onChoose('account');
            onInBar(true);
          }}
          onBlur={() => {
            onInBar(false);
          }}
          onPress={() => {
            onChoose('account');
          }}
        >
          {(isFocused) => (
            <View style={styles.face}>
              <Face profile={profile} size={FACE_SIZE} isFocused={isFocused} isRound />
            </View>
          )}
        </Focusable>
      )}
    </TVFocusGuideView>
  </View>
);

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
    borderRadius: tokens.radii.round,
    backgroundColor: 'rgba(24,24,24,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
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
});

export { TopBar };
