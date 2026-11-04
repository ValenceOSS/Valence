import { AndroidImportance, setNotificationChannelAsync } from 'expo-notifications';
import { Platform } from 'react-native';
import { say } from '@ValenceI18n/say';
import { NOTIFICATION_CHANNEL } from './NOTIFICATION_CHANNEL';

/**
 * Makes, or names again in the language now in use, the channel Android shows Valence's
 * notifications on, which it asks for before it will ask whether notifications are allowed at all.
 * Nothing on an iPhone, which has no channels.
 */
const makeTheNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') {
    return;
  }

  await setNotificationChannelAsync(NOTIFICATION_CHANNEL, {
    name: say('phone.makeTheNotificationChannel.fromYourServer'),
    importance: AndroidImportance.HIGH,
  }).catch(() => null);
};

export { makeTheNotificationChannel };
