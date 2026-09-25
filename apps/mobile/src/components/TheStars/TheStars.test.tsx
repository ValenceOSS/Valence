import { render } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TheStars } from './TheStars';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('TheStars', () => {
  it('offers one to five stars', async () => {
    const drawn = await render(<TheStars subject={{ mediaId: 'arrival' }} />, {
      wrapper: CacheScope,
    });

    expect(drawn.getByRole('button', { name: '1 star' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: '5 stars' })).toBeTruthy();
  });
});
