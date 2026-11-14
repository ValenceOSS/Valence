const LANGUAGES = [
  'en',
  'ar',
  'be',
  'cs',
  'da',
  'de',
  'el',
  'es',
  'eu',
  'fi',
  'fr',
  'he',
  'it',
  'ja',
  'ko',
  'nb',
  'nl',
  'pl',
  'pt-BR',
  'pt-PT',
  'ro',
  'ru',
  'sk',
  'sv',
  'tr',
  'uk',
  'vi',
  'zh-Hans',
  'zh-Hant',
] as const;

type Language = (typeof LANGUAGES)[number];

export { LANGUAGES };
export type { Language };
