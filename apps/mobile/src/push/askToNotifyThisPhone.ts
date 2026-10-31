import { requestPermissionsAsync } from 'expo-notifications';

/**
 * Asks the system whether Valence may show notifications, which it asks the person only the first
 * time; after that it answers with what they chose, or what they set in Settings.
 *
 * @returns Whether it may.
 */
const askToNotifyThisPhone = async (): Promise<boolean> =>
  (
    await requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    }).catch(() => null)
  )?.granted === true;

export { askToNotifyThisPhone };
