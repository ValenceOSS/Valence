import { render } from '@testing-library/react-native';
import { ABadge } from './ABadge';

describe('ABadge', () => {
  it('says what it was given', async () => {
    const drawn = await render(<ABadge tone="solid">Drama</ABadge>);

    expect(drawn.getByText('Drama')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ABadge.displayName).toBe('ABadge');
  });
});
