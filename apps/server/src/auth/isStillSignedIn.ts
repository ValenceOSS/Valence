type ReadsSessions = {
  api: {
    getSession: (options: {
      headers: Headers;
      query: { disableRefresh: boolean };
    }) => Promise<{ user: { id: string } } | null>;
  };
};

/**
 * Whether what a long-lived connection carried when it opened still signs in the same account,
 * asked afresh, so a connection does not outlive a sign-out, a revoked session, an expired one or a
 * revoked key, without sliding the session's expiry. A sign-in that cannot be read at all is given
 * the benefit of the doubt, so a busy database does not drop everybody's connection.
 *
 * @param auth - The sign-in service.
 * @param headers - What the connection carried when it opened.
 * @param accountId - Whose connection it is.
 * @returns Whether it may stay open.
 */
const isStillSignedIn = (
  auth: ReadsSessions,
  headers: Headers,
  accountId: string,
): Promise<boolean> =>
  auth.api.getSession({ headers, query: { disableRefresh: true } }).then(
    (signedIn) => signedIn?.user.id === accountId,
    () => true,
  );

export { isStillSignedIn };
