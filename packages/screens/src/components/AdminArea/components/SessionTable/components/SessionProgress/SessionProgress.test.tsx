import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anActiveSession } from '@ValenceScreens/testing/anActiveSession';
import { aSessionPlayback } from '@ValenceScreens/testing/aSessionPlayback';
import { SessionProgress } from './SessionProgress';

afterEach(() => {
  vi.useRealTimers();
});

describe('SessionProgress', () => {
  it('says how far through a film a session is and how long it runs', () => {
    render(<SessionProgress session={anActiveSession({ playback: aSessionPlayback() })} />);

    expect(screen.getByText('1:13:02 / 2:10:26')).toBeInTheDocument();
  });

  it('moves on while the film plays', () => {
    vi.useFakeTimers();
    vi.setSystemTime(100_000);

    const playback = aSessionPlayback();

    render(
      <SessionProgress
        session={anActiveSession({
          playback: {
            ...playback,
            health: playback.health === null ? null : { ...playback.health, reportedAtMs: 100_000 },
          },
        })}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('1:13:07 / 2:10:26')).toBeInTheDocument();
  });

  it('shows a dash where nothing has said how long it runs', () => {
    render(
      <SessionProgress
        session={anActiveSession({ playback: aSessionPlayback({ health: null }) })}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
