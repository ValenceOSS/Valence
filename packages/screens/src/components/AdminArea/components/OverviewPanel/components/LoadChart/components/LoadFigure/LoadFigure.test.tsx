import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LoadFigure } from './LoadFigure';

describe('LoadFigure', () => {
  it('names a figure quietly and gives its value large beneath it', () => {
    render(
      <dl>
        <LoadFigure label="Peak">80%</LoadFigure>
      </dl>,
    );

    expect(screen.getByText('Peak').tagName).toBe('DT');
    expect(screen.getByText('Peak').nextElementSibling).toHaveTextContent('80%');
    expect(screen.getByText('80%')).toHaveClass('text-lg', 'tabular-nums');
  });

  it('keeps to the edge of its column it is given once the figures share a row', () => {
    render(
      <dl>
        <LoadFigure label="Memory" align="end">
          8 GB
        </LoadFigure>
      </dl>,
    );

    expect(screen.getByText('Memory').parentElement).toHaveClass('lg:items-end', 'lg:text-right');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LoadFigure.displayName).toBe('LoadFigure');
  });
});
