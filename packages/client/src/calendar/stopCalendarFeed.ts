/**
 * Turns off the link to the release calendar, so calendar apps can no longer read it.
 *
 * @returns Whether it was turned off.
 */
const stopCalendarFeed = async (): Promise<boolean> => {
  const response = await fetch('/api/calendar/feed', {
    method: 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response !== null && response.ok;
};

export { stopCalendarFeed };
