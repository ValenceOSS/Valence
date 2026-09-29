import { z } from 'zod';

const HexColourSchema = z
  .string()
  .regex(/^#[0-9a-f]{6}$/, 'A theme colour is six lower-case hex digits after a hash');

export { HexColourSchema };
