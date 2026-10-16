import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PartyChat } from './PartyChat';

const LINES = [
  { id: 'a', byName: 'Dan', byConnectionId: 'dan', text: 'popcorn?', atMs: 1 },
  { id: 'b', byName: 'Sam', byConnectionId: 'sam', text: 'yes please', atMs: 2 },
];

describe('PartyChat', () => {
  it('shows what has been said, marking this person’s own lines as theirs', () => {
    render(<PartyChat lines={LINES} meConnectionId="sam" onWrite={vi.fn()} />);

    expect(screen.getByText('popcorn?')).toBeInTheDocument();
    expect(screen.getByText('Dan')).toBeInTheDocument();
    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('says nothing has been said yet before anybody writes', () => {
    render(<PartyChat lines={[]} meConnectionId="sam" onWrite={vi.fn()} />);

    expect(screen.getByText('Nothing said yet.')).toBeInTheDocument();
  });

  it('passes on what was written and clears the field', async () => {
    const onWrite = vi.fn();
    const user = userEvent.setup();

    render(<PartyChat lines={[]} meConnectionId="sam" onWrite={onWrite} />);

    const field = screen.getByRole('textbox', { name: 'Say something' });

    await user.type(field, '  hello  {Enter}');

    expect(onWrite).toHaveBeenCalledWith('hello');
    expect(field).toHaveValue('');
  });

  it('will not send nothing', () => {
    render(<PartyChat lines={[]} meConnectionId="sam" onWrite={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PartyChat.displayName).toBe('PartyChat');
  });
});
