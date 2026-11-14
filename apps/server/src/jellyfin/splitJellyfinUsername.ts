/**
 * Reads the name somebody typed into a Jellyfin app's sign-in: the email address or username of
 * their account, and after a `#` the profile on it they mean to watch as, where they named one.
 *
 * @param typed - What they typed.
 * @returns The account they named and the profile, which is nothing where they named none.
 */
const splitJellyfinUsername = (
  typed: string,
): { identifier: string; profileName: string | null } => {
  const at = typed.indexOf('#');

  if (at === -1) {
    return { identifier: typed.trim(), profileName: null };
  }

  const profileName = typed.slice(at + 1).trim();

  return {
    identifier: typed.slice(0, at).trim(),
    profileName: profileName === '' ? null : profileName,
  };
};

export { splitJellyfinUsername };
