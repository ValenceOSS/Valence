import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminStatusFooter } from './AdminStatusFooter';

describe('AdminStatusFooter', () => {
  it('names the release the server runs, on a pill that opens the updates page', () => {
    const onOpenUpdates = vi.fn();

    render(
      <AdminStatusFooter
        version="1.6.0"
        acceleration={null}
        ffmpeg={null}
        latest={null}
        onOpenUpdates={onOpenUpdates}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /1\.6\.0/ }));

    expect(onOpenUpdates).toHaveBeenCalledOnce();
  });

  it('offers the way to a newer release', () => {
    const onOpenUpdates = vi.fn();

    render(
      <AdminStatusFooter
        version="1.6.0"
        acceleration={null}
        ffmpeg={null}
        latest="1.7.0"
        onOpenUpdates={onOpenUpdates}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /1\.7\.0/ }));

    expect(onOpenUpdates).toHaveBeenCalledOnce();
  });
});
