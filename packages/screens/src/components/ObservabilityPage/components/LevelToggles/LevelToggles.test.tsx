import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LevelToggles } from './LevelToggles';
import type { LevelTogglesProps } from './LevelToggles.types';

const HISTOGRAM = {
  fromMs: 0,
  untilMs: 2000,
  bucketMs: 1000,
  buckets: [
    { atMs: 0, debug: 1, info: 10, warn: 2, error: 3 },
    { atMs: 1000, debug: 0, info: 5, warn: 1, error: 0 },
  ],
};

const draw = (over: Partial<LevelTogglesProps> = {}) => {
  const onToggle = vi.fn();

  render(
    <LevelToggles
      histogram={HISTOGRAM}
      levels={['debug', 'info', 'warn', 'error']}
      isReading={false}
      onToggle={onToggle}
      {...over}
    />,
  );

  return onToggle;
};

describe('LevelToggles', () => {
  it('adds up all the events', () => {
    draw();

    expect(screen.getByText('22')).toBeInTheDocument();
  });

  it('says how many events there were at each level', () => {
    draw();

    expect(screen.getByRole('button', { name: /Errors/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Warnings/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Info/ })).toHaveTextContent('15');
    expect(screen.getByRole('button', { name: /Debug/ })).toHaveTextContent('1');
  });

  it('says which levels are on', () => {
    draw({ levels: ['warn', 'error'] });

    expect(screen.getByRole('button', { name: /Errors/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Info/ })).not.toHaveAttribute('aria-pressed');
  });

  it('still counts a level that is off, so switching it off does not make it look empty', () => {
    draw({ levels: ['warn'] });

    expect(screen.getByRole('button', { name: /Errors/ })).toHaveTextContent('3');
  });

  it('tells which level was pressed', async () => {
    const onToggle = draw();

    await userEvent.click(screen.getByRole('button', { name: /Warnings/ }));

    expect(onToggle).toHaveBeenCalledWith('warn');
  });

  it('will not switch off the last level that is on', async () => {
    const onToggle = draw({ levels: ['error'] });

    await userEvent.click(screen.getByRole('button', { name: /Errors/ }));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('holds a place until the counts have been read', () => {
    draw({ histogram: undefined });

    expect(screen.queryByRole('list', { name: 'Levels' })).not.toBeInTheDocument();
  });

  it('says it is busy while the counts are read again', () => {
    const { container } = render(
      <LevelToggles histogram={HISTOGRAM} levels={['error']} isReading onToggle={vi.fn()} />,
    );

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LevelToggles.displayName).toBe('LevelToggles');
  });
});
