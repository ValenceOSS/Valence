import { z } from 'zod';

const RemoteCommandSchema = z.object({
  channel: z.enum(['music', 'book']),
  command: z.enum([
    'play',
    'pause',
    'toggle',
    'next',
    'previous',
    'seek',
    'back',
    'forward',
    'rate',
  ]),
  seconds: z.number().optional(),
});

export { RemoteCommandSchema };
