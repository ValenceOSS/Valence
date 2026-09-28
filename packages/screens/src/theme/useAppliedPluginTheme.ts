import { useLayoutEffect, useMemo, useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ROUNDNESS_SCALES } from '@ValenceContracts/schemas/Roundness';
import { useOfflineMode } from '@ValenceClient/offline/useOfflineMode';
import { pluginThemeProperties } from '@ValenceClient/plugins/pluginThemeProperties';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import { appearanceQueries } from '@ValenceClient/query/appearanceQueries';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { useTheme } from '@ValenceClient/shell/useTheme';
import { applyPluginTheme } from '@ValenceScreens/theme/applyPluginTheme';

const DARK = '(prefers-color-scheme: dark)';

/**
 * Follows whether the machine asks for dark, for a theme that follows the machine.
 *
 * @param onChange - Told when it changes.
 * @returns A way to stop following.
 */
const followScheme = (onChange: () => void): (() => void) => {
  const query = window.matchMedia(DARK);

  query.addEventListener('change', onChange);

  return () => {
    query.removeEventListener('change', onChange);
  };
};

/**
 * Keeps a plugin theme somebody chose on this device on the document, in the scheme in force: dark
 * or light as they chose, or as the machine asks where they follow it. A plugin that has been turned
 * off or removed, or a theme with no colours for the scheme in force, simply leaves Valence's own
 * colours in place, and the server's corners come back with them.
 */
const useAppliedPluginTheme = (): void => {
  const { isOffline } = useOfflineMode();
  const { choice } = usePluginThemeChoice();
  const { theme } = useTheme();
  const machineIsDark = useSyncExternalStore(followScheme, () => window.matchMedia(DARK).matches);
  const asked = useQuery({
    ...pluginQueries.contributions(),
    enabled: !isOffline && choice !== null,
  });
  const appearance = useQuery({ ...appearanceQueries.appearance(), enabled: !isOffline });
  const roundness = appearance.data?.roundness ?? 'default';
  const scheme = theme === 'system' ? (machineIsDark ? 'dark' : 'light') : theme;
  const chosen =
    choice === null
      ? undefined
      : asked.data?.themes.find((each) => `${each.pluginId}/${each.id}` === choice);
  const properties = useMemo(
    () => (chosen === undefined ? null : pluginThemeProperties(chosen, scheme)),
    [chosen, scheme],
  );

  useLayoutEffect(() => {
    applyPluginTheme(properties);

    if (properties === null) {
      document.documentElement.style.setProperty(
        '--radius-scale',
        ROUNDNESS_SCALES[roundness].toString(),
      );
    }
  }, [properties, roundness]);
};

export { useAppliedPluginTheme };
