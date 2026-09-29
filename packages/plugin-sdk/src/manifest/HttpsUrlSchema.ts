import { z } from 'zod';

const HttpsUrlSchema = z.url({ protocol: /^https$/, hostname: z.regexes.domain }).max(2000);

export { HttpsUrlSchema };
