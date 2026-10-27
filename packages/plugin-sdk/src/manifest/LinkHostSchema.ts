import { z } from 'zod';
import { HostnameSchema } from './HostnameSchema';

const LinkHostSchema = z.union([
  HostnameSchema,
  z
    .string()
    .max(255)
    .regex(
      /^\*\.(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
      'A pattern is *. and then a host of at least two parts, in lower case',
    )
    .refine(
      (host) => /[a-z]/.test(host.slice(host.lastIndexOf('.') + 1)),
      'A pattern ends in a name, not in numbers',
    ),
]);

type LinkHost = z.infer<typeof LinkHostSchema>;

export type { LinkHost };

export { LinkHostSchema };
