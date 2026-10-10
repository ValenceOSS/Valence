import { render } from '@testing-library/react';
import { MoodBackdrop } from '@ValenceTv/components/MoodBackdrop/MoodBackdrop';

describe('MoodBackdrop in a browser', () => {
  it('draws the plain canvas, with no picture behind it', () => {
    const drawn = render(<MoodBackdrop path="/api/media/a/image/backdrop" />);

    expect(drawn.container.querySelectorAll('img')).toHaveLength(0);
    expect(drawn.container.firstElementChild).not.toBeNull();
  });
});
