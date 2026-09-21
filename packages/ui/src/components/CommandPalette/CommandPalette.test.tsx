import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from './CommandPalette';

const groups = [
  {
    heading: 'Install',
    items: [
      { id: '/install/docker-compose', label: 'Docker Compose', detail: 'Run it with compose' },
      { id: '/install/updating', label: 'Updating' },
    ],
  },
];

const palette = (overrides: Partial<Parameters<typeof CommandPalette>[0]> = {}) => (
  <CommandPalette
    label="Search the documentation"
    isOpen
    onClose={() => undefined}
    query=""
    onQueryChange={() => undefined}
    groups={groups}
    onSelect={() => undefined}
    {...overrides}
  />
);

describe('CommandPalette', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => undefined;
  });

  it('lists the results under their headings', () => {
    render(palette());

    expect(screen.getByText('Install')).toBeInTheDocument();
    expect(screen.getByText('Docker Compose')).toBeInTheDocument();
    expect(screen.getByText('Run it with compose')).toBeInTheDocument();
  });

  it('shows nothing while closed', () => {
    render(palette({ isOpen: false }));

    expect(screen.queryByText('Docker Compose')).not.toBeInTheDocument();
  });

  it('says what was typed', async () => {
    const onQueryChange = vi.fn();
    const user = userEvent.setup();

    render(palette({ onQueryChange }));
    await user.type(screen.getByRole('combobox'), 'u');

    expect(onQueryChange).toHaveBeenCalledWith('u');
  });

  it('chooses a result by its id', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();

    render(palette({ onSelect }));
    await user.click(screen.getByText('Updating'));

    expect(onSelect).toHaveBeenCalledWith('/install/updating');
  });

  it('says when nothing matches', () => {
    render(palette({ groups: [] }));

    expect(screen.getByText('Nothing matches that.')).toBeInTheDocument();
  });
});
