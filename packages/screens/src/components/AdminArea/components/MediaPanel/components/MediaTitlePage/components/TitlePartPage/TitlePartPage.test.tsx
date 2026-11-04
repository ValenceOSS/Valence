import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { TitlePartPage } from './TitlePartPage';
import type { ComponentProps } from 'react';

const drawn = (change: Partial<ComponentProps<typeof TitlePartPage>> = {}) => {
  const onTrail = vi.fn();
  const onTab = vi.fn();
  const onPrevious = vi.fn();
  const onNext = vi.fn();

  render(
    <TitlePartPage
      scope="episode"
      mediaId="e2"
      name="The Second"
      aside="S01E02"
      imageUrl={null}
      trail={[
        { id: 'media', label: 'Media' },
        { id: 'show', label: 'A Show' },
        { id: 'season', label: 'Season 1' },
        { id: 'here', label: 'The Second' },
      ]}
      onTrail={onTrail}
      badges={<span>1080p</span>}
      facts={[{ label: 'Show', value: 'A Show' }]}
      actions={null}
      tab="files"
      onTab={onTab}
      filesLabel="File"
      files={<span>The file</span>}
      onPrevious={onPrevious}
      onNext={onNext}
      {...change}
    />,
    { wrapper: CacheScope },
  );

  return { onTrail, onTab, onPrevious, onNext };
};

describe('TitlePartPage', () => {
  it('names the episode in large type with its number, and shows the tab asked for', () => {
    drawn();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('The SecondS01E02');
    expect(screen.getByText('1080p')).toBeInTheDocument();
    expect(screen.getByText('The file')).toBeInTheDocument();
  });

  it('goes back up the trail to the step pressed', async () => {
    const { onTrail } = drawn();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Season 1' }));

    expect(onTrail).toHaveBeenCalledWith('season');
  });

  it('says which tab was chosen', async () => {
    const { onTab } = drawn();

    await userEvent.setup().click(screen.getByRole('tab', { name: 'History' }));

    expect(onTab).toHaveBeenCalledWith('history');
  });

  it('steps to the one before and after it, by button and by J and K', async () => {
    const { onPrevious, onNext } = drawn();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /^Next/u }));
    await user.keyboard('k');

    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrevious).toHaveBeenCalledTimes(1);
  });

  it('offers no stepping where there is nothing either side', () => {
    drawn({ onPrevious: undefined, onNext: undefined });

    expect(screen.queryByRole('button', { name: /^Next/u })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitlePartPage.displayName).toBe('TitlePartPage');
  });
});
