import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusMark } from './StatusMark';

describe('StatusMark', () => {
  it('is hidden from assistive technology unless it is given a label', () => {
    const { container } = render(<StatusMark state="idle" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('reads out its label where it has one', () => {
    render(<StatusMark state="loading" label="Loading" />);

    expect(screen.getByRole('img', { name: 'Loading' })).toBeInTheDocument();
  });

  it('marches dashes round while it waits', () => {
    const { container } = render(<StatusMark state="loading" />);

    expect(container.querySelector('rect')).toHaveAttribute('stroke-dasharray', '7.5 5');
  });

  it('draws a whole outline once it stops waiting', () => {
    const { container } = render(<StatusMark state="done" />);

    expect(container.querySelector('rect')).toHaveAttribute('stroke-dasharray', '100 0');
  });

  it('is coloured for how it stands', () => {
    const { container, rerender } = render(<StatusMark state="done" />);

    expect(container.querySelector('svg')).toHaveClass('text-accent');

    rerender(<StatusMark state="failed" />);

    expect(container.querySelector('svg')).toHaveClass('text-danger');
  });

  it('turns from gold to orange to green as progress is made', () => {
    const { container, rerender } = render(<StatusMark state="progress" progress={0.1} />);

    expect(container.querySelector('svg')).toHaveClass('text-highlight');

    rerender(<StatusMark state="progress" progress={0.5} />);
    expect(container.querySelector('svg')).toHaveClass('text-busy');

    rerender(<StatusMark state="progress" progress={2} />);
    expect(container.querySelector('svg')).toHaveClass('text-success');
  });

  it('is drawn at the size asked for', () => {
    const { container } = render(<StatusMark state="idle" size={24} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StatusMark.displayName).toBe('StatusMark');
  });
});
