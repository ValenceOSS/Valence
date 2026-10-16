import { z } from 'zod';

const SurroundingsSchema = z.enum(['host', 'container', 'virtualMachine']);

const CoreGroupSchema = z.object({
  kind: z.enum(['performance', 'efficiency', 'other']),
  name: z.string().nullable(),
  cores: z.array(z.array(z.number().int().nonnegative())),
});

const ProcessorSchema = z.object({
  model: z.string(),
  cores: z.number().int().positive().nullable(),
  threads: z.number().int().nonnegative(),
  speedMhz: z.number().int().nonnegative().nullable(),
  groups: z.array(CoreGroupSchema).default([]),
});

const MemoryModuleSchema = z.object({
  sizeBytes: z.number().nonnegative().nullable(),
  kind: z.string().nullable(),
  speedMts: z.number().int().nonnegative().nullable(),
  manufacturer: z.string().nullable(),
  slot: z.string().nullable(),
});

const DriveSchema = z.object({
  name: z.string(),
  model: z.string().nullable(),
  kind: z.enum(['ssd', 'hdd', 'unknown']),
  connection: z.string().nullable(),
  totalBytes: z.number().nonnegative(),
});

const HardwareSchema = z.object({
  surroundings: SurroundingsSchema,
  processor: ProcessorSchema.nullable(),
  memory: z.object({
    totalBytes: z.number().nonnegative(),
    modules: z.array(MemoryModuleSchema),
  }),
  drives: z.array(DriveSchema),
});

type Hardware = z.infer<typeof HardwareSchema>;
type Drive = z.infer<typeof DriveSchema>;
type CoreGroup = z.infer<typeof CoreGroupSchema>;
type MemoryModule = z.infer<typeof MemoryModuleSchema>;

export type { Hardware, Drive, MemoryModule, CoreGroup };

export { HardwareSchema };
