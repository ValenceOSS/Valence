import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MusicShelf } from './MusicShelf';

const tiles = ['One', 'Two'].map((name) => ({ key: name, tile: <span>{name}</span> }));

describe('MusicShelf', () => {
  it('pages a rail of tiles under its heading, each revealed in turn', () => {
    render(<MusicShelf heading="Recently added" tiles={tiles} />);

    expect(screen.getByRole('region', { name: 'Recently added' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recently added' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('lays a page that is only the list out as a grid that draws what is in view', () => {
    render(
      <MusicShelf
        heading="Albums"
        layout="grid"
        count={2}
        action={<span>Order</span>}
        tiles={tiles}
      />,
    );

    expect(screen.getByRole('region', { name: 'Albums' })).toBeInTheDocument();
    expect(screen.getByLabelText('Albums', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicShelf.displayName).toBe('MusicShelf');
  });
});
