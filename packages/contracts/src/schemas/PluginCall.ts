import { z } from 'zod';
import { SaidSchema } from '@ValenceI18n/SaidSchema';
import { JsonValueSchema } from './JsonValue';

const PLUGIN_CALL_METHODS = ['test', 'add', 'status', 'files', 'remove'] as const;

const PluginCallSchema = z.object({
  id: z.uuid(),
  pluginId: z.string().min(1).max(64),
  clientId: z.string().min(1).max(40),
  method: z.enum(PLUGIN_CALL_METHODS),
  ask: JsonValueSchema,
});

const PluginCallAnswerSchema = z.discriminatedUnion('ok', [
  z.object({
    ok: z.literal(true),
    value: JsonValueSchema,
    linkHosts: z.array(z.string().max(255)).max(20),
  }),
  z.object({ ok: z.literal(false), problem: SaidSchema }),
]);

type PluginCall = z.infer<typeof PluginCallSchema>;

type PluginCallMethod = PluginCall['method'];

type PluginCallAnswer = z.infer<typeof PluginCallAnswerSchema>;

export type { PluginCall, PluginCallAnswer, PluginCallMethod };

export { PLUGIN_CALL_METHODS, PluginCallAnswerSchema, PluginCallSchema };
