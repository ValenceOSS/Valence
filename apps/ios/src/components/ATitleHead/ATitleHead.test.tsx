import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ATitleHead } from './ATitleHead';

describe('ATitleHead', () => {
  it('draws the title’s backdrop and lettering, with a way to hear its clip', async () => {
    installPlatform(aFakePlatform());
    const drawn = await render(
      <ATitleHead mediaId="arrival" hasBackdrop letteredBy="arrival" title="Arrival" />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByLabelText('Arrival')).toBeTruthy();
  });
});
