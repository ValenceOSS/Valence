import { StyleSheet, Text, View } from 'react-native';
import { Focusable } from '@ValenceTv/components/Focusable/Focusable';
import { Icon } from '@ValenceTv/components/Icon/Icon';
import { tokens } from '@ValenceTv/theme/tokens';
import { say } from '@ValenceI18n/say';
import type { ServerCardProps } from './ServerCard.types';

const TILE = { width: 320, height: 300 };

const BADGE = 110;

/**
 * One choice on the way in, as a tile in a row the way the faces are: a large icon for how it was
 * found — heard on the network, used before, or an address to type — its name, and beneath it its
 * address, with a green dot for one that answered on the network just now. The tile lifts and
 * lights white while the remote is on it.
 *
 * @param name - What the server calls itself, or its address where that is all there is.
 * @param address - Its address, written beneath the name, or nothing where the name says it all.
 * @param icon - How it was found.
 * @param isAvailable - Whether it answered on the network just now.
 * @param isDisabled - Whether it can be chosen at the moment.
 * @param hasPreferredFocus - Whether the remote starts here.
 * @param onPress - Told when it is chosen.
 */
const ServerCard = ({
  name,
  address,
  icon,
  isAvailable = false,
  isDisabled = false,
  hasPreferredFocus = false,
  onPress,
}: ServerCardProps) => (
  <Focusable
    label={address === null ? name : `${name}, ${address}`}
    scale={1.06}
    shadow={{ height: TILE.height, cornerRadius: tokens.radii.xxl }}
    isDisabled={isDisabled}
    hasPreferredFocus={hasPreferredFocus}
    onPress={onPress}
  >
    {(isFocused) => {
      const ink = isFocused ? tokens.colours.onWhite : tokens.colours.text;
      const quiet = isFocused ? tokens.colours.onWhite : tokens.colours.muted;

      return (
        <View style={[styles.tile, TILE, isFocused && styles.focused]}>
          <View style={[styles.badge, isFocused && styles.badgeFocused]}>
            <Icon of={icon} size={52} colour={ink} />
          </View>

          <View style={styles.words}>
            <Text numberOfLines={1} style={[styles.name, { color: ink }]}>
              {name}
            </Text>

            {address === null && !isAvailable ? null : (
              <View style={styles.detail}>
                {isAvailable ? <View style={styles.dot} /> : null}
                <Text numberOfLines={1} style={[styles.address, { color: quiet }]}>
                  {address ?? say('tv.serverCard.available')}
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }}
  </Focusable>
);

ServerCard.displayName = 'ServerCard';

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.space.md,
    padding: tokens.space.md,
    borderRadius: tokens.radii.xxl,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  focused: { backgroundColor: '#ffffff', borderColor: '#ffffff' },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeFocused: { backgroundColor: 'rgba(0,0,0,0.07)' },
  words: { alignItems: 'center', gap: 6, alignSelf: 'stretch' },
  name: { fontSize: tokens.type.body, fontWeight: '700' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.xs },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: tokens.colours.success },
  address: { fontSize: tokens.type.small - 2 },
});

export { ServerCard };
