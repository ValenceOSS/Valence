import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RevealItem } from '@ValenceUI/RevealItem';
import { MusicShelf } from './MusicShelf';

const tiles = ['One', 'Two'].map((name, at) => (
  <RevealItem key={name} index={at}>
    {name}
  </RevealItem>
));

describe('MusicShelf', () => {
  it('pages a rail of tiles under its heading', () => {
    render(<MusicShelf heading="Recently added">{tiles}</MusicShelf>);

    expect(screen.getByRole('region', { name: 'Recently added' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recently added' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('wraps a grid of tiles for a page that is only the list', () => {
    render(
      <MusicShelf heading="Albums" layout="grid" count={2} action={<span>Order</span>}>
        {tiles}
      </MusicShelf>,
    );

    expect(screen.getByRole('list')).toHaveClass('grid');
    expect(screen.getByText('Order')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MusicShelf.displayName).toBe('MusicShelf');
  });
});
