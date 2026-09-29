import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Check } from '@keyline-icons/react-native/fill';
import { keepPluginTheme } from '@ValenceClient/plugins/keepPluginTheme';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { Button } from '@ValenceTv/components/Button/Button';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ThemeChoiceProps } from './ThemeChoice.types';

const styles = StyleSheet.create({
  choice: { gap: tokens.space.sm },
  heading: { color: tokens.colours.text, fontSize: tokens.type.body, fontWeight: '600' },
  note: { color: tokens.colours.muted, fontSize: tokens.type.small },
  themes: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
});

/**
 * The themes plugins on this server offer, to draw the television in. A television is always dark,
 * so only themes with dark colours are offered. The colours are settled as Valence opens, so a
 * theme chosen here is drawn the next time it does, which the page says.
 *
 * @param onFocus - Told when the remote lands on one of the choices.
 */
const ThemeChoice = ({ onFocus }: ThemeChoiceProps) => {
  const { choice, choose } = usePluginThemeChoice();
  const [openedIn] = useState(choice);
  const contributions = useQuery(pluginQueries.contributions());
  const themes = (contributions.data?.themes ?? []).filter((theme) => theme.dark !== undefined);

  if (themes.length === 0) {
    return null;
  }

  return (
    <View style={styles.choice}>
      <Text style={styles.heading}>Themes from plugins</Text>

      <View style={styles.themes}>
        <Button
          label="Valence"
          variant="secondary"
          {...(choice === null ? { icon: Check } : {})}
          {...(onFocus === undefined ? {} : { onFocus })}
          onPress={() => {
            keepPluginTheme('', null);
            choose(null);
          }}
        />

        {themes.map((theme) => {
          const id = `${theme.pluginId}/${theme.id}`;

          return (
            <Button
              key={id}
              label={theme.name}
              detail={theme.pluginName}
              variant="secondary"
              {...(choice === id ? { icon: Check } : {})}
              {...(onFocus === undefined ? {} : { onFocus })}
              onPress={() => {
                keepPluginTheme(theme.pluginId, theme);
                choose(id);
              }}
            />
          );
        })}
      </View>

      {choice === openedIn ? null : (
        <Text style={styles.note}>Valence opens in this theme the next time you open it.</Text>
      )}
    </View>
  );
};

ThemeChoice.displayName = 'ThemeChoice';

export { ThemeChoice };
