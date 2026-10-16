import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { fetchAnnouncement } from '@ValenceClient/announcements/fetchAnnouncement';
import { postAnnouncement } from '@ValenceClient/announcements/postAnnouncement';
import { AnnouncementCard } from './AnnouncementCard';

vi.mock('@ValenceClient/announcements/fetchAnnouncement', () => ({ fetchAnnouncement: vi.fn() }));
vi.mock('@ValenceClient/announcements/postAnnouncement', () => ({ postAnnouncement: vi.fn() }));

beforeEach(() => {
  vi.mocked(fetchAnnouncement).mockResolvedValue(null);
  vi.mocked(postAnnouncement).mockReset().mockResolvedValue(true);
});

describe('AnnouncementCard', () => {
  it('posts what was written, as serious as chosen, for as long as chosen', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AnnouncementCard />);

    await user.type(screen.getByRole('textbox', { name: 'What it says' }), 'Back at six');
    await user.click(screen.getByRole('button', { name: 'Urgent' }));
    await user.click(screen.getByRole('button', { name: 'Post it' }));

    expect(postAnnouncement).toHaveBeenCalledWith({
      text: 'Back at six',
      severity: 'critical',
      endsAt: null,
    });
  });

  it('sets an end where it is to stay up for a while', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AnnouncementCard />);

    await user.type(screen.getByRole('textbox', { name: 'What it says' }), 'Back at six');
    await user.click(screen.getByRole('button', { name: 'An hour' }));
    await user.click(screen.getByRole('button', { name: 'Post it' }));

    const [draft] = vi.mocked(postAnnouncement).mock.calls[0] ?? [];

    expect(draft?.endsAt).not.toBeNull();
  });

  it('will not post nothing', () => {
    renderInAnAddress(<AnnouncementCard />);

    expect(screen.getByRole('button', { name: 'Post it' })).toBeDisabled();
  });

  it('shows the announcement up now, and takes it down', async () => {
    vi.mocked(fetchAnnouncement).mockResolvedValue({
      id: 'a',
      text: 'Down for an update',
      severity: 'info',
      endsAt: null,
      postedAt: '2026-10-15T09:00:00.000Z',
    });
    const user = userEvent.setup();

    renderInAnAddress(<AnnouncementCard />);

    expect(await screen.findByText('Down for an update')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Take it down' }));

    await waitFor(() => {
      expect(postAnnouncement).toHaveBeenCalledWith(null);
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnnouncementCard.displayName).toBe('AnnouncementCard');
  });
});
