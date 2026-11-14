import { z } from 'zod';
import { LANGUAGES } from '@ValenceI18n/LANGUAGES';

const SpokenLanguageSchema = z.enum(LANGUAGES);

const LanguagesInUseSchema = z.object({
  server: SpokenLanguageSchema.nullable(),
  profile: SpokenLanguageSchema.nullable(),
});

type LanguagesInUse = z.infer<typeof LanguagesInUseSchema>;

export type { LanguagesInUse };

export { LanguagesInUseSchema, SpokenLanguageSchema };
