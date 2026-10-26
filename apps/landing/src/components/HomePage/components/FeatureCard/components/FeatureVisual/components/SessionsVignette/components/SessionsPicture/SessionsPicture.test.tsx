import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SessionsPicture } from './SessionsPicture';

describe('SessionsPicture', () => {
  it('lists who is watching what, right now, on the app’s own session cards', () => {
    render(<SessionsPicture />);

    expect(screen.getByText('Harbour Lights')).toBeInTheDocument();
    expect(screen.getByText('The Lantern Keepers')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByText('Northbound')).not.toBeInTheDocument();
  });

  it('brings in somebody else starting to watch once acted out', () => {
    render(<SessionsPicture isActed />);

    expect(screen.getByRole('heading', { name: 'Theo' })).toBeInTheDocument();
    expect(screen.getByText('Northbound')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('puts the session that has just started first, where it is seen', () => {
    render(<SessionsPicture isActed />);

    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Northbound');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SessionsPicture.displayName).toBe('SessionsPicture');
  });
});
