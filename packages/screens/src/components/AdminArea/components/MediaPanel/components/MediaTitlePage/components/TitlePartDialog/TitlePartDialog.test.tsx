import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TitlePartDialog } from './TitlePartDialog';
import type { OpenPart } from './TitlePartDialog.types';

vi.mock(
  '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/TitleDetails',
  () => ({
    TitleDetails: ({ scope }: { scope: string }) => <span>{`The ${scope}'s fields`}</span>,
  }),
);

const EPISODE: OpenPart = {
  scope: 'episode',
  mediaId: '00000000-0000-4000-8000-000000000001',
  title: 'Pilot',
  detail: 'S01E01',
  path: '/tv/Show/S01E01.mkv',
};

describe('TitlePartDialog', () => {
  it('shows an episode’s file and fields, and moves to the next one', async () => {
    const onNext = vi.fn();

    render(<TitlePartDialog part={EPISODE} isOpen onClose={vi.fn()} onNext={onNext} />);

    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('/tv/Show/S01E01.mkv')).toBeInTheDocument();
    expect(screen.getByText("The episode's fields")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Next' }));

    expect(onNext).toHaveBeenCalled();
  });

  it('shows a season’s fields with no way to step through', () => {
    render(
      <TitlePartDialog
        part={{ ...EPISODE, scope: 'season', title: 'Season 1', detail: null, path: null }}
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("The season's fields")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitlePartDialog.displayName).toBe('TitlePartDialog');
  });
});
