import { z } from 'zod';

const WAY_IN_MESSAGE_LIMIT = 400;

const WayInMessageSchema = z.object({
  text: z.string().trim().min(1).max(WAY_IN_MESSAGE_LIMIT),
  colour: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/u)
    .nullable()
    .default(null),
});

type WayInMessage = z.infer<typeof WayInMessageSchema>;

export type { WayInMessage };

export { WAY_IN_MESSAGE_LIMIT, WayInMessageSchema };
