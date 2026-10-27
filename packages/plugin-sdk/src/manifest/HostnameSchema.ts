import { z } from 'zod';

const HostnameSchema = z
  .string()
  .max(253)
  .regex(
    /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/,
    'A host is written out in full, in lower case, with no scheme, port, path or wildcard',
  )
  .refine(
    (host) => /[a-z]/.test(host.slice(host.lastIndexOf('.') + 1)),
    'A host is a name, not an address written as numbers',
  );

type Hostname = z.infer<typeof HostnameSchema>;

export type { Hostname };

export { HostnameSchema };
