import { requestPermissionsAsync } from 'expo-notifications';
import { makeTheNotificationChannel } from './makeTheNotificationChannel';

/**
 * Asks the system whether Valence may show notifications, which it asks the person only the first
 * time; after that it answers with what they chose, or what they set in Settings. On Android the
 * channel Valence's notifications are shown on is made first, since Android asks for one before it
 * will ask the person.
 *
 * @returns Whether it may.
 */
const askToNotifyThisPhone = async (): Promise<boolean> => {
  await makeTheNotificationChannel();

  return (
    (
      await requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      }).catch(() => null)
    )?.granted === true
  );
};

export { askToNotifyThisPhone };
