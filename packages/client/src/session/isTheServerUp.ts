/**
 * Whether the server answers at all, asked of its health check, which needs no sign-in. A player
 * waiting out a restart asks this rather than asking for a session over and over, which would each
 * count against the account's streams once the server is back.
 *
 * @returns Whether it answered.
 */
const isTheServerUp = async (): Promise<boolean> => {
  const answer = await fetch('/api/health', { cache: 'no-store' }).catch(() => null);

  return answer?.ok === true;
};

export { isTheServerUp };
