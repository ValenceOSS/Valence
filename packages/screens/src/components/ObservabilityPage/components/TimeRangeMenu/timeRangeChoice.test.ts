import { describe, expect, it, vi } from 'vitest';
import { timeRangeChoice } from './timeRangeChoice';

describe('timeRangeChoice', () => {
  it('offers the usual spans, with the one in force chosen', () => {
    const choice = timeRangeChoice({ range: '7d' }, vi.fn());

    expect(choice.value).toBe('7d');
    expect(choice.options.map((option) => option.id)).toEqual([
      '15m',
      '1h',
      '6h',
      '24h',
      '7d',
      'all',
    ]);
  });

  it('chooses the stretch dragged across a chart while there is one', () => {
    const choice = timeRangeChoice({ from: 1, until: 2 }, vi.fn());

    expect(choice.value).toBe('zoomed');
    expect(choice.options[0]?.label).toBe('Zoomed in');
  });

  it('leaves a dragged stretch for the span chosen, and the address for the usual one', () => {
    const onSearchChange = vi.fn();

    timeRangeChoice({ from: 1, until: 2 }, onSearchChange).onChange('1h');

    expect(onSearchChange).toHaveBeenCalledWith({ range: '1h', from: undefined, until: undefined });

    timeRangeChoice({ range: '1h' }, onSearchChange).onChange('24h');

    expect(onSearchChange).toHaveBeenLastCalledWith({
      range: undefined,
      from: undefined,
      until: undefined,
    });
  });
});
