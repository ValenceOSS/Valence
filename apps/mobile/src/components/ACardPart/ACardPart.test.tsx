import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ACardPart } from './ACardPart';

describe('ACardPart', () => {
  it('draws the part it holds', async () => {
    const drawn = await render(
      <ACardPart>
        <Text>Cast</Text>
      </ACardPart>,
    );

    expect(drawn.getByText('Cast')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ACardPart.displayName).toBe('ACardPart');
  });
});
