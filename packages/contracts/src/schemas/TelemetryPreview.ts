import { z } from 'zod';
import { TelemetryReportSchema } from './TelemetryReport';

const TELEMETRY_HELD_OFF_REASONS = ['setting', 'environment', 'setup'] as const;

const TelemetryHeldOffReasonSchema = z.enum(TELEMETRY_HELD_OFF_REASONS);

const TelemetryPreviewSchema = z.object({
  isSending: z.boolean(),
  heldOffBy: TelemetryHeldOffReasonSchema.nullable(),
  address: z.string(),
  report: TelemetryReportSchema,
});

const TelemetryInstallIdSchema = z.object({ installId: z.string().uuid() });

type TelemetryHeldOffReason = z.infer<typeof TelemetryHeldOffReasonSchema>;

type TelemetryPreview = z.infer<typeof TelemetryPreviewSchema>;

export type { TelemetryHeldOffReason, TelemetryPreview };

export {
  TELEMETRY_HELD_OFF_REASONS,
  TelemetryHeldOffReasonSchema,
  TelemetryInstallIdSchema,
  TelemetryPreviewSchema,
};
