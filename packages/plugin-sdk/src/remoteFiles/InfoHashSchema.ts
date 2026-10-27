import { z } from 'zod';

const InfoHashSchema = z
  .string()
  .regex(/^[a-f0-9]{40}$/, 'An info hash is 40 lower-case hex characters');

export { InfoHashSchema };
