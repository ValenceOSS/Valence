import { NO_EMAIL_DOMAIN } from '@ValenceContracts/constants/NO_EMAIL_DOMAIN';

/**
 * The placeholder address an account without a real one holds, which better-auth insists on and
 * nobody ever sees.
 *
 * @param userId - The account it stands in for.
 * @returns The placeholder.
 */
const placeholderEmailOf = (userId: string): string => `${userId}@${NO_EMAIL_DOMAIN}`;

export { placeholderEmailOf };
