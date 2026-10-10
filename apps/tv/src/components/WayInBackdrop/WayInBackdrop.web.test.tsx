import { render } from '@testing-library/react';
import { WayInBackdrop } from '@ValenceTv/components/WayInBackdrop/WayInBackdrop';

describe('WayInBackdrop in a browser', () => {
  it('draws the plain canvas, with no picture behind it', () => {
    const drawn = render(<WayInBackdrop tint="#ff0000" />);

    expect(drawn.container.querySelectorAll('img')).toHaveLength(0);
    expect(drawn.container.firstElementChild).not.toBeNull();
  });
});
