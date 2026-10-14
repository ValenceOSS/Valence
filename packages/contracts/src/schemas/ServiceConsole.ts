import { z } from 'zod';

const ConsoleLineSchema = z.object({
  atMs: z.number().int().nonnegative(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
});

const ServiceConsoleSchema = z.object({
  lines: z.array(ConsoleLineSchema),
});

type ConsoleLine = z.infer<typeof ConsoleLineSchema>;

type ServiceConsole = z.infer<typeof ServiceConsoleSchema>;

export type { ConsoleLine, ServiceConsole };

export { ConsoleLineSchema, ServiceConsoleSchema };
