import { useContext } from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { Animated, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IS_ON_TOP } from '@ValenceMobile/components/APageStack/IS_ON_TOP';
import { APageStack } from './APageStack';

const Named = ({ name }: { name: string }) => (
  <Text>{`${name}${useContext(IS_ON_TOP) ? ' on top' : ' covered'}`}</Text>
);

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual<object>('react-native-safe-area-context'),
  useSafeAreaInsets: jest.fn(),
}));

const aPage = (name: string) => ({ key: name, page: <Named name={name} /> });

/**
 * The page in the stack that holds some words, as the stack placed it.
 *
 * @param words - Words drawn on the page.
 * @returns Where the page was placed.
 */
const thePageHolding = (words: string) => {
  let at = screen.getByText(words).parent;

  while (at !== null && at.props.renderToHardwareTextureAndroid === undefined) {
    at = at.parent;
  }

  if (at === null) {
    throw new Error('Those words are not on a page in the stack.');
  }

  return at;
};

beforeEach(() => {
  jest
    .mocked(useSafeAreaInsets)
    .mockReset()
    .mockReturnValue({ top: 59, bottom: 34, left: 0, right: 0 });
});

describe('APageStack', () => {
  it('shows only the page on top to anybody reading the screen', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Arrival on top')).toBeTruthy();
    expect(drawn.queryByText('Home covered')).toBeNull();
  });

  it('keeps the pages beneath drawn, and tells them they are covered', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    expect(drawn.getByText('Home covered', { includeHiddenElements: true })).toBeTruthy();
  });

  it('tells the page beneath it is on top again once the one over it goes', async () => {
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    expect(drawn.getByText('Home on top')).toBeTruthy();
  });

  it('slides what is left back into place once the page over it goes, down to the first', async () => {
    const springing = jest.spyOn(Animated, 'spring');
    const drawn = await render(
      <APageStack pages={[aPage('Home'), aPage('Arrival')]} onBack={jest.fn()} />,
    );

    springing.mockClear();

    await act(async () => {
      await drawn.rerender(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);
    });

    expect(springing.mock.calls.map(([, config]) => config.toValue)).toEqual([0, 1]);

    springing.mockRestore();
  });

  it('slides a page swapped in on top into place, even while the one it replaced was arriving', async () => {
    const springing = jest.spyOn(Animated, 'spring');
    const drawn = await render(<APageStack pages={[aPage('Home')]} onBack={jest.fn()} />);

    await act(async () => {
      await drawn.rerender(
        <APageStack pages={[aPage('Home'), aPage('Asking')]} onBack={jest.fn()} />,
      );
    });

    springing.mockClear();

    await act(async () => {
      await drawn.rerender(
        <APageStack pages={[aPage('Home'), aPage('Title')]} onBack={jest.fn()} />,
      );
    });

    expect(drawn.getByText('Title on top')).toBeTruthy();
    expect(drawn.queryByText('Asking on top', { includeHiddenElements: true })).toBeNull();
    expect(springing.mock.calls.map(([, config]) => config.toValue)).toEqual([0]);

    springing.mockRestore();
  });

  it('stops a card just short of the status bar', async () => {
    await render(
      <APageStack
        pages={[aPage('Home'), { ...aPage('Arrival'), isCard: true }]}
        onBack={jest.fn()}
      />,
    );

    expect(thePageHolding('Arrival on top')).toHaveStyle({ top: 69 });
  });

  it('keeps a card below the clock where the screen keeps no room at its top for it', async () => {
    jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, bottom: 20, left: 0, right: 84 });

    await render(
      <APageStack
        pages={[aPage('Home'), { ...aPage('Arrival'), isCard: true }]}
        onBack={jest.fn()}
      />,
    );

    expect(thePageHolding('Arrival on top')).toHaveStyle({ top: 46 });
  });
});
