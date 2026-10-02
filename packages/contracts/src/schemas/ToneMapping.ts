import { z } from 'zod';

const TONE_MAPPINGS = ['tonemapx', 'libplacebo', 'zscale', 'unavailable'] as const;

const ToneMappingSchema = z.enum(TONE_MAPPINGS);

type ToneMapping = z.infer<typeof ToneMappingSchema>;

export type { ToneMapping };

export { TONE_MAPPINGS, ToneMappingSchema };
