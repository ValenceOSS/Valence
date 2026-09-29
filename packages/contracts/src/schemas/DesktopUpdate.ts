import { z } from 'zod';

const DesktopUpdateSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  z.object({ kind: z.literal('available'), version: z.string() }),
  z.object({
    kind: z.literal('downloading'),
    version: z.string(),
    percent: z.number().min(0).max(100),
  }),
  z.object({ kind: z.literal('failed'), version: z.string() }),
]);

export type DesktopUpdate = z.infer<typeof DesktopUpdateSchema>;
export { DesktopUpdateSchema };
