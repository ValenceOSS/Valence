import { fireEvent, render } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { useColorScheme } from 'react-native';
import { theColours } from '@ValenceMobile/theme/theColours';
import { Words } from '@ValenceMobile/components/Words/Words';
import { CARD_SCROLL } from '@ValenceMobile/components/APageStack/CARD_SCROLL';
import { Screen } from './Screen';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

beforeEach(() => {
  jest.mocked(useColorScheme).mockReturnValue('dark');
});

describe('Screen', () => {
  it('draws what is on it', async () => {
    const drawn = await render(
      <Screen>
        <Words>On the ground</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('On the ground')).toBeTruthy();
  });

  it('draws it on the theme ground', async () => {
    const drawn = await render(
      <Screen>
        <Words>On the ground</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(JSON.stringify(drawn.toJSON())).toContain(theColours.dark.surface);
  });

  it('scrolls where there is more than fits', async () => {
    const drawn = await render(
      <Screen scrolls>
        <Words>Long</Words>
      </Screen>,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Long')).toBeTruthy();
  });

  it('tells whoever asked only when the page leaves its top or comes back to it', async () => {
    const onScrolled = jest.fn();
    const drawn = await render(
      <Screen scrolls onScrolled={onScrolled}>
        <Words>Long</Words>
      </Screen>,
      { wrapper: CacheScope },
    );
    const scrolledTo = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

    await fireEvent.scroll(drawn.getByText('Long'), scrolledTo(10));
    await fireEvent.scroll(drawn.getByText('Long'), scrolledTo(40));
    await fireEvent.scroll(drawn.getByText('Long'), scrolledTo(0));

    expect(onScrolled.mock.calls).toEqual([[true], [false]]);
  });

  describe('on a card, a finger that drags the page to its top and keeps pulling', () => {
    const pullThenLift = async (heldFor: number) => {
      const card = {
        atTop: jest.fn<void, [boolean]>(),
        pullDown: jest.fn<void, [number]>(),
        letGo: jest.fn<void, [number, number]>(),
      };
      const drawn = await render(
        <CARD_SCROLL.Provider value={card}>
          <Screen scrolls>
            <Words>Long</Words>
          </Screen>
        </CARD_SCROLL.Provider>,
        { wrapper: CacheScope },
      );
      const page = drawn.getByText('Long');
      const finger = (pageY: number, timestamp: number) => ({ nativeEvent: { pageY, timestamp } });

      await fireEvent.scroll(page, { nativeEvent: { contentOffset: { y: 100 } } });
      await fireEvent(page, 'touchStart', finger(300, 0));
      await fireEvent(page, 'scrollBeginDrag');
      await fireEvent(page, 'touchMove', finger(350, 20));
      await fireEvent.scroll(page, { nativeEvent: { contentOffset: { y: 0 } } });
      await fireEvent(page, 'touchMove', finger(450, 60));
      await fireEvent(page, 'touchMove', finger(550, 100));
      await fireEvent(page, 'touchEnd', finger(550, 100 + heldFor));

      return card;
    };

    it('drags the card with it, and lets go of it as fast as it was moving', async () => {
      const card = await pullThenLift(0);

      expect(card.pullDown).toHaveBeenLastCalledWith(200);
      expect(card.letGo).toHaveBeenCalledWith(200, expect.any(Number));
      expect(card.letGo.mock.calls[0]?.[1]).toBeGreaterThan(1);
    });

    it('lets go of it still once the finger has stopped before lifting', async () => {
      const card = await pullThenLift(500);

      expect(card.letGo).toHaveBeenCalledWith(200, 0);
    });
  });
});
