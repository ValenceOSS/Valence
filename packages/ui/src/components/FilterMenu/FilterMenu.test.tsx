import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterMenu } from './FilterMenu';

const GROUPS = [
  {
    name: 'Kind',
    options: [
      { id: 'kind:film', label: 'Film' },
      { id: 'kind:series', label: 'Series' },
    ],
  },
  { name: 'Status', options: [{ id: 'status:filed', label: 'Filed' }] },
] as const;

const open = async () => {
  const user = userEvent.setup();

  await user.click(screen.getByRole('button', { name: 'Filter requests' }));

  return user;
};

describe('FilterMenu', () => {
  it('stays shut until the icon is pressed', () => {
    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set()}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('menuitemcheckbox')).not.toBeInTheDocument();
  });

  it('offers every choice under the name of its group', async () => {
    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set()}
        onChange={vi.fn()}
      />,
    );

    await open();

    expect(screen.getByText('Kind')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitemcheckbox')).toHaveLength(3);
  });

  it('adds a choice to the ones already ticked, rather than replacing them', async () => {
    const onChange = vi.fn();

    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set(['kind:film'])}
        onChange={onChange}
      />,
    );

    const user = await open();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Filed' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['kind:film', 'status:filed']));
  });

  it('takes a ticked choice away when it is unticked', async () => {
    const onChange = vi.fn();

    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set(['kind:film', 'status:filed'])}
        onChange={onChange}
      />,
    );

    const user = await open();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Film' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['status:filed']));
  });

  it('says how many are ticked on the icon, and clears them all on request', async () => {
    const onChange = vi.fn();

    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set(['kind:film', 'status:filed'])}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filter requests' })).toHaveTextContent('2');

    const user = await open();

    await user.click(screen.getByRole('menuitem', { name: 'Clear filters' }));

    expect(onChange).toHaveBeenCalledWith(new Set());
  });

  it('lets a single group hold one choice at a time, taking the first off for the second', async () => {
    const onChange = vi.fn();

    render(
      <FilterMenu
        label="Filter requests"
        groups={[
          {
            name: 'Decade',
            isSingle: true,
            options: [
              { id: 'decade:1990', label: '1990s' },
              { id: 'decade:2000', label: '2000s' },
            ],
          },
        ]}
        selected={new Set(['decade:1990'])}
        onChange={onChange}
      />,
    );

    const user = await open();

    await user.click(screen.getByRole('menuitemcheckbox', { name: '2000s' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['decade:2000']));
  });

  it('puts a tick at the end of each choice that is in force, and only those', async () => {
    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set(['kind:film'])}
        onChange={vi.fn()}
      />,
    );

    await open();

    expect(screen.getByRole('menuitemcheckbox', { name: 'Film' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemcheckbox', { name: 'Series' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('stays open as choices are made, so several can be picked in one go', async () => {
    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set()}
        onChange={vi.fn()}
      />,
    );

    const user = await open();

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Film' }));

    expect(screen.getByRole('menuitemcheckbox', { name: 'Series' })).toBeInTheDocument();
  });

  it('offers no way to clear where nothing is in force', async () => {
    render(
      <FilterMenu
        label="Filter requests"
        groups={GROUPS}
        selected={new Set()}
        onChange={vi.fn()}
      />,
    );

    await open();

    expect(screen.queryByRole('menuitem', { name: 'Clear filters' })).not.toBeInTheDocument();
  });

  it('says Filters beside the icon where it stands on its own', () => {
    render(
      <FilterMenu
        hasLabel
        label="Filter requests"
        groups={GROUPS}
        selected={new Set()}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Filter requests' })).toHaveTextContent('Filters');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilterMenu.displayName).toBe('FilterMenu');
  });
});
