import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ValenceRun } from './ValenceRun';

describe('ValenceRun', () => {
  it('writes the name twice as many times as it repeats, so the loop never shows its seam', () => {
    render(<ValenceRun repeats={3} />);

    expect(screen.getAllByText('Valence')).toHaveLength(6);
  });

  it('runs the other way when asked, and starts partway along', () => {
    const { container } = render(<ValenceRun isBackwards startsAt={2} />);
    const run = container.firstElementChild;

    expect(run).toHaveClass('[animation-direction:reverse]', 'leading-none');
    expect(run?.getAttribute('style')).toMatch(/margin-left:\s*-2em/u);
  });

  it('sets each name apart with the mark, in the colour of the words', () => {
    const { container } = render(<ValenceRun repeats={2} />);

    expect(container.querySelectorAll('.bg-current')).toHaveLength(4);
  });

  it('holds still where it is told to, and takes as long a loop as it is given', () => {
    const { container } = render(<ValenceRun isRunning={false} loopSeconds={160} />);
    const style = container.firstElementChild?.getAttribute('style') ?? '';

    expect(style).toMatch(/animation-play-state:\s*paused/u);
    expect(style).toMatch(/animation-duration:\s*160s/u);
  });

  it('is hidden from screen readers', () => {
    const { container } = render(<ValenceRun />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ValenceRun.displayName).toBe('ValenceRun');
  });
});
