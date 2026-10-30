import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { APlayerCapsule } from './APlayerCapsule';

describe('APlayerCapsule', () => {
  it('draws the controls it holds', async () => {
    const drawn = await render(
      <APlayerCapsule>
        <Text>Lock</Text>
      </APlayerCapsule>,
    );

    expect(drawn.getByText('Lock')).toBeTruthy();
  });
});
