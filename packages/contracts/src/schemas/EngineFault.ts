import { z } from 'zod';

const ENGINE_FAULT_STAGES = [
  'opening',
  'decoding',
  'drawing',
  'refused',
  'repackaging',
  'seeking',
] as const;

const EngineFaultSchema = z.object({
  stage: z.enum(ENGINE_FAULT_STAGES),
  detail: z.string().max(300).nullable(),
});

type EngineFault = z.infer<typeof EngineFaultSchema>;

export type { EngineFault };

export { ENGINE_FAULT_STAGES, EngineFaultSchema };
