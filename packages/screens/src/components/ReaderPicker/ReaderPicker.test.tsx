import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReaderPicker } from './ReaderPicker';

/**
 * Draws a chapter picker with the given overrides.
 */
const draw = (overrides: Partial<Parameters<typeof ReaderPicker>[0]> = {}) => {
  const onSelect = vi.fn();

  render(
    <ReaderPicker
      label="Chapter"
      value="Chapter 4"
      selectedId="4"
      options={[
        { id: '3', label: 'Chapter 3' },
        { id: '4', label: 'Chapter 4' },
        { id: '5', label: 'Chapter 5' },
      ]}
      onSelect={onSelect}
      previousLabel="Previous chapter"
      nextLabel="Next chapter"
      {...overrides}
    />,
  );

  return onSelect;
};

describe('ReaderPicker', () => {
  it('names what is chosen, under what it is', () => {
    draw();

    expect(screen.getByText('Chapter 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument();
  });

  it('chooses from the whole list', async () => {
    const onSelect = draw();

    await userEvent.click(screen.getByRole('button', { name: 'Chapter' }));
    await userEvent.click(await screen.findByText('Chapter 5'));

    expect(onSelect).toHaveBeenCalledWith('5');
  });

  it('steps either way', async () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    draw({ onPrevious, onNext });

    await userEvent.click(screen.getByRole('button', { name: 'Previous chapter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Next chapter' }));

    expect(onPrevious).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it('cannot step where there is nowhere to go', () => {
    draw();

    expect(screen.getByRole('button', { name: 'Previous chapter' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next chapter' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ReaderPicker.displayName).toBe('ReaderPicker');
  });
});
