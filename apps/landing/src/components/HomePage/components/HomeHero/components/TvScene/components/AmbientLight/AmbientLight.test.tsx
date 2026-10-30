import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AmbientLight } from './AmbientLight';

describe('AmbientLight', () => {
  it('stays dark until it has colours to show', () => {
    const { container } = render(<AmbientLight colours={[]} />);

    expect(container.firstElementChild).toHaveStyle({ opacity: '0' });
  });

  it('lights the room in the colours it is given', () => {
    const { container } = render(<AmbientLight colours={['#e0841f', '#3b86aa', '#a44a2c']} />);
    const light = container.firstElementChild;

    expect(light instanceof HTMLElement && light.style.getPropertyValue('--ambient-a')).toBe(
      '#e0841f',
    );
    expect(light).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AmbientLight.displayName).toBe('AmbientLight');
  });
});
