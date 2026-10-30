import { ChevronRight } from '@keyline-icons/react-native/fill';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@ValenceMobile/components/Button/Button';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { APlayerPanel } from '@ValenceMobile/components/Watching/components/APlayerPanel/APlayerPanel';
import { PLAYER_LOOK } from '@ValenceMobile/components/Watching/PLAYER_LOOK';
import { FONTS } from '@ValenceMobile/theme/FONTS';
import type { TheSettingsProps } from './TheSettings.types';
import { say } from '@ValenceI18n/say';

const { colours } = PLAYER_LOOK;

const styles = StyleSheet.create({
  label: { color: colours.text, flex: 1, fontFamily: FONTS.sans.semibold, fontSize: 17 },
  list: { paddingTop: 10 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 16, paddingVertical: 14 },
  value: {
    color: colours.quiet,
    fontFamily: FONTS.sans.medium,
    fontSize: 15,
    maxWidth: '45%',
    textAlign: 'right',
  },
});

/**
 * The player's settings on one card in the middle of the picture, as the big streaming apps keep
 * them behind a single button: a row for each — the quality, the speed, the sound and subtitles,
 * how the subtitles look — with its icon, what it is, what it is set to now, and a chevron saying it
 * opens a card of its own.
 *
 * @param settings - Each row: its icon, its name, what it is set to, and what opening it does.
 * @param onClose - Told to put the card away.
 */
const TheSettings = ({ settings, onClose }: TheSettingsProps) => (
  <APlayerPanel label={say('common.settings')} onClose={onClose} isACard>
    <Text style={PLAYER_LOOK.styles.heading}>{say('common.settings')}</Text>

    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
      {settings.map((setting) => (
        <Button key={setting.label} tone="bare" label={setting.label} onPress={setting.onPress}>
          <View style={styles.row}>
            <Icon of={setting.icon} size={24} colour={colours.text} />
            <Text style={styles.label} numberOfLines={1}>
              {setting.label}
            </Text>
            {setting.value === undefined ? null : (
              <Text style={styles.value} numberOfLines={1}>
                {setting.value}
              </Text>
            )}
            <Icon of={ChevronRight} size={18} colour={colours.quiet} />
          </View>
        </Button>
      ))}
    </ScrollView>
  </APlayerPanel>
);

TheSettings.displayName = 'TheSettings';

export { TheSettings };
