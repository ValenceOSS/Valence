import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { APreview } from './APreview';

describe('APreview', () => {
  it('shows the title’s backdrop behind its clip', async () => {
    installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
    const drawn = await render(
      <APreview mediaId="arrival" hasBackdrop isShowing={false} isMuted />,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(
      'http://one.local:8420/api/media/arrival/image/backdrop',
    );
  });
});
