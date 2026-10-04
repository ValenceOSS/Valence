import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { LeftOutList } from './LeftOutList';

const fetchLeftOutMock = vi.hoisted(() => vi.fn());
const bringBackMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLeftOut', () => ({ fetchLeftOut: fetchLeftOutMock }));
vi.mock('@ValenceClient/library/bringBack', () => ({ bringBack: bringBackMock }));

const LEFT = {
  id: 'left-1',
  libraryId: 'library-1',
  path: '/media/films/Broken (2019)/Broken.mkv',
  isFolder: false,
  note: 'Stutters',
  createdAt: '2026-10-03T12:00:00.000Z',
  createdBy: null,
};

const draw = () => {
  render(<LeftOutList libraryId="library-1" libraryPath="/media/films" />, {
    wrapper: CacheScope,
  });
};

beforeEach(() => {
  fetchLeftOutMock.mockReset();
  bringBackMock.mockReset();
});

describe('LeftOutList', () => {
  it('lists what is left out from inside the library, with why', async () => {
    fetchLeftOutMock.mockResolvedValue([
      LEFT,
      { ...LEFT, id: 'left-2', path: '/media/films/Extras', isFolder: true, note: null },
    ]);
    draw();

    expect(await screen.findByText('Broken (2019)/Broken.mkv')).toBeInTheDocument();
    expect(screen.getByText('Stutters')).toBeInTheDocument();
    expect(screen.getByText('Extras')).toBeInTheDocument();
    expect(screen.getByText('Folder')).toBeInTheDocument();
  });

  it('brings one back when asked, and reads the list again', async () => {
    const user = userEvent.setup();

    fetchLeftOutMock.mockResolvedValueOnce([LEFT]).mockResolvedValue([]);
    bringBackMock.mockResolvedValue({ leftOut: LEFT, jobId: null });
    draw();

    await user.click(
      await screen.findByRole('button', { name: 'Include Broken (2019)/Broken.mkv again' }),
    );

    expect(bringBackMock).toHaveBeenCalledWith('library-1', 'left-1');
    await waitFor(() => {
      expect(screen.getByText(/Nothing is excluded/)).toBeInTheDocument();
    });
  });

  it('says nothing is left out, and where to leave something out from', async () => {
    fetchLeftOutMock.mockResolvedValue([]);
    draw();

    expect(await screen.findByText(/Exclude a file or folder from Media or Files/)).toBeVisible();
  });

  it('says the list could not be read rather than that it is empty', async () => {
    fetchLeftOutMock.mockRejectedValue(new Error('offline'));
    draw();

    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(LeftOutList.displayName).toBe('LeftOutList');
  });
});
