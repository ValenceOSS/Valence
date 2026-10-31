import { requestPermissionsAsync } from 'expo-notifications';
import { askToNotifyThisPhone } from './askToNotifyThisPhone';
import { NOTIFICATIONS_ALLOWED } from '@ValenceMobile/testing/NOTIFICATIONS_ALLOWED';

describe('askToNotifyThisPhone', () => {
  it('says whether the person allowed notifications', async () => {
    expect(await askToNotifyThisPhone()).toBe(false);

    jest.mocked(requestPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);

    expect(await askToNotifyThisPhone()).toBe(true);
  });
});
