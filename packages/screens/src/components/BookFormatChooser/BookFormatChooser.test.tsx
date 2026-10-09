import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BookFormatChooser } from './BookFormatChooser';

describe('BookFormatChooser', () => {
  it('ticks the formats given, and adds or takes one away', async () => {
    const onChange = vi.fn();

    render(<BookFormatChooser value={['ebook']} onChange={onChange} />);

    expect(screen.getByRole('checkbox', { name: 'Ebook' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Audiobook' })).not.toBeChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Audiobook' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Ebook' }));

    expect(onChange.mock.calls).toEqual([[['ebook', 'audiobook']], [[]]]);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BookFormatChooser.displayName).toBe('BookFormatChooser');
  });
});
