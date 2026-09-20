import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestLogDialog } from './RequestLogDialog';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';

const fetchMediaRequestLog = vi.fn<typeof Requests.fetchMediaRequestLog>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequestLog: (id: string) => fetchMediaRequestLog(id),
}));

beforeEach(() => {
  fetchMediaRequestLog.mockReset().mockResolvedValue([
    { id: 2, at: '2026-09-19T12:00:05.000Z', message: 'Searched for S01E02: nothing for it.' },
    { id: 1, at: '2026-09-19T12:00:00.000Z', message: '85 episodes are out, and wanted.' },
  ]);
});

describe('RequestLogDialog', () => {
  it('shows what a request has done, newest first', async () => {
    const onClose = vi.fn();

    renderInAnAddress(<RequestLogDialog request={aMediaRequest()} onClose={onClose} />);

    const lines = await screen.findAllByRole('listitem');

    expect(lines.map((line) => line.textContent)).toEqual([
      expect.stringContaining('Searched for S01E02'),
      expect.stringContaining('85 episodes are out'),
    ]);
    expect(fetchMediaRequestLog).toHaveBeenCalledWith(aMediaRequest().id);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('says when it has done nothing yet, and when it could not be read', async () => {
    fetchMediaRequestLog.mockResolvedValueOnce([]);

    const { unmount } = renderInAnAddress(
      <RequestLogDialog request={aMediaRequest()} onClose={vi.fn()} />,
    );

    expect(await screen.findByText('Nothing yet.')).toBeInTheDocument();

    unmount();
    fetchMediaRequestLog.mockRejectedValue(new Error('gone'));
    renderInAnAddress(
      <RequestLogDialog
        request={aMediaRequest({ id: '7c9e6679-7425-40de-944b-e07fc1f90ae7' })}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
