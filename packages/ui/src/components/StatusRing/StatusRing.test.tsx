import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusRing } from './StatusRing';

const markIn = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('[data-status]');

describe('StatusRing', () => {
  it('waits as a ring of dashes until told otherwise', () => {
    const { container } = render(<StatusRing />);

    expect(markIn(container)).toHaveAttribute('data-status', 'pending');
  });

  it('runs an arc round the ring while working with no idea how far along it is', () => {
    const { container } = render(<StatusRing status="running" />);

    expect(markIn(container)).toHaveAttribute('data-unknown');
  });

  it('fills the ring as far as it has got where that is known', () => {
    const { container } = render(<StatusRing status="running" progress={0.5} />);

    expect(markIn(container)).not.toHaveAttribute('data-unknown');
  });

  it('says nothing itself, leaving whatever holds it to say what it is for', () => {
    const { container } = render(<StatusRing status="done" />);

    expect(markIn(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws at the size it is given', () => {
    const { container } = render(<StatusRing size={32} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatusRing.displayName).toBe('StatusRing');
  });
});
