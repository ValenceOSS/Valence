import { render } from '@testing-library/react-native';
import { ControllerHint } from '@ValenceTv/components/ControllerHint/ControllerHint';

describe('ControllerHint', () => {
  it('draws nothing on a television app', async () => {
    const drawn = await render(<ControllerHint />);

    expect(drawn.toJSON()).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ControllerHint.displayName).toBe('ControllerHint');
  });
});
