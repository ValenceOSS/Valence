import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ASwatchRing } from './ASwatchRing';

describe('ASwatchRing', () => {
  it('rings a swatch only while it is the one chosen', async () => {
    await render(
      <ASwatchRing isChosen={false}>
        <Text>swatch</Text>
      </ASwatchRing>,
    );

    expect(screen.getByText('swatch').parent).toHaveStyle({ borderColor: 'transparent' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ASwatchRing.displayName).toBe('ASwatchRing');
  });
});
