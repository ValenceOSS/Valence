import { render } from '@testing-library/react-native';
import { EQUALISER_BARS } from '@ValenceCore/tokens/EQUALISER_BARS';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AEqualiser } from './AEqualiser';

describe('AEqualiser', () => {
  it('is read aloud as what it marks', async () => {
    const drawn = await render(<AEqualiser label="Playing" isMoving colour="#fff" />);

    expect(drawn.getByRole('image', { name: 'Playing' })).toBeTruthy();
  });

  it('draws one bar for each the web draws, in the colour given', async () => {
    await render(<AEqualiser label="Playing" isMoving={false} colour="#ff0000" />);

    const bars = theDrawnRoot().queryAll(
      (node) => typeof node.type === 'string' && node.props['accessibilityLabel'] === undefined,
    );

    expect(bars.length).toBeGreaterThanOrEqual(EQUALISER_BARS.length);
    expect(bars.at(-1)).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AEqualiser.displayName).toBe('AEqualiser');
  });
});
