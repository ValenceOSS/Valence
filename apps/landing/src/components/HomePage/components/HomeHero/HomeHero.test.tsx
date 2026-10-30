import { act, screen, waitFor } from '@testing-library/react';
import { MotionConfig } from 'motion/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithRoutes } from '@ValenceLanding/testing/renderWithRoutes';
import { CHANGELOG } from '@ValenceLanding/content/changelog/CHANGELOG';
import { HERO_STEPS } from './HERO_STEPS';
import { HomeHero } from './HomeHero';

const StillHomeHero = () => (
  <MotionConfig reducedMotion="always">
    <HomeHero />
  </MotionConfig>
);

StillHomeHero.displayName = 'StillHomeHero';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.getElementById('download')?.remove();
});

describe('HomeHero', () => {
  it('says what Valence is in one line', async () => {
    await renderWithRoutes(HomeHero);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Your films, shows, music and books, on your own server.',
      }),
    ).toBeInTheDocument();
  });

  it('says it is free, open source and yours beneath the heading', async () => {
    await renderWithRoutes(HomeHero);

    expect(screen.getByText(/Free, open source, and yours\./u)).toBeInTheDocument();
  });

  it('leads to the newest release', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRoutes(HomeHero);
    const newest = CHANGELOG[0];

    await user.click(
      screen.getByRole('link', { name: new RegExp(`New ${newest?.version ?? ''}`, 'u') }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/changelog/${newest?.slug ?? ''}`);
    });
  });

  it('takes somebody getting started down to the downloads', async () => {
    const downloads = document.createElement('section');
    const scrollIntoView = vi.fn();

    downloads.id = 'download';
    downloads.scrollIntoView = scrollIntoView;
    document.body.append(downloads);

    const user = userEvent.setup();

    await renderWithRoutes(HomeHero);

    await user.click(screen.getByRole('button', { name: 'Get started' }));

    expect(scrollIntoView).toHaveBeenCalledOnce();
  });

  it('offers the demo beside the way to start', async () => {
    await renderWithRoutes(HomeHero);

    expect(screen.getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();
  });

  it('puts the first step of the story on the television', async () => {
    await renderWithRoutes(HomeHero);

    const shown = screen.getByRole('img', {
      name: "The Valence web app's home page, with a film in the featured row",
    });

    expect(shown).toHaveAttribute('src', '/tour/home.jpg');
    expect(shown.getAttribute('srcset')).toContain('/tour/home-1600.webp 1600w');
    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^Everything on one shelf\./u,
    );
  });

  it('names every step of the story by what it says', async () => {
    await renderWithRoutes(HomeHero);

    for (const step of HERO_STEPS) {
      expect(
        screen.getByRole('button', { name: `${step.title} ${step.detail}` }),
      ).toBeInTheDocument();
    }
  });

  it('moves the story on by itself after a few seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderWithRoutes(HomeHero);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^A library worth browsing\./u,
    );
    expect(screen.getByRole('img', { name: HERO_STEPS[1].alt })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('jumps to a step when it is pressed', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(HomeHero);
    await user.click(screen.getByRole('button', { name: /^Read and listen too\./u }));

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^Read and listen too\./u,
    );
    expect(screen.getByRole('img', { name: HERO_STEPS[2].alt })).toBeInTheDocument();
  });

  it('holds the story still, every step in view, for whoever asked for stillness', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderWithRoutes(StillHomeHero);

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^Everything on one shelf\./u,
    );
    for (const step of HERO_STEPS) {
      expect(screen.getByText(step.title)).toBeVisible();
    }
    vi.useRealTimers();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomeHero.displayName).toBe('HomeHero');
  });
});
