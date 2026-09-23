import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aProfile } from '@ValencePhone/testing/aProfile';
import { AWallFace } from './AWallFace';

const DAN = aProfile();

describe('AWallFace', () => {
  it('signs in as whoever is picked', async () => {
    installPlatform(aFakePlatform());
    const onPicked = jest.fn();
    const drawn = await render(<AWallFace profile={DAN} arrivingFrom={null} onPicked={onPicked} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Sign in as Dan' }));

    expect(onPicked).toHaveBeenCalledWith(DAN, expect.anything());
  });
});
