import { render, userEvent } from '@testing-library/react-native';
import { AnAnnouncement } from './AnAnnouncement';

const announcement = {
  id: 'a',
  text: 'Down for an update at ten',
  severity: 'warning' as const,
  endsAt: null,
  postedAt: '2026-10-15T09:00:00.000Z',
};

const mockDismiss = jest.fn();
let mockShown: typeof announcement | null = announcement;

jest.mock('@ValenceClient/announcements/useAnnouncement', () => ({
  useAnnouncement: () => ({ announcement: mockShown, dismiss: mockDismiss }),
}));

beforeEach(() => {
  mockShown = announcement;
  mockDismiss.mockClear();
});

describe('AnAnnouncement', () => {
  it('holds the announcement up, and puts it away when dismissed', async () => {
    const drawn = await render(<AnAnnouncement />);

    expect(drawn.getByText('Down for an update at ten')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Dismiss'));

    expect(mockDismiss).toHaveBeenCalled();
  });

  it('draws nothing where there is no announcement', async () => {
    mockShown = null;

    const drawn = await render(<AnAnnouncement />);

    expect(drawn.queryByText('Down for an update at ten')).toBeNull();
  });
});
