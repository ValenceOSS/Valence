const LANGUAGES = [
  'en',
  'ar',
  'cs',
  'da',
  'de',
  'es',
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
  'ru',
  'sv',
  'tr',
  'uk',
  'zh-Hans',
  'zh-Hant',
] as const;

type Language = (typeof LANGUAGES)[number];

export { LANGUAGES };
export type { Language };
