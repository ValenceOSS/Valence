import { z } from 'zod';

const HardwareTestReportSchema = z.object({
  accel: z.string(),
  encoder: z.string(),
  decodesOnDevice: z.boolean().nullable(),
  encodesOnDevice: z.boolean(),
  speed: z.number().nonnegative().nullable(),
  softwareSpeed: z.number().nonnegative().nullable(),
  reason: z.string().nullable(),
});

type HardwareTestReport = z.infer<typeof HardwareTestReportSchema>;

export type { HardwareTestReport };

export { HardwareTestReportSchema };
