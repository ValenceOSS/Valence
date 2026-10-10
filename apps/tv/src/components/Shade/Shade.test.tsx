import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Shade } from '@ValenceTv/components/Shade/Shade';

describe('Shade', () => {
  it('draws a gradient on a television', async () => {
    const drawn = await render(
      <Shade
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']}
        flat="rgba(0,0,0,0.25)"
        style={StyleSheet.absoluteFill}
      />,
    );

    expect(drawn.toJSON()).not.toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Shade.displayName).toBe('Shade');
  });
});
