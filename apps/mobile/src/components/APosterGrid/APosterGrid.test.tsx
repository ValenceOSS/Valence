import { Text } from 'react-native';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { APosterGrid } from './APosterGrid';

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
