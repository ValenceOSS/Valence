import { useCallback, useEffect, useState } from 'react';
import {
  choosePluginTheme,
  chosenPluginTheme,
  whenPluginThemeChanges,
} from '@ValenceClient/plugins/pluginThemeChoice';

/**
 * Which plugin theme is chosen on this device, and how to choose another.
 *
 * @returns The choice, written as `plugin/theme` or nothing, and the way to change it.
 */
const usePluginThemeChoice = (): {
  choice: string | null;
  choose: (choice: string | null) => void;
} => {
  const [choice, setChoice] = useState(chosenPluginTheme);

  useEffect(() => whenPluginThemeChanges(setChoice), []);

  const choose = useCallback((next: string | null) => {
    choosePluginTheme(next);
  }, []);

  return { choice, choose };
};

export { usePluginThemeChoice };
