import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { ItemList } from './ItemList';

const ALBUM = aRequestItem({
  id: 'a',
  season: null,
  episode: null,
  title: 'First Album',
  airDate: '2019-05-01',
  state: 'failed',
});

describe('ItemList', () => {
  it('lists what a request waits for with where each stands, and follows one', async () => {
    const onFollow = vi.fn();

    render(
      <ItemList
        title="Albums"
        request={aMediaRequest({ kind: 'artist', items: [ALBUM] })}
        items={[ALBUM]}
        isFollowing={false}
        onFollow={onFollow}
      />,
    );

    expect(screen.getByText('First Album')).toBeInTheDocument();
    expect(screen.getByText('2019')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('switch', { name: 'Follow First Album' }));

    expect(onFollow).toHaveBeenCalledWith(ALBUM, false);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ItemList.displayName).toBe('ItemList');
  });
});
