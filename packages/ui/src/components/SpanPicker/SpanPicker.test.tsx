import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SpanPicker } from './SpanPicker';

const VALUES = Array.from({ length: 101 }, (_, at) => at % 50);

describe('SpanPicker', () => {
  it('names the window for anybody who cannot see it', () => {
    render(
      <SpanPicker
        values={VALUES}
        ceiling={100}
        span={{ start: 80, end: 100 }}
        onSpanChange={vi.fn()}
        label="Which part of the week the chart shows"
      />,
    );

    expect(
      screen.getByRole('slider', { name: 'Which part of the week the chart shows' }),
    ).toBeInTheDocument();
  });

  it('moves the window a tenth of its width with the arrow keys, keeping it inside the strip', async () => {
    const onSpanChange = vi.fn();

    render(
      <SpanPicker
        values={VALUES}
        ceiling={100}
        span={{ start: 70, end: 90 }}
        onSpanChange={onSpanChange}
        label="Span"
      />,
    );

    screen.getByRole('slider').focus();
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.keyboard('{ArrowRight}');

    expect(onSpanChange.mock.calls).toEqual([[{ start: 68, end: 88 }], [{ start: 72, end: 92 }]]);
  });

  it('writes the marks beneath the strip', () => {
    render(
      <SpanPicker
        values={VALUES}
        ceiling={100}
        span={{ start: 0, end: 100 }}
        onSpanChange={vi.fn()}
        label="Span"
        tickOf={(at) => `T${at.toString()}`}
      />,
    );

    expect(screen.getByText('T0')).toBeInTheDocument();
    expect(screen.getByText('T100')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SpanPicker.displayName).toBe('SpanPicker');
  });
});
