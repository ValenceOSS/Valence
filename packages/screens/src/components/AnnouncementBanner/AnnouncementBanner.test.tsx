import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Announcement } from '@ValenceContracts/schemas/Announcement';
import { AnnouncementBanner } from './AnnouncementBanner';

const dismiss = vi.hoisted(() => vi.fn());
const shown = vi.hoisted((): { current: Announcement | null } => ({ current: null }));

vi.mock('@ValenceClient/announcements/useAnnouncement', () => ({
  useAnnouncement: () => ({ announcement: shown.current, dismiss }),
}));

beforeEach(() => {
  dismiss.mockClear();
  shown.current = {
    id: 'a',
    text: 'Down for an update at ten',
    severity: 'warning',
    endsAt: null,
    postedAt: '2026-10-15T09:00:00.000Z',
  };
});

describe('AnnouncementBanner', () => {
  it('holds the announcement over the page, as a warning where it is one', () => {
    render(<AnnouncementBanner />);

    expect(screen.getByText('Down for an update at ten')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Announcement');
  });

  it('puts it away when dismissed', async () => {
    render(<AnnouncementBanner />);

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(dismiss).toHaveBeenCalled();
  });

  it('draws nothing where there is no announcement', () => {
    shown.current = null;

    render(<AnnouncementBanner />);

    expect(screen.queryByText('Announcement')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AnnouncementBanner.displayName).toBe('AnnouncementBanner');
  });
});
