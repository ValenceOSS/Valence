import { z } from 'zod';

const PhoneHandBackSchema = z.object({ url: z.string() });

type PhoneHandBack = z.infer<typeof PhoneHandBackSchema>;

export type { PhoneHandBack };

export { PhoneHandBackSchema };
