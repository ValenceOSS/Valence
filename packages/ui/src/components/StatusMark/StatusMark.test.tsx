import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusMark } from './StatusMark';

const markIn = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('[data-status]');

describe('StatusMark', () => {
  it('waits as a ring of dashes until told otherwise', () => {
    const { container } = render(<StatusMark />);

    expect(markIn(container)).toHaveAttribute('data-status', 'pending');
  });

  it('runs an arc round the ring while working with no idea how far along it is', () => {
    const { container } = render(<StatusMark status="running" />);

    expect(markIn(container)).toHaveAttribute('data-unknown');
  });

  it('fills the ring as far as it has got where that is known', () => {
    const { container } = render(<StatusMark status="running" progress={0.5} />);

    expect(markIn(container)).not.toHaveAttribute('data-unknown');
  });

  it('says nothing itself, leaving whatever holds it to say what it is for', () => {
    const { container } = render(<StatusMark status="done" />);

    expect(markIn(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws at the size it is given', () => {
    const { container } = render(<StatusMark size={32} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '32');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatusMark.displayName).toBe('StatusMark');
  });
});
