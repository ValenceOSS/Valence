import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { keepPluginTheme } from '@ValenceClient/plugins/keepPluginTheme';
import { usePluginThemeChoice } from '@ValenceClient/plugins/usePluginThemeChoice';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';

/**
 * Keeps the colours of the plugin theme chosen on this phone in step with what the server offers: a
 * plugin that updates its theme is drawn in the new colours, and a theme whose plugin was turned off
 * or removed is let go, so the phone goes back to Valence's own. A server that could not be asked
 * changes nothing.
 */
const usePluginThemeInStep = (): void => {
  const { choice, choose } = usePluginThemeChoice();
  const contributions = useQuery(pluginQueries.contributions());
  const themes = contributions.data?.themes;

  useEffect(() => {
    if (choice === null || themes === undefined) {
      return;
    }

    const offered = themes.find((theme) => `${theme.pluginId}/${theme.id}` === choice);

    if (offered === undefined) {
      keepPluginTheme('', null);
      choose(null);

      return;
    }

    keepPluginTheme(offered.pluginId, offered);
  }, [choice, choose, themes]);
};

export { usePluginThemeInStep };
