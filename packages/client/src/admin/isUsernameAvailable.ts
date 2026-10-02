import { z } from 'zod';

const AvailabilitySchema = z.object({ isAvailable: z.boolean() });

/**
 * Asks whether a username is free for an account to take, counting the account's own as free.
 *
 * @param username - The username wanted.
 * @param userId - The account that would take it, when it exists already.
 * @returns Whether it is free, or null when the server could not say.
 */
const isUsernameAvailable = async (username: string, userId?: string): Promise<boolean | null> => {
  const query = new URLSearchParams({ username, ...(userId === undefined ? {} : { userId }) });
  const response = await fetch(`/api/admin/accounts/username-available?${query.toString()}`, {
    credentials: 'same-origin',
  }).catch(() => null);

  if (response === null || !response.ok) {
    return null;
  }

  const read = AvailabilitySchema.safeParse(await response.json().catch(() => null));

  return read.success ? read.data.isAvailable : null;
};

export { isUsernameAvailable };
