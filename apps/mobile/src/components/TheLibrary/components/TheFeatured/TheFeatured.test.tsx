import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aTitle } from '@ValenceMobile/testing/aTitle';
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

  it('moves on to the next title by itself where no clip plays', async () => {
    jest.useFakeTimers();
    installPlatform(aFakePlatform());
    const onShowing = jest.fn();
    const next = aTitle({ id: '3fa85f64-5717-4562-b3fc-2c963f66afb0', title: 'Dune' });

    await render(
      <TheFeatured
        items={[aTitle(), next]}
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onLookAtShow={jest.fn()}
        onShowing={onShowing}
      />,
      { wrapper: CacheScope },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(28_000);
    });

    expect(onShowing).toHaveBeenLastCalledWith(next);
    jest.useRealTimers();
  });

  it('comes round to the first again after the last', async () => {
    jest.useFakeTimers();
    installPlatform(aFakePlatform());
    const onShowing = jest.fn();
    const first = aTitle();
    const next = aTitle({ id: '3fa85f64-5717-4562-b3fc-2c963f66afb0', title: 'Dune' });

    await render(
      <TheFeatured
        items={[first, next]}
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onLookAtShow={jest.fn()}
        onShowing={onShowing}
      />,
      { wrapper: CacheScope },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(28_000);
    });
    await act(async () => {
      await jest.advanceTimersByTimeAsync(28_000);
    });

    expect(onShowing).toHaveBeenLastCalledWith(first);
    jest.useRealTimers();
  });

  it('stays where it is while the page is scrolled away from it', async () => {
    jest.useFakeTimers();
    installPlatform(aFakePlatform());
    const onShowing = jest.fn();
    const first = aTitle();
    const next = aTitle({ id: '3fa85f64-5717-4562-b3fc-2c963f66afb0', title: 'Dune' });

    await render(
      <TheFeatured
        items={[first, next]}
        onWatch={jest.fn()}
        onLookAt={jest.fn()}
        onLookAtShow={jest.fn()}
        onShowing={onShowing}
        isInView={false}
      />,
      { wrapper: CacheScope },
    );

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });

    expect(onShowing).not.toHaveBeenCalledWith(next);
    jest.useRealTimers();
  });
});
