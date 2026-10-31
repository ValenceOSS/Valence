import { z } from 'zod';

const NamesSchema = z.array(z.string()).catch([]);

export { NamesSchema };
