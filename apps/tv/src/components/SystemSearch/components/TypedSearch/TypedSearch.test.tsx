import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { TypedSearch } from './TypedSearch';

describe('TypedSearch', () => {
  it('draws a search box above the results', async () => {
    const drawn = await render(
      <TypedSearch placeholder="Search" onChangeText={jest.fn()} onResultsLayout={jest.fn()}>
        <Text>Dune</Text>
      </TypedSearch>,
    );

    expect(drawn.getAllByText('Search').length).toBeGreaterThan(0);
    expect(drawn.getByText('Dune')).toBeOnTheScreen();
  });

  it('says what has been typed', async () => {
    const onChangeText = jest.fn();
    const drawn = await render(
      <TypedSearch placeholder="Search" onChangeText={onChangeText} onResultsLayout={jest.fn()}>
        <Text>Dune</Text>
      </TypedSearch>,
    );

    const [typing] = drawn.getAllByLabelText('Search').filter((each) => each.props.onChangeText);

    if (typing === undefined) {
      throw new Error('There is nowhere to type');
    }

    fireEvent.changeText(typing, 'dune');

    expect(onChangeText).toHaveBeenCalledWith('dune');
  });

  it('says how much room the results have', async () => {
    const onResultsLayout = jest.fn();
    const drawn = await render(
      <TypedSearch placeholder="Search" onChangeText={jest.fn()} onResultsLayout={onResultsLayout}>
        <Text>Dune</Text>
      </TypedSearch>,
    );

    fireEvent(drawn.getByTestId('search-results'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 1740, height: 700 } },
    });

    expect(onResultsLayout).toHaveBeenCalledWith({ width: 1740, height: 700 });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TypedSearch.displayName).toBe('TypedSearch');
  });
});
