import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ElapsedTime } from './ElapsedTime';

describe('ElapsedTime', () => {
  it('says how long it was, in plain text for anybody who reads the page as text', () => {
    render(<ElapsedTime ms={125_000} />);

    expect(screen.getByText('2 min')).toBeInTheDocument();
    expect(screen.getByText('5 s')).toBeInTheDocument();
  });

  it('says a moment in milliseconds', () => {
    render(<ElapsedTime ms={36} />);

    expect(screen.getByText('36 ms')).toBeInTheDocument();
  });

  it('says a few seconds to a tenth of one', () => {
    render(<ElapsedTime ms={1400} />);

    expect(screen.getByText('1.4 s')).toBeInTheDocument();
  });

  it('draws each number as the animated number every other number is', () => {
    const { container } = render(<ElapsedTime ms={125_000} />);

    expect(container.querySelectorAll('.tabular-nums')).toHaveLength(2);
  });

  it('never breaks across lines', () => {
    const { container } = render(<ElapsedTime ms={125_000} className="text-xs" />);

    expect(container.firstElementChild).toHaveClass('whitespace-nowrap', 'text-xs');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ElapsedTime.displayName).toBe('ElapsedTime');
  });
});
