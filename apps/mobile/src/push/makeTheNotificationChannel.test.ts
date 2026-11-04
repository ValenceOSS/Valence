import { Platform } from 'react-native';
import { setNotificationChannelAsync } from 'expo-notifications';
import { makeTheNotificationChannel } from './makeTheNotificationChannel';

describe('makeTheNotificationChannel', () => {
  const was = Platform.OS;

  afterEach(() => {
    Platform.OS = was;
    jest.mocked(setNotificationChannelAsync).mockClear();
  });

  it('makes Valence’s channel on Android, named for whoever reads it', async () => {
    Platform.OS = 'android';

    await makeTheNotificationChannel();

    expect(setNotificationChannelAsync).toHaveBeenCalledWith('valence', {
      name: 'From your server',
      importance: 4,
    });
  });

  it('makes nothing on an iPhone', async () => {
    Platform.OS = 'ios';

    await makeTheNotificationChannel();

    expect(setNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
