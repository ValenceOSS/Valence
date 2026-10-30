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

  it('writes its light out in characters behind the words', async () => {
    const { container } = await renderWithRoutes(HomeHero);

    expect(container.querySelector('.bg-aurora canvas')).toBeInTheDocument();
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

  it('offers the docs and the demo from the arrow beside the way to start', async () => {
    const user = userEvent.setup();

    await renderWithRoutes(HomeHero);

    await user.click(screen.getByRole('button', { name: 'Other ways to start' }));

    expect(await screen.findByText('Read the docs')).toBeInTheDocument();
    expect(screen.getByText('Try the demo')).toBeInTheDocument();
  });

  it('offers the desktop app for this computer', async () => {
    await renderWithRoutes(HomeHero);

    expect(screen.getByRole('button', { name: /Download Desktop/u })).toBeInTheDocument();
  });

  it('takes somebody to every feature', async () => {
    const user = userEvent.setup();
    const { router } = await renderWithRoutes(HomeHero);

    await user.click(screen.getByRole('button', { name: 'See every feature' }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/features');
    });
  });

  it('shows the web app itself in a window, on the first step of the story', async () => {
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

  it('moves the story on by itself, and back round to the first step after the last', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await renderWithRoutes(HomeHero);

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^A library worth browsing\./u,
    );
    expect(screen.getByRole('img', { name: HERO_STEPS[1].alt })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^Everything on one shelf\./u,
    );
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

  it('holds the story still while the pointer rests on the window', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });

    await renderWithRoutes(HomeHero);
    await user.hover(screen.getByRole('img', { name: HERO_STEPS[0].alt }));

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(screen.getByRole('button', { pressed: true })).toHaveAccessibleName(
      /^Everything on one shelf\./u,
    );
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
  });

  it('sets a display name so devtools can identify it', () => {
    expect(HomeHero.displayName).toBe('HomeHero');
  });
});
