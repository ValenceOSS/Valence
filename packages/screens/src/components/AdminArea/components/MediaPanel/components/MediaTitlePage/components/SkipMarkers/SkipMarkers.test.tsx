import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { SkipMarkers } from './SkipMarkers';

const { listing, saving } = vi.hoisted(() => ({
  listing: vi.fn(() =>
    Promise.resolve([{ kind: 'intro', startSeconds: 30, endSeconds: 90, source: 'fingerprint' }]),
  ),
  saving: vi.fn((_mediaId: string, segments: object[]) => Promise.resolve(segments)),
}));

vi.mock('@ValenceClient/playback/fetchSegments', () => ({ fetchSegments: listing }));
vi.mock('@ValenceClient/admin/saveSegments', () => ({ saveSegments: saving }));

describe('SkipMarkers', () => {
  it('changes a marker and adds one, saving them together', async () => {
    const user = userEvent.setup();

    render(<SkipMarkers mediaId="file" />, { wrapper: CacheScope });

    const [ends] = await screen.findAllByLabelText('Marker ends at');

    expect(ends).toHaveValue('1:30');

    if (ends !== undefined) {
      await user.clear(ends);
      await user.type(ends, '1:45');
    }

    await user.click(screen.getByRole('button', { name: 'Add a marker' }));

    const starts = screen.getAllByLabelText('Marker starts at');
    const endsNow = screen.getAllByLabelText('Marker ends at');

    await user.type(starts[1] ?? document.body, '40:00');

    expect(screen.getByRole('button', { name: 'Save markers' })).toBeDisabled();

    await user.type(endsNow[1] ?? document.body, '41:30');
    await user.click(screen.getByRole('button', { name: 'Save markers' }));

    await waitFor(() => {
      expect(saving).toHaveBeenCalledWith('file', [
        { kind: 'intro', startSeconds: 30, endSeconds: 105 },
        { kind: 'intro', startSeconds: 2400, endSeconds: 2490 },
      ]);
    });
  });
});
