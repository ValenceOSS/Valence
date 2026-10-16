import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PinField } from './PinField';

const boxes = (container: HTMLElement) => container.querySelectorAll('[data-slot="pin-box"]');

const Typed = ({ onValueChange }: { onValueChange?: (value: string) => void }) => {
  const [value, setValue] = useState('');

  return (
    <PinField
      label="PIN"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onValueChange?.(next);
      }}
    />
  );
};

describe('PinField', () => {
  it('shows four boxes before anything is typed', () => {
    const { container } = render(<PinField label="PIN" value="" onValueChange={vi.fn()} />);

    expect(boxes(container)).toHaveLength(4);
  });

  it('keeps four boxes for a four digit PIN, with no fifth waiting', () => {
    const { container } = render(<PinField label="PIN" value="1234" onValueChange={vi.fn()} />);

    expect(boxes(container)).toHaveLength(4);
  });

  it('adds a box for each digit past the fourth, up to eight', () => {
    const { container, rerender } = render(
      <PinField label="PIN" value="12345" onValueChange={vi.fn()} />,
    );

    expect(boxes(container)).toHaveLength(5);

    rerender(<PinField label="PIN" value="12345678" onValueChange={vi.fn()} />);

    expect(boxes(container)).toHaveLength(8);
  });

  it('takes only digits, and no more than eight of them', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(<Typed onValueChange={onValueChange} />);

    await user.type(screen.getByLabelText('PIN'), '12a3456789');

    expect(onValueChange).toHaveBeenLastCalledWith('12345678');
  });

  it('says what is wrong once, as an alert', () => {
    render(<PinField label="PIN" value="" onValueChange={vi.fn()} error="That PIN is wrong." />);

    expect(screen.getByRole('alert')).toHaveTextContent('That PIN is wrong.');
    expect(screen.getAllByText('That PIN is wrong.')).toHaveLength(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PinField.displayName).toBe('PinField');
  });
});
