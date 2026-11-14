import { ENGLISH } from './ENGLISH';
import type { Language } from './LANGUAGES';

type Spoken = {
  language: Language;
  words: Readonly<Record<string, string>>;
};

const SPOKEN: Spoken = { language: 'en', words: ENGLISH };

export { SPOKEN };
export type { Spoken };
