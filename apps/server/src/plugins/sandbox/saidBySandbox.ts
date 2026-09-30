import type { SandboxWords } from '@ValenceServer/plugins/sandbox/SandboxProtocol';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';

/**
 * Puts what a plugin's process reported into words: the plugin's own where it threw them, and
 * Valence's where the plugin gave none or never got as far as saying anything.
 *
 * @param words - What the process reported.
 */
const saidBySandbox = (words: SandboxWords): Said => {
  switch (words.kind) {
    case 'thrown':
      return sayVerbatim(words.text);
    case 'failed':
      return saying('server.sandbox.thePluginFailed');
    case 'neverDefined':
      return saying('server.sandbox.neverCalledDefinePlugin');
    case 'notLoaded':
      return saying('server.sandbox.notLoaded');
  }
};

export { saidBySandbox };
