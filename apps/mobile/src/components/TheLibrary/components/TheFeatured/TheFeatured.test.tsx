import { act, render, userEvent } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { AFeature } from '@ValenceMobile/components/TheLibrary/components/TheFeatured/components/AFeature/AFeature';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { TheFeatured } from './TheFeatured';

jest.mock(
  '@ValenceMobile/components/TheLibrary/components/TheFeatured/components/AFeature/AFeature',
  () => {
    const { AFeature: drawn } = jest.requireActual<{ AFeature: typeof AFeature }>(
      '@ValenceMobile/components/TheLibrary/components/TheFeatured/components/AFeature/AFeature',
    );

    return { AFeature: jest.fn(drawn) };
  },
);

const theCardIn = async (width: number, height: number) => {
  holdAWindowOf(width, height);
  jest.mocked(AFeature).mockClear();
  installPlatform(aFakePlatform());
  await render(
    <TheFeatured
      items={[aTitle()]}
      onWatch={jest.fn()}
      onLookAt={jest.fn()}
      onLookAtShow={jest.fn()}
    />,
    { wrapper: CacheScope },
  );

  return jest.mocked(AFeature).mock.lastCall?.[0];
};

afterEach(() => {
  jest.restoreAllMocks();
});

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

  it('draws a card wider than it is tall on a wide window', async () => {
    const card = await theCardIn(871, 669);

    expect(card).toMatchObject({ width: 626, height: 388 });
  });

  it('draws a card as a poster on a phone held upright', async () => {
    const card = await theCardIn(393, 852);

    expect(card).toMatchObject({ width: 329, height: 428 });
  });

  it('keeps a card to a little over half the height of a short window', async () => {
    const card = await theCardIn(393, 500);

    expect(card).toMatchObject({ width: 223, height: 290 });
  });
});
