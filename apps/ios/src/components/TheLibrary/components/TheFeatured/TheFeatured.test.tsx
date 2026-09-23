import { render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTitle } from '@ValencePhone/testing/aTitle';
import { TheFeatured } from './TheFeatured';

describe('TheFeatured', () => {
  it('opens more about a title featured', async () => {
    installPlatform(aFakePlatform());
    const onLookAt = jest.fn();
    const drawn = await render(
      <TheFeatured
        items={[aTitle()]}
        onWatch={jest.fn()}
        onLookAt={onLookAt}
        onLookAtShow={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'More info' }));

    expect(onLookAt).toHaveBeenCalledWith(aTitle().id);
  });

  it('draws nothing where nothing is featured', async () => {
    installPlatform(aFakePlatform());
    const drawn = await render(
      <TheFeatured items={[]} onWatch={jest.fn()} onLookAt={jest.fn()} onLookAtShow={jest.fn()} />,
      { wrapper: CacheScope },
    );

    expect(drawn.toJSON()).toBeNull();
  });
});
