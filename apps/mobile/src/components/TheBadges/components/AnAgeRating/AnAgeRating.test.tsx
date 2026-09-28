import { render } from '@testing-library/react-native';
import { theDrawnRoot } from '@ValenceMobile/testing/theDrawnRoot';
import { AnAgeRating } from './AnAgeRating';

describe('AnAgeRating', () => {
  it('shows the board’s own mark, and says what it is', async () => {
    const drawn = await render(<AnAgeRating certification="15" region="GB" ink="#a4a4a4" />);

    expect(drawn.getByLabelText('Rated 15 by the BBFC')).toBeTruthy();
    expect(theDrawnRoot().type).toBe('Image');
    expect(drawn.queryByText('15')).toBeNull();
  });

  it('keeps the mark in proportion at the height of the badges beside it', async () => {
    await render(<AnAgeRating certification="PG-13" region="US" ink="#a4a4a4" />);

    expect(theDrawnRoot()).toHaveStyle({ height: 20 });
  });

  it('writes a certificate out where its board has no mark to show', async () => {
    const drawn = await render(<AnAgeRating certification="16" region="FR" ink="#a4a4a4" />);

    expect(drawn.getByText('16')).toBeTruthy();
    expect(drawn.getByLabelText('Rated 16 by the CNC')).toBeTruthy();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnAgeRating.displayName).toBe('AnAgeRating');
  });
});
