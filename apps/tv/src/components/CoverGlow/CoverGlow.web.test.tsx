import { render } from '@testing-library/react';
import { CoverGlow } from '@ValenceTv/components/CoverGlow/CoverGlow';

describe('CoverGlow in a browser', () => {
  it('draws the plain canvas, with no picture behind it', () => {
    const drawn = render(<CoverGlow path="/api/media/a/image/backdrop" />);

    expect(drawn.container.querySelectorAll('img')).toHaveLength(0);
    expect(drawn.container.firstElementChild).not.toBeNull();
  });
});
