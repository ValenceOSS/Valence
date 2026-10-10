import type { Browser } from '@ValenceCore/functions/Browser';
import { say } from '@ValenceI18n/say';

const BROWSER_NAMES: Readonly<Record<Browser, string>> = {
  chrome: say('common.chrome'),
  chromium: say('common.chromium'),
  edge: say('common.edge'),
  opera: say('common.opera'),
  brave: say('common.brave'),
  vivaldi: say('common.vivaldi'),
  samsungInternet: say('common.samsungInternet'),
  yandex: say('common.yandexBrowser'),
  firefox: say('common.firefox'),
  safari: say('common.safari'),
};

export { BROWSER_NAMES };
