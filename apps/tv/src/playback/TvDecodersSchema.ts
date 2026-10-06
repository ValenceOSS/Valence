import { z } from 'zod';

const TvDecodersSchema = z.object({
  video: z.array(
    z.object({
      codec: z.string().min(1),
      maxLevel: z.number().int().positive().nullable(),
      isTenBit: z.boolean(),
      maxWidth: z.number().int().positive().nullable(),
      maxHeight: z.number().int().positive().nullable(),
    }),
  ),
  audio: z.array(z.string().min(1)),
  passthrough: z.array(z.string().min(1)),
  hdr: z.array(z.enum(['HDR10', 'HLG', 'HDR10Plus', 'DolbyVision'])),
  screen: z
    .object({ width: z.number().int().positive(), height: z.number().int().positive() })
    .nullable(),
});

type TvDecoders = z.infer<typeof TvDecodersSchema>;

export { TvDecodersSchema };
export type { TvDecoders };
