import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { TitleProgress } from './TitleProgress';

describe('TitleProgress', () => {
  it('counts where everything a request waits for stands', () => {
    render(
      <TitleProgress
        request={aMediaRequest({
          kind: 'series',
          items: [
            aRequestItem({ id: 'a', state: 'available' }),
            aRequestItem({ id: 'b', episode: 2, state: 'available' }),
            aRequestItem({ id: 'c', episode: 3, state: 'downloading' }),
            aRequestItem({ id: 'd', episode: 4, state: 'failed' }),
          ],
        })}
        downloads={[]}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: 'Where everything stands' })).toBeInTheDocument();
    expect(screen.getByText('In the library').parentElement).toHaveTextContent('2In the library');
    expect(screen.getByText('Failed').parentElement).toHaveTextContent('1Failed');
    expect(screen.queryByText('Missing')).not.toBeInTheDocument();
  });

  it('lists each download with a way to stop it', () => {
    render(
      <TitleProgress
        request={aMediaRequest({
          items: [aRequestItem({ state: 'downloading', downloadId: 'd1' })],
        })}
        downloads={[
          {
            downloadId: 'd1',
            releaseTitle: 'Film.2021.1080p',
            items: [aRequestItem({ state: 'downloading', downloadId: 'd1' })],
            queued: null,
          },
        ]}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByText('Film.2021.1080p')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop download…' })).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(TitleProgress.displayName).toBe('TitleProgress');
  });
});
