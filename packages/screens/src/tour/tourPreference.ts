const STORAGE_KEY = 'valence.tourSeenBy';

/**
 * Reads who has been shown the welcome tour on this device. Held on the device rather than on the
 * account: the tour is about finding around a screen, and somebody on a second device is as new to
 * it there as they were on the first.
 *
 * @returns The ids of the accounts that have seen it.
 */
const seenBy = (): string[] => {
  try {
    const held = window.localStorage.getItem(STORAGE_KEY);

    return held === null ? [] : held.split(',').filter((id) => id !== '');
  } catch {
    return [];
  }
};

/**
 * Whether this account has already been through the welcome tour on this device.
 *
 * @param accountId - Who is asking.
 * @returns Whether it has been shown, or skipped.
 */
const hasSeenTour = (accountId: string): boolean => seenBy().includes(accountId);

/**
 * Remembers that an account has been through the welcome tour, or skipped it, on this device.
 *
 * @param accountId - Who has seen it.
 */
const markTourSeen = (accountId: string): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, [...new Set([...seenBy(), accountId])].join(','));
  } catch {}
};

export { hasSeenTour, markTourSeen };
