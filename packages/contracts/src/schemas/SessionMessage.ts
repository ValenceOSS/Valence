import { z } from 'zod';

const SESSION_MESSAGE_MAX_LENGTH = 140;

const SessionMessageSchema = z.object({
  text: z.string().trim().min(1).max(SESSION_MESSAGE_MAX_LENGTH),
});

export { SessionMessageSchema, SESSION_MESSAGE_MAX_LENGTH };
