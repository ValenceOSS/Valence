import { useContext } from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { makeMutable } from 'react-native-reanimated';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { AStackLayer } from './AStackLayer';

const SaysWhetherOnTop = () => <Text>{useContext(IS_ON_TOP) ? 'on top' : 'covered'}</Text>;

const LAID = {
  keeping: { activity: 2, isFrozen: false },
  isTop: true,
  isCard: false,
  isUnderACard: false,
  rises: false,
  isStill: false,
  isMoving: false,
  cardTop: 69,
  width: 400,
  height: 800,
} as const;

/**
 * The view the layer moves, found from words on the page inside it.
 *
 * @param words - Words on the page.
 * @returns The moving view.
 */
const theMovingView = (words: string) => {
  let at = screen.getByText(words, { includeHiddenElements: true }).parent;

  while (at !== null && at.props.renderToHardwareTextureAndroid === undefined) {
    at = at.parent;
  }

  if (at === null) {
    throw new Error('Those words are not in a layer.');
  }

  return at;
};

describe('AStackLayer', () => {
  it('tells the page on top that it is on top', async () => {
    await render(
      <AStackLayer {...LAID} place={makeMutable(0)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(screen.getByText('on top')).toBeTruthy();
  });

  it('hides a covered page from touch and from anybody reading the screen', async () => {
    await render(
      <AStackLayer {...LAID} isTop={false} place={makeMutable(-1)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(screen.queryByText('covered')).toBeNull();
    expect(theMovingView('covered').props.pointerEvents).toBe('none');
  });

  it('draws a page pushed off to the right of the screen', async () => {
    await render(
      <AStackLayer {...LAID} place={makeMutable(1)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(theMovingView('on top')).toHaveStyle({
      transform: [{ translateX: 400 }],
    });
  });

  it('shrinks a page back beneath a card', async () => {
    await render(
      <AStackLayer {...LAID} isTop={false} isUnderACard place={makeMutable(-1)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(theMovingView('covered')).toHaveStyle({
      transform: [{ scale: 0.92 }],
    });
  });

  it('stops a card where it is told to, risen from below', async () => {
    await render(
      <AStackLayer {...LAID} isCard place={makeMutable(1)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(theMovingView('on top')).toHaveStyle({ top: 69 });
    expect(theMovingView('on top')).toHaveStyle({
      transform: [{ translateY: 800 }],
    });
  });

  it('fades rather than moves for somebody who asked for less motion', async () => {
    await render(
      <AStackLayer {...LAID} isStill place={makeMutable(1)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(theMovingView('on top')).toHaveStyle({ opacity: 0 });
  });

  it('draws the page in a screen kept as it is told', async () => {
    await render(
      <AStackLayer {...LAID} keeping={{ activity: 1, isFrozen: false }} place={makeMutable(0)}>
        <SaysWhetherOnTop />
      </AStackLayer>,
    );

    expect(
      screen.container.queryAll((one) => one.type === 'RNSScreen')[0]?.props.activityState,
    ).toBe(1);
  });
});
