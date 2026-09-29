import { z } from 'zod';
import { HexColourSchema } from './HexColourSchema';

const ThemeTokensSchema = z.object({
  accent: HexColourSchema,
  accentContrast: HexColourSchema,
  surface: HexColourSchema,
  surfaceRaised: HexColourSchema,
  text: HexColourSchema,
  textMuted: HexColourSchema,
  border: HexColourSchema,
  danger: HexColourSchema,
  highlight: HexColourSchema,
  success: HexColourSchema,
});

type ThemeTokens = z.infer<typeof ThemeTokensSchema>;

export type { ThemeTokens };

export { ThemeTokensSchema };
