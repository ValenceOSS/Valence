import { z } from 'zod';

const HEX = /^#[0-9a-f]{6}$/iu;

const BrandSettingsSchema = z.object({
  name: z.string().trim().min(1).max(40).nullable().default(null),
  accent: z.string().regex(HEX).nullable().default(null),
  description: z.string().trim().min(1).max(200).nullable().default(null),
});

const BrandSchema = BrandSettingsSchema.extend({
  logo: z.string().nullable().default(null),
});

const VALENCE_ACCENT = '#3d63dd';

const NO_BRAND: Brand = { name: null, accent: null, description: null, logo: null };

type BrandSettings = z.infer<typeof BrandSettingsSchema>;

type Brand = z.infer<typeof BrandSchema>;

export type { Brand, BrandSettings };

export { BrandSchema, BrandSettingsSchema, NO_BRAND, VALENCE_ACCENT };
