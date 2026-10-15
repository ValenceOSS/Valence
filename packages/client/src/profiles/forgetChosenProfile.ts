/**
 * Locks this device's profile, so whoever picks it up next has to choose who is watching again —
 * with a PIN, where that profile has one.
 *
 * @returns Whether the server heard.
 */
const forgetChosenProfile = async (): Promise<boolean> => {
  const response = await fetch('/api/profiles/chosen', { method: 'DELETE' }).catch(() => null);

  return response !== null && response.ok;
};

export { forgetChosenProfile };
