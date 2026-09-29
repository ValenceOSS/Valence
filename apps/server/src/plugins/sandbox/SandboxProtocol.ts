import { z } from 'zod';

const HANDLERS = [
  'describe',
  'page.render',
  'page.act',
  'panel.render',
  'panel.act',
  'schedule',
  'event',
  'accountConnected',
  'upgraded',
] as const;

const ToSandboxSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('load'),
    code: z.string(),
    plugin: z.object({ id: z.string(), version: z.string() }),
    methods: z.array(z.string()),
    memoryBytes: z.number().int().positive(),
    cpuMilliseconds: z.number().int().positive(),
  }),
  z.object({
    type: z.literal('invoke'),
    id: z.number().int(),
    handler: z.enum(HANDLERS),
    args: z.string(),
  }),
  z.object({
    type: z.literal('hostAnswer'),
    id: z.number().int(),
    ok: z.boolean(),
    value: z.string().optional(),
    error: z.string().optional(),
  }),
]);

const FromSandboxSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('loaded') }),
  z.object({ type: z.literal('loadFailed'), problem: z.string() }),
  z.object({
    type: z.literal('hostCall'),
    id: z.number().int(),
    invocation: z.number().int(),
    method: z.string(),
    args: z.string(),
  }),
  z.object({
    type: z.literal('answer'),
    id: z.number().int(),
    ok: z.boolean(),
    value: z.string().optional(),
    error: z.string().optional(),
  }),
  z.object({
    type: z.literal('log'),
    level: z.enum(['info', 'warn', 'error']),
    message: z.string(),
  }),
  z.object({ type: z.literal('stopped'), reason: z.string() }),
]);

type SandboxHandler = (typeof HANDLERS)[number];

type ToSandbox = z.infer<typeof ToSandboxSchema>;

type FromSandbox = z.infer<typeof FromSandboxSchema>;

export type { FromSandbox, SandboxHandler, ToSandbox };

export { FromSandboxSchema, ToSandboxSchema };
