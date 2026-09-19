import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShelfMoreCard } from './ShelfMoreCard';

describe('ShelfMoreCard', () => {
  it('lays a few of the shelf behind the way through to all of it', async () => {
    const onOpen = vi.fn();

    render(
      <ShelfMoreCard
        label="See all of trending films"
        posterUrls={['a.jpg', 'b.jpg', 'c.jpg', 'd.jpg', 'e.jpg']}
        onOpen={onOpen}
      />,
    );

    expect(screen.getByText('See more')).toBeInTheDocument();
    expect(document.querySelectorAll('img')).toHaveLength(4);

    await userEvent.click(screen.getByRole('button', { name: 'See all of trending films' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('is still a way through where there is no artwork to lay behind', () => {
    render(<ShelfMoreCard label="See all of popular series" posterUrls={[]} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'See all of popular series' })).toBeInTheDocument();
    expect(document.querySelectorAll('img')).toHaveLength(0);
  });
});
