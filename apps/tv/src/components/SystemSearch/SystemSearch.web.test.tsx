import { render } from '@testing-library/react';
import { Text } from 'react-native';
import { SystemSearch } from '@ValenceTv/components/SystemSearch/SystemSearch';

describe('SystemSearch in a browser', () => {
  it('is a field to type into above the results', () => {
    const drawn = render(
      <SystemSearch
        placeholder="Films, shows and music"
        upTo={null}
        onChangeText={jest.fn()}
        onResultsLayout={jest.fn()}
      >
        <Text>Results</Text>
      </SystemSearch>,
    );

    expect(drawn.getByText('Results')).toBeTruthy();
    expect(drawn.getByPlaceholderText('Films, shows and music')).toBeTruthy();
  });
});
