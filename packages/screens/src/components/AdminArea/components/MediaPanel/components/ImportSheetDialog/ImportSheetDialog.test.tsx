import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { ImportSheetDialog } from './ImportSheetDialog';

const LEAD = { ...aMediaSummary({ id: 'one' }), externalId: '1', genres: ['Drama'] };

const { paging, editing } = vi.hoisted(() => ({ paging: vi.fn(), editing: vi.fn() }));

vi.mock('@ValenceClient/admin/fetchTitlePage', () => ({ fetchTitlePage: paging }));
vi.mock('@ValenceClient/admin/fetchTitleMetadata', () => ({ editTitleMetadata: editing }));

describe('ImportSheetDialog', () => {
  it('shows what an edited export changes, and changes it only once applied', async () => {
    paging.mockResolvedValue({
      titles: [
        {
          id: 'movie:1',
          key: 'movie:1',
          kind: 'film',
          libraryId: 'lib',
          lead: LEAD,
          name: 'One',
          order: 'one',
          year: 2020,
          files: 1,
          versions: 0,
          seasons: 0,
          episodes: 0,
          sizeBytes: null,
          durationSeconds: 0,
          latestAddedAt: LEAD.addedAt,
          isMatched: true,
          posterFrom: null,
          folder: null,
          leadPath: null,
          looks: {
            step: null,
            isStepMixed: false,
            range: null,
            isRangeMixed: false,
            codec: null,
            isCodecMixed: false,
            audio: null,
            isAudioMixed: false,
          },
          problemFiles: { duplicate: [], unreadable: [] },
          isEdited: false,
        },
      ],
      next: null,
      total: 1,
      counts: { all: 1, look: 0, twice: 0, unreadable: 0, edited: 0 },
    });
    editing.mockResolvedValue({ kind: 'saved', outcome: {} });

    const user = userEvent.setup();
    const sheet = new File(
      ['kind,title,genres,tmdb_id\nfilm,One,Drama; War,1\nfilm,Gone,,9\n'],
      'titles.csv',
      {
        type: 'text/csv',
      },
    );

    render(<ImportSheetDialog libraryId="lib" onClose={vi.fn()} />, { wrapper: CacheScope });
    await user.upload(screen.getByLabelText(/Choose the spreadsheet/u), sheet);

    expect(await screen.findByText('Genres: Drama, War')).toBeInTheDocument();
    expect(
      screen.getByText('1 row matches no title here, so it’s passed over.'),
    ).toBeInTheDocument();
    expect(editing).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Changes 1 title' }));

    await waitFor(() => {
      expect(editing).toHaveBeenCalledWith(LEAD.id, 'title', { set: { genres: ['Drama', 'War'] } });
    });
  });
});
