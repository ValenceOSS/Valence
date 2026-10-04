type ReadsAndWrites<Settings> = {
  read: () => Promise<Settings>;
  write: (patch: Partial<Settings>) => Promise<Settings>;
};

/**
 * Settles whether session cookies are sent only over HTTPS: `COOKIE_SECURE` where the environment
 * sets it, and otherwise what was chosen in setup.
 *
 * The choice is stored at setup and the environment used to be read only once, to seed it, so an
 * operator who changed `COOKIE_SECURE` afterwards changed nothing and was never told: a server set
 * up behind HTTPS kept naming its cookies `__Secure-`, and every browser reaching it over plain HTTP
 * threw them away, so signing in accepted the password and did nothing. Writing the environment's
 * answer into the store keeps the sign-in and the settings page showing the same thing.
 *
 * @param settings - Where the setting is stored.
 * @param fromEnvironment - What `COOKIE_SECURE` says, or undefined where it is not set.
 * @returns The settings, with the cookie setting settled.
 */
const settleCookieSecurity = async <Settings extends { cookieSecure: boolean }>(
  settings: ReadsAndWrites<Settings>,
  fromEnvironment: boolean | undefined,
): Promise<Settings> => {
  const stored = await settings.read();

  if (fromEnvironment === undefined || fromEnvironment === stored.cookieSecure) {
    return stored;
  }

  const patch: Partial<Settings> = {};

  patch.cookieSecure = fromEnvironment;

  return settings.write(patch);
};

export { settleCookieSecurity };
