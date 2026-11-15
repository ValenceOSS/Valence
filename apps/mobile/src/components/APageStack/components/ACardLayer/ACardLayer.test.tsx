import { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { CARD_GOES_BACK } from '@ValenceMobile/components/APageStack/CARD_GOES_BACK';
import { CARD_SCROLL } from '@ValenceMobile/components/APageStack/CARD_SCROLL';
import { IS_A_CARD } from '@ValenceMobile/components/APageStack/IS_A_CARD';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { ACardLayer } from './ACardLayer';

const Tells = () => {
  const scroll = useContext(CARD_SCROLL);
  const room = useContext(SafeAreaInsetsContext);
  const words = [
    useContext(IS_A_CARD) ? 'card' : 'page',
    useContext(CARD_GOES_BACK) ? 'goes back' : 'stays',
    useContext(IS_ON_TOP) ? 'on top' : 'covered',
    `top ${(room?.top ?? -1).toString()}`,
  ];

  useEffect(() => {
    scroll?.atTop(false);
    scroll?.pullDown(12);
    scroll?.letGo(12, 0.5);
  }, [scroll]);

  return <Text>{words.join(', ')}</Text>;
};

const LAID = {
  layer: { key: 'title', page: <Tells />, goesBack: true },
  motion: 'shown',
  keeping: { activity: 2, isFrozen: false },
  isOnTop: true,
  isLifted: false,
  isTouchable: true,
  isStill: false,
  width: 400,
  insets: { top: 0, bottom: 34, left: 0, right: 0 },
} as const;

/**
 * The card's layer, with what it tells the card about its page.
 *
 * @returns The layer's parts.
 */
const aLayer = () => ({
  swapping: makeMutable(1),
  peeling: makeMutable(0),
  onAtTop: jest.fn(),
  pullDown: jest.fn(),
  letGo: jest.fn(),
});

describe('ACardLayer', () => {
  it('tells its page it is a card, whether it goes back, and that it has no room at its top', async () => {
    await render(<ACardLayer {...LAID} {...aLayer()} />);

    expect(screen.getByText('card, goes back, on top, top 0')).toBeTruthy();
  });

  it('passes on what its page says about its scrolling, naming the page', async () => {
    const parts = aLayer();

    await render(<ACardLayer {...LAID} {...parts} />);

    expect(parts.onAtTop).toHaveBeenCalledWith('title', false);
    expect(parts.pullDown).toHaveBeenCalledWith(12);
    expect(parts.letGo).toHaveBeenCalledWith(12, 0.5);
  });

  it('keeps a hidden page out of reach of anybody reading the screen', async () => {
    await render(<ACardLayer {...LAID} {...aLayer()} motion="hidden" isOnTop={false} />);

    expect(screen.queryByText('card, goes back, covered, top 0')).toBeNull();
    expect(
      screen.getByText('card, goes back, covered, top 0', { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it('slides a page arriving deeper into the card in from the right', async () => {
    const parts = { ...aLayer(), swapping: makeMutable(0) };

    await render(<ACardLayer {...LAID} {...parts} motion="arrivingForward" />);

    let at = screen.getByText('card, goes back, on top, top 0').parent;

    while (at !== null && at.props.pointerEvents === undefined) {
      at = at.parent;
    }

    expect(at).toHaveStyle({ transform: [{ translateX: 400 }] });
  });
});
