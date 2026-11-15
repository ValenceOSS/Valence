import { Text, View as mockView } from 'react-native';
import { createElement as mockCreateElement, useEffect as mockUseEffect } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { APosterGrid } from './APosterGrid';
import type { ReactNode } from 'react';

const mockArriving = jest.fn<undefined, [{ at: number; isArrived: boolean }]>();

jest.mock('@ValenceMobile/components/ACardArrival/ACardArrival', () => ({
  ACardArrival: ({
    children,
    at,
    isArrived = false,
    onArrived,
  }: {
    children: ReactNode;
    at: number;
    isArrived?: boolean;
    onArrived?: () => void;
  }) => {
    mockArriving({ at, isArrived });
    mockUseEffect(() => {
      if (!isArrived) {
        onArrived?.();
      }
    }, [isArrived, onArrived]);

    return mockCreateElement(mockView, null, children);
  },
}));

beforeEach(() => {
  mockArriving.mockClear();
});

describe('APosterGrid', () => {
  it('draws what sits above it, then each item', async () => {
    const drawn = await render(
      <APosterGrid
        header={<Text>Films</Text>}
        items={['Arrival', 'Dune']}
        keyOf={(item) => item}
        drawn={(item) => <Text>{item}</Text>}
      />,
      { wrapper: CacheScope },
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(drawn.getByText('Dune')).toBeTruthy();
  });

  it('lets a poster that has arrived once simply be there when it is drawn again', async () => {
    const films = ['Arrival', 'Dune'];
    const drawn = await render(
      <APosterGrid
        header={null}
        items={films}
        keyOf={(item) => item}
        drawn={(item) => <Text>{item}</Text>}
      />,
      { wrapper: CacheScope },
    );

    expect(mockArriving).toHaveBeenCalledWith(expect.objectContaining({ isArrived: false }));

    mockArriving.mockClear();

    await drawn.rerender(
      <APosterGrid
        header={null}
        items={films}
        keyOf={(item) => item}
        drawn={(item) => <Text>{`${item}!`}</Text>}
      />,
    );

    expect(drawn.getByText('Dune!')).toBeTruthy();
    expect(mockArriving).toHaveBeenCalledWith(expect.objectContaining({ isArrived: true }));
    expect(mockArriving).not.toHaveBeenCalledWith(expect.objectContaining({ isArrived: false }));
  });

  it('offers a way back where it is a page of its own', async () => {
    const onBack = jest.fn();
    const drawn = await render(
      <APosterGrid
        header={null}
        items={[]}
        keyOf={(item: string) => item}
        drawn={(item) => <Text>{item}</Text>}
        onBack={onBack}
      />,
      { wrapper: CacheScope },
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('tells whoever asked only when it leaves its top or comes back to it', async () => {
    const onScrolled = jest.fn();
    const drawn = await render(
      <APosterGrid
        header={<Text>Films</Text>}
        items={['Arrival']}
        keyOf={(item) => item}
        drawn={(item) => <Text>{item}</Text>}
        onScrolled={onScrolled}
      />,
      { wrapper: CacheScope },
    );
    const scrolledTo = (y: number) => ({ nativeEvent: { contentOffset: { y } } });

    await fireEvent.scroll(drawn.getByText('Films'), scrolledTo(10));
    await fireEvent.scroll(drawn.getByText('Films'), scrolledTo(40));
    await fireEvent.scroll(drawn.getByText('Films'), scrolledTo(0));

    expect(onScrolled.mock.calls).toEqual([[true], [false]]);
  });
});
