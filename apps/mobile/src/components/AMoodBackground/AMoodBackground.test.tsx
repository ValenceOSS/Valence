import { render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AMoodBackground } from './AMoodBackground';

describe('AMoodBackground', () => {
  it('lights the page in the house colours where it has none of its own, out of the way of a press', async () => {
    await render(<AMoodBackground />);

    expect(theDrawnRoot().props.pointerEvents).toBe('none');
  });

  it('is drawn once and kept as one picture', async () => {
    await render(<AMoodBackground palette={[{ colour: '#ff0000', at: '10% 10%' }]} />);

    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(true);
  });

  it('is not kept as a picture while its colours crossfade', async () => {
    const drawn = await render(
      <AMoodBackground palette={[{ colour: '#ff0000', at: '10% 10%' }]} />,
    );

    await drawn.rerender(<AMoodBackground palette={[{ colour: '#00ff00', at: '10% 10%' }]} />);

    expect(theDrawnRoot().props.shouldRasterizeIOS).toBe(false);
  });
});
