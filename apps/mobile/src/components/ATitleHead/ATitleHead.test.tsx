import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { ATitleHead } from './ATitleHead';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ATitleHead', () => {
  it('draws the title’s backdrop and lettering, with a way to hear its clip', async () => {
    installPlatform(aFakePlatform());
    const drawn = await render(
      <ATitleHead mediaId="arrival" hasBackdrop letteredBy="arrival" title="Arrival" />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByLabelText('Arrival')).toBeTruthy();
  });

  it('draws something the library does not hold from where its pictures are', async () => {
    installPlatform(aFakePlatform());
    const drawn = await render(
      <ATitleHead
        backdrop="http://one.local/backdrop.jpg"
        lettering="http://one.local/logo.png"
        title="Arrival"
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByLabelText('Arrival').props.source).toEqual({
      uri: 'http://one.local/logo.png',
    });
  });

  it('stands a little taller than a phone held upright is wide', async () => {
    installPlatform(aFakePlatform());
    holdAWindowOf(400, 852);
    await render(<ATitleHead backdrop={null} lettering={null} title="Arrival" />, {
      wrapper: CacheScope,
    });

    expect(theDrawnRoot()).toHaveStyle({ height: 420 });
  });

  it('stands no taller than six tenths of the screen, opened out', async () => {
    installPlatform(aFakePlatform());
    holdAWindowOf(871, 669);
    await render(<ATitleHead backdrop={null} lettering={null} title="Arrival" />, {
      wrapper: CacheScope,
    });

    expect(theDrawnRoot()).toHaveStyle({ height: 401.4 });
  });
});
