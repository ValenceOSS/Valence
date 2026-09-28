import { z } from 'zod';
import { ThemeTokensSchema } from '@ValenceSDK/theme/ThemeTokensSchema';

const KeptPluginThemeSchema = z.object({
  choice: z.string(),
  corners: z.enum(['sharp', 'standard', 'round']),
  dark: ThemeTokensSchema.optional(),
  light: ThemeTokensSchema.optional(),
});

type KeptPluginTheme = z.infer<typeof KeptPluginThemeSchema>;

export type { KeptPluginTheme };

export { KeptPluginThemeSchema };
