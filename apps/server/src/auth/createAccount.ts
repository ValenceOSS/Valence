import { APIError } from 'better-auth/api';

type CreatesUsers = {
  api: {
    createUser: (request: { body: { name: string; email: string; password: string } }) => Promise<{
      user: { id: string; name: string; email: string; createdAt: Date };
    }>;
  };
};

type CreatedAccount = { id: string; name: string; email: string; createdAt: string };

type AccountCreation =
  | { kind: 'created'; account: CreatedAccount }
  | { kind: 'taken' }
  | { kind: 'failed'; reason: string };

const ADDRESS_TAKEN = 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL';

/**
 * Makes an account on somebody else's behalf, as an administrator adding a person or a profile being
 * given an account of its own: it signs nobody in, and answers with the account it made, its address
 * folded to lower case as better-auth keeps it, or says whether the address was taken or something
 * else went wrong.
 *
 * @param auth - The authentication layer, whose admin plugin makes the account.
 * @param request - The name, address and password.
 * @returns What happened.
 */
const createAccount = async (
  auth: CreatesUsers,
  request: { name: string; email: string; password: string },
): Promise<AccountCreation> => {
  try {
    const { user } = await auth.api.createUser({ body: request });

    return {
      kind: 'created',
      account: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      },
    };
  } catch (error) {
    if (error instanceof APIError && error.body?.code === ADDRESS_TAKEN) {
      return { kind: 'taken' };
    }

    return { kind: 'failed', reason: error instanceof Error ? error.message : String(error) };
  }
};

export type { AccountCreation, CreatedAccount };

export { createAccount };
