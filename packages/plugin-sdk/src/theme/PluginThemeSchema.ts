import { z } from 'zod';
import { readabilityProblemsOf } from './readabilityProblemsOf';
import { ThemeTokensSchema } from './ThemeTokensSchema';

const PluginThemeSchema = z
  .object({
    id: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
    name: z.string().min(1).max(40),
    corners: z.enum(['sharp', 'standard', 'round']).default('standard'),
    dark: ThemeTokensSchema.optional(),
    light: ThemeTokensSchema.optional(),
  })
  .superRefine((theme, context) => {
    if (theme.dark === undefined && theme.light === undefined) {
      context.addIssue({
        code: 'custom',
        message: 'A theme gives a dark scheme, a light one, or both',
      });
    }

    for (const scheme of ['dark', 'light'] as const) {
      const tokens = theme[scheme];

      for (const problem of tokens === undefined ? [] : readabilityProblemsOf(tokens)) {
        context.addIssue({ code: 'custom', path: [scheme], message: problem });
      }
    }
  });

type PluginTheme = z.infer<typeof PluginThemeSchema>;

export type { PluginTheme };

export { PluginThemeSchema };
