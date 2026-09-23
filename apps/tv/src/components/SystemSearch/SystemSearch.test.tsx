import { createElement as mockCreateElement } from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text, View as mockView } from 'react-native';
import { SystemSearch } from '@ValenceTv/components/SystemSearch/SystemSearch';
import type { ReactNode } from 'react';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireOptionalNativeModule: () => null,
  requireNativeView: () => (props: { children?: ReactNode }) => mockCreateElement(mockView, props),
}));

describe('SystemSearch', () => {
  it('draws the results beneath the keyboard', async () => {
    const drawn = await render(
      <SystemSearch
        placeholder="Search"
        onChangeText={jest.fn()}
        onResultsLayout={jest.fn()}
        upTo={null}
      >
        <Text>Dune</Text>
      </SystemSearch>,
    );

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
  });

  it('hands the native screen what it says and where up goes', async () => {
    const drawn = await render(
      <SystemSearch
        placeholder="Films, shows and people"
        onChangeText={jest.fn()}
        onResultsLayout={jest.fn()}
        upTo={42}
      >
        <Text>Dune</Text>
      </SystemSearch>,
    );

    expect(drawn.root).toHaveProp('placeholder', 'Films, shows and people');
    expect(drawn.root).toHaveProp('upTo', 42);
  });

  it('says what has been typed', async () => {
    const onChangeText = jest.fn();
    const drawn = await render(
      <SystemSearch
        placeholder="Search"
        onChangeText={onChangeText}
        onResultsLayout={jest.fn()}
        upTo={null}
      >
        <Text>Dune</Text>
      </SystemSearch>,
    );

    await fireEvent(drawn.getByText('Dune'), 'changeText', { nativeEvent: { text: 'du' } });

    expect(onChangeText).toHaveBeenCalledWith('du');
  });

  it('says how much room the results have', async () => {
    const onResultsLayout = jest.fn();
    const drawn = await render(
      <SystemSearch
        placeholder="Search"
        onChangeText={jest.fn()}
        onResultsLayout={onResultsLayout}
        upTo={null}
      >
        <Text>Dune</Text>
      </SystemSearch>,
    );

    await fireEvent(drawn.getByText('Dune'), 'resultsLayout', {
      nativeEvent: { width: 1920, height: 600 },
    });

    expect(onResultsLayout).toHaveBeenCalledWith({ width: 1920, height: 600 });
  });

  it('ignores whatever the native side says that it does not understand', async () => {
    const onChangeText = jest.fn();
    const onResultsLayout = jest.fn();
    const drawn = await render(
      <SystemSearch
        placeholder="Search"
        onChangeText={onChangeText}
        onResultsLayout={onResultsLayout}
        upTo={null}
      >
        <Text>Dune</Text>
      </SystemSearch>,
    );

    await fireEvent(drawn.getByText('Dune'), 'changeText', { nativeEvent: { typed: 4 } });
    await fireEvent(drawn.getByText('Dune'), 'resultsLayout', { nativeEvent: { width: 'wide' } });

    expect(onChangeText).not.toHaveBeenCalled();
    expect(onResultsLayout).not.toHaveBeenCalled();
  });
});
