import { fireEvent, render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { ATitleLogo } from './ATitleLogo';

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('ATitleLogo', () => {
  it('draws the title’s logo, named for who cannot see it', async () => {
    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    expect(drawn.getByLabelText('Arrival').props.source).toEqual({
      uri: 'http://one.local:8420/api/media/arrival/image/logo?at=full',
    });
  });

  it('writes the title out where there is no logo', async () => {
    const drawn = await render(
      <ATitleLogo mediaId={null} title="Arrival" high={60} widest={300} />,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });

  it('writes the title out where the logo will not load', async () => {
    const drawn = await render(
      <ATitleLogo mediaId="arrival" title="Arrival" high={60} widest={300} />,
    );

    await fireEvent(drawn.getByLabelText('Arrival'), 'error');

    expect(drawn.getByText('Arrival')).toBeTruthy();
  });
});
