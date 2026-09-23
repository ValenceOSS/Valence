import { withMainActivity, withMainApplication } from 'expo/config-plugins.js';
import type { ConfigPlugin } from 'expo/config-plugins.js';

const IMPORT = 'import app.valence.tv.screen.TelevisionScreen';

const FOR_THE_ACTIVITY = `
  override fun attachBaseContext(newBase: android.content.Context) {
    super.attachBaseContext(newBase)
    applyOverrideConfiguration(TelevisionScreen.sizedFor(newBase))
  }
`;

const FOR_THE_APPLICATION = `
  override fun attachBaseContext(base: android.content.Context) {
    super.attachBaseContext(TelevisionScreen.sized(base))
  }
`;

/**
 * Adds an import beside a Kotlin file's own, and a member to the class it declares, once.
 *
 * @param source - The file.
 * @param className - The class to add to.
 * @param member - What to add.
 * @returns The file, changed where it had not been already.
 */
const addToClass = (source: string, className: string, member: string): string => {
  if (source.includes('TelevisionScreen')) {
    return source;
  }

  const opening = new RegExp(`class ${className}[^{]*\\{`);
  const withImport = source.replace(/^(package [\w.]+\n)/m, `$1\n${IMPORT}\n`);

  return withImport.replace(opening, (found) => `${found}${member}`);
};

/**
 * Sizes an Android TV's screen 1920 points across, as tvOS's is, by building the application and its
 * activity on a configuration the `valence-tv-screen` module works out from the screen's width. The
 * Kotlin that does it lives in that module; this only calls it from the generated entry points,
 * which are rewritten on every prebuild.
 *
 * @param config - The app's config.
 * @returns The config, with both entry points sized.
 */
const withTelevisionSizedScreen: ConfigPlugin = (config) =>
  withMainApplication(
    withMainActivity(config, (asked) => ({
      ...asked,
      modResults: {
        ...asked.modResults,
        contents: addToClass(asked.modResults.contents, 'MainActivity', FOR_THE_ACTIVITY),
      },
    })),
    (asked) => ({
      ...asked,
      modResults: {
        ...asked.modResults,
        contents: addToClass(asked.modResults.contents, 'MainApplication', FOR_THE_APPLICATION),
      },
    }),
  );

export { withTelevisionSizedScreen };
