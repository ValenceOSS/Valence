import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { APlayerCircle } from './APlayerCircle';

describe('APlayerCircle', () => {
  it('draws what it holds', async () => {
    const drawn = await render(
      <APlayerCircle size="big">
        <Text>Play</Text>
      </APlayerCircle>,
    );

    expect(drawn.getByText('Play')).toBeTruthy();
  });
});
