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

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
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
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
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

    await user.click(screen.getByRole('checkbox', { name: 'Filed' }));

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

    await user.click(screen.getByRole('checkbox', { name: 'Film' }));

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

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

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

    await user.click(screen.getByRole('checkbox', { name: '2000s' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['decade:2000']));
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilterMenu.displayName).toBe('FilterMenu');
  });
});
