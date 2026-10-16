import { z } from 'zod';

const DeviceSessionsSchema = z.array(
  z.object({
    session: z.object({ token: z.string().min(1) }),
    user: z.object({
      id: z.string().min(1),
      name: z.string(),
      email: z.string().nullable().optional(),
      image: z.string().nullable().optional(),
    }),
  }),
);

type AccountHere = { token: string; accountId: string; name: string };

/**
 * Every account signed in on this browser, the one in use among them, so somebody can move between
 * them without signing out and back in.
 *
 * @returns The accounts, or none where the server could not say.
 */
const accountsHere = async (): Promise<AccountHere[]> => {
  const response = await fetch('/api/auth/multi-session/list-device-sessions').catch(() => null);

  if (response === null || !response.ok) {
    return [];
  }

  const read = DeviceSessionsSchema.safeParse(await response.json().catch(() => null));

  return read.success
    ? read.data.map(({ session, user }) => ({
        token: session.token,
        accountId: user.id,
        name: user.name,
      }))
    : [];
};

export type { AccountHere };

export { accountsHere };
