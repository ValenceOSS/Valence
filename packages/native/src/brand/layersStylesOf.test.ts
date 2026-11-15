import { Animated } from 'react-native';
import { layersStylesOf } from './layersStylesOf';

/**
 * Three layers, each already in place.
 */
const inPlace = () => [new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)];

describe('layersStylesOf', () => {
  it('fits the mark to the height of a box wider than it', () => {
    const styles = layersStylesOf(200, 66, inPlace(), '#ffffff');

    expect(styles.box).toMatchObject({ width: 200, height: 66 });
    expect(styles.frame.height).toBe(66);
    expect(styles.frame.width).toBeCloseTo(70);
  });

  it('fits the mark to the width of a box taller than it', () => {
    const styles = layersStylesOf(70, 200, inPlace(), '#ffffff');

    expect(styles.frame.width).toBeCloseTo(70);
    expect(styles.frame.height).toBeCloseTo(66);
  });

  it('draws one layer for each value, sized to the mark and tinted in the ink', () => {
    const layers = inPlace();
    const styles = layersStylesOf(140, 132, layers, '#0066ff');

    expect(styles.layers).toHaveLength(3);
    styles.layers.forEach((layer, at) => {
      expect(layer[1]).toMatchObject({
        width: 140,
        height: 132,
        tintColor: '#0066ff',
        opacity: layers[at],
      });
    });
  });
});
