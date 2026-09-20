import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AmbientOrbs } from './AmbientOrbs';

describe('AmbientOrbs', () => {
  it('draws an orb for each light, each in its colour', () => {
    const { container } = render(
      <AmbientOrbs lights={['rgb(255 0 0)', 'rgb(0 255 0)', 'rgb(0 0 255)', 'rgb(9 9 9)']} />,
    );

    const orbs = container.querySelectorAll('span');

    expect(orbs).toHaveLength(4);
    expect(orbs[0]).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    expect(orbs[2]).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
  });

  it('is left out of what a screen reader reads', () => {
    const { container } = render(<AmbientOrbs lights={[]} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AmbientOrbs.displayName).toBe('AmbientOrbs');
  });
});
