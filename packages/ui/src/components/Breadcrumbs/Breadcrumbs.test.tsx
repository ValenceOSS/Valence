import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Breadcrumbs } from './Breadcrumbs';

const CRUMBS = [
  { id: 'top', label: 'Libraries' },
  { id: '/films', label: 'Films' },
  { id: '/films/Arrival', label: 'Arrival' },
];

describe('Breadcrumbs', () => {
  it('lays the trail out from the top, the step you are on marked', () => {
    render(<Breadcrumbs label="Where you are" crumbs={CRUMBS} onChoose={vi.fn()} />);

    const trail = screen.getByRole('navigation', { name: 'Where you are' });

    expect(trail).toHaveTextContent('LibrariesFilmsArrival');
    expect(screen.getByRole('button', { name: 'Arrival' })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  it('goes back up to the step pressed', async () => {
    const onChoose = vi.fn();

    render(<Breadcrumbs label="Where you are" crumbs={CRUMBS} onChoose={onChoose} />);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Films' }));

    expect(onChoose).toHaveBeenCalledWith('/films');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Breadcrumbs.displayName).toBe('Breadcrumbs');
  });
});
