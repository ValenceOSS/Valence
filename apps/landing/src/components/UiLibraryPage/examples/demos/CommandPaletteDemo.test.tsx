import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { CommandPaletteDemo } from './CommandPaletteDemo';

beforeEach(() => {
  Element.prototype.scrollIntoView = () => undefined;
});

describe('CommandPaletteDemo', () => {
  it('filters its commands as the query is typed', async () => {
    render(<CommandPaletteDemo />);

    await userEvent.click(screen.getByRole('button', { name: 'Open the command palette' }));
    await userEvent.type(await screen.findByPlaceholderText('Search commands'), 'scan');

    expect(await screen.findByText('Scan every library')).toBeInTheDocument();
    expect(screen.queryByText('Films')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(CommandPaletteDemo.displayName).toBe('CommandPaletteDemo');
  });
});
