import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';

/**
 * An account's address as a person may see it: the address itself, or nothing where it is only the
 * placeholder an account without an address holds.
 *
 * @param email - The address better-auth keeps.
 * @returns The real address, or null.
 */
const realEmailOf = (email: string): string | null =>
  email.toLowerCase().endsWith(`@${NO_EMAIL_DOMAIN}`) ? null : email;

export { realEmailOf };
