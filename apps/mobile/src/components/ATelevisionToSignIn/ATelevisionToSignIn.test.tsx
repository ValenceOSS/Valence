import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { readDeviceRequest } from '@ValenceClient/session/auth';
import { ATelevisionToSignIn } from './ATelevisionToSignIn';

jest.mock('@ValenceClient/session/auth', () => ({
  ...jest.requireActual<object>('@ValenceClient/session/auth'),
  readDeviceRequest: jest.fn(() => Promise.resolve({ userCode: 'ABCD1234', status: 'pending' })),
}));

describe('ATelevisionToSignIn', () => {
  it('opens on the television that asked, and goes back when done', async () => {
    installPlatform(aFakePlatform());
    const onBack = jest.fn();
    const drawn = await render(
      <ATelevisionToSignIn code="ABCD1234" askedFrom={null} onBack={onBack} />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Yes, that is mine')).toBeTruthy();
    expect(readDeviceRequest).toHaveBeenCalledWith('ABCD1234');

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });
});
