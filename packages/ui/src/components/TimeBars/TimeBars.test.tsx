import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimeBars } from './TimeBars';
import type { TimeBarsProps } from './TimeBars.types';

const SERIES = [
  { key: 'info', label: 'Info', colour: 'blue' },
  { key: 'error', label: 'Errors', colour: 'red' },
];

const BARS = [
  { atMs: 0, values: { info: 4, error: 0 } },
  { atMs: 1000, values: { info: 2, error: 2 } },
  { atMs: 2000, values: { info: 0, error: 0 } },
  { atMs: 3000, values: { info: 8, error: 0 } },
];

const draw = (over: Partial<TimeBarsProps> = {}) =>
  render(
    <TimeBars
      bars={BARS}
      series={SERIES}
      bucketMs={1000}
      label="Log events over time"
      formatTick={(atMs) => `t${(atMs / 1000).toString()}`}
      {...over}
    />,
  );

const chart = () => screen.getByRole('img', { name: 'Log events over time' });

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 100,
    bottom: 40,
    width: 100,
    height: 40,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TimeBars', () => {
  it('says what it shows to anybody who cannot see it', () => {
    draw();

    expect(chart()).toBeInTheDocument();
  });

  it('draws a bar for each stretch of time, each stack split by series', () => {
    const { container } = draw();

    expect(container.querySelectorAll('[data-series="info"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-series="error"]')).toHaveLength(1);
  });

  it('scales every bar to the tallest, so a quiet stretch looks quiet', () => {
    const { container } = draw();
    const heights = Array.from(container.querySelectorAll<HTMLElement>('[data-series="info"]')).map(
      (segment) => segment.style.height,
    );

    expect(heights).toStrictEqual(['50%', '25%', '100%']);
  });

  it('says nothing was there where there are no bars', () => {
    draw({ bars: [] });

    expect(screen.getByText('Nothing in this time.')).toBeInTheDocument();
  });

  it('labels the moments along the bottom and names each series', () => {
    draw();

    expect(screen.getByText('t0')).toBeInTheDocument();
    expect(screen.getByText('t3')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
  });

  it('leaves out the legend where the caller names the series itself, keeping the hint', () => {
    draw({ hasLegend: false, onPickRange: vi.fn() });

    expect(screen.queryByText('Errors')).not.toBeInTheDocument();
    expect(screen.getByText('Drag across the bars to zoom in')).toBeInTheDocument();
  });

  it('says when a bar was and how much of each series it holds when the pointer rests on it', () => {
    draw({ formatSpan: (from, until) => `${from.toString()}–${until.toString()}` });

    fireEvent.pointerMove(chart(), { clientX: 10 });

    const tip = screen.getByRole('tooltip');

    expect(tip).toHaveTextContent('0–1000');
    expect(tip).toHaveTextContent('Info');
    expect(tip).toHaveTextContent('4');
  });

  it('lays the note over the chart beside the bar, on the side that has room', () => {
    draw();

    fireEvent.pointerMove(chart(), { clientX: 10 });

    expect(chart().parentElement).toContainElement(screen.getByRole('tooltip'));
    expect(screen.getByRole('tooltip').style.transform).toBe('translateX(0.75rem)');

    fireEvent.pointerMove(chart(), { clientX: 90 });

    expect(screen.getByRole('tooltip').style.transform).toBe('translateX(calc(-100% - 0.75rem))');
  });

  it('follows the pointer from bar to bar and forgets it when it leaves', () => {
    draw({ formatSpan: (from) => `from ${from.toString()}` });

    fireEvent.pointerMove(chart(), { clientX: 60 });

    expect(screen.getByRole('tooltip')).toHaveTextContent('from 2000');

    fireEvent.pointerLeave(chart());

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('picks the stretch dragged across, both ends included', () => {
    const onPickRange = vi.fn();

    draw({ onPickRange });
    fireEvent.pointerDown(chart(), { clientX: 30 });
    fireEvent.pointerMove(chart(), { clientX: 80 });
    fireEvent.pointerUp(chart(), { clientX: 80 });

    expect(onPickRange).toHaveBeenCalledWith(1000, 4000);
  });

  it('picks the same stretch when it is dragged backwards', () => {
    const onPickRange = vi.fn();

    draw({ onPickRange });
    fireEvent.pointerDown(chart(), { clientX: 80 });
    fireEvent.pointerUp(chart(), { clientX: 30 });

    expect(onPickRange).toHaveBeenCalledWith(1000, 4000);
  });

  it('picks a single bar when it is only pressed', () => {
    const onPickRange = vi.fn();

    draw({ onPickRange });
    fireEvent.pointerDown(chart(), { clientX: 10 });
    fireEvent.pointerUp(chart(), { clientX: 10 });

    expect(onPickRange).toHaveBeenCalledWith(0, 1000);
  });

  it('marks the bars being dragged across', () => {
    const { container } = draw({ onPickRange: vi.fn() });

    fireEvent.pointerDown(chart(), { clientX: 30 });
    fireEvent.pointerMove(chart(), { clientX: 60 });

    expect(container.querySelectorAll('[data-selected="true"]')).toHaveLength(2);
  });

  it('gives up a drag when the pointer leaves', () => {
    const onPickRange = vi.fn();

    draw({ onPickRange });
    fireEvent.pointerDown(chart(), { clientX: 30 });
    fireEvent.pointerLeave(chart());
    fireEvent.pointerUp(chart(), { clientX: 60 });

    expect(onPickRange).not.toHaveBeenCalled();
  });

  it('does not offer to pick where nobody is listening', () => {
    draw();

    expect(screen.queryByText('Drag across the bars to zoom in')).not.toBeInTheDocument();
  });

  it('offers to pick where somebody is listening', () => {
    draw({ onPickRange: vi.fn() });

    expect(screen.getByText('Drag across the bars to zoom in')).toBeInTheDocument();
  });

  it('draws only the bars when compact, with no axis, legend or picking', () => {
    const onPickRange = vi.fn();

    draw({ isCompact: true, onPickRange });

    expect(screen.queryByText('t0')).not.toBeInTheDocument();
    expect(screen.queryByText('Errors')).not.toBeInTheDocument();

    fireEvent.pointerDown(chart(), { clientX: 10 });
    fireEvent.pointerUp(chart(), { clientX: 10 });

    expect(onPickRange).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TimeBars.displayName).toBe('TimeBars');
  });
});
