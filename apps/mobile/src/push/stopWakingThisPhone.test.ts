import { getPermissionsAsync } from 'expo-notifications';
import { forgetThisPhone } from '@ValenceClient/notifications/forgetThisPhone';
import { stopWakingThisPhone } from './stopWakingThisPhone';
import { NOTIFICATIONS_ALLOWED } from '@ValenceMobile/testing/NOTIFICATIONS_ALLOWED';

const mockForgetSignIn = jest.fn();

jest.mock('expo', () => ({
  requireOptionalNativeModule: () => ({ shareSignIn: jest.fn(), forgetSignIn: mockForgetSignIn }),
}));

jest.mock('@ValenceClient/notifications/forgetThisPhone', () => ({
  forgetThisPhone: jest.fn(() => Promise.resolve(true)),
}));

describe('stopWakingThisPhone', () => {
  it('has the server forget the phone and the extension forget the sign-in', async () => {
    jest.mocked(getPermissionsAsync).mockResolvedValueOnce(NOTIFICATIONS_ALLOWED);

    await stopWakingThisPhone();

    expect(forgetThisPhone).toHaveBeenCalledWith('a'.repeat(64));
    expect(mockForgetSignIn).toHaveBeenCalled();
  });
});
